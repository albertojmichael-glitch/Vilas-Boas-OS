// Message boxes, input boxes, properties sheets and the UAC prompt.
import { WM } from '../wm.js';
import { esc, html, formatSize, formatDate } from '../core/util.js';
import { ico, iconForNode } from '../core/icons.js';
import { Sound } from '../core/sound.js';
import { FS } from '../core/fs.js';

const ICON_SOUND = { error: 'error', warning: 'warning', info: 'info', question: 'warning' };

/**
 * Vista message box. Resolves with the clicked button's label (or null when closed).
 */
export function messageBox({ title = 'Vilas Boas OS', instruction = '', text = '', icon = 'info', buttons = ['OK'], defaultIndex = 0, parent = null, sound = true } = {}) {
    return new Promise(resolve => {
        const body = html(`
            <div class="msgbox">
                <div class="msg-main">
                    ${icon ? `<div class="msg-ico">${ico(icon, 32)}</div>` : ''}
                    <div class="msg-text">
                        ${instruction ? `<div class="msg-instr">${esc(instruction)}</div>` : ''}
                        ${text ? `<div class="msg-body">${esc(text).replace(/\n/g, '<br>')}</div>` : ''}
                    </div>
                </div>
                <div class="msg-buttons">${buttons.map((b, i) => `<button class="btn${i === defaultIndex ? ' default' : ''}" data-i="${i}">${esc(b)}</button>`).join('')}</div>
            </div>`);
        let result = null;
        const w = WM.open({
            title, icon: icon || 'info', dialog: true, parent: parent || undefined, content: body,
            width: Math.min(460, Math.max(340, 120 + Math.max(instruction.length, Math.min(text.length, 70)) * 5.5)),
            height: 10, resizable: false,
        });
        // auto height
        requestAnimationFrame(() => {
            const need = body.scrollHeight + 38;
            w.h = need; w.y = Math.max(0, Math.round((window.innerHeight - 30 - need) / 2.4));
            if (parent) w.y = Math.max(0, Math.round(parent.y + Math.min(80, (parent.h - need) / 2)));
            w.apply();
        });
        w.onClose(() => resolve(result));
        body.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            result = buttons[+b.dataset.i];
            w.close();
        }));
        body.addEventListener('keydown', e => {
            if (e.key === 'Escape') { e.preventDefault(); result = buttons.includes('Cancelar') ? 'Cancelar' : (buttons.length === 1 ? buttons[0] : null); w.close(); }
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const bs = [...body.querySelectorAll('button')];
                const i = bs.indexOf(document.activeElement);
                bs[(i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length]?.focus();
            }
        });
        setTimeout(() => body.querySelectorAll('button')[defaultIndex]?.focus(), 30);
        if (sound && ICON_SOUND[icon]) Sound.play(ICON_SOUND[icon]);
    });
}

export const alertBox = (text, opts = {}) => messageBox({ text, icon: 'info', ...opts });
export const errorBox = (text, opts = {}) => messageBox({ text, icon: 'error', title: opts.title || 'Erro', ...opts });
export const confirmBox = (text, opts = {}) =>
    messageBox({ text, icon: 'warning', buttons: ['Sim', 'Não'], ...opts }).then(r => r === 'Sim');

/** Simple text input dialog. Resolves with the value or null. */
export function inputBox({ title = 'Entrada', label = '', value = '', parent = null, okLabel = 'OK' } = {}) {
    return new Promise(resolve => {
        const body = html(`
            <div class="msgbox">
                <div class="msg-main"><div class="msg-text" style="width:100%">
                    <label class="field-label">${esc(label)}</label>
                    <input class="textbox" style="width:100%" value="${esc(value)}">
                </div></div>
                <div class="msg-buttons"><button class="btn default" data-ok>${esc(okLabel)}</button><button class="btn" data-cancel>Cancelar</button></div>
            </div>`);
        let result = null;
        const w = WM.open({ title, dialog: true, parent: parent || undefined, content: body, width: 380, height: 165, resizable: false });
        w.onClose(() => resolve(result));
        const input = body.querySelector('input');
        const ok = () => { result = input.value; w.close(); };
        body.querySelector('[data-ok]').addEventListener('click', ok);
        body.querySelector('[data-cancel]').addEventListener('click', () => w.close());
        input.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') w.close(); });
        setTimeout(() => { input.focus(); input.select(); }, 30);
    });
}

