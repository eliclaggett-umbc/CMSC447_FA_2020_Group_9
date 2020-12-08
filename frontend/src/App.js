import logo from './logo.svg';
import './App.css';
import chroma from 'chroma-js';
import mapboxgl, { LngLat } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Search from './components/Search';
import Loader from 'react-loader-spinner';

mapboxgl.accessToken ='pk.eyJ1IjoiaGl3aWhhcmFyIiwiYSI6ImNraDJ6b2k4MTB0eWQyeXJ4NDcycWpodmUifQ.bxEz-zu7gz8jhCQLybK5bw';


async function calculatePrisonSizesForDate(date, covidType) {
  let day = date.getDate(); let month = date.getMonth() + 1; let year = date.getFullYear();
  let searchDate = year + "-" + month + "-" + day;
  if ( covidType == 'sum_cases' ) {
    covidType = 'sum_prisoner_cases';
  } else {
    covidType = 'sum_prisoner_deaths';
  }
  let matchExpression = ['match', ['get', 'id']];

  let toFetch = 'http://localhost:8082/api/prisons?sum=true&date=' + searchDate + '';
  
  try {
    let res = await fetch(toFetch);
    let result = await res.json();
    let values = [];

    try { // Prevent program from crashing if fetch doesn't return anything
      for (const row of result) {
        values.push(parseInt(row[covidType])); // populate values[] with covidType data
      }
    } catch(e) {
      return;
    }

    let colorScale = chroma.scale(['#000', '#FFF']).domain(chroma.limits(values, 'q', 5));

    for (const row of result) {
      
      var color = colorScale(parseInt(row[covidType])).luminance() * 20 + 5;
      matchExpression.push(row['id'], color); 
    }
    // if (matchExpression.length == 2) {
      matchExpression.push(5);
    // }
    console.log(matchExpression);
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
      return;
    }

    let colorScale = chroma.scale(['rgba(255,255,255,0)', 'rgba(255,255,0,0.1)', 'rgba(255,201,3, 0.5)', 'rgba(220,83,0, 0.9)']).domain(chroma.limits(values, 'q', 5));

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

  try {
    let res = await fetch(toFetch);
    let result = await res.json();
    return result;
   
  }

  catch(err) {
    console.log(`Error retrieving ${searchBy} COVID data`);
    console.log(err);
    return null;
  };


};
// create a popup on the map.
function generatePopup(rows, location, map) {
  // map.fire('closeAllPopups');
  var popupHTML = '';

  popupHTML += '<h3>' + rows[0] + '</h3><div>';
  for( let i = 1; i < rows.length; i++ ) {
    popupHTML += `<span>${rows[i]}</span>`;
  }
  popupHTML += '</div>';
  // console.log(location)

  var popup = new mapboxgl.Popup()
  .setLngLat(location)
  .setHTML(popupHTML)
  .addTo(map);
  popup.on('close', function(e) {
    map.setFilter('counties-highlighted', ['==', 'GEOID', '']);
  });

  map.on('closeAllPopups', () => {
    popup.remove();
  })
};
function handlePopup(type, location, date, data, map) {

  var rows = [];

  if(!data.length) return;

  if (type == 'counties') {

        var county = data[0].name ? data[0].name : '';
        var state = data[0].state ? data[0].state : '';
        var cases = data[0].sum_cases !== null ? data[0].sum_cases.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'No Data';
        var deaths = data[0].sum_deaths !== null ? data[0].sum_deaths.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'No Data';
       
        rows.push(county + (county ? ', ' : '') + state);
        rows.push(cases ? `Cases:  ${cases}` : '');
        rows.push(deaths ? `Deaths: ${deaths}` : '');
  }

  if(type == 'prisons') {
        var name = data[0].name ? data[0].name : '';
        var county = data[0].state ? data[0].state : '';
        var prisoner_cases = data[0].sum_prisoner_cases !== null ? data[0].sum_prisoner_cases.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'No Data';
        var staff_cases = data[0].sum_staff_cases !== null ? data[0].sum_staff_cases.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'No Data';
        var prisoner_deaths = data[0].sum_prisoner_deaths !== null ? data[0].sum_prisoner_deaths.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'No Data';
        var staff_deaths = data[0].sum_staff_deaths !== null ? data[0].sum_staff_deaths.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'No Data';

       
        rows.push(name + (name ? ', ' : '') + county);
        rows.push(prisoner_cases ? `Prisoner Cases:  ${prisoner_cases}` : '');
        rows.push(staff_cases ? `Staff Cases:  ${staff_cases}` : '');
        rows.push(prisoner_deaths ? `Prisoner Deaths: ${prisoner_deaths}` : '');
        rows.push(staff_deaths ? `Staff Deaths: ${staff_deaths}` : '');
  }

      // create rows for popup
      generatePopup(rows, location, map);
};
export default class App extends React.Component {
  // Initialize state and props, bind functions
  constructor(props) {
    super(props);
    this.state = {
    mapContainer: React.createRef(),
    startDate: new Date("2020/01/01"),
    currDate: new Date(),
    endDate: new Date(),
    covidType: 'sum_cases',
    covidButtonText: "View COVID-19 Statistics by Cases",
    aMap: undefined,
    selectedCounty: undefined,
    selectedPrison: undefined,
    containerClass: 'container',
    fetchingClass: 'fetchingIndicator hidden'
    };

    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleCovidTypeChange = this.handleCovidTypeChange.bind(this);
  };

