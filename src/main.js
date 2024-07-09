import L from 'leaflet';
import './css/main.scss';
import skiResorts from './ski-resorts.json'; 

// Initialisera kartan
const map = L.map('map').setView([63.0, 15.0], 5); // Koordinater för Sverige

// Lägg till en tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Funktion för att visa skidorter
function showSkiResorts() {
    skiResorts.forEach(resort => {
        const marker = L.marker([resort.lat, resort.lon]).addTo(map)
        .bindPopup(`<b>${resort.name}</b>`);
    });
}

// Visa skidorter vid start
showSkiResorts();