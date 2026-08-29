# 07 · Resumen post-workout

Figma node: `16:3926` (Section, completo). Ruta app: `/workout/:id/summary`.

## Variantes
- **Con datos** (`16:3936`): header con gradiente + círculo verde check + "WORKOUT COMPLETADO" + nombre + fecha, grid 2×2 de stat-tiles (Ejercicios/Volumen/Sets/PRs nuevos), banner "Nuevo PR" (Press banca · 85kg×6), sección "Por ejercicio" con lista de filas (nombre + "N SETS · TOP peso×reps" + volumen del ejercicio), footer con botón secundario de compartir (ícono solo) + botón azul ancho "Guardar workout".
- **Loading — calculando** (`16:4079`): mismo header con skeletons animados (gradiente diagonal) en vez de datos reales, grid de 4 skeletons, texto "CALCULANDO MÉTRICAS…" con spinner circular.

## Estructura
- Header: fondo con gradiente diagonal `#1e293b→#0f172a`, círculo verde 48px con check grande, label mono verde "WORKOUT COMPLETADO", nombre de la rutina/freestyle (Poppins ExtraBold 34px uppercase), fecha en mono gris.
- Grid 2×2 de stat-tiles `bg-surface border-border rounded-xl`: valor grande (mono bold, 24px) + label pequeño debajo (mono uppercase gris). El de "PRS NUEVOS" tiene el valor en verde si es > 0.
- Banner "Nuevo PR" (solo si hubo al menos un PR): fondo azul translúcido, ícono trofeo/flecha, título "NUEVO PR" en color `data`, detalle "Ejercicio · peso×reps".
- Sección "Por ejercicio": título mono uppercase gris, lista de filas `bg-surface border-border rounded-xl` con nombre + "N SETS · TOP peso×reps" a la izquierda, volumen total de ese ejercicio (número plano) a la derecha.
- Footer: botón cuadrado secundario (ícono compartir) + botón azul ancho "Guardar workout".
- Estado loading: header con skeleton shapes (círculo, 2 barras) en vez de datos reales, grid de 4 tiles skeleton, indicador "CALCULANDO MÉTRICAS…" con spinner, una barra skeleton más abajo (placeholder de la sección por-ejercicio).

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-decor-rings.svg` | Reusa el de 05 — círculos decorativos de fondo en el header |
| imgIcon1 | `icon-check-large.svg` | Reusa el de 06 — check dentro del círculo verde |
| imgIcon2 | `icon-pr-trophy.svg` | Ícono en el banner "Nuevo PR" |
| imgIcon3 | `icon-share.svg` | Ícono compartir en el botón secundario del footer |
| imgIcon4/5/6 | status bar | Reusar de pantallas previas |

## Notas de implementación
- Ya existe `workout-summary-page.tsx` (PR5) con duración/volumen/sets/breakdown por ejercicio — falta el estilo visual: header con gradiente + ícono de completado, grid 2×2 en vez de lista simple, banner de "Nuevo PR" (detectar si algún set de la sesión superó el 1RM histórico previo del ejercicio — reusar `estimateOneRm`/`records.ts` de PR2), y el botón de compartir (puede quedar como placeholder sin funcionalidad real si compartir no está en alcance).
- Nota: el diseño muestra "DURACIÓN" implícitamente ausente del grid visible (los 4 tiles son Ejercicios/Volumen/Sets/PRs, no Duración) — la duración aparece en la fecha del header ("LUN 6 JUL") pero no como stat-tile numérica. Confirmar si esto reemplaza al requirement de mostrar duración explícita, o si duración va en un 5to tile que no se alcanzó a ver — mejor no asumir y preguntar si hace falta agregar un tile de duración que el Figma no muestra.
