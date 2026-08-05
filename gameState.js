// gameState.js
export const GameState = {
    horaAtual: 0,
    energia: 100,
    noiteAtiva: false,
    cameraAberta: false, // O estado interno substitui a checagem do DOM
    intervaloRelogio: null,
    intervaloEnergia: null,
    duracaoHoraMinutos: 0.5, 
    consumoBase: 1,

    // ==========================================
    // EVENT EMITTER (O "Megafone" do Jogo)
    // ==========================================
    emitir(nomeEvento, dados = {}) {
        const evento = new CustomEvent(nomeEvento, { detail: dados });
        document.dispatchEvent(evento);
    },

    iniciarNoite() {
        console.log("[GameState] A Noite começou.");
        this.noiteAtiva = true;
        this.energia = 100;
        this.horaAtual = 0;

        // Dispara os eventos iniciais para a UI se configurar
        this.emitir('game:start');
        this.emitir('game:powerUpdate', { energia: this.energia });
        this.emitir('game:timeUpdate', { hora: this.horaAtual });

        const tempoPorHora = this.duracaoHoraMinutos * 60 * 1000;
        this.intervaloRelogio = setInterval(() => this.avancarHora(), tempoPorHora);
        this.intervaloEnergia = setInterval(() => this.consumirEnergia(), 2000);
    },

    // A UI vai chamar isso quando o jogador abrir/fechar a câmera
    setCameraAberta(isOpen) {
        this.cameraAberta = isOpen;
    },

    consumirEnergia() {
        if (!this.noiteAtiva) return;

        let consumoAtual = this.consumoBase;
        if (this.cameraAberta) {
            consumoAtual += 2; // Câmeras gastam muita energia
        }

        this.energia -= consumoAtual;
        
        if (this.energia <= 0) {
            this.energia = 0;
            this.apagarTudo();
        }
        
        // Avisa o mundo que a energia mudou
        this.emitir('game:powerUpdate', { energia: this.energia });
    },

    avancarHora() {
        if (!this.noiteAtiva) return;
        
        this.horaAtual++;
        this.emitir('game:timeUpdate', { hora: this.horaAtual });
        this.verificarEventos(this.horaAtual);

        if (this.horaAtual >= 6) {
            this.vencerNoite();
        }
    },

    verificarEventos(hora) {
        if (hora === 2) {
            // Em vez de manipular a janela do gato, emitimos um evento de Lore
            this.emitir('game:event', { tipo: 'cat_glitch' });
        }
    },

    apagarTudo() {
        this.noiteAtiva = false;
        clearInterval(this.intervaloRelogio);
        clearInterval(this.intervaloEnergia);
        
        this.emitir('game:blackout');
    },

    vencerNoite() {
        this.noiteAtiva = false;
        clearInterval(this.intervaloRelogio);
        clearInterval(this.intervaloEnergia);
        
        this.emitir('game:win');
    }
};