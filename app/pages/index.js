import Head from 'next/head';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import style from '../Home.module.css';

export default function Home() {
  
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'http://localhost:8080/styles/positron/style.json'
    });
    return () => {
      
    }
  }, []);

  return (
    <div className="container">
      <Head>
        <title>COVID-19 Prison Map</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          COVID-19 Prison Map
        </h1>
        <p>The web server is working.</p>
        <div ref={mapContainer} className={style.mapContainer}></div>
      </main>
    </div>
  )
}
