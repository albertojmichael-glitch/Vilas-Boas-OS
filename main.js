import { Storage } from './storage.js';
import { WindowManager } from './windowManager.js';
import { UI } from './ui.js';
import { GameState } from './gameState.js';
import { Cameras } from './cameras.js';

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

        document.addEventListener('keydown', (e) => {
            // Tecla Windows (Meta) -> Abre/Fecha o Menu Iniciar
            if (e.key === 'Meta') {
                e.preventDefault();
                window.toggleStartMenu();
            }

            // Tecla Esc -> Fecha a janela que está no topo
            if (e.key === 'Escape') {
                // Pega todas as janelas que não estão escondidas
                const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
                if (openWindows.length > 0) {
                    // Encontra a janela com o maior z-index
                    const topmost = openWindows.reduce((highest, win) => {
                        return (parseInt(win.style.zIndex) || 0) > (parseInt(highest.style.zIndex) || 0) ? win : highest;
                    });
                    WindowManager.fechar(topmost.id);
                }
            }

            // Ctrl + Espaço -> Ciclar entre janelas (Substituto do Alt+Tab)
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                const openWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
                if (openWindows.length > 1) {
                    // Pega a janela com o menor z-index (a que está mais no fundo) e joga pra frente
                    const lowest = openWindows.reduce((lowestWin, win) => {
                        return (parseInt(win.style.zIndex) || 0) < (parseInt(lowestWin.style.zIndex) || 0) ? win : lowestWin;
                    });
                    WindowManager.trazerParaFrente(lowest.id);
                }
            }
        });
    }
};

// EXCLUSIVO BOOTSTRAP DA APLICAÇÃO (Apenas 1 Event Listener no app inteiro!)
document.addEventListener("DOMContentLoaded", () => App.init());



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

// ==========================================
// ACESSIBILIDADE E GERENCIAMENTO DE FOCO
// ==========================================
        
// 1. Tornar ícones e botões navegáveis por teclado (Tab)
const elementosClicaveis = document.querySelectorAll('.desktop-icon, .taskbar-item, .win-btn, .cam-btn, .start-item, .right-item');
        
elementosClicaveis.forEach(el => {
    // Adiciona o tabindex para permitir o foco pelo teclado
    if (!el.hasAttribute('tabindex')) {
         el.setAttribute('tabindex', '0');
     }
            
    // Permite ativar o elemento com Enter ou Espaço
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Se tiver evento de clique duplo (ex: ícones do desktop), dispara ele
        if (el.ondblclick) {
            el.ondblclick();
        } else {
            el.click();
            }
        }
    });
});

        // 2. Trazer a janela para frente automaticamente ao receber o foco (via Tab)
        const windows = document.querySelectorAll('.window');
        windows.forEach(win => {
            // focusin dispara sempre que qualquer elemento DENTRO da janela recebe foco
            win.addEventListener('focusin', () => {
                WindowManager.trazerParaFrente(win.id);
            })
        });


document.addEventListener("DOMContentLoaded", () => App.init());

window.iniciarJogo = () => {
    const startScreen = document.getElementById('start-screen');
    if(startScreen) {
        startScreen.classList.add('hidden'); 
    }
    GameState.iniciarNoite(); 
}

window.toggleStartMenu = () => {
    const menu = document.getElementById('start-menu');
    if (menu) menu.classList.toggle('hidden');
};


// ==========================================
// EVENT DELEGATION (Substitui os onclick inline)
// ==========================================
document.addEventListener('dblclick', (e) => {
    // Procura se o clique duplo aconteceu dentro de algum elemento que tenha data-action="open-window"
    const trigger = e.target.closest('[data-action="open-window"]');
    if (trigger) {
        const targetId = trigger.getAttribute('data-target');
        WindowManager.abrir(targetId);
    }
});

document.addEventListener('click', (e) => {
    // Botoes de Fechar Janela
    const closeBtn = e.target.closest('[data-action="close-window"]');
    if (closeBtn) {
        WindowManager.fechar(closeBtn.getAttribute('data-target'));
    }

    // Botoes de Minimizar Janela
    const minBtn = e.target.closest('[data-action="min-window"]');
    if (minBtn) {
        WindowManager.minimizar(minBtn.getAttribute('data-target'));
    }
});
