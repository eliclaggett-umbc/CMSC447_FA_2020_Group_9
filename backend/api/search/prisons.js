// query state and county from search results (auto completion)
const pool = require('../db.js');

module.exports = function handler(req, res) {

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
        
        query_string = `SELECT p.id, p.name, p.fips, c.name, c.state FROM prison p JOIN count c ON p.fips=c.fips WHERE p.name LIKE $1`;
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