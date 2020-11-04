// create connection pool.

const Pool = require('pg').Pool;

const pool = new Pool();

module.exports = pool;
