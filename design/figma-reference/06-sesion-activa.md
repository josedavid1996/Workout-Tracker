# 06 · Sesión activa

Figma node: `16:3562` (Section). Ruta app: `/workout/:id`. **SIN timers en vivo** (decisión ya tomada) — el subtítulo del propio Figma lo confirma: "Logging de sets · último peso · confirmación al completer (sin timers)".

Nota: fetch truncado a los ~25k tokens; las 3 variantes principales (logging, confirmación de set, error al guardar) quedaron completas, puede faltar alguna variante adicional del node que no llegamos a ver.

## Variantes
- **Logging de sets** (`16:3572`): header con X cerrar + nombre de rutina + "Terminar" (verde), barra de progreso "2/6" ejercicios, título del ejercicio actual + chip de muscle group, "ÚLTIMO: 80 KG × 8", tabla de sets (header SET/ANTERIOR/KG/REPS), sets completados en fondo verde-tintado con check, set actual con borde `data` e inputs editables, sets futuros atenuados con placeholders "—", botón punteado "Agregar set", footer con "SIGUIENTE: [ejercicio]" + botón azul "Completar set".
- **Confirmación de set** (`16:3732`): pantalla de transición — círculo verde grande con check, "SET REGISTRADO", "SET 3 · 82.5 × 8", "Descansa y continúa cuando estés listo" (confirma que NO hay timer, es un mensaje pasivo), footer con preview "A CONTINUACIÓN · SET 4" mostrando el próximo ejercicio + peso sugerido.
- **Error al guardar set** (`16:3804`): misma tabla de sets pero el set 2 queda con borde/fondo rojo-tintado + ícono de warning en vez de check, banner de error "No se guardó el set N" con texto "Guardado localmente. Se reintenta automáticamente al reconectar.", footer cambia a "SET N · Pendiente de guardar" (texto rojo) + botón "Reintentar".

## Estructura clave
- Header: `bg-surface` con borde inferior, ícono X a la izquierda (cerrar/volver), nombre de la rutina/workout centrado, "Terminar" en verde (`positive`) a la derecha.
- Barra de progreso de ejercicios: barra delgada azul sobre fondo `surface-2`, con contador "N / total" a la derecha en mono.
- Bloque de ejercicio actual: título grande (Poppins ExtraBold 30px uppercase) + chip de muscle group a la derecha (azul translúcido), línea "ÚLTIMO: X KG × Y" con ícono de reloj.
- Tabla de sets: header de columnas (SET/ANTERIOR/KG/REPS) en mono pequeño gris, luego filas:
  - Completado: fondo verde-tintado `rgba(95,167,119,.08)` borde `rgba(95,167,119,.3)`, número de set en verde, valores en gris/blanco, check verde a la derecha.
  - Actual (en edición): borde `data` (azul claro), inputs editables con fondo `surface-2` para KG/REPS, ícono de edición a la derecha en vez de check.
  - Futuro/pendiente: sin fondo, opacity 50%, guiones "—" en vez de valores.
  - Error: fondo rojo-tintado `rgba(255,180,171,.08)` borde `rgba(255,180,171,.4)`, número en rojo `#ffb4ab`, ícono de warning.
- Botón "Agregar set": borde punteado, ancho completo.
- Footer fijo con borde superior: a la izquierda "SIGUIENTE" + nombre del próximo ejercicio (o "SET N · Pendiente de guardar" en rojo si hay error), a la derecha botón azul "Completar set" (o "Reintentar" con ícono refresh si hay error).

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-close.svg` | X cerrar en el header |
| imgIcon1 | `icon-clock.svg` | Reloj junto a "ÚLTIMO: X KG × Y" |
| imgIcon2 | `icon-check-small.svg` | Check verde en sets completados |
| imgIcon3 | `icon-edit.svg` | Ícono de edición en el set actual |
| imgIcon4 | `icon-plus.svg` | Reusa el + ya descargado — "Agregar set" |
| imgIcon5/6/7 | status bar | Reusar de pantallas previas |
| imgIcon8 | `icon-check-large.svg` | Check grande en círculo — pantalla "Set registrado" |
| imgIcon9 | `icon-warning-small.svg` | Warning en la fila de set con error |
| imgIcon10 | `icon-warning.svg` | Reusa el warning de pantalla 03 (banner de error) |
| imgIcon11 | `icon-retry.svg` | Reusa el retry de pantalla 03 |

## Notas de implementación
- Ya existen `set-row.tsx` y `tag-overlay.tsx` (PR4) — falta el estilo visual de la tabla (columnas SET/ANTERIOR/KG/REPS, estados por color: completado=verde, actual=borde azul claro, futuro=atenuado, error=rojo) y la pantalla de transición "Set registrado" (actualmente probablemente no existe — es una confirmación breve entre sets, sin timer, solo un mensaje + preview del próximo set).
- El estado de error (guardado offline/retry) es NUEVO respecto a lo implementado — hoy el logging probablemente asume que el insert a Supabase siempre funciona; esto implica manejar el caso de fallo de red/mutation y mostrarlo así, con reintento manual.
- Confirmado en el propio Figma: no hay timer de descanso ni de duración total visible en ningún lado de esta pantalla — coincide con la decisión ya tomada.
