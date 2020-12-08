// API endpoint: /api/total

// TO DO: add in logic for if date not specified in covid query
const pool = require('./db.js');

module.exports = function handler(req, res) {
    const { 
        query: {date}
    } = req

    let county_where = '';
    let prison_where = '';
    let county_params = [];
    let prison_params = [];
    
    if (typeof(date) !== 'undefined') {
        county_where = ' AND cv.dt < $1';
        prison_where = ' AND pv.dt < $1';
        prison_params = [date];
        county_params = [date];
    }

    if(req.method == "GET") {

        query_string = `SELECT SUM ( (SELECT pv.prisoner_cases FROM prison_covid pv  WHERE pv.prison_id=prison.id ${prison_where} ORDER BY pv.dt DESC LIMIT 1) ) as sum_cases, SUM ( (SELECT pv.prisoner_deaths FROM prison_covid pv  WHERE pv.prison_id=prison.id ${prison_where} ORDER BY pv.dt DESC LIMIT 1) ) as sum_deaths FROM prison`;
        
        let final = {};
        pool.query(query_string, prison_params)
        .then((result) => {
            // res.send(query_string);
            
            query_string = `SELECT SUM ( (SELECT cv.cases FROM county_covid cv WHERE cv.fips=county.fips ${county_where} ORDER BY cv.dt DESC LIMIT 1) ) as sum_cases, SUM ( (SELECT cv.deaths FROM county_covid cv WHERE cv.fips=county.fips ${county_where} ORDER BY cv.dt DESC LIMIT 1) ) as sum_deaths FROM county`;
            pool.query(query_string, county_params)
            .then((result2) => {
                final = {
                    all_cases: result2.rows[0].sum_cases,
                    all_deaths: result2.rows[0].sum_deaths,
                    all_prisoner_cases: result.rows[0].sum_cases,
                    all_prisoner_deaths: result.rows[0].sum_deaths,
                }

                res.send(final);
            });
            
        })
        .catch((err) => {
            res.send(err);
        });
    }
}