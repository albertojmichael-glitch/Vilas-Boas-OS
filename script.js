// ==========================================
// TELA DE BOOT (CARREGAMENTO)
// ==========================================
window.addEventListener('load', () => {
    // Simula um tempo de carregamento do sistema operacional (3.5 segundos)
    setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');
        
        // Aplica o fade out
        bootScreen.style.opacity = '0';
        
        // Remove a tela preta do HTML após o fade terminar (1 segundo depois)
        setTimeout(() => {
            bootScreen.remove();
        }, 1000);
        
    }, 3500); 
});

// ==========================================
// RELÓGIO DA BARRA DE TAREFAS
// ==========================================
function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    clockElement.textContent = `${hours}:${minutes} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000);

// ==========================================
// GERENCIADOR DE JANELAS E BARRA DE TAREFAS
// ==========================================
let zIndexCounter = 10;

// Mapeia qual ícone pertence a qual janela
const windowIcons = {
    'notepad-window': 'icon-txt',
    'camera-window': 'icon-exe',
    'cat-window': 'icon-cat',
    'arquivos-window': 'icon-folder',
    'rede-window': 'icon-network'
};

function abrirJanela(id) {
    const win = document.getElementById(id);
    win.classList.remove('hidden');
    trazerParaFrente(id);
    
    // Verifica se a aba já existe na barra de tarefas
    let taskbarItem = document.getElementById('taskbar-' + id);
    
    // Se não existir, cria uma aba nova
    if (!taskbarItem) {
        const openWindowsDiv = document.getElementById('open-windows');
        
        // Pega o título da janela (ex: "Cat Helper v1.2")
        const titleText = win.querySelector('.window-title').innerText;
        
        // Descobre qual é a classe do ícone correto
        const iconClass = windowIcons[id] || 'icon-txt'; 

        // Cria o botão em HTML
        taskbarItem = document.createElement('div');
        taskbarItem.id = 'taskbar-' + id;
        taskbarItem.className = 'taskbar-item active';
        taskbarItem.innerHTML = `<div class="icon-img ${iconClass}"></div> <span>${titleText}</span>`;
        
        // Adiciona a função de clique na aba (minimizar/restaurar)
        taskbarItem.onclick = () => alternarMinimizar(id);
        
        openWindowsDiv.appendChild(taskbarItem);
    }
}

function fecharJanela(id) {
    // Esconde a janela
    document.getElementById(id).classList.add('hidden');
    
    // Remove a aba da barra de tarefas e destrói o botão
    const taskbarItem = document.getElementById('taskbar-' + id);
    if (taskbarItem) {
        taskbarItem.remove();
    }
}

function alternarMinimizar(id) {
    const win = document.getElementById(id);
    
    if (win.classList.contains('hidden')) {
        // Se estava escondida (minimizada), traz de volta pra tela
        win.classList.remove('hidden');
        trazerParaFrente(id);
    } else {
        // Se já está na tela, precisamos saber se ela é a janela do topo
        if (win.style.zIndex == zIndexCounter) {
            // Se ela já está por cima de tudo, nós minimizamos
            win.classList.add('hidden');
            atualizarAbasAtivas(null); // Tira o brilho do botão
        } else {
            // Se ela está atrás de outra janela, nós trazemos ela pra frente
            trazerParaFrente(id);
        }
    }
}

function trazerParaFrente(id) {
    zIndexCounter++;
    const win = document.getElementById(id);
    if (win) {
        win.style.zIndex = zIndexCounter;
        atualizarAbasAtivas(id); // Dá o brilho no botão da barra de tarefas
    }
}

function atualizarAbasAtivas(idAtivo) {
    const items = document.querySelectorAll('.taskbar-item');
    items.forEach(item => {
        if (item.id === 'taskbar-' + idAtivo) {
            item.classList.add('active'); // Acende a aba
        } else {
            item.classList.remove('active'); // Apaga as outras
        }
    });
}

// ==========================================
// INICIALIZAÇÃO E EVENTOS AO CARREGAR A TELA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Física das Janelas e Ícones
    const notepad = document.getElementById("notepad-window");
    if (notepad) tornarArrastavel(notepad);

    const camera = document.getElementById("camera-window");
    if (camera) tornarArrastavel(camera);

    const iconNotepad = document.getElementById("icon-notepad");
    if (iconNotepad) tornarArrastavel(iconNotepad);

    const iconCameras = document.getElementById("icon-cameras");
    if (iconCameras) tornarArrastavel(iconCameras);

    const catWindow = document.getElementById("cat-window");
    if (catWindow) tornarArrastavel(catWindow);
    const iconCat = document.getElementById("icon-cat");
    if (iconCat) tornarArrastavel(iconCat);

    const arquivosWindow = document.getElementById("arquivos-window");
    if (arquivosWindow) tornarArrastavel(arquivosWindow);
    const iconArquivos = document.getElementById("icon-arquivos");
    if (iconArquivos) tornarArrastavel(iconArquivos);

    const redeWindow = document.getElementById("rede-window");
    if (redeWindow) tornarArrastavel(redeWindow);
    const iconRede = document.getElementById("icon-rede");
    if (iconRede) tornarArrastavel(iconRede);

    // 2. Eventos do Menu Iniciar
    const startOrb = document.getElementById('start-orb');
    if (startOrb) {
        startOrb.onclick = (e) => {
            e.stopPropagation(); // Impede que o clique chegue no desktop
            toggleStartMenu();
        };
    }
});

// ==========================================
// MENU INICIAR
// ==========================================
function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Fecha o menu se clicar no fundo (desktop)
const desktop = document.getElementById('desktop');
if (desktop) {
    desktop.addEventListener('mousedown', () => {
        const menu = document.getElementById('start-menu');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    });
}

// ==========================================
// FÍSICA DE ARRASTAR
// ==========================================
function tornarArrastavel(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = elmnt.querySelector(".window-header");
    
    // Se tiver barra de título, clica nela para arrastar. Se não, arrasta por qualquer lugar.
    if (header) {
        header.onmousedown = arrastarMouseDown;
    } else {
        elmnt.onmousedown = arrastarMouseDown;
    }

    function arrastarMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // Pega a posição inicial do mouse
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = fecharArrastar;
        // Chama a função toda vez que o mouse se mover
        document.onmousemove = arrastarElemento;
        trazerParaFrente(elmnt.id);
    }

    function arrastarElemento(e) {
        e = e || window.event;
        e.preventDefault();
        // Calcula a nova posição
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // Define a nova posição da janela no CSS
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function fecharArrastar() {
        // Para de arrastar quando soltar o botão do mouse
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// ==========================================
// SISTEMA DE LORE: ABRIR TEXTOS DINÂMICOS
// ==========================================
function abrirTexto(titulo, conteudo) {
    const notepad = document.getElementById('notepad-window');
    
    // Altera o título da janela
    notepad.querySelector('.window-title').innerText = titulo + ' - Bloco de Notas';
    
    // Insere o texto da história no textarea
    notepad.querySelector('textarea').value = conteudo;
    
    // Abre a janela usando o sistema que já criamos
    abrirJanela('notepad-window');
}

// ==========================================
// EVENTO: GLITCH DO CAT HELPER (NOITE 1)
// ==========================================
function glitchCatHelper() {
    const catAvatar = document.getElementById('cat-avatar-img');
    const catHat = document.getElementById('cat-hat');
    const catTextContainer = document.getElementById('cat-text');
    
    // Aplica o visual macabro
    catAvatar.classList.add('glitched');
    catHat.classList.add('glitched-hat');
    catTextContainer.classList.add('glitched-text');
    
    // Troca o texto para a mensagem criptografada
    catTextContainer.innerHTML = `
        <p style="font-weight: bold;">Se ver alguém... [ERRO]</p>
        <p style="animation: text-blink 0.5s infinite;">Apenas para invitados.</p>
        <p>Acesso de Manutenção Requerido.</p>
    `;
    
    // Simula a janela fechando sozinha após 4 segundos
    setTimeout(() => {
        fecharJanela('cat-window');
        
        // Restaura o gato para o normal para a próxima vez que abrir
        setTimeout(() => {
            catAvatar.classList.remove('glitched');
            catHat.classList.remove('glitched-hat');
            catTextContainer.classList.remove('glitched-text');
            catTextContainer.innerHTML = `
                <p><strong>Miau! Sistema recuperado.</strong></p>
                <p>Onde estávamos? Ah, a ventilação! Mantenha a sala em 20°C para não ter alucinações. Miau!</p>
            `;
        }, 1000);
        
    }, 4000);
}