// windowManager.js
export const WindowManager = {
    zIndexCounter: 10,
    windowIcons: {
        'notepad-window': 'icon-txt',
        'camera-window': 'icon-exe',
        'cat-window': 'icon-cat',
        'arquivos-window': 'icon-folder',
        'rede-window': 'icon-network',
        'computador-window': 'icon-computer'
    },

    abrir(id) {
        const win = document.getElementById(id);
        if (!win) return console.warn(`[WindowManager] Janela ${id} não encontrada.`);
        
        win.classList.remove('hidden');
        this.trazerParaFrente(id);
        
        this.criarAbaTaskbar(id, win);
    },

    fechar(id) {
        const win = document.getElementById(id);
        if (!win) return;
        
        win.classList.add('hidden');
        win.classList.remove('maximized');
        
        const taskbarItem = document.getElementById('taskbar-' + id);
        if (taskbarItem) taskbarItem.remove();
    },

    minimizar(id) {
        const win = document.getElementById(id);
        if (win) {
            win.classList.add('hidden');
            this.atualizarAbasAtivas(null);
        }
    },

    maximizar(id) {
        const win = document.getElementById(id);
        if (win) {
            win.classList.toggle('maximized');
            this.trazerParaFrente(id);
        }
    },

    alternarMinimizar(id) {
        const win = document.getElementById(id);
        if (!win) return;

        if (win.classList.contains('hidden')) {
            win.classList.remove('hidden');
            this.trazerParaFrente(id);
        } else {
           
            if (Number(win.style.zIndex) === this.zIndexCounter) {
                win.classList.add('hidden');
                this.atualizarAbasAtivas(null);
            } else {
                this.trazerParaFrente(id);
            }
        }
    },

    trazerParaFrente(id) {
        const win = document.getElementById(id);
        if (win) {
            this.zIndexCounter++;
            win.style.zIndex = this.zIndexCounter;
            this.atualizarAbasAtivas(id);
        }
    },

    criarAbaTaskbar(id, win) {
        let taskbarItem = document.getElementById('taskbar-' + id);
        if (!taskbarItem) {
            const openWindowsDiv = document.getElementById('open-windows');
            if (!openWindowsDiv) return;

            const titleEl = win.querySelector('.window-title');
            const titleText = titleEl ? titleEl.innerText : 'Programa';
            const iconClass = this.windowIcons[id] || 'icon-txt'; 

            taskbarItem = document.createElement('div');
            taskbarItem.id = 'taskbar-' + id;
            taskbarItem.className = 'taskbar-item active';
            taskbarItem.innerHTML = `<div class="icon-img ${iconClass}"></div> <span>${titleText}</span>`;
            
            taskbarItem.onclick = () => this.alternarMinimizar(id);
            openWindowsDiv.appendChild(taskbarItem);
        }
    },

    atualizarAbasAtivas(idAtivo) {
        document.querySelectorAll('.taskbar-item').forEach(item => {
            item.classList.toggle('active', item.id === 'taskbar-' + idAtivo);
        });
    },

    tornarArrastavel(elmnt, uiCallbacks) {
        if (!elmnt) return;
        
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = elmnt.querySelector('.window-header');
        
        const target = header ? header : elmnt;
        target.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // CORREÇÃO: Usando addEventListener ao invés de sobrescrever document.onmouseup
            document.addEventListener('mouseup', closeDragElement);
            document.addEventListener('mousemove', elementDrag);
            
            if (elmnt.classList.contains('window')) {
                WindowManager.trazerParaFrente(elmnt.id);
            }
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // CORREÇÃO: Removendo os listeners limpos sem sujar o resto da aplicação
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
            
            if (uiCallbacks && uiCallbacks.onDragEnd) {
                uiCallbacks.onDragEnd(elmnt);
            }
        }
    }
};