/** Properties sheet for a file system node. */
export function properties(id, iconName) {
    const n = FS.get(id);
    if (!n) return;
    const isFolder = n.type === 'folder';
    const counts = isFolder ? FS.count(id) : null;
    const size = FS.size(id);
    const loc = n.parent ? FS.pathString(n.parent) : '';
    const body = html(`
        <div class="props">
            <div class="tabs"><div class="tab active">Geral</div>${isFolder ? '<div class="tab">Compartilhamento</div>' : ''}<div class="tab">Segurança</div></div>
            <div class="tab-page">
                <div class="props-row props-head">${ico(iconName || iconForNode(n, FS) || 'file', 32)}<input class="textbox" value="${esc(n.name)}" ${n.sys ? 'disabled' : ''}></div>
                <hr>
                <div class="props-grid">
                    <span>Tipo:</span><span>${esc(FS.typeName(n))}</span>
                    ${loc ? `<span>Local:</span><span class="ellipsis" title="${esc(loc)}">${esc(loc)}</span>` : ''}
                    <span>Tamanho:</span><span>${formatSize(size)} (${size.toLocaleString('pt-BR')} bytes)</span>
                    ${isFolder ? `<span>Contém:</span><span>${counts.files} arquivos, ${counts.folders} pastas</span>` : ''}
                </div>
                <hr>
                <div class="props-grid">
                    <span>Criado em:</span><span>${formatDate(n.created)}</span>
                    ${isFolder ? '' : `<span>Modificado em:</span><span>${formatDate(n.modified)}</span>`}
                </div>
                <hr>
                <div class="props-grid"><span>Atributos:</span><span><label class="check"><input type="checkbox" ${n.sys ? 'checked' : ''} disabled> Somente leitura</label> &nbsp; <label class="check"><input type="checkbox" disabled> Oculto</label></span></div>
            </div>
            <div class="dlg-buttons"><button class="btn default" data-ok>OK</button><button class="btn" data-cancel>Cancelar</button><button class="btn" data-apply disabled>Aplicar</button></div>
        </div>`);
    const w = WM.open({ title: `Propriedades de ${FS.displayName(n)}`, icon: iconName || 'file', showIcon: true, dialog: true, content: body, width: 370, height: 440, resizable: false });
    const input = body.querySelector('.props-head input');
    const applyBtn = body.querySelector('[data-apply]');
    input.addEventListener('input', () => { applyBtn.disabled = input.value === n.name; });
    const apply = () => {
        if (input.value !== n.name && !n.sys) {
            try { FS.rename(id, input.value); applyBtn.disabled = true; }
            catch (err) { errorBox(err.message, { parent: w, title: 'Renomear' }); return false; }
        }
        return true;
    };
    body.querySelector('[data-ok]').addEventListener('click', () => { if (apply()) w.close(); });
    body.querySelector('[data-cancel]').addEventListener('click', () => w.close());
    applyBtn.addEventListener('click', apply);
    body.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
        body.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
    }));
}

/** User Account Control prompt: dims the screen and asks for permission. */
export function uac({ program = 'Programa', publisher = 'Vilas Boas Corporation', what = 'Um programa precisa da sua permissão para continuar' } = {}) {
    return new Promise(resolve => {
        Sound.play('uac');
        const ov = html(`
            <div class="uac-overlay">
                <div class="uac-dialog" role="alertdialog">
                    <div class="uac-title">Controle de Conta de Usuário</div>
                    <div class="uac-head">${ico('shield', 32)}<div>${esc(what)}</div></div>
                    <div class="uac-body">
                        <p>Se você iniciou esta ação, continue.</p>
                        <div class="uac-prog">${ico('controlPanel', 32)}<div><b>${esc(program)}</b><br>${esc(publisher)}</div></div>
                        <div class="uac-details">⌄ Detalhes</div>
                    </div>
                    <div class="uac-foot"><button class="btn default" data-ok>Continuar</button><button class="btn" data-no>Cancelar</button></div>
                    <div class="uac-note">O Controle de Conta de Usuário ajuda a impedir alterações não autorizadas no computador.</div>
                </div>
            </div>`);
        document.body.appendChild(ov);
        requestAnimationFrame(() => ov.classList.add('show'));
        const done = v => {
            ov.classList.remove('show');
            setTimeout(() => ov.remove(), 250);
            document.removeEventListener('keydown', key, true);
            resolve(v);
        };
        const key = e => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
        document.addEventListener('keydown', key, true);
        ov.querySelector('[data-ok]').addEventListener('click', () => done(true));
        ov.querySelector('[data-no]').addEventListener('click', () => done(false));
        setTimeout(() => ov.querySelector('[data-no]').focus(), 50);
    });
}
