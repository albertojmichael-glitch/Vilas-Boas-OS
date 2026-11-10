// cameras.js
import { GameState } from './gameState.js';
import { AudioManager } from './assets/sounds/audioManager.js';
import { Storage } from './storage.js';
import { I18n } from './i18nManager.js';

export const Cameras = {
    canvas: null,
    ctx: null,
    noiseCanvas: null,
    noiseCtx: null,
    animationId: null,
    cameraAtual: 1,
    flashFrames: 0,
    sincronizandoFrames: 0,
    frameCounter: 0,
    imagens: {},
    estadosImagens: {},

    chavesNomesCameras: {
        1: "CAM_1_NAME",
        2: "CAM_2_NAME",
        3: "CAM_3_NAME",
        4: "CAM_4_NAME"
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
        this.atualizarHUD();
        this.atualizarMarcadoresBotoes();

        document.addEventListener('game:entityMove', () => {
            this.atualizarHUD();
            this.atualizarMarcadoresBotoes();
        });

        document.addEventListener('i18n:changed', () => {
            this.atualizarHUD();
            this.atualizarMarcadoresBotoes();
        });
    },

    preCarregarImagens() {
        const chaves = Object.keys(this.arquivosCameras);
        const total = chaves.length;
        let processadas = 0;
        let teveFalha = false;

        const notificarProgresso = () => {
            document.dispatchEvent(new CustomEvent('boot:assetProgress', {
                detail: {
                    carregadas: processadas,
                    total,
                    teveFalha,
                    concluido: processadas >= total
                }
            }));
            this.atualizarHUD();
        };

        chaves.forEach(key => {
            this.estadosImagens[key] = 'loading';
            const img = new Image();
            img.onload = () => {
                this.estadosImagens[key] = 'ready';
                processadas++;
                notificarProgresso();
            };
            img.onerror = () => {
                this.estadosImagens[key] = 'error';
                teveFalha = true;
                processadas++;
                notificarProgresso();
            };
            img.src = this.arquivosCameras[key];
            this.imagens[key] = img;
        });
    },

    obterChaveImagem() {
        const posInimigo = GameState.posicaoEntidade || 1;
        if (this.cameraAtual === 1) {
            return posInimigo === 1 ? "1_alt" : "1";
        }
        if (this.cameraAtual === 2) {
            return posInimigo === 2 ? "2_alt" : "2";
        }
        if (this.cameraAtual === 3) {
            return "3";
        }
        return "4";
    },

    desenharAnomaliaSala03(w, h, reducedMotion) {
        const ctx = this.ctx;
        ctx.save();

        // Vinheta vermelha escura e opressiva na Sala 03
        const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.65);
        grad.addColorStop(0, "rgba(25, 0, 0, 0.25)");
        grad.addColorStop(0.6, "rgba(70, 0, 0, 0.6)");
        grad.addColorStop(1, "rgba(120, 0, 0, 0.85)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Deslocamento sutil se movimento reduzido estiver desativado
        const jitterX = (!reducedMotion && Math.random() < 0.3) ? (Math.random() * 6 - 3) : 0;
        const jitterY = (!reducedMotion && Math.random() < 0.3) ? (Math.random() * 4 - 2) : 0;
        const cx = w / 2 + jitterX;
        const cy = h / 2 + 10 + jitterY;

        // Sombra / aura escura atrás da entidade
        const aura = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy, 95);
        aura.addColorStop(0, "rgba(0, 0, 0, 0.96)");
        aura.addColorStop(0.65, "rgba(8, 0, 4, 0.82)");
        aura.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = aura;
        ctx.fillRect(cx - 100, cy - 100, 200, 210);

        // Silhueta imponente da entidade (Orelhas, cabeça e ombros mecânicos)
        ctx.fillStyle = "#050203";
        ctx.strokeStyle = "rgba(255, 50, 50, 0.45)";
        ctx.lineWidth = 1.5;

        // Orelhas / antenas mecânicas
        ctx.beginPath();
        ctx.ellipse(cx - 26, cy - 68, 9, 18, -0.2, 0, Math.PI * 2);
        ctx.ellipse(cx + 26, cy - 68, 9, 18, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cabeça
        ctx.beginPath();
        ctx.arc(cx, cy - 38, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mandíbula / Endoesqueleto
        ctx.fillRect(cx - 20, cy - 12, 40, 16);
        ctx.strokeRect(cx - 20, cy - 12, 40, 16);
        ctx.fillStyle = "#3a1010";
        for (let t = -14; t <= 14; t += 7) {
            ctx.fillRect(cx + t - 2, cy - 10, 4, 6);
        }

        // Tronco / Ombros próximos da lente
        ctx.fillStyle = "#050203";
        ctx.beginPath();
        ctx.moveTo(cx - 68, h);
        ctx.lineTo(cx - 52, cy + 8);
        ctx.lineTo(cx + 52, cy + 8);
        ctx.lineTo(cx + 68, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Olhos vermelhos brilhantes encarando a câmera
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#ff2222";
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 42, 4.5, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 42, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas brancas intensas no centro
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx - 12, cy - 42, 1.8, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy - 42, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Faixas de interferência de sinal na CAM 03
        ctx.fillStyle = "rgba(255, 40, 40, 0.18)";
        const barY = reducedMotion ? h * 0.72 : ((this.frameCounter * 3) % h);
        ctx.fillRect(0, barY, w, 12);

        // Moldura vermelha de alerta no próprio canvas
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, w - 4, h - 4);

        ctx.restore();
    },

    desenharCenaFallback(w, h, estadoImg) {
        const posInimigo = GameState.posicaoEntidade || 1;
        const temAnomalia = (posInimigo === this.cameraAtual) || (this.cameraAtual === 3 && posInimigo >= 3);

        // Fundo escuro estilo visão noturna tática
        this.ctx.fillStyle = "#08120a";
        this.ctx.fillRect(0, 0, w, h);

        // Linhas de perspectiva do cômodo (Modo Tático de Contingência)
        this.ctx.strokeStyle = "#1f4729";
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(40, 30, w - 80, h - 60);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0); this.ctx.lineTo(40, 30);
        this.ctx.moveTo(w, 0); this.ctx.lineTo(w - 40, 30);
        this.ctx.moveTo(0, h); this.ctx.lineTo(40, h - 30);
        this.ctx.moveTo(w, h); this.ctx.lineTo(w - 40, h - 30);
        this.ctx.stroke();

        // Se a entidade estiver nesta câmera, desenha a silhueta e olhos brilhantes
        if (temAnomalia) {
            if (this.cameraAtual === 3) {
                this.desenharAnomaliaSala03(w, h, Storage.isReducedMotion());
            } else {
                this.ctx.fillStyle = "#020402";
                this.ctx.beginPath();
                this.ctx.arc(w / 2, h / 2 - 10, 26, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillRect(w / 2 - 32, h / 2 + 15, 64, 90);

                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillRect(w / 2 - 12, h / 2 - 14, 5, 5);
                this.ctx.fillRect(w / 2 + 7, h / 2 - 14, 5, 5);
            }
        }

        // Mensagem explícita de estado (Carregando vs Sinal Perdido)
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        this.ctx.fillRect(10, h - 32, w - 20, 22);
        this.ctx.fillStyle = estadoImg === 'loading' ? "#7ef9ff" : "#ffda33";
        this.ctx.font = "bold 10px Consolas, monospace";
        const msg = estadoImg === 'loading'
            ? I18n.t("CAM_STATUS_SYNC")
            : `${I18n.t("CAM_STATUS_FALLBACK")} [CAM 0${this.cameraAtual}]`;
        this.ctx.fillText(msg, 16, h - 17);
    },

    iniciarEstatica() {
        const drawNoise = () => {
            if (!this.canvas) return;
            this.frameCounter++;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const reducedMotion = Storage.isReducedMotion();

            const chave = this.obterChaveImagem();
            const img = this.imagens[chave];
            const estadoImg = this.estadosImagens[chave] || 'loading';
            const posInimigo = GameState.posicaoEntidade || 1;
            const perigoSala03 = (this.cameraAtual === 3 && posInimigo >= 3);

            // 1. Se acabou de trocar de câmera, mostra breve sincronização de sinal
            if (this.sincronizandoFrames > 0) {
                this.sincronizandoFrames--;
                if (this.sincronizandoFrames === 0) {
                    this.atualizarHUD();
                }
            }

            // 2. Desenha imagem da câmera ou fallback tático explícito
            if (img && img.complete && img.naturalWidth > 0) {
                this.ctx.drawImage(img, 0, 0, w, h);
                if (perigoSala03) {
                    this.desenharAnomaliaSala03(w, h, reducedMotion);
                }
            } else {
                this.desenharCenaFallback(w, h, estadoImg);
            }

            // 3. Desenha ruído translúcido (suave e estável em movimento reduzido)
            if (!reducedMotion || this.frameCounter % 12 === 0) {
                const idata = this.noiseCtx.createImageData(w, h);
                const buffer32 = new Uint32Array(idata.data.buffer);
                const len = buffer32.length;

                const interferenciaAlta = perigoSala03;
                const chanceBranco = reducedMotion
                    ? (interferenciaAlta ? 0.06 : 0.02)
                    : (interferenciaAlta ? 0.20 : 0.05);

                for (let i = 0; i < len; i++) {
                    const alpha = Math.random() < chanceBranco ? (reducedMotion ? 75 : 140) : 32;
                    const cor = Math.random() < chanceBranco ? 200 : Math.random() * 45;
                    buffer32[i] = (alpha << 24) | (cor << 16) | (cor << 8) | cor;
                }
                this.noiseCtx.putImageData(idata, 0, 0);
            }
            this.ctx.drawImage(this.noiseCanvas, 0, 0);

            // 4. Scanlines (Linhas de monitor CFTV)
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            for (let i = 0; i < h; i += 4) {
                this.ctx.fillRect(0, i, w, 2);
            }

            // 5. Indicador de sincronização ao trocar de canal (sem flash brusco se reduced-motion)
            if (this.sincronizandoFrames > 0) {
                this.ctx.fillStyle = "rgba(5, 15, 25, 0.55)";
                this.ctx.fillRect(0, 0, w, h);
                this.ctx.fillStyle = "#7ef9ff";
                this.ctx.font = "bold 12px Consolas, monospace";
                this.ctx.fillText(I18n.t("CAM_STATUS_SYNC"), 16, h / 2);
            }

            // 6. Flash de troca de canal (apenas se movimento reduzido estiver desativado)
            if (this.flashFrames > 0) {
                if (!reducedMotion) {
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashFrames * 0.18})`;
                    this.ctx.fillRect(0, 0, w, h);
                }
                this.flashFrames--;
            }

            this.animationId = requestAnimationFrame(drawNoise);
        };

        drawNoise();
    },

    atualizarHUD() {
        const camNameEl = document.getElementById('cam-name');
        const statusBadgeEl = document.getElementById('cam-status-badge');
        const dangerBannerEl = document.getElementById('cam-danger-banner');

        const chaveNome = this.chavesNomesCameras[this.cameraAtual];
        if (camNameEl) {
            camNameEl.innerText = chaveNome ? I18n.t(chaveNome) : "CAM ??";
        }

        const chaveImg = this.obterChaveImagem();
        const estadoImg = this.estadosImagens[chaveImg] || 'loading';
        const pos = GameState.posicaoEntidade || 1;

        if (statusBadgeEl) {
            statusBadgeEl.className = 'cam-status-pill';
            if (this.sincronizandoFrames > 0 || estadoImg === 'loading') {
                statusBadgeEl.innerText = `⏳ ${I18n.t("CAM_STATUS_SYNC")}`;
                statusBadgeEl.classList.add('status-sync');
            } else if (estadoImg === 'error') {
                statusBadgeEl.innerText = `⚠ ${I18n.t("CAM_STATUS_FALLBACK")}`;
                statusBadgeEl.classList.add('status-warning');
            } else if (this.cameraAtual === 3 && pos >= 3) {
                statusBadgeEl.innerText = I18n.t("CAM_STATUS_CRITICAL");
                statusBadgeEl.classList.add('status-critical');
            } else if (pos === this.cameraAtual) {
                statusBadgeEl.innerText = I18n.t("CAM_STATUS_ANOMALY");
                statusBadgeEl.classList.add('status-warning');
            } else {
                statusBadgeEl.innerText = `● ${I18n.t("CAM_STATUS_ONLINE")}`;
                statusBadgeEl.classList.add('status-online');
            }
        }

        if (dangerBannerEl) {
            const mostrarPerigo = (pos >= 3);
            dangerBannerEl.classList.toggle('hidden', !mostrarPerigo);
        }
    },

    atualizarMarcadoresBotoes() {
        const pos = GameState.posicaoEntidade || 1;
        document.querySelectorAll('.cam-btn').forEach((btn, index) => {
            const camNum = index + 1;
            btn.classList.toggle('active', camNum === this.cameraAtual);
            btn.setAttribute('aria-pressed', camNum === this.cameraAtual ? 'true' : 'false');

            btn.classList.remove('has-warning', 'has-danger');
            const badge = btn.querySelector('.cam-btn-badge');
            if (!badge) return;

            if (camNum === 3 && pos >= 3) {
                btn.classList.add('has-danger');
                badge.innerText = I18n.t("CAM_BADGE_INTRUSION");
                badge.className = 'cam-btn-badge badge-danger';
            } else if (camNum === 2 && pos === 2) {
                btn.classList.add('has-warning');
                badge.innerText = I18n.t("CAM_BADGE_MOVEMENT");
                badge.className = 'cam-btn-badge badge-warning';
            } else if (camNum === 1 && pos === 1) {
                badge.innerText = I18n.t("CAM_BADGE_CLEAR");
                badge.className = 'cam-btn-badge badge-normal';
            } else {
                badge.innerText = "";
                badge.className = 'cam-btn-badge hidden';
            }
        });
    },

    trocarCamera(id) {
        this.cameraAtual = Number(id) || 1;
        this.sincronizandoFrames = 8;
        this.flashFrames = Storage.isReducedMotion() ? 0 : 4;

        this.atualizarHUD();
        this.atualizarMarcadoresBotoes();
        AudioManager.play('camera');
    }
};
