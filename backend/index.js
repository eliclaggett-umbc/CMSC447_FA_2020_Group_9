const prisons = require('./api/prisons.js');
const counties = require('./api/counties.js');
const searchCounties = require('./api/search/counties.js');
const searchPrisons = require('./api/search/prisons.js');
const dataFetcher = require('./api/data_fetcher/fetch.js');
const lastFetched = require('./api/data_fetcher/last_fetched.js');
const stateRouter = require('./stateRouter.js');

var express = require("express");
var app = express();

app.listen(3000, () => {
 console.log("Server running on port 3000");
});

app.get("/api/prisons", prisons);
app.get("/api/counties", counties);
app.use("/api/state/", stateRouter);
app.get("/api/fetch_data", dataFetcher);
app.get("/api/last_fetched", lastFetched);
app.get("/api/search/counties", searchCounties);
app.get("/api/search/prisons", searchPrisons);