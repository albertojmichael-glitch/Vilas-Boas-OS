// main.js
import { Storage } from './storage.js';
import { WindowManager } from './windowManager.js';
import { UI } from './ui.js';
import { GameState } from './gameState.js';
import { Cameras } from './cameras.js';
import { I18n } from './i18nManager.js';
import { AudioManager } from './assets/sounds/audioManager.js';

let dicaGatoIndice = 1;

const App = {
    init() {
        console.log("Inicializando Vilas Boas OS...");

        Storage.init();
        AudioManager.init();
        UI.iniciarTelaBoot();
        UI.iniciarRelogio();
        UI.configurarMenuIniciar();
        UI.configurarOuvintesDoJogo();

        Cameras.init();
        WindowManager.initRede();
        UI.initNotepad();
        UI.initEmails();
        UI.initExplorador();

        I18n.traduzirDOM();
        UI.sincronizarPainelConfiguracoes();
        UI.atualizarPainelRede(1);
        UI.atualizarPainelEnergia();
        UI.atualizarTutorial();
        UI.atualizarJanelaLixeira();

        this.configurarIconesDesktop();

        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            if (win.id !== 'custom-alert' && win.id !== 'auth-modal') {
                WindowManager.tornarArrastavel(win);
                if (win.id !== 'tutorial-note') {
                    WindowManager.tornarRedimensionavel(win);
                }
            }
        });

        WindowManager.restaurarJanelas();
        this.configurarAcessibilidade();
        this.configurarAtalhosTeclado();
        this.configurarDragAndDropArquivos();
    },

    configurarIconesDesktop() {
        const desktopIcons = Array.from(document.querySelectorAll('.desktop-icon'));
        desktopIcons.forEach((icon, index) => {
            icon.setAttribute('tabindex', '0');
            icon.setAttribute('role', 'button');
            icon.setAttribute('aria-selected', 'false');

            WindowManager.tornarArrastavel(icon, {
                onDragEnd: (el) => UI.verificarLixeira(el)
            });

            const executarAbertura = () => {
                UI.selecionarIconeDesktop(icon);
                const targetWindow = icon.getAttribute('data-target');
                if (targetWindow) {
                    WindowManager.abrir(targetWindow);
                }
            };

            // 1 clique seleciona
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                UI.selecionarIconeDesktop(icon);
            });

            icon.addEventListener('focus', () => {
                UI.selecionarIconeDesktop(icon);
            });

            // Duplo clique abre
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                executarAbertura();
            });

            // Enter ou Espaço abre; Setas navegam entre ícones
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    executarAbertura();
                } else if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
                    e.preventDefault();
                    let nextIdx = index;
                    if (e.key === 'ArrowDown') nextIdx = (index + 1) % desktopIcons.length;
                    if (e.key === 'ArrowUp') nextIdx = (index - 1 + desktopIcons.length) % desktopIcons.length;
                    if (e.key === 'ArrowRight') nextIdx = (index + 4) % desktopIcons.length;
                    if (e.key === 'ArrowLeft') nextIdx = (index - 4 + desktopIcons.length) % desktopIcons.length;
                    const proximo = desktopIcons[nextIdx];
                    if (proximo && proximo.style.display !== 'none') {
                        proximo.focus();
                    }
                }
            });
        });
    },

    configurarAcessibilidade() {
        const elementosClicaveis = document.querySelectorAll('.win-btn, .cam-btn, .right-item, .wallpaper-card, [data-settings-tab], [data-folder-nav], .drive-item');

        elementosClicaveis.forEach(el => {
            if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON') {
                el.setAttribute('tabindex', '0');
            }
            if (el.tagName !== 'BUTTON') {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (el.ondblclick) {
                            el.ondblclick(e);
                        } else {
                            el.click();
                        }
                    }
                });
            }
        });

        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            win.addEventListener('mousedown', () => {
                WindowManager.trazerParaFrente(win.id);
            });
            win.addEventListener('focusin', () => {
                WindowManager.trazerParaFrente(win.id);
            });
        });

        // Permitir Enter na tela de login
        const loginInput = document.getElementById('login-password-input');
        if (loginInput) {
            loginInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.fazerLogin();
                }
            });
        }

        // Permitir Enter no modal de senha confidencial
        const authInput = document.getElementById('auth-password-input');
        if (authInput) {
            authInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    UI.confirmarSenhaConfidencial();
                }
            });
        }
    },

    configurarAtalhosTeclado() {
        document.addEventListener('keydown', (e) => {
            // Se a tela de boot ainda estiver visível, Enter ou Espaço pula o boot
            const bootScreen = document.getElementById('boot-screen');
            if (bootScreen && (e.key === 'Enter' || e.key === ' ')) {
                const skipBtn = document.getElementById('boot-skip-btn');
                if (skipBtn) {
                    e.preventDefault();
                    skipBtn.click();
                    return;
                }
            }

            // Se a tela de login estiver visível, Enter faz login
            const loginScreen = document.getElementById('start-screen');
            if (loginScreen && !loginScreen.classList.contains('hidden')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    window.fazerLogin();
                }
                return;
            }

            if (e.key === 'Meta') {
                e.preventDefault();
                window.toggleStartMenu();
                return;
            }

            if (e.ctrlKey && e.altKey && e.code === 'KeyL') {
                e.preventDefault();
                UI.bloquearEstacao();
                return;
            }

            // Movimentação e Redimensionamento de Janelas por Teclado (Acessibilidade sem mouse)
            if (e.altKey && WindowManager.janelaAtivaId) {
                const step = 28;
                if (e.shiftKey) {
                    if (e.key === 'ArrowLeft') { e.preventDefault(); WindowManager.encaixarJanela(WindowManager.janelaAtivaId, 'left'); return; }
                    if (e.key === 'ArrowRight') { e.preventDefault(); WindowManager.encaixarJanela(WindowManager.janelaAtivaId, 'right'); return; }
                    if (e.key === 'ArrowUp') { e.preventDefault(); WindowManager.encaixarJanela(WindowManager.janelaAtivaId, 'max'); return; }
                    if (e.key === 'ArrowDown') { e.preventDefault(); WindowManager.encaixarJanela(WindowManager.janelaAtivaId, 'restore'); return; }
                } else {
                    if (e.key === 'ArrowLeft') { e.preventDefault(); WindowManager.moverPorTeclado(WindowManager.janelaAtivaId, -step, 0); return; }
                    if (e.key === 'ArrowRight') { e.preventDefault(); WindowManager.moverPorTeclado(WindowManager.janelaAtivaId, step, 0); return; }
                    if (e.key === 'ArrowUp') { e.preventDefault(); WindowManager.moverPorTeclado(WindowManager.janelaAtivaId, 0, -step); return; }
                    if (e.key === 'ArrowDown') { e.preventDefault(); WindowManager.moverPorTeclado(WindowManager.janelaAtivaId, 0, step); return; }
                    if (e.key === '+' || e.key === '=') { e.preventDefault(); WindowManager.redimensionarPorTeclado(WindowManager.janelaAtivaId, 36, 24); return; }
                    if (e.key === '-' || e.key === '_') { e.preventDefault(); WindowManager.redimensionarPorTeclado(WindowManager.janelaAtivaId, -36, -24); return; }
                }
            }

            // Tratamento contextual da tecla Escape
            if (e.key === 'Escape') {
                // 1. Modal de senha confidencial
                const authModal = document.getElementById('auth-modal');
                if (authModal && !authModal.classList.contains('hidden')) {
                    UI.fecharModalSenhaConfidencial();
                    return;
                }

                // 2. Alerta modal do sistema
                const alertWin = document.getElementById('custom-alert');
                if (alertWin && !alertWin.classList.contains('hidden')) {
                    UI.fecharAlerta();
                    return;
                }

                // 3. Barra de confirmação do Bloco de Notas
                const confirmBar = document.getElementById('notepad-confirm-bar');
                if (confirmBar && !confirmBar.classList.contains('hidden')) {
                    UI.confirmarLimparNotepad(false);
                    return;
                }

                // 4. Submenu de energia do Menu Iniciar
                const powerSubmenu = document.getElementById('power-submenu');
                if (powerSubmenu && !powerSubmenu.classList.contains('hidden')) {
                    powerSubmenu.classList.add('hidden');
                    return;
                }

                // 5. Painel flutuante de diagnóstico de energia
                const powerFlyout = document.getElementById('power-flyout');
                if (powerFlyout && !powerFlyout.classList.contains('hidden')) {
                    powerFlyout.classList.add('hidden');
                    return;
                }

                // 6. Menu Iniciar
                const startMenu = document.getElementById('start-menu');
                if (startMenu && !startMenu.classList.contains('hidden')) {
                    window.toggleStartMenu(false);
                    return;
                }

                // 7. Se estiver digitando em um campo de texto, tira o foco primeiro para evitar fechar a janela por acidente
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    document.activeElement.blur();
                    return;
                }

                // 8. Guia / Post-it de tutorial se estiver aberto e visível
                const tutorial = document.getElementById('tutorial-note');
                if (tutorial && !tutorial.classList.contains('hidden') && WindowManager.janelaAtivaId === 'tutorial-note') {
                    WindowManager.fechar('tutorial-note');
                    return;
                }

                // 9. Janela ativa: se for uma janela crítica durante perigo ou Bloco de Notas com edições não salvas, minimiza em vez de fechar bruscamente
                const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden):not(.minimized)'))
                    .filter(w => w.id !== 'tutorial-note');
                if (openWindows.length > 0) {
                    const topmost = openWindows.reduce((highest, win) => {
                        return (parseInt(win.style.zIndex) || 0) > (parseInt(highest.style.zIndex) || 0) ? win : highest;
                    });

                    const ehCriticaEmAlerta = (topmost.id === 'rede-window' || topmost.id === 'camera-window') && GameState.posicaoEntidade >= 2;
                    const ehNotepadSujo = topmost.id === 'notepad-window' && UI.notepadDirty;

                    if (ehCriticaEmAlerta || ehNotepadSujo) {
                        WindowManager.alternarMinimizar(topmost.id);
                    } else {
                        WindowManager.fechar(topmost.id);
                    }
                    return;
                }

                // 10. Limpa seleção de ícones do desktop
                UI.limparSelecaoIcones();
            }

            if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
                e.preventDefault();
                WindowManager.abrir('debug-window');
            }

            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden):not(.minimized)'));
                if (openWindows.length > 1) {
                    const lowest = openWindows.reduce((lowestWin, win) => {
                        return (parseInt(win.style.zIndex) || 0) < (parseInt(lowestWin.style.zIndex) || 0) ? win : lowestWin;
                    });
                    WindowManager.trazerParaFrente(lowest.id);
                }
            }
        });
    },

    configurarDragAndDropArquivos() {
        document.addEventListener('dragstart', (e) => {
            const dragItem = e.target.closest('.draggable-file');
            if (dragItem) {
                e.dataTransfer.setData('text/plain', dragItem.getAttribute('data-content') || '');
                e.dataTransfer.setData('application/filename', dragItem.getAttribute('data-filename') || 'Arquivo.txt');
                e.dataTransfer.effectAllowed = 'copy';
                document.body.classList.add('dragging-txt-file');
            }
        });

        document.addEventListener('dragend', () => {
            document.body.classList.remove('dragging-txt-file');
            const notepadWin = document.getElementById('notepad-window');
            if (notepadWin) notepadWin.classList.remove('drop-target-hover');
        });

        const notepadWin = document.getElementById('notepad-window');
        if (notepadWin) {
            notepadWin.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                notepadWin.classList.add('drop-target-hover');
            });

            notepadWin.addEventListener('dragleave', (e) => {
                if (!notepadWin.contains(e.relatedTarget)) {
                    notepadWin.classList.remove('drop-target-hover');
                }
            });

            notepadWin.addEventListener('drop', (e) => {
                e.preventDefault();
                document.body.classList.remove('dragging-txt-file');
                notepadWin.classList.remove('drop-target-hover');

                const conteudo = e.dataTransfer.getData('text/plain');
                const nomeArquivo = e.dataTransfer.getData('application/filename');

                if (conteudo) {
                    UI.abrirTexto('notepad-window', nomeArquivo, conteudo);
                    WindowManager.trazerParaFrente('notepad-window');
                    AudioManager.play('click');
                }
            });
        }
    }
};

