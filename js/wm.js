// Window manager: Aero glass windows with drag, resize, minimize, maximize and z-order.
import { bus, drag, clamp, esc } from './core/util.js';
import { ico } from './core/icons.js';
import { Settings } from './core/settings.js';
import { closeMenus, showMenu } from './ui/menu.js';

export const TASKBAR_H = 30;
let layer = null;
let zTop = 100;
let seq = 0;
let cascadeN = 0;
const wins = new Map();
let activeWin = null;
let desktopShown = null; // windows minimized by "show desktop"

const reduce = () => Settings.get('reduceMotion');

export function workArea() {
    return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight - TASKBAR_H };
}

class Win {
    constructor(o) {
        this.id = 'w' + (++seq);
        this.opts = o;
        this.appId = o.app || null;
        this.title = o.title || '';
        this.icon = o.icon || 'file';
        this.state = 'normal';
        this.parent = o.parent || null;
        this.children = new Set();
        this.closeHandlers = [];
        this.resizeHandlers = [];
        this.closed = false;
        this.build();
    }

    build() {
        const o = this.opts;
        const el = document.createElement('div');
        el.className = 'win' + (o.cls ? ' ' + o.cls : '') + (o.dialog ? ' dialog' : '') + (o.resizable === false ? ' fixed' : '') + (o.hideTitle ? ' hide-title' : '');
        el.dataset.win = this.id;
        el.setAttribute('role', o.dialog ? 'dialog' : 'application');
        el.innerHTML = `
            <div class="win-title"><span class="win-ico">${o.dialog && !o.showIcon ? '' : ico(this.icon, 16)}</span><span class="win-text">${esc(o.hideTitle ? '' : this.title)}</span></div>
            <div class="win-caption">
                ${o.dialog || o.minimizable === false ? '' : '<button class="cap cap-min" data-tip="Minimizar" tabindex="-1"><i></i></button>'}
                ${o.dialog || o.resizable === false || o.maximizable === false ? '' : '<button class="cap cap-max" data-tip="Maximizar" tabindex="-1"><i></i></button>'}
                <button class="cap cap-close" data-tip="Fechar" tabindex="-1"><i></i></button>
            </div>
            <div class="win-glass"></div>
            <div class="win-body"></div>
            ${o.resizable === false ? '' : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="rz rz-${d}" data-dir="${d}"></div>`).join('')}
            <div class="win-block"></div>`;
        this.el = el;
        this.body = el.querySelector('.win-body');
        this.glass = el.querySelector('.win-glass');
        this.titleEl = el.querySelector('.win-text');
        if (o.glass) this.glass.appendChild(o.glass); else this.glass.remove();
        if (o.content) {
            if (typeof o.content === 'string') this.body.innerHTML = o.content;
            else this.body.appendChild(o.content);
        }

        el.addEventListener('pointerdown', () => this.focus(), true);
        const titleBar = el.querySelector('.win-title');
        const startMove = e => {
            if (e.button !== 0) return;
            if (e.target.closest('button, input, select, textarea, a, .no-drag, [contenteditable]')) return;
            if (this.state === 'max') return;
            e.preventDefault();
            const sx = this.x, sy = this.y;
            const wa = workArea();
            drag(e, {
                onMove: (dx, dy) => {
                    this.x = clamp(sx + dx, -this.w + 80, wa.w - 80);
                    this.y = clamp(sy + dy, 0, wa.h - 24);
                    this.apply();
                }
            });
        };
        titleBar.addEventListener('pointerdown', startMove);
        if (o.glass) this.glass.addEventListener('pointerdown', startMove);
        titleBar.addEventListener('dblclick', e => {
            if (e.target.closest('.win-ico')) { this.requestClose(); return; }
            if (o.resizable !== false && o.maximizable !== false && !o.dialog) this.toggleMax();
        });
        titleBar.querySelector('.win-ico').addEventListener('click', e => {
            e.stopPropagation();
            const r = e.currentTarget.getBoundingClientRect();
            showMenu(r.left, r.bottom, this.systemMenu());
        });
        titleBar.addEventListener('contextmenu', e => {
            e.preventDefault();
            showMenu(e.clientX, e.clientY, this.systemMenu());
        });
        el.querySelector('.cap-close').addEventListener('click', () => this.requestClose());
        el.querySelector('.cap-min')?.addEventListener('click', () => this.minimize());
        el.querySelector('.cap-max')?.addEventListener('click', () => this.toggleMax());
        el.querySelectorAll('.rz').forEach(h => h.addEventListener('pointerdown', e => this.startResize(e, h.dataset.dir)));
        el.querySelector('.win-block').addEventListener('pointerdown', e => {
            e.stopPropagation();
            const kid = [...this.children].pop();
            if (kid) { kid.focus(); kid.flash(); }
        });
    }

    systemMenu() {
        const canMax = this.opts.resizable !== false && this.opts.maximizable !== false && !this.opts.dialog;
        return [
            { label: 'Restaurar', disabled: this.state === 'normal', action: () => this.restore() },
            { label: 'Mover', disabled: true },
            { label: 'Tamanho', disabled: true },
            { label: 'Minimizar', disabled: this.opts.dialog || this.opts.minimizable === false || this.state === 'min', action: () => this.minimize() },
            { label: 'Maximizar', disabled: !canMax || this.state === 'max', action: () => this.maximize() },
            '-',
            { label: 'Fechar', key: 'Alt+F4', bold: true, action: () => this.requestClose() },
        ];
    }

    startResize(e, dir) {
        if (e.button !== 0 || this.state === 'max') return;
        e.preventDefault(); e.stopPropagation();
        const s = { x: this.x, y: this.y, w: this.w, h: this.h };
        const minW = this.opts.minW || 220, minH = this.opts.minH || 140;
        const wa = workArea();
        drag(e, {
            cursor: getComputedStyle(e.target).cursor,
            onMove: (dx, dy) => {
                let { x, y, w, h } = s;
                if (dir.includes('e')) w = Math.max(minW, s.w + dx);
                if (dir.includes('s')) h = Math.max(minH, Math.min(s.h + dy, wa.h - s.y + 40));
                if (dir.includes('w')) { w = Math.max(minW, s.w - dx); x = s.x + s.w - w; }
                if (dir.includes('n')) { h = Math.max(minH, s.h - dy); y = s.y + s.h - h; if (y < 0) { h += y; y = 0; } }
                Object.assign(this, { x, y, w, h });
                this.apply();
                this.resizeHandlers.forEach(f => f());
            },
            onEnd: () => this.resizeHandlers.forEach(f => f())
        });
    }

    apply() {
        const st = this.el.style;
        st.left = this.x + 'px'; st.top = this.y + 'px';
        st.width = this.w + 'px'; st.height = this.h + 'px';
    }

    setTitle(t) {
        this.title = t;
        if (!this.opts.hideTitle) this.titleEl.textContent = t;
        this.el.setAttribute('aria-label', t);
        bus.emit('wm', 'title', this);
    }

    setIcon(name) {
        this.icon = name;
        const holder = this.el.querySelector('.win-ico');
        if (holder && holder.innerHTML) holder.innerHTML = ico(name, 16);
        bus.emit('wm', 'title', this);
    }

    onClose(fn) { this.closeHandlers.push(fn); return this; }
    onResize(fn) { this.resizeHandlers.push(fn); return this; }

    focus() {
        if (this.closed) return;
        if (this.children.size) {
            const kid = [...this.children].pop();
            if (kid !== this) { this.raise(); kid.focus(); return; }
        }
        if (this.state === 'min') { this.restore(); return; }
        if (activeWin === this && this.el.classList.contains('active')) return;
        this.raise();
        wins.forEach(w => w.el.classList.toggle('active', w === this));
        activeWin = this;
        desktopShown = null;
        bus.emit('wm', 'focus', this);
    }

    raise() {
        if (this.parent) this.parent.raise();
        this.el.style.zIndex = ++zTop;
        this.children.forEach(c => { c.el.style.zIndex = ++zTop; });
    }

    flash() {
        this.el.classList.remove('flash');
        void this.el.offsetWidth;
        this.el.classList.add('flash');
        import('./core/sound.js').then(({ Sound }) => Sound.play('ding'));
    }

    taskButtonRect() {
        const b = document.querySelector(`.task-btn[data-win="${this.id}"]`);
        return b ? b.getBoundingClientRect() : { left: 200, top: window.innerHeight - 20, width: 150, height: 20 };
    }

    async minimize() {
        if (this.state === 'min' || this.opts.dialog) return;
        this.prevState = this.state;
        this.state = 'min';
        if (!reduce()) {
            const r = this.el.getBoundingClientRect();
            const t = this.taskButtonRect();
            const sx = t.width / r.width, sy = t.height / r.height;
            const dx = t.left - r.left, dy = t.top - r.top;
            await this.el.animate([
                { transform: 'none', opacity: 1 },
                { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0 }
            ], { duration: 220, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' }).finished.catch(() => {});
        }
        this.el.classList.add('minimized');
        this.el.getAnimations().forEach(a => a.cancel());
        this.children.forEach(c => c.el.classList.add('minimized'));
        if (activeWin === this) {
            activeWin = null;
            this.el.classList.remove('active');
            const next = WM.list().reverse().find(w => w.state !== 'min' && w !== this && !w.parent);
            if (next) next.focus(); else bus.emit('wm', 'focus', null);
        }
        bus.emit('wm', 'state', this);
    }

    async restore() {
        if (this.state === 'min') {
            this.state = this.prevState || 'normal';
            this.el.classList.remove('minimized');
            this.children.forEach(c => c.el.classList.remove('minimized'));
            if (this.state === 'max') this.fitMax();
            this.focus();
            if (!reduce()) {
                const r = this.el.getBoundingClientRect();
                const t = this.taskButtonRect();
                this.el.animate([
                    { transform: `translate(${t.left - r.left}px, ${t.top - r.top}px) scale(${t.width / r.width}, ${t.height / r.height})`, opacity: 0 },
                    { transform: 'none', opacity: 1 }
                ], { duration: 220, easing: 'cubic-bezier(.2,.6,.4,1)' });
            }
            bus.emit('wm', 'state', this);
            return;
        }
        if (this.state === 'max') {
            this.state = 'normal';
            this.animateGeometry(() => {
                Object.assign(this, this.normalRect);
                this.el.classList.remove('maximized');
                this.apply();
            });
            this.setMaxTip();
            bus.emit('wm', 'state', this);
        }
    }

    fitMax() {
        const wa = workArea();
        Object.assign(this, { x: wa.x, y: wa.y, w: wa.w, h: wa.h });
        this.apply();
    }

    maximize() {
        if (this.state === 'max') return;
        if (this.state === 'min') { this.prevState = 'max'; this.restore(); return; }
        this.normalRect = { x: this.x, y: this.y, w: this.w, h: this.h };
        this.state = 'max';
        this.animateGeometry(() => { this.el.classList.add('maximized'); this.fitMax(); });
        this.setMaxTip();
        this.focus();
        bus.emit('wm', 'state', this);
    }

    setMaxTip() {
        const b = this.el.querySelector('.cap-max');
        if (b) b.dataset.tip = this.state === 'max' ? 'Restaurar' : 'Maximizar';
    }

    toggleMax() { this.state === 'max' ? this.restore() : this.maximize(); }

    animateGeometry(fn) {
        if (reduce()) { fn(); this.resizeHandlers.forEach(f => f()); return; }
        this.el.classList.add('animating');
        fn();
        setTimeout(() => { this.el.classList.remove('animating'); this.resizeHandlers.forEach(f => f()); }, 200);
    }

    /** Ask the app whether we can close (unsaved changes...). */
    async requestClose() {
        if (this.closed) return;
        if (this.children.size) { const kid = [...this.children].pop(); kid.focus(); kid.flash(); return; }
        if (this.opts.onBeforeClose) {
            const ok = await this.opts.onBeforeClose();
            if (ok === false) return;
        }
        this.close();
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        [...this.children].forEach(c => c.close());
        this.closeHandlers.forEach(f => { try { f(); } catch (e) { console.error(e); } });
        if (this.parent) {
            this.parent.children.delete(this);
            if (!this.parent.children.size) this.parent.el.classList.remove('blocked');
        }
        wins.delete(this.id);
        const finish = () => this.el.remove();
        if (reduce() || this.state === 'min') finish();
        else {
            this.el.classList.add('closing');
            setTimeout(finish, 180);
        }
        if (activeWin === this) {
            activeWin = null;
            const next = this.parent && !this.parent.closed ? this.parent
                : WM.list().reverse().find(w => w.state !== 'min');
            if (next) next.focus(); else bus.emit('wm', 'focus', null);
        }
        bus.emit('wm', 'close', this);
    }
}

export const WM = {
    init() {
        layer = document.getElementById('windows');
        window.addEventListener('resize', () => {
            wins.forEach(w => { if (w.state === 'max') w.fitMax(); w.resizeHandlers.forEach(f => f()); });
        });
        // Clicking inside an iframe doesn't bubble: detect focus moving into one.
        window.addEventListener('blur', () => {
            setTimeout(() => {
                const a = document.activeElement;
                if (a && a.tagName === 'IFRAME') {
                    const w = WM.fromElement(a);
                    if (w) w.focus();
                    closeMenus();
                }
            }, 0);
        });
    },

    /**
     * Open a window.
     * opts: {app, title, icon, width, height, x, y, content, glass, cls, dialog, parent, modal,
     *        resizable, maximizable, minimizable, minW, minH, onBeforeClose, maximized, taskbar}
     */
    open(opts) {
        const w = new Win(opts);
        const wa = workArea();
        w.w = Math.min(opts.width || 600, wa.w - 20);
        w.h = Math.min(opts.height || 400, wa.h - 10);
        if (opts.parent && opts.x == null) {
            const p = opts.parent;
            w.x = Math.round(p.x + (p.w - w.w) / 2);
            w.y = Math.round(p.y + Math.min(80, (p.h - w.h) / 2));
        } else if (opts.center || opts.dialog) {
            w.x = Math.round((wa.w - w.w) / 2);
            w.y = Math.round((wa.h - w.h) / 2.4);
        } else {
            const n = cascadeN++ % 8;
            w.x = opts.x ?? Math.round(Math.max(10, (wa.w - w.w) / 2 - 120) + n * 26);
            w.y = opts.y ?? Math.round(Math.max(10, (wa.h - w.h) / 2 - 80) + n * 26);
        }
        w.x = clamp(w.x, 0, Math.max(0, wa.w - w.w));
        w.y = clamp(w.y, 0, Math.max(0, wa.h - w.h));
        w.apply();
        if (opts.parent) {
            opts.parent.children.add(w);
            if (opts.modal !== false) opts.parent.el.classList.add('blocked');
        }
        wins.set(w.id, w);
        layer.appendChild(w.el);
        if (!reduce()) w.el.classList.add('opening');
        setTimeout(() => w.el.classList.remove('opening'), 260);
        if (opts.maximized) { w.normalRect = { x: w.x, y: w.y, w: w.w, h: w.h }; w.state = 'max'; w.el.classList.add('maximized'); w.fitMax(); w.setMaxTip(); }
        bus.emit('wm', 'open', w);
        w.focus();
        return w;
    },

    get: id => wins.get(id),
    list() { return [...wins.values()].sort((a, b) => (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0)); },
    /** Top-level windows shown on the taskbar, in creation order. */
    taskWindows() { return [...wins.values()].filter(w => !w.parent && w.opts.taskbar !== false); },
    active: () => activeWin,
    findApp(appId) { return [...wins.values()].find(w => w.appId === appId); },
    fromElement(el) { const n = el?.closest?.('.win'); return n ? wins.get(n.dataset.win) : null; },

    showDesktop() {
        const visible = this.taskWindows().filter(w => w.state !== 'min');
        if (visible.length) {
            desktopShown = visible;
            visible.forEach(w => w.minimize());
        } else if (desktopShown) {
            const list = desktopShown; desktopShown = null;
            list.forEach(w => !w.closed && w.restore());
        }
    },

    cascade() {
        const wa = workArea();
        this.taskWindows().filter(w => w.state !== 'min').forEach((w, i) => {
            if (w.state === 'max') w.restore();
            w.x = 20 + i * 28; w.y = 20 + i * 28;
            w.w = Math.min(w.w, wa.w - w.x - 20); w.h = Math.min(w.h, wa.h - w.y - 20);
            w.animateGeometry(() => w.apply()); w.focus();
        });
    },

    tile(vertical) {
        const wa = workArea();
        const list = this.taskWindows().filter(w => w.state !== 'min' && w.opts.resizable !== false);
        if (!list.length) return;
        const n = list.length;
        const cols = vertical ? n : Math.ceil(Math.sqrt(n));
        const rows = vertical ? 1 : Math.ceil(n / cols);
        list.forEach((w, i) => {
            if (w.state === 'max') { w.state = 'normal'; w.el.classList.remove('maximized'); w.setMaxTip(); }
            const c = i % cols, r = Math.floor(i / cols);
            w.x = Math.round(c * wa.w / cols); w.y = Math.round(r * wa.h / rows);
            w.w = Math.round(wa.w / cols); w.h = Math.round(wa.h / rows);
            w.animateGeometry(() => w.apply());
        });
    },

    closeAll() { [...wins.values()].forEach(w => w.close()); },

    /** A static visual copy of a window (used for taskbar thumbnails and Flip 3D). */
    snapshot(w) {
        const c = w.el.cloneNode(true);
        c.classList.remove('minimized', 'opening', 'closing', 'flash', 'animating');
        c.removeAttribute('data-win');
        c.style.cssText = `position:absolute;left:0;top:0;width:${w.w}px;height:${w.h}px;z-index:auto;transform:none;opacity:1`;
        c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
        c.querySelectorAll('.rz').forEach(n => n.remove());
        const srcCanvas = w.el.querySelectorAll('canvas');
        c.querySelectorAll('canvas').forEach((cv, i) => {
            try { cv.getContext('2d').drawImage(srcCanvas[i], 0, 0); } catch { /* ignore */ }
        });
        c.querySelectorAll('iframe').forEach(f => {
            const ph = document.createElement('div');
            ph.className = 'iframe-ph';
            f.replaceWith(ph);
        });
        const srcFields = w.el.querySelectorAll('textarea, input');
        c.querySelectorAll('textarea, input').forEach((f, i) => { f.value = srcFields[i]?.value ?? ''; f.tabIndex = -1; });
        return c;
    }
};
