// audioManager.js
export const AudioManager = {
    sons: {
        // Altere os caminhos caso use extensões .wav ou .ogg
        click: new Audio('assets/sounds/click.mp3'),       
        error: new Audio('assets/sounds/error.mp3'),       
        ambient: new Audio('assets/sounds/ambient.mp3'),   
        camera: new Audio('assets/sounds/camera_bip.mp3'),
        startup: new Audio('assets/sounds/startup.mp3'),  
    },

    init() {
        // Configura o som ambiente
        this.sons.ambient.loop = true;
        this.sons.ambient.volume = 0.15; // Bem baixinho para dar tensão
    },

    play(nomeDoSom) {
        if (this.sons[nomeDoSom]) {
            // Clona o nó de áudio para permitir sons sobrepostos (ex: clicar rápido 3 vezes)
            const somClone = this.sons[nomeDoSom].cloneNode();
            somClone.volume = this.sons[nomeDoSom].volume;
            // O catch evita erros no console se o navegador bloquear o áudio
            somClone.play().catch(() => {});
        }
    },

    iniciarAmbiente() {
        // Navegadores bloqueiam áudio automático, então ele só toca após o primeiro clique do jogador
        this.sons.ambient.play().catch(() => {
            console.warn("[Áudio] O navegador bloqueou o som ambiente. Ele começará após o primeiro clique.");
        });
    },

    pararAmbiente() {
        this.sons.ambient.pause();
    }
};