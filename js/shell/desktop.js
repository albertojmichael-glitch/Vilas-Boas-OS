// Desktop: wallpaper, theme colours, icons (drag, select, rename) and the desktop context menu.
import { $, $$, bus, esc, drag, clamp } from '../core/util.js';
import { Settings, WALLPAPERS, GLASS_COLORS } from '../core/settings.js';
import { FS } from '../core/fs.js';
import { ico } from '../core/icons.js';
import { showMenu } from '../ui/menu.js';
import { properties } from '../ui/dialogs.js';
import { WM, TASKBAR_H } from '../wm.js';
import { launch, openNode, nodeIcon } from '../apps/registry.js';
import { Clipboard, deleteItems, emptyRecycle, createNew, inlineRename } from './fileops.js';

let root, iconLayer;
const selected = new Set();
let lastSelected = null;

const SYS = [
    { key: 'sys:computer', name: 'Computador', icon: 'computer', open: () => launch('computer') },
    { key: 'sys:home', name: () => FS.get('home')?.name || 'Usuário', icon: 'folder:home', open: () => launch('explorer', { path: 'home' }), nodeId: 'home' },
    { key: 'sys:network', name: 'Rede', icon: 'network', open: () => launch('network') },
    { key: 'sys:recycle', name: 'Lixeira', icon: () => FS.children('recycle').length ? 'trashFull' : 'trash', open: () => launch('recycle'), nodeId: 'recycle' },
];

const SIZES = { large: { icon: 64, cw: 100, ch: 108 }, medium: { icon: 48, cw: 84, ch: 90 }, classic: { icon: 32, cw: 84, ch: 70 } };
const grid = () => SIZES[Settings.get('desktopIconSize')] || SIZES.medium;

/* ---------- Theme ---------- */
export function applyWallpaper() {
    const el = $('#wallpaper');
    el.dataset.fit = Settings.get('wallpaperFit');
    const cur = String(Settings.get('wallpaper') || '');
    if (cur.startsWith('fs:')) {
        const n = FS.get(cur.slice(3));
        if (n) { el.style.backgroundColor = '#000'; el.style.backgroundImage = `url("${n.content}")`; return; }
    }
    const wp = WALLPAPERS.find(w => w.id === cur) || WALLPAPERS[0];
    if (wp.color) { el.style.backgroundImage = 'none'; el.style.backgroundColor = wp.color; }
    else { el.style.backgroundColor = '#000'; el.style.backgroundImage = `url("${wp.src}")`; }
}

/** Use an image from the file system as wallpaper. */
export function setWallpaperFromFile(id) {
    const n = FS.get(id);
    if (!n) return;
    const el = $('#wallpaper');
    el.style.backgroundColor = '#000';
    el.style.backgroundImage = `url("${n.content}")`;
    Settings.set('wallpaper', 'fs:' + id);
}

export function applyGlass() {
    const c = GLASS_COLORS.find(g => g.id === Settings.get('glassColor')) || GLASS_COLORS[0];
    const r = document.documentElement.style;
    const [R, G, B] = c.rgb;
    const k = Settings.get('glassIntensity') / 100;
    r.setProperty('--glass-rgb', `${R}, ${G}, ${B}`);
    r.setProperty('--glass-a', (0.18 + k * 0.62).toFixed(3));
    r.setProperty('--glass-a2', (0.10 + k * 0.45).toFixed(3));
    document.body.classList.toggle('no-transparency', !Settings.get('transparency'));
    document.body.classList.toggle('glass-dark', (R * 0.3 + G * 0.59 + B * 0.11) < 90 && k > 0.4);
    document.body.classList.toggle('reduce-motion', !!Settings.get('reduceMotion'));
}

