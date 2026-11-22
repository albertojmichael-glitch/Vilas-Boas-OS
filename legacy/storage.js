export const Storage = {
    creepyText: "Acho que alguém andou mexendo no meu computador.\nAs câmeras da sala 03 foram desligadas de novo.\n\nEles não param de olhar.",

    wallpapersDisponiveis: [
        "assets/wallpapers/wallpaper.png",
        "assets/wallpapers/aurora_noturna.svg",
        "assets/wallpapers/grade_seguranca.svg",
        "assets/wallpapers/crepusculo_vista.svg"
    ],

    init() {
        // Init do Bloco de Notas
        if (!localStorage.getItem("vilasBoasNotepad_init")) {
            localStorage.setItem("vilasBoasNotepad", this.creepyText);
            localStorage.setItem("vilasBoasNotepadFile", "LEIA-ME.txt");
            localStorage.setItem("vilasBoasNotepad_init", "true");
        }

        // Init do Wallpaper (garante uso de arquivos locais para funcionamento offline)
        let savedWallpaper = localStorage.getItem("vilasBoasWallpaper");
        if (!savedWallpaper || savedWallpaper.startsWith("http")) {
            savedWallpaper = "assets/wallpapers/wallpaper.png";
            localStorage.setItem("vilasBoasWallpaper", savedWallpaper);
        }
        this.aplicarWallpaperDOM(savedWallpaper);

        // Init do Alto Contraste
        const highContrast = localStorage.getItem("vilasBoasHighContrast") === "true";
        document.body.classList.toggle("high-contrast", highContrast);

        // Init do Movimento Reduzido (respeita prefers-reduced-motion por padrão)
        const storedRM = localStorage.getItem("vilasBoasReducedMotion");
        let reducedMotion = false;
        if (storedRM !== null) {
            reducedMotion = storedRM === "true";
        } else if (window.matchMedia) {
            reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        }
        document.body.classList.toggle("reduced-motion", reducedMotion);
    },

    aplicarWallpaperDOM(url) {
        document.body.style.backgroundImage = `url('${url}')`;
        const loginScreen = document.getElementById("start-screen");
        if (loginScreen) {
            loginScreen.style.backgroundImage = `url('${url}')`;
        }
    },

    obterWallpaper() {
        return localStorage.getItem("vilasBoasWallpaper") || "assets/wallpapers/wallpaper.png";
    },

    carregarNotepad(textareaElement) {
        if (!textareaElement) return;
        const txtSalvo = localStorage.getItem("vilasBoasNotepad");
        if (txtSalvo !== null) {
            textareaElement.value = txtSalvo;
        }
    },

    obterArquivoNotepad() {
        return localStorage.getItem("vilasBoasNotepadFile") || "LEIA-ME.txt";
    },

    salvarNotepad(texto, nomeArquivo) {
        localStorage.setItem("vilasBoasNotepad", texto);
        if (nomeArquivo) {
            localStorage.setItem("vilasBoasNotepadFile", nomeArquivo);
        }
    },

    isHighContrast() {
        return document.body.classList.contains("high-contrast");
    },

    toggleHighContrast() {
        const body = document.body;
        body.classList.toggle("high-contrast");
        const isAtivo = body.classList.contains("high-contrast");
        localStorage.setItem("vilasBoasHighContrast", isAtivo ? "true" : "false");
        document.dispatchEvent(new CustomEvent("settings:updated"));
        return isAtivo;
    },

    isReducedMotion() {
        if (document.body.classList.contains("reduced-motion")) return true;
        const storedRM = localStorage.getItem("vilasBoasReducedMotion");
        if (storedRM !== null) return storedRM === "true";
        return window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    },

    toggleReducedMotion() {
        const body = document.body;
        body.classList.toggle("reduced-motion");
        const isAtivo = body.classList.contains("reduced-motion");
        localStorage.setItem("vilasBoasReducedMotion", isAtivo ? "true" : "false");
        document.dispatchEvent(new CustomEvent("settings:updated"));
        return isAtivo;
    },

    isAutoRestoreWindows() {
        return localStorage.getItem("vilasBoasAutoRestore") === "true";
    },

    toggleAutoRestoreWindows() {
        const novoValor = !this.isAutoRestoreWindows();
        localStorage.setItem("vilasBoasAutoRestore", novoValor ? "true" : "false");
        document.dispatchEvent(new CustomEvent("settings:updated"));
        return novoValor;
    },

    salvarWallpaper(url) {
        localStorage.setItem("vilasBoasWallpaper", url);
        this.aplicarWallpaperDOM(url);
        document.dispatchEvent(new CustomEvent("settings:updated"));
    },

    salvarEstadoJanela(id, top, left, isOpen, width, height) {
        try {
            const state = JSON.parse(localStorage.getItem("vilasBoasWindows") || "{}");
            if (!state[id]) state[id] = {};

            if (top !== undefined && top !== "") state[id].top = top;
            if (left !== undefined && left !== "") state[id].left = left;
            if (isOpen !== undefined) state[id].isOpen = isOpen;
            if (width !== undefined && width !== "") state[id].width = width;
            if (height !== undefined && height !== "") state[id].height = height;

            localStorage.setItem("vilasBoasWindows", JSON.stringify(state));
        } catch (e) {
            console.warn("[Storage] Erro ao salvar estado de janela:", e);
        }
    },

    carregarEstadoJanelas() {
        try {
            return JSON.parse(localStorage.getItem("vilasBoasWindows") || "{}");
        } catch (e) {
            return {};
        }
    },

    limparEstadoJanelas() {
        localStorage.removeItem("vilasBoasWindows");
    },

    carregarPreferenciasAudio() {
        try {
            const salvo = JSON.parse(localStorage.getItem("vilasBoasAudio") || "null");
            if (salvo && typeof salvo === "object") {
                return {
                    mutado: Boolean(salvo.mutado),
                    volAmbiente: typeof salvo.volAmbiente === "number" ? salvo.volAmbiente : 0.5,
                    volEfeitos: typeof salvo.volEfeitos === "number" ? salvo.volEfeitos : 0.7,
                    volSustos: typeof salvo.volSustos === "number" ? salvo.volSustos : 0.8
                };
            }
        } catch (e) {}
        return {
            mutado: false,
            volAmbiente: 0.5,
            volEfeitos: 0.7,
            volSustos: 0.8
        };
    },

    salvarPreferenciasAudio(prefs) {
        try {
            localStorage.setItem("vilasBoasAudio", JSON.stringify(prefs));
        } catch (e) {}
    }
};
