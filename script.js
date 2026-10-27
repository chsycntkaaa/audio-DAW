/**
 * Web Audio DAW & Synthesizer Engine
 */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// --- DRUM MACHINE CONFIGURATION ---
const DRUM_TRACKS = [
  { name: "Kick", freq: 120, type: "sine" },
  { name: "Snare", freq: 250, type: "triangle" },
  { name: "Hi-Hat", freq: 600, type: "square" }
];

const STEPS = 8;
const drumPattern = [
  [1, 0, 0, 0, 1, 0, 0, 0], // Kick
  [0, 0, 1, 0, 0, 0, 1, 0], // Snare
  [1, 1, 1, 1, 1, 1, 1, 1]  // Hi-Hat
];

let isPlaying = false;
let currentStep = 0;
let timerId = null;

// --- SYNTHESIZER FREQUencies (PIANO) ---
const NOTES = [
  { note: "C4", freq: 261.63, type: "white" },
  { note: "C#4", freq: 277.18, type: "black" },
  { note: "D4", freq: 293.66, type: "white" },
  { note: "D#4", freq: 311.13, type: "black" },
  { note: "E4", freq: 329.63, type: "white" },
  { note: "F4", freq: 349.23, type: "white" },
  { note: "F#4", freq: 369.99, type: "black" },
  { note: "G4", freq: 392.00, type: "white" },
  { note: "G#4", freq: 415.30, type: "black" },
  { note: "A4", freq: 440.00, type: "white" },
  { note: "A#4", freq: 466.16, type: "black" },
  { note: "B4", freq: 493.88, type: "white" },
  { note: "C5", freq: 523.25, type: "white" }
];

// --- SOUND GENERATORS ---
function playSynthSound(freq, waveType = "square", duration = 0.2) {
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = waveType;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playDrumSound(trackIndex) {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (trackIndex === 0) {
    // Kick Drum
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (trackIndex === 1) {
    // Snare Drum
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (trackIndex === 2) {
    // Hi-Hat
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

// --- BUILD DRUM UI ---
function buildDrumRack() {
  const container = document.getElementById("drum-rack");
  container.innerHTML = "";

  DRUM_TRACKS.forEach((track, tIdx) => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800";

    const label = document.createElement("span");
    label.className = "text-xs font-bold text-slate-400 w-16";
    label.textContent = track.name;
    row.appendChild(label);

    const stepsContainer = document.createElement("div");
    stepsContainer.className = "flex gap-2";

    for (let sIdx = 0; sIdx < STEPS; sIdx++) {
      const cell = document.createElement("div");
      cell.className = `step-cell ${drumPattern[tIdx][sIdx] ? 'active' : ''}`;
      cell.dataset.track = tIdx;
      cell.dataset.step = sIdx;

      cell.onclick = () => {
        drumPattern[tIdx][sIdx] = drumPattern[tIdx][sIdx] ? 0 : 1;
        cell.classList.toggle("active");
        if (drumPattern[tIdx][sIdx]) playDrumSound(tIdx);
      };

      stepsContainer.appendChild(cell);
    }

    row.appendChild(stepsContainer);
    container.appendChild(row);
  });
}

// --- BUILD PIANO UI ---
function buildPianoKeyboard() {
  const container = document.getElementById("piano-keyboard");
  container.innerHTML = "";

  NOTES.forEach((item) => {
    const key = document.createElement("div");
    key.className = `piano-key ${item.type}`;
    
    key.onmousedown = () => {
      const wave = document.getElementById("osc-wave").value;
      playSynthSound(item.freq, wave, 0.4);
      key.classList.add("active");
      setTimeout(() => key.classList.remove("active"), 150);
    };

    container.appendChild(key);
  });
}

// --- TRANSPORT / SEQUENCER ENGINE ---
function startSequencer() {
  if (isPlaying) return;
  initAudio();
  isPlaying = true;

  document.getElementById("play-icon").className = "fa-solid fa-stop";
  document.getElementById("play-text").textContent = "Berhenti";

  const bpm = parseInt(document.getElementById("bpm-input").value) || 120;
  const interval = (60 / bpm / 2) * 1000; // 8th note interval

  timerId = setInterval(() => {
    // Play active drum tracks for current step
    DRUM_TRACKS.forEach((_, tIdx) => {
      if (drumPattern[tIdx][currentStep] === 1) {
        playDrumSound(tIdx);
      }
    });

    // Update UI step highlights
    document.querySelectorAll(".step-cell").forEach(cell => {
      if (parseInt(cell.dataset.step) === currentStep) {
        cell.classList.add("playing");
      } else {
        cell.classList.remove("playing");
      }
    });

    currentStep = (currentStep + 1) % STEPS;
  }, interval);
}

function stopSequencer() {
  isPlaying = false;
  clearInterval(timerId);
  currentStep = 0;

  document.getElementById("play-icon").className = "fa-solid fa-play";
  document.getElementById("play-text").textContent = "Putar";

  document.querySelectorAll(".step-cell").forEach(cell => cell.classList.remove("playing"));
}

// --- EVENT LISTENERS ---
document.getElementById("btn-play").onclick = () => {
  if (isPlaying) stopSequencer();
  else startSequencer();
};

document.getElementById("bpm-input").onchange = (e) => {
  if (isPlaying) {
    stopSequencer();
    startSequencer();
  }
};

// Initialize UI on Load
buildDrumRack();
buildPianoKeyboard();