document.addEventListener("DOMContentLoaded", () => App.init());

// ==========================================
// EXPOSIÇÃO GLOBAL PARA O HTML
// ==========================================
window.GameState = GameState;
window.AudioManager = AudioManager;
window.I18n = I18n;
window.WindowManager = WindowManager;
window.UI = UI;

window.abrirJanela = (id) => WindowManager.abrir(id);
window.fecharJanela = (id) => WindowManager.fechar(id);
window.minimizarJanela = (id) => WindowManager.alternarMinimizar(id);
window.maximizarJanela = (id) => WindowManager.maximizar(id);
window.encaixarJanela = (id, modo) => WindowManager.encaixarJanela(id, modo);
window.trazerParaFrente = (id) => WindowManager.trazerParaFrente(id);
window.trocarCamera = (id) => Cameras.trocarCamera(id);

window.mostrarAlerta = (msg, titulo) => UI.mostrarAlerta(msg, titulo);
window.fecharAlerta = () => UI.fecharAlerta();

window.abrirTexto = (titulo, conteudo) => {
    UI.abrirTexto('notepad-window', titulo, conteudo);
    WindowManager.abrir('notepad-window');
};

window.salvarNotepad = () => UI.salvarNotepadAtual();
window.limparNotepad = () => UI.solicitarLimparNotepad();
window.confirmarLimparNotepad = (confirmado) => UI.confirmarLimparNotepad(confirmado);

