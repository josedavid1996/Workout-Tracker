# Feature gap: Workout-Tracker vs openGym

Fecha: 2026-10-13 · Rama analizada: `feat/wake-lock` (sin diferencias de código frente a `main`) · Análisis de solo lectura.

Referencia: [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym) (AGPL-3.0), rama `main`. La lógica de openGym está descrita con palabras propias; este documento no contiene código suyo.

## Cómo leer este documento

- **Stack real de Workout-Tracker.** El encargo lo describía como Next.js 14 + Prisma + PostgreSQL. El repo es otra cosa: Vite + React 19 + TypeScript + Tailwind 4 + Supabase (PostgreSQL con RLS, sin capa de servidor). No hay schema de Prisma; el modelo de datos vive en `supabase/migrations/*.sql`. Por eso la columna "Requiere cambio de schema" significa "requiere una migración SQL nueva".
- **Rutas de evidencia.** Las de Workout-Tracker son relativas a este repo. Las de openGym llevan el prefijo `oG:` y son relativas a su raíz (casi todo bajo `frontend/src/`).
- **Alcance de la verificación en openGym.** Se leyó README, docs, roadmap y los módulos de `frontend/src/lib/` relevantes para fuerza. No se leyó el repo completo ni se ejecutó la app. Lo que solo consta en el README está marcado como "README".
- **"No verificado"** significa que no se comprobó en el código, no que no exista.
- **Esfuerzo:** S = hasta un día, M = unos días, L = una semana o más.

## Diagnóstico: por qué la app se siente difícil

La parte de análisis (récords, 1RM estimado, gráficas, heatmap, discos) está a la par de openGym. La brecha está en el bucle que se repite decenas de veces por sesión: registrar un set. Workout-Tracker trata cada set como una fila que el usuario crea y luego confirma; openGym trata la sesión como un plan ya escrito que el usuario va tachando.

| Momento | Workout-Tracker hoy | openGym |
|---|---|---|
| Empezar la rutina de hoy | Home → "Iniciar workout" → pantalla de selección → elegir rutina (3 toques). La tarjeta "Hoy toca" muestra la última rutina usada, no la del día, aunque `routines.day_of_week` existe. | El botón central inicia directamente lo planificado para hoy (1 toque); solo muestra selector si no hay nada planificado. |
| Registrar un set | "Agregar set" → escribir peso si no hay dato previo → "Completar set" (2 toques como mínimo, más teclado). La sesión arranca sin filas de sets aunque la rutina tenga `target_sets`. | Las filas ya existen con peso y repeticiones cargados; se marca el set (1 toque). |
| Entre sets | Nada: sin cronómetro, y la pantalla se puede apagar. | El descanso arranca solo al marcar el set; la pantalla se mantiene encendida. |
| Corregir un error | Solo el primer set sin completar es editable. Un set completado no se puede editar, desmarcar ni borrar, y un workout iniciado por error no se puede descartar. | Deslizar para borrar con deshacer; se editan sesiones guardadas. |
| Ver la sesión completa | Un ejercicio por pantalla con "← Anterior / Siguiente →". | Lista o tarjetas con todos los ejercicios. |

Para una rutina de 5 ejercicios × 4 sets, esto supone unos 40 toques de registro más 4 de navegación, frente a unos 20 en openGym.

Dos decisiones previas explican parte de esto y conviene reabrirlas: "sin temporizadores en vivo" (`tasks.md` 8.2; `workout-session-page.tsx:58-64`) y "la lista de ejercicios se congela al registrar el primer set" (`workout-session-page.tsx:408-411`).

## Inventario actual de Workout-Tracker

**Modelo de datos** (`supabase/migrations/0001`–`0011`):

| Tabla | Contenido |
|---|---|
| `exercises` | Catálogo preexistente de solo lectura (no se modifica). |
| `exercise_focus` | Región muscular específica por ejercicio (32 valores), confianza y marca de estiramiento. Catálogo compartido de solo lectura. |
| `routines` | Nombre y `day_of_week` (0–6, opcional). |
| `routine_exercises` | Posición, `target_sets`, `target_reps` (texto, admite rangos), `notes`. |
| `workouts` | `routine_id`, `notes` (sin interfaz que lo use), `created_at`, `finished_at`. Índice único: un solo workout activo por usuario. |
| `workout_exercises` | Ejercicio y posición dentro del workout. |
| `set_entries` | `weight`, `reps`, `tag` (`normal`/`warmup`/`drop`/`failure`), `completed`, `completed_at`, `created_at`. |
| `user_equipment` | Peso de la barra e inventario de discos. |

