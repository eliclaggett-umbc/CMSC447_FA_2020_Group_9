const pool = require('../db.js');
const axios = require('axios');
const parse = require('csv-parse/lib/sync')

module.exports = async function handler(req, res) {	

	let query = '';
	let result = '';
	const client = await pool.connect();
	try {
    await client.query('BEGIN')
    query = 'SELECT last_fetched, is_fetching FROM data_fetcher';
		result = await client.query(query);
		
		let lastFetched = new Date('2020-01-01');
		let isFetching = false;
		if (result.rows.length > 0) {
			lastFetched = new Date(result.rows[0]['last_fetched']);
			isFetching = result.rows[0]['is_fetching'];
		}
		let nextFetch = lastFetched;
		nextFetch.setDate(nextFetch.getDate() + 7);
		let today = new Date();

		if (nextFetch <= today && !isFetching) {
			query = 'UPDATE data_fetcher SET is_fetching=true';
    	await client.query(query);
		} else {
			await client.query('COMMIT');
			console.log('no data to fetch');
			res.send('No data to fetch.');
			return;
		}
		await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    res.send('Error getting data fetcher status.');
  } finally {
    client.release();
  }

	console.log('start fetching data');
	// Get county data
	let resp = await axios.get('https://usafactsstatic.blob.core.windows.net/public/data/covid-19/covid_county_population_usafacts.csv', {
		responseType: 'blob'
	});

	let countyPopulations = parse(resp.data, {
		columns: true
	});

	query = 'INSERT INTO county(name, state, fips, population) VALUES ';
	let queryParams = [];
	let paramIndex = 1;
	for (const elem of countyPopulations) {
		if (elem['countyFIPS'] > 0) {
			query += `(\$${paramIndex},\$${paramIndex+1},\$${paramIndex+2},\$${paramIndex+3}),`;
			paramIndex += 4;
			queryParams.push.apply(queryParams, [
				elem['County Name'], elem['State'], elem['countyFIPS'], elem['population']
			]);
		}
	}
	countyPopulations = null;

	query = query.slice(0, -1)
	query += ' ON CONFLICT(fips) DO UPDATE SET name=EXCLUDED.name, state=EXCLUDED.state, population=EXCLUDED.population';
	let queryResult = await pool.query(query, queryParams);
	
	// Get latest county covid data
	query = 'SELECT MAX(dt) FROM county_covid';
	queryResult = await pool.query(query);
	let maxDt = queryResult.rows.max;

	// Get existing county fips codes
	query = 'SELECT fips FROM county';
	queryResult = await pool.query(query);
	let fips = [];

	for (const row of queryResult.rows){
		fips.push(parseInt(row.fips));
	}

	query = 'INSERT INTO county_covid(fips, cases, deaths, dt) VALUES ';
	queryParams = [];
	
	// Get county covid data
	resp = await axios.get('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv', {
		responseType: 'blob'
	});

	let countyCases = parse(resp.data, {
		columns: true
	});

	paramIndex = 1;
	let rowCount = 0;

	for (const elem of countyCases) {
		if (elem['fips'].length == 0 || elem['fips'] == 0 || fips.indexOf(parseInt(elem['fips'])) < 0)
			continue;

		if (!maxDt ||  new Date(maxDt) <= new Date(elem['date'])) {
			query += `(\$${paramIndex},\$${paramIndex+1},\$${paramIndex+2},\$${paramIndex+3}),`;
			paramIndex += 4;
			queryParams.push(
				parseInt(elem['fips']), elem['cases'], elem['deaths'], elem['date']
			);
		}
		
		rowCount++;
	
		if (rowCount % 5000 == 0 || rowCount == countyCases.length) {
			if (queryParams.length > 0) {
				query = query.slice(0, -1)
				query += ' ON CONFLICT ON CONSTRAINT county_covid_pkey DO NOTHING';
				let queryResult = await pool.query(query, queryParams);

				query = 'INSERT INTO county_covid(fips, cases, deaths, dt) VALUES ';
				queryParams = [];
				paramIndex = 1;
			}
		}
	}

	// Get prison data
	resp = await axios.get('https://raw.githubusercontent.com/uclalawcovid19behindbars/data/master/Adult%20Facility%20Counts/adult_facility_covid_counts_today_latest.csv', {
		responseType: 'blob'
	});

	let prisons = parse(resp.data, {
		columns: true
	});

	query = 'SELECT name, fips FROM prison';
	let currentPrisonData = await pool.query(query);
	let currentPrisons = [];
	for (const row of currentPrisonData.rows) {
		currentPrisons.push({name: row.name, fips: row.fips});
	}

	query = 'INSERT INTO prison(name, fips, population, latitude, longitude) VALUES ';
	queryParams = [];
	paramIndex = 1;

	for (const prison of prisons) {
		let isNew = true;
		// Only use prisons with location data
		if (prison['Latitude'].length > 2 && prison['County.FIPS'] != 'NA' && fips.indexOf(parseInt(prison['County.FIPS'])) >= 0) {
			for (const row of currentPrisons) {
				if (prison['Name'] == row['name'] && prison['County.FIPS'] == row['fips']) {
					isNew = false;
					break;
				}
			}
			if (!isNew) continue;

			query += `(\$${paramIndex},\$${paramIndex+1},\$${paramIndex+2},\$${paramIndex+3},\$${paramIndex+4}),`;
			paramIndex += 5;
			let population = 0;
			if (prison['Resident.Population'] != 'NA')
				population = prison['Resident.Population'];
			queryParams.push(
				prison['Name'], prison['County.FIPS'], population, prison['Latitude'], prison['Longitude']
			);
		}
	}

	if (queryParams.length > 0) {
		query = query.slice(0, -1);
		queryResult = await pool.query(query, queryParams);
	}
	const states = {
		'AK': 'Alaska',
		'AL': 'Alabama',
		'AR': 'Arkansas',
		'AS': 'American Samoa',
		'AZ': 'Arizona',
		'CA': 'California',
		'CO': 'Colorado',
		'CT': 'Connecticut',
		'DC': 'District of Columbia',
		'DE': 'Delaware',
		'FL': 'Florida',
		'GA': 'Georgia',
		'GU': 'Guam',
		'HI': 'Hawaii',
		'IA': 'Iowa',
		'ID': 'Idaho',
		'IL': 'Illinois',
		'IN': 'Indiana',
		'KS': 'Kansas',
		'KY': 'Kentucky',
		'LA': 'Louisiana',
		'MA': 'Massachusetts',
		'MD': 'Maryland',
		'ME': 'Maine',
		'MI': 'Michigan',
		'MN': 'Minnesota',
		'MO': 'Missouri',
		'MP': 'Northern Mariana Islands',
		'MS': 'Mississippi',
		'MT': 'Montana',
		'NA': 'National',
		'NC': 'North Carolina',
		'ND': 'North Dakota',
		'NE': 'Nebraska',
		'NH': 'New Hampshire',
		'NJ': 'New Jersey',
		'NM': 'New Mexico',
		'NV': 'Nevada',
		'NY': 'New York',
		'OH': 'Ohio',
		'OK': 'Oklahoma',
		'OR': 'Oregon',
		'PA': 'Pennsylvania',
		'PR': 'Puerto Rico',
		'RI': 'Rhode Island',
		'SC': 'South Carolina',
		'SD': 'South Dakota',
		'TN': 'Tennessee',
		'TX': 'Texas',
		'UT': 'Utah',
		'VA': 'Virginia',
		'VI': 'Virgin Islands',
		'VT': 'Vermont',
		'WA': 'Washington',
		'WI': 'Wisconsin',
		'WV': 'West Virginia',
		'WY': 'Wyoming'
	}
	// Get existing prisons
	query = 'SELECT p.name, p.id, c.state FROM prison p JOIN county c ON p.fips=c.fips';
	currentPrisonData = await pool.query(query);
	currentPrisons = [];
	for (const row of currentPrisonData.rows) {
		currentPrisons.push({name: row.name, state: states[row.state], id: row.id});
	}

	query = 'INSERT INTO prison_covid(prison_id, dt, prisoner_tests, prisoner_cases, prisoner_deaths, staff_tests, staff_cases, staff_deaths) VALUES ';
	queryParams = [];
	paramIndex = 1;

	rowCount = 0;
	for (const prison of currentPrisons) {
		const matches = prisons.filter((elem) => {
			return elem['Name'] == prison.name;
		})
		//Count.ID, Facility, State, Name, Date, Website, Residents.Confirmed, Staff.Confirmed, Resident.Deaths, Staff.Deaths, Residents.Recovered, Staff.Recovered, Residents.Tested, Staff.Tested, Residents.Negative, Staff.Negative, Residents.Pending, Staff.Pending, Residents.Quarantine, Staff.Quarantine, Residents.Released, Resident.Population, Address, Zipcode, City, County, Latitude, Longitude, County.FIPS, hifld_id, Notes, 
		for (const match of matches) {
			if (match['id']) {
				query += `(\$${paramIndex},\$${paramIndex+1},\$${paramIndex+2},\$${paramIndex+3},\$${paramIndex+4},\$${paramIndex+5},\$${paramIndex+6},\$${paramIndex+7}),`;
				paramIndex += 8;

				queryParams.push(
					prison['id'],
					match['Date'],
					match['Residents.Tested'].length > 0 && match['Residents.Tested'] != 'NA' ? match['Residents.Tested'] : 0,
					match['Residents.Confirmed'].length > 0 && match['Residents.Confirmed'] != 'NA' ? match['Residents.Confirmed'] : 0,
					match['Resident.Deaths'].length > 0 && match['Resident.Deaths'] != 'NA' ? match['Resident.Deaths'] : 0,
					match['Staff.Tested'].length > 0 && match['Staff.Tested'] != 'NA' ? match['Staff.Tested'] : 0,
					match['Staff.Confirmed'].length > 0 && match['Staff.Confirmed'] != 'NA' ? match['Staff.Confirmed'] : 0,
					match['Staff.Deaths'].length > 0 && match['Staff.Deaths'] != 'NA' ? match['Staff.Deaths'] : 0
				);
				rowCount++;
			}
		}
			
		if (rowCount > 2500) {
			query = query.slice(0, -1);
			query += ' ON CONFLICT ON CONSTRAINT prison_covid_pkey DO NOTHING'
			let success = await pool.query(query, queryParams);
			rowCount = 0;
			queryParams = [];
			paramIndex = 1;
			query = 'INSERT INTO prison_covid(prison_id, dt, prisoner_tests, prisoner_cases, prisoner_deaths, staff_tests, staff_cases, staff_deaths) VALUES ';
		}
	}
	if (rowCount > 0) {
		query = query.slice(0, -1);
		query += ' ON CONFLICT ON CONSTRAINT prison_covid_pkey DO NOTHING'
		let success = await pool.query(query, queryParams);
		rowCount = 0;
		queryParams = [];
		paramIndex = 1;
	}

	resp = await axios.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vSAMWHkg82Nv2abt5CXl7Z_6zfWJY5KZXjo3dnwA83DlkQbKeYKVcePcYqQ7F0F_TkYsGOhhbe3BDGw/pub?gid=19995249&single=true&output=csv', {
		responseType: 'blob'
	});

	let prisonCovid = parse(resp.data, {
		columns: true
	});

	query = 'INSERT INTO prison_covid(prison_id, dt, prisoner_tests, prisoner_cases, prisoner_deaths, staff_tests, staff_cases, staff_deaths) VALUES ';
	let covidCount = 0;
	queryParams = [];
	paramIndex = 1;
	for (const prison of currentPrisons) {
		let prisonWeek = prisonCovid.filter(obj => {
			return (
				( obj['Canonical Facility Name'].toUpperCase().replace(/[^A-Za-z0-9 ]/g, '').includes(prison.name)
					||
					obj['Canonical Facility Name'].toUpperCase().replace(/[^A-Za-z0-9 ]/g, '').includes(prison.name.replace(/ CI$/g, ' CORRECTION').replace(/ CC$/g, ' CORRECTION').replace(/ FCI$/g, ' FEDERAL').replace(/([A-Za-z]+) .+STATE PRISON.*/g, '$1').replace(/ USP$/g, ''))
				)
				&& obj['State'] == prison.state
			);
		});
		
		for (const week of prisonWeek) {
			query += `(\$${paramIndex},\$${paramIndex+1},\$${paramIndex+2},\$${paramIndex+3},\$${paramIndex+4},\$${paramIndex+5},\$${paramIndex+6},\$${paramIndex+7}),`;
			paramIndex += 8;

			queryParams.push(
				prison['id'], week['Date'], week['Pop Tested'].length > 0 ? week['Pop Tested'] : 0, week['Pop Tested Positive'].length > 0 ? week['Pop Tested Positive'] : 0, week['Pop Deaths'].length > 0 ? week['Pop Deaths'] : 0, week['Staff Tested'].length > 0 ? week['Staff Tested'] : 0, week['Staff Tested Positive'].length > 0 ? week['Staff Tested Positive'] : 0, week['Staff Deaths'].length > 0 ? week['Staff Deaths'] : 0
			);
			covidCount++
		}	
		if (covidCount > 2500) {
			query = query.slice(0, -1);
			query += ' ON CONFLICT ON CONSTRAINT prison_covid_pkey DO NOTHING'
			let success = await pool.query(query, queryParams);
			covidCount = 0;
			queryParams = [];
			paramIndex = 1;
			query = 'INSERT INTO prison_covid(prison_id, dt, prisoner_tests, prisoner_cases, prisoner_deaths, staff_tests, staff_cases, staff_deaths) VALUES ';
		}
	}
	if (covidCount > 0) {
		query = query.slice(0, -1);
		query += ' ON CONFLICT ON CONSTRAINT prison_covid_pkey DO NOTHING'
		let success = await pool.query(query, queryParams);
		rowCount = 0;
		queryParams = [];
		paramIndex = 1;
	}
	query = 'UPDATE data_fetcher SET last_fetched=NOW(), is_fetching=false';
	result = await pool.query(query);
	console.log('end fetching data');
	res.send('done');
}