window.mudarPapelDeParede = (url) => Storage.salvarWallpaper(url);
window.toggleAltoContraste = () => Storage.toggleHighContrast();
window.toggleMovimentoReduzido = () => Storage.toggleReducedMotion();
window.toggleRestaurarJanelas = () => Storage.toggleAutoRestoreWindows();

window.abrirCameraDoAlerta = () => {
    const btn = document.getElementById('btn-open-alert-cam');
    const camAlvo = Number(btn?.dataset?.cam) || (GameState.posicaoEntidade >= 3 ? 3 : (GameState.posicaoEntidade === 2 ? 2 : 1));
    WindowManager.abrir('camera-window');
    Cameras.trocarCamera(camAlvo);
};

window.abrirRedeDaCamera = () => {
    WindowManager.abrir('rede-window');
};

window.avancarDicaCat = () => {
    const avatar = document.getElementById('cat-avatar-img');
    if (avatar && avatar.classList.contains('glitched')) return;

    const speech = document.getElementById('cat-text');
    if (!speech) return;

    if (dicaGatoIndice === 1) {
        dicaGatoIndice = 2;
        speech.innerHTML = `
            <p><strong>${I18n.t('CAT_TIP_2_TITLE')}</strong></p>
            <p>${I18n.t('CAT_TIP_2_BODY')}</p>
            <button type="button" class="vista-btn" onclick="avancarDicaCat()" style="margin-top: 10px;">${I18n.t('CAT_NEXT_TIP_BTN')}</button>
        `;
        AudioManager.play('click');
    } else {
        window.glitchCatHelper();
    }
};

