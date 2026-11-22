// Vilas Mail (Windows Mail style client, stored locally).
import { $, html, esc, store, uid, formatDate } from '../core/util.js';
import { Settings } from '../core/settings.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { confirmBox, messageBox } from '../ui/dialogs.js';

const KEY = 'vbos.mail.v1';
const FOLDERS = [['inbox', 'Caixa de Entrada'], ['outbox', 'Caixa de Saída'], ['sent', 'Itens Enviados'], ['deleted', 'Itens Excluídos'], ['drafts', 'Rascunhos']];

function seed() {
    const t = Date.now();
    return [
        { id: uid('m'), folder: 'inbox', from: 'Equipe Vilas Boas', to: 'você', subject: 'Bem-vindo ao Vilas Boas OS!', date: t - 3600e3, read: false,
            body: 'Olá!\n\nObrigado por usar o Vilas Boas OS. Aqui vão algumas ideias para começar:\n\n• Personalize a cor das janelas: clique com o botão direito na área de trabalho → Personalizar.\n• Experimente o Flip 3D no botão "Alternar entre janelas" da barra de tarefas.\n• Use a pesquisa do menu Iniciar para abrir qualquer programa.\n\nAtenciosamente,\nEquipe Vilas Boas' },
        { id: uid('m'), folder: 'inbox', from: 'Central de Segurança', to: 'você', subject: 'Seu computador está protegido', date: t - 86400e3, read: true,
            body: 'Todas as configurações de segurança estão ativadas: Firewall, Atualizações Automáticas e Controle de Conta de Usuário.\n\nNenhuma ação é necessária.' },
        { id: uid('m'), folder: 'inbox', from: 'Clube do Caça-Minas', to: 'você', subject: 'Desafio da semana: nível Avançado', date: t - 2 * 86400e3, read: true,
            body: 'Consegue terminar o nível Avançado em menos de 200 segundos?\n\nDica: clique em um número cujas minas já estejam marcadas para abrir os vizinhos de uma só vez.' },
    ];
}

