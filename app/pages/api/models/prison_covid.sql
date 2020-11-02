CREATE TABLE IF NOT EXISTS prison_covid (
    prison VARCHAR(255) NOT NULL,
    county VARCHAR(255) NOT NULL,
    date VARCHAR(10) NOT NULL,
    pop_tested INTEGER,
    pop_tested_positive INTEGER,
    pop_tested_negative INTEGER,
    pop_deaths INTEGER,
    pop_recovered INTEGER,
    staff_tested INTEGER,
    staff_tested_positive INTEGER,
    staff_tested_negative INTEGER,
    staff_recovered INTEGER,
    source VARCHAR(255) DEFAULT '',
    compilation VARCHAR(255) DEFAULT '',
    notes VARCHAR(255) DEFAULT '',

    CONSTRAINT u_prison_date UNIQUE (prison, county, date),
    
    CONSTRAINT fk_county FOREIGN KEY (prison, county)
    REFERENCES prison(prison, county)
);