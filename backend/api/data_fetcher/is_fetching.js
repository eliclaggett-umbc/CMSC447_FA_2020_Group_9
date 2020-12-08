const pool = require('../db.js');

module.exports = function handler(req, res) {
	
	let query = 'SELECT is_fetching FROM data_fetcher';

	pool.query(query)
	.then((result) => {
		if (result.rows.length > 0) {
			res.send(JSON.stringify({ is_fetching: result.rows[0]['is_fetching']}));
		} else {
			res.send(JSON.stringify({ is_fetching: false}));
		}
		
	});

}