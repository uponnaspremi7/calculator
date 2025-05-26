document.addEventListener('DOMContentLoaded', () => {
    const displayValueElement = document.getElementById('display-value');
    const buttons = document.querySelectorAll('.btn');

    let currentInput = '0';
    let previousInput = null;
    let operator = null;
    let shouldResetDisplay = false;
    let lastButtonClickedIsOperator = false; // To handle continuous operator presses

    function updateDisplay() {
        let displayString = currentInput;

        // Handle 'Error' display specifically
        if (displayString === 'Error') {
            displayValueElement.textContent = 'Error';
            return;
        }

        // Convert to number for proper formatting and precision handling
        let num = parseFloat(displayString);

        // Check for NaN or Infinity results from scientific functions or division by zero
        if (isNaN(num)) {
            displayValueElement.textContent = 'Error';
            return;
        }
        if (!isFinite(num) && num > 0) {
            displayValueElement.textContent = 'Infinity';
            return;
        }
        if (!isFinite(num) && num < 0) {
            displayValueElement.textContent = '-Infinity';
            return;
        }

        // Limit the number of digits to prevent overflow on display
        // Use toPrecision for consistent number of significant digits
        // Avoid `toExponential` for numbers that fit within reasonable display limits to improve readability
        if (Math.abs(num) > 999999999999 || (Math.abs(num) < 0.000001 && num !== 0)) {
            displayString = num.toExponential(6); // Use 6 decimal places for exponential
        } else {
            // Trim trailing zeros after decimal point for better display
            displayString = num.toString();
            if (displayString.includes('.')) {
                displayString = displayString.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
            }
            // Further precision control if needed, but careful not to truncate user input
            // For example, limit to 12 significant digits for display if not in exponential form
            if (displayString.length > 15) { // Arbitrary limit for long numbers
                displayString = num.toPrecision(12);
            }
        }

        displayValueElement.textContent = displayString;
    }

    function calculate() {
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(current)) {
            // This case should ideally be prevented earlier or result in an error state
            return 'Error';
        }

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
                if (current === 0) return 'Error'; // Division by zero
                result = prev / current;
                break;
            default:
                return current; // If no operator, return current
        }

        // Use toPrecision for consistent precision after calculation, handling potential floating point issues
        // It's crucial to convert back to Number as toPrecision returns a string
        return Number(result.toPrecision(12));
    }

    const scientificFunctions = {
        sin: x => Math.sin(x * Math.PI / 180), // Convert degrees to radians for trigonometric functions
        cos: x => Math.cos(x * Math.PI / 180),
        tan: x => Math.tan(x * Math.PI / 180),
        log: x => (x > 0) ? Math.log10(x) : NaN, // Handle log of non-positive numbers
        ln: x => (x > 0) ? Math.log(x) : NaN, // Handle ln of non-positive numbers
        sqrt: x => (x >= 0) ? Math.sqrt(x) : NaN, // Handle sqrt of negative numbers
        square: x => Math.pow(x, 2),
        exp: x => Math.exp(x),
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const number = button.dataset.number;
            const op = button.dataset.operator;
            const id = button.id;
            const fn = button.dataset.fn;

            // Reset error state if any button other than C is pressed after an error
            if (currentInput === 'Error' && id !== 'clear') {
                currentInput = '0';
                previousInput = null;
                operator = null;
                shouldResetDisplay = false;
                lastButtonClickedIsOperator = false;
            }

            if (number !== undefined) {
                if (currentInput === '0' || shouldResetDisplay) {
                    currentInput = number;
                    shouldResetDisplay = false;
                } else if (currentInput.length < 15) { // Limit input length
                    currentInput += number;
                }
                lastButtonClickedIsOperator = false;
            } else if (id === 'decimal') {
                if (shouldResetDisplay) {
                    currentInput = '0.';
                    shouldResetDisplay = false;
                } else if (!currentInput.includes('.') && currentInput.length < 15) {
                    currentInput += '.';
                }
                lastButtonClickedIsOperator = false;
            } else if (op) {
                // Prevent applying operator multiple times without a number in between
                if (lastButtonClickedIsOperator && previousInput !== null) {
                    operator = op; // Just update the operator
                } else if (operator && previousInput !== null && !shouldResetDisplay) {
                    const result = calculate();
                    if (result === 'Error' || isNaN(result) || !isFinite(result)) {
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
                lastButtonClickedIsOperator = true;
            } else if (id === 'equals') {
                if (operator && previousInput !== null) {
                    const result = calculate();
                    if (result === 'Error' || isNaN(result) || !isFinite(result)) {
                        currentInput = 'Error';
                    } else {
                        currentInput = String(result);
                    }
                    operator = null;
                    previousInput = null;
                    shouldResetDisplay = true;
                }
                lastButtonClickedIsOperator = false;
            } else if (id === 'clear') {
                currentInput = '0';
                previousInput = null;
                operator = null;
                shouldResetDisplay = false;
                lastButtonClickedIsOperator = false;
            } else if (id === 'toggle-sign') {
                if (currentInput !== '0' && currentInput !== 'Error') {
                    currentInput = String(parseFloat(currentInput) * -1);
                    // Ensure precision is maintained after toggling sign
                    if (currentInput.includes('.')) {
                        currentInput = String(Number(parseFloat(currentInput).toPrecision(12)));
                    }
                }
                lastButtonClickedIsOperator = false;
            } else if (id === 'percentage') {
                if (currentInput !== 'Error') {
                    const value = parseFloat(currentInput);
                    if (!isNaN(value)) {
                        currentInput = String(Number((value / 100).toPrecision(12)));
                        shouldResetDisplay = true;
                    }
                }
                lastButtonClickedIsOperator = false;
            } else if (fn) {
                if (currentInput !== 'Error') {
                    const value = parseFloat(currentInput);
                    if (!isNaN(value)) {
                        const result = scientificFunctions[fn](value);
                        if (isNaN(result) || !isFinite(result)) {
                            currentInput = 'Error'; // Set error if result is NaN or Infinity
                        } else {
                            currentInput = String(Number(result.toPrecision(12)));
                        }
                        shouldResetDisplay = true;
                    }
                }
                lastButtonClickedIsOperator = false;
            }

            // Only update display if not already in an error state
            if (currentInput !== 'Error') {
                updateDisplay();
            } else {
                displayValueElement.textContent = 'Error'; // Ensure display shows Error immediately
            }
        });
    });

    // Initial display update when the page loads
    updateDisplay();
});
