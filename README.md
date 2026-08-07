# 🖥️ Vilas Boas OS

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
