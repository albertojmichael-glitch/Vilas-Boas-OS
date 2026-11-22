// Taskbar: start orb, quick launch, task buttons with live thumbnails, notification area and clock.
import { $, $$, bus, esc, html } from '../core/util.js';
import { Settings, now } from '../core/settings.js';
import { ico } from '../core/icons.js';
import { Sound } from '../core/sound.js';
import { WM } from '../wm.js';
import { showMenu, closeMenus } from '../ui/menu.js';
import { launch } from '../apps/registry.js';
import { StartMenu } from './startmenu.js';
import { Flip3D } from './flip3d.js';

let tasks, thumb, thumbTimer, thumbFor = null, flyout = null;

/* ---------- Task buttons ---------- */
function renderTasks() {
    const list = WM.taskWindows();
    const active = WM.active();
    const existing = new Map($$('.task-btn', tasks).map(b => [b.dataset.win, b]));
    list.forEach(w => {
        let b = existing.get(w.id);
        if (!b) {
            b = document.createElement('button');
            b.className = 'task-btn';
            b.dataset.win = w.id;
            b.innerHTML = `<span class="tb-ico"></span><span class="tb-text"></span>`;
            tasks.appendChild(b);
            b.classList.add('appear');
        }
        existing.delete(w.id);
        b.querySelector('.tb-ico').innerHTML = ico(w.icon, 16);
        b.querySelector('.tb-text').textContent = w.title;
        b.classList.toggle('active', w === active && w.state !== 'min' && w.el.classList.contains('active'));
        b.classList.toggle('min', w.state === 'min');
    });
    existing.forEach(b => b.remove());
    document.body.classList.toggle('max-on', list.some(w => w.state === 'max'));
}

function showThumb(btn) {
    const w = WM.get(btn.dataset.win);
    if (!w) return;
    hideThumb();
    thumbFor = w;
    const MAXW = 200, MAXH = 120;
    const s = Math.min(MAXW / w.w, MAXH / w.h, 1);
    thumb = html(`<div class="task-thumb"><div class="tt-title">${ico(w.icon, 16)}<span>${esc(w.title)}</span></div><div class="tt-view" style="width:${Math.round(w.w * s)}px;height:${Math.round(w.h * s)}px"></div></div>`);
    const view = thumb.querySelector('.tt-view');
    const snap = WM.snapshot(w);
    snap.style.transform = `scale(${s})`;
    snap.style.transformOrigin = '0 0';
    snap.classList.add('active');
    view.appendChild(snap);
    document.body.appendChild(thumb);
    const r = btn.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    thumb.style.left = Math.max(4, Math.min(window.innerWidth - t.width - 4, r.left + r.width / 2 - t.width / 2)) + 'px';
    thumb.style.top = (r.top - t.height - 8) + 'px';
    requestAnimationFrame(() => thumb?.classList.add('show'));
    thumb.addEventListener('click', () => { w.focus(); hideThumb(); });
    thumb.addEventListener('pointerleave', () => { thumbTimer = setTimeout(hideThumb, 200); });
    thumb.addEventListener('pointerenter', () => clearTimeout(thumbTimer));
}

function hideThumb() {
    clearTimeout(thumbTimer);
    thumb?.remove();
    thumb = null; thumbFor = null;
}

function taskMenu(x, y, w) {
    showMenu(x, y, [
        { label: 'Restaurar', disabled: w.state === 'normal', action: () => w.restore() },
        { label: 'Mover', disabled: true },
        { label: 'Tamanho', disabled: true },
        { label: 'Minimizar', disabled: w.state === 'min', action: () => w.minimize() },
        { label: 'Maximizar', disabled: w.state === 'max' || w.opts.resizable === false, action: () => w.maximize() },
        '-',
        { label: 'Fechar', bold: true, action: () => w.requestClose() },
    ], { above: true });
}

function taskbarMenu(x, y) {
    showMenu(x, y, [
        { label: 'Barras de Ferramentas', sub: [
            { label: 'Inicialização Rápida', checked: Settings.get('showQuickLaunch'), action: () => Settings.set('showQuickLaunch', !Settings.get('showQuickLaunch')) },
        ] },
        '-',
        { label: 'Janelas em Cascata', action: () => WM.cascade() },
        { label: 'Mostrar Janelas Empilhadas', action: () => WM.tile(false) },
        { label: 'Mostrar Janelas Lado a Lado', action: () => WM.tile(true) },
        { label: 'Mostrar a Área de Trabalho', action: () => WM.showDesktop() },
        '-',
        { label: 'Gerenciador de Tarefas', action: () => launch('taskmgr') },
        '-',
        { label: 'Bloquear a Barra de Tarefas', checked: Settings.get('lockTaskbar'), action: () => Settings.set('lockTaskbar', !Settings.get('lockTaskbar')) },
        { label: 'Propriedades', action: () => launch('control', { page: 'taskbar' }) },
    ], { above: true });
}

