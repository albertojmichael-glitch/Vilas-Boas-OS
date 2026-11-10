import pt from './i18n/pt.js';
import en from './i18n/en.js';

const dicionarios = { pt, en };
let idiomaAtual = localStorage.getItem('vilasBoasIdioma') || 'pt';
if (!dicionarios[idiomaAtual]) idiomaAtual = 'pt';

export const I18n = {
    getIdioma() {
        return idiomaAtual;
    },

    // Retorna a tradução de uma chave específica (útil para injetar via JS)
    t(chave) {
        if (!dicionarios[idiomaAtual] || dicionarios[idiomaAtual][chave] === undefined) {
            if (dicionarios.pt && dicionarios.pt[chave] !== undefined) {
                return dicionarios.pt[chave];
            }
            console.warn(`[i18n] Chave não traduzida: ${chave}`);
            return chave;
        }
        return dicionarios[idiomaAtual][chave];
    },

    // Varre o HTML e traduz todos os elementos marcados
    traduzirDOM() {
        document.documentElement.lang = idiomaAtual === 'en' ? 'en' : 'pt-BR';

        const elementos = document.querySelectorAll('[data-i18n]');
        elementos.forEach(el => {
            const chave = el.getAttribute('data-i18n');
            if (chave) el.innerText = this.t(chave);
        });

        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const chave = el.getAttribute('data-i18n-placeholder');
            if (chave) el.setAttribute('placeholder', this.t(chave));
        });

        const titles = document.querySelectorAll('[data-i18n-title]');
        titles.forEach(el => {
            const chave = el.getAttribute('data-i18n-title');
            if (chave) el.setAttribute('title', this.t(chave));
        });

        const arias = document.querySelectorAll('[data-i18n-aria]');
        arias.forEach(el => {
            const chave = el.getAttribute('data-i18n-aria');
            if (chave) el.setAttribute('aria-label', this.t(chave));
        });

        document.dispatchEvent(new CustomEvent('i18n:changed', {
            detail: { idioma: idiomaAtual }
        }));
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
