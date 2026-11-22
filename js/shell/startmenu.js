// The Start menu: pinned + recent programs, All Programs tree, instant search and power options.
import { $, $$, esc, html } from '../core/util.js';
import { Settings } from '../core/settings.js';
import { FS } from '../core/fs.js';
import { ico, avatarSrc, iconSrc } from '../core/icons.js';
import { showMenu, closeMenus } from '../ui/menu.js';
import { APPS, launch, openNode, nodeIcon, runCommand } from '../apps/registry.js';
import { Session } from './session.js';

let el, list, search, mode = 'home', isOpen = false;

const PINNED = [
    { app: 'browser', title: 'Internet', sub: 'Navegador Vilas Boas' },
    { app: 'mail', title: 'E-mail', sub: 'Vilas Mail' },
];

const TREE = [
    { app: 'browser' }, { app: 'mail' }, { app: 'photos' }, { app: 'welcome' },
    { folder: 'Acessórios', items: [
        { app: 'calculator' }, { app: 'notepad' }, { app: 'paint' }, { app: 'cmd' }, { app: 'run' }, { app: 'explorer', name: 'Windows Explorer' },
        { folder: 'Ferramentas do Sistema', items: [{ app: 'taskmgr' }, { app: 'control' }] },
    ] },
    { folder: 'Jogos', items: [{ app: 'mines' }, { app: 'gamesFolder', name: 'Explorador de Jogos' }] },
    { folder: 'Inicializar', items: [] },
    { folder: 'Manutenção', items: [{ app: 'help' }] },
];

const CONTROL_SHORTCUTS = [
    { name: 'Personalização', page: 'personalize', icon: 'personalize' },
    { name: 'Alterar plano de fundo da área de trabalho', page: 'background', icon: 'personalize' },
    { name: 'Cor e Aparência da Janela', page: 'color', icon: 'personalize' },
    { name: 'Contas de Usuário', page: 'users', icon: 'users' },
    { name: 'Data e Hora', page: 'datetime', icon: 'datetime' },
    { name: 'Som', page: 'sound', icon: 'sound' },
    { name: 'Sistema', page: 'system', icon: 'computer' },
    { name: 'Proteção de Tela', page: 'screensaver', icon: 'screensaver' },
    { name: 'Opções de Pasta', page: 'folderOptions', icon: 'folderOptions' },
    { name: 'Barra de Tarefas e Menu Iniciar', page: 'taskbar', icon: 'taskbarSettings' },
];

const RIGHT = [
    { id: 'home', label: () => Settings.get('userName'), icon: 'folder:home', run: () => launch('explorer', { path: 'home' }) },
    { id: 'documents', label: 'Documentos', icon: 'folder:documents', run: () => launch('explorer', { path: 'documents' }) },
    { id: 'pictures', label: 'Imagens', icon: 'folder:pictures', run: () => launch('explorer', { path: 'pictures' }) },
    { id: 'music', label: 'Músicas', icon: 'folder:music', run: () => launch('explorer', { path: 'music' }) },
    { id: 'games', label: 'Jogos', icon: 'games', run: () => launch('gamesFolder') },
    '-',
    { id: 'search', label: 'Pesquisar', icon: 'search', run: () => launch('explorer', { path: 'home', search: true }) },
    { id: 'recent', label: 'Itens Recentes', icon: 'recent', sub: true },
    { id: 'computer', label: 'Computador', icon: 'computer', run: () => launch('computer') },
    { id: 'network', label: 'Rede', icon: 'network', run: () => launch('network') },
    { id: 'connect', label: 'Conectar a', icon: 'connect', run: () => launch('control', { page: 'network' }) },
    '-',
    { id: 'control', label: 'Painel de Controle', icon: 'controlPanel', run: () => launch('control') },
    { id: 'default', label: 'Programas Padrão', icon: 'defaultPrograms', run: () => launch('control', { page: 'programs' }) },
    { id: 'help', label: 'Ajuda e Suporte', icon: 'help', run: () => launch('help') },
    { id: 'run', label: 'Executar...', icon: 'run', run: () => launch('run') },
];

