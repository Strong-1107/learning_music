import { ToneAudioBuffer } from "https://esm.sh/tone";

import { bus } from "./data/EventBus.js";
import { SongOptions } from "./data/SongOptions.js";
import { MidiData } from "./midi/Data.js";
import { History } from "./history/History.js";

import { Sound } from "./sound/Sound.js";

const buffer = new ToneAudioBuffer();

const songOptions = new SongOptions();
const midiData = new MidiData();
const sound = new Sound(songOptions, midiData);

let isPlaying = false;
let stopRequested = false;
let currentPlaybackTimeout = null;

const numColumns = 32;
const buttonNote = ["Do", "Ti", "La", "Sol", "Fa", "Mi", "Re", "Do"];
const noteIndex = [48, 50, 52, 53, 55, 57, 59, 60];
const noteColor = [
  "#e33059",
  "#f7943d",
  "#edd929",
  "#95c631",
  "#11826d",
  "#5b37cc",
  "#ea57b2",
  "#e33059",
];
let noteGroup = [];
for (let i = 0; i < 32; i++) {
  noteGroup.push([]);
}
const notePair = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5"];
const EasePair = ["qr", "q", "q", "q", "q", "q", "q", "q"];

const gridContainer = document.getElementById("noteGroup");

gridContainer.style.gridTemplateColumns = `repeat(${numColumns}, 1fr)`;

for (let i = 1; i <= 10 * numColumns; i++) {
  const button = document.createElement("button");
  button.classList.add("grid-btn");
  button.setAttribute("data-id", i);
  let indexColumn = i % numColumns;
  let indexRow = Math.floor(i / numColumns);
  if (i <= 8 * numColumns) {
    if (Math.floor((indexColumn - 1) / 8) % 2) {
      button.classList.add("oddBtn");
    } else {
      button.classList.add("evenBtn");
    }

    if ((indexColumn - 1) % 2 && indexColumn != 0) {
      button.classList.add("mainDivider");
    }

    button.addEventListener("mousedown", () => {
      button.classList.toggle("selected");
      console.log(noteGroup);
      const index = button.getAttribute("data-id");
      let buttonRow = 7 - Math.floor(index / numColumns);
      let buttonColumn = (index - 1) % numColumns;
      if (button.classList.contains("selected")) {
        if (!button.hasAttribute("data-original-bg")) {
          button.setAttribute(
            "data-original-bg",
            button.style.backgroundColor || ""
          );
        }
        button.setAttribute("border", "none");
        button.style.backgroundColor = noteColor[buttonRow];
        // button.innerHTML = buttonNote[buttonRow];

        //play audio

        //impact music sheet
        noteGroup[buttonColumn].push(buttonRow);
        sound.instrumentTrack.playNote(
          noteIndex[buttonRow],
          undefined,
          undefined,
          0.8
        );

        // console.log(buttonColumn, buttonRow + 1);
        drawVex();
      } else {
        const originalBg = button.getAttribute("data-original-bg");
        button.style.backgroundColor = originalBg || "";
        for (let k = 0; k < noteGroup[buttonColumn].length; k++) {
          if (noteGroup[buttonColumn][k] == buttonRow)
            noteGroup[buttonColumn].splice(k, 1);
        }
        drawVex();
      }
    });

    gridContainer.appendChild(button);

    //Give note to first button
    if (i % numColumns == 1) {
      const noteLabel = document.createElement("div");
      noteLabel.style.marginRight = "5px";
      noteLabel.style.display = "inline-block";
      noteLabel.style.verticalAlign = "center";
      noteLabel.textContent = buttonNote[indexRow];
      // document.appendChild(noteLabel);
      // button.innerHTML = buttonNote[indexRow];
    }
    if (i > 7 * numColumns) button.style.marginBottom = "30px";
  } else {
    button.style.width = "50%";
    button.style.height = "50%";
    button.style.marginLeft = "25%";
    button.style.marginTop = "25%";
    button.style.borderRadius = "50%";
    button.style.backgroundColor = "#ccc";
    // gridContainer.style.gap = "10px";
    button.addEventListener("click", () => {
      const index = button.getAttribute("data-id");
      let buttonRow = Math.floor(index / numColumns);

      console.log(buttonRow);
      button.classList.toggle("selected");
      if (button.classList.contains("selected")) {
        button.style.width = "70%";
        button.style.height = "65%";
        button.style.marginLeft = "15%";
        button.style.marginTop = "15%";
        button.style.backgroundColor = "#16a8f0";
        button.style.borderLeft = "0px";
        button.style.borderTop = "0px";
        if (buttonRow == 8) button.style.borderRadius = "20%";
      } else {
        button.style.width = "50%";
        button.style.height = "50%";
        button.style.marginLeft = "25%";
        button.style.backgroundColor = "#ccc";
        button.style.borderRadius = "50%";
      }
    });
    gridContainer.appendChild(button);
  }
}

