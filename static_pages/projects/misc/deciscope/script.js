/* DOM Elements */
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnExport = document.getElementById('btnExport');
const statusBadge = document.getElementById('statusBadge');
const dbReadout = document.getElementById('dbReadout');
const valMax = document.getElementById('valMax');
const valAvg = document.getElementById('valAvg');
const consoleLog = document.getElementById('consoleLog');
const calVal = document.getElementById('calVal');

/* Chart.js Setup */
const ctxChart = document.getElementById('historyChart').getContext('2d');
const historyChart = new Chart(ctxChart, {
    type: 'line',
    data: {
        labels: Array(60).fill(''),
        datasets: [{
            label: 'Noise Level (dB)',
            data: Array(60).fill(0),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            y: { min: 0, max: 120, grid: { color: '#222' } },
            x: { display: false }
        },
        plugins: { legend: { display: false } }
    }
});

/* State */
let audioContext, analyser, microphone, meterNode;
let isRecording = false;
let calibrationOffset = 0;
let recordedData = []; 
let stats = { max: 0, sum: 0, count: 0 };
let startTime = null;
let animationId = null; // To stop the loop cleanly

/* --- CONTROLS --- */

async function startMeter() {
    if (isRecording) return;

    try {
        log("Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // CRITICAL FIX: Ensure Context is Running
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // 1. Load the Worklet Processor
        try {
            await audioContext.audioWorklet.addModule('processor.js');
        } catch (e) {
            throw new Error("Could not load processor.js. Check file path.");
        }

        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        meterNode = new AudioWorkletNode(audioContext, 'meter-processor');

        // FFT Size for Frequency Graph
        analyser.smoothingTimeConstant = 0.85;
        analyser.fftSize = 2048; // Higher resolution

        // Connect: Mic -> Analyser -> Meter -> Destination
        microphone.connect(analyser);
        analyser.connect(meterNode);
        meterNode.connect(audioContext.destination);

        // Listen for volume updates
        meterNode.port.onmessage = (event) => {
            if (event.data.volume) processVolume(event.data.volume);
        };
        
        // Start Viz
        isRecording = true;
        visualizeFrequency();
        
        // Reset Data
        startTime = new Date();
        recordedData = [];
        stats = { max: 0, sum: 0, count: 0 };
        
        // UI Updates
        btnStart.disabled = true;
        btnStop.disabled = false;
        btnExport.disabled = true;
        statusBadge.innerText = "LIVE";
        statusBadge.classList.add('active');
        log("Microphone connected. Audio engine active.");

    } catch (err) {
        log("Error: " + err.message, "warn");
        alert("Error: " + err.message);
    }
}

function stopMeter() {
    if (!isRecording) return;
    
    // Stop Animation Loop
    if (animationId) cancelAnimationFrame(animationId);

    // Clean up nodes
    if (meterNode) { meterNode.disconnect(); meterNode = null; }
    if (analyser) analyser.disconnect();
    if (microphone) microphone.disconnect();
    if (audioContext) audioContext.close();

    isRecording = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnExport.disabled = false;
    statusBadge.innerText = "STOPPED";
    statusBadge.classList.remove('active');
    
    // Clear visualization
    const canvas = document.getElementById('freqCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    log("Monitoring stopped. Data ready for export.");
}

/* --- AUDIO PROCESSING --- */

function processVolume(rms) {
    let db = 20 * Math.log10(rms) + 100 + parseFloat(calibrationOffset);
    if (db < 0 || !isFinite(db)) db = 0;
    updateDashboard(db);
}

function updateDashboard(db) {
    dbReadout.innerText = db.toFixed(1);
    
    if (db > 85) dbReadout.style.color = "#ef4444"; 
    else if (db > 70) dbReadout.style.color = "#f59e0b"; 
    else dbReadout.style.color = "#fff";

    if (db > stats.max) stats.max = db;
    stats.sum += db;
    stats.count++;
    
    valMax.innerText = stats.max.toFixed(1);
    valAvg.innerText = (stats.sum / stats.count).toFixed(1);

    // Chart Update
    const chartData = historyChart.data.datasets[0].data;
    chartData.shift();
    chartData.push(db);
    historyChart.update();

    recordedData.push({
        time: (new Date() - startTime) / 1000, 
        db: db.toFixed(2)
    });
}

/* --- VISUALIZATIONS --- */

function visualizeFrequency() {
    if (!isRecording) return;
    
    const canvas = document.getElementById('freqCanvas');
    const ctx = canvas.getContext('2d');
    
    // CRITICAL FIX: Match Internal Resolution to Display Size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isRecording) return;
        animationId = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        // Clear with background color
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate Bar Width based on actual canvas width
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height; // Normalize height

            // Color Gradient based on frequency volume
            const r = barHeight + 50; 
            const g = 255 - barHeight; 
            const b = 50;

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }
    draw();
}

/* --- UTILS --- */

function updateCalibration(val) {
    calibrationOffset = val;
    calVal.innerText = val > 0 ? `+${val}` : val;
}

function exportData() {
    if (recordedData.length === 0) return alert("No data to export");
    
    let csvContent = "data:text/csv;charset=utf-8,Time (s),Decibels (dB)\n";
    recordedData.forEach(row => {
        csvContent += `${row.time},${row.db}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `deciscope_log_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function log(msg, type='') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString().split(' ')[0];
    line.innerText = `[${time}] ${msg}`;
    consoleLog.appendChild(line);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}
