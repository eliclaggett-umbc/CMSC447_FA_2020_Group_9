// returns all prison data for a specific county
// this is used after zooming in on a county.
// can be filtered by date

import {pool} from '../../../../db';

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

    // default status code
    res.statusCode = 200

    if(req.method == "GET") {

            // verify date string is in correct format
            const regex_match = query_params.date.match(/[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])/)
            // incorrect date
            if(!regex_match) {
                res.statusCode = 400
                error_message = res.statusCode + " bad request"
            }

            // query prison covid data for county,state closest to date
            query_string = `
                SELECT state, prison_covid.* FROM prison_covid
                INNER JOIN (select prison, county, max(date) AS date FROM prison_covid
                WHERE date<='${query_params.date}' AND county='${query_params.county}' GROUP BY prison, county) recent_covid_data
                ON recent_covid_data.county = prison_covid.county AND recent_covid_data.prison = prison_covid.prison
                AND recent_covid_data.date = prison_covid.date INNER JOIN prison ON prison.prison = prison_covid.prison AND prison.county = prison_covid.county WHERE prison.state = '${state}'
                `


            // perform query
            try {

                const result = await pool.query(query_string)
                res.send(result.rows)
            } catch(err) {
                res.send(err.statusCode);
            }
        }

}