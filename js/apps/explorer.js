// Windows Explorer: folders, Computador, Rede, Jogos and Lixeira.
import { $, $$, bus, esc, html, drag, formatSize, formatDate, clamp } from '../core/util.js';
import { FS } from '../core/fs.js';
import { Settings } from '../core/settings.js';
import { Sound } from '../core/sound.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { showMenu } from '../ui/menu.js';
import { properties, errorBox, messageBox } from '../ui/dialogs.js';
import { APPS, launch, openNode, nodeIcon } from './registry.js';
import { Clipboard, deleteItems, emptyRecycle, restoreItems, createNew, inlineRename } from '../shell/fileops.js';

const VIEWS = [
    ['xl', 'Ícones Extra Grandes', 96], ['large', 'Ícones Grandes', 64], ['medium', 'Ícones Médios', 48],
    ['small', 'Ícones Pequenos', 16], ['list', 'Lista', 16], ['details', 'Detalhes', 16], ['tiles', 'Lado a Lado', 32],
];
const viewSize = v => (VIEWS.find(x => x[0] === v) || VIEWS[2])[2];

const SPECIAL = {
    computer: { name: 'Computador', icon: 'computer' },
    network: { name: 'Rede', icon: 'network' },
    games: { name: 'Jogos', icon: 'games' },
};

const FAVS = [
    { id: 'documents', label: 'Documentos', icon: 'folder:documents' },
    { id: 'pictures', label: 'Imagens', icon: 'folder:pictures' },
    { id: 'music', label: 'Músicas', icon: 'folder:music' },
    { id: 'downloads', label: 'Downloads', icon: 'folder:downloads' },
    { id: 'desktop', label: 'Área de Trabalho', icon: 'folder:desktop' },
    { id: 'recycle', label: 'Lixeira', icon: 'trash' },
];

const DND_TYPE = 'application/x-vbos-nodes';

export function open({ path = 'documents', search = '' } = {}) {
    const ex = new Explorer(path, search);
    return ex.win;
}

class Explorer {
    constructor(path, search) {
        this.loc = path;
        this.history = [];
        this.future = [];
        this.selected = new Set();
        this.anchor = null;
        this.query = '';
        this.sort = { key: 'name', dir: 1 };
        this.views = Settings.get('folderViews') || {};
        this.navWidth = 180;
        this.showDetails = true;
        this.showNav = true;
        this.build();
        this.navigate(path, { noHistory: true, silent: true });
        if (search) {
            requestAnimationFrame(() => {
                const s = $('.ex-search input', this.glass);
                if (typeof search === 'string') { s.value = search; this.doSearch(search); }
                s.focus();
            });
        }
    }