/* ---------- Icons ---------- */
function items() {
    const list = SYS.filter(s => s.key !== 'sys:network').map(s => ({
        key: s.key, sys: s, name: typeof s.name === 'function' ? s.name() : s.name,
        icon: typeof s.icon === 'function' ? s.icon() : s.icon, nodeId: s.nodeId || null,
    }));
    FS.children('desktop').forEach(n => list.push({
        key: n.id, node: n, nodeId: n.id, name: FS.displayName(n), icon: nodeIcon(n), shortcut: n.type === 'link',
    }));
    return list;
}

function layout() {
    const g = grid();
    const H = window.innerHeight - TASKBAR_H - 8;
    const rows = Math.max(1, Math.floor(H / g.ch));
    const pos = Settings.get('iconPositions') || {};
    const auto = Settings.get('autoArrange');
    const taken = new Set();
    const list = items();
    const cellOf = (x, y) => `${Math.round((x - 4) / g.cw)},${Math.round((y - 4) / g.ch)}`;
    const placed = {};
    if (!auto) list.forEach(it => {
        const p = pos[it.key];
        if (!p) return;
        const x = clamp(p.x, 0, window.innerWidth - g.cw), y = clamp(p.y, 0, H - g.ch + 8);
        placed[it.key] = { x, y };
        taken.add(cellOf(x, y));
    });
    let c = 0, r = 0;
    list.forEach(it => {
        if (placed[it.key]) return;
        while (taken.has(`${c},${r}`)) { r++; if (r >= rows) { r = 0; c++; } }
        placed[it.key] = { x: 4 + c * g.cw, y: 4 + r * g.ch };
        taken.add(`${c},${r}`);
    });
    return { list, placed };
}

export function renderIcons() {
    if (!iconLayer) return;
    const g = grid();
    iconLayer.className = 'desk-icons size-' + Settings.get('desktopIconSize');
    iconLayer.hidden = !Settings.get('showDesktopIcons');
    const { list, placed } = layout();
    const keys = new Set(list.map(i => i.key));
    [...selected].forEach(k => { if (!keys.has(k)) selected.delete(k); });
    iconLayer.innerHTML = list.map(it => {
        const p = placed[it.key];
        const cut = Clipboard.mode === 'cut' && Clipboard.ids.includes(it.nodeId);
        return `<div class="desk-icon${selected.has(it.key) ? ' selected' : ''}${cut ? ' cut' : ''}" data-key="${esc(it.key)}" tabindex="-1"
            style="left:${p.x}px;top:${p.y}px;width:${g.cw - 4}px">
            ${ico(it.icon, g.icon, { shortcut: it.shortcut })}
            <span class="desk-label">${esc(it.name)}</span></div>`;
    }).join('');
}

function itemByKey(key) { return items().find(i => i.key === key); }

function select(key, { add = false, toggle = false } = {}) {
    if (!add && !toggle) selected.clear();
    if (toggle && selected.has(key)) selected.delete(key); else if (key) selected.add(key);
    lastSelected = key;
    $$('.desk-icon', iconLayer).forEach(el => el.classList.toggle('selected', selected.has(el.dataset.key)));
}

function openItem(key) {
    const it = itemByKey(key);
    if (!it) return;
    if (it.sys) it.sys.open();
    else openNode(it.node.id);
}

const selectedNodeIds = () => [...selected].map(k => itemByKey(k)).filter(i => i && !i.sys).map(i => i.node.id);

function savePos(key, x, y) {
    const g = grid();
    const pos = { ...(Settings.get('iconPositions') || {}) };
    if (Settings.get('alignToGrid')) {
        x = 4 + Math.round((x - 4) / g.cw) * g.cw;
        y = 4 + Math.round((y - 4) / g.ch) * g.ch;
    }
    pos[key] = { x: Math.max(0, x), y: Math.max(0, y) };
    Settings.set('iconPositions', pos);
}

function startRename(key) {
    const it = itemByKey(key);
    if (!it?.nodeId) return;
    const el = $(`.desk-icon[data-key="${CSS.escape(key)}"] .desk-label`, iconLayer);
    if (el) inlineRename(el, it.nodeId, { onEnd: () => renderIcons() });
}

