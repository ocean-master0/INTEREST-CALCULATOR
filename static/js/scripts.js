document.addEventListener('DOMContentLoaded', () => {
    const interestForm = document.getElementById('interest-form');
    const interestResult = document.getElementById('interest-result');
    const fortuneDiv = document.getElementById('fortune');
    const badgeDiv = document.getElementById('badge');
    const interestShare = document.getElementById('interest-share');
    const themeToggle = document.getElementById('theme-toggle');
    const interestProgress = document.getElementById('interest-progress');
    const expressionSpan = document.getElementById('expression');
    const resultSpan = document.getElementById('result');

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        themeToggle.querySelector('.theme-icon').style.transform = document.body.classList.contains('dark-mode') ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Real-time Input Validation (Interest Calculator)
    const validateInput = (id) => {
        const input = document.getElementById(id);
        input.addEventListener('input', () => {
            const errorSpan = document.getElementById(`${id}-error`);
            if (!input.value || input.value < 0) {
                errorSpan.textContent = `${id.charAt(0).toUpperCase() + id.slice(1)} must be a positive number`;
            } else {
                errorSpan.textContent = '';
            }
        });
    };
    ['principal', 'rate', 'time'].forEach(validateInput);

    // Slider Toggle for Interest Type
    const sliderTrack = document.querySelector('.slider-track');
    const interestTypeInput = document.getElementById('interest_type');
    sliderTrack.addEventListener('click', (e) => {
        const option = e.target.closest('.slider-option');
        if (option) {
            const type = option.dataset.type;
            interestTypeInput.value = type;
            sliderTrack.classList.toggle('active-compound', type === 'compound');
            document.getElementById('frequency-group').style.display = type === 'compound' ? 'block' : 'none';
        }
    });

    // Voice Input
    const micButtons = document.querySelectorAll('.mic-btn');
    micButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetInput = document.getElementById(btn.dataset.target);
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';
            recognition.start();
            recognition.onresult = (event) => {
                const value = parseFloat(event.results[0][0].transcript);
                if (!isNaN(value)) {
                    targetInput.value = value;
                    targetInput.dispatchEvent(new Event('input'));
                }
            };
        });
    });

    // Random Scenario Generator
    document.getElementById('random-scenario').addEventListener('click', () => {
        const scenarios = [
            { principal: 50000, rate: 6.5, time: 5, unit: 'Years', type: 'compound', freq: 'Annually' },
            { principal: 20000, rate: 4, time: 2, unit: 'Years', type: 'simple' },
            { principal: 100000, rate: 8, time: 10, unit: 'Years', type: 'compound', freq: 'Quarterly' }
        ];
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        document.getElementById('principal').value = scenario.principal;
        document.getElementById('rate').value = scenario.rate;
        document.getElementById('time').value = scenario.time;
        document.getElementById('time_unit').value = scenario.unit;
        interestTypeInput.value = scenario.type;
        sliderTrack.classList.toggle('active-compound', scenario.type === 'compound');
        if (scenario.type === 'compound') {
            document.getElementById('frequency').value = scenario.freq || 'Annually';
            document.getElementById('frequency-group').style.display = 'block';
        } else {
            document.getElementById('frequency-group').style.display = 'none';
        }
        ['principal', 'rate', 'time'].forEach(id => document.getElementById(id).dispatchEvent(new Event('input')));
    });

    // Interest Form Submission
    interestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        interestProgress.style.width = '0%';
        interestProgress.style.display = 'block';
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            interestProgress.style.width = `${progress}%`;
            if (progress >= 100) clearInterval(progressInterval);
        }, 100);

        const formData = new FormData(interestForm);
        const response = await fetch('/calculate_interest', { method: 'POST', body: formData });
        const data = await response.json();

        setTimeout(() => {
            interestProgress.style.display = 'none';
            if (data.error) {
                interestResult.innerHTML = `<p class="error">${data.error}</p>`;
                fortuneDiv.innerHTML = '';
                badgeDiv.innerHTML = '';
                interestShare.innerHTML = '';
            } else {
                animateResult(interestResult, data.result);
                fortuneDiv.innerHTML = data.fortune;
                badgeDiv.innerHTML = `Badge Unlocked: ${data.badge}`;
                interestShare.innerHTML = `
                    <a href="${data.share_link}" target="_blank">Share Link</a>
                    <button id="download-image">Download as Image</button>
                `;
                document.getElementById('download-image').addEventListener('click', downloadResultAsImage);
            }
        }, 1000);
    });

    // Clear Interest Form
    document.getElementById('clear-interest').addEventListener('click', () => {
        interestForm.reset();
        interestResult.innerHTML = '';
        fortuneDiv.innerHTML = '';
        badgeDiv.innerHTML = '';
        interestShare.innerHTML = '';
        interestProgress.style.display = 'none';
        document.getElementById('frequency-group').style.display = 'none';
        interestTypeInput.value = 'simple';
        sliderTrack.classList.remove('active-compound');
        ['principal', 'rate', 'time'].forEach(id => document.getElementById(`${id}-error`).textContent = '');
    });

    // Normal Calculator Logic
    let expression = '';
    let result = '';

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.value;

            if (value === 'C') {
                expression = '';
                result = '';
                updateDisplay();
            } else if (value === '=') {
                try {
                    result = evaluateExpression(expression);
                    updateDisplay(true);
                    expression = result; // Allow further operations on result
                } catch (e) {
                    result = 'Error';
                    updateDisplay(true);
                }
            } else if (value === '±') {
                if (expression && !/[+\-×÷]/.test(expression.slice(-1))) {
                    const lastNumberMatch = expression.match(/(-?\d*\.?\d+)$/);
                    if (lastNumberMatch) {
                        const lastNumber = lastNumberMatch[0];
                        const toggledNumber = (parseFloat(lastNumber) * -1).toString();
                        expression = expression.slice(0, -lastNumber.length) + toggledNumber;
                    }
                }
                updateDisplay();
            } else if (value === '%') {
                try {
                    const lastNumberMatch = expression.match(/(-?\d*\.?\d+)$/);
                    if (lastNumberMatch) {
                        const lastNumber = lastNumberMatch[0];
                        const percentage = (parseFloat(lastNumber) / 100).toString();
                        expression = expression.slice(0, -lastNumber.length) + percentage;
                    }
                    updateDisplay();
                } catch (e) {
                    result = 'Error';
                    updateDisplay(true);
                }
            } else {
                // Ensure digits and operators are spaced correctly
                if (/[\d.]/.test(value) && !/[\d.]/.test(expression.slice(-1))) {
                    expression += value;
                } else if (/[+\-×÷]/.test(value) && !/[+\-×÷]/.test(expression.slice(-1))) {
                    expression += ` ${value} `;
                } else {
                    expression += value;
                }
                updateDisplay();
            }
        });
    });

    function updateDisplay(showResult = false) {
        if (showResult) {
            expressionSpan.textContent = expression.trim();
            expressionSpan.classList.remove('highlight');
            resultSpan.textContent = formatResult(result);
            resultSpan.classList.add('highlight');
        } else {
            expressionSpan.textContent = expression.trim();
            expressionSpan.classList.add('highlight');
            resultSpan.textContent = '';
            resultSpan.classList.remove('highlight');
        }
    }

    function formatResult(num) {
        const parsed = parseFloat(num);
        if (isNaN(parsed)) return num;
        return parsed % 1 === 0 ? parsed.toString() : parsed.toFixed(4).replace(/\.?0+$/, '');
    }

    function evaluateExpression(expr) {
        // Replace readable symbols with JS equivalents and normalize spaces
        expr = expr.replace(/\s+/g, ' ').trim()
                   .replace(/×/g, '*')
                   .replace(/÷/g, '/');

        // Tokenize and evaluate using a simple parser
        const tokens = expr.match(/([0-9.]+|\+|\-|\*|\/)/g) || [];
        let stack = [];
        let output = [];

        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2
        };

        tokens.forEach(token => {
            if (!isNaN(token)) {
                output.push(parseFloat(token));
            } else if (token in precedence) {
                while (stack.length && stack[stack.length - 1] in precedence && 
                       precedence[stack[stack.length - 1]] >= precedence[token]) {
                    output.push(stack.pop());
                }
                stack.push(token);
            }
        });

        while (stack.length) {
            output.push(stack.pop());
        }

        // Evaluate RPN
        const evalStack = [];
        output.forEach(token => {
            if (typeof token === 'number') {
                evalStack.push(token);
            } else {
                const b = evalStack.pop();
                const a = evalStack.pop();
                switch (token) {
                    case '+': evalStack.push(a + b); break;
                    case '-': evalStack.push(a - b); break;
                    case '*': evalStack.push(a * b); break;
                    case '/': 
                        if (b === 0) throw new Error('Division by zero');
                        evalStack.push(a / b); 
                        break;
                }
            }
        });

        return evalStack[0];
    }

    // Animate Result (Interest Calculator)
    function animateResult(element, resultText) {
        element.innerHTML = resultText.replace(/(\d+\.\d+)/g, '<span class="count">$1</span>');
        document.querySelectorAll('.count').forEach(span => {
            const target = parseFloat(span.textContent);
            let current = 0;
            const increment = target / 50;
            const interval = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(interval);
                }
                span.textContent = current.toFixed(2);
            }, 20);
        });
    }

    // Download Result as Image
    function downloadResultAsImage() {
        html2canvas(document.querySelector('.container')).then(canvas => {
            const link = document.createElement('a');
            link.download = 'calculator_result.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // Keyboard Accessibility
    document.querySelectorAll('button, input, select').forEach(element => {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && element.tagName === 'BUTTON') {
                element.click();
            }
        });
    });
});