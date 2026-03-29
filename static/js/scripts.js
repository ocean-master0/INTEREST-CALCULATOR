/**
 * Advanced Calculator Application
 * Features: Interest Calculator, EMI Calculator, Comparison Mode, Normal Calculator
 * With History, Charts, PDF Export, WhatsApp Share, Sound Effects
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
        interestSkeleton: document.getElementById('interest-skeleton'),
        interestTypeInput: document.getElementById('interest_type'),
        frequencyGroup: document.getElementById('frequency-group'),
        sliderTrack: document.querySelector('.slider-track'),
        resultActions: document.getElementById('result-actions'),
        shareButton: document.getElementById('share-result'),
        whatsappButton: document.getElementById('whatsapp-share'),
        pdfButton: document.getElementById('download-pdf'),
        clearButton: document.getElementById('clear-interest'),
        breakdownContainer: document.getElementById('breakdown-container'),
        breakdownTable: document.getElementById('breakdown-table'),
        chartContainer: document.getElementById('chart-container'),
        
        // EMI Calculator
        emiForm: document.getElementById('emi-form'),
        emiResult: document.getElementById('emi-result'),
        emiSkeleton: document.getElementById('emi-skeleton'),
        emiBreakdown: document.getElementById('emi-breakdown'),
        emiMonthly: document.getElementById('emi-monthly'),
        emiTotalInterest: document.getElementById('emi-total-interest'),
        emiTotalPayment: document.getElementById('emi-total-payment'),
        emiChartContainer: document.getElementById('emi-chart-container'),
        emiWhatsapp: document.getElementById('emi-whatsapp'),
        emiPdf: document.getElementById('emi-pdf'),
        emiActions: document.getElementById('emi-actions'),
        clearEmi: document.getElementById('clear-emi'),
        
        // Comparison Mode
        compareForm: document.getElementById('compare-form'),
        compareResults: document.getElementById('compare-results'),
        compareSimpleInterest: document.getElementById('compare-simple-interest'),
        compareSimpleTotal: document.getElementById('compare-simple-total'),
        compareCompoundInterest: document.getElementById('compare-compound-interest'),
        compareCompoundTotal: document.getElementById('compare-compound-total'),
        compareDifference: document.getElementById('compare-difference-value'),
        compareChartContainer: document.getElementById('compare-chart-container'),
        clearCompare: document.getElementById('clear-compare'),
        
        // Normal Calculator
        calcDisplay: document.getElementById('calc-display'),
        expressionSpan: document.getElementById('expression'),
        resultSpan: document.getElementById('result'),
        
        // History Sidebar
        historySidebar: document.getElementById('history-sidebar'),
        historyOverlay: document.getElementById('history-overlay'),
        historyList: document.getElementById('history-list'),
        openHistory: document.getElementById('open-history'),
        closeHistory: document.getElementById('close-history'),
        clearHistory: document.getElementById('clear-history'),
        
        // Sound Toggle
        soundToggle: document.getElementById('sound-toggle'),
        soundOnIcon: document.getElementById('sound-on-icon'),
        soundOffIcon: document.getElementById('sound-off-icon'),
        clickSound: document.getElementById('click-sound'),
        
        // Date Mode
        dateModeToggle: document.getElementById('date-mode-toggle'),
        togglePill: document.getElementById('toggle-pill'),
        dtIcon: document.getElementById('dt-icon'),
        manualTimeGroup: document.getElementById('manual-time-group'),
        dateRangeGroup: document.getElementById('date-range-group'),
        startDateInput: document.getElementById('start-date'),
        endDateInput: document.getElementById('end-date'),
        calculatedPeriod: document.getElementById('calculated-period'),
        periodText: document.getElementById('period-text'),
        periodSubText: document.getElementById('period-sub-text')
    };

    // ============================================================
    // Application State
    // ============================================================
    
    let calcState = {
        expression: '',
        isResultState: false
    };
    
    let appState = {
        soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
        history: JSON.parse(localStorage.getItem('calcHistory') || '[]'),
        currentResult: null,
        currentEmiResult: null,
        interestChart: null,
        emiChart: null,
        compareChart: null,
        isDateMode: false
    };
    
    // Initialize sound icon
    updateSoundIcon();

    // ============================================================
    // Sound Effects
    // ============================================================
    
    function playClickSound() {
        if (appState.soundEnabled && elements.clickSound) {
            elements.clickSound.currentTime = 0;
            elements.clickSound.play().catch(() => {});
        }
    }
    
    function updateSoundIcon() {
        if (appState.soundEnabled) {
            elements.soundOnIcon?.classList.remove('hidden');
            elements.soundOffIcon?.classList.add('hidden');
        } else {
            elements.soundOnIcon?.classList.add('hidden');
            elements.soundOffIcon?.classList.remove('hidden');
        }
    }
    
    elements.soundToggle?.addEventListener('click', () => {
        appState.soundEnabled = !appState.soundEnabled;
        localStorage.setItem('soundEnabled', appState.soundEnabled);
        updateSoundIcon();
        playClickSound();
    });

    // ============================================================
    // Date Mode Toggle
    // ============================================================
    
    elements.dateModeToggle?.addEventListener('click', () => {
        playClickSound();
        appState.isDateMode = !appState.isDateMode;
        elements.dateModeToggle.setAttribute('aria-checked', appState.isDateMode);
        elements.togglePill?.classList.toggle('on', appState.isDateMode);
        elements.dateModeToggle?.classList.toggle('on', appState.isDateMode);
        elements.dtIcon?.classList.toggle('on', appState.isDateMode);
        
        if (appState.isDateMode) {
            elements.manualTimeGroup?.classList.add('hidden');
            elements.dateRangeGroup?.classList.add('visible');
            // Set default dates
            const today = new Date();
            if (elements.startDateInput && !elements.startDateInput.value) {
                elements.startDateInput.value = today.toISOString().split('T')[0];
            }
            if (elements.endDateInput && !elements.endDateInput.value) {
                const nextYear = new Date(today);
                nextYear.setFullYear(nextYear.getFullYear() + 1);
                elements.endDateInput.value = nextYear.toISOString().split('T')[0];
            }
            calculateDateDiff();
        } else {
            elements.manualTimeGroup?.classList.remove('hidden');
            elements.dateRangeGroup?.classList.remove('visible');
            elements.calculatedPeriod?.classList.add('hidden');
        }
    });
    
    function calculateDateDiff() {
        if (!elements.startDateInput?.value || !elements.endDateInput?.value) return null;
        
        const start = new Date(elements.startDateInput.value);
        const end = new Date(elements.endDateInput.value);
        
        if (end <= start) {
            elements.calculatedPeriod?.classList.add('hidden');
            return null;
        }
        
        const diffMs = end - start;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffYears = diffDays / 365;
        
        elements.calculatedPeriod?.classList.remove('hidden');
        
        if (diffDays < 30) {
            elements.periodText.textContent = `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.round((diffDays / 30) * 10) / 10;
            elements.periodText.textContent = `${months} months  ·  ${diffDays} days`;
        } else {
            const yrs = Math.floor(diffYears);
            const remDays = diffDays - (yrs * 365);
            let text = `${yrs} Year${yrs > 1 ? 's' : ''}`;
            if (remDays > 0) text += `  ·  ${diffDays.toLocaleString('en-IN')} days`;
            elements.periodText.textContent = text;
        }
        elements.periodSubText.textContent = 'Auto-calculated from selected dates';
        
        // Set hidden time fields for backend
        document.getElementById('time').value = diffDays;
        document.getElementById('time_unit').value = 'Days';
        
        return diffDays;
    }
    
    elements.startDateInput?.addEventListener('change', calculateDateDiff);
    elements.endDateInput?.addEventListener('change', calculateDateDiff);

    // ============================================================
    // Frequency Chips
    // ============================================================
    
    document.querySelectorAll('.freq-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            playClickSound();
            document.querySelectorAll('.freq-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const freqInput = document.getElementById('frequency');
            if (freqInput) freqInput.value = chip.dataset.value;
        });
    });

    // ============================================================
    // Bottom Tab Bar Navigation
    // ============================================================
    
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            
            const currentTab = document.querySelector('.tab-content.active')?.id;
            if (currentTab === 'interest' && appState.interestChart) {
                appState.interestChart.destroy(); appState.interestChart = null;
            } else if (currentTab === 'emi' && appState.emiChart) {
                appState.emiChart.destroy(); appState.emiChart = null;
            } else if (currentTab === 'compare' && appState.compareChart) {
                appState.compareChart.destroy(); appState.compareChart = null;
            }
            
            document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab)?.classList.add('active');
        });
    });

    // ============================================================
    // History Management
    // ============================================================
    
    function saveToHistory(type, data) {
        const entry = {
            id: Date.now(),
            type: type,
            data: data,
            date: new Date().toLocaleString('en-IN')
        };
        appState.history.unshift(entry);
        if (appState.history.length > 50) appState.history.pop();
        localStorage.setItem('calcHistory', JSON.stringify(appState.history));
        renderHistory();
    }
    
    function renderHistory() {
        if (!elements.historyList) return;
        
        if (appState.history.length === 0) {
            elements.historyList.innerHTML = '<p class="history-empty">No calculations yet</p>';
            return;
        }
        
        elements.historyList.innerHTML = appState.history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <button class="history-item-delete" data-id="${item.id}">✕</button>
                <div class="history-item-type">${item.type}</div>
                <div class="history-item-value">${item.data.summary || ''}</div>
                <div class="history-item-date">${item.date}</div>
            </div>
        `).join('');
        
        // Add delete handlers
        elements.historyList.querySelectorAll('.history-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                appState.history = appState.history.filter(h => h.id !== id);
                localStorage.setItem('calcHistory', JSON.stringify(appState.history));
                renderHistory();
            });
        });
    }
    
    elements.openHistory?.addEventListener('click', () => {
        elements.historySidebar?.classList.add('open');
        elements.historyOverlay?.classList.add('open');
        playClickSound();
    });
    
    elements.closeHistory?.addEventListener('click', () => {
        elements.historySidebar?.classList.remove('open');
        elements.historyOverlay?.classList.remove('open');
    });
    
    elements.historyOverlay?.addEventListener('click', () => {
        elements.historySidebar?.classList.remove('open');
        elements.historyOverlay?.classList.remove('open');
    });
    
    elements.clearHistory?.addEventListener('click', () => {
        if (confirm('Clear all history?')) {
            appState.history = [];
            localStorage.setItem('calcHistory', JSON.stringify(appState.history));
            renderHistory();
        }
    });
    
    // Initial render
    renderHistory();

    // Tab Navigation handled by Bottom Tab Bar above

    // ============================================================
    // Input Validation & Formatting
    // ============================================================
    
    function validateInput(input, min = 0, max = Infinity) {
        const wrapper = input.closest('.input-wrapper');
        const value = parseFloat(input.value.replace(/,/g, ''));
        
        if (isNaN(value) || value < min || value > max) {
            wrapper?.classList.remove('valid');
            wrapper?.classList.add('invalid');
            return false;
        } else {
            wrapper?.classList.remove('invalid');
            wrapper?.classList.add('valid');
            return true;
        }
    }
    
    function formatInputValue(input) {
        let value = input.value.replace(/,/g, '');
        
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

        const errorSpan = document.getElementById(`${input.id}-error`);
        if (errorSpan) errorSpan.textContent = '';
        
        validateInput(input, 0);
    }

    // Attach validation to all number inputs
    ['principal', 'rate', 'time', 'emi-principal', 'emi-rate', 'emi-tenure', 
     'compare-principal', 'compare-rate', 'compare-time'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', e => formatInputValue(e.target));
            el.addEventListener('blur', e => validateInput(e.target, 0));
        }
    });

    // ============================================================
    // Interest Type Toggle (Simple/Compound)
    // ============================================================
    
    elements.sliderTrack?.addEventListener('click', (e) => {
        const option = e.target.closest('.slider-option');
        if (!option) return;
        
        playClickSound();
        const type = option.dataset.type;
        elements.interestTypeInput.value = type;
        elements.sliderTrack.classList.toggle('active-compound', type === 'compound');
        elements.frequencyGroup.style.display = type === 'compound' ? 'block' : 'none';
    });

    // ============================================================
    // Interest Calculator Form Submission
    // ============================================================
    
    elements.interestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        playClickSound();
        
        // Date mode validation
        if (appState.isDateMode) {
            const diff = calculateDateDiff();
            if (!diff || diff <= 0) {
                elements.interestResult.innerHTML = '<p class="error">Please select a valid date range</p>';
                return;
            }
        }
        
        // Show skeleton
        elements.interestSkeleton?.classList.remove('hidden');
        elements.interestResult.innerHTML = '';
        elements.resultActions?.classList.add('hidden');
        elements.breakdownContainer?.classList.add('hidden');
        elements.chartContainer?.classList.add('hidden');
        
        // Show progress bar
        elements.interestProgress.style.width = '0%';
        elements.interestProgress.style.display = 'block';
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            elements.interestProgress.style.width = `${progress}%`;
            if (progress >= 100) clearInterval(progressInterval);
        }, 80);

        try {
            const formData = new FormData(elements.interestForm);
            const response = await fetch('/calculate_interest', { method: 'POST', body: formData });
            const data = await response.json();

            setTimeout(() => {
                elements.interestProgress.style.display = 'none';
                elements.interestSkeleton?.classList.add('hidden');
                
                if (data.error) {
                    elements.interestResult.innerHTML = `<p class="error">${data.error}</p>`;
                    elements.resultActions?.classList.add('hidden');
                } else {
                    elements.interestResult.innerHTML = data.result;
                    elements.resultActions?.classList.remove('hidden');
                    
                    // Store result for sharing
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.result.replace(/<br>/g, '\n');
                    appState.currentResult = {
                        text: tempDiv.textContent || '',
                        principal: parseFloat(formData.get('principal').replace(/,/g, '')),
                        rate: parseFloat(formData.get('rate').replace(/,/g, '')),
                        time: parseFloat(formData.get('time').replace(/,/g, '')),
                        timeUnit: formData.get('time_unit'),
                        type: formData.get('interest_type')
                    };
                    
                    // Generate breakdown & chart for compound interest
                    if (formData.get('interest_type') === 'compound') {
                        generateBreakdownTable(appState.currentResult);
                        generateInterestChart(appState.currentResult);
                    }
                    
                    // Save to history
                    saveToHistory('Interest', {
                        summary: `₹${appState.currentResult.principal.toLocaleString('en-IN')} @ ${appState.currentResult.rate}%`,
                        ...appState.currentResult
                    });
                }
            }, 800);
        } catch (error) {
            elements.interestProgress.style.display = 'none';
            elements.interestSkeleton?.classList.add('hidden');
            elements.interestResult.innerHTML = '<p class="error">An error occurred. Please try again.</p>';
        }
    });

    // ============================================================
    // Breakdown Table Generation (with Frequency Support)
    // ============================================================
    
    function generateBreakdownTable(result) {
        if (!elements.breakdownTable) return;
        
        const tbody = elements.breakdownTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        let years = result.time;
        if (result.timeUnit === 'Months') years = result.time / 12;
        if (result.timeUnit === 'Days') years = result.time / 365;
        
        const yearsInt = Math.ceil(Math.min(years, 30)); // Limit to 30 years
        let balance = result.principal;
        const annualRate = result.rate / 100;
        
        // Get compounding frequency from form
        const frequencySelect = document.getElementById('frequency');
        const frequency = frequencySelect ? frequencySelect.value : 'Annually';
        
        // Compounding periods per year
        const periodsMap = {
            'Annually': 1,
            'Semi-Annually': 2,
            'Quarterly': 4,
            'Monthly': 12
        };
        const n = periodsMap[frequency] || 1;
        const ratePerPeriod = annualRate / n;
        
        for (let i = 1; i <= yearsInt; i++) {
            const openingBalance = balance;
            // Compound n times per year
            balance = openingBalance * Math.pow(1 + ratePerPeriod, n);
            const interest = balance - openingBalance;
            
            tbody.innerHTML += `
                <tr>
                    <td>${i}</td>
                    <td>₹${openingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>₹${interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td>₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
            `;
        }
        
        elements.breakdownContainer?.classList.remove('hidden');
    }

    // ============================================================
    // Chart Generation
    // ============================================================
    
    function generateInterestChart(result) {
        if (!elements.chartContainer || typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('interest-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Destroy previous chart
        if (appState.interestChart) appState.interestChart.destroy();
        
        let years = result.time;
        if (result.timeUnit === 'Months') years = result.time / 12;
        if (result.timeUnit === 'Days') years = result.time / 365;
        
        const yearsInt = Math.ceil(Math.min(years, 20));
        const labels = Array.from({length: yearsInt + 1}, (_, i) => `Year ${i}`);
        const principalData = Array(yearsInt + 1).fill(result.principal);
        const totalData = [result.principal];
        
        let balance = result.principal;
        for (let i = 1; i <= yearsInt; i++) {
            balance = balance * (1 + result.rate / 100);
            totalData.push(balance);
        }
        
        appState.interestChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Principal',
                        data: principalData,
                        borderColor: '#68BA7F',
                        borderWidth: 2.5,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return 'rgba(104,186,127,0.1)';
                            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            g.addColorStop(0, 'rgba(104,186,127,0.25)');
                            g.addColorStop(1, 'rgba(104,186,127,0.02)');
                            return g;
                        },
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#68BA7F',
                        pointBorderColor: '#253D2C',
                        pointBorderWidth: 2,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#CFFFDC',
                        pointHoverBorderColor: '#2E6F40',
                        pointHoverBorderWidth: 3,
                        borderDash: [6, 3]
                    },
                    {
                        label: 'Total Amount',
                        data: totalData,
                        borderColor: '#CFFFDC',
                        borderWidth: 3,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return 'rgba(207,255,220,0.1)';
                            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            g.addColorStop(0, 'rgba(207,255,220,0.3)');
                            g.addColorStop(0.7, 'rgba(46,111,64,0.08)');
                            g.addColorStop(1, 'rgba(46,111,64,0.01)');
                            return g;
                        },
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#CFFFDC',
                        pointBorderColor: '#253D2C',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#68BA7F',
                        pointHoverBorderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        labels: {
                            color: '#CFFFDC',
                            font: { size: 11, weight: '600', family: 'DM Sans' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(37,61,44,0.92)',
                        titleColor: '#CFFFDC',
                        bodyColor: '#68BA7F',
                        borderColor: 'rgba(104,186,127,0.3)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        titleFont: { size: 12, weight: '700', family: 'DM Sans' },
                        bodyFont: { size: 11, family: 'DM Mono' },
                        displayColors: true,
                        boxPadding: 4,
                        callbacks: {
                            label: (item) => `${item.dataset.label}: Rs. ${item.raw.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#68BA7F', font: { size: 10, family: 'DM Sans' } },
                        grid: { color: 'rgba(104,186,127,0.08)', drawBorder: false }
                    },
                    y: {
                        ticks: {
                            color: '#68BA7F',
                            font: { size: 10, family: 'DM Mono' },
                            callback: (v) => v >= 100000 ? (v/100000).toFixed(1)+'L' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v
                        },
                        grid: { color: 'rgba(104,186,127,0.08)', drawBorder: false }
                    }
                }
            }
        });
        
        elements.chartContainer?.classList.remove('hidden');
    }

    // ============================================================
    // EMI Calculator
    // ============================================================
    
    elements.emiForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        
        elements.emiSkeleton?.classList.remove('hidden');
        elements.emiResult.innerHTML = '';
        elements.emiBreakdown?.classList.add('hidden');
        elements.emiChartContainer?.classList.add('hidden');
        elements.emiActions?.classList.add('hidden');
        
        const principal = parseFloat(document.getElementById('emi-principal').value.replace(/,/g, ''));
        const rate = parseFloat(document.getElementById('emi-rate').value.replace(/,/g, ''));
        let tenure = parseFloat(document.getElementById('emi-tenure').value.replace(/,/g, ''));
        const tenureUnit = document.getElementById('emi-tenure-unit').value;
        
        // Convert to months
        if (tenureUnit === 'Years') tenure *= 12;
        
        setTimeout(() => {
            elements.emiSkeleton?.classList.add('hidden');
            
            if (isNaN(principal) || isNaN(rate) || isNaN(tenure) || principal <= 0 || rate <= 0 || tenure <= 0) {
                elements.emiResult.innerHTML = '<p class="error">Please enter valid values</p>';
                return;
            }
            
            // EMI Calculation: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
            const monthlyRate = rate / 12 / 100;
            const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
            const totalPayment = emi * tenure;
            const totalInterest = totalPayment - principal;
            
            elements.emiResult.innerHTML = `<p>Monthly EMI: <strong>₹${emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong></p>`;
            
            elements.emiMonthly.textContent = `₹${emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
            elements.emiTotalInterest.textContent = `₹${totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
            elements.emiTotalPayment.textContent = `₹${totalPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
            
            elements.emiBreakdown?.classList.remove('hidden');
            elements.emiActions?.classList.remove('hidden');
            
            // Store for sharing
            appState.currentEmiResult = {
                principal, rate, tenure, emi, totalInterest, totalPayment,
                text: `EMI Calculator Result\nLoan: ₹${principal.toLocaleString('en-IN')}\nRate: ${rate}% p.a.\nTenure: ${tenure} months\n\nMonthly EMI: ₹${emi.toLocaleString('en-IN', {maximumFractionDigits: 0})}\nTotal Interest: ₹${totalInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}\nTotal Payment: ₹${totalPayment.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
            };
            
            // Generate EMI Chart
            generateEmiChart(principal, totalInterest);
            
            // Save to history
            saveToHistory('EMI', {
                summary: `₹${emi.toLocaleString('en-IN', {maximumFractionDigits: 0})}/month`,
                ...appState.currentEmiResult
            });
        }, 500);
    });
    
    function generateEmiChart(principal, interest) {
        if (!elements.emiChartContainer || typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('emi-chart')?.getContext('2d');
        if (!ctx) return;
        
        if (appState.emiChart) appState.emiChart.destroy();
        
        appState.emiChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Interest'],
                datasets: [{
                    data: [principal, interest],
                    backgroundColor: ['#68BA7F', '#2E6F40'],
                    borderWidth: 0,
                    hoverBackgroundColor: ['#CFFFDC', '#68BA7F'],
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#CFFFDC',
                            font: { size: 11, weight: '600', family: 'DM Sans' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(37,61,44,0.92)',
                        titleColor: '#CFFFDC',
                        bodyColor: '#68BA7F',
                        borderColor: 'rgba(104,186,127,0.3)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        titleFont: { size: 12, weight: '700', family: 'DM Sans' },
                        bodyFont: { size: 11, family: 'DM Mono' },
                        callbacks: {
                            label: (item) => ` Rs. ${item.raw.toLocaleString('en-IN', {maximumFractionDigits: 0})} (${((item.raw / (principal + interest)) * 100).toFixed(1)}%)`
                        }
                    }
                }
            }
        });
        
        elements.emiChartContainer?.classList.remove('hidden');
    }
    
    elements.clearEmi?.addEventListener('click', () => {
        playClickSound();
        elements.emiForm?.reset();
        elements.emiResult.innerHTML = '';
        elements.emiBreakdown?.classList.add('hidden');
        elements.emiChartContainer?.classList.add('hidden');
        elements.emiActions?.classList.add('hidden');
        if (appState.emiChart) appState.emiChart.destroy();
        
        ['emi-principal', 'emi-rate', 'emi-tenure'].forEach(id => {
            const el = document.getElementById(id);
            el?.closest('.input-wrapper')?.classList.remove('valid', 'invalid');
        });
    });

    // ============================================================
    // Comparison Mode
    // ============================================================
    
    elements.compareForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        
        const principal = parseFloat(document.getElementById('compare-principal').value.replace(/,/g, ''));
        const rate = parseFloat(document.getElementById('compare-rate').value.replace(/,/g, ''));
        const time = parseFloat(document.getElementById('compare-time').value.replace(/,/g, ''));
        
        if (isNaN(principal) || isNaN(rate) || isNaN(time) || principal <= 0 || rate <= 0 || time <= 0) {
            return;
        }
        
        // Simple Interest
        const simpleInterest = (principal * rate * time) / 100;
        const simpleTotal = principal + simpleInterest;
        
        // Compound Interest (annually)
        const compoundTotal = principal * Math.pow(1 + rate / 100, time);
        const compoundInterest = compoundTotal - principal;
        
        const difference = compoundInterest - simpleInterest;
        
        elements.compareSimpleInterest.textContent = `₹${simpleInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareSimpleTotal.textContent = `₹${simpleTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareCompoundInterest.textContent = `₹${compoundInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareCompoundTotal.textContent = `₹${compoundTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareDifference.textContent = `₹${difference.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        
        elements.compareResults?.classList.remove('hidden');
        
        // Generate comparison chart
        generateCompareChart(principal, time, rate);
        
        // Save to history
        saveToHistory('Comparison', {
            summary: `Difference: ₹${difference.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
        });
    });
    
    function generateCompareChart(principal, years, rate) {
        if (!elements.compareChartContainer || typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById('compare-chart')?.getContext('2d');
        if (!ctx) return;
        
        if (appState.compareChart) appState.compareChart.destroy();
        
        const yearsInt = Math.ceil(Math.min(years, 20));
        const labels = Array.from({length: yearsInt + 1}, (_, i) => `Year ${i}`);
        
        const simpleData = [principal];
        const compoundData = [principal];
        
        for (let i = 1; i <= yearsInt; i++) {
            simpleData.push(principal + (principal * rate * i / 100));
            compoundData.push(principal * Math.pow(1 + rate / 100, i));
        }
        
        appState.compareChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Simple Interest',
                        data: simpleData,
                        borderColor: '#68BA7F',
                        borderWidth: 2.5,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return 'rgba(104,186,127,0.1)';
                            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            g.addColorStop(0, 'rgba(104,186,127,0.3)');
                            g.addColorStop(0.6, 'rgba(104,186,127,0.08)');
                            g.addColorStop(1, 'rgba(104,186,127,0.01)');
                            return g;
                        },
                        fill: true,
                        tension: 0.35,
                        pointRadius: 5,
                        pointBackgroundColor: '#68BA7F',
                        pointBorderColor: '#253D2C',
                        pointBorderWidth: 2.5,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: '#CFFFDC',
                        pointHoverBorderColor: '#2E6F40',
                        pointHoverBorderWidth: 3,
                        borderDash: [6, 3]
                    },
                    {
                        label: 'Compound Interest',
                        data: compoundData,
                        borderColor: '#CFFFDC',
                        borderWidth: 3,
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx: c, chartArea } = chart;
                            if (!chartArea) return 'rgba(207,255,220,0.1)';
                            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            g.addColorStop(0, 'rgba(207,255,220,0.35)');
                            g.addColorStop(0.5, 'rgba(104,186,127,0.12)');
                            g.addColorStop(1, 'rgba(46,111,64,0.02)');
                            return g;
                        },
                        fill: true,
                        tension: 0.35,
                        pointRadius: 6,
                        pointBackgroundColor: '#CFFFDC',
                        pointBorderColor: '#253D2C',
                        pointBorderWidth: 2.5,
                        pointHoverRadius: 9,
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#68BA7F',
                        pointHoverBorderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        labels: {
                            color: '#CFFFDC',
                            font: { size: 11, weight: '600', family: 'DM Sans' },
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(37,61,44,0.92)',
                        titleColor: '#CFFFDC',
                        bodyColor: '#68BA7F',
                        borderColor: 'rgba(104,186,127,0.3)',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12,
                        titleFont: { size: 12, weight: '700', family: 'DM Sans' },
                        bodyFont: { size: 11, family: 'DM Mono' },
                        displayColors: true,
                        boxPadding: 4,
                        callbacks: {
                            label: (item) => `${item.dataset.label}: Rs. ${item.raw.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#68BA7F', font: { size: 10, family: 'DM Sans' } },
                        grid: { color: 'rgba(104,186,127,0.08)', drawBorder: false }
                    },
                    y: {
                        ticks: {
                            color: '#68BA7F',
                            font: { size: 10, family: 'DM Mono' },
                            callback: (v) => v >= 100000 ? (v/100000).toFixed(1)+'L' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v
                        },
                        grid: { color: 'rgba(104,186,127,0.08)', drawBorder: false }
                    }
                }
            }
        });
        
        elements.compareChartContainer?.classList.remove('hidden');
    }
    
    // Clear Compare Form
    elements.clearCompare?.addEventListener('click', () => {
        playClickSound();
        elements.compareForm?.reset();
        elements.compareResults?.classList.add('hidden');
        elements.compareChartContainer?.classList.add('hidden');
        if (appState.compareChart) {
            appState.compareChart.destroy();
            appState.compareChart = null;
        }
        
        ['compare-principal', 'compare-rate', 'compare-time'].forEach(id => {
            const el = document.getElementById(id);
            el?.closest('.input-wrapper')?.classList.remove('valid', 'invalid');
        });
    });

    // ============================================================
    // Share & Export Functions
    // ============================================================
    
    elements.shareButton?.addEventListener('click', async () => {
        playClickSound();
        const text = appState.currentResult?.text || '';
        await shareContent('Interest Calculation', text);
    });
    
    elements.whatsappButton?.addEventListener('click', () => {
        playClickSound();
        const text = appState.currentResult?.text || '';
        shareToWhatsApp(text);
    });
    
    elements.emiWhatsapp?.addEventListener('click', () => {
        playClickSound();
        const text = appState.currentEmiResult?.text || '';
        shareToWhatsApp(text);
    });
    
    function shareToWhatsApp(text) {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
    
    async function shareContent(title, text) {
        const shareData = { title, text, url: window.location.href };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                alert('Copied to clipboard!');
            } catch (err) {
                alert('Could not copy to clipboard');
            }
        }
    }

    // ============================================================
    // PDF Generation
    // ============================================================
    
    elements.pdfButton?.addEventListener('click', () => {
        playClickSound();
        generatePDF('interest');
    });
    
    elements.emiPdf?.addEventListener('click', () => {
        playClickSound();
        generatePDF('emi');
    });
    
    function generatePDF(type) {
        if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
            alert('PDF generation not available. Please check your internet connection.');
            return;
        }
        
        const jspdfLib = window.jspdf || jspdf;
        const { jsPDF } = jspdfLib;
        const doc = new jsPDF();
        const pw = 210; // page width
        
        // Lush Forest Palette for PDF
        const c = {
            deep:    [37, 61, 44],     // #253D2C
            forest:  [46, 111, 64],    // #2E6F40
            sage:    [104, 186, 127],  // #68BA7F
            mint:    [207, 255, 220],  // #CFFFDC
            white:   [255, 255, 255],
            offWhite:[248, 253, 249],
            light:   [235, 248, 238],
            divider: [210, 235, 216],
            text:    [37, 61, 44],
            muted:   [110, 140, 118],
            gold:    [218, 175, 70],
        };
        
        // ── Header ────────────────────────────────
        // Deep green header band
        doc.setFillColor(...c.deep);
        doc.rect(0, 0, pw, 48, 'F');
        
        // Thin accent line below header
        doc.setFillColor(...c.sage);
        doc.rect(0, 48, pw, 1.5, 'F');
        
        // Decorative circles (subtle)
        doc.setFillColor(42, 72, 50);
        doc.circle(185, 10, 28, 'F');
        doc.setFillColor(40, 68, 48);
        doc.circle(198, 38, 16, 'F');
        
        // Logo icon
        doc.setFillColor(...c.sage);
        doc.roundedRect(18, 10, 28, 28, 5, 5, 'F');
        doc.setFillColor(...c.deep);
        doc.roundedRect(23, 15, 18, 8, 2, 2, 'F');
        doc.setFillColor(...c.white);
        doc.roundedRect(24, 16, 16, 6, 1, 1, 'F');
        doc.setFillColor(...c.deep);
        for (let r = 0; r < 2; r++)
            for (let cl = 0; cl < 3; cl++)
                doc.roundedRect(23 + cl * 6.5, 26 + r * 5.5, 4.5, 3.5, 1, 1, 'F');
        
        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(...c.white);
        doc.text('Financial Report', 54, 24);
        
        // Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...c.sage);
        doc.text('Interest Calculator  ·  Premium Statement', 54, 33);
        
        // Date pill
        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.setFillColor(...c.forest);
        doc.roundedRect(140, 14, 52, 10, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.mint);
        doc.text(dateStr, 166, 20.5, { align: 'center' });
        
        // ── Helpers ────────────────────────────────
        const sectionHead = (y, title) => {
            doc.setFillColor(...c.deep);
            doc.roundedRect(18, y, 174, 9, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...c.mint);
            doc.text(title, 24, y + 6.5);
            return y + 14;
        };
        
        const dataRow = (y, label, value, alt = false) => {
            if (alt) { doc.setFillColor(...c.light); doc.rect(18, y - 4.5, 174, 10, 'F'); }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(...c.muted);
            doc.text(label, 24, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...c.text);
            doc.text(value, 188, y, { align: 'right' });
            return y + 11;
        };
        
        const resultCard = (y, label, value, highlight = false) => {
            if (highlight) {
                doc.setFillColor(...c.forest);
                doc.roundedRect(18, y, 174, 24, 4, 4, 'F');
                // Decorative circle
                doc.setFillColor(56, 130, 76);
                doc.circle(182, y + 12, 14, 'F');
                doc.setFillColor(64, 140, 84);
                doc.circle(168, y + 12, 9, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(...c.mint);
                doc.text(label, 24, y + 8);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(...c.white);
                doc.text(value, 24, y + 20);
            } else {
                doc.setFillColor(...c.light);
                doc.roundedRect(18, y, 174, 22, 4, 4, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(...c.muted);
                doc.text(label, 24, y + 7);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(...c.text);
                doc.text(value, 24, y + 18);
            }
            return y + (highlight ? 30 : 27);
        };
        
        const infoCard = (x, y, w, title, value, accent) => {
            doc.setFillColor(...c.offWhite);
            doc.setDrawColor(...c.divider);
            doc.roundedRect(x, y, w, 30, 4, 4, 'FD');
            doc.setFillColor(...accent);
            doc.roundedRect(x, y, 3.5, 30, 2, 2, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...c.muted);
            doc.text(title, x + 10, y + 11);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...c.text);
            doc.text(value, x + 10, y + 23);
        };
        
        // ── Footer ────────────────────────────────
        const drawFooter = () => {
            const ph = doc.internal.pageSize.height;
            // Green gradient line
            doc.setDrawColor(...c.sage);
            doc.setLineWidth(0.8);
            doc.line(18, ph - 18, 192, ph - 18);
            // Small accent dot
            doc.setFillColor(...c.sage);
            doc.circle(18, ph - 18, 1.5, 'F');
            doc.circle(192, ph - 18, 1.5, 'F');
            // Text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...c.muted);
            doc.text('Generated by Advanced Financial Calculator  |  Lush Forest', 105, ph - 11, { align: 'center' });
            doc.text(`(c) ${new Date().getFullYear()}  |  This is an auto-generated report for reference only.`, 105, ph - 6.5, { align: 'center' });
        };
        
        // ── Content ────────────────────────────────
        let y = 58;
        
        if (type === 'interest' && appState.currentResult) {
            const r = appState.currentResult;
            if (!r.principal || !r.rate || !r.time) { alert('No calculation result. Please calculate first.'); return; }
            
            const timeConv = { 'Years': 1, 'Months': 1/12, 'Weeks': 1/52, 'Days': 1/365, 'Quarters': 0.25 };
            const tY = r.time * (timeConv[r.timeUnit] || 1);
            const freqSelect = document.getElementById('frequency');
            const freq = freqSelect ? freqSelect.value : 'Annually';
            const freqMap = { 'Annually': 1, 'Semi-Annually': 2, 'Quarterly': 4, 'Monthly': 12 };
            const n = freqMap[freq] || 1;
            let interest, total;
            if (r.type === 'compound') {
                total = r.principal * Math.pow(1 + (r.rate / 100) / n, n * tY);
                interest = total - r.principal;
            } else {
                interest = r.principal * r.rate * tY / 100;
                total = r.principal + interest;
            }
            const fmt = (v) => (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
            
            // Info cards
            infoCard(18, y, 56, 'PRINCIPAL', `Rs. ${fmt(r.principal)}`, c.sage);
            infoCard(77, y, 56, 'RATE (P.A.)', `${r.rate}%`, c.gold);
            infoCard(136, y, 56, 'DURATION', `${r.time} ${r.timeUnit}`, c.forest);
            y += 38;
            
            // Type badge
            doc.setFillColor(...(r.type === 'compound' ? c.forest : c.sage));
            doc.roundedRect(18, y, 52, 7, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...c.white);
            doc.text(r.type === 'compound' ? 'COMPOUND INTEREST' : 'SIMPLE INTEREST', 44, y + 5, { align: 'center' });
            if (r.type === 'compound') {
                doc.setFillColor(...c.gold);
                doc.roundedRect(74, y, 38, 7, 2, 2, 'F');
                doc.setTextColor(...c.deep);
                doc.text(freq.toUpperCase(), 93, y + 5, { align: 'center' });
            }
            y += 16;
            
            // Details
            y = sectionHead(y, 'CALCULATION DETAILS');
            y = dataRow(y, 'Principal Amount', `Rs. ${fmt(r.principal)}`, false);
            y = dataRow(y, 'Annual Interest Rate', `${r.rate}%`, true);
            y = dataRow(y, 'Time Period', `${r.time} ${r.timeUnit}`, false);
            y = dataRow(y, 'Type', r.type === 'compound' ? 'Compound Interest' : 'Simple Interest', true);
            if (r.type === 'compound') y = dataRow(y, 'Compounding', freq, false);
            y += 6;
            
            // Results
            y = sectionHead(y, 'RESULTS');
            y += 4;
            y = resultCard(y, 'Interest Earned', `Rs. ${fmt(interest)}`, false);
            y = resultCard(y, 'Total Amount (Principal + Interest)', `Rs. ${fmt(total)}`, true);
            
        } else if (type === 'emi' && appState.currentEmiResult) {
            const r = appState.currentEmiResult;
            const fmt = (v) => (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            
            // Info cards
            infoCard(18, y, 56, 'LOAN', `Rs. ${fmt(r.principal)}`, c.sage);
            infoCard(77, y, 56, 'RATE (P.A.)', `${r.rate}%`, c.gold);
            infoCard(136, y, 56, 'TENURE', `${r.tenure} mo`, c.forest);
            y += 38;
            
            // Badge
            doc.setFillColor(...c.deep);
            doc.roundedRect(18, y, 52, 7, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(...c.sage);
            doc.text('EMI CALCULATION', 44, y + 5, { align: 'center' });
            y += 16;
            
            // Details
            y = sectionHead(y, 'LOAN DETAILS');
            y = dataRow(y, 'Loan Principal', `Rs. ${fmt(r.principal)}`, false);
            y = dataRow(y, 'Annual Interest Rate', `${r.rate}%`, true);
            y = dataRow(y, 'Monthly Rate', `${(r.rate / 12).toFixed(3)}%`, false);
            y = dataRow(y, 'Tenure', `${r.tenure} months (${(r.tenure / 12).toFixed(1)} yrs)`, true);
            y += 6;
            
            // Payment Summary
            y = sectionHead(y, 'PAYMENT SUMMARY');
            y += 4;
            y = resultCard(y, 'Monthly EMI', `Rs. ${fmt(r.emi)}`, true);
            y = resultCard(y, 'Total Interest Payable', `Rs. ${fmt(r.totalInterest)}`, false);
            y = resultCard(y, 'Total Amount Payable', `Rs. ${fmt(r.totalPayment)}`, false);
            
            // Ratio bar
            y += 4;
            doc.setFillColor(...c.light);
            doc.roundedRect(18, y, 174, 18, 4, 4, 'F');
            doc.setFillColor(...c.divider);
            doc.roundedRect(24, y + 11, 164, 4, 2, 2, 'F');
            const pw2 = 164 * (r.principal / r.totalPayment);
            doc.setFillColor(...c.sage);
            doc.roundedRect(24, y + 11, pw2, 4, 2, 2, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...c.muted);
            doc.text(`Principal: ${((r.principal / r.totalPayment) * 100).toFixed(1)}%`, 24, y + 7);
            doc.text(`Interest: ${((r.totalInterest / r.totalPayment) * 100).toFixed(1)}%`, 188, y + 7, { align: 'right' });
        } else {
            alert('No calculation result available. Please calculate first.');
            return;
        }
        
        drawFooter();
        doc.save(`financial-report-${Date.now()}.pdf`);
    }

    // ============================================================
    // Clear Interest Form
    // ============================================================
    
    elements.clearButton?.addEventListener('click', () => {
        playClickSound();
        elements.interestForm?.reset();
        elements.interestResult.innerHTML = '';
        elements.interestProgress.style.display = 'none';
        elements.resultActions?.classList.add('hidden');
        elements.breakdownContainer?.classList.add('hidden');
        elements.chartContainer?.classList.add('hidden');
        elements.frequencyGroup.style.display = 'none';
        elements.interestTypeInput.value = 'simple';
        elements.sliderTrack?.classList.remove('active-compound');
        
        // Reset date mode
        appState.isDateMode = false;
        elements.togglePill?.classList.remove('on');
        elements.dateModeToggle?.classList.remove('on');
        elements.dtIcon?.classList.remove('on');
        elements.manualTimeGroup?.classList.remove('hidden');
        elements.dateRangeGroup?.classList.remove('visible');
        elements.calculatedPeriod?.classList.add('hidden');
        
        // Reset freq chips
        document.querySelectorAll('.freq-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.freq-chip[data-value="Annually"]')?.classList.add('active');
        const freqInput = document.getElementById('frequency');
        if (freqInput) freqInput.value = 'Annually';
        
        ['principal', 'rate', 'time'].forEach(id => {
            const el = document.getElementById(id);
            el?.closest('.input-wrapper')?.classList.remove('valid', 'invalid');
            const errorEl = document.getElementById(`${id}-error`);
            if (errorEl) errorEl.textContent = '';
        });
        
        if (appState.interestChart) appState.interestChart.destroy();
    });

    // ============================================================
    // Normal Calculator Logic
    // ============================================================
    
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            handleCalculatorButton(btn.dataset.value);
        });
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
                
                // Save to history
                if (calcState.expression) {
                    try {
                        const result = evaluateExpression(calcState.expression);
                        saveToHistory('Calculator', {
                            summary: `${formatExpression(calcState.expression)} = ${formatNumber(result)}`
                        });
                    } catch (err) {
                        console.warn('Could not save calculation to history:', err.message);
                    }
                }
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
        // Standard calculator percentage behavior:
        // - X + Y% = X + (X × Y/100)  →  100 + 50% = 150
        // - X - Y% = X - (X × Y/100)  →  100 - 50% = 50
        // - X × Y% = X × (Y/100)      →  100 × 50% = 50
        // - X ÷ Y% = X ÷ (Y/100)      →  100 ÷ 50% = 200
        // - Just Y% = Y/100           →  50% = 0.5
        
        const expr = calcState.expression;
        
        // Match pattern: number operator number (e.g., "100 + 50")
        const addSubMatch = expr.match(/(-?\d*\.?\d+)\s*([+\-])\s*(-?\d*\.?\d+)$/);
        const mulDivMatch = expr.match(/(-?\d*\.?\d+)\s*([×÷])\s*(-?\d*\.?\d+)$/);
        
        if (addSubMatch) {
            // Pattern: A + B% → A + (A × B/100) OR A - B% → A - (A × B/100)
            const baseNum = parseFloat(addSubMatch[1]);
            const operator = addSubMatch[2];
            const percentNum = parseFloat(addSubMatch[3]);
            const percentValue = baseNum * (percentNum / 100);
            
            const newExpr = expr.slice(0, addSubMatch.index) + 
                           baseNum + ` ${operator} ` + percentValue;
            calcState.expression = newExpr;
        } else if (mulDivMatch) {
            // Pattern: A × B% → A × (B/100) OR A ÷ B% → A ÷ (B/100)
            const baseNum = parseFloat(mulDivMatch[1]);
            const operator = mulDivMatch[2];
            const percentNum = parseFloat(mulDivMatch[3]);
            const percentValue = percentNum / 100;
            
            const newExpr = expr.slice(0, mulDivMatch.index) + 
                           baseNum + ` ${operator} ` + percentValue;
            calcState.expression = newExpr;
        } else {
            // Just a number: Y% = Y/100
            const match = expr.match(/(-?\d*\.?\d+)$/);
            if (match) {
                const lastNumber = match[0];
                const percentage = (parseFloat(lastNumber) / 100).toString();
                calcState.expression = expr.slice(0, -lastNumber.length) + percentage;
            }
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
                // Prevent multiple operators in a row (except minus for negative)
                const lastChar = calcState.expression.trim().slice(-1);
                if (/[+\-×÷]/.test(lastChar)) {
                    // If last char is operator, replace it (unless it's a minus after another operator)
                    if (value === '-' && /[×÷]/.test(lastChar)) {
                        // Allow negative number after × or ÷ (e.g., 5 × -3)
                        calcState.expression += ` ${value}`;
                    } else {
                        // Replace the last operator
                        calcState.expression = calcState.expression.trim().slice(0, -1) + ` ${value} `;
                    }
                } else if (calcState.expression.trim() === '' && value !== '-') {
                    // Don't allow operator at start (except minus)
                    return;
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
            elements.calcDisplay?.classList.remove('typing-mode');
            elements.resultSpan.textContent = value === '' ? 'Error' : formatNumber(value);
        } else {
            elements.calcDisplay?.classList.add('typing-mode');
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
        let cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Validate: only allow numbers, operators, parentheses, dots, spaces
        if (/[^0-9+\-*/().\s]/.test(cleanExpr)) {
            throw new Error('Invalid Input');
        }
        
        // Safe math parser instead of eval/new Function
        return safeMathEval(cleanExpr);
    }
    
    // Safe math expression evaluator without eval()
    function safeMathEval(expression) {
        const tokens = tokenize(expression);
        const postfix = infixToPostfix(tokens);
        return evaluatePostfix(postfix);
    }
    
    function tokenize(expr) {
        const tokens = [];
        let numBuffer = '';
        
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            
            if (char === ' ') continue;
            
            if (/[0-9.]/.test(char)) {
                numBuffer += char;
            } else {
                if (numBuffer) {
                    tokens.push(parseFloat(numBuffer));
                    numBuffer = '';
                }
                if (/[+\-*/()]/.test(char)) {
                    // Handle negative numbers
                    if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(')) {
                        numBuffer = '-';
                    } else {
                        tokens.push(char);
                    }
                }
            }
        }
        
        if (numBuffer) tokens.push(parseFloat(numBuffer));
        return tokens;
    }
    
    function infixToPostfix(tokens) {
        const output = [];
        const operators = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
        
        for (const token of tokens) {
            if (typeof token === 'number') {
                output.push(token);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                operators.pop(); // Remove '('
            } else if ('+-*/'.includes(token)) {
                while (operators.length && 
                       operators[operators.length - 1] !== '(' &&
                       precedence[operators[operators.length - 1]] >= precedence[token]) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }
        
        while (operators.length) output.push(operators.pop());
        return output;
    }
    
    function evaluatePostfix(postfix) {
        const stack = [];
        
        for (const token of postfix) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                switch (token) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': 
                        if (b === 0) {
                            throw new Error('Cannot divide by zero');
                        }
                        stack.push(a / b); 
                        break;
                }
            }
        }
        
        // Check for Infinity or NaN
        const result = stack[0];
        if (!isFinite(result)) {
            throw new Error('Result is too large or invalid');
        }
        
        return result;
    }

    // ============================================================
    // Keyboard Support for Normal Calculator
    // ============================================================
    
    document.addEventListener('keydown', (e) => {
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab?.id !== 'normal') return;
        
        const keyMap = {
            '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
            '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
            '.': '.', '+': '+', '-': '-', '*': '×', '/': '÷',
            'Enter': '=', '=': '=', 'Backspace': 'backspace',
            'Escape': 'C', 'Delete': 'C', '%': '%'
        };
        
        if (keyMap[e.key]) {
            e.preventDefault();
            playClickSound();
            handleCalculatorButton(keyMap[e.key]);
        }
    });
});