// Import Tone.js and SongOptions
import * as Tone from 'tone';
import { SongOptions } from './data/SongOptions.js';

// Initialize state
let isPlaying = false;
let currentBeat = 0;
let synth = null;
let loop = null;

// DOM Elements
const playButton = document.getElementById('play-button');
const resetButton = document.getElementById('reset-button');
const tempoSlider = document.getElementById('tempo-slider');
const bpmValue = document.getElementById('bpm-value');
const tempoItalian = document.getElementById('tempo-italian');
const timeSignatureSelect = document.getElementById('time-signature');
const dynamicSelect = document.getElementById('dynamic-markings');
const dynamicDisplay = document.getElementById('dynamic-marking-display');
const dynamicsTerm = document.querySelector('.dynamics-term');
const progressBar = document.getElementById('playback-progress');

// Initialize synth
function initializeSynth() {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
}

// Tempo mapping for Italian terms
const tempoTerms = {
    40: 'Largo',
    60: 'Larghetto',
    76: 'Adagio',
    108: 'Andante',
    120: 'Moderato',
    156: 'Allegro',
    176: 'Vivace',
    200: 'Presto'
};

// Update tempo term
function updateTempoTerm(tempo) {
    const terms = Object.entries(tempoTerms);
    for (let i = 0; i < terms.length; i++) {
        if (tempo <= terms[i][0]) {
            tempoItalian.textContent = terms[i][1];
            break;
        }
    }
}

// Toggle play/pause
function togglePlay() {
    if (!synth) initializeSynth();
    
    if (isPlaying) {
        Tone.Transport.pause();
        playButton.querySelector('.play-icon').style.display = 'block';
        playButton.querySelector('.pause-icon').style.display = 'none';
    } else {
        Tone.Transport.start();
        playButton.querySelector('.play-icon').style.display = 'none';
        playButton.querySelector('.pause-icon').style.display = 'block';
    }
    isPlaying = !isPlaying;
}

// Reset playback
function reset() {
    currentBeat = 0;
    Tone.Transport.position = 0;
    progressBar.style.width = '0%';
    if (isPlaying) {
        togglePlay();
    }
}

// Update dynamics display and synth
function updateDynamics(value) {
    dynamicDisplay.textContent = value;
    const dynamic = SongOptions.dynamics[value];
    if (dynamic) {
        dynamicsTerm.textContent = dynamic.name;
        if (synth) {
            synth.volume.value = Math.log10(dynamic.velocity) * 20;
        }
    } else {
        dynamicsTerm.textContent = '';
    }
}

// Event Listeners
playButton.addEventListener('click', async () => {
    await Tone.start();
    togglePlay();
});

resetButton.addEventListener('click', reset);

tempoSlider.addEventListener('input', (e) => {
    const tempo = parseInt(e.target.value);
    Tone.Transport.bpm.value = tempo;
    bpmValue.textContent = tempo;
    updateTempoTerm(tempo);
});

timeSignatureSelect.addEventListener('change', (e) => {
    const [numerator, denominator] = e.target.value.split('/').map(Number);
    Tone.Transport.timeSignature = [numerator, denominator];
});

// Add change handler for dynamics dropdown
dynamicSelect.addEventListener('change', (e) => {
    updateDynamics(e.target.value);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        reset();
    }
});

// Initialize transport
Tone.Transport.bpm.value = 120;
updateTempoTerm(120);

// Set up progress bar update
Tone.Transport.scheduleRepeat((time) => {
    const progress = (Tone.Transport.ticks / Tone.Transport.loopEnd) * 100;
    progressBar.style.width = `${progress}%`;
}, '16n'); 