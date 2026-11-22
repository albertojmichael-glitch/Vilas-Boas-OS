// Caça-Minas (mines game).
import { $, html, store } from '../core/util.js';
import { Sound } from '../core/sound.js';
import { WM } from '../wm.js';
import { menuBar } from '../ui/menu.js';
import { messageBox } from '../ui/dialogs.js';
import { launch } from './registry.js';

const LEVELS = {
    beginner: { name: 'Iniciante', w: 9, h: 9, m: 10 },
    intermediate: { name: 'Intermediário', w: 16, h: 16, m: 40 },
    advanced: { name: 'Avançado', w: 30, h: 16, m: 99 },
};
const CELL = 22;
const STATS = 'vbos.mines.stats';

export function open() {
    const existing = WM.findApp('mines');
    if (existing) { existing.focus(); return existing; }
    let level = store.get('vbos.mines.level', 'beginner');
    let grid, state, flags, revealed, timer, seconds, firstClick;

    const body = html(`<div class="mines">
        <div class="mn-board-wrap"><div class="mn-board"></div></div>
        <div class="mn-foot">
            <div class="mn-stat"><span class="mn-clock"></span><span class="mn-time">0</span></div>
            <div class="mn-stat"><span class="mn-mine-ico"></span><span class="mn-left">10</span></div>
        </div>
    </div>`);
    const board = $('.mn-board', body);

    const stats = () => store.get(STATS, {});
    const newGame = () => {
        const L = LEVELS[level];
        clearInterval(timer);
        grid = Array.from({ length: L.h }, () => Array.from({ length: L.w }, () => ({ mine: false, n: 0, open: false, flag: 0 })));
        state = 'ready'; flags = 0; revealed = 0; seconds = 0; firstClick = true;
        board.style.gridTemplateColumns = `repeat(${L.w}, ${CELL}px)`;
        board.innerHTML = '';
        for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
            const c = document.createElement('div');
            c.className = 'mn-cell';
            c.dataset.x = x; c.dataset.y = y;
            board.appendChild(c);
        }
        $('.mn-time', body).textContent = '0';
        $('.mn-left', body).textContent = L.m;
        board.classList.remove('lost', 'won');
        if (win) fit();
    };
    const fit = () => {
        const L = LEVELS[level];
        win.w = L.w * CELL + 2 * 18 + 18;
        win.h = L.h * CELL + 30 + 20 + 52 + 40;
        win.x = Math.max(0, Math.min(win.x, window.innerWidth - win.w));
        win.y = Math.max(0, Math.min(win.y, window.innerHeight - 30 - win.h));
        win.apply();
    };
    const cellEl = (x, y) => board.children[y * LEVELS[level].w + x];
    const around = (x, y, fn) => {
        const L = LEVELS[level];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < L.w && ny < L.h) fn(nx, ny, grid[ny][nx]);
        }
    };
    const placeMines = (sx, sy) => {
        const L = LEVELS[level];
        let placed = 0;
        while (placed < L.m) {
            const x = Math.floor(Math.random() * L.w), y = Math.floor(Math.random() * L.h);
            if (grid[y][x].mine || (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1)) continue;
            grid[y][x].mine = true; placed++;
        }
        for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { let n = 0; around(x, y, (a, b, c) => { if (c.mine) n++; }); grid[y][x].n = n; }
    };
    const draw = (x, y) => {
        const c = grid[y][x], el = cellEl(x, y);
        el.className = 'mn-cell' + (c.open ? ' open' : '') + (c.flag === 1 ? ' flag' : c.flag === 2 ? ' q' : '') + (c.open && c.mine ? ' mine' : '');
        el.textContent = c.open && !c.mine && c.n ? c.n : '';
        if (c.open && c.n) el.dataset.n = c.n; else delete el.dataset.n;
    };
    const reveal = (x, y) => {
        const c = grid[y][x];
        if (c.open || c.flag === 1) return;
        c.open = true; revealed++;
        draw(x, y);
        if (c.mine) return lose(x, y);
        if (c.n === 0) around(x, y, (nx, ny) => reveal(nx, ny));
    };
    const checkWin = () => {
        const L = LEVELS[level];
        if (state === 'play' && revealed === L.w * L.h - L.m) win_();
    };
    const lose = (x, y) => {
        state = 'lost'; clearInterval(timer);
        Sound.play('minesBoom');
        cellEl(x, y).classList.add('boom');
        const L = LEVELS[level];
        for (let yy = 0; yy < L.h; yy++) for (let xx = 0; xx < L.w; xx++) {
            const c = grid[yy][xx];
            if (c.mine && c.flag !== 1) { c.open = true; draw(xx, yy); }
            else if (!c.mine && c.flag === 1) cellEl(xx, yy).classList.add('wrong');
        }
        cellEl(x, y).classList.add('boom');
        board.classList.add('lost');
        const s = stats(); const k = s[level] || { played: 0, won: 0, best: null }; k.played++; s[level] = k; store.set(STATS, s);
        setTimeout(() => endDialog(false), 700);
    };
    const win_ = () => {
        state = 'won'; clearInterval(timer);
        Sound.play('minesWin');
        const L = LEVELS[level];
        for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (grid[y][x].mine) { grid[y][x].flag = 1; draw(x, y); }
        $('.mn-left', body).textContent = '0';
        board.classList.add('won');
        const s = stats(); const k = s[level] || { played: 0, won: 0, best: null };
        k.played++; k.won++; const record = k.best == null || seconds < k.best; if (record) k.best = seconds;
        s[level] = k; store.set(STATS, s);
        setTimeout(() => endDialog(true, record), 500);
    };
    const endDialog = async (won, record) => {
        const s = stats()[level] || { played: 0, won: 0, best: null };
        const text = `Tempo: ${seconds} segundos\nMelhor tempo: ${s.best ?? '-'} segundos\nJogos disputados: ${s.played}\nJogos vencidos: ${s.won}\nPorcentagem: ${s.played ? Math.round(s.won / s.played * 100) : 0}%`;
        const r = await messageBox({
            title: won ? 'Jogo Ganho' : 'Jogo Perdido', icon: won ? 'welcome' : 'error', sound: false, parent: win,
            instruction: won ? (record ? 'Parabéns, você ganhou o jogo e bateu seu recorde!' : 'Parabéns, você ganhou o jogo!') : 'Desculpe, você perdeu este jogo. Mais sorte na próxima vez!',
            text, buttons: ['Novo Jogo', 'Sair'],
        });
        if (r === 'Sair') win.close(); else if (!win.closed) newGame();
    };
    const start = (x, y) => {
        if (firstClick) {
            placeMines(x, y); firstClick = false; state = 'play';
            timer = setInterval(() => { if (seconds < 999) seconds++; $('.mn-time', body).textContent = seconds; }, 1000);
        }
    };

    board.addEventListener('contextmenu', e => e.preventDefault());
    board.addEventListener('pointerdown', e => {
        const el = e.target.closest('.mn-cell');
        if (!el || state === 'lost' || state === 'won') return;
        const x = +el.dataset.x, y = +el.dataset.y, c = grid[y][x];
        if (e.button === 2) {
            if (c.open) return;
            c.flag = (c.flag + 1) % 3;
            flags += c.flag === 1 ? 1 : c.flag === 2 ? -1 : 0;
            $('.mn-left', body).textContent = LEVELS[level].m - flags;
            draw(x, y);
            return;
        }
        if (e.button !== 0 && e.button !== 1) return;
        el.classList.add('down');
        const up = () => {
            el.classList.remove('down');
            window.removeEventListener('pointerup', up);
            if (state === 'lost' || state === 'won') return;
            if (c.open && c.n) {
                // chord: if flags match number, open neighbours
                let f = 0; around(x, y, (a, b, k) => { if (k.flag === 1) f++; });
                if (f === c.n) around(x, y, (nx, ny) => reveal(nx, ny));
            } else if (!c.open && c.flag !== 1) { start(x, y); reveal(x, y); }
            checkWin();
        };
        window.addEventListener('pointerup', up);
    });

    const setLevel = l => { level = l; store.set('vbos.mines.level', l); newGame(); };
    const showStats = () => {
        const s = stats();
        messageBox({ title: 'Estatísticas', icon: 'mines', parent: win, sound: false, instruction: 'Estatísticas do Caça-Minas',
            text: Object.entries(LEVELS).map(([k, L]) => { const v = s[k] || { played: 0, won: 0, best: null }; return `${L.name}: ${v.won}/${v.played} vitórias, melhor tempo ${v.best ?? '-'} s`; }).join('\n') });
    };
    const bar = menuBar([
        { label: 'Jogo', items: () => [
            { label: 'Novo Jogo', key: 'F2', action: newGame },
            '-',
            ...Object.entries(LEVELS).map(([k, L]) => ({ label: L.name, radio: level === k, action: () => setLevel(k) })),
            '-',
            { label: 'Estatísticas', key: 'F4', action: showStats },
            '-',
            { label: 'Sair', action: () => win.close() },
        ] },
        { label: 'Ajuda', items: [{ label: 'Como Jogar', action: () => launch('help', { topic: 'mines' }) }, '-', { label: 'Sobre o Caça-Minas', action: () => launch('winver', { app: 'Caça-Minas', icon: 'mines' }) }] },
    ]);
    const wrap = html('<div class="mines-wrap"></div>');
    wrap.append(bar, body);
    var win = WM.open({ app: 'mines', title: 'Caça-Minas', icon: 'mines', width: 260, height: 330, content: wrap, resizable: false, maximizable: false, cls: 'mines-win' });
    win.el.addEventListener('keydown', e => { if (e.key === 'F2') { e.preventDefault(); newGame(); } if (e.key === 'F4') { e.preventDefault(); showStats(); } });
    win.el.tabIndex = -1;
    win.onClose(() => clearInterval(timer));
    newGame();
    return win;
}