Todas las tablas de usuario tienen `user_id` y una policy de propietario `for all` (`0003_rls.sql`). Función `countable_sets()`: sets completados que no son de calentamiento.

**Pantallas** (`src/app/router.tsx`):

| Ruta | Qué hace |
|---|---|
| `/login` | Entrar o registrarse. |
| `/` | Tarjeta "Hoy toca", sesiones/volumen/PRs, racha en días, actividad reciente. |
| `/routines` | Lista con búsqueda, filtros y borrado. |
| `/routines/preview` | Vista semanal agrupada por día, con días de descanso. |
| `/routines/new`, `/routines/:id/edit` | Formulario: nombre, ejercicios, reordenar, series/reps objetivo, notas. |
| `/workout/start` | Freestyle o elegir rutina; redirige al workout activo si existe. |
| `/workout/:id` | Sesión activa, reanudable, un ejercicio a la vez. |
| `/workout/:id/summary` | Resumen: ejercicios, volumen, sets, PRs nuevos, desglose por ejercicio, compartir. También es el detalle de un workout del historial. |
| `/history` | Heatmap mensual, sesiones de la semana, filtro por rutina. |
| `/exercises/:id` | PR, 1RM estimado, variación a 8 semanas, gráfica, registro por sesión. Solo se llega desde el resumen o desde la ficha rápida; no hay pestaña de ejercicios. |
| `/settings/equipment` | Barra y discos. |
| `/profile` | Nombre, estadísticas, ajustes. |

**Otros:** PWA instalable; el service worker cachea el shell y el catálogo de ejercicios, no los datos del usuario (`vite.config.ts`). Ficha rápida del ejercicio con músculos, equipo, instrucciones en español y ejercicios similares. Calculadora de discos con rampa de calentamiento.

## a) Tabla comparativa

Estado en Workout-Tracker: **completa**, **parcial** o **no existe**.

### Registro durante la sesión

| Funcionalidad | openGym (cómo funciona) | Workout-Tracker | Evidencia | Schema | Esfuerzo | Prioridad |
|---|---|---|---|---|---|---|
| Sets precargados al iniciar | Al empezar crea todas las filas: repeticiones del plan (o de la última sesión, según ajuste) y peso del historial. | **Parcial.** Solo se copian los ejercicios; cada set se crea con "Agregar set", que sí precarga peso y reps. | `src/features/workout-session/api/workout-session.ts:75-109`, `lib/new-set-defaults.ts` · `oG:lib/session-start.js` | No | M | Alta |
| Inicio en un toque | El botón central inicia las rutinas planificadas para hoy; el selector solo aparece si no hay plan. | **Parcial.** `day_of_week` existe, pero Home destaca la última rutina usada y su botón lleva al selector. | `src/features/home/pages/home-page.tsx:51-56,192`, `workout-start-page.tsx` · `oG:components/TabBar.jsx:38-63` | No | S | Alta |
| Rendimiento anterior | Línea "última vez" por ejercicio con los sets de la sesión previa de esa rutina. | **Parcial.** Se muestra solo el último peso, repetido en todas las filas, sin repeticiones. | `workout-session-page.tsx:128-133,213`, `workout-session.ts:235` · `oG:views/Workout.jsx:188-248` | No | S | Alta |
| Temporizador de descanso | Arranca solo al marcar un set; duración por ejercicio con valor global por defecto; pausa, saltar y ±15 s; sonido y vibración. | **No existe** (decisión deliberada). | `workout-session-page.tsx:58-64,319-326` · `oG:views/Workout.jsx:1696-1738`, `store/useUI.js:275-303` | No con duración global; sí por ejercicio | M | Alta |
| Pantalla siempre encendida | Activa mientras hay workout; se readquiere al volver a la pestaña. | **No existe.** La rama `feat/wake-lock` aún no tiene código. | Sin coincidencias de `wakeLock` en `src/` · `oG:lib/wakelock.js` | No | S | Alta |
| Editar, desmarcar y borrar sets | Deslizar a la izquierda borra con deshacer; a la derecha copia; el número del set abre su menú. | **Parcial.** Solo el set actual es editable; no hay borrar ni desmarcar en la interfaz (la API de desmarcar existe). | `workout-session-page.tsx:188-241`, `workout-session.ts:205-219` · `oG:views/Workout.jsx` | No | S | Alta |
| Descartar un workout | Se puede eliminar o editar una sesión. | **No existe.** No hay borrado de `workouts`; un inicio accidental obliga a "Terminar" y queda en el historial. | Solo `routines.ts:132,143` usan `delete()` · `oG:lib/session-edit.js` | No | S | Alta |
| Vista de toda la sesión | Un bloque por ejercicio, en tarjetas deslizables o lista continua. | **Parcial.** Un ejercicio a la vez con botones anterior/siguiente y barra de progreso. | `workout-session-page.tsx:538-573` · `oG:views/Workout.jsx` | No | M | Media |
| Agregar, quitar o reordenar ejercicios en sesión | Menú "⋯" por ejercicio: mover, quitar, añadir. | **Parcial.** Solo en freestyle y antes del primer set. "Saltar" es estado local y se pierde al recargar. | `workout-session-page.tsx:408-411,423-430` · `oG:views/Workout.jsx` | No (persistir "saltar": sí) | M | Media |
| Sustituir ejercicio | Abre alternativas con el mismo músculo principal, mismo equipo primero; si ya hay sets, conserva el original e inserta el reemplazo al lado. | **Parcial.** Hay sugerencias de similares en la ficha rápida, pero no reemplazan el ejercicio de la sesión. | `src/features/exercises/lib/similar-exercises.ts`, `components/quick-reference-sheet.tsx` · `oG:lib/active-exercise-swap.js` | No | M | Media |
| Notas | Nota fija y nota anclada por ejercicio, nota del día y nota de sesión. | **Parcial.** Nota por ejercicio de rutina, visible en la vista semanal y el formulario, no en la sesión. `workouts.notes` existe sin interfaz. | `routine-form-page.tsx:258,353`, `workout-session.ts:14` · `oG:lib/history.js:395-425`, `lib/day-notes.js` | No | S | Media |
| Duración | Si la sesión quedó abierta más de 20 min, toma como fin el último set marcado. | **Parcial.** `finished_at - created_at` sin corrección; una sesión olvidada infla la duración. | `src/features/workout-session/lib/format-duration.ts` · `oG:lib/finish-workout.js:31-49` | No | S | Baja |
| Resumen comparativo | Por ejercicio: hoy frente a la última vez, y con qué abrirá la próxima sesión. | **Parcial.** Resumen con totales, PRs nuevos y desglose, sin comparación ni próxima carga. | `workout-summary-page.tsx` · `oG:lib/finish-compare.js` | No | M | Baja |