const appName = (id, override) => override || APPS[id]?.name || id;

function itemHTML({ app, name, title, sub, big = true }) {
    const a = APPS[app];
    if (!a) return '';
    return `<div class="sm-item ${big ? 'big' : ''}" data-app="${app}" tabindex="-1">
        ${ico(a.icon, big ? 32 : 16)}<div class="sm-item-text"><span class="sm-name">${esc(title || appName(app, name))}</span>${sub ? `<span class="sm-sub">${esc(sub)}</span>` : ''}</div></div>`;
}

function renderHome() {
    mode = 'home';
    const recent = (Settings.get('recentPrograms') || []).filter(id => APPS[id] && !PINNED.some(p => p.app === id)).slice(0, 7);
    list.innerHTML = `<div class="sm-pinned">${PINNED.map(p => itemHTML({ ...p, big: true }).replace('sm-name', 'sm-name bold')).join('')}</div>
        <div class="sm-sep"></div>
        <div class="sm-recent">${recent.map(id => itemHTML({ app: id })).join('')}</div>`;
    $('.sm-allprog', el).innerHTML = '<span>Todos os Programas</span><span class="sm-arrow">▸</span>';
    $('.sm-allprog', el).classList.remove('back');
}

function treeHTML(nodes, depth = 0) {
    return nodes.map(n => {
        if (n.folder) {
            return `<div class="sm-folder" style="--d:${depth}"><div class="sm-item small folder" tabindex="-1">${ico('folder', 16)}<span class="sm-name">${esc(n.folder)}</span></div>
                <div class="sm-folder-kids" hidden>${n.items.length ? treeHTML(n.items, depth + 1) : `<div class="sm-empty" style="--d:${depth + 1}">(Vazio)</div>`}</div></div>`;
        }
        return `<div style="--d:${depth}" class="sm-indent">${itemHTML({ app: n.app, name: n.name, big: false }).replace('sm-item ', 'sm-item small ')}</div>`;
    }).join('');
}

function renderAll() {
    mode = 'all';
    list.innerHTML = `<div class="sm-tree">${treeHTML(TREE)}</div>`;
    $('.sm-allprog', el).innerHTML = '<span class="sm-arrow">◂</span><span>Voltar</span>';
    $('.sm-allprog', el).classList.add('back');
}

function renderSearch(q) {
    mode = 'search';
    const ql = q.toLowerCase();
    const progs = Object.entries(APPS).filter(([id, a]) => !a.hidden && (a.name.toLowerCase().includes(ql) || a.cmd?.some(c => c.startsWith(ql))));
    const cps = CONTROL_SHORTCUTS.filter(c => c.name.toLowerCase().includes(ql));
    const files = FS.search('home', q).slice(0, 8);
    let out = '';
    if (progs.length || cps.length) {
        out += `<div class="sm-group">Programas</div>` + progs.map(([id]) => itemHTML({ app: id, big: false }).replace('sm-item ', 'sm-item small ')).join('');
        out += cps.map(c => `<div class="sm-item small" data-cp="${c.page}" tabindex="-1">${ico(c.icon, 16)}<span class="sm-name">${esc(c.name)}</span></div>`).join('');
    }
    if (files.length) {
        out += `<div class="sm-group">Arquivos</div>` + files.map(n => `<div class="sm-item small" data-node="${n.id}" tabindex="-1">${ico(nodeIcon(n), 16)}<span class="sm-name">${esc(FS.displayName(n))}</span></div>`).join('');
    }
    if (!out) out = `<div class="sm-noresult">Nenhum item corresponde à sua pesquisa.</div>`;
    out += `<div class="sm-sep"></div>
        <div class="sm-item small sm-searchall" data-searchall tabindex="-1">${ico('search', 16)}<span class="sm-name">Pesquisar em todos os lugares</span></div>
        <div class="sm-item small sm-searchall" data-web tabindex="-1">${ico('browser', 16)}<span class="sm-name">Pesquisar na Internet</span></div>`;
    list.innerHTML = out;
    $('.sm-allprog', el).innerHTML = '';
    const first = $('.sm-item', list);
    first?.classList.add('hot');
}

