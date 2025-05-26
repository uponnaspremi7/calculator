document.addEventListener('DOMContentLoaded', () => {
    const displayValueElement = document.getElementById('display-value');
    const buttons = document.querySelectorAll('.btn');

    let currentInput = '0';
    let previousInput = null;
    let operator = null;
    let shouldResetDisplay = false;

    function updateDisplay() {
        let displayString = currentInput;
        // Basic formatting for large numbers (optional, can be improved)
        if (displayString.length > 9 && !displayString.includes('e')) {
            if (displayString.includes('.')) {
                const parts = displayString.split('.');
                if (parts[0].length > 9) {
                    displayString = parseFloat(displayString).toExponential(4);
                } else {
                    displayString = parseFloat(displayString).toFixed(Math.max(0, 9 - parts[0].length -1 ));
                }
            } else {
                 displayString = parseFloat(displayString).toExponential(4);
            }
        }
        displayValueElement.textContent = displayString;
    }

    function calculate() {
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(current)) return null;

        let result;
        switch (operator) {
            case 'add':
                result = prev + current;
                break;
            case 'subtract':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                if (current === 0) {
                    return 'Error';
                }
                result = prev / current;
                break;
            default:
                return current; // Should not happen if operator is set
        }
        // Handle potential floating point inaccuracies for simple cases
        // For more complex scenarios, a BigNumber library would be better
        return Number(result.toPrecision(10)); // Limit precision
    }


    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action; // For potential future use
            const number = button.dataset.number;
            const op = button.dataset.operator;
            const id = button.id;

            if (number !== undefined) {
                if (currentInput === '0' || shouldResetDisplay) {
                    currentInput = number;
                    shouldResetDisplay = false;
                } else {
                    if (currentInput.length < 15) { // Limit input length
                        currentInput += number;
                    }
                }
            } else if (id === 'decimal') {
                if (shouldResetDisplay) {
                    currentInput = '0.';
                    shouldResetDisplay = false;
                } else if (!currentInput.includes('.')) {
                    if (currentInput.length < 15) {
                         currentInput += '.';
                    }
                }
            } else if (op) {
                if (operator && previousInput !== null && !shouldResetDisplay) {
                    const result = calculate();
                    if (result === 'Error') {
                        currentInput = 'Error';
                        operator = null;
                        previousInput = null;
                        updateDisplay();
                        return;
                    }
                    currentInput = String(result);
                    previousInput = String(result);
                } else {
                    previousInput = currentInput;
                }
                operator = op;
                shouldResetDisplay = true;
            } else if (id === 'equals') {
                if (operator && previousInput !== null) {
                    const result = calculate();
                    currentInput = String(result);
                    operator = null;
                    previousInput = null; // Reset for next independent calculation
                    shouldResetDisplay = true; // Next number will start a new input
                }
            } else if (id === 'clear') {
                currentInput = '0';
                previousInput = null;
                operator = null;
                shouldResetDisplay = false;
            } else if (id === 'toggle-sign') {
                if (currentInput !== '0' && currentInput !== 'Error') {
                    currentInput = String(parseFloat(currentInput) * -1);
                }
            } else if (id === 'percentage') {
                if (currentInput !== 'Error') {
                    currentInput = String(parseFloat(currentInput) / 100);
                    shouldResetDisplay = true; // Typically, after %, next op or number
                }
            } else if (id === 'extra-btn') {
                // Placeholder for the icon button functionality
                console.log("Extra button clicked - not implemented");
            }

            if (currentInput === 'Error') {
                // Don't allow further operations on Error state until cleared
            } else {
                updateDisplay();
            }
        });
    });

    updateDisplay(); // Initial display
});
