// Core state
let words = [];
let sections = [];
let currentSectionIndex = 0;
let currentWordIndex = 0;
let isPlaying = false;
let mode = "reading"; // "reading" | "context" | "help"
let showControls = false;

const settings = {
  speedPreset: "medium",
  speedMs: 250,
  theme: "dark",
  anchorColor: "teal",
  sectionSize: 1500,
  resumeEnabled: true
};

const helpTexts = {
  context: `
Tap the top edge to open Context View
Context View shows the full Section
Your current word is highlighted
Tap any word to jump to that point
Tap the top edge again to close Context View
`,
  navigation: `
Tap anywhere on the screen to pause
Bottom controls appear when paused
Play starts the one word stream
Pause stops the stream
Back moves to the previous word
Forward moves to the next word
Speed slider adjusts instantly
Section list appears when paused
`,
  sections: `
Long documents are split into Sections
Sections are labeled Section 1 Section 2 Section 3
End of Section shows Next section
Resume returns to the exact word you left off
`,
  jumping: `
Tap any word in Context View to jump
Tap a heading to jump to the first word after it
Tap whitespace to do nothing
Tap the highlighted word to close Context View
`,
  themes: `
Theme toggle switches between dark and light
Anchor color selector changes the highlight color
Your theme and anchor color are saved automatically
`,
  bookmarklet: `
Click READ WITH ANCHOR on any webpage
The reader opens with the text already loaded
No copy or paste is required
Bookmarklet works on most pages
Some sites block extraction
`,
  troubleshooting: `
If text looks messy paste mode is cleaner
If the bookmarklet fails the site may block scripts
If resume feels off clear saved position in settings
If controls disappear tap the bottom edge
`
};

// DOM
const wordEl = document.getElementById("word");
const topEdge = document.getElementById("top-edge");
const bottomEdge = document.getElementById("bottom-edge");
const controlsEl = document.getElementById("controls");
const playPauseBtn = document.getElementById("play-pause");
const backBtn = document.getElementById("back");
const forwardBtn = document.getElementById("forward");
const speedSlider = document.getElementById("speed");
const helpBtn = document.getElementById("anchor-help");
const contextView = document.getElementById("context-view");
const contextHeader = document.getElementById("context-header");
const contextBody = document.getElementById("context-body");
const helpOverlay = document.getElementById("help-overlay");
const helpTopics = document.getElementById("help-topics");
const settingsPanel = document.getElementById("settings-panel");
const settingsBtn = document.getElementById("settings-btn");
const settingsClose = document.getElementById("settings-close");
const speedPresetSelect = document.getElementById("speed-preset");
const themeSelect = document.getElementById("theme-select");
const anchorSelect = document.getElementById("anchor-select");
const sectionSizeInput = document.getElementById("section-size");
const resumeToggle = document.getElementById("resume-toggle");
const themeBtn = document.getElementById("theme-btn");
const anchorColorBtn = document.getElementById("anchor-color-btn");

// Init
function init() {
  loadSettings();
  applySettings();
  attachEvents();
  // For now, load a simple default text
  loadText("Welcome to Anchor This is a minimal one word at a time reader Tap the anchor icon for help");
  renderWord();
}

function loadText(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  words = cleaned.split(" ");
  sections = splitIntoSections(words, settings.sectionSize);
  currentSectionIndex = 0;
  currentWordIndex = 0;
}

function splitIntoSections(allWords, size) {
  const result = [];
  for (let i = 0; i < allWords.length; i += size) {
    result.push(allWords.slice(i, i + size));
  }
  return result;
}

function getCurrentSectionWords() {
  return sections[currentSectionIndex] || [];
}

function renderWord() {
  const sectionWords = getCurrentSectionWords();
  const w = sectionWords[currentWordIndex] || "";
  wordEl.textContent = w;
}

