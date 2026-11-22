// Central de Boas-Vindas (Welcome Center).
import { $, html, esc } from '../core/util.js';
import { Settings } from '../core/settings.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { launch } from './registry.js';

const TILES = [
    ['personalize', 'Personalizar o Vilas Boas OS', 'Escolha o plano de fundo, as cores das janelas e a proteção de tela.', () => launch('control', { page: 'personalize' })],
    ['users', 'Contas de Usuário', 'Altere sua imagem, seu nome ou crie uma senha para proteger sua conta.', () => launch('control', { page: 'users' })],
    ['folder', 'Explorar seus arquivos', 'Organize documentos e imagens com o Windows Explorer.', () => launch('explorer', { path: 'documents' })],
    ['browser', 'Navegar na Internet', 'Abra o Navegador Vilas Boas e visite seus sites favoritos.', () => launch('browser')],
    ['paint', 'Desenhar no Paint', 'Crie desenhos e salve-os na pasta Imagens.', () => launch('paint')],
    ['mines', 'Jogar Caça-Minas', 'Um clássico de lógica: encontre todas as minas.', () => launch('mines')],
    ['help', 'Ajuda e Suporte', 'Aprenda atalhos e recursos do Vilas Boas OS.', () => launch('help')],
    ['flip', 'Flip 3D', 'Alterne entre janelas abertas em uma pilha 3D.', () => import('../shell/flip3d.js').then(m => m.Flip3D.open())],
];

export function open() {
    const existing = WM.findApp('welcome');
    if (existing) { existing.focus(); return existing; }
    const cores = navigator.hardwareConcurrency || 2;
    const body = html(`<div class="welcome">
        <div class="wc-head">
            <div class="wc-pc">${ico('computer', 64)}</div>
            <div class="wc-info">
                <div class="wc-title">Vilas Boas OS Vista Ultimate</div>
                <div class="wc-sub">${cores} núcleos • ${navigator.deviceMemory ? navigator.deviceMemory + ' GB' : '4 GB'} de memória • Computador: ${esc(Settings.get('computerName'))}</div>
                <a class="link" data-details>Mostrar mais detalhes</a>
            </div>
        </div>
        <div class="wc-section">Introdução ao Vilas Boas OS</div>
        <div class="wc-tiles">${TILES.map(([i, t, d], n) => `<div class="wc-tile sel-item" data-n="${n}" tabindex="0">${ico(i, 32)}<div><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('')}</div>
        <div class="wc-foot"><label class="check"><input type="checkbox" class="wc-startup" ${Settings.get('welcomeOnStartup') ? 'checked' : ''}> Executar na inicialização (Central de Boas-Vindas)</label></div>
    </div>`);
    const win = WM.open({ app: 'welcome', title: 'Central de Boas-Vindas', icon: 'welcome', width: 700, height: 500, content: body, minW: 480, minH: 360 });
    body.addEventListener('click', e => {
        const t = e.target.closest('.wc-tile');
        if (t) TILES[+t.dataset.n][3]();
        if (e.target.closest('[data-details]')) launch('control', { page: 'system' });
    });
    body.addEventListener('keydown', e => { if (e.key === 'Enter') { const t = e.target.closest('.wc-tile'); if (t) TILES[+t.dataset.n][3](); } });
    $('.wc-startup', body).addEventListener('change', e => Settings.set('welcomeOnStartup', e.target.checked));
    return win;
}
