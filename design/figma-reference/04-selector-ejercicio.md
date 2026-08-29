# 04 · Selector de ejercicio

Figma node: `16:2992` (Section). Overlay embebido (Sheet), no ruta propia — usado desde routine-form y desde workout-session.

Nota: el fetch de este node se truncó por tamaño (25k tokens) antes de completar el detalle fino de las variantes "Loading" y "Vacío — sin resultados"; la variante principal "Con datos + relacionados" quedó completa. Si hace falta pixel-detail de esas 2 variantes secundarias, volver a pedir el node con `get_design_context` apuntando directo a sus Container hijos (`16:3252` loading, `16:3310` sin resultados).

## Variantes
- **Con datos + relacionados** (`16:3002`, completa): header back + título "AGREGAR EJERCICIO", buscador, chips "PARTE DEL CUERPO · 10" (Pecho activo + Espalda/Hombros/Brazos/Antebrazos/Piernas/Pantorrillas/Core/Cuello/Cardio), chips "EQUIPO · 6 GRUPOS" (Peso libre activo, con ícono + Máquina/Cable/Peso corporal/Cardio/Accesorio), contador "48 RESULTADOS · pecho", lista de resultados con un item seleccionado (borde `data`), bloque "RELACIONADOS · muscle_group: pectorals · LIMIT 6" con 3 items compactos + botón + cada uno, footer con botón "Agregar 1 ejercicio".
- **Loading** (`16:3261`, parcial): mismo header/buscador con texto tecleado, filas skeleton (gradiente diagonal animado) en vez de chips/resultados.
- **Vacío — sin resultados** (`16:3319`, parcial): buscador con texto + botón X limpiar, ilustración de lupa en círculo, "Sin resultados", texto, botón "Limpiar búsqueda y filtros".

## Estructura (variante principal)
- Header: back + "AGREGAR EJERCICIO" centrado + spacer.
- Buscador: `bg-surface border-border rounded-xl` con ícono lupa + placeholder "Buscar ejercicio…".
- Fila de chips "PARTE DEL CUERPO" (scroll horizontal, chip activo azul relleno, resto `surface`+borde) — corresponde a `body_part` real.
- Fila de chips "EQUIPO" con ícono por grupo (scroll horizontal) — corresponde a `equipment` real, agrupado en 6 categorías visuales (Peso libre/Máquina/Cable/Peso corporal/Cardio/Accesorio) — esto implica un mapeo entre los valores crudos de `equipment` en la DB y estas 6 categorías de UI, no es 1:1 directo.
- Contador de resultados en mono pequeño.
- Lista de resultados: cada item `bg-surface` (o con borde `data` si está seleccionado) con ícono de equipo, nombre + "muscle_group · equipment" en mono gris, ícono de check/agregar a la derecha.
- Bloque "Relacionados": fondo levemente distinto (`#182236`), label mono con el muscle_group real, subtítulo "LIMIT 6", hasta 3 items compactos con separador de línea fina entre ellos, cada uno con botón + individual.
- Footer: botón ancho completo azul "Agregar N ejercicio(s)" (el número refleja la selección actual).

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-back.svg` | Reusa el de 03 |
| imgIcon1 | `icon-search.svg` | Reusa el de 02 |
| imgIcon2 | `icon-equip-freeweight.svg` | Ícono chip "Peso libre" |
| imgIcon3 | `icon-equip-machine.svg` | Ícono chip "Máquina" |
| imgIcon4 | `icon-equip-cable.svg` | Ícono chip "Cable" |
| imgIcon5 | `icon-equip-bodyweight.svg` | Ícono chip "Peso corporal" |
| imgIcon6 | `icon-equip-cardio.svg` | Ícono chip "Cardio" |
| imgIcon7 | `icon-equip-accessory.svg` | Ícono chip "Accesorio" |
| imgIcon8 | `icon-exercise-barbell.svg` | Ícono en item de lista (ejercicio con barra) |
| imgIcon9 | `icon-check.svg` | Check/seleccionado a la derecha de un item |
| imgIcon10 | `icon-exercise-generic.svg` | Ícono genérico en items relacionados |
| imgIcon11 | `icon-add-small.svg` | Botón + pequeño en items relacionados |
| imgIcon12 | `icon-exercise-bodyweight.svg` | Ícono item "Fondos en paralelas" |
| imgIcon13 | `icon-exercise-dumbbell.svg` | Ícono item "Press de banca (mancuerna)" |
| imgIcon14 | `icon-exercise-cable.svg` | Ícono item "Cruce de poleas" |
| imgIcon15/16/17 | status bar | Reusar de 02 |
| imgIcon18 | `icon-clear-x.svg` | X para limpiar el buscador (variante vacío) |
| imgIcon19 | `icon-search-empty.svg` | Ilustración lupa grande (variante sin resultados) |

## Notas de implementación
- Ya existe `exercise-picker.tsx` (PR4) funcional con búsqueda+filtros+relacionados — falta el estilo visual exacto: chips de body_part/equipment con scroll horizontal e íconos, bloque de relacionados visualmente distinto, contador de resultados, selección visual con borde `data`.
- El mapeo equipment→6 categorías visuales con ícono es nuevo, hay que definirlo (ej. un diccionario `equipment value → {label, icon, group}` en el código, ya que los valores crudos de `equipment` en la tabla `exercises` no son exactamente estos 6 grupos).
