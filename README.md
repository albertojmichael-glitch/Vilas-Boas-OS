# 🖥️ Vilas Boas OS & Noturno

Uma simulação imersiva de sistema operacional (inspirada no Windows Vista) combinada com uma experiência de *survival horror* e gerenciamento de turnos noturnos. 

O objetivo do jogador é sobreviver ao turno de vigilância gerenciando a energia do sistema, monitorando câmeras de segurança e explorando arquivos de *lore* espalhados pelo computador, enquanto eventos misteriosos acontecem.

---

## ✨ Funcionalidades Principais

* **Interface Aero Glass:** Design autêntico com efeitos de vidro fosco (`backdrop-filter`), reflexos, sombras e animações suaves de abertura e fechamento de janelas.
* **Gerenciamento de Janelas Avançado (`WindowManager`):**
  * Janelas flutuantes totalmente arrastáveis (com suporte a mouse e toque/mobile) otimizadas com aceleração de GPU (`requestAnimationFrame`).
  * Sistema de *Aero Snap* (encaixar janelas nas bordas ou topo para maximizar/dividir a tela).
  * Salva automaticamente a posição e o estado das janelas no `localStorage`.
* **Sistema de Câmeras de Segurança:** Monitoramento de salas através de um feed com renderização de estática realista em `<canvas>`.
* **Motor de Jogo Desacoplado (`GameState`):** Lógica de turnos, relógio dinâmico (12:00 AM até 6:00 AM) e dreno de energia comunicados via eventos customizados (*Event Emitter*).
* **Acessibilidade e Atalhos:**
  * Modo de Alto Contraste para melhor legibilidade.
  * Navegação completa por teclado (`Tab`, `Enter`, `Esc` para fechar janelas, tecla `Win` para o Menu Iniciar).
* **Aplicativos Integrados:** Bloco de Notas funcional com persistência, Explorador de Arquivos com árvore interativa e Painel de Controle para personalização (troca de papel de parede).

---

## 📁 Estrutura de Arquivos

O projeto foi construído utilizando **ES Modules** nativos, mantendo uma arquitetura limpa e separação de responsabilidades:

```text
/
├── assets/
│   ├── icons/          # Ícones do sistema (Bloco de notas, pastas, câmeras, etc.)
│   ├── wallpapers/     # Planos de fundo da área de trabalho
│   └── sounds/         # Efeitos sonoros e áudio ambiente (opcional)
├── cameras.js          # Lógica de renderização do canvas e feed das câmeras
├── gameState.js        # Motor de regras do jogo (tempo, energia, eventos)
├── main.js             # Ponto de entrada único (Bootstrap da aplicação)
├── storage.js          # Gerenciamento de dados persistentes (localStorage)
├── style.js / style.css# Estilização completa baseada em temas e variáveis CSS
├── ui.js               # Manipulação de elementos visuais e ouvintes de eventos
├── windowManager.js    # Controle de foco, z-index, arrastar e estados das janelas
├── index.html          # Documento HTML principal
└── LICENSE             # Licença do projeto (MIT)
