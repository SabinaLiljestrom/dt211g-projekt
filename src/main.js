import L from 'leaflet';
import './css/main.scss';
import skiResorts from './ski-resorts.json'; 

// Importera ikonen
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
        const marker = L.marker([resort.lat, resort.lon],{ icon: skiIcon }).addTo(map)
        .bindPopup(`<b>${resort.name}</b>`);
    });
}

// Visa skidorter vid start
showSkiResorts();