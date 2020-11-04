import logo from './logo.svg';
import './App.css';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

import Search from './components/Search';

//import buttonStyles from './components/Search.module.css';

function App() {
  
  const mapContainer = useRef(null);

  useEffect(() => {

    // Fix visual glitch from OpenMapTiles not showing anything for tiles that weren't downloaded
    const bounds = [
      -125.3321,
      23.8991,
      -65.7421,
      49.4325
    ];
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'http://localhost:8080/styles/positron/style.json',
      maxBounds: bounds
    });

    map.on("load", function() {
      // Hide watermark from the free version of OpenMapTiles
      map.setPaintProperty('omt_watermark', 'text-color', 'rgba(0,0,0,0)');
      map.setPaintProperty('omt_watermark', 'text-halo-color', 'rgba(0,0,0,0)');
      // Load county boundaries
      // TODO: Make this look better
      map.addLayer({
        id: "counties",
        type: "fill",
        source: {
          type: "vector",
          tiles: [
            "https://gis-server.data.census.gov/arcgis/rest/services/Hosted/VT_2017_050_00_PY_D1/VectorTileServer/tile/{z}/{y}/{x}.pbf"
          ]
        },
        "source-layer": "County",
        paint: {
          "fill-opacity": 0.6,
          "fill-color": "blue"
        }
      });
    });

    map.on("click", "counties", function(e) {
      // TODO: Remove this, just for debugging
      console.log(e.features);
      let coordinates = e.features[0].geometry.coordinates[0];

      var bounds = coordinates.reduce(function (bounds, coord) {
        return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.fitBounds(bounds, { padding: 20 });
    });

    return () => {
      
    }
  }, []);

  return (
    <div className="container">
      
        <h1 className="title">
          COVID-19 Prison Map
        </h1>
        <p>The web server is working.</p>
        <div ref={mapContainer} className='mapContainer'></div>

        <Search/>

    </div>
  )
}

export default App;