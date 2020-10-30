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
        query: {date, search}
    } = req

   var today = new Date();

    // use this to make queries
    var query_params = {
        // default to today's date
        date: date ? date : `${today.getFullYear() + '-' + ( today.getMonth() + 1 ) + '-' + today.getDate()}`,
        search: search ? search : null
    }

    
    var query_string = null
    var error_message = null

    // default status code
    res.statusCode = 200


    if(req.method == "GET") {

        // query based on date
        if (!query_params.search) {

            // verify date string is in correct format
            const regex_match = query_params.date.match(/[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])/)
            // incorrect date
            if(!regex_match) {
                res.statusCode = 400
                error_message = res.statusCode + " bad request"
            }

            // query all county covid data on date
            query_string = `
            SELECT county_covid.*, population FROM county_covid
            INNER JOIN (select county, state, max(date) AS date FROM county_covid
                WHERE date<='${query_params.date}' GROUP BY county, state) recent_covid_data
                ON recent_covid_data.county = county_covid.county AND recent_covid_data.state = county_covid.state
                AND recent_covid_data.date = county_covid.date
            INNER JOIN county ON county_covid.county = county.county AND county_covid.state = county.state`

            // query county covid data for each county, closest to date
            
        }

        // query state and county from search results (auto completion)
        else {
            query_string = `SELECT county, state FROM county WHERE county LIKE '%' || '${query_params.search}' || '%'`
        }

        // query parameters do not match required format
        if(res.statusCode != 200) res.end(error_message)

        // query county data
        try {
            const result = await pool.query(query_string)
            res.send(result.rows)
        } catch(err) {
            res.send(err.statusCode);
        }
    }
}