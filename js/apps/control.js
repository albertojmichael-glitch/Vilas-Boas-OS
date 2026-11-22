// Painel de Controle.
import { $, $$, html, esc, formatSize } from '../core/util.js';
import { Settings, GLASS_COLORS, WALLPAPERS, now } from '../core/settings.js';
import { FS } from '../core/fs.js';
import { Sound } from '../core/sound.js';
import { ico, AVATARS, avatarSrc } from '../core/icons.js';
import { WM } from '../wm.js';
import { messageBox, uac, errorBox, inputBox, confirmBox } from '../ui/dialogs.js';
import { openFileDialog, IMAGE_FILTERS } from '../ui/filedialog.js';
import { APPS, launch } from './registry.js';
import { Screensaver } from '../shell/screensaver.js';

const CATS = [
    { id: 'system-cat', icon: 'computer', title: 'Sistema e Manutenção', links: [['Introdução ao Vilas Boas OS', 'welcome'], ['Exibir informações básicas do computador', 'system']] },
    { id: 'security', icon: 'security', title: 'Segurança', links: [['Verificar o status de segurança do computador', 'security'], ['Alterar configurações do Controle de Conta de Usuário', 'security']] },
    { id: 'network', icon: 'network', title: 'Rede e Internet', links: [['Exibir status e tarefas da rede', 'network'], ['Configurar compartilhamento de arquivos', 'network']] },
    { id: 'hardware', icon: 'sound', title: 'Hardware e Sons', links: [['Reproduzir CDs ou outras mídias automaticamente', 'sound'], ['Alterar o volume do sistema', 'sound']] },
    { id: 'programs', icon: 'programs', title: 'Programas', links: [['Desinstalar um programa', 'programs'], ['Alterar programas de inicialização', 'programs']] },
    { id: 'users', icon: 'users', title: 'Contas de Usuário', links: [['Alterar a imagem da conta', 'users-picture'], ['Criar uma senha para sua conta', 'users-password']] },
    { id: 'appearance', icon: 'personalize', title: 'Aparência e Personalização', links: [['Alterar plano de fundo da área de trabalho', 'background'], ['Personalizar cores', 'color'], ['Ajustar a resolução da tela', 'display']] },
    { id: 'clock', icon: 'datetime', title: 'Relógio, Idioma e Região', links: [['Alterar teclados ou outros métodos de entrada', 'region'], ['Alterar idioma de exibição', 'region']] },
    { id: 'ease', icon: 'accessibility', title: 'Facilidade de Acesso', links: [['Permitir que o sistema sugira configurações', 'ease'], ['Otimizar exibição visual', 'ease']] },
    { id: 'more', icon: 'controlPanel', title: 'Opções Adicionais', links: [['Opções de Pasta', 'folderOptions'], ['Barra de Tarefas e Menu Iniciar', 'taskbar']] },
];

const CLASSIC = [
    ['personalize', 'Personalização', 'personalize'], ['users', 'Contas de Usuário', 'users'], ['datetime', 'Data e Hora', 'datetime'],
    ['system', 'Sistema', 'computer'], ['sound', 'Som', 'sound'], ['programs', 'Programas e Recursos', 'programs'],
    ['sidebar', 'Propriedades da Sidebar', 'sidebar'], ['ease', 'Central de Facilidade de Acesso', 'accessibility'], ['folderOptions', 'Opções de Pasta', 'folderOptions'],
    ['taskbar', 'Barra de Tarefas e Menu Iniciar', 'taskbarSettings'], ['network', 'Central de Rede e Compartilhamento', 'network'], ['security', 'Central de Segurança', 'security'],
    ['screensaver', 'Proteção de Tela', 'screensaver'], ['welcome', 'Central de Boas-Vindas', 'welcome'], ['region', 'Opções Regionais e de Idioma', 'datetime'],
];

const TITLES = {
    home: 'Painel de Controle', classic: 'Painel de Controle', personalize: 'Personalização', color: 'Cor e Aparência da Janela',
    background: 'Plano de Fundo da Área de Trabalho', screensaver: 'Proteção de Tela', sound: 'Som', users: 'Contas de Usuário',
    'users-picture': 'Alterar Imagem', 'users-password': 'Criar Senha', 'users-name': 'Alterar Nome', datetime: 'Data e Hora', system: 'Sistema',
    programs: 'Programas e Recursos', folderOptions: 'Opções de Pasta', taskbar: 'Barra de Tarefas e Menu Iniciar', sidebar: 'Propriedades da Sidebar',
    network: 'Central de Rede e Compartilhamento', ease: 'Central de Facilidade de Acesso', security: 'Central de Segurança', display: 'Configurações de Vídeo', region: 'Opções Regionais e de Idioma',
    'system-cat': 'Sistema e Manutenção', hardware: 'Hardware e Sons', appearance: 'Aparência e Personalização', clock: 'Relógio, Idioma e Região', more: 'Opções Adicionais',
};
const PARENT = {
    personalize: 'appearance', color: 'personalize', background: 'personalize', screensaver: 'personalize', display: 'personalize', sound: 'hardware',
    users: 'home', 'users-picture': 'users', 'users-password': 'users', 'users-name': 'users', datetime: 'clock', region: 'clock', system: 'system-cat',
    programs: 'home', folderOptions: 'appearance', taskbar: 'appearance', sidebar: 'appearance', network: 'home', ease: 'home', security: 'home',
    'system-cat': 'home', hardware: 'home', appearance: 'home', clock: 'home', more: 'home', classic: null, home: null,
};

export function open({ page = 'home' } = {}) {
    const existing = WM.findApp('control');
    if (existing) { existing.focus(); existing.go(page); return existing; }
    const cp = new ControlPanel(page);
    return cp.win;
}

