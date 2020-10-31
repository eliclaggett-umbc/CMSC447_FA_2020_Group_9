// query state and county from search results (auto completion)



import {pool} from '../db';

export default async function handler(req, res) {

    // save route and query params.
    const {
        query: {search}
    } = req

    // use this to make queries
    var query_params = {
        // default to today's date
        search: search
    }

    var query_string = null

    if(req.method == "GET") {

        query_string = `SELECT county, state FROM county WHERE county LIKE '%' || '${query_params.search}' || '%'`
        
        
        try {
    
            const result = await pool.query(query_string)
            res.send(result.rows)
        } catch(err) {
            res.end(err.statusCode)
        }
    }


}




