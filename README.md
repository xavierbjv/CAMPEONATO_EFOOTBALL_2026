# CAMPEONATO_EFOOTBALL_2026

Sitio web para publicar los resultados y tabla de posiciones del Campeonato eFootball 2026.

## Objetivo
- Publicación pública (GitHub Pages) de tabla de posiciones y resultados por jornada.
- Actualización simple mediante edición de `results.json`.

## Componentes
- `index.html`: interfaz principal.
- `styles.css`: estilos.
- `app.js`: lógica de renderizado y cálculo de tabla (incluye reglas automáticas).
- `results.json`: datos del campeonato (fixture, resultados, standings base).
- `assets/`: imágenes (banner, logo, evidencias).

## Reglas de puntuación
- Victoria: 3 puntos
- Empate: 1 punto
- Derrota: 0 puntos

### Empate automático intra-participante
Cuando el partido es entre equipos del mismo participante (prefijo BJV, CLT o ROA) y el marcador está en `"-"`, el sistema lo registra como:
- Empate automático (1-1)
- 1 punto por equipo
- Se contabiliza PJ, GF y GC

Nota: Esto permite resolver partidos internos sin ejecución real del encuentro.

## Publicación (GitHub Pages)
1. Settings → Pages
2. Build and deployment:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /(root)
3. Guardar y validar la URL publicada.

## Ejecución local (Codespaces / Linux)
```bash
python3 -m http.server 8000