/** Drop handling shared with Explorer: move nodes into a folder (or trash). */
export function dropInto(targetId, ids) {
    const valid = ids.filter(id => id !== targetId && FS.get(id));
    if (!valid.length) return;
    if (targetId === 'recycle') { deleteItems(valid); return; }
    valid.forEach(id => { try { FS.move(id, targetId); } catch (err) { import('../ui/dialogs.js').then(d => d.errorBox(err.message)); } });
}

function iconPointerDown(e, el) {
    if (e.button === 2) return;
    const key = el.dataset.key;
    root.focus({ preventScroll: true });
    if (e.ctrlKey) { select(key, { toggle: true }); return; }
    if (!selected.has(key)) select(key);
    const moving = [...selected].map(k => $(`.desk-icon[data-key="${CSS.escape(k)}"]`, iconLayer)).filter(Boolean);
    const starts = moving.map(m => ({ el: m, x: m.offsetLeft, y: m.offsetTop }));
    let dragging = false;
    let hoverEl = null;
    drag(e, {
        onMove: (dx, dy, ev) => {
            if (!dragging && Math.hypot(dx, dy) < 5) return;
            dragging = true;
            starts.forEach(s => { s.el.classList.add('dragging'); s.el.style.left = s.x + dx + 'px'; s.el.style.top = s.y + dy + 'px'; });
            const under = document.elementsFromPoint(ev.clientX, ev.clientY).find(n => !n.closest('.dragging') && (n.closest('.desk-icon') || n.closest('.win')));
            const tgt = under?.closest('.desk-icon');
            const tgtIt = tgt && itemByKey(tgt.dataset.key);
            const isFolder = tgtIt && (tgtIt.key === 'sys:recycle' || tgtIt.node?.type === 'folder' || tgtIt.key === 'sys:home');
            if (hoverEl !== (isFolder ? tgt : null)) {
                hoverEl?.classList.remove('drop-target');
                hoverEl = isFolder ? tgt : null;
                hoverEl?.classList.add('drop-target');
            }
        },
        onEnd: (ev, dx, dy) => {
            hoverEl?.classList.remove('drop-target');
            if (!dragging) return;
            starts.forEach(s => s.el.classList.remove('dragging'));
            const ids = selectedNodeIds();
            if (hoverEl) {
                const t = itemByKey(hoverEl.dataset.key);
                dropInto(t.nodeId, ids);
                renderIcons();
                return;
            }
            const under = document.elementsFromPoint(ev.clientX, ev.clientY).find(n => n.closest('.win'));
            const w = under && WM.fromElement(under);
            if (w?.dropTarget) {
                const target = w.dropTarget(under);
                if (target && ids.length) { dropInto(target, ids); renderIcons(); return; }
            }
            if (under?.closest('.win')) { renderIcons(); return; }
            starts.forEach(s => savePos(s.el.dataset.key, s.x + dx, s.y + dy));
            renderIcons();
        }
    });
}

