# 01 · Home (dashboard)

Fuente: Figma file `0gmnHqH21CxFTfS1urK2Me`, node `16:2187` (dos variantes hermanas: `16:2189` "con datos" y `16:2380` "vacío — primer uso").

## Estructura (variante "con datos")

- **Header**: fecha corta en mono ("LUN · 6 JUL"), saludo grande "Hola, {nombre}" (Poppins ExtraBold uppercase), avatar circular con iniciales del usuario a la derecha.
- **Card "HOY TOCA"** (surface, borde, esquinas redondeadas, motivo decorativo de círculos concéntricos translúcidos arriba a la derecha — mismo ícono `icon-decor-rings`): label "HOY TOCA" en mono, nombre de la rutina grande (Poppins ExtraBold uppercase, ej. "Push Day"), subtítulo "{N} EJERCICIOS · ~{M} MIN" en mono, texto "Última vez hace {X} días", botón full-width "Iniciar workout" (accent azul, ícono play).
- **Fila de 3 stat tiles** (surface, borde): Sesiones (número grande), Volumen KG (número + sufijo "k" en gris), PRs (número grande en color positivo `#5fa777`). Labels en mono, minúscula tracking ancho.
- **Banner "Racha activa"** (surface, ícono a la izq., texto + subtítulo, número de días a la derecha en formato "{N}d" con la "d" en gris).
- **Sección "Actividad reciente"** con link "Ver todo" (color data `#b4c5ff`) — lista de cards compactas (ícono cuadrado, nombre de rutina, fecha+duración en mono, volumen a la derecha).
- **Bottom nav**: Home / Rutinas / [botón flotante circular "Iniciar", accent azul, elevado] / Historial / Perfil. Ícono + label debajo, activo en color data, inactivo en muted.

## Variante "vacío — primer uso"

Mismo header. Body centrado: ícono grande (`icon-empty-rings` + ícono chico superpuesto), título "Sin rutinas aún" (Poppins ExtraBold uppercase), párrafo descriptivo centrado, botón "Crear primera rutina" (accent azul, ícono plus).

## Assets usados (ya descargados en `src/assets/icons/`)

- `icon-nav-home.svg`, `icon-nav-routines.svg`, `icon-nav-start.svg` (botón flotante), `icon-nav-history.svg`, `icon-nav-profile.svg` — bottom nav.
- `icon-play.svg` — botón "Iniciar workout".
- `icon-decor-rings.svg` — motivo decorativo en la card "hoy toca".
- `icon-empty-rings.svg` + ícono chico superpuesto (reusar `icon-decor-rings.svg` o el más parecido disponible en la carpeta si no hay uno específico — revisar visualmente).
- `icon-plus.svg` — botón "Crear primera rutina".
- `icon-status-signal.svg`, `icon-status-wifi.svg`, `icon-status-battery.svg` — status bar simulada del mockup (NO implementar una status bar falsa en la app real, esto es solo decoración del mockup de Figma, ignorar en la implementación real).
- Ícono genérico de actividad reciente: reusar el más apropiado de `icon-nav-*` o `icon-routine-list.svg`.

## Datos reales a conectar (no hardcodear como el Figma)

- Nombre del usuario: de la sesión de Supabase Auth.
- "Hoy toca": si hay una rutina marcada como "de hoy" no existe ese concepto en el modelo — usar la rutina más recientemente usada, o mostrar el estado vacío si no hay rutinas. Documentar la heurística elegida.
- Stats (sesiones/volumen/PRs): agregación real sobre `workouts`/`set_entries` del usuario (sesiones = count workouts finished_at not null; volumen = suma sessionVolume del mes o total, a decidir; PRs = requiere definir qué cuenta como "nuevo PR", puede aproximarse con bestOverall por ejercicio en el período reciente — documentar la heurística).
- Racha: no existe el concepto todavía en el modelo — calcular en base a días con al menos un workout finished_at, o dejar en 0/placeholder documentado como TODO si no hay tiempo de implementarlo bien esta pasada.
- Actividad reciente: últimos N workouts finished_at not null del usuario, con nombre de rutina (o "Freestyle"), fecha, duración, volumen — reusa `features/history/api/history.ts` ya existente de PR5.
