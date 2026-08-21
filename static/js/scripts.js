/**
 * Advanced Calculator Application
 * Features: Interest Calculator, EMI Calculator, Comparison Mode, Normal Calculator
 * With History, Charts, PDF Export, WhatsApp Share, Sound Effects
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // HTML-escaping helper — always use this when interpolating
    // user-supplied text (e.g. bill-split person/item names) into
    // innerHTML. Without it, a name like "><img src=x onerror=...>"
    // typed into a text field would execute as script (self-XSS).
    // ============================================================

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ============================================================
    // Splash Screen — Fade out on first paint
    // ============================================================
    
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hidden');
    }, 800);
    
    // ============================================================
    // Service Worker Registration (PWA)
    // ============================================================
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                // Auto-refresh when a new service worker takes control
                // (ensures users get updated assets like new manifest/icons)
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });
            })
            .catch(() => {});

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
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
        revSettlementShare: document.getElementById('rev-settlement-share'),

        // Bill Split
        splitForm: document.getElementById('split-form'),
        splitTotal: document.getElementById('split-total'),
        splitPeople: document.getElementById('split-people'),
        peopleMinus: document.getElementById('people-minus'),
        peoplePlus: document.getElementById('people-plus'),
        peopleDetails: document.getElementById('people-details'),
        splitModeChips: document.getElementById('split-mode-chips'),
        splitModeInput: document.getElementById('split-mode'),
        itemsSection: document.getElementById('items-section'),
        itemsList: document.getElementById('items-list'),
        addItemBtn: document.getElementById('add-item-btn'),
        splitTax: document.getElementById('split-tax'),
        splitTip: document.getElementById('split-tip'),
        splitDiscount: document.getElementById('split-discount'),
        roundToggle: document.getElementById('round-toggle'),
        splitTaxToggle: document.getElementById('split-tax-toggle'),
        splitTaxMode: document.getElementById('split-tax-mode'),
        clearSplit: document.getElementById('clear-split'),
        splitResult: document.getElementById('split-result'),
        splitSkeleton: document.getElementById('split-skeleton'),
        splitBreakdown: document.getElementById('split-breakdown'),
        splitPeopleResult: document.getElementById('split-people-result'),
        splitSubtotal: document.getElementById('s-breakdown-subtotal'),
        splitTaxDisplay: document.getElementById('s-breakdown-tax'),
        splitTipDisplay: document.getElementById('s-breakdown-tip'),
        splitDiscountDisplay: document.getElementById('s-breakdown-discount'),
        splitTotalDisplay: document.getElementById('s-breakdown-total'),
        splitSettlement: document.getElementById('split-settlement'),
        splitSettlementBody: document.getElementById('split-settlement-body'),
        splitActions: document.getElementById('split-actions'),
        splitShare: document.getElementById('split-share'),
        splitWhatsapp: document.getElementById('split-whatsapp'),

        // Discount Calculator
        discountForm: document.getElementById('discount-form'),
        discountPrice: document.getElementById('discount-price'),
        discountPct: document.getElementById('discount-pct'),
        discountPresets: document.getElementById('discount-presets'),
        clearDiscount: document.getElementById('clear-discount'),
        discountResult: document.getElementById('discount-result'),
        dSavePct: document.getElementById('d-save-pct'),
        dSaveAmount: document.getElementById('d-save-amount'),
        dOriginal: document.getElementById('d-original'),
        dDiscountAmt: document.getElementById('d-discount-amt'),
        dFinal: document.getElementById('d-final'),
        discountActions: document.getElementById('discount-actions'),
        discountShare: document.getElementById('discount-share'),
        discountWhatsapp: document.getElementById('discount-whatsapp')
    };

    // ============================================================
    // Application State
    // ============================================================
    
    let calcState = {
        expression: '',
        isResultState: false
    };
    
    let splitState = {
        peopleCount: 2,
        personNames: ['Person 1', 'Person 2'],
        mode: 'equal',
        items: [],
        roundOff: false,
        proportionalTax: true,
        currentResult: null
    };

    let appState = {
        soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
        history: JSON.parse(localStorage.getItem('calcHistory') || '[]'),
        currentResult: null,
        currentEmiResult: null,
        currentSettlementResult: null,
        currentRevSettlementResult: null,
        currentSplitResult: null,
        currentDiscountResult: null,
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
                currentSplitResult: appState.currentSplitResult ? { ...appState.currentSplitResult, text: undefined } : null,
                currentDiscountResult: appState.currentDiscountResult ? { ...appState.currentDiscountResult, text: undefined } : null,
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
            if (data.currentSplitResult) {
                appState.currentSplitResult = data.currentSplitResult;
                appState.currentSplitResult.text = '';
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

        const tabs = ['interest', 'emi', 'settlement', 'split', 'compare', 'normal'];
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
            case 'Bill Split': {
                switchToTab('split');
                if (data.shares) {
                    elements.splitTotal.value = Number(data.grandTotal || data.subtotal || 0).toLocaleString('en-IN');
                    if (data.taxAmt) elements.splitTax.value = data.taxAmt.toFixed(2);
                    if (data.tipAmt) elements.splitTip.value = data.tipAmt.toFixed(2);
                    if (data.discount) elements.splitDiscount.value = data.discount.toFixed(2);
                }
                break;
            }
            case 'Discount': {
                switchToTab('discount');
                if (data.summary) {
                    if (data.price) elements.discountPrice.value = Number(data.price).toLocaleString('en-IN');
                    if (data.pct) {
                        elements.discountPct.value = data.pct;
                        document.querySelectorAll('.discount-chip').forEach(c => {
                            c.classList.toggle('active', c.dataset.pct === String(data.pct));
                        });
                    }
                    calculateDiscount();
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
    
    // Refresh CSRF token from server (used when validation fails or
    // when the page was served from cache with a stale token)
    async function refreshCSRFToken() {
        try {
            const res = await fetch('/api/csrf-token', { cache: 'no-store' });
            if (!res.ok) return false;
            const data = await res.json();
            if (data.csrf_token) {
                const meta = document.querySelector('meta[name="csrf-token"]');
                if (meta) meta.setAttribute('content', data.csrf_token);
                return true;
            }
        } catch (e) {}
        return false;
    }
    
    // Perform a POST with automatic CSRF recovery:
    // if the server rejects the token (419), fetch a fresh token and retry once
    async function fetchWithCSRF(url, options) {
        let response = await fetch(url, options);
        if (response.status === 419) {
            const ok = await refreshCSRFToken();
            if (ok) {
                options.headers['X-CSRFToken'] = getCSRFToken();
                response = await fetch(url, options);
            }
        }
        return response;
    }
    
    // On load: silently refresh token so stale cached pages self-heal
    refreshCSRFToken();

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
                const disp = document.getElementById('start-date-display');
                if (disp) { disp.textContent = formatDisplay(today); disp.parentElement.classList.add('filled'); }
            }
            if (elements.endDateInput && !elements.endDateInput.value) {
                const nextYear = new Date(today);
                nextYear.setFullYear(nextYear.getFullYear() + 1);
                elements.endDateInput.value = nextYear.toISOString().split('T')[0];
                const disp = document.getElementById('end-date-display');
                if (disp) { disp.textContent = formatDisplay(nextYear); disp.parentElement.classList.add('filled'); }
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
    // Premium Date Picker — Year → Month → Day drill-down
    // ============================================================

    const dp = {
        target: null,          // 'start' | 'end'
        view: 'day',           // 'day' | 'month' | 'year'
        cursorYear: 2026,
        cursorMonth: 0,        // 0-11
        cursorDay: 1,
        tempDate: null,        // Date while picking (applied on Done)
        startDate: null,       // Date | null
        endDate: null,         // Date | null
    };

    const dpOverlay = document.getElementById('date-picker-overlay');
    const dpTitle = document.getElementById('dp-title');
    const dpLabel = document.getElementById('dp-label');
    const dpBody = document.getElementById('dp-body');
    const dpPrev = document.getElementById('dp-prev');
    const dpNext = document.getElementById('dp-next');
    const dpToday = document.getElementById('dp-today');
    const dpCancel = document.getElementById('dp-cancel');
    const dpDone = document.getElementById('dp-done');
    const dpClose = document.getElementById('dp-close');

    const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function parseISO(val) {
        if (!val) return null;
        const [y, m, d] = val.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function toISO(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatDisplay(d) {
        if (!d) return 'Select date';
        const today = new Date();
        const sameYear = d.getFullYear() === today.getFullYear();
        const base = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
        return sameYear ? base : `${base} ${d.getFullYear()}`;
    }

    function openDatePicker(target) {
        dp.target = target;
        const existing = target === 'start' ? parseISO(elements.startDateInput.value) : parseISO(elements.endDateInput.value);
        const today = new Date();
        dp.cursorYear = existing ? existing.getFullYear() : today.getFullYear();
        dp.cursorMonth = existing ? existing.getMonth() : today.getMonth();
        dp.cursorDay = existing ? existing.getDate() : 1;
        dp.tempDate = existing ? new Date(existing) : null;
        dp.view = 'day';

        // Load current range
        dp.startDate = parseISO(elements.startDateInput.value);
        dp.endDate = parseISO(elements.endDateInput.value);

        dpTitle.textContent = target === 'start' ? 'Select Start Date' : 'Select End Date';
        dpOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        renderDatePicker();
    }

    function closeDatePicker() {
        dpOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function renderDatePicker() {
        dpLabel.textContent = dp.view === 'day'
            ? `${MONTHS_FULL[dp.cursorMonth]} ${dp.cursorYear}`
            : dp.view === 'month'
                ? `${dp.cursorYear}`
                : `${dp.cursorYear - 6} – ${dp.cursorYear + 6}`;

        dpPrev.style.visibility = 'visible';
        dpNext.style.visibility = 'visible';

        if (dp.view === 'day') renderDays();
        else if (dp.view === 'month') renderMonths();
        else renderYears();
    }

    function renderDays() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const first = new Date(dp.cursorYear, dp.cursorMonth, 1);
        const daysInMonth = new Date(dp.cursorYear, dp.cursorMonth + 1, 0).getDate();
        const startWeekday = first.getDay();

        const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa']
            .map(w => `<span>${w}</span>`).join('');
        const wkHeader = `<div class="dp-weekdays">${weekdays}</div>`;

        let cells = '';
        for (let i = 0; i < startWeekday; i++) {
            cells += `<button type="button" class="dp-day empty"></button>`;
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(dp.cursorYear, dp.cursorMonth, d);
            let cls = 'dp-day';
            if (toISO(date) === toISO(today)) cls += ' today';
            if (dp.tempDate && toISO(date) === toISO(dp.tempDate)) cls += ' selected';
            if (dp.startDate && dp.endDate && dp.startDate < date && date < dp.endDate) cls += ' in-range';
            if (dp.startDate && toISO(date) === toISO(dp.startDate)) cls += ' range-start';
            if (dp.endDate && toISO(date) === toISO(dp.endDate)) cls += ' range-end';
            cells += `<button type="button" class="${cls}" data-day="${d}">${d}</button>`;
        }

        dpBody.innerHTML = wkHeader + `<div class="dp-days">${cells}</div>`;
        dpBody.querySelectorAll('.dp-day[data-day]').forEach(btn => {
            btn.addEventListener('click', () => {
                dp.cursorDay = parseInt(btn.dataset.day, 10);
                dp.tempDate = new Date(dp.cursorYear, dp.cursorMonth, dp.cursorDay);
                renderDays();
            });
        });
    }

    function renderMonths() {
        let html = '<div class="dp-grid">';
        for (let m = 0; m < 12; m++) {
            const active = dp.tempDate && dp.tempDate.getFullYear() === dp.cursorYear && dp.tempDate.getMonth() === m;
            html += `<button type="button" class="dp-grid-item${active ? ' active' : ''}" data-month="${m}">${MONTHS_FULL[m].slice(0, 3)}</button>`;
        }
        html += '</div>';
        dpBody.innerHTML = html;
        dpBody.querySelectorAll('.dp-grid-item').forEach(btn => {
            btn.addEventListener('click', () => {
                dp.cursorMonth = parseInt(btn.dataset.month, 10);
                dp.cursorDay = Math.min(dp.cursorDay, new Date(dp.cursorYear, dp.cursorMonth + 1, 0).getDate());
                if (dp.tempDate) {
                    dp.tempDate = new Date(dp.cursorYear, dp.cursorMonth, dp.cursorDay);
                }
                dp.view = 'day';
                renderDatePicker();
            });
        });
    }

    function renderYears() {
        const center = dp.cursorYear;
        const startYear = center - 6;
        let html = '<div class="dp-grid">';
        for (let i = 0; i < 15; i++) {
            const y = startYear + i;
            const active = dp.tempDate && dp.tempDate.getFullYear() === y;
            const outside = y < 1990 || y > new Date().getFullYear() + 50;
            html += `<button type="button" class="dp-grid-item${active ? ' active' : ''}${outside ? ' outside' : ''}" data-year="${y}">${y}</button>`;
        }
        html += '</div>';
        dpBody.innerHTML = html;
        dpBody.querySelectorAll('.dp-grid-item').forEach(btn => {
            btn.addEventListener('click', () => {
                dp.cursorYear = parseInt(btn.dataset.year, 10);
                dp.view = 'month';
                renderDatePicker();
            });
        });
    }

    // Label click → drill down: day → year → month → day
    dpLabel?.addEventListener('click', () => {
        playClickSound();
        if (dp.view === 'day') {
            dp.view = 'year';
        } else if (dp.view === 'month') {
            dp.view = 'year';
        } else {
            dp.view = 'month';
        }
        renderDatePicker();
    });

    dpPrev?.addEventListener('click', () => {
        playClickSound();
        if (dp.view === 'day') {
            dp.cursorMonth--;
            if (dp.cursorMonth < 0) { dp.cursorMonth = 11; dp.cursorYear--; }
        } else if (dp.view === 'month') {
            dp.cursorYear--;
        } else {
            dp.cursorYear -= 15;
        }
        renderDatePicker();
    });

    dpNext?.addEventListener('click', () => {
        playClickSound();
        if (dp.view === 'day') {
            dp.cursorMonth++;
            if (dp.cursorMonth > 11) { dp.cursorMonth = 0; dp.cursorYear++; }
        } else if (dp.view === 'month') {
            dp.cursorYear++;
        } else {
            dp.cursorYear += 15;
        }
        renderDatePicker();
    });

    dpToday?.addEventListener('click', () => {
        playClickSound();
        const today = new Date();
        dp.tempDate = new Date(today);
        dp.cursorYear = today.getFullYear();
        dp.cursorMonth = today.getMonth();
        dp.cursorDay = today.getDate();
        dp.view = 'day';
        renderDatePicker();
        applyTempDate();
    });

    dpCancel?.addEventListener('click', () => {
        playClickSound();
        closeDatePicker();
    });

    dpClose?.addEventListener('click', () => {
        playClickSound();
        closeDatePicker();
    });

    function applyTempDate() {
        if (!dp.tempDate) return;
        if (dp.target === 'start') {
            elements.startDateInput.value = toISO(dp.tempDate);
            const disp = document.getElementById('start-date-display');
            if (disp) {
                disp.textContent = formatDisplay(dp.tempDate);
                disp.parentElement.classList.add('filled');
            }
        } else {
            elements.endDateInput.value = toISO(dp.tempDate);
            const disp = document.getElementById('end-date-display');
            if (disp) {
                disp.textContent = formatDisplay(dp.tempDate);
                disp.parentElement.classList.add('filled');
            }
        }
        calculateDateDiff();
    }

    dpDone?.addEventListener('click', () => {
        playClickSound();
        applyTempDate();
        closeDatePicker();
    });

    dpOverlay?.addEventListener('click', (e) => {
        if (e.target === dpOverlay) closeDatePicker();
    });

    document.getElementById('start-date-btn')?.addEventListener('click', () => {
        playClickSound();
        vibrate(8);
        openDatePicker('start');
    });

    document.getElementById('end-date-btn')?.addEventListener('click', () => {
        playClickSound();
        vibrate(8);
        openDatePicker('end');
    });

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
     'rev-collection-amount', 'rev-available',
     'split-total', 'split-tax', 'split-tip', 'split-discount'].forEach(id => {
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
            const response = await fetchWithCSRF('/calculate_interest', {
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
    // Bill Split Feature
    // ============================================================

    const PERSON_COLORS = ['#a67c52', '#b89068', '#c9a87a', '#dbb88a', '#8d6e4c', '#7a5e3f', '#6b4e34', '#5c3f28', '#a0916b', '#b3a07a'];

    function initSplitPeople() {
        const count = splitState.peopleCount;
        elements.peopleDetails.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const name = splitState.personNames[i] || `Person ${i + 1}`;
            const color = PERSON_COLORS[i % PERSON_COLORS.length];
            const row = document.createElement('div');
            row.className = 'person-input-row';
            row.dataset.index = i;
            const showValue = splitState.mode === 'custom' || splitState.mode === 'percent' || splitState.mode === 'ratio';
            row.innerHTML = `
                <span class="person-color-dot" style="background:${color}"></span>
                <input type="text" class="person-name-input" value="${escapeHtml(name)}" placeholder="Name" data-index="${i}">
                ${showValue ? `<input type="text" inputmode="decimal" class="person-value-input" placeholder="${splitState.mode === 'percent' ? '%' : splitState.mode === 'ratio' ? 'Share' : '₹'}" data-index="${i}">` : ''}
                <span class="person-share-display" data-index="${i}"></span>
            `;
            elements.peopleDetails.appendChild(row);

            const nameInput = row.querySelector('.person-name-input');
            nameInput.addEventListener('input', () => {
                splitState.personNames[i] = nameInput.value || `Person ${i + 1}`;
            });

            const valInput = row.querySelector('.person-value-input');
            if (valInput) {
                valInput.addEventListener('input', () => {
                    formatInputValue(valInput);
                    autoCalculateSplit();
                });
            }
        }
        if (splitState.mode !== 'equal' && splitState.mode !== 'items') {
            autoCalculateSplit();
        }
    }

    function autoCalculateSplit() {
        const totalRaw = elements.splitTotal?.value.replace(/,/g, '') || '';
        const total = parseFloat(totalRaw);
        if (!totalRaw || isNaN(total) || total <= 0) {
            hideSplitResults();
            return;
        }
        calculateSplit();
    }

    function calculateSplit() {
        const totalRaw = elements.splitTotal?.value.replace(/,/g, '') || '';
        const total = parseFloat(totalRaw);
        if (!totalRaw || isNaN(total) || total <= 0) {
            hideSplitResults();
            return;
        }

        const taxRaw = elements.splitTax?.value.replace(/,/g, '') || '';
        const tipRaw = elements.splitTip?.value.replace(/,/g, '') || '';
        const discRaw = elements.splitDiscount?.value.replace(/,/g, '') || '';
        const taxPct = parseFloat(taxRaw) || 0;
        const tipPct = parseFloat(tipRaw) || 0;
        const discount = parseFloat(discRaw) || 0;
        const count = splitState.peopleCount;
        const roundOff = splitState.roundOff;
        const proportional = splitState.proportionalTax;

        let subtotal = total - discount;
        const taxAmount = subtotal * taxPct / 100;
        const tipAmount = subtotal * tipPct / 100;
        const grandTotal = subtotal + taxAmount + tipAmount;

        let shares = [];

        if (splitState.mode === 'equal') {
            const perPerson = grandTotal / count;
            for (let i = 0; i < count; i++) {
                shares.push(roundOff ? Math.round(perPerson) : perPerson);
            }
        } else if (splitState.mode === 'custom') {
            let customTotal = 0;
            const customValues = [];
            for (let i = 0; i < count; i++) {
                const input = document.querySelector(`.person-value-input[data-index="${i}"]`);
                const val = parseFloat(input?.value.replace(/,/g, '') || '0');
                customValues.push(val || 0);
                customTotal += val || 0;
            }
            if (customTotal <= 0) { hideSplitResults(); return; }
            const factor = grandTotal / customTotal;
            for (let i = 0; i < count; i++) {
                const share = customValues[i] * factor;
                shares.push(roundOff ? Math.round(share) : share);
            }
        } else if (splitState.mode === 'percent') {
            let pctTotal = 0;
            const pcts = [];
            for (let i = 0; i < count; i++) {
                const input = document.querySelector(`.person-value-input[data-index="${i}"]`);
                const val = parseFloat(input?.value.replace(/,/g, '') || '0');
                pcts.push(val || 0);
                pctTotal += val || 0;
            }
            if (pctTotal <= 0) { hideSplitResults(); return; }
            const factor = 100 / pctTotal;
            for (let i = 0; i < count; i++) {
                const share = grandTotal * (pcts[i] * factor) / 100;
                shares.push(roundOff ? Math.round(share) : share);
            }
        } else if (splitState.mode === 'ratio') {
            let ratioTotal = 0;
            const ratios = [];
            for (let i = 0; i < count; i++) {
                const input = document.querySelector(`.person-value-input[data-index="${i}"]`);
                const val = parseFloat(input?.value.replace(/,/g, '') || '0');
                ratios.push(val || 0);
                ratioTotal += val || 0;
            }
            if (ratioTotal <= 0) { hideSplitResults(); return; }
            for (let i = 0; i < count; i++) {
                const share = grandTotal * (ratios[i] / ratioTotal);
                shares.push(roundOff ? Math.round(share) : share);
            }
        } else if (splitState.mode === 'items') {
            const itemAmounts = {};
            for (let i = 0; i < count; i++) itemAmounts[splitState.personNames[i] || `Person ${i+1}`] = 0;
            for (const item of splitState.items) {
                const amt = parseFloat(item.amount) || 0;
                const assignee = item.assignee || splitState.personNames[0];
                if (itemAmounts[assignee] !== undefined) itemAmounts[assignee] += amt;
            }
            let itemTotal = 0;
            const itemShares = [];
            for (let i = 0; i < count; i++) {
                const name = splitState.personNames[i] || `Person ${i+1}`;
                const amt = itemAmounts[name] || 0;
                itemShares.push(amt);
                itemTotal += amt;
            }
            if (itemTotal <= 0) { hideSplitResults(); return; }
            if (proportional) {
                const factor = grandTotal / itemTotal;
                for (let i = 0; i < count; i++) {
                    shares.push(roundOff ? Math.round(itemShares[i] * factor) : itemShares[i] * factor);
                }
            } else {
                const taxTipPerPerson = (taxAmount + tipAmount) / count;
                for (let i = 0; i < count; i++) {
                    const share = itemShares[i] + taxTipPerPerson;
                    shares.push(roundOff ? Math.round(share) : share);
                }
            }
        }

        // Adjust rounding differences
        if (roundOff) {
            const sumRounded = shares.reduce((a, b) => a + b, 0);
            const diff = Math.round(grandTotal) - sumRounded;
            if (diff !== 0 && shares.length > 0) shares[0] += diff;
        }

        displaySplitResults(shares, subtotal, taxAmount, tipAmount, discount, grandTotal);
    }

    function displaySplitResults(shares, subtotal, taxAmt, tipAmt, discount, grandTotal) {
        const count = splitState.peopleCount;
        const fmt = (v) => '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });

        // Update person share displays
        for (let i = 0; i < count; i++) {
            const display = document.querySelector(`.person-share-display[data-index="${i}"]`);
            if (display) display.textContent = fmt(shares[i]);
        }

        // Generate result summary
        let resultHTML = '<div class="result-pills">';
        for (let i = 0; i < count; i++) {
            const name = splitState.personNames[i] || `Person ${i+1}`;
            const color = PERSON_COLORS[i % PERSON_COLORS.length];
            resultHTML += `
                <div class="result-pill">
                    <div class="pill-label" style="color:${color}">${name}</div>
                    <div class="pill-value">${fmt(shares[i])}</div>
                </div>`;
        }
        resultHTML += '</div>';
        elements.splitResult.innerHTML = resultHTML;
        elements.splitSkeleton?.classList.add('hidden');

        // Breakdown cards
        let breakdownHTML = '';
        for (let i = 0; i < count; i++) {
            const name = splitState.personNames[i] || `Person ${i+1}`;
            const color = PERSON_COLORS[i % PERSON_COLORS.length];
            let detail = '';
            if (splitState.mode === 'equal') detail = 'Equal share';
            else if (splitState.mode === 'custom') detail = 'Custom amount (adjusted)';
            else if (splitState.mode === 'percent') detail = 'Percentage based';
            else if (splitState.mode === 'ratio') detail = 'Ratio based';
            else if (splitState.mode === 'items') detail = 'Items + shared extras';
            breakdownHTML += `
                <div class="split-person-card">
                    <div class="spc-left">
                        <span class="spc-dot" style="background:${color}"></span>
                        <div>
                            <div class="spc-name">${name}</div>
                            <div class="spc-detail">${detail}</div>
                        </div>
                    </div>
                    <div class="spc-amount">${fmt(shares[i])}</div>
                </div>`;
        }
        elements.splitPeopleResult.innerHTML = breakdownHTML;
        elements.splitBreakdown?.classList.remove('hidden');

        // Summary strip
        if (elements.splitSubtotal) elements.splitSubtotal.textContent = fmt(subtotal + discount);
        if (elements.splitTaxDisplay) elements.splitTaxDisplay.textContent = fmt(taxAmt);
        if (elements.splitTipDisplay) elements.splitTipDisplay.textContent = fmt(tipAmt);
        if (elements.splitDiscountDisplay) elements.splitDiscountDisplay.textContent = '-' + fmt(discount);
        if (elements.splitTotalDisplay) elements.splitTotalDisplay.textContent = fmt(grandTotal);

        // Settlement suggestions
        const avg = grandTotal / count;
        let settleHTML = '';
        const payments = [];
        for (let i = 0; i < count; i++) {
            const diff = shares[i] - avg;
            payments.push({ name: splitState.personNames[i] || `Person ${i+1}`, diff });
        }
        const debtors = payments.filter(p => p.diff < 0).sort((a, b) => a.diff - b.diff);
        const creditors = payments.filter(p => p.diff > 0).sort((a, b) => b.diff - a.diff);
        let di = 0, ci = 0;
        while (di < debtors.length && ci < creditors.length) {
            const owed = -debtors[di].diff;
            const gets = creditors[ci].diff;
            const amount = Math.min(owed, gets);
            if (amount > 1) {
                settleHTML += `
                    <div class="settlement-suggestion">
                        <i class="bi bi-arrow-right-circle-fill ss-arrow"></i>
                        <span class="ss-text"><strong>${debtors[di].name}</strong> pays <strong>${creditors[ci].name}</strong></span>
                        <span class="ss-amount">${fmt(amount)}</span>
                    </div>`;
            }
            debtors[di].diff += amount;
            creditors[ci].diff -= amount;
            if (Math.abs(debtors[di].diff) < 1) di++;
            if (Math.abs(creditors[ci].diff) < 1) ci++;
        }
        if (settleHTML) {
            elements.splitSettlementBody.innerHTML = settleHTML;
            elements.splitSettlement?.classList.remove('hidden');
        } else {
            elements.splitSettlement?.classList.add('hidden');
        }

        elements.splitActions?.classList.remove('hidden');

        // Store result
        appState.currentSplitResult = {
            shares, subtotal, taxAmt, tipAmt, discount, grandTotal,
            names: [...splitState.personNames],
            mode: splitState.mode,
            roundOff: splitState.roundOff,
            text: generateSplitText(shares, subtotal, taxAmt, tipAmt, discount, grandTotal)
        };

        saveToHistory('Bill Split', {
            summary: `${count} people · ${fmt(grandTotal)}`,
            ...appState.currentSplitResult
        });
        saveResultsToStorage();
    }

    function generateSplitText(shares, subtotal, taxAmt, tipAmt, discount, grandTotal) {
        const fmt = (v) => '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
        const names = splitState.personNames;
        let text = `📋 Bill Split Summary\n${'━'.repeat(28)}\n`;
        text += `Subtotal: ${fmt(subtotal + discount)}\n`;
        if (taxAmt > 0) text += `Tax: ${fmt(taxAmt)}\n`;
        if (tipAmt > 0) text += `Tip: ${fmt(tipAmt)}\n`;
        if (discount > 0) text += `Discount: -${fmt(discount)}\n`;
        text += `${'─'.repeat(28)}\n`;
        text += `Grand Total: ${fmt(grandTotal)}\n`;
        text += `${'━'.repeat(28)}\n`;
        text += `🧑 Split (${splitState.mode}):\n`;
        for (let i = 0; i < names.length; i++) {
            text += `  ${names[i]}: ${fmt(shares[i])}\n`;
        }
        return text;
    }

    function hideSplitResults() {
        elements.splitResult.innerHTML = '';
        elements.splitBreakdown?.classList.add('hidden');
        elements.splitSettlement?.classList.add('hidden');
        elements.splitActions?.classList.add('hidden');
        for (let i = 0; i < splitState.peopleCount; i++) {
            const display = document.querySelector(`.person-share-display[data-index="${i}"]`);
            if (display) display.textContent = '';
        }
    }

    // --- People Count Buttons ---
    elements.peopleMinus?.addEventListener('click', () => {
        playClickSound();
        if (splitState.peopleCount > 2) {
            splitState.peopleCount--;
            splitState.personNames = splitState.personNames.slice(0, splitState.peopleCount);
            elements.splitPeople.value = splitState.peopleCount;
            initSplitPeople();
            if (elements.splitTotal?.value) autoCalculateSplit();
        } else {
            vibrate(20);
        }
    });

    elements.peoplePlus?.addEventListener('click', () => {
        playClickSound();
        if (splitState.peopleCount < 10) {
            splitState.peopleCount++;
            splitState.personNames.push(`Person ${splitState.peopleCount}`);
            elements.splitPeople.value = splitState.peopleCount;
            initSplitPeople();
            if (elements.splitTotal?.value) autoCalculateSplit();
        } else {
            vibrate(20);
        }
    });

    // --- Split Mode Chips ---
    elements.splitModeChips?.addEventListener('click', (e) => {
        const chip = e.target.closest('.split-chip');
        if (!chip) return;
        playClickSound();
        document.querySelectorAll('.split-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const mode = chip.dataset.mode;
        splitState.mode = mode;
        elements.splitModeInput.value = mode;
        elements.itemsSection?.classList.toggle('hidden', mode !== 'items');

        // Reload person inputs for new mode
        initSplitPeople();
        if (elements.splitTotal?.value) autoCalculateSplit();
    });

    // --- Items Management ---
    let itemIdCounter = 0;

    function addItemRow(name = '', amount = '', assignee = '') {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.dataset.itemId = itemIdCounter++;
        const personOpts = splitState.personNames.map((n, i) =>
            `<option value="${escapeHtml(n)}" ${assignee === n || (!assignee && i === 0) ? 'selected' : ''}>${escapeHtml(n)}</option>`
        ).join('');
        row.innerHTML = `
            <input type="text" class="item-name" placeholder="Item name" value="${escapeHtml(name)}">
            <div class="item-amount-wrap">
                <span class="item-currency">₹</span>
                <input type="text" inputmode="decimal" class="item-amount" placeholder="0.00" value="${amount}">
            </div>
            <select class="item-assignee">${personOpts}</select>
            <button type="button" class="item-remove-btn"><i class="bi bi-dash-circle"></i></button>
        `;
        elements.itemsList.appendChild(row);

        const nameInput = row.querySelector('.item-name');
        const amtInput = row.querySelector('.item-amount');
        const assignSelect = row.querySelector('.item-assignee');
        const removeBtn = row.querySelector('.item-remove-btn');

        nameInput.addEventListener('input', syncItems);
        amtInput.addEventListener('input', () => { formatInputValue(amtInput); syncItems(); autoCalculateSplit(); });
        assignSelect.addEventListener('change', () => { syncItems(); autoCalculateSplit(); });
        removeBtn.addEventListener('click', () => {
            row.remove();
            syncItems();
            autoCalculateSplit();
        });

        // Enable/disable remove buttons
        updateItemRemoveButtons();
        syncItems();
        autoCalculateSplit();
    }

    function syncItems() {
        splitState.items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            const name = row.querySelector('.item-name')?.value || '';
            const amount = row.querySelector('.item-amount')?.value.replace(/,/g, '') || '';
            const assignee = row.querySelector('.item-assignee')?.value || '';
            splitState.items.push({ name, amount, assignee });
        });
        updateItemRemoveButtons();
    }

    function updateItemRemoveButtons() {
        const rows = document.querySelectorAll('.item-row');
        rows.forEach((row, i) => {
            const btn = row.querySelector('.item-remove-btn');
            if (btn) btn.disabled = rows.length <= 1;
        });
    }

    elements.addItemBtn?.addEventListener('click', () => {
        playClickSound();
        addItemRow();
    });

    // Init with one item row
    addItemRow('Item 1', '', splitState.personNames[0] || 'Person 1');

    // --- Toggles ---
    elements.roundToggle?.addEventListener('click', () => {
        playClickSound();
        splitState.roundOff = !splitState.roundOff;
        elements.roundToggle.setAttribute('aria-checked', splitState.roundOff);
        elements.roundToggle.classList.toggle('on', splitState.roundOff);
        const pill = elements.roundToggle.querySelector('.toggle-pill');
        if (pill) pill.classList.toggle('on', splitState.roundOff);
        const knob = elements.roundToggle.querySelector('.toggle-knob');
        if (knob) knob.classList.toggle('on', splitState.roundOff);
        if (elements.splitTotal?.value) autoCalculateSplit();
    });

    elements.splitTaxToggle?.addEventListener('click', () => {
        playClickSound();
        splitState.proportionalTax = !splitState.proportionalTax;
        elements.splitTaxToggle.setAttribute('aria-checked', splitState.proportionalTax);
        elements.splitTaxToggle.classList.toggle('on', splitState.proportionalTax);
        const pill = elements.splitTaxToggle.querySelector('.toggle-pill');
        if (pill) pill.classList.toggle('on', splitState.proportionalTax);
        const knob = elements.splitTaxToggle.querySelector('.toggle-knob');
        if (knob) knob.classList.toggle('on', splitState.proportionalTax);
        elements.splitTaxMode.value = splitState.proportionalTax ? 'proportional' : 'equal';
        if (elements.splitTotal?.value) autoCalculateSplit();
    });

    // --- Auto-calculate on input ---
    elements.splitTotal?.addEventListener('input', () => { autoCalculateSplit(); });
    elements.splitTax?.addEventListener('input', () => { if (elements.splitTotal?.value) autoCalculateSplit(); });
    elements.splitTip?.addEventListener('input', () => { if (elements.splitTotal?.value) autoCalculateSplit(); });
    elements.splitDiscount?.addEventListener('input', () => { if (elements.splitTotal?.value) autoCalculateSplit(); });

    // --- Form Submit ---
    elements.splitForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        vibrate(15);
        elements.splitSkeleton?.classList.remove('hidden');
        elements.splitResult.innerHTML = '';
        elements.splitBreakdown?.classList.add('hidden');
        elements.splitSettlement?.classList.add('hidden');
        elements.splitActions?.classList.add('hidden');

        setTimeout(() => {
            calculateSplit();
        }, 300);
    });

    // --- Clear ---
    elements.clearSplit?.addEventListener('click', () => {
        playClickSound();
        elements.splitForm?.reset();
        elements.splitTotal.value = '';
        elements.splitTax.value = '';
        elements.splitTip.value = '';
        elements.splitDiscount.value = '';
        elements.splitResult.innerHTML = '';
        elements.splitBreakdown?.classList.add('hidden');
        elements.splitSettlement?.classList.add('hidden');
        elements.splitActions?.classList.add('hidden');
        elements.splitSkeleton?.classList.add('hidden');

        splitState.peopleCount = 2;
        splitState.personNames = ['Person 1', 'Person 2'];
        splitState.mode = 'equal';
        splitState.roundOff = false;
        splitState.proportionalTax = true;
        splitState.items = [];
        elements.splitPeople.value = '2';

        // Reset mode chips
        document.querySelectorAll('.split-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.split-chip[data-mode="equal"]')?.classList.add('active');
        elements.splitModeInput.value = 'equal';
        elements.itemsSection?.classList.add('hidden');

        // Reset toggles
        elements.roundToggle.setAttribute('aria-checked', 'false');
        elements.roundToggle.classList.remove('on');
        const rPill = elements.roundToggle.querySelector('.toggle-pill');
        if (rPill) rPill.classList.remove('on');
        const rKnob = elements.roundToggle.querySelector('.toggle-knob');
        if (rKnob) rKnob.classList.remove('on');

        elements.splitTaxToggle.setAttribute('aria-checked', 'true');
        elements.splitTaxToggle.classList.add('on');
        const tPill = elements.splitTaxToggle.querySelector('.toggle-pill');
        if (tPill) tPill.classList.add('on');
        const tKnob = elements.splitTaxToggle.querySelector('.toggle-knob');
        if (tKnob) tKnob.classList.add('on');
        elements.splitTaxMode.value = 'proportional';

        // Reset items
        elements.itemsList.innerHTML = '';
        addItemRow('Item 1', '', 'Person 1');

        // Reset people
        initSplitPeople();

        ['split-total', 'split-tax', 'split-tip', 'split-discount'].forEach(id => {
            const el = document.getElementById(id);
            el?.closest('.input-wrapper')?.classList.remove('valid', 'invalid');
            el?.closest('.input-with-prefix')?.classList.remove('filled');
            const errorEl = document.getElementById(`${id}-error`);
            if (errorEl) errorEl.textContent = '';
        });
    });

    // --- Share & WhatsApp ---
    elements.splitShare?.addEventListener('click', async () => {
        playClickSound();
        const text = appState.currentSplitResult?.text || '';
        await shareContent('Bill Split', text);
    });

    elements.splitWhatsapp?.addEventListener('click', () => {
        playClickSound();
        const text = appState.currentSplitResult?.text || '';
        shareToWhatsApp(text);
    });

    // Init people on load
    initSplitPeople();

    // ============================================================
    // Discount Calculator
    // ============================================================

    function calculateDiscount() {
        const priceRaw = elements.discountPrice?.value.replace(/,/g, '') || '';
        const pctRaw = elements.discountPct?.value.replace(/,/g, '') || '';
        const price = parseFloat(priceRaw);
        const pct = parseFloat(pctRaw);

        if (!priceRaw || isNaN(price) || price < 0) {
            elements.discountResult?.classList.add('hidden');
            elements.discountActions?.classList.add('hidden');
            appState.currentDiscountResult = null;
            return;
        }

        const p = isNaN(pct) || pct < 0 ? 0 : pct;
        const discountAmt = price * p / 100;
        const finalPrice = price - discountAmt;

        const fmtINR = (v) => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (elements.dSavePct) elements.dSavePct.textContent = `${p.toLocaleString('en-IN')}% OFF`;
        if (elements.dSaveAmount) elements.dSaveAmount.textContent = fmtINR(discountAmt);
        if (elements.dOriginal) elements.dOriginal.textContent = fmtINR(price);
        if (elements.dDiscountAmt) elements.dDiscountAmt.textContent = '− ' + fmtINR(discountAmt);
        if (elements.dFinal) elements.dFinal.textContent = fmtINR(finalPrice);

        elements.discountResult?.classList.remove('hidden');
        elements.discountActions?.classList.remove('hidden');

        appState.currentDiscountResult = {
            price: price,
            pct: p,
            discountAmt: discountAmt,
            finalPrice: finalPrice,
            text: `Discount Calculator\nPrice: ${fmtINR(price)}\nDiscount: ${p}% (− ${fmtINR(discountAmt)})\nFinal Price: ${fmtINR(finalPrice)}`
        };

        saveResultsToStorage();
    }

    // Live auto-calc on input
    elements.discountPrice?.addEventListener('input', () => {
        playClickSound();
        vibrate(5);
        calculateDiscount();
    });

    elements.discountPct?.addEventListener('input', () => {
        playClickSound();
        vibrate(5);
        // Sync active preset chip
        document.querySelectorAll('.discount-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.pct === elements.discountPct.value);
        });
        calculateDiscount();
    });

    // Preset chips
    elements.discountPresets?.addEventListener('click', (e) => {
        const chip = e.target.closest('.discount-chip');
        if (!chip) return;
        playClickSound();
        vibrate(8);
        document.querySelectorAll('.discount-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        elements.discountPct.value = chip.dataset.pct;
        calculateDiscount();
    });

    // Form submit
    elements.discountForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        playClickSound();
        vibrate(15);
        calculateDiscount();
        if (appState.currentDiscountResult) {
            const r = appState.currentDiscountResult;
            saveToHistory('Discount', {
                summary: `${r.price.toLocaleString('en-IN')} · ${r.pct}% off → ${'₹' + r.finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                price: r.price,
                pct: r.pct,
                discountAmt: r.discountAmt,
                finalPrice: r.finalPrice
            });
            saveResultsToStorage();
        }
    });

    // Clear
    elements.clearDiscount?.addEventListener('click', () => {
        playClickSound();
        elements.discountForm?.reset();
        document.querySelectorAll('.discount-chip').forEach(c => c.classList.remove('active'));
        elements.discountResult?.classList.add('hidden');
        elements.discountActions?.classList.add('hidden');
        appState.currentDiscountResult = null;
        ['discount-price', 'discount-pct'].forEach(id => {
            const el = document.getElementById(id);
            el?.closest('.input-with-prefix')?.classList.remove('filled');
        });
    });

    // Share & WhatsApp
    elements.discountShare?.addEventListener('click', async () => {
        playClickSound();
        const text = appState.currentDiscountResult?.text || '';
        await shareContent('Discount Calculator', text);
    });

    elements.discountWhatsapp?.addEventListener('click', () => {
        playClickSound();
        const text = appState.currentDiscountResult?.text || '';
        shareToWhatsApp(text);
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
        elements.startDateInput.value = '';
        elements.endDateInput.value = '';
        const sdDisp = document.getElementById('start-date-display');
        if (sdDisp) { sdDisp.textContent = 'Select date'; sdDisp.parentElement.classList.remove('filled'); }
        const edDisp = document.getElementById('end-date-display');
        if (edDisp) { edDisp.textContent = 'Select date'; edDisp.parentElement.classList.remove('filled'); }
        
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
        appState.currentResult = null;
        localStorage.removeItem('calcResults');
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
        const exprText = formatExpression(calcState.expression);
        elements.expressionSpan.textContent = exprText;

        // Auto-scroll expression to end
        if (elements.expressionSpan) {
            elements.expressionSpan.scrollLeft = elements.expressionSpan.scrollWidth;
        }

        // Toggle left-fade on expression when overflowed
        const exprWrap = elements.expressionSpan?.closest('.calc-expression-wrap');
        if (exprWrap) {
            const hasOverflow = elements.expressionSpan.scrollWidth > elements.expressionSpan.clientWidth;
            exprWrap.classList.toggle('is-scrolled', hasOverflow);
        }

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
            const displayValue = value === '' ? 'Error' : formatNumber(value);
            elements.resultSpan.textContent = displayValue;
            applyResultFontSize(displayValue);
        } else {
            elements.calcDisplay?.classList.add('typing-mode');
            // Always show interim result unhighlighted below expression
            const displayValue = value !== '' ? formatNumber(value) : '';
            elements.resultSpan.textContent = displayValue;
            applyResultFontSize(displayValue);
        }

        // Auto-scroll result to end
        if (elements.resultSpan) {
            elements.resultSpan.scrollLeft = elements.resultSpan.scrollWidth;
        }

    }

    function applyResultFontSize(text) {
        if (!elements.resultSpan) return;
        if (!text || text === 'Error' || text === '') return;

        // Count visible digits only
        const digitCount = text.replace(/[^0-9]/g, '').length;

        let size;
        if (digitCount <= 10)          size = 44;
        else if (digitCount <= 14)     size = 40;
        else if (digitCount <= 18)     size = 36;
        else if (digitCount <= 24)     size = 32;
        else if (digitCount <= 30)     size = 28;
        else if (digitCount <= 36)     size = 26;
        else                           size = 22;

        // Clamp between min and max
        const maxWidth = elements.resultSpan.parentElement?.clientWidth || 300;
        // Use intrinsic measurement — if text still wider, shrink further
        elements.resultSpan.style.fontSize = size + 'px';

        // If still overflowing after setting size, reduce by 2px until it fits
        let currentSize = size;
        while (elements.resultSpan.scrollWidth > maxWidth + 2 && currentSize > 12) {
            currentSize -= 2;
            elements.resultSpan.style.fontSize = currentSize + 'px';
        }
    }

    // ============================================================
    // Number Formatting Utilities
    // ============================================================
    
    function formatNumber(num) {
        if (num === 'Error' || (!num && num !== 0)) return num || '';
        const parsed = parseFloat(num);
        if (isNaN(parsed)) return num;
        if (Number.isInteger(parsed)) {
            return parsed.toLocaleString('en-IN');
        }
        return parsed.toLocaleString('en-IN', { maximumFractionDigits: 10 });
    }

    function formatExpression(expr) {
        try {
            return expr.replace(/\d+(\.\d*)?/g, match => {
                if (!match) return match;
                const hasTrailingDot = match.endsWith('.') && match.indexOf('.') === match.length - 1;
                const cleanMatch = hasTrailingDot ? match.slice(0, -1) : match;
                if (!cleanMatch) return match;
                const parsed = parseFloat(cleanMatch);
                if (isNaN(parsed)) return match;
                const formatted = parsed.toLocaleString('en-IN');
                return hasTrailingDot ? formatted + '.' : formatted;
            });
        } catch {
            return expr;
        }
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