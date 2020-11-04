const pool = require('../db.js');

module.exports = function handler(req, res) {
	
	let query = 'SELECT last_fetched FROM data_fetcher';

	pool.query(query)
	.then((result) => {
		if (result.rows.length > 0) {
			res.send(JSON.stringify(result.rows[0]['last_fetched']));
		} else {
			res.send('2020-01-01T00:00:00.000Z');
		}
		
	});

}