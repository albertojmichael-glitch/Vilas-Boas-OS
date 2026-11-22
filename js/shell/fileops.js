// File operations shared by the desktop and Windows Explorer.
import { FS } from '../core/fs.js';
import { Settings } from '../core/settings.js';
import { Sound } from '../core/sound.js';
import { bus, esc, extOf } from '../core/util.js';
import { messageBox, errorBox } from '../ui/dialogs.js';

export const Clipboard = {
    ids: [],
    mode: null, // 'copy' | 'cut'
    set(ids, mode) { this.ids = ids.filter(id => FS.get(id) && !FS.get(id).sys); this.mode = mode; bus.emit('clipboard'); },
    has() { return this.ids.some(id => FS.get(id)); },
    paste(target) {
        if (!this.has() || !FS.isFolder(target)) return [];
        const out = [];
        for (const id of this.ids) {
            try {
                if (this.mode === 'cut') { FS.move(id, target); out.push(id); }
                else out.push(FS.copy(id, target).id);
            } catch (err) { errorBox(err.message, { title: 'Erro ao copiar' }); break; }
        }
        if (this.mode === 'cut') { this.ids = []; this.mode = null; bus.emit('clipboard'); }
        return out;
    }
};

export async function deleteItems(ids, parent = null) {
    const nodes = ids.map(id => FS.get(id)).filter(Boolean);
    if (!nodes.length) return false;
    const sys = nodes.find(n => n.sys);
    if (sys) { errorBox(`Não é possível excluir "${FS.displayName(sys)}": é um item protegido do sistema.`, { parent, title: 'Excluir Arquivo' }); return false; }
    const permanent = nodes.every(n => n.parent === 'recycle');
    const one = nodes.length === 1;
    const n0 = nodes[0];
    const what = one ? (n0.type === 'folder' ? 'esta pasta' : n0.type === 'link' ? 'este atalho' : 'este arquivo') : `estes ${nodes.length} itens`;
    const res = await messageBox({
        title: one ? (n0.type === 'folder' ? 'Excluir Pasta' : 'Excluir Arquivo') : 'Excluir Vários Itens',
        icon: permanent ? 'warning' : 'question',
        instruction: permanent ? `Tem certeza de que deseja excluir permanentemente ${what}?` : `Tem certeza de que deseja mover ${what} para a Lixeira?`,
        text: one ? `${FS.displayName(n0)}\nTipo: ${FS.typeName(n0)}` : '',
        buttons: ['Sim', 'Não'], parent, sound: false,
    });
    if (res !== 'Sim') return false;
    try {
        nodes.forEach(n => permanent ? FS.destroy(n.id) : FS.trash(n.id));
        Sound.play('recycle');
    } catch (err) { errorBox(err.message, { parent }); }
    return true;
}

export async function emptyRecycle(parent = null) {
    const n = FS.children('recycle').length;
    if (!n) return;
    const r = await messageBox({
        title: 'Excluir Vários Itens', icon: 'warning', sound: false, parent,
        instruction: n === 1 ? 'Tem certeza de que deseja excluir este item permanentemente?' : `Tem certeza de que deseja excluir permanentemente estes ${n} itens?`,
        buttons: ['Sim', 'Não'],
    });
    if (r === 'Sim') { FS.emptyTrash(); Sound.play('recycle'); }
}

export function restoreItems(ids) { ids.forEach(id => FS.restore(id)); }

/** Create an item and return its id (caller usually starts an inline rename). */
export function createNew(parent, kind) {
    try {
        if (kind === 'folder') return FS.create(parent, 'Nova Pasta', 'folder').id;
        if (kind === 'text') return FS.create(parent, 'Novo Documento de Texto.txt', 'file', '').id;
        if (kind === 'bitmap') return FS.create(parent, 'Nova Imagem de Bitmap.png', 'file', blankPng()).id;
    } catch (err) { errorBox(err.message); }
    return null;
}

function blankPng() {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    return c.toDataURL('image/png');
}

/**
 * Inline rename on a label element. Handles hidden extensions.
 * Resolves true when renamed.
 */
export function inlineRename(labelEl, id, { onEnd } = {}) {
    const n = FS.get(id);
    if (!n) return;
    if (n.sys && id !== 'home') { errorBox(`"${FS.displayName(n)}" é um item do sistema e não pode ser renomeado.`); return; }
    const hideExt = n.type === 'file' && !Settings.get('showExtensions') && extOf(n.name);
    const ext = hideExt ? '.' + n.name.split('.').pop() : '';
    const shown = FS.displayName(n);
    const ta = document.createElement('textarea');
    ta.className = 'rename-box';
    ta.value = shown;
    ta.spellcheck = false;
    labelEl.style.visibility = 'hidden';
    labelEl.parentElement.appendChild(ta);
    const sel = n.type === 'file' && !hideExt && shown.lastIndexOf('.') > 0 ? shown.lastIndexOf('.') : shown.length;
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(0, sel); });
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    fit();
    ta.addEventListener('input', fit);
    let done = false;
    const finish = async commit => {
        if (done) return;
        done = true;
        const val = ta.value.replace(/\n/g, '').trim();
        ta.remove();
        labelEl.style.visibility = '';
        if (commit && val && val !== shown) {
            try { FS.rename(id, val + ext); }
            catch (err) {
                await errorBox(err.message, { title: 'Renomear' });
            }
        }
        onEnd?.();
    };
    ta.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    ta.addEventListener('blur', () => finish(true));
    ta.addEventListener('pointerdown', e => e.stopPropagation());
    ta.addEventListener('dblclick', e => e.stopPropagation());
}

export const escName = n => esc(FS.displayName(n));
