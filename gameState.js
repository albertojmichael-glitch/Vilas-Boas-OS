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

    obterConsumoPorCiclo() {
        return this.cameraAberta ? this.consumoBase + 1.0 : this.consumoBase;
    },

    emitirPowerUpdate() {
        this.emitir('game:powerUpdate', {
            energia: Math.ceil(this.energia),
            energiaExata: this.energia,
            consumoPorCiclo: this.obterConsumoPorCiclo(),
            cameraAberta: this.cameraAberta
        });
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
        this.emitirPowerUpdate();
        this.emitir('game:timeUpdate', { hora: this.horaAtual });
        this.emitir('game:entityMove', { posicao: this.posicaoEntidade });

        const tempoPorHora = this.duracaoHoraMinutos * 60 * 1000;
        this.intervaloRelogio = setInterval(() => this.avancarHora(), tempoPorHora);
        this.intervaloEnergia = setInterval(() => this.consumirEnergia(), 2000);
        this.intervaloIA = setInterval(() => this.atualizarIA(), 14000);
    },

    setCameraAberta(isOpen) {
        const mudou = this.cameraAberta !== Boolean(isOpen);
        this.cameraAberta = Boolean(isOpen);
        if (mudou) {
            this.emitirPowerUpdate();
        }
    },

    consumirEnergia() {
        if (!this.noiteAtiva) return;

        const consumoAtual = this.obterConsumoPorCiclo();
        this.energia = Math.max(0, this.energia - consumoAtual);
        this.emitirPowerUpdate();

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
        this.emitirPowerUpdate();

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
                horario: '02:00 AM',
                remetente: 'TI - Suporte Interno',
                remetente_en: 'IT - Internal Support',
                assunto: 'URGENTE: Credenciais de Emergência (Z:)',
                assunto_en: 'URGENT: Emergency Credentials (Z:)',
                corpo: 'Caroline,\n\nDetectamos tráfego anômalo vindo da Sala 03. Caso precise acessar a pasta Confidencial ou o Disco Restrito (Z:), a chave de administrador temporária é: 1987.\n\nSe o Monitor de Rede acusar invasão crítica na CAM 03, execute o Pulso de Firewall imediatamente!',
                corpo_en: 'Caroline,\n\nWe detected anomalous traffic coming from Room 03. If you need to access the Confidential folder or Restricted Drive (Z:), the temporary admin key is: 1987.\n\nIf the Network Monitor reports a critical breach on CAM 03, execute the Firewall Pulse immediately!'
            });
        }
        if (hora === 4) {
            this.emitir('game:newEmail', {
                id: 'mail-4am',
                horario: '04:00 AM',
                remetente: '??? (Remetente Desconhecido)',
                remetente_en: '??? (Unknown Sender)',
                assunto: 'NÃO FECHE OS OLHOS',
                assunto_en: 'DO NOT CLOSE YOUR EYES',
                corpo: 'Eles aprenderam a usar a rede local.\nO gato não é apenas um programa.\nMantenha a Sala 03 limpa até as 06:00 AM.',
                corpo_en: 'They learned how to use the local subnet.\nThe cat is not just a program.\nKeep Room 03 clear until 06:00 AM.'
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
