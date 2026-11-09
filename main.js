// main.js
import { Storage } from './storage.js';
import { WindowManager } from './windowManager.js';
import { UI } from './ui.js';
import { GameState } from './gameState.js';
import { Cameras } from './cameras.js';
import { I18n } from './i18nManager.js';
import { AudioManager } from './assets/sounds/audioManager.js';

const App = {
    init() {
        console.log("Inicializando Vilas Boas OS...");
        
        AudioManager.init();
        UI.iniciarTelaBoot();
        UI.iniciarRelogio();
        UI.configurarMenuIniciar();
        UI.configurarOuvintesDoJogo();
        
        Storage.init();
        Cameras.init();
        WindowManager.initRede();
        I18n.traduzirDOM();
        
        const textarea = document.getElementById("notepad-textarea");
        Storage.carregarNotepad(textarea);

        const desktopIcons = document.querySelectorAll('.desktop-icon');
        desktopIcons.forEach(icon => {
            WindowManager.tornarArrastavel(icon, {
                onDragEnd: (el) => UI.verificarLixeira(el)
            });
        });

        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            if (win.id !== 'custom-alert') { 
                WindowManager.tornarArrastavel(win);
                if (win.id !== 'tutorial-note') {
                    WindowManager.tornarRedimensionavel(win);
                }
            }
        });

        WindowManager.restaurarJanelas();
        this.configurarAcessibilidade();
        this.configurarAtalhosTeclado();
    },

    configurarAcessibilidade() {
        const elementosClicaveis = document.querySelectorAll('.desktop-icon, .taskbar-item, .win-btn, .cam-btn, .start-item, .right-item');
        
        elementosClicaveis.forEach(el => {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (el.ondblclick) {
                        el.ondblclick();
                    } else {
                        el.click();
                    }
                }
            });
        });

        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            win.addEventListener('focusin', () => {
                WindowManager.trazerParaFrente(win.id);
            });
        });
    },

    configurarAtalhosTeclado() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Meta') {
                e.preventDefault();
                window.toggleStartMenu();
            }

            if (e.key === 'Escape') {
                const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
                if (openWindows.length > 0) {
                    const topmost = openWindows.reduce((highest, win) => {
                        return (parseInt(win.style.zIndex) || 0) > (parseInt(highest.style.zIndex) || 0) ? win : highest;
                    });
                    WindowManager.fechar(topmost.id);
                }
            }

            if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
                e.preventDefault();
                WindowManager.abrir('debug-window');
            }

            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
                if (openWindows.length > 1) {
                    const lowest = openWindows.reduce((lowestWin, win) => {
                        return (parseInt(win.style.zIndex) || 0) < (parseInt(lowestWin.style.zIndex) || 0) ? win : lowestWin;
                    });
                    WindowManager.trazerParaFrente(lowest.id);
                }
            }
        });
    }
};

document.addEventListener("DOMContentLoaded", () => App.init());

// ==========================================
// EXPOSIÇÃO GLOBAL PARA O HTML
// ==========================================
window.GameState = GameState;
window.AudioManager = AudioManager;
window.I18n = I18n;

window.abrirJanela = (id) => WindowManager.abrir(id);
window.fecharJanela = (id) => WindowManager.fechar(id);
window.minimizarJanela = (id) => WindowManager.alternarMinimizar(id);
window.maximizarJanela = (id) => WindowManager.maximizar(id);
window.trazerParaFrente = (id) => WindowManager.trazerParaFrente(id);
window.trocarCamera = (id) => Cameras.trocarCamera(id);

window.mostrarAlerta = (msg, titulo) => UI.mostrarAlerta(msg, titulo);
window.fecharAlerta = () => UI.fecharAlerta();

window.abrirTexto = (titulo, conteudo) => {
    UI.abrirTexto('notepad-window', titulo, conteudo);
    WindowManager.abrir('notepad-window');
};

window.salvarNotepad = () => {
    const texto = document.getElementById("notepad-textarea")?.value || "";
    Storage.salvarNotepad(texto);
    UI.mostrarAlerta("Arquivo salvo com sucesso no Disco Local (C:)", "Bloco de Notas");
};

window.limparNotepad = () => {
    const ta = document.getElementById("notepad-textarea");
    if (ta) ta.value = "";
};

