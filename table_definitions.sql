CREATE TABLE IF NOT EXISTS county (
 fips INTEGER PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 state VARCHAR(255) NOT NULL,
 population INTEGER
);

CREATE TABLE IF NOT EXISTS county_covid (
 fips INTEGER REFERENCES county(fips),
 dt DATE,
 cases INTEGER NOT NULL,
 deaths INTEGER NOT NULL,
 PRIMARY KEY (fips, dt)
);

CREATE TABLE IF NOT EXISTS prison (
 id SERIAL PRIMARY KEY,
 fips INTEGER NOT NULL REFERENCES county(fips),
 name VARCHAR(255) NOT NULL,
 population INTEGER,
 latitude NUMERIC NOT NULL,
 longitude NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS prison_covid (
 prison_id INTEGER REFERENCES prison(id),
 dt DATE,
 prisoner_tests INTEGER,
 prisoner_cases INTEGER,
 prisoner_deaths INTEGER,
 staff_tests INTEGER,
 staff_cases INTEGER,
 staff_deaths INTEGER,
 PRIMARY KEY (prison_id, dt)
);

CREATE TABLE IF NOT EXISTS data_fetcher (
 last_fetched DATE,
 is_fetching BOOLEAN
);
INSERT INTO data_fetcher(last_fetched, is_fetching) VALUES ('2020-01-01', false);