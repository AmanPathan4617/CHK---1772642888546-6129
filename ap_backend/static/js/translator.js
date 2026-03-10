(function () {
    'use strict';

    // Lazy-load Google Translate when opening the dropdown to avoid rendering issues in hidden container
    let gteLoaded = false;
    let gteInited = false;
    let gteInitAttempts = 0;

    function setError(msg) {
        const el = document.getElementById('translator-error');
        if (!el) return;
        el.textContent = msg || '';
        el.style.display = msg ? 'block' : 'none';
    }

    function isDropdownVisible() {
        const dropdown = document.getElementById('translator-dropdown');
        return !!(dropdown && dropdown.classList.contains('open'));
    }

    function googleTranslateElementInit() {
        if (gteInited) return;
        gteInitAttempts += 1;
        if (gteInitAttempts > 25) {
            setError('Translator failed to start. Please refresh the page or check your internet/certificate settings.');
            return;
        }
        try {
            const el = document.getElementById('google_translate_element');
            if (!el) return;

            // Only init once dropdown is open/visible; otherwise the combo may not render.
            if (!isDropdownVisible()) {
                setTimeout(googleTranslateElementInit, 200);
                return;
            }

            if (!(window.google && google.translate && google.translate.TranslateElement)) {
                setTimeout(googleTranslateElementInit, 300);
                return;
            }

            // Clear any previous error.
            setError('');

            // Some builds do not expose InlineLayout; avoid referencing it.
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false
            }, 'google_translate_element');
            gteInited = true;
        } catch (e) {
            console.warn('Translate init retry soon', e);
            setTimeout(googleTranslateElementInit, 500);
        }
    }

    function loadGoogleTranslate() {
        if (gteLoaded) {
            // If the library is loaded but not initialized yet, initialize now
            if (!gteInited && window.google && google.translate) {
                googleTranslateElementInit();
            }
            return;
        }
        // Define callback for Google script
        window.googleTranslateElementInit = googleTranslateElementInit;
        const s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        s.async = true;
        s.onerror = function () {
            console.error('Failed to load Google Translate script');
            setError('Translator failed to load (network/certificate blocked).');
        };
        document.head.appendChild(s);
        gteLoaded = true;
    }

    function initTranslator() {
        const toggle = document.getElementById('translator-toggle');
        const dropdown = document.getElementById('translator-dropdown');
        if (!toggle || !dropdown) {
            return;
        }

        // Avoid double-binding if init runs twice
        if (toggle.dataset && toggle.dataset.bound === '1') return;
        if (toggle.dataset) toggle.dataset.bound = '1';

        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Open first so container is visible, then load/initialize
            const willOpen = !dropdown.classList.contains('open');
            dropdown.classList.toggle('open');
            toggle.setAttribute('aria-expanded', dropdown.classList.contains('open') ? 'true' : 'false');
            if (willOpen) {
                // Defer to next frame to ensure visibility before init
                requestAnimationFrame(() => {
                    setError('');
                    loadGoogleTranslate();
                    // If already loaded but not inited, init after opening
                    googleTranslateElementInit();
                });
            }
        });

        document.addEventListener('click', function (e) {
            // If the Google language menu iframe is present, keep dropdown open
            const menuFrame = document.querySelector('.goog-te-menu-frame.skiptranslate');
            if (menuFrame) return;
            // Close only if clicking truly outside toggle and dropdown
            if (!dropdown.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
                dropdown.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close dropdown shortly after a language is chosen by observing the menu iframe removal
        const observer = new MutationObserver(() => {
            const menuFrame = document.querySelector('.goog-te-menu-frame.skiptranslate');
            if (!menuFrame && dropdown.classList.contains('open')) {
                // Menu closed -> close our dropdown too
                dropdown.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTranslator);
    } else {
        initTranslator();
    }
})();
