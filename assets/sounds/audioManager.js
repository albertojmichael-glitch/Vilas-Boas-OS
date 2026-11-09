// assets/sounds/audioManager.js
export const AudioManager = {
    ctx: null,
    ambientOsc: null,
    ambientGain: null,
    mutado: false,

    sons: {
        click: new Audio('assets/sounds/click.mp3'),
        error: new Audio('assets/sounds/error.mp3'),
        ambient: new Audio('assets/sounds/ambient.mp3'),
        camera: new Audio('assets/sounds/camera_bip.mp3'),
        startup: new Audio('assets/sounds/startup.mp3'),
        jumpscare: new Audio('assets/sounds/jumpscare.mp3')
    },

    init() {
        this.sons.ambient.loop = true;
        this.sons.ambient.volume = 0.15;
    },

    getAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    },

    play(nomeDoSom) {
        if (this.mutado) return;

        const audioEl = this.sons[nomeDoSom];
        if (audioEl) {
            const somClone = audioEl.cloneNode();
            somClone.volume = audioEl.volume || 0.4;
            somClone.play().catch(() => {
                // Se o arquivo .mp3 ainda não existir na pasta, usa o sintetizador embutido!
                this.sintetizarSom(nomeDoSom);
            });
        } else {
            this.sintetizarSom(nomeDoSom);
        }
    },

    // Fallback Procedural (Web Audio API) para o jogo já ter som sem precisar dos .mp3
    sintetizarSom(tipo) {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (tipo === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (tipo === 'camera') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (tipo === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.setValueAtTime(120, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (tipo === 'startup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.setValueAtTime(440, now + 0.25);
            osc.frequency.setValueAtTime(659.25, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.start(now);
            osc.stop(now + 1.5);
        } else if (tipo === 'jumpscare') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.15);
            osc.frequency.linearRampToValueAtTime(120, now + 1.2);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 1.2);
            osc.start(now);
            osc.stop(now + 1.2);
        }
    },

    iniciarAmbiente() {
        if (this.mutado) return;
        this.sons.ambient.play().catch(() => {
            // Cria um drone grave de tensão caso ambient.mp3 não exista
            const ctx = this.getAudioContext();
            if (!ctx || this.ambientOsc) return;
            this.ambientOsc = ctx.createOscillator();
            this.ambientGain = ctx.createGain();
            this.ambientOsc.type = 'triangle';
            this.ambientOsc.frequency.value = 55; // Nota Lá grave (drone de ar-condicionado/tensão)
            this.ambientGain.gain.value = 0.04;
            this.ambientOsc.connect(this.ambientGain);
            this.ambientGain.connect(ctx.destination);
            this.ambientOsc.start();
        });
    },

    pararAmbiente() {
        this.sons.ambient.pause();
        if (this.ambientOsc) {
            try { this.ambientOsc.stop(); } catch (e) {}
            this.ambientOsc = null;
        }
    },

    toggleMute() {
        this.mutado = !this.mutado;
        if (this.mutado) {
            this.pararAmbiente();
        } else {
            this.iniciarAmbiente();
        }
        return this.mutado;
    }
};