/* ---------- Tray & flyouts ---------- */
function closeFlyout() {
    if (!flyout) return;
    const f = flyout; flyout = null;
    f.classList.remove('show');
    setTimeout(() => f.remove(), 150);
    $$('#tray .tray-btn, #clock').forEach(b => b.classList.remove('pressed'));
}

function openFlyout(el, anchor) {
    const wasSame = flyout && flyout.dataset.for === anchor.id;
    closeFlyout();
    closeMenus();
    if (wasSame) return null;
    el.dataset.for = anchor.id;
    flyout = el;
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    const fr = el.getBoundingClientRect();
    el.style.left = Math.max(4, Math.min(window.innerWidth - fr.width - 6, r.right - fr.width / 2 - r.width / 2)) + 'px';
    el.style.bottom = (window.innerHeight - r.top + 6) + 'px';
    anchor.classList.add('pressed');
    requestAnimationFrame(() => el.classList.add('show'));
    el.addEventListener('pointerdown', e => e.stopPropagation());
    return el;
}

function calendarHTML(year, month, today) {
    const first = new Date(year, month, 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    let cells = '';
    for (let i = 0; i < 42; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const cls = [d.getMonth() !== month ? 'other' : '', d.toDateString() === today.toDateString() ? 'today' : ''].join(' ');
        cells += `<span class="${cls}">${d.getDate()}</span>`;
    }
    const title = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return `<div class="cal-head"><button class="cal-nav" data-d="-1">◂</button><span class="cal-title">${title.charAt(0).toUpperCase() + title.slice(1)}</span><button class="cal-nav" data-d="1">▸</button></div>
        <div class="cal-grid"><div class="cal-dow">${days.map(d => `<span>${d}</span>`).join('')}</div><div class="cal-days">${cells}</div></div>`;
}

export function drawClockFace(canvas, d, { size = 120, style = 'flyout' } = {}) {
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size * dpr) { canvas.width = canvas.height = size * dpr; canvas.style.width = canvas.style.height = size + 'px'; }
    const x = canvas.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, size, size);
    const c = size / 2, R = size / 2 - 4;
    // bezel
    let g = x.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, style === 'gadget' ? '#f6f8fa' : '#e9eef3'); g.addColorStop(1, style === 'gadget' ? '#9aa5b1' : '#b8c3ce');
    x.beginPath(); x.arc(c, c, R, 0, Math.PI * 2); x.fillStyle = g; x.fill();
    x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.45)'; x.stroke();
    // face
    g = x.createRadialGradient(c, c * 0.7, R * 0.1, c, c, R * 0.92);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e3e8ee');
    x.beginPath(); x.arc(c, c, R * 0.88, 0, Math.PI * 2); x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(0,0,0,.2)'; x.stroke();
    // ticks
    for (let i = 0; i < 60; i++) {
        const a = i * Math.PI / 30, big = i % 5 === 0;
        x.beginPath();
        x.moveTo(c + Math.sin(a) * R * (big ? 0.68 : 0.76), c - Math.cos(a) * R * (big ? 0.68 : 0.76));
        x.lineTo(c + Math.sin(a) * R * 0.8, c - Math.cos(a) * R * 0.8);
        x.lineWidth = big ? 2.2 : 0.8; x.strokeStyle = big ? '#3a4652' : '#8c97a3'; x.lineCap = 'round'; x.stroke();
    }
    const hand = (a, len, w, col) => {
        x.save(); x.translate(c, c); x.rotate(a);
        x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 2; x.shadowOffsetY = 1;
        x.beginPath(); x.moveTo(-w / 2, R * 0.12); x.lineTo(-w / 3, -len); x.lineTo(w / 3, -len); x.lineTo(w / 2, R * 0.12); x.closePath();
        x.fillStyle = col; x.fill(); x.restore();
    };
    const h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds() + d.getMilliseconds() / 1000;
    hand((h + m / 60) * Math.PI / 6, R * 0.45, 5, '#1f2a35');
    hand((m + s / 60) * Math.PI / 30, R * 0.66, 3.6, '#1f2a35');
    hand(s * Math.PI / 30, R * 0.72, 1.3, '#c0392b');
    x.beginPath(); x.arc(c, c, 3, 0, Math.PI * 2); x.fillStyle = '#c0392b'; x.fill();
    // glass shine
    g = x.createLinearGradient(0, c - R, 0, c);
    g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.beginPath(); x.ellipse(c, c - R * 0.42, R * 0.7, R * 0.42, 0, 0, Math.PI * 2); x.fillStyle = g; x.fill();
}

