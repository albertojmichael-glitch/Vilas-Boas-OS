// Paint.
import { $, $$, html, esc, drag, extOf, baseName } from '../core/util.js';
import { FS } from '../core/fs.js';
import { WM } from '../wm.js';
import { menuBar } from '../ui/menu.js';
import { messageBox, errorBox } from '../ui/dialogs.js';
import { openFileDialog, saveFileDialog, IMAGE_FILTERS } from '../ui/filedialog.js';
import { launch } from './registry.js';

const S = p => `<svg viewBox="0 0 16 16" width="16" height="16">${p}</svg>`;
const TOOLS = [
    ['pencil', 'Lápis', S(`<path d="M2 14l1-4 8-8 3 3-8 8z" fill="#f5d36b" stroke="#6b4b0b"/><path d="M2 14l1-4 3 3z" fill="#e8b98a" stroke="#6b4b0b"/><path d="M2 14l.6-2 1.4 1.4z" fill="#333"/>`)],
    ['brush', 'Pincel', S(`<path d="M14 1L7 9l1.5 1.5L15 3z" fill="#9a6a33" stroke="#4b2e12"/><path d="M7 9c-2 0-3 1-3.5 3S2 14 1 14.5c3 .5 6-.5 7.5-4z" fill="#2f6fd0" stroke="#173c78"/>`)],
    ['airbrush', 'Spray', S(`<rect x="7" y="6" width="6" height="9" rx="1" fill="#c9d3de" stroke="#4b5560"/><rect x="8" y="3" width="4" height="3" fill="#4b5560"/><g fill="#2f6fd0"><circle cx="3" cy="3" r=".8"/><circle cx="5" cy="5" r=".8"/><circle cx="2" cy="6" r=".8"/><circle cx="4" cy="1.5" r=".8"/><circle cx="1.5" cy="9" r=".8"/></g>`)],
    ['eraser', 'Borracha', S(`<path d="M2 11l6-7 6 5-5 5H5z" fill="#ff9fb4" stroke="#8a3a4c"/><path d="M2 11l3-3.5 6 5L9 14H5z" fill="#fff" stroke="#8a3a4c"/>`)],
    ['fill', 'Preencher com Cor', S(`<path d="M3 7l5-5 6 6-5 5z" fill="#e8eef4" stroke="#4b5560"/><path d="M3 7h11l-5 5z" fill="#2f6fd0" opacity=".7"/><path d="M13 10c1 1.5 2 3 1 4s-2-1-1-4z" fill="#2f6fd0"/>`)],
    ['picker', 'Selecionar Cor', S(`<path d="M10 2l4 4-2 1-6 6H4v-2l6-6z" fill="#dfe6ee" stroke="#4b5560"/><path d="M4 11l-2 3 3-2" stroke="#4b5560" fill="#2f6fd0"/>`)],
    ['text', 'Texto', S(`<text x="3" y="13" font-size="13" font-family="Georgia, serif" font-weight="bold" fill="#1d2833">A</text>`)],
    ['zoom', 'Lupa', S(`<circle cx="6.5" cy="6.5" r="4.5" fill="#dff1ff" stroke="#4b5560" stroke-width="1.5"/><path d="M10 10l4.5 4.5" stroke="#6b4b0b" stroke-width="2.4" stroke-linecap="round"/>`)],
    ['line', 'Linha', S(`<path d="M2 14L14 2" stroke="#1d2833" stroke-width="1.6"/>`)],
    ['rect', 'Retângulo', S(`<rect x="2" y="3.5" width="12" height="9" fill="none" stroke="#1d2833" stroke-width="1.5"/>`)],
    ['ellipse', 'Elipse', S(`<ellipse cx="8" cy="8" rx="6" ry="4.5" fill="none" stroke="#1d2833" stroke-width="1.5"/>`)],
    ['rrect', 'Retângulo Arredondado', S(`<rect x="2" y="3.5" width="12" height="9" rx="3" fill="none" stroke="#1d2833" stroke-width="1.5"/>`)],
];
const PALETTE = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];