class ControlPanel {
    constructor(page) {
        this.page = null;
        this.history = []; this.future = [];
        this.cleanup = [];
        this.glass = html(`<div class="ex-nav">
            <div class="ex-backfwd"><button class="nav-round ex-back" data-tip="Voltar" disabled><i></i></button><button class="nav-round small ex-fwd" data-tip="Avançar" disabled><i></i></button></div>
            <div class="ex-address no-drag"><span class="ex-addr-ico">${ico('controlPanel', 16)}</span><div class="ex-crumbs"></div><button class="ex-refresh" data-tip="Atualizar"><i></i></button></div>
            <div class="ex-search no-drag"><input placeholder="Pesquisar" spellcheck="false"><button class="ex-search-btn"><i></i></button></div>
        </div>`);
        this.body = html(`<div class="cp"><div class="cp-side"></div><div class="cp-main"></div></div>`);
        this.win = WM.open({ app: 'control', title: 'Painel de Controle', icon: 'controlPanel', width: 820, height: 560, minW: 520, minH: 360, content: this.body, glass: this.glass, hideTitle: true, cls: 'cp-win' });
        this.win.go = p => this.go(p);
        this.main = $('.cp-main', this.body);
        this.side = $('.cp-side', this.body);
        $('.ex-back', this.glass).addEventListener('click', () => { if (this.history.length) { this.future.push(this.page); this.go(this.history.pop(), true); } });
        $('.ex-fwd', this.glass).addEventListener('click', () => { if (this.future.length) { this.history.push(this.page); this.go(this.future.pop(), true); } });
        $('.ex-refresh', this.glass).addEventListener('click', () => this.go(this.page, true));
        $('.ex-crumbs', this.glass).addEventListener('click', e => { const c = e.target.closest('.crumb'); if (c) this.go(c.dataset.id); });
        const s = $('.ex-search input', this.glass);
        s.addEventListener('input', () => this.search(s.value));
        s.addEventListener('keydown', e => e.stopPropagation());
        this.body.addEventListener('click', e => {
            const a = e.target.closest('[data-go]');
            if (a) { e.preventDefault(); this.go(a.dataset.go); }
            const l = e.target.closest('[data-launch]');
            if (l) launch(l.dataset.launch);
        });
        this.win.onClose(() => this.cleanup.forEach(f => f()));
        this.go(page, true);
    }

    go(page, noHist = false) {
        if (page === 'welcome') { launch('welcome'); return; }
        if (!TITLES[page]) page = 'home';
        if (!noHist && this.page && this.page !== page) { this.history.push(this.page); this.future = []; }
        this.cleanup.forEach(f => f()); this.cleanup = [];
        this.page = page;
        const title = TITLES[page];
        this.win.setTitle(title);
        const chain = [];
        let p = page;
        while (p) { chain.unshift(p); p = PARENT[p]; }
        if (chain[0] !== 'home' && page !== 'classic') chain.unshift('home');
        $('.ex-crumbs', this.glass).innerHTML = chain.map(id => `<span class="crumb" data-id="${id}">${esc(TITLES[id])}</span>`).join('<span class="crumb-chev">▸</span>');
        $('.ex-back', this.glass).disabled = !this.history.length;
        $('.ex-fwd', this.glass).disabled = !this.future.length;
        this.main.scrollTop = 0;
        const fn = this['p_' + page.replace(/-/g, '_')] || this.p_category;
        this.side.innerHTML = '';
        this.main.innerHTML = '';
        fn.call(this, page);
        Sound.play('navigate');
    }

    sideLinks(title, links, extra = '') {
        this.side.innerHTML = `${title ? `<div class="cp-side-title">${esc(title)}</div>` : ''}${links.map(([label, page, icon]) => `<a class="cp-side-link" ${page.startsWith('app:') ? `data-launch="${page.slice(4)}"` : `data-go="${page}"`}>${icon ? ico(icon, 16) : ''}<span>${esc(label)}</span></a>`).join('')}${extra}`;
    }

    header(text, sub = '') { return `<h1 class="cp-h1">${esc(text)}</h1>${sub ? `<p class="cp-sub">${esc(sub)}</p>` : ''}`; }

    buttons(onOk, onCancel, okLabel = 'OK') {
        const el = html(`<div class="cp-buttons"><button class="btn default" data-ok>${okLabel}</button><button class="btn" data-cancel>Cancelar</button></div>`);
        $('[data-ok]', el).addEventListener('click', onOk);
        $('[data-cancel]', el).addEventListener('click', onCancel || (() => this.goBack()));
        return el;
    }
    goBack() { if (this.history.length) { this.future = []; this.go(this.history.pop(), true); } else this.go('home', true); }

    search(q) {
        q = q.trim().toLowerCase();
        if (!q) { this.go(this.page, true); return; }
        const hits = Object.entries(TITLES).filter(([id, t]) => t.toLowerCase().includes(q) && !['home', 'classic'].includes(id));
        const links = CATS.flatMap(c => c.links).filter(([l]) => l.toLowerCase().includes(q));
        this.main.innerHTML = this.header(`Resultados para "${q}"`) + `<div class="cp-results">${hits.map(([id, t]) => `<a class="cp-result" data-go="${id}">${esc(t)}</a>`).join('')}${links.map(([l, p]) => `<a class="cp-result" data-go="${p}">${esc(l)}</a>`).join('')}${!hits.length && !links.length ? '<p class="cp-sub">Nenhum item encontrado.</p>' : ''}</div>`;
    }

    /* ---------- Pages ---------- */
    p_home() {
        this.sideLinks('', [['Página Inicial do Painel de Controle', 'home'], ['Modo de Exibição Clássico', 'classic']]);
        $('.cp-side-link', this.side).classList.add('current');
        this.main.innerHTML = `<div class="cp-cats">${CATS.map(c => `<div class="cp-cat">${ico(c.icon, 48)}<div><a class="cp-cat-title" data-go="${c.id === 'users' ? 'users' : c.id === 'network' ? 'network' : c.id === 'security' ? 'security' : c.id === 'programs' ? 'programs' : c.id === 'ease' ? 'ease' : c.id}">${esc(c.title)}</a>
            ${c.links.map(([l, p]) => `<a class="cp-cat-link" data-go="${p}">${esc(l)}</a>`).join('')}</div></div>`).join('')}</div>`;
    }

