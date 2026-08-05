// cameras.js
export const Cameras = {
    canvas: null,
    ctx: null,
    animationId: null,
    cameraAtual: 1,
    
    // Nomes das câmeras no lore do jogo
    nomesCameras: {
        1: "CAM 01 - PALCO PRINCIPAL",
        2: "CAM 02 - CORREDOR LESTE",
        3: "CAM 03 - SALA DOS FUNDOS",
        4: "CAM 04 - COZINHA"
    },

    init() {
        this.canvas = document.getElementById('camera-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.iniciarEstatica();
    },

    iniciarEstatica() {
        const drawNoise = () => {
            if (!this.canvas) return;
            const w = this.canvas.width;
            const h = this.canvas.height;
            
            // Cria um buffer de pixels para manipular a imagem mais rápido
            const idata = this.ctx.createImageData(w, h);
            const buffer32 = new Uint32Array(idata.data.buffer);
            const len = buffer32.length;

            // Gera o ruído preto, branco e cinza escuro
            for (let i = 0; i < len; i++) {
                // 5% de chance de ser um pixel branco de estática forte, resto é cinza/preto
                const cor = Math.random() < 0.05 ? 200 : Math.random() * 50;
                buffer32[i] = 0xff000000 | (cor << 16) | (cor << 8) | cor; 
            }
            
            this.ctx.putImageData(idata, 0, 0);

            // Adiciona Scanlines (Linhas horizontais de TV antiga)
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            for (let i = 0; i < h; i += 4) {
                this.ctx.fillRect(0, i, w, 2);
            }

            this.animationId = requestAnimationFrame(drawNoise);
        };
        
        drawNoise();
    },

    trocarCamera(id) {
        this.cameraAtual = id;
        
        // Atualiza o texto na tela
        const camNameEl = document.getElementById('cam-name');
        if (camNameEl) {
            camNameEl.innerText = this.nomesCameras[id] || "CAM ?? - SINAL PERDIDO";
        }

        // Atualiza os botões (deixa o selecionado verde)
        document.querySelectorAll('.cam-btn').forEach((btn, index) => {
            if (index + 1 === id) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Efeito de "troca de canal": Pisca a tela de branco por um frame
        if (this.ctx) {
            this.ctx.fillStyle = "white";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};