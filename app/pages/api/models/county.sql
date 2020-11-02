

CREATE TABLE IF NOT EXISTS county (
    county VARCHAR(255) UNIQUE NOT NULL,
    state VARCHAR(255) NOT NULL,
    fips INTEGER,
    population INTEGER,
    CONSTRAINT pk_county PRIMARY KEY(county, state)
);