    p_classic() {
        this.sideLinks('', [['Página Inicial do Painel de Controle', 'home'], ['Modo de Exibição Clássico', 'classic']]);
        $$('.cp-side-link', this.side)[1].classList.add('current');
        this.main.innerHTML = `<div class="cp-classic">${CLASSIC.slice().sort((a, b) => a[1].localeCompare(b[1])).map(([p, l, i]) => `<a class="cp-classic-item sel-item" data-go="${p}">${ico(i, 32)}<span>${esc(l)}</span></a>`).join('')}</div>`;
    }

    p_category(page) {
        const cat = CATS.find(c => c.id === page);
        this.sideLinks('', [['Página Inicial do Painel de Controle', 'home'], ['Modo de Exibição Clássico', 'classic']]);
        const groups = {
            appearance: [['personalize', 'Personalização', 'personalize', [['Alterar plano de fundo da área de trabalho', 'background'], ['Personalizar cores', 'color'], ['Alterar proteção de tela', 'screensaver']]],
                ['taskbar', 'Barra de Tarefas e Menu Iniciar', 'taskbarSettings', [['Personalizar o menu Iniciar', 'taskbar']]],
                ['sidebar', 'Windows Sidebar', 'sidebar', [['Adicionar gadgets à Sidebar', 'sidebar'], ['Mostrar ou ocultar a Sidebar', 'sidebar']]],
                ['folderOptions', 'Opções de Pasta', 'folderOptions', [['Mostrar arquivos e pastas ocultos', 'folderOptions'], ['Mostrar extensões de arquivo', 'folderOptions']]]],
            hardware: [['sound', 'Som', 'sound', [['Alterar o volume do sistema', 'sound'], ['Alterar sons do sistema', 'sound']]], ['display', 'Personalização', 'personalize', [['Ajustar a resolução da tela', 'display']]]],
            clock: [['datetime', 'Data e Hora', 'datetime', [['Definir a hora e a data', 'datetime'], ['Alterar o formato da hora', 'datetime']]], ['region', 'Opções Regionais e de Idioma', 'datetime', [['Alterar o formato de data, hora ou número', 'region']]]],
            'system-cat': [['welcome', 'Central de Boas-Vindas', 'welcome', [['Introdução ao Vilas Boas OS', 'welcome']]], ['system', 'Sistema', 'computer', [['Exibir a quantidade de memória RAM e a velocidade do processador', 'system'], ['Verificar o índice de experiência', 'system']]]],
            more: [['folderOptions', 'Opções de Pasta', 'folderOptions', []], ['taskbar', 'Barra de Tarefas e Menu Iniciar', 'taskbarSettings', []]],
        }[page] || [];
        this.main.innerHTML = this.header(cat?.title || TITLES[page]) + `<div class="cp-tasks">${groups.map(([p, t, i, links]) => `<div class="cp-task">${ico(i, 48)}<div><a class="cp-cat-title" data-go="${p}">${esc(t)}</a>${links.map(([l, lp]) => `<a class="cp-cat-link" data-go="${lp}">${esc(l)}</a>`).join('')}</div></div>`).join('')}</div>`;
    }

    p_personalize() {
        this.sideLinks('Tarefas', [['Alterar ícones da área de trabalho', 'background'], ['Ajustar tamanho da fonte (DPI)', 'display']],
            `<div class="cp-side-seealso"><div class="cp-side-title">Consulte também</div><a class="cp-side-link" data-go="taskbar"><span>Barra de Tarefas e Menu Iniciar</span></a><a class="cp-side-link" data-go="ease"><span>Facilidade de Acesso</span></a></div>`);
        const items = [
            ['color', 'personalize', 'Cor e Aparência da Janela', 'Ajuste a cor e o estilo das janelas. Escolha cores diferentes e controle a transparência.'],
            ['background', 'personalize', 'Plano de Fundo da Área de Trabalho', 'Escolha entre os planos de fundo disponíveis ou use uma de suas próprias imagens.'],
            ['screensaver', 'screensaver', 'Proteção de Tela', 'Altere a proteção de tela ou ajuste quando ela será exibida.'],
            ['sound', 'sound', 'Sons', 'Altere o volume e teste os sons reproduzidos em eventos do sistema.'],
            ['sidebar', 'sidebar', 'Sidebar e Gadgets', 'Mostre ou oculte a Sidebar e seus gadgets de relógio, calendário e desempenho.'],
            ['display', 'computer', 'Configurações de Vídeo', 'Veja a resolução atual da tela e o tamanho dos ícones.'],
        ];
        this.main.innerHTML = this.header('Personalize a aparência e os sons') + `<div class="cp-pers">${items.map(([p, i, t, d]) => `<div class="cp-pers-item">${ico(i, 32)}<div><a class="cp-pers-title" data-go="${p}">${esc(t)}</a><div class="cp-pers-desc">${esc(d)}</div></div></div>`).join('')}</div>`;
    }

    p_color() {
        const orig = { glassColor: Settings.get('glassColor'), glassIntensity: Settings.get('glassIntensity'), transparency: Settings.get('transparency') };
        let saved = false;
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Cor e Aparência da Janela', 'Você pode alterar a cor das janelas, do menu Iniciar e da barra de tarefas. Escolha uma das cores disponíveis ou crie sua própria cor usando o misturador.');
        const box = html(`<div class="cp-colors">
            <div class="cp-swatches">${GLASS_COLORS.map(c => `<button class="cp-swatch${c.id === orig.glassColor ? ' active' : ''}" data-c="${c.id}" data-tip="${esc(c.name)}"><span style="background:linear-gradient(135deg, rgba(255,255,255,.7), rgba(255,255,255,0) 50%), rgb(${c.rgb.join(',')})"></span></button>`).join('')}</div>
            <label class="check"><input type="checkbox" class="cp-transp" ${orig.transparency ? 'checked' : ''}> Habilitar transparência</label>
            <div class="cp-slider-row"><span>Intensidade da cor:</span><input type="range" min="0" max="100" class="cp-int" value="${orig.glassIntensity}"></div>
            <div class="cp-preview"><div class="cp-preview-win"><div class="cp-preview-title">Janela Ativa</div><div class="cp-preview-body">Texto da janela</div></div></div>
        </div>`);
        this.main.appendChild(box);
        box.addEventListener('click', e => {
            const s = e.target.closest('.cp-swatch');
            if (!s) return;
            $$('.cp-swatch', box).forEach(x => x.classList.toggle('active', x === s));
            Settings.set('glassColor', s.dataset.c);
        });
        $('.cp-transp', box).addEventListener('change', e => Settings.set('transparency', e.target.checked));
        $('.cp-int', box).addEventListener('input', e => Settings.set('glassIntensity', +e.target.value));
        this.main.appendChild(this.buttons(() => { saved = true; this.goBack(); }, () => { Settings.patch(orig); saved = true; this.goBack(); }));
        this.cleanup.push(() => { if (!saved) Settings.patch(orig); });
    }

