import { Storage } from './storage.js';
import { GameState } from './gameState.js';

export const WindowManager = {
    zIndexCounter: 10,
    // 1. Cria o canal de comunicação para múltiplos monitores
    canalMonitores: new BroadcastChannel('vilasboas_os_network'),
    
    windowIcons: {
        'notepad-window': 'icon-txt',
        'camera-window': 'icon-exe',
        'cat-window': 'icon-cat',
        'arquivos-window': 'icon-folder',
        'rede-window': 'icon-network',
        'computador-window': 'icon-computer'
    },

    initRede() {
        // Escuta se alguma janela foi enviada de outra aba (Monitor 2)
        this.canalMonitores.onmessage = (evento) => {
            if (evento.data.tipo === 'TRANSFERIR_JANELA') {
                this.abrir(evento.data.id);
                const win = document.getElementById(evento.data.id);
                if (win) {
                    win.style.left = '10px'; // Aparece no canto esquerdo da nova tela
                    win.style.top = evento.data.novoY + 'px';
                }
            }
        };
    },

    abrir(id) {
        const win = document.getElementById(id);
        if (!win) return console.warn(`[WindowManager] Janela ${id} não encontrada.`);
        
        win.classList.remove('hidden');
        this.trazerParaFrente(id);
        
        this.criarAbaTaskbar(id, win);

        if (id === 'camera-window' && window.GameState) {
            GameState.setCameraAberta(true);
        }
    },

    fechar(id) {
        const win = document.getElementById(id);
        if (!win) return;
        
        win.classList.add('hidden');
        win.classList.remove('maximized');
        
        const taskbarItem = document.getElementById('taskbar-' + id);
        if (taskbarItem) taskbarItem.remove();

        if (id === 'camera-window' && window.GameState) {
            GameState.setCameraAberta(false);
        }
    },

    restaurarJanelas() {
        const state = Storage.carregarEstadoJanelas();
        
        Object.keys(state).forEach(id => {
            const win = document.getElementById(id);
            if (win) {
                if (state[id].top !== undefined) win.style.top = state[id].top;
                if (state[id].left !== undefined) win.style.left = state[id].left;
                
                if (state[id].isOpen) {
                    this.abrir(id);
                }
            }
        });
    },

    maximizar(id) {
        const win = document.getElementById(id);
        if (win) {
            // Adiciona a classe que ativa a transição suave de tamanho
            win.classList.add('animating-size');
            
            win.classList.toggle('maximized');
            this.trazerParaFrente(id);

            // Remove a classe de animação após terminar, para não travar o arraste (Drag)
            setTimeout(() => {
                win.classList.remove('animating-size');
            }, 300);
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
                        <!-- O conteúdo real será injetado aqui -->
                    </div>
                </div>
            `;
            
            taskbarItem.onclick = () => this.alternarMinimizar(id);
            
            // 2. MÁGICA DO LIVE THUMBNAIL: Atualiza a miniatura toda vez que o mouse passar por cima!
            taskbarItem.addEventListener('mouseenter', () => {
                const thumbContainer = taskbarItem.querySelector('.preview-thumbnail');
                this.atualizarPreviewReal(id, thumbContainer);
            });

            openWindowsDiv.appendChild(taskbarItem);
        }
    },

    atualizarPreviewReal(idJanela, previewThumbnailElement) {
        const janelaOriginal = document.getElementById(idJanela);
        if (!janelaOriginal) return;

        // Limpa o preview antigo
        previewThumbnailElement.innerHTML = '';
        
        // Faz uma cópia visual do HTML da janela
        const clone = janelaOriginal.cloneNode(true);
        clone.removeAttribute('id'); // Remove ID para evitar duplicatas no DOM
        
        // Aplica o redimensionamento usando placa de vídeo (scale)
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.transformOrigin = 'top left';
        
        const escala = previewThumbnailElement.offsetWidth / janelaOriginal.offsetWidth;
        clone.style.transform = `scale(${escala})`;
        clone.style.pointerEvents = 'none'; // Evita que o usuário clique nos botões da miniatura
        
        previewThumbnailElement.appendChild(clone);
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
        
        target.addEventListener('mousedown', dragStart);
        target.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.type === 'touchstart') {
                pos3 = e.touches[0].clientX;
                pos4 = e.touches[0].clientY;
            } else {
                e.preventDefault(); 
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

            if (newTop < 0) newTop = 0;
            if (newTop > window.innerHeight - 70) newTop = window.innerHeight - 70;

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

            // 3. MÁGICA DOS MÚLTIPLOS MONITORES: 
            // Se o usuário arrastar a janela para o canto direito da tela (> 90% da largura)
            if (elmnt.classList.contains('window') && elmnt.offsetLeft > window.innerWidth - 80) {
                
                // Envia a janela para o monitor secundário via rádio
                WindowManager.canalMonitores.postMessage({
                    tipo: 'TRANSFERIR_JANELA',
                    id: elmnt.id,
                    novoY: elmnt.offsetTop
                });
                
                // Esconde a janela desta tela
                WindowManager.fechar(elmnt.id);
                
            } else if (elmnt.classList.contains('window')) {
                Storage.salvarEstadoJanela(elmnt.id, elmnt.style.top, elmnt.style.left, true);
            }

            if (uiCallbacks && uiCallbacks.onDragEnd) uiCallbacks.onDragEnd(elmnt);
        }
    },    

    
    tornarRedimensionavel(elmnt) {
        if (!elmnt) return;

        // Injeta o HTML do puxador dinamicamente
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        elmnt.appendChild(handle);

        let originalWidth = 0;
        let originalHeight = 0;
        let originalMouseX = 0;
        let originalMouseY = 0;
        let rafId = null;

        const startResize = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evita que o evento vaze e inicie um Drag sem querer

            originalWidth = elmnt.offsetWidth;
            originalHeight = elmnt.offsetHeight;
            
            // Suporte para touch e mouse
            originalMouseX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            originalMouseY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchmove', resize, { passive: false });
            document.addEventListener('touchend', stopResize);
            
            this.trazerParaFrente(elmnt.id);
        };

        const resize = (e) => {
            e.preventDefault();
            
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            if (rafId) cancelAnimationFrame(rafId);
            
            rafId = requestAnimationFrame(() => {
                const width = originalWidth + (clientX - originalMouseX);
                const height = originalHeight + (clientY - originalMouseY);
                
                // Clamping: Limites mínimos de tamanho da janela
                if (width > 300) elmnt.style.width = width + 'px';
                if (height > 200) elmnt.style.height = height + 'px';
            });
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', resize);
            document.removeEventListener('touchend', stopResize);
            if (rafId) cancelAnimationFrame(rafId);
        };

        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize, { passive: false });
    }
};