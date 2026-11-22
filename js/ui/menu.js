// Vista-style context menus, submenus and menu bars.
import { esc, clamp } from '../core/util.js';
import { ico } from '../core/icons.js';

let layer = null;
let openMenus = [];
let onCloseAll = null;

function ensureLayer() {
    if (!layer) {
        layer = document.createElement('div');
        layer.id = 'menu-layer';
        document.body.appendChild(layer);
    }
    return layer;
}

function closeFrom(level) {
    while (openMenus.length > level) {
        const m = openMenus.pop();
        m.el.remove();
    }
}

export function closeMenus() {
    if (!openMenus.length) return;
    closeFrom(0);
    const cb = onCloseAll; onCloseAll = null;
    cb?.();
}

function build(items, level) {
    const el = document.createElement('div');
    el.className = 'ctx-menu';
    el.setAttribute('role', 'menu');
    const hasIcons = items.some(i => i && i !== '-' && (i.icon || i.checked !== undefined || i.radio !== undefined));
    if (!hasIcons) el.classList.add('no-gutter');
    items.forEach((it, idx) => {
        if (!it) return;
        if (it === '-') { el.insertAdjacentHTML('beforeend', '<div class="ctx-sep"></div>'); return; }
        const row = document.createElement('div');
        row.className = 'ctx-item' + (it.disabled ? ' disabled' : '') + (it.bold ? ' bold' : '') + (it.sub ? ' has-sub' : '');
        row.setAttribute('role', 'menuitem');
        row.dataset.idx = idx;
        let mark = '';
        if (it.checked) mark = '<span class="ctx-check">✓</span>';
        else if (it.radio) mark = '<span class="ctx-radio">●</span>';
        else if (it.icon) mark = ico(it.icon, 16);
        row.innerHTML = `<span class="ctx-gutter">${mark}</span><span class="ctx-label">${esc(it.label)}</span>` +
            `<span class="ctx-key">${esc(it.key || '')}</span>${it.sub ? '<span class="ctx-arrow">▸</span>' : ''}`;
        let subTimer = null;
        row.addEventListener('pointerenter', () => {
            el.querySelectorAll('.ctx-item.hot').forEach(x => x.classList.remove('hot'));
            row.classList.add('hot');
            clearTimeout(subTimer);
            subTimer = setTimeout(() => {
                closeFrom(level + 1);
                if (it.sub && !it.disabled) openSub(row, typeof it.sub === 'function' ? it.sub() : it.sub, level + 1);
            }, it.sub ? 180 : 250);
        });
        row.addEventListener('pointerleave', () => clearTimeout(subTimer));
        row.addEventListener('click', e => {
            e.stopPropagation();
            if (it.disabled) return;
            if (it.sub) { closeFrom(level + 1); openSub(row, typeof it.sub === 'function' ? it.sub() : it.sub, level + 1); return; }
            closeMenus();
            it.action?.();
        });
        el.appendChild(row);
    });
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('pointerdown', e => e.stopPropagation());
    return el;
}

function place(el, x, y, alt = null) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const r = el.getBoundingClientRect();
    let left = x, top = y;
    if (left + r.width > vw - 2) left = alt ? alt.x - r.width : vw - r.width - 2;
    if (top + r.height > vh - 2) top = alt?.bottomAlign ? alt.y - r.height : vh - r.height - 2;
    el.style.left = clamp(left, 2, vw - r.width - 2) + 'px';
    el.style.top = clamp(top, 2, vh - r.height - 2) + 'px';
}

function openSub(row, items, level) {
    const el = build(items, level);
    ensureLayer().appendChild(el);
    const r = row.getBoundingClientRect();
    place(el, r.right - 3, r.top - 3, { x: r.left + 3 });
    openMenus.push({ el });
}

/**
 * Show a context menu at (x, y).
 * items: [{label, icon, key, action, disabled, checked, radio, bold, sub}, '-', ...]
 */
export function showMenu(x, y, items, { onClose, above = false } = {}) {
    closeMenus();
    const el = build(items, 0);
    ensureLayer().appendChild(el);
    if (above) {
        const r = el.getBoundingClientRect();
        place(el, x, y - r.height, null);
    } else place(el, x, y);
    openMenus.push({ el });
    onCloseAll = onClose || null;
    el.classList.add('pop');
    return el;
}

export const menuOpen = () => openMenus.length > 0;

// Clicking anywhere else closes menus.
window.addEventListener('pointerdown', () => closeMenus());
window.addEventListener('blur', () => closeMenus());
window.addEventListener('keydown', e => {
    if (!openMenus.length) return;
    const top = openMenus[openMenus.length - 1].el;
    const rows = [...top.querySelectorAll('.ctx-item:not(.disabled)')];
    const cur = rows.indexOf(top.querySelector('.ctx-item.hot'));
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); e.stopPropagation();
        const n = rows.length ? (cur + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length : -1;
        rows.forEach(r => r.classList.remove('hot'));
        rows[n]?.classList.add('hot');
    } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        const hot = top.querySelector('.ctx-item.hot');
        if (hot && (e.key === 'Enter' || hot.classList.contains('has-sub'))) { e.preventDefault(); e.stopPropagation(); hot.click(); }
    } else if (e.key === 'ArrowLeft' && openMenus.length > 1) {
        e.preventDefault(); e.stopPropagation(); closeFrom(openMenus.length - 1);
    }
}, true);

/**
 * Classic menu bar (Arquivo, Editar, ...). spec: [{label:'Arquivo', items: () => [...]}]
 */
export function menuBar(spec) {
    const bar = document.createElement('div');
    bar.className = 'menubar';
    let active = null;
    const open = (btn, m) => {
        const r = btn.getBoundingClientRect();
        bar.querySelectorAll('.mb-item').forEach(b => b.classList.toggle('open', b === btn));
        active = btn;
        showMenu(r.left, r.bottom, typeof m.items === 'function' ? m.items() : m.items, {
            onClose: () => { if (active === btn) { btn.classList.remove('open'); active = null; } }
        });
    };
    spec.forEach(m => {
        const b = document.createElement('div');
        b.className = 'mb-item';
        b.textContent = m.label;
        b.addEventListener('pointerdown', e => {
            e.stopPropagation();
            if (active === b) { closeMenus(); return; }
            open(b, m);
        });
        b.addEventListener('pointerenter', () => { if (active && active !== b) open(b, m); });
        bar.appendChild(b);
    });
    return bar;
}
