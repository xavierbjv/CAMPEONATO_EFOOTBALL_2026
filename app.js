async function loadResults() {
  const res = await fetch("./results.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar results.json");
  return await res.json();
}

function getOwner(teamName) {
  // "BJV - FRANCIA" => "BJV"
  // "ROA - REAL MADRID" => "ROA"
  const parts = teamName.split(" - ");
  return (parts[0] || teamName).trim();
}

function isIntraParticipant(home, away) {
  return getOwner(home) === getOwner(away);
}

function ensureAutoDraw(match) {
  // Si es intra-participante y aún no se registra marcador, forzar empate 1-1
  if (match.score === "-" && isIntraParticipant(match.home, match.away)) {
    match.score = "Empate automático (1-1)";
    match._auto = true; // marca interna (no se guarda en JSON)
  }
}

function parseScore(scoreStr) {
  if (!scoreStr || scoreStr.trim() === "-" ) return null;

  // Captura el primer "n-n" o "n:n" (por ejemplo: "2-1", "Empate automático (1-1)")
  const m = scoreStr.match(/(\d+)\s*[-:]\s*(\d+)/);
  if (!m) return null;

  return { home: parseInt(m[1], 10), away: parseInt(m[2], 10) };
}

function initTeams(data) {
  // Prioriza data.standings (lista oficial), si no existe, deriva desde matches
  const names = [];

  if (Array.isArray(data.standings) && data.standings.length) {
    for (const t of data.standings) names.push(t.name);
  } else {
    const set = new Set();
    for (const md of (data.matchdays || [])) {
      for (const m of (md.matches || [])) {
        set.add(m.home);
        set.add(m.away);
      }
    }
    names.push(...set);
  }

  const table = new Map();
  for (const name of names) {
    table.set(name, {
      name,
      pj: 0, pg: 0, pe: 0, pp: 0,
      gf: 0, gc: 0, pts: 0
    });
  }
  return table;
}

function computeStandings(data) {
  const table = initTeams(data);

  for (const md of (data.matchdays || [])) {
    for (const match of (md.matches || [])) {
      ensureAutoDraw(match);

      const score = parseScore(match.score);
      if (!score) continue;

      const home = table.get(match.home);
      const away = table.get(match.away);
      if (!home || !away) continue;

      // PJ + goles
      home.pj += 1;
      away.pj += 1;
      home.gf += score.home;
      home.gc += score.away;
      away.gf += score.away;
      away.gc += score.home;

      // Resultado
      if (score.home > score.away) {
        home.pg += 1; home.pts += 3;
        away.pp += 1;
      } else if (score.home < score.away) {
        away.pg += 1; away.pts += 3;
        home.pp += 1;
      } else {
        home.pe += 1; home.pts += 1;
        away.pe += 1; away.pts += 1;
      }
    }
  }

  // Orden: pts desc, diferencia (gf-gc) desc, gf desc, nombre asc
  const arr = Array.from(table.values());
  arr.sort((a, b) => {
    const gdA = a.gf - a.gc;
    const gdB = b.gf - b.gc;
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  // Asignar posiciones
  return arr.map((t, i) => ({
    pos: i + 1,
    ...t
  }));
}

function renderStandingsTable(standings) {
  const rows = standings.map(r => `
    <tr>
      <td>${r.pos}</td>
      <td>${r.name}</td>
      <td>${r.pj}</td>
      <td>${r.pg}</td>
      <td>${r.pe}</td>
      <td>${r.pp}</td>
      <td>${r.gf}</td>
      <td>${r.gc}</td>
      <td>${r.pts}</td>
    </tr>
  `).join("");

  return `
    <table>
      <thead>
        <tr>
          <th>Pos</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>PTS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMatchdays(data) {
  return `
    <div class="grid">
      ${(data.matchdays || []).map(md => `
        <div class="matchday">
          <div class="row">
            <div><strong>${md.name}</strong></div>
            <span class="badge">${(md.matches || []).length} partidos</span>
          </div>
          <div style="margin-top:10px;">
            ${(md.matches || []).map(m => `
              <div class="row" style="padding:8px 0; border-bottom:1px solid #1f2a3a;">
                <div>${m.home} vs ${m.away}</div>
                <div class="score">${m.score}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

(async () => {
  try {
    const data = await loadResults();

    // 1) Aplicar empates automáticos intra-participante (si score="-")
    for (const md of (data.matchdays || [])) {
      for (const m of (md.matches || [])) ensureAutoDraw(m);
    }

    // 2) Recalcular tabla desde partidos (incluye empates automáticos)
    const standings = computeStandings(data);

    document.getElementById("standings").innerHTML = renderStandingsTable(standings);
    document.getElementById("matchdays").innerHTML = renderMatchdays(data);

    const ruleNote = "Regla: partidos intra-participante → empate automático (1-1) y 1 punto por equipo.";
    document.getElementById("lastUpdated").textContent =
      `Última actualización (datos): ${data.lastUpdated} | ${ruleNote}`;

  } catch (e) {
    document.getElementById("standings").innerHTML = `<p class="muted">Error: ${e.message}</p>`;
    document.getElementById("matchdays").innerHTML = "";
  }
})();
