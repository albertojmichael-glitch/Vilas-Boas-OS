// ui.js
import { AudioManager } from './assets/sounds/audioManager.js';
import { GameState } from './gameState.js';
import { WindowManager } from './windowManager.js';
import { Storage } from './storage.js';
import { I18n } from './i18nManager.js';
import { Cameras } from './cameras.js';

export const UI = {
    relogioInterval: null,
    passoTutorial: 1,
    notepadDirty: false,
    notepadFilename: 'LEIA-ME.txt',
    pastaAtual: 'root',
    historicoPastas: ['root'],
    indiceHistorico: 0,
    itemExploradorSelecionado: null,
    abaConfigAtual: 'display',
    mostrandoTodosProgramas: false,
    emails: [],
    emailSelecionadoId: 'mail-welcome',
    atalhosRemovidos: [],

     obterSistemaArquivos() {
        const isEn = I18n.getIdioma() === 'en';
        return {
            root: {
                caminho: isEn ? 'C:\\Users\\Guard' : 'C:\\Usuários\\Guarda',
                pai: null,
                itens: [
                    {
                        id: 'folder-photos',
                        tipo: 'folder',
                        destino: 'photos',
                        icone: 'icon-folder',
                        nome: isEn ? 'Pizzeria Photos' : 'Fotos da Pizzaria'
                    },
                    {
                        id: 'folder-reports',
                        tipo: 'folder',
                        destino: 'reports',
                        icone: 'icon-folder',
                        nome: isEn ? 'Reports' : 'Relatórios'
                    },
                    {
                        id: 'folder-staff',
                        tipo: 'folder',
                        destino: 'staff',
                        icone: 'icon-folder',
                        nome: isEn ? 'Staff' : 'Funcionários'
                    },
                    {
                        id: 'folder-restricted',
                        tipo: 'restricted-folder',
                        destino: 'restricted',
                        icone: 'icon-folder restricted-folder-icon',
                        nome: isEn ? 'Confidential (Z:)' : 'Confidencial (Z:)'
                    },
                    {
                        id: 'file-rogerio',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: 'Email_Rogerio.txt',
                        conteudo: isEn
                            ? "To: Rogério Vinhedo\nSubject: First night\n\nMy first night on the job is almost over... they told me the janitor called in sick and I'll have to clean the dining area. I saw something moving behind the curtains in Room 03. Love you."
                            : "Para: Rogério Vinhedo\nAssunto: Primeira noite\n\nPrimeira noite sendo empregada se passou... me avisaram que o limpador faltou e terei que limpar a área de jantar. Vi algo se mexendo atrás das cortinas na Sala 03. Te amo amor."
                    },
                    {
                        id: 'file-memo',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: 'Memo_Admin.txt',
                        conteudo: isEn
                            ? "Memorandum - Administration\nFrom: Renato\n\nThe facility remains active at night to reduce animatronic circuit repair costs. Avoid mentioning previous incidents. If the night guard wants to quit, offer a bonus."
                            : "Memorando - Administração\nDe: Renato\n\nO local permanece ativo à noite para reduzir custo de reparo dos animatrônicos. Evitar menção a incidentes anteriores. Se a funcionária quiser desistir, ofereça bônus."
                    }
                ]
            },
            photos: {
                caminho: isEn ? 'C:\\Users\\Guard\\Pizzeria Photos' : 'C:\\Usuários\\Guarda\\Fotos da Pizzaria',
                pai: 'root',
                itens: [
                    {
                        id: 'file-photo-stage',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: isEn ? 'Stage_Inspection_01.txt' : 'Registro_Palco_01.txt',
                        conteudo: isEn
                            ? "PHOTOGRAPHIC LOG - MAIN STAGE (CAM 01)\n\nDuring daytime calibration, the primary unit remained stationary. After 00:00 AM, optical sensors capture displacement toward the East Hall (CAM 02)."
                            : "REGISTRO FOTOGRÁFICO - PALCO PRINCIPAL (CAM 01)\n\nDurante a calibração diurna, a unidade principal permaneceu imóvel. Após as 00:00 AM, sensores ópticos captam deslocamento rumo ao Corredor Leste (CAM 02)."
                    },
                    {
                        id: 'file-photo-cam03',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: isEn ? 'Notice_Cam03_Sensor.txt' : 'Aviso_Cam03_Sensor.txt',
                        conteudo: isEn
                            ? "TECHNICAL NOTE - BACKSTAGE (CAM 03)\n\nThe Room 03 camera suffers severe electromagnetic interference whenever the entity approaches the office door. If you see red eyes or high static on CAM 03, trigger the Firewall Pulse immediately!"
                            : "NOTA TÉCNICA - SALA DOS FUNDOS (CAM 03)\n\nA câmera da Sala 03 sofre forte interferência eletromagnética sempre que a entidade se aproxima da porta do escritório. Se notar olhos vermelhos ou estática intensa na CAM 03, acione o Pulso de Firewall imediatamente!"
                    }
                ]
            },
            reports: {
                caminho: isEn ? 'C:\\Users\\Guard\\Reports' : 'C:\\Usuários\\Guarda\\Relatórios',
                pai: 'root',
                itens: [
                    {
                        id: 'file-report-power',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: isEn ? 'Power_Consumption_Log.txt' : 'Consumo_Energia_Turno.txt',
                        conteudo: isEn
                            ? "NIGHT SHIFT POWER REPORT\n\n- Base life support & office lights: -0.5% every 2s\n- CCTV Camera System open: +1.0% extra every 2s (total -1.5%)\n- Firewall Pulse: -5% per activation\n\nRecommendation: Close or minimize the Camera System whenever you are not actively checking a room."
                            : "RELATÓRIO DE ENERGIA DO TURNO NOTURNO\n\n- Sistema base e iluminação da sala: -0,5% a cada 2s\n- Sistema de Câmeras aberto: +1,0% extra a cada 2s (total -1,5%)\n- Pulso de Firewall: -5% por disparo\n\nRecomendação: Feche ou minimize o Sistema de Câmeras sempre que não estiver inspecionando uma sala."
                    },
                    {
                        id: 'file-report-firewall',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: isEn ? 'Firewall_Protocol_Room03.txt' : 'Protocolo_Firewall_Sala03.txt',
                        conteudo: isEn
                            ? "DEFENSE PROTOCOL - SUBNET PORT 8080\n\n1. Monitor packet status in the Network Monitor.\n2. At 240ms (CAM 02), the entity is moving through the East Hall.\n3. At 999ms (CAM 03), breach is imminent: click 'Execute Firewall Pulse' to reset the entity back to CAM 01.\n\nNote: Scheduled IT email at 02:00 AM contains the 4-digit key for Drive Z:."
                            : "PROTOCOLO DE DEFESA - SUB-REDE PORTA 8080\n\n1. Acompanhe o status de pacotes no Monitor de Rede.\n2. Em 240ms (CAM 02), a entidade está avançando pelo Corredor Leste.\n3. Em 999ms (CAM 03), a invasão é iminente: clique em 'Executar Pulso de Firewall' para expulsá-la de volta à CAM 01.\n\nNota: O e-mail programado do suporte de TI às 02:00 AM contém a chave de 4 dígitos do Disco Z:."
                    }
                ]
            },
            staff: {
                caminho: isEn ? 'C:\\Users\\Guard\\Staff' : 'C:\\Usuários\\Guarda\\Funcionários',
                pai: 'root',
                itens: [
                    {
                        id: 'file-staff-caroline',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: isEn ? 'Record_Caroline_F.txt' : 'Ficha_Caroline_F.txt',
                        conteudo: isEn
                            ? "EMPLOYEE RECORD\nName: Caroline F.\nRole: Night Shift Security Guard\nHours: 12:00 AM - 06:00 AM\nClearance: Level 1 (Pending temporary Admin Key from IT)"
                            : "FICHA DE FUNCIONÁRIA\nNome: Caroline F.\nCargo: Vigilante Noturna\nHorário: 12:00 AM às 06:00 AM\nCredencial: Nível 1 (Aguardando chave Admin temporária da TI)"
                    }
                ]
            },
            restricted: {
                caminho: isEn ? 'Z:\\Confidential' : 'Z:\\Confidencial',
                pai: 'root',
                itens: [
                    {
                        id: 'file-secret-vb',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: 'Segredo_Projeto_VB.txt',
                        conteudo: isEn
                            ? "CONFIDENTIAL REPORT - PROJECT VILAS BOAS\n\nThe units are not experiencing mechanical failure. The consciousness of the former maintenance crew was transferred into the pizzeria's local subnet.\n\nDo not let the main generator run out of power, or you will be trapped in the dark with them."
                            : "RELATÓRIO CONFIDENCIAL - PROJETO VILAS BOAS\n\nAs unidades não estão apresentando defeito mecânico. A consciência da antiga equipe foi transferida para a sub-rede da pizzaria.\n\nNão deixe o gerador principal ficar sem energia ou você ficará presa no escuro com eles."
                    },
                    {
                        id: 'file-incident-87',
                        tipo: 'file',
                        icone: 'icon-txt',
                        nome: 'Log_Incidente_1987.txt',
                        conteudo: isEn
                            ? "INCIDENT LOG #1987\n\n Room 03 was sealed after the neural sync experiment overloaded port 8080. Only a high-voltage Firewall Pulse on the subnet can force the main unit to reboot at the stage."
                            : "REGISTRO DE INCIDENTE #1987\n\nA Sala 03 foi isolada após o experimento de sincronização neural sobrecarregar a porta 8080. Apenas um Pulso de Firewall de alta tensão na sub-rede força a unidade principal a reiniciar no palco."
                    }
                ]
            }
        };
    },

    mostrarAlerta(mensagem, titulo) {
        const titleEl = document.getElementById('alert-title');
        const msgEl = document.getElementById('alert-message');
        const alertWin = document.getElementById('custom-alert');

        if (titleEl && msgEl && alertWin) {
            titleEl.innerText = titulo || I18n.t('WARNING_TITLE');
            msgEl.innerText = mensagem;
            alertWin.classList.remove('hidden');
            WindowManager.trazerParaFrente('custom-alert');
            const okBtn = alertWin.querySelector('.alert-ok-btn');
            if (okBtn) setTimeout(() => okBtn.focus(), 30);
            AudioManager.play('error');
        }
    },

    fecharAlerta() {
        const alertWin = document.getElementById('custom-alert');
        if (alertWin) alertWin.classList.add('hidden');
        AudioManager.play('click');
    },

    mostrarNotificacao({ titulo, mensagem, textoBotao, aoClicar, tipo = 'info', duracao = 7000 }) {
        const container = document.getElementById('tray-notifications');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `tray-toast toast-${tipo}`;
        toast.setAttribute('role', 'status');

        toast.innerHTML = `
            <div class="toast-header">
                <strong>${titulo}</strong>
                <button type="button" class="toast-close" aria-label="${I18n.t('WIN_CLOSE')}">✕</button>
            </div>
            <div class="toast-body">${mensagem}</div>
            ${textoBotao ? `<div class="toast-actions"><button type="button" class="toast-action-btn">${textoBotao}</button></div>` : ''}
        `;

        const removerToast = () => {
            toast.classList.add('toast-leaving');
            setTimeout(() => toast.remove(), 220);
        };

        toast.querySelector('.toast-close')?.addEventListener('click', removerToast);
        if (textoBotao && aoClicar) {
            toast.querySelector('.toast-action-btn')?.addEventListener('click', () => {
                aoClicar();
                removerToast();
            });
        }

        container.appendChild(toast);
        if (duracao > 0) {
            setTimeout(removerToast, duracao);
        }
    },

    initNotepad() {
        const textarea = document.getElementById('notepad-textarea');
        if (!textarea) return;

        this.notepadFilename = Storage.obterArquivoNotepad();
        Storage.carregarNotepad(textarea);
        this.notepadDirty = false;
        this.atualizarStatusNotepad();

        textarea.addEventListener('input', () => {
            this.notepadDirty = true;
            this.atualizarStatusNotepad();
        });

        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.salvarNotepadAtual();
            }
        });
    },

    atualizarStatusNotepad() {
        const prefixo = this.notepadDirty ? '*' : '';
        const novoTitulo = `${prefixo}${this.notepadFilename} - ${I18n.t('APP_NOTEPAD')}`;
        WindowManager.atualizarTituloJanela('notepad-window', novoTitulo);

        const statusEl = document.getElementById('notepad-status-text');
        if (statusEl) {
            statusEl.innerText = this.notepadDirty ? I18n.t('NOTEPAD_STATUS_DIRTY') : I18n.t('NOTEPAD_STATUS_SAVED');
            statusEl.classList.toggle('is-dirty', this.notepadDirty);
        }
    },

    abrirTexto(idWindow, titulo, conteudo) {
        const notepad = document.getElementById(idWindow);
        if (!notepad) return;

        const textarea = notepad.querySelector('textarea');
        this.notepadFilename = (titulo || 'Documento.txt').trim();
        if (textarea) textarea.value = conteudo;
        this.notepadDirty = false;
        Storage.salvarNotepad(conteudo, this.notepadFilename);
        this.atualizarStatusNotepad();
    },

    salvarNotepadAtual() {
        const textarea = document.getElementById('notepad-textarea');
        const texto = textarea ? textarea.value : '';
        Storage.salvarNotepad(texto, this.notepadFilename);
        this.notepadDirty = false;
        this.atualizarStatusNotepad();
        AudioManager.play('click');

        this.mostrarNotificacao({
            titulo: I18n.t('APP_NOTEPAD'),
            mensagem: I18n.t('NOTEPAD_SAVED_TOAST'),
            tipo: 'success',
            duracao: 3500
        });
    },

    solicitarLimparNotepad() {
        const textarea = document.getElementById('notepad-textarea');
        if (!textarea || textarea.value.trim() === '') {
            if (textarea) textarea.value = '';
            this.notepadDirty = false;
            this.atualizarStatusNotepad();
            return;
        }
        const confirmBar = document.getElementById('notepad-confirm-bar');
        if (confirmBar) {
            confirmBar.classList.remove('hidden');
        }
    },

    confirmarLimparNotepad(confirmado) {
        const confirmBar = document.getElementById('notepad-confirm-bar');
        if (confirmBar) confirmBar.classList.add('hidden');

        if (confirmado) {
            const textarea = document.getElementById('notepad-textarea');
            if (textarea) textarea.value = '';
            this.notepadDirty = true;
            this.atualizarStatusNotepad();
            AudioManager.play('click');
        }
    },

    verificarLixeira(elementoArrastado) {
        if (!elementoArrastado.classList.contains('desktop-icon') || elementoArrastado.id === 'icon-lixeira') return;

        const lixeira = document.getElementById('icon-lixeira');
        if (!lixeira) return;

        const rectLixeira = lixeira.getBoundingClientRect();
        const rectItem = elementoArrastado.getBoundingClientRect();

        const colidiu = !(rectLixeira.right < rectItem.left ||
                          rectLixeira.left > rectItem.right ||
                          rectLixeira.bottom < rectItem.top ||
                          rectLixeira.top > rectItem.bottom);

        if (colidiu) {
            elementoArrastado.style.display = 'none';
            if (!this.atalhosRemovidos.includes(elementoArrastado.id)) {
                this.atalhosRemovidos.push(elementoArrastado.id);
            }
            const imgTrash = lixeira.querySelector('.icon-trash');
            if (imgTrash) imgTrash.classList.add('full');
            this.atualizarJanelaLixeira();
            AudioManager.play('click');
        }
    },

    atualizarJanelaLixeira() {
        const msgEl = document.getElementById('trash-status-msg');
        const listEl = document.getElementById('trash-items-list');
        const restoreBtn = document.getElementById('btn-restore-trash');

        if (!msgEl || !listEl || !restoreBtn) return;

        if (this.atalhosRemovidos.length === 0) {
            msgEl.innerText = I18n.t('TRASH_EMPTY_MSG');
            listEl.innerHTML = '';
            restoreBtn.classList.add('hidden');
        } else {
            msgEl.innerText = `${I18n.t('TRASH_FULL_MSG')} (${this.atalhosRemovidos.length})`;
            listEl.innerHTML = this.atalhosRemovidos.map(id => {
                const el = document.getElementById(id);
                const nome = el?.querySelector('span')?.innerText || id;
                return `<li class="trash-entry">📄 ${nome}</li>`;
            }).join('');
            restoreBtn.classList.remove('hidden');
        }
    },

    restaurarLixeira() {
        this.atalhosRemovidos.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });
        this.atalhosRemovidos = [];
        const imgTrash = document.querySelector('#icon-lixeira .icon-trash');
        if (imgTrash) imgTrash.classList.remove('full');
        this.atualizarJanelaLixeira();
        AudioManager.play('click');

        this.mostrarNotificacao({
            titulo: I18n.t('APP_TRASH'),
            mensagem: I18n.t('TRASH_RESTORED_TOAST'),
            tipo: 'info',
            duracao: 3500
        });
    },

    iniciarTelaBoot() {
        const bootScreen = document.getElementById('boot-screen');
        const statusEl = document.getElementById('boot-status-text');
        const skipBtn = document.getElementById('boot-skip-btn');
        if (!bootScreen) return;

        let bootFinalizado = false;
        const finalizarBoot = () => {
            if (bootFinalizado) return;
            bootFinalizado = true;
            bootScreen.style.opacity = '0';
            setTimeout(() => {
                bootScreen.remove();
                const loginBtn = document.querySelector('.login-submit-btn');
                if (loginBtn) loginBtn.focus();
            }, 600);
        };

        if (skipBtn) {
            skipBtn.addEventListener('click', finalizarBoot);
        }

        document.addEventListener('boot:assetProgress', (e) => {
            const { carregadas, total, teveFalha, concluido } = e.detail;
            if (statusEl) {
                if (!concluido) {
                    statusEl.innerText = `${I18n.t('BOOT_LOADING')} (${carregadas}/${total})`;
                } else {
                    statusEl.innerText = teveFalha ? I18n.t('BOOT_FALLBACK') : I18n.t('BOOT_READY');
                }
            }
            if (concluido) {
                setTimeout(finalizarBoot, 900);
            }
        });

        // Tempo máximo de segurança caso algum recurso demore
        setTimeout(finalizarBoot, 2200);
    },

    iniciarRelogio() {
        const updateClock = () => {
            if (GameState.noiteAtiva) return;

            const clockElement = document.getElementById('clock');
            if (!clockElement) return;

            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';

            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;

            clockElement.textContent = `${hours}:${minutes} ${ampm}`;
        };

        this.atualizarModoRelogio(false);
        updateClock();
        this.relogioInterval = setInterval(updateClock, 1000);
    },

    atualizarModoRelogio(emTurno) {
        const badgeEl = document.getElementById('clock-mode-badge');
        const widgetEl = document.getElementById('clock-widget');
        if (badgeEl) {
            badgeEl.innerText = emTurno ? I18n.t('CLOCK_MODE_SHIFT') : I18n.t('CLOCK_MODE_SYSTEM');
            badgeEl.classList.toggle('shift-active', Boolean(emTurno));
        }
        if (widgetEl) {
            widgetEl.title = emTurno ? I18n.t('CLOCK_TOOLTIP_SHIFT') : I18n.t('CLOCK_TOOLTIP_SYSTEM');
        }
    },

    configurarMenuIniciar() {
        const startOrb = document.getElementById('start-orb');
        const startMenu = document.getElementById('start-menu');
        const desktop = document.getElementById('desktop');
        const searchInput = document.getElementById('start-search-input');
        const allProgsBtn = document.getElementById('btn-all-programs');
        const powerMoreBtn = document.getElementById('btn-power-more');
        const powerSubmenu = document.getElementById('power-submenu');

        if (startOrb) {
            startOrb.addEventListener('click', (e) => {
                e.stopPropagation();
                window.toggleStartMenu();
            });
        }

        if (allProgsBtn) {
            allProgsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.mostrandoTodosProgramas = !this.mostrandoTodosProgramas;
                if (searchInput) searchInput.value = '';
                this.renderizarListaMenuIniciar('');
                AudioManager.play('click');
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderizarListaMenuIniciar(e.target.value);
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const primeiroItem = document.querySelector('#start-programs-list .start-item');
                    if (primeiroItem) primeiroItem.click();
                }
            });
        }

        if (powerMoreBtn && powerSubmenu) {
            powerMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                powerSubmenu.classList.toggle('hidden');
                AudioManager.play('click');
            });
        }

        if (desktop) {
            desktop.addEventListener('mousedown', (e) => {
                if (startMenu && !startMenu.classList.contains('hidden')) {
                    startMenu.classList.add('hidden');
                    startOrb?.setAttribute('aria-expanded', 'false');
                }
                if (powerSubmenu && !powerSubmenu.classList.contains('hidden')) {
                    powerSubmenu.classList.add('hidden');
                }
                const powerFlyout = document.getElementById('power-flyout');
                if (powerFlyout && !powerFlyout.classList.contains('hidden')) {
                    powerFlyout.classList.add('hidden');
                }
                if (e.target === desktop) {
                    this.limparSelecaoIcones();
                }
            });
        }

        this.renderizarListaMenuIniciar('');
    },

    obterCatalogoMenuIniciar() {
        const fs = this.obterSistemaArquivos();
        const apps = [
            { id: 'notepad-window', icone: 'icon-txt', titulo: I18n.t('APP_NOTEPAD'), desc: I18n.t('START_NOTEPAD_DESC'), fixado: true },
            { id: 'camera-window', icone: 'icon-exe', titulo: I18n.t('APP_CAMERAS'), desc: I18n.t('START_CAMERAS_DESC'), fixado: true },
            { id: 'rede-window', icone: 'icon-network', titulo: I18n.t('APP_NETWORK'), desc: I18n.t('START_NETWORK_DESC'), fixado: true },
            { id: 'email-window', icone: 'icon-email', titulo: I18n.t('APP_EMAIL'), desc: I18n.t('START_EMAIL_DESC'), fixado: true },
            { id: 'arquivos-window', icone: 'icon-folder', titulo: I18n.t('APP_EXPLORER'), desc: I18n.t('START_EXPLORER_DESC'), fixado: true },
            { id: 'cat-window', icone: 'icon-cat', titulo: I18n.t('APP_CAT'), desc: I18n.t('START_CAT_DESC'), fixado: true },
            { id: 'computador-window', icone: 'icon-computer', titulo: I18n.t('APP_COMPUTER'), desc: I18n.t('START_COMPUTER_DESC'), fixado: false },
            { id: 'settings-window', icone: 'icon-settings', titulo: I18n.t('APP_SETTINGS'), desc: I18n.t('START_SETTINGS_DESC'), fixado: false },
            { id: 'lixeira-window', icone: 'icon-trash', titulo: I18n.t('APP_TRASH'), desc: I18n.t('START_TRASH_DESC'), fixado: false },
            { id: 'tutorial-note', icone: 'icon-txt', titulo: I18n.t('APP_TUTORIAL'), desc: I18n.t('START_TUTORIAL_DESC'), fixado: false }
        ];

        const arquivos = [];
        ['root', 'photos', 'reports', 'staff'].forEach(pastaKey => {
            fs[pastaKey].itens.forEach(item => {
                if (item.tipo === 'file') {
                    arquivos.push({
                        tipo: 'arquivo',
                        icone: 'icon-txt',
                        titulo: item.nome,
                        desc: fs[pastaKey].caminho,
                        conteudo: item.conteudo
                    });
                }
            });
        });

        return { apps, arquivos };
    },

    renderizarListaMenuIniciar(termoBusca = '') {
        const container = document.getElementById('start-programs-list');
        const allProgsLabel = document.getElementById('all-programs-label');
        const allProgsArrow = document.getElementById('all-programs-arrow');
        if (!container) return;

        const q = termoBusca.trim().toLowerCase();
        const { apps, arquivos } = this.obterCatalogoMenuIniciar();

        if (allProgsLabel && allProgsArrow) {
            allProgsLabel.innerText = this.mostrandoTodosProgramas ? I18n.t('START_BACK') : I18n.t('START_ALL_PROGRAMS');
            allProgsArrow.innerText = this.mostrandoTodosProgramas ? '◀' : '▶';
        }

        let itensExibir = [];
        if (q.length > 0) {
            const appsFiltrados = apps.filter(a => a.titulo.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
            const arqsFiltrados = arquivos.filter(f => f.titulo.toLowerCase().includes(q) || f.conteudo.toLowerCase().includes(q));
            itensExibir = [...appsFiltrados, ...arqsFiltrados];
        } else if (this.mostrandoTodosProgramas) {
            itensExibir = apps;
        } else {
            itensExibir = apps.filter(a => a.fixado);
        }

        container.innerHTML = '';

        if (itensExibir.length === 0) {
            const vazio = document.createElement('div');
            vazio.className = 'start-search-empty';
            vazio.innerText = I18n.t('START_SEARCH_EMPTY');
            container.appendChild(vazio);
            return;
        }

        itensExibir.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'start-item';
            btn.innerHTML = `
                <div class="icon-img ${item.icone} small"></div>
                <div class="item-text">
                    <strong>${item.titulo}</strong>
                    <span>${item.desc}</span>
                </div>
            `;
            btn.addEventListener('click', () => {
                if (item.tipo === 'arquivo') {
                    this.abrirTexto('notepad-window', item.titulo, item.conteudo);
                    WindowManager.abrir('notepad-window');
                } else {
                    WindowManager.abrir(item.id);
                }
                window.toggleStartMenu(false);
            });
            container.appendChild(btn);
        });
    },

    limparSelecaoIcones() {
        document.querySelectorAll('.desktop-icon.selected').forEach(el => {
            el.classList.remove('selected');
            el.setAttribute('aria-selected', 'false');
        });
    },

    selecionarIconeDesktop(iconEl) {
        this.limparSelecaoIcones();
        if (iconEl) {
            iconEl.classList.add('selected');
            iconEl.setAttribute('aria-selected', 'true');
        }
    },

    atualizarTutorial() {
        const titleEl = document.getElementById('tutorial-step-title');
        const bodyEl = document.getElementById('tutorial-step-body');
        const prevBtn = document.getElementById('tutorial-prev-btn');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const dots = document.querySelectorAll('.tutorial-dot');

        if (!titleEl || !bodyEl) return;

        titleEl.innerText = I18n.t(`TUTORIAL_STEP_${this.passoTutorial}_TITLE`);
        bodyEl.innerText = I18n.t(`TUTORIAL_STEP_${this.passoTutorial}_BODY`);

        if (prevBtn) prevBtn.disabled = this.passoTutorial <= 1;
        if (nextBtn) {
            nextBtn.innerText = this.passoTutorial >= 3 ? I18n.t('TUTORIAL_CLOSE_BTN') : I18n.t('TUTORIAL_NEXT_BTN');
        }
        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx + 1 === this.passoTutorial);
        });
    },

    destacarPassoTutorial() {
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));

        let alvo = null;
        if (this.passoTutorial === 1) {
            alvo = document.getElementById('icon-cameras');
        } else if (this.passoTutorial === 2) {
            alvo = document.getElementById('power-meter');
            const flyout = document.getElementById('power-flyout');
            if (flyout) flyout.classList.remove('hidden');
        } else if (this.passoTutorial === 3) {
            alvo = document.getElementById('icon-rede');
        }

        if (alvo) {
            alvo.classList.add('onboarding-highlight');
            alvo.focus();
            setTimeout(() => alvo.classList.remove('onboarding-highlight'), 3200);
        }
        AudioManager.play('click');
    },

    atualizarPainelEnergia(detalhes) {
        const powerEl = document.getElementById('power-text');
        const powerMeter = document.getElementById('power-meter');
        const loadBarsEl = document.getElementById('power-load-bars');
        const flyoutBar = document.getElementById('power-flyout-bar');
        const flyoutRate = document.getElementById('power-flyout-rate');
        const flyoutCamState = document.getElementById('power-flyout-cam-state');
        const savePowerBtn = document.getElementById('btn-power-close-cams');

        const energia = detalhes ? detalhes.energia : Math.ceil(GameState.energia);
        const cameraAberta = detalhes ? detalhes.cameraAberta : GameState.cameraAberta;

        if (powerEl) powerEl.innerText = `${energia}%`;
        if (loadBarsEl) {
            loadBarsEl.innerText = cameraAberta ? '▮▮▮' : '▮▯▯';
            loadBarsEl.title = cameraAberta ? I18n.t('POWER_RATE_HIGH') : I18n.t('POWER_RATE_NORMAL');
        }

        if (powerMeter) {
            powerMeter.classList.remove('power-good', 'power-warn', 'power-critical');
            if (energia <= 20) {
                powerMeter.classList.add('power-critical');
            } else if (energia <= 50) {
                powerMeter.classList.add('power-warn');
            } else {
                powerMeter.classList.add('power-good');
            }
        }

        if (flyoutBar) {
            flyoutBar.style.width = `${Math.max(0, Math.min(100, energia))}%`;
            flyoutBar.className = 'power-flyout-fill ' + (energia <= 20 ? 'fill-critical' : (energia <= 50 ? 'fill-warn' : 'fill-good'));
        }

        if (flyoutRate) {
            flyoutRate.innerText = cameraAberta ? I18n.t('POWER_RATE_HIGH') : I18n.t('POWER_RATE_NORMAL');
            flyoutRate.className = cameraAberta ? 'rate-high' : 'rate-normal';
        }

        if (flyoutCamState) {
            flyoutCamState.innerText = cameraAberta ? I18n.t('POWER_STATE_CAM_OPEN') : I18n.t('POWER_STATE_CAM_CLOSED');
            flyoutCamState.className = cameraAberta ? 'rate-high' : 'rate-normal';
        }

        if (savePowerBtn) {
            savePowerBtn.disabled = !cameraAberta;
        }
    },

    atualizarPainelRede(posicao) {
        const netCard = document.getElementById('net-status-card');
        const netStatus = document.getElementById('net-status-text');
        const netAlert = document.getElementById('net-alert-text');
        const btnPurge = document.getElementById('btn-purge-network');
        const btnOpenCam = document.getElementById('btn-open-alert-cam');

        if (!netStatus || !netAlert) return;

        const pos = posicao || GameState.posicaoEntidade || 1;
        if (netCard) {
            netCard.className = 'network-status-card';
        }

        if (pos === 1) {
            if (netCard) netCard.classList.add('net-level-1');
            netStatus.innerText = I18n.t('NET_LEVEL_1');
            netAlert.innerText = I18n.t('NET_ALERT_1');
            if (btnPurge) {
                btnPurge.disabled = true;
                btnPurge.className = 'firewall-btn firewall-standby';
            }
            if (btnOpenCam) {
                btnOpenCam.innerText = `${I18n.t('NET_OPEN_CAM_BTN')} (CAM 01)`;
                btnOpenCam.dataset.cam = '1';
            }
        } else if (pos === 2) {
            if (netCard) netCard.classList.add('net-level-2');
            netStatus.innerText = I18n.t('NET_LEVEL_2');
            netAlert.innerText = I18n.t('NET_ALERT_2');
            if (btnPurge) {
                btnPurge.disabled = false;
                btnPurge.className = 'firewall-btn firewall-warning';
            }
            if (btnOpenCam) {
                btnOpenCam.innerText = `${I18n.t('NET_OPEN_CAM_BTN')} (CAM 02 ⚠)`;
                btnOpenCam.dataset.cam = '2';
            }
        } else if (pos >= 3) {
            if (netCard) netCard.classList.add('net-level-3');
            netStatus.innerText = I18n.t('NET_LEVEL_3');
            netAlert.innerText = I18n.t('NET_ALERT_3');
            if (btnPurge) {
                btnPurge.disabled = false;
                btnPurge.className = 'firewall-btn firewall-critical';
            }
            if (btnOpenCam) {
                btnOpenCam.innerText = `${I18n.t('NET_OPEN_CAM_BTN')} (CAM 03 🚨)`;
                btnOpenCam.dataset.cam = '3';
            }
        }
    },

    initEmails() {
        this.emails = [
            {
                id: 'mail-welcome',
                horario: '12:00 AM',
                lido: false,
                remetenteKey: 'EMAIL_WELCOME_SENDER',
                assuntoKey: 'EMAIL_WELCOME_SUBJECT',
                corpoKey: 'EMAIL_WELCOME_BODY'
            }
        ];
        this.emailSelecionadoId = 'mail-welcome';
        this.renderizarEmails();
    },

    obterDadosEmailTraduzido(email) {
        const isEn = I18n.getIdioma() === 'en';
        return {
            id: email.id,
            horario: email.horario || '12:00 AM',
            lido: email.lido,
            remetente: email.remetenteKey ? I18n.t(email.remetenteKey) : (isEn && email.remetente_en ? email.remetente_en : email.remetente),
            assunto: email.assuntoKey ? I18n.t(email.assuntoKey) : (isEn && email.assunto_en ? email.assunto_en : email.assunto),
            corpo: email.corpoKey ? I18n.t(email.corpoKey) : (isEn && email.corpo_en ? email.corpo_en : email.corpo)
        };
    },

    renderizarEmails() {
        const lista = document.getElementById('email-list');
        const view = document.getElementById('email-body-view');
        if (!lista) return;

        lista.innerHTML = '';
        let naoLidos = 0;

        this.emails.forEach(email => {
            if (!email.lido) naoLidos++;
            const dados = this.obterDadosEmailTraduzido(email);

            const li = document.createElement('li');
            li.tabIndex = 0;
            li.setAttribute('role', 'button');
            li.className = `email-item ${!email.lido ? 'unread-email' : 'read-email'} ${email.id === this.emailSelecionadoId ? 'selected-email' : ''}`;
            li.innerHTML = `
                <div class="email-item-top">
                    <span class="email-dot">${!email.lido ? '●' : ''}</span>
                    <strong>${dados.remetente}</strong>
                    ${!email.lido ? `<span class="email-new-pill">${I18n.t('EMAIL_NEW_TAG')}</span>` : ''}
                </div>
                <div class="email-item-subject">${dados.assunto}</div>
                <div class="email-item-time">${dados.horario}</div>
            `;

            const abrirEsteEmail = () => {
                email.lido = true;
                this.emailSelecionadoId = email.id;
                this.renderizarEmails();
                AudioManager.play('click');
            };

            li.addEventListener('click', abrirEsteEmail);
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    abrirEsteEmail();
                }
            });

            lista.appendChild(li);
        });

        const selecionado = this.emails.find(e => e.id === this.emailSelecionadoId) || this.emails[0];
        if (selecionado && view) {
            const d = this.obterDadosEmailTraduzido(selecionado);
            view.innerHTML = `
                <div class="email-reader-header">
                    <h4>${d.assunto}</h4>
                    <div class="email-meta-row">
                        <span><strong>${I18n.t('EMAIL_FROM')}</strong> ${d.remetente}</span>
                        <span class="email-time-tag">${d.horario}</span>
                    </div>
                </div>
                <hr class="email-divider">
                <pre class="email-body-pre">${d.corpo}</pre>
            `;
        }

        this.atualizarBadgesEmail(naoLidos);
    },

    atualizarBadgesEmail(naoLidos) {
        const desktopBadge = document.getElementById('email-unread-badge');
        if (desktopBadge) {
            desktopBadge.innerText = naoLidos > 0 ? String(naoLidos) : '';
            desktopBadge.classList.toggle('hidden', naoLidos <= 0);
        }

        const baseTitle = I18n.t('EMAIL_WINDOW_TITLE');
        const novoTitulo = naoLidos > 0 ? `(${naoLidos}) ${baseTitle}` : baseTitle;
        WindowManager.atualizarTituloJanela('email-window', novoTitulo);

        const taskbarBadge = document.querySelector('#taskbar-email-window .taskbar-badge');
        if (taskbarBadge) {
            taskbarBadge.innerText = naoLidos > 0 ? String(naoLidos) : '';
            taskbarBadge.classList.toggle('hidden', naoLidos <= 0);
        }
    },

    adicionarEmailNaLista(email) {
        const novoEmail = {
            ...email,
            lido: false
        };
        this.emails.unshift(novoEmail);
        this.emailSelecionadoId = novoEmail.id;
        this.renderizarEmails();

        const d = this.obterDadosEmailTraduzido(novoEmail);
        AudioManager.play('click');

        // Notificação discreta na bandeja em vez de alerta modal que interrompe o jogador!
        this.mostrarNotificacao({
            titulo: `✉️ ${I18n.t('EMAIL_TOAST_TITLE')} (${d.horario})`,
            mensagem: `<strong>${d.remetente}:</strong> ${d.assunto}`,
            textoBotao: I18n.t('EMAIL_TOAST_OPEN'),
            aoClicar: () => {
                novoEmail.lido = true;
                this.emailSelecionadoId = novoEmail.id;
                this.renderizarEmails();
                WindowManager.abrir('email-window');
            },
            tipo: 'email',
            duracao: 9000
        });
    },

    // ==========================================
    // EXPLORADOR DE ARQUIVOS COMPLETO
    // ==========================================
    initExplorador() {
        this.navegarPasta('root', false);
    },

    navegarPasta(chavePasta, registrarHistorico = true) {
        if (chavePasta === 'restricted' && !GameState.arquivosDesbloqueados) {
            this.abrirModalSenhaConfidencial();
            return;
        }

        const fs = this.obterSistemaArquivos();
        if (!fs[chavePasta]) return;

        if (registrarHistorico && chavePasta !== this.pastaAtual) {
            this.historicoPastas = this.historicoPastas.slice(0, this.indiceHistorico + 1);
            this.historicoPastas.push(chavePasta);
            this.indiceHistorico = this.historicoPastas.length - 1;
        }

        this.pastaAtual = chavePasta;
        this.itemExploradorSelecionado = null;
        this.renderizarExplorador();
    },

    voltarPasta() {
        if (this.indiceHistorico > 0) {
            this.indiceHistorico--;
            this.pastaAtual = this.historicoPastas[this.indiceHistorico];
            this.itemExploradorSelecionado = null;
            this.renderizarExplorador();
            AudioManager.play('click');
        }
    },

    avancarPasta() {
        if (this.indiceHistorico < this.historicoPastas.length - 1) {
            this.indiceHistorico++;
            this.pastaAtual = this.historicoPastas[this.indiceHistorico];
            this.itemExploradorSelecionado = null;
            this.renderizarExplorador();
            AudioManager.play('click');
        }
    },

    subirPasta() {
        const fs = this.obterSistemaArquivos();
        const pai = fs[this.pastaAtual]?.pai;
        if (pai) {
            this.navegarPasta(pai, true);
            AudioManager.play('click');
        }
    },

    renderizarExplorador() {
        const fs = this.obterSistemaArquivos();
        const pasta = fs[this.pastaAtual] || fs.root;

        const pathEl = document.getElementById('explorer-path-display');
        const mainEl = document.getElementById('explorer-main-grid');
        const backBtn = document.getElementById('explorer-back-btn');
        const fwdBtn = document.getElementById('explorer-fwd-btn');
        const upBtn = document.getElementById('explorer-up-btn');
        const openBtn = document.getElementById('explorer-open-btn');

        if (pathEl) pathEl.value = pasta.caminho;
        if (backBtn) backBtn.disabled = this.indiceHistorico <= 0;
        if (fwdBtn) fwdBtn.disabled = this.indiceHistorico >= this.historicoPastas.length - 1;
        if (upBtn) upBtn.disabled = !pasta.pai;
        if (openBtn) openBtn.disabled = !this.itemExploradorSelecionado;

        WindowManager.atualizarTituloJanela('arquivos-window', `${I18n.t('APP_EXPLORER')} - ${pasta.caminho}`);

        // Atualiza destaque na árvore lateral
        document.querySelectorAll('[data-folder-nav]').forEach(el => {
            el.classList.toggle('active-tree-item', el.getAttribute('data-folder-nav') === this.pastaAtual);
        });

        if (!mainEl) return;
        mainEl.innerHTML = '';

        pasta.itens.forEach(item => {
            const div = document.createElement('div');
            div.className = `file-item ${item.tipo === 'file' ? 'draggable-file' : ''}`;
            div.tabIndex = 0;
            div.setAttribute('role', 'button');

            if (item.tipo === 'file') {
                div.draggable = true;
                div.dataset.filename = item.nome;
                div.dataset.content = item.conteudo;
                div.title = `${item.nome} — ${I18n.t('EXPLORER_HINT')}`;
            } else {
                div.title = item.nome;
            }

            div.innerHTML = `
                <div class="icon-img ${item.icone} small" style="pointer-events: none;"></div>
                <span class="${item.tipo === 'restricted-folder' ? 'restricted-label' : ''}" style="pointer-events: none;">${item.nome}</span>
            `;

            const selecionar = () => {
                mainEl.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                this.itemExploradorSelecionado = item;
                if (openBtn) openBtn.disabled = false;
                this.atualizarBarraStatusExplorador(pasta.itens.length, item.nome);
            };

            const executarAcao = () => {
                if (item.tipo === 'folder' || item.tipo === 'restricted-folder') {
                    this.navegarPasta(item.destino, true);
                } else if (item.tipo === 'file') {
                    this.abrirTexto('notepad-window', item.nome, item.conteudo);
                    WindowManager.abrir('notepad-window');
                }
            };

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                selecionar();
            });

            div.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                executarAcao();
            });

            div.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selecionar();
                    executarAcao();
                }
            });

            mainEl.appendChild(div);
        });

        mainEl.onclick = () => {
            mainEl.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
            this.itemExploradorSelecionado = null;
            if (openBtn) openBtn.disabled = true;
            this.atualizarBarraStatusExplorador(pasta.itens.length, null);
        };

        this.atualizarBarraStatusExplorador(pasta.itens.length, null);
    },

    abrirSelecionadoExplorador() {
        const item = this.itemExploradorSelecionado;
        if (!item) return;
        if (item.tipo === 'folder' || item.tipo === 'restricted-folder') {
            this.navegarPasta(item.destino, true);
        } else if (item.tipo === 'file') {
            this.abrirTexto('notepad-window', item.nome, item.conteudo);
            WindowManager.abrir('notepad-window');
        }
    },

    atualizarBarraStatusExplorador(totalItens, nomeSelecionado) {
        const countEl = document.getElementById('explorer-status-count');
        const selEl = document.getElementById('explorer-status-selected');
        if (countEl) countEl.innerText = `${totalItens} ${I18n.t('EXPLORER_ITEMS_COUNT')}`;
        if (selEl) {
            selEl.innerText = nomeSelecionado
                ? `${I18n.t('EXPLORER_SELECTED')} ${nomeSelecionado}`
                : I18n.t('EXPLORER_NONE_SELECTED');
        }
    },

    abrirModalSenhaConfidencial() {
        if (GameState.arquivosDesbloqueados) {
            WindowManager.abrir('arquivos-window');
            this.navegarPasta('restricted', true);
            return;
        }

        const modal = document.getElementById('auth-modal');
        const input = document.getElementById('auth-password-input');
        const errorEl = document.getElementById('auth-error-text');
        if (modal) {
            modal.classList.remove('hidden');
            if (errorEl) errorEl.classList.add('hidden');
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 40);
            }
            AudioManager.play('click');
        }
    },

    fecharModalSenhaConfidencial() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.add('hidden');
    },

    confirmarSenhaConfidencial() {
        const input = document.getElementById('auth-password-input');
        const errorEl = document.getElementById('auth-error-text');
        const valor = input ? input.value.trim() : '';

        if (valor === '1987') {
            GameState.arquivosDesbloqueados = true;
            this.fecharModalSenhaConfidencial();
            const statusZ = document.getElementById('computer-z-status');
            if (statusZ) {
                statusZ.innerText = I18n.t('COMPUTER_NET_UNLOCKED');
                statusZ.style.color = '#1b7a2e';
            }
            WindowManager.abrir('arquivos-window');
            this.navegarPasta('restricted', true);
            AudioManager.play('startup');
        } else {
            if (errorEl) {
                errorEl.innerText = I18n.t('AUTH_ERROR_MSG');
                errorEl.classList.remove('hidden');
            }
            AudioManager.play('error');
        }
    },

    // ==========================================
    // CONFIGURAÇÕES (PAINEL DE CONTROLE)
    // ==========================================
    selecionarAbaConfig(aba) {
        this.abaConfigAtual = aba;
        document.querySelectorAll('[data-settings-tab]').forEach(li => {
            const ativo = li.getAttribute('data-settings-tab') === aba;
            li.classList.toggle('active', ativo);
            li.setAttribute('aria-selected', ativo ? 'true' : 'false');
        });
        document.querySelectorAll('[data-settings-panel]').forEach(panel => {
            panel.classList.toggle('hidden', panel.getAttribute('data-settings-panel') !== aba);
        });
        AudioManager.play('click');
    },

    sincronizarPainelConfiguracoes() {
        const wpAtual = Storage.obterWallpaper();
        const previewBox = document.getElementById('wallpaper-live-preview');
        if (previewBox) {
            previewBox.style.backgroundImage = `url('${wpAtual}')`;
        }

        document.querySelectorAll('.wallpaper-card').forEach(card => {
            const url = card.getAttribute('data-wp');
            const isAtivo = url === wpAtual;
            card.classList.toggle('active-wp', isAtivo);
            card.setAttribute('aria-pressed', isAtivo ? 'true' : 'false');
            const badge = card.querySelector('.wp-active-badge');
            if (badge) badge.classList.toggle('hidden', !isAtivo);
        });

        // Estados de Acessibilidade & Sessão
        const atualizarBotaoToggle = (idBtn, ativo) => {
            const btn = document.getElementById(idBtn);
            if (!btn) return;
            btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
            btn.classList.toggle('toggle-on', ativo);
            const pill = btn.querySelector('.state-pill');
            if (pill) pill.innerText = ativo ? I18n.t('SETTINGS_STATE_ON') : I18n.t('SETTINGS_STATE_OFF');
        };

        atualizarBotaoToggle('btn-toggle-hc', Storage.isHighContrast());
        atualizarBotaoToggle('btn-toggle-rm', Storage.isReducedMotion());
        atualizarBotaoToggle('btn-toggle-restore', Storage.isAutoRestoreWindows());

        // Estado de Áudio
        const audioState = AudioManager.obterEstado();
        atualizarBotaoToggle('btn-toggle-mute', audioState.mutado);

        const traySoundBtn = document.getElementById('tray-sound-btn');
        if (traySoundBtn) {
            traySoundBtn.innerText = audioState.mutado ? '🔇' : '🔊';
            traySoundBtn.title = audioState.mutado ? 'Áudio Silenciado (Clique para ativar)' : 'Áudio Ativo (Clique para silenciar)';
        }

        const syncSlider = (sliderId, labelId, val) => {
            const slider = document.getElementById(sliderId);
            const label = document.getElementById(labelId);
            const pct = Math.round(val * 100);
            if (slider) slider.value = String(pct);
            if (label) label.innerText = `${pct}%`;
        };

        syncSlider('slider-vol-ambient', 'val-vol-ambient', audioState.volAmbiente);
        syncSlider('slider-vol-sfx', 'val-vol-sfx', audioState.volEfeitos);
        syncSlider('slider-vol-jumpscare', 'val-vol-jumpscare', audioState.volSustos);

        // Estado de Idioma
        const idioma = I18n.getIdioma();
        document.querySelectorAll('[data-lang-btn]').forEach(btn => {
            const isAtivo = btn.getAttribute('data-lang-btn') === idioma;
            btn.classList.toggle('toggle-on', isAtivo);
            btn.setAttribute('aria-pressed', isAtivo ? 'true' : 'false');
            const badge = btn.querySelector('.state-pill');
            if (badge) badge.innerText = isAtivo ? I18n.t('SETTINGS_ACTIVE_BADGE') : '';
        });
    },

    bloquearEstacao() {
        const loginScreen = document.getElementById('start-screen');
        const roleText = document.getElementById('login-role-text');
        const loginBtn = document.querySelector('.login-submit-btn');

        window.toggleStartMenu(false);
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
            loginScreen.style.opacity = '1';
            loginScreen.dataset.locked = 'true';
        }
        if (roleText) {
            roleText.innerText = I18n.t('LOGIN_LOCKED_STATUS');
        }
        if (loginBtn) {
            loginBtn.title = I18n.t('LOGIN_UNLOCK_BTN');
            setTimeout(() => loginBtn.focus(), 50);
        }
        AudioManager.play('click');
    },

    configurarOuvintesDoJogo() {
        document.addEventListener('game:start', () => {
            this.atualizarModoRelogio(true);
        });

        document.addEventListener('game:timeUpdate', (e) => {
            const clockEl = document.getElementById('clock');
            if (clockEl) {
                const horaMostrar = e.detail.hora === 0 ? 12 : e.detail.hora;
                clockEl.innerText = `${horaMostrar}:00 AM`;
            }
            this.atualizarModoRelogio(true);
        });

        document.addEventListener('game:powerUpdate', (e) => {
            this.atualizarPainelEnergia(e.detail);
        });

        document.addEventListener('game:entityMove', (e) => {
            this.atualizarPainelRede(e.detail.posicao);
        });

        document.addEventListener('game:newEmail', (e) => {
            this.adicionarEmailNaLista(e.detail);
        });

        document.addEventListener('game:blackout', () => {
            AudioManager.pararAmbiente();
            AudioManager.play('error');
            const blackout = document.getElementById('blackout-overlay');
            if (blackout) blackout.classList.remove('hidden');
        });

        document.addEventListener('game:jumpscare', () => {
            AudioManager.pararAmbiente();
            AudioManager.play('jumpscare');
            const jumpscare = document.getElementById('jumpscare-overlay');
            if (jumpscare) jumpscare.classList.remove('hidden');
        });

        document.addEventListener('game:win', () => {
            AudioManager.pararAmbiente();
            AudioManager.play('startup');
            const winOverlay = document.getElementById('win-overlay');
            if (winOverlay) winOverlay.classList.remove('hidden');
        });

        document.addEventListener('game:event', (e) => {
            if (e.detail.tipo === 'cat_glitch') {
                WindowManager.abrir('cat-window');
                if (window.glitchCatHelper) window.glitchCatHelper();
            }
        });

        document.addEventListener('settings:updated', () => {
            this.sincronizarPainelConfiguracoes();
        });

        document.addEventListener('audio:updated', () => {
            this.sincronizarPainelConfiguracoes();
        });

        document.addEventListener('i18n:changed', () => {
            this.atualizarModoRelogio(GameState.noiteAtiva);
            this.atualizarPainelEnergia();
            this.atualizarPainelRede(GameState.posicaoEntidade);
            this.atualizarTutorial();
            this.renderizarListaMenuIniciar(document.getElementById('start-search-input')?.value || '');
            this.renderizarExplorador();
            this.renderizarEmails();
            this.atualizarStatusNotepad();
            this.atualizarJanelaLixeira();
            this.sincronizarPainelConfiguracoes();
        });
    }
};
