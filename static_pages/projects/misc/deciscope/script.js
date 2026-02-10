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

/* --- CONTROLS --- */

async function startMeter() {
    if (isRecording) return;

    try {
        log("Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 1. Load the Worklet Processor
        try {
            await audioContext.audioWorklet.addModule('processor.js');
        } catch (e) {
            throw new Error("Could not load processor.js. Check file path.");
        }

        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        // 2. Create the Worklet Node
        meterNode = new AudioWorkletNode(audioContext, 'meter-processor');

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        // 3. Connect Graph: Mic -> Analyser -> MeterNode -> Destination
        microphone.connect(analyser);
        analyser.connect(meterNode);
        meterNode.connect(audioContext.destination);

        // 4. Listen for volume updates from the background thread
        meterNode.port.onmessage = (event) => {
            if (event.data.volume) {
                processVolume(event.data.volume);
            }
        };
        
        // Start Viz Loops
        visualizeFrequency();
        
        // UI Updates
        isRecording = true;
        startTime = new Date();
        recordedData = [];
        stats = { max: 0, sum: 0, count: 0 };
        
        btnStart.disabled = true;
        btnStop.disabled = false;
        btnExport.disabled = true;
        statusBadge.innerText = "LIVE";
        statusBadge.classList.add('active');
        log("Microphone connected. AudioWorklet Active.");

    } catch (err) {
        log("Error: " + err.message, "warn");
        alert("Error: " + err.message);
    }
}

function stopMeter() {
    if (!isRecording) return;
    
    // Clean up nodes
    if (meterNode) {
        meterNode.disconnect();
        meterNode = null;
    }
    if (analyser) analyser.disconnect();
    if (microphone) microphone.disconnect();
    if (audioContext) audioContext.close();

    isRecording = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnExport.disabled = false;
    statusBadge.innerText = "STOPPED";
    statusBadge.classList.remove('active');
    log("Monitoring stopped. Data ready for export.");
}

/* --- AUDIO PROCESSING --- */

function processVolume(rms) {
    // Convert to Decibels
    // We add a base offset (~100) to normalize typical mic input to SPL-like values
    // Calibration is applied here in the UI thread
    let db = 20 * Math.log10(rms) + 100 + parseFloat(calibrationOffset);
    
    if (db < 0) db = 0; // Clamp negative
    if (!isFinite(db)) db = 0;

    updateDashboard(db);
}

function updateDashboard(db) {
    // 1. Digital Readout
    dbReadout.innerText = db.toFixed(1);
    
    if (db > 85) dbReadout.style.color = "#ef4444"; // Danger
    else if (db > 70) dbReadout.style.color = "#f59e0b"; // Warning
    else dbReadout.style.color = "#fff";

    // 2. Stats
    if (db > stats.max) stats.max = db;
    stats.sum += db;
    stats.count++;
    
    valMax.innerText = stats.max.toFixed(1);
    valAvg.innerText = (stats.sum / stats.count).toFixed(1);

    // 3. Chart Update
    const chartData = historyChart.data.datasets[0].data;
    chartData.shift();
    chartData.push(db);
    historyChart.update();

    // 4. Record Data
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
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!isRecording) return;
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;

            ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
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
