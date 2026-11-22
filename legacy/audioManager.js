// assets/sounds/audioManager.js
import { Storage } from '../../storage.js';

export const AudioManager = {
    ctx: null,
    ambientOsc: null,
    ambientGain: null,
    ambienteAtivo: false,
    mutado: false,
    volAmbiente: 0.5,
    volEfeitos: 0.7,
    volSustos: 0.8,

    sons: {
        click: new Audio('assets/sounds/click.mp3'),
        error: new Audio('assets/sounds/error.mp3'),
        ambient: new Audio('assets/sounds/ambient.mp3'),
        camera: new Audio('assets/sounds/camera_bip.mp3'),
        startup: new Audio('assets/sounds/startup.mp3'),
        jumpscare: new Audio('assets/sounds/jumpscare.mp3')
    },

    init() {
        const prefs = Storage.carregarPreferenciasAudio();
        this.mutado = prefs.mutado;
        this.volAmbiente = prefs.volAmbiente;
        this.volEfeitos = prefs.volEfeitos;
        this.volSustos = prefs.volSustos;

        this.sons.ambient.loop = true;
        this.atualizarVolumeAmbiente();
        this.emitirAtualizacao();
    },

    obterEstado() {
        return {
            mutado: this.mutado,
            volAmbiente: this.volAmbiente,
            volEfeitos: this.volEfeitos,
            volSustos: this.volSustos
        };
    },

    emitirAtualizacao() {
        document.dispatchEvent(new CustomEvent('audio:updated', {
            detail: this.obterEstado()
        }));
    },

    salvarEstado() {
        Storage.salvarPreferenciasAudio(this.obterEstado());
        this.emitirAtualizacao();
    },

    obterMultiplicadorCategoria(nomeDoSom) {
        if (nomeDoSom === 'ambient') return this.volAmbiente;
        if (nomeDoSom === 'jumpscare') return this.volSustos;
        return this.volEfeitos;
    },

    setVolume(categoria, valor) {
        const v = Math.max(0, Math.min(1, Number(valor)));
        if (categoria === 'ambient') {
            this.volAmbiente = v;
            this.atualizarVolumeAmbiente();
        } else if (categoria === 'sfx') {
            this.volEfeitos = v;
        } else if (categoria === 'jumpscare') {
            this.volSustos = v;
        }
        this.salvarEstado();
    },

    atualizarVolumeAmbiente() {
        this.sons.ambient.volume = Math.max(0, Math.min(1, 0.3 * this.volAmbiente));
        if (this.ambientGain && this.ctx) {
            this.ambientGain.gain.setValueAtTime(0.08 * this.volAmbiente, this.ctx.currentTime);
        }
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
        const mult = this.obterMultiplicadorCategoria(nomeDoSom);
        if (mult <= 0.01) return;

        const audioEl = this.sons[nomeDoSom];
        if (audioEl) {
            const somClone = audioEl.cloneNode();
            const baseVol = nomeDoSom === 'jumpscare' ? 0.85 : 0.5;
            somClone.volume = Math.max(0, Math.min(1, baseVol * mult));
            somClone.play().catch(() => {
                // Se o arquivo .mp3 ainda não existir na pasta, usa o sintetizador embutido!
                this.sintetizarSom(nomeDoSom, mult);
            });
        } else {
            this.sintetizarSom(nomeDoSom, mult);
        }
    },

    // Fallback Procedural (Web Audio API) para o jogo já ter som sem precisar dos .mp3
    sintetizarSom(tipo, mult = 0.7) {
        const ctx = this.getAudioContext();
        if (!ctx || mult <= 0.01) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (tipo === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
            gain.gain.setValueAtTime(0.2 * mult, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (tipo === 'camera') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.12 * mult, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (tipo === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.setValueAtTime(120, now + 0.12);
            gain.gain.setValueAtTime(0.25 * mult, now);
            gain.gain.linearRampToValueAtTime(0.005, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (tipo === 'startup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(330, now);
            osc.frequency.setValueAtTime(440, now + 0.22);
            osc.frequency.setValueAtTime(659.25, now + 0.45);
            gain.gain.setValueAtTime(0.25 * mult, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
            osc.start(now);
            osc.stop(now + 1.4);
        } else if (tipo === 'jumpscare') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.15);
            osc.frequency.linearRampToValueAtTime(120, now + 1.2);
            gain.gain.setValueAtTime(0.6 * mult, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 1.2);
            osc.start(now);
            osc.stop(now + 1.2);
        }
    },

    iniciarAmbiente() {
        this.ambienteAtivo = true;
        if (this.mutado || this.volAmbiente <= 0.01) return;

        this.atualizarVolumeAmbiente();
        this.sons.ambient.play().catch(() => {
            // Cria um drone grave de tensão caso ambient.mp3 não exista
            const ctx = this.getAudioContext();
            if (!ctx || this.ambientOsc) return;
            this.ambientOsc = ctx.createOscillator();
            this.ambientGain = ctx.createGain();
            this.ambientOsc.type = 'triangle';
            this.ambientOsc.frequency.value = 55; // Nota Lá grave (drone de ar-condicionado/tensão)
            this.ambientGain.gain.value = 0.08 * this.volAmbiente;
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
            this.ambientGain = null;
        }
    },

    toggleMute() {
        this.mutado = !this.mutado;
        if (this.mutado) {
            this.pararAmbiente();
        } else if (this.ambienteAtivo) {
            this.iniciarAmbiente();
        }
        this.salvarEstado();
        return this.mutado;
    }
};
