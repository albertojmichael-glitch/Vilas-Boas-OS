export const Storage = {
    creepyText: "Acho que alguém andou mexendo no meu computador.\nAs câmeras da sala 03 foram desligadas de novo.\n\nEles não param de olhar.",

    init() {
        // Init do Bloco de Notas
        if (!localStorage.getItem("vilasBoasNotepad_init")) {
            localStorage.setItem("vilasBoasNotepad", this.creepyText);
            localStorage.setItem("vilasBoasNotepad_init", "true");
        }

        // Init do Wallpaper
        const savedWallpaper = localStorage.getItem("vilasBoasWallpaper");
        if (savedWallpaper) {
            document.body.style.backgroundImage = `url('${savedWallpaper}')`;
        }

        // Init do Alto Contraste
        const highContrast = localStorage.getItem("vilasBoasHighContrast");
        if (highContrast === "true") {
            document.body.classList.add("high-contrast");
        }
    }, // Faltava fechar o init() corretamente aqui e colocar a vírgula

    carregarNotepad(textareaElement) {
        if (!textareaElement) return;
        const txtSalvo = localStorage.getItem("vilasBoasNotepad");
        if (txtSalvo !== null) {
            textareaElement.value = txtSalvo;
        }
    },

    salvarNotepad(texto) {
        localStorage.setItem("vilasBoasNotepad", texto);
    }, // Faltava a vírgula aqui

    toggleHighContrast() {
        const body = document.body;
        body.classList.toggle("high-contrast");
        
        // Salva no localStorage
        const isAtivo = body.classList.contains("high-contrast");
        localStorage.setItem("vilasBoasHighContrast", isAtivo ? "true" : "false");
    }, // Faltava a vírgula aqui

    salvarWallpaper(url) {
        localStorage.setItem("vilasBoasWallpaper", url);
        document.body.style.backgroundImage = `url('${url}')`;
    },

    salvarEstadoJanela(id, top, left, isOpen) {
        // Puxa o estado atual de todas as janelas (ou cria um objeto vazio)
        const state = JSON.parse(localStorage.getItem('vilasBoasWindows') || '{}');
        
        // Garante que a janela existe no objeto
        if (!state[id]) state[id] = {};
        
        // Atualiza apenas os valores que foram passados
        if (top !== undefined) state[id].top = top;
        if (left !== undefined) state[id].left = left;
        if (isOpen !== undefined) state[id].isOpen = isOpen;
        
        localStorage.setItem('vilasBoasWindows', JSON.stringify(state));
    },

    carregarEstadoJanelas() {
        return JSON.parse(localStorage.getItem('vilasBoasWindows') || '{}');
    }

};