    p_background() {
        const orig = { wallpaper: Settings.get('wallpaper'), wallpaperFit: Settings.get('wallpaperFit') };
        let saved = false;
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Escolha um plano de fundo para a área de trabalho', 'Clique em uma imagem para torná-la o plano de fundo da área de trabalho.');
        const pics = FS.search('home', '.').filter(n => FS.isImage(n)).filter(n => !WALLPAPERS.some(w => w.src === n.content)).slice(0, 12);
        const box = html(`<div class="cp-wall">
            <div class="cp-wall-group">Planos de Fundo do Vilas Boas OS</div>
            <div class="cp-wall-grid">${WALLPAPERS.map(w => `<button class="cp-wall-item${orig.wallpaper === w.id ? ' active' : ''}" data-w="${w.id}" data-tip="${esc(w.name)}"><span style="${w.src ? `background-image:url('${w.src}')` : `background:${w.color}`}"></span></button>`).join('')}</div>
            ${pics.length ? `<div class="cp-wall-group">Imagens</div><div class="cp-wall-grid">${pics.map(n => `<button class="cp-wall-item${orig.wallpaper === 'fs:' + n.id ? ' active' : ''}" data-w="fs:${n.id}" data-tip="${esc(n.name)}"><span style="background-image:url('${esc(n.content)}')"></span></button>`).join('')}</div>` : ''}
            <div class="cp-wall-foot">
                <button class="btn" data-browse>Procurar...</button>
                <span>Como a imagem deve ser posicionada?</span>
                <select class="textbox cp-fit"><option value="cover">Ajustar à tela</option><option value="contain">Proporcional</option><option value="tile">Lado a lado</option><option value="center">Centralizado</option></select>
            </div></div>`);
        this.main.appendChild(box);
        $('.cp-fit', box).value = orig.wallpaperFit;
        box.addEventListener('click', e => {
            const it = e.target.closest('.cp-wall-item');
            if (!it) return;
            $$('.cp-wall-item', box).forEach(x => x.classList.toggle('active', x === it));
            Settings.set('wallpaper', it.dataset.w);
        });
        $('.cp-fit', box).addEventListener('change', e => Settings.set('wallpaperFit', e.target.value));
        $('[data-browse]', box).addEventListener('click', async () => {
            const id = await openFileDialog({ parent: this.win, folder: 'pictures', filters: IMAGE_FILTERS });
            if (id) { Settings.set('wallpaper', 'fs:' + id); this.go('background', true); orig.keep = true; }
        });
        this.main.appendChild(this.buttons(() => { saved = true; this.goBack(); }, () => { Settings.patch({ wallpaper: orig.wallpaper, wallpaperFit: orig.wallpaperFit }); saved = true; this.goBack(); }));
        this.cleanup.push(() => { if (!saved && !orig.keep) Settings.patch({ wallpaper: orig.wallpaper, wallpaperFit: orig.wallpaperFit }); });
    }

