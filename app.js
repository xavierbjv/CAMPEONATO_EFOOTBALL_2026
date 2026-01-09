fetch("results.json")
    .then(res => res.json())
    .then(data => {
        renderPartidos(data);
        renderPosiciones(data);
    })
    .catch(err => console.error("Error cargando resultados:", err));

function renderPartidos(partidos) {
    const tbody = document.querySelector("#tabla-partidos tbody");
    tbody.innerHTML = "";

    partidos.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.fecha}</td>
            <td>${p.local}</td>
            <td>${p.goles_local} - ${p.goles_visitante}</td>
            <td>${p.visitante}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPosiciones(partidos) {
    const equipos = {};

    partidos.forEach(p => {
        inicializarEquipo(equipos, p.local);
        inicializarEquipo(equipos, p.visitante);

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

    const tbody = document.querySelector("#tabla-posiciones tbody");
    tbody.innerHTML = "";

    Object.entries(equipos)
        .sort((a, b) => b[1].pts - a[1].pts)
        .forEach(([nombre, e]) => {
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
}

function inicializarEquipo(obj, nombre) {
    if (!obj[nombre]) {
        obj[nombre] = { pj: 0, pg: 0, pe: 0, pp: 0, pts: 0 };
    }
}
