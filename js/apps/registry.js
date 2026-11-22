// Program registry, launcher and file associations.
import { FS } from '../core/fs.js';
import { Settings } from '../core/settings.js';
import { iconForNode } from '../core/icons.js';
import { errorBox, messageBox } from '../ui/dialogs.js';
import { WM } from '../wm.js';

const lazy = (path, fn = 'open') => args => import(path).then(m => m[fn](args));

export const APPS = {
    explorer: { name: 'Windows Explorer', short: 'Explorer', icon: 'folder', open: lazy('./explorer.js'), cmd: ['explorer'] },
    computer: { name: 'Computador', icon: 'computer', open: () => APPS.explorer.open({ path: 'computer' }), hidden: true },
    documents: { name: 'Documentos', icon: 'folder:documents', open: () => APPS.explorer.open({ path: 'documents' }), hidden: true },
    recycle: { name: 'Lixeira', icon: 'trash', open: () => APPS.explorer.open({ path: 'recycle' }), hidden: true },
    network: { name: 'Rede', icon: 'network', open: () => APPS.explorer.open({ path: 'network' }), hidden: true },
    gamesFolder: { name: 'Jogos', icon: 'games', open: () => APPS.explorer.open({ path: 'games' }), hidden: true },
    browser: { name: 'Navegador Vilas Boas', short: 'Navegador', icon: 'browser', open: lazy('./browser.js'), cmd: ['iexplore', 'browser', 'navegador'], desc: 'Navegue na Internet' },
    mail: { name: 'Vilas Mail', icon: 'mail', open: lazy('./mail.js'), cmd: ['mail', 'winmail'], desc: 'Leia seus e-mails' },
    notepad: { name: 'Bloco de Notas', icon: 'notepad', open: lazy('./notepad.js'), cmd: ['notepad'], cat: 'acc' },
    calculator: { name: 'Calculadora', icon: 'calculator', open: lazy('./calculator.js'), cmd: ['calc'], cat: 'acc' },
    paint: { name: 'Paint', icon: 'paint', open: lazy('./paint.js'), cmd: ['mspaint', 'paint'], cat: 'acc' },
    cmd: { name: 'Prompt de Comando', icon: 'cmd', open: lazy('./cmd.js'), cmd: ['cmd'], cat: 'acc' },
    run: { name: 'Executar', icon: 'run', open: lazy('./run.js'), cat: 'acc' },
    photos: { name: 'Galeria de Fotos', icon: 'photos', open: lazy('./photos.js'), cmd: ['photos', 'galeria'] },
    mines: { name: 'Caça-Minas', icon: 'mines', open: lazy('./mines.js'), cmd: ['mines', 'minas'], cat: 'games' },
    taskmgr: { name: 'Gerenciador de Tarefas', icon: 'taskmgr', open: lazy('./taskmgr.js'), cmd: ['taskmgr'], cat: 'sys' },
    control: { name: 'Painel de Controle', icon: 'controlPanel', open: lazy('./control.js'), cmd: ['control'] },
    help: { name: 'Ajuda e Suporte', icon: 'help', open: lazy('./help.js'), cmd: ['help', 'ajuda'] },
    welcome: { name: 'Central de Boas-Vindas', icon: 'welcome', open: lazy('./welcome.js'), cmd: ['welcome'], cat: 'acc' },
    winver: { name: 'Sobre o Vilas Boas OS', icon: 'computer', open: lazy('./about.js'), cmd: ['winver'], hidden: true },
};

/** Launch a program by id. */
export async function launch(id, args = {}) {
    const app = APPS[id];
    if (!app) { errorBox(`O sistema não pode encontrar '${id}'. Verifique se o nome foi digitado corretamente e tente novamente.`); return null; }
    if (!app.hidden && id !== 'explorer') Settings.touchProgram(id);
    try {
        return await app.open(args);
    } catch (err) {
        console.error(err);
        errorBox(`${app.name} parou de funcionar.\n\n${err.message}`, { title: app.name });
        return null;
    }
}

/** Icon for a node, resolving shortcuts to their target's icon. */
export function nodeIcon(n) {
    if (n.type === 'link') {
        const d = FS.linkData(n);
        if (d.app) return APPS[d.app]?.icon || 'file';
        if (d.target) { const t = FS.get(d.target); return t ? (iconForNode(t, FS) || 'file') : 'file'; }
        return 'file';
    }
    return iconForNode(n, FS);
}

/** Open a file system node with its associated program. */
export function openNode(id, { explorerWin = null } = {}) {
    const n = FS.get(id);
    if (!n) { errorBox('O item que você está tentando abrir não existe mais. Ele pode ter sido movido ou excluído.'); return; }
    if (n.type === 'folder') {
        if (explorerWin?.navigate) return explorerWin.navigate(id);
        return launch('explorer', { path: id });
    }
    if (n.type === 'link') {
        const d = FS.linkData(n);
        if (d.app) return launch(d.app, d.args || {});
        if (d.target) return openNode(d.target);
        return;
    }
    Settings.touchDoc(id);
    if (FS.isImage(n)) return launch('photos', { file: id });
    if (FS.isText(n)) return launch('notepad', { file: id });
    return messageBox({
        title: 'Windows', icon: 'question',
        instruction: 'O sistema não pode abrir este arquivo:',
        text: `Arquivo: ${n.name}\n\nPara abri-lo, o sistema precisa saber qual programa o criou. Deseja abri-lo com o Bloco de Notas?`,
        buttons: ['Abrir com o Bloco de Notas', 'Cancelar'],
    }).then(r => { if (r === 'Abrir com o Bloco de Notas') launch('notepad', { file: id }); });
}

/** Resolve a command typed in Run / cmd / start menu search. */
export function runCommand(text, cwd = 'home') {
    const raw = (text || '').trim();
    if (!raw) return false;
    const lower = raw.toLowerCase().replace(/\.exe$/, '');
    if (/^(https?:\/\/|www\.)/i.test(raw)) { launch('browser', { url: raw }); return true; }
    const entry = Object.entries(APPS).find(([id, a]) => id === lower || a.cmd?.includes(lower));
    if (entry) { launch(entry[0]); return true; }
    const id = FS.resolve(raw, cwd);
    if (id) { openNode(id); return true; }
    return false;
}

export const isAppOpen = id => !!WM.findApp(id);
