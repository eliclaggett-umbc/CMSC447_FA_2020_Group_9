//    /api/prisons endpoint

// return all prison covid data. 
// can filter by date
// if searching, return just state, county, prison. (so they can select the correct one)

import {pool} from './db';

export default async function handler(req, res) {

    

    // save route and query params.
    const { 
        query: {date, sum, avg}
    } = req

    

    var today = new Date();

    var query_params = {
        // default to today's date
        date: date ? date : `${today.getFullYear() + '-' + ( today.getMonth() + 1 ) + '-' + today.getDate()}`,
        sum: sum &&  sum.toLowerCase() == 'true' ? true : false,
        avg: avg && avg.toLowerCase() == 'true' ? true : false
    }

    
    var query_string = null
    var error_message = null

    // default status code
    res.statusCode = 200



    if(query_params.date) {
    // verify date string is in correct format
        const regex_match = query_params.date.match(/[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])/)
        // incorrect date
        if(!regex_match) {
            res.statusCode = 400
            res.status(400).end("bad request")
        }
    }

        
    if(req.method == "GET") {
            

        
        // query prison covid data for each prison, closest to date
            if(!query_params.sum && !query_params.avg) {


                query_string = `
                SELECT state, prison_covid.* FROM prison_covid
                INNER JOIN (select prison, county, max(date) AS date FROM prison_covid
                WHERE date<='${query_params.date}' GROUP BY prison, county) recent_covid_data
                        ON recent_covid_data.county = prison_covid.county AND recent_covid_data.prison = prison_covid.prison
                        AND recent_covid_data.date = prison_covid.date
                INNER JOIN prison ON prison.prison = prison_covid.prison AND prison.county = prison_covid.county
                `
            }     // query aggregate county data
            else {
    
                    var query_aggregate = ''
                    const query_start = `SELECT max(date) AS date`
                    const query_end = `FROM prison_covid WHERE date<='${query_params.date}'`
    
                    // add sum aggregates
                    if(query_params.sum) {
                        query_aggregate = `SUM(pop_tested_positive) AS "total cases", SUM(pop_deaths) AS "total deaths"`
                    }
                    // add average aggregates 
                    if(query_params.avg) {
                        query_aggregate += query_aggregate ? `, avg(pop_tested_positive) AS "average cases", avg(pop_deaths) AS "average deaths"` : `avg(pop_tested_positive) AS "average cases", avg(pop_deaths) AS "average deaths"`
                    }
    
                    // form full query string
                    query_string = query_start + ',\n' + query_aggregate + '\n' + query_end
                }

        try {
            const result = await pool.query(query_string)
            res.send(result.rows)
        } catch(err) {
            res.end(err.statusCode)
        }

  }
}