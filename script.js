// ==========================================
// TELA DE BOOT (CARREGAMENTO)
// ==========================================
window.addEventListener('load', () => {
    
    setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');
        
        
        bootScreen.style.opacity = '0';
        
        
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
// GERENCIADOR DE JANELAS (MINIMIZAR/MAXIMIZAR)
// ==========================================
let zIndexCounter = 10;

const windowIcons = {
    'notepad-window': 'icon-txt',
    'camera-window': 'icon-exe',
    'cat-window': 'icon-cat',
    'arquivos-window': 'icon-folder',
    'rede-window': 'icon-network',
    'computador-window': 'icon-computer'
};

function abrirJanela(id) {
    const win = document.getElementById(id);
    if (!win) return;
    
    win.classList.remove('hidden');
    trazerParaFrente(id);
    
    let taskbarItem = document.getElementById('taskbar-' + id);
    if (!taskbarItem) {
        const openWindowsDiv = document.getElementById('open-windows');
        const titleText = win.querySelector('.window-title').innerText;
        const iconClass = windowIcons[id] || 'icon-txt'; 

        taskbarItem = document.createElement('div');
        taskbarItem.id = 'taskbar-' + id;
        taskbarItem.className = 'taskbar-item active';
        taskbarItem.innerHTML = `<div class="icon-img ${iconClass}"></div> <span>${titleText}</span>`;
        
        taskbarItem.onclick = () => alternarMinimizar(id);
        openWindowsDiv.appendChild(taskbarItem);
    }
}

// FUNÇÃO: MINIMIZAR JANELA
function minimizarJanela(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.add('hidden');
        atualizarAbasAtivas(null);
    }
}

// FUNÇÃO: MAXIMIZAR / RESTAURAR JANELA
function maximizarJanela(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.toggle('maximized');
        trazerParaFrente(id);
    }
}

// FUNÇÃO: FECHAR JANELA
function fecharJanela(id) {
    const win = document.getElementById(id);
    if (win) {
        win.classList.add('hidden');
        win.classList.remove('maximized'); // Reseta a tela cheia ao fechar
        
        const taskbarItem = document.getElementById('taskbar-' + id);
        if (taskbarItem) taskbarItem.remove();
    }
}

function alternarMinimizar(id) {
    const win = document.getElementById(id);
    if (win.classList.contains('hidden')) {
        win.classList.remove('hidden');
        trazerParaFrente(id);
    } else {
        if (win.style.zIndex == zIndexCounter) {
            win.classList.add('hidden');
            atualizarAbasAtivas(null);
        } else {
            trazerParaFrente(id);
        }
    }
}

function trazerParaFrente(id) {
    zIndexCounter++;
    const win = document.getElementById(id);
    if (win) {
        win.style.zIndex = zIndexCounter;
        atualizarAbasAtivas(id);
    }
}

function atualizarAbasAtivas(idAtivo) {
    const items = document.querySelectorAll('.taskbar-item');
    items.forEach(item => {
        if (item.id === 'taskbar-' + idAtivo) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ==========================================
// INICIALIZAÇÃO E EVENTOS AO CARREGAR A TELA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
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

    const computadorWindow = document.getElementById("computador-window");
    if (computadorWindow) tornarArrastavel(computadorWindow);

    
    const startOrb = document.getElementById('start-orb');
    if (startOrb) {
        startOrb.onclick = (e) => {
            e.stopPropagation(); 
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
    
    
    if (header) {
        header.onmousedown = arrastarMouseDown;
    } else {
        elmnt.onmousedown = arrastarMouseDown;
    }

    function arrastarMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = fecharArrastar;
        
        document.onmousemove = arrastarElemento;
        trazerParaFrente(elmnt.id);
    }

    function arrastarElemento(e) {
        e = e || window.event;
        e.preventDefault();
        
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function fecharArrastar() {
        
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// ==========================================
// SISTEMA DE LORE: ABRIR TEXTOS DINÂMICOS
// ==========================================
function abrirTexto(titulo, conteudo) {
    const notepad = document.getElementById('notepad-window');
    
    
    notepad.querySelector('.window-title').innerText = titulo + ' - Bloco de Notas';
    
    
    notepad.querySelector('textarea').value = conteudo;
    
    
    abrirJanela('notepad-window');
}

// ==========================================
// EVENTO: GLITCH DO CAT HELPER (NOITE 1)
// ==========================================
function glitchCatHelper() {
    const catAvatar = document.getElementById('cat-avatar-img');
    const catHat = document.getElementById('cat-hat');
    const catTextContainer = document.getElementById('cat-text');
    
    
    catAvatar.classList.add('glitched');
    catHat.classList.add('glitched-hat');
    catTextContainer.classList.add('glitched-text');
    
    
    catTextContainer.innerHTML = `
        <p style="font-weight: bold;">Se ver alguém... [ERRO]</p>
        <p style="animation: text-blink 0.5s infinite;">Apenas para invitados.</p>
        <p>Acesso de Manutenção Requerido.</p>
    `;
    
    
    setTimeout(() => {
        fecharJanela('cat-window');
        
        
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

