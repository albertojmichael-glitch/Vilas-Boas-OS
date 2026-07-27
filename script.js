// Atualiza o relógio da barra de tarefas
function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // A hora '0' deve ser '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    clockElement.textContent = `${hours}:${minutes} ${ampm}`;
}

// Roda a função uma vez para não esperar 1 segundo inteiro na tela de loading
updateClock();
// Atualiza a cada 1000 milissegundos (1 segundo)
setInterval(updateClock, 1000);