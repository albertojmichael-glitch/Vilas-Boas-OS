export const UI = {
    mostrarAlerta(mensagem, titulo = 'Aviso') {
        const titleEl = document.getElementById('alert-title');
        const msgEl = document.getElementById('alert-message');
        const alertWin = document.getElementById('custom-alert');
        
        if (titleEl && msgEl && alertWin) {
            titleEl.innerText = titulo;
            msgEl.innerText = mensagem;
            alertWin.classList.remove('hidden');
        } else {
            console.warn('[UI] Elementos do alerta não encontrados no DOM.');
        }
    },

    fecharAlerta() {
        const alertWin = document.getElementById('custom-alert');
        if (alertWin) alertWin.classList.add('hidden');
    },

    abrirTexto(idWindow, titulo, conteudo) {
        const notepad = document.getElementById(idWindow);
        if (!notepad) return;
        
        const titleEl = notepad.querySelector('.window-title');
        const textarea = notepad.querySelector('textarea');
        
        if (titleEl) titleEl.innerText = titulo + ' - Bloco de Notas';
        if (textarea) textarea.value = conteudo;
    },

    verificarLixeira(elementoArrastado) {
        if (!elementoArrastado.classList.contains('desktop-icon') || elementoArrastado.id === 'icon-lixeira') return;

        const lixeira = document.getElementById('icon-lixeira');
        if (!lixeira) return;
        
        const rectLixeira = lixeira.getBoundingClientRect();
        const rectItem = elementoArrastado.getBoundingClientRect();

        const colidiu = !(rectLixeira.right < rectItem.left || 
                          rectLixeira.left > rectItem.right || 
                          rectLixeira.bottom < rectItem.top || 
                          rectLixeira.top > rectItem.bottom);

        if (colidiu) {
            elementoArrastado.style.display = 'none';
            const imgTrash = lixeira.querySelector('.icon-trash');
            if (imgTrash) imgTrash.classList.add('full');
        }
    }
};