// query state and county from search results (auto completion)
const pool = require('../db.js');

module.exports = function handler(req, res) {
    console.log('searching prsions');
    // save route and query params.
    const {
        query: {search}
    } = req

    // use this to make queries
    var request_params = {
        search: search
    }

    var query_string = null
    let query_params = [];

    if(req.method == "GET") {
        
        query_string = `SELECT p.id, p.name AS prison_name, p.fips, c.name AS county_name, c.state FROM prison p JOIN county c ON p.fips=c.fips WHERE LOWER(p.name) LIKE LOWER($1)`;

        query_params.push('%' + request_params.search + '%');
        
        pool.query(query_string, query_params)
        .then((result) => {
            res.send(result.rows)
        })
        .catch((err) => {
            res.end(err)
        });
    }
}