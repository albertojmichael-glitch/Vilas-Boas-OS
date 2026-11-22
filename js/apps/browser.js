// Navegador Vilas Boas (tabbed web browser built on iframes).
import { $, html, esc } from '../core/util.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { showMenu } from '../ui/menu.js';
import { launch } from './registry.js';

const HOME = 'about:home';
const FAVORITES = [
    ['Wikipédia', 'https://pt.m.wikipedia.org/wiki/Windows_Vista'],
    ['Example.com', 'https://example.com/'],
    ['OpenStreetMap', 'https://www.openstreetmap.org/export/embed.html?bbox=-46.75,-23.65,-46.55,-23.5&layer=mapnik'],
    ['Internet Archive', 'https://archive.org/'],
];

function homePage() {
    const d = new Date();
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        body{margin:0;font:13px 'Segoe UI',Tahoma,sans-serif;background:linear-gradient(#e9f3fc,#fff 300px);color:#1e1e1e}
        .top{background:linear-gradient(#1a5fb4,#3b8ae0);color:#fff;padding:28px 0 60px;text-align:center}
        h1{margin:0;font-weight:300;font-size:34px;letter-spacing:.5px}h1 b{font-weight:600}
        .sub{opacity:.85;margin-top:4px}
        form{margin:-26px auto 0;width:min(560px,90%);display:flex;box-shadow:0 3px 12px rgba(0,0,0,.25);border-radius:4px;overflow:hidden}
        input{flex:1;border:1px solid #6d8fb8;border-right:0;padding:12px 14px;font:inherit;font-size:15px;outline:none}
        button{border:1px solid #2e6cb3;background:linear-gradient(#5fa3ec,#2a72cf);color:#fff;padding:0 22px;font:inherit;font-size:14px;cursor:pointer}
        .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;width:min(820px,92%);margin:30px auto}
        .card{background:#fff;border:1px solid #c9d8ea;border-radius:6px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
        .card h3{margin:0 0 8px;color:#1e395b;font-weight:400;font-size:15px}
        a{color:#0066cc;text-decoration:none;cursor:pointer;display:block;padding:3px 0}a:hover{text-decoration:underline}
        .foot{text-align:center;color:#6d6d6d;font-size:11px;margin:20px 0}
    </style></head><body>
        <div class="top"><h1><b>Vilas Boas</b> Live</h1><div class="sub">${d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
        <form id="f"><input id="q" placeholder="Pesquisar na Wikipédia" autofocus><button>Pesquisar</button></form>
        <div class="cards">
            <div class="card"><h3>Sites favoritos</h3>${FAVORITES.map(([n, u]) => `<a data-u="${u}">${n}</a>`).join('')}</div>
            <div class="card"><h3>No seu computador</h3><a data-app="explorer">Documentos</a><a data-app="photos">Galeria de Fotos</a><a data-app="mail">Vilas Mail</a><a data-app="mines">Caça-Minas</a></div>
            <div class="card"><h3>Dica</h3>Digite um endereço na barra acima ou pesquise na Wikipédia. Alguns sites não permitem ser exibidos dentro de outras páginas — use “Abrir fora” se a página ficar em branco.</div>
        </div>
        <div class="foot">Navegador Vilas Boas 7.0 — Modo Protegido: Ativado</div>
        <script>
            const send = m => parent.postMessage(Object.assign({vbos:true}, m), '*');
            document.getElementById('f').onsubmit = e => { e.preventDefault(); const q = document.getElementById('q').value.trim(); if (q) send({search:q}); };
            document.querySelectorAll('[data-u]').forEach(a => a.onclick = () => send({url:a.dataset.u}));
            document.querySelectorAll('[data-app]').forEach(a => a.onclick = () => send({app:a.dataset.app}));
        <\/script></body></html>`;
}

const normalize = text => {
    const t = text.trim();
    if (!t) return HOME;
    if (t === HOME || t === 'about:blank') return t;
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(t)) return 'https://' + t;
    return 'https://pt.m.wikipedia.org/w/index.php?search=' + encodeURIComponent(t);
};

export function open({ url = null, search = null } = {}) {
    const tabs = [];
    let active = null;

    const glass = html(`<div class="br-nav">
        <div class="ex-backfwd"><button class="nav-round br-back" data-tip="Voltar" disabled><i></i></button><button class="nav-round small br-fwd" data-tip="Avançar" disabled><i></i></button></div>
        <div class="ex-address no-drag br-address"><span class="ex-addr-ico">${ico('browser', 16)}</span><input class="br-url" spellcheck="false"><button class="ex-refresh br-reload" data-tip="Atualizar (F5)"><i></i></button><button class="br-stop" data-tip="Parar">✕</button></div>
        <div class="ex-search no-drag"><input class="br-search" placeholder="Wikipédia" spellcheck="false"><button class="ex-search-btn br-go"><i></i></button></div>
    </div>`);
    const body = html(`<div class="browser">
        <div class="br-tabbar">
            <button class="br-fav" data-tip="Central de Favoritos">★</button>
            <div class="br-tabs"></div>
            <button class="br-newtab" data-tip="Nova Guia (Ctrl+T)"></button>
            <span class="br-spacer"></span>
            <button class="br-cmd" data-cmd="home" data-tip="Página Inicial">⌂</button>
            <button class="br-cmd" data-cmd="page">Página ▾</button>
            <button class="br-cmd" data-cmd="tools">Ferramentas ▾</button>
        </div>
        <div class="br-info" hidden><span class="br-info-ico">ⓘ</span><span>Se a página ficar em branco, o site pode não permitir exibição incorporada.</span><a class="link br-out">Abrir fora</a><button class="br-info-x">✕</button></div>
        <div class="br-views"></div>
        <div class="statusbar br-status"><span class="br-status-text">Concluído</span><span>🌐 Internet | Modo Protegido: Ativado</span><span>100%</span></div>
    </div>`);

    const urlIn = $('.br-url', glass);
    const views = $('.br-views', body);

    const titleOf = t => t.url === HOME ? 'Vilas Boas Live' : t.title || t.url.replace(/^https?:\/\//, '').split('/')[0];
    const renderTabs = () => {
        $('.br-tabs', body).innerHTML = tabs.map((t, i) => `<div class="br-tab${t === active ? ' active' : ''}" data-i="${i}">${ico('browser', 16)}<span>${esc(titleOf(t))}</span><button class="br-tab-x" data-x="${i}" data-tip="Fechar Guia">✕</button></div>`).join('');
        if (active) {
            urlIn.value = active.url === HOME ? '' : active.url;
            urlIn.placeholder = active.url === HOME ? 'about:home' : '';
            $('.br-back', glass).disabled = active.idx <= 0;
            $('.br-fwd', glass).disabled = active.idx >= active.hist.length - 1;
            $('.br-info', body).hidden = active.url === HOME || active.infoClosed;
            win.setTitle(`${titleOf(active)} - Navegador Vilas Boas`);
        }
    };
    const load = (t, u) => {
        t.url = u; t.title = '';
        $('.br-status-text', body).textContent = 'Aguardando ' + (u === HOME ? 'about:home' : u) + '...';
        if (u === HOME) { t.frame.removeAttribute('src'); t.frame.srcdoc = homePage(); }
        else { t.frame.removeAttribute('srcdoc'); t.frame.src = u; }
        renderTabs();
    };
    const navigate = (t, u) => {
        t.hist = t.hist.slice(0, t.idx + 1);
        t.hist.push(u); t.idx = t.hist.length - 1;
        load(t, u);
    };
    const select = t => {
        active = t;
        tabs.forEach(x => { x.frame.hidden = x !== t; });
        renderTabs();
    };
    const newTab = (u = HOME) => {
        const frame = document.createElement('iframe');
        frame.className = 'br-frame';
        frame.setAttribute('referrerpolicy', 'no-referrer');
        frame.setAttribute('allow', 'fullscreen');
        views.appendChild(frame);
        const t = { frame, url: '', title: '', hist: [], idx: -1 };
        frame.addEventListener('load', () => {
            $('.br-status-text', body).textContent = 'Concluído';
            try { const d = frame.contentDocument; if (d && t.url !== HOME) t.title = d.title; } catch { /* cross-origin */ }
            renderTabs();
        });
        tabs.push(t);
        select(t);
        navigate(t, u);
        return t;
    };
    const closeTab = i => {
        const t = tabs[i];
        if (!t) return;
        if (tabs.length === 1) { win.close(); return; }
        t.frame.remove();
        tabs.splice(i, 1);
        if (active === t) select(tabs[Math.max(0, i - 1)]); else renderTabs();
    };

    const onMessage = e => {
        if (!e.data?.vbos || !tabs.some(t => t.frame.contentWindow === e.source)) return;
        const t = tabs.find(x => x.frame.contentWindow === e.source);
        if (e.data.url) navigate(t, e.data.url);
        else if (e.data.search) navigate(t, normalize(e.data.search));
        else if (e.data.app) launch(e.data.app);
    };
    window.addEventListener('message', onMessage);

    urlIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { navigate(active, normalize(urlIn.value)); urlIn.blur(); } if (e.key === 'Escape') { renderTabs(); urlIn.blur(); } });
    urlIn.addEventListener('focus', () => urlIn.select());
    const searchIn = $('.br-search', glass);
    const doSearch = () => { if (searchIn.value.trim()) navigate(active, 'https://pt.m.wikipedia.org/w/index.php?search=' + encodeURIComponent(searchIn.value.trim())); };
    searchIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') doSearch(); });
    $('.br-go', glass).addEventListener('click', doSearch);
    $('.br-back', glass).addEventListener('click', () => { if (active.idx > 0) { active.idx--; load(active, active.hist[active.idx]); } });
    $('.br-fwd', glass).addEventListener('click', () => { if (active.idx < active.hist.length - 1) { active.idx++; load(active, active.hist[active.idx]); } });
    $('.br-reload', glass).addEventListener('click', () => load(active, active.url));
    $('.br-stop', glass).addEventListener('click', () => { try { active.frame.contentWindow.stop(); } catch { /* ignore */ } $('.br-status-text', body).textContent = 'Concluído'; });
    $('.br-tabs', body).addEventListener('click', e => {
        const x = e.target.closest('.br-tab-x');
        if (x) { closeTab(+x.dataset.x); return; }
        const t = e.target.closest('.br-tab');
        if (t) select(tabs[+t.dataset.i]);
    });
    $('.br-tabs', body).addEventListener('auxclick', e => { const t = e.target.closest('.br-tab'); if (t && e.button === 1) closeTab(+t.dataset.i); });
    $('.br-newtab', body).addEventListener('click', () => newTab());
    $('.br-out', body).addEventListener('click', () => { if (active.url !== HOME) window.open(active.url, '_blank', 'noopener'); });
    $('.br-info-x', body).addEventListener('click', () => { active.infoClosed = true; renderTabs(); });
    $('.br-fav', body).addEventListener('click', e => {
        const r = e.currentTarget.getBoundingClientRect();
        showMenu(r.left, r.bottom, [{ label: 'Página Inicial', icon: 'browser', action: () => navigate(active, HOME) }, '-', ...FAVORITES.map(([n, u]) => ({ label: n, icon: 'browser', action: () => navigate(active, u) }))]);
    });
    body.querySelectorAll('.br-cmd').forEach(b => b.addEventListener('click', e => {
        const r = e.currentTarget.getBoundingClientRect();
        if (b.dataset.cmd === 'home') navigate(active, HOME);
        else if (b.dataset.cmd === 'page') showMenu(r.left, r.bottom, [
            { label: 'Nova Janela', key: 'Ctrl+N', action: () => launch('browser') },
            { label: 'Nova Guia', key: 'Ctrl+T', action: () => newTab() },
            '-',
            { label: 'Abrir em uma janela do navegador real', disabled: active.url === HOME, action: () => window.open(active.url, '_blank', 'noopener') },
            { label: 'Copiar endereço', disabled: active.url === HOME, action: () => navigator.clipboard?.writeText(active.url).catch(() => {}) },
        ]);
        else showMenu(r.left, r.bottom, [
            { label: 'Excluir Histórico de Navegação...', action: () => { tabs.forEach(t => { t.hist = [t.url]; t.idx = 0; }); renderTabs(); } },
            '-',
            { label: 'Opções da Internet', action: () => launch('control', { page: 'network' }) },
            { label: 'Sobre o Navegador', action: () => launch('winver', { app: 'Navegador Vilas Boas', icon: 'browser' }) },
        ]);
    }));

    const win = WM.open({ app: 'browser', title: 'Navegador Vilas Boas', icon: 'browser', width: 900, height: 600, minW: 420, minH: 300, content: body, glass, hideTitle: true, cls: 'browser-win' });
    win.onClose(() => window.removeEventListener('message', onMessage));
    win.el.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); newTab(); }
        else if (e.ctrlKey && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(tabs.indexOf(active)); }
        else if (e.key === 'F5') { e.preventDefault(); load(active, active.url); }
    });
    newTab(url ? normalize(url) : search ? normalize(search) : HOME);
    return win;
}
