import logo from './logo.svg';
import './App.css';
import chroma from 'chroma-js';
import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import Search from './components/Search';
import { render } from 'react-dom';


async function calculateCountyColorsForDate(date, covidType) {
  let day = date.getDate(); let month = date.getMonth() + 1; let year = date.getFullYear();
  let searchDate = year + "-" + month + "-" + day;
  
  let matchExpression = ['match', ['get', 'GEOID']];

  // Add date to string
  let toFetch = 'http://localhost:8082/api/counties?sum=true&date=' + searchDate + '';
  
  try {
    let res = await fetch(toFetch);
    let result = await res.json();
    let values = [];

    try { // Prevent program from crashing if fetch doesn't return anything
      for (const row of result) {
        values.push(parseInt(row[covidType]));
      }
    } catch(e) {
      console.log("Fetcher returned no data");
      return;
    }

    let colorScale = chroma.scale(['rgba(255,255,255,0)', 'rgba(255,255,0,0.1)', 'rgba(255,195,0,0.3)', 'rgba(199,0,57,0.7)', 'rgba(144,12,63,0.9)']).domain(chroma.limits(values, 'q', 5));

    for (const row of result) {
      
      var color = colorScale(parseInt(row[covidType])).rgba();
      let colorString = 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', ' + color[3] + ')';
      matchExpression.push(row['fips'].toString().padStart(5, '0'), colorString);
    }
    if (matchExpression.length == 2) {
      matchExpression.push(0, 'transparent');
    }
    matchExpression.push('transparent');
    return matchExpression;
  }
  catch(err) {
    console.log('Error getting retrieving county COVID data for date: ' + date);
    console.log(err);
    matchExpression.push(0, 'transparent');
    matchExpression.push('transparent');
    return matchExpression;
  };
}

export default class App extends React.Component {
  // Initialize state and props, bind functions
  constructor(props) {
    super(props);
    this.state = {
    mapContainer: React.createRef(),
    startDate: new Date("2020/01/01"),
    currDate: new Date(),
    endDate: new Date(),
    covidType: 'sum_deaths',
    covidButtonText: "View COVID-19 Statistics by Cases",
    aMap: undefined
    };

    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleCovidTypeChange = this.handleCovidTypeChange.bind(this);
  }

  // Make sure the container is available before using it for a map
  componentDidMount() {
    // Fix visual glitch from OpenMapTiles not showing anything for tiles that weren't downloaded
    const bounds = [
      -125.3321,
      23.8991,
      -65.7421,
      49.4325
    ];

    const map = new mapboxgl.Map({
      container: this.state.mapContainer.current,
      style: 'http://localhost:8080/styles/positron/style.json',
      maxBounds: bounds
    });
    let endDate = this.state.endDate;
    let covidType = this.state.covidType;
    map.on("load", function() {
      // Hide watermark from the free version of OpenMapTiles
      map.setPaintProperty('omt_watermark', 'text-color', 'rgba(0,0,0,0)');
      map.setPaintProperty('omt_watermark', 'text-halo-color', 'rgba(0,0,0,0)');
      
      calculateCountyColorsForDate(endDate, covidType).then( (countyColors) => {

        if (map.getLayer("counties")) {map.removeLayer("counties");}
        if (map.getLayer("pointLayer")) {map.removeLayer("pointLayer");}

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
            "fill-color": countyColors
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

    this.setState({aMap: map});
  }

  // Only explicitly call to create a new map if the map has been removed
  componentDidUpdate() {if (this.state.aMap === undefined) {this.componentDidMount();}}

  handleCovidTypeChange = () => {
    // Change state to display updated info
    let nextCovidType = (this.state.covidType === 'sum_deaths') ? 'sum_cases' : 'sum_deaths';
    let nextCovidButtonText = (this.state.covidType === 'sum_deaths') ? "View COVID-19 Statistics by Deaths" : "View COVID-19 Statistics by Cases";
    
    this.setState({covidType: nextCovidType, covidButtonText: nextCovidButtonText});

    calculateCountyColorsForDate(this.state.endDate, this.state.covidType).then( (countyColors) => {
      this.state.aMap.setPaintProperty('counties', 'fill-color', countyColors);
    });
  }

  handleDateChange = (date) => {
    this.setState({endDate: date});

    calculateCountyColorsForDate(date, this.state.covidType).then( (countyColors) => {
      this.state.aMap.setPaintProperty('counties', 'fill-color', countyColors);
    });
  }

  render() {

  return (
    <div className="container">
      
        <h1 className="title">
          COVID-19 Prison Map
        </h1>
        <p>The web server is working.</p>
        <div ref={this.state.mapContainer} className='mapContainer'></div>

        <div className="container">
          <p>
            Toggle COVID-19 Data Type
          </p>
          <button onClick={() => {this.handleCovidTypeChange();}}>
            {this.state.covidButtonText}
          </button>
          <p>
            Date of Accumulated COVID-19 Information
          </p>
          <DatePicker
            selected={this.state.endDate}
            onChange={(date) => {this.handleDateChange(date);}}
            selectsEnd
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            minDate={this.state.startDate}
            maxDate={this.state.currDate}
          />
        </div>

        <Search/>

    </div>
  )
}
}
