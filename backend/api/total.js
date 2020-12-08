// API endpoint: /api/total

// TO DO: add in logic for if date not specified in covid query
const pool = require('./db.js');

module.exports = function handler(req, res) {


    if(req.method == "GET") {

        query_string = `SELECT SUM ( (SELECT pv.prisoner_cases FROM prison_covid pv  WHERE pv.prison_id=prison.id ORDER BY pv.dt DESC LIMIT 1) ) as sum_cases, SUM ( (SELECT pv.prisoner_deaths FROM prison_covid pv  WHERE pv.prison_id=prison.id ORDER BY pv.dt DESC LIMIT 1) ) as sum_deaths FROM prison`;
        
        let final = {};
        pool.query(query_string)
        .then((result) => {
            // res.send(query_string);
            
            query_string = `SELECT SUM ( (SELECT cv.cases FROM county_covid cv WHERE cv.fips=county.fips ORDER BY cv.dt DESC LIMIT 1) ) as sum_cases, SUM ( (SELECT cv.deaths FROM county_covid cv WHERE cv.fips=county.fips ORDER BY cv.dt DESC LIMIT 1) ) as sum_deaths FROM county`;
            pool.query(query_string)
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