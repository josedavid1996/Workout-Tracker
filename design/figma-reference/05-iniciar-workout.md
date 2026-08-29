# 05 · Iniciar workout

Figma node: `16:3376` (Section). Ruta app: `/workout/start`.

## Variantes
- **Con datos** (`16:3386`): título "INICIAR", card grande "Freestyle" (ícono play en cuadrado azul + círculos decorativos de fondo), label "O ELIGE UNA RUTINA", lista de rutina-cards compactas (ícono + nombre + "N EJ · ~M MIN" + chevron).
- **Vacío — solo freestyle** (`16:3494`): misma card Freestyle (versión sin círculos decorativos, con padding uniforme), label "RUTINAS GUARDADAS", bloque punteado de empty-state con ícono, "Aún no tienes rutinas", texto, botón secundario "Crear rutina".

## Estructura
- Header simple: título "INICIAR" (Poppins ExtraBold 27px uppercase), sin acciones a la derecha.
- Card Freestyle: fondo con gradiente diagonal sutil (`#32343d` → `#1e293b`), borde `border`, ícono decorativo grande semi-transparente de fondo (círculos concéntricos, arriba-derecha), ícono play en cuadrado azul 44px, título "FREESTYLE" (Poppins ExtraBold 26px uppercase), subtítulo gris.
- Label mono "O ELIGE UNA RUTINA" / "RUTINAS GUARDADAS".
- Lista de rutina-cards: `bg-surface border-border rounded-2xl`, ícono cuadrado gris a la izquierda, nombre (Poppins Bold uppercase 19px) + "N EJ · ~M MIN" (mono gris) debajo, chevron a la derecha.
- Empty state (cuando no hay rutinas): contenedor con borde punteado, ícono en círculo, título, texto, botón secundario outline "Crear rutina" (texto color `data`).

## Assets
| Constante | Archivo local | Qué representa |
|---|---|---|
| imgIcon | `icon-decor-rings.svg` | Círculos concéntricos decorativos de fondo en la card Freestyle |
| imgIcon1 | `icon-play.svg` | Ícono play en el cuadrado azul de la card Freestyle |
| imgIcon2 | `icon-routine-list.svg` | Ícono cuadrado gris en cada rutina-card |
| imgIcon3 | `icon-chevron-right.svg` | Chevron a la derecha de cada rutina-card |
| imgIcon4/5/6 | status bar | Reusar de 02 |
| imgIcon7 | `icon-empty-list.svg` | Reusa el de 02 (empty state icon) |
| imgIcon8 | `icon-plus.svg` | Reusa el + ya descargado |

## Notas de implementación
- Ya existe `workout-start-page.tsx` (PR4) — falta el estilo visual: la card Freestyle destacada con el motivo de círculos concéntricos (que además es la firma visual mencionada en el brief original, aunque ahí decía que era exclusiva del acento dorado — acá aparece igual en azul, así que el motivo de discos/círculos concéntricos SÍ es parte del diseño real, solo cambia el color de acento), y la lista de rutinas con el layout de card compacta con chevron.
