/**
 * NodeJS Main Application
 * 
 * This program accepts web requests and returns either JSON or an HTML webpage to the user.
 */

// Express is a web server module for NodeJS
const express = require('express');
const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/mapbox-gl', express.static(__dirname + '/node_modules/mapbox-gl'));
app.get('/mapdata', (req, res) => {
  res.sendFile('http://localhost:8080/data/v3.json');
});


app.listen(port, () => {
  console.log('Example app listening on port '+port+'!');
})