### Tipos de set y esfuerzo

| Funcionalidad | openGym (cómo funciona) | Workout-Tracker | Evidencia | Schema | Esfuerzo | Prioridad |
|---|---|---|---|---|---|---|
| Sets de calentamiento | Fase aparte, excluida de volumen, récords y progresión. | **Completa.** Tag `warmup` excluido en cliente y en SQL. | `0001_core_schema.sql`, `0004_functions.sql`, `src/shared/lib/countable-set.ts` · `oG:lib/workout-model.js:14-21` | No | — | — |
| Calculadora de calentamiento | Cada peldaño cierra la mitad de la distancia al peso objetivo, nunca por debajo de la barra; se insertan como filas. | **Parcial.** La rampa se calcula y se muestra en la calculadora de discos, pero no crea sets. | `src/shared/lib/plates.ts` (`warmupRamp`), `components/plate-calculator/plate-calculator.tsx` · `oG:lib/history.js:520-548` | No | S | Baja |
| Drop sets | Las bajadas cuelgan del set padre; sugiere un ~20 % menos, ajustado a peso cargable. | **Parcial.** Tag `drop` sobre un set normal, sin vínculo con el set padre. | `components/tag-overlay/tag-overlay.tsx` · `oG:lib/workout-model.js:25-35` | Sí | M | Baja |
| Al fallo | Marca booleana combinable con cualquier tipo. | **Parcial.** Tag `failure` (admite 0 reps), excluyente con `drop` y `warmup`. | `0005_failure_reps_zero.sql` · `oG:lib/workout-model.js:37-49` | Sí, para combinarlo | S | Baja |
| RPE / RIR | Columna opcional por set, una escala por perfil; tarjeta de esfuerzo en estadísticas. | **No existe.** | Sin coincidencias en `src/` · `oG:lib/effort.js` | Sí | M | Baja |
| Superseries | Ejercicios contiguos forman una unidad; el descanso empieza al cerrar la ronda. | **No existe.** Se añadió `linked_to_previous` y se retiró. | `0009_*.sql`, `0010_drop_linked_to_previous.sql` · `oG:lib/supersetFlow.js` | Sí | M | Baja |
| Rest-pause, pirámide, back-off, por lado | Estructuras propias por fila (ráfagas, objetivo por set, izquierda/derecha). | **No existe.** | — · `oG:lib/workout-model.js`, `lib/pyramid.js`, `lib/backoff.js` | Sí | L | Baja |
| Cardio y ejercicios por tiempo | Cardio con minutos y velocidad; isométricos con cronómetro. | **No existe.** `set_entries` exige peso y repeticiones. | `0001_core_schema.sql` · `oG:lib/speed.js` | Sí | M | Baja |

