let estadoTablero = new Array(9).fill(null);
let nombreJugador;                    // <<<<< Aquí, sin asignar aún
let victoriasJugador = 0;
let victoriasCPU = 0;
let esMonteCarlo = false;
let partidasMonteCarlo = 0;

const botones = document.querySelectorAll('.container button');
const marcador = document.getElementById('marcador');
const botonReiniciar = document.getElementById('boton-reiniciar');

marcador.innerHTML = `${nombreJugador}: 0 | CPU: 0`;
botonReiniciar.textContent = "🔄 Reiniciar partida";

const pedirNombre = () => {
    nombreJugador = prompt("¿Cómo te llamas?") || "Tú";
    esMonteCarlo = (nombreJugador.toLowerCase() === "montecarlo");
    partidasMonteCarlo = 0;
    actualizarMarcador();
    reiniciarJuego();
    if (esMonteCarlo) {
        setTimeout(turnoMonteCarlo, 500);
    }
};

// Turno del jugador
const manejarClick = (evento, indice) => {
    if (esMonteCarlo) return; // Si es Monte Carlo, ignorar clicks del jugador

    if (estadoTablero[indice] || verificarGanador()) return;

    estadoTablero[indice] = nombreJugador;
    evento.target.textContent = "X";
    evento.target.style.backgroundColor = "#5A9BD5";

    if (verificarGanador()) {
        setTimeout(() => anunciarGanador(nombreJugador), 100);
        return;
    }

    if (estadoTablero.every(celda => celda)) {
        setTimeout(() => anunciarEmpate(), 100);
        return;
    }

    setTimeout(turnoCPU, 400);
};

// 🧠 MONTE CARLO TREE SEARCH (MCTS) simple:
const monteCarloTreeSearch = (estado, jugador) => {
    const posicionesLibres = estado
        .map((valor, i) => valor === null ? i : null)
        .filter(i => i !== null);
    let mejoresResultados = posicionesLibres.map(pos => {
        let victorias = 0;
        for (let i = 0; i < 100; i++) {  // Puedes ajustar las simulaciones
            if (simularPartida(estado, pos, jugador)) victorias++;
        }
        return {pos, victorias};
    });
    mejoresResultados.sort((a, b) => b.victorias - a.victorias);
    return mejoresResultados[0].pos;
};

const simularPartida = (estadoOriginal, movimientoInicial, jugadorInicial) => {
    const estado = [...estadoOriginal];
    estado[movimientoInicial] = jugadorInicial;
    let turno = jugadorInicial === "montecarlo" ? "CPU" : "montecarlo";

    while (true) {
        const libres = estado.map((v, i) => v === null ? i : null).filter(i => i !== null);
        if (libres.length === 0) return false;

        const movimiento = libres[Math.floor(Math.random() * libres.length)];
        estado[movimiento] = turno;

        if (combinacionGanadoraSimulada(estado, turno)) {
            return turno === "montecarlo";
        }
        turno = turno === "montecarlo" ? "CPU" : "montecarlo";
    }
};

const combinacionGanadoraSimulada = (estado, jugador) => {
    const combinaciones = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return combinaciones.some(([a, b, c]) =>
        estado[a] === jugador && estado[b] === jugador && estado[c] === jugador
    );
};

const turnoMonteCarlo = () => {
    const posicionesLibres = estadoTablero
        .map((valor, i) => valor === null ? i : null)
        .filter(i => i !== null);
    if (posicionesLibres.length === 0) return;

    const mejorMovimiento = monteCarloTreeSearch(estadoTablero, "montecarlo");
    estadoTablero[mejorMovimiento] = "montecarlo";
    botones[mejorMovimiento].textContent = "X";
    botones[mejorMovimiento].style.backgroundColor = "#5A9BD5";

    if (verificarGanador()) {
        setTimeout(() => anunciarGanador("montecarlo"), 100);
    } else if (estadoTablero.every(celda => celda)) {
        setTimeout(() => anunciarEmpate(), 100);
    } else {
        setTimeout(turnoCPU, 400);
    }
};

