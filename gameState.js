import { UI } from './ui.js';

export const GameState = {
    horaAtual: 0, // 0 = 12:00 AM
    energia: 100,
    noiteAtiva: false,
    intervaloRelogio: null,
    intervaloEnergia: null,

    // Configurações da noite
    duracaoHoraMinutos: 0.5, // Cada hora do jogo dura 30 segundos reais
    consumoBase: 1, // Quanto perde de energia a cada tick

    iniciarNoite() {
        console.log("[GameState] A Noite 1 começou...");
        this.noiteAtiva = true;
        this.atualizarInterface();

        // Relógio do jogo (Avança 1 hora a cada X milissegundos)
        const tempoPorHora = this.duracaoHoraMinutos * 60 * 1000;
        this.intervaloRelogio = setInterval(() => this.avancarHora(), tempoPorHora);

        // Dreno de energia (Cai a cada 2 segundos reais)
        this.intervaloEnergia = setInterval(() => this.consumirEnergia(), 2000);
    },

    avancarHora() {
        if (!this.noiteAtiva) return;
        
        this.horaAtual++;
        this.atualizarInterface();
        this.verificarEventos(this.horaAtual); // Verifica se há sustos programados

        if (this.horaAtual >= 6) {
            this.vencerNoite();
        }
    },

    consumirEnergia() {
        if (!this.noiteAtiva) return;

        // O consumo aumenta se houver janelas pesadas abertas (ex: Câmeras)
        let consumoAtual = this.consumoBase;
        const cameraAberta = !document.getElementById('camera-window').classList.contains('hidden');
        
        if (cameraAberta) {
            consumoAtual += 2; // Câmeras gastam muita energia!
        }

        this.energia -= consumoAtual;
        if (this.energia <= 0) {
            this.energia = 0;
            this.apagarTudo();
        }
        
        this.atualizarInterface();
    },

    atualizarInterface() {
        // Atualiza o Relógio
        const clockEl = document.getElementById('clock');
        if (clockEl) {
            let horaMostrar = this.horaAtual === 0 ? 12 : this.horaAtual;
            clockEl.innerText = `${horaMostrar}:00 AM`;
        }

        // Atualiza a Bateria
        const powerEl = document.getElementById('power-text');
        const powerMeter = document.getElementById('power-meter');
        if (powerEl && powerMeter) {
            powerEl.innerText = `${this.energia}%`;
            
            // Muda de cor quando a energia fica baixa (Tensão!)
            if (this.energia <= 20) {
                powerMeter.style.color = '#ff4a4a'; // Vermelho
                powerMeter.style.animation = 'text-blink 1s infinite';
            } else if (this.energia <= 50) {
                powerMeter.style.color = '#ffda33'; // Amarelo
                powerMeter.style.animation = 'none';
            } else {
                powerMeter.style.color = '#4aff4a'; // Verde
                powerMeter.style.animation = 'none';
            }
        }
    },

    verificarEventos(hora) {
        // Aqui colocamos a "História" baseada no tempo
        if (hora === 2) {
            console.log("[Evento] 2 AM - O Cat Helper avariou!");
            const catWin = document.getElementById('cat-window');
            if (catWin && catWin.classList.contains('hidden')) {
                // Força o assistente a abrir sozinho e dar um glitch
                window.abrirJanela('cat-window');
                if (window.glitchCatHelper) window.glitchCatHelper();
            }
        }
    },

    apagarTudo() {
        this.noiteAtiva = false;
        clearInterval(this.intervaloRelogio);
        clearInterval(this.intervaloEnergia);
        console.log("[GameState] A energia acabou. Blackout.");
        
        // Simula o ecrã a desligar
        document.body.innerHTML = '<div style="background: black; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; color: white; font-family: monospace; font-size: 24px;">SISTEMA DESLIGADO.<br>ENERGIA ESGOTADA.</div>';
        
        // Aqui mais tarde chamamos o Jumpscare!
    },

    vencerNoite() {
        this.noiteAtiva = false;
        clearInterval(this.intervaloRelogio);
        clearInterval(this.intervaloEnergia);
        UI.mostrarAlerta("Turno concluído com sucesso. Bom trabalho, segurança.", "6:00 AM - Fim do Turno");
    }
};