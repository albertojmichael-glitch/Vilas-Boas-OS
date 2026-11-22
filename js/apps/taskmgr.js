// Gerenciador de Tarefas.
import { $, $$, html, esc, bus } from '../core/util.js';
import { Settings } from '../core/settings.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { menuBar } from '../ui/menu.js';
import { messageBox } from '../ui/dialogs.js';
import { launch } from './registry.js';
import { Session } from '../shell/session.js';

const SYS_PROCS = [
    ['System', 'SYSTEM', 280], ['smss.exe', 'SYSTEM', 340], ['csrss.exe', 'SYSTEM', 2100], ['wininit.exe', 'SYSTEM', 1400],
    ['services.exe', 'SYSTEM', 3600], ['lsass.exe', 'SYSTEM', 2900], ['svchost.exe', 'SYSTEM', 8200], ['svchost.exe', 'SERVIÇO DE REDE', 4100],
    ['dwm.exe', null, 22400], ['explorer.exe', null, 31200], ['sidebar.exe', null, 14800], ['taskeng.exe', null, 3200], ['audiodg.exe', 'SERVIÇO LOCAL', 9100],
];

export function open() {
    const existing = WM.findApp('taskmgr');
    if (existing) { existing.focus(); return existing; }
    let tab = 'apps';
    const cpuHist = Array.from({ length: 60 }, () => 3 + Math.random() * 14);
    const memHist = Array.from({ length: 60 }, () => 37 + Math.random() * 3);
    let cpu = 8, selectedWin = null, selectedProc = null;

    const body = html(`<div class="taskmgr">
        <div class="tm-inner">
            <div class="tabs">${[['apps', 'Aplicativos'], ['procs', 'Processos'], ['perf', 'Desempenho'], ['net', 'Rede'], ['users', 'Usuários']].map(([id, l]) => `<div class="tab${id === tab ? ' active' : ''}" data-tab="${id}">${l}</div>`).join('')}</div>
            <div class="tab-page tm-page"></div>
        </div>
        <div class="statusbar"><span class="tm-s1"></span><span class="tm-s2"></span><span class="tm-s3"></span></div>
    </div>`);
    const page = $('.tm-page', body);

    const procs = () => {
        const user = Settings.get('userName');
        const list = SYS_PROCS.map(([n, u, m], i) => ({ name: n, user: u || user, mem: m, cpu: 0, pid: 4 + i * 132, sys: !!u }));
        WM.taskWindows().forEach((w, i) => list.push({ name: (w.appId || 'app') + '.exe', user, mem: 6000 + ((w.title.length * 997) % 24000), cpu: 0, pid: 3000 + i * 44, win: w }));
        return list;
    };

    const renderApps = () => {
        const wins = WM.taskWindows().filter(w => w.appId !== 'taskmgr');
        page.innerHTML = `<div class="tm-list"><div class="tm-head"><span style="flex:1">Tarefa</span><span style="width:100px">Status</span></div>
            ${wins.map(w => `<div class="tm-row sel-item${selectedWin === w.id ? ' selected' : ''}" data-win="${w.id}"><span style="flex:1;display:flex;gap:6px;align-items:center">${ico(w.icon, 16)}${esc(w.title)}</span><span style="width:100px">Em Execução</span></div>`).join('')}</div>
            <div class="tm-buttons"><button class="btn" data-a="end" ${selectedWin ? '' : 'disabled'}>Finalizar Tarefa</button><button class="btn" data-a="switch" ${selectedWin ? '' : 'disabled'}>Alternar Para</button><button class="btn" data-a="new">Nova Tarefa...</button></div>`;
    };
    const renderProcs = () => {
        const list = procs();
        page.innerHTML = `<div class="tm-list"><div class="tm-head"><span style="flex:1">Nome da Imagem</span><span style="width:110px">Nome de Usuário</span><span style="width:40px;text-align:right">CPU</span><span style="width:90px;text-align:right">Memória</span></div>
            ${list.map(p => `<div class="tm-row sel-item${selectedProc === p.pid ? ' selected' : ''}" data-pid="${p.pid}"><span style="flex:1">${esc(p.name)}</span><span style="width:110px">${esc(p.user)}</span><span style="width:40px;text-align:right">${String(Math.round(Math.random() * (p.win ? 3 : 1))).padStart(2, '0')}</span><span style="width:90px;text-align:right">${p.mem.toLocaleString('pt-BR')} K</span></div>`).join('')}</div>
            <div class="tm-buttons"><label class="check" style="margin-right:auto"><input type="checkbox" class="tm-all"> Mostrar processos de todos os usuários</label><button class="btn" data-a="endproc" ${selectedProc ? '' : 'disabled'}>Finalizar Processo</button></div>`;
    };
    const graph = (hist, color) => {
        const pts = hist.map((v, i) => `${(i / (hist.length - 1)) * 100},${100 - v}`).join(' ');
        return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="tm-graph"><defs><pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0V10H0" fill="none" stroke="#0a5a1d" stroke-width=".6"/></pattern></defs>
            <rect width="100" height="100" fill="#000"/><rect width="100" height="100" fill="url(#g)"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>`;
    };
    const meter = (v, label) => `<div class="tm-meter"><div class="tm-meter-bars">${Array.from({ length: 20 }, (_, i) => `<span class="${(19 - i) < v / 5 ? 'on' : ''}"></span>`).join('')}</div><div class="tm-meter-val">${label}</div></div>`;
    const renderPerf = () => {
        const mem = memHist[memHist.length - 1];
        const totalMb = (navigator.deviceMemory || 4) * 1024;
        page.innerHTML = `<div class="tm-perf">
            <div class="tm-box"><div class="tm-box-t">Uso de CPU</div>${meter(cpu, Math.round(cpu) + '%')}</div>
            <div class="tm-box grow"><div class="tm-box-t">Histórico de Uso da CPU</div>${graph(cpuHist, '#3cff3c')}</div>
            <div class="tm-box"><div class="tm-box-t">Memória</div>${meter(mem, Math.round(totalMb * mem / 100) + ' MB')}</div>
            <div class="tm-box grow"><div class="tm-box-t">Histórico de Uso da Memória Física</div>${graph(memHist, '#ffff3c')}</div>
            <div class="tm-stats">
                <div class="group"><span class="group-title">Memória Física (MB)</span><div class="kv"><span>Total</span><span>${totalMb.toLocaleString('pt-BR')}</span><span>Em cache</span><span>${Math.round(totalMb * 0.28).toLocaleString('pt-BR')}</span><span>Livre</span><span>${Math.round(totalMb * (1 - mem / 100)).toLocaleString('pt-BR')}</span></div></div>
                <div class="group"><span class="group-title">Sistema</span><div class="kv"><span>Identificadores</span><span>${(14000 + Math.round(cpu * 13)).toLocaleString('pt-BR')}</span><span>Threads</span><span>${520 + WM.list().length * 9}</span><span>Processos</span><span>${procs().length}</span><span>Tempo de Atividade</span><span>${uptime()}</span></div></div>
            </div></div>`;
    };
    const t0 = performance.now();
    const uptime = () => { const s = Math.floor((performance.now() - t0) / 1000) + 3600; const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return `0:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
    const renderNet = () => { page.innerHTML = `<div class="tm-perf"><div class="tm-box grow"><div class="tm-box-t">Conexão Local</div>${graph(cpuHist.map(v => Math.min(100, v / 4)), '#3cff3c')}</div></div><div class="tm-note">Adaptador: Conexão Local — ${navigator.onLine ? 'Conectado' : 'Desconectado'} — Velocidade do link: 100 Mbps</div>`; };
    const renderUsers = () => { page.innerHTML = `<div class="tm-list"><div class="tm-head"><span style="flex:1">Usuário</span><span style="width:60px">ID</span><span style="width:90px">Status</span><span style="width:120px">Nome do Cliente</span></div><div class="tm-row sel-item selected"><span style="flex:1;display:flex;gap:6px;align-items:center">${ico('user', 16)}${esc(Settings.get('userName'))}</span><span style="width:60px">1</span><span style="width:90px">Ativo</span><span style="width:120px"></span></div></div>
        <div class="tm-buttons"><button class="btn" data-a="logoff">Fazer Logoff</button><button class="btn" disabled>Enviar Mensagem...</button></div>`; };
    const render = () => ({ apps: renderApps, procs: renderProcs, perf: renderPerf, net: renderNet, users: renderUsers })[tab]();
    const status = () => {
        $('.tm-s1', body).textContent = `Processos: ${procs().length}`;
        $('.tm-s2', body).textContent = `Uso de CPU: ${Math.round(cpu)}%`;
        $('.tm-s3', body).textContent = `Memória Física: ${Math.round(memHist[memHist.length - 1])}%`;
    };
    const sample = () => {
        const load = window.__cpuLoad;
        cpu = load ? load.cpu : Math.max(1, Math.min(100, cpu + (Math.random() - 0.5) * 14 + WM.list().length * 0.3));
        cpuHist.push(cpu); cpuHist.shift();
        memHist.push(load ? load.mem : 40); memHist.shift();
        status();
        if (tab === 'perf' || tab === 'net') render();
    };

    $('.tabs', body).addEventListener('click', e => {
        const t = e.target.closest('.tab');
        if (!t) return;
        tab = t.dataset.tab;
        $$('.tab', body).forEach(x => x.classList.toggle('active', x === t));
        render();
    });
    page.addEventListener('click', async e => {
        const row = e.target.closest('.tm-row');
        if (row?.dataset.win) { selectedWin = row.dataset.win; render(); }
        if (row?.dataset.pid) { selectedProc = +row.dataset.pid; render(); }
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (a === 'end') { WM.get(selectedWin)?.requestClose(); selectedWin = null; }
        else if (a === 'switch') { const w = WM.get(selectedWin); if (w) { w.focus(); } }
        else if (a === 'new') launch('run');
        else if (a === 'logoff') Session.logoff();
        else if (a === 'endproc') {
            const p = procs().find(x => x.pid === selectedProc);
            if (!p) return;
            if (p.sys || ['dwm.exe', 'explorer.exe', 'sidebar.exe'].includes(p.name)) {
                messageBox({ title: 'Gerenciador de Tarefas', icon: 'warning', instruction: `Deseja finalizar '${p.name}'?`, text: 'Finalizar um processo do sistema pode deixar o sistema instável. Esta simulação protege os processos do sistema.', buttons: ['OK'], parent: win });
                return;
            }
            const r = await messageBox({ title: 'Gerenciador de Tarefas', icon: 'warning', instruction: `Deseja finalizar '${p.name}'?`, text: 'Se um processo aberto estiver associado a um programa, o programa será fechado e você perderá os dados não salvos.', buttons: ['Finalizar processo', 'Cancelar'], parent: win });
            if (r === 'Finalizar processo') { p.win?.close(); selectedProc = null; render(); }
        }
    });
    page.addEventListener('dblclick', e => { const row = e.target.closest('.tm-row'); if (row?.dataset.win) WM.get(row.dataset.win)?.focus(); });

    const bar = menuBar([
        { label: 'Arquivo', items: [{ label: 'Nova Tarefa (Executar...)', action: () => launch('run') }, '-', { label: 'Sair do Gerenciador de Tarefas', action: () => win.close() }] },
        { label: 'Opções', items: [{ label: 'Sempre Visível', disabled: true }, { label: 'Minimizar ao Usar', checked: false, disabled: true }] },
        { label: 'Exibir', items: [{ label: 'Atualizar Agora', action: () => { sample(); render(); } }] },
        { label: 'Janelas', items: [{ label: 'Lado a Lado Horizontalmente', action: () => WM.tile(false) }, { label: 'Lado a Lado Verticalmente', action: () => WM.tile(true) }, { label: 'Cascata', action: () => WM.cascade() }] },
        { label: 'Ajuda', items: [{ label: 'Tópicos da Ajuda', action: () => launch('help', { topic: 'taskmgr' }) }, '-', { label: 'Sobre o Gerenciador de Tarefas', action: () => launch('winver', { app: 'Gerenciador de Tarefas', icon: 'taskmgr' }) }] },
    ]);
    body.prepend(bar);
    var win = WM.open({ app: 'taskmgr', title: 'Gerenciador de Tarefas do Vilas Boas OS', icon: 'taskmgr', width: 440, height: 500, content: body, minW: 360, minH: 380 });
    const off = bus.on('wm', type => { if ((type === 'open' || type === 'close' || type === 'title') && (tab === 'apps' || tab === 'procs')) render(); });
    const timer = setInterval(sample, 1000);
    win.onClose(() => { clearInterval(timer); off(); });
    render(); status();
    return win;
}
