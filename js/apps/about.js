// "Sobre" dialog (winver).
import { $, html, esc } from '../core/util.js';
import { Settings } from '../core/settings.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';

export function open({ app = 'Vilas Boas OS', icon = 'computer' } = {}) {
    const body = html(`<div class="about">
        <div class="about-banner"><span class="brand-orb"></span><span class="ab-name">Vilas Boas</span><span class="ab-os">OS</span><span class="ab-ed">Vista</span><span class="ab-ultimate">Ultimate</span></div>
        <div class="about-body">
            <div class="about-app">${ico(icon, 32)}<b>${esc(app)}</b></div>
            <p>Vilas Boas OS<br>Versão 6.0 (Compilação 6002: Service Pack 2)<br>Copyright © 2006 Vilas Boas Corporation. Todos os direitos reservados.</p>
            <p>O sistema operacional Vilas Boas OS Vista Ultimate e sua interface de usuário são uma simulação feita para o navegador.</p>
            <p>Este produto está licenciado para:<br><b>${esc(Settings.get('userName'))}</b></p>
        </div>
        <div class="msg-buttons"><button class="btn default">OK</button></div>
    </div>`);
    const w = WM.open({ title: `Sobre o ${app}`, icon, dialog: true, content: body, width: 440, height: 400, resizable: false });
    $('button', body).addEventListener('click', () => w.close());
    setTimeout(() => $('button', body).focus(), 40);
    return w;
}
