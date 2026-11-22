// Prompt de Comando.
import { $, html, formatDate } from '../core/util.js';
import { FS } from '../core/fs.js';
import { Settings, now } from '../core/settings.js';
import { WM } from '../wm.js';
import { APPS, launch, openNode, runCommand } from './registry.js';

const COLORS = ['#000000', '#000080', '#008000', '#008080', '#800000', '#800080', '#808000', '#c0c0c0', '#808080', '#0000ff', '#00ff00', '#00ffff', '#ff0000', '#ff00ff', '#ffff00', '#ffffff'];

const HELP = `Para obter mais informações sobre um comando específico, digite HELP nome_do_comando
CD             Exibe o nome da pasta atual ou altera a pasta atual.
CLS            Limpa a tela.
COLOR          Define as cores padrão do primeiro e do segundo plano do console.
COPY           Copia um arquivo para outro local.
DATE           Exibe a data.
DEL            Exclui um ou mais arquivos.
DIR            Exibe uma lista de arquivos e subpastas em uma pasta.
ECHO           Exibe mensagens.
EXIT           Sai do programa CMD.EXE (interpretador de comandos).
HELP           Fornece informações de Ajuda sobre comandos.
HOSTNAME       Exibe o nome do computador.
IPCONFIG       Exibe a configuração de rede.
MD             Cria uma pasta.
MOVE           Move um arquivo para outra pasta.
PING           Testa a conexão com outro computador.
RD             Remove uma pasta.
REN            Renomeia um arquivo.
START          Inicia um programa ou abre um arquivo.
TASKLIST       Exibe todas as tarefas em execução.
TASKKILL       Encerra uma tarefa em execução.
TIME           Exibe a hora.
TITLE          Define o título da janela.
TREE           Exibe graficamente a estrutura de pastas.
TYPE           Exibe o conteúdo de um arquivo de texto.
VER            Exibe a versão do sistema.
WHOAMI         Exibe o usuário atual.`;

