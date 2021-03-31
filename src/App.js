import React, { useState, useEffect } from 'react';
import axios from "axios";
import _compact from "lodash/compact";
import _flatten from "lodash/flatten";
import moment from "moment";
import DOMPurify from 'dompurify';

function App() {  
  let week = moment().isoWeek()
  let year = moment().year()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(undefined)
  const [weatherThisWeek, setWeatherThisWeek] = useState(undefined)
  
  useEffect(() => {
    const loggedWeatherWeek = sessionStorage.getItem('taWeather') ? sessionStorage.getItem('taWeather').split(',') : undefined
        
    let key
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        key = process.env.REACT_APP_API_KEY_DEV
    } else {
        key = process.env.REACT_APP_API_KEY_PROD
    }
    const spreadsheetId = "1pTFMTJ3T3qPY_gbubuDJSjI2xHK92jfLXXzL_-rtsRE"
    var url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/?key=${key}&includeGridData=true`
    
    const getWeather = () => axios.get(url)
        .then(function (response) {
          console.log(response);
          const rows = response?.data?.sheets[0]?.data[0]?.rowData.map(row => _compact(row.values.map(value => value?.formattedValue))).filter((arr) => arr.length)
          const getThisWeek = _flatten(rows.filter(row => Number(row[0]) === year && Number(row[1]) === week))
          setWeatherThisWeek(getThisWeek)
          sessionStorage.setItem('taWeather', getThisWeek.toString())
          setLoading(false);                                                                                                                                   
        })
        .catch(function (error) {
          console.log(error);         
          setLoading(false);
          setError(error);                                                                                                                 
        });
        
    // use cached weather if available
    if (loggedWeatherWeek) {
      setWeatherThisWeek(loggedWeatherWeek)
      setLoading(false)
    } else {
      getWeather()
    }
    // eslint-disable-next-line 
  }, [])   
  
  console.log("weatherThisWeek", weatherThisWeek)
  
  const season = weatherThisWeek && weatherThisWeek[3]
  const conditions = weatherThisWeek && weatherThisWeek[7]
  const winds = weatherThisWeek && weatherThisWeek[6]
  const highTemp = weatherThisWeek && weatherThisWeek[4]
  const lowTemp = weatherThisWeek && weatherThisWeek[5]
  const highInC = weatherThisWeek && Number((5/9) * (weatherThisWeek[4] - 32)).toFixed(0)
  const lowInC = weatherThisWeek && Number((5/9) * (weatherThisWeek[5] - 32)).toFixed(0)
  const warnings = weatherThisWeek && (weatherThisWeek[8] ? (<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(weatherThisWeek[8]) }} />) : undefined)
  
  const missingWeather = !season || !conditions || !winds || !highTemp || !lowTemp
    
  if (loading) return <div>Loading weather...</div>
  
  if (!weatherThisWeek || missingWeather) return <div>StarClan needs to provide a weather forecast for this week!</div>
  
  if (error) return <div>Uh oh! The weather's broken, tell Bandit!</div>
  
  const seasonClasses = season => {
    switch(season.toLowerCase()) {
      case "leaf-fall":
      case "leaffall":
        return "fab fa-pagelines"
      case "leaf-bare":
      case "leafbare":
        return "far fa-snowflake"
      case "new-leaf":
      case "newleaf":
        return "fas fa-leaf"
      case "green-leaf":
      case "greenleaf":
      default:
        return "fas fa-sun"  
    }
  }
  
  return (
    <div className="App bth-weather-content">
      <div className="bth-season-forecast-wrapper">
        <div className="bth-season">
          <i className={seasonClasses(season)} aria-hidden="true"></i>
          <h3 className="bth-season-title">Season: {season}</h3>
        </div>
        <div className="bth-forecast">
          {`${conditions}`}. <br/> {`Winds ${winds}`}.<br/> {`High ${highInC}℃ / ${highTemp}℉. Low ${lowInC}℃ / ${lowTemp}℉`}.
        </div>
      </div>
      <div className="bth-weather-warnings">
        {warnings ? warnings : "No severe weather warnings at this time."}
      </div>
    </div>

  );
}

export default App;
