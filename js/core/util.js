// Small helpers shared by the whole shell.

const listeners = new Map();

/** Global event bus: bus.on('fs', fn) / bus.emit('fs', data). */
export const bus = {
    on(ev, fn) {
        if (!listeners.has(ev)) listeners.set(ev, new Set());
        listeners.get(ev).add(fn);
        return () => listeners.get(ev).delete(fn);
    },
    emit(ev, ...args) {
        const set = listeners.get(ev);
        if (!set) return;
        [...set].forEach(fn => {
            try { fn(...args); } catch (err) { console.error(`[bus:${ev}]`, err); }
        });
    }
};

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const uid = (p = 'id') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Parse an HTML string into a single element (or fragment when several roots). */
export function html(str) {
    const t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function formatSize(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} bytes`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.max(1, Math.round(kb)).toLocaleString('pt-BR')} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
    return `${(mb / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} GB`;
}

export function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Pointer-drag helper. onMove(dx, dy, ev) / onEnd(ev). Returns nothing; attaches to window. */
export function drag(ev, { onMove, onEnd, cursor } = {}) {
    const sx = ev.clientX, sy = ev.clientY;
    const prevCursor = document.body.style.cursor;
    if (cursor) document.body.style.cursor = cursor;
    document.body.classList.add('is-dragging');
    const move = e => onMove?.(e.clientX - sx, e.clientY - sy, e);
    const up = e => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        document.body.style.cursor = prevCursor;
        document.body.classList.remove('is-dragging');
        onEnd?.(e, e.clientX - sx, e.clientY - sy);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
}

/** Read/write JSON in localStorage without ever throwing. */
export const store = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw == null ? fallback : JSON.parse(raw);
        } catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch (err) { console.warn('storage full/blocked', err); return false; }
    },
    remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

export function extOf(name) {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function baseName(name) {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(0, i) : name;
}
