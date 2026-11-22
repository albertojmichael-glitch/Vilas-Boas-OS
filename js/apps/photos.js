// Galeria de Fotos (image viewer + slide show).
import { $, html, esc, clamp, drag } from '../core/util.js';
import { FS } from '../core/fs.js';
import { WM } from '../wm.js';
import { showMenu } from '../ui/menu.js';
import { launch } from './registry.js';
import { deleteItems } from '../shell/fileops.js';

const btnIcon = p => `<svg viewBox="0 0 20 20" width="20" height="20">${p}</svg>`;
const I = {
    zoom: btnIcon('<circle cx="8" cy="8" r="5" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 12l5 5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>'),
    fit: btnIcon('<rect x="3" y="4" width="14" height="12" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M6 7h3M6 7v3M14 13h-3M14 13v-3" stroke="#fff" stroke-width="1.6"/>'),
    prev: btnIcon('<path d="M13 4L6 10l7 6z" fill="#fff"/><rect x="4" y="4" width="2" height="12" fill="#fff"/>'),
    next: btnIcon('<path d="M7 4l7 6-7 6z" fill="#fff"/><rect x="14" y="4" width="2" height="12" fill="#fff"/>'),
    play: btnIcon('<path d="M7 4l9 6-9 6z" fill="#fff"/>'),
    rotl: btnIcon('<path d="M5 9a6 6 0 1 1 2 6" stroke="#fff" stroke-width="2" fill="none"/><path d="M2 6l3 4 4-3z" fill="#fff"/>'),
    rotr: btnIcon('<path d="M15 9a6 6 0 1 0-2 6" stroke="#fff" stroke-width="2" fill="none"/><path d="M18 6l-3 4-4-3z" fill="#fff"/>'),
    del: btnIcon('<path d="M5 5l10 10M15 5L5 15" stroke="#ff7a68" stroke-width="2.6" stroke-linecap="round"/>'),
};