### Planificación y progresión

| Funcionalidad | openGym (cómo funciona) | Workout-Tracker | Evidencia | Schema | Esfuerzo | Prioridad |
|---|---|---|---|---|---|---|
| Rutinas por día de la semana | Cada día guarda una lista de rutinas; varias el mismo día se fusionan en una sesión. | **Completa** en su forma simple: un día por rutina y vista semanal. | `0009_*.sql`, `routine-weekly-preview-page.tsx`, `lib/group-routines-by-day.ts` · `oG:lib/history.js:459-494` | No | — | — |
| Reprogramar una fecha | Una fecha puede cambiarse a otra rutina o a descanso sin tocar el plan semanal. | **No existe.** | — · `oG:lib/routines.js:21-33` | Sí | M | Baja |
| Rotación A/B/C | Alternativa a los días fijos: toca la siguiente rutina sin hacer. | **No existe.** | — · `oG:lib/rotation.js` | Sí | M | Baja |
| Progresión automática | Política por rutina o ejercicio (lineal, doble, etc.); la sesión cuenta como lograda solo si se completaron todos los sets al objetivo; propone la siguiente carga. | **No existe.** Los objetivos de la rutina son fijos. | `routine-form-page.tsx:335-353` · `oG:lib/progression.js` | Sí | L | Media |
| Descarga por estancamiento | Tras 3 sesiones sin lograr el objetivo, baja la carga a 0,9× (configurable). | **No existe.** | — · `oG:lib/progression.js:131-156` | Sí | M | Baja |
| Copiar rutina, deshacer borrado | Copia con sufijo; el borrado limpia referencias y se puede deshacer. | **No existe** copiar; el borrado es directo. | `routines-list-page.tsx`, `components/routine-list-card.tsx` · `oG:lib/routines.js:7-53` | No | S | Baja |
| Planes de inicio | PPL, torso/pierna, cuerpo completo y 5×5 como rutinas editables. | **No existe.** | — · `oG:lib/starter.js` | No | S | Baja |

### Ejercicios, estadísticas y cuerpo

| Funcionalidad | openGym (cómo funciona) | Workout-Tracker | Evidencia | Schema | Esfuerzo | Prioridad |
|---|---|---|---|---|---|---|
| Biblioteca de ejercicios | Catálogo con animaciones, filtro por equipo propio, favoritos y explorador muscular. | **Completa** en lo básico: búsqueda, filtros por categoría/zona/equipo, imagen y GIF, instrucciones. Sin favoritos ni filtro por equipo propio. | `src/features/exercises/api/exercises.ts`, `components/exercise-picker/exercise-picker.tsx` · `oG:lib/equipment.js`, `lib/favourites.js` | Sí, para favoritos | S | Baja |
| Ejercicios propios | Ejercicios creados por el usuario con foto o vídeo y músculos. | **No existe.** La tabla `exercises` no se puede modificar; haría falta una tabla aparte. | `AGENTS.md` · `oG:components/CustomMedia.jsx` | Sí | L | Baja |
| 1RM estimado | Epley por defecto, con otras fórmulas elegibles; solo sets completados; tope de 12 reps. | **Completa.** Brzycki, con marca de baja confianza por encima de 12 reps. | `src/shared/lib/one-rm.ts` · `oG:lib/onerm.js` | No | — | — |
| Récords personales | Derivados del historial: set más pesado, mejor 1RM estimado, mejor reps a un peso. | **Completa.** Mejor global por 1RM, mejor peso por número de reps, proyección, y PRs nuevos en el resumen. | `src/shared/lib/records.ts`, `workout-session/lib/new-prs.ts`, `history/lib/home-stats.ts` · `oG:lib/history.js:444-457` | No | — | — |
| Gráficas por ejercicio | Set tope, por set, 1RM, esfuerzo y reps máximas; un punto por sesión. | **Completa.** Peso, volumen y reps. | `exercise-detail-page.tsx`, `exercises/lib/to-chart-points.ts` · `oG:views/Stats.jsx:629-633` | No | — | — |
| Heatmap de actividad | 12 meses. | **Completa.** Mensual con navegación. | `history/lib/heatmap.ts`, `history-page.tsx` · `oG:components/Heatmap.jsx` | No | — | — |
| Racha | En semanas consecutivas con al menos un entrenamiento; la semana en curso no la rompe. | **Completa**, pero en días seguidos, que se rompe con cualquier día de descanso. | `history/lib/streak.ts` · `oG:lib/history.js:882-894` | No | S | Media |
| Balance muscular | Sets por músculo por periodo, sobre un mapa corporal; también fatiga y fuerza. | **No existe.** `exercise_focus` ya aporta el dato de músculo para calcular sets por región. | `0011_exercise_focus.sql` · `oG:views/Stats.jsx:125-288`, `lib/recovery.js` | No | M | Media |
| Calculadora de discos | Discos por lado según inventario propio; varios tipos de barra. | **Completa** con una barra. Se abre con el último peso registrado, no con el del set actual. | `src/shared/lib/plates.ts`, `workout-session-page.tsx:273` · `oG:lib/plates.js`, `lib/bar.js` | No | S | Baja |
| Peso corporal, medidas, fotos | Pesajes con objetivo, perímetros y fotos de progreso. | **No existe** (fuera de alcance v1 por decisión). | `tasks.md` "Not implemented", `profile-page.tsx:16-20` · `oG:lib/measurements.js`, `views/ProgressPhotos.jsx` | Sí | M | Baja |

