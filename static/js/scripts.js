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
        clickSound: document.getElementById('click-sound')
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
        compareChart: null
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

    // ============================================================
    // Tab Navigation
    // ============================================================
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playClickSound();
            
            // Destroy charts when switching tabs to prevent memory leaks
            const currentTab = document.querySelector('.tab-content.active')?.id;
            if (currentTab === 'interest' && appState.interestChart) {
                appState.interestChart.destroy();
                appState.interestChart = null;
            } else if (currentTab === 'emi' && appState.emiChart) {
                appState.emiChart.destroy();
                appState.emiChart = null;
            } else if (currentTab === 'compare' && appState.compareChart) {
                appState.compareChart.destroy();
                appState.compareChart = null;
            }
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

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
                        borderColor: '#4FD1C5',
                        backgroundColor: 'rgba(79, 209, 197, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Total Amount',
                        data: totalData,
                        borderColor: '#818CF8',
                        backgroundColor: 'rgba(129, 140, 248, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: '#a0aec0' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#718096' }, grid: { color: 'rgba(255,255,255,0.1)' }},
                    y: { ticks: { color: '#718096' }, grid: { color: 'rgba(255,255,255,0.1)' }}
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
                    backgroundColor: ['#4FD1C5', '#818CF8'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: { color: '#a0aec0', padding: 20 }
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
                        borderColor: '#4FD1C5',
                        backgroundColor: 'rgba(79, 209, 197, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Compound Interest',
                        data: compoundData,
                        borderColor: '#818CF8',
                        backgroundColor: 'rgba(129, 140, 248, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#a0aec0' }}
                },
                scales: {
                    x: { ticks: { color: '#718096' }, grid: { color: 'rgba(255,255,255,0.1)' }},
                    y: { ticks: { color: '#718096' }, grid: { color: 'rgba(255,255,255,0.1)' }}
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
        // Check for jsPDF availability (loaded from CDN as window.jspdf)
        if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
            alert('PDF generation not available. Please check your internet connection.');
            return;
        }
        
        const jspdfLib = window.jspdf || jspdf;
        const { jsPDF } = jspdfLib;
        const doc = new jsPDF();
        
        // Premium Color Palette
        const colors = {
            primary: [10, 22, 40],        // Dark navy background
            accent: [79, 209, 197],       // Teal accent
            accentDark: [56, 178, 172],   // Darker teal
            gold: [255, 193, 7],          // Gold highlight
            white: [255, 255, 255],
            lightGray: [240, 244, 248],
            mediumGray: [120, 130, 150],
            darkText: [30, 40, 60],
            success: [16, 185, 129],      // Green
            warning: [245, 158, 11],      // Orange
        };
        
        // Helper: Draw rounded rectangle
        const drawRoundedRect = (x, y, w, h, r, fill, stroke = null) => {
            doc.setFillColor(...fill);
            if (stroke) doc.setDrawColor(...stroke);
            doc.roundedRect(x, y, w, h, r, r, stroke ? 'FD' : 'F');
        };
        
        // Helper: Draw gradient-like header (simulated with rectangles)
        const drawHeader = () => {
            // Main header background
            doc.setFillColor(...colors.primary);
            doc.rect(0, 0, 210, 55, 'F');
            
            // Accent bar at bottom of header
            doc.setFillColor(...colors.accent);
            doc.rect(0, 52, 210, 3, 'F');
            
            // Decorative circles (subtle)
            doc.setFillColor(30, 45, 70);
            doc.circle(180, 15, 35, 'F');
            doc.setFillColor(25, 40, 65);
            doc.circle(195, 45, 20, 'F');
            
            // Logo/Icon area - Calculator symbol
            doc.setFillColor(...colors.accent);
            doc.roundedRect(15, 12, 30, 30, 4, 4, 'F');
            
            // Calculator icon lines
            doc.setFillColor(...colors.primary);
            doc.rect(20, 17, 20, 8, 'F'); // Screen
            doc.setFillColor(...colors.white);
            doc.rect(21, 18, 18, 6, 'F'); // Screen inner
            
            // Calculator buttons
            doc.setFillColor(...colors.primary);
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
                    doc.rect(20 + col * 7, 28 + row * 6, 5, 4, 'F');
                }
            }
            
            // Title text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(...colors.white);
            doc.text('Financial Calculator', 55, 25);
            
            // Subtitle
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(...colors.accent);
            doc.text('Premium Calculation Report', 55, 35);
            
            // Date badge
            const dateStr = new Date().toLocaleDateString('en-IN', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });
            doc.setFillColor(...colors.accent);
            doc.roundedRect(140, 28, 55, 12, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(...colors.primary);
            doc.text(dateStr, 167.5, 35.5, { align: 'center' });
        };
        
        // Helper: Draw info card
        const drawInfoCard = (x, y, w, h, title, value, icon, color) => {
            // Card background
            drawRoundedRect(x, y, w, h, 4, colors.white, colors.lightGray);
            
            // Colored left accent bar
            doc.setFillColor(...color);
            doc.roundedRect(x, y, 4, h, 2, 2, 'F');
            
            // Icon circle
            doc.setFillColor(...color);
            doc.circle(x + 18, y + h/2, 8, 'F');
            doc.setTextColor(...colors.white);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(icon, x + 18, y + h/2 + 3.5, { align: 'center' });
            
            // Title
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...colors.mediumGray);
            doc.text(title, x + 32, y + 12);
            
            // Value
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(...colors.darkText);
            doc.text(value, x + 32, y + 24);
        };
        
        // Helper: Draw section header
        const drawSectionHeader = (y, title) => {
            doc.setFillColor(...colors.primary);
            doc.roundedRect(15, y, 180, 10, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...colors.white);
            doc.text(title, 20, y + 7);
            return y + 15;
        };
        
        // Helper: Draw data row
        const drawDataRow = (y, label, value, isAlt = false) => {
            if (isAlt) {
                doc.setFillColor(...colors.lightGray);
                doc.rect(15, y - 5, 180, 10, 'F');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...colors.mediumGray);
            doc.text(label, 20, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colors.darkText);
            doc.text(value, 190, y, { align: 'right' });
            return y + 12;
        };
        
        // Helper: Draw result highlight box
        const drawResultBox = (y, label, value, isMain = false) => {
            const bgColor = isMain ? colors.accent : colors.lightGray;
            const textColor = isMain ? colors.white : colors.darkText;
            const labelColor = isMain ? [200, 255, 250] : colors.mediumGray;
            
            doc.setFillColor(...bgColor);
            doc.roundedRect(15, y, 180, 22, 4, 4, 'F');
            
            if (isMain) {
                // Add subtle decorative element for main result
                doc.setFillColor(90, 220, 210);
                doc.circle(185, y + 11, 15, 'F');
                doc.setFillColor(100, 225, 215);
                doc.circle(170, y + 11, 10, 'F');
            }
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...labelColor);
            doc.text(label, 20, y + 8);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...textColor);
            doc.text(value, 20, y + 18);
            
            return y + 28;
        };
        
        // Helper: Draw footer
        const drawFooter = () => {
            const pageHeight = doc.internal.pageSize.height;
            
            // Footer line
            doc.setDrawColor(...colors.accent);
            doc.setLineWidth(0.5);
            doc.line(15, pageHeight - 20, 195, pageHeight - 20);
            
            // Footer text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...colors.mediumGray);
            doc.text('Generated by Advanced Financial Calculator', 105, pageHeight - 12, { align: 'center' });
            doc.text(`© ${new Date().getFullYear()} | Premium Report`, 105, pageHeight - 7, { align: 'center' });
            
            // Watermark-style accent (subtle)
            doc.setFillColor(245, 250, 255);
            doc.circle(190, pageHeight - 15, 25, 'F');
        };
        
        // Draw the premium header
        drawHeader();
        
        let currentY = 65;
        
        if (type === 'interest' && appState.currentResult) {
            const r = appState.currentResult;
            
            // Validate result data exists
            if (!r.principal || !r.rate || !r.time) {
                alert('No calculation result available. Please calculate first.');
                return;
            }
            
            // Calculate interest and total amount based on stored values
            // Convert time to years based on timeUnit
            const timeConversions = {
                'Years': 1,
                'Months': 1/12,
                'Weeks': 1/52,
                'Days': 1/365,
                'Quarters': 0.25
            };
            const timeInYears = r.time * (timeConversions[r.timeUnit] || 1);
            
            // Get frequency from form if available
            const freqSelect = document.getElementById('frequency');
            const freq = freqSelect ? freqSelect.value : 'yearly';
            const freqMap = { 'yearly': 1, 'half-yearly': 2, 'quarterly': 4, 'monthly': 12 };
            const n = freqMap[freq] || 1;
            
            let interestAmount, totalAmount;
            if (r.type === 'compound') {
                totalAmount = r.principal * Math.pow(1 + (r.rate / 100) / n, n * timeInYears);
                interestAmount = totalAmount - r.principal;
            } else {
                interestAmount = r.principal * r.rate * timeInYears / 100;
                totalAmount = r.principal + interestAmount;
            }
            
            // Format numbers safely
            const formatNum = (num) => (num || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
            
            // Info Cards Row
            drawInfoCard(15, currentY, 58, 32, 'Principal', `₹${formatNum(r.principal)}`, '₹', colors.accent);
            drawInfoCard(76, currentY, 58, 32, 'Rate', `${r.rate}% p.a.`, '%', colors.gold);
            drawInfoCard(137, currentY, 58, 32, 'Duration', `${r.time} ${r.timeUnit}`, 'T', colors.success);
            
            currentY += 42;
            
            // Calculation Type Badge
            doc.setFillColor(...(r.type === 'compound' ? colors.success : colors.accent));
            doc.roundedRect(15, currentY, 50, 8, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...colors.white);
            doc.text(r.type === 'compound' ? 'COMPOUND INTEREST' : 'SIMPLE INTEREST', 40, currentY + 5.5, { align: 'center' });
            
            if (r.type === 'compound') {
                doc.setFillColor(...colors.warning);
                doc.roundedRect(70, currentY, 45, 8, 2, 2, 'F');
                doc.text(freq.toUpperCase(), 92.5, currentY + 5.5, { align: 'center' });
            }
            
            currentY += 18;
            
            // Details Section
            currentY = drawSectionHeader(currentY, 'CALCULATION DETAILS');
            
            currentY = drawDataRow(currentY, 'Principal Amount', `₹${formatNum(r.principal)}`, false);
            currentY = drawDataRow(currentY, 'Interest Rate', `${r.rate}% per annum`, true);
            currentY = drawDataRow(currentY, 'Time Period', `${r.time} ${r.timeUnit}`, false);
            currentY = drawDataRow(currentY, 'Calculation Type', r.type === 'compound' ? 'Compound Interest' : 'Simple Interest', true);
            if (r.type === 'compound') {
                currentY = drawDataRow(currentY, 'Compounding Frequency', freq.charAt(0).toUpperCase() + freq.slice(1), false);
            }
            
            currentY += 5;
            
            // Results Section
            currentY = drawSectionHeader(currentY, 'RESULTS');
            currentY += 5;
            
            currentY = drawResultBox(currentY, 'Interest Earned', `₹${formatNum(interestAmount)}`, false);
            currentY = drawResultBox(currentY, 'Total Amount (Principal + Interest)', `₹${formatNum(totalAmount)}`, true);
            
        } else if (type === 'emi' && appState.currentEmiResult) {
            const r = appState.currentEmiResult;
            
            // Info Cards Row
            drawInfoCard(15, currentY, 58, 32, 'Loan Amount', `₹${r.principal.toLocaleString('en-IN')}`, '₹', colors.accent);
            drawInfoCard(76, currentY, 58, 32, 'Interest', `${r.rate}% p.a.`, '%', colors.warning);
            drawInfoCard(137, currentY, 58, 32, 'Tenure', `${r.tenure} months`, 'M', colors.success);
            
            currentY += 42;
            
            // EMI Badge
            doc.setFillColor(...colors.primary);
            doc.roundedRect(15, currentY, 60, 8, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...colors.accent);
            doc.text('EMI CALCULATION', 45, currentY + 5.5, { align: 'center' });
            
            currentY += 18;
            
            // Loan Details Section
            currentY = drawSectionHeader(currentY, 'LOAN DETAILS');
            
            currentY = drawDataRow(currentY, 'Loan Principal', `₹${r.principal.toLocaleString('en-IN')}`, false);
            currentY = drawDataRow(currentY, 'Annual Interest Rate', `${r.rate}%`, true);
            currentY = drawDataRow(currentY, 'Monthly Interest Rate', `${(r.rate / 12).toFixed(3)}%`, false);
            currentY = drawDataRow(currentY, 'Loan Tenure', `${r.tenure} months (${(r.tenure / 12).toFixed(1)} years)`, true);
            
            currentY += 5;
            
            // Payment Summary Section
            currentY = drawSectionHeader(currentY, 'PAYMENT SUMMARY');
            currentY += 5;
            
            currentY = drawResultBox(currentY, 'Monthly EMI', `₹${r.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, true);
            currentY = drawResultBox(currentY, 'Total Interest Payable', `₹${r.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, false);
            currentY = drawResultBox(currentY, 'Total Amount Payable', `₹${r.totalPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, false);
            
            // Interest to Principal Ratio
            currentY += 8;
            const interestRatio = ((r.totalInterest / r.principal) * 100).toFixed(1);
            doc.setFillColor(...colors.lightGray);
            doc.roundedRect(15, currentY, 180, 20, 4, 4, 'F');
            
            // Progress bar background
            doc.setFillColor(200, 210, 220);
            doc.roundedRect(20, currentY + 12, 170, 5, 2, 2, 'F');
            
            // Progress bar fill (principal portion)
            const principalWidth = 170 * (r.principal / r.totalPayment);
            doc.setFillColor(...colors.accent);
            doc.roundedRect(20, currentY + 12, principalWidth, 5, 2, 2, 'F');
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...colors.mediumGray);
            doc.text(`Principal: ${((r.principal / r.totalPayment) * 100).toFixed(1)}%`, 20, currentY + 8);
            doc.text(`Interest: ${((r.totalInterest / r.totalPayment) * 100).toFixed(1)}%`, 190, currentY + 8, { align: 'right' });
        } else {
            // No result available
            alert('No calculation result available. Please calculate first.');
            return;
        }
        
        // Draw footer
        drawFooter();
        
        doc.save(`premium-report-${Date.now()}.pdf`);
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