window.glitchCatHelper = () => {
    const avatar = document.getElementById('cat-avatar-img');
    const hat = document.getElementById('cat-hat');
    const speech = document.getElementById('cat-text');

    if (avatar) avatar.classList.add('glitched');
    if (hat) {
        hat.classList.add('glitched-hat');
        hat.innerText = 'ERRO 666';
    }
    if (speech) {
        speech.classList.add('glitched-text');
        speech.innerHTML = `
            <p><strong>${I18n.t('CAT_GLITCH_TITLE')}</strong></p>
            <p>${I18n.t('CAT_GLITCH_BODY')}</p>
            <p style="font-size: 0.75rem; margin-top: 6px; color: #ff6666;">${I18n.t('CAT_GLITCH_FOOTER')}</p>
        `;
    }
    AudioManager.play('error');
};

window.reiniciarFirewall = () => {
    const sucesso = GameState.reiniciarFirewallRede();
    if (sucesso) {
        AudioManager.play('startup');
        UI.mostrarNotificacao({
            titulo: `🛡️ ${I18n.t('APP_NETWORK')}`,
            mensagem: I18n.t('NET_PURGE_SUCCESS'),
            tipo: 'success',
            duracao: 5500
        });
    } else {
        UI.mostrarAlerta(I18n.t('NET_PURGE_FAIL'), I18n.t('WARNING_TITLE'));
    }
};

