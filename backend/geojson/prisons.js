//    /api/prisons endpoint

// return all prison covid data. 
// can filter by date
// if searching, return just state, county, prison. (so they can select the correct one)

const pool = require('../api/db.js');

module.exports = function handler(req, res) {  

	let query_string = `SELECT c.state, c.name, c.fips, p.name, p.id, p.population, p.latitude, p.longitude FROM prison p JOIN county c ON p.fips=c.fips;`;

	let geo = {
		type: 'FeatureCollection',
		features: []
	}

	pool.query(query_string)
	.then((result) => {

		for (row of result.rows) {
			geo.features.push(
				{
					// feature for Mapbox DC
					'type': 'Feature',
					'geometry': {
						'type': 'Point',
						'coordinates': [
							parseFloat(row.longitude),
							parseFloat(row.latitude)
						]
					},
					'properties': {
						'title': row.name
					}
				}
			);
		}
		res.send(geo);
	})
	.catch((err) => {
		res.send(err);
	});

}