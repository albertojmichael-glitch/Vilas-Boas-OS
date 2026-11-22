// Boot, logon, lock, log off, sleep, restart and shut down flows.
import { $, esc, sleep } from '../core/util.js';
import { Settings } from '../core/settings.js';
import { Sound } from '../core/sound.js';
import { avatarSrc, ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { showMenu, closeMenus } from '../ui/menu.js';

let screen;     // #session element (boot / logon / transitions)
let onDesktopReady = null;
let state = 'off'; // off | boot | logon | desktop | locked | busy
let bootSkip = null;

const BRAND = `<div class="brand"><span class="brand-orb"></span><span class="brand-name">Vilas Boas</span><span class="brand-os">OS</span><span class="brand-ed">Vista</span></div>`;

function show(htmlStr, cls) {
    screen.className = 'session ' + cls;
    screen.innerHTML = htmlStr;
    screen.hidden = false;
    document.body.classList.add('session-visible');
}

function hide() {
    screen.classList.add('fade-out');
    document.body.classList.remove('session-visible');
    setTimeout(() => { if (state === 'desktop') { screen.hidden = true; screen.innerHTML = ''; } }, 600);
}

export const Session = {
    init({ onReady }) {
        screen = $('#session');
        onDesktopReady = onReady;
        document.addEventListener('keydown', e => {
            if (state === 'boot' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) bootSkip?.();
        });
    },

    get state() { return state; },

    async boot() {
        state = 'boot';
        document.body.classList.remove('desktop-on');
        show(`
            <div class="boot-wrap">
                <div class="boot-logo"><span class="boot-orb"></span></div>
                <div class="boot-bar"><div class="boot-glow"></div></div>
            </div>
            <div class="boot-copy">© Vilas Boas Corporation</div>
            <div class="boot-skip">Pressione Enter para pular</div>`, 'boot');
        await new Promise(r => {
            const t = setTimeout(r, 4200);
            bootSkip = () => { clearTimeout(t); r(); };
            screen.addEventListener('click', bootSkip, { once: true });
        });
        bootSkip = null;
        show('', 'black');
        await sleep(400);
        this.logonScreen();
    },

    logonScreen({ locked = false } = {}) {
        state = locked ? 'locked' : 'logon';
        const name = Settings.get('userName');
        const hasPw = !!Settings.get('password');
        show(`
            <div class="logon-bg"></div>
            <div class="logon-center">
                <div class="logon-tile ${hasPw ? 'has-pw' : ''}" tabindex="0" role="button" aria-label="${esc(name)}">
                    <div class="tile-frame"><img src="${avatarSrc(Settings.get('avatar'))}" alt=""></div>
                    <div class="tile-name">${esc(name)}</div>
                    ${locked ? '<div class="tile-sub">Bloqueado</div>' : ''}
                    ${hasPw ? `<div class="pw-row">
                        <input type="password" class="pw-input" placeholder="Senha" aria-label="Senha" autocomplete="off">
                        <button class="pw-go" aria-label="Entrar" data-tip="Entrar"><i></i></button>
                    </div>
                    <div class="pw-hint" hidden></div>` : ''}
                </div>
            </div>
            <div class="logon-bottom">
                <button class="ease-btn" data-tip="Facilidade de Acesso">${ico('accessibility', 26)}</button>
                ${BRAND}
                <div class="power-group">
                    <button class="logon-power" data-tip="Desligar"><i></i></button>
                    <button class="logon-power-arrow" data-tip="Opções de desligamento">▸</button>
                </div>
            </div>`, 'logon' + (locked ? ' locked' : ''));

        const tile = $('.logon-tile', screen);
        const input = $('.pw-input', screen);
        const tryLogon = () => {
            if (hasPw) {
                if (input.value === Settings.get('password')) this.welcome(locked);
                else this.wrongPassword(locked);
            } else this.welcome(locked);
        };
        if (hasPw) {
            input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogon(); });
            $('.pw-go', screen).addEventListener('click', tryLogon);
            setTimeout(() => input.focus(), 100);
        } else {
            tile.addEventListener('click', tryLogon);
            tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') tryLogon(); });
            setTimeout(() => tile.focus(), 100);
        }
        $('.logon-power', screen).addEventListener('click', () => this.shutdown(false));
        $('.logon-power-arrow', screen).addEventListener('click', e => {
            e.stopPropagation();
            const r = e.currentTarget.getBoundingClientRect();
            showMenu(r.left, r.top, [
                { label: 'Reiniciar', action: () => this.shutdown(true) },
                { label: 'Suspender', action: () => this.sleepMode() },
                { label: 'Desligar', action: () => this.shutdown(false) },
            ], { above: true });
        });
        $('.ease-btn', screen).addEventListener('click', e => {
            const r = e.currentTarget.getBoundingClientRect();
            showMenu(r.left, r.top, [
                { label: 'Reduzir animações', checked: Settings.get('reduceMotion'), action: () => { Settings.set('reduceMotion', !Settings.get('reduceMotion')); } },
                { label: 'Sem sons', checked: Settings.get('muted'), action: () => Settings.set('muted', !Settings.get('muted')) },
            ], { above: true });
        });
    },

    wrongPassword(locked) {
        Sound.play('error');
        const tile = $('.logon-tile', screen);
        tile.innerHTML = `
            <div class="tile-frame"><img src="${avatarSrc(Settings.get('avatar'))}" alt=""></div>
            <div class="tile-name">${esc(Settings.get('userName'))}</div>
            <div class="logon-error">O nome de usuário ou a senha está incorreto.</div>
            <button class="btn logon-ok">OK</button>`;
        const ok = $('.logon-ok', tile);
        ok.focus();
        ok.addEventListener('click', () => {
            this.logonScreen({ locked });
            const hint = Settings.get('passwordHint');
            const h = $('.pw-hint', screen);
            if (hint && h) { h.hidden = false; h.textContent = `Dica de senha: ${hint}`; }
        });
    },

    async welcome(fromLock) {
        state = 'busy';
        Sound.unlock();
        show(`<div class="logon-bg"></div><div class="logon-center"><div class="busy"><span class="spinner"></span><span>Bem-vindo</span></div></div><div class="logon-bottom">${BRAND}</div>`, 'logon');
        if (fromLock) {
            await sleep(700);
            state = 'desktop';
            hide();
            return;
        }
        Sound.play('startup');
        await sleep(1700);
        state = 'desktop';
        document.body.classList.add('desktop-on');
        hide();
        onDesktopReady?.();
    },

    lock() {
        closeMenus();
        this.logonScreen({ locked: true });
    },

    async logoff() {
        closeMenus();
        state = 'busy';
        show(`<div class="logon-bg"></div><div class="logon-center"><div class="busy"><span class="spinner"></span><span>Fazendo logoff...</span></div></div><div class="logon-bottom">${BRAND}</div>`, 'logon');
        Sound.play('logoff');
        WM.closeAll();
        await sleep(1800);
        document.body.classList.remove('desktop-on');
        this.logonScreen();
    },

    async shutdown(restart) {
        closeMenus();
        state = 'busy';
        const wasDesktop = document.body.classList.contains('desktop-on');
        show(`<div class="logon-bg"></div><div class="logon-center"><div class="busy"><span class="spinner"></span><span>${restart ? 'Reiniciando...' : 'Desligando...'}</span></div></div><div class="logon-bottom">${BRAND}</div>`, 'logon');
        if (wasDesktop) Sound.play('shutdown');
        WM.closeAll();
        await sleep(2400);
        document.body.classList.remove('desktop-on');
        show('', 'black');
        await sleep(900);
        if (restart) return this.boot();
        state = 'off';
        show(`<button class="power-on" aria-label="Ligar"><i></i></button><div class="power-on-text">Clique para ligar o computador</div>`, 'black off');
        $('.power-on', screen).addEventListener('click', () => this.boot());
    },

    async sleepMode() {
        closeMenus();
        state = 'busy';
        show('', 'black sleeping');
        await sleep(800);
        show(`<div class="power-on-text">Em suspensão — clique ou pressione uma tecla para continuar</div>`, 'black off');
        const wake = () => {
            screen.removeEventListener('click', wake);
            document.removeEventListener('keydown', wake);
            if (document.body.classList.contains('desktop-on')) this.logonScreen({ locked: true });
            else this.logonScreen();
        };
        setTimeout(() => {
            screen.addEventListener('click', wake);
            document.addEventListener('keydown', wake);
        }, 300);
    },
};
