// Bloco de Notas (Notepad).
import { $, html, esc } from '../core/util.js';
import { FS } from '../core/fs.js';
import { Settings, now } from '../core/settings.js';
import { WM } from '../wm.js';
import { menuBar } from '../ui/menu.js';
import { messageBox, inputBox, errorBox } from '../ui/dialogs.js';
import { openFileDialog, saveFileDialog, TEXT_FILTERS } from '../ui/filedialog.js';
import { launch } from './registry.js';

export function open({ file = null } = {}) {
    // Re-use a window that already shows this file.
    if (file) {
        const existing = [...document.querySelectorAll('.win')].map(el => WM.fromElement(el)).find(w => w?.notepadFile === file);
        if (existing) { existing.focus(); return existing; }
    }
    let fileId = null;
    let dirty = false;
    let wrap = Settings.get('notepadWrap') ?? true;
    let font = Settings.get('notepadFont') || { family: 'Consolas, "Lucida Console", monospace', size: 14 };
    let statusOn = Settings.get('notepadStatus') ?? false;
    let lastFind = '';

    const body = html(`<div class="notepad"><textarea class="np-text" spellcheck="false" wrap="soft"></textarea><div class="statusbar np-status"><span class="np-pos"></span></div></div>`);
    const ta = $('.np-text', body);
    const status = $('.np-status', body);

    const name = () => (fileId && FS.get(fileId)) ? FS.displayName(FS.get(fileId)) : 'Sem título';
    const updateTitle = () => win.setTitle(`${name()} - Bloco de Notas`);
    const applyFormat = () => {
        ta.style.whiteSpace = wrap ? 'pre-wrap' : 'pre';
        ta.style.overflowX = wrap ? 'hidden' : 'auto';
        ta.style.fontFamily = font.family;
        ta.style.fontSize = font.size + 'px';
        status.hidden = !statusOn;
    };
    const updatePos = () => {
        const before = ta.value.slice(0, ta.selectionStart);
        const ln = before.split('\n').length;
        const col = before.length - before.lastIndexOf('\n');
        $('.np-pos', body).textContent = `Ln ${ln}, Col ${col}`;
    };

    const load = id => {
        const n = FS.get(id);
        if (!n) { errorBox('O arquivo não existe mais.', { parent: win }); return; }
        fileId = id;
        win.notepadFile = id;
        ta.value = String(n.content ?? '').replace(/\r\n/g, '\n');
        if (n.content?.startsWith?.('data:')) ta.value = n.content.slice(0, 2000) + (n.content.length > 2000 ? '…' : '');
        dirty = false;
        updateTitle();
        ta.setSelectionRange(0, 0);
        ta.scrollTop = 0;
    };

    const saveAs = async () => {
        const res = await saveFileDialog({ parent: win, folder: fileId ? FS.get(fileId)?.parent || 'documents' : 'documents', name: fileId ? FS.get(fileId)?.name : '*.txt', filters: TEXT_FILTERS });
        if (!res) return false;
        try {
            const content = ta.value.replace(/\n/g, '\r\n');
            if (res.existing) { FS.write(res.existing, content); fileId = res.existing; }
            else fileId = FS.create(res.folder, res.name, 'file', content).id;
            win.notepadFile = fileId;
            dirty = false;
            Settings.touchDoc(fileId);
            updateTitle();
            return true;
        } catch (err) { errorBox(err.message, { parent: win }); return false; }
    };
    const save = async () => {
        if (!fileId || !FS.get(fileId) || FS.get(fileId).parent === 'recycle') return saveAs();
        try { FS.write(fileId, ta.value.replace(/\n/g, '\r\n')); dirty = false; updateTitle(); return true; }
        catch (err) { errorBox(err.message, { parent: win }); return false; }
    };
    const confirmDiscard = async () => {
        if (!dirty) return true;
        const r = await messageBox({ title: 'Bloco de Notas', icon: null, instruction: `Deseja salvar as alterações em ${name()}?`, buttons: ['Salvar', 'Não Salvar', 'Cancelar'], parent: win, sound: false });
        if (r === 'Salvar') return save();
        return r === 'Não Salvar';
    };
    const newDoc = async () => { if (!(await confirmDiscard())) return; fileId = null; win.notepadFile = null; ta.value = ''; dirty = false; updateTitle(); };
    const openDoc = async () => {
        if (!(await confirmDiscard())) return;
        const id = await openFileDialog({ parent: win, folder: fileId ? FS.get(fileId)?.parent : 'documents', filters: TEXT_FILTERS });
        if (id) load(id);
    };
    const find = async (again = false) => {
        let q = lastFind;
        if (!again || !q) {
            q = await inputBox({ title: 'Localizar', label: 'Localizar:', value: lastFind, parent: win, okLabel: 'Localizar Próxima' });
            if (q == null || q === '') return;
            lastFind = q;
        }
        const hay = ta.value.toLowerCase();
        let i = hay.indexOf(q.toLowerCase(), ta.selectionEnd);
        if (i < 0) i = hay.indexOf(q.toLowerCase());
        if (i < 0) { messageBox({ title: 'Bloco de Notas', icon: 'info', text: `Não é possível localizar "${q}"`, parent: win }); return; }
        ta.focus(); ta.setSelectionRange(i, i + q.length);
    };
    const insertText = t => { ta.focus(); ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); };
    const timeDate = () => { const d = now(); insertText(`${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('pt-BR')}`); };
    const exec = cmd => { ta.focus(); document.execCommand(cmd); };
    const fontDialog = () => {
        const fams = [['Consolas', 'Consolas, monospace'], ['Lucida Console', '"Lucida Console", monospace'], ['Courier New', '"Courier New", monospace'], ['Segoe UI', '"Segoe UI", sans-serif'], ['Arial', 'Arial, sans-serif'], ['Georgia', 'Georgia, serif']];
        const b = html(`<div class="msgbox"><div class="msg-main" style="flex-direction:column;gap:10px">
            <label>Fonte:<br><select class="textbox fd-f" style="width:100%">${fams.map(([n, f]) => `<option value='${f}' ${font.family === f ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>Tamanho:<br><select class="textbox fd-s" style="width:100%">${[10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36].map(s => `<option ${font.size === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
            <div class="font-sample">AaBbYyZz</div></div>
            <div class="msg-buttons"><button class="btn default" data-ok>OK</button><button class="btn" data-c>Cancelar</button></div></div>`);
        const d = WM.open({ title: 'Fonte', dialog: true, parent: win, content: b, width: 300, height: 290, resizable: false });
        const sample = $('.font-sample', b);
        const upd = () => { sample.style.fontFamily = $('.fd-f', b).value; sample.style.fontSize = $('.fd-s', b).value + 'px'; };
        b.addEventListener('change', upd); upd();
        $('[data-ok]', b).addEventListener('click', () => { font = { family: $('.fd-f', b).value, size: +$('.fd-s', b).value }; Settings.set('notepadFont', font); applyFormat(); d.close(); });
        $('[data-c]', b).addEventListener('click', () => d.close());
    };

    const bar = menuBar([
        { label: 'Arquivo', items: () => [
            { label: 'Novo', key: 'Ctrl+N', action: newDoc },
            { label: 'Abrir...', key: 'Ctrl+O', action: openDoc },
            { label: 'Salvar', key: 'Ctrl+S', action: save },
            { label: 'Salvar como...', action: saveAs },
            '-',
            { label: 'Configurar Página...', disabled: true },
            { label: 'Imprimir...', key: 'Ctrl+P', disabled: true },
            '-',
            { label: 'Sair', action: () => win.requestClose() },
        ] },
        { label: 'Editar', items: () => [
            { label: 'Desfazer', key: 'Ctrl+Z', action: () => exec('undo') },
            '-',
            { label: 'Recortar', key: 'Ctrl+X', disabled: ta.selectionStart === ta.selectionEnd, action: () => exec('cut') },
            { label: 'Copiar', key: 'Ctrl+C', disabled: ta.selectionStart === ta.selectionEnd, action: () => exec('copy') },
            { label: 'Colar', key: 'Ctrl+V', action: async () => { try { insertText(await navigator.clipboard.readText()); } catch { exec('paste'); } } },
            { label: 'Excluir', key: 'Del', action: () => exec('delete') },
            '-',
            { label: 'Localizar...', key: 'Ctrl+F', action: () => find(false) },
            { label: 'Localizar Próxima', key: 'F3', action: () => find(true) },
            '-',
            { label: 'Selecionar Tudo', key: 'Ctrl+A', action: () => { ta.focus(); ta.select(); } },
            { label: 'Hora/Data', key: 'F5', action: timeDate },
        ] },
        { label: 'Formatar', items: () => [
            { label: 'Quebra Automática de Linha', checked: wrap, action: () => { wrap = !wrap; Settings.set('notepadWrap', wrap); applyFormat(); } },
            { label: 'Fonte...', action: fontDialog },
        ] },
        { label: 'Exibir', items: () => [
            { label: 'Barra de Status', checked: statusOn, action: () => { statusOn = !statusOn; Settings.set('notepadStatus', statusOn); applyFormat(); updatePos(); } },
        ] },
        { label: 'Ajuda', items: () => [
            { label: 'Exibir Ajuda', action: () => launch('help', { topic: 'notepad' }) },
            '-',
            { label: 'Sobre o Bloco de Notas', action: () => launch('winver', { app: 'Bloco de Notas', icon: 'notepad' }) },
        ] },
    ]);
    body.prepend(bar);

    const win = WM.open({
        app: 'notepad', title: 'Sem título - Bloco de Notas', icon: 'notepad', width: 640, height: 460, content: body, minW: 260, minH: 180,
        onBeforeClose: confirmDiscard,
    });
    win.notepadFile = null;

    ta.addEventListener('input', () => { if (!dirty) { dirty = true; } updatePos(); });
    ta.addEventListener('keyup', updatePos);
    ta.addEventListener('click', updatePos);
    ta.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (e.ctrlKey && k === 's') { e.preventDefault(); save(); }
        else if (e.ctrlKey && k === 'o') { e.preventDefault(); openDoc(); }
        else if (e.ctrlKey && k === 'n') { e.preventDefault(); newDoc(); }
        else if (e.ctrlKey && k === 'f') { e.preventDefault(); find(false); }
        else if (e.key === 'F3') { e.preventDefault(); find(true); }
        else if (e.key === 'F5') { e.preventDefault(); timeDate(); }
        else if (e.key === 'Tab') { e.preventDefault(); insertText('\t'); }
    });

    applyFormat();
    if (file) load(file);
    updatePos();
    setTimeout(() => ta.focus(), 50);
    return win;
}
