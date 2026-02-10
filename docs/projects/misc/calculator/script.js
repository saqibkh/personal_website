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
let currentValue = 0; 

/* --- KEYBOARD INPUT LISTENER --- */
document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Prevent default scrolling/action for calculator keys
    if (['Enter', ' ', 'Backspace', 'Escape'].includes(key)) e.preventDefault();

    // Map specific keyboard keys to functions
    if (key === 'Enter' || key === '=') calculate();
    else if (key === 'Escape') clearDisplay();
    else if (key === 'Backspace') deleteChar();
    else {
        // Find matching button to trigger animation & logic
        // We use uppercase for Hex keys (a -> A)
        const btn = document.querySelector(`button[data-key="${key.toUpperCase()}"]`) || 
                    document.querySelector(`button[data-key="${key}"]`);
        
        if (btn && !btn.disabled && btn.offsetParent !== null) { // Check if visible and enabled
            btn.click();
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 100);
        }
    }
});

/* --- CORE FUNCTIONS --- */

// Insert character into display
function insert(char) {
    // Validate Programmer Mode Input
    if (currentMode === 'programmer') {
        if (currentBase === 2 && !['0','1'].includes(char)) return;
        if (currentBase === 8 && !['0','1','2','3','4','5','6','7'].includes(char)) return;
        if (currentBase === 10 && !/[0-9]/.test(char)) return;
        // Hex allows all chars passed by buttons
    }

    // Prevent multiple decimals
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
            updateBaseViews(); // Just commit the value
            return;
        }

        let expression = display.innerText;
        history.innerText = expression + ' =';

        // Sanitize visual operators to JS math
        expression = expression.replace(/×/g, '*')
                               .replace(/÷/g, '/')
                               .replace(/\^/g, '**'); 

        // Evaluate
        // Note: For production, a parser is safer than eval, but eval is standard for simple JS calcs
        let result = eval(expression);

        // Handle precision errors (e.g., 0.1 + 0.2)
        if (!Number.isInteger(result)) {
            result = parseFloat(result.toFixed(8));
        }

        display.innerText = result;

    } catch (error) {
        display.innerText = 'Error';
        setTimeout(clearDisplay, 1500);
    }
}

// Scientific Math Functions
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
        case 'ln': res = Math.log(val); break; // Natural log
        case 'log': res = Math.log10(val); break; // Base 10
        case 'sqrt': res = Math.sqrt(val); break;
        case 'abs': res = Math.abs(val); break;
        case 'pi': insert(Math.PI.toFixed(6)); return;
        case 'e': insert(Math.E.toFixed(6)); return;
        case 'pow': insert('^'); return;
    }

    // Update display with result (rounded to avoid long decimals)
    if (!isNaN(res)) {
        display.innerText = parseFloat(res.toFixed(8));
    } else {
        display.innerText = "Error";
    }
}

/* --- PROGRAMMER MODE LOGIC --- */

function setBase(base) {
    // 1. Convert current visual value to Integer (from OLD base)
    let currentValStr = display.innerText;
    let val = parseInt(currentValStr, currentBase);
    
    if (isNaN(val)) val = 0;

    // 2. Switch Base State
    currentBase = base;

    // 3. Render Value in NEW Base
    display.innerText = val.toString(currentBase).toUpperCase();

    // 4. Update UI Active State
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

        if (currentBase === 2) { 
            if (nums.includes(key) && key > 1) enabled = false;
            if (hexKeys.includes(key)) enabled = false;
        } 
        else if (currentBase === 8) {
            if (nums.includes(key) && key > 7) enabled = false;
            if (hexKeys.includes(key)) enabled = false;
        }
        else if (currentBase === 10) {
            if (hexKeys.includes(key)) enabled = false;
        }
        // Hex allows everything

        btn.disabled = !enabled;
    });

    // Decimal point is invalid in Integer programming modes
    btnDot.disabled = true;
}


/* --- MODE SWITCHING --- */

function setMode(mode) {
    currentMode = mode;
    currentBase = 10; 
    clearDisplay();

    // UI Updates
    document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    // Reset Classes
    keypad.className = 'keypad';
    container.className = 'calc-container';
    baseSwitcher.style.display = 'none';
    btnDot.disabled = false;

    // Hide special keys
    document.querySelectorAll('.sci-key, .prog-key').forEach(k => k.classList.remove('visible'));

    // Apply Mode Specifics
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