window.acessarPastaConfidencial = () => {
    UI.abrirModalSenhaConfidencial();
};

window.abrirLixeira = () => {
    UI.atualizarJanelaLixeira();
    WindowManager.abrir('lixeira-window');
};

window.togglePowerFlyout = (e) => {
    if (e) e.stopPropagation();
    const flyout = document.getElementById('power-flyout');
    if (flyout) {
        flyout.classList.toggle('hidden');
        AudioManager.play('click');
    }
};

window.toggleStartMenu = (forcarEstado) => {
    const menu = document.getElementById('start-menu');
    const orb = document.getElementById('start-orb');
    const powerSub = document.getElementById('power-submenu');
    if (!menu) return;

    const deveAbrir = typeof forcarEstado === 'boolean' ? forcarEstado : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !deveAbrir);
    if (orb) {
        orb.setAttribute('aria-expanded', deveAbrir ? 'true' : 'false');
        orb.classList.toggle('orb-active', deveAbrir);
    }
    if (!deveAbrir && powerSub) {
        powerSub.classList.add('hidden');
    }
    if (deveAbrir) {
        const searchInput = document.getElementById('start-search-input');
        if (searchInput) {
            searchInput.value = '';
            UI.renderizarListaMenuIniciar('');
            setTimeout(() => searchInput.focus(), 40);
        }
    }
    AudioManager.play('click');
};

window.passoTutorialAnterior = () => {
    if (UI.passoTutorial > 1) {
        UI.passoTutorial--;
        UI.atualizarTutorial();
        AudioManager.play('click');
    }
};

window.passoTutorialProximo = () => {
    if (UI.passoTutorial < 3) {
        UI.passoTutorial++;
        UI.atualizarTutorial();
        AudioManager.play('click');
    } else {
        WindowManager.fechar('tutorial-note');
    }
};

window.fazerLogin = () => {
    const loginScreen = document.getElementById('start-screen');
    const estavaBloqueado = loginScreen?.dataset?.locked === 'true';

    if (loginScreen) {
        loginScreen.style.transition = "opacity 0.6s ease";
        loginScreen.style.opacity = "0";
        loginScreen.dataset.locked = 'false';
    }

    AudioManager.play('startup');
    AudioManager.iniciarAmbiente();

    setTimeout(() => {
        if (loginScreen) loginScreen.classList.add('hidden');

        if (!estavaBloqueado) {
            GameState.iniciarNoite();
            UI.passoTutorial = 1;
            UI.atualizarTutorial();
            WindowManager.abrir('tutorial-note');

            // Se havia janelas abertas na sessão anterior e auto-restore está desligado, oferece opção discreta
            if (WindowManager.janelasSessaoAnterior.length > 0) {
                UI.mostrarNotificacao({
                    titulo: I18n.t('SYSTEM_NAME'),
                    mensagem: I18n.t('SESSION_RESTORE_PROMPT'),
                    textoBotao: `${I18n.t('SESSION_RESTORE_BTN')} (${WindowManager.janelasSessaoAnterior.length})`,
                    aoClicar: () => WindowManager.reabrirSessaoAnterior(),
                    tipo: 'info',
                    duracao: 10000
                });
            }
        }
    }, 600);
};