    /* ---------- Building ---------- */
    build() {
        this.glass = html(`<div class="ex-nav">
            <div class="ex-backfwd">
                <button class="nav-round ex-back" data-tip="Voltar" disabled><i></i></button>
                <button class="nav-round small ex-fwd" data-tip="Avançar" disabled><i></i></button>
                <button class="ex-hist" data-tip="Locais Recentes">▾</button>
            </div>
            <div class="ex-address no-drag">
                <span class="ex-addr-ico"></span>
                <div class="ex-crumbs"></div>
                <input class="ex-addr-input" hidden spellcheck="false">
                <button class="ex-addr-drop" data-tip="Locais anteriores">▾</button>
                <button class="ex-refresh" data-tip="Atualizar"><i></i></button>
            </div>
            <div class="ex-search no-drag"><input placeholder="Pesquisar" spellcheck="false"><button class="ex-search-btn"><i></i></button></div>
        </div>`);
        this.body = html(`<div class="explorer">
            <div class="cmdbar"></div>
            <div class="ex-main">
                <div class="ex-navpane">
                    <div class="ex-section-title">Links Favoritos</div>
                    <div class="ex-favs">${FAVS.map(f => `<div class="ex-fav" data-id="${f.id}">${ico(f.icon, 16)}<span>${esc(f.label)}</span></div>`).join('')}</div>
                    <div class="ex-folders-head"><span>Pastas</span><span class="ex-folders-chev">⌃</span></div>
                    <div class="ex-tree"></div>
                </div>
                <div class="ex-split"></div>
                <div class="ex-content" tabindex="0">
                    <div class="ex-colheads"></div>
                    <div class="ex-view"></div>
                    <div class="ex-empty" hidden>Esta pasta está vazia.</div>
                </div>
            </div>
            <div class="ex-details"></div>
        </div>`);
        this.view = $('.ex-view', this.body);
        this.content = $('.ex-content', this.body);
        this.win = WM.open({
            app: 'explorer', title: 'Explorer', icon: 'folder', width: 820, height: 540, minW: 420, minH: 300,
            content: this.body, glass: this.glass, cls: 'explorer-win', hideTitle: true,
        });
        this.win.navigate = id => this.navigate(id);
        this.win.dropTarget = el => {
            const it = el.closest?.('.ex-item');
            if (it) { const n = FS.get(it.dataset.id); if (n?.type === 'folder' || n?.id === 'recycle') return n.id; }
            const tn = el.closest?.('.tree-node');
            if (tn && FS.get(tn.dataset.id)) return tn.dataset.id;
            return FS.isFolder(this.loc) || this.loc === 'recycle' ? this.loc : null;
        };

        // Navigation buttons
        $('.ex-back', this.glass).addEventListener('click', () => this.back());
        $('.ex-fwd', this.glass).addEventListener('click', () => this.forward());
        $('.ex-hist', this.glass).addEventListener('click', e => this.historyMenu(e.currentTarget));
        $('.ex-addr-drop', this.glass).addEventListener('click', e => this.historyMenu(e.currentTarget));
        $('.ex-refresh', this.glass).addEventListener('click', () => { this.render(); Sound.play('navigate'); });
        const crumbs = $('.ex-crumbs', this.glass);
        crumbs.addEventListener('click', e => {
            const c = e.target.closest('.crumb');
            const chev = e.target.closest('.crumb-chev');
            if (chev) { this.crumbMenu(chev); return; }
            if (c) { this.navigate(c.dataset.id); return; }
            this.editAddress();
        });
        const addr = $('.ex-addr-input', this.glass);
        addr.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.goAddress(addr.value);
            if (e.key === 'Escape') this.endEditAddress();
            e.stopPropagation();
        });
        addr.addEventListener('blur', () => this.endEditAddress());
        const sIn = $('.ex-search input', this.glass);
        let st;
        sIn.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => this.doSearch(sIn.value), 220); });
        sIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { sIn.value = ''; this.doSearch(''); } if (e.key === 'Enter') this.doSearch(sIn.value); });
        $('.ex-search-btn', this.glass).addEventListener('click', () => { if (sIn.value) { sIn.value = ''; this.doSearch(''); } else sIn.focus(); });

        // Nav pane
        $('.ex-favs', this.body).addEventListener('click', e => { const f = e.target.closest('.ex-fav'); if (f) this.navigate(f.dataset.id); });
        $('.ex-folders-head', this.body).addEventListener('click', () => {
            const t = $('.ex-tree', this.body);
            t.hidden = !t.hidden;
            $('.ex-folders-chev', this.body).textContent = t.hidden ? '⌄' : '⌃';
        });
        const tree = $('.ex-tree', this.body);
        tree.addEventListener('click', e => {
            const tw = e.target.closest('.tree-twisty');
            const tn = e.target.closest('.tree-node');
            if (!tn) return;
            if (tw) { this.toggleTree(tn.dataset.id); return; }
            this.navigate(tn.dataset.id);
        });
        tree.addEventListener('contextmenu', e => {
            const tn = e.target.closest('.tree-node');
            if (!tn) return;
            e.preventDefault(); e.stopPropagation();
            const id = tn.dataset.id;
            if (!FS.get(id)) return;
            showMenu(e.clientX, e.clientY, [
                { label: 'Expandir', action: () => this.toggleTree(id, true) },
                { label: 'Abrir em nova janela', action: () => launch('explorer', { path: id }) },
                '-',
                { label: 'Colar', disabled: !Clipboard.has(), action: () => Clipboard.paste(id) },
                { label: 'Excluir', disabled: FS.get(id)?.sys, action: () => deleteItems([id], this.win) },
                '-',
                { label: 'Propriedades', action: () => properties(id) },
            ]);
        });
        this.expanded = new Set(['root', 'users', 'home']);
        this.setupDnD(tree, '.tree-node');
        this.setupDnD($('.ex-favs', this.body), '.ex-fav');

        // Splitter
        $('.ex-split', this.body).addEventListener('pointerdown', e => {
            const start = this.navWidth;
            drag(e, { cursor: 'ew-resize', onMove: dx => { this.navWidth = clamp(start + dx, 110, 400); $('.ex-navpane', this.body).style.width = this.navWidth + 'px'; } });
        });

        // View interactions
        this.content.addEventListener('pointerdown', e => this.viewPointerDown(e));
        this.content.addEventListener('dblclick', e => {
            const it = e.target.closest('.ex-item');
            if (it) this.openItem(it.dataset.id);
        });
        this.content.addEventListener('contextmenu', e => {
            e.preventDefault(); e.stopPropagation();
            const it = e.target.closest('.ex-item');
            if (it) {
                if (!this.selected.has(it.dataset.id)) this.select(it.dataset.id);
                this.itemMenu(e.clientX, e.clientY);
            } else { this.select(null); this.bgMenu(e.clientX, e.clientY); }
        });
        this.content.addEventListener('keydown', e => this.onKey(e));
        $('.ex-colheads', this.body).addEventListener('click', e => {
            const h = e.target.closest('.colhead');
            if (!h) return;
            if (this.sort.key === h.dataset.key) this.sort.dir *= -1; else this.sort = { key: h.dataset.key, dir: 1 };
            this.render();
        });
        this.setupDnD(this.content, '.ex-item', true);

        const off1 = bus.on('fs', () => { this.render({ keepScroll: true }); this.renderTree(); });
        const off2 = bus.on('clipboard', () => this.render({ keepScroll: true }));
        const off3 = bus.on('settings', k => { if (k === 'showExtensions') this.render({ keepScroll: true }); });
        this.win.onClose(() => { off1(); off2(); off3(); });
    }

    /* ---------- Locations ---------- */
    isNode(loc = this.loc) { return !!FS.get(loc); }
    locName(loc = this.loc) {
        if (SPECIAL[loc]) return SPECIAL[loc].name;
        const n = FS.get(loc);
        return n ? (loc === 'root' ? n.name : n.name) : '';
    }
    locIcon(loc = this.loc) {
        if (SPECIAL[loc]) return SPECIAL[loc].icon;
        const n = FS.get(loc);
        return n ? nodeIcon(n) : 'folder';
    }

    navigate(loc, { noHistory = false, silent = false } = {}) {
        if (!SPECIAL[loc] && !FS.get(loc)) { errorBox(`O sistema não pode encontrar '${loc}'.`, { parent: this.win }); return; }
        if (FS.get(loc) && FS.get(loc).type !== 'folder') { openNode(loc); return; }
        if (!noHistory && loc !== this.loc) { this.history.push(this.loc); this.future = []; }
        this.loc = loc;
        this.query = '';
        const sIn = $('.ex-search input', this.glass);
        if (sIn) sIn.value = '';
        this.selected.clear();
        this.anchor = null;
        if (!silent) Sound.play('navigate');
        if (FS.get(loc)) {
            let p = FS.get(loc).parent;
            while (p) { this.expanded.add(p); p = FS.get(p)?.parent; }
        }
        this.render();
        this.renderTree();
        this.content.scrollTop = 0;
        this.content.focus({ preventScroll: true });
    }

    back() { if (!this.history.length) return; this.future.push(this.loc); const l = this.history.pop(); this.navigate(l, { noHistory: true }); }
    forward() { if (!this.future.length) return; this.history.push(this.loc); const l = this.future.pop(); this.navigate(l, { noHistory: true }); }
    up() { const n = FS.get(this.loc); if (n?.parent) this.navigate(n.parent); else if (this.loc === 'root') this.navigate('computer'); }

    historyMenu(anchor) {
        const r = anchor.getBoundingClientRect();
        const seen = new Set();
        const list = [...this.future, this.loc, ...this.history.slice().reverse()].filter(l => !seen.has(l) && seen.add(l) && (SPECIAL[l] || FS.get(l))).slice(0, 10);
        showMenu(r.left, r.bottom, list.map(l => ({ label: this.locName(l), icon: this.locIcon(l), radio: l === this.loc, action: () => this.navigate(l) })));
    }

    crumbChain() {
        if (this.query) return [{ id: this.loc, name: `Resultados da Pesquisa em ${this.locName()}` }];
        if (SPECIAL[this.loc]) return [{ id: this.loc, name: SPECIAL[this.loc].name }];
        if (this.loc === 'recycle') return [{ id: 'recycle', name: 'Lixeira' }];
        const chain = FS.chain(this.loc);
        const homeIdx = chain.findIndex(n => n.id === 'home');
        if (homeIdx >= 0) return chain.slice(homeIdx).map(n => ({ id: n.id, name: n.name }));
        return [{ id: 'computer', name: 'Computador' }, ...chain.map(n => ({ id: n.id, name: n.name }))];
    }

    crumbMenu(chev) {
        const id = chev.dataset.id;
        const r = chev.getBoundingClientRect();
        let kids;
        if (id === 'computer') kids = [FS.get('root')];
        else kids = FS.children(id).filter(n => n.type === 'folder');
        if (!kids.length) return;
        showMenu(r.left, r.bottom, kids.map(n => ({ label: n.name, icon: nodeIcon(n), action: () => this.navigate(n.id) })));
    }

    editAddress() {
        const input = $('.ex-addr-input', this.glass);
        const crumbs = $('.ex-crumbs', this.glass);
        input.value = this.isNode() ? FS.pathString(this.loc) : this.locName();
        crumbs.hidden = true; input.hidden = false;
        input.focus(); input.select();
    }
    endEditAddress() {
        $('.ex-addr-input', this.glass).hidden = true;
        $('.ex-crumbs', this.glass).hidden = false;
    }
    goAddress(text) {
        this.endEditAddress();
        const t = text.trim();
        const lower = t.toLowerCase();
        const named = { computador: 'computer', computer: 'computer', rede: 'network', network: 'network', lixeira: 'recycle', jogos: 'games', documentos: 'documents', imagens: 'pictures', 'área de trabalho': 'desktop' };
        if (named[lower]) return this.navigate(named[lower]);
        if (lower === 'painel de controle' || lower === 'control') return launch('control');
        if (/^(https?:\/\/|www\.)/.test(lower)) return launch('browser', { url: t });
        const id = FS.resolve(t, this.isNode() ? this.loc : 'root');
        if (id) return this.navigate(id);
        errorBox(`O sistema não pode encontrar '${t}'. Verifique a ortografia e tente novamente.`, { parent: this.win, title: 'Windows Explorer' });
    }

    doSearch(q) {
        this.query = q.trim();
        this.selected.clear();
        this.render();
    }

    /* ---------- Items ---------- */
    items() {
        if (this.loc === 'computer') {
            const used = FS.usedBytes(), total = 5 * 1024 * 1024;
            return [
                { id: 'root', name: 'Disco Local (C:)', icon: 'drive', kind: 'drive', group: 'Unidades de Disco Rígido', used, total, type: 'Disco Local' },
                { id: 'dvd', name: 'Unidade de DVD-RW (D:)', icon: 'drive', kind: 'dvd', group: 'Dispositivos com Armazenamento Removível', type: 'Unidade de CD' },
            ];
        }
        if (this.loc === 'network') {
            return [{ id: 'computer', name: Settings.get('computerName'), icon: 'computer', kind: 'special', type: 'Computador' }];
        }
        if (this.loc === 'games') {
            return [{ id: 'app:mines', name: 'Caça-Minas', icon: 'mines', kind: 'app', app: 'mines', type: 'Jogo', desc: 'Encontre todas as minas sem detoná-las.' }];
        }
        let nodes = this.query ? FS.search(this.loc, this.query) : FS.children(this.loc);
        const list = nodes.map(n => ({
            id: n.id, node: n, name: FS.displayName(n), icon: nodeIcon(n), kind: 'node', shortcut: n.type === 'link',
            type: FS.typeName(n), size: n.type === 'folder' ? null : FS.size(n.id), modified: n.modified,
        }));
        const { key, dir } = this.sort;
        const cmp = {
            name: (a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }),
            modified: (a, b) => a.modified - b.modified,
            type: (a, b) => a.type.localeCompare(b.type),
            size: (a, b) => (a.size || 0) - (b.size || 0),
            orig: (a, b) => (a.node.origParent || '').localeCompare(b.node.origParent || ''),
            deleted: (a, b) => (a.node.deletedAt || 0) - (b.node.deletedAt || 0),
        }[key] || (() => 0);
        list.sort((a, b) => ((b.node.type === 'folder') - (a.node.type === 'folder')) || cmp(a, b) * dir);
        return list;
    }

    get viewMode() {
        if (this.loc === 'computer') return this.views.computer || 'tiles';
        if (this.loc === 'games') return this.views.games || 'large';
        return this.views[this.loc] || (this.loc === 'recycle' ? 'details' : ['documents', 'downloads'].includes(this.loc) ? 'details' : 'medium');
    }
    set viewMode(v) {
        this.views = { ...(Settings.get('folderViews') || {}), [this.loc]: v };
        Settings.set('folderViews', this.views);
        this.render({ keepScroll: true });
    }

    columns() {
        if (this.loc === 'recycle') return [['name', 'Nome', 220], ['orig', 'Local original', 200], ['deleted', 'Data da exclusão', 130], ['size', 'Tamanho', 80], ['type', 'Tipo', 140]];
        return [['name', 'Nome', 240], ['modified', 'Data de modificação', 140], ['type', 'Tipo', 150], ['size', 'Tamanho', 80]];
    }

    thumbHTML(it, size) {
        if (it.kind === 'node' && FS.isImage(it.node) && size >= 48) {
            return `<span class="ex-thumb" style="width:${size}px;height:${size}px"><img src="${esc(it.node.content)}" alt="" loading="lazy" draggable="false"></span>`;
        }
        return ico(it.icon, size, { shortcut: it.shortcut });
    }

    render({ keepScroll = false } = {}) {
        if (!this.win || this.win.closed) return;
        if (!this.isNode() && !SPECIAL[this.loc]) this.loc = 'documents';
        const scroll = this.content.scrollTop;
        const items = this.items();
        const ids = new Set(items.map(i => i.id));
        [...this.selected].forEach(s => { if (!ids.has(s)) this.selected.delete(s); });
        const mode = this.viewMode;
        const size = viewSize(mode);
        this.view.className = `ex-view v-${mode}`;
        const heads = $('.ex-colheads', this.body);
        const cols = this.columns();
        heads.hidden = mode !== 'details' || this.loc === 'computer';
        if (!heads.hidden) {
            heads.innerHTML = cols.map(([k, label, w]) => `<div class="colhead${this.sort.key === k ? ' sorted ' + (this.sort.dir > 0 ? 'asc' : 'desc') : ''}" data-key="${k}" style="width:${w}px">${label}</div>`).join('') + '<div class="colhead filler"></div>';
        }
        const cutIds = Clipboard.mode === 'cut' ? new Set(Clipboard.ids) : new Set();
        let lastGroup = null;
        this.view.innerHTML = items.map(it => {
            const sel = this.selected.has(it.id) ? ' selected' : '';
            const cut = cutIds.has(it.id) ? ' cut' : '';
            const drag = it.kind === 'node' && !it.node.sys ? ' draggable="true"' : '';
            let pre = '';
            if (it.group && it.group !== lastGroup) { lastGroup = it.group; pre = `<div class="ex-group"><span>${esc(it.group)}</span></div>`; }
            if (mode === 'details' && this.loc !== 'computer') {
                const vals = {
                    name: `${ico(it.icon, 16, { shortcut: it.shortcut })}<span class="ex-name">${esc(it.name)}</span>`,
                    modified: it.modified ? formatDate(it.modified) : '',
                    type: esc(it.type || ''),
                    size: it.size != null ? formatSize(it.size) : '',
                    orig: it.node ? esc(FS.pathString(it.node.origParent || 'desktop')) : '',
                    deleted: it.node?.deletedAt ? formatDate(it.node.deletedAt) : '',
                };
                return pre + `<div class="ex-item sel-item row${sel}${cut}" data-id="${it.id}"${drag}>${cols.map(([k, , w]) => `<div class="cell c-${k}" style="width:${w}px">${vals[k]}</div>`).join('')}</div>`;
            }
            if (mode === 'tiles') {
                let sub = esc(it.type || '');
                if (it.kind === 'drive') sub = `<div class="progress ${it.used / it.total > 0.9 ? 'red' : 'blue'} drive-bar"><div style="width:${Math.max(2, it.used / it.total * 100)}%"></div></div><span class="ex-sub">${formatSize(it.total - it.used)} livre(s) de ${formatSize(it.total)}</span>`;
                else if (it.kind === 'dvd') sub = '<span class="ex-sub">Unidade de CD</span>';
                else if (it.size != null) sub = `<span class="ex-sub">${esc(it.type)}</span><span class="ex-sub">${formatSize(it.size)}</span>`;
                else sub = `<span class="ex-sub">${esc(it.type)}</span>`;
                return pre + `<div class="ex-item sel-item tile${sel}${cut}" data-id="${it.id}"${drag}>${this.thumbHTML(it, 48)}<div class="tile-text"><span class="ex-name">${esc(it.name)}</span>${sub}</div></div>`;
            }
            return pre + `<div class="ex-item sel-item icon${sel}${cut}" data-id="${it.id}"${drag} style="--s:${size}px">${this.thumbHTML(it, size)}<span class="ex-name">${esc(it.name)}</span></div>`;
        }).join('');
        const empty = $('.ex-empty', this.body);
        empty.hidden = items.length > 0;
        empty.textContent = this.query ? 'Nenhum item corresponde à sua pesquisa.' : this.loc === 'recycle' ? 'A Lixeira está vazia.' : 'Esta pasta está vazia.';
        if (keepScroll) this.content.scrollTop = scroll;
        this.renderChrome();
        this.renderDetails();
    }

    renderChrome() {
        const name = this.query ? `Resultados da Pesquisa em ${this.locName()}` : this.locName();
        this.win.setTitle(name);
        this.win.setIcon(this.locIcon());
        $('.ex-back', this.glass).disabled = !this.history.length;
        $('.ex-fwd', this.glass).disabled = !this.future.length;
        $('.ex-addr-ico', this.glass).innerHTML = ico(this.locIcon(), 16);
        const chain = this.crumbChain();
        $('.ex-crumbs', this.glass).innerHTML = `<span class="crumb-chev first" data-id="${this.isNode() ? (FS.chain(this.loc)[0]?.id === 'recycle' ? 'recycle' : 'computer') : this.loc}">▸</span>` +
            chain.map((c, i) => `<span class="crumb" data-id="${esc(c.id)}">${esc(c.name)}</span>${i < chain.length - 1 || (FS.get(c.id) && FS.children(c.id).some(k => k.type === 'folder')) ? `<span class="crumb-chev" data-id="${esc(c.id)}">▸</span>` : ''}`).join('');
        $('.ex-search input', this.glass).placeholder = `Pesquisar`;
        this.renderCmdBar();
        $$('.ex-fav', this.body).forEach(f => f.classList.toggle('active', f.dataset.id === this.loc));
        $$('.tree-node', this.body).forEach(t => t.classList.toggle('active', t.dataset.id === this.loc));
    }

    renderCmdBar() {
        const bar = $('.cmdbar', this.body);
        const sel = [...this.selected];
        const one = sel.length === 1 ? this.itemData(sel[0]) : null;
        const btns = [['organize', 'Organizar', true], ['views', 'Modos de Exibição', true]];
        if (this.loc === 'recycle') {
            btns.push(['empty', 'Esvaziar Lixeira']);
            btns.push(['restore', sel.length ? (sel.length === 1 ? 'Restaurar este item' : 'Restaurar os itens selecionados') : 'Restaurar todos os itens']);
        } else if (this.loc === 'computer') {
            btns.push(['sysprops', 'Propriedades do Sistema'], ['uninstall', 'Desinstalar ou alterar um programa'], ['control', 'Abrir Painel de Controle']);
        } else if (one?.kind === 'node' && one.node.type === 'file') {
            btns.push(['open', FS.isImage(one.node) ? 'Visualizar' : 'Abrir']);
            if (FS.isImage(one.node)) btns.push(['edit', 'Editar']);
        } else if (one?.kind === 'node' && one.node.type === 'folder') {
            btns.push(['open', 'Abrir']);
        } else if (this.isNode()) {
            if (this.loc === 'pictures' || FS.isDescendant(this.loc, 'pictures')) btns.push(['slideshow', 'Apresentação de Slides']);
            btns.push(['newfolder', 'Nova Pasta']);
        }
        if (this.loc === 'games') btns.push(['play', 'Jogar']);
        bar.innerHTML = btns.map(([id, label, drop]) => `<button class="cmd-btn" data-cmd="${id}">${id === 'views' ? `<span class="cmd-views-ico"></span>` : ''}<span>${esc(label)}</span>${drop ? '<span class="cmd-drop">▾</span>' : ''}</button>`).join('')
            + `<span class="cmd-spacer"></span><button class="cmd-btn cmd-help" data-cmd="help" data-tip="Ajuda">?</button>`;
        bar.onclick = e => {
            const b = e.target.closest('.cmd-btn');
            if (!b) return;
            const r = b.getBoundingClientRect();
            this.command(b.dataset.cmd, r);
        };
    }

    command(cmd, r) {
        const sel = [...this.selected];
        switch (cmd) {
            case 'organize': return showMenu(r.left, r.bottom, this.organizeMenu());
            case 'views': return showMenu(r.left, r.bottom, this.viewsMenu());
            case 'empty': return emptyRecycle(this.win);
            case 'restore': return restoreItems(sel.length ? sel : FS.children('recycle').map(n => n.id));
            case 'sysprops': return launch('control', { page: 'system' });
            case 'uninstall': return launch('control', { page: 'programs' });
            case 'control': return launch('control');
            case 'open': return sel.forEach(id => this.openItem(id));
            case 'edit': return launch('paint', { file: sel[0] });
            case 'slideshow': {
                const img = FS.children(this.loc).find(n => FS.isImage(n)) || FS.search(this.loc, '.').find(n => FS.isImage(n));
                if (img) launch('photos', { file: img.id, slideshow: true });
                else messageBox({ title: 'Galeria de Fotos', icon: 'info', text: 'Não há imagens nesta pasta para exibir.', parent: this.win });
                return;
            }
            case 'newfolder': return this.newItem('folder');
            case 'play': return launch('mines');
            case 'help': return launch('help', { topic: 'explorer' });
        }
    }

    organizeMenu() {
        const sel = [...this.selected];
        const nodeSel = sel.filter(id => FS.get(id));
        const canEdit = this.isNode() && this.loc !== 'recycle';
        return [
            { label: 'Nova Pasta', icon: 'folder', disabled: !canEdit, action: () => this.newItem('folder') },
            '-',
            { label: 'Recortar', key: 'Ctrl+X', disabled: !nodeSel.length, action: () => Clipboard.set(nodeSel, 'cut') },
            { label: 'Copiar', key: 'Ctrl+C', disabled: !nodeSel.length, action: () => Clipboard.set(nodeSel, 'copy') },
            { label: 'Colar', key: 'Ctrl+V', disabled: !canEdit || !Clipboard.has(), action: () => Clipboard.paste(this.loc) },
            '-',
            { label: 'Selecionar Tudo', key: 'Ctrl+A', action: () => this.selectAll() },
            '-',
            { label: 'Layout', sub: [
                { label: 'Painel de Detalhes', checked: this.showDetails, action: () => { this.showDetails = !this.showDetails; $('.ex-details', this.body).hidden = !this.showDetails; } },
                { label: 'Painel de Navegação', checked: this.showNav, action: () => { this.showNav = !this.showNav; $('.ex-navpane', this.body).hidden = !this.showNav; $('.ex-split', this.body).hidden = !this.showNav; } },
            ] },
            { label: 'Opções de Pasta e Pesquisa', action: () => launch('control', { page: 'folderOptions' }) },
            '-',
            { label: 'Excluir', disabled: !nodeSel.length, action: () => deleteItems(nodeSel, this.win) },
            { label: 'Renomear', disabled: nodeSel.length !== 1, action: () => this.startRename(nodeSel[0]) },
            { label: 'Propriedades', action: () => nodeSel.length ? properties(nodeSel[0]) : this.isNode() ? properties(this.loc) : launch('control', { page: 'system' }) },
            '-',
            { label: 'Fechar', action: () => this.win.requestClose() },
        ];
    }

    viewsMenu() {
        const cur = this.viewMode;
        return VIEWS.map(([id, label]) => ({ label, radio: cur === id, action: () => { this.viewMode = id; } }));
    }

    itemData(id) { return this.items().find(i => i.id === id); }

    renderDetails() {
        const d = $('.ex-details', this.body);
        const sel = [...this.selected];
        if (sel.length === 1) {
            const it = this.itemData(sel[0]);
            if (!it) { d.innerHTML = ''; return; }
            let props = '';
            if (it.kind === 'node') {
                const n = it.node;
                props = n.type === 'folder'
                    ? `<span>Data de modificação:</span><span>${formatDate(n.modified)}</span>`
                    : `<span>Data de modificação:</span><span>${formatDate(n.modified)}</span><span>Tamanho:</span><span>${formatSize(FS.size(n.id))}</span><span>Data de criação:</span><span>${formatDate(n.created)}</span>`;
            } else if (it.kind === 'drive') {
                props = `<span>Espaço usado:</span><span><div class="progress blue" style="width:140px;height:12px;display:inline-block;vertical-align:middle"><div style="width:${Math.max(2, it.used / it.total * 100)}%"></div></div></span><span>Espaço livre:</span><span>${formatSize(it.total - it.used)}</span><span>Tamanho total:</span><span>${formatSize(it.total)}</span>`;
            } else if (it.desc) props = `<span>Descrição:</span><span>${esc(it.desc)}</span>`;
            d.innerHTML = `<div class="exd-ico">${this.thumbHTML(it, 48)}</div><div class="exd-text"><div class="exd-name">${esc(it.name)}</div><div class="exd-type">${esc(it.type || '')}</div></div><div class="exd-props">${props}</div>`;
        } else if (sel.length > 1) {
            const total = sel.reduce((s, id) => s + (FS.get(id) ? FS.size(id) : 0), 0);
            d.innerHTML = `<div class="exd-ico">${ico('file', 48)}</div><div class="exd-text"><div class="exd-name">${sel.length} itens selecionados</div><div class="exd-type">Tamanho total: ${formatSize(total)}</div></div>`;
        } else {
            const count = this.view.querySelectorAll('.ex-item').length;
            d.innerHTML = `<div class="exd-ico">${ico(this.locIcon(), 48)}</div><div class="exd-text"><div class="exd-name">${count} ${count === 1 ? 'item' : 'itens'}</div><div class="exd-type">${esc(this.locName())}</div></div>`;
        }
    }

    renderTree() {
        const tree = $('.ex-tree', this.body);
        const node = (id, depth) => {
            const n = FS.get(id);
            if (!n) return '';
            const kids = FS.children(id).filter(k => k.type === 'folder');
            const open = this.expanded.has(id);
            const label = id === 'root' ? 'Disco Local (C:)' : n.name;
            return `<div class="tree-node${id === this.loc ? ' active' : ''}" data-id="${id}" style="padding-left:${4 + depth * 14}px">
                <span class="tree-twisty">${kids.length ? (open ? '◢' : '▷') : ''}</span>${ico(nodeIcon(n), 16)}<span class="tree-label">${esc(label)}</span></div>
                ${open ? kids.map(k => node(k.id, depth + 1)).join('') : ''}`;
        };
        tree.innerHTML =
            `<div class="tree-node${this.loc === 'desktop' ? ' active' : ''}" data-id="desktop" style="padding-left:4px"><span class="tree-twisty"></span>${ico('folder:desktop', 16)}<span class="tree-label">Área de Trabalho</span></div>` +
            node('home', 1) +
            `<div class="tree-node${this.loc === 'computer' ? ' active' : ''}" data-id="computer" style="padding-left:18px"><span class="tree-twisty">${this.expanded.has('computer') ? '◢' : '▷'}</span>${ico('computer', 16)}<span class="tree-label">Computador</span></div>` +
            (this.expanded.has('computer') ? node('root', 2) : '') +
            `<div class="tree-node${this.loc === 'network' ? ' active' : ''}" data-id="network" style="padding-left:18px"><span class="tree-twisty"></span>${ico('network', 16)}<span class="tree-label">Rede</span></div>` +
            `<div class="tree-node${this.loc === 'recycle' ? ' active' : ''}" data-id="recycle" style="padding-left:18px"><span class="tree-twisty"></span>${ico(FS.children('recycle').length ? 'trashFull' : 'trash', 16)}<span class="tree-label">Lixeira</span></div>`;
    }

    toggleTree(id, force) {
        if (force === true || !this.expanded.has(id)) this.expanded.add(id); else this.expanded.delete(id);
        this.renderTree();
    }

    /* ---------- Selection & interaction ---------- */
    select(id, { toggle = false, range = false } = {}) {
        const els = $$('.ex-item', this.view);
        if (range && this.anchor) {
            const ids = els.map(e => e.dataset.id);
            const a = ids.indexOf(this.anchor), b = ids.indexOf(id);
            if (a >= 0 && b >= 0) {
                if (!toggle) this.selected.clear();
                ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(x => this.selected.add(x));
            }
        } else if (toggle) {
            if (this.selected.has(id)) this.selected.delete(id); else this.selected.add(id);
            this.anchor = id;
        } else {
            this.selected.clear();
            if (id) this.selected.add(id);
            this.anchor = id;
        }
        els.forEach(e => e.classList.toggle('selected', this.selected.has(e.dataset.id)));
        this.renderDetails();
        this.renderCmdBar();
    }

    selectAll() {
        $$('.ex-item', this.view).forEach(e => { this.selected.add(e.dataset.id); e.classList.add('selected'); });
        this.renderDetails(); this.renderCmdBar();
    }

    viewPointerDown(e) {
        if (e.button !== 0) return;
        const it = e.target.closest('.ex-item');
        if (it) {
            if (e.shiftKey) this.select(it.dataset.id, { range: true, toggle: e.ctrlKey });
            else if (e.ctrlKey) this.select(it.dataset.id, { toggle: true });
            else if (!this.selected.has(it.dataset.id)) this.select(it.dataset.id);
            else {
                // click on already-selected item: reselect only it on pointerup without drag
                const id = it.dataset.id;
                const up = ev => { window.removeEventListener('pointerup', up); if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 4) this.select(id); };
                window.addEventListener('pointerup', up);
            }
            return;
        }
        if (e.target.closest('.ex-colheads') || e.target === this.content && e.offsetX > this.content.clientWidth) return;
        if (!e.ctrlKey) this.select(null);
        const band = document.createElement('div');
        band.className = 'rubber';
        document.body.appendChild(band);
        const sx = e.clientX, sy = e.clientY;
        const base = new Set(this.selected);
        const rects = $$('.ex-item', this.view).map(el => ({ el, r: el.getBoundingClientRect() }));
        drag(e, {
            onMove: (dx, dy) => {
                const x = Math.min(sx, sx + dx), y = Math.min(sy, sy + dy), w = Math.abs(dx), h = Math.abs(dy);
                Object.assign(band.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
                this.selected = new Set(base);
                rects.forEach(({ el, r }) => {
                    if (r.left < x + w && r.right > x && r.top < y + h && r.bottom > y) this.selected.add(el.dataset.id);
                    el.classList.toggle('selected', this.selected.has(el.dataset.id));
                });
            },
            onEnd: () => { band.remove(); this.renderDetails(); this.renderCmdBar(); }
        });
    }

    openItem(id) {
        if (id === 'dvd') { messageBox({ title: 'Unidade de DVD-RW (D:)', icon: 'warning', text: 'Insira um disco na unidade D:.', parent: this.win }); return; }
        if (id.startsWith('app:')) { launch(id.slice(4)); return; }
        if (SPECIAL[id]) { this.navigate(id); return; }
        const n = FS.get(id);
        if (!n) return;
        if (n.parent === 'recycle') { properties(id); return; }
        if (n.type === 'folder') this.navigate(id);
        else openNode(id);
    }

    startRename(id) {
        const el = $(`.ex-item[data-id="${CSS.escape(id)}"] .ex-name`, this.view);
        if (!el) return;
        el.parentElement.style.position = 'relative';
        inlineRename(el, id, { onEnd: () => this.content.focus({ preventScroll: true }) });
    }

    newItem(kind) {
        if (!this.isNode() || this.loc === 'recycle') return;
        const id = createNew(this.loc, kind);
        if (!id) return;
        requestAnimationFrame(() => { this.select(id); this.startRename(id); });
    }

    itemMenu(x, y) {
        const sel = [...this.selected];
        const nodes = sel.map(id => FS.get(id)).filter(Boolean);
        const first = this.itemData(sel[0]);
        if (!first) return;
        if (first.kind !== 'node') {
            showMenu(x, y, [
                { label: 'Abrir', bold: true, action: () => this.openItem(first.id) },
                first.kind === 'drive' ? { label: 'Abrir em nova janela', action: () => launch('explorer', { path: first.id }) } : null,
                '-',
                { label: 'Propriedades', action: () => first.kind === 'drive' ? properties('root', 'drive') : launch('control', { page: 'system' }) },
            ].filter(Boolean));
            return;
        }
        if (this.loc === 'recycle') {
            showMenu(x, y, [
                { label: 'Restaurar', bold: true, action: () => restoreItems(sel) },
                '-',
                { label: 'Recortar', action: () => Clipboard.set(sel, 'cut') },
                '-',
                { label: 'Excluir', action: () => deleteItems(sel, this.win) },
                '-',
                { label: 'Propriedades', action: () => properties(sel[0]) },
            ]);
            return;
        }
        const n = nodes[0];
        const multi = nodes.length > 1;
        showMenu(x, y, [
            { label: n.type === 'folder' ? 'Abrir' : FS.isImage(n) ? 'Visualizar' : 'Abrir', bold: true, action: () => sel.forEach(id => this.openItem(id)) },
            n.type === 'folder' && !multi ? { label: 'Abrir em nova janela', action: () => launch('explorer', { path: n.id }) } : null,
            FS.isImage(n) && !multi ? { label: 'Editar', action: () => launch('paint', { file: n.id }) } : null,
            FS.isImage(n) && !multi ? { label: 'Definir como Plano de Fundo da Área de Trabalho', action: () => import('../shell/desktop.js').then(d => d.setWallpaperFromFile(n.id)) } : null,
            FS.isText(n) && !multi ? { label: 'Editar', action: () => launch('notepad', { file: n.id }) } : null,
            n.type === 'file' && !multi ? { label: 'Abrir com', sub: [
                { label: 'Bloco de Notas', icon: 'notepad', action: () => launch('notepad', { file: n.id }) },
                { label: 'Galeria de Fotos', icon: 'photos', action: () => launch('photos', { file: n.id }) },
                { label: 'Paint', icon: 'paint', action: () => launch('paint', { file: n.id }) },
            ] } : null,
            '-',
            { label: 'Enviar para', sub: [
                { label: 'Área de Trabalho (criar atalho)', icon: 'folder:desktop', action: () => nodes.forEach(x => FS.create('desktop', `${FS.displayName(x)} - Atalho`, 'link', JSON.stringify({ target: x.id }))) },
                { label: 'Documentos', icon: 'folder:documents', action: () => nodes.forEach(x => { try { FS.move(x.id, 'documents'); } catch (err) { errorBox(err.message); } }) },
            ] },
            '-',
            { label: 'Recortar', action: () => Clipboard.set(sel, 'cut') },
            { label: 'Copiar', action: () => Clipboard.set(sel, 'copy') },
            n.type === 'folder' && !multi ? { label: 'Colar', disabled: !Clipboard.has(), action: () => Clipboard.paste(n.id) } : null,
            '-',
            { label: 'Criar Atalho', disabled: multi, action: () => FS.create(n.parent, `${FS.displayName(n)} - Atalho`, 'link', JSON.stringify({ target: n.id })) },
            { label: 'Excluir', action: () => deleteItems(sel, this.win) },
            { label: 'Renomear', disabled: multi, action: () => this.startRename(n.id) },
            '-',
            { label: 'Propriedades', action: () => properties(n.id, nodeIcon(n)) },
        ].filter(Boolean));
    }

    bgMenu(x, y) {
        const canEdit = this.isNode() && this.loc !== 'recycle';
        const cur = this.viewMode;
        const items = [
            { label: 'Exibir', sub: VIEWS.map(([id, label]) => ({ label, radio: cur === id, action: () => { this.viewMode = id; } })) },
            { label: 'Classificar por', sub: this.columns().map(([k, label]) => ({ label, radio: this.sort.key === k, action: () => { this.sort = { key: k, dir: 1 }; this.render(); } })).concat(['-',
                { label: 'Crescente', radio: this.sort.dir > 0, action: () => { this.sort.dir = 1; this.render(); } },
                { label: 'Decrescente', radio: this.sort.dir < 0, action: () => { this.sort.dir = -1; this.render(); } }]) },
            { label: 'Atualizar', action: () => this.render() },
            '-',
        ];
        if (this.loc === 'recycle') {
            items.push({ label: 'Esvaziar Lixeira', disabled: !FS.children('recycle').length, action: () => emptyRecycle(this.win) });
            items.push({ label: 'Restaurar todos os itens', disabled: !FS.children('recycle').length, action: () => restoreItems(FS.children('recycle').map(n => n.id)) });
        } else if (canEdit) {
            items.push({ label: 'Colar', disabled: !Clipboard.has(), action: () => Clipboard.paste(this.loc) });
            items.push({ label: 'Colar Atalho', disabled: !Clipboard.has(), action: () => Clipboard.ids.forEach(id => { const n = FS.get(id); if (n) FS.create(this.loc, `${FS.displayName(n)} - Atalho`, 'link', JSON.stringify({ target: id })); }) });
            items.push('-');
            items.push({ label: 'Novo', sub: [
                { label: 'Pasta', icon: 'folder', action: () => this.newItem('folder') },
                '-',
                { label: 'Imagem de Bitmap', icon: 'imageFile', action: () => this.newItem('bitmap') },
                { label: 'Documento de Texto', icon: 'textFile', action: () => this.newItem('text') },
            ] });
        }
        items.push('-');
        items.push({ label: 'Propriedades', action: () => this.isNode() ? properties(this.loc) : launch('control', { page: 'system' }) });
        showMenu(x, y, items);
    }

    onKey(e) {
        const sel = [...this.selected].filter(id => FS.get(id));
        const k = e.key;
        if (k === 'Delete' && sel.length) { e.preventDefault(); deleteItems(sel, this.win); }
        else if (k === 'F2' && sel.length === 1) { e.preventDefault(); this.startRename(sel[0]); }
        else if (k === 'Enter' && this.selected.size) { e.preventDefault(); [...this.selected].forEach(id => this.openItem(id)); }
        else if (k === 'Backspace') { e.preventDefault(); this.back(); }
        else if (k === 'F5') { e.preventDefault(); this.render(); }
        else if (e.altKey && k === 'ArrowLeft') { e.preventDefault(); this.back(); }
        else if (e.altKey && k === 'ArrowRight') { e.preventDefault(); this.forward(); }
        else if (e.altKey && k === 'ArrowUp') { e.preventDefault(); this.up(); }
        else if (e.ctrlKey && k.toLowerCase() === 'a') { e.preventDefault(); this.selectAll(); }
        else if (e.ctrlKey && k.toLowerCase() === 'c' && sel.length) { e.preventDefault(); Clipboard.set(sel, 'copy'); }
        else if (e.ctrlKey && k.toLowerCase() === 'x' && sel.length) { e.preventDefault(); Clipboard.set(sel, 'cut'); }
        else if (e.ctrlKey && k.toLowerCase() === 'v' && this.isNode() && this.loc !== 'recycle') { e.preventDefault(); Clipboard.paste(this.loc); }
        else if (e.ctrlKey && e.shiftKey && k.toLowerCase() === 'n') { e.preventDefault(); this.newItem('folder'); }
        else if (k.startsWith('Arrow')) {
            e.preventDefault();
            const els = $$('.ex-item', this.view);
            if (!els.length) return;
            const cur = els.findIndex(el => el.dataset.id === this.anchor);
            let next;
            if (cur < 0) next = 0;
            else {
                const r0 = els[cur].getBoundingClientRect();
                const perRow = els.filter(el => Math.abs(el.getBoundingClientRect().top - els[0].getBoundingClientRect().top) < 2).length || 1;
                const isRow = this.viewMode === 'details' || this.viewMode === 'list';
                const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: isRow ? -1 : -perRow, ArrowDown: isRow ? 1 : perRow }[k];
                next = clamp(cur + step, 0, els.length - 1);
                void r0;
            }
            this.select(els[next].dataset.id, { range: e.shiftKey });
            els[next].scrollIntoView({ block: 'nearest' });
        } else if (k.length === 1 && !e.ctrlKey && !e.altKey) {
            const els = $$('.ex-item', this.view);
            const hit = els.find(el => el.querySelector('.ex-name')?.textContent.toLowerCase().startsWith(k.toLowerCase()));
            if (hit) { this.select(hit.dataset.id); hit.scrollIntoView({ block: 'nearest' }); }
        }
    }

    /* ---------- Drag & drop (HTML5) ---------- */
    setupDnD(container, itemSel, isView = false) {
        container.addEventListener('dragstart', e => {
            const it = e.target.closest('.ex-item');
            if (!it || !isView) return;
            if (!this.selected.has(it.dataset.id)) this.select(it.dataset.id);
            const ids = [...this.selected].filter(id => FS.get(id) && !FS.get(id).sys);
            if (!ids.length) { e.preventDefault(); return; }
            e.dataTransfer.setData(DND_TYPE, JSON.stringify(ids));
            e.dataTransfer.setData('text/plain', ids.map(id => FS.get(id).name).join(', '));
            e.dataTransfer.effectAllowed = 'copyMove';
        });
        const targetOf = e => {
            const el = e.target.closest(itemSel);
            if (el) {
                const id = el.dataset.id;
                if (FS.get(id)?.type === 'folder' || id === 'recycle') return { el, id };
                if (!isView) return null;
            }
            if (isView && this.isNode() && !this.query) return { el: null, id: this.loc };
            return null;
        };
        container.addEventListener('dragover', e => {
            if (!e.dataTransfer.types.includes(DND_TYPE)) return;
            const t = targetOf(e);
            $$('.drop-hover', container).forEach(x => x.classList.remove('drop-hover'));
            if (!t) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
            t.el?.classList.add('drop-hover');
        });
        container.addEventListener('dragleave', e => { if (!container.contains(e.relatedTarget)) $$('.drop-hover', container).forEach(x => x.classList.remove('drop-hover')); });
        container.addEventListener('drop', e => {
            $$('.drop-hover', container).forEach(x => x.classList.remove('drop-hover'));
            const t = targetOf(e);
            if (!t) return;
            e.preventDefault();
            let ids;
            try { ids = JSON.parse(e.dataTransfer.getData(DND_TYPE)); } catch { return; }
            ids = ids.filter(id => id !== t.id && FS.get(id));
            if (!ids.length) return;
            if (t.id === 'recycle') { deleteItems(ids, this.win); return; }
            ids.forEach(id => {
                try {
                    if (e.ctrlKey) FS.copy(id, t.id);
                    else if (FS.get(id).parent !== t.id) FS.move(id, t.id);
                } catch (err) { errorBox(err.message, { parent: this.win }); }
            });
        });
    }
}

export { DND_TYPE };