export function open() {
    let cwd = 'home';
    const history = [];
    let hIdx = 0;
    let busy = false;

    const body = html(`<div class="cmd" tabindex="-1"><pre class="cmd-out"></pre><div class="cmd-line"><span class="cmd-prompt"></span><input class="cmd-in" spellcheck="false" autocomplete="off"></div></div>`);
    const out = $('.cmd-out', body);
    const input = $('.cmd-in', body);
    const promptEl = $('.cmd-prompt', body);

    const path = () => FS.pathString(cwd);
    const prompt = () => `${path()}>`;
    const print = (t = '') => { out.textContent += t + '\n'; body.scrollTop = body.scrollHeight; };
    const updatePrompt = () => { promptEl.textContent = prompt(); };
    const resolve = p => FS.resolve(p, cwd);

    const dir = arg => {
        const id = arg ? resolve(arg) : cwd;
        if (!id || !FS.isFolder(id)) return print('Arquivo não encontrado');
        print(` O volume na unidade C não tem nome.\n O Número de Série do Volume é 1A2B-3C4D\n\n Pasta de ${FS.pathString(id)}\n`);
        let files = 0, folders = 0, bytes = 0;
        if (id !== 'root') { print(`${formatDate(FS.get(id).modified).padEnd(20)}    <DIR>          .`); print(`${formatDate(FS.get(id).modified).padEnd(20)}    <DIR>          ..`); }
        FS.children(id).forEach(n => {
            const d = formatDate(n.modified).padEnd(20);
            if (n.type === 'folder') { folders++; print(`${d}    <DIR>          ${n.name}`); }
            else { files++; const s = FS.size(n.id); bytes += s; print(`${d}    ${s.toLocaleString('pt-BR').padStart(14)} ${n.name}${n.type === 'link' ? '.lnk' : ''}`); }
        });
        const free = Math.max(0, 5 * 1024 * 1024 - FS.usedBytes());
        print(`${String(files).padStart(15)} arquivo(s) ${bytes.toLocaleString('pt-BR').padStart(14)} bytes`);
        print(`${String(folders).padStart(15)} pasta(s)   ${free.toLocaleString('pt-BR').padStart(14)} bytes disponíveis`);
    };
    const tree = (id, prefix = '') => {
        const kids = FS.children(id).filter(n => n.type === 'folder');
        kids.forEach((k, i) => {
            const last = i === kids.length - 1;
            print(`${prefix}${last ? '└───' : '├───'}${k.name}`);
            tree(k.id, prefix + (last ? '    ' : '│   '));
        });
    };

    const exec = async line => {
        const raw = line.trim();
        if (!raw) return;
        const m = raw.match(/^(\S+)\s*(.*)$/);
        let cmd = m[1].toLowerCase();
        let arg = m[2].trim().replace(/^"(.*)"$/, '$1');
        if (/^cd[\\.]/.test(cmd)) { arg = cmd.slice(2) + (arg ? ' ' + arg : ''); cmd = 'cd'; }
        switch (cmd) {
            case 'help': return print(HELP);
            case 'cls': out.textContent = ''; return;
            case 'ver': return print('\nVilas Boas OS [versão 6.0.6002]\n');
            case 'echo': return print(arg || 'ECHO está ativado.');
            case 'date': return print(`A data atual é: ${now().toLocaleDateString('pt-BR')}`);
            case 'time': return print(`A hora atual é: ${now().toLocaleTimeString('pt-BR')}`);
            case 'whoami': return print(`${Settings.get('computerName').toLowerCase()}\\${Settings.get('userName').toLowerCase()}`);
            case 'hostname': return print(Settings.get('computerName'));
            case 'title': win.setTitle(arg || 'Prompt de Comando'); return;
            case 'exit': win.close(); return;
            case 'dir': return dir(arg);
            case 'tree': print(`Listagem de caminhos de pasta\n${path()}`); tree(cwd); return;
            case 'cd': case 'chdir': {
                if (!arg) return print(path());
                const id = resolve(arg);
                if (!id || !FS.isFolder(id)) return print('O sistema não pode encontrar o caminho especificado.');
                cwd = id; updatePrompt(); return;
            }
            case 'md': case 'mkdir': {
                if (!arg) return print('A sintaxe do comando está incorreta.');
                if (FS.resolve(arg, cwd)) return print(`Já existe uma subpasta ou um arquivo ${arg}.`);
                try { FS.create(cwd, arg, 'folder'); } catch (e) { print(e.message); } return;
            }
            case 'rd': case 'rmdir': {
                const id = resolve(arg);
                if (!id || !FS.isFolder(id)) return print('O sistema não pode encontrar o arquivo especificado.');
                if (FS.children(id).length) return print('A pasta não está vazia.');
                if (FS.get(id).sys) return print('Acesso negado.');
                FS.destroy(id); return;
            }
            case 'del': case 'erase': {
                const id = resolve(arg);
                if (!id || FS.isFolder(id)) return print(`Não foi possível encontrar ${FS.pathString(cwd)}\\${arg}`);
                FS.destroy(id); return;
            }
            case 'type': {
                const id = resolve(arg);
                if (!id || FS.isFolder(id)) return print('O sistema não pode encontrar o arquivo especificado.');
                const c = FS.get(id).content || '';
                return print(c.startsWith('data:') ? '(arquivo binário)' : c.replace(/\r\n/g, '\n'));
            }
            case 'ren': case 'rename': {
                const [a, b] = arg.split(/\s+(?=[^\s]+$)/);
                const id = resolve(a);
                if (!id || !b) return print('A sintaxe do comando está incorreta.');
                try { FS.rename(id, b); } catch (e) { print(e.message); } return;
            }
            case 'copy': case 'move': {
                const parts = arg.match(/("[^"]+"|\S+)/g) || [];
                if (parts.length < 2) return print('A sintaxe do comando está incorreta.');
                const src = resolve(parts[0].replace(/"/g, '')), dst = resolve(parts[1].replace(/"/g, ''));
                if (!src) return print('O sistema não pode encontrar o arquivo especificado.');
                if (!dst || !FS.isFolder(dst)) return print('O sistema não pode encontrar o caminho especificado.');
                try { cmd === 'copy' ? FS.copy(src, dst) : FS.move(src, dst); print(`        1 arquivo(s) ${cmd === 'copy' ? 'copiado(s)' : 'movido(s)'}.`); } catch (e) { print(e.message); }
                return;
            }
            case 'color': {
                const v = (arg || '07').toLowerCase();
                const bgc = parseInt(v.length > 1 ? v[0] : '0', 16), fgc = parseInt(v.length > 1 ? v[1] : v[0], 16);
                if (isNaN(bgc) || isNaN(fgc) || bgc === fgc) return;
                body.style.background = COLORS[bgc]; body.style.color = COLORS[fgc]; input.style.color = COLORS[fgc]; return;
            }
            case 'ipconfig':
                return print(`\nConfiguração de IP do Vilas Boas OS\n\nAdaptador Ethernet Conexão Local:\n\n   Sufixo DNS específico de conexão. . . . . . : home\n   Endereço IPv4. . . . . . . .  . . . . . . . : 192.168.0.${10 + (Settings.get('userName').length % 200)}\n   Máscara de Sub-rede . . . . . . . . . . . . : 255.255.255.0\n   Gateway Padrão. . . . . . . . . . . . . . . : 192.168.0.1\n   Status. . . . . . . . . . . . . . . . . . . : ${navigator.onLine ? 'Conectado' : 'Mídia desconectada'}\n`);
            case 'ping': {
                const host = arg || 'localhost';
                print(`\nDisparando ${host} com 32 bytes de dados:`);
                busy = true;
                for (let i = 0; i < 4; i++) {
                    await new Promise(r => setTimeout(r, 600));
                    print(navigator.onLine || host === 'localhost' ? `Resposta de ${host}: bytes=32 tempo=${host === 'localhost' ? '<1' : 12 + Math.round(Math.random() * 30)}ms TTL=${host === 'localhost' ? 128 : 54}` : 'Esgotado o tempo limite do pedido.');
                }
                print(`\nEstatísticas do Ping para ${host}:\n    Pacotes: Enviados = 4, Recebidos = 4, Perdidos = 0 (0% de perda)`);
                busy = false;
                return;
            }
            case 'tasklist': {
                print('\nNome da imagem               PID  Nome da sessão  Uso de memória\n========================= ======== ================ ============');
                [['System', 4], ['explorer.exe', 1720], ['sidebar.exe', 2140], ['dwm.exe', 1460]].forEach(([n, p]) => print(`${n.padEnd(25)} ${String(p).padStart(8)} Console          ${(12000 + p * 7).toLocaleString('pt-BR').padStart(9)} K`));
                WM.taskWindows().forEach((w, i) => print(`${((w.appId || 'app') + '.exe').padEnd(25)} ${String(3000 + i * 4).padStart(8)} Console          ${(9000 + i * 1234).toLocaleString('pt-BR').padStart(9)} K`));
                return;
            }
            case 'taskkill': {
                const m2 = arg.match(/\/im\s+(\S+)/i);
                if (!m2) return print('ERRO: Sintaxe inválida. Use TASKKILL /IM nome.exe');
                const name = m2[1].toLowerCase().replace(/\.exe$/, '');
                const victims = WM.taskWindows().filter(w => w.appId === name && w !== win);
                if (!victims.length) return print(`ERRO: o processo "${m2[1]}" não foi encontrado.`);
                victims.forEach(w => w.close());
                return print(`ÊXITO: o processo "${m2[1]}" foi finalizado.`);
            }
            case 'start':
                if (!arg) { launch('cmd'); return; }
                if (!runCommand(arg, cwd)) print(`O sistema não pode encontrar o arquivo ${arg}.`);
                return;
        }
        // Programs and files by name
        const app = Object.entries(APPS).find(([id, a]) => id === cmd.replace(/\.exe$/, '') || a.cmd?.includes(cmd.replace(/\.exe$/, '')));
        if (app) { launch(app[0]); return; }
        const id = resolve(raw);
        if (id && !FS.isFolder(id)) { openNode(id); return; }
        print(`'${m[1]}' não é reconhecido como um comando interno\nou externo, um programa operável ou um arquivo em lotes.`);
    };

    input.addEventListener('keydown', async e => {
        if (busy) { if (e.ctrlKey && e.key.toLowerCase() === 'c') { busy = false; print('^C'); } e.preventDefault(); return; }
        if (e.key === 'Enter') {
            const line = input.value;
            input.value = '';
            print(prompt() + line);
            if (line.trim()) { history.push(line); hIdx = history.length; }
            input.disabled = true;
            await exec(line);
            input.disabled = false;
            if (!win.closed) { print(''); updatePrompt(); input.focus(); body.scrollTop = body.scrollHeight; }
        } else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) input.value = history[--hIdx]; }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (hIdx < history.length - 1) input.value = history[++hIdx]; else { hIdx = history.length; input.value = ''; } }
        else if (e.key === 'Tab') {
            e.preventDefault();
            const m = input.value.match(/^(.*?)(\S*)$/);
            const part = m[2].toLowerCase();
            const hit = FS.children(cwd).find(n => n.name.toLowerCase().startsWith(part));
            if (hit) input.value = m[1] + (hit.name.includes(' ') ? `"${hit.name}"` : hit.name);
        } else if (e.key === 'Escape') input.value = '';
    });
    body.addEventListener('pointerup', () => { if (!window.getSelection().toString()) input.focus(); });

    const win = WM.open({ app: 'cmd', title: 'Prompt de Comando', icon: 'cmd', width: 680, height: 400, content: body, minW: 300, minH: 160, cls: 'cmd-win' });
    print(`Vilas Boas OS [versão 6.0.6002]\nCopyright (c) 2006 Vilas Boas Corporation. Todos os direitos reservados.\n`);
    updatePrompt();
    setTimeout(() => input.focus(), 50);
    return win;
}