  finishLoading = () => {
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
    // map.scrollZoom.disable();
    let endDate = this.state.endDate;
    let covidType = this.state.covidType;

    map.on("load", function() {
      // Hide watermark from the free version of OpenMapTiles
      if (map.getLayer("omt_watermark")) {
        map.setPaintProperty('omt_watermark', 'text-color', 'rgba(0,0,0,0)');
        map.setPaintProperty('omt_watermark', 'text-halo-color', 'rgba(0,0,0,0)');
      }
      
      calculateCountyColorsForDate(endDate, covidType).then( (countyColors) => {

        // if (map.getLayer("counties")) {map.removeLayer("counties");}
        // if (map.getLayer("pointLayer")) {map.removeLayer("pointLayer");}

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
        map.addLayer(
          {
          'id': 'counties-highlighted',
          'type': 'line',
          'source': 'counties',
          'source-layer': 'County',
          
          'paint': {
            'line-color': '#fff',
            'line-width': 4,
          },
          'filter': ['==', 'GEOID', '']
          }
        ); 
        
        map.addSource('points', {
          type: "geojson",
          data: 'http://localhost:8082/geojson/prisons',
          cluster: true,
          clusterMaxZoom: 14, 
          clusterRadius: 5 
        });

        calculatePrisonSizesForDate(endDate, covidType).then( (prisonSizes) => {
          map.addLayer({
            'id': 'pointLayer',
            'type': 'circle',
            'source': 'points',
            'paint': {
              'circle-color': 'rgba(230,71,0, 0.9)',
              'circle-radius': prisonSizes
            }
          });
        });
        
        // map.addLayer({
        //   'id': 'clusters',
        //   'type': 'circle',
        //   'source': 'points',
        //   'paint': {
        //     'circle-color': 'hsla(359, 89%, 7%, 0.72)',
        //     'circle-radius': [
        //       "interpolate",
        //       ["linear"],
        //       [
        //         "get", 
        //         'point_count'
        //       ],
        //       0,
        //       10,
        //       50,
        //       70
        //       ]        
        //   }
        // });
      });

    });
  
    // perform prison click, fetch covid data, and display popup
    async function handlePrisonClick(GEOID, features, LngLatBounds, date) {
      map.fire('closeAllPopups');
      
      // get geoid of selected county
      var name = features[0].properties['title'];

      var values = [['prison', 'county'], 'cases', 'deaths'];

      // (searchby, queryparams, routeparams)
      var result = await fetchCovidData('prisons', {'fips': GEOID, 'name': name}, {'date': date, 'sum': true}).then( (result) => {
        handlePopup('prisons', features[0].geometry.coordinates, date, result, map);
      })

      return result;
    }



    map.on("click", "counties", async (e) => {
     
      var GEOID = e.features[0].properties['GEOID'];
      
      try {

      
      let res = await fetch('http://localhost:8082/geojson/counties?fips=' + GEOID.toString().padStart(5, '0'));
      let result = await res.json();
      let LngLatBounds = new mapboxgl.LngLatBounds(result[0], result[1]);
      map.fire('closeAllPopups');
      map.setFilter('counties-highlighted', ['==', 'GEOID', GEOID.toString().padStart(5, '0')]);
      map.fitBounds(result, { padding: 150 });

      // if clicking on prison, display prison, not county data
      var features = map.queryRenderedFeatures(e.point, { layers: ['pointLayer'] });
      if (features.length) {
        
          handlePrisonClick(GEOID, features, e.lngLat, this.state.endDate, {'sum': true}).then((result) => {

            this.setState({selectedPrison: result});
            
          });
          // display county data
      } else {

        var values = [['county', 'state'], 'cases', 'deaths'];
  
        // (searchby, queryparams, routeparams)
        fetchCovidData('counties', {'fips': GEOID}, {'date': this.state.endDate, 'sum': true}).then( (result) => {
            
          
          this.setState({selectedCounty: result});
  
          handlePopup('counties', LngLatBounds.getCenter(), this.state.endDate, result, map);
          
          
        });
      }
    }
     catch(e) {
       console.log(e);
     }   
    });

    this.setState({aMap: map});
  };
  // Make sure the container is available before using it for a map
  componentDidMount() {

    fetch('http://localhost:8082/api/total').then((result) => result.json()).then((result) => {

      if (result.all_cases) {
        this.setState({ allCases: result.all_cases.replace(/\B(?=(\d{3})+(?!\d))/g, ","), allDeaths: result.all_deaths.replace(/\B(?=(\d{3})+(?!\d))/g, ","), fetchingClass: 'fetchingIndicator hidden', containerClass: 'container visible' });
        this.finishLoading();
      } else {
        this.setState({fetchingClass: 'fetchingIndicator'});
        let checkDoneLoading = setInterval(() => {
          fetch('http://localhost:8082/api/is_fetching').then((result) => result.json()).then((result) => {
            if (result.is_fetching == false && this.state.fetchingClass == 'fetchingIndicator') {
              clearInterval(checkDoneLoading);
              fetch('http://localhost:8082/api/total').then((result) => result.json()).then((result) => {
                this.setState({ allCases: result.all_cases.replace(/\B(?=(\d{3})+(?!\d))/g, ","), allDeaths: result.all_deaths.replace(/\B(?=(\d{3})+(?!\d))/g, ","), fetchingClass: 'fetchingIndicator hidden', containerClass: 'container visible' });
              this.finishLoading();
              });
            } else if (result.is_fetching == false){
              clearInterval(checkDoneLoading);
            } else {

            }
          });
        }, 2000);
      }
    });
    
  }

