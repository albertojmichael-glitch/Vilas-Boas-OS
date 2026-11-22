// Windows Sidebar with gadgets: clock, calendar and CPU meter.
import { $, bus, html } from '../core/util.js';
import { Settings, now } from '../core/settings.js';
import { showMenu } from '../ui/menu.js';
import { launch } from '../apps/registry.js';
import { drawClockFace } from './taskbar.js';

let el, clockCanvas, cpuState = { cpu: 12, mem: 38 };

function build() {
    el = html(`<aside class="sidebar" aria-label="Sidebar">
        <div class="sb-top"><button class="sb-add" data-tip="Adicionar gadgets">+</button><button class="sb-prev" data-tip="Gadgets anteriores">◂</button><button class="sb-next" data-tip="Próximos gadgets">▸</button></div>
        <div class="gadget g-clock"><canvas></canvas><div class="g-clock-label"></div></div>
        <div class="gadget g-cal"><div class="g-cal-page">
            <div class="g-cal-month"></div><div class="g-cal-day"></div><div class="g-cal-dow"></div></div></div>
        <div class="gadget g-cpu"><svg viewBox="0 0 130 80"></svg></div>
    </aside>`);
    $('#desktop').appendChild(el);
    clockCanvas = $('.g-clock canvas', el);
    el.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        showMenu(e.clientX, e.clientY, [
            { label: 'Adicionar Gadgets...', action: () => launch('control', { page: 'sidebar' }) },
            '-',
            { label: 'Propriedades', action: () => launch('control', { page: 'sidebar' }) },
            { label: 'Fechar Sidebar', action: () => Settings.set('sidebar', false) },
        ]);
    });
    el.querySelector('.sb-add').addEventListener('click', () => launch('control', { page: 'sidebar' }));
    el.querySelector('.g-cal').addEventListener('dblclick', () => launch('control', { page: 'datetime' }));
}

function gauge(cx, cy, r, val, label, big) {
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    const ticks = Array.from({ length: 11 }, (_, i) => {
        const a = a0 + (a1 - a0) * i / 10;
        return `<line x1="${cx + Math.cos(a) * r * 0.78}" y1="${cy + Math.sin(a) * r * 0.78}" x2="${cx + Math.cos(a) * r * 0.9}" y2="${cy + Math.sin(a) * r * 0.9}" stroke="#d8e2ec" stroke-width="${i % 5 ? 0.8 : 1.4}"/>`;
    }).join('');
    const av = a0 + (a1 - a0) * val / 100;
    return `<g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gface)" stroke="#0e1419" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="none" stroke="rgba(255,255,255,.18)"/>
        ${ticks}
        <line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(av) * r * 0.82}" y2="${cy + Math.sin(av) * r * 0.82}" stroke="#ff4b3a" stroke-width="${big ? 2 : 1.6}" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="${big ? 4 : 3}" fill="#c7ced6" stroke="#333"/>
        <rect x="${cx - 13}" y="${cy + r * 0.38}" width="26" height="${big ? 11 : 9}" rx="2" fill="#0b0f12" stroke="#3b4752"/>
        <text x="${cx}" y="${cy + r * 0.38 + (big ? 8.5 : 7)}" text-anchor="middle" font-size="${big ? 8 : 6.5}" fill="#8ff58f" font-family="Segoe UI, Arial">${Math.round(val)}%</text>
        <text x="${cx}" y="${cy - r * 0.32}" text-anchor="middle" font-size="5.5" fill="#cfd8e2" font-family="Segoe UI, Arial">${label}</text>
        <ellipse cx="${cx}" cy="${cy - r * 0.45}" rx="${r * 0.7}" ry="${r * 0.38}" fill="rgba(255,255,255,.12)"/>
    </g>`;
}

function drawCpu() {
    cpuState.cpu = Math.max(2, Math.min(98, cpuState.cpu + (Math.random() - 0.5) * 18));
    cpuState.mem = Math.max(25, Math.min(80, cpuState.mem + (Math.random() - 0.5) * 3));
    $('.g-cpu svg', el).innerHTML = `<defs><radialGradient id="gface" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#3e4a55"/><stop offset="1" stop-color="#121820"/></radialGradient></defs>
        ${gauge(50, 42, 34, cpuState.cpu, 'CPU', true)}${gauge(100, 52, 24, cpuState.mem, 'MEM', false)}`;
    window.__cpuLoad = cpuState;
}

function tick() {
    if (!el || el.hidden) return;
    const d = now();
    drawClockFace(clockCanvas, d, { size: 120, style: 'gadget' });
    const months = d.toLocaleDateString('pt-BR', { month: 'long' });
    $('.g-cal-month', el).textContent = months.charAt(0).toUpperCase() + months.slice(1);
    $('.g-cal-day', el).textContent = d.getDate();
    const dow = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    $('.g-cal-dow', el).textContent = dow.charAt(0).toUpperCase() + dow.slice(1);
}

export const Sidebar = {
    init() {
        build();
        const apply = () => { el.hidden = !Settings.get('sidebar'); document.body.classList.toggle('has-sidebar', !el.hidden); tick(); drawCpu(); };
        apply();
        bus.on('settings', k => { if (k === 'sidebar' || k === 'timeOffset') apply(); });
        setInterval(tick, 1000);
        setInterval(() => { if (!el.hidden) drawCpu(); }, 1500);
    }
};
