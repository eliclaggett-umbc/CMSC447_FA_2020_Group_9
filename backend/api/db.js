// create connection pool.

const Pool = require('pg').Pool;

const pool = new Pool();

pool.query('UPDATE data_fetcher SET is_fetching=false');

module.exports = pool;
