// Executar (Run dialog).
import { $, html, esc, store } from '../core/util.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { errorBox } from '../ui/dialogs.js';
import { openFileDialog } from '../ui/filedialog.js';
import { runCommand } from './registry.js';

const KEY = 'vbos.run.mru';

export function open() {
    const existing = WM.findApp('run');
    if (existing) { existing.focus(); return existing; }
    const mru = store.get(KEY, ['notepad', 'calc', 'cmd']);
    const body = html(`<div class="run">
        <div class="run-main">
            ${ico('run', 32)}
            <p>Digite o nome de um programa, pasta, documento ou recurso da Internet e o sistema o abrirá para você.</p>
        </div>
        <div class="run-row"><label>Abrir:</label>
            <input class="textbox run-in" list="run-mru" value="${esc(mru[0] || '')}" spellcheck="false">
            <datalist id="run-mru">${mru.map(m => `<option value="${esc(m)}">`).join('')}</datalist></div>
        <div class="msg-buttons"><button class="btn default" data-ok>OK</button><button class="btn" data-c>Cancelar</button><button class="btn" data-b>Procurar...</button></div>
    </div>`);
    const w = WM.open({ app: 'run', title: 'Executar', icon: 'run', showIcon: true, width: 400, height: 200, content: body, resizable: false, maximizable: false, minimizable: false, x: 8, y: window.innerHeight - 30 - 210 });
    const input = $('.run-in', body);
    const ok = () => {
        const v = input.value.trim();
        if (!v) return;
        if (runCommand(v)) {
            store.set(KEY, [v, ...mru.filter(x => x !== v)].slice(0, 10));
            w.close();
        } else errorBox(`O sistema não pode encontrar '${v}'. Verifique se o nome foi digitado corretamente e tente novamente.`, { parent: w, title: v });
    };
    $('[data-ok]', body).addEventListener('click', ok);
    $('[data-c]', body).addEventListener('click', () => w.close());
    $('[data-b]', body).addEventListener('click', async () => {
        const id = await openFileDialog({ parent: w, filters: [{ label: 'Todos os Arquivos (*.*)', exts: null }] });
        if (id) { const { FS } = await import('../core/fs.js'); input.value = FS.pathString(id); }
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') w.close(); });
    setTimeout(() => { input.focus(); input.select(); }, 50);
    return w;
}
