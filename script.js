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
// GERENCIADOR DE JANELAS E Z-INDEX
// ==========================================
let zIndexCounter = 10;

function abrirJanela(id) {
    document.getElementById(id).classList.remove('hidden');
    trazerParaFrente(id);
}

function fecharJanela(id) {
    document.getElementById(id).classList.add('hidden');
}

function trazerParaFrente(id) {
    zIndexCounter++;
    document.getElementById(id).style.zIndex = zIndexCounter;
}


document.addEventListener("DOMContentLoaded", () => {
    const notepad = document.getElementById("notepad-window");
    if (notepad) tornarArrastavel(notepad);

    
    const camera = document.getElementById("camera-window");
    if (camera) tornarArrastavel(camera);

    const iconNotepad = document.getElementById("icon-notepad");
    if (iconNotepad) tornarArrastavel(iconNotepad);

    const iconCameras = document.getElementById("icon-cameras");
    if (iconCameras) tornarArrastavel(iconCameras);

});

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