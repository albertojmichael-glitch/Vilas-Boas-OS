export const UI = {
    mostrarAlerta(mensagem, titulo = 'Aviso') {
        const titleEl = document.getElementById('alert-title');
        const msgEl = document.getElementById('alert-message');
        const alertWin = document.getElementById('custom-alert');
        
        if (titleEl && msgEl && alertWin) {
            titleEl.innerText = titulo;
            msgEl.innerText = mensagem;
            alertWin.classList.remove('hidden');
        } else {
            console.warn('[UI] Elementos do alerta não encontrados no DOM.');
        }
    },

    fecharAlerta() {
        const alertWin = document.getElementById('custom-alert');
        if (alertWin) alertWin.classList.add('hidden');
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
        }
    },

    iniciarTelaBoot() {
        setTimeout(() => {
            const bootScreen = document.getElementById('boot-screen');
            if (bootScreen) {
                bootScreen.style.opacity = '0';
                setTimeout(() => bootScreen.remove(), 1000);
            }
        }, 3500); 
    },

    iniciarRelogio() {
        const updateClock = () => {
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

        updateClock(); // Chama a primeira vez
        setInterval(updateClock, 1000); // Atualiza a cada segundo
    },

    configurarMenuIniciar() {
        const startOrb = document.getElementById('start-orb');
        const startMenu = document.getElementById('start-menu');
        const desktop = document.getElementById('desktop');

        // Alterna o menu ao clicar no botão iniciar
        if (startOrb) {
            startOrb.addEventListener('click', (e) => {
                e.stopPropagation();
                if (startMenu) startMenu.classList.toggle('hidden');
            });
        }

        // Fecha o menu se clicar fora dele (no desktop)
        if (desktop) {
            desktop.addEventListener('mousedown', () => {
                if (startMenu && !startMenu.classList.contains('hidden')) {
                    startMenu.classList.add('hidden');
                }
            });
        }
    },

    configurarOuvintesDoJogo() {
        // Escuta a atualização do relógio do jogo
        document.addEventListener('game:timeUpdate', (e) => {
            const clockEl = document.getElementById('clock');
            if (clockEl) {
                let horaMostrar = e.detail.hora === 0 ? 12 : e.detail.hora;
                clockEl.innerText = `${horaMostrar}:00 AM`;
            }
        });

        // Escuta a atualização de bateria e muda as cores
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

        // Escuta a morte por energia
        document.addEventListener('game:blackout', () => {
            const blackout = document.getElementById('blackout-overlay');
            if (blackout) blackout.classList.remove('hidden');
            // Opcional: Se tiver AudioManager implementado -> AudioManager.pararAmbiente();
        });

        // Escuta a vitória às 6 AM
        document.addEventListener('game:win', () => {
            this.mostrarAlerta("Turno concluído com sucesso. Bom trabalho, segurança.", "6:00 AM - Fim do Turno");
        });

        // Escuta Eventos de História (Lore)
        document.addEventListener('game:event', (e) => {
            if (e.detail.tipo === 'cat_glitch') {
                if (window.abrirJanela && window.glitchCatHelper) {
                    window.abrirJanela('cat-window');
                    window.glitchCatHelper();
                }
            }
        });
    }
};