### Datos y plataforma

| Funcionalidad | openGym (cómo funciona) | Workout-Tracker | Evidencia | Schema | Esfuerzo | Prioridad |
|---|---|---|---|---|---|---|
| Editar o registrar sesiones pasadas | Editar un workout guardado, registrar uno antiguo, cambiar su fecha; los récords se recalculan solos. | **No existe.** El workout terminado es de solo lectura. | `src/features/history/README.md` · `oG:lib/session-edit.js`, `lib/workout-date.js` | No | M | Media |
| Uso sin conexión | Service worker con arranque offline y fusión de cambios entre dispositivos. | **Parcial.** Shell y catálogo cacheados; cada set necesita red. Hay estado de error con "Reintentar". | `vite.config.ts`, `workout-session-page.tsx:282-296` · `oG:frontend/public/sw.js`, `lib/sync-merge.js` | No | L | Media |
| Exportar y respaldo | Copia completa en JSON, además de otros formatos. | **No existe.** | — · `oG:docs/DATA_IMPORTS.md` | No | S | Baja |
| Importar | CSV de Strong, Hevy, FitNotes y genérico. | **No existe.** | — · `oG:lib/import-csv.js` | No | M | Baja |
| Cambio kg/lb | Conversión real de todos los pesos almacenados. | **No existe** (unidad única kg por decisión). | `tasks.md` "Not implemented" · `oG:lib/units.js` | Sí | M | Baja |

## b) Lo que Workout-Tracker tiene y openGym no

Lista corta, y con la salvedad de que openGym no se leyó entero: "no encontrado" se refiere a los módulos revisados.

- **Foco muscular fino por ejercicio.** `exercise_focus` clasifica cada ejercicio en 32 regiones (cabeza larga del tríceps, deltoides lateral, etc.) con nivel de confianza, y lo usa para sugerir similares. En openGym la sustitución usa músculo principal y equipo. (`0011_exercise_focus.sql`, `exercises/lib/similar-exercises.ts`)
- **Tabla de récords por número exacto de repeticiones y proyección.** Mejor peso para cada cantidad de reps y estimación de peso para otra cantidad. En openGym solo se encontró el mejor reps-a-un-peso en sets de pirámide. (`shared/lib/records.ts`)
- **1RM de baja confianza visible en vez de descartado.** Los sets de más de 12 reps se grafican marcados; openGym los excluye del cálculo. (`shared/lib/one-rm.ts`, `exercise-detail-page.tsx`)
- **Variación a 8 semanas** como dato del ejercicio. (`exercises/lib/eight-week-delta.ts`)
- **Datos relacionales con autorización por fila.** Tablas normalizadas con RLS y pruebas de integración de RLS; openGym guarda un documento JSON por perfil. Facilita consultas agregadas como el balance muscular. (`supabase/migrations/0003_rls.sql`, `supabase/tests/`)
- **Un solo workout activo garantizado por la base de datos.** (`0002_indexes.sql`)
- **Filtro del historial por rutina**, enlazable por URL. No verificado en openGym. (`history-page.tsx`)