function activate(item) {
    if (!item) return;
    const q = search.value.trim();
    if (item.classList.contains('folder')) {
        const kids = item.nextElementSibling;
        kids.hidden = !kids.hidden;
        item.classList.toggle('open', !kids.hidden);
        return;
    }
    StartMenu.close();
    if (item.dataset.app) launch(item.dataset.app);
    else if (item.dataset.cp) launch('control', { page: item.dataset.cp });
    else if (item.dataset.node) openNode(item.dataset.node);
    else if (item.dataset.searchall !== undefined) launch('explorer', { path: 'home', search: q });
    else if (item.dataset.web !== undefined) launch('browser', { search: q });
}

function setPic(src) {
    const img = $('.sm-pic img', el);
    if (img.dataset.src === src) return;
    img.dataset.src = src;
    img.style.opacity = '0';
    setTimeout(() => { img.src = src; img.style.opacity = '1'; }, 90);
}

const userPic = () => avatarSrc(Settings.get('avatar'));

function build() {
    el = html(`<div id="startmenu" class="startmenu" hidden role="menu" aria-label="Menu Iniciar">
        <div class="sm-pic"><img alt=""></div>
        <div class="sm-left">
            <div class="sm-list"></div>
            <div class="sm-allprog" tabindex="-1"></div>
            <div class="sm-search"><input type="text" placeholder="Iniciar Pesquisa" aria-label="Iniciar Pesquisa" spellcheck="false"><span class="sm-mag">${ico('search', 14)}</span></div>
        </div>
        <div class="sm-right">
            <div class="sm-right-links">${RIGHT.map(r => r === '-' ? '<div class="sm-rsep"></div>'
                : `<div class="sm-link${r.sub ? ' has-sub' : ''}" data-id="${r.id}" tabindex="-1"><span>${esc(typeof r.label === 'function' ? r.label() : r.label)}</span>${r.sub ? '<span class="sm-arrow">▸</span>' : ''}</div>`).join('')}</div>
            <div class="sm-power">
                <button class="sm-pwr" data-tip="Desligar o computador"><i></i></button>
                <button class="sm-lock" data-tip="Bloquear este computador"><i></i></button>
                <button class="sm-more" data-tip="Mais opções">▸</button>
            </div>
        </div>
    </div>`);
    document.body.appendChild(el);
    list = $('.sm-list', el);
    search = $('.sm-search input', el);

    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('contextmenu', e => e.preventDefault());
    list.addEventListener('click', e => activate(e.target.closest('.sm-item')));
    list.addEventListener('pointerover', e => {
        const it = e.target.closest('.sm-item');
        if (!it) return;
        $$('.sm-item.hot', list).forEach(x => x.classList.remove('hot'));
        it.classList.add('hot');
        if (mode === 'all' && it.classList.contains('folder')) {
            clearTimeout(it._t);
            it._t = setTimeout(() => { if (it.matches(':hover') && it.nextElementSibling.hidden) activate(it); }, 900);
        }
    });
    $('.sm-allprog', el).addEventListener('click', () => {
        if (mode === 'all') renderHome(); else if (mode === 'home') renderAll();
    });
    search.addEventListener('input', () => {
        const q = search.value.trim();
        if (q) renderSearch(q); else renderHome();
    });
    search.addEventListener('keydown', e => {
        const items = $$('.sm-item', list).filter(i => i.offsetParent);
        const cur = items.findIndex(i => i.classList.contains('hot'));
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items.forEach(i => i.classList.remove('hot'));
            items[n]?.classList.add('hot');
            items[n]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const hot = items[cur];
            if (hot) activate(hot);
            else if (search.value.trim()) {
                const q = search.value.trim();
                StartMenu.close();
                if (!runCommand(q)) launch('explorer', { path: 'home', search: q });
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (search.value) { search.value = ''; renderHome(); } else StartMenu.close();
        }
    });

    $('.sm-right-links', el).addEventListener('click', e => {
        const l = e.target.closest('.sm-link');
        if (!l) return;
        const r = RIGHT.find(x => x.id === l.dataset.id);
        if (r.sub) { recentMenu(l); return; }
        StartMenu.close();
        r.run();
    });
    $('.sm-right-links', el).addEventListener('pointerover', e => {
        const l = e.target.closest('.sm-link');
        if (!l) return;
        const r = RIGHT.find(x => x.id === l.dataset.id);
        setPic(iconSrc(r.icon).src);
        if (r.sub) { clearTimeout(l._t); l._t = setTimeout(() => l.matches(':hover') && recentMenu(l), 400); }
    });
    $('.sm-right', el).addEventListener('pointerleave', () => setPic(userPic()));
    $('.sm-pwr', el).addEventListener('click', () => { StartMenu.close(); Session.shutdown(false); });
    $('.sm-lock', el).addEventListener('click', () => { StartMenu.close(); Session.lock(); });
    $('.sm-more', el).addEventListener('click', e => {
        const r = e.currentTarget.getBoundingClientRect();
        showMenu(r.right - 2, r.top, [
            { label: 'Trocar Usuário', action: () => { StartMenu.close(); Session.lock(); } },
            { label: 'Fazer Logoff', action: () => { StartMenu.close(); Session.logoff(); } },
            { label: 'Bloquear', action: () => { StartMenu.close(); Session.lock(); } },
            '-',
            { label: 'Reiniciar', action: () => { StartMenu.close(); Session.shutdown(true); } },
            { label: 'Suspender', action: () => { StartMenu.close(); Session.sleepMode(); } },
            { label: 'Desligar', action: () => { StartMenu.close(); Session.shutdown(false); } },
        ], { above: true });
    });
}