window.mudarPapelDeParede = (url) => Storage.salvarWallpaper(url);
window.toggleAltoContraste = () => Storage.toggleHighContrast();

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
            <p><strong>ELE ESTÁ NA SALA 03.</strong></p>
            <p>Abra o <em>Monitor de Rede</em> e dispare o Pulso de Firewall antes que ele entre na sua sala...</p>
            <p style="font-size: 0.75rem; margin-top: 6px; color: #ff6666;">[CONEXÃO CORROMPIDA]</p>
        `;
    }
    AudioManager.play('error');
};

window.reiniciarFirewall = () => {
    const sucesso = GameState.reiniciarFirewallRede();
    if (sucesso) {
        AudioManager.play('startup');
        UI.mostrarAlerta("Pulso de Firewall executado (-5% de Energia).\nA anomalia foi expulsa de volta para o Palco Principal (CAM 01).", "Monitor de Rede");
    } else {
        UI.mostrarAlerta("Energia insuficiente para executar o Pulso de Firewall!", "Erro de Energia");
    }
};

window.acessarPastaConfidencial = () => {
    if (GameState.arquivosDesbloqueados) {
        window.abrirTexto(
            " Segredo_Projeto_VB.txt",
            "RELATÓRIO CONFIDENCIAL - PROJETO VILAS BOAS\n\nAs unidades não estão apresentando defeito mecânico. A consciência da antiga equipe foi transferida para a sub-rede da pizzaria.\n\nNão desligue o servidor principal ou eles ficarão presos no escuro com você."
        );
        return;
    }

    const senha = prompt("ACESSO RESTRITO (ADMIN)\nDigite a chave de segurança (Dica: verifique seus e-mails às 2:00 AM):");
    if (senha === "1987") {
        GameState.arquivosDesbloqueados = true;
        window.acessarPastaConfidencial();
    } else if (senha !== null) {
        UI.mostrarAlerta("Senha incorreta! Acesso bloqueado pelo administrador.", "Acesso Negado");
    }
};

window.abrirLixeira = () => {
    const imgLixeira = document.querySelector('#icon-lixeira .icon-trash');
    if (imgLixeira && imgLixeira.classList.contains('full')) {
        UI.mostrarAlerta("Atalhos removidos da Área de Trabalho.", "Lixeira (Cheia)");
    } else {
        UI.mostrarAlerta("A Lixeira está vazia.", "Lixeira");
    }
};

window.toggleStartMenu = () => {
    const menu = document.getElementById('start-menu');
    if (menu) menu.classList.toggle('hidden');
};

window.fazerLogin = () => {
    const loginScreen = document.getElementById('start-screen');
    
    if (loginScreen) {
        loginScreen.style.transition = "opacity 1.2s ease";
        loginScreen.style.opacity = "0";
    }

    AudioManager.play('startup');
    AudioManager.iniciarAmbiente();

    setTimeout(() => {
        if (loginScreen) loginScreen.classList.add('hidden');
        GameState.iniciarNoite();
        WindowManager.abrir('tutorial-note');
    }, 1200);
};

// ==========================================
// EVENT DELEGATION E DRAG & DROP DE ARQUIVOS
// ==========================================
document.addEventListener('dblclick', (e) => {
    const trigger = e.target.closest('[data-action="open-window"]');
    if (trigger) {
        WindowManager.abrir(trigger.getAttribute('data-target'));
    }

    // Também permite dar duplo clique nos arquivos .txt do Explorer para abrir direto no Bloco de Notas
    const fileItem = e.target.closest('.draggable-file');
    if (fileItem) {
        const titulo = fileItem.getAttribute('data-filename');
        const conteudo = fileItem.getAttribute('data-content');
        window.abrirTexto(titulo, conteudo);
    }
});

document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-action="close-window"]');
    if (closeBtn) {
        WindowManager.fechar(closeBtn.getAttribute('data-target'));
    }

    const minBtn = e.target.closest('[data-action="min-window"]');
    if (minBtn) {
        WindowManager.alternarMinimizar(minBtn.getAttribute('data-target'));
    }
});

document.addEventListener('dragstart', (e) => {
    const dragItem = e.target.closest('.draggable-file');
    if (dragItem) {
        e.dataTransfer.setData('text/plain', dragItem.getAttribute('data-content'));
        e.dataTransfer.setData('application/filename', dragItem.getAttribute('data-filename'));
        e.dataTransfer.effectAllowed = 'copy';
    }
});

const notepadTextarea = document.getElementById('notepad-textarea');
if (notepadTextarea) {
    notepadTextarea.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'copy';
        notepadTextarea.style.background = '#e5f1fb';
    });

    notepadTextarea.addEventListener('dragleave', () => {
        notepadTextarea.style.background = 'white';
    });

    notepadTextarea.addEventListener('drop', (e) => {
        e.preventDefault();
        notepadTextarea.style.background = 'white';
        
        const conteudo = e.dataTransfer.getData('text/plain');
        const nomeArquivo = e.dataTransfer.getData('application/filename');
        
        if (conteudo) {
            notepadTextarea.value = conteudo;
            const notepadWin = document.getElementById('notepad-window');
            if (notepadWin) {
                const titleEl = notepadWin.querySelector('.window-title');
                if (titleEl) titleEl.innerText = `${nomeArquivo} - Bloco de Notas`;
            }
            AudioManager.play('click');
        }
    });
}