export function open() {
    const existing = WM.findApp('mail');
    if (existing) { existing.focus(); return existing; }
    let msgs = store.get(KEY, null) || seed();
    let folder = 'inbox', sel = null;
    const save = () => store.set(KEY, msgs);
    save();

    const body = html(`<div class="mail">
        <div class="mail-bar">
            <button class="ml-btn" data-a="new">${ico('mail', 16)} Criar Email</button>
            <button class="ml-btn" data-a="reply">↩ Responder</button>
            <button class="ml-btn" data-a="forward">↪ Encaminhar</button>
            <button class="ml-btn" data-a="delete">✕ Excluir</button>
            <button class="ml-btn" data-a="sync">⟳ Enviar/Receber</button>
        </div>
        <div class="mail-main">
            <div class="mail-folders"><div class="ml-acct">${ico('mail', 16)} Vilas Mail</div><div class="ml-list"></div></div>
            <div class="mail-right"><div class="mail-msgs"></div><div class="mail-preview"></div></div>
        </div>
        <div class="statusbar"><span class="ml-status"></span><span>Trabalhando Online</span></div>
    </div>`);

    const render = () => {
        $('.ml-list', body).innerHTML = FOLDERS.map(([id, n]) => {
            const unread = msgs.filter(m => m.folder === id && !m.read).length;
            return `<div class="ex-fav${id === folder ? ' active' : ''}" data-f="${id}">${ico(id === 'deleted' ? 'trash' : 'folder', 16)}<span>${n}${unread ? ` <b>(${unread})</b>` : ''}</span></div>`;
        }).join('');
        const list = msgs.filter(m => m.folder === folder).sort((a, b) => b.date - a.date);
        $('.mail-msgs', body).innerHTML = `<div class="tm-head"><span style="width:32%">${folder === 'sent' || folder === 'drafts' ? 'Para' : 'De'}</span><span style="flex:1">Assunto</span><span style="width:120px">Recebido</span></div>` +
            (list.length ? list.map(m => `<div class="ml-row sel-item${m.id === sel ? ' selected' : ''}${m.read ? '' : ' unread'}" data-id="${m.id}"><span style="width:32%">${esc(folder === 'sent' || folder === 'drafts' ? m.to : m.from)}</span><span style="flex:1;min-width:0">${esc(m.subject)}</span><span style="width:120px">${formatDate(m.date)}</span></div>`).join('')
                : '<div class="ml-empty">Não há itens para mostrar neste modo de exibição.</div>');
        const m = msgs.find(x => x.id === sel);
        $('.mail-preview', body).innerHTML = m ? `<div class="ml-head"><b>De:</b> ${esc(m.from)} &nbsp; <b>Para:</b> ${esc(m.to)}<br><b>Assunto:</b> ${esc(m.subject)}</div><div class="ml-body">${esc(m.body)}</div>` : '';
        $('.ml-status', body).textContent = `${list.length} mensagem(ns), ${list.filter(x => !x.read).length} não lida(s)`;
        win?.setTitle(`${FOLDERS.find(f => f[0] === folder)[1]} - Vilas Mail`);
    };

    const compose = (pre = {}) => {
        const c = html(`<div class="compose">
            <div class="cm-bar"><button class="ml-btn" data-send>✉ Enviar</button></div>
            <div class="cm-fields"><label>Para:</label><input class="textbox cm-to" value="${esc(pre.to || '')}"><label>Assunto:</label><input class="textbox cm-sub" value="${esc(pre.subject || '')}"></div>
            <textarea class="cm-body" spellcheck="false">${esc(pre.body || '')}</textarea></div>`);
        const w = WM.open({ app: 'mail', title: pre.subject || 'Nova Mensagem', icon: 'mail', width: 560, height: 440, content: c, minW: 360, minH: 260 });
        $('.cm-sub', c).addEventListener('input', e => w.setTitle(e.target.value || 'Nova Mensagem'));
        $('[data-send]', c).addEventListener('click', () => {
            const to = $('.cm-to', c).value.trim();
            if (!to) { messageBox({ title: 'Vilas Mail', icon: 'warning', text: 'A mensagem deve ter pelo menos um destinatário.', parent: w }); return; }
            msgs.push({ id: uid('m'), folder: 'sent', from: Settings.get('userName'), to, subject: $('.cm-sub', c).value || '(sem assunto)', body: $('.cm-body', c).value, date: Date.now(), read: true });
            save(); render(); w.close();
        });
        setTimeout(() => (pre.to ? $('.cm-body', c) : $('.cm-to', c)).focus(), 50);
    };

    body.addEventListener('click', async e => {
        const f = e.target.closest('[data-f]');
        if (f) { folder = f.dataset.f; sel = null; render(); return; }
        const r = e.target.closest('.ml-row');
        if (r) { sel = r.dataset.id; const m = msgs.find(x => x.id === sel); if (m) m.read = true; save(); render(); return; }
        const a = e.target.closest('[data-a]')?.dataset.a;
        const m = msgs.find(x => x.id === sel);
        if (a === 'new') compose();
        else if (a === 'reply' && m) compose({ to: m.from, subject: 'RE: ' + m.subject, body: `\n\n----- Mensagem Original -----\nDe: ${m.from}\n\n${m.body}` });
        else if (a === 'forward' && m) compose({ subject: 'ENC: ' + m.subject, body: `\n\n----- Mensagem Encaminhada -----\nDe: ${m.from}\n\n${m.body}` });
        else if (a === 'delete' && m) {
            if (m.folder === 'deleted') { if (!(await confirmBox('Tem certeza de que deseja excluir permanentemente esta mensagem?', { parent: win, title: 'Vilas Mail' }))) return; msgs = msgs.filter(x => x !== m); }
            else m.folder = 'deleted';
            sel = null; save(); render();
        } else if (a === 'sync') { $('.ml-status', body).textContent = 'Verificando novas mensagens...'; setTimeout(render, 900); }
    });
    body.addEventListener('dblclick', e => { const r = e.target.closest('.ml-row'); const m = r && msgs.find(x => x.id === r.dataset.id); if (m) messageBox({ title: m.subject, icon: 'mail', instruction: m.subject, text: `De: ${m.from}\n\n${m.body}`, parent: win, sound: false }); });

    var win = WM.open({ app: 'mail', title: 'Vilas Mail', icon: 'mail', width: 860, height: 560, minW: 520, minH: 340, content: body });
    render();
    return win;
}
