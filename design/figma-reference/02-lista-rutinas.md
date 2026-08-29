# 02 · Lista de rutinas

Figma node: `16:2483` (Section). Ruta app: `/routines`.

## Variantes en este node
- **Con datos** (`16:2493`): título "RUTINAS" + botones buscar/agregar, tabs de filtro (Todas/Push/Pull/Legs), lista de rutina-cards (nombre, "N EJERCICIOS · ~M MIN", badge "HACE Nd", chips de ejercicios destacados +N).
- **Vacío** (`16:2670`): mismo header, sin tabs de filtro, ilustración de círculos concéntricos + ícono de lista, "Ninguna rutina", texto, botón "Nueva rutina".

## Estructura (variante con datos)
- Header: título "RUTINAS" (Poppins ExtraBold 27px uppercase) + 2 botones circulares a la derecha (buscar, agregar — el de agregar es azul relleno).
- Fila de tabs de filtro por muscle group agrupado ("Todas" activo en azul, resto en gris `surface`).
- Lista de rutina-cards, cada una `bg-surface border-border rounded-2xl p-4`:
  - Nombre en Poppins Bold uppercase 20px.
  - Subtítulo mono `N EJERCICIOS · ~M MIN`.
  - Badge "HACE Nd" a la derecha — verde-tintado (`rgba(95,167,119,.12)` texto `#5fa777`) solo en la MÁS reciente, gris en las demás.
  - Fila de chips grises con nombres de ejercicios destacados (máx 2-3) + chip "+N".
  - La rutina "Full Body" (nunca usada) tiene `opacity-85` y badge "NUNCA".
- Bottom nav fija: Home / Rutinas (activo, texto `data` color) / botón flotante azul "Iniciar" (elevado, drop-shadow azul) / Historial / Perfil.

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-search.svg` | Lupa — botón buscar en header |
| imgIcon1 | `icon-plus.svg` | Más — botón agregar rutina (circular azul) y CTA vacío |
| imgIcon2 | `icon-nav-home.svg` | Ícono nav inferior "Home" |
| imgIcon3 | `icon-nav-routines.svg` | Ícono nav inferior "Rutinas" (activo) |
| imgIcon4 | `icon-nav-start.svg` | Ícono play dentro del botón flotante "Iniciar" |
| imgIcon5 | `icon-nav-history.svg` | Ícono nav inferior "Historial" |
| imgIcon6 | `icon-nav-profile.svg` | Ícono nav inferior "Perfil" |
| imgIcon7 | `icon-status-signal.svg` | Status bar — señal |
| imgIcon8 | `icon-status-wifi.svg` | Status bar — wifi |
| imgIcon9 | `icon-status-battery.svg` | Status bar — batería |
| imgIcon10 | `icon-empty-list.svg` | Ícono lista dentro de círculo (empty state) |
| imgIcon11 | `icon-empty-rings.svg` | Anillos concéntricos decorativos detrás del ícono (empty state) |
| (imgIcon1 reused) | `icon-plus.svg` | Reutilizado para "Nueva rutina" |

## Notas de implementación
- Ya existe `routines-list-page.tsx` (PR3) — hay que reescribirlo para matchear este layout: tabs de filtro por grupo muscular (derivar de las rutinas reales del usuario, no hardcodear Push/Pull/Legs), badge de "hace Nd" calculado desde el `created_at`/último workout de esa rutina, chips de ejercicios destacados desde `routine_exercises` + join a `exercises.name`.
- El estado vacío ya se maneja parcialmente; alinear texto/ilustración a esto.
