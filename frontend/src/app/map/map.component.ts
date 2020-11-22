import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { DataService, GeoObj, Properties } from '../services/data.service';
import { environment } from 'src/environments/environment';


class Icon extends L.Icon<L.IconOptions>{
  iconSize = [30, 30]
  popupAnchor = [-10, -30]

  constructor(tag: string) {
    super({ iconUrl: environment.server + '/glyphs/' + tag, className: "zoom-icon" });
  }
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  private map!: L.Map;
  private amenitiesLayer: L.LayerGroup<any> = L.layerGroup();

  // tslint:disable-next-line: variable-name
  private amenities: GeoObj[] = [];

  constructor(dataService: DataService) {
    dataService.amenities.subscribe(value => {
      this.amenities = value;
      this.updateAmenitiesLayer();
    });
  }

  private updateAmenitiesLayer(): void {
    if (!this.map) {
      return;
    }

    // remove old amenities
    this.map.removeLayer(this.amenitiesLayer);

    // @ts-ignore
    this.amenitiesLayer = L.geoJSON({ "type": "FeatureCollection", features: this.amenities }, {
      pointToLayer: function (_feature, latLng) {
        return L.marker(latLng);
      },
      onEachFeature: (feature: GeoObj, layer) => {

        if (feature.geometry.type === 'Polygon' && feature.properties.icon) {
          let center: L.LatLngExpression;
          if (feature.properties.center) {
            center = feature.properties.center;
          } else {
            // @ts-ignore
            const bounds = layer.getBounds(); // Get bounds of polygon
            center = bounds.getCenter(); // Get center of bounds
          }

          // Use center to put marker on map
          const icon = new Icon(feature.properties.icon);
          L.marker(center, { icon }).setPopupContent(feature.properties.name).addTo(this.map);
        }
      }
    });

    // this.amenitiesLayer.addTo(this.map);
    this.map.addLayer(this.amenitiesLayer);

    this.map.on("zoomend", () => {
      const newZoom = (6 * this.map.getZoom() ** 2) + 'px';
      document.documentElement.style.setProperty("--zoom-image-size", newZoom);
    })
  }

  /**
   * Often divs and other HTML element are not available in the constructor. Thus we use onInit()
   */
  ngOnInit(): void {
    // some settings for a nice shadows, etc.
    const iconRetinaUrl = './assets/marker-icon-2x.png';
    const iconUrl = './assets/marker-icon.png';
    const shadowUrl = './assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;

    // basic setup, create a map in the div with the id "map"
    this.map = L.map('map').setView([47.66, 9.175], 2);

    // set a tilelayer, e.g. a world map in the background
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  /**
   * Add a marker at the specified position to the map.
   * If a name is provided, also include a popup when marker is clicked.
   */
  public addMarker(latitude: number, longitude: number, name?: string): void {
    const marker = L.marker([latitude, longitude]);

    if (name) {
      marker.bindPopup(name);
    }

    marker.addTo(this.map);
  }
}