// Vista tooltips for any element with a data-tip attribute.
let tip = null, timer = null, current = null;

function hide() {
    clearTimeout(timer);
    current = null;
    tip?.classList.remove('show');
}

export function initTooltips() {
    tip = document.createElement('div');
    tip.className = 'tooltip';
    document.body.appendChild(tip);
    document.addEventListener('pointerover', e => {
        const el = e.target.closest?.('[data-tip]');
        if (el === current) return;
        hide();
        if (!el || document.body.classList.contains('is-dragging')) return;
        current = el;
        timer = setTimeout(() => {
            if (!current || !document.contains(current)) return;
            tip.textContent = current.dataset.tip;
            tip.classList.add('show');
            const r = current.getBoundingClientRect();
            const t = tip.getBoundingClientRect();
            let x = e.clientX + 2, y = r.bottom + 6;
            if (y + t.height > window.innerHeight - 4) y = r.top - t.height - 6;
            x = Math.min(x, window.innerWidth - t.width - 4);
            tip.style.left = Math.max(4, x) + 'px';
            tip.style.top = Math.max(4, y) + 'px';
        }, 550);
    });
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('wheel', hide, { passive: true });
}
