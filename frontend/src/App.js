import logo from './logo.svg';
import './App.css';
import chroma from 'chroma-js';
import mapboxgl, { LngLat } from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import Search from './components/Search';

mapboxgl.accessToken ='pk.eyJ1IjoiaGl3aWhhcmFyIiwiYSI6ImNraDJ6b2k4MTB0eWQyeXJ4NDcycWpodmUifQ.bxEz-zu7gz8jhCQLybK5bw';


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
        values.push(parseInt(row[covidType])); // populate values[] with covidType data
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
    console.log(matchExpression);
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

async function fetchCovidData(searchBy, queryParams, filters) {

//'prisons', {'name': name}, {'date': date, 'sum': true})

  if(filters['date']) {

    let day = filters['date'] ? filters['date'].getDate() : ''; let month = filters['date'].getMonth() + 1; let year = filters['date'].getFullYear();
    filters['date'] = year + "-" + month + "-" + day;
  }

  let routeHeader = 'http://localhost:8082';

  let routeString = `/api/` + (searchBy ? `${searchBy}` : '') + '';

  let queryString = '';
  Object.keys(queryParams).forEach(key => {queryString += `/${key}/${queryParams[key]}`});

  let filterString = filters ? '?' : '';
  Object.keys(filters).forEach( key => {
    filterString += filterString.length == 1 ? `${key}=${filters[key]}` : `&${key}=${filters[key]}`
  });

  let toFetch = routeHeader + routeString + queryString + filterString;

  console.log(toFetch);
  // add geoid in later
  //let toFetch = `http://localhost:8082/api/` + searchBy ? `${searchBy}/`  ${counties}/fips/${GEOID}?sum=true&date=` + searchDate + '';

  try {
    let res = await fetch(toFetch);
    let result = await res.json();
    //console.log(result);
    return result;
   
  }

  catch(err) {
    console.log(`Error retrieving ${searchBy} COVID data`);
    console.log(err);
    return null;
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
    aMap: undefined,
    selectedCounty: undefined,
    selectedPrison: undefined,
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
      style: 'mapbox://styles/hiwiharar/cki4zzouj6lxe1aqrwwj4cl35',
      maxBounds: bounds
    });

    let endDate = this.state.endDate;
    let covidType = this.state.covidType;
    map.on("load", function() {
      // Hide watermark from the free version of OpenMapTiles
      map.setPaintProperty('omt_watermark', 'text-color', 'rgba(0,0,0,0)');
      map.setPaintProperty('omt_watermark', 'text-halo-color', 'rgba(0,0,0,0)');
      
      calculateCountyColorsForDate(endDate, covidType).then( (countyColors) => {

        console.log(countyColors);

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

    function handlePopup(type, location, date, data) {

      var rows = [];

      if (type == 'counties') {

            var county = data[0].name ? data[0].name : '';
            var state = data[0].state ? data[0].state : '';
            var cases = data[0].sum_cases ? data[0].sum_cases : '';
            var deaths = data[0].sum_deaths ? data[0].sum_deaths : '';
  
           
            rows.push(county + (county ? ', ' : '') + state);
            rows.push(cases ? `cases:  ${cases}` : '');
            rows.push(deaths ? `deaths: ${deaths}` : '');
      }

      if(type == 'prisons') {
            var name = data[0].name ? data[0].name : '';
            var county = data[0].state ? data[0].state : '';
            var prisoner_cases = data[0].sum_prisoner_cases ? data[0].sum_prisoner_cases : '';
            var staff_cases = data[0].sum_staff_cases ? data[0].sum_staff_cases : '';
            var prisoner_deaths = data[0].sum_prisoner_deaths ? data[0].sum_prisoner_deaths : '';
            var staff_deaths = data[0].sum_staff_deaths ? data[0].sum_staff_deaths : '';
  
           
            rows.push(name + (name ? ', ' : '') + county);
            rows.push(prisoner_cases ? `prisoner cases:  ${prisoner_cases}` : '');
            rows.push(staff_cases ? `staff cases:  ${staff_cases}` : '');
            rows.push(prisoner_deaths ? `prisoner deaths: ${prisoner_deaths}` : '');
            rows.push(staff_deaths ? `staff deaths: ${staff_deaths}` : '');
      }

          // create rows for popup
          console.log('loc', location);
          generatePopup(rows, location);
    }

    // create a popup on the map.
    function generatePopup(rows, location){

      var popupHTML = '';

      rows.forEach(elem  => popupHTML += `<div>${elem}<\div>`);

      var popup = new mapboxgl.Popup({offset: [0, -700]})
      .setLngLat(location)
      .setHTML(popupHTML)
      .addTo(map);
    }



  
    // perform prison click, fetch covid data, and display popup
    async function handlePrisonClick(GEOID, features, LngLatBounds, date) {

      
      // get geoid of selected county
      var name = features[0].properties['title'];

      var values = [['prison', 'county'], 'cases', 'deaths'];

      // (searchby, queryparams, routeparams)
      var result = await fetchCovidData('prisons', {'fips': GEOID, 'name': name}, {'date': date, 'sum': true}).then( (result) => {
        handlePopup('prisons', LngLatBounds.getCenter(), date, result);
      })

      return result;
    }



    map.on("click", "counties", (e) => {
     
      // TODO: Remove this, just for debugging
      
      let coordinates = e.features[0].geometry.coordinates[0];

      // get geoid of selected county
      var GEOID = e.features[0].properties['GEOID'];

      var LngLatBounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);

      var bounds = coordinates.reduce(function (bounds, coord) {
        return bounds.extend(coord);
        }, LngLatBounds);

        map.fitBounds(bounds, { padding: 20 });


      // if clicking on prison, display prison, not county data
      var features = map.queryRenderedFeatures(e.point, { layers: ['pointLayer'] });
      if (features.length) {
        
          handlePrisonClick(GEOID, features, LngLatBounds, this.state.endDate, {'sum': true}).then((result) => {

            this.setState({selectedPrison: result});
            
          });


          
          // display county data
      } else {

        var values = [['county', 'state'], 'cases', 'deaths'];
  
        // (searchby, queryparams, routeparams)
        fetchCovidData('counties', {'fips': GEOID}, {'date': this.state.endDate, 'sum': true}).then( (result) => {
            
          
          this.setState({selectedCounty: result});
  
          handlePopup(e, 'counties', LngLatBounds.getCenter(), this.state.endDate, result);
          
          
        });
      }

       // console.log(e.features);


        
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
              <div className="app-header">
                <div className="app-title">
                  <h1 className="title">COVID-19 Prison Map</h1>
                </div>
                <div className="app-tab">
                  <div className="date-picker">
                    <div>Date:</div>
                    <DatePicker
                      selected={this.state.endDate}
                      onChange={(date) => {
                        this.handleDateChange(date);
                      }}
                      selectsEnd
                      startDate={this.state.startDate}
                      endDate={this.state.endDate}
                      minDate={this.state.startDate}
                      maxDate={this.state.currDate}
                    />
                  </div>
                  <Search className="header-search-bar" />
                  <div className="tab-group">
                    <div
                      className={`item-tab ${
                        this.state.covidType === "sum_cases" ? "active-item" : ""
                      }`}
                      onClick={() => this.handleCovidTypeChange("sum_cases")}
                    >
                      Case
                    </div>
                    <div
                      className={`item-tab ${
                        this.state.covidType === "sum_deaths" ? "active-item" : ""
                      }`}
                      onClick={() => this.handleCovidTypeChange("sum_deaths")}
                    >
                      Death
                    </div>
                  </div>
                </div>        </div>

                <div ref={this.state.mapContainer} className="mapContainer"></div>
        <div className="more-info">
          <div className="more-item">total death: 0</div>
          <div className="more-item">total cases: 0</div>
        </div>
      </div>
    );
  }
}
