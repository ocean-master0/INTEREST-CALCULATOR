/**
 * Advanced Calculator Application
 * Features: Interest Calculator (Simple/Compound) + Normal Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // Service Worker Registration (PWA)
    // ============================================================
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('ServiceWorker registered:', reg.scope))
            .catch(err => console.error('ServiceWorker failed:', err));
    }

    // ============================================================
    // DOM Element References
    // ============================================================
    
    const elements = {
        // Interest Calculator
        interestForm: document.getElementById('interest-form'),
        interestResult: document.getElementById('interest-result'),
        interestProgress: document.getElementById('interest-progress'),
        interestTypeInput: document.getElementById('interest_type'),
        frequencyGroup: document.getElementById('frequency-group'),
        sliderTrack: document.querySelector('.slider-track'),
        resultActions: document.getElementById('result-actions'),
        shareButton: document.getElementById('share-result'),
        clearButton: document.getElementById('clear-interest'),
        
        // Normal Calculator
        calcDisplay: document.getElementById('calc-display'),
        expressionSpan: document.getElementById('expression'),
        resultSpan: document.getElementById('result')
    };

    // Calculator state
    let calcState = {
        expression: '',
        isResultState: false
    };

    // ============================================================
    // Tab Navigation
    // ============================================================
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ============================================================
    // Input Formatting (Indian Number System)
    // ============================================================
    
    function formatInputValue(input) {
        let value = input.value.replace(/,/g, '');
        
        // Allow only numbers and one decimal point
        if (!/^\d*\.?\d*$/.test(value)) {
            value = value.replace(/[^\d.]/g, '');
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
        }

        if (value) {
            const parts = value.split('.');
            parts[0] = parseInt(parts[0] || 0).toLocaleString('en-IN');
            input.value = parts.join('.');
        } else {
            input.value = '';
        }

        // Clear error message
        const errorSpan = document.getElementById(`${input.id}-error`);
        if (errorSpan) errorSpan.textContent = '';
    }

    ['principal', 'rate', 'time'].forEach(id => {
        document.getElementById(id).addEventListener('input', e => formatInputValue(e.target));
    });

    // ============================================================
    // Interest Type Toggle (Simple/Compound)
    // ============================================================
    
    elements.sliderTrack.addEventListener('click', (e) => {
        const option = e.target.closest('.slider-option');
        if (!option) return;
        
        const type = option.dataset.type;
        elements.interestTypeInput.value = type;
        elements.sliderTrack.classList.toggle('active-compound', type === 'compound');
        elements.frequencyGroup.style.display = type === 'compound' ? 'block' : 'none';
    });

    // ============================================================
    // Interest Calculator Form Submission
    // ============================================================
    
    elements.interestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show progress bar
        elements.interestProgress.style.width = '0%';
        elements.interestProgress.style.display = 'block';
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            elements.interestProgress.style.width = `${progress}%`;
            if (progress >= 100) clearInterval(progressInterval);
        }, 100);

        try {
            const formData = new FormData(elements.interestForm);
            const response = await fetch('/calculate_interest', { method: 'POST', body: formData });
            const data = await response.json();

            setTimeout(() => {
                elements.interestProgress.style.display = 'none';
                
                if (data.error) {
                    elements.interestResult.innerHTML = `<p class="error">${data.error}</p>`;
                    elements.resultActions.style.display = 'none';
                } else {
                    elements.interestResult.innerHTML = data.result;
                    elements.resultActions.style.display = 'flex';
                    
                    // Store result for sharing
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.result.replace(/<br>/g, '\n');
                    window.currentResultText = tempDiv.textContent || '';
                }
            }, 1000);
        } catch (error) {
            elements.interestProgress.style.display = 'none';
            elements.interestResult.innerHTML = '<p class="error">An error occurred. Please try again.</p>';
        }
    });

    // ============================================================
    // Share Result
    // ============================================================
    
    elements.shareButton.addEventListener('click', async () => {
        const shareData = {
            title: 'Interest Calculation Result',
            text: window.currentResultText,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.currentResultText);
                const originalHTML = elements.shareButton.innerHTML;
                elements.shareButton.innerHTML = 'Copied to Clipboard!';
                setTimeout(() => elements.shareButton.innerHTML = originalHTML, 2000);
            } catch (err) {
                alert('Could not copy to clipboard');
            }
        }
    });

    // ============================================================
    // Clear Interest Form
    // ============================================================
    
    elements.clearButton.addEventListener('click', () => {
        elements.interestForm.reset();
        elements.interestResult.innerHTML = '';
        elements.interestProgress.style.display = 'none';
        elements.resultActions.style.display = 'none';
        elements.frequencyGroup.style.display = 'none';
        elements.interestTypeInput.value = 'simple';
        elements.sliderTrack.classList.remove('active-compound');
        ['principal', 'rate', 'time'].forEach(id => {
            document.getElementById(`${id}-error`).textContent = '';
        });
    });

    // ============================================================
    // Normal Calculator Logic
    // ============================================================
    
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCalculatorButton(btn.dataset.value));
    });

    function handleCalculatorButton(value) {
        switch (value) {
            case 'C':
                calcState.expression = '';
                calcState.isResultState = false;
                updateCalculatorDisplay(false);
                break;
                
            case 'backspace':
                if (calcState.isResultState) {
                    calcState.expression = '';
                    calcState.isResultState = false;
                } else {
                    calcState.expression = calcState.expression.slice(0, -1);
                }
                updateCalculatorDisplay(false);
                break;
                
            case '=':
                updateCalculatorDisplay(true);
                calcState.isResultState = true;
                break;
                
            case '%':
                handlePercentage();
                break;
                
            default:
                handleInput(value);
                break;
        }
    }

    function handlePercentage() {
        const match = calcState.expression.match(/(-?\d*\.?\d+)$/);
        if (match) {
            const lastNumber = match[0];
            const percentage = (parseFloat(lastNumber) / 100).toString();
            calcState.expression = calcState.expression.slice(0, -lastNumber.length) + percentage;
        }
        if (calcState.isResultState) calcState.isResultState = false;
        updateCalculatorDisplay(false);
    }

    function handleInput(value) {
        const isNumber = /[\d.]/.test(value);
        const isOperator = /[+\-×÷]/.test(value);

        if (calcState.isResultState) {
            if (isNumber) {
                calcState.expression = value;
            } else {
                try {
                    const prevResult = evaluateExpression(calcState.expression);
                    calcState.expression = prevResult.toString() + ` ${value} `;
                } catch {
                    calcState.expression = value;
                }
            }
            calcState.isResultState = false;
        } else {
            if (value === '.') {
                const lastToken = calcState.expression.split(/[^0-9.]/).pop();
                if (lastToken.includes('.')) return;
            }

            if (isNumber) {
                calcState.expression += value;
            } else if (isOperator) {
                if (/[+\-×÷]/.test(calcState.expression.slice(-1))) {
                    calcState.expression = calcState.expression.slice(0, -1) + ` ${value} `;
                } else {
                    calcState.expression += ` ${value} `;
                }
            } else {
                calcState.expression += value;
            }
        }
        updateCalculatorDisplay(false);
    }

    function updateCalculatorDisplay(isFinal) {
        elements.expressionSpan.textContent = formatExpression(calcState.expression);

        let value = '';
        try {
            if (calcState.expression) {
                value = evaluateExpression(calcState.expression);
            }
        } catch {
            value = '';
        }

        if (isFinal) {
            elements.calcDisplay.classList.remove('typing-mode');
            elements.resultSpan.textContent = value === '' ? 'Error' : formatNumber(value);
        } else {
            elements.calcDisplay.classList.add('typing-mode');
            elements.resultSpan.textContent = value !== '' ? formatNumber(value) : '';
        }
    }

    // ============================================================
    // Number Formatting Utilities
    // ============================================================
    
    function formatNumber(num) {
        if (num === 'Error' || (!num && num !== 0)) return num || '';
        const parsed = parseFloat(num);
        if (isNaN(parsed)) return num;
        return parsed.toLocaleString('en-IN', { maximumFractionDigits: 4 });
    }

    function formatExpression(expr) {
        return expr.replace(/\d+(\.\d+)?/g, match => {
            return parseFloat(match).toLocaleString('en-IN');
        });
    }

    function evaluateExpression(expr) {
        // Convert visual operators to JS operators
        let cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Security: Only allow numbers, operators, dots, and spaces
        if (/[^0-9+\-*/().\s]/.test(cleanExpr)) {
            throw new Error('Invalid Input');
        }
        
        return new Function('return ' + cleanExpr)();
    }

    // ============================================================
    // Keyboard Accessibility
    // ============================================================
    
    document.querySelectorAll('button, input, select').forEach(el => {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && el.tagName === 'BUTTON') {
                el.click();
            }
        });
    });
});