// API endpoint: /api/counties 

// 
// gets all county covid data
// can filter by date
// if search exists, return just state, and county name that match the search (so they can select serach field)

// query parameters: 

// TO DO: add in logic for if date not specified in covid query
const pool = require('./db.js');

module.exports = function handler(req, res) {

    // save route and query params.
    const { 
        query: {date, sum, avg},
        params: {county, state, fips}
    } = req

    // use this to make queries
    var request_params = {
        // default to today's date
        date: date,
        sum: sum &&  sum.toLowerCase() == 'true' ? true : false,
        avg: avg && avg.toLowerCase() == 'true' ? true : false
    }

    var query_string = null

    /*
    if(request_params.date) {
    // verify date string is in correct format
        const regex_match = request_params.date.match(/[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])/)
        // incorrect date
        if(!regex_match) {
            res.statusCode = 400
            res.status(400).end("bad request")
        }
    }
    */


    if(req.method == "GET") {

        let aggregate_cols = '';
        let join = '';
        let group = '';
        let where = '';
        let paramIndex = 1;
        let query_params = [];


        if (request_params.sum) {
            aggregate_cols += ', SUM(cc.cases) as sum_cases, SUM(cc.deaths) as sum_deaths';
            join = 'LEFT JOIN county_covid cc ON cc.fips=c.fips';
            group = 'GROUP BY c.fips';
        }

        if (request_params.avg) {
            aggregate_cols += ', AVG(cc.cases) as avg_cases, AVG(cc.deaths) as avg_deaths';
            join = 'LEFT JOIN county_covid cc ON cc.fips=c.fips';
            group = 'GROUP BY c.fips';
        }

        if (request_params.date) {
            join = 'LEFT JOIN county_covid cc ON cc.fips=c.fips';
            const whereClause = 'cc.dt < $' + paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(request_params.date);
        }

        if (fips) {
            const whereClause = 'c.fips = $' +  paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(fips);
        }

        if (state) {
            const whereClause = 'c.state = $' +  paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(state);
        }

        if (county) {
            const whereClause = 'c.name LIKE $' +  paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(county);
        }




        query_string = `SELECT c.name, c.state, c.fips ${aggregate_cols} FROM county c ${join} ${where} ${group};`;
        
        pool.query(query_string, query_params)
        .then((result) => {
            // res.send(query_string);
            res.send(result.rows);
        })
        .catch((err) => {
            res.send(err);
        });
    }
}