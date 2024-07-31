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
function fetchSkiResortsFromOverpass(callback) {
    const overpassUrl = `
        https://overpass-api.de/api/interpreter?data=[out:json];
        area["ISO3166-1"="SE"][admin_level=2];
        node["piste:type"~"downhill|backcountry"](area);
        out body;
    `;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', overpassUrl, true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
            const data = JSON.parse(xhr.responseText);
            const resorts = data.elements.map(resort => ({
                name: resort.tags.name || 'Okänd skidort',
                lat: parseFloat(resort.lat.toFixed(5)), // Avrunda latitud till 5 decimaler för att matcha andra API
                lon: parseFloat(resort.lon.toFixed(5)), // Avrunda longitud till 5 decimaler för att matcha andra API
                elevation: resort.tags.ele ? parseInt(resort.tags.ele, 10) : 0
            }));
            callback(resorts);
        } else {
            console.error('Error fetching ski resorts:', xhr.statusText);
            callback([]);
        }
    };
    xhr.onerror = function() {
        console.error('Error fetching ski resorts:', xhr.statusText);
        callback([]);
    };
    xhr.send();
}

// Funktion för att visa skidorter
function showSkiResorts() {
    fetchSkiResortsFromOverpass(overpassResorts => {
        const combinedResorts = [
            ...skiResorts,
            ...overpassResorts
        ];

        combinedResorts.forEach(resort => {
            const marker = L.marker([resort.lat, resort.lon], { icon: skiIcon }).addTo(map)
                .bindPopup(`<b>${resort.name}</b><br><div class="spinner"></div><br>Hämtar väder...`, { closeOnClick: false, autoClose: false });

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
    });
}

// Funktion för att hämta och visa väderprognos och snöförhållanden
function showWeather(resortName, lat, lon, marker) {
    const smhiApiUrl = `fub/api/fetchWeather?lat=${lat}&lon=${lon}`;
    const rapidApiUrl = `/api/fetchSnowConditions?resortName=${resortName.toLowerCase()}`;

    const smhiRequest = new XMLHttpRequest();
    smhiRequest.open('GET', smhiApiUrl, true);
    smhiRequest.onload = function() {
        if (smhiRequest.status >= 200 && smhiRequest.status < 400) {
            const smhiData = JSON.parse(smhiRequest.responseText);
            const temperature = smhiData.timeSeries[0].parameters.find(param => param.name === 't').values[0];
            const wind = smhiData.timeSeries[0].parameters.find(param => param.name === 'ws').values[0];
            const gust = smhiData.timeSeries[0].parameters.find(param => param.name === 'gust').values[0];

            const rapidRequest = new XMLHttpRequest();
            rapidRequest.open('GET', rapidApiUrl, true);
            rapidRequest.onload = function() {
                if (rapidRequest.status >= 200 && rapidRequest.status < 400) {
                    const rapidApiData = JSON.parse(rapidRequest.responseText);
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
                } else {
                    marker.getPopup().setContent(`<b>${resortName}</b><br>Kunde inte hämta data från RapidAPI.`).update();
                }
            };
            rapidRequest.onerror = function() {
                marker.getPopup().setContent(`<b>${resortName}</b><br>Kunde inte hämta data från RapidAPI.`).update();
            };
            rapidRequest.send();
        } else {
            marker.getPopup().setContent(`<b>${resortName}</b><br>Kunde inte hämta data från SMHI.`).update();
        }
    };
    smhiRequest.onerror = function() {
        marker.getPopup().setContent(`<b>${resortName}</b><br>Kunde inte hämta data från SMHI.`).update();
    };
    smhiRequest.send();
}

// Visa skidorter vid start
showSkiResorts();

