// Simple Web Audio API synthesizer for game sound effects
// No external assets required!

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const createOscillator = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.1) => {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
};

export const playSound = {
    pickup: () => {
        // High pitched "pop"
        createOscillator('sine', 600, 0.1, 0.05);
        setTimeout(() => createOscillator('sine', 800, 0.1, 0.03), 50);
    },
    
    place: () => {
        // Satisfying "thud" / "click"
        createOscillator('square', 150, 0.1, 0.05);
        createOscillator('sine', 100, 0.15, 0.1);
    },
    
    clear: (combo: number = 1) => {
        // Ascending chime based on combo count
        const baseFreq = 400 + (combo * 100);
        createOscillator('sine', baseFreq, 0.3, 0.1);
        setTimeout(() => createOscillator('sine', baseFreq * 1.5, 0.4, 0.1), 50);
        setTimeout(() => createOscillator('triangle', baseFreq * 2, 0.5, 0.05), 100);
    },
    
    gameOver: () => {
        // Sad descending tones
        createOscillator('sawtooth', 300, 0.5, 0.1);
        setTimeout(() => createOscillator('sawtooth', 250, 0.5, 0.1), 300);
        setTimeout(() => createOscillator('sawtooth', 200, 1.0, 0.1), 600);
    },

    explosion: () => {
        // Noise buffer for explosion (if possible, otherwise low rumble)
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        
        // Lowpass filter to make it rumbly
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    }
};
