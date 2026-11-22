// Synthesised system sounds (no audio files needed).
import { Settings } from './settings.js';

let ctx = null;
let master = null;

function ac() {
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
        const rev = makeReverb(ctx);
        master.reverb = rev;
        rev.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    master.gain.value = Settings.get('muted') ? 0 : (Settings.get('volume') / 100) * 0.5;
    return ctx;
}

function makeReverb(c) {
    const len = c.sampleRate * 2.2;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const conv = c.createConvolver();
    conv.buffer = buf;
    const g = c.createGain();
    g.gain.value = 0.25;
    conv.connect(g);
    const out = c.createGain();
    g.connect(out);
    conv.input = conv;
    // expose input on the convolver, output on gain
    out.input = conv;
    return out;
}

function tone(freq, start, dur, { type = 'sine', vol = 0.3, attack = 0.01, release = null, reverb = 0.4, detune = 0 } = {}) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + start;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (release ?? dur));
    osc.connect(g);
    g.connect(master);
    if (reverb > 0) {
        const s = c.createGain();
        s.gain.value = reverb;
        g.connect(s);
        s.connect(master.reverb.input);
        // route reverb through master volume too
    }
    osc.start(t0);
    osc.stop(t0 + (release ?? dur) + 0.05);
}

function noise(start, dur, { vol = 0.2, freq = 1200, q = 0.8 } = {}) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + start;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.3);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
}

const pad = (notes, start, dur, vol = 0.08) => notes.forEach((n, i) => {
    tone(n, start, dur, { type: 'sine', vol, attack: 0.35, reverb: 0.8 });
    tone(n * 2, start + 0.02 * i, dur * 0.8, { type: 'triangle', vol: vol * 0.25, attack: 0.4, reverb: 0.8, detune: 6 });
});

const SOUNDS = {
    startup() {
        // Gentle, rising original chime.
        pad([196, 293.66, 392], 0, 3.2, 0.07);
        [587.33, 739.99, 880, 1174.66, 987.77].forEach((f, i) =>
            tone(f, 0.25 + i * 0.22, 2.4, { type: 'sine', vol: 0.12, attack: 0.02, reverb: 0.9 }));
        pad([293.66, 440, 587.33], 1.3, 3, 0.06);
    },
    logon() {
        [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.12, 1.6, { vol: 0.12, reverb: 0.9 }));
    },
    logoff() {
        [783.99, 659.25, 523.25, 392].forEach((f, i) => tone(f, i * 0.16, 1.6, { vol: 0.11, reverb: 0.9 }));
    },
    shutdown() {
        pad([392, 293.66, 196], 0, 2.5, 0.07);
        [880, 739.99, 587.33, 440].forEach((f, i) => tone(f, i * 0.25, 2, { vol: 0.1, reverb: 0.9 }));
    },
    error() {
        tone(440, 0, 0.5, { type: 'triangle', vol: 0.22, reverb: 0.5 });
        tone(349.23, 0.09, 0.6, { type: 'triangle', vol: 0.22, reverb: 0.5 });
    },
    warning() {
        tone(659.25, 0, 0.45, { type: 'triangle', vol: 0.2, reverb: 0.6 });
        tone(523.25, 0.12, 0.6, { type: 'triangle', vol: 0.18, reverb: 0.6 });
    },
    info() {
        tone(880, 0, 0.6, { vol: 0.16, reverb: 0.6 });
        tone(1318.5, 0.06, 0.5, { vol: 0.08, reverb: 0.6 });
    },
    ding() { tone(1046.5, 0, 0.7, { vol: 0.15, reverb: 0.6 }); },
    navigate() { noise(0, 0.035, { vol: 0.18, freq: 3500, q: 2 }); },
    recycle() { noise(0, 0.35, { vol: 0.25, freq: 900, q: 0.5 }); noise(0.12, 0.25, { vol: 0.2, freq: 1800, q: 0.6 }); },
    uac() { tone(587.33, 0, 0.5, { type: 'triangle', vol: 0.18, reverb: 0.6 }); tone(880, 0.1, 0.7, { vol: 0.15, reverb: 0.6 }); },
    notify() { tone(1174.66, 0, 0.4, { vol: 0.12 }); tone(1567.98, 0.1, 0.6, { vol: 0.1 }); },
    minesBoom() { noise(0, 0.6, { vol: 0.5, freq: 300, q: 0.4 }); tone(80, 0, 0.6, { type: 'sawtooth', vol: 0.15, reverb: 0.3 }); },
    minesWin() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.1, 0.8, { vol: 0.14 })); },
};

export const Sound = {
    play(name) {
        try {
            if (Settings.get('muted')) return;
            SOUNDS[name]?.();
        } catch (err) { console.warn('sound', err); }
    },
    names: Object.keys(SOUNDS),
    unlock() { ac(); }
};
