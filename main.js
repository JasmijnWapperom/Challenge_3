import { debounce } from "./utils.js";

let map = L.map('map').setView([52.0670747,4.3217853], 13);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox/dark-v10',
  tileSize: 512,
  zoomOffset: -1,
  accessToken: 'pk.eyJ1IjoibHV1a2hhaWplcyIsImEiOiJjamtoeXBwcHgwajhiM3FwMGl3OGpwczY5In0.odhtJ5gKsR_OMNC8IUfNiw'
}).addTo(map);

map.on('click', e => {
  if (e.latlng) {
    const {lat, lng} = e.latlng;
    getLocationData(lat, lng)
  }
});

const osmPlacesApiUrl = ' https://nominatim.openstreetmap.org/search?format=jsonv2&q=';
const openWeatherMapUrl = 'https://api.openweathermap.org/data/2.5/weather';
const openWeatherMapUrlApiKey = 'c18dc1fbc7ea63bf1cdf17a5eedcd47f';

function getPlacesByQuery(query) {
  fetch(osmPlacesApiUrl + query, {
    method: 'GET',
    referrer: "landingPage"
  }).then(response => response.json()).then(json => handlePlacesResponse(json))
}

function handlePlacesResponse(response) {
  const resultWrapperElm = document.querySelector('.places-result');
  const searchResultsElm = document.querySelector('#places-result-list');
  searchResultsElm.innerHTML = '';

  let html = '';
  if (response.length) {
    resultWrapperElm.classList.remove('hide');
    response.forEach(item => {
      html += `<li id="search-result-item" data-geo-data='{"lat": ${item.lat}, "lon": ${item.lon}}'>${item.display_name}</li>`
    })
  } else {
    resultWrapperElm.classList.add('hide');
  }
  searchResultsElm.innerHTML = html;
  geoDataListener()
}

function geoDataListener() {
  const elementList = document.querySelectorAll('[data-geo-data]');
  for (const element of elementList) {
    element.addEventListener('click', function () {
      onGeoDataClick(element);
    })
  }
}

function onGeoDataClick(elm) {
  const resultWrapperElm = document.querySelector('.places-result');

  resultWrapperElm.classList.add('hide');

  const elementAttrData = elm.getAttribute('data-geo-data');
  const geoData = JSON.parse(elementAttrData);

  getLocationData(geoData.lat, geoData.lon);
}

function getLocationData(lat, lon) {
  plotMarkerOnMap(lat, lon);
  getLocationWeather(lat, lon);
}

function getLocationWeather(lat, lon) {
  let request = `${openWeatherMapUrl}?appid=${openWeatherMapUrlApiKey}&lat=${lat}&lon=${lon}&units=metric`;

  // Get current weather based on cities' coordinates
  fetch(request)
      .then(response => response.json())
      .then(response =>
          // Then plot the weather response + icon on MapBox
          setOverViewData(response))
      .catch(function (error) {
        console.log('ERROR:', error);
      });
}

let marker;
function plotMarkerOnMap(lat, lon) {
  if (marker) {
    map.removeLayer(marker);
  }
  marker = L.marker([lat, lon]).addTo(map);
  map.setView([lat, lon], 12);
}

function setOverViewData(response) {
  const locationElm = document.querySelector('#geo-location');
  const tempElm = document.querySelector('#geo-temp');
  const visibilityElm = document.querySelector('#geo-visibility');
  const windspeedElm = document.querySelector('#geo-windspeed');

  locationElm.innerHTML = response.name;
  tempElm.innerHTML = response.main.temp;
  visibilityElm.innerHTML = response.visibility;
  windspeedElm.innerHTML = response.wind.speed + ' km/h';
}

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    document.querySelector('#places-search').addEventListener('input', debounce((input) => {
      getPlacesByQuery(input.target.value)
    }, 1000))
  }
};
