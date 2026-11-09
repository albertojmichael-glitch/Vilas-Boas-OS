// ui.js
import { AudioManager } from './assets/sounds/audioManager.js';
import { GameState } from './gameState.js';
import { WindowManager } from './windowManager.js';

export const UI = {
    relogioInterval: null,

    mostrarAlerta(mensagem, titulo = 'Aviso') {
        const titleEl = document.getElementById('alert-title');
        const msgEl = document.getElementById('alert-message');
        const alertWin = document.getElementById('custom-alert');
        
        if (titleEl && msgEl && alertWin) {
            titleEl.innerText = titulo;
            msgEl.innerText = mensagem;
            alertWin.classList.remove('hidden');
            AudioManager.play('error');
        }
    },

    fecharAlerta() {
        const alertWin = document.getElementById('custom-alert');
        if (alertWin) alertWin.classList.add('hidden');
        AudioManager.play('click');
    },

    abrirTexto(idWindow, titulo, conteudo) {
        const notepad = document.getElementById(idWindow);
        if (!notepad) return;
        
        const titleEl = notepad.querySelector('.window-title');
        const textarea = notepad.querySelector('textarea');
        
        if (titleEl) titleEl.innerText = titulo + ' - Bloco de Notas';
        if (textarea) textarea.value = conteudo;
    },

    verificarLixeira(elementoArrastado) {
        if (!elementoArrastado.classList.contains('desktop-icon') || elementoArrastado.id === 'icon-lixeira') return;

        const lixeira = document.getElementById('icon-lixeira');
        if (!lixeira) return;
        
        const rectLixeira = lixeira.getBoundingClientRect();
        const rectItem = elementoArrastado.getBoundingClientRect();

        const colidiu = !(rectLixeira.right < rectItem.left || 
                          rectLixeira.left > rectItem.right || 
                          rectLixeira.bottom < rectItem.top || 
                          rectLixeira.top > rectItem.bottom);

        if (colidiu) {
            elementoArrastado.style.display = 'none';
            const imgTrash = lixeira.querySelector('.icon-trash');
            if (imgTrash) imgTrash.classList.add('full');
            AudioManager.play('click');
        }
    },

    iniciarTelaBoot() {
        setTimeout(() => {
            const bootScreen = document.getElementById('boot-screen');
            if (bootScreen) {
                bootScreen.style.opacity = '0';
                setTimeout(() => bootScreen.remove(), 1000);
            }
        }, 2500); 
    },

    iniciarRelogio() {
        const updateClock = () => {
            // Se a noite do jogo começou, não deixa o relógio real sobrescrever o horário do turno!
            if (GameState.noiteAtiva) return;

            const clockElement = document.getElementById('clock');
            if (!clockElement) return;

            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            hours = hours % 12;
            hours = hours ? hours : 12; 
            minutes = minutes < 10 ? '0' + minutes : minutes;
            
            clockElement.textContent = `${hours}:${minutes} ${ampm}`;
        };

        updateClock();
        this.relogioInterval = setInterval(updateClock, 1000);
    },

    configurarMenuIniciar() {
        const startOrb = document.getElementById('start-orb');
        const startMenu = document.getElementById('start-menu');
        const desktop = document.getElementById('desktop');

        if (startOrb) {
            startOrb.addEventListener('click', (e) => {
                e.stopPropagation();
                if (startMenu) startMenu.classList.toggle('hidden');
                AudioManager.play('click');
            });
        }

        if (desktop) {
            desktop.addEventListener('mousedown', () => {
                if (startMenu && !startMenu.classList.contains('hidden')) {
                    startMenu.classList.add('hidden');
                }
            });
        }
    },

    atualizarPainelRede(posicao) {
        const netStatus = document.getElementById('net-status-text');
        const netAlert = document.getElementById('net-alert-text');
        const btnPurge = document.getElementById('btn-purge-network');

        if (!netStatus || !netAlert) return;

        if (posicao === 1) {
            netStatus.innerHTML = `<span style="color: #4aff4a;">ESTÁVEL (12ms)</span>`;
            netAlert.innerText = "Tráfego local normal. Nenhuma invasão crítica detectada.";
            netAlert.style.color = "#aaa";
            if (btnPurge) btnPurge.disabled = true;
        } else if (posicao === 2) {
            netStatus.innerHTML = `<span style="color: #ffda33;">OSCILANDO (240ms)</span>`;
            netAlert.innerText = "AVISO: Movimentação detectada no Corredor Leste (CAM 02).";
            netAlert.style.color = "#ffda33";
            if (btnPurge) btnPurge.disabled = false;
        } else if (posicao >= 3) {
            netStatus.innerHTML = `<span style="color: #ff3333; animation: text-blink 0.6s infinite;">INVASÃO CRÍTICA (999ms)</span>`;
            netAlert.innerText = "PERIGO IMINENTE: Entidade na Sala 03! Execute o Pulso de Firewall AGORA antes que ela chegue ao escritório!";
            netAlert.style.color = "#ff4a4a";
            if (btnPurge) btnPurge.disabled = false;
        }
    },

    adicionarEmailNaLista(email) {
        const lista = document.getElementById('email-list');
        if (!lista) return;

        const item = document.createElement('li');
        item.className = 'unread-email';
        item.innerHTML = `<strong>${email.remetente}</strong><br><small>${email.assunto}</small>`;
        item.onclick = () => {
            item.classList.remove('unread-email');
            const view = document.getElementById('email-body-view');
            if (view) {
                view.innerHTML = `
                    <h4>${email.assunto}</h4>
                    <p class="email-meta"><strong>De:</strong> ${email.remetente}</p>
                    <hr style="margin: 10px 0; border: none; border-top: 1px solid #ccc;">
                    <pre style="white-space: pre-wrap; font-family: inherit;">${email.corpo}</pre>
                `;
            }
            AudioManager.play('click');
        };
        lista.prepend(item);
        this.mostrarAlerta(`Novo e-mail recebido de: ${email.remetente}`, "VilasMail");
    },

    configurarOuvintesDoJogo() {
        document.addEventListener('game:timeUpdate', (e) => {
            const clockEl = document.getElementById('clock');
            if (clockEl) {
                let horaMostrar = e.detail.hora === 0 ? 12 : e.detail.hora;
                clockEl.innerText = `${horaMostrar}:00 AM`;
            }
        });

        document.addEventListener('game:powerUpdate', (e) => {
            const powerEl = document.getElementById('power-text');
            const powerMeter = document.getElementById('power-meter');
            const energia = e.detail.energia;
            
            if (powerEl && powerMeter) {
                powerEl.innerText = `${energia}%`;
                
                if (energia <= 20) {
                    powerMeter.style.color = '#ff4a4a';
                    powerMeter.style.animation = 'text-blink 1s infinite';
                } else if (energia <= 50) {
                    powerMeter.style.color = '#ffda33';
                    powerMeter.style.animation = 'none';
                } else {
                    powerMeter.style.color = '#4aff4a';
                    powerMeter.style.animation = 'none';
                }
            }
        });

        document.addEventListener('game:entityMove', (e) => {
            this.atualizarPainelRede(e.detail.posicao);
        });

        document.addEventListener('game:newEmail', (e) => {
            this.adicionarEmailNaLista(e.detail);
        });

        document.addEventListener('game:blackout', () => {
            AudioManager.pararAmbiente();
            AudioManager.play('error');
            const blackout = document.getElementById('blackout-overlay');
            if (blackout) blackout.classList.remove('hidden');
        });

        document.addEventListener('game:jumpscare', () => {
            AudioManager.pararAmbiente();
            AudioManager.play('jumpscare');
            const jumpscare = document.getElementById('jumpscare-overlay');
            if (jumpscare) jumpscare.classList.remove('hidden');
        });

        document.addEventListener('game:win', () => {
            AudioManager.pararAmbiente();
            AudioManager.play('startup');
            const winOverlay = document.getElementById('win-overlay');
            if (winOverlay) winOverlay.classList.remove('hidden');
        });

        document.addEventListener('game:event', (e) => {
            if (e.detail.tipo === 'cat_glitch') {
                WindowManager.abrir('cat-window');
                if (window.glitchCatHelper) window.glitchCatHelper();
            }
        });
    }
};