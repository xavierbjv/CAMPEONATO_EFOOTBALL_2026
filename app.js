fetch("results.json")
    .then(r => r.json())
    .then(data => {
        renderPartidos(data);
        renderPosiciones(data);
    })
    .catch(err => console.error("Error cargando datos:", err));

/* =========================
   PARTIDOS JUGADOS / PENDIENTES
   ========================= */
function renderPartidos(partidos) {

    const tbodyJugados = document.querySelector("#tabla-jugados tbody");
    const tbodyPendientes = document.querySelector("#tabla-pendientes tbody");

    tbodyJugados.innerHTML = "";
    tbodyPendientes.innerHTML = "";

    const jugadosPorFecha = {};

    // 1. Clasificar partidos
    partidos.forEach(p => {
        const jugado = p.goles_local !== null && p.goles_visitante !== null;

        if (jugado) {
            const fechaReal = p.fecha_real ?? "SIN FECHA";

            if (!jugadosPorFecha[fechaReal]) {
                jugadosPorFecha[fechaReal] = [];
            }
            jugadosPorFecha[fechaReal].push(p);
        } else {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.fecha}</td>
                <td>${p.local}</td>
                <td>⏳ Pendiente</td>
                <td>${p.visitante}</td>
            `;
            tbodyPendientes.appendChild(tr);
        }
    });

    // 2. Pintar tabla agrupada
    Object.keys(jugadosPorFecha)
        .sort()
        .forEach(fechaReal => {

            /* Fila separadora por fecha real */
            const trFecha = document.createElement("tr");
            trFecha.classList.add("fila-fecha");
            trFecha.innerHTML = `
                <td colspan="4">Partidos Jugados – ${fechaReal}</td>
            `;
            tbodyJugados.appendChild(trFecha);

            /* Partidos de esa fecha */
            jugadosPorFecha[fechaReal].forEach(p => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${p.fecha}</td>
                    <td>${p.local}</td>
                    <td>${p.goles_local} - ${p.goles_visitante}</td>
                    <td>${p.visitante}</td>
                `;
                tbodyJugados.appendChild(tr);
            });
        });
}

/* =========================
   TABLA DE POSICIONES + RESUMEN
   ========================= */
function renderPosiciones(partidos) {
    const equipos = {};

    partidos.forEach(p => {
        inicializarEquipo(equipos, p.local);
        inicializarEquipo(equipos, p.visitante);

        const jugado = p.goles_local !== null && p.goles_visitante !== null;
        if (!jugado) return;

        equipos[p.local].pj++;
        equipos[p.visitante].pj++;

        if (p.goles_local > p.goles_visitante) {
            equipos[p.local].pg++;
            equipos[p.local].pts += 3;
            equipos[p.visitante].pp++;
        } else if (p.goles_local < p.goles_visitante) {
            equipos[p.visitante].pg++;
            equipos[p.visitante].pts += 3;
            equipos[p.local].pp++;
        } else {
            equipos[p.local].pe++;
            equipos[p.visitante].pe++;
            equipos[p.local].pts += 1;
            equipos[p.visitante].pts += 1;
        }
    });

    /* 👉 CLAVE: guardar tabla ordenada */
    const ordenados = Object.entries(equipos)
        .sort((a, b) => b[1].pts - a[1].pts);

    const tbody = document.querySelector("#tabla-posiciones tbody");
    tbody.innerHTML = "";

    ordenados.forEach(([nombre, e]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nombre}</td>
            <td>${e.pj}</td>
            <td>${e.pg}</td>
            <td>${e.pe}</td>
            <td>${e.pp}</td>
            <td>${e.pts}</td>
        `;
        tbody.appendChild(tr);
    });

    /* 👉 AHORA sí funciona */
    renderResumenCompetidores(ordenados);
}

/* =========================
   RESUMEN BJV / CLT / ROA
   ========================= */
function renderResumenCompetidores(tablaOrdenada) {
    const totales = { BJV: 0, CLT: 0, ROA: 0 };

    tablaOrdenada.forEach(([equipo, datos]) => {
        const competidor = equipo.split(" - ")[0];
        if (totales.hasOwnProperty(competidor)) {
            totales[competidor] += datos.pts;
        }
    });

    const max = Math.max(totales.BJV, totales.CLT, totales.ROA);

    Object.entries(totales).forEach(([key, puntos]) => {
        const contenedor = document.getElementById(key);
        if (!contenedor) return;

        contenedor.querySelector(".pts").textContent = puntos;
        contenedor.querySelector(".progreso").style.width =
            max > 0 ? (puntos / max) * 100 + "%" : "0%";
    });
}

/* =========================
   INICIALIZACIÓN DE EQUIPO
   ========================= */
function inicializarEquipo(obj, nombre) {
    if (!obj[nombre]) {
        obj[nombre] = {
            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,
            pts: 0
        };
    }
}
