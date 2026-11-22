// Common Open / Save As dialogs.
import { $, $$, esc, html, extOf, formatDate, formatSize } from '../core/util.js';
import { FS } from '../core/fs.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { nodeIcon } from '../apps/registry.js';
import { messageBox, errorBox } from './dialogs.js';

const PLACES = [
    ['desktop', 'Área de Trabalho', 'folder:desktop'], ['home', null, 'folder:home'], ['documents', 'Documentos', 'folder:documents'],
    ['pictures', 'Imagens', 'folder:pictures'], ['music', 'Músicas', 'folder:music'], ['downloads', 'Downloads', 'folder:downloads'], ['root', 'Disco Local (C:)', 'drive'],
];

/**
 * mode: 'open' | 'save'
 * filters: [{label:'Documentos de Texto (*.txt)', exts:['txt']}, {label:'Todos os Arquivos (*.*)', exts:null}]
 */
function fileDialog({ mode, title, parent, folder = 'documents', name = '', filters }) {
    return new Promise(resolve => {
        let cur = FS.get(folder) ? folder : 'documents';
        let filter = 0;
        const back = [];
        const body = html(`<div class="fd">
            <div class="fd-top">
                <button class="nav-round fd-back" data-tip="Voltar" disabled><i></i></button>
                <div class="ex-address fd-addr"><span class="ex-addr-ico"></span><div class="ex-crumbs"></div></div>
                <button class="btn btn-sm fd-up" data-tip="Subir um nível">↑</button>
                <button class="btn btn-sm fd-new" data-tip="Nova Pasta">Nova Pasta</button>
            </div>
            <div class="fd-main">
                <div class="fd-places">${PLACES.map(([id, label, icon]) => `<div class="ex-fav" data-id="${id}">${ico(icon, 16)}<span>${esc(label || FS.get('home')?.name || 'Usuário')}</span></div>`).join('')}</div>
                <div class="fd-list" tabindex="0"></div>
            </div>
            <div class="fd-bottom">
                <label>Nome do arquivo:</label><input class="textbox fd-name" spellcheck="false" value="${esc(name)}">
                <label>Tipo:</label><select class="textbox fd-type">${filters.map((f, i) => `<option value="${i}">${esc(f.label)}</option>`).join('')}</select>
            </div>
            <div class="fd-buttons"><button class="btn default fd-ok">${mode === 'save' ? 'Salvar' : 'Abrir'}</button><button class="btn fd-cancel">Cancelar</button></div>
        </div>`);
        let result = null;
        const w = WM.open({ title, icon: mode === 'save' ? 'documents' : 'folder', dialog: true, parent, content: body, width: 640, height: 440, resizable: true, minW: 500, minH: 340, cls: 'fd-win' });
        w.onClose(() => resolve(result));
        const list = $('.fd-list', body);
        const nameIn = $('.fd-name', body);

        const matches = n => {
            const exts = filters[filter].exts;
            return !exts || exts.includes(extOf(n.name));
        };
        const render = () => {
            const kids = FS.children(cur).filter(n => n.type === 'folder' || (n.type === 'file' && matches(n)));
            list.innerHTML = `<div class="fd-head"><span>Nome</span><span>Data de modificação</span><span>Tamanho</span></div>` +
                (kids.length ? kids.map(n => `<div class="fd-row sel-item" data-id="${n.id}">${ico(nodeIcon(n), 16)}<span class="fd-n">${esc(n.name)}</span><span class="fd-d">${formatDate(n.modified)}</span><span class="fd-s">${n.type === 'folder' ? '' : formatSize(FS.size(n.id))}</span></div>`).join('')
                    : '<div class="fd-empty">Nenhum item corresponde à sua pesquisa.</div>');
            const chain = FS.chain(cur);
            $('.ex-addr-ico', body).innerHTML = ico(nodeIcon(FS.get(cur)), 16);
            $('.ex-crumbs', body).innerHTML = chain.map(n => `<span class="crumb" data-id="${n.id}">${esc(n.name)}</span>`).join('<span class="crumb-chev">▸</span>');
            $('.fd-back', body).disabled = !back.length;
            $$('.fd-places .ex-fav', body).forEach(p => p.classList.toggle('active', p.dataset.id === cur));
        };
        const go = id => { if (id === cur || !FS.isFolder(id)) return; back.push(cur); cur = id; render(); };
        const finish = async () => {
            const raw = nameIn.value.trim();
            if (!raw) return;
            const sel = $('.fd-row.selected', list);
            if (mode === 'open') {
                if (sel && !raw) return;
                const byName = FS.children(cur).find(n => n.name.toLowerCase() === raw.toLowerCase())
                    || FS.children(cur).find(n => FS.displayName(n).toLowerCase() === raw.toLowerCase());
                const target = byName || (FS.resolve(raw, cur) ? FS.get(FS.resolve(raw, cur)) : null);
                if (!target) { errorBox(`${raw}\nArquivo não encontrado.\nVerifique o nome do arquivo e tente novamente.`, { parent: w, title }); return; }
                if (target.type === 'folder') { go(target.id); nameIn.value = ''; return; }
                result = target.id; w.close(); return;
            }
            // save
            let fname = raw;
            const exts = filters[filter].exts;
            if (exts && !extOf(fname)) fname += '.' + exts[0];
            const err = FS.validName(fname);
            if (err) { errorBox(err, { parent: w, title }); return; }
            const exist = FS.children(cur).find(n => n.name.toLowerCase() === fname.toLowerCase());
            if (exist?.type === 'folder') { go(exist.id); nameIn.value = ''; return; }
            if (exist) {
                const r = await messageBox({ title: 'Confirmar Salvar Como', icon: 'warning', instruction: `${fname} já existe.`, text: 'Deseja substituí-lo?', buttons: ['Sim', 'Não'], parent: w });
                if (r !== 'Sim') return;
                result = { folder: cur, name: fname, existing: exist.id };
            } else result = { folder: cur, name: fname };
            w.close();
        };

        list.addEventListener('click', e => {
            const r = e.target.closest('.fd-row');
            $$('.fd-row', list).forEach(x => x.classList.toggle('selected', x === r));
            if (r) { const n = FS.get(r.dataset.id); if (n?.type === 'file') nameIn.value = n.name; }
        });
        list.addEventListener('dblclick', e => {
            const r = e.target.closest('.fd-row');
            if (!r) return;
            const n = FS.get(r.dataset.id);
            if (n?.type === 'folder') go(n.id);
            else if (n) { nameIn.value = n.name; finish(); }
        });
        $('.fd-places', body).addEventListener('click', e => { const p = e.target.closest('.ex-fav'); if (p) go(p.dataset.id); });
        $('.ex-crumbs', body).addEventListener('click', e => { const c = e.target.closest('.crumb'); if (c) go(c.dataset.id); });
        $('.fd-back', body).addEventListener('click', () => { if (back.length) { cur = back.pop(); render(); } });
        $('.fd-up', body).addEventListener('click', () => { const p = FS.get(cur)?.parent; if (p && p !== 'recycle') go(p); });
        $('.fd-new', body).addEventListener('click', () => { try { FS.create(cur, 'Nova Pasta', 'folder'); render(); } catch (err) { errorBox(err.message, { parent: w }); } });
        $('.fd-type', body).addEventListener('change', e => { filter = +e.target.value; render(); });
        $('.fd-ok', body).addEventListener('click', finish);
        $('.fd-cancel', body).addEventListener('click', () => w.close());
        nameIn.addEventListener('keydown', e => { if (e.key === 'Enter') finish(); if (e.key === 'Escape') w.close(); });
        render();
        setTimeout(() => { nameIn.focus(); const dot = nameIn.value.lastIndexOf('.'); nameIn.setSelectionRange(0, dot > 0 ? dot : nameIn.value.length); }, 40);
    });
}

export const openFileDialog = opts => fileDialog({ mode: 'open', title: 'Abrir', ...opts });
export const saveFileDialog = opts => fileDialog({ mode: 'save', title: 'Salvar como', ...opts });

export const TEXT_FILTERS = [{ label: 'Documentos de Texto (*.txt)', exts: ['txt'] }, { label: 'Todos os Arquivos (*.*)', exts: null }];
export const IMAGE_FILTERS = [
    { label: 'Todos os Arquivos de Imagem', exts: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'] },
    { label: 'PNG (*.png)', exts: ['png'] }, { label: 'Todos os Arquivos (*.*)', exts: null },
];
