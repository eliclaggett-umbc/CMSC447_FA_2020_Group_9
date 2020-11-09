import logo from './logo.svg';
import './App.css';
import chroma from 'chroma-js';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import Search from './components/Search';
//import ChangeMap from './components/ChangeMap';

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

      let matchExpression = ['match', ['get', 'GEOID']];

      fetch('http://localhost:8082/api/counties?sum=true')
      .then(res => res.json())
      .then((result) => {
        let values = [];
        for (const row of result) {
          values.push(parseInt(row['sum_deaths']));
        }

        let colorScale = chroma.scale(['rgba(255,255,255,0)', 'rgba(255,255,0,0.1)', 'rgba(255,195,0,0.3)', 'rgba(199,0,57,0.7)', 'rgba(144,12,63,0.9)']).domain(chroma.limits(values, 'q', 5));

        for (const row of result) {
          
          var color = colorScale(parseInt(row['sum_deaths'])).rgba();
          let colorString = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + color[3] + ')';
          matchExpression.push(row['fips'].toString().padStart(5, '0'), colorString);
        }
        
        matchExpression.push('blue');

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
            "fill-opacity": 1,
            "fill-color": matchExpression
          }
        });


        map.addSource('points', {
          type: "geojson",
          data: 'http://localhost:8082/geojson/prisons'
        });
        map.addLayer({
          'id': 'pointLayer',
          'type': 'circle',
          'source': 'points',
          'paint': {
            'circle-radius': 4,
            'circle-color': 'rgba(255,0,0,0.5)'
            }
          });
      });
    });

    map.on("click", "counties", function(e) {
      // TODO: Remove this, just for debugging
      
      let coordinates = e.features[0].geometry.coordinates[0];

      var bounds = coordinates.reduce(function (bounds, coord) {
        return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.fitBounds(bounds, { padding: 20 });
    });

    return () => {
      
    }
  }, []);

  const [startDate, setStartDate] = useState(new Date("2020/01/01"));
  const [currDate, setCurrDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  return (
    <div className="container">
      
        <h1 className="title">
          COVID-19 Prison Map
        </h1>
        <p>The web server is working.</p>
        <div ref={mapContainer} className='mapContainer'></div>

        {/* <ChangeMap
          map={map}
          bounds={bounds}
          selected={endDate}
          onChange={date => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          maxDate={currDate}
        /> */}

        <div className="container">
          <p>
            View COVID-19 Deaths or Cases
          </p>
          <button>View by Deaths</button>
          <button>View by Cases</button>
          <p>
            Date of Accumulated COVID-19 Deaths
          </p>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={currDate}
          />
        </div>

        <Search/>

    </div>
  )
}

export default App;