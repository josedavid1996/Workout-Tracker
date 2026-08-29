# Figma Reference — Workout Tracker

Referencia de diseño real (Figma, no wireframe) para reconstruir visualmente las 9 pantallas de la app, reemplazando el layout genérico construido en PR3-PR5. Paleta y tipografía reales ya aplicadas en `src/index.css` (background `#0f172a`, accent azul `#2563eb`, Poppins/Roboto/JetBrains Mono).

Fuente: Figma file "IA-Proyects" (`0gmnHqH21CxFTfS1urK2Me`), sección "App GYM" (node `16:1585`).

| # | Pantalla | Archivo | Assets de ícono |
|---|---|---|---|
| 01 | Home (dashboard + saludo + card "hoy toca" + stats + racha + actividad reciente) | [01-home.md](./01-home.md) | reusa nav/play/plus/decor-rings, sin nuevos |
| 02 | Lista de rutinas | [02-lista-rutinas.md](./02-lista-rutinas.md) | 12 |
| 03 | Crear / editar rutina | [03-crear-editar-rutina.md](./03-crear-editar-rutina.md) | 5 nuevos + 3 reusados |
| 04 | Selector de ejercicio (overlay, usado por rutinas y por sesión de workout) | [04-selector-ejercicio.md](./04-selector-ejercicio.md) | 16 nuevos + 1 reusado (fetch truncado en variantes secundarias Loading/Sin-resultados, variante principal completa) |
| 05 | Iniciar workout (freestyle o rutina) | [05-iniciar-workout.md](./05-iniciar-workout.md) | 4 nuevos + 2 reusados |
| 06 | Sesión activa (logging de sets, SIN timers) | [06-sesion-activa.md](./06-sesion-activa.md) | 8 nuevos + 4 reusados (fetch truncado, faltan posibles variantes adicionales no vistas) |
| 07 | Resumen post-workout | [07-resumen-post-workout.md](./07-resumen-post-workout.md) | 2 nuevos + 4 reusados (nota: reuso de decor-rings/check-large asumido visualmente idéntico a 05/06, no verificado byte a byte) |
| 08 | Historial general (heatmap mensual tipo GitHub) | [08-historial-general.md](./08-historial-general.md) | 1 nuevo + 5 reusados |
| 09 | Detalle de ejercicio (stats + chart + registro histórico, SIN tabs separados) | [09-detalle-ejercicio.md](./09-detalle-ejercicio.md) | 3 nuevos + 4 reusados (el chart es una imagen rasterizada de referencia, no vectores — construir con Recharts real) |

## Assets descargados

51 archivos SVG en `src/assets/icons/`, nombrados descriptivamente (no `icon1.svg`/`icon2.svg`). Cada doc de pantalla documenta qué constante de Figma corresponde a qué archivo local. Los íconos de status bar (señal/wifi/batería) y de bottom nav (Home/Rutinas/Iniciar/Historial/Perfil) se repiten en casi todas las pantallas — están descargados una sola vez y reusados.

## Decisiones/hallazgos que cruzan varias pantallas

- **Paleta real**: `#0f172a` (bg), `#1e293b` (surface), `#334155` (border), `#e1e2ed` (texto), `#94a3b8` (muted), `#2563eb` (accent azul), `#5fa777` (positivo), `#b4c5ff` (dato/highlight). Reemplaza el brief original (dorado/brass) — decisión ya tomada por el usuario tras ver el resultado.
- **Tipografía real**: Poppins (Bold/ExtraBold, títulos uppercase), Roboto (Regular/SemiBold, body), JetBrains Mono (datos numéricos, fechas, labels técnicos) — reemplaza Barlow Condensed/Inter del brief original.
- **Motivo de círculos concéntricos** (mencionado en el brief como signature exclusiva del dorado) SÍ aparece en el diseño real (Home, card Freestyle, Resumen) pero en azul — es parte del diseño real, no exclusivo de una paleta.
- **Estados por pantalla**: cada pantalla tiene 2-4 variantes (con datos / vacío / loading / error) ya diseñadas — implementarlas todas, no solo el happy path.
- **09 (detalle de ejercicio)**: el Figma NO separa en tabs History/Chart/Records — todo convive en una sola vista con scroll. Esto es distinto de lo ya implementado en PR5 (que sí tiene 3 tabs) — decisión de layout pendiente de confirmar con el usuario/orquestador antes de reimplementar.
- **07 (resumen)**: el grid de stats no incluye un tile de "Duración" explícito — verificar si hace falta agregarlo o si la fecha en el header alcanza.
- **04 (selector de ejercicio)**: agrupa el campo `equipment` real de la tabla `exercises` en 6 categorías visuales con ícono — este mapeo (valor crudo → categoría+ícono) no existe todavía en el código y hay que definirlo.

## Problemas encontrados

- Ningún nodeId falló completamente — los 8 fetches (02-09) devolvieron contenido usable.
- 2 fetches (04 y 06) se truncaron por el límite de 25k tokens de la tool antes de completar el detalle fino de variantes secundarias (Loading/Sin-resultados en 04; posibles variantes adicionales no vistas en 06) — la variante principal "con datos" de ambas quedó completa en los dos casos, que es la que más importa para implementar.
- Todos los 51 assets de ícono referenciados se descargaron sin errores.
