//  /api/state/[state]/county/[county] API endpoint

// return county covid data for a specific state, and county.
// this is used after selecting a specific county

import {pool} from '../../../db';

export default async function handler(req, res) {

    // save route and query params.
    const { 
        query: {state, county, date}
    } = req


    var today = new Date();

    // use this to make queries
    var query_params = {
        // default to today's date
        date: date ? date : `${today.getFullYear() + '-' + ( today.getMonth() + 1 ) + '-' + today.getDate()}`,
        county: county ? county : null,
        state: state ? state : null
    }

    var query_string = null
    var error_message = null
    var result_single_obj = false

    // default status code
    res.statusCode = 200

    if(req.method == "GET") {


        // verify date string is in correct format
        const regex_match = query_params.date.match(/[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])/)
        // incorrect date
        if(!regex_match) {
            res.statusCode = 400
            error_code = res.statusCode + " bad request"
        }

        // query county covid data for each county, closest to date
        query_string = `
        SELECT county_covid.*, population FROM county_covid
        INNER JOIN (select county, state, max(date) AS date FROM county_covid
        WHERE date<='${query_params.date}' AND county='${query_params.county}' AND state='${query_params.state}' GROUP BY county, state) recent_covid_data
        ON recent_covid_data.county = county_covid.county AND recent_covid_data.state = county_covid.state
        AND recent_covid_data.date = county_covid.date
        INNER JOIN county ON county_covid.county = county.county AND county_covid.state = county.state`

        //number ofr results
        result_single_obj = true
        
        //perform query
        try {

            const result = await pool.query(query_string)

            if(result_single_obj == 1) res.send(result.rows[0])
            else res.send(result.rows)

        } catch(err) {
            res.send(err.statusCode);
        }

    }

  }