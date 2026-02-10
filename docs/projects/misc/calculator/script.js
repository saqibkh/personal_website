/* DOM Elements */
const display = document.getElementById('display');
const history = document.getElementById('history');
const keypad = document.getElementById('keypad');
const container = document.getElementById('calcContainer');
const baseSwitcher = document.getElementById('baseSwitcher');
const btnDot = document.getElementById('btnDot');

/* State Variables */
let currentMode = 'standard';
let currentBase = 10;

/* --- KEYBOARD INPUT LISTENER --- */
document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (['Enter', ' ', 'Backspace', 'Escape'].includes(key)) e.preventDefault();

    if (key === 'Enter' || key === '=') calculate();
    else if (key === 'Escape') clearDisplay();
    else if (key === 'Backspace') deleteChar();
    else {
        // Find matching button (case insensitive for hex)
        const btn = document.querySelector(`button[data-key="${key.toUpperCase()}"]`) || 
                    document.querySelector(`button[data-key="${key}"]`);
        
        // Only click if button is currently visible on screen
        if (btn && !btn.disabled && btn.offsetParent !== null) {
            btn.click();
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 100);
        }
    }
});

/* --- CORE FUNCTIONS --- */
function insert(char) {
    if (currentMode === 'programmer') {
        if (currentBase === 2 && !['0','1'].includes(char)) return;
        if (currentBase === 8 && !['0','1','2','3','4','5','6','7'].includes(char)) return;
        if (currentBase === 10 && !/[0-9]/.test(char)) return;
    }
    
    if (char === '.' && display.innerText.includes('.')) return;

    if (display.innerText === '0' && char !== '.' && !['+','-','*','/'].includes(char)) {
        display.innerText = char;
    } else {
        display.innerText += char;
    }

    if (currentMode === 'programmer') updateBaseViews();
}

function clearDisplay() {
    display.innerText = '0';
    history.innerText = '';
    if (currentMode === 'programmer') updateBaseViews();
}

function deleteChar() {
    if (display.innerText.length > 1) {
        display.innerText = display.innerText.slice(0, -1);
    } else {
        display.innerText = '0';
    }
    if (currentMode === 'programmer') updateBaseViews();
}

function toggleSign() {
    if (display.innerText === '0') return;
    if (display.innerText.startsWith('-')) {
        display.innerText = display.innerText.slice(1);
    } else {
        display.innerText = '-' + display.innerText;
    }
    if (currentMode === 'programmer') updateBaseViews();
}

function calculate() {
    try {
        if (currentMode === 'programmer') {
            updateBaseViews();
            return;
        }

        let expression = display.innerText;
        history.innerText = expression + ' =';
        expression = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**'); 
        
        let result = eval(expression);
        
        if (!Number.isInteger(result)) {
            result = parseFloat(result.toFixed(8));
        }
        display.innerText = result;

    } catch (error) {
        display.innerText = 'Error';
        setTimeout(clearDisplay, 1500);
    }
}

function handleMath(func) {
    let val = parseFloat(display.innerText);
    let res = 0;

    switch(func) {
        case 'sin': res = Math.sin(val); break;
        case 'cos': res = Math.cos(val); break;
        case 'tan': res = Math.tan(val); break;
        case 'asin': res = Math.asin(val); break;
        case 'acos': res = Math.acos(val); break;
        case 'atan': res = Math.atan(val); break;
        case 'ln': res = Math.log(val); break;
        case 'log': res = Math.log10(val); break;
        case 'sqrt': res = Math.sqrt(val); break;
        case 'pow': insert('^'); return;
        case 'pi': insert(Math.PI.toFixed(6)); return;
    }

    if (!isNaN(res)) display.innerText = parseFloat(res.toFixed(8));
    else display.innerText = "Error";
}

/* --- PROGRAMMER MODE LOGIC --- */
function setBase(base) {
    let currentValStr = display.innerText;
    let val = parseInt(currentValStr, currentBase);
    if (isNaN(val)) val = 0;

    currentBase = base;
    display.innerText = val.toString(currentBase).toUpperCase();

    document.querySelectorAll('.base-row').forEach(row => row.classList.remove('active'));
    if(base === 16) document.getElementById('rowHex').classList.add('active');
    if(base === 10) document.getElementById('rowDec').classList.add('active');
    if(base === 8) document.getElementById('rowOct').classList.add('active');
    if(base === 2) document.getElementById('rowBin').classList.add('active');

    updateKeypadState();
}

function updateBaseViews() {
    let val = parseInt(display.innerText, currentBase);
    if (isNaN(val)) val = 0;
    document.getElementById('valHex').innerText = val.toString(16).toUpperCase();
    document.getElementById('valDec').innerText = val.toString(10);
    document.getElementById('valOct').innerText = val.toString(8);
    document.getElementById('valBin').innerText = val.toString(2);
}

function updateKeypadState() {
    const buttons = document.querySelectorAll('button[data-key]');
    const hexKeys = ['A','B','C','D','E','F'];
    const nums = ['0','1','2','3','4','5','6','7','8','9'];

    buttons.forEach(btn => {
        const key = btn.getAttribute('data-key');
        let enabled = true;
        if (currentBase === 2 && (nums.includes(key) && key > 1 || hexKeys.includes(key))) enabled = false;
        else if (currentBase === 8 && (nums.includes(key) && key > 7 || hexKeys.includes(key))) enabled = false;
        else if (currentBase === 10 && hexKeys.includes(key)) enabled = false;
        
        btn.disabled = !enabled;
    });
    btnDot.disabled = true; // No decimals in this simple programmer mode
}

/* --- MODE SWITCHING --- */
function setMode(mode) {
    currentMode = mode;
    currentBase = 10; 
    clearDisplay();

    // UI Updates
    document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    // Reset Styles
    keypad.className = 'keypad';
    container.className = 'calc-container';
    baseSwitcher.style.display = 'none';
    btnDot.disabled = false;
    document.querySelectorAll('.sci-key, .prog-key').forEach(k => k.classList.remove('visible'));

    // Apply New Mode
    if (mode === 'scientific') {
        container.classList.add('wide-mode');
        keypad.classList.add('scientific-grid');
        document.querySelectorAll('.sci-key').forEach(k => k.classList.add('visible'));
    } 
    else if (mode === 'programmer') {
        container.classList.add('wide-mode');
        keypad.classList.add('programmer-grid');
        baseSwitcher.style.display = 'block';
        document.querySelectorAll('.prog-key').forEach(k => k.classList.add('visible'));
        setBase(10);
    }
}