## c) Funcionalidades de openGym que no aplican

| Funcionalidad | Por qué no aplica |
|---|---|
| Guías de Docker Compose, Helm, Kubernetes y Nix | Son para que terceros desplieguen el producto; aquí ya hay un despliegue propio (`Dockerfile`, `docker-compose.yml`, `nginx.conf`). |
| Multi-perfil, panel de administración, invitaciones, auditoría, límites de tasa | App de un solo usuario; RLS ya aísla los datos. |
| Passkeys, modo invitado, emparejar dispositivos por QR | Supabase Auth con correo y contraseña cubre el caso. |
| App nativa con Capacitor, APK con autoactualización, Health Connect | La PWA instalada es suficiente para uso personal. |
| Servidor de sincronización con fusión por campo | Supabase es la única fuente de verdad; no hay copia local que fusionar. |
| Notificaciones push desde servidor | No hay capa de servidor. Para el descanso bastan sonido y vibración locales. |
| 19 idiomas y soporte RTL | La app se usa solo en español. |
| Coach con IA y servidor MCP | Opcional incluso en openGym; no resuelve el problema de usabilidad. |
| Exportación FIT, impresión PDF, compartir planes | Pensado para relojes, papel y otros usuarios. |
| Check-in de gimnasio y recordatorios | Sin valor para un único usuario con rutina fija. |
| Plantillas de balance estructural | Análisis avanzado; antes hace falta el balance muscular básico. |

## d) Top 5 recomendados

Ordenados por valor frente a esfuerzo. Ninguno requiere migración. Todos atacan el bucle de registro, que es donde está la dificultad de uso.

**Decisión del 2026-10-13:** no se añaden temporizadores de ningún tipo (ni descanso automático, ni duración en vivo, ni ejercicios cronometrados). Se mantiene la decisión previa "sin temporizadores en vivo"; la fila "Temporizador de descanso" de la tabla queda descartada.

| # | Qué | Esfuerzo | Depende de |
|---|---|---|---|
| 1 | Sets precargados al iniciar, con el rendimiento anterior por set | M | — |
| 2 | Inicio en un toque de la rutina del día | S | — |
| 3 | Corregir en sesión: editar, desmarcar y borrar sets; descartar workout | S | — |
| 4 | Pantalla siempre encendida | S | — |
| 5 | Sesión como lista completa, con agregar y sustituir ejercicio | M | 1 y 3 |

**1. Sets precargados al iniciar.** Al empezar desde una rutina, crear `target_sets` filas por ejercicio con las repeticiones del plan y el peso de la última sesión. Cambiar la columna "Anterior" para que muestre peso × reps del set equivalente de la vez anterior. Registrar un set pasa a ser un toque. Es la base de casi todo lo demás.

**2. Inicio en un toque.** Que "Hoy toca" use `day_of_week` (con la última rutina usada como respaldo) y que su botón inicie esa rutina directamente. El selector queda para freestyle u otra rutina.

**3. Corregir en sesión.** Permitir editar cualquier set, desmarcarlo y borrarlo, y añadir "descartar workout". Va junto con el 1: con filas precargadas, sobrarán sets que hay que poder quitar.

**4. Pantalla siempre encendida.** Wake lock mientras la sesión está abierta, readquirido al volver a la app. No es un temporizador: solo evita que el teléfono se bloquee.

**5. Sesión como lista completa.** Mostrar todos los ejercicios en una lista desplazable, permitir agregar ejercicios en cualquier momento y sustituir uno por un similar reutilizando `similar-exercises.ts`. Revierte la decisión de congelar la lista de ejercicios. Necesita el 1 (las filas ya existen al entrar) y el 3 (quitar lo que sobra).

**Después del top 5**, en este orden:

| Qué | Esfuerzo | Migración |
|---|---|---|
| Racha por semanas en vez de días | S | No |
| Notas de la rutina visibles durante la sesión | S | No |
| Resumen comparativo al terminar (hoy frente a la última vez) | M | No |
| Balance muscular: sets por músculo por semana, sobre `exercise_focus` | M | No |
| Editar sesiones pasadas | M | No |
| Sugerencia de la siguiente carga | L | Sí; requiere el punto 1 |

El seguimiento de la implementación está en `odd/tasks/logging-loop.md`.
