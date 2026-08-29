# 08 · Historial general

Figma node: `16:4127` (Section, completo). Ruta app: `/history`.

## Variantes
- **Con datos** (`16:4137`): header "HISTORIAL" + botón calendario, card de mes "Julio 2026 · 18 sesiones" con heatmap tipo GitHub (grid 7×4, celdas azules con distinta opacidad según intensidad/volumen del día, celda actual con borde `data`, celdas futuras/sin dato en `#111a2c` oscuro), sección "ESTA SEMANA" con lista de sesiones (día numérico + abreviatura + separador vertical + nombre rutina + "N SETS" + volumen en kg), bottom nav con Historial activo.
- **Loading**: header simple, skeleton del heatmap (bloque gradiente) + barra skeleton + 3 filas skeleton de sesiones.

## Estructura (variante con datos)
- Header: título "HISTORIAL" (Poppins ExtraBold 27px uppercase) + botón calendario a la derecha (`bg-surface border-border rounded-xl`).
- Card de mes: `bg-surface border-border rounded-2xl`, fila superior "Julio 2026" (nombre de mes) + "N sesiones" (color `data`) a la derecha, debajo un heatmap grid de 7 columnas × 4 filas, celdas `rounded-sm` con `bg-accent` en distintas opacidades (0.5/0.7/0.9) según nivel de actividad ese día, celdas sin actividad en gris `surface-2`, celda del día actual con fondo oscuro + borde `data`, celdas futuras en un tono aún más oscuro (`#111a2c`) sin interacción.
- Label mono "ESTA SEMANA".
- Lista de sesiones: cada una `bg-surface border-border rounded-xl`, columna izquierda con día numérico (mono bold 16px) + abreviatura del día (mono 9px gris) centrados, separador vertical fino, columna central con nombre de rutina (Poppins Bold uppercase 17px) + "N SETS" (mono gris), columna derecha alineada a la derecha con volumen (mono, color `data`) + "KG" chico debajo.
- Bottom nav: Home / Rutinas / botón flotante Iniciar / Historial (activo, texto `data`) / Perfil.

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-calendar.svg` | Botón calendario en el header |
| imgIcon1 | `icon-nav-home.svg` | Reusa el de 02 |
| imgIcon2 | `icon-nav-routines.svg` | Reusa el de 02 |
| imgIcon3 | `icon-nav-start.svg` | Reusa el de 02 |
| imgIcon4 | `icon-nav-history.svg` | Reusa el de 02 (acá activo) |
| imgIcon5 | `icon-nav-profile.svg` | Reusa el de 02 |
| imgIcon6/7/8 | status bar | Reusar de pantallas previas |

## Notas de implementación
- Ya existe `history-page.tsx` (PR5) con lista filtrable por rutina — falta: el heatmap mensual tipo GitHub (agrupar sesiones por día del mes, calcular intensidad relativa por volumen o por cantidad de sets), la card de "esta semana" con el layout de 3 columnas (día/nombre+sets/volumen) en vez de una lista genérica, y el botón de calendario en el header (puede ser solo para cambiar de mes, o quedar sin funcionalidad si no está en alcance).
- El filtro por rutina que ya existe en el código actual no aparece explícitamente en este diseño (se ve directamente la lista de "esta semana") — puede vivir detrás del botón calendario o como filtro adicional no mostrado en estas 2 variantes; no eliminar la funcionalidad ya construida, solo ajustar dónde vive visualmente.
