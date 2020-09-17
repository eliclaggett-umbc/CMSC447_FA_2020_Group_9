/**
 * NodeJS Main Application
 * 
 * This program accepts web requests and returns either JSON or an HTML webpage to the user.
 */

// Express is a web server module for NodeJS
const express = require('express');
const app = express();

// The Express Router allows different actions to be taken if the user navigates to a different URL path
// e.g.) example.com, example.com/api, example.com/other/path/here
const router = express.Router();

const path = __dirname + '/views/';

// This is the port that must be specified to access the web server
// It must match the port that is forwarded in the docker-compose.yml file
const port = 8080;

router.use(function (req,res,next) {
  console.log('/' + req.method);
  next();
});

router.get('/', function(req,res){
  res.sendFile(path + 'index.html');
});

app.use(express.static(path));
app.use('/', router);

app.listen(port, function () {
  console.log('Example app listening on port '+port+'!');
})