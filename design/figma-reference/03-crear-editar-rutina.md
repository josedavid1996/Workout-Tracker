# 03 · Crear / editar rutina

Figma node: `16:2764` (Section). Rutas app: `/routines/new`, `/routines/:id/edit`.

## Variantes
- **Con datos** (`16:2774`): header con back + título "EDITAR RUTINA" + link "Guardar" (color `data`), input de nombre con borde resaltado (`border-data`, foco), chips de muscle groups tocados (azul translúcido), lista de ejercicios reordenable (grip handle + nombre + sets×reps + X quitar), botón punteado "Agregar ejercicio", footer fijo con botón "Guardar rutina".
- **Error al guardar** (`16:2903`): mismo layout sin foco en el input, banner de error rojo-translúcido ("No se pudo guardar" / "Se guardó localmente. Reintenta para sincronizar."), botón footer cambia a "Reintentar guardado" con ícono de refresh.

## Estructura
- Header con borde inferior: botón back circular (`bg-surface border-border`), título centrado Poppins Bold 19px, acción "Guardar" a la derecha (texto `data`, o gris si deshabilitado/error).
- Sección NOMBRE: label mono uppercase pequeño + input grande (Poppins Bold 20px uppercase) con barra de cursor animada cuando tiene foco (`border-data` + barrita azul).
- Chips de muscle groups (derivados de los ejercicios agregados, no editables a mano): fondo azul translúcido `rgba(37,99,235,.12)` borde `rgba(37,99,235,.3)` texto `data`.
- Sección EJERCICIOS · N: lista de items `bg-surface border-border rounded-xl`, cada uno con: ícono grip (drag handle) a la izquierda, nombre (Roboto SemiBold 14px) + "sets × reps" (mono, gris) debajo, botón X a la derecha para quitar.
- Botón "Agregar ejercicio": borde punteado, ícono +, texto color `data`.
- Footer fijo con borde superior: botón ancho completo azul "Guardar rutina" (o banner de error + botón "Reintentar guardado" con ícono refresh cuando falla).

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-back.svg` | Chevron back en el header |
| imgIcon1 | `icon-drag-handle.svg` | Grip/drag handle en cada fila de ejercicio |
| imgIcon2 | `icon-remove.svg` | X para quitar un ejercicio de la lista |
| imgIcon3 | `icon-plus.svg` | Reusa el + ya descargado en 02 |
| imgIcon4/5/6 | status bar (reusar de 02) | Señal/wifi/batería |
| imgIcon7 | `icon-warning.svg` | Ícono de alerta en el banner de error |
| imgIcon8 | `icon-retry.svg` | Ícono de refresh en "Reintentar guardado" |

## Notas de implementación
- `routine-form-page.tsx` (PR3/PR4) ya maneja create/edit y ya usa el picker real de ejercicios (PR4) — falta: (a) el estilo visual exacto de esta pantalla (header con back+Guardar en vez de layout genérico, chips de muscle group derivados automáticamente de los ejercicios agregados, filas con drag handle real para reordenar en vez de solo botones), (b) el estado de error de guardado con banner + botón reintentar — hoy probablemente no existe, hay que agregarlo si el guardado (supabase mutation) falla.
- El drag-and-drop real puede ser una librería ligera (ej. la lógica ya existe en `move-draft.ts` con up/down — se puede mantener esa interacción pero con el ícono de grip visual, no hace falta drag real de mouse si no está en el alcance).