    p_screensaver() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Proteção de Tela');
        const box = html(`<div class="cp-ss">
            <div class="cp-monitor"><div class="cp-monitor-screen"></div></div>
            <div class="group"><span class="group-title">Proteção de tela</span>
                <div class="cp-ss-row"><select class="textbox cp-ss-kind">${Screensaver.kinds.map(k => `<option value="${k.id}">${k.name}</option>`).join('')}</select><button class="btn" data-preview>Visualizar</button></div>
                <div class="cp-ss-row">Aguardar: <input type="number" min="1" max="120" class="textbox cp-ss-wait" style="width:60px"> minutos</div>
            </div></div>`);
        this.main.appendChild(box);
        const kind = $('.cp-ss-kind', box), wait = $('.cp-ss-wait', box), screen = $('.cp-monitor-screen', box);
        kind.value = Settings.get('screensaver'); wait.value = Settings.get('screensaverWait');
        const pv = () => Screensaver.preview(screen, kind.value);
        pv();
        kind.addEventListener('change', pv);
        $('[data-preview]', box).addEventListener('click', () => { Settings.set('screensaver', kind.value); Screensaver.test(); });
        this.main.appendChild(this.buttons(() => { Settings.patch({ screensaver: kind.value, screensaverWait: Math.max(1, +wait.value || 5) }); Screensaver.reset(); this.goBack(); }));
        this.cleanup.push(() => Screensaver.preview(document.createElement('div'), 'none'));
    }

    p_sound() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Som', 'Ajuste o volume e teste os sons do sistema.');
        const names = { startup: 'Inicialização do sistema', logon: 'Logon', logoff: 'Logoff', shutdown: 'Desligamento', error: 'Erro crítico', warning: 'Exclamação', info: 'Aviso', ding: 'Padrão', navigate: 'Iniciar navegação', recycle: 'Esvaziar Lixeira', uac: 'Controle de Conta de Usuário', notify: 'Notificação' };
        const box = html(`<div class="cp-sound">
            <div class="group"><span class="group-title">Volume</span>
                <div class="cp-slider-row">${ico('sound', 32)}<input type="range" min="0" max="100" class="cp-vol" value="${Settings.get('volume')}"><span class="cp-vol-val">${Settings.get('volume')}%</span></div>
                <label class="check"><input type="checkbox" class="cp-mute" ${Settings.get('muted') ? 'checked' : ''}> Sem som</label></div>
            <div class="group"><span class="group-title">Eventos de Programa</span>
                <div class="cp-events">${Object.entries(names).map(([k, l]) => `<div class="cp-event sel-item" data-s="${k}">${ico('sound', 16)}<span>${l}</span></div>`).join('')}</div>
                <button class="btn" data-test>▶ Testar</button></div></div>`);
        this.main.appendChild(box);
        let sel = 'ding';
        $('.cp-vol', box).addEventListener('input', e => { Settings.set('volume', +e.target.value); $('.cp-vol-val', box).textContent = e.target.value + '%'; });
        $('.cp-vol', box).addEventListener('change', () => Sound.play('ding'));
        $('.cp-mute', box).addEventListener('change', e => Settings.set('muted', e.target.checked));
        box.addEventListener('click', e => { const ev = e.target.closest('.cp-event'); if (ev) { sel = ev.dataset.s; $$('.cp-event', box).forEach(x => x.classList.toggle('selected', x === ev)); } });
        box.addEventListener('dblclick', e => { if (e.target.closest('.cp-event')) Sound.play(sel); });
        $('[data-test]', box).addEventListener('click', () => Sound.play(sel));
    }

    p_users() {
        this.sideLinks('Tarefas', [['Alterar nome da conta', 'users-name', 'users'], ['Gerenciar outra conta', 'users']]);
        const hasPw = !!Settings.get('password');
        this.main.innerHTML = this.header('Faça alterações em sua conta de usuário') + `<div class="cp-user">
            <div class="cp-user-links">
                <a class="cp-cat-link" data-go="users-password">${hasPw ? 'Alterar sua senha' : 'Criar uma senha para sua conta'}</a>
                ${hasPw ? '<a class="cp-cat-link" data-act="rmpw">Remover sua senha</a>' : ''}
                <a class="cp-cat-link" data-go="users-picture">Alterar sua imagem</a>
                <a class="cp-cat-link" data-go="users-name">Alterar o nome da conta</a>
                <a class="cp-cat-link" data-act="uacinfo">${ico('shield', 16)} Alterar configurações do Controle de Conta de Usuário</a>
                <a class="cp-cat-link" data-act="reset">Restaurar o Vilas Boas OS para as configurações originais</a>
            </div>
            <div class="cp-user-card"><div class="tile-frame small"><img src="${avatarSrc(Settings.get('avatar'))}" alt=""></div><div><b>${esc(Settings.get('userName'))}</b><br>Administrador<br>${hasPw ? 'Protegida por senha' : 'Sem senha'}</div></div>
        </div>`;
        this.main.addEventListener('click', this._userAct = async e => {
            const a = e.target.closest('[data-act]')?.dataset.act;
            if (a === 'rmpw') {
                if (await confirmBox('Tem certeza de que deseja remover a senha da sua conta?', { parent: this.win, title: 'Contas de Usuário' })) { Settings.patch({ password: '', passwordHint: '' }); this.go('users', true); }
            } else if (a === 'uacinfo') {
                const ok = await uac({ program: 'Configurações do Controle de Conta de Usuário' });
                if (ok) messageBox({ title: 'Controle de Conta de Usuário', icon: 'shield', text: 'O Controle de Conta de Usuário está ativado e ajudando a proteger o computador.', parent: this.win });
            } else if (a === 'reset') {
                const r = await messageBox({ title: 'Restaurar Sistema', icon: 'warning', instruction: 'Restaurar as configurações originais?', text: 'Todos os seus arquivos, configurações e personalizações serão apagados e o sistema será reiniciado.', buttons: ['Restaurar', 'Cancelar'], parent: this.win });
                if (r === 'Restaurar') { try { localStorage.clear(); } catch { /* ignore */ } location.reload(); }
            }
        });
        this.cleanup.push(() => this.main.removeEventListener('click', this._userAct));
    }

    p_users_picture() {
        this.sideLinks('', []);
        let pick = Settings.get('avatar');
        this.main.innerHTML = this.header('Escolha uma nova imagem para sua conta', 'A imagem escolhida aparecerá na tela de Boas-Vindas e no menu Iniciar.');
        const box = html(`<div class="cp-avatars">
            <div class="cp-user-card"><div class="tile-frame small"><img class="cp-av-preview" src="${avatarSrc(pick)}" alt=""></div><b>${esc(Settings.get('userName'))}</b></div>
            <div class="cp-av-grid">${Object.keys(AVATARS).map(k => `<button class="cp-av${k === pick ? ' active' : ''}" data-a="${k}"><img src="${AVATARS[k]}" alt=""></button>`).join('')}</div>
            <a class="link" data-browse>Procurar mais imagens...</a></div>`);
        this.main.appendChild(box);
        box.addEventListener('click', async e => {
            const b = e.target.closest('.cp-av');
            if (b) { pick = b.dataset.a; $$('.cp-av', box).forEach(x => x.classList.toggle('active', x === b)); $('.cp-av-preview', box).src = avatarSrc(pick); }
            if (e.target.closest('[data-browse]')) {
                const id = await openFileDialog({ parent: this.win, folder: 'pictures', filters: IMAGE_FILTERS });
                if (id) {
                    const img = new Image();
                    img.onload = () => {
                        const c = document.createElement('canvas'); c.width = c.height = 128;
                        const x = c.getContext('2d'); const s = Math.max(128 / img.width, 128 / img.height);
                        x.drawImage(img, (128 - img.width * s) / 2, (128 - img.height * s) / 2, img.width * s, img.height * s);
                        pick = c.toDataURL('image/jpeg', .85); $('.cp-av-preview', box).src = pick;
                        $$('.cp-av', box).forEach(x2 => x2.classList.remove('active'));
                    };
                    img.src = FS.get(id).content;
                }
            }
        });
        this.main.appendChild(this.buttons(() => { Settings.set('avatar', pick); this.go('users'); }, null, 'Alterar Imagem'));
    }

    p_users_password() {
        this.sideLinks('', []);
        const hasPw = !!Settings.get('password');
        this.main.innerHTML = this.header(hasPw ? 'Alterar sua senha' : 'Criar uma senha para sua conta');
        const box = html(`<div class="cp-form">
            <div class="cp-user-card"><div class="tile-frame small"><img src="${avatarSrc(Settings.get('avatar'))}" alt=""></div><div><b>${esc(Settings.get('userName'))}</b><br>Administrador</div></div>
            ${hasPw ? '<input type="password" class="textbox" data-f="old" placeholder="Senha atual">' : ''}
            <input type="password" class="textbox" data-f="new" placeholder="Nova senha">
            <input type="password" class="textbox" data-f="conf" placeholder="Confirmar nova senha">
            <p class="cp-sub">Se a senha contiver letras maiúsculas, elas deverão ser digitadas da mesma forma sempre que você fizer logon.</p>
            <input class="textbox" data-f="hint" placeholder="Digite uma dica de senha" value="${esc(Settings.get('passwordHint'))}">
            <p class="cp-sub">A dica de senha ficará visível para todos que usarem este computador.</p></div>`);
        this.main.appendChild(box);
        const f = k => $(`[data-f="${k}"]`, box)?.value ?? '';
        this.main.appendChild(this.buttons(async () => {
            if (hasPw && f('old') !== Settings.get('password')) return errorBox('A senha atual está incorreta.', { parent: this.win, title: 'Contas de Usuário' });
            if (!f('new')) return errorBox('Digite uma senha.', { parent: this.win, title: 'Contas de Usuário' });
            if (f('new') !== f('conf')) return errorBox('As senhas digitadas não coincidem. Digite novamente a senha nas duas caixas.', { parent: this.win, title: 'Contas de Usuário' });
            if (f('hint') && f('hint').toLowerCase().includes(f('new').toLowerCase())) return errorBox('A dica de senha não pode conter a senha.', { parent: this.win, title: 'Contas de Usuário' });
            Settings.patch({ password: f('new'), passwordHint: f('hint') });
            this.go('users');
        }, null, hasPw ? 'Alterar senha' : 'Criar senha'));
        setTimeout(() => $('input', box)?.focus(), 50);
    }

    p_users_name() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Digite um novo nome de conta', 'Este nome aparecerá na tela de Boas-Vindas e no menu Iniciar.');
        const box = html(`<div class="cp-form"><input class="textbox" maxlength="20" value="${esc(Settings.get('userName'))}" style="width:260px"></div>`);
        this.main.appendChild(box);
        const input = $('input', box);
        setTimeout(() => { input.focus(); input.select(); }, 50);
        this.main.appendChild(this.buttons(() => {
            const v = input.value.trim();
            if (!v || /[\\/:*?"<>|]/.test(v)) return errorBox('Nome de usuário inválido.', { parent: this.win, title: 'Contas de Usuário' });
            Settings.set('userName', v);
            this.go('users');
        }, null, 'Alterar Nome'));
    }

    p_datetime() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Data e Hora');
        const box = html(`<div class="cp-dt">
            <div class="cp-dt-clock"><canvas></canvas></div>
            <div class="cp-dt-info">
                <div class="cp-dt-date"></div><div class="cp-dt-time"></div>
                <button class="btn" data-change>${ico('shield', 16)} Alterar data e hora...</button>
                <div class="group"><span class="group-title">Fuso horário</span>${esc(Intl.DateTimeFormat().resolvedOptions().timeZone)}</div>
                <label class="check"><input type="checkbox" class="cp-24" ${Settings.get('hour24') ? 'checked' : ''}> Usar formato de 24 horas</label>
                <a class="link" data-sync>Sincronizar com o relógio da Internet</a>
            </div></div>`);
        this.main.appendChild(box);
        const canvas = $('canvas', box);
        let raf;
        import('../shell/taskbar.js').then(({ drawClockFace }) => {
            const tick = () => {
                if (!document.contains(canvas)) return;
                const d = now();
                drawClockFace(canvas, d, { size: 150 });
                $('.cp-dt-date', box).textContent = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                $('.cp-dt-time', box).textContent = d.toLocaleTimeString('pt-BR', { hour12: !Settings.get('hour24') });
                raf = requestAnimationFrame(tick);
            };
            tick();
        });
        this.cleanup.push(() => cancelAnimationFrame(raf));
        $('.cp-24', box).addEventListener('change', e => Settings.set('hour24', e.target.checked));
        $('[data-sync]', box).addEventListener('click', () => { Settings.set('timeOffset', 0); messageBox({ title: 'Data e Hora', icon: 'info', text: 'O relógio foi sincronizado com êxito.', parent: this.win }); });
        $('[data-change]', box).addEventListener('click', async () => {
            if (!(await uac({ program: 'Data e Hora' }))) return;
            const d = now();
            const pad = n => String(n).padStart(2, '0');
            const b = html(`<div class="msgbox"><div class="msg-main" style="flex-direction:column;gap:10px">
                <label>Data: <input type="date" class="textbox dt-d" value="${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}"></label>
                <label>Hora: <input type="time" step="1" class="textbox dt-t" value="${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}"></label></div>
                <div class="msg-buttons"><button class="btn default" data-ok>OK</button><button class="btn" data-c>Cancelar</button></div></div>`);
            const w = WM.open({ title: 'Configurações de Data e Hora', dialog: true, parent: this.win, content: b, width: 300, height: 190, resizable: false });
            $('[data-ok]', b).addEventListener('click', () => {
                const target = new Date(`${$('.dt-d', b).value}T${$('.dt-t', b).value || '00:00:00'}`);
                if (!isNaN(target)) Settings.set('timeOffset', target.getTime() - Date.now());
                w.close();
            });
            $('[data-c]', b).addEventListener('click', () => w.close());
        });
    }

    p_system() {
        this.sideLinks('Tarefas', [['Gerenciador de Dispositivos', 'app:taskmgr', 'shield'], ['Configurações remotas', 'security', 'shield'], ['Proteção do sistema', 'security', 'shield'], ['Configurações avançadas do sistema', 'system', 'shield']]);
        const cores = navigator.hardwareConcurrency || 2;
        const mem = navigator.deviceMemory ? `${navigator.deviceMemory},00 GB` : '4,00 GB';
        const ua = navigator.userAgent;
        const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : /Chrome\//.test(ua) ? 'Google Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
        const score = Math.min(5.9, 3.0 + cores * 0.25 + (navigator.deviceMemory || 4) * 0.1).toFixed(1).replace('.', ',');
        this.main.innerHTML = this.header('Exibir informações básicas sobre o computador') + `<div class="cp-sys">
            <div class="cp-sys-sec">Edição do Vilas Boas OS</div>
            <div class="cp-sys-row"><div>Vilas Boas OS Vista Ultimate<br>Copyright © 2006 Vilas Boas Corporation. Todos os direitos reservados.<br>Service Pack 2</div><div class="cp-sys-logo"><span class="brand-orb big"></span></div></div>
            <div class="cp-sys-sec">Sistema</div>
            <div class="cp-kv">
                <span>Classificação:</span><span><span class="wei">${score}</span> <a class="link">Índice de Experiência do Vilas Boas OS</a></span>
                <span>Processador:</span><span>${cores} núcleo(s) lógico(s) — executando em ${esc(browser)}</span>
                <span>Memória (RAM):</span><span>${mem}</span>
                <span>Tipo de sistema:</span><span>Sistema Operacional de ${/64|x86_64|Win64/.test(ua) ? '64' : '32'} Bits</span>
                <span>Armazenamento:</span><span>${formatSize(FS.usedBytes())} usados de 5 MB (armazenamento do navegador)</span>
                <span>Resolução:</span><span>${screen.width} x ${screen.height} (janela: ${window.innerWidth} x ${window.innerHeight})</span>
            </div>
            <div class="cp-sys-sec">Configurações de nome de computador, domínio e grupo de trabalho</div>
            <div class="cp-kv">
                <span>Nome do computador:</span><span>${esc(Settings.get('computerName'))} <a class="link" data-rename>Alterar configurações</a></span>
                <span>Grupo de trabalho:</span><span>WORKGROUP</span>
            </div>
            <div class="cp-sys-sec">Ativação do Vilas Boas OS</div>
            <div class="cp-kv"><span>${ico('shield', 16)}</span><span>O Vilas Boas OS está ativado</span></div>
        </div>`;
        $('[data-rename]', this.main).addEventListener('click', async () => {
            if (!(await uac({ program: 'Propriedades do Sistema' }))) return;
            const v = await inputBox({ title: 'Nome do Computador', label: 'Nome do computador:', value: Settings.get('computerName'), parent: this.win });
            if (v && /^[A-Za-z0-9-]{1,15}$/.test(v.trim())) { Settings.set('computerName', v.trim().toUpperCase()); this.go('system', true); }
            else if (v != null) errorBox('O nome do computador deve ter até 15 caracteres (letras, números e hífens).', { parent: this.win });
        });
    }

    p_programs() {
        this.sideLinks('Tarefas', [['Exibir atualizações instaladas', 'programs'], ['Ativar ou desativar recursos', 'programs', 'shield']]);
        const list = Object.entries(APPS).filter(([, a]) => !a.hidden);
        this.main.innerHTML = this.header('Desinstalar ou alterar um programa', 'Para desinstalar um programa, selecione-o na lista e clique em Desinstalar.') + `<div class="cp-progs">
            <div class="tm-head"><span style="flex:1">Nome</span><span style="width:200px">Editor</span><span style="width:110px">Instalado em</span></div>
            ${list.map(([id, a]) => `<div class="cp-prog sel-item" data-id="${id}"><span style="flex:1;display:flex;gap:6px;align-items:center">${ico(a.icon, 16)}${esc(a.name)}</span><span style="width:200px">Vilas Boas Corporation</span><span style="width:110px">22/11/2026</span></div>`).join('')}</div>
            <div class="cp-buttons left"><button class="btn" data-open disabled>Abrir</button><button class="btn" data-un disabled>Desinstalar</button></div>`;
        let sel = null;
        const box = $('.cp-progs', this.main);
        box.addEventListener('click', e => { const r = e.target.closest('.cp-prog'); if (!r) return; sel = r.dataset.id; $$('.cp-prog', box).forEach(x => x.classList.toggle('selected', x === r)); $$('[data-open], [data-un]', this.main).forEach(b => b.disabled = false); });
        box.addEventListener('dblclick', e => { const r = e.target.closest('.cp-prog'); if (r) launch(r.dataset.id); });
        $('[data-open]', this.main).addEventListener('click', () => sel && launch(sel));
        $('[data-un]', this.main).addEventListener('click', () => sel && messageBox({ title: 'Programas e Recursos', icon: 'warning', instruction: `${APPS[sel].name} é um componente do Vilas Boas OS.`, text: 'Componentes do sistema não podem ser desinstalados.', parent: this.win }));
    }

    p_folderOptions() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Opções de Pasta');
        const box = html(`<div class="cp-form">
            <div class="group"><span class="group-title">Modo de Exibição</span>
                <label class="check"><input type="checkbox" data-k="showExtensions" ${Settings.get('showExtensions') ? 'checked' : ''}> Mostrar extensões dos tipos de arquivo conhecidos</label></div>
            <div class="group"><span class="group-title">Área de Trabalho</span>
                <label class="check"><input type="checkbox" data-k="showDesktopIcons" ${Settings.get('showDesktopIcons') ? 'checked' : ''}> Mostrar ícones da área de trabalho</label><br>
                <label class="check"><input type="checkbox" data-k="autoArrange" ${Settings.get('autoArrange') ? 'checked' : ''}> Organizar ícones automaticamente</label></div>
            <button class="btn" data-reset>Restaurar Padrões de Pasta</button></div>`);
        this.main.appendChild(box);
        box.addEventListener('change', e => { const k = e.target.dataset.k; if (k) Settings.set(k, e.target.checked); });
        $('[data-reset]', box).addEventListener('click', () => { Settings.patch({ showExtensions: false, folderViews: {}, showDesktopIcons: true, autoArrange: false }); this.go('folderOptions', true); });
    }

    p_taskbar() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Propriedades da Barra de Tarefas e do Menu Iniciar');
        const box = html(`<div class="cp-form">
            <div class="group"><span class="group-title">Aparência da barra de tarefas</span>
                <label class="check"><input type="checkbox" data-k="lockTaskbar" ${Settings.get('lockTaskbar') ? 'checked' : ''}> Bloquear a barra de tarefas</label><br>
                <label class="check"><input type="checkbox" data-k="showQuickLaunch" ${Settings.get('showQuickLaunch') ? 'checked' : ''}> Mostrar Inicialização Rápida</label><br>
                <label class="check"><input type="checkbox" data-k="hour24" ${Settings.get('hour24') ? 'checked' : ''}> Relógio no formato de 24 horas</label></div>
            <div class="group"><span class="group-title">Menu Iniciar</span>
                <button class="btn" data-clear>Limpar listas de itens recentes</button></div></div>`);
        this.main.appendChild(box);
        box.addEventListener('change', e => { const k = e.target.dataset.k; if (k) Settings.set(k, e.target.checked); });
        $('[data-clear]', box).addEventListener('click', () => { Settings.patch({ recentPrograms: [], recentDocs: [] }); messageBox({ title: 'Menu Iniciar', icon: 'info', text: 'As listas de itens recentes foram limpas.', parent: this.win }); });
    }

    p_sidebar() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Propriedades da Sidebar', 'A Sidebar exibe gadgets de relógio, calendário e desempenho na lateral da área de trabalho.');
        const box = html(`<div class="cp-form"><div class="group"><span class="group-title">Sidebar</span>
            <label class="check"><input type="checkbox" class="sb" ${Settings.get('sidebar') ? 'checked' : ''}> Mostrar a Sidebar</label></div>
            <div class="cp-gadgets">${[['datetime', 'Relógio'], ['datetime', 'Calendário'], ['taskmgr', 'Medidor de CPU']].map(([i, n]) => `<div class="cp-gadget">${ico(i, 48)}<span>${n}</span></div>`).join('')}</div></div>`);
        this.main.appendChild(box);
        $('.sb', box).addEventListener('change', e => Settings.set('sidebar', e.target.checked));
    }

    p_network() {
        this.sideLinks('Tarefas', [['Exibir computadores e dispositivos', 'app:network'], ['Gerenciar conexões de rede', 'network']]);
        const on = navigator.onLine;
        this.main.innerHTML = this.header('Central de Rede e Compartilhamento') + `<div class="cp-net">
            <div class="cp-net-map">${ico('computer', 48)}<span class="cp-net-line ${on ? '' : 'off'}"></span>${ico('network', 48)}<span class="cp-net-line ${on ? '' : 'off'}"></span>${ico('browser', 48)}</div>
            <div class="cp-net-labels"><span>${esc(Settings.get('computerName'))}<br>(Este computador)</span><span>Rede</span><span>Internet</span></div>
            <div class="group"><span class="group-title">Rede (Rede privada)</span><div class="cp-kv"><span>Acesso</span><span>${on ? 'Local e Internet' : 'Somente local'}</span><span>Conexão</span><span>Conexão Local</span></div></div></div>`;
    }

    p_ease() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Facilite o uso do computador');
        const box = html(`<div class="cp-form"><div class="group"><span class="group-title">Acesso rápido às ferramentas comuns</span>
            <label class="check"><input type="checkbox" data-k="reduceMotion" ${Settings.get('reduceMotion') ? 'checked' : ''}> Desativar todas as animações desnecessárias</label><br>
            <label class="check"><input type="checkbox" data-k="transparency" ${!Settings.get('transparency') ? 'checked' : ''} data-inv="1"> Desativar transparência</label><br>
            <label class="check"><input type="checkbox" data-k="muted" ${Settings.get('muted') ? 'checked' : ''}> Desativar todos os sons</label></div></div>`);
        this.main.appendChild(box);
        box.addEventListener('change', e => { const k = e.target.dataset.k; if (k) Settings.set(k, e.target.dataset.inv ? !e.target.checked : e.target.checked); });
    }

    p_security() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Central de Segurança') + `<div class="cp-sec">
            ${[['Firewall', 'Ativado'], ['Atualizações Automáticas', 'Ativado'], ['Proteção contra malware', 'Ativado'], ['Controle de Conta de Usuário', 'Ativado']].map(([n, s]) => `<div class="cp-sec-row"><span class="cp-sec-dot"></span><b>${n}</b><span class="cp-sec-state">${s}</span></div>`).join('')}</div>`;
    }

    p_display() {
        this.sideLinks('', []);
        this.main.innerHTML = this.header('Configurações de Vídeo') + `<div class="cp-form"><div class="cp-monitor"><div class="cp-monitor-screen" style="background:url('${(WALLPAPERS.find(w => w.id === Settings.get('wallpaper')) || WALLPAPERS[0]).src || ''}') center/cover"></div></div>
            <div class="cp-kv"><span>Resolução:</span><span>${window.innerWidth} x ${window.innerHeight} pixels</span><span>Cores:</span><span>Mais Alta (32 bits)</span></div>
            <p class="cp-sub">Dica: pressione F11 no navegador para usar o Vilas Boas OS em tela cheia.</p>
            <div class="group"><span class="group-title">Ícones da área de trabalho</span><select class="textbox ic">${[['large', 'Grandes'], ['medium', 'Médios'], ['classic', 'Clássicos']].map(([v, l]) => `<option value="${v}" ${Settings.get('desktopIconSize') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`;
        $('.ic', this.main).addEventListener('change', e => Settings.set('desktopIconSize', e.target.value));
    }

    p_region() {
        this.sideLinks('', []);
        const d = now();
        this.main.innerHTML = this.header('Opções Regionais e de Idioma') + `<div class="cp-kv">
            <span>Formato:</span><span>Português (Brasil)</span><span>Data abreviada:</span><span>${d.toLocaleDateString('pt-BR')}</span>
            <span>Data completa:</span><span>${d.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span><span>Hora:</span><span>${d.toLocaleTimeString('pt-BR')}</span>
            <span>Número:</span><span>${(123456789.12).toLocaleString('pt-BR')}</span><span>Moeda:</span><span>${(1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>`;
    }
}

