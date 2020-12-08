// create connection pool.

const Pool = require('pg').Pool;

pool = new Pool();

module.exports = pool;