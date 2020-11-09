import {component} from 'react';
import React from 'react';
import styles from './Search.module.css';

export default class Search extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            searchBy: "counties",
            countyElems: [],
            prisonElems: []
        }
    }

    handleCountySearchOn = () => {
        this.setState({searchBy: "counties"})

    }

    handlePrisonSearchOn = () => {
        this.setState({searchBy: "prisons"})

    }

    handleSearchQuery = (e) => {
        fetch(`http://localhost:8082/api/search/${this.state.searchBy}?search=${e.target.value}`)
        .then(res => res.json())
        .then(result => {
            // console.log(result);
            // put query results into matching county/prison array
            this.setState( this.state.searchBy == "counties" ? {countyElems: result} : {prisonElems: result})
            },
            error => {
                this.setState({
                isLoaded: true,
                error
                });
            }
        )

        // console.log(this.state.countyElems)
        // console.log(this.state.searchBy)
    }

    render() {
        let elements = this.state.searchBy == "counties" ? this.state.countyElems : this.state.prisonElems;

        return (
            
        <div className={`${styles.searchComponent} ${styles.mainFont}`}>
            
            <p>Search for a prison or county</p>

            <div className={styles.searchByButtons}>
                
                <input id="counties" type="button" value="counties"className={`${styles.button} ${styles.searchByButton} ${styles.fontSize2} ${this.state.searchBy == "counties" ? styles.buttonActive : styles.buttonInactive}`} onClick={this.handleCountySearchOn.bind(this)}></input>
                <input id="prisons" type="button" value="prisons"className={`${styles.button} ${styles.searchByButton} ${styles.fontSize2} ${this.state.searchBy == "prisons" ? styles.buttonActive : styles.buttonInactive}`} onClick={this.handlePrisonSearchOn.bind(this)}></input>
            </div>

            <input className = {`${styles.searchBox} ${styles.fontSize2}`} placeholder="search" onChange={this.handleSearchQuery.bind(this)}>
                
            </input>

            <div className={styles.resultList}>

                {elements.map( (elem, index) =>

                  <ResultListElement key={index} data={elem}/>
                )}

            </div>

        </div>

        )
    }   
}

const ResultListElement = (props) => {
    // console.log(props);
return(
<button className={`${styles.button} ${styles.resultListElement}`}>
    <p>{props.data.prison_name ? props.data.prison_name + ', ' + props.data.county_name + ' ' + props.data.state : props.data.name + ', ' + props.data.state}</p>
</button>
    )
};