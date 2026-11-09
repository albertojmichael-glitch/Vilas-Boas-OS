// gameState.js
export const GameState = {
    horaAtual: 0,
    energia: 100,
    noiteAtiva: false,
    cameraAberta: false,
    posicaoEntidade: 1, // 1: Palco, 2: Corredor, 3: Sala dos Fundos (Perigo!), 4: Ataque
    arquivosDesbloqueados: false,
    intervaloRelogio: null,
    intervaloEnergia: null,
    intervaloIA: null,
    duracaoHoraMinutos: 0.6, // 36 segundos por hora (~3.5 minutos a noite toda)
    consumoBase: 0.5,        // Balanceado para permitir uso estratégico das câmeras

    emitir(nomeEvento, dados = {}) {
        const evento = new CustomEvent(nomeEvento, { detail: dados });
        document.dispatchEvent(evento);
    },

    iniciarNoite() {
        console.log("[GameState] A Noite começou.");
        this.noiteAtiva = true;
        this.energia = 100;
        this.horaAtual = 0;
        this.posicaoEntidade = 1;

        clearInterval(this.intervaloRelogio);
        clearInterval(this.intervaloEnergia);
        clearInterval(this.intervaloIA);

        this.emitir('game:start');
        this.emitir('game:powerUpdate', { energia: Math.ceil(this.energia) });
        this.emitir('game:timeUpdate', { hora: this.horaAtual });
        this.emitir('game:entityMove', { posicao: this.posicaoEntidade });

        const tempoPorHora = this.duracaoHoraMinutos * 60 * 1000;
        this.intervaloRelogio = setInterval(() => this.avancarHora(), tempoPorHora);
        this.intervaloEnergia = setInterval(() => this.consumirEnergia(), 2000);
        this.intervaloIA = setInterval(() => this.atualizarIA(), 14000);
    },

    setCameraAberta(isOpen) {
        this.cameraAberta = isOpen;
    },

    consumirEnergia() {
        if (!this.noiteAtiva) return;

        let consumoAtual = this.consumoBase;
        if (this.cameraAberta) {
            consumoAtual += 1.0; // Dobra o gasto quando o monitor de câmeras está aberto
        }

        this.energia = Math.max(0, this.energia - consumoAtual);
        this.emitir('game:powerUpdate', { energia: Math.ceil(this.energia) });

        if (this.energia <= 0) {
            this.apagarTudo();
        }
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

    atualizarIA() {
        if (!this.noiteAtiva) return;

        // Chance de avanço aumenta conforme a madrugada avança
        const chanceAvanco = 0.40 + (this.horaAtual * 0.08);
        if (Math.random() < chanceAvanco) {
            this.posicaoEntidade++;
            this.emitir('game:entityMove', { posicao: this.posicaoEntidade });

            if (this.posicaoEntidade >= 4) {
                this.dispararJumpscare();
            }
        }
    },

    reiniciarFirewallRede() {
        if (!this.noiteAtiva) return false;

        if (this.energia <= 5) return false;
        this.energia = Math.max(0, this.energia - 5);
        this.emitir('game:powerUpdate', { energia: Math.ceil(this.energia) });

        // Expulsa a entidade de volta para o Palco Principal (CAM 01)
        this.posicaoEntidade = 1;
        this.emitir('game:entityMove', { posicao: this.posicaoEntidade });
        return true;
    },

    verificarEventos(hora) {
        if (hora === 2) {
            this.emitir('game:event', { tipo: 'cat_glitch' });
            this.emitir('game:newEmail', {
                id: 'mail-2am',
                remetente: 'TI - Suporte Interno',
                assunto: 'URGENTE: Credenciais de Emergência',
                corpo: 'Caroline,\n\nDetectamos tráfego anômalo vindo da Sala 03. Caso precise acessar a pasta Confidencial ou o Disco Z:, a chave de administrador temporária é: 1987.\n\nSe o Monitor de Rede acusar invasão crítica, execute o Pulso de Firewall imediatamente!'
            });
        }
        if (hora === 4) {
            this.emitir('game:newEmail', {
                id: 'mail-4am',
                remetente: '??? (Remetente Desconhecido)',
                assunto: 'NÃO FECHE OS OLHOS',
                corpo: 'Eles aprenderam a usar a rede local.\nO gato não é apenas um programa.\nMantenha a Sala 03 limpa até as 06:00.'
            });
        }
    },

    pararTimers() {
        this.noiteAtiva = false;
        clearInterval(this.intervaloRelogio);
        clearInterval(this.intervaloEnergia);
        clearInterval(this.intervaloIA);
    },

    apagarTudo() {
        this.pararTimers();
        this.emitir('game:blackout');
    },

    dispararJumpscare() {
        this.pararTimers();
        this.emitir('game:jumpscare');
    },

    vencerNoite() {
        this.pararTimers();
        this.emitir('game:win');
    }
};