function nextWord() {
  if (!isPlaying || mode !== "reading") return;
  const sectionWords = getCurrentSectionWords();
  if (currentWordIndex < sectionWords.length - 1) {
    currentWordIndex++;
    renderWord();
    scheduleNext();
  } else {
    // End of section
    isPlaying = false;
    // Could show "Next section?" later
  }
  savePosition();
}

function prevWord() {
  const sectionWords = getCurrentSectionWords();
  if (currentWordIndex > 0) {
    currentWordIndex--;
    renderWord();
    savePosition();
  }
}

function scheduleNext() {
  setTimeout(nextWord, settings.speedMs);
}

function togglePlayPause() {
  if (mode !== "reading") return;
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? "⏸" : "▶";
  if (isPlaying) {
    scheduleNext();
  }
}

function pauseStream() {
  isPlaying = false;
  playPauseBtn.textContent = "▶";
}

function showControlsBar() {
  showControls = true;
  controlsEl.classList.remove("hidden");
}

function hideControlsBar() {
  showControls = false;
  controlsEl.classList.add("hidden");
}

// Context View
function openContextView() {
  pauseStream();
  mode = "context";
  contextHeader.textContent = `Section ${currentSectionIndex + 1} — Context`;
  renderContextBody();
  contextView.classList.remove("hidden");
}

function closeContextView() {
  mode = "reading";
  contextView.classList.add("hidden");
}

function renderContextBody() {
  contextBody.innerHTML = "";
  const sectionWords = getCurrentSectionWords();
  sectionWords.forEach((w, idx) => {
    const span = document.createElement("span");
    span.textContent = w + " ";
    if (idx === currentWordIndex) {
      span.classList.add("current");
    }
    span.addEventListener("click", () => {
      currentWordIndex = idx;
      closeContextView();
      renderWord();
      isPlaying = true;
      playPauseBtn.textContent = "⏸";
      scheduleNext();
    });
    contextBody.appendChild(span);
  });
}

// Help
function openHelp() {
  pauseStream();
  mode = "help";
  helpOverlay.classList.remove("hidden");
}

function closeHelp() {
  mode = "reading";
  helpOverlay.classList.add("hidden");
}

function loadHelpTopic(key) {
  const text = helpTexts[key] || "";
  loadText(text);
  closeHelp();
  mode = "reading";
  isPlaying = true;
  playPauseBtn.textContent = "⏸";
  renderWord();
  scheduleNext();
}

// Settings
function openSettings() {
  settingsPanel.classList.remove("hidden");
}

function closeSettings() {
  settingsPanel.classList.add("hidden");
}

function mapPresetToDelay(preset) {
  switch (preset) {
    case "slow":
      return 500;
    case "medium":
      return 250;
    case "fast":
      return 150;
    case "storm":
      return 80;
    default:
      return 250;
  }
}

function applySettings() {
  document.body.classList.toggle("theme-dark", settings.theme === "dark");
  document.body.classList.toggle("theme-light", settings.theme === "light");

  document.body.classList.remove("anchor-teal", "anchor-amber", "anchor-rose", "anchor-lime");
  document.body.classList.add(`anchor-${settings.anchorColor}`);

  settings.speedMs = mapPresetToDelay(settings.speedPreset);
  speedSlider.value = settings.speedMs;
}

function saveSettings() {
  const data = {
    settings,
    position: {
      currentSectionIndex,
      currentWordIndex
    }
  };
  localStorage.setItem("anchor-state", JSON.stringify(data));
}

function loadSettings() {
  const raw = localStorage.getItem("anchor-state");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.settings) {
      Object.assign(settings, data.settings);
    }
    if (data.position && settings.resumeEnabled) {
      currentSectionIndex = data.position.currentSectionIndex || 0;
      currentWordIndex = data.position.currentWordIndex || 0;
    }
  } catch (e) {
    // ignore
  }
}

function savePosition() {
  if (!settings.resumeEnabled) return;
  saveSettings();
}

// Events
function attachEvents() {
  // Screen click → pause + show controls
  document.body.addEventListener("click", (e) => {
    const target = e.target;
    if (
      target === helpBtn ||
      helpOverlay.contains(target) ||
      contextView.contains(target) ||
      settingsPanel.contains(target) ||
      controlsEl.contains(target)
    ) {
      return;
    }
    pauseStream();
    showControlsBar();
  });

  // Top edge → Context View toggle
  topEdge.addEventListener("click", () => {
    if (mode === "reading") openContextView();
    else if (mode === "context") closeContextView();
  });

  // Bottom edge → controls toggle
  bottomEdge.addEventListener("click", () => {
    if (showControls) hideControlsBar();
    else showControlsBar();
  });

  // Controls
  playPauseBtn.addEventListener("click", togglePlayPause);
  backBtn.addEventListener("click", () => {
    pauseStream();
    prevWord();
  });
  forwardBtn.addEventListener("click", () => {
    pauseStream();
    const sectionWords = getCurrentSectionWords();
    if (currentWordIndex < sectionWords.length - 1) {
      currentWordIndex++;
      renderWord();
      savePosition();
    }
  });

  speedSlider.addEventListener("input", (e) => {
    settings.speedMs = Number(e.target.value);
    saveSettings();
  });

  // Help
  helpBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openHelp();
  });

  helpOverlay.addEventListener("click", (e) => {
    if (e.target === helpOverlay) {
      closeHelp();
    }
  });

  helpTopics.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const topic = li.getAttribute("data-topic");
    if (topic) loadHelpTopic(topic);
  });

  // Settings
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openSettings();
  });

  settingsClose.addEventListener("click", closeSettings);

  speedPresetSelect.addEventListener("change", (e) => {
    settings.speedPreset = e.target.value;
    applySettings();
    saveSettings();
  });

  themeSelect.addEventListener("change", (e) => {
    settings.theme = e.target.value;
    applySettings();
    saveSettings();
  });

  anchorSelect.addEventListener("change", (e) => {
    settings.anchorColor = e.target.value;
    applySettings();
    saveSettings();
  });

  sectionSizeInput.addEventListener("change", (e) => {
    settings.sectionSize = Number(e.target.value) || 1500;
    saveSettings();
  });

  resumeToggle.addEventListener("change", (e) => {
    settings.resumeEnabled = e.target.checked;
    saveSettings();
  });

  themeBtn.addEventListener("click", () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    applySettings();
    saveSettings();
  });

  anchorColorBtn.addEventListener("click", () => {
    const order = ["teal", "amber", "rose", "lime"];
    const idx = order.indexOf(settings.anchorColor);
    const next = order[(idx + 1) % order.length];
    settings.anchorColor = next;
    applySettings();
    saveSettings();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    }
    if (e.key === "ArrowLeft") {
      pauseStream();
      prevWord();
    }
    if (e.key === "ArrowRight") {
      pauseStream();
      const sectionWords = getCurrentSectionWords();
      if (currentWordIndex < sectionWords.length - 1) {
        currentWordIndex++;
        renderWord();
        savePosition();
      }
    }
    if (e.key === "ArrowUp") {
      settings.speedMs = Math.max(50, settings.speedMs - 20);
      speedSlider.value = settings.speedMs;
      saveSettings();
    }
    if (e.key === "ArrowDown") {
      settings.speedMs = Math.min(800, settings.speedMs + 20);
      speedSlider.value = settings.speedMs;
      saveSettings();
    }
    if (e.key === "Escape") {
      closeContextView();
      closeHelp();
      hideControlsBar();
    }
    if (e.key === "h") {
      openHelp();
    }
    if (e.key === "c") {
      if (mode === "reading") openContextView();
      else if (mode === "context") closeContextView();
    }
    if (e.key === "t") {
      settings.theme = settings.theme === "dark" ? "light" : "dark";
      applySettings();
      saveSettings();
    }
  });

  // Bookmarklet receiver (optional: text via URL hash)
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash) {
    loadText(hash);
    renderWord();
  }
}

document.addEventListener("DOMContentLoaded", init);
