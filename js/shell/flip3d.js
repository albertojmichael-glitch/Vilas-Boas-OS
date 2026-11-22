// Flip 3D window switcher: a 3D stack of every open window plus the desktop.
import { html, esc } from '../core/util.js';
import { WM } from '../wm.js';
import { ico } from '../core/icons.js';

let overlay = null, cards = [], index = 0, entries = [];

function layout() {
    const n = cards.length;
    cards.forEach((c, i) => {
        const pos = (i - index + n) % n; // 0 = front
        const z = -pos * 170;
        const x = pos * 60;
        const y = -pos * 40;
        c.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(-32deg)`;
        c.style.zIndex = String(100 - pos);
        c.style.opacity = pos > 7 ? '0' : '1';
        c.classList.toggle('front', pos === 0);
    });
    const e = entries[index];
    overlay.querySelector('.flip-label').innerHTML = e ? `${ico(e.icon, 16)}<span>${esc(e.title)}</span>` : '';
}

function pick(i) {
    const e = entries[i];
    close();
    if (!e) return;
    if (e.desktop) WM.showDesktop();
    else e.win.focus();
}

function step(d) {
    index = (index + d + cards.length) % cards.length;
    layout();
}

function onKey(e) {
    if (!overlay) return;
    e.preventDefault(); e.stopPropagation();
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter' || e.key === ' ') pick(index);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) step(1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) step(-1);
}

function close() {
    if (!overlay) return;
    const o = overlay;
    overlay = null;
    o.classList.remove('show');
    document.removeEventListener('keydown', onKey, true);
    setTimeout(() => o.remove(), 250);
    document.body.classList.remove('flip-active');
}

export const Flip3D = {
    open() {
        if (overlay) { step(1); return; }
        const wins = WM.list().filter(w => !w.parent && w.opts.taskbar !== false).reverse();
        entries = wins.map(w => ({ win: w, title: w.title, icon: w.icon }));
        entries.push({ desktop: true, title: 'Área de Trabalho', icon: 'showDesktop' });
        overlay = html(`<div class="flip3d"><div class="flip-stage"></div><div class="flip-label"></div><div class="flip-hint">Use a roda do mouse ou as setas para navegar • Enter para selecionar • Esc para cancelar</div></div>`);
        const stage = overlay.querySelector('.flip-stage');
        const W = Math.min(window.innerWidth * 0.5, 720), H = Math.min(window.innerHeight * 0.5, 480);
        cards = entries.map((e, i) => {
            const card = document.createElement('div');
            card.className = 'flip-card';
            card.style.width = W + 'px'; card.style.height = H + 'px';
            if (e.desktop) {
                const wp = document.getElementById('wallpaper');
                card.innerHTML = `<div class="flip-desktop" style="background-image:${getComputedStyle(wp).backgroundImage};background-color:${getComputedStyle(wp).backgroundColor}"></div>`;
            } else {
                const w = e.win;
                const s = Math.min(W / w.w, H / w.h);
                const snap = WM.snapshot(w);
                snap.classList.add('active');
                snap.style.transform = `scale(${s})`;
                snap.style.transformOrigin = '0 0';
                snap.style.left = ((W - w.w * s) / 2) + 'px';
                snap.style.top = ((H - w.h * s) / 2) + 'px';
                card.appendChild(snap);
            }
            card.addEventListener('click', ev => { ev.stopPropagation(); pick(i); });
            stage.appendChild(card);
            return card;
        });
        index = 0;
        overlay.addEventListener('wheel', ev => { ev.preventDefault(); step(ev.deltaY > 0 ? 1 : -1); }, { passive: false });
        overlay.addEventListener('click', () => close());
        overlay.addEventListener('contextmenu', ev => { ev.preventDefault(); close(); });
        document.body.appendChild(overlay);
        document.body.classList.add('flip-active');
        document.addEventListener('keydown', onKey, true);
        layout();
        requestAnimationFrame(() => overlay.classList.add('show'));
    },
    close,
    get isOpen() { return !!overlay; },
};