function clockFlyout(anchor) {
    const d = now();
    let y = d.getFullYear(), m = d.getMonth();
    const el = html(`<div class="flyout clock-flyout">
        <div class="cf-main"><div class="cf-cal"></div>
        <div class="cf-clock"><canvas></canvas><div class="cf-time"></div><div class="cf-date"></div></div></div>
        <div class="cf-foot"><a class="link" data-dt>Alterar configurações de data e hora...</a></div></div>`);
    const cal = el.querySelector('.cf-cal');
    const draw = () => {
        cal.innerHTML = calendarHTML(y, m, now());
        cal.querySelectorAll('.cal-nav').forEach(b => b.addEventListener('click', () => {
            m += +b.dataset.d; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw();
        }));
    };
    draw();
    const canvas = el.querySelector('canvas');
    let raf;
    const tick = () => {
        if (!document.contains(el)) { cancelAnimationFrame(raf); return; }
        const t = now();
        drawClockFace(canvas, t, { size: 130 });
        el.querySelector('.cf-time').textContent = t.toLocaleTimeString('pt-BR', { hour12: !Settings.get('hour24') });
        const ds = t.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        el.querySelector('.cf-date').textContent = ds.charAt(0).toUpperCase() + ds.slice(1);
        raf = requestAnimationFrame(tick);
    };
    el.querySelector('[data-dt]').addEventListener('click', () => { closeFlyout(); launch('control', { page: 'datetime' }); });
    if (openFlyout(el, anchor)) tick();
}

function volumeFlyout(anchor) {
    const el = html(`<div class="flyout vol-flyout">
        <div class="vf-title">Volume</div>
        <div class="vf-slider"><input type="range" min="0" max="100" orient="vertical" value="${Settings.get('volume')}" aria-label="Volume"></div>
        <button class="vf-mute ${Settings.get('muted') ? 'muted' : ''}" data-tip="${Settings.get('muted') ? 'Ativar som' : 'Desativar som'}">${ico(Settings.get('muted') ? 'volumeMute' : 'volume', 20)}</button>
        <a class="link vf-mixer">Mixer</a></div>`);
    const range = el.querySelector('input');
    range.addEventListener('input', () => { Settings.set('volume', +range.value); if (Settings.get('muted')) Settings.set('muted', false); });
    range.addEventListener('change', () => Sound.play('ding'));
    el.querySelector('.vf-mute').addEventListener('click', e => {
        Settings.set('muted', !Settings.get('muted'));
        e.currentTarget.innerHTML = ico(Settings.get('muted') ? 'volumeMute' : 'volume', 20);
        e.currentTarget.classList.toggle('muted', Settings.get('muted'));
    });
    el.querySelector('.vf-mixer').addEventListener('click', () => { closeFlyout(); launch('control', { page: 'sound' }); });
    openFlyout(el, anchor);
}

function netFlyout(anchor) {
    const on = navigator.onLine;
    const el = html(`<div class="flyout net-flyout">
        <div class="nf-row">${ico('network', 32)}<div><b>${esc(Settings.get('computerName'))}</b><br>${on ? 'Acesso: Local e Internet' : 'Acesso: Somente local'}</div></div>
        <div class="nf-links"><a class="link" data-c>Conectar ou desconectar...</a><a class="link" data-n>Central de Rede e Compartilhamento</a></div></div>`);
    el.querySelector('[data-c]').addEventListener('click', () => { closeFlyout(); launch('network'); });
    el.querySelector('[data-n]').addEventListener('click', () => { closeFlyout(); launch('control', { page: 'network' }); });
    openFlyout(el, anchor);
}

function renderTray() {
    const vol = $('#tray-vol');
    vol.innerHTML = ico(Settings.get('muted') ? 'volumeMute' : 'volume', 16);
    vol.dataset.tip = Settings.get('muted') ? 'Volume: Sem som' : `Volume: ${Settings.get('volume')}%`;
    const net = $('#tray-net');
    net.innerHTML = ico('netTray', 16);
    net.dataset.tip = navigator.onLine ? `${Settings.get('computerName')}\nAcesso: Local e Internet` : 'Acesso: Somente local';
}

