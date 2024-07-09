import L from 'leaflet';
import './css/main.scss';

// Initialisera kartan
const map = L.map('map').setView([63.0, 15.0], 5); // Koordinater för Sverige

// Lägg till en tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);