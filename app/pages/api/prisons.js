//    /api/prisons endpoint

// return all prison covid data. 
// can filter by date
// if searching, return just state, county, prison. (so they can select the correct one)

import {pool} from './db';

export default async function handler(req, res) {

    

    // save route and query params.
    const { 
        query: {date, search}
    } = req

    var today = new Date();

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

        // query based on given date
        if (!query_params.search) {



            // verify date string is in correct format
            const regex_match = query_params.date.match(/[0-9]{4}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])/)
            // incorrect date
            if(!regex_match) {
                res.statusCode = 400
                error_message = res.statusCode + " bad request"
            }

            // query prison covid data for each prison, closest to date

            query_string = `
            SELECT state, prison_covid.* FROM prison_covid
            INNER JOIN (select prison, county, max(date) AS date FROM prison_covid
            WHERE date<='${query_params.date}' GROUP BY prison, county) recent_covid_data
                    ON recent_covid_data.county = prison_covid.county AND recent_covid_data.prison = prison_covid.prison
                    AND recent_covid_data.date = prison_covid.date
            INNER JOIN prison ON prison.prison = prison_covid.prison AND prison.county = prison_covid.county
            `
        }

        // query state and county and prison from search results (auto completion)
        else {

            query_string = `
            SELECT prison, county, state FROM prison WHERE prison LIKE '%' || '${query_params.search}' || '%'
            `
            }
        }


        if(res.statusCode != 200) res.end(error_message)


        try {
            const result = await pool.query(query_string)
            res.send(result.rows)
        } catch(err) {
            res.end(err.statusCode)
        }

  }