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
            .then(() => {})
            .catch(() => {});
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
        periodSubText: document.getElementById('period-sub-text'),

        // Settlement
        collectionAmount: document.getElementById('collection-amount'),
        totalCharges: document.getElementById('total-charges'),
        settlenowCharges: document.getElementById('settlenow-charges'),
        sDisplayCollection: document.getElementById('s-display-collection'),
        sDisplayCharges: document.getElementById('s-display-charges'),
        sDisplaySettlenow: document.getElementById('s-display-settlenow'),
        sDisplayDeducted: document.getElementById('s-display-deducted'),
        sDisplaySettlement: document.getElementById('s-display-settlement'),
        sDisplayPercent: document.getElementById('s-display-percent'),
        settlementSummary: document.getElementById('settlement-summary'),
        settlementActions: document.getElementById('settlement-actions'),
        settlementPdf: document.getElementById('settlement-pdf'),
        settlementShare: document.getElementById('settlement-share'),
        settlementModeSlider: document.getElementById('settlement-mode-slider'),
        settlementModeInput: document.getElementById('settlement-mode'),
        settlementForward: document.getElementById('settlement-forward'),
        settlementReverse: document.getElementById('settlement-reverse'),

        // Reverse Settlement
        revCollectionAmount: document.getElementById('rev-collection-amount'),
        revAvailable: document.getElementById('rev-available'),
        rDisplayCollection: document.getElementById('r-display-collection'),
        rDisplayAvailable: document.getElementById('r-display-available'),
        rDisplayDeducted: document.getElementById('r-display-deducted'),
        rDisplayPercent: document.getElementById('r-display-percent'),
        reverseSummary: document.getElementById('reverse-summary'),
        revSettlementActions: document.getElementById('rev-settlement-actions'),
        revSettlementPdf: document.getElementById('rev-settlement-pdf'),
        revSettlementShare: document.getElementById('rev-settlement-share')
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
        currentSettlementResult: null,
        currentRevSettlementResult: null,
        interestChart: null,
        emiChart: null,
        compareChart: null,
        isDateMode: false
    };

    // Separate state for each settlement mode (Issue 3: preserve values on mode switch)
    let forwardState = { collectionAmount: '', totalCharges: '', settlenowCharges: '' };
    let reverseState = { collectionAmount: '', available: '' };
    
    // Initialize sound icon
    updateSoundIcon();

    // ============================================================
    // Result Persistence (Issue 8)
    // ============================================================

    function saveResultsToStorage() {
        try {
            const data = {
                currentResult: appState.currentResult ? { ...appState.currentResult, text: undefined } : null,
                currentEmiResult: appState.currentEmiResult ? { ...appState.currentEmiResult, text: undefined } : null,
                currentSettlementResult: appState.currentSettlementResult ? { ...appState.currentSettlementResult } : null,
                currentRevSettlementResult: appState.currentRevSettlementResult ? { ...appState.currentRevSettlementResult } : null,
            };
            localStorage.setItem('calcResults', JSON.stringify(data));
        } catch (e) {}
    }

    function restoreResultsFromStorage() {
        try {
            const raw = localStorage.getItem('calcResults');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data.currentResult) {
                appState.currentResult = data.currentResult;
                appState.currentResult.text = '';
                if (elements.interestResult && data.currentResult.principal) {
                    elements.interestResult.innerHTML = `${data.currentResult.type === 'compound' ? 'Compound' : 'Simple'} Interest: ₹${Number(data.currentResult.principal * data.currentResult.rate / 100).toLocaleString('en-IN', {maximumFractionDigits: 2})}<br>Total Amount: ₹${(data.currentResult.principal + data.currentResult.principal * data.currentResult.rate / 100).toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
                    elements.resultActions?.classList.remove('hidden');
                }
            }
            if (data.currentEmiResult) {
                appState.currentEmiResult = data.currentEmiResult;
                appState.currentEmiResult.text = '';
                if (elements.emiMonthly) {
                    elements.emiMonthly.textContent = `₹${Number(data.currentEmiResult.emi).toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
                    elements.emiTotalInterest.textContent = `₹${Number(data.currentEmiResult.totalInterest).toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
                    elements.emiTotalPayment.textContent = `₹${Number(data.currentEmiResult.totalPayment).toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
                    elements.emiBreakdown?.classList.remove('hidden');
                    elements.emiActions?.classList.remove('hidden');
                }
            }
        } catch (e) {}
    }

    restoreResultsFromStorage();

    // ============================================================
    // Haptic Feedback (Issue 5)
    // ============================================================

    function vibrate(pattern = 10) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }

    // Wrap playClickSound to include haptics
    const _origPlayClick = playClickSound;
    playClickSound = function() {
        _origPlayClick();
        vibrate(8);
    };

    // ============================================================
    // Animated Number Transitions (Issue 2)
    // ============================================================

    function animateValue(element, start, end, prefix, suffix, duration = 400) {
        if (!element) return;
        const startTime = performance.now();
        const isFloat = (end % 1) !== 0;

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * ease;

            if (isFloat) {
                element.textContent = (prefix || '') + current.toFixed(2) + (suffix || '');
            } else {
                element.textContent = (prefix || '') + Math.round(current).toLocaleString('en-IN') + (suffix || '');
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    function animateINR(element, newValue, duration = 400) {
        if (!element) return;
        const oldText = element.textContent.replace(/[₹,\s]/g, '') || '0';
        const oldValue = parseFloat(oldText);
        if (isNaN(oldValue)) { element.textContent = '₹' + Number(newValue).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}); return; }
        animateValue(element, oldValue, newValue, '₹', '', duration);
    }

    function animatePercent(element, newValue, duration = 400) {
        if (!element) return;
        const oldText = element.textContent.replace(/[%,\s]/g, '') || '0';
        const oldValue = parseFloat(oldText);
        if (isNaN(oldValue)) { element.textContent = newValue.toFixed(2) + '%'; return; }
        animateValue(element, oldValue, newValue, '', '%', duration);
    }

    // ============================================================
    // Clear Buttons Inside Inputs (Issue 3)
    // ============================================================

    function addClearButtons() {
        document.querySelectorAll('.input-wrapper input, .input-with-prefix input').forEach(input => {
            if (input.closest('.no-clear')) return;
            const wrapper = input.closest('.input-wrapper') || input.closest('.input-with-prefix');
            if (!wrapper || wrapper.querySelector('.input-clear-btn')) return;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'input-clear-btn';
            btn.textContent = '\u00D7';
            btn.setAttribute('aria-label', 'Clear input');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                input.value = '';
                wrapper.classList.remove('filled');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('blur'));
                input.focus();
                vibrate(5);
            });

            wrapper.appendChild(btn);

            const showHide = () => {
                if (input.value.trim()) {
                    wrapper.classList.add('filled');
                } else {
                    wrapper.classList.remove('filled');
                }
            };

            input.addEventListener('input', showHide);
            input.addEventListener('change', showHide);
            showHide();
        });
    }

    addClearButtons();

    // ============================================================
    // Swipeable Tabs (Issue 1)
    // ============================================================

    function initSwipeTabs() {
        const wrapper = document.getElementById('tab-content-wrapper');
        if (!wrapper) return;

        const tabs = ['interest', 'emi', 'settlement', 'compare', 'normal'];
        let startX = 0;
        let startY = 0;
        let isSwiping = false;

        wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = false;
        }, { passive: true });

        wrapper.addEventListener('touchmove', (e) => {
            if (!startX) return;
            const diffX = Math.abs(e.touches[0].clientX - startX);
            const diffY = Math.abs(e.touches[0].clientY - startY);
            if (diffX > diffY && diffX > 30) {
                isSwiping = true;
            }
        }, { passive: true });

        wrapper.addEventListener('touchend', (e) => {
            if (!isSwiping || !startX) return;
            const diffX = e.changedTouches[0].clientX - startX;
            const currentTab = document.querySelector('.tab-content.active')?.id;
            const idx = tabs.indexOf(currentTab);

            if (diffX < -50 && idx < tabs.length - 1) {
                switchToTab(tabs[idx + 1]);
            } else if (diffX > 50 && idx > 0) {
                switchToTab(tabs[idx - 1]);
            }

            startX = 0;
            startY = 0;
            isSwiping = false;
        }, { passive: true });
    }

    initSwipeTabs();

    // ============================================================
    // Font Size Settings (Issue 9)
    // ============================================================

    function applyFontSize(size) {
        const body = document.body;
        body.classList.remove('font-small', 'font-medium', 'font-large');
        body.classList.add('font-' + size);
        localStorage.setItem('fontSize', size);

        document.querySelectorAll('.font-option').forEach(el => {
            el.classList.toggle('active', el.dataset.size === size);
        });
    }

    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    applyFontSize(savedFontSize);

    document.querySelectorAll('.font-option').forEach(el => {
        el.addEventListener('click', () => {
            applyFontSize(el.dataset.size);
            vibrate(5);
        });
    });

    // Settings panel toggle
    document.getElementById('settings-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('settings-panel');
        panel?.classList.toggle('hidden');
        vibrate(5);
    });

    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settings-panel');
        const toggle = document.getElementById('settings-toggle');
        if (panel && !panel.classList.contains('hidden') && !panel.contains(e.target) && !toggle?.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });

    // ============================================================
    // Scroll to Top on Tab Change (Issue 4)
    // ============================================================

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function switchToTab(tabId) {
        const btn = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
        if (btn) btn.click();
        scrollToTop();
    }

    // ============================================================
    // History Restore (Issue 6)
    // ============================================================

    function restoreHistoryItem(item) {
        const data = item.data;
        if (!data) return;

        switch (item.type) {
            case 'Interest': {
                switchToTab('interest');
                if (data.principal) {
                    document.getElementById('principal').value = Number(data.principal).toLocaleString('en-IN');
                    if (data.rate) document.getElementById('rate').value = data.rate;
                    if (data.time) document.getElementById('time').value = data.time;
                    if (data.timeUnit) document.getElementById('time_unit').value = data.timeUnit;
                    if (data.type === 'compound') {
                        document.getElementById('interest_type').value = 'compound';
                        document.querySelector('.slider-track')?.classList.add('active-compound');
                        document.getElementById('frequency-group').style.display = 'block';
                    }
                    // Re-submit to recalculate
                    document.getElementById('interest-form')?.dispatchEvent(new Event('submit'));
                }
                break;
            }
            case 'EMI': {
                switchToTab('emi');
                if (data.principal) {
                    document.getElementById('emi-principal').value = Number(data.principal).toLocaleString('en-IN');
                    if (data.rate) document.getElementById('emi-rate').value = data.rate;
                    if (data.tenure) {
                        document.getElementById('emi-tenure').value = data.tenure;
                        document.getElementById('emi-tenure-unit').value = 'Months';
                    }
                    document.getElementById('emi-form')?.dispatchEvent(new Event('submit'));
                }
                break;
            }
            case 'Comparison': {
                switchToTab('compare');
                if (data.principal) {
                    document.getElementById('compare-principal').value = Number(data.principal).toLocaleString('en-IN');
                    if (data.rate) document.getElementById('compare-rate').value = data.rate;
                    if (data.time) document.getElementById('compare-time').value = data.time;
                    // Trigger auto-calc
                    ['compare-principal', 'compare-rate', 'compare-time'].forEach(id => {
                        document.getElementById(id)?.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                }
                break;
            }
            case 'Settlement': {
                switchToTab('settlement');
                if (data.mode === 'forward') {
                    // Switch to forward mode
                    const forwardOpt = document.querySelector('#settlement-mode-slider .slider-option[data-mode="forward"]');
                    if (forwardOpt) forwardOpt.click();
                    if (data.collection) document.getElementById('collection-amount').value = Number(data.collection).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    if (data.charges) document.getElementById('total-charges').value = Number(data.charges).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    if (data.settlenow) document.getElementById('settlenow-charges').value = Number(data.settlenow).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    ['collection-amount', 'total-charges', 'settlenow-charges'].forEach(id => {
                        document.getElementById(id)?.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                } else {
                    const reverseOpt = document.querySelector('#settlement-mode-slider .slider-option[data-mode="reverse"]');
                    if (reverseOpt) reverseOpt.click();
                    if (data.collection) document.getElementById('rev-collection-amount').value = Number(data.collection).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    if (data.available) document.getElementById('rev-available').value = Number(data.available).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    ['rev-collection-amount', 'rev-available'].forEach(id => {
                        document.getElementById(id)?.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                }
                break;
            }
        }
    }

    // ============================================================
    // CSRF Token for AJAX Requests
    // ============================================================
    
    function getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

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
            const tabId = btn.dataset.tab;
            document.getElementById(tabId)?.classList.add('active');

            // Scroll to top on tab change (Issue 4)
            scrollToTop();

            // Rebuild chart from cached data on re-entry (Issue 7)
            setTimeout(() => {
                if (tabId === 'interest' && appState.interestChartData && appState.interestChartData.result) {
                    generateBreakdownTable(appState.interestChartData.result);
                    generateInterestChart(appState.interestChartData.result);
                } else if (tabId === 'emi' && appState.emiChartData) {
                    generateEmiChart(appState.emiChartData.principal, appState.emiChartData.interest);
                } else if (tabId === 'compare' && appState.compareChartData) {
                    generateCompareChart(appState.compareChartData.principal, appState.compareChartData.time, appState.compareChartData.rate);
                }
            }, 50);
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

        // Click on history item to restore (Issue 6)
        elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-item-delete')) return;
                const id = parseInt(item.dataset.id);
                const entry = appState.history.find(h => h.id === id);
                if (entry) {
                    restoreHistoryItem(entry);
                    elements.historySidebar?.classList.remove('open');
                    elements.historyOverlay?.classList.remove('open');
                    vibrate(10);
                }
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
    
    function showConfirmModal(message) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-modal-overlay');
            const msg = document.getElementById('modal-message');
            const confirmBtn = document.getElementById('modal-confirm');
            const cancelBtn = document.getElementById('modal-cancel');
            if (!overlay || !msg || !confirmBtn || !cancelBtn) { resolve(true); return; }
            msg.textContent = message;
            overlay.classList.remove('hidden');
            const cleanup = () => { overlay.classList.add('hidden'); };
            confirmBtn.onclick = () => { cleanup(); resolve(true); };
            cancelBtn.onclick = () => { cleanup(); resolve(false); };
            overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
        });
    }

    elements.clearHistory?.addEventListener('click', async () => {
        const confirmed = await showConfirmModal('Clear all history?');
        if (confirmed) {
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
     'compare-principal', 'compare-rate', 'compare-time',
     'collection-amount', 'total-charges', 'settlenow-charges',
     'rev-collection-amount', 'rev-available'].forEach(id => {
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
        vibrate(15);
        
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
            const response = await fetch('/calculate_interest', {
                method: 'POST',
                headers: { 'X-CSRFToken': getCSRFToken() },
                body: formData
            });
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
                        appState.interestChartData = { result: appState.currentResult };
                        generateBreakdownTable(appState.currentResult);
                        generateInterestChart(appState.currentResult);
                    } else {
                        appState.interestChartData = null;
                    }
                    
                    // Save to history
                    saveToHistory('Interest', {
                        summary: `₹${appState.currentResult.principal.toLocaleString('en-IN')} @ ${appState.currentResult.rate}%`,
                        ...appState.currentResult
                    });
                    saveResultsToStorage();
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
                            label: (item) => `${item.dataset.label}: ₹ ${item.raw.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
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
                tenureUnit: document.getElementById('emi-tenure-unit')?.value || 'Months',
                text: `EMI Calculator Result\nLoan: ₹${principal.toLocaleString('en-IN')}\nRate: ${rate}% p.a.\nTenure: ${tenure} months\n\nMonthly EMI: ₹${emi.toLocaleString('en-IN', {maximumFractionDigits: 0})}\nTotal Interest: ₹${totalInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}\nTotal Payment: ₹${totalPayment.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
            };
            
            // Cache chart data and generate EMI Chart
            appState.emiChartData = { principal, interest: totalInterest };
            generateEmiChart(principal, totalInterest);
            
            // Save to history
            saveToHistory('EMI', {
                summary: `₹${emi.toLocaleString('en-IN', {maximumFractionDigits: 0})}/month`,
                ...appState.currentEmiResult
            });
            saveResultsToStorage();
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
                            label: (item) => ` ₹ ${item.raw.toLocaleString('en-IN', {maximumFractionDigits: 0})} (${((item.raw / (principal + interest)) * 100).toFixed(1)}%)`
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
        appState.emiChartData = null;
        
        ['emi-principal', 'emi-rate', 'emi-tenure'].forEach(id => {
            const el = document.getElementById(id);
            el?.closest('.input-wrapper')?.classList.remove('valid', 'invalid');
        });
    });

    // ============================================================
    // Settlement Auto-Calculation (Forward & Reverse)
    // ============================================================

    function formatINR(val) {
        return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // --- Mode Toggle with State Preservation & Smooth Transition ---
    elements.settlementModeSlider?.addEventListener('click', (e) => {
        const option = e.target.closest('.slider-option');
        if (!option) return;

        playClickSound();
        const mode = option.dataset.mode;
        elements.settlementModeInput.value = mode;
        elements.settlementModeSlider.classList.toggle('active-reverse', mode === 'reverse');

        // Save current mode state before switching
        saveForwardState();
        saveReverseState();

        // Hide current section with fade, show target
        if (mode === 'forward') {
            elements.settlementReverse?.classList.add('reverse-exit');
            setTimeout(() => {
                elements.settlementReverse?.classList.add('hidden');
                elements.settlementReverse?.classList.remove('reverse-exit');
                elements.settlementForward?.classList.remove('hidden', 'forward-exit');
                elements.settlementForward?.classList.add('forward-enter');
                setTimeout(() => {
                    elements.settlementForward?.classList.remove('forward-enter');
                    if (forwardState.collectionAmount || forwardState.totalCharges || forwardState.settlenowCharges) {
                        calculateSettlement();
                    }
                }, 10);
            }, 150);
        } else {
            elements.settlementForward?.classList.add('forward-exit');
            setTimeout(() => {
                elements.settlementForward?.classList.add('hidden');
                elements.settlementForward?.classList.remove('forward-exit');
                elements.settlementReverse?.classList.remove('hidden', 'reverse-exit');
                elements.settlementReverse?.classList.add('reverse-enter');
                setTimeout(() => {
                    elements.settlementReverse?.classList.remove('reverse-enter');
                    if (reverseState.collectionAmount || reverseState.available) {
                        calculateReverseSettlement();
                    }
                }, 10);
            }, 150);
        }
    });

    // --- State Save Functions ---
    function saveForwardState() {
        forwardState.collectionAmount = elements.collectionAmount?.value || '';
        forwardState.totalCharges = elements.totalCharges?.value || '';
        forwardState.settlenowCharges = elements.settlenowCharges?.value || '';
    }

    function saveReverseState() {
        reverseState.collectionAmount = elements.revCollectionAmount?.value || '';
        reverseState.available = elements.revAvailable?.value || '';
    }

    // --- Forward Mode ---
    function calculateSettlement() {
        const collectRaw = elements.collectionAmount?.value.replace(/,/g, '') || '';
        const chargesRaw = elements.totalCharges?.value.replace(/,/g, '') || '';
        const settleRaw = elements.settlenowCharges?.value.replace(/,/g, '') || '';

        const collect = parseFloat(collectRaw);
        const charges = parseFloat(chargesRaw);
        const settle = parseFloat(settleRaw);

        if (!collectRaw || !chargesRaw || !settleRaw ||
            isNaN(collect) || isNaN(charges) || isNaN(settle) ||
            collect < 0 || charges < 0 || settle < 0) {
            elements.settlementSummary?.classList.add('hidden');
            elements.settlementActions?.classList.add('hidden');
            return;
        }

        const deducted = charges + settle;
        const available = collect - deducted;
        const percent = (deducted / collect) * 100;

        if (elements.sDisplayCollection) animateINR(elements.sDisplayCollection, collect);
        if (elements.sDisplayCharges) animateINR(elements.sDisplayCharges, charges);
        if (elements.sDisplaySettlenow) animateINR(elements.sDisplaySettlenow, settle);
        if (elements.sDisplayDeducted) animateINR(elements.sDisplayDeducted, deducted);
        if (elements.sDisplaySettlement) animateINR(elements.sDisplaySettlement, Math.max(0, available));
        if (elements.sDisplayPercent) animatePercent(elements.sDisplayPercent, percent);

        elements.settlementSummary?.classList.remove('hidden');
        elements.settlementActions?.classList.remove('hidden');
        saveResultsToStorage();

        // Store current result for PDF/share
        appState.currentSettlementResult = {
            type: 'forward',
            collection: collect,
            charges: charges,
            settlenow: settle,
            deducted: deducted,
            available: available,
            percent: percent,
            text: `Settlement Summary\nCollection Amount: ${formatINR(collect)}\nTotal Charges: ${formatINR(charges)}\nSettleNow Charges: ${formatINR(settle)}\nTotal Charges Deducted: ${formatINR(deducted)}\nAvailable for Settlement: ${formatINR(Math.max(0, available))}\nEffective Charge %: ${percent.toFixed(2)}%`
        };

        saveToHistory('Settlement', {
            summary: `Available: ${formatINR(Math.max(0, available))} @ ${percent.toFixed(2)}%`,
            mode: 'forward',
            collection: collect,
            charges: charges,
            settlenow: settle,
            available: available,
            deducted: deducted,
            percent: percent
        });
    }

    elements.collectionAmount?.addEventListener('input', () => { saveForwardState(); calculateSettlement(); });
    elements.totalCharges?.addEventListener('input', () => { saveForwardState(); calculateSettlement(); });
    elements.settlenowCharges?.addEventListener('input', () => { saveForwardState(); calculateSettlement(); });

    // --- Reverse Mode ---
    function calculateReverseSettlement() {
        const collectRaw = elements.revCollectionAmount?.value.replace(/,/g, '') || '';
        const availableRaw = elements.revAvailable?.value.replace(/,/g, '') || '';

        const collect = parseFloat(collectRaw);
        const available = parseFloat(availableRaw);

        if (!collectRaw || !availableRaw ||
            isNaN(collect) || isNaN(available) ||
            collect < 0 || available < 0 || available > collect) {
            elements.reverseSummary?.classList.add('hidden');
            elements.revSettlementActions?.classList.add('hidden');
            return;
        }

        const deducted = collect - available;
        const percent = (deducted / collect) * 100;

        if (elements.rDisplayCollection) animateINR(elements.rDisplayCollection, collect);
        if (elements.rDisplayAvailable) animateINR(elements.rDisplayAvailable, available);
        if (elements.rDisplayDeducted) animateINR(elements.rDisplayDeducted, deducted);
        if (elements.rDisplayPercent) animatePercent(elements.rDisplayPercent, percent);

        elements.reverseSummary?.classList.remove('hidden');
        elements.revSettlementActions?.classList.remove('hidden');
        saveResultsToStorage();

        // Store current result for PDF/share
        appState.currentRevSettlementResult = {
            type: 'reverse',
            collection: collect,
            available: available,
            deducted: deducted,
            percent: percent,
            text: `Reverse Settlement Summary\nCollection Amount: ${formatINR(collect)}\nAvailable for Settlement: ${formatINR(available)}\nTotal Charges Deducted: ${formatINR(deducted)}\nEffective Charge %: ${percent.toFixed(2)}%`
        };

        saveToHistory('Settlement', {
            summary: `Deducted: ${formatINR(deducted)} @ ${percent.toFixed(2)}%`,
            mode: 'reverse',
            collection: collect,
            available: available,
            deducted: deducted,
            percent: percent
        });
    }

    elements.revCollectionAmount?.addEventListener('input', () => { saveReverseState(); calculateReverseSettlement(); });
    elements.revAvailable?.addEventListener('input', () => { saveReverseState(); calculateReverseSettlement(); });

    // ============================================================
    // Settlement PDF & Share
    // ============================================================

    function getSettlementData(mode) {
        return mode === 'forward' ? appState.currentSettlementResult : appState.currentRevSettlementResult;
    }

    function generateSettlementPDF(mode) {
        if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
            alert('PDF generation not available. Please check your internet connection.');
            return;
        }

        const data = getSettlementData(mode);
        if (!data) { alert('No settlement result to export. Please enter values first.'); return; }

        const jspdfLib = window.jspdf || jspdf;
        const { jsPDF } = jspdfLib;
        const doc = new jsPDF();
        const pw = 210;
        const sid = 'STL-' + Date.now().toString(36).toUpperCase();

        const c = {
            deep:    [37, 61, 44],
            forest:  [46, 111, 64],
            sage:    [104, 186, 127],
            mint:    [207, 255, 220],
            white:   [255, 255, 255],
            offWhite:[248, 253, 249],
            light:   [235, 248, 238],
            divider: [210, 235, 216],
            text:    [37, 61, 44],
            muted:   [110, 140, 118],
            red:     [255, 90, 90],
            gold:    [218, 175, 70],
        };

        // Header
        doc.setFillColor(...c.deep);
        doc.rect(0, 0, pw, 48, 'F');
        doc.setFillColor(...c.sage);
        doc.rect(0, 48, pw, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(...c.white);
        doc.text('Settlement Receipt', 54, 24);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...c.sage);
        doc.text('Advanced Calculator  ·  Payment Summary', 54, 33);

        const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        // Settlement ID pill
        doc.setFillColor(...c.forest);
        doc.roundedRect(128, 12, 64, 10, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...c.sage);
        doc.text('ID: ' + sid, 160, 18.5, { align: 'center' });

        // Date pill
        doc.setFillColor(...c.forest);
        doc.roundedRect(128, 26, 64, 10, 3, 3, 'F');
        doc.setFontSize(7);
        doc.setTextColor(...c.mint);
        doc.text(dateStr, 160, 32.5, { align: 'center' });

        // Helpers
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

        const resultCard = (y, label, value, highlight = false, color = null) => {
            if (highlight) {
                doc.setFillColor(...(color || c.forest));
                doc.roundedRect(18, y, 174, 24, 4, 4, 'F');
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
                doc.setTextColor(...(color || c.muted));
                doc.text(label, 24, y + 7);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(...c.text);
                doc.text(value, 24, y + 18);
            }
            return y + (highlight ? 30 : 27);
        };

        const drawFooter = () => {
            const ph = doc.internal.pageSize.height;
            doc.setDrawColor(...c.sage);
            doc.setLineWidth(0.8);
            doc.line(18, ph - 18, 192, ph - 18);
            doc.setFillColor(...c.sage);
            doc.circle(18, ph - 18, 1.5, 'F');
            doc.circle(192, ph - 18, 1.5, 'F');
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...c.muted);
            doc.text('Generated by Advanced Settlement Calculator  |  ' + sid, 105, ph - 11, { align: 'center' });
            doc.text('(c) ' + new Date().getFullYear() + '  |  This is a computer-generated receipt.', 105, ph - 6.5, { align: 'center' });
        };

        const fmt = (v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        // Content
        let y = 58;

        // Header label
        doc.setFillColor(...c.deep);
        doc.roundedRect(18, y, 100, 7, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...c.sage);
        doc.text(data.type === 'forward' ? 'FORWARD SETTLEMENT' : 'REVERSE SETTLEMENT', 68, y + 5, { align: 'center' });
        y += 16;

        // Details
        y = sectionHead(y, 'SETTLEMENT DETAILS');

        if (data.type === 'forward') {
            y = dataRow(y, 'Collection Amount', '₹ ' + fmt(data.collection), false);
            y = dataRow(y, 'Total Charges', '₹ ' + fmt(data.charges), true);
            y = dataRow(y, 'SettleNow Charges', '₹ ' + fmt(data.settlenow), false);
            y = dataRow(y, 'Total Charges Deducted', '₹ ' + fmt(data.deducted), true);
        } else {
            y = dataRow(y, 'Collection Amount', '₹ ' + fmt(data.collection), false);
            y = dataRow(y, 'Available for Settlement', '₹ ' + fmt(data.available), true);
            y = dataRow(y, 'Total Charges Deducted', '₹ ' + fmt(data.deducted), false);
        }
        y += 6;

        // Results
        y = sectionHead(y, 'SUMMARY');
        y += 4;
        y = resultCard(y, 'Available for Settlement', '₹ ' + fmt(Math.max(0, data.available)), true);
        y = resultCard(y, 'Total Charges Deducted', '₹ ' + fmt(data.deducted), false, c.red);
        y = resultCard(y, 'Effective Charge %', data.percent.toFixed(2) + '%', false, c.gold);

        drawFooter();
        doc.save('settlement-' + sid.toLowerCase() + '.pdf');
    }

    function shareSettlement(mode) {
        const data = getSettlementData(mode);
        if (!data) { alert('No settlement result to share. Please enter values first.'); return; }

        const shareText = data.text || '';
        const shareData = { title: 'Settlement Summary', text: shareText, url: window.location.href };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Settlement summary copied to clipboard!');
            }).catch(() => {
                alert('Could not copy to clipboard');
            });
        }
    }

    elements.settlementPdf?.addEventListener('click', () => { playClickSound(); generateSettlementPDF('forward'); });
    elements.settlementShare?.addEventListener('click', () => { playClickSound(); shareSettlement('forward'); });
    elements.revSettlementPdf?.addEventListener('click', () => { playClickSound(); generateSettlementPDF('reverse'); });
    elements.revSettlementShare?.addEventListener('click', () => { playClickSound(); shareSettlement('reverse'); });

    // ============================================================
    // Comparison Mode
    // ============================================================
    
    elements.compareForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        
        document.getElementById('compare-skeleton')?.classList.remove('hidden');
        elements.compareResults?.classList.add('hidden');
        elements.compareChartContainer?.classList.add('hidden');

        setTimeout(() => {
            document.getElementById('compare-skeleton')?.classList.add('hidden');

            const principal = parseFloat(document.getElementById('compare-principal').value.replace(/,/g, ''));
            const rate = parseFloat(document.getElementById('compare-rate').value.replace(/,/g, ''));
            const time = parseFloat(document.getElementById('compare-time').value.replace(/,/g, ''));
            
            if (isNaN(principal) || isNaN(rate) || isNaN(time) || principal <= 0 || rate <= 0 || time <= 0) {
                return;
            }
            
            const simpleInterest = (principal * rate * time) / 100;
            const simpleTotal = principal + simpleInterest;
            const compoundTotal = principal * Math.pow(1 + rate / 100, time);
            const compoundInterest = compoundTotal - principal;
            const difference = compoundInterest - simpleInterest;
            
            elements.compareSimpleInterest.textContent = `₹${simpleInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
            elements.compareSimpleTotal.textContent = `₹${simpleTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
            elements.compareCompoundInterest.textContent = `₹${compoundInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
            elements.compareCompoundTotal.textContent = `₹${compoundTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
            elements.compareDifference.textContent = `₹${difference.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
            
            elements.compareResults?.classList.remove('hidden');
            
            appState.compareChartData = { principal, time, rate };
            generateCompareChart(principal, time, rate);
            
            saveToHistory('Comparison', {
                summary: `Difference: ₹${difference.toLocaleString('en-IN', {maximumFractionDigits: 0})}`,
                principal: principal,
                rate: rate,
                time: time,
                simpleInterest: simpleInterest,
                compoundInterest: compoundInterest,
                difference: difference
            });
        }, 400);
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
                            label: (item) => `${item.dataset.label}: ₹ ${item.raw.toLocaleString('en-IN', {maximumFractionDigits: 0})}`
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
    
    // Auto-calculate comparison on input change (Issue 9)
    function autoCalculateCompare() {
        const principal = parseFloat(document.getElementById('compare-principal')?.value.replace(/,/g, '') || '');
        const rate = parseFloat(document.getElementById('compare-rate')?.value.replace(/,/g, '') || '');
        const time = parseFloat(document.getElementById('compare-time')?.value.replace(/,/g, '') || '');

        if (isNaN(principal) || isNaN(rate) || isNaN(time) || principal <= 0 || rate <= 0 || time <= 0) {
            return;
        }

        const simpleInterest = (principal * rate * time) / 100;
        const simpleTotal = principal + simpleInterest;
        const compoundTotal = principal * Math.pow(1 + rate / 100, time);
        const compoundInterest = compoundTotal - principal;
        const difference = compoundInterest - simpleInterest;

        elements.compareSimpleInterest.textContent = `₹${simpleInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareSimpleTotal.textContent = `₹${simpleTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareCompoundInterest.textContent = `₹${compoundInterest.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareCompoundTotal.textContent = `₹${compoundTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
        elements.compareDifference.textContent = `₹${difference.toLocaleString('en-IN', {maximumFractionDigits: 0})}`;

        elements.compareResults?.classList.remove('hidden');

        appState.compareChartData = { principal, time, rate };
        generateCompareChart(principal, time, rate);
    }

    ['compare-principal', 'compare-rate', 'compare-time'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const p = document.getElementById('compare-principal')?.value.replace(/,/g, '') || '';
                const r = document.getElementById('compare-rate')?.value.replace(/,/g, '') || '';
                const t = document.getElementById('compare-time')?.value.replace(/,/g, '') || '';
                if (p && r && t) autoCalculateCompare();
            });
        }
    });

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
        
        appState.compareChartData = null;
        
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
            infoCard(18, y, 56, 'PRINCIPAL', `₹ ${fmt(r.principal)}`, c.sage);
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
            y = dataRow(y, 'Principal Amount', `₹ ${fmt(r.principal)}`, false);
            y = dataRow(y, 'Annual Interest Rate', `${r.rate}%`, true);
            y = dataRow(y, 'Time Period', `${r.time} ${r.timeUnit}`, false);
            y = dataRow(y, 'Type', r.type === 'compound' ? 'Compound Interest' : 'Simple Interest', true);
            if (r.type === 'compound') y = dataRow(y, 'Compounding', freq, false);
            y += 6;
            
            // Results
            y = sectionHead(y, 'RESULTS');
            y += 4;
            y = resultCard(y, 'Interest Earned', `₹ ${fmt(interest)}`, false);
            y = resultCard(y, 'Total Amount (Principal + Interest)', `₹ ${fmt(total)}`, true);
            
        } else if (type === 'emi' && appState.currentEmiResult) {
            const r = appState.currentEmiResult;
            const fmt = (v) => (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
            
            // Info cards
            infoCard(18, y, 56, 'LOAN', `₹ ${fmt(r.principal)}`, c.sage);
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
            y = dataRow(y, 'Loan Principal', `₹ ${fmt(r.principal)}`, false);
            y = dataRow(y, 'Annual Interest Rate', `${r.rate}%`, true);
            y = dataRow(y, 'Monthly Rate', `${(r.rate / 12).toFixed(3)}%`, false);
            y = dataRow(y, 'Tenure', `${r.tenure} months (${(r.tenure / 12).toFixed(1)} yrs)`, true);
            y += 6;
            
            // Payment Summary
            y = sectionHead(y, 'PAYMENT SUMMARY');
            y += 4;
            y = resultCard(y, 'Monthly EMI', `₹ ${fmt(r.emi)}`, true);
            y = resultCard(y, 'Total Interest Payable', `₹ ${fmt(r.totalInterest)}`, false);
            y = resultCard(y, 'Total Amount Payable', `₹ ${fmt(r.totalPayment)}`, false);
            
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
        appState.interestChartData = null;
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