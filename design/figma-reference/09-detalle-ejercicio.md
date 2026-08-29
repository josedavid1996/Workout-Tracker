# 09 · Detalle de ejercicio

Figma node: `16:4400` (Section, completo). Ruta app: `/exercises/:id`.

## Variantes
- **Con datos** (`16:4410`): header back + nombre del ejercicio + "muscle_group · equipment" + ícono editar/más, 3 stat-tiles (PR·KG / 1RM EST. / +N KG·8SEM en verde), card de gráfica con tabs Peso (activo)/Volumen/Reps + el chart en sí (línea con puntos, eje X con meses MAY/JUN/JUL), sección "REGISTRO" con lista histórica (fecha + "N sets · top peso×reps" + badge "PR" en la fila que fue récord).
- **Loading**: header con skeleton de título, 3 tiles skeleton, chart skeleton, 2 filas skeleton.
- **Vacío — sin histórico** (`16:4595`): header con nombre real del ejercicio (ej. "Zercher Squat"), sin stat-tiles ni chart, ilustración de ícono de gráfica en círculo, "Sin registros aún", texto, botón "Iniciar workout".
- **Error** (`16:4656`): header normal, ilustración de warning en círculo, "No se pudo cargar", texto "Revisa tu conexión... tus datos siguen guardados localmente", botón "Reintentar".

## Estructura (variante con datos)
- Header con borde inferior: botón back circular, nombre del ejercicio centrado (Poppins Bold 18px uppercase) + subtítulo "muscle_group · equipment" (mono, gris, centrado) debajo, ícono de editar/más a la derecha.
- Grid de 3 stat-tiles iguales: valor grande (mono bold 20px, color según tile — PR en `data`, 1RM en blanco, delta en verde) + label pequeño (PR·KG / 1RM EST. / KG·8SEM) debajo.
- Card de gráfica: fila de tabs "Peso" (activo, azul relleno) / "Volumen" / "Reps" (inactivos, gris), debajo el chart de línea con puntos (Recharts — usar `estimateOneRm` de PR2 para el valor si el tab es "Peso" mostrando 1RM estimado, marcar visualmente los puntos con `lowConfidence: true`), eje X con etiquetas de mes abreviado.
- Sección "REGISTRO": título mono uppercase, lista de filas `bg-surface border-border rounded-xl` con fecha (mono, gris) + "N sets · top peso×reps" (Roboto SemiBold), badge verde "PR" a la derecha en la fila que fue récord ese día (usar `records.ts` de PR2 para detectarlo).
- Vacío: mismo header (con nombre real del ejercicio elegido), ilustración + CTA "Iniciar workout" (lleva a `/workout/start`).
- Error: mismo header, ilustración de warning + botón "Reintentar" (reintenta el fetch).

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-back.svg` | Reusa el de 03/04 |
| imgIcon1 | `icon-edit.svg` | Reusa el de 06 — ícono editar/más en el header |
| imgIcon2 | (no descargar — es un screenshot del chart) | El chart de Figma viene como IMAGEN rasterizada, no como elementos vectoriales — el chart real hay que construirlo con Recharts desde cero usando los datos reales, esta imagen es solo referencia visual de cómo debería verse (línea con puntos, gradiente sutil debajo) |
| imgIcon3/4/5 | status bar | Reusar de pantallas previas |
| imgIcon6 | `icon-empty-chart.svg` | Ícono de gráfica en círculo — estado "Sin registros aún" |
| imgIcon7 | `icon-play.svg` | Reusa el de 05 — botón "Iniciar workout" en el vacío |
| imgIcon8 | `icon-warning-circle.svg` | Ícono de warning en círculo — estado de error |
| imgIcon9 | `icon-retry.svg` | Reusa el de 03/06 — botón "Reintentar" |

## Notas de implementación
- Ya existe `exercise-detail-page.tsx` con tabs History/Chart/Records (PR5) — el mapeo con este diseño es: "REGISTRO" = History tab, el chart con tabs Peso/Volumen/Reps = Chart tab, y los 3 stat-tiles (PR/1RM/delta) = Records tab, pero en el Figma están TODOS visibles en una sola pantalla sin tabs separados (los 3 stat-tiles y la card de gráfica conviven arriba de "REGISTRO"). Hay una decisión de layout a tomar: ¿juntar todo en una sola vista como el Figma (sin tabs de Historial/Gráfica/Records separados), o mantener los 3 tabs ya implementados? El Figma sugiere que NO hace falta separar en tabs — todo cabe en una sola pantalla con scroll. Recomendado: adoptar el layout del Figma (todo junto, sin tabs), es más simple y ya viene con el diseño real pensado así.
- El delta "+N KG · 8SEM" (tercer stat-tile) es NUEVO respecto a lo ya implementado — requiere comparar el 1RM actual vs el de hace 8 semanas, cálculo adicional sobre `records.ts`.
- Badge "PR" en la fila del registro histórico que corresponde al récord — ya se puede derivar de `bestOverall`/`bestByRepCount` de `records.ts`.
