/**
 * ============================================
 * CALCULATOR ENGINE
 * Pure logic functions for math operations.
 * ============================================
 */

const operate = (operator, a, b) => {
    // Convert to numbers to be safe
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    switch (operator) {
        case '+': return numA + numB;
        case '-': return numA - numB;
        case '*': return numA * numB;
        case '/': return numB === 0 ? "ERROR" : numA / numB;
        case '%': return numA % numB;
        default: return numB;
    }
};

/**
 * ============================================
 * UI CONTROLLER & STATE
 * ============================================
 */

// DOM Elements
const display = document.getElementById('display');
const buttonsContainer = document.querySelector('.buttons');

// Calculator State
const state = {
    currentInput: '0',       // The number currently being typed
    firstOperand: null,      // The stored first number
    operator: null,          // The pending operator
    waitingForSecond: false, // Are we waiting for the second number?
    shouldResetScreen: false,// Should the next digit clear the screen?
    hasError: false          // Is the calculator in an error state?
};

// --- Functions to Update State and Display ---

function updateDisplay() {
    // Format the current input for display
    let displayValue = state.currentInput;

    // Round long decimals
    if (displayValue.includes('.')) {
        const parts = displayValue.split('.');
        if (parts[1].length > 8) {
            displayValue = parseFloat(displayValue).toFixed(8);
        }
    }

    // Add thousand separators for readability (optional, but professional)
    // We keep it simple here, but you could format further.

    display.textContent = displayValue;
}

function resetCalculator() {
    state.currentInput = '0';
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecond = false;
    state.shouldResetScreen = false;
    state.hasError = false;
    updateDisplay();
}

function handleNumberInput(number) {
    // If we are in an error state, reset first
    if (state.hasError) resetCalculator();

    // If we just finished an operation, start a new number
    if (state.shouldResetScreen || state.waitingForSecond) {
        state.currentInput = number === '.' ? '0.' : number;
        state.shouldResetScreen = false;
        state.waitingForSecond = false;
    } else {
        // Prevent multiple decimal points
        if (number === '.' && state.currentInput.includes('.')) return;

        // Append digit (replace leading 0 unless it's a decimal)
        if (state.currentInput === '0' && number !== '.') {
            state.currentInput = number;
        } else {
            state.currentInput += number;
        }
    }
    updateDisplay();
}

function handleOperatorInput(nextOperator) {
    if (state.hasError) return;

    const inputValue = parseFloat(state.currentInput);

    // Scenario 1: We already have a first operand and an operator, and the user is pressing a new operator.
    // We need to calculate the intermediate result first.
    if (state.operator && state.waitingForSecond === false) {
        const result = operate(state.operator, state.firstOperand, inputValue);
        
        if (result === "ERROR") {
            handleError();
            return;
        }

        state.currentInput = String(Math.round(result * 100000000) / 100000000); // Round to prevent floating point mess
        state.firstOperand = result;
        updateDisplay();
    } else {
        // Scenario 2: First operator press
        state.firstOperand = inputValue;
    }

    state.operator = nextOperator;
    state.waitingForSecond = true;
    state.shouldResetScreen = true;
}

function handleEquals() {
    if (state.hasError || state.operator === null || state.waitingForSecond) return;

    const secondOperand = parseFloat(state.currentInput);
    const result = operate(state.operator, state.firstOperand, secondOperand);

    if (result === "ERROR") {
        handleError();
        return;
    }

    // Format result to avoid floating point errors (e.g., 0.1 + 0.2 = 0.30000000000000004)
    state.currentInput = String(Math.round(result * 100000000) / 100000000);
    
    // Reset for next operation
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecond = false;
    state.shouldResetScreen = true; // Next number press will reset
    
    updateDisplay();
}

function handleBackspace() {
    if (state.hasError || state.shouldResetScreen || state.waitingForSecond) return;
    
    if (state.currentInput.length === 1 || (state.currentInput.length === 2 && state.currentInput.startsWith('-'))) {
        state.currentInput = '0';
    } else {
        state.currentInput = state.currentInput.slice(0, -1);
    }
    updateDisplay();
}

function handleError() {
    state.currentInput = "ERROR: Div by 0";
    state.hasError = true;
    state.firstOperand = null;
    state.operator = null;
    state.waitingForSecond = false;
    state.shouldResetScreen = true;
    updateDisplay();
}

// --- Event Handling ---

// 1. Mouse/Touch Click Handling (Event Delegation)
buttonsContainer.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    if (button.dataset.number) {
        handleNumberInput(button.dataset.number);
    } else if (button.dataset.operator) {
        handleOperatorInput(button.dataset.operator);
    } else if (button.dataset.action) {
        switch (button.dataset.action) {
            case 'clear': resetCalculator(); break;
            case 'equals': handleEquals(); break;
            case 'backspace': handleBackspace(); break;
        }
    }
});

// 2. Keyboard Support (Extra Credit)
window.addEventListener('keydown', (e) => {
    const key = e.key;
    let buttonToPress = null;

    // Map keyboard keys to data attributes
    if (/[0-9]/.test(key)) {
        handleNumberInput(key);
        buttonToPress = document.querySelector(`[data-number="${key}"]`);
    } else if (key === '.') {
        handleNumberInput('.');
        buttonToPress = document.querySelector(`[data-number="."]`);
    } else if (['+', '-', '*', '/', '%'].includes(key)) {
        handleOperatorInput(key);
        buttonToPress = document.querySelector(`[data-operator="${key}"]`);
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault(); // Prevent form submission or other default actions
        handleEquals();
        buttonToPress = document.querySelector(`[data-action="equals"]`);
    } else if (key === 'Backspace') {
        handleBackspace();
        buttonToPress = document.querySelector(`[data-action="backspace"]`);
    } else if (key.toLowerCase() === 'c' || key === 'Escape') {
        resetCalculator();
        buttonToPress = document.querySelector(`[data-action="clear"]`);
    }

    // Add visual feedback for keyboard press
    if (buttonToPress) {
        buttonToPress.classList.add('active-key');
        setTimeout(() => buttonToPress.classList.remove('active-key'), 100);
    }
});

// Initialize
updateDisplay();
