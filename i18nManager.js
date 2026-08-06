import pt from './i18n/pt.js';
import en from './i18n/en.js';

const dicionarios = { pt, en };
let idiomaAtual = localStorage.getItem('vilasBoasIdioma') || 'pt';

export const I18n = {
    // Retorna a tradução de uma chave específica (útil para injetar via JS)
    t(chave) {
        if (!dicionarios[idiomaAtual][chave]) {
            console.warn(`[i18n] Chave não traduzida: ${chave}`);
            return chave;
        }
        return dicionarios[idiomaAtual][chave];
    },

    // Varre o HTML e traduz todos os elementos marcados
    traduzirDOM() {
        const elementos = document.querySelectorAll('[data-i18n]');
        elementos.forEach(el => {
            const chave = el.getAttribute('data-i18n');
            el.innerText = this.t(chave);
        });
    },

    // Troca o idioma, salva na memória e atualiza a tela
    setIdioma(novoIdioma) {
        if (dicionarios[novoIdioma]) {
            idiomaAtual = novoIdioma;
            localStorage.setItem('vilasBoasIdioma', novoIdioma);
            this.traduzirDOM();
        }
    }
};