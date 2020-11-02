import Head from 'next/head';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import style from '../Home.module.css';
import Search from './components/Search';

//import buttonStyles from './components/Search.module.css';

export default function Home() {
  
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'http://localhost:8080/styles/positron/style.json'
    });

    map.on("load", function() {
      
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
      <Head>
        <title>COVID-19 Prison Map</title>
        <link rel="icon" href="/favicon.ico" />
        <style>{'body { background-color: rgb(250,250,250); }'}</style>
      </Head>

      <main >
        <h1 className="title">
          COVID-19 Prison Map
        </h1>
        <p>The web server is working.</p>
        <div ref={mapContainer} className={style.mapContainer}></div>

        <Search/>
      </main>
    </div>
  )
}
