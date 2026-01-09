/* app.js — Campeonato eFootball 2026
   - Fuente de datos: results.json (misma carpeta)
   - Regla: si el partido es intra-participante (BJV/CLT/ROA) y score = "-", se define Empate automático (1-1)
*/

const DATA_URL = "results.json";

document.addEventListener("DOMContentLoaded", () => {
  init().catch(err => renderFatal(err));
});

async function init() {
  const data = await loadJson(DATA_URL);

  const normalized = normalizeData(data);
  const withAuto = applyAutoDraws(normalized);

  const standings = computeStandings(withAuto);

  renderLastUpdated(withAuto.lastUpdated);
  renderStandings(standings);
  renderMatchdays(withAuto);
}

/* =========================
   Utilidades
========================= */

function deepClone(obj) {
  // Fallback para navegadores sin structuredClone (móvil)
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

function normalizeTeamName(name) {
  // Normaliza espacios y guiones para evitar fallas por formatos distintos
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—]\s*/g, " - ")
    .trim();
}

/* =========================
   Carga/normalización
========================= */

async function loadJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url}. HTTP ${res.status}`);
  return await res.json();
}

function normalizeData(data) {
  const safe = deepClone(data ?? {});
  safe.lastUpdated = String(safe.lastUpdated ?? "").trim();

  if (!Array.isArray(safe.matchdays)) safe.matchdays = [];
  safe.matchdays = safe.matchdays.map(md => ({
    name: String(md?.name ?? "Jornada").trim(),
    matches: Array.isArray(md?.matches)
      ? md.matches.map(m => ({
          home: normalizeTeamName(m?.home),
          away: normalizeTeamName(m?.away),
          score: String(m?.score ?? "-").trim()
        }))
      : []
  }));

  // standings base (si existe) solo se usa para listar equipos; el cálculo se hace desde matchdays
  if (!Array.isArray(safe.standings)) safe.standings = [];
  safe.standings = safe.standings
    .map(s => ({ ...s, name: normalizeTeamName(s?.name) }))
    .filter(s => s.name);

  return safe;
}

/* =========================
   Regla: Empate automático
========================= */

function applyAutoDraws(data) {
  const out = deepClone(data);

  for (const md of out.matchdays) {
    for (const m of md.matches) {
      const pHome = participantOf(m.home);
      const pAway = participantOf(m.away);
      const intra = pHome && pAway && pHome === pAway;

      if (intra) {
        const s = String(m.score ?? "-").trim();
        if (s === "-" || s === "") {
          m.score = "Empate automático (1-1)";
        }
      }
    }
  }
  return out;
}

function participantOf(teamName) {
  // Acepta "BJV - FRANCIA", "BJV- FRANCIA", "BJV – FRANCIA"
  const t = normalizeTeamName(teamName);
  const m = t.match(/^(BJV|CLT|ROA)\s*-\s*/i);
  return m ? m[1].toUpperCase() : "";
}

/* =========================
   Parseo de marcadores
========================= */

function parseScore(scoreStr) {
  const s = String(scoreStr ?? "").trim();
  if (!s || s === "-") return null;

  // (x-y)
  const paren = s.match(/\((\d+)\s*[-:–—]\s*(\d+)\)/);
  if (paren) return { gf: Number(paren[1]), gc: Number(paren[2]), label: s };

  // x-y / x:y / x–y
  const plain = s.match(/^(\d+)\s*[-:–—]\s*(\d+)$/);
  if (plain) return { gf: Number(plain[1]), gc: Number(plain[2]), label: s };

  // Si hay texto pero no se puede calcular, devolvemos null (no suma puntos),
  // pero se mostrará en UI como texto literal.
  return null;
}

function hasAnyScore(scoreStr) {
  const s = String(scoreStr ?? "").trim();
  return s !== "" && s !== "-";
}

/* =========================
   Cálculo de posiciones
========================= */

function computeStandings(data) {
  const teams = new Set();

  for (const s of (data.standings || [])) teams.add(s.name);

  for (const md of data.matchdays) {
    for (const m of md.matches) {
      if (m.home) teams.add(m.home);
      if (m.away) teams.add(m.away);
    }
  }

  const table = {};
  for (const name of teams) {
    table[name] = { name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  }

  for (const md of data.matchdays) {
    for (const m of md.matches) {
      const home = m.home;
      const away = m.away;
      if (!table[home] || !table[away]) continue;

      const parsed = parseScore(m.score);
      if (!parsed) continue; // no computa tabla si no hay marcador parseable

      const hg = parsed.gf;
      const ag = parsed.gc;

      table[home].pj += 1;
      table[away].pj += 1;

      table[home].gf += hg;
      table[home].gc += ag;

      table[away].gf += ag;
      table[away].gc += hg;

      if (hg > ag) {
        table[home].pg += 1;
        table[away].pp += 1;
        table[home].pts += 3;
      } else if (hg < ag) {
        table[away].pg += 1;
        table[home].pp += 1;
        table[away].pts += 3;
      } else {
        table[home].pe += 1;
        table[away].pe += 1;
        table[home].pts += 1;
        table[away].pts += 1;
      }
    }
  }

  const arr = Object.values(table).map(x => ({ ...x, dg: x.gf - x.gc }));

  arr.sort((a, b) =>
    b.pts - a.pts ||
    b.dg - a.dg ||
    b.gf - a.gf ||
    a.name.localeCompare(b.name, "es")
  );

  arr.forEach((x, i) => (x.pos = i + 1));
  return arr;
}

/* =========================
   Render UI
========================= */

function renderLastUpdated(lastUpdated) {
  const el = document.getElementById("lastUpdated");
  if (!el) return;
  el.textContent = lastUpdated ? `Actualizado: ${lastUpdated}` : "Actualización: N/D";
}

function renderStandings(rows) {
  const root = document.getElementById("standings");
  if (!root) return;

  if (!rows.length) {
    root.innerHTML = `<div class="muted">Sin equipos para mostrar.</div>`;
    return;
  }

  root.innerHTML = `
    <table aria-label="Tabla de posiciones">
      <thead>
        <tr>
          <th>Pos</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PE</th><th>PP</th>
          <th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(r => `
            <tr>
              <td>${r.pos}</td>
              <td>${escapeHtml(r.name)}</td>
              <td>${r.pj}</td>
              <td>${r.pg}</td>
              <td>${r.pe}</td>
              <td>${r.pp}</td>
              <td>${r.gf}</td>
              <td>${r.gc}</td>
              <td>${r.dg}</td>
              <td>${r.pts}</td>
            </tr>
          `)
          .join("")}
      </tbody>
    </table>
  `;
}

function renderMatchdays(data) {
  const root = document.getElementById("matchdays");
  if (!root) return;

  root.innerHTML = `
    <div class="grid">
      ${(data.matchdays || [])
        .map(md => {
          // "Registrados" = tiene texto distinto de "-"
          const registered = (md.matches || []).filter(m => hasAnyScore(m.score)).length;
          // "Computables" = parseables para tabla
          const computable = (md.matches || []).filter(m => !!parseScore(m.score)).length;
          const total = (md.matches || []).length;

          return `
            <details class="matchday" open>
              <summary class="row" role="listitem" aria-label="${escapeHtml(md.name)}">
                <span>${escapeHtml(md.name)}</span>
                <span class="badge">${computable}/${registered}/${total}</span>
              </summary>

              <div style="margin-top:10px;">
                ${(md.matches || []).map(m => renderMatch(m)).join("")}
              </div>

              <div class="muted" style="font-size:12px; margin-top:10px;">
                Leyenda: computables/registrados/total
              </div>
            </details>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderMatch(m) {
  const parsed = parseScore(m.score);
  const scoreRaw = String(m.score ?? "-").trim() || "-";

  const isAuto = scoreRaw.toLowerCase().includes("empate automático");
  const isInvalid = hasAnyScore(scoreRaw) && !parsed && scoreRaw !== "-";

  const badgeAuto = isAuto ? `<span class="badge">AUTO</span>` : "";
  const badgeInv = isInvalid ? `<span class="badge">FORMATO</span>` : "";

  // Importante: aquí se muestra SIEMPRE el texto del score (aunque no sea computable)
  return `
    <div class="row" style="padding:10px 0; border-bottom:1px solid rgba(31,42,58,.6);">
      <div style="min-width:0;">
        <div style="font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${escapeHtml(m.home)} vs ${escapeHtml(m.away)}
        </div>
        <div class="muted" style="font-size:12px; margin-top:2px;">
          ${escapeHtml(scoreRaw)}
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        ${badgeAuto}${badgeInv}
      </div>
    </div>
  `;
}

function renderFatal(err) {
  const main = document.getElementById("main");
  if (!main) return;

  main.innerHTML = `
    <section class="card">
      <h2>Error de carga</h2>
      <p class="muted">No se pudo generar la tabla de posiciones ni los resultados.</p>
      <pre style="white-space:pre-wrap; overflow:auto; border:1px solid rgba(31,42,58,.8); padding:12px; border-radius:10px;">${escapeHtml(String(err?.message || err))}</pre>
      <p class="muted">Verifique que results.json exista en la raíz del repositorio y que el sitio se ejecute por HTTP (GitHub Pages / http.server).</p>
    </section>
  `;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
