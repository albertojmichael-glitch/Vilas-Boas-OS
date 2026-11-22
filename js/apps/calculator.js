// Calculadora (standard mode).
import { $, $$, html } from '../core/util.js';
import { WM } from '../wm.js';
import { menuBar } from '../ui/menu.js';
import { launch } from './registry.js';

const fmt = n => {
    if (!isFinite(n)) return 'Erro';
    let s = Math.abs(n) >= 1e16 || (Math.abs(n) < 1e-12 && n !== 0) ? n.toExponential(10) : String(parseFloat(n.toPrecision(16)));
    s = s.replace('e+', 'e+').replace('.', ',');
    return s;
};
const parse = s => parseFloat(s.replace(',', '.'));

export function open() {
    const existing = WM.findApp('calculator');
    if (existing) { existing.focus(); return existing; }

    let display = '0', acc = null, op = null, fresh = true, mem = 0, lastOp = null, lastVal = null, error = false;

    const body = html(`<div class="calc">
        <div class="calc-display"><input class="calc-out" readonly value="0" aria-label="Resultado"></div>
        <div class="calc-row top"><span class="calc-mem"></span><button data-k="bs" class="red wide">Backspace</button><button data-k="ce" class="red wide">CE</button><button data-k="c" class="red wide">C</button></div>
        <div class="calc-grid">
            <button data-k="mc" class="red">MC</button><button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button data-k="/" class="red">/</button><button data-k="sqrt">sqrt</button>
            <button data-k="mr" class="red">MR</button><button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button data-k="*" class="red">*</button><button data-k="%">%</button>
            <button data-k="ms" class="red">MS</button><button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button data-k="-" class="red">-</button><button data-k="inv">1/x</button>
            <button data-k="m+" class="red">M+</button><button data-k="0">0</button><button data-k="neg">+/-</button><button data-k=",">,</button><button data-k="+" class="red">+</button><button data-k="=" class="red">=</button>
        </div></div>`);
    const out = $('.calc-out', body);
    const memEl = $('.calc-mem', body);

    const show = () => { out.value = display; memEl.textContent = mem !== 0 ? 'M' : ''; };
    const fail = msg => { display = msg; error = true; acc = null; op = null; fresh = true; show(); };
    const value = () => parse(display);
    const compute = (a, o, b) => {
        switch (o) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b === 0 ? null : a / b;
        }
        return b;
    };

    const press = k => {
        if (error && !['c', 'ce'].includes(k) && !/^[0-9]$/.test(k)) return;
        if (error) { error = false; display = '0'; fresh = true; }
        if (/^[0-9]$/.test(k)) {
            if (fresh || display === '0') { display = k; fresh = false; }
            else if (display.replace(/[-,]/g, '').length < 32) display += k;
        } else if (k === ',') {
            if (fresh) { display = '0,'; fresh = false; }
            else if (!display.includes(',')) display += ',';
        } else if (['+', '-', '*', '/'].includes(k)) {
            if (op && !fresh) {
                const r = compute(acc, op, value());
                if (r === null) return fail('Não é possível dividir por zero.');
                display = fmt(r);
            }
            acc = value(); op = k; fresh = true; lastOp = null;
        } else if (k === '=') {
            let a, o, b;
            if (op) { a = acc; o = op; b = fresh && lastVal != null && lastOp === op ? lastVal : value(); lastOp = op; lastVal = b; }
            else if (lastOp) { a = value(); o = lastOp; b = lastVal; }
            else { fresh = true; show(); return; }
            const r = compute(a, o, b);
            if (r === null) return fail('Não é possível dividir por zero.');
            display = fmt(r); acc = null; op = null; fresh = true;
        } else if (k === 'sqrt') {
            const v = value();
            if (v < 0) return fail('Entrada inválida para função.');
            display = fmt(Math.sqrt(v)); fresh = true;
        } else if (k === '%') {
            display = fmt(acc != null ? acc * value() / 100 : 0); fresh = true;
        } else if (k === 'inv') {
            const v = value();
            if (v === 0) return fail('Não é possível dividir por zero.');
            display = fmt(1 / v); fresh = true;
        } else if (k === 'neg') {
            if (display !== '0') display = display.startsWith('-') ? display.slice(1) : '-' + display;
        } else if (k === 'bs') {
            if (!fresh) { display = display.slice(0, -1); if (display === '' || display === '-') display = '0'; }
        } else if (k === 'ce') { display = '0'; fresh = true; }
        else if (k === 'c') { display = '0'; acc = null; op = null; fresh = true; lastOp = null; lastVal = null; }
        else if (k === 'mc') mem = 0;
        else if (k === 'mr') { display = fmt(mem); fresh = true; }
        else if (k === 'ms') { mem = value(); fresh = true; }
        else if (k === 'm+') { mem += value(); fresh = true; }
        show();
    };

    body.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { press(b.dataset.k); body.focus(); }));
    body.tabIndex = 0;
    body.addEventListener('keydown', e => {
        const map = { Enter: '=', '=': '=', Escape: 'c', Delete: 'ce', Backspace: 'bs', '.': ',', ',': ',', F9: 'neg', r: 'inv', '@': 'sqrt', '%': '%' };
        let k = /^[0-9+\-*/]$/.test(e.key) ? e.key : map[e.key];
        if (e.ctrlKey && e.key.toLowerCase() === 'c') { navigator.clipboard?.writeText(display).catch(() => {}); return; }
        if (e.ctrlKey && e.key.toLowerCase() === 'v') {
            navigator.clipboard?.readText().then(t => { const n = parse(t.trim()); if (!isNaN(n)) { display = fmt(n); fresh = true; show(); } }).catch(() => {});
            return;
        }
        if (!k) return;
        e.preventDefault();
        const btn = body.querySelector(`button[data-k="${CSS.escape(k)}"]`);
        btn?.classList.add('pressed'); setTimeout(() => btn?.classList.remove('pressed'), 100);
        press(k);
    });

    const bar = menuBar([
        { label: 'Editar', items: [
            { label: 'Copiar', key: 'Ctrl+C', action: () => navigator.clipboard?.writeText(display).catch(() => {}) },
            { label: 'Colar', key: 'Ctrl+V', action: () => navigator.clipboard?.readText().then(t => { const n = parse(t.trim()); if (!isNaN(n)) { display = fmt(n); fresh = true; show(); } }).catch(() => {}) },
        ] },
        { label: 'Exibir', items: [{ label: 'Padrão', radio: true }, { label: 'Científica', disabled: true }, '-', { label: 'Agrupamento de Dígitos', disabled: true }] },
        { label: 'Ajuda', items: [{ label: 'Tópicos da Ajuda', action: () => launch('help', { topic: 'calculator' }) }, '-', { label: 'Sobre a Calculadora', action: () => launch('winver', { app: 'Calculadora', icon: 'calculator' }) }] },
    ]);
    const wrap = html('<div class="calc-wrap"></div>');
    wrap.append(bar, body);
    const win = WM.open({ app: 'calculator', title: 'Calculadora', icon: 'calculator', width: 290, height: 290, content: wrap, resizable: false, maximizable: false });
    setTimeout(() => body.focus(), 50);
    $$('button', body).forEach(b => b.tabIndex = -1);
    return win;
}
