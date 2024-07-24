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

// Lägg till OpenSnowMap overlay layer för att visa skidområden på kartan
L.tileLayer('https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenSnowMap.org'
}).addTo(map);

// Funktion för att hämta skidorter från OpenStreetMap via Overpass API
async function fetchSkiResortsFromOverpass() {
    const overpassUrl = `
        https://overpass-api.de/api/interpreter?data=[out:json];
        area["ISO3166-1"="SE"][admin_level=2];
        node["piste:type"~"downhill|backcountry"](area);
        out body;
    `;

    try {
        const response = await fetch(overpassUrl);
        const data = await response.json();
        return data.elements.map(resort => ({
            name: resort.tags.name || 'Okänd skidort',
            lat: parseFloat(resort.lat.toFixed(5)), // Avrunda latitud till 5 decimaler för att matcha andra API
            lon: parseFloat(resort.lon.toFixed(5)), // Avrunda longitud till 5 decimaler för att matcha andra API
            elevation: resort.tags.ele ? parseInt(resort.tags.ele, 10) : 0
        }));
    } catch (error) {
        console.error('Error fetching ski resorts:', error);
        return [];
    }
}

// Funktion för att visa skidorter
async function showSkiResorts() {
    const overpassResorts = await fetchSkiResortsFromOverpass();
    const combinedResorts = [
        ...skiResorts,
        ...overpassResorts
    ];

    combinedResorts.forEach(resort => {
        const marker = L.marker([resort.lat, resort.lon], { icon: skiIcon }).addTo(map)
            .bindPopup(`<b>${resort.name}</b><br>Hämtar väder...`, { closeOnClick: false, autoClose: false });
            // Lägg till 'glow-icon' klass när musen är över
        marker.on('mouseover', function () {
            this._icon.classList.add('glow-icon');
        });

        // Ta bort 'glow-icon' klass när musen inte är över
        marker.on('mouseout', function () {
            this._icon.classList.remove('glow-icon');
        });
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
        if (!smhiResponse.ok) throw new Error(`SMHI API error: ${smhiResponse.statusText}`);
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
        if (!rapidApiResponse.ok) throw new Error(`RapidAPI error: ${rapidApiResponse.statusText}`);
        const rapidApiText = await rapidApiResponse.text();
        const rapidApiData = JSON.parse(rapidApiText);

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
