async function loadResults() {
  const res = await fetch("./results.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar results.json");
  return await res.json();
}

function renderStandings(data) {
  const rows = data.standings.map(r => `
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
          <th>Pos</th><th>Participante</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th><th>GF</th><th>GC</th><th>PTS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMatchdays(data) {
  return `
    <div class="grid">
      ${data.matchdays.map(md => `
        <div class="matchday">
          <div class="row">
            <div><strong>${md.name}</strong></div>
            <span class="badge">${md.matches.length} partidos</span>
          </div>
          <div style="margin-top:10px;">
            ${md.matches.map(m => `
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
    document.getElementById("standings").innerHTML = renderStandings(data);
    document.getElementById("matchdays").innerHTML = renderMatchdays(data);
    document.getElementById("lastUpdated").textContent = `Última actualización: ${data.lastUpdated}`;
  } catch (e) {
    document.getElementById("standings").innerHTML = `<p class="muted">Error: ${e.message}</p>`;
    document.getElementById("matchdays").innerHTML = "";
  }
})();