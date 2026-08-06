import { Storage } from './storage.js';
import { WindowManager } from './windowManager.js';
import { UI } from './ui.js';
import { GameState } from './gameState.js';
import { Cameras } from './cameras.js';
import { I18n } from './i18nManager.js';

const App = {
    init() {
        console.log("Inicializando Vilas Boas OS...");
        
        // 1. Inicia Interface e Efeitos Base
        UI.iniciarTelaBoot();
        UI.iniciarRelogio();
        UI.configurarMenuIniciar();
        UI.configurarOuvintesDoJogo();
        
        // 2. Inicia Módulos
        Storage.init();
        Cameras.init();
        WindowManager.initRede();
        I18n.traduzirDOM();
        
        const textarea = document.getElementById("notepad-textarea");
        Storage.carregarNotepad(textarea);

        // 3. Configura Física (Arrastar e Soltar) via WindowManager
        const desktopIcons = document.querySelectorAll('.desktop-icon');
        desktopIcons.forEach(icon => {
            WindowManager.tornarArrastavel(icon, {
                onDragEnd: (el) => UI.verificarLixeira(el)
            });
        });

        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            if(win.id !== 'custom-alert') { 
                WindowManager.tornarArrastavel(win);
            }
        });

        const iconSettings = document.getElementById("icon-settings");
        if (iconSettings) WindowManager.tornarArrastavel(iconSettings);

        // 4. Restaura posições e janelas salvas anteriormente
        WindowManager.restaurarJanelas();

        WindowManager.tornarArrastavel(document.getElementById("debug-window"));

        // 5. Configurações de Acessibilidade e Foco (DENTRO do init para garantir o DOM)
        this.configurarAcessibilidade();

        // 6. Atalhos de Teclado Globais
        this.configurarAtalhosTeclado();
    },

    configurarAcessibilidade() {
        // Tornar ícones e botões navegáveis por teclado (Tab)
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

        // Trazer a janela para frente automaticamente ao receber o foco (via Tab)
        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            win.addEventListener('focusin', () => {
                WindowManager.trazerParaFrente(win.id);
            });
        });
    },

    configurarAtalhosTeclado() {
        document.addEventListener('keydown', (e) => {
            // Tecla Windows (Meta) -> Abre/Fecha o Menu Iniciar
            if (e.key === 'Meta') {
                e.preventDefault();
                window.toggleStartMenu();
            }

            // Tecla Esc -> Fecha a janela que está no topo
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

            // Ctrl + Espaço -> Ciclar entre janelas
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

// EXCLUSIVO BOOTSTRAP DA APLICAÇÃO
document.addEventListener("DOMContentLoaded", () => App.init());

// ==========================================
// FUNÇÕES GLOBAIS DE JANELA E UI
// ==========================================
window.abrirJanela = (id) => WindowManager.abrir(id);
window.fecharJanela = (id) => WindowManager.fechar(id);
window.minimizarJanela = (id) => WindowManager.minimizar(id);
window.maximizarJanela = (id) => WindowManager.maximizar(id);
window.trazerParaFrente = (id) => WindowManager.trazerParaFrente(id);

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

window.mudarPapelDeParede = (url) => {
    Storage.salvarWallpaper(url);
};

window.toggleAltoContraste = () => {
    Storage.toggleHighContrast();
};

window.limparNotepad = () => {
    const ta = document.getElementById("notepad-textarea");
    if (ta) ta.value = "";
};

window.abrirLixeira = () => {
    const imgLixeira = document.querySelector('#icon-lixeira .icon-trash');
    if (imgLixeira && imgLixeira.classList.contains('full')) {
        UI.mostrarAlerta("Arquivos confidenciais destruídos. Não há como restaurá-los.", "Lixeira (Cheia)");
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
    
    if(loginScreen) {
        loginScreen.style.transition = "opacity 1.5s ease";
        loginScreen.style.opacity = "0";
    }

    if (window.AudioManager) {
        AudioManager.play('startup');
        AudioManager.iniciarAmbiente();
    }

    setTimeout(() => {
        if(loginScreen) loginScreen.classList.add('hidden');
        GameState.iniciarNoite();
        WindowManager.abrir('tutorial-note');
    }, 1500);
};

// ==========================================
// EVENT DELEGATION (Substitui os onclick inline)
// ==========================================
document.addEventListener('dblclick', (e) => {
    const trigger = e.target.closest('[data-action="open-window"]');
    if (trigger) {
        const targetId = trigger.getAttribute('data-target');
        WindowManager.abrir(targetId);
    }
});

document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-action="close-window"]');
    if (closeBtn) {
        WindowManager.fechar(closeBtn.getAttribute('data-target'));
    }

    const minBtn = e.target.closest('[data-action="min-window"]');
    if (minBtn) {
        WindowManager.minimizar(minBtn.getAttribute('data-target'));
    }
});

// ==========================================
// DRAG & DROP: Explorador de Arquivos -> Bloco de Notas
// ==========================================
document.addEventListener('dragstart', (e) => {
    // Quando começa a arrastar, guarda o texto e o título na "mochila" do evento
    const dragItem = e.target.closest('.draggable-file');
    if (dragItem) {
        e.dataTransfer.setData('text/plain', dragItem.getAttribute('data-content'));
        e.dataTransfer.setData('application/filename', dragItem.getAttribute('data-filename'));
        e.dataTransfer.effectAllowed = 'copy';
    }
});

// A área de texto do Bloco de Notas precisa permitir que coisas sejam soltas nela
const notepadTextarea = document.getElementById('notepad-textarea');
if (notepadTextarea) {
    
    // Previne o comportamento padrão (que é proibir soltar coisas)
    notepadTextarea.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'copy';
        notepadTextarea.style.background = '#e5f1fb'; // Muda a cor pra dar feedback visual
    });

    notepadTextarea.addEventListener('dragleave', (e) => {
        notepadTextarea.style.background = 'white'; // Restaura a cor
    });

    // Quando o arquivo é solto no Bloco de Notas
    notepadTextarea.addEventListener('drop', (e) => {
        e.preventDefault();
        notepadTextarea.style.background = 'white';
        
        // Puxa o texto da "mochila"
        const conteudo = e.dataTransfer.getData('text/plain');
        const nomeArquivo = e.dataTransfer.getData('application/filename');
        
        if (conteudo) {
            notepadTextarea.value = conteudo;
            
            // Atualiza o título da janela do Bloco de Notas
            const notepadWin = document.getElementById('notepad-window');
            if (notepadWin) {
                const titleEl = notepadWin.querySelector('.window-title');
                if (titleEl) titleEl.innerText = `${nomeArquivo} - Bloco de Notas`;
            }
            
            // Toca som de sucesso (opcional)
            if (window.AudioManager) AudioManager.play('click');
        }
    });
}