// Italian tempo terms mapping
const tempoTerms = [
  { min: 20, max: 40, term: "Grave" },
  { min: 41, max: 60, term: "Largo" },
  { min: 61, max: 76, term: "Adagio" },
  { min: 77, max: 108, term: "Andante" },
  { min: 109, max: 120, term: "Moderato" },
  { min: 121, max: 168, term: "Allegro" },
  { min: 169, max: 200, term: "Presto" },
  { min: 201, max: 300, term: "Prestissimo" },
];

function getTempoTerm(bpm) {
  for (const t of tempoTerms) {
    if (bpm >= t.min && bpm <= t.max) return t.term;
  }
  return "Allegro";
}

// Time signature handling
const timeSignatureSelect = document.getElementById('time-signature');
let currentTimeSignature = '4/4';
timeSignatureSelect.addEventListener('change', (e) => {
  currentTimeSignature = e.target.value;
  // Update beats in SongOptions
  if (currentTimeSignature === '4/4') {
    songOptions.beats = 4;
  } else if (currentTimeSignature === '3/4') {
    songOptions.beats = 3;
  }
  drawVex();
});

// Tempo Italian label handling
const tempoItalianLabel = document.getElementById('tempo-italian');
const tempoSlider = document.getElementById('tempo-slider');
const bpmValue = document.getElementById('bpm-value');

function updateTempoItalianLabel() {
  const bpm = songOptions.tempo;
  tempoItalianLabel.textContent = getTempoTerm(bpm);
  if (bpmValue) bpmValue.textContent = bpm;
  if (tempoSlider) tempoSlider.value = bpm;
}

if (tempoSlider) {
  tempoSlider.addEventListener('input', (e) => {
    const bpm = parseInt(e.target.value);
    songOptions.tempo = bpm;
    updateTempoItalianLabel();
  });
}

// Attach event listeners to all possible BPM inputs (for legacy support)
const tempoInputs = document.querySelectorAll('input[type="range"], input[type="number"], input[name="tempo"], #tempo');
tempoInputs.forEach(input => {
  input.addEventListener('input', (e) => {
    const bpm = parseInt(e.target.value);
    songOptions.tempo = bpm;
    updateTempoItalianLabel();
  });
});
updateTempoItalianLabel();

// Dynamic markings handling
const dynamicMarkingsSelect = document.getElementById('dynamic-markings');
const dynamicMarkingDisplay = document.getElementById('dynamic-marking-display');
let currentDynamicMarking = '';
dynamicMarkingsSelect.addEventListener('change', (e) => {
  currentDynamicMarking = e.target.value;
  dynamicMarkingDisplay.textContent = currentDynamicMarking;
  // Only update the display, do not break or block any other functionality
  drawVex();
});

drawVex();

const playButton = document.getElementById("play-button");

// Set up event listener
playButton.addEventListener("click", togglePlayback);

// Add styles for play button transitions
const playButtonStyles = document.createElement('style');
playButtonStyles.textContent = `
  .circular-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .circular-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(0, 163, 255, 0.5);
    background: #1aabff !important;
  }

  .circular-btn:active {
    transform: scale(0.95);
  }

  .circular-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .circular-btn:hover::before {
    width: 150%;
    height: 150%;
    opacity: 0.3;
  }

  .play-icon, .pause-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
  }

  .play-icon {
    transform: translate(-45%, -50%);
  }

  .playing .play-icon {
    opacity: 0;
    transform: translate(-45%, -50%) scale(0);
  }

  .pause-icon {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  .playing .pause-icon {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  @keyframes buttonPulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 163, 255, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(0, 163, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 163, 255, 0); }
  }

  .playing {
    animation: buttonPulse 2s infinite;
  }
`;
document.head.appendChild(playButtonStyles);

/**
 * Toggles music playback state
 */
function togglePlayback() {
  const playButton = document.getElementById('play-button');
  const playIcon = playButton.querySelector('.play-icon');
  const pauseIcon = playButton.querySelector('.pause-icon');

  if (isPlaying) {
    // Switch to play icon
    playButton.classList.remove('playing');
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    stopPlayback();
  } else {
    // Switch to pause icon
    playButton.classList.add('playing');
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    startPlayback();
  }
}

