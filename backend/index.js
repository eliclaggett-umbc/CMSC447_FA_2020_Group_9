const total = require('./api/total.js');
const prisons = require('./api/prisons.js');
const counties = require('./api/counties.js');
const searchCounties = require('./api/search/counties.js');
const searchPrisons = require('./api/search/prisons.js');
const dataFetcher = require('./api/data_fetcher/fetch.js');
const lastFetched = require('./api/data_fetcher/last_fetched.js');
const isFetching = require('./api/data_fetcher/is_fetching.js');
const geoJSONPrisons = require('./geojson/prisons.js');
const geoJSONCounties = require('./geojson/counties.js');
const stateRouter = require('./stateRouter.js');
const pool = require('./api/db');

var express = require("express");
var app = express();

var cors = require('cors');
corsOptions = {
	origin: '*'
}
app.use(cors(corsOptions));

async function checkForDataUpdates(req, next) {
	class FakeRes {
		send(data) {
			// Do nothing
		}
		constructor() {
			// Do nothing
		}
	}

	dataFetcher(req, new FakeRes());
	next();
}

app.use(function (req, res, next) {
  checkForDataUpdates(req, next);
});


function finishLoading() {
	app.listen(3000, () => {
		console.log("Server running on port 3000");
	 });
	 
	 app.get("/api/total", total);
	 app.get("/api/prisons", prisons);
	 app.get("/api/counties", counties);
	 // added line
	 app.get("/api/counties/fips/:fips", counties);
	 app.get("/api/prisons/fips/:fips/name/:name", prisons);
	 app.get("/api/prisons/fips/:fips", prisons);
	 app.use("/api/state/", stateRouter);
	 app.get("/api/fetch_data", dataFetcher);
	 app.get("/api/last_fetched", lastFetched);
	 app.get("/api/is_fetching", isFetching);
	 app.get("/api/search/counties", searchCounties);
	 app.get("/api/search/prisons", searchPrisons);
	 
	 app.get("/geojson/prisons", geoJSONPrisons);
	 app.get("/geojson/counties", geoJSONCounties);
}

let finishedLoading =  false;
let loader = setInterval( () => {
	pool.query('UPDATE data_fetcher SET is_fetching=false').then(() => {
		
		clearInterval(loader);
		if ( !finishedLoading ) {
			finishedLoading =  true;
			finishLoading();
		}
	}).
	catch(e => {
		console.log('Waiting for database...');
	});
}, 1000 );