export function open({ file = null, slideshow = false } = {}) {
    let list = [];
    let idx = 0;
    let zoom = 0; // 0 = fit
    let rot = 0;
    let pan = { x: 0, y: 0 };

    const body = html(`<div class="photos">
        <div class="ph-top">
            <button class="ph-menu" data-m="file">Arquivo ▾</button>
            <button class="ph-menu" data-m="fix">Corrigir</button>
            <button class="ph-menu" data-m="wall">Plano de Fundo</button>
            <button class="ph-menu" data-m="open">Abrir ▾</button>
            <span class="ph-spacer"></span>
            <button class="ph-menu" data-m="help">?</button>
        </div>
        <div class="ph-stage"><img class="ph-img" alt="" draggable="false"><div class="ph-empty" hidden>Nenhuma imagem para exibir.</div></div>
        <div class="ph-bar">
            <button class="ph-btn" data-a="zoom" data-tip="Alterar o tamanho da exibição">${I.zoom}</button>
            <button class="ph-btn" data-a="fit" data-tip="Tamanho real / Ajustar à janela">${I.fit}</button>
            <span class="ph-sep"></span>
            <button class="ph-btn" data-a="prev" data-tip="Anterior">${I.prev}</button>
            <button class="ph-play" data-a="play" data-tip="Reproduzir Apresentação de Slides">${I.play}</button>
            <button class="ph-btn" data-a="next" data-tip="Próximo">${I.next}</button>
            <span class="ph-sep"></span>
            <button class="ph-btn" data-a="rotl" data-tip="Girar no sentido anti-horário">${I.rotl}</button>
            <button class="ph-btn" data-a="rotr" data-tip="Girar no sentido horário">${I.rotr}</button>
            <span class="ph-sep"></span>
            <button class="ph-btn" data-a="del" data-tip="Excluir">${I.del}</button>
        </div>
    </div>`);
    const img = $('.ph-img', body);
    const stage = $('.ph-stage', body);

    const current = () => list[idx] && FS.get(list[idx]);
    const load = () => {
        const n = current();
        $('.ph-empty', body).hidden = !!n;
        img.hidden = !n;
        if (!n) { win.setTitle('Galeria de Fotos'); return; }
        rot = 0; zoom = 0; pan = { x: 0, y: 0 };
        img.src = n.content;
        win.setTitle(`${FS.displayName(n)} - Galeria de Fotos`);
        apply();
    };
    const apply = () => {
        const s = zoom === 0 ? '' : ` scale(${zoom})`;
        img.style.transform = `translate(${pan.x}px, ${pan.y}px) rotate(${rot}deg)${s}`;
        img.classList.toggle('fit', zoom === 0);
        stage.classList.toggle('zoomed', zoom > 0);
    };
    const go = d => { if (!list.length) return; idx = (idx + d + list.length) % list.length; load(); };
    const setFile = id => {
        const n = FS.get(id);
        if (!n) return;
        list = FS.children(n.parent).filter(x => FS.isImage(x)).map(x => x.id);
        idx = Math.max(0, list.indexOf(id));
        load();
    };

    const slideShow = () => {
        if (!list.length) return;
        let i = idx;
        const ov = html(`<div class="slideshow"><img alt=""><img alt=""><div class="ss-hint">Esc para sair</div></div>`);
        document.body.appendChild(ov);
        const [a, b] = ov.querySelectorAll('img');
        let front = a;
        front.src = FS.get(list[i])?.content || ''; front.classList.add('on');
        const timer = setInterval(() => {
            i = (i + 1) % list.length;
            const back = front === a ? b : a;
            back.src = FS.get(list[i])?.content || '';
            back.onload = () => { back.classList.add('on'); front.classList.remove('on'); front = back; };
        }, 3500);
        const end = () => { clearInterval(timer); ov.remove(); document.removeEventListener('keydown', key, true); idx = i; load(); };
        const key = e => { if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); end(); } };
        document.addEventListener('keydown', key, true);
        ov.addEventListener('click', end);
        ov.requestFullscreen?.().catch(() => {});
        ov.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) end(); });
    };

    body.querySelector('.ph-bar').addEventListener('click', e => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        const a = b.dataset.a;
        if (a === 'prev') go(-1);
        else if (a === 'next') go(1);
        else if (a === 'play') slideShow();
        else if (a === 'rotl') { rot -= 90; apply(); }
        else if (a === 'rotr') { rot += 90; apply(); }
        else if (a === 'fit') { zoom = zoom === 0 ? 1 : 0; pan = { x: 0, y: 0 }; apply(); }
        else if (a === 'zoom') { zoom = zoom === 0 ? 1.5 : zoom >= 4 ? 0 : zoom * 1.5; pan = { x: 0, y: 0 }; apply(); }
        else if (a === 'del' && current()) {
            const id = current().id;
            deleteItems([id], win).then(ok => { if (ok) { list = list.filter(x => x !== id); idx = Math.min(idx, list.length - 1); load(); } });
        }
    });
    body.querySelector('.ph-top').addEventListener('click', e => {
        const b = e.target.closest('.ph-menu');
        if (!b) return;
        const r = b.getBoundingClientRect();
        const n = current();
        if (b.dataset.m === 'file') showMenu(r.left, r.bottom, [
            { label: 'Abrir pasta', disabled: !n, action: () => launch('explorer', { path: n.parent }) },
            { label: 'Excluir', disabled: !n, action: () => body.querySelector('[data-a="del"]').click() },
            '-',
            { label: 'Propriedades', disabled: !n, action: () => import('../ui/dialogs.js').then(d => d.properties(n.id)) },
            '-',
            { label: 'Sair', action: () => win.close() },
        ]);
        else if (b.dataset.m === 'fix' && n) launch('paint', { file: n.id });
        else if (b.dataset.m === 'wall' && n) import('../shell/desktop.js').then(d => d.setWallpaperFromFile(n.id));
        else if (b.dataset.m === 'open') showMenu(r.left, r.bottom, [
            { label: 'Paint', icon: 'paint', disabled: !n, action: () => launch('paint', { file: n.id }) },
            { label: 'Bloco de Notas', icon: 'notepad', disabled: !n, action: () => launch('notepad', { file: n.id }) },
        ]);
        else if (b.dataset.m === 'help') launch('help', { topic: 'photos' });
    });
    stage.addEventListener('wheel', e => {
        e.preventDefault();
        if (e.ctrlKey || zoom > 0) { zoom = clamp((zoom || 1) * (e.deltaY < 0 ? 1.2 : 1 / 1.2), 0, 8); if (zoom < 1.01 && e.deltaY > 0) { zoom = 0; pan = { x: 0, y: 0 }; } apply(); }
        else go(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    stage.addEventListener('pointerdown', e => {
        if (zoom === 0 || e.button !== 0) return;
        const s = { ...pan };
        drag(e, { cursor: 'grabbing', onMove: (dx, dy) => { pan = { x: s.x + dx, y: s.y + dy }; apply(); } });
    });
    stage.addEventListener('dblclick', () => { zoom = zoom === 0 ? 1 : 0; pan = { x: 0, y: 0 }; apply(); });
    body.tabIndex = -1;
    body.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') go(-1);
        else if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'F11') { e.preventDefault(); slideShow(); }
        else if (e.key === 'Delete') body.querySelector('[data-a="del"]').click();
    });

    const win = WM.open({ app: 'photos', title: 'Galeria de Fotos', icon: 'photos', width: 760, height: 540, content: body, minW: 420, minH: 320, cls: 'photos-win' });
    if (file) setFile(file);
    else {
        const first = FS.search('pictures', '.').find(n => FS.isImage(n));
        if (first) setFile(first.id); else load();
    }
    setTimeout(() => body.focus(), 50);
    if (slideshow) setTimeout(slideShow, 300);
    return win;
}