function rubberBand(e) {
    const band = document.createElement('div');
    band.className = 'rubber';
    root.appendChild(band);
    const sx = e.clientX, sy = e.clientY;
    const base = e.ctrlKey ? new Set(selected) : new Set();
    const icons = $$('.desk-icon', iconLayer).map(el => ({ el, r: el.getBoundingClientRect() }));
    drag(e, {
        onMove: (dx, dy) => {
            const x = Math.min(sx, sx + dx), y = Math.min(sy, sy + dy), w = Math.abs(dx), h = Math.abs(dy);
            Object.assign(band.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
            selected.clear(); base.forEach(k => selected.add(k));
            icons.forEach(({ el, r }) => {
                const hit = r.left < x + w && r.right > x && r.top < y + h && r.bottom > y;
                if (hit) selected.add(el.dataset.key);
                el.classList.toggle('selected', selected.has(el.dataset.key));
            });
        },
        onEnd: () => band.remove()
    });
}

/* ---------- Context menus ---------- */
function iconMenu(x, y, key) {
    if (!selected.has(key)) select(key);
    const it = itemByKey(key);
    const multi = selected.size > 1;
    const ids = selectedNodeIds();
    if (it.sys) {
        const extra = it.key === 'sys:recycle'
            ? [{ label: 'Esvaziar Lixeira', disabled: !FS.children('recycle').length, action: () => emptyRecycle() }]
            : it.key === 'sys:computer'
                ? [{ label: 'Gerenciar', icon: 'shield', action: () => launch('control', { page: 'system' }) }]
                : [];
        showMenu(x, y, [
            { label: 'Abrir', bold: true, action: () => openItem(key) },
            { label: 'Explorar', action: () => openItem(key) },
            ...extra,
            '-',
            { label: 'Criar Atalho', disabled: true },
            { label: 'Renomear', disabled: it.key !== 'sys:home', action: () => startRename(key) },
            '-',
            { label: 'Propriedades', action: () => it.key === 'sys:computer' ? launch('control', { page: 'system' }) : properties(it.nodeId, it.icon) },
        ]);
        return;
    }
    const n = it.node;
    const isImg = FS.isImage(n);
    showMenu(x, y, [
        { label: 'Abrir', bold: true, action: () => [...selected].forEach(openItem) },
        isImg && !multi ? { label: 'Editar', action: () => launch('paint', { file: n.id }) } : null,
        isImg && !multi ? { label: 'Definir como Plano de Fundo da Área de Trabalho', action: () => setWallpaperFromFile(n.id) } : null,
        FS.isText(n) && !multi ? { label: 'Editar', action: () => launch('notepad', { file: n.id }) } : null,
        '-',
        { label: 'Enviar para', sub: [
            { label: 'Documentos', icon: 'folder:documents', action: () => dropInto('documents', ids) },
            { label: 'Lixeira', icon: 'trash', action: () => deleteItems(ids) },
        ] },
        '-',
        { label: 'Recortar', action: () => { Clipboard.set(ids, 'cut'); renderIcons(); } },
        { label: 'Copiar', action: () => Clipboard.set(ids, 'copy') },
        '-',
        { label: 'Criar Atalho', disabled: multi, action: () => FS.create('desktop', `${FS.displayName(n)} - Atalho`, 'link', JSON.stringify({ target: n.id })) },
        { label: 'Excluir', action: () => deleteItems(ids) },
        { label: 'Renomear', disabled: multi, action: () => startRename(key) },
        '-',
        { label: 'Propriedades', action: () => properties(n.id, it.icon) },
    ].filter(Boolean));
}

function desktopMenu(x, y) {
    const size = Settings.get('desktopIconSize');
    const sortBy = how => {
        const g = grid();
        const H = window.innerHeight - TASKBAR_H - 8;
        const rows = Math.max(1, Math.floor(H / g.ch));
        const list = items();
        const sys = list.filter(i => i.sys), rest = list.filter(i => !i.sys);
        const key = {
            name: (a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }),
            size: (a, b) => FS.size(a.nodeId) - FS.size(b.nodeId),
            type: (a, b) => FS.typeName(a.node).localeCompare(FS.typeName(b.node)),
            date: (a, b) => b.node.modified - a.node.modified,
        }[how];
        rest.sort(key);
        const pos = {};
        [...sys, ...rest].forEach((it, i) => { pos[it.key] = { x: 4 + Math.floor(i / rows) * g.cw, y: 4 + (i % rows) * g.ch }; });
        Settings.set('iconPositions', pos);
        renderIcons();
    };
    showMenu(x, y, [
        { label: 'Exibir', sub: [
            { label: 'Ícones Grandes', radio: size === 'large', action: () => Settings.set('desktopIconSize', 'large') },
            { label: 'Ícones Médios', radio: size === 'medium', action: () => Settings.set('desktopIconSize', 'medium') },
            { label: 'Ícones Clássicos', radio: size === 'classic', action: () => Settings.set('desktopIconSize', 'classic') },
            '-',
            { label: 'Organizar Automaticamente', checked: Settings.get('autoArrange'), action: () => Settings.set('autoArrange', !Settings.get('autoArrange')) },
            { label: 'Alinhar à Grade', checked: Settings.get('alignToGrid'), action: () => Settings.set('alignToGrid', !Settings.get('alignToGrid')) },
            '-',
            { label: 'Mostrar Ícones da Área de Trabalho', checked: Settings.get('showDesktopIcons'), action: () => Settings.set('showDesktopIcons', !Settings.get('showDesktopIcons')) },
        ] },
        { label: 'Classificar por', sub: [
            { label: 'Nome', action: () => sortBy('name') },
            { label: 'Tamanho', action: () => sortBy('size') },
            { label: 'Tipo', action: () => sortBy('type') },
            { label: 'Data de modificação', action: () => sortBy('date') },
        ] },
        { label: 'Atualizar', action: () => { iconLayer.style.opacity = '0'; setTimeout(() => { renderIcons(); iconLayer.style.opacity = ''; }, 120); } },
        '-',
        { label: 'Colar', disabled: !Clipboard.has(), action: () => Clipboard.paste('desktop') },
        { label: 'Colar Atalho', disabled: !Clipboard.has() || Clipboard.mode !== 'copy', action: () => Clipboard.ids.forEach(id => { const n = FS.get(id); if (n) FS.create('desktop', `${FS.displayName(n)} - Atalho`, 'link', JSON.stringify({ target: id })); }) },
        '-',
        { label: 'Novo', sub: [
            { label: 'Pasta', icon: 'folder', action: () => newItem('folder') },
            { label: 'Atalho', icon: 'run', sub: Object.entries({ browser: 'Navegador', notepad: 'Bloco de Notas', calculator: 'Calculadora', paint: 'Paint', mines: 'Caça-Minas', cmd: 'Prompt de Comando', control: 'Painel de Controle' })
                .map(([app, label]) => ({ label, action: () => FS.create('desktop', label, 'link', JSON.stringify({ app })) })) },
            '-',
            { label: 'Imagem de Bitmap', icon: 'imageFile', action: () => newItem('bitmap') },
            { label: 'Documento de Texto', icon: 'textFile', action: () => newItem('text') },
        ] },
        '-',
        { label: 'Personalizar', icon: 'personalize', action: () => launch('control', { page: 'personalize' }) },
    ]);
}

