// Ajuda e Suporte.
import { $, html, esc } from '../core/util.js';
import { ico } from '../core/icons.js';
import { WM } from '../wm.js';
import { launch } from './registry.js';

const TOPICS = {
    home: { title: 'Ajuda e Suporte do Vilas Boas OS', icon: 'help', body: `
        <p>Bem-vindo! Escolha um tópico para aprender a usar o Vilas Boas OS.</p>
        <div class="hp-grid">
            <a data-t="basics">{basics}Noções básicas</a><a data-t="keys">{keys}Atalhos de teclado</a>
            <a data-t="files">{files}Arquivos e pastas</a><a data-t="personal">{personal}Personalização</a>
            <a data-t="programs">{programs}Programas incluídos</a><a data-t="security">{security}Segurança e contas</a>
        </div>` },
    basics: { title: 'Noções básicas', body: `
        <h3>Menu Iniciar</h3><p>Clique no botão redondo no canto inferior esquerdo (ou pressione <kbd>Ctrl</kbd>+<kbd>Esc</kbd>). Digite na caixa <b>Iniciar Pesquisa</b> para encontrar programas, configurações e arquivos instantaneamente.</p>
        <h3>Janelas</h3><p>Arraste a barra de título para mover; arraste as bordas para redimensionar; clique duas vezes na barra de título para maximizar. Passe o mouse sobre um botão da barra de tarefas para ver a miniatura da janela.</p>
        <h3>Flip 3D</h3><p>Clique em <b>Alternar entre janelas</b> na Inicialização Rápida (ou pressione <kbd>Alt</kbd>+<kbd>Q</kbd>) e use a roda do mouse para percorrer as janelas em 3D.</p>
        <h3>Sidebar</h3><p>Os gadgets de relógio, calendário e CPU ficam à direita. Clique com o botão direito para fechá-la ou reabra em Painel de Controle → Propriedades da Sidebar.</p>` },
    keys: { title: 'Atalhos de teclado', body: `<table class="hp-keys">
        <tr><td><kbd>Ctrl</kbd>+<kbd>Esc</kbd></td><td>Abrir o menu Iniciar</td></tr>
        <tr><td><kbd>Alt</kbd>+<kbd>Q</kbd></td><td>Flip 3D</td></tr>
        <tr><td><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd></td><td>Mostrar a área de trabalho</td></tr>
        <tr><td><kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd></td><td>Executar</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Esc</kbd></td><td>Gerenciador de Tarefas</td></tr>
        <tr><td><kbd>F2</kbd></td><td>Renomear o item selecionado</td></tr>
        <tr><td><kbd>Delete</kbd></td><td>Mover para a Lixeira</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>C</kbd> / <kbd>X</kbd> / <kbd>V</kbd></td><td>Copiar / Recortar / Colar arquivos</td></tr>
        <tr><td><kbd>Backspace</kbd> / <kbd>Alt</kbd>+<kbd>←</kbd></td><td>Voltar no Windows Explorer</td></tr>
        <tr><td><kbd>F11</kbd></td><td>Tela cheia (navegador)</td></tr></table>` },
    files: { title: 'Arquivos e pastas', body: `
        <p>Seus arquivos ficam salvos no armazenamento deste navegador (cerca de 5 MB). Use o <b>Windows Explorer</b> para criar pastas, renomear, copiar e mover arquivos.</p>
        <ul><li>Arraste arquivos entre pastas, para a área de trabalho ou para a Lixeira.</li><li>Clique com o botão direito para ver todas as opções.</li>
        <li>A Lixeira guarda itens excluídos até você esvaziá-la — use <b>Restaurar</b> para recuperá-los.</li>
        <li>Mostre as extensões dos arquivos em Painel de Controle → Opções de Pasta.</li></ul>` },
    personal: { title: 'Personalização', body: `
        <p>Clique com o botão direito na área de trabalho e escolha <b>Personalizar</b>.</p>
        <ul><li><b>Cor e Aparência da Janela</b>: escolha a cor do vidro Aero e a transparência.</li><li><b>Plano de Fundo</b>: escolha um papel de parede ou use suas imagens.</li>
        <li><b>Proteção de Tela</b>: Bolhas ou Fitas após alguns minutos sem uso.</li><li><b>Contas de Usuário</b>: altere sua imagem, nome e senha.</li></ul>` },
    programs: { title: 'Programas incluídos', body: `<ul>
        <li><a data-l="notepad">Bloco de Notas</a> — editor de texto.</li><li><a data-l="calculator">Calculadora</a> — operações básicas e memória.</li>
        <li><a data-l="paint">Paint</a> — desenho com lápis, pincel, formas, balde e texto.</li><li><a data-l="photos">Galeria de Fotos</a> — visualizador e apresentação de slides.</li>
        <li><a data-l="browser">Navegador Vilas Boas</a> — navegação com abas.</li><li><a data-l="mail">Vilas Mail</a> — e-mail.</li>
        <li><a data-l="cmd">Prompt de Comando</a> — digite HELP para ver os comandos.</li><li><a data-l="taskmgr">Gerenciador de Tarefas</a> — aplicativos, processos e desempenho.</li>
        <li><a data-l="mines">Caça-Minas</a> — jogo de lógica.</li></ul>` },
    security: { title: 'Segurança e contas', body: `<p>Crie uma senha em <a data-l="control">Painel de Controle</a> → Contas de Usuário. Com senha, ela será solicitada ao fazer logon, ao bloquear o computador e ao sair da suspensão.</p>
        <p>Algumas configurações exibem o <b>Controle de Conta de Usuário</b>, que escurece a tela e pede sua permissão antes de continuar.</p>` },
    explorer: { title: 'Windows Explorer', body: `<p>Use os botões Voltar/Avançar, clique nas partes do endereço para navegar e use a caixa Pesquisar para encontrar arquivos na pasta atual.</p><p>Em <b>Modos de Exibição</b> escolha ícones grandes, lista, detalhes ou lado a lado.</p>` },
    notepad: { title: 'Bloco de Notas', body: '<p>Digite seu texto e use Arquivo → Salvar (Ctrl+S). Use Formatar → Fonte para mudar a fonte e Editar → Localizar (Ctrl+F) para procurar.</p>' },
    calculator: { title: 'Calculadora', body: '<p>Use o teclado numérico. Enter calcula, Esc limpa, Backspace apaga o último dígito. MS/MR/M+/MC controlam a memória.</p>' },
    paint: { title: 'Paint', body: '<p>Escolha uma ferramenta à esquerda. Botão esquerdo usa a cor principal, botão direito a cor secundária. Segure Shift para quadrados e círculos perfeitos. Arraste o canto inferior direito da imagem para redimensioná-la.</p>' },
    photos: { title: 'Galeria de Fotos', body: '<p>Use as setas ou a roda do mouse para navegar. Ctrl + roda faz zoom. O botão redondo central inicia a apresentação de slides.</p>' },
    mines: { title: 'Como jogar Caça-Minas', body: '<p>Clique para revelar um quadrado. O número indica quantas minas existem nos quadrados vizinhos. Clique com o botão direito para marcar uma mina com uma bandeira. Clique em um número cujas minas já estejam todas marcadas para abrir os vizinhos automaticamente.</p>' },
    taskmgr: { title: 'Gerenciador de Tarefas', body: '<p>Veja os programas abertos em Aplicativos, finalize tarefas que não respondem e acompanhe o uso de CPU e memória em Desempenho.</p>' },
};

