import { Storage } from './storage.js'; 


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

    restaurarJanelas() {
        const state = Storage.carregarEstadoJanelas();
        
        Object.keys(state).forEach(id => {
            const win = document.getElementById(id);
            if (win) {
                // Restaura posição
                if (state[id].top !== undefined) win.style.top = state[id].top;
                if (state[id].left !== undefined) win.style.left = state[id].left;
                
                // Restaura se estava aberta
                if (state[id].isOpen) {
                    this.abrir(id);
                }
            }
        });
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
            
            // Nova estrutura rica com Hover Preview embutido
            taskbarItem.innerHTML = `
                <div class="item-content">
                    <div class="icon-img ${iconClass}"></div> 
                    <span>${titleText}</span>
                </div>
                <div class="taskbar-preview">
                    <div class="preview-header">
                        <div class="icon-img ${iconClass}" style="width: 12px; height: 12px; margin: 0; box-shadow: none;"></div>
                        <span class="preview-title">${titleText}</span>
                    </div>
                    <div class="preview-thumbnail">
                        <div class="icon-img ${iconClass}" style="width: 32px; height: 32px; opacity: 0.2; box-shadow: none;"></div>
                    </div>
                </div>
            `;
            
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
        let rafId = null;

        const header = elmnt.querySelector('.window-header');
        const target = header ? header : elmnt;
        
        // Unifica os eventos de Mouse e Toque (Mobile)
        target.addEventListener('mousedown', dragStart);
        target.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            // Se for toque de tela, pega a coordenada do primeiro dedo
            if (e.type === 'touchstart') {
                pos3 = e.touches[0].clientX;
                pos4 = e.touches[0].clientY;
            } else {
                e.preventDefault(); // Previne seleção de texto no mouse
                pos3 = e.clientX;
                pos4 = e.clientY;
            }

            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchend', dragEnd);
            document.addEventListener('touchmove', drag, { passive: false });
            
            if (elmnt.classList.contains('window')) {
                WindowManager.trazerParaFrente(elmnt.id);
            }
        }

        function drag(e) {
            e.preventDefault();
            
            let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;

            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            // Clamping (evita sumir com a janela)
            if (newTop < 0) newTop = 0;
            if (newTop > window.innerHeight - 70) newTop = window.innerHeight - 70;

            // Aceleração de GPU e Throttle via RAF
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                elmnt.style.top = newTop + "px";
                elmnt.style.left = newLeft + "px";
            });
        }

        function dragEnd() {
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchend', dragEnd);
            document.removeEventListener('touchmove', drag);
            
            if (rafId) cancelAnimationFrame(rafId);

            if (elmnt.classList.contains('window')) {
                Storage.salvarEstadoJanela(elmnt.id, elmnt.style.top, elmnt.style.left, true);
            }

            if (uiCallbacks && uiCallbacks.onDragEnd) uiCallbacks.onDragEnd(elmnt);
        }
    }
    
};