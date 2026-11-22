// Screen saver: glossy bubbles or aurora ribbons after a period of inactivity.
import { Settings } from '../core/settings.js';

let idleTimer = null, el = null, raf = null, previewEl = null;

function bubbles(canvas, ctx) {
    const W = canvas.width, H = canvas.height;
    const list = Array.from({ length: 14 }, () => {
        const r = 30 + Math.random() * 70;
        return { x: r + Math.random() * (W - 2 * r), y: r + Math.random() * (H - 2 * r), r, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, h: Math.random() * 360 };
    });
    return () => {
        ctx.clearRect(0, 0, W, H);
        list.forEach(b => {
            b.x += b.vx; b.y += b.vy; b.h = (b.h + 0.4) % 360;
            if (b.x < b.r || b.x > W - b.r) b.vx *= -1;
            if (b.y < b.r || b.y > H - b.r) b.vy *= -1;
            const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.05, b.x, b.y, b.r);
            g.addColorStop(0, 'rgba(255,255,255,0.85)');
            g.addColorStop(0.25, `hsla(${b.h},90%,70%,0.25)`);
            g.addColorStop(0.85, `hsla(${(b.h + 60) % 360},90%,55%,0.18)`);
            g.addColorStop(1, `hsla(${(b.h + 120) % 360},90%,75%,0.55)`);
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        });
    };
}

function ribbons(canvas, ctx) {
    const W = canvas.width, H = canvas.height;
    let t = 0;
    return () => {
        t += 0.008;
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, W, H);
        for (let k = 0; k < 4; k++) {
            ctx.beginPath();
            for (let x = 0; x <= W; x += 12) {
                const y = H / 2 + Math.sin(x * 0.004 + t * (1 + k * 0.3) + k) * H * 0.22 + Math.sin(x * 0.011 - t * 2 + k * 2) * 40;
                x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.strokeStyle = `hsla(${(t * 40 + k * 70) % 360},85%,60%,0.6)`;
            ctx.lineWidth = 3; ctx.stroke();
        }
    };
}

const KINDS = { bubbles, ribbons };

function run(container, kind) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const fit = () => { canvas.width = container.clientWidth; canvas.height = container.clientHeight; };
    fit();
    const ctx = canvas.getContext('2d');
    const frame = KINDS[kind](canvas, ctx);
    let local;
    const loop = () => { frame(); local = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(local);
}

function start() {
    const kind = Settings.get('screensaver');
    if (!KINDS[kind] || el || !document.body.classList.contains('desktop-on')) return;
    el = document.createElement('div');
    el.className = 'screensaver';
    if (kind === 'ribbons') el.style.background = '#000';
    document.body.appendChild(el);
    const stop = run(el, kind);
    raf = stop;
    const end = () => {
        stop(); el?.remove(); el = null;
        window.removeEventListener('pointermove', end); window.removeEventListener('keydown', end); window.removeEventListener('pointerdown', end);
        reset();
    };
    setTimeout(() => {
        window.addEventListener('pointermove', end, { once: true });
        window.addEventListener('keydown', end, { once: true });
        window.addEventListener('pointerdown', end, { once: true });
    }, 600);
}

function reset() {
    clearTimeout(idleTimer);
    const mins = +Settings.get('screensaverWait') || 0;
    if (!KINDS[Settings.get('screensaver')] || mins <= 0) return;
    idleTimer = setTimeout(start, mins * 60000);
}

export const Screensaver = {
    init() {
        ['pointermove', 'keydown', 'pointerdown', 'wheel'].forEach(ev => window.addEventListener(ev, () => { if (!el) reset(); }, { passive: true }));
        reset();
    },
    reset,
    test() { start(); },
    /** Small live preview in a container (Control Panel). */
    preview(container, kind) {
        previewEl?.();
        container.innerHTML = '';
        previewEl = KINDS[kind] ? run(container, kind) : null;
    },
    kinds: [{ id: 'none', name: '(Nenhum)' }, { id: 'bubbles', name: 'Bolhas' }, { id: 'ribbons', name: 'Fitas' }],
};
