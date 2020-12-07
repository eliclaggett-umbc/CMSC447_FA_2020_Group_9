//    /api/geojson/counties endpoint
const csv = require('csv-parser');
const fs = require('fs');

module.exports = function handler(req, res) {  
	var counties = {}
	const { 
			query: {fips},
	} = req
	fs.createReadStream('/home/node/app/assets/counties.csv')
  .pipe(csv())
  .on('data', (row) => {
    counties[row['geoid10']] = [
			row['corner_sw'].split(','),
			row['corner_ne'].split(',')
		];
		let tmp = counties[row['geoid10']][0][0];
		counties[row['geoid10']][0][0] = parseFloat(counties[row['geoid10']][0][1]);
		counties[row['geoid10']][0][1] = parseFloat(tmp);
		tmp = counties[row['geoid10']][1][0];
		counties[row['geoid10']][1][0] = parseFloat(counties[row['geoid10']][1][1]);
		counties[row['geoid10']][1][1] = parseFloat(tmp);
  })
  .on('end', () => {
		console.log('CSV file successfully processed');
		res.send(counties[fips])
  });

}