import { component } from "react";
import React from "react";
import styles from "./Search.module.css";

export default class Search extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      searchBy: "counties",
      countyElems: [],
      prisonElems: [],
    };
  }

  handleSearchOn = (e) => {
    console.log(e.target.value);
    this.setState({ searchBy: e.target.value });
  };

  handleSearchQuery = (e) => {

    fetch(
      `http://localhost:8082/api/search/${this.state.searchBy}?search=${e.target.value}`
    )
      .then((res) => res.json())
      .then(
        (result) => {
          // console.log(result);
          // put query results into matching county/prison array
          this.setState(
            this.state.searchBy == "counties"
              ? { countyElems: result }
              : { prisonElems: result }
          );
        },
        (error) => {
          this.setState({
            isLoaded: true,
            error,
          });
        }
      );

    // console.log(this.state.countyElems)
    // console.log(this.state.searchBy)
  };

  render() {
    // maximum search results to display
    let maxResults = 10;
    let elements =
      this.state.searchBy == "counties"
        ? this.state.countyElems
        : this.state.prisonElems;

    return (
      <div className="header-search-bar">
        
        <input
          className="header-search-input"
          placeholder="Search"
          onChange={this.handleSearchQuery.bind(this)}
        ></input>
        {/* <i className="fa fa-search search-custom-position" aria-hidden="true"></i> */}

        { <div className={styles.resultList}><div>
          {elements.map((elem, index) => (
            <ResultListElement key={index} data={elem} onClick={this.props.resultClick}/>
          ))}
        </div></div> }
        <select
          value={this.state.searchBy}
          onChange={this.handleSearchOn.bind(this)}
          className="select-search"
        >
          <option value="counties">Counties</option>
          <option value="prisons">Prisons</option>
        </select>
      </div>
    );
  }
}

const ResultListElement = (props) => {
  // console.log(props);
  return (
    <button onClick={() => {
      let val = props.data.prison_name ? props.data.id : props.data.fips;
      let type = props.data.prison_name ? 'prison' : 'county';
      props.onClick(type, val);
    }} className={`${styles.button} ${styles.resultListElement}`}>
      <p>
        {props.data.prison_name
          ? props.data.prison_name +
            ", " +
            props.data.county_name +
            " " +
            props.data.state
          : props.data.name + ", " + props.data.state}
      </p>
    </button>
  );
};
