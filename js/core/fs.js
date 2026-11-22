// Virtual file system persisted in localStorage.
import { bus, store, uid, extOf } from './util.js';
import { Settings } from './settings.js';

const KEY = 'vbos.fs.v1';
const INVALID = /[\\/:*?"<>|]/;
export const INVALID_NAME_MSG = 'Um nome de arquivo não pode conter nenhum dos seguintes caracteres:\n\\ / : * ? " < > |';

let nodes = {};

const SPECIAL = {
    root: 'Disco Local (C:)',
    users: 'Usuários',
    home: null, // user name
    desktop: 'Área de Trabalho',
    documents: 'Documentos',
    pictures: 'Imagens',
    music: 'Músicas',
    videos: 'Vídeos',
    downloads: 'Downloads',
    favorites: 'Favoritos',
    programs: 'Arquivos de Programas',
    windows: 'Windows',
    recycle: 'Lixeira',
};

function mk(id, name, parent, type = 'folder', content = '', sys = false) {
    const t = Date.now();
    nodes[id] = { id, name, parent, type, content, created: t, modified: t, sys };
    return nodes[id];
}

function seed() {
    nodes = {};
    const user = Settings.get('userName') || 'Usuário';
    mk('root', SPECIAL.root, null, 'folder', '', true);
    mk('programs', SPECIAL.programs, 'root', 'folder', '', true);
    mk('users', SPECIAL.users, 'root', 'folder', '', true);
    mk('windows', SPECIAL.windows, 'root', 'folder', '', true);
    mk('home', user, 'users', 'folder', '', true);
    mk('desktop', SPECIAL.desktop, 'home', 'folder', '', true);
    mk('documents', SPECIAL.documents, 'home', 'folder', '', true);
    mk('pictures', SPECIAL.pictures, 'home', 'folder', '', true);
    mk('music', SPECIAL.music, 'home', 'folder', '', true);
    mk('videos', SPECIAL.videos, 'home', 'folder', '', true);
    mk('downloads', SPECIAL.downloads, 'home', 'folder', '', true);
    mk('favorites', SPECIAL.favorites, 'home', 'folder', '', true);
    mk('recycle', SPECIAL.recycle, null, 'folder', '', true);

    ['Acessórios', 'Galeria de Fotos', 'Navegador', 'Jogos'].forEach(n => mk(uid('f'), n, 'programs'));
    ['System32', 'Fonts', 'Web'].forEach(n => mk(uid('f'), n, 'windows'));
    mk(uid('f'), 'win.ini', 'windows', 'file',
        '; for 16-bit app support\r\n[fonts]\r\n[extensions]\r\n[mci extensions]\r\n[files]\r\n[Mail]\r\nMAPI=1');

    mk(uid('f'), 'Bem-vindo.txt', 'desktop', 'file',
        'Bem-vindo ao Vilas Boas OS!\r\n\r\n' +
        'Esta é uma simulação completa de um sistema operacional no estilo Windows Vista,\r\n' +
        'feita inteiramente para o navegador.\r\n\r\n' +
        'Dicas rápidas:\r\n' +
        '  • Clique no botão Iniciar (canto inferior esquerdo) para abrir o menu.\r\n' +
        '  • Digite na caixa "Iniciar Pesquisa" para encontrar programas e arquivos.\r\n' +
        '  • Clique com o botão direito na área de trabalho para personalizar.\r\n' +
        '  • Use o botão "Alternar entre janelas" na barra de tarefas para o Flip 3D.\r\n' +
        '  • Seus arquivos ficam salvos neste navegador.\r\n\r\n' +
        'Divirta-se!');
    mk(uid('l'), 'Navegador', 'desktop', 'link', JSON.stringify({ app: 'browser' }));

    mk(uid('f'), 'Lista de tarefas.txt', 'documents', 'file',
        '[ ] Personalizar a área de trabalho\r\n[ ] Testar o Paint\r\n[ ] Bater o recorde no Caça-Minas\r\n[x] Instalar o Vilas Boas OS');
    const samples = mk(uid('f'), 'Amostras de Imagens', 'pictures');
    [['Aurora Verde.png', 'assets/wallpapers/wallpaper.png'],
     ['Aurora Azul.svg', 'assets/wallpapers/aurora_azul.svg'],
     ['Horizonte.svg', 'assets/wallpapers/horizonte.svg'],
     ['Crepúsculo.svg', 'assets/wallpapers/crepusculo_vista.svg'],
     ['Aurora Noturna.svg', 'assets/wallpapers/aurora_noturna.svg']]
        .forEach(([n, src]) => mk(uid('f'), n, samples.id, 'file', src));
    save(true);
}

let saveTimer = null;
function save(immediate = false) {
    clearTimeout(saveTimer);
    const run = () => {
        if (!store.set(KEY, nodes)) bus.emit('fs-error', 'Não há espaço suficiente em disco (armazenamento do navegador cheio).');
    };
    if (immediate) run(); else saveTimer = setTimeout(run, 150);
}
window.addEventListener('beforeunload', () => { clearTimeout(saveTimer); store.set(KEY, nodes); });

function changed(ids) {
    save();
    bus.emit('fs', ids);
}

export const FS = {
    init() {
        nodes = store.get(KEY, null);
        if (!nodes || !nodes.root || !nodes.recycle) seed();
    },
    reset() { seed(); bus.emit('fs', ['root']); },

    get: id => nodes[id] || null,
    exists: id => !!nodes[id],
    isFolder: id => nodes[id]?.type === 'folder',

    children(id) {
        return Object.values(nodes)
            .filter(n => n.parent === id)
            .sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1)
                || a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
    },

    /** Nodes from the root down to id. */
    chain(id) {
        const out = [];
        let n = nodes[id];
        while (n) { out.unshift(n); n = nodes[n.parent]; }
        return out;
    },

    pathString(id) {
        if (id === 'recycle') return 'Lixeira';
        const chain = this.chain(id);
        if (!chain.length) return '';
        if (chain[0].id === 'recycle') return 'Lixeira\\' + chain.slice(1).map(n => n.name).join('\\');
        return 'C:\\' + chain.slice(1).map(n => n.name).join('\\');
    },

    /** Resolve a textual path (absolute "C:\..." or relative to cwd) into an id. */
    resolve(path, cwd = 'root') {
        if (!path) return cwd;
        let p = path.trim().replace(/\//g, '\\').replace(/^"|"$/g, '');
        let cur = cwd;
        if (/^c:/i.test(p)) { cur = 'root'; p = p.slice(2); }
        if (p.startsWith('\\')) { cur = 'root'; }
        for (const part of p.split('\\').filter(Boolean)) {
            if (part === '.') continue;
            if (part === '..') { cur = nodes[cur]?.parent || cur; continue; }
            const kid = this.children(cur).find(n => n.name.toLowerCase() === part.toLowerCase()
                || (n.type === 'link' && n.name.toLowerCase() + '.lnk' === part.toLowerCase()));
            if (!kid) return null;
            cur = kid.id;
        }
        return cur;
    },

    validName(name) {
        const n = (name || '').trim();
        if (!n) return 'O nome não pode ficar vazio.';
        if (INVALID.test(n)) return INVALID_NAME_MSG;
        if (n === '.' || n === '..') return 'Nome inválido.';
        return null;
    },

    uniqueName(parent, desired, ignoreId = null) {
        const taken = new Set(this.children(parent).filter(n => n.id !== ignoreId).map(n => n.name.toLowerCase()));
        if (!taken.has(desired.toLowerCase())) return desired;
        const dot = desired.lastIndexOf('.');
        const hasExt = dot > 0;
        const base = hasExt ? desired.slice(0, dot) : desired;
        const ext = hasExt ? desired.slice(dot) : '';
        for (let i = 2; ; i++) {
            const cand = `${base} (${i})${ext}`;
            if (!taken.has(cand.toLowerCase())) return cand;
        }
    },

    create(parent, name, type = 'file', content = '') {
        if (!nodes[parent]) throw new Error('Pasta inexistente.');
        const err = this.validName(name);
        if (err) throw new Error(err);
        const node = mk(uid(type[0]), this.uniqueName(parent, name.trim()), parent, type, content);
        nodes[parent].modified = Date.now();
        changed([parent, node.id]);
        return node;
    },

    rename(id, name) {
        const n = nodes[id];
        if (!n) throw new Error('O item não existe mais.');
        if (n.sys && id !== 'home') throw new Error('Esta pasta do sistema não pode ser renomeada.');
        const err = this.validName(name);
        if (err) throw new Error(err);
        const clean = name.trim();
        const clash = this.children(n.parent).find(c => c.id !== id && c.name.toLowerCase() === clean.toLowerCase());
        if (clash) throw new Error(`Já existe um arquivo com o nome "${clean}" neste local.`);
        n.name = clean;
        n.modified = Date.now();
        changed([n.parent, id]);
    },

    write(id, content) {
        const n = nodes[id];
        if (!n) throw new Error('O arquivo não existe mais.');
        n.content = content;
        n.modified = Date.now();
        changed([n.parent, id]);
    },

    isDescendant(id, ancestor) {
        let n = nodes[id];
        while (n) { if (n.id === ancestor) return true; n = nodes[n.parent]; }
        return false;
    },

    move(id, target) {
        const n = nodes[id];
        if (!n || !nodes[target]) return false;
        if (n.sys) throw new Error(`"${n.name}" é um item do sistema e não pode ser movido.`);
        if (n.parent === target) return false;
        if (this.isDescendant(target, id)) throw new Error('A pasta de destino é uma subpasta da pasta de origem.');
        const from = n.parent;
        n.name = this.uniqueName(target, n.name, id);
        n.parent = target;
        delete n.origParent;
        changed([from, target, id]);
        return true;
    },

    copy(id, target) {
        const src = nodes[id];
        if (!src || !nodes[target]) return null;
        if (src.type === 'folder' && this.isDescendant(target, id)) throw new Error('A pasta de destino é uma subpasta da pasta de origem.');
        const dup = (node, parent, rename) => {
            let name = node.name;
            if (rename) {
                name = this.uniqueName(parent, node.name);
                if (name !== node.name && node.parent === parent) {
                    const dot = node.name.lastIndexOf('.');
                    const b = dot > 0 ? node.name.slice(0, dot) : node.name;
                    const e = dot > 0 ? node.name.slice(dot) : '';
                    name = this.uniqueName(parent, `${b} - Cópia${e}`);
                }
            }
            const copy = mk(uid(node.type[0]), name, parent, node.type, node.content);
            if (node.type === 'folder') this.children(node.id).forEach(k => dup(k, copy.id, false));
            return copy;
        };
        const res = dup(src, target, true);
        changed([target, res.id]);
        return res;
    },

    trash(id) {
        const n = nodes[id];
        if (!n) return;
        if (n.sys) throw new Error(`"${n.name}" é um item do sistema e não pode ser excluído.`);
        if (n.parent === 'recycle') return this.destroy(id);
        const from = n.parent;
        n.origParent = from;
        n.deletedAt = Date.now();
        n.parent = 'recycle';
        n.name = this.uniqueName('recycle', n.name, id);
        changed([from, 'recycle', id]);
    },

    restore(id) {
        const n = nodes[id];
        if (!n || n.parent !== 'recycle') return;
        const target = nodes[n.origParent] ? n.origParent : 'desktop';
        n.parent = target;
        n.name = this.uniqueName(target, n.name, id);
        delete n.origParent; delete n.deletedAt;
        changed(['recycle', target, id]);
    },

    destroy(id) {
        const n = nodes[id];
        if (!n || n.sys) return;
        const kill = x => { this.children(x).forEach(k => kill(k.id)); delete nodes[x]; };
        const parent = n.parent;
        kill(id);
        changed([parent, id]);
    },

    emptyTrash() {
        this.children('recycle').forEach(n => {
            const kill = x => { this.children(x).forEach(k => kill(k.id)); delete nodes[x]; };
            kill(n.id);
        });
        changed(['recycle']);
    },

    size(id) {
        const n = nodes[id];
        if (!n) return 0;
        if (n.type === 'folder') return this.children(id).reduce((s, k) => s + this.size(k.id), 0);
        const c = n.content || '';
        if (c.startsWith('data:')) return Math.round((c.length - c.indexOf(',')) * 0.75);
        if (this.isImage(n) && !c.startsWith('data:')) return 180000 + (c.length * 997) % 500000;
        return new Blob([c]).size;
    },

    count(id) {
        let files = 0, folders = 0;
        const walk = x => this.children(x).forEach(k => {
            if (k.type === 'folder') { folders++; walk(k.id); } else files++;
        });
        walk(id);
        return { files, folders };
    },

    search(rootId, query) {
        const q = query.toLowerCase();
        const out = [];
        const walk = x => this.children(x).forEach(k => {
            if (k.name.toLowerCase().includes(q)) out.push(k);
            if (k.type === 'folder') walk(k.id);
        });
        walk(rootId);
        return out;
    },

    usedBytes() {
        try { return new Blob([localStorage.getItem(KEY) || '']).size; } catch { return 0; }
    },

    isImage: n => ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].includes(extOf(n.name)),
    isText: n => ['txt', 'log', 'ini', 'md', 'json', 'js', 'css', 'html', 'htm', 'csv', 'xml', 'bat'].includes(extOf(n.name)),

    typeName(n) {
        if (!n) return '';
        if (n.id === 'root') return 'Disco Local';
        if (n.type === 'folder') return 'Pasta de arquivos';
        if (n.type === 'link') return 'Atalho';
        const e = extOf(n.name);
        const map = {
            txt: 'Documento de Texto', log: 'Documento de Texto', ini: 'Parâmetros de configuração',
            png: 'Imagem PNG', jpg: 'Imagem JPEG', jpeg: 'Imagem JPEG', gif: 'Imagem GIF', bmp: 'Imagem de bitmap',
            svg: 'Imagem SVG', webp: 'Imagem WEBP', html: 'Documento HTML', htm: 'Documento HTML',
            md: 'Arquivo MD', json: 'Arquivo JSON', csv: 'Arquivo CSV', bat: 'Arquivo em Lotes do Windows',
        };
        return map[e] || (e ? `Arquivo ${e.toUpperCase()}` : 'Arquivo');
    },

    /** Name as shown to the user (respects "hide extensions"). */
    displayName(n) {
        if (!n) return '';
        if (n.type === 'link') return n.name;
        if (n.type === 'file' && !Settings.get('showExtensions')) {
            const dot = n.name.lastIndexOf('.');
            if (dot > 0) return n.name.slice(0, dot);
        }
        return n.name;
    },

    linkData(n) {
        try { return JSON.parse(n.content || '{}'); } catch { return {}; }
    }
};
