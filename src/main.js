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

// Funktion för att hämta och visa väderprognos och snöförhållanden
async function showWeather(resortName, lat, lon, marker) {
    try {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const category = 'pmp3g';
        const version = '2';
        const smhiApiUrl = `https://opendata-download-metfcst.smhi.se/api/category/${category}/version/${version}/geotype/point/lon/${lon}/lat/${lat}/data.json`;

        const smhiResponse = await fetch(proxyUrl + smhiApiUrl);
        const smhiText = await smhiResponse.text();
        const smhiData = JSON.parse(smhiText);

        const temperature = smhiData.timeSeries[0].parameters.find(param => param.name === 't').values[0];
        const wind = smhiData.timeSeries[0].parameters.find(param => param.name === 'ws').values[0];
        const gust = smhiData.timeSeries[0].parameters.find(param => param.name === 'gust').values[0];

        const rapidApiUrl = `https://ski-resort-forecast.p.rapidapi.com/${resortName.toLowerCase()}/snowConditions?units=m`;
        const rapidApiOptions = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '5c48411b97msh43df63e7cfa00d6p11922bjsnaa3ea7a3a7f8',
                'x-rapidapi-host': 'ski-resort-forecast.p.rapidapi.com'
            }
        };

        const rapidApiResponse = await fetch(proxyUrl + rapidApiUrl, rapidApiOptions);
        const rapidApiText = await rapidApiResponse.text();
        console.log('RapidAPI raw response:', rapidApiText); // Logga den råa texten för felsökning
        const rapidApiData = JSON.parse(rapidApiText);
        console.log('RapidAPI parsed response:', rapidApiData); // Logga det parsade JSON-objektet för felsökning

        // Kontrollera att den mottagna datan har förväntad struktur
        const topSnowDepth = rapidApiData.topSnowDepth ?? 'saknas information just nu.';
        const botSnowDepth = rapidApiData.botSnowDepth ?? 'saknas information just nu.';
        const freshSnowfall = rapidApiData.freshSnowfall ?? 'saknas information just nu.';
        const lastSnowfallDate = rapidApiData.lastSnowfallDate ?? 'saknas information just nu.';

        const popupContent = `
            <b>${resortName}</b><br>
            Temperatur: ${temperature}°C<br>
            Vind: ${wind} (${gust}) m/s (byvind)<br>
            Snödjup topp: ${topSnowDepth}<br>
            Snödjup botten: ${botSnowDepth}<br>
            Nysnö: ${freshSnowfall}<br>
            Senaste snöfall: ${lastSnowfallDate}
        `;
        marker.getPopup().setContent(popupContent).update();
    } catch (error) {
        console.error('Error fetching data:', error);
        marker.getPopup().setContent(`<b>${resortName}</b><br>Kunde inte hämta data.`).update();
    }
}

// Visa skidorter vid start
showSkiResorts();