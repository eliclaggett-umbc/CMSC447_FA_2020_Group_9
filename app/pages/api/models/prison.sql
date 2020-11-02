

CREATE TABLE IF NOT EXISTS prison (
    prison VARCHAR(255) NOT NULL,
    county VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    CONSTRAINT pk_prison PRIMARY KEY(prison, county)
    CONSTRAINT fk_county FOREIGN KEY (county, state)
    REFERENCES county(county, state)
);