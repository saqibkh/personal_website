/* DOM Elements */
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnExport = document.getElementById('btnExport');
const liveBadge = document.getElementById('liveBadge');
const mapOverlay = document.getElementById('mapOverlay');

// Stats
const elLat = document.getElementById('valLat');
const elLng = document.getElementById('valLng');
const elSpeed = document.getElementById('valSpeed');
const elDist = document.getElementById('valDist');
const elTime = document.getElementById('valTime');

/* State */
let watchId = null;
let map = null;
let marker = null;
let pathPolyline = null;
let pathCoords = [];
let totalDistance = 0; // in meters
let lastPos = null;
let tileLayer = null;

/* --- MAP SETUP --- */

function initMap(lat, lng) {
    if (map) return;

    map = L.map('map', { zoomControl: false }).setView([lat, lng], 16);
    
    // Move zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Default Style: Dark
    setMapStyle('dark');

    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup('Start Point')
        .openPopup();

    pathPolyline = L.polyline([], { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(map);

    mapOverlay.classList.add('hidden');
}

// Map Style Switcher
function setMapStyle(style) {
    if (!map) return; // Wait for map init
    if (tileLayer) map.removeLayer(tileLayer);

    const styles = {
        'dark': 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
        'light': 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
        'sat': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    tileLayer = L.tileLayer(styles[style], {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap & Stadia'
    }).addTo(map);

    // Update buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase().includes(style)) btn.classList.add('active');
    });
}

function recenterMap() {
    if (map && marker) {
        map.setView(marker.getLatLng(), 17);
    }
}

/* --- TRACKING LOGIC --- */

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function updateStats(position) {
    const coords = position.coords;
    const lat = coords.latitude;
    const lng = coords.longitude;
    
    // Initialize Map on first fix
    if (!map) initMap(lat, lng);

    // Distance Calc
    if (lastPos) {
        const d = calculateDistance(lastPos.lat, lastPos.lng, lat, lng);
        // Filter small GPS jitters (only count if moved > 2 meters)
        if (d > 2) totalDistance += d;
    }
    lastPos = { lat, lng };

    // Update UI
    elLat.innerText = lat.toFixed(5);
    elLng.innerText = lng.toFixed(5);
    elSpeed.innerText = coords.speed ? (coords.speed * 3.6).toFixed(1) : '0.0';
    elDist.innerText = (totalDistance / 1000).toFixed(2); // KM
    elTime.innerText = new Date().toLocaleTimeString();

    // Map Updates
    const latLng = [lat, lng];
    marker.setLatLng(latLng);
    map.panTo(latLng);
    
    pathCoords.push({
        lat: lat,
        lng: lng,
        time: new Date().toISOString()
    });
    
    // Leaflet requires array of arrays [lat, lng] for polyline
    const polyCoords = pathCoords.map(p => [p.lat, p.lng]);
    pathPolyline.setLatLngs(polyCoords);
}

function handleError(error) {
    stopTracking();
    alert("Location Error: " + error.message);
}

/* --- CONTROLS --- */

function startTracking() {
    if (!navigator.geolocation) return alert("Not Supported");

    btnStart.disabled = true;
    btnStop.disabled = false;
    btnExport.disabled = true;
    liveBadge.classList.add('active');
    
    // Reset Data
    pathCoords = [];
    totalDistance = 0;
    
    watchId = navigator.geolocation.watchPosition(
        updateStats, 
        handleError,
        { enableHighAccuracy: true }
    );
}

function stopTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnExport.disabled = false;
    liveBadge.classList.remove('active');
}

function exportData() {
    if (pathCoords.length === 0) return alert("No data to export");
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pathCoords));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "track_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}
