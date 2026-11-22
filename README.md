# Vilas Boas OS

Uma simulação do Windows Vista que roda no navegador, feita só com HTML, CSS e JavaScript (sem frameworks e sem backend).

## Como rodar

Os módulos JavaScript precisam ser servidos por HTTP (abrir o `index.html` direto do disco não funciona):

```powershell
python -m http.server 5510
```

Depois abra <http://localhost:5510>. Dica: pressione F11 para usar em tela cheia.

## O que tem

- **Sessão**: tela de boot, logon com senha opcional e dica, bloquear, fazer logoff, suspender, reiniciar e desligar.
- **Aero**: janelas de vidro com desfoque, cor e intensidade configuráveis, animações de abrir/minimizar/maximizar e moldura opaca quando maximizada.
- **Área de trabalho**: ícones arrastáveis com grade, seleção por retângulo, renomear (F2), atalhos, menu de contexto completo e Sidebar com gadgets (relógio, calendário e CPU).
- **Barra de tarefas**: orbe Iniciar, Inicialização Rápida, miniaturas ao vivo das janelas, área de notificação com volume, rede e relógio/calendário.
- **Menu Iniciar**: programas fixos e recentes, Todos os Programas, pesquisa instantânea e opções de desligamento.
- **Flip 3D**, proteção de tela (Bolhas/Fitas) e Controle de Conta de Usuário (UAC).
- **Programas**: Windows Explorer, Bloco de Notas, Calculadora, Paint, Galeria de Fotos, Navegador com abas, Vilas Mail, Prompt de Comando, Executar, Gerenciador de Tarefas, Painel de Controle, Caça-Minas, Central de Boas-Vindas e Ajuda e Suporte.

Os arquivos e as configurações ficam salvos no `localStorage` do navegador (cerca de 5 MB).

## Estrutura

```
index.html          página principal
css/                estilos (base, controles, sessão, área de trabalho, barra de tarefas, janelas, programas)
js/main.js          ponto de entrada
js/core/            sistema de arquivos virtual, configurações, sons sintetizados, ícones, utilitários
js/ui/              menus, diálogos, caixas Abrir/Salvar, dicas de ferramenta
js/wm.js            gerenciador de janelas
js/shell/           sessão, área de trabalho, barra de tarefas, menu Iniciar, Sidebar, Flip 3D, proteção de tela
js/apps/            cada programa em seu próprio módulo (registry.js registra todos)
assets/             ícones e papéis de parede
legacy/             versão anterior (jogo de terror), mantida para referência
```

## Adicionar um programa

1. Crie `js/apps/meuapp.js` exportando `open(args)` que chama `WM.open({...})`.
2. Registre em `js/apps/registry.js` dentro de `APPS`.
3. Opcional: adicione ao menu Iniciar em `js/shell/startmenu.js` (`TREE`).