function recentMenu(anchor) {
    const docs = (Settings.get('recentDocs') || []).map(id => FS.get(id)).filter(n => n && n.parent !== 'recycle');
    const r = anchor.getBoundingClientRect();
    showMenu(r.right - 4, r.top, docs.length
        ? docs.map(n => ({ label: FS.displayName(n), icon: nodeIcon(n), action: () => { StartMenu.close(); openNode(n.id); } }))
        : [{ label: '(Vazio)', disabled: true }]);
}

export const StartMenu = {
    init() {
        build();
        window.addEventListener('pointerdown', () => this.close());
        document.addEventListener('keydown', e => {
            // Ctrl+Esc opens the Start menu like on Windows.
            if (e.key === 'Escape' && e.ctrlKey) { e.preventDefault(); this.toggle(); return; }
            if (!isOpen) return;
            if (e.key === 'Escape' && document.activeElement !== search) { this.close(); return; }
            if (document.activeElement !== search && e.key.length === 1 && !e.ctrlKey && !e.altKey && !$('.ctx-menu')) search.focus();
        });
    },
    open() {
        if (isOpen || Session.state !== 'desktop') return;
        isOpen = true;
        closeMenus();
        search.value = '';
        renderHome();
        const img = $('.sm-pic img', el);
        img.src = userPic(); img.dataset.src = img.src;
        $('.sm-link[data-id="home"] span', el).textContent = Settings.get('userName');
        el.hidden = false;
        el.classList.remove('show');
        void el.offsetWidth;
        el.classList.add('show');
        document.getElementById('start-orb').classList.add('pressed');
        setTimeout(() => search.focus(), 30);
    },
    close() {
        if (!isOpen) return;
        isOpen = false;
        el.classList.remove('show');
        el.hidden = true;
        closeMenus();
        document.getElementById('start-orb').classList.remove('pressed');
    },
    toggle() { isOpen ? this.close() : this.open(); },
    get isOpen() { return isOpen; },
};
