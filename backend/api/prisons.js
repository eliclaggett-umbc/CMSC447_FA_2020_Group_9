//    /api/prisons endpoint

// return all prison covid data. 
// can filter by date
// if searching, return just state, county, prison. (so they can select the correct one)

const pool = require('./db.js');

module.exports = function handler(req, res) {  

    // save route and query params.
    const { 
        query: {date, sum, avg, id},
        params: {fips, name}
    } = req

    var request_params = {
        // default to today's date
        date: date,
        sum: sum &&  sum.toLowerCase() == 'true' ? true : false,
        avg: avg && avg.toLowerCase() == 'true' ? true : false
    }

    var query_string = null
    var error_message = null

    // default status code
    res.statusCode = 200

    /*
    if(request_params.date) {
    // verify date string is in correct format
        const regex_match = request_params.date.match(/[0-9]{4}\-(0[1-9]|1[0-2])\-([0-2][0-9]|3[0-1])/)
        console.log(request_params.date)
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
        let query_params = [];
        let paramIndex = 1;

        if (request_params.sum) {
            aggregate_cols += ', MAX(pc.prisoner_tests) AS sum_prisoner_tests, MAX(pc.prisoner_cases) AS sum_prisoner_cases, MAX(pc.prisoner_deaths) AS sum_prisoner_deaths, MAX(pc.staff_tests) AS sum_staff_tests, MAX(pc.staff_cases) AS sum_staff_cases, MAX(pc.staff_deaths) AS sum_staff_deaths';
            join = 'LEFT JOIN prison_covid pc ON p.id=pc.prison_id';
            group = 'GROUP BY p.id, c.fips';
        }

        // if (request_params.avg) {
        //     aggregate_cols += ', AVG(pc.prisoner_tests) AS avg_prisoner_tests, AVG(pc.prisoner_cases) AS avg_prisoner_cases, AVG(pc.prisoner_deaths) AS avg_prisoner_deaths, AVG(pc.staff_tests) AS avg_staff_tests, AVG(pc.staff_cases) AS avg_staff_cases, AVG(pc.staff_deaths) AS avg_staff_deaths';
        //     join = 'LEFT JOIN prison_covid pc ON p.id=pc.prison_id';
        //     group = 'GROUP BY p.id, c.fips';
        // }

        if (request_params.date) {
            join = 'LEFT JOIN prison_covid pc ON p.id=pc.prison_id';
            const whereClause = '(pc.dt < $' + (paramIndex++) + ' OR pc.dt IS NULL) ';
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(request_params.date);
        }

        if (fips) {
            const whereClause = 'p.fips =$' +  paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(fips);
        }

        if (name) {
            const whereClause = `p.name=$` +  paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(name);
        }

        if (id) {
            const whereClause = `p.id=$` +  paramIndex++;
            where = where.length ? where + ' AND ' + whereClause : 'WHERE ' + whereClause;
            query_params.push(parseInt(id));
        }

        if (aggregate_cols.length) {
            aggregate_cols += ', MAX(pc.dt) AS latest_dt';
        }

        query_string = `SELECT c.state, c.name, c.fips, p.name, p.id, p.population, p.latitude, p.longitude ${aggregate_cols} FROM prison p JOIN county c ON p.fips=c.fips ${join} ${where} ${group};`;
        pool.query(query_string, query_params)
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            res.send(err);
        });
  }
}