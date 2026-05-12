// js/audio.js

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let ambientSource = null;   // keep reference so we can stop it later

export function initAudio() {
    // nothing permanent yet
}

// ---------- Helper: generate noise buffer ----------
function createNoiseBuffer(ctx, duration) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// ---------- Horror Ambient Loop (whispery wind) ----------
export function startHorrorAmbient() {
    stopHorrorAmbient();   // prevent multiple loops
    try {
        const ctx = new AudioCtx();
        const noise = createNoiseBuffer(ctx, 4);   // 4-second loop

        ambientSource = ctx.createBufferSource();
        ambientSource.buffer = noise;
        ambientSource.loop = true;

        // Apply a bandpass filter to make it sound like wind/whispers
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 400;    // centre frequency
        bandpass.Q.value = 1.2;

        const gain = ctx.createGain();
        gain.gain.value = 0.08;            // quiet, just enough to keep tension

        ambientSource.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(ctx.destination);
        ambientSource.start();
    } catch (e) {
        console.warn('Ambient sound failed:', e);
    }
}

export function stopHorrorAmbient() {
    if (ambientSource) {
        try { ambientSource.stop(); } catch (e) {}
        ambientSource = null;
    }
}

// ---------- Dynamic Gunshot & Melee Sounds ----------
export function playSound(type) {
    try {
        const ctx = new AudioCtx();

        if (type === 'jumpscare') {
            // Harsh scream burst
            const bufferSize = ctx.sampleRate * 0.8;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.8, ctx.currentTime);
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
            return;
        }

        // Gun sounds – short, punchy, with low‑frequency emphasis
        if (type === 'hitscan') {
            // Pistol / Rifle
            const osc = ctx.createOscillator();
            const whiteNoise = ctx.createBufferSource();
            const noiseBuffer = createNoiseBuffer(ctx, 0.08);
            whiteNoise.buffer = noiseBuffer;

            const gainOsc = ctx.createGain();
            const gainNoise = ctx.createGain();

            osc.type = 'square';
            osc.frequency.value = 120;
            gainOsc.gain.setValueAtTime(0.3, ctx.currentTime);
            gainOsc.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

            gainNoise.gain.setValueAtTime(0.25, ctx.currentTime);
            gainNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

            osc.connect(gainOsc).connect(ctx.destination);
            whiteNoise.connect(gainNoise).connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
            whiteNoise.start(ctx.currentTime);
            whiteNoise.stop(ctx.currentTime + 0.08);
        } else if (type === 'shotgun') {
            // Shotgun – louder, more noise
            const osc = ctx.createOscillator();
            const whiteNoise = ctx.createBufferSource();
            const noiseBuffer = createNoiseBuffer(ctx, 0.15);
            whiteNoise.buffer = noiseBuffer;

            const gainOsc = ctx.createGain();
            const gainNoise = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = 80;
            gainOsc.gain.setValueAtTime(0.45, ctx.currentTime);
            gainOsc.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

            gainNoise.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

            osc.connect(gainOsc).connect(ctx.destination);
            whiteNoise.connect(gainNoise).connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.14);
            whiteNoise.start(ctx.currentTime);
            whiteNoise.stop(ctx.currentTime + 0.15);
        } else if (type === 'melee') {
            // Bolo slash – metallic swoosh
            const osc = ctx.createOscillator();
            const whiteNoise = ctx.createBufferSource();
            const noiseBuffer = createNoiseBuffer(ctx, 0.15);
            whiteNoise.buffer = noiseBuffer;

            const gainOsc = ctx.createGain();
            const gainNoise = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            filter.type = 'highpass';
            filter.frequency.value = 800;

            osc.type = 'sawtooth';
            osc.frequency.value = 220;
            gainOsc.gain.setValueAtTime(0.25, ctx.currentTime);
            gainOsc.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

            gainNoise.gain.setValueAtTime(0.2, ctx.currentTime);
            gainNoise.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            osc.connect(filter).connect(gainOsc).connect(ctx.destination);
            whiteNoise.connect(gainNoise).connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
            whiteNoise.start(ctx.currentTime);
            whiteNoise.stop(ctx.currentTime + 0.15);
        }
    } catch (e) {
        // Silently fail if AudioContext not available
    }
}