  handleCovidTypeChange = () => {
    // Change state to display updated info
    let nextCovidType = (this.state.covidType === 'sum_deaths') ? 'sum_cases' : 'sum_deaths';
    let nextCovidButtonText = (this.state.covidType === 'sum_deaths') ? "View COVID-19 Statistics by Deaths" : "View COVID-19 Statistics by Cases";
    
    this.setState({covidType: nextCovidType, covidButtonText: nextCovidButtonText});

    calculateCountyColorsForDate(this.state.endDate, nextCovidType).then( (countyColors) => {

      this.state.aMap.setPaintProperty('counties', 'fill-color', countyColors);
    });

    calculatePrisonSizesForDate(this.state.endDate, nextCovidType).then( (prisonSizes) => {
      this.state.aMap.setPaintProperty('pointLayer', 'circle-radius', prisonSizes);
    });
  }

  handleDateChange = (date) => {
    this.setState({endDate: date});

    calculateCountyColorsForDate(date, this.state.covidType).then( (countyColors) => {

      this.state.aMap.setPaintProperty('counties', 'fill-color', countyColors);
    });

    calculatePrisonSizesForDate(date, this.state.covidType).then( (prisonSizes) => {
      this.state.aMap.setPaintProperty('pointLayer', 'circle-radius', prisonSizes);
    });
  }


  handleSearch = async (type, id) => {
    this.state.aMap.fire('closeAllPopups');
    if (type == 'prison') {
      let result = await fetch('http://localhost:8082/geojson/prisons?id=' + id);
      result = await result.json();
      let coords = result.features[0].geometry.coordinates;
      this.state.aMap.flyTo({ center: coords, essential: true, zoom: 8});
      result = await fetchCovidData('prisons', {}, {'date': this.state.endDate, 'sum': 'true', 'id': id});
      handlePopup('prisons', coords, this.state.endDate, result, this.state.aMap);
    } else {
      let result = await fetch('http://localhost:8082/geojson/counties?fips=' + id.toString().padStart(5, '0'));
      let location = await result.json();
      this.state.aMap.setFilter('counties-highlighted', ['==', 'GEOID', id.toString().padStart(5, '0')]);
      this.state.aMap.fitBounds(location, { padding: 150 });
      
      result = await fetchCovidData('counties', {'fips': id}, {'date': this.state.endDate, 'sum': 'true'});
      let LngLatBounds = new mapboxgl.LngLatBounds(location[0], location[1]);
      handlePopup('counties', LngLatBounds.getCenter(), this.state.endDate, result, this.state.aMap);
    }
  }

  render() {

    return (
      <><div className={this.state.fetchingClass}><Loader
      type="Puff"
      color="#00BFFF"
      height={100}
      width={100}
    /><span>Updating Database...</span><span className="subtext">This may take a while.</span></div>
            <div className={this.state.containerClass}>
              
              <div className="app-header">
                <div className="app-title">
                  <h1 className="title">COVID-19 Prison Map</h1>
                </div>
                <div className="app-tab">
                  <div className="top-group">
                  <Search className="header-search-bar" resultClick={(type, val) => this.handleSearch(type, val)}/>
                  </div>
                  <div className="bottom-group">
                  <div className="tab-group">
                    <span>Viewing:</span>
                    <div
                      className={`item-tab ${
                        this.state.covidType === "sum_cases" ? "active-item" : ""
                      }`}
                      onClick={() => this.handleCovidTypeChange("sum_cases")}
                    >
                      Cases
                    </div>
                    <div
                      className={`item-tab ${
                        this.state.covidType === "sum_deaths" ? "active-item" : ""
                      }`}
                      onClick={() => this.handleCovidTypeChange("sum_deaths")}
                    >
                      Deaths
                    </div>
                  </div>
                  <div className="date-picker">
                    <span>Up to:</span>
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
                  </div>
                  
                </div>        </div>

                <div ref={this.state.mapContainer} className="mapContainer"></div>
        <div className="more-info">
                    <div className="more-item">Total deaths: {this.state.allDeaths}</div>
          <div className="more-item">Total cases: {this.state.allCases}</div>
        </div>
      </div>
      </>
    );
  }
}
