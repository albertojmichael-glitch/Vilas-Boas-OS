export const Storage = {
    creepyText: "Acho que alguém andou mexendo no meu computador.\nAs câmeras da sala 03 foram desligadas de novo.\n\nEles não param de olhar.",

    init() {
        if (!localStorage.getItem("vilasBoasNotepad_init")) {
            localStorage.setItem("vilasBoasNotepad", this.creepyText);
            localStorage.setItem("vilasBoasNotepad_init", "true");
        }
    },

    carregarNotepad(textareaElement) {
        if (!textareaElement) return;
        const txtSalvo = localStorage.getItem("vilasBoasNotepad");
        if (txtSalvo !== null) {
            textareaElement.value = txtSalvo;
        }
    },

    salvarNotepad(texto) {
        localStorage.setItem("vilasBoasNotepad", texto);
    }
};