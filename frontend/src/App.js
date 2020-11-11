import logo from './logo.svg';
import './App.css';
import chroma from 'chroma-js';
import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import Search from './components/Search';
import { render } from 'react-dom';

import GLOBAL from './global.js'

//import buttonStyles from './components/Search.module.css';

//const mapContainer = useRef(null);
//const mapContainer = React.createRef();

export default class App extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
    mapContainer: React.createRef(),
    startDate: new Date("2020/01/01"),
    currDate: new Date(),
    endDate: new Date(),
    aMap: undefined
    };

    this.setEndDate = this.setEndDate.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);

    GLOBAL.myScope = this;
  }
  //let mapContainer = useRef('map');
  //let mapContainer = React.createRef();
  //let allMaps = [];

  // const [startDate, setStartDate] = useState(new Date("2020/01/01"));
  // const [currDate, setCurrDate] = useState(new Date());
  // const [endDate, setEndDate] = useState(new Date());

  //mapboxgl.accessToken = "";
  //useEffect(() => {
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

    let day = this.state.endDate.getDate(); let month = this.state.endDate.getMonth(); let year = this.state.endDate.getFullYear();
    let searchDate = year + "-" + month + "-" + day;
    console.log(searchDate);
    console.log(this.state.endDate);

    map.on("load", function() {
      // Hide watermark from the free version of OpenMapTiles
      map.setPaintProperty('omt_watermark', 'text-color', 'rgba(0,0,0,0)');
      map.setPaintProperty('omt_watermark', 'text-halo-color', 'rgba(0,0,0,0)');

      let matchExpression = ['match', ['get', 'GEOID']];

      //let day = this.state.endDate.getDate(), month = this.state.endDate.getMonth(), year = this.state.endDate.getFullYear();
      //let searchDate = year + "-" + month + "-" + day;
      //console.log(this.state.startDate);

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
      //debug
      // map.remove();
    });

    this.setState({aMap: map});
    //GLOBAL.myScope.setState({myMap: map});
  }
    //endDate.onChange = map.remove();
  //}, [endDate]);

  componentDidUpdate() {if (this.state.aMap === undefined) {this.componentDidMount();}}

  setEndDate(e, callback) {
    this.setState({endDate: e});
    //console.log(something);
    //console.log(crap); 
    //map.remove();
    callback();
  }

  handleDateChange(e) {

    //this.setState({endDate: e});

    // Remove the map through global state
    try{
      this.state.aMap.remove();
      //this.setState({aMap: undefined});
      //GLOBAL.myScope.state.myMap.remove();
      //GLOBAL.myScope.setState({myMap: undefined});
    }
    catch{
      // Debug
      console.log("Error: Map not removed (most likely there is no map available to remove)");
      //this.setState({aMap: undefined});
      //GLOBAL.myScope.setState({myMap: undefined});
    }

    // Make sure componentDidMount is only called after endDate is changed
    this.setState({aMap: undefined, endDate: e});
    //this.setEndDate(e, () => {this.componentDidMount();});
    //this.componentDidMount();
  }

  render() {

  return (
    <div className="container">
      
        <h1 className="title">
          COVID-19 Prison Map
        </h1>
        <p>The web server is working.</p>
        <div ref={this.state.mapContainer} className='mapContainer'></div>
        {/* <div ref={el => mapContainer = el} className='mapContainer'></div> */}
        {/* <div ref='map' className='mapContainer'></div> */}
        {/* <div id='map' className='mapContainer'></div> */}
        {/* <UpdateMap
          selected={endDate}
          onChange={(date) => {setEndDate(date);}}
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          maxDate={currDate}
        /> */}
        {/* <UpdateMap/> */}

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
            selected={this.state.endDate}
            onChange={(date) => {this.handleDateChange(date); console.log(date);}}
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
//export default App;