function stopPlayback() {
  const playButton = document.getElementById('play-button');
  const playIcon = playButton.querySelector('.play-icon');
  const pauseIcon = playButton.querySelector('.pause-icon');

  stopRequested = true;
  isPlaying = false;
  playButton.classList.remove('playing');
  
  // Animate icon transition
  pauseIcon.style.opacity = '0';
  pauseIcon.style.transform = 'translate(-50%, -50%) scale(0)';
  setTimeout(() => {
    pauseIcon.style.display = 'none';
    playIcon.style.display = 'block';
    setTimeout(() => {
      playIcon.style.opacity = '1';
      playIcon.style.transform = 'translate(-45%, -50%) scale(1)';
    }, 50);
  }, 300);

  const progressBar = document.getElementById('playback-progress');
  if (progressBar) {
    progressBar.style.transition = 'all 0.3s ease-out';
    progressBar.style.opacity = '0';
    setTimeout(() => {
      progressBar.style.width = '0%';
      progressBar.style.opacity = '1';
    }, 300);
  }

  // Remove any remaining column highlights
  const allButtons = document.querySelectorAll('.grid-btn');
  allButtons.forEach(btn => {
    btn.classList.remove('playing-column');
    btn.classList.remove('next-column');
  });

  if (currentPlaybackTimeout) {
    clearTimeout(currentPlaybackTimeout);
    currentPlaybackTimeout = null;
  }
}

/**
 * Starts music playback
 */
function startPlayback() {
  const playButton = document.getElementById('play-button');
  const playIcon = playButton.querySelector('.play-icon');
  const pauseIcon = playButton.querySelector('.pause-icon');

  // Animate icon transition
  playIcon.style.opacity = '0';
  playIcon.style.transform = 'translate(-45%, -50%) scale(0)';
  setTimeout(() => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    setTimeout(() => {
      pauseIcon.style.opacity = '1';
      pauseIcon.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 50);
  }, 300);

  isPlaying = true;
  stopRequested = false;

  // Start playing from the beginning
  playMusic(0);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Enhanced visual effects styles
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
  .grid-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .grid-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    z-index: 1;
  }

  .playing-column {
    position: relative;
    transform: scale(1.05);
  }

  .playing-column::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120%;
    height: 120%;
    background: radial-gradient(circle, rgba(0,116,217,0.3) 0%, rgba(0,116,217,0) 70%);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    animation: rippleEffect 1s ease-out infinite;
  }

  .playing-column::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 0 15px rgba(0, 123, 255, 0.6),
      inset 0 0 15px rgba(255, 255, 255, 0.4);
    animation: glowPulse 0.6s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
    border-radius: 4px;
    backdrop-filter: blur(2px);
  }

  .playing-column.selected {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 123, 255, 0.8);
  }

  .next-column {
    position: relative;
    transform: scale(1.02);
  }

  .next-column::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
    transform: translate(-50%, -50%);
    border-radius: 4px;
    animation: previewPulse 1s ease-in-out infinite;
  }

  @keyframes rippleEffect {
    0% {
      width: 0;
      height: 0;
      opacity: 0.5;
    }
    100% {
      width: 200%;
      height: 200%;
      opacity: 0;
    }
  }

  @keyframes glowPulse {
    0% { 
      opacity: 0.8;
      box-shadow: 
        0 0 15px rgba(0, 123, 255, 0.6),
        inset 0 0 15px rgba(255, 255, 255, 0.4);
    }
    50% { 
      opacity: 0.4;
      box-shadow: 
        0 0 25px rgba(0, 123, 255, 0.8),
        inset 0 0 25px rgba(255, 255, 255, 0.6);
    }
    100% { 
      opacity: 0.8;
      box-shadow: 
        0 0 15px rgba(0, 123, 255, 0.6),
        inset 0 0 15px rgba(255, 255, 255, 0.4);
    }
  }

  @keyframes previewPulse {
    0% { opacity: 0.3; }
    50% { opacity: 0.1; }
    100% { opacity: 0.3; }
  }

  .selected {
    animation: selectedPulse 2s ease-in-out infinite;
  }

  @keyframes selectedPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(enhancedStyles);

// Update the playMusic function with enhanced visual effects
async function playMusic(startIndex = 0) {
  if (stopRequested) {
    stopRequested = false;
    return;
  }

  // Reset progress bar at start
  const progressBar = document.getElementById('playback-progress');
  if (startIndex === 0) {
    progressBar.style.width = '0%';
  }

  // Remove highlight from all columns
  const allButtons = document.querySelectorAll('.grid-btn');
  allButtons.forEach(btn => {
    btn.classList.remove('playing-column');
    btn.classList.remove('next-column');
    btn.style.transform = btn.classList.contains('selected') ? 'scale(1.05)' : 'scale(1)';
  });

  for (let i = startIndex; i < numColumns; i++) {
    if (stopRequested) {
      stopRequested = false;
      progressBar.style.width = '0%';
      return;
    }

    // Update progress bar with smoother animation
    const progress = (i / numColumns) * 100;
    progressBar.style.width = `${progress}%`;

    // Get current and next column buttons
    const currentColumnButtons = Array.from(allButtons).filter(btn => {
      const btnIndex = parseInt(btn.getAttribute('data-id'));
      return (btnIndex - 1) % numColumns === i;
    });
    
    const nextColumnButtons = Array.from(allButtons).filter(btn => {
      const btnIndex = parseInt(btn.getAttribute('data-id'));
      return (btnIndex - 1) % numColumns === (i + 1) % numColumns;
    });

    // Remove previous highlights with smooth transition
    allButtons.forEach(btn => {
      btn.classList.remove('playing-column');
      btn.classList.remove('next-column');
      btn.style.transition = 'all 0.3s ease';
    });

    // Add new highlights with enhanced effects
    currentColumnButtons.forEach(btn => {
      btn.classList.add('playing-column');
      if (btn.classList.contains('selected')) {
        btn.classList.add('playing-column-selected');
      }
    });

    nextColumnButtons.forEach(btn => {
      btn.classList.add('next-column');
    });

    // Play notes with visual feedback
    if (noteGroup[i].length > 0) {
      noteGroup[i].forEach((note) => {
        const noteButton = currentColumnButtons[7 - note];
        if (noteButton) {
          // Add ripple effect when note plays
          const ripple = document.createElement('div');
          ripple.className = 'ripple';
          noteButton.appendChild(ripple);
          setTimeout(() => ripple.remove(), 1000);
        }
        sound.instrumentTrack.playNote(noteIndex[note], undefined, undefined, 0.8);
      });
    }

    await delay(60000 / songOptions.tempo);
  }

  if (!stopRequested && isPlaying) {
    // Smooth transition when looping
    const lastColumnButtons = Array.from(allButtons).filter(btn => {
      const btnIndex = parseInt(btn.getAttribute('data-id'));
      return (btnIndex - 1) % numColumns === numColumns - 1;
    });
    
    lastColumnButtons.forEach(btn => {
      btn.classList.remove('playing-column');
      btn.style.transition = 'all 0.3s ease';
    });
    
    await delay(50);
    playMusic(0);
  } else {
    progressBar.style.width = '0%';
    allButtons.forEach(btn => {
      btn.classList.remove('playing-column');
      btn.classList.remove('next-column');
      btn.style.transform = btn.classList.contains('selected') ? 'scale(1.05)' : 'scale(1)';
    });
  }
}

function drawVex() {
  // Initialize VexFlow
  const div = document.getElementById("notation");
  div.innerHTML = "";

  const VF = Vex.Flow;
  const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

  let sheetLength = 1300;

  renderer.resize(sheetLength, 150);
  const context = renderer.getContext();

  let stave = new VF.Stave(10, 20, sheetLength - 20);
  stave.setContext(context).draw();

  for (let i = 0; i < 32; i++) {
    let stave1 = new VF.Stave(10, 20, 38);
    if (i > 0) {
      stave1 = new VF.Stave(38 * i + 74, 20, 38);
    }
    if (i < 31 && i % (songOptions.beats) !== (songOptions.beats - 1)) {
      stave1.setBegBarType(VF.Barline.type.NONE);
      stave1.setEndBarType(VF.Barline.type.NONE);
    }
    stave1.setBegBarType(VF.Barline.type.NONE);
    if (i == 0) {
      stave1.addClef("treble").addTimeSignature(currentTimeSignature);
    }
    stave1.setContext(context).draw();

    var notes = [];
    if (noteGroup[i].length > 0) {
      let tempKeys = [];
      for (let k = 0; k < noteGroup[i].length; k++) {
        tempKeys.push(notePair[noteGroup[i][k]]);
      }
      notes.push(
        new VF.StaveNote({
          clef: "treble",
          keys: tempKeys,
          duration: "q",
        })
      );
    }
    if (notes.length > 0) {
      var voice = new VF.Voice({ num_beats: 1, beat_value: parseInt(currentTimeSignature.split('/')[1]) });
      voice.addTickables(notes);
      var formatter = new VF.Formatter().joinVoices([voice]).format([voice], 40);
      voice.draw(context, stave1);
    }
    // Draw dynamic marking below percussion line (at the bottom of the stave)
    if (currentDynamicMarking && i === 0) {
      // Draw the dynamic marking as plain text below the staff
      context.save();
      context.setFont("Serif", 18, "bold");
      context.setFillStyle("#222");
      // Position: x = start of stave1, y = stave1.getBottomY() + offset
      context.fillText(
        currentDynamicMarking,
        stave1.getX() + 10,
        stave1.getBottomY() + 25
      );
      context.restore();
    }
  }
}