function newItem(kind) {
    const id = createNew('desktop', kind);
    if (!id) return;
    requestAnimationFrame(() => { selected.clear(); select(id); startRename(id); });
}

/* ---------- Init ---------- */
export const Desktop = {
    init() {
        root = $('#desktop');
        iconLayer = $('#desk-icons');
        applyWallpaper();
        applyGlass();
        renderIcons();

        root.addEventListener('pointerdown', e => {
            const icon = e.target.closest('.desk-icon');
            if (icon) { iconPointerDown(e, icon); return; }
            if (e.target.closest('#desk-icons, #wallpaper') || e.target === root) {
                if (e.button !== 0) return;
                root.focus({ preventScroll: true });
                if (!e.ctrlKey) select(null);
                rubberBand(e);
                const a = WM.active();
                if (a) { a.el.classList.remove('active'); }
                bus.emit('wm', 'focus', null);
            }
        });
        // Files dragged out of an Explorer window onto the desktop.
        root.addEventListener('dragover', e => {
            if (e.target.closest('.win') || !e.dataTransfer.types.includes('application/x-vbos-nodes')) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        root.addEventListener('drop', e => {
            if (e.target.closest('.win')) return;
            let ids;
            try { ids = JSON.parse(e.dataTransfer.getData('application/x-vbos-nodes')); } catch { return; }
            e.preventDefault();
            const icon = e.target.closest('.desk-icon');
            const it = icon && itemByKey(icon.dataset.key);
            if (it && (it.key === 'sys:recycle' || it.node?.type === 'folder' || it.key === 'sys:home')) { dropInto(it.nodeId, ids); return; }
            ids.forEach((id, i) => {
                try {
                    const target = e.ctrlKey ? FS.copy(id, 'desktop').id : (FS.move(id, 'desktop'), id);
                    savePos(target, e.clientX - 40, e.clientY - 30 + i * grid().ch);
                } catch (err) { import('../ui/dialogs.js').then(d => d.errorBox(err.message)); }
            });
            renderIcons();
        });
        root.addEventListener('dblclick', e => {
            const icon = e.target.closest('.desk-icon');
            if (icon) openItem(icon.dataset.key);
        });
        root.addEventListener('contextmenu', e => {
            if (e.target.closest('.win, .sidebar')) return;
            e.preventDefault();
            const icon = e.target.closest('.desk-icon');
            if (icon) iconMenu(e.clientX, e.clientY, icon.dataset.key);
            else { select(null); desktopMenu(e.clientX, e.clientY); }
        });
        root.addEventListener('keydown', e => {
            if (e.target !== root) return;
            const ids = selectedNodeIds();
            if (e.key === 'Delete' && ids.length) deleteItems(ids);
            else if (e.key === 'F2' && selected.size === 1) startRename([...selected][0]);
            else if (e.key === 'Enter') [...selected].forEach(openItem);
            else if (e.key === 'F5') renderIcons();
            else if (e.ctrlKey && e.key.toLowerCase() === 'a') { e.preventDefault(); items().forEach(i => selected.add(i.key)); renderIcons(); }
            else if (e.ctrlKey && e.key.toLowerCase() === 'c' && ids.length) Clipboard.set(ids, 'copy');
            else if (e.ctrlKey && e.key.toLowerCase() === 'x' && ids.length) { Clipboard.set(ids, 'cut'); renderIcons(); }
            else if (e.ctrlKey && e.key.toLowerCase() === 'v') Clipboard.paste('desktop');
            else if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                const els = $$('.desk-icon', iconLayer);
                if (!els.length) return;
                const cur = els.find(el => el.dataset.key === lastSelected) || els[0];
                const r0 = cur.getBoundingClientRect();
                const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
                let best = null, bestD = Infinity;
                els.forEach(el => {
                    if (el === cur) return;
                    const r = el.getBoundingClientRect();
                    const dx = r.left - r0.left, dy = r.top - r0.top;
                    if (dir[0] && Math.sign(dx) !== dir[0]) return;
                    if (dir[1] && Math.sign(dy) !== dir[1]) return;
                    const d = Math.abs(dx) * (dir[0] ? 1 : 3) + Math.abs(dy) * (dir[1] ? 1 : 3);
                    if (d < bestD) { bestD = d; best = el; }
                });
                if (best) select(best.dataset.key); else if (!selected.size) select(cur.dataset.key);
            }
        });

        bus.on('fs', () => renderIcons());
        bus.on('clipboard', () => renderIcons());
        bus.on('settings', key => {
            if (['wallpaper', 'wallpaperFit'].includes(key)) applyWallpaper();
            if (['glassColor', 'glassIntensity', 'transparency', 'reduceMotion'].includes(key)) applyGlass();
            if (['desktopIconSize', 'showDesktopIcons', 'autoArrange', 'alignToGrid', 'showExtensions', 'userName'].includes(key)) renderIcons();
        });
        let rt;
        window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderIcons, 150); });
    },
    renderIcons,
};
