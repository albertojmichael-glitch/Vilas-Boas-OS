// cameras.js
import { GameState } from './gameState.js';
import { AudioManager } from './assets/sounds/audioManager.js';

export const Cameras = {
    canvas: null,
    ctx: null,
    noiseCanvas: null,
    noiseCtx: null,
    animationId: null,
    cameraAtual: 1,
    flashFrames: 0,
    imagens: {},

    nomesCameras: {
        1: "CAM 01 - PALCO PRINCIPAL",
        2: "CAM 02 - CORREDOR LESTE",
        3: "CAM 03 - SALA DOS FUNDOS",
        4: "CAM 04 - COZINHA"
    },

    arquivosCameras: {

        1: "assets/cameras/cam01.webp",

        2: "assets/cameras/cam02.webp",

        3: "assets/cameras/cam03.jpg",

        4: "assets/cameras/cam04.webp",

        "1_alt": "assets/cameras/cam01_anomalia.png",

        "2_alt": "assets/cameras/cam02_anomalia.jpg"

    },

    init() {
        this.canvas = document.getElementById('camera-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.noiseCanvas = document.createElement('canvas');
        this.noiseCanvas.width = this.canvas.width;
        this.noiseCanvas.height = this.canvas.height;
        this.noiseCtx = this.noiseCanvas.getContext('2d');

        this.preCarregarImagens();
        this.iniciarEstatica();
    },

    preCarregarImagens() {
        Object.keys(this.arquivosCameras).forEach(key => {
            const img = new Image();
            img.src = this.arquivosCameras[key];
            this.imagens[key] = img;
        });
    },

    obterChaveImagem() {
        const posInimigo = GameState.posicaoEntidade || 1;
        if (this.cameraAtual === 1) {
            return posInimigo === 1 ? "1_normal" : "1_vazio";
        }
        if (this.cameraAtual === 2) {
            return posInimigo === 2 ? "2_anomalia" : "2_normal";
        }
        if (this.cameraAtual === 3) {
            return posInimigo === 3 ? "3_anomalia" : "3_normal";
        }
        return "4_normal";
    },

    desenharCenaFallback(w, h) {
        const posInimigo = GameState.posicaoEntidade || 1;
        const temAnomalia = (posInimigo === this.cameraAtual);

        // Fundo escuro estilo visão noturna
        this.ctx.fillStyle = "#08120a";
        this.ctx.fillRect(0, 0, w, h);

        // Linhas de perspectiva do cômodo (Placeholder geométrico caso não haja PNG ainda)
        this.ctx.strokeStyle = "#19381f";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(40, 30, w - 80, h - 60);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0); this.ctx.lineTo(40, 30);
        this.ctx.moveTo(w, 0); this.ctx.lineTo(w - 40, 30);
        this.ctx.moveTo(0, h); this.ctx.lineTo(40, h - 30);
        this.ctx.moveTo(w, h); this.ctx.lineTo(w - 40, h - 30);
        this.ctx.stroke();

        // Se a entidade estiver nesta câmera, desenha a silhueta e olhos brilhantes
        if (temAnomalia) {
            this.ctx.fillStyle = "#020402";
            this.ctx.beginPath();
            this.ctx.arc(w / 2, h / 2 - 10, 26, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillRect(w / 2 - 32, h / 2 + 15, 64, 90);

            // Olhos brilhantes
            this.ctx.fillStyle = this.cameraAtual === 3 ? "#ff2222" : "#ffffff";
            this.ctx.fillRect(w / 2 - 12, h / 2 - 14, 5, 5);
            this.ctx.fillRect(w / 2 + 7, h / 2 - 14, 5, 5);
        }

        // Timestamp no rodapé
        this.ctx.fillStyle = "rgba(180, 255, 180, 0.5)";
        this.ctx.font = "10px monospace";
        this.ctx.fillText(`SINAL DE VÍDEO: ${this.arquivosCameras[this.obterChaveImagem()]}`, 12, h - 10);
    },

    iniciarEstatica() {
        const drawNoise = () => {
            if (!this.canvas) return;
            const w = this.canvas.width;
            const h = this.canvas.height;
            
            // 1. Tenta desenhar a foto correspondente; se não existir, desenha o fallback
            const chave = this.obterChaveImagem();
            const img = this.imagens[chave];

            if (img && img.complete && img.naturalWidth > 0) {
                this.ctx.drawImage(img, 0, 0, w, h);
            } else {
                this.desenharCenaFallback(w, h);
            }

            // 2. Desenha o ruído translúcido por cima
            const idata = this.noiseCtx.createImageData(w, h);
            const buffer32 = new Uint32Array(idata.data.buffer);
            const len = buffer32.length;

            // Se a entidade estiver na Sala 03, a interferência fica muito mais forte
            const interferenciaAlta = (GameState.posicaoEntidade === this.cameraAtual && this.cameraAtual === 3);
            const chanceBranco = interferenciaAlta ? 0.22 : 0.05;

            for (let i = 0; i < len; i++) {
                const alpha = Math.random() < chanceBranco ? 150 : 40;
                const cor = Math.random() < chanceBranco ? 210 : Math.random() * 50;
                buffer32[i] = (alpha << 24) | (cor << 16) | (cor << 8) | cor; 
            }
            
            this.noiseCtx.putImageData(idata, 0, 0);
            this.ctx.drawImage(this.noiseCanvas, 0, 0);

            // 3. Scanlines (Linhas de TV antiga)
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            for (let i = 0; i < h; i += 4) {
                this.ctx.fillRect(0, i, w, 2);
            }

            // 4. Flash de troca de canal
            if (this.flashFrames > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashFrames * 0.25})`;
                this.ctx.fillRect(0, 0, w, h);
                this.flashFrames--;
            }

            this.animationId = requestAnimationFrame(drawNoise);
        };
        
        drawNoise();
    },

    trocarCamera(id) {
        this.cameraAtual = id;
        this.flashFrames = 4;
        
        const camNameEl = document.getElementById('cam-name');
        if (camNameEl) {
            camNameEl.innerText = this.nomesCameras[id] || "CAM ?? - SINAL PERDIDO";
        }

        document.querySelectorAll('.cam-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index + 1 === id);
        });

        AudioManager.play('camera');
    }
};