export function open({ file = null } = {}) {
    let tool = 'pencil', prevTool = 'pencil';
    let fg = '#000000', bg = '#ffffff';
    let size = { pencil: 1, brush: 4, airbrush: 10, eraser: 8, line: 2, rect: 2, ellipse: 2, rrect: 2 };
    let fillMode = 'outline';
    let zoom = 1;
    let fileId = null, dirty = false;
    const undo = [], redo = [];

    const body = html(`<div class="paint">
        <div class="pt-main">
            <div class="pt-toolbox">
                <div class="pt-tools">${TOOLS.map(([id, tip, svg]) => `<button class="pt-tool${id === tool ? ' active' : ''}" data-tool="${id}" data-tip="${tip}">${svg}</button>`).join('')}</div>
                <div class="pt-options"></div>
            </div>
            <div class="pt-area"><div class="pt-canvas-wrap"><canvas class="pt-canvas"></canvas><canvas class="pt-overlay"></canvas><div class="pt-handle" data-tip="Redimensionar"></div></div></div>
        </div>
        <div class="pt-colors">
            <div class="pt-current"><span class="pt-bg"></span><span class="pt-fg"></span></div>
            <div class="pt-palette">${PALETTE.map(c => `<span class="pt-swatch" data-c="${c}" style="background:${c}"></span>`).join('')}</div>
            <input type="color" class="pt-picker" hidden>
        </div>
        <div class="statusbar"><span class="pt-tip">Para obter Ajuda, clique em Tópicos da Ajuda no menu Ajuda.</span><span class="pt-pos" style="width:110px"></span><span class="pt-dim" style="width:110px"></span></div>
    </div>`);
    const canvas = $('.pt-canvas', body);
    const overlay = $('.pt-overlay', body);
    const wrap = $('.pt-canvas-wrap', body);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const octx = overlay.getContext('2d');

    const setSize = (w, h, keep = true) => {
        const old = keep ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
        canvas.width = overlay.width = w; canvas.height = overlay.height = h;
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
        if (old) ctx.putImageData(old, 0, 0);
        applyZoom();
    };
    const applyZoom = () => {
        wrap.style.width = canvas.width * zoom + 'px';
        wrap.style.height = canvas.height * zoom + 'px';
        [canvas, overlay].forEach(c => { c.style.width = canvas.width * zoom + 'px'; c.style.height = canvas.height * zoom + 'px'; });
        $('.pt-dim', body).textContent = `${canvas.width} x ${canvas.height}`;
    };
    const snapshot = () => {
        undo.push({ data: ctx.getImageData(0, 0, canvas.width, canvas.height) });
        if (undo.length > 25) undo.shift();
        redo.length = 0;
        dirty = true;
    };
    const restore = (from, to) => {
        const s = from.pop();
        if (!s) return;
        to.push({ data: ctx.getImageData(0, 0, canvas.width, canvas.height) });
        if (s.data.width !== canvas.width || s.data.height !== canvas.height) { canvas.width = overlay.width = s.data.width; canvas.height = overlay.height = s.data.height; applyZoom(); }
        ctx.putImageData(s.data, 0, 0);
        dirty = true;
    };

    const name = () => fileId && FS.get(fileId) ? FS.displayName(FS.get(fileId)) : 'Sem título';
    const updateTitle = () => win.setTitle(`${name()} - Paint`);
    const updateColors = () => { $('.pt-fg', body).style.background = fg; $('.pt-bg', body).style.background = bg; };

    const renderOptions = () => {
        const box = $('.pt-options', body);
        if (['rect', 'ellipse', 'rrect'].includes(tool)) {
            box.innerHTML = ['outline', 'both', 'fill'].map(m => `<button class="pt-opt${fillMode === m ? ' active' : ''}" data-fill="${m}"><span class="fm fm-${m}"></span></button>`).join('')
                + [1, 2, 4, 6].map(s => `<button class="pt-opt${size[tool] === s ? ' active' : ''}" data-size="${s}"><span class="ln" style="height:${s}px"></span></button>`).join('');
        } else if (tool === 'zoom') {
            box.innerHTML = [1, 2, 4, 6].map(z => `<button class="pt-opt txt${zoom === z ? ' active' : ''}" data-zoom="${z}">${z}x</button>`).join('');
        } else if (size[tool] != null && tool !== 'pencil') {
            const opts = tool === 'airbrush' ? [6, 10, 16] : tool === 'eraser' ? [4, 8, 12, 20] : [1, 2, 4, 8, 12];
            box.innerHTML = opts.map(s => `<button class="pt-opt${size[tool] === s ? ' active' : ''}" data-size="${s}"><span class="dot" style="width:${Math.min(s, 14)}px;height:${Math.min(s, 14)}px;${tool === 'eraser' ? 'border-radius:0' : ''}"></span></button>`).join('');
        } else box.innerHTML = '';
    };
    const setTool = t => {
        if (t !== 'picker') prevTool = tool === 'picker' ? prevTool : tool;
        tool = t;
        $$('.pt-tool', body).forEach(b => b.classList.toggle('active', b.dataset.tool === t));
        renderOptions();
        wrap.dataset.tool = t;
    };

    const pos = e => {
        const r = canvas.getBoundingClientRect();
        return { x: Math.floor((e.clientX - r.left) / zoom), y: Math.floor((e.clientY - r.top) / zoom) };
    };
    const hexToRgba = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]; };
    const floodFill = (x, y, color) => {
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = img.data, W = canvas.width, H = canvas.height;
        const i0 = (y * W + x) * 4;
        const target = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
        const rep = hexToRgba(color);
        if (target.every((v, i) => v === rep[i])) return;
        const match = i => Math.abs(d[i] - target[0]) < 8 && Math.abs(d[i + 1] - target[1]) < 8 && Math.abs(d[i + 2] - target[2]) < 8 && Math.abs(d[i + 3] - target[3]) < 8;
        const stack = [[x, y]];
        while (stack.length) {
            let [cx, cy] = stack.pop();
            let i = (cy * W + cx) * 4;
            while (cy >= 0 && match(i)) { cy--; i -= W * 4; }
            cy++; i += W * 4;
            let left = false, right = false;
            while (cy < H && match(i)) {
                d[i] = rep[0]; d[i + 1] = rep[1]; d[i + 2] = rep[2]; d[i + 3] = 255;
                if (cx > 0) { if (match(i - 4)) { if (!left) { stack.push([cx - 1, cy]); left = true; } } else left = false; }
                if (cx < W - 1) { if (match(i + 4)) { if (!right) { stack.push([cx + 1, cy]); right = true; } } else right = false; }
                cy++; i += W * 4;
            }
        }
        ctx.putImageData(img, 0, 0);
    };
    const shape = (c, kind, a, b, color, color2, shift) => {
        let w = b.x - a.x, h = b.y - a.y;
        if (shift && kind !== 'line') { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
        c.lineWidth = size[kind] || 1;
        c.strokeStyle = color; c.fillStyle = fillMode === 'fill' ? color : color2;
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath();
        if (kind === 'line') { c.moveTo(a.x + .5, a.y + .5); c.lineTo(a.x + w + .5, a.y + h + .5); c.stroke(); return; }
        const x = Math.min(a.x, a.x + w) + .5, y = Math.min(a.y, a.y + h) + .5, W = Math.abs(w), H = Math.abs(h);
        if (kind === 'rect') c.rect(x, y, W, H);
        else if (kind === 'rrect') c.roundRect ? c.roundRect(x, y, W, H, Math.min(12, W / 3, H / 3)) : c.rect(x, y, W, H);
        else c.ellipse(x + W / 2, y + H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
        if (fillMode !== 'outline') c.fill();
        if (fillMode !== 'fill') c.stroke();
    };
    const textTool = p => {
        const ta = document.createElement('textarea');
        ta.className = 'pt-textbox';
        ta.style.left = p.x * zoom + 'px'; ta.style.top = p.y * zoom + 'px';
        ta.style.color = fg; ta.style.fontSize = 16 * zoom + 'px';
        wrap.appendChild(ta);
        setTimeout(() => ta.focus(), 0);
        let done = false;
        const commit = keep => {
            if (done) return; done = true;
            if (keep && ta.value.trim()) {
                snapshot();
                ctx.fillStyle = fg; ctx.font = '16px "Segoe UI", Arial, sans-serif'; ctx.textBaseline = 'top';
                ta.value.split('\n').forEach((line, i) => ctx.fillText(line, p.x + 2, p.y + 3 + i * 20));
            }
            ta.remove();
        };
        ta.addEventListener('blur', () => commit(true));
        ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') commit(false); });
        ta.addEventListener('pointerdown', e => e.stopPropagation());
    };

    wrap.addEventListener('contextmenu', e => e.preventDefault());
    wrap.addEventListener('pointerdown', e => {
        if (e.target.closest('.pt-handle, .pt-textbox')) return;
        if (e.button !== 0 && e.button !== 2) return;
        e.preventDefault();
        const right = e.button === 2;
        const color = right ? bg : fg, color2 = right ? fg : bg;
        const p0 = pos(e);
        if (tool === 'zoom') { zoom = right ? Math.max(1, zoom / 2) : Math.min(6, zoom === 1 ? 4 : zoom + 2); applyZoom(); renderOptions(); return; }
        if (tool === 'picker') {
            const d = ctx.getImageData(Math.max(0, Math.min(p0.x, canvas.width - 1)), Math.max(0, Math.min(p0.y, canvas.height - 1)), 1, 1).data;
            const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
            if (right) bg = hex; else fg = hex;
            updateColors(); setTool(prevTool); return;
        }
        if (tool === 'text') { textTool(p0); return; }
        if (tool === 'fill') {
            if (p0.x < 0 || p0.y < 0 || p0.x >= canvas.width || p0.y >= canvas.height) return;
            snapshot(); floodFill(p0.x, p0.y, color); return;
        }
        snapshot();
        let last = p0;
        let spray = null;
        const stroke = (a, b) => {
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            if (tool === 'pencil') { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x + .5, a.y + .5); ctx.lineTo(b.x + .5, b.y + .5); ctx.stroke(); }
            else if (tool === 'brush') { ctx.strokeStyle = color; ctx.lineWidth = size.brush; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
            else if (tool === 'eraser') { ctx.strokeStyle = right ? fg : bg; ctx.lineCap = 'square'; ctx.lineWidth = size.eraser; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        };
        if (tool === 'airbrush') {
            const puff = () => { ctx.fillStyle = color; for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * size.airbrush; ctx.fillRect(last.x + Math.cos(a) * r, last.y + Math.sin(a) * r, 1, 1); } };
            puff(); spray = setInterval(puff, 30);
        } else if (['pencil', 'brush', 'eraser'].includes(tool)) stroke(p0, p0);
        drag(e, {
            onMove: (dx, dy, ev) => {
                const p = pos(ev);
                $('.pt-pos', body).textContent = `${p.x}, ${p.y}`;
                if (['pencil', 'brush', 'eraser'].includes(tool)) { stroke(last, p); last = p; }
                else if (tool === 'airbrush') last = p;
                else { octx.clearRect(0, 0, overlay.width, overlay.height); shape(octx, tool, p0, p, color, color2, ev.shiftKey); }
            },
            onEnd: ev => {
                clearInterval(spray);
                if (['line', 'rect', 'ellipse', 'rrect'].includes(tool)) {
                    octx.clearRect(0, 0, overlay.width, overlay.height);
                    shape(ctx, tool, p0, pos(ev), color, color2, ev.shiftKey);
                }
            }
        });
    });
    wrap.addEventListener('pointermove', e => { const p = pos(e); $('.pt-pos', body).textContent = `${p.x}, ${p.y}`; });
    $('.pt-handle', body).addEventListener('pointerdown', e => {
        e.stopPropagation(); e.preventDefault();
        const w0 = canvas.width, h0 = canvas.height;
        const ghost = document.createElement('div');
        ghost.className = 'pt-ghost';
        wrap.appendChild(ghost);
        let nw = w0, nh = h0;
        drag(e, {
            cursor: 'nwse-resize',
            onMove: (dx, dy) => { nw = Math.max(1, Math.round(w0 + dx / zoom)); nh = Math.max(1, Math.round(h0 + dy / zoom)); ghost.style.width = nw * zoom + 'px'; ghost.style.height = nh * zoom + 'px'; $('.pt-dim', body).textContent = `${nw} x ${nh}`; },
            onEnd: () => { ghost.remove(); if (nw !== w0 || nh !== h0) { snapshot(); setSize(nw, nh); } }
        });
    });

    $('.pt-tools', body).addEventListener('click', e => { const b = e.target.closest('.pt-tool'); if (b) setTool(b.dataset.tool); });
    $('.pt-options', body).addEventListener('click', e => {
        const b = e.target.closest('.pt-opt');
        if (!b) return;
        if (b.dataset.size) size[tool] = +b.dataset.size;
        if (b.dataset.fill) fillMode = b.dataset.fill;
        if (b.dataset.zoom) { zoom = +b.dataset.zoom; applyZoom(); }
        renderOptions();
    });
    const palette = $('.pt-palette', body);
    palette.addEventListener('pointerdown', e => {
        const s = e.target.closest('.pt-swatch');
        if (!s) return;
        if (e.button === 2) bg = s.dataset.c; else fg = s.dataset.c;
        updateColors();
    });
    palette.addEventListener('contextmenu', e => e.preventDefault());
    palette.addEventListener('dblclick', e => { const s = e.target.closest('.pt-swatch'); if (s) editColors(); });
    const picker = $('.pt-picker', body);
    const editColors = () => { picker.value = fg; picker.click(); };
    picker.addEventListener('input', () => { fg = picker.value; updateColors(); });

    /* ---------- File operations ---------- */
    const loadImage = id => new Promise(resolve => {
        const n = FS.get(id);
        if (!n) return resolve(false);
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth || 600, h = img.naturalHeight || 400;
            const scale = Math.min(1, 1600 / w, 1200 / h);
            canvas.width = overlay.width = Math.round(w * scale); canvas.height = overlay.height = Math.round(h * scale);
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            fileId = id; dirty = false; undo.length = 0; redo.length = 0;
            applyZoom(); updateTitle(); resolve(true);
        };
        img.onerror = () => { errorBox(`O Paint não pode ler este arquivo.\n${n.name}`, { parent: win }); resolve(false); };
        img.src = n.content;
    });
    const saveAs = async () => {
        const cur = fileId && FS.get(fileId);
        const res = await saveFileDialog({ parent: win, folder: cur?.parent || 'pictures', name: cur ? baseName(cur.name) + '.png' : 'Sem título.png', filters: [{ label: 'PNG (*.png)', exts: ['png'] }] });
        if (!res) return false;
        try {
            const data = canvas.toDataURL('image/png');
            if (res.existing) { FS.write(res.existing, data); fileId = res.existing; }
            else fileId = FS.create(res.folder, res.name, 'file', data).id;
            dirty = false; updateTitle(); return true;
        } catch (err) { errorBox(err.message, { parent: win }); return false; }
    };
    const save = async () => {
        const cur = fileId && FS.get(fileId);
        if (!cur || cur.parent === 'recycle' || extOf(cur.name) !== 'png') return saveAs();
        try { FS.write(fileId, canvas.toDataURL('image/png')); dirty = false; updateTitle(); return true; }
        catch (err) { errorBox(err.message, { parent: win }); return false; }
    };
    const confirmDiscard = async () => {
        if (!dirty) return true;
        const r = await messageBox({ title: 'Paint', icon: null, instruction: `Deseja salvar as alterações em ${name()}?`, buttons: ['Salvar', 'Não Salvar', 'Cancelar'], parent: win, sound: false });
        if (r === 'Salvar') return save();
        return r === 'Não Salvar';
    };
    const newImage = async () => { if (!(await confirmDiscard())) return; fileId = null; bg = '#ffffff'; updateColors(); setSize(600, 400, false); undo.length = 0; dirty = false; updateTitle(); };
    const openImage = async () => { if (!(await confirmDiscard())) return; const id = await openFileDialog({ parent: win, folder: 'pictures', filters: IMAGE_FILTERS }); if (id) loadImage(id); };
    const transform = fn => {
        snapshot();
        const tmp = document.createElement('canvas');
        tmp.width = canvas.width; tmp.height = canvas.height;
        tmp.getContext('2d').drawImage(canvas, 0, 0);
        fn(tmp);
        applyZoom();
    };
    const attributes = () => {
        const b = html(`<div class="msgbox"><div class="msg-main" style="flex-direction:column;gap:10px">
            <label>Largura (pixels): <input class="textbox at-w" type="number" min="1" max="4000" value="${canvas.width}" style="width:90px"></label>
            <label>Altura (pixels): &nbsp;&nbsp;<input class="textbox at-h" type="number" min="1" max="4000" value="${canvas.height}" style="width:90px"></label></div>
            <div class="msg-buttons"><button class="btn default" data-ok>OK</button><button class="btn" data-c>Cancelar</button></div></div>`);
        const d = WM.open({ title: 'Atributos', dialog: true, parent: win, content: b, width: 280, height: 190, resizable: false });
        $('[data-ok]', b).addEventListener('click', () => {
            const w = Math.max(1, Math.min(4000, +$('.at-w', b).value || canvas.width)), h = Math.max(1, Math.min(4000, +$('.at-h', b).value || canvas.height));
            d.close(); if (w !== canvas.width || h !== canvas.height) { snapshot(); setSize(w, h); }
        });
        $('[data-c]', b).addEventListener('click', () => d.close());
    };

    const bar = menuBar([
        { label: 'Arquivo', items: () => [
            { label: 'Novo', key: 'Ctrl+N', action: newImage },
            { label: 'Abrir...', key: 'Ctrl+O', action: openImage },
            { label: 'Salvar', key: 'Ctrl+S', action: save },
            { label: 'Salvar como...', action: saveAs },
            '-',
            { label: 'Definir como Plano de Fundo (Centralizado)', disabled: !fileId, action: async () => { if (dirty) await save(); const d = await import('../shell/desktop.js'); d.setWallpaperFromFile(fileId); } },
            '-',
            { label: 'Sair', action: () => win.requestClose() },
        ] },
        { label: 'Editar', items: () => [
            { label: 'Desfazer', key: 'Ctrl+Z', disabled: !undo.length, action: () => restore(undo, redo) },
            { label: 'Repetir', key: 'Ctrl+Y', disabled: !redo.length, action: () => restore(redo, undo) },
            '-',
            { label: 'Copiar Imagem', key: 'Ctrl+C', action: () => canvas.toBlob(b => { try { navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); } catch { /* unsupported */ } }) },
        ] },
        { label: 'Exibir', items: () => [
            { label: 'Caixa de Ferramentas', checked: !$('.pt-toolbox', body).hidden, action: () => { $('.pt-toolbox', body).hidden = !$('.pt-toolbox', body).hidden; } },
            { label: 'Caixa de Cores', checked: !$('.pt-colors', body).hidden, action: () => { $('.pt-colors', body).hidden = !$('.pt-colors', body).hidden; } },
            { label: 'Barra de Status', checked: !$('.statusbar', body).hidden, action: () => { $('.statusbar', body).hidden = !$('.statusbar', body).hidden; } },
            '-',
            { label: 'Zoom', sub: [1, 2, 4, 6].map(z => ({ label: `${z * 100}%`, radio: zoom === z, action: () => { zoom = z; applyZoom(); renderOptions(); } })) },
        ] },
        { label: 'Imagem', items: () => [
            { label: 'Virar Horizontalmente', action: () => transform(t => { ctx.save(); ctx.scale(-1, 1); ctx.drawImage(t, -canvas.width, 0); ctx.restore(); }) },
            { label: 'Virar Verticalmente', action: () => transform(t => { ctx.save(); ctx.scale(1, -1); ctx.drawImage(t, 0, -canvas.height); ctx.restore(); }) },
            { label: 'Girar 90°', action: () => transform(t => { canvas.width = overlay.width = t.height; canvas.height = overlay.height = t.width; ctx.save(); ctx.translate(canvas.width, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(t, 0, 0); ctx.restore(); }) },
            { label: 'Inverter Cores', key: 'Ctrl+I', action: () => { snapshot(); const d = ctx.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 255 - d.data[i]; d.data[i + 1] = 255 - d.data[i + 1]; d.data[i + 2] = 255 - d.data[i + 2]; } ctx.putImageData(d, 0, 0); } },
            { label: 'Atributos...', key: 'Ctrl+E', action: attributes },
            { label: 'Limpar Imagem', key: 'Ctrl+Shift+N', action: () => { snapshot(); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); } },
        ] },
        { label: 'Cores', items: [{ label: 'Editar Cores...', action: editColors }] },
        { label: 'Ajuda', items: [{ label: 'Tópicos da Ajuda', action: () => launch('help', { topic: 'paint' }) }, '-', { label: 'Sobre o Paint', action: () => launch('winver', { app: 'Paint', icon: 'paint' }) }] },
    ]);
    body.prepend(bar);

    const win = WM.open({ app: 'paint', title: 'Sem título - Paint', icon: 'paint', width: 820, height: 580, content: body, minW: 400, minH: 300, onBeforeClose: confirmDiscard });
    body.tabIndex = -1;
    body.addEventListener('keydown', e => {
        if (e.target.closest('textarea, input')) return;
        const k = e.key.toLowerCase();
        if (e.ctrlKey && k === 'z') { e.preventDefault(); restore(undo, redo); }
        else if (e.ctrlKey && k === 'y') { e.preventDefault(); restore(redo, undo); }
        else if (e.ctrlKey && k === 's') { e.preventDefault(); save(); }
        else if (e.ctrlKey && k === 'o') { e.preventDefault(); openImage(); }
        else if (e.ctrlKey && e.shiftKey && k === 'n') { e.preventDefault(); snapshot(); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        else if (e.ctrlKey && k === 'n') { e.preventDefault(); newImage(); }
        else if (e.ctrlKey && k === 'e') { e.preventDefault(); attributes(); }
    });
    win.el.addEventListener('pointerdown', () => { if (!document.activeElement?.closest('textarea, input')) body.focus({ preventScroll: true }); });

    setSize(600, 400, false);
    updateColors();
    setTool('pencil');
    updateTitle();
    if (file) loadImage(file);
    return win;
}
