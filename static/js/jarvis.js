(function () {
  if (window.__AUTO_PRO_ELITE_JARVIS__) return;
  window.__AUTO_PRO_ELITE_JARVIS__ = true;

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var supportsRecognition = !!SpeechRecognition;

  var root = document.getElementById("jarvisRoot");
  var micBtn = document.getElementById("jarvisMic");
  var closeBtn = document.getElementById("jarvisClose");
  var startStopBtn = document.getElementById("jarvisStartStop");
  var helpBtn = document.getElementById("jarvisHelp");
  var statusEl = document.getElementById("jarvisStatus");
  var logEl = document.getElementById("jarvisLog");

  if (!root || !micBtn || !closeBtn || !startStopBtn || !helpBtn || !statusEl || !logEl) return;

  var state = {
    open: false,
    listening: false,
    recognition: null,
    currentLang: "en-IN",
    greeted: false,
    formFill: null,
    awaitingFormValue: false,
    wakeWordEnabled: false,
    shouldAutoRestart: false,
    lastError: "",
    resumeAfterSpeak: false,
  };

  var STORAGE_KEYS = {
    open: "ap_jarvis_open",
    listening: "ap_jarvis_listening",
    lang: "ap_jarvis_lang",
  };

  function storageGet(key, fallback) {
    try {
      var v = window.sessionStorage.getItem(key);
      if (v === null || v === undefined) return fallback;
      return v;
    } catch (e) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      // ignore
    }
  }

  var NAV_COMMANDS = [
    { patterns: ["open dashboard", "go to dashboard", "show dashboard"], url: "/dashboard" },
    { patterns: ["open services", "go to services", "show services"], url: "/services" },
    { patterns: ["open booking", "go to booking", "show booking"], url: "/booking" },
    { patterns: ["open vehicles", "go to vehicles", "show vehicles"], url: "/vehicles" },
    { patterns: ["open customers", "go to customers", "show customers"], url: "/customers" },
    { patterns: ["open shop", "go to shop", "show shop", "open cars", "shop cars"], url: "/shop/" },
    { patterns: ["open sell", "sell car", "sell my car", "open sell car"], url: "/sell-car/" },
    { patterns: ["open contact", "contact page", "open contact us"], url: "/contact/" },
    { patterns: ["open login", "login page", "open sign in"], url: "/login/" },
    { patterns: ["open register", "register account", "open signup", "open sign up"], url: "/signup/" },
  ];

  // Offline phrase mapping for Marathi/Hindi examples (no external API required)
  var LOCALE_MAP = [
    { from: "डॅशबोर्ड उघड", to: "open dashboard" },
    { from: "सेवा उघड", to: "open services" },
    { from: "बुकिंग उघड", to: "open booking" },
    { from: "वाहने उघड", to: "open vehicles" },
    { from: "ग्राहक उघड", to: "open customers" },
    { from: "लॉगिन उघड", to: "open login" },
    { from: "नोंदणी उघड", to: "open register" },
    { from: "वर स्क्रोल", to: "scroll up" },
    { from: "खाली स्क्रोल", to: "scroll down" },
    { from: "वर जा", to: "scroll to top" },
    { from: "खाली जा", to: "scroll to bottom" },
    { from: "फॉर्म भरा", to: "fill the form" },
    { from: "फॉर्म सबमिट", to: "submit form" },

    { from: "डैशबोर्ड खोलो", to: "open dashboard" },
    { from: "लॉगिन खोलो", to: "open login" },
    { from: "रजिस्टर खोलो", to: "open register" },
  ];

  function setOpen(open) {
    state.open = open;
    root.classList.toggle("open", open);
    storageSet(STORAGE_KEYS.open, open ? "1" : "0");
    if (open) greetOnce();
  }

  function escapeSelector(v) {
    try {
      if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(v);
    } catch (e) {
      // ignore
    }
    return String(v).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function setListening(listening) {
    state.listening = listening;
    root.classList.toggle("listening", listening);
    startStopBtn.textContent = listening ? "Stop Listening" : "Start Listening";
    statusEl.textContent = listening ? "Listening…" : "Ready";
    storageSet(STORAGE_KEYS.listening, listening ? "1" : "0");
  }

  function appendLog(who, text) {
    var row = document.createElement("div");
    row.className = "row";
    var label = document.createElement("div");
    label.className = who === "you" ? "you" : "me";
    label.textContent = who === "you" ? "You" : "Jarvis";
    var msg = document.createElement("div");
    msg.textContent = text;
    row.appendChild(label);
    row.appendChild(msg);
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      // Speech synthesis can cause SpeechRecognition to stop after the first command.
      // To keep multi-command listening stable, pause recognition while speaking
      // and resume it once the utterance finishes.
      if (state.listening) {
        state.resumeAfterSpeak = true;
        stopRecognition();
      }

      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = state.currentLang || "en-IN";
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;

      u.onend = function () {
        if (state.resumeAfterSpeak) {
          state.resumeAfterSpeak = false;
          startRecognition();
        }
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      // ignore
    }
  }

  function greetOnce() {
    if (state.greeted) return;
    state.greeted = true;
    var msg = "Hello, welcome to Auto Pro Elite. I am your AI assistant Jarvis. How can I help you?";
    appendLog("me", msg);
    speak(msg);
  }

  function normalize(text) {
    var t = (text || "").trim();
    if (!t) return "";

    for (var i = 0; i < LOCALE_MAP.length; i++) {
      if (t.indexOf(LOCALE_MAP[i].from) !== -1) {
        t = t.replace(LOCALE_MAP[i].from, LOCALE_MAP[i].to);
      }
    }

    t = t
      .toLowerCase()
      .replace(/[\?\!\.\,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (state.wakeWordEnabled) {
      if (t.startsWith("hey jarvis ")) t = t.slice("hey jarvis ".length);
      else if (t === "hey jarvis") t = "";
      else if (t.startsWith("hey auto ")) t = t.slice("hey auto ".length);
      else if (t === "hey auto") t = "";
    }

    return t;
  }

  function findNavCommand(t) {
    for (var i = 0; i < NAV_COMMANDS.length; i++) {
      for (var j = 0; j < NAV_COMMANDS[i].patterns.length; j++) {
        if (t === NAV_COMMANDS[i].patterns[j]) return NAV_COMMANDS[i];
      }
    }
    return null;
  }

  function scrollCommand(t) {
    if (t === "scroll down") {
      window.scrollBy({ top: Math.round(window.innerHeight * 0.8), left: 0, behavior: "smooth" });
      return "Scrolling down";
    }
    if (t === "scroll up") {
      window.scrollBy({ top: -Math.round(window.innerHeight * 0.8), left: 0, behavior: "smooth" });
      return "Scrolling up";
    }
    if (t === "scroll to top") {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      return "Scrolling to top";
    }
    if (t === "scroll to bottom") {
      window.scrollTo({ top: document.body.scrollHeight, left: 0, behavior: "smooth" });
      return "Scrolling to bottom";
    }
    return null;
  }

  function visible(el) {
    if (!el) return false;
    if (el.disabled) return false;
    var rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    var style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity || "1") === 0) return false;
    return true;
  }

  function getLabelForField(field) {
    var id = field.getAttribute("id");
    if (id) {
      var label = document.querySelector('label[for="' + escapeSelector(id) + '"]');
      if (label && label.textContent) return label.textContent.trim();
    }
    var aria = field.getAttribute("aria-label");
    if (aria) return aria.trim();
    var ph = field.getAttribute("placeholder");
    if (ph) return ph.trim();
    var name = field.getAttribute("name");
    if (name) return name.trim();
    return "this field";
  }

  function collectFormFields() {
    var form = document.querySelector("form");
    if (!form) return null;

    var fields = Array.prototype.slice
      .call(form.querySelectorAll("input, select, textarea"))
      .filter(function (el) {
        if (!visible(el)) return false;
        var type = (el.getAttribute("type") || "").toLowerCase();
        if (type === "hidden" || type === "submit" || type === "button" || type === "reset") return false;
        return true;
      });

    if (!fields.length) return null;
    return { form: form, fields: fields, index: 0 };
  }

  function askNextField() {
    if (!state.formFill) return;
    if (state.formFill.index >= state.formFill.fields.length) {
      state.awaitingFormValue = false;
      state.formFill = null;
      var done = "Form is filled. Say 'submit form' to submit.";
      appendLog("me", done);
      speak(done);
      return;
    }

    var field = state.formFill.fields[state.formFill.index];
    var prompt = "What is your " + getLabelForField(field) + "?";
    state.awaitingFormValue = true;
    appendLog("me", prompt);
    speak(prompt);
    field.focus();
  }

  function fillCurrentField(valueText) {
    if (!state.formFill || !state.awaitingFormValue) return false;

    var field = state.formFill.fields[state.formFill.index];
    var tag = field.tagName.toLowerCase();

    if (tag === "select") {
      var valLower = valueText.toLowerCase();
      var options = Array.prototype.slice.call(field.options);
      var best = null;
      for (var i = 0; i < options.length; i++) {
        var optText = (options[i].textContent || "").trim().toLowerCase();
        if (!optText) continue;
        if (optText === valLower) {
          best = options[i];
          break;
        }
        if (!best && optText.indexOf(valLower) !== -1) best = options[i];
      }
      if (best) {
        field.value = best.value;
        field.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // no match
        appendLog("me", "I couldn't match that option. Please try again.");
        speak("I couldn't match that option. Please try again.");
        return true;
      }
    } else {
      field.value = valueText;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }

    state.awaitingFormValue = false;
    state.formFill.index += 1;
    askNextField();
    return true;
  }

  function clickByText(text) {
    var t = (text || "").trim().toLowerCase();
    if (!t) return false;

    var candidates = Array.prototype.slice.call(
      document.querySelectorAll("button, a, input[type=submit], input[type=button]")
    );

    candidates = candidates.filter(visible);

    var best = null;
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var label = (el.textContent || el.value || "").trim().toLowerCase();
      if (!label) continue;
      if (label === t) {
        best = el;
        break;
      }
      if (!best && label.indexOf(t) !== -1) best = el;
    }

    if (!best) return false;
    best.click();
    return true;
  }

  function submitAnyForm() {
    var form = (state.formFill && state.formFill.form) || document.querySelector("form");
    if (!form) return false;

    var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn && visible(submitBtn)) {
      submitBtn.click();
      return true;
    }

    // fallback: click button containing submit
    return clickByText("submit");
  }

  function handleCommand(rawText) {
    var t = normalize(rawText);
    if (!t) return;

    appendLog("you", rawText);

    // If we are in form fill mode, treat the next utterance as a value.
    if (fillCurrentField(rawText)) return;

    if (t === "help" || t === "commands") {
      var help =
        "You can say: open dashboard, open shop, scroll down, fill the form, submit form, or click submit.";
      appendLog("me", help);
      speak(help);
      return;
    }

    if (t === "english") {
      state.currentLang = "en-IN";
      storageSet(STORAGE_KEYS.lang, state.currentLang);
      if (state.recognition) state.recognition.lang = state.currentLang;
      var msgEn = "Switched to English.";
      appendLog("me", msgEn);
      speak(msgEn);
      return;
    }

    if (t === "marathi" || t === "marathi language") {
      state.currentLang = "mr-IN";
      storageSet(STORAGE_KEYS.lang, state.currentLang);
      if (state.recognition) state.recognition.lang = state.currentLang;
      var msgMr = "मराठी भाषा सुरू केली.";
      appendLog("me", msgMr);
      speak(msgMr);
      return;
    }

    var scrollMsg = scrollCommand(t);
    if (scrollMsg) {
      appendLog("me", scrollMsg);
      speak(scrollMsg);
      return;
    }

    if (t === "fill the form" || t === "fill form") {
      var ff = collectFormFields();
      if (!ff) {
        var noForm = "I couldn't find a form on this page.";
        appendLog("me", noForm);
        speak(noForm);
        return;
      }
      state.formFill = ff;
      var start = "Filling the form.";
      appendLog("me", start);
      speak(start);
      askNextField();
      return;
    }

    if (t === "submit form" || t === "click submit") {
      if (submitAnyForm()) {
        var submitMsg = "Submitting form.";
        appendLog("me", submitMsg);
        speak(submitMsg);
      } else {
        var cant = "I couldn't find a submit button.";
        appendLog("me", cant);
        speak(cant);
      }
      return;
    }

    if (t.indexOf("click ") === 0) {
      var target = t.slice("click ".length).trim();
      if (clickByText(target)) {
        var clickMsg = "Clicking " + target + ".";
        appendLog("me", clickMsg);
        speak(clickMsg);
      } else {
        var miss = "I couldn't find that button.";
        appendLog("me", miss);
        speak(miss);
      }
      return;
    }

    var nav = findNavCommand(t);
    if (nav) {
      var navMsg = "Opening " + (t.replace("open ", "") || "page") + ".";
      appendLog("me", navMsg);
      speak(navMsg);
      window.location.href = nav.url;
      return;
    }

    var unknown = "I didn't understand. Say 'commands' to see what I can do.";
    appendLog("me", unknown);
    speak(unknown);
  }

  function startRecognition() {
    if (!supportsRecognition) {
      var msg = "Speech recognition is not supported in this browser.";
      appendLog("me", msg);
      speak(msg);
      return;
    }

    if (state.recognition) {
      try {
        state.recognition.stop();
      } catch (e) {
        // ignore
      }
      state.recognition = null;
    }

    var rec = new SpeechRecognition();
    state.recognition = rec;
    rec.lang = state.currentLang;
    rec.interimResults = false;
    rec.continuous = true;

    state.shouldAutoRestart = true;
    state.lastError = "";

    rec.onstart = function () {
      setListening(true);
    };

    rec.onend = function () {
      setListening(false);
      if (state.shouldAutoRestart) {
        // Web Speech often stops automatically after a short time; restart.
        setTimeout(function () {
          if (!state.shouldAutoRestart) return;
          startRecognition();
        }, 60);
      }
    };

    rec.onerror = function (ev) {
      var err = (ev && ev.error) ? String(ev.error) : "unknown";
      state.lastError = err;
      setListening(false);

      // Common cases: user blocked mic permission or no-speech.
      if (err === "not-allowed" || err === "service-not-allowed") {
        state.shouldAutoRestart = false;
        appendLog("me", "Microphone permission is blocked. Please allow mic access and try again.");
        speak("Microphone permission is blocked. Please allow microphone access and try again.");
        return;
      }

      if (state.shouldAutoRestart) {
        setTimeout(function () {
          if (!state.shouldAutoRestart) return;
          startRecognition();
        }, 120);
      }
    };

    rec.onresult = function (event) {
      var last = event.results[event.results.length - 1];
      if (!last || !last[0]) return;
      var text = last[0].transcript || "";
      handleCommand(text);
    };

    try {
      rec.start();
    } catch (e) {
      setListening(false);
    }
  }

  function stopRecognition() {
    if (!state.recognition) {
      setListening(false);
      return;
    }
    state.shouldAutoRestart = false;
    try {
      state.recognition.stop();
    } catch (e) {
      // ignore
    }
    state.recognition = null;
    setListening(false);
  }

  micBtn.addEventListener("click", function () {
    setOpen(!state.open);
  });

  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });

  startStopBtn.addEventListener("click", function () {
    if (state.listening) stopRecognition();
    else startRecognition();
  });

  helpBtn.addEventListener("click", function () {
    var lines = [
      "Navigation: open dashboard/services/booking/vehicles/customers/shop/sell/contact/login/register",
      "Scroll: scroll up/down, scroll to top/bottom",
      "Forms: fill the form, submit form",
      "Click: click submit / click login / click register / click book service",
    ];
    var msg = lines.join(". ");
    appendLog("me", msg);
    speak(msg);
  });

  // Auto-greet shortly after load (without forcing panel open)
  window.addEventListener("load", function () {
    setTimeout(function () {
      if (state.greeted) return;
      greetOnce();
    }, 800);
  });

  // Restore previous Jarvis state (keep panel open across navigation)
  (function restoreState() {
    var savedLang = storageGet(STORAGE_KEYS.lang, "");
    if (savedLang) state.currentLang = savedLang;

    // Default: keep Jarvis panel open (user can close it manually).
    var openSaved = storageGet(STORAGE_KEYS.open, "1") === "1";
    if (openSaved) setOpen(true);

    // Auto-start listening only if the browser allows it; otherwise user can press the button.
    var listeningSaved = storageGet(STORAGE_KEYS.listening, "0") === "1";
    if (listeningSaved) {
      // Delay a little so the page settles.
      setTimeout(function () {
        try {
          startRecognition();
        } catch (e) {
          // ignore
        }
      }, 350);
    }
  })();
})();
