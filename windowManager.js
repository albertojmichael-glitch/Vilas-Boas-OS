// windowManager.js
import { Storage } from './storage.js';
import { GameState } from './gameState.js';
import { AudioManager } from './assets/sounds/audioManager.js';
import { I18n } from './i18nManager.js';

export const WindowManager = {
    zIndexCounter: 20,
    TASKBAR_HEIGHT: 40,
    janelaAtivaId: null,
    janelasSessaoAnterior: [],
    previewInterval: null,
    canalMonitores: new BroadcastChannel('vilasboas_os_network'),

    windowIcons: {
        'notepad-window': 'icon-txt',
        'camera-window': 'icon-exe',
        'cat-window': 'icon-cat',
        'arquivos-window': 'icon-folder',
        'rede-window': 'icon-network',
        'computador-window': 'icon-computer',
        'email-window': 'icon-email',
        'settings-window': 'icon-settings',
        'lixeira-window': 'icon-trash'
    },

    svgIcons: {
        min: `<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><rect x="2" y="8.5" width="8" height="1.8" rx="0.5" fill="currentColor"/></svg>`,
        max: `<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><rect x="2" y="2" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="2" y1="3.5" x2="10" y2="3.5" stroke="currentColor" stroke-width="1.6"/></svg>`,
        restore: `<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M4,4 L4,2 L10,2 L10,8 L8,8" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="4" width="6.5" height="6.5" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
        close: `<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2.5,2.5 L9.5,9.5 M9.5,2.5 L2.5,9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
    },

    initRede() {
        this.padronizarControlesJanelas();
        this.criarSnapPreviewElemento();

        this.canalMonitores.onmessage = (evento) => {
            if (evento.data && evento.data.tipo === 'TRANSFERIR_JANELA') {
                this.abrir(evento.data.id);
                const win = document.getElementById(evento.data.id);
                if (win) {
                    win.style.left = '20px';
                    win.style.top = Math.max(10, Math.min(window.innerHeight - 250, Number(evento.data.novoY) || 40)) + 'px';
                    this.restringirAoDesktop(win);
                }
            }
        };

        window.addEventListener('resize', () => {
            document.querySelectorAll('.window:not(.hidden)').forEach(win => {
                if (!win.classList.contains('maximized') && !win.classList.contains('snapped-left') && !win.classList.contains('snapped-right')) {
                    this.restringirAoDesktop(win);
                }
            });
            document.querySelectorAll('.desktop-icon').forEach(icon => {
                this.restringirIconeAoDesktop(icon);
            });
        });

        document.addEventListener('i18n:changed', () => {
            this.atualizarTitulosTaskbar();
            this.atualizarTooltipsControles();
        });
    },

    padronizarControlesJanelas() {
        document.querySelectorAll('.win-btn-min').forEach(btn => {
            btn.innerHTML = this.svgIcons.min;
        });
        document.querySelectorAll('.win-btn-max').forEach(btn => {
            btn.innerHTML = this.svgIcons.max;
        });
        document.querySelectorAll('.win-btn-close').forEach(btn => {
            btn.innerHTML = this.svgIcons.close;
        });
        this.atualizarTooltipsControles();

        // Duplo clique na barra de título maximiza/restaura janelas redimensionáveis
        document.querySelectorAll('.window').forEach(win => {
            const header = win.querySelector('.window-header');
            const maxBtn = win.querySelector('.win-btn-max');
            if (header && maxBtn) {
                header.addEventListener('dblclick', (e) => {
                    if (e.target.closest('.win-btn')) return;
                    this.maximizar(win.id);
                });
            }
        });
    },

    atualizarTooltipsControles() {
        document.querySelectorAll('.win-btn-min').forEach(btn => {
            btn.title = I18n.t('WIN_MINIMIZE');
            btn.setAttribute('aria-label', I18n.t('WIN_MINIMIZE'));
        });
        document.querySelectorAll('.win-btn-close').forEach(btn => {
            btn.title = I18n.t('WIN_CLOSE');
            btn.setAttribute('aria-label', I18n.t('WIN_CLOSE'));
        });
        document.querySelectorAll('.window').forEach(win => {
            this.atualizarBotaoMaximizar(win);
        });
    },

    atualizarBotaoMaximizar(win) {
        if (!win) return;
        const maxBtn = win.querySelector('.win-btn-max');
        if (!maxBtn) return;

        const isExpandida = win.classList.contains('maximized') ||
                            win.classList.contains('snapped-left') ||
                            win.classList.contains('snapped-right');

        maxBtn.innerHTML = isExpandida ? this.svgIcons.restore : this.svgIcons.max;
        const label = isExpandida ? I18n.t('WIN_RESTORE') : I18n.t('WIN_MAXIMIZE');
        maxBtn.title = label;
        maxBtn.setAttribute('aria-label', label);
    },

    criarSnapPreviewElemento() {
        if (document.getElementById('aero-snap-preview')) return;
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const snapEl = document.createElement('div');
        snapEl.id = 'aero-snap-preview';
        snapEl.className = 'aero-snap-preview hidden';
        desktop.appendChild(snapEl);
    },

    mostrarSnapPreview(modo) {
        const snapEl = document.getElementById('aero-snap-preview');
        if (!snapEl) return;

        if (!modo) {
            snapEl.className = 'aero-snap-preview hidden';
            return;
        }

        snapEl.className = `aero-snap-preview snap-${modo}`;
    },

    ehJanelaGerenciada(id) {
        return id !== 'tutorial-note' && id !== 'custom-alert' && id !== 'debug-window' && id !== 'auth-modal';
    },

    abrir(id) {
        const win = document.getElementById(id);
        if (!win) return console.warn(`[WindowManager] Janela ${id} não encontrada.`);

        win.classList.remove('hidden', 'minimized');
        this.restringirAoDesktop(win);
        this.trazerParaFrente(id);

        if (this.ehJanelaGerenciada(id)) {
            this.criarAbaTaskbar(id, win);
            Storage.salvarEstadoJanela(id, win.style.top, win.style.left, true, win.style.width, win.style.height);
        }

        if (id === 'camera-window') {
            GameState.setCameraAberta(true);
        }

        AudioManager.play('click');
    },

    fechar(id) {
        const win = document.getElementById(id);
        if (!win) return;

        win.classList.add('hidden');
        win.classList.remove('minimized', 'maximized', 'snapped-left', 'snapped-right');
        this.atualizarBotaoMaximizar(win);

        const taskbarItem = document.getElementById('taskbar-' + id);
        if (taskbarItem) taskbarItem.remove();

        if (this.ehJanelaGerenciada(id)) {
            Storage.salvarEstadoJanela(id, win.style.top, win.style.left, false, win.style.width, win.style.height);
        }

        if (id === 'camera-window') {
            GameState.setCameraAberta(false);
        }

        if (this.janelaAtivaId === id) {
            this.janelaAtivaId = null;
            this.focarProximaJanelaAberta();
        }

        AudioManager.play('click');
    },

    focarProximaJanelaAberta() {
        const abertas = Array.from(document.querySelectorAll('.window:not(.hidden):not(.minimized)'))
            .filter(w => w.id !== 'tutorial-note');
        if (abertas.length > 0) {
            const topo = abertas.reduce((a, b) => ((parseInt(b.style.zIndex) || 0) > (parseInt(a.style.zIndex) || 0) ? b : a));
            this.janelaAtivaId = topo.id;
            this.atualizarAbasAtivas(topo.id);
        } else {
            this.atualizarAbasAtivas(null);
        }
    },

    restaurarJanelas() {
        const state = Storage.carregarEstadoJanelas();
        this.janelasSessaoAnterior = [];

        Object.keys(state).forEach(id => {
            const win = document.getElementById(id);
            if (win && this.ehJanelaGerenciada(id)) {
                if (state[id].top) win.style.top = state[id].top;
                if (state[id].left) win.style.left = state[id].left;
                if (state[id].width) win.style.width = state[id].width;
                if (state[id].height) win.style.height = state[id].height;

                this.restringirAoDesktop(win);

                if (state[id].isOpen) {
                    if (Storage.isAutoRestoreWindows()) {
                        this.abrir(id);
                    } else {
                        this.janelasSessaoAnterior.push(id);
                    }
                }
            }
        });
    },

    reabrirSessaoAnterior() {
        this.janelasSessaoAnterior.forEach(id => this.abrir(id));
        this.janelasSessaoAnterior = [];
    },

    descartarSessaoAnterior() {
        this.janelasSessaoAnterior.forEach(id => {
            const win = document.getElementById(id);
            Storage.salvarEstadoJanela(id, win?.style.top, win?.style.left, false);
        });
        this.janelasSessaoAnterior = [];
    },

    salvarGeometriaAntesDeExpandir(win) {
        if (!win) return;
        const jaExpandida = win.classList.contains('maximized') ||
                            win.classList.contains('snapped-left') ||
                            win.classList.contains('snapped-right');
        if (!jaExpandida) {
            win.dataset.restoreTop = win.style.top || `${win.offsetTop}px`;
            win.dataset.restoreLeft = win.style.left || `${win.offsetLeft}px`;
            win.dataset.restoreWidth = win.style.width || `${win.offsetWidth}px`;
            win.dataset.restoreHeight = win.style.height || '';
        }
    },

    restaurarGeometria(win) {
        if (!win) return;
        win.classList.remove('maximized', 'snapped-left', 'snapped-right');

        if (win.dataset.restoreTop !== undefined) win.style.top = win.dataset.restoreTop;
        if (win.dataset.restoreLeft !== undefined) win.style.left = win.dataset.restoreLeft;
        if (win.dataset.restoreWidth !== undefined) win.style.width = win.dataset.restoreWidth;
        if (win.dataset.restoreHeight !== undefined) win.style.height = win.dataset.restoreHeight;

        this.restringirAoDesktop(win);
        this.atualizarBotaoMaximizar(win);
    },

    maximizar(id) {
        const win = document.getElementById(id);
        if (!win) return;

        win.classList.add('animating-size');
        const estaExpandida = win.classList.contains('maximized') ||
                              win.classList.contains('snapped-left') ||
                              win.classList.contains('snapped-right');

        if (estaExpandida) {
            this.restaurarGeometria(win);
        } else {
            this.salvarGeometriaAntesDeExpandir(win);
            win.classList.remove('snapped-left', 'snapped-right');
            win.classList.add('maximized');
            this.atualizarBotaoMaximizar(win);
        }

        this.trazerParaFrente(id);
        AudioManager.play('click');

        setTimeout(() => {
            win.classList.remove('animating-size');
        }, 280);
    },

    encaixarJanela(id, modo) {
        const win = document.getElementById(id);
        if (!win || !this.ehJanelaGerenciada(id)) return;

        win.classList.add('animating-size');

        if (modo === 'restore') {
            this.restaurarGeometria(win);
        } else if (modo === 'max') {
            this.salvarGeometriaAntesDeExpandir(win);
            win.classList.remove('snapped-left', 'snapped-right');
            win.classList.add('maximized');
        } else if (modo === 'left') {
            this.salvarGeometriaAntesDeExpandir(win);
            win.classList.remove('maximized', 'snapped-right');
            win.classList.add('snapped-left');
        } else if (modo === 'right') {
            this.salvarGeometriaAntesDeExpandir(win);
            win.classList.remove('maximized', 'snapped-left');
            win.classList.add('snapped-right');
        } else if (modo === 'center') {
            this.restaurarGeometria(win);
            const maxW = window.innerWidth;
            const maxH = window.innerHeight - this.TASKBAR_HEIGHT;
            win.style.left = `${Math.max(0, Math.round((maxW - win.offsetWidth) / 2))}px`;
            win.style.top = `${Math.max(0, Math.round((maxH - win.offsetHeight) / 2))}px`;
        }

        this.atualizarBotaoMaximizar(win);
        this.trazerParaFrente(id);

        setTimeout(() => {
            win.classList.remove('animating-size');
        }, 280);
    },

    minimizar(id) {
        this.alternarMinimizar(id);
    },

    alternarMinimizar(id) {
        const win = document.getElementById(id);
        if (!win) return;

        const estaMinimizada = win.classList.contains('minimized') || win.classList.contains('hidden');

        if (estaMinimizada) {
            win.classList.remove('hidden', 'minimized');
            this.restringirAoDesktop(win);
            this.trazerParaFrente(id);
            if (id === 'camera-window') GameState.setCameraAberta(true);
        } else {
            if (this.janelaAtivaId === id || Number(win.style.zIndex) === this.zIndexCounter) {
                win.classList.add('minimized');
                if (id === 'camera-window') GameState.setCameraAberta(false);
                this.focarProximaJanelaAberta();
            } else {
                this.trazerParaFrente(id);
            }
        }
        AudioManager.play('click');
    },

    trazerParaFrente(id) {
        const win = document.getElementById(id);
        if (win && !win.classList.contains('hidden') && !win.classList.contains('minimized')) {
            this.zIndexCounter++;
            win.style.zIndex = this.zIndexCounter;
            this.janelaAtivaId = id;
            this.atualizarAbasAtivas(id);

            document.querySelectorAll('.window').forEach(w => {
                w.classList.toggle('active-window', w.id === id);
            });
        }
    },

    restringirAoDesktop(win) {
        if (!win || !win.classList.contains('window')) return;
        if (win.id === 'custom-alert' || win.id === 'auth-modal') return;
        if (win.classList.contains('maximized') || win.classList.contains('snapped-left') || win.classList.contains('snapped-right')) {
            return;
        }

        const maxW = Math.max(300, window.innerWidth);
        const maxH = Math.max(220, window.innerHeight - this.TASKBAR_HEIGHT);

        let w = win.offsetWidth || 450;
        let h = win.offsetHeight || 340;

        if (w > maxW - 8) {
            w = maxW - 8;
            win.style.width = `${w}px`;
        }
        if (h > maxH - 8) {
            h = maxH - 8;
            win.style.height = `${h}px`;
        }

        let left = win.offsetLeft;
        let top = win.offsetTop;

        if (isNaN(left)) left = 40;
        if (isNaN(top)) top = 40;

        const maxLeft = Math.max(0, maxW - w);
        const maxTop = Math.max(0, maxH - h);

        left = Math.max(0, Math.min(maxLeft, left));
        top = Math.max(0, Math.min(maxTop, top));

        win.style.left = `${left}px`;
        win.style.top = `${top}px`;
    },

    restringirIconeAoDesktop(icon) {
        if (!icon) return;
        const maxW = window.innerWidth;
        const maxH = window.innerHeight - this.TASKBAR_HEIGHT;
        const w = icon.offsetWidth || 80;
        const h = icon.offsetHeight || 80;

        let left = Math.max(4, Math.min(maxW - w - 4, icon.offsetLeft));
        let top = Math.max(4, Math.min(maxH - h - 4, icon.offsetTop));

        icon.style.left = `${left}px`;
        icon.style.top = `${top}px`;
    },

    moverPorTeclado(id, dx, dy) {
        const win = document.getElementById(id || this.janelaAtivaId);
        if (!win || win.classList.contains('hidden') || win.classList.contains('minimized')) return;

        if (win.classList.contains('maximized') || win.classList.contains('snapped-left') || win.classList.contains('snapped-right')) {
            this.restaurarGeometria(win);
        }

        win.style.left = `${win.offsetLeft + dx}px`;
        win.style.top = `${win.offsetTop + dy}px`;
        this.restringirAoDesktop(win);

        if (this.ehJanelaGerenciada(win.id)) {
            Storage.salvarEstadoJanela(win.id, win.style.top, win.style.left, true, win.style.width, win.style.height);
        }
    },

    redimensionarPorTeclado(id, dw, dh) {
        const win = document.getElementById(id || this.janelaAtivaId);
        if (!win || win.classList.contains('hidden') || win.classList.contains('minimized')) return;
        if (win.id === 'tutorial-note' || win.id === 'custom-alert') return;

        if (win.classList.contains('maximized') || win.classList.contains('snapped-left') || win.classList.contains('snapped-right')) {
            this.restaurarGeometria(win);
        }

        const maxW = window.innerWidth - win.offsetLeft;
        const maxH = (window.innerHeight - this.TASKBAR_HEIGHT) - win.offsetTop;

        const newW = Math.max(300, Math.min(maxW, win.offsetWidth + dw));
        const newH = Math.max(220, Math.min(maxH, win.offsetHeight + dh));

        win.style.width = `${newW}px`;
        win.style.height = `${newH}px`;
        this.restringirAoDesktop(win);
    },

    transferirJanelaAtivaParaSegundoMonitor() {
        const id = this.janelaAtivaId;
        if (!id || !this.ehJanelaGerenciada(id)) return;
        const win = document.getElementById(id);
        this.canalMonitores.postMessage({
            tipo: 'TRANSFERIR_JANELA',
            id,
            novoY: win ? win.offsetTop : 50
        });
        this.fechar(id);
    },

    criarAbaTaskbar(id, win) {
        let taskbarItem = document.getElementById('taskbar-' + id);
        const titleEl = win.querySelector('.window-title');
        const titleText = titleEl ? titleEl.innerText : 'Programa';
        const iconClass = this.windowIcons[id] || 'icon-txt';

        if (!taskbarItem) {
            const openWindowsDiv = document.getElementById('open-windows');
            if (!openWindowsDiv) return;

            taskbarItem = document.createElement('button');
            taskbarItem.type = 'button';
            taskbarItem.id = 'taskbar-' + id;
            taskbarItem.className = 'taskbar-item active';
            taskbarItem.title = titleText;

            taskbarItem.innerHTML = `
                <div class="item-content">
                    <div class="icon-img ${iconClass}"></div> 
                    <span class="taskbar-title-text">${titleText}</span>
                    <span class="taskbar-badge hidden"></span>
                </div>
                <div class="taskbar-preview" role="tooltip">
                    <div class="preview-header">
                        <div class="icon-img ${iconClass}" style="width: 14px; height: 14px; margin: 0; box-shadow: none; flex-shrink: 0;"></div>
                        <span class="preview-title">${titleText}</span>
                    </div>
                    <div class="preview-thumbnail"></div>
                </div>
            `;

            taskbarItem.addEventListener('click', () => this.alternarMinimizar(id));

            taskbarItem.addEventListener('mouseenter', () => {
                const thumbContainer = taskbarItem.querySelector('.preview-thumbnail');
                this.atualizarPreviewReal(id, thumbContainer);
                clearInterval(this.previewInterval);
                this.previewInterval = setInterval(() => {
                    this.atualizarPreviewReal(id, thumbContainer);
                }, 450);
            });

            taskbarItem.addEventListener('mouseleave', () => {
                clearInterval(this.previewInterval);
            });

            openWindowsDiv.appendChild(taskbarItem);
        } else {
            this.atualizarTituloJanela(id, titleText);
        }
    },

    atualizarTituloJanela(id, novoTitulo) {
        const win = document.getElementById(id);
        if (win) {
            const titleEl = win.querySelector('.window-title');
            if (titleEl && novoTitulo) titleEl.innerText = novoTitulo;
        }
        const taskbarItem = document.getElementById('taskbar-' + id);
        if (taskbarItem) {
            const titleText = novoTitulo || win?.querySelector('.window-title')?.innerText || '';
            taskbarItem.title = titleText;
            const tabSpan = taskbarItem.querySelector('.taskbar-title-text');
            const prevSpan = taskbarItem.querySelector('.preview-title');
            if (tabSpan) tabSpan.innerText = titleText;
            if (prevSpan) prevSpan.innerText = titleText;
        }
    },

    atualizarTitulosTaskbar() {
        document.querySelectorAll('.window').forEach(win => {
            if (this.ehJanelaGerenciada(win.id)) {
                const titleEl = win.querySelector('.window-title');
                if (titleEl) {
                    this.atualizarTituloJanela(win.id, titleEl.innerText);
                }
            }
        });
    },

    atualizarPreviewReal(idJanela, previewThumbnailElement) {
        const janelaOriginal = document.getElementById(idJanela);
        if (!janelaOriginal || !previewThumbnailElement) return;

        previewThumbnailElement.innerHTML = '';

        const estaMinimizada = janelaOriginal.classList.contains('minimized');

        const clone = janelaOriginal.cloneNode(true);
        clone.removeAttribute('id');
        clone.classList.remove('hidden', 'minimized', 'maximized', 'snapped-left', 'snapped-right', 'animating-size');

        // Remove elementos interativos extras / overlays internos da miniatura
        clone.querySelectorAll('.resize-handle, .notepad-confirm-bar').forEach(el => el.remove());

        const canvasesOriginais = janelaOriginal.querySelectorAll('canvas');
        const canvasesClonados = clone.querySelectorAll('canvas');
        canvasesOriginais.forEach((canvas, index) => {
            const canvasClonado = canvasesClonados[index];
            if (!canvasClonado) return;

            canvasClonado.width = canvas.width;
            canvasClonado.height = canvas.height;
            const contextoClonado = canvasClonado.getContext('2d');
            if (contextoClonado) contextoClonado.drawImage(canvas, 0, 0);
        });

        const larguraOriginal = Math.max(320, janelaOriginal.offsetWidth || 480);
        const alturaOriginal = Math.max(220, janelaOriginal.offsetHeight || 340);

        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.width = `${larguraOriginal}px`;
        clone.style.height = `${alturaOriginal}px`;
        clone.style.transformOrigin = 'top left';

        const thumbW = previewThumbnailElement.clientWidth || 168;
        const thumbH = previewThumbnailElement.clientHeight || 96;
        const escala = Math.min(thumbW / larguraOriginal, thumbH / alturaOriginal);

        clone.style.transform = `scale(${escala})`;
        clone.style.pointerEvents = 'none';

        previewThumbnailElement.appendChild(clone);

        if (estaMinimizada) {
            const minBadge = document.createElement('div');
            minBadge.className = 'preview-minimized-badge';
            minBadge.innerText = I18n.t('WIN_MINIMIZED_BADGE');
            previewThumbnailElement.appendChild(minBadge);
        }
    },

    atualizarAbasAtivas(idAtivo) {
        document.querySelectorAll('.taskbar-item').forEach(item => {
            item.classList.toggle('active', item.id === 'taskbar-' + idAtivo);
        });
    },

    tornarArrastavel(elmnt, uiCallbacks) {
        if (!elmnt) return;

        let startX = 0, startY = 0, pos3 = 0, pos4 = 0;
        let rafId = null;
        let snapModoPendente = null;
        const isWindow = elmnt.classList.contains('window');

        const header = elmnt.querySelector('.window-header');
        const target = header ? header : elmnt;

        target.addEventListener('mousedown', dragStart);
        target.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.target.closest('.win-btn') || e.target.closest('button') || e.target.closest('input')) return;
            if (e.type === 'mousedown' && e.button !== 0) return;

            if (e.type === 'touchstart') {
                pos3 = e.touches[0].clientX;
                pos4 = e.touches[0].clientY;
            } else {
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
            }
            startX = pos3;
            startY = pos4;
            snapModoPendente = null;

            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchend', dragEnd);
            document.addEventListener('touchmove', drag, { passive: false });

            if (isWindow) {
                WindowManager.trazerParaFrente(elmnt.id);
            }
        }

        function drag(e) {
            e.preventDefault();

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            // Se a janela estava maximizada ou snapped e o usuário arrastou pelo cabeçalho, restaura proporcionalmente
            if (isWindow && (elmnt.classList.contains('maximized') || elmnt.classList.contains('snapped-left') || elmnt.classList.contains('snapped-right'))) {
                if (Math.abs(clientX - startX) > 6 || Math.abs(clientY - startY) > 6) {
                    const larguraRestaurada = parseInt(elmnt.dataset.restoreWidth) || 500;
                    WindowManager.restaurarGeometria(elmnt);
                    const novoLeft = Math.max(0, Math.min(window.innerWidth - larguraRestaurada, clientX - larguraRestaurada / 2));
                    elmnt.style.left = `${novoLeft}px`;
                    elmnt.style.top = `${Math.max(0, clientY - 16)}px`;
                } else {
                    return;
                }
            }

            const dx = pos3 - clientX;
            const dy = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;

            const maxW = window.innerWidth;
            const maxH = window.innerHeight - WindowManager.TASKBAR_HEIGHT;
            const elW = elmnt.offsetWidth || 80;
            const elH = elmnt.offsetHeight || 80;

            let newLeft = elmnt.offsetLeft - dx;
            let newTop = elmnt.offsetTop - dy;

            newLeft = Math.max(0, Math.min(Math.max(0, maxW - elW), newLeft));
            newTop = Math.max(0, Math.min(Math.max(0, maxH - elH), newTop));

            // Detecção de Aero Snap para janelas gerenciadas
            if (isWindow && WindowManager.ehJanelaGerenciada(elmnt.id)) {
                if (clientX <= 16) {
                    snapModoPendente = 'left';
                    WindowManager.mostrarSnapPreview('left');
                } else if (clientX >= maxW - 16) {
                    snapModoPendente = 'right';
                    WindowManager.mostrarSnapPreview('right');
                } else if (clientY <= 10) {
                    snapModoPendente = 'max';
                    WindowManager.mostrarSnapPreview('max');
                } else {
                    snapModoPendente = null;
                    WindowManager.mostrarSnapPreview(null);
                }
            }

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
            WindowManager.mostrarSnapPreview(null);

            if (isWindow) {
                if (snapModoPendente) {
                    WindowManager.encaixarJanela(elmnt.id, snapModoPendente);
                    snapModoPendente = null;
                } else {
                    WindowManager.restringirAoDesktop(elmnt);
                    if (WindowManager.ehJanelaGerenciada(elmnt.id)) {
                        Storage.salvarEstadoJanela(
                            elmnt.id,
                            elmnt.style.top,
                            elmnt.style.left,
                            !elmnt.classList.contains('hidden'),
                            elmnt.style.width,
                            elmnt.style.height
                        );
                    }
                }
            }

            if (uiCallbacks && uiCallbacks.onDragEnd) uiCallbacks.onDragEnd(elmnt);
        }
    },

    tornarRedimensionavel(elmnt) {
        if (!elmnt) return;

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.title = 'Arraste para redimensionar (ou use Alt + +/-)';
        elmnt.appendChild(handle);

        let originalWidth = 0;
        let originalHeight = 0;
        let originalMouseX = 0;
        let originalMouseY = 0;
        let rafId = null;

        const startResize = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (elmnt.classList.contains('maximized') || elmnt.classList.contains('snapped-left') || elmnt.classList.contains('snapped-right')) {
                this.restaurarGeometria(elmnt);
            }

            originalWidth = elmnt.offsetWidth;
            originalHeight = elmnt.offsetHeight;

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
                const maxW = window.innerWidth - elmnt.offsetLeft;
                const maxH = (window.innerHeight - this.TASKBAR_HEIGHT) - elmnt.offsetTop;

                const width = Math.max(300, Math.min(maxW, originalWidth + (clientX - originalMouseX)));
                const height = Math.max(220, Math.min(maxH, originalHeight + (clientY - originalMouseY)));

                elmnt.style.width = width + 'px';
                elmnt.style.height = height + 'px';
            });
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', resize);
            document.removeEventListener('touchend', stopResize);
            if (rafId) cancelAnimationFrame(rafId);

            if (this.ehJanelaGerenciada(elmnt.id)) {
                Storage.salvarEstadoJanela(
                    elmnt.id,
                    elmnt.style.top,
                    elmnt.style.left,
                    !elmnt.classList.contains('hidden'),
                    elmnt.style.width,
                    elmnt.style.height
                );
            }
        };

        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize, { passive: false });
    }
};
