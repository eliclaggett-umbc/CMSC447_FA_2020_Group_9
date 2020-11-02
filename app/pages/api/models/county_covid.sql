CREATE TABLE IF NOT EXISTS county_covid (
    county VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    cases INTEGER,
    deaths INTEGER,
    date DATE NOT NULL,
    CONSTRAINT fk_county FOREIGN KEY (county, state)
    REFERENCES county(county, state)
);