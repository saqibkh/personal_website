/* DOM Elements */
const btnRun = document.getElementById('btnRun');
const statusBadge = document.getElementById('statusBadge');
const totalScoreEl = document.getElementById('totalScore');
const progressBar = document.getElementById('overallProgress');
const consoleLog = document.getElementById('consoleLog');

// Info Elements
const infoGpuModel = document.getElementById('infoGpuModel');
const infoCores = document.getElementById('infoCores');
const infoHz = document.getElementById('infoHz');
const infoBattery = document.getElementById('infoBattery');

/* State */
let isRunning = false;
let scores = { cpu: 0, gpu: 0, mem: 0, net: 0 };

/* --- SYSTEM DETECTION --- */
window.onload = () => {
    initCanvas();
    detectHardware();
    estimateRefreshRate();
};

async function detectHardware() {
    // 1. Cores
    const cores = navigator.hardwareConcurrency || 4;
    infoCores.innerText = `${cores} Threads`;

    // 2. GPU Model
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            infoGpuModel.innerText = renderer;
            log(`GPU Detected: ${renderer}`, "info");
        } else {
            infoGpuModel.innerText = "Generic WebGL";
        }
    } catch(e) {
        infoGpuModel.innerText = "Unknown GPU";
    }

    // 3. Battery
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            const updateBattery = () => {
                const level = Math.round(battery.level * 100);
                const charging = battery.charging ? "⚡" : "";
                infoBattery.innerText = `${level}% ${charging}`;
            };
            updateBattery();
            battery.addEventListener('levelchange', updateBattery);
            battery.addEventListener('chargingchange', updateBattery);
        } catch(e) {
            infoBattery.innerText = "Restricted";
        }
    } else {
        infoBattery.innerText = "N/A (Desktop)";
    }
}

function estimateRefreshRate() {
    let count = 0;
    let start = performance.now();
    
    function loop() {
        if (count < 60) {
            requestAnimationFrame(loop);
            count++;
        } else {
            const end = performance.now();
            const elapsed = end - start;
            const fps = Math.round((60 / elapsed) * 1000);
            infoHz.innerText = `~${fps} Hz`;
        }
    }
    requestAnimationFrame(loop);
}

function log(msg, type='') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const time = new Date().toLocaleTimeString().split(' ')[0];
    line.innerText = `[${time}] ${msg}`;
    consoleLog.appendChild(line);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

/* --- BENCHMARK SUITE --- */
async function startBenchmark() {
    if (isRunning) return;
    isRunning = true;
    
    // UI Reset
    btnRun.disabled = true;
    statusBadge.innerText = "PROCESSING";
    statusBadge.classList.add('running');
    totalScoreEl.innerText = "----";
    progressBar.style.width = "5%";
    
    resetCard('Cpu'); resetCard('Gpu'); resetCard('Mem'); resetCard('Net');
    log("Initializing extended stability tests...", "info");

    try {
        // 1. CPU: Extended Matrix Math (5 Seconds)
        updateStatus('Cpu', 'CALCULATING');
        progressBar.style.width = "25%";
        scores.cpu = await runCpuTest();
        updateResult('Cpu', scores.cpu.toLocaleString(), 'Ops');
        log(`CPU Stress Result: ${scores.cpu} Ops (Stable)`);

        // 2. Memory: Sustained Allocation (4 Seconds)
        updateStatus('Mem', 'ALLOCATING');
        progressBar.style.width = "50%";
        scores.mem = await runMemoryTest();
        updateResult('Mem', scores.mem.toLocaleString(), 'Ops/ms');
        log(`Memory Throughput: ${scores.mem} Ops/ms`);

        // 3. Network: Multi-Ping Average (3 Samples)
        updateStatus('Net', 'PINGING');
        progressBar.style.width = "75%";
        scores.net = await runNetworkTest();
        updateResult('Net', scores.net + "ms", 'Avg Latency');
        log(`Network Average: ${scores.net}ms`);

        // 4. GPU: High-Stress Render (4 Seconds)
        updateStatus('Gpu', 'RENDERING');
        progressBar.style.width = "90%";
        scores.gpu = await runGpuTest();
        updateResult('Gpu', scores.gpu, 'FPS');
        log(`GPU Sustained Performance: ${scores.gpu} FPS`);

        // Final
        progressBar.style.width = "100%";
        calculateTotalScore();

    } catch (e) {
        log("Benchmark interrupted: " + e.message, "warn");
    }

    isRunning = false;
    btnRun.disabled = false;
    statusBadge.innerText = "COMPLETE";
    statusBadge.classList.remove('running');
    log("Diagnostic complete.", "success");
}

/* --- EXTENDED TEST LOGIC --- */

function runCpuTest() {
    return new Promise(resolve => {
        setTimeout(() => {
            const start = performance.now();
            let ops = 0;
            const duration = 5000; // Increased to 5000ms (5s)
            
            // Loop until duration is met
            while (performance.now() - start < duration) {
                // Heavier Math workload
                for(let i=0; i<1000; i++) {
                    Math.sqrt(Math.random() * 10000) * Math.sin(Math.random()) / Math.tan(Math.random());
                }
                ops++;
            }
            
            // Score = Operations per millisecond (Higher is better)
            resolve(Math.floor(ops / (duration / 1000))); 
        }, 200);
    });
}

function runMemoryTest() {
    return new Promise(resolve => {
        setTimeout(() => {
            const start = performance.now();
            const duration = 4000; // Increased to 4000ms (4s)
            let ops = 0;
            
            while (performance.now() - start < duration) {
                const arr = [];
                // Alloc/Dealloc 50k objects per loop
                for(let i=0; i<50000; i++) {
                    arr.push({a: Math.random(), b: new Date(), c: "string payload"});
                }
                ops++;
                // Let GC clean up by letting 'arr' go out of scope
            }
            
            // Score based on iterations completed
            const time = (performance.now() - start) / 1000;
            resolve(Math.floor((ops * 50000) / time / 1000)); // Normalized
        }, 300);
    });
}

function runNetworkTest() {
    return new Promise(async resolve => {
        let totalTime = 0;
        const samples = 3;
        
        // Take 3 samples to average out jitter
        for(let i=0; i<samples; i++) {
            const start = performance.now();
            try {
                // Fetch small resource with cache busting
                await fetch(window.location.href + "?t=" + Math.random(), { cache: "no-store" });
                totalTime += (performance.now() - start);
            } catch(e) {
                totalTime += 999;
            }
        }
        
        resolve(Math.round(totalTime / samples));
    });
}

function runGpuTest() {
    return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        const duration = 4000; // Increased to 4000ms (4s)
        const canvas = document.getElementById('bgCanvas');
        const ctx = canvas.getContext('2d');
        
        function loop() {
            frames++;
            
            // Heavier render load: Draw 50 semi-transparent rects per frame
            for(let i=0; i<50; i++) {
                ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, 255, 0.05)`;
                ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 100, 100);
            }

            if (performance.now() - start < duration) {
                requestAnimationFrame(loop);
            } else {
                // Average FPS over 4 seconds
                const fps = Math.round(frames / (duration / 1000));
                resolve(fps);
            }
        }
        loop();
    });
}

/* --- UI UPDATERS --- */
function updateStatus(id, text) {
    const el = document.getElementById(`status${id}`);
    el.innerText = text;
    el.classList.add('active');
}

function updateResult(id, val, unit) {
    const el = document.getElementById(`status${id}`);
    el.innerText = "DONE";
    el.classList.remove('active');
    el.classList.add('done');
    document.getElementById(`res${id}`).innerText = val;
    document.getElementById(`bar${id}`).style.width = "100%";
}

function resetCard(id) {
    document.getElementById(`status${id}`).innerText = "IDLE";
    document.getElementById(`status${id}`).className = 'card-status';
    document.getElementById(`res${id}`).innerText = "0";
    document.getElementById(`bar${id}`).style.width = "0%";
}

function calculateTotalScore() {
    // Adjusted weighting for new durations
    // CPU Normal: 800-1500
    // Mem Normal: 500-1000
    // GPU: 30-144
    
    let netBonus = Math.max(0, (500 - scores.net) * 2);
    
    let total = Math.floor(
        (scores.cpu * 2) + 
        (scores.mem * 4) + 
        (scores.gpu * 150) + 
        netBonus
    );
    
    animateValue(totalScoreEl, 0, total, 2000);
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function initCanvas() {
    const canvas = document.getElementById('bgCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
