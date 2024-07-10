import L from 'leaflet';
import './css/main.scss';
import skiResorts from './ski-resorts.json'; 
import skiIconUrl from './assets/images/icon.png';

// Skapa en Leaflet-ikon
const skiIcon = L.icon({
    iconUrl: skiIconUrl,
    iconSize: [32, 32], // Justera storleken på ikonen efter behov
    iconAnchor: [16, 32], // Justera ankaret så att ikonen placeras korrekt
    popupAnchor: [0, -32] // Justera popup-ankaret så att popupen visas ovanför ikonen
});

// Initialisera kartan
const map = L.map('map').setView([63.0, 15.0], 5); // Koordinater för Sverige

// Lägg till en tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
// Funktion för att visa skidorter
function showSkiResorts() {
    skiResorts.forEach(resort => {
        const marker = L.marker([resort.lat, resort.lon], { icon: skiIcon }).addTo(map)
            .bindPopup(`<b>${resort.name}</b><br>Hämtar väder...`, { closeOnClick: false, autoClose: false });

        marker.on('click', () => {
            showWeather(resort.name, resort.lat, resort.lon, marker);
        });
    });
}
// Funktion för att hämta och visa väderprognos och lavininfo
async function showWeather(resortName, lat, lon, marker) {
    try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const category = 'pmp3g';
        const version = '2';
        const apiUrl = `https://opendata-download-metfcst.smhi.se/api/category/${category}/version/${version}/geotype/point/lon/${lon}/lat/${lat}/data.json`;

        const weatherResponse = await fetch(proxyUrl + apiUrl);
        const weatherText = await weatherResponse.text(); // Hämta råtext
        console.log(weatherText); // Logga den råa texten för att se vad vi får
        const weatherData = JSON.parse(weatherText); // Försök att parsa texten till JSON

        const temperature = weatherData.timeSeries[0].parameters.find(param => param.name === 't').values[0];

        const popupContent = `<b>${resortName}</b><br>Temperatur: ${temperature}°C`;
        marker.getPopup().setContent(popupContent).update();
    } catch (error) {
        console.error('Error fetching data:', error);
        marker.getPopup().setContent(`<b>${resortName}</b><br>Kunde inte hämta väderdata.`).update();
    }
}

// Visa skidorter vid start
showSkiResorts();