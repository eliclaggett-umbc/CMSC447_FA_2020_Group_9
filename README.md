# CMSC_447_FA_2020_Group_9 

This repository contains the project files for Group 9 of the Fall 2020 session of CMSC 447 at UMBC.

# Docker Demo With Map Integration

In an effort to reduce the complexity of setting up development environments across different operating systems and to enable us to pivot technologies easily, this codebase uses Docker and Docker-Compose to deploy our application.

## Requirements

 - Docker CE: https://www.docker.com/products/docker-desktop
 - Docker Compose: https://docs.docker.com/compose/install/

## Installation

The benefit of using Docker and Docker Compose is that we only need to install those two tools no matter what programming language or services we decide to use.

To install Docker CE, please download Docker Desktop for Windows, Docker Desktop for Mac, or the Docker Engine if you're running Linux.

To install Docker Compose, please follow the instructions for your operating system available at: https://docs.docker.com/compose/install/

## Running our application

First, clone this repository onto your system:
```bash
git clone git@github.com:eliclaggett-umbc/CMSC447_FA_2020_Group_9.git .
```
Then, open a terminal in the root directory of the project and run the command:
```bash
docker-compose up -d
```
This will read the instructions in docker-compose.yml and generate containers with all of the necessary prerequisites for the technologies we're using.

Before you access the application, OpenMapTiles needs to be configured to download U.S. map data to your machine. This is the only required one-time setup.
Please go to http://localhost:8080 to setup OpenMapTiles. Then, follow the instructions starting at 2 minutes 57 seconds into [this YouTube video](https://www.youtube.com/watch?time_continue=177&v=GXVSusPx4f4&feature=emb_logo). We only want Vector tiles because they look much better than raster tiles. Please also download all themese and all services in case we choose to use them in the future.

You can now access the application in a browser at http://localhost:8081


When you're finished developing, in the root directory of the project run the command:
```bash
docker-compose down -v
```

## Implementation Notes

### Data Retrieval

Sources:

County Boundary Vector Tiles: https://gis-server.data.census.gov/arcgis/rest/services/Hosted/VT_2019_050_00_PY_D1/VectorTileServer/tile/

Prison COVID Data: 
https://raw.githubusercontent.com/uclalawcovid19behindbars/data/master/Adult%20Facility%20Counts/adult_facility_covid_counts_today_latest.csv
https://docs.google.com/spreadsheets/d/1X6uJkXXS-O6eePLxw2e4JeRtM41uPZ2eRcOA_HkPVTk/gviz/tq?tqx=out:csv&sheet=COVID-19%20Jail%2FPrison%20Confirmed%20Cases%20and%20Deaths

County COVID Data: https://github.com/nytimes/covid-19-data