export function open({ topic = 'home' } = {}) {
    const existing = WM.findApp('help');
    if (existing) { existing.focus(); existing.show(topic); return existing; }
    const back = [];
    let cur = null;
    const body = html(`<div class="help">
        <div class="hp-bar">
            <button class="nav-round hp-back" data-tip="Voltar" disabled><i></i></button>
            <button class="hp-btn" data-t="home">${ico('help', 16)} Início</button>
            <div class="hp-search"><input placeholder="Pesquisar na Ajuda" spellcheck="false"><button class="ex-search-btn"><i></i></button></div>
        </div>
        <div class="hp-content"></div>
    </div>`);
    const content = $('.hp-content', body);
    const icons = { basics: 'welcome', keys: 'run', files: 'folder', personal: 'personalize', programs: 'programs', security: 'shield' };
    const show = (t, push = true) => {
        const T = TOPICS[t] || TOPICS.home;
        if (push && cur && cur !== t) back.push(cur);
        cur = t;
        content.innerHTML = `<h1>${esc(T.title)}</h1>${T.body.replace(/\{(\w+)\}/g, (_, k) => ico(icons[k] || 'help', 32))}`;
        $('.hp-back', body).disabled = !back.length;
        content.scrollTop = 0;
        win.setTitle(`${T.title === TOPICS.home.title ? 'Ajuda e Suporte' : T.title} - Ajuda e Suporte`);
    };
    body.addEventListener('click', e => {
        const a = e.target.closest('[data-t]');
        if (a) show(a.dataset.t);
        const l = e.target.closest('[data-l]');
        if (l) launch(l.dataset.l);
    });
    $('.hp-back', body).addEventListener('click', () => { if (back.length) show(back.pop(), false); });
    const input = $('.hp-search input', body);
    input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const q = input.value.trim().toLowerCase();
        if (!q) return;
        const hits = Object.entries(TOPICS).filter(([, T]) => (T.title + T.body).toLowerCase().includes(q));
        content.innerHTML = `<h1>Resultados da pesquisa: "${esc(q)}"</h1>` + (hits.length ? `<ul>${hits.map(([k, T]) => `<li><a data-t="${k}">${esc(T.title)}</a></li>`).join('')}</ul>` : '<p>Nenhum resultado encontrado.</p>');
    });
    const win = WM.open({ app: 'help', title: 'Ajuda e Suporte', icon: 'help', width: 640, height: 520, content: body, minW: 400, minH: 300 });
    win.show = t => show(t);
    show(topic, false);
    return win;
}
