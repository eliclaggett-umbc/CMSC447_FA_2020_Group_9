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
