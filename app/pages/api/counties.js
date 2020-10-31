// API endpoint: /api/counties 


// 
// gets all county covid data
// can filter by date
// if search exists, return just state, and county name that match the search (so they can select serach field)

// query parameters: 


// TO DO: add in logic for if date not specified in covid query
import {pool} from './db';

export default async function handler(req, res) {

    // save route and query params.
    const { 
        query: {date, sum, avg}
    } = req

   var today = new Date();

    // use this to make queries
    var query_params = {
        // default to today's date
        date: date ? date : `${today.getFullYear() + '-' + ( today.getMonth() + 1 ) + '-' + today.getDate()}`,
        sum: sum &&  sum.toLowerCase() == 'true' ? true : false,
        avg: avg && avg.toLowerCase() == 'true' ? true : false
    }

    var query_string = null

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

        // query all county covid data on date
        if(!query_params.sum && !query_params.avg) {
            
            
            
            query_string = `
            SELECT county_covid.*, population FROM county_covid
            INNER JOIN (select county, state, max(date) AS date FROM county_covid
            WHERE date<='${query_params.date}' GROUP BY county, state) recent_covid_data
            ON recent_covid_data.county = county_covid.county AND recent_covid_data.state = county_covid.state
            AND recent_covid_data.date = county_covid.date
            INNER JOIN county ON county_covid.county = county.county AND county_covid.state = county.state`
            
        }
            // query aggregate county data
        else {

                var query_aggregate = ''
                const query_start = `SELECT max(date) AS date`
                const query_end = `FROM county_covid WHERE date<='${query_params.date}'`

                // add sum aggregates
                if(query_params.sum) {
                    query_aggregate = `SUM(Cases) AS "total cases", SUM(deaths) AS "total deaths"`
                }
                // add average aggregates 
                if(query_params.avg) {
                    query_aggregate += query_aggregate ? `, avg(Cases) AS "average cases", avg(deaths) AS "average deaths"` : `avg(Cases) AS "average cases", avg(deaths) AS "average deaths"`
                }

                // form full query string
                query_string = query_start + ',\n' + query_aggregate + '\n' + query_end
            }

        // perform query
        try {
            const result = await pool.query(query_string)
            res.send(result.rows)
        } catch(err) {
            res.send(err.statusCode);
        }
    }
}