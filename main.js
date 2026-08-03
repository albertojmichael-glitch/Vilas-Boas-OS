import { Storage } from './storage.js';
import { WindowManager } from './windowManager.js';
import { UI } from './ui.js';
import { GameState } from './gameState.js';


const App = {
    init() {
        console.log("Inicializando Vilas Boas OS...");
        
        // 1. Inicializa o Storage
        Storage.init();
        const textarea = document.getElementById("notepad-textarea");
        Storage.carregarNotepad(textarea);

        // 2. Aplica a física
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

        // 3. Inicia a Lógica do Jogo (NightManager)
        GameState.iniciarNoite(); // <- NOVA LINHA
    }
};



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


document.addEventListener("DOMContentLoaded", () => App.init());