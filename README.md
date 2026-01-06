# CAMPEONATO_EFOOTBALL_2026

Sitio web para publicar los resultados y tabla de posiciones del **Campeonato eFootball 2026**.

## Objetivo
- Publicar de forma pública (GitHub Pages) la **tabla de posiciones** y los **resultados por jornada**.
- Centralizar el calendario y permitir actualización simple mediante edición de `results.json`.

## Componentes
- `index.html`: interfaz principal.
- `styles.css`: estilos.
- `app.js`: lógica de renderizado y cálculo de tabla (incluye reglas automáticas).
- `results.json`: datos del campeonato (fixture, resultados, standings base).

## Reglas de puntuación
- Victoria: **3 puntos**
- Empate: **1 punto**
- Derrota: **0 puntos**

### Empate automático intra-participante
Cuando el partido es entre equipos del mismo participante (prefijo **BJV**, **CLT** o **ROA**) y el marcador está en `"-"`, el sistema lo registra como:

- **Empate automático (1-1)**  
- Se asigna **1 punto a cada equipo**  
- Se contabiliza **PJ, GF y GC** (1 y 1)

> Nota: Esto permite resolver partidos “internos” sin ejecución real del encuentro.

## Publicación (GitHub Pages)
1. Ir a **Settings → Pages**
2. En **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
3. Guardar y esperar el despliegue.
4. URL típica:
   - `https://xavierbjv.github.io/CAMPEONATO_EFOOTBALL_2026/`

## Ejecución local (Codespaces / Linux)
Para pruebas:
```b