// Update reset button styles
const resetStyles = document.createElement('style');
resetStyles.textContent = `
  .circular-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .circular-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(0, 163, 255, 0.5);
    background: #1aabff !important;
  }

  .circular-btn:active {
    transform: scale(0.95);
  }

  .circular-btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s ease;
  }

  .circular-btn:hover::before {
    width: 150%;
    height: 150%;
    opacity: 0.3;
  }

  .circular-btn svg {
    transition: transform 0.5s ease;
  }

  .circular-btn:hover svg {
    transform: rotate(-180deg);
  }

  .circular-btn.resetting svg {
    animation: spinReset 0.8s ease-in-out;
  }

  @keyframes spinReset {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
  }

  .circular-btn::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background: linear-gradient(45deg, #00A3FF, #66c7ff);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .circular-btn:hover::after {
    opacity: 0.5;
  }
`;
document.head.appendChild(resetStyles);

// Update the resetGrid function to include animation
function resetGrid() {
  const resetButton = document.getElementById('reset-button');
  
  // Add spinning animation class
  resetButton.classList.add('resetting');
  
  // If playing, stop playback first
  if (isPlaying) {
    stopPlayback();
  }

  // Reset progress bar with fade
  const progressBar = document.getElementById('playback-progress');
  if (progressBar) {
    progressBar.style.transition = 'all 0.3s ease-out';
    progressBar.style.opacity = '0';
    setTimeout(() => {
      progressBar.style.width = '0%';
      progressBar.style.opacity = '1';
    }, 300);
  }

  // Reset all buttons with ripple animation
  const allButtons = document.querySelectorAll('.grid-btn');
  allButtons.forEach((btn, index) => {
    if (btn.classList.contains('selected')) {
      // Add fade out effect
      btn.style.transition = 'all 0.3s ease-out';
      btn.style.opacity = '0.5';
      
      setTimeout(() => {
        btn.classList.remove('selected');
        btn.style.backgroundColor = '';
        btn.style.opacity = '1';
        
        // Clear note from noteGroup
        const buttonColumn = (parseInt(btn.getAttribute('data-id')) - 1) % numColumns;
        const buttonRow = 7 - Math.floor(parseInt(btn.getAttribute('data-id')) / numColumns);
        
        const columnNotes = noteGroup[buttonColumn];
        const noteIndex = columnNotes.indexOf(buttonRow);
        if (noteIndex > -1) {
          columnNotes.splice(noteIndex, 1);
        }
      }, 300);
    }
  });

  // Clear all notes from noteGroup
  for (let i = 0; i < noteGroup.length; i++) {
    noteGroup[i] = [];
  }

  // Reset tempo to default with smooth transition
  if (tempoSlider) {
    tempoSlider.style.transition = 'all 0.3s ease';
    tempoSlider.value = 120;
    songOptions.tempo = 120;
    updateTempoItalianLabel();
  }

  // Reset time signature to 4/4
  if (timeSignatureSelect) {
    timeSignatureSelect.value = '4/4';
    currentTimeSignature = '4/4';
    songOptions.beats = 4;
  }

  // Reset dynamic markings with fade
  if (dynamicMarkingsSelect) {
    dynamicMarkingsSelect.value = '';
    currentDynamicMarking = '';
    if (dynamicMarkingDisplay) {
      dynamicMarkingDisplay.style.transition = 'opacity 0.3s ease';
      dynamicMarkingDisplay.style.opacity = '0';
      setTimeout(() => {
        dynamicMarkingDisplay.textContent = '';
        dynamicMarkingDisplay.style.opacity = '1';
      }, 300);
    }
  }

  // Update the music notation
  drawVex();

  // Remove spinning animation class after completion
  setTimeout(() => {
    resetButton.classList.remove('resetting');
  }, 800);
}

// Add event listener for reset button
document.addEventListener('DOMContentLoaded', () => {
  const resetButton = document.getElementById('reset-button');
  if (resetButton) {
    resetButton.addEventListener('click', resetGrid);
  }
});

// Add keyboard shortcut for reset (Ctrl/Cmd + R)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault(); // Prevent browser refresh
    resetGrid();
  }
});
