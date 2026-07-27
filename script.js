// ==========================================
// TELA DE BOOT (CARREGAMENTO)
// ==========================================
window.addEventListener('load', () => {
    // Simula um tempo de carregamento do sistema operacional (3.5 segundos)
    setTimeout(() => {
        const bootScreen = document.getElementById('boot-screen');
        
        // Aplica o fade out
        bootScreen.style.opacity = '0';
        
        // Remove a tela preta do HTML após o fade terminar (1 segundo depois)
        setTimeout(() => {
            bootScreen.remove();
        }, 1000);
        
    }, 3500); 
});

// ==========================================
// RELÓGIO DA BARRA DE TAREFAS
// ==========================================
function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    clockElement.textContent = `${hours}:${minutes} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000);