// 🚀 CPU inteligente con reglas + heurística
const turnoCPU = () => {
    const posicionesLibres = estadoTablero
        .map((valor, i) => valor === null ? i : null)
        .filter(i => i !== null);

    if (posicionesLibres.length === 0) return;

    // 1. ¿Puede ganar la CPU?
    let jugada = encontrarJugadaGanadora("CPU");
    if (jugada !== null) return jugarCPUEn(jugada);

    // 2. ¿Puede ganar el jugador? (bloquear)
    jugada = encontrarJugadaGanadora(nombreJugador);
    if (jugada !== null) return jugarCPUEn(jugada);

    // 3. Centro libre → ocúpalo
    if (estadoTablero[4] === null) return jugarCPUEn(4);

    // 4. Heurística: preferir esquinas > laterales
    const puntuacion = [3, 2, 3, 2, 4, 2, 3, 2, 3];
    posicionesLibres.sort((a, b) => puntuacion[b] - puntuacion[a]);
    jugarCPUEn(posicionesLibres[0]);
};

const jugarCPUEn = (indice) => {
    estadoTablero[indice] = "CPU";
    botones[indice].textContent = "O";
    botones[indice].style.backgroundColor = "#EA711B";

    if (verificarGanador()) {
        setTimeout(() => anunciarGanador("CPU"), 100);
    } else if (estadoTablero.every(celda => celda)) {
        setTimeout(() => anunciarEmpate(), 100);
    } else if (esMonteCarlo) {
        setTimeout(turnoMonteCarlo, 400); // 👈 AÑADE ESTO AQUÍ
    }
};

// 🧩 Detectar si alguien está a punto de ganar
const encontrarJugadaGanadora = (jugador) => {
    const combinacionesGanadoras = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];

    for (let combinacion of combinacionesGanadoras) {
        const [a, b, c] = combinacion;
        const valores = [estadoTablero[a], estadoTablero[b], estadoTablero[c]];
        const cantidadJugador = valores.filter(v => v === jugador).length;
        const cantidadVacio = valores.filter(v => v === null).length;

        if (cantidadJugador === 2 && cantidadVacio === 1) {
            return combinacion.find(i => estadoTablero[i] === null);
        }
    }
    return null;
};

const verificarGanador = () => {
    const combinacionesGanadoras = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return combinacionesGanadoras.some(([a, b, c]) =>
        estadoTablero[a] &&
        estadoTablero[a] === estadoTablero[b] &&
        estadoTablero[a] === estadoTablero[c]
    );
};

const anunciarGanador = (ganador) => {
    alert(`¡${ganador} ha ganado!`);
    if (ganador === nombreJugador) victoriasJugador++;
    else victoriasCPU++;

    if (esMonteCarlo) partidasMonteCarlo++;
    actualizarMarcador();

    if (esMonteCarlo && partidasMonteCarlo >= 3) {
        alert("Monte Carlo ha jugado 3 partidas. ¿Quieres tomar el relevo?");
        pedirNombre();
    } else {
        reiniciarJuego();
        if (esMonteCarlo) {
            setTimeout(turnoMonteCarlo, 500);
        }
    }
};


const anunciarEmpate = () => {
    alert("¡Empate!");

    if (esMonteCarlo) partidasMonteCarlo++;
    actualizarMarcador();

    if (esMonteCarlo && partidasMonteCarlo >= 3) {
        alert("Monte Carlo ha jugado 3 partidas. ¿Quieres tomar el relevo?");
        pedirNombre();
    } else {
        reiniciarJuego();
        if (esMonteCarlo) {
            setTimeout(turnoMonteCarlo, 500);
        }
    }
};

const reiniciarJuego = () => {
    estadoTablero = new Array(9).fill(null);
    botones.forEach(btn => {
        btn.style.backgroundColor = '';
        btn.textContent = '';
    });
};

const actualizarMarcador = () => {
    marcador.innerHTML = `${nombreJugador}: ${victoriasJugador} | CPU: ${victoriasCPU}`;
};

botones.forEach((boton, indice) => {
    boton.addEventListener('click', (e) => manejarClick(e, indice));
});

botonReiniciar.addEventListener('click', pedirNombre);

// ✅ Esto hace que el juego empiece bien al cargar:
pedirNombre();