function updateClock() {
    const d = now();
    $('#clock-time').textContent = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: !Settings.get('hour24') });
    const ds = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#clock').dataset.tip = ds.charAt(0).toUpperCase() + ds.slice(1);
}

/* ---------- Quick launch ---------- */
function renderQuickLaunch() {
    const ql = $('#quicklaunch');
    ql.hidden = !Settings.get('showQuickLaunch');
    ql.innerHTML = [
        ['showDesktop', 'Mostrar Área de Trabalho', 'show-desktop'],
        ['flip', 'Alternar entre janelas', 'flip'],
        ['browser', 'Navegador Vilas Boas', 'browser'],
    ].map(([icon, tip, act]) => `<button class="ql-btn" data-act="${act}" data-tip="${tip}">${ico(icon, 16)}</button>`).join('');
}

/* ---------- Init ---------- */
export const Taskbar = {
    init() {
        tasks = $('#tasks');
        renderQuickLaunch();
        renderTray();
        updateClock();
        setInterval(updateClock, 1000);

        $('#start-orb').addEventListener('pointerdown', e => { e.stopPropagation(); closeFlyout(); StartMenu.toggle(); });
        $('#quicklaunch').addEventListener('click', e => {
            const b = e.target.closest('.ql-btn');
            if (!b) return;
            if (b.dataset.act === 'show-desktop') WM.showDesktop();
            else if (b.dataset.act === 'flip') Flip3D.open();
            else launch(b.dataset.act);
        });
        tasks.addEventListener('click', e => {
            const b = e.target.closest('.task-btn');
            if (!b) return;
            hideThumb();
            const w = WM.get(b.dataset.win);
            if (!w) return;
            if (w.state === 'min') w.restore();
            else if (WM.active() === w && w.el.classList.contains('active')) w.minimize();
            else w.focus();
        });
        tasks.addEventListener('contextmenu', e => {
            const b = e.target.closest('.task-btn');
            e.preventDefault(); e.stopPropagation();
            hideThumb();
            if (b) { const w = WM.get(b.dataset.win); if (w) taskMenu(e.clientX, e.clientY, w); }
            else taskbarMenu(e.clientX, e.clientY);
        });
        tasks.addEventListener('pointerover', e => {
            const b = e.target.closest('.task-btn');
            if (!b) return;
            clearTimeout(thumbTimer);
            if (thumbFor && thumbFor.id === b.dataset.win) return;
            thumbTimer = setTimeout(() => showThumb(b), thumb ? 60 : 450);
        });
        tasks.addEventListener('pointerleave', () => { clearTimeout(thumbTimer); thumbTimer = setTimeout(hideThumb, 250); });
        $('#taskbar').addEventListener('contextmenu', e => {
            if (e.target.closest('#tasks, #start-orb')) return;
            e.preventDefault();
            if (e.target.closest('#clock')) {
                showMenu(e.clientX, e.clientY, [
                    { label: 'Ajustar Data/Hora', bold: true, action: () => launch('control', { page: 'datetime' }) },
                    '-', ...[] ,
                    { label: 'Janelas em Cascata', action: () => WM.cascade() },
                    { label: 'Mostrar a Área de Trabalho', action: () => WM.showDesktop() },
                    { label: 'Gerenciador de Tarefas', action: () => launch('taskmgr') },
                ], { above: true });
                return;
            }
            taskbarMenu(e.clientX, e.clientY);
        });
        $$('#clock, #tray-vol, #tray-net').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); StartMenu.close(); }));
        $('#clock').addEventListener('click', e => clockFlyout(e.currentTarget));
        $('#tray-vol').addEventListener('click', e => volumeFlyout(e.currentTarget));
        $('#tray-net').addEventListener('click', e => netFlyout(e.currentTarget));
        window.addEventListener('pointerdown', closeFlyout);
        window.addEventListener('online', renderTray);
        window.addEventListener('offline', renderTray);

        bus.on('wm', (type, w) => {
            renderTasks();
            if (type === 'close' && thumbFor === w) hideThumb();
        });
        bus.on('settings', key => {
            if (['volume', 'muted', 'computerName'].includes(key)) renderTray();
            if (key === 'showQuickLaunch') renderQuickLaunch();
            if (key === 'hour24' || key === 'timeOffset') updateClock();
        });
    },
    closeFlyout,
};
