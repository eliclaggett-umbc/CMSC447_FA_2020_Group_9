const state = require('express').Router();
const counties = require('./api/counties.js');
const prisons = require('./api/prisons.js');

state.get('/:state', counties);
state.get('/:state/county/:county', counties);
state.get('/:state/county/:county/prisons', prisons);

module.exports = state;