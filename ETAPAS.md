# Evolución de la plataforma

## Auditoría inicial — 7 de octubre de 2026

- Sitio estático, sin framework, servidor ni proceso de compilación. Dos HTML equivalentes comparten `datos.js`, `app.js` y `estilos.css`; sus rutas relativas sirven en GitHub Pages y bajo `file://`.
- Inventario: 148 ejercicios, siete categorías reales, 34 soluciones, 17 ejercicios con pruebas, 24 materiales y 104 ejemplos originales. `datos.js` contiene consignas, plantillas, pistas, soluciones y pruebas como cadenas Python. No se modifica este archivo en la Etapa 1.
- Python: Pyodide 314.0.7 desde CDN, worker de tipo módulo creado con Blob, namespace por ejecución, entradas predefinidas, carga de paquetes por imports. Límite de carga de 120 s, ejecución de 12 s, salida de 100 000 caracteres y detención mediante `terminate()`. La arquitectura coincide con la documentación oficial: https://pyodide.org/en/stable/usage/webworker.html.
- Persistencia: localStorage, formato v2, código/notas/entradas/estado por ejercicio, respaldo JSON, migración del progreso de la guía anterior. El estado de dominio es una declaración del estudiante, no una medición objetiva. IndexedDB no se justifica todavía; los nuevos registros serán acotados.
- Reutilizable: editor con resaltado y sangría, Ctrl/⌘+Enter, Esc para liberar Tab, filtros por tema/objetivo/estado, confirmación de restablecimiento, ayudas TDA, visor PDF, laboratorio de matrices/Fibonacci/suma y simulacro de 90 min con sessionStorage.
- Verificación inicial: `verificar.py` pasa con 65 aserciones. No hay suite JavaScript ni automatización de navegador. La URL publicada no pudo leerse con la herramienta web; el diagnóstico se basa en el repositorio local.

## Problemas y oportunidades

La corrección actual aborta al primer fallo, sin contar casos ni distinguir un resultado incorrecto de una excepción. Hay pruebas TDA con preparación compartida: reiniciar cada aserción cambiaría su significado. Las pistas son de un solo nivel; algunas contienen implementación. La validación del respaldo descarta campos nuevos y un guardado corrupto puede reemplazarse durante el arranque. El worker mantiene al navegador receptivo pero **no es una barrera de seguridad para código hostil**: dispone de APIs de red del worker y no tiene límite estricto de memoria. La salida necesita agruparse para evitar miles de mensajes al DOM.

`app.js` mezcla persistencia, pedagogía, ejecución y vistas; sus líneas extensas complican cambios. Renderizar todas las celdas de un notebook en cada selección es otra oportunidad futura. Ya existen foco visible, enlace de salto y estilos mobile; faltan resultados estructurados accesibles y controles de ayuda progresiva. La importación que sobrescribe borradores necesita confirmación. El simulacro oculta ayudas visualmente, pero el control debe aplicarse también al abrirlas.

## Arquitectura y etapas

1. **Fundamentos (esta entrega):** evaluador Python encapsulado en un recurso JS para conservar `file://`; worker separado; módulo puro de pedagogía/validación; resultados por caso y tiempo sin incluir descarga; diagnóstico local sin soluciones; pistas de tres niveles y registro de asistencia; extensión v3 compatible con v2. Pruebas unitarias Python y Node, regresión de los 148 ejercicios y comprobación estática de ambos HTML. Ninguna prueba automática marcará dominio.
2. **Aprendizaje:** separar completado, aprobado y dominio con evidencia; fórmulas documentadas por las siete categorías; recomendador local y repasos a 1/3/7/14 días. La declaración manual anterior debe conservarse como tal.
3. **Evaluación:** ampliar el simulacro existente con selección, resultados, tiempos por ejercicio, historial y recomendaciones; protección frente a salidas accidentales.
4. **Experiencia visual:** simulaciones controladas de recorridos, llamadas, pilas/colas y diccionarios/conjuntos; navegación y distribución mobile. No llamar traza del alumno a una simulación.
5. **Robustez:** evaluar IndexedDB con datos reales; migraciones, importación/exportación exhaustiva, recuperación y regresión de navegador.

La Etapa 1 no añade contenidos oficiales, no cambia soluciones ni reconstruye las vistas. La asistencia registrada es una base para las etapas siguientes, no una nueva calificación académica.

## Entrega de la Etapa 1

### Archivos

| Archivos | Cambio |
| --- | --- |
| `index.html`, `Guia primer parcial estructura de datos.html` | Mismos controles y orden de scripts; resultados accesibles, diagnóstico y tres niveles de pistas. |
| `ruta-entrenamiento/app.js`, `estilos.css` | Integración en la interfaz existente, registro de ayudas, control de dominio declarado, resultados y protección del simulacro. |
| `ruta-entrenamiento/evaluador.js` | Texto Python que interpreta las pruebas originales, evalúa cada caso y comunica avance. Se empaqueta como JS para funcionar al abrir el HTML local sin fetch. |
| `ruta-entrenamiento/runtime.js` | Worker reutilizable, mensajes identificados, salida agrupada y liberación de proxies Python. |
| `ruta-entrenamiento/pedagogia.js` | Reglas locales, tres niveles de pistas, 22 comprobaciones adicionales, validación/migración v2→v3. |
| `ruta-entrenamiento/tests/pedagogia.test.cjs`, `runtime.test.cjs`, `interfaz.test.cjs`, `test_evaluador.py` | Pruebas unitarias y de integración local; dobles explícitos de DOM, Worker y carga de Pyodide. |
| `ruta-entrenamiento/verificar.py` | Verifica ahora ambos HTML, sus recursos y orden de carga. |
| `README.md`, `LEEME - Ruta de entrenamiento.md`, `ETAPAS.md`, `.gitignore` | Uso, auditoría, límites, validación y exclusión de cachés de pruebas. |

### Comportamiento implementado

- Resultados por caso: entrada o preparación/operaciones compartidas, esperado, obtenido, categoría del error y tiempo. Las comparaciones no vuelven a llamar la función del estudiante para mostrar el resultado. Los casos TDA conservan estado y orden. Un fallo de preparación deja los siguientes como no ejecutados.
- Se cuentan 88 casos entre los 17 ejercicios con contrato automático: 65 aserciones originales, una comprobación original de excepción y 22 comprobaciones nuevas. Ninguna solución, consigna o prueba original fue modificada.
- Diagnóstico determinista basado en excepciones, resultados, tema y última versión ejecutada. No usa servicios ni soluciones de referencia. Las causas sugeridas se presentan como orientación. Se avisa si el editor difiere de la versión ejecutada.
- Pistas secuenciales de orientación, enfoque y pseudocódigo. Los 17 ejercicios con pruebas tienen tres pistas específicas; los otros conservan una guía del tema identificada como tal. La pista anterior sigue disponible por consulta explícita tras el nivel 3. Reabrir no suma usos. Los niveles 2/3 o las referencias requieren reintentar antes de declarar dominio; aprobar nunca marca dominio automáticamente.
- Se guarda la asistencia del intento, total histórico de pistas, último reporte y último código ejecutado, más 30 resúmenes de intentos por ejercicio. Exportación e importación v3 conservan esos campos; v2 sigue aceptado. Copia preventiva de la migración, protección del guardado corrupto y confirmación antes de sobrescribir con una importación.
- La ejecución conserva el límite de 12 s y la cancelación mediante worker. Un timeout conserva los resultados ya comunicados; la salida se limita a 100 000 caracteres y se agrupa. Mensajes atrasados no actualizan otro ejercicio. Las ayudas nuevas quedan ocultas y sus manejadores bloqueados en simulacro.

### Verificación ejecutada

- `python3 ruta-entrenamiento/verificar.py`: 148 ejercicios, 127 consignas de notebooks, 24 materiales, 104 celdas originales y 65 aserciones originales; ambos HTML equivalentes y recursos relativos válidos.
- `python3 -m unittest discover -s ruta-entrenamiento/tests -p 'test_*.py' -v`: 9 pruebas, incluidas las 17 soluciones oficiales con los 88 casos, sintaxis, excepciones, estado compartido, entradas y avances parciales.
- `node --test --test-isolation=none ruta-entrenamiento/tests/*.test.cjs`: 19 pruebas. Migraciones, respaldo corrupto, pistas, diagnóstico, importación, resultados, cancelación, tiempos, salida masiva y bloqueo de ayudas en simulacro.
- `node --check` para los cuatro módulos JS y `git diff --check`: sin errores. `datos.js` conserva el contenido del repositorio. No hay compilación que ejecutar: es un sitio estático con rutas relativas.

### Límites y validación pendiente

La comprobación de navegador real **no se pudo completar**: Chromium/Electron abortó al arrancar por restricciones de sandbox (`shutdown: Operation not permitted`) y el entorno no resuelve el CDN de Pyodide. No se afirma verificada la carga real de Pyodide, la consola del navegador ni la apariencia responsive. Las pruebas de interfaz son dobles, y las pruebas del evaluador ejecutan el mismo texto Python con CPython/NumPy locales.

El evaluador está pensado para los contratos existentes: cuenta aserciones de nivel superior y el patrón de excepción del TDA Puerto. No pretende ser un framework general para pruebas arbitrarias con asserts anidados. Mantiene la preparación compartida; una solución que muta indebidamente esa preparación puede afectar casos posteriores. Las mediciones incluyen la corrección y no sirven como benchmark. El worker conserva APIs de red y carece de límite estricto de memoria: no se promete aislamiento de seguridad para código hostil.

La ayuda aún es general por tema en 131 ejercicios, y el historial completo con sus vistas corresponde a la Etapa 2. El dominio sigue siendo declarado; no puede acreditarse un reintento autónomo solo por presionar el botón. No se amplían en esta entrega el laboratorio ni los simulacros más allá de mantener ocultas las nuevas ayudas.

### Comprobación manual antes de publicar

1. Abrir `index.html` con conexión en navegador moderno y luego servir la carpeta bajo una ruta como `/ruta-estructura-de-datos/`; revisar también el HTML alternativo y la consola del navegador.
2. En rellenaMatriz, correr una solución correcta, una que devuelva ceros, una sin return y otra con sintaxis incorrecta. Revisar conteos, arrays esperados/obtenidos y diagnóstico; después editar para comprobar la advertencia de versión.
3. Ejecutar `while True: pass`: verificar que la página sigue respondiendo, Detener funciona y el límite de 12 s cancela. Probar salida masiva y volver a ejecutar tras detener.
4. En Puerto, comprobar el orden de preparación, transferencias y el caso de excepción. Revisar la ejecución libre de programas con input y el bloqueo del bloque `__main__` durante pruebas.
5. Abrir niveles 1→2→3, ocultar/reabrir, recargar y exportar/importar. Comprobar que el total no aumenta al reabrir, que se conservan borradores y que nivel 2 impide declarar dominio en ese intento.
6. Iniciar el simulacro con una ayuda abierta: verificar que se cierra y que pistas, soluciones y diagnóstico permanecen ocultos al cambiar de ejercicio y recargar. Terminarlo y comprobar que vuelven los controles.
7. Navegar con teclado y viewport de 375 px: foco visible, Tab/Esc del editor, botones, detalles de resultados y ausencia de desbordamiento de página.

Tras esta validación, la siguiente implementación es la Etapa 2: métricas separadas por competencias, recomendaciones y repaso espaciado a partir de la asistencia y resultados guardados.

## Entrega de la Etapa 2 — Aprendizaje

### Alcance y decisiones

Se reutilizan categorías, etiquetas de nivel, contratos automáticos, ayudas e historial de la Etapa 1. No se añaden ejercicios ni se modifican consignas o soluciones oficiales. El laboratorio y la ampliación del simulacro quedan para las etapas siguientes. La validación de navegador real de la Etapa 1 continúa pendiente por las restricciones ya documentadas.

El catálogo no tiene dificultad numérica: usa **Base**, **Práctica**, **Integración** y **Refuerzo**. El recomendador utiliza estas etiquetas como orientación; no presenta una dificultad inferida como si fuera oficial. Los 131 ejercicios sin pruebas incluidas tienen un camino de autoevaluación explícito. Una ejecución libre sin excepciones nunca acredita su resolución.

### Fórmulas de las competencias

| Métrica | Numerador | Denominador / criterio |
| --- | --- | --- |
| Completados | Marca independiente de completado, activada por una aprobación completa, una autoevaluación positiva o declaración explícita | Todos los ejercicios del tema. Puede desmarcarse sin borrar una aprobación histórica. |
| Aprobados por pruebas | Ejercicios que aprobaron todos sus casos alguna vez, sin error global ni casos omitidos | Solo ejercicios con pruebas incluidas. No se calcula porcentaje sobre ejercicios que carecen de pruebas. |
| Consolidados sin ayuda | Resolución inicial y al menos dos repasos válidos posteriores, sin pistas de ningún nivel ni referencias, con último resultado autónomo positivo | Todos los ejercicios del tema. Los que carecen de pruebas se identifican como consolidados mediante autoevaluación. |
| Rendimiento | Intentos de pruebas completamente aprobados | Intentos evaluables mediante pruebas en los últimos 30 registros por ejercicio. Multiplicar por 100 y redondear para mostrar. Sin intentos, mostrar ausencia de datos. |
| Errores frecuentes | Intentos con sintaxis, ejecución, lógica o tiempo agotado, agrupados por tipo de excepción o categoría | Últimos 30 registros por ejercicio. No multiplicar por casos fallidos. Las dificultades autoevaluadas se consideran categoría lógica. |

Las cancelaciones, los fallos de infraestructura, las ejecuciones libres y las autoevaluaciones se excluyen del porcentaje de rendimiento automático. Las ejecuciones libres con errores del programa pueden orientar los refuerzos, sin acreditar o castigar el calendario. Las marcas históricas `status: mastered` permanecen como **estado declarado** y no cuentan automáticamente como evidencia de consolidación.

### Calendario determinista

Los intervalos son duraciones de 24 horas: `[1, 3, 7, 14] × 86 400 000 ms`.

1. Primera resolución autónoma: racha 1, etapa 0, próximo repaso `fecha de resolución + 1 día`.
2. Primer repaso válido: racha 2, etapa 1, próximo repaso `fecha del repaso + 3 días`.
3. Segundo repaso válido: racha 3, etapa 2, próximo repaso `fecha del repaso + 7 días`; puede contarse consolidación.
4. Tercer repaso válido y siguientes: etapa 3, próximo repaso `fecha del repaso + 14 días`. La racha se acota a 5, sin perder el indicador de consolidación.

Un repaso válido debe iniciarse a partir de su vencimiento, partir de la plantilla, registrar trabajo en el editor, aprobar y no usar ninguna ayuda. Una sesión ya aprobada queda cerrada y su fecha de inicio no puede volver a contarse como otro repaso. Reejecutar el borrador principal, dejar la plantilla intacta o hacer un repaso anticipado conserva el vencimiento y no aumenta la racha. Si el estudiante ya está consolidado, tener un repaso pendiente se muestra por separado; el simple transcurso del tiempo no borra su historial.

Un fallo evaluable o una resolución asistida reinicia etapa/racha de autonomía. Si el ejercicio ya estaba resuelto, su próximo repaso pasa a `fecha del intento + 1 día`. Una resolución positiva con ayuda también programa ese intervalo. Un fallo en un ejercicio nuevo orienta el reintento, sin inventar un repaso de contenido ya resuelto. Cancelación o fallo del motor deja intacta la evaluación y el vencimiento anteriores. Una nueva resolución autónoma tras un fallo comienza nuevamente la racha inicial.

### Recomendador local

Los repasos vencidos se ordenan antes de los demás candidatos. Para el resto, se suman estos criterios; sus pesos **son prioridades de entrenamiento, no porcentajes de dominio ni probabilidades**:

| Criterio | Prioridad |
| --- | --- |
| Repaso vencido | `100 + min(días de atraso, 30)` |
| Última evaluación fallida | `65` |
| Última resolución con ayuda | `50` |
| Ejercicio incompleto con estado Practicando | `35` |
| Ejercicio incompleto | `20 + 20 × (1 − completados del tema / total del tema)` |
| Tipo de error más frecuente del tema, si aparece al menos dos veces | `min(20, cantidad × 4)` |
| Inactividad de al menos una semana en ese ejercicio | `min(días sin práctica, 30)` |
| Base en un tema sin completados; Base/Refuerzo tras fallar Integración; o nivel siguiente tras resolver Base/Práctica sin ayuda | `8` para el criterio aplicable |

Los empates mantienen el orden del catálogo. Se proponen hasta tres ejercicios: primero los repasos vencidos; en los demás se favorecen temas distintos y luego se completan los lugares disponibles. Los completados sin dificultad reciente y sin repaso vencido se omiten. Cada recomendación muestra razones concretas; el algoritmo y las fórmulas están en este documento y en el módulo puro.

**Posponer 24 h** modifica solo `dismissedUntil`: no cambia el vencimiento ni el contador de repasos pendientes. Se puede elegir cualquier ejercicio por los filtros existentes. **Continuar donde quedé** abre la selección guardada, incluido su borrador de repaso si aún se estaba trabajando allí.

### Persistencia y migración

El formato pasa a **v4**, conserva la clave local anterior para encontrar los datos y acepta respaldos v2/v3/v4. La copia previa a migrar está en `unahur_training_route_v2_before_v4`; se mantiene la protección contra sobrescritura si la copia no puede guardarse. Un progreso v2/v3 puede conservar completados declarados y aprobaciones conocidas, pero no reconstruye repasos autónomos a partir de ejecuciones ordinarias antiguas.

Cada ejercicio guarda un resumen `learning`, los últimos 30 intentos, el borrador principal `code`, el borrador de repaso `reviewCode` y la sesión. El resumen conserva aprobaciones históricas y calendario aunque los intentos más antiguos salgan del límite. La migración/importación valida tipos, contadores, fechas, categorías, asistencia y fuentes; la evidencia futura o sin fecha válida no aumenta rachas. Los nombres de error se agrupan en un objeto sin prototipo para evitar contaminación mediante claves importadas.

No se implementa IndexedDB: el volumen sigue acotado y las cuotas/fallos de localStorage se comunican con opción de exportar. No hay sincronización, servidor, cuentas, claves API ni nuevas dependencias del sitio. El código de todos los intentos históricos no se conserva: se guardan borradores actuales y la última versión ejecutada. Empezar otro repaso puede reemplazar el borrador del repaso anterior después de confirmar, conservando el principal.

### Archivos de esta etapa

- Nuevos: `ruta-entrenamiento/aprendizaje.js` (modelo, calendario y recomendador), `aprendizaje-vistas.js` (paneles e historial) y `tests/aprendizaje.test.cjs`.
- Modificados: ambos HTML; `app.js`, `pedagogia.js`, `estilos.css` y `verificar.py`; `tests/interfaz.test.cjs` y `tests/pedagogia.test.cjs`; `README.md`, `LEEME - Ruta de entrenamiento.md` y este documento.
- Sin cambios en esta etapa: `datos.js`, soluciones/consignas originales, evaluador Python, runtime, materiales y biblioteca.

### Verificación y límites

- **44 pruebas JavaScript**: se conservan las pruebas previas y se agregan calendario, independencia de métricas, migraciones, inactividad, niveles, posposición, autoevaluaciones, borradores, importación v4 y sesiones de repaso que no pueden contabilizarse dos veces. Las pruebas de eventos de la aplicación usan dobles de DOM y Worker con reloj controlable.
- **9 pruebas Python**: las 17 soluciones continúan aprobando los 88 casos de la Etapa 1 con CPython/NumPy locales.
- `verificar.py`: mantiene 148 ejercicios, 127 consignas, 24 materiales, 104 celdas originales, 65 aserciones originales y ambos HTML equivalentes. Comprueba también controles del módulo de vistas y el orden de siete scripts con rutas relativas.
- Se comprueban sintaxis JavaScript, ausencia de cambios en `datos.js` y `git diff --check`. El sitio sigue siendo estático, sin compilación.

La apariencia responsive, la consola y Pyodide en navegador real siguen sin verificarse en este entorno. La consolidación es un indicador transparente de práctica, no una acreditación académica ni una garantía de haber escrito de memoria; no inspecciona fuentes externas, portapapeles ni explicaciones del estudiante. Las autoevaluaciones dependen de su criterio. Las pruebas no comprueban todas las restricciones de implementación de las consignas.

Antes de publicar: comprobar en un navegador con conexión la selección/posposición de recomendaciones; los siete temas; una aprobación y sus tres métricas; el inicio/recarga/retorno de un repaso; exportación/importación v4; controles con teclado y en pantalla pequeña; y ocultación de ayudas y repaso durante el simulacro. La lógica de fechas se verifica con reloj controlado en la suite, sin esperar días reales ni editar relojes del navegador del estudiante.

La etapa siguiente es **Evaluación**: ampliar el simulacro existente con selección por temas/niveles, resultados, historial, tiempos por ejercicio y recomendaciones posteriores. El modelo de aprendizaje y los registros de esta etapa quedan preparados para reutilizarse.

## Entrega de la Etapa 3 — Evaluación

### Diagnóstico y arquitectura

El simulacro anterior solo guardaba un deadline de 90 minutos en sessionStorage y escribía sobre el borrador de práctica/repaso. No tenía snapshot de entrega, tiempos por ejercicio ni resultados propios. Se conserva su preset de **intervalo creciente + TDA Puerto**, y se reutilizan el editor, worker, corrección por casos, diagnóstico local, catálogo y modelo de aprendizaje.

`simulacros.js` contiene el modelo puro: selección, reloj por ejercicio, cambios de borrador, estados, resultados, historial y validación. `simulacros-vistas.js` contiene preparación, banner, resultados e historial. `app.js` coordina el editor y la cola de corrección con el worker existente. No se añade servidor, autenticación, librería de UI ni servicio externo.

### Comportamiento implementado

- Selección manual de 1–6 ejercicios por las siete categorías reales y sus niveles originales. Se puede combinar temas al cambiar filtros. La duración va de 5 a 180 minutos; se mantiene el preset de 90 minutos. No se presenta una dificultad calibrada inexistente.
- Un intento tiene borradores propios por ejercicio (código, notas y stdin) y comienza con `starter`, sin copiar el código de práctica o los ejemplos originales. Volver a práctica al terminar restaura los borradores previos.
- Estados **running → grading → finished**. La entrega manual requiere confirmar; el vencimiento congela lo guardado al deadline. Se bloquean cambios de respuestas durante la corrección, incluidas ediciones tardías cuando el plazo vence mientras hay una confirmación abierta.
- Corrección automática secuencial de las respuestas que tienen pruebas incluidas. Se reutiliza un resultado solo cuando coinciden código y stdin; si no, se vuelve a ejecutar con el mismo contrato. Las plantillas sin cambios se registran como consignas sin respuesta. La corrección conserva los límites anteriores de 120 s para carga y 12 s para ejecutar cada tarea.
- Resultados por ejercicio, casos aprobados/fallidos/omitidos, cobertura de pruebas, códigos entregados, notas y diagnóstico local. Las respuestas sin pruebas se identifican para revisión manual. No se les inventa un aprobado ni una nota global.
- Fortalezas observadas y aspectos a reforzar por los temas efectivamente seleccionados. Se describen cantidades de aprobados, fallos, omisiones y respuestas pendientes de corrección, sin inferir dominio de una competencia por una sola evaluación. La práctica posterior remite a ejercicios fallidos, omitidos o pendientes de revisión; puede proponer Base/Refuerzo tras un fallo de Integración.
- Historial de diez intentos, incluido un resultado incompleto por problema de infraestructura. **Reintentar corrección** mantiene respuestas, ID y fecha de entrega; no añade otro simulacro ni duplica la evidencia ya publicada en aprendizaje.
- Las evaluaciones válidas se publican una vez como `kind: exam`. Un aprobado puede acreditar la primera resolución, pero no cuenta como repaso. Los fallos evaluables afectan el aprendizaje según las reglas existentes; cancelaciones, falta de respuesta y fallos del motor no se publican como fallos evaluables.

### Tiempos y prevención de interrupciones

El plazo general se calcula como `deadline = startedAt + minutos × 60 000`. Nunca se pausa por navegación, blur o cierre de pestaña. La entrega por vencimiento registra `submittedAt = deadline`, aunque el callback se ejecute después por suspensión del navegador. Si se cierra antes, la duración del intento es `submittedAt − startedAt`; el tiempo posterior de corrección queda fuera.

El tiempo por ejercicio es la suma de los tramos con Taller visible, ventana con foco y ejercicio seleccionado. Cada tramo se recorta al deadline, se cierra al cambiar de ejercicio/sección o perder visibilidad/foco, y no se acumula durante una pestaña cerrada. Se hacen checkpoints al guardar y cada diez segundos. Es tiempo **registrado de dedicación**, no CPU ni una garantía de atención. Ante cierre abrupto puede perderse el tramo no guardado. Al importar/restaurar se conserva el acumulado y se descarta el reloj de foco antiguo, evitando contar el tiempo cerrado.

El banner conserva temporizador, navegación entre ejercicios y entrega. Se ocultan pistas, soluciones, referencias, código de notebooks, auxiliares guardados, historial anterior y controles de repaso. La navegación del intento se limita a Mi ruta/Taller y sus ejercicios, y se bloquea importar otro estado. La salida/recarga registra un manejador `beforeunload`; el aviso nativo depende de las políticas e interacción previa del navegador. Recargar o cerrar no borra el intento. Si el plazo venció mientras estaba cerrado, se restaura la corrección pendiente sin descargar Python automáticamente al abrir: el usuario puede continuarla.

### Definición del resultado

| Estado | Criterio |
| --- | --- |
| Aprobado por pruebas | Respuesta modificada, pruebas disponibles, reporte de tests de ese código/stdin, total positivo, todos aprobados y ningún caso omitido/error global. |
| No aprobó | Reporte del mismo código/stdin con fallo de casos o error del estudiante, incluido timeout de ejecución. |
| Sin respuesta | Código igual a la plantilla al entregar. Las notas no se interpretan como implementación. |
| Revisión manual | Respuesta modificada de una consigna que carece de pruebas incluidas. |
| Sin corrección completa | No hay reporte válido de esa respuesta, o hubo cancelación/error de infraestructura. |

La cobertura es `ejercicios seleccionados con pruebas / ejercicios seleccionados`. La cantidad evaluada suma los aprobados y no aprobados mediante pruebas. Los totales de casos suman los reportes de esas evaluaciones; las correcciones incompletas se muestran aparte con sus avances por caso cuando existen. No se calcula una nota académica ni un porcentaje global mezclando consignas con y sin pruebas.

### Persistencia y compatibilidad

Formato **v5**, conservando la clave local `unahur_training_route_v2` para encontrar el progreso anterior. Acepta v2/v3/v4/v5 y hace copia previa en `unahur_training_route_v2_before_v5`. El agregado `exams` contiene `active` e historial; cada respuesta incluye el reporte y la versión de código/stdin evaluados. El estado de publicación por ejercicio evita duplicar aprendizaje al reintentar.

La importación valida fases, fechas, duración, IDs, tipos de reportes y tiempos acumulados; limita seis ejercicios por intento y diez resultados. Un activo incompatible rechaza la lectura/importación para conservar el guardado anterior. Los registros históricos incompatibles se excluyen. Los historiales se combinan por ID y fecha sin borrar los actuales al importar un formato anterior sin simulacros. Un temporizador antiguo **aún vigente** puede recuperar el preset y borradores disponibles, indicando que no existen tiempos por ejercicio anteriores a la recuperación. No se fabrican resultados de temporizadores viejos ya vencidos.

Se mantienen localStorage y los avisos de cuota/error con exportación. El historial se acota para evitar crecimiento indefinido; los intentos antiguos deben exportarse si se quieren conservar más allá de los diez actuales. Esto no agrega sincronización ni almacenamiento externo.

### Archivos y verificación

- Nuevos: `ruta-entrenamiento/simulacros.js`, `simulacros-vistas.js` y `tests/simulacros.test.cjs`.
- Modificados: ambos HTML; `app.js`, `pedagogia.js`, `aprendizaje-vistas.js`, `estilos.css` y `verificar.py`; pruebas de interfaz y pedagogía; README, LEEME y este documento.
- Sin cambios: consignas, soluciones oficiales, `datos.js`, materiales, evaluador Python y runtime del worker.

Pasaron **72 pruebas JavaScript** y las **9 pruebas Python** previas (17 soluciones con 88 casos). La suite integra reloj controlado, DOM/Worker dobles, configuración, foco/visibilidad, deadline, confirmación tardía, recarga, borradores separados, reportes de código/stdin coincidentes, cola de corrección, cancelaciones, errores del motor, reintentos, publicación única, historial, migración y restauración v5. `verificar.py` sigue comprobando 148 ejercicios, 127 consignas, 24 materiales, 104 celdas originales y 65 aserciones originales; verifica los controles y orden de nueve scripts de ambos HTML. Se comprobaron sintaxis JavaScript, rutas relativas, `git diff --check` y ausencia de cambios en `datos.js`.

### Límites y próximos pasos

Continúa pendiente la prueba real en navegador: apariencia, consola, avisos nativos de salida y descarga/ejecución de Pyodide. Las restricciones del entorno ya descritas impiden validarla; los dobles de DOM/Worker no la sustituyen. La ejecución Python comprobada utiliza CPython/NumPy locales y el mismo evaluador de la plataforma.

El modo examen organiza una evaluación personal local y no es un sistema antifraude: no controla otras pestañas, fuentes externas, consola de desarrollo o cambios del reloj del equipo. Las pruebas disponibles siguen sin verificar todas las restricciones de implementación, como recursividad obligatoria. Los tiempos y fortalezas se presentan con alcance explícito. Las 131 consignas sin pruebas incluidas siguen requiriendo revisión manual.

Antes de publicar: iniciar el preset y uno personalizado; navegar y recargar durante el intento; comprobar foco/visibilidad y aviso de salida; entregar con y sin cambios; verificar código y stdin de dos ejercicios con pruebas; simular falta de conexión y reintentar corrección; exportar/importar v5; revisar teclado, pantalla pequeña y consola del navegador. La lógica de vencimiento ya se prueba con reloj controlado, sin esperar 90 minutos reales.

La etapa siguiente es **Experiencia visual**: ampliar gradualmente las simulaciones del laboratorio y mejorar navegación, mobile y accesibilidad, conservando los nuevos flujos de práctica y examen.

## Entrega de la Etapa 4 — Experiencia visual

### Diagnóstico y alcance

El laboratorio existente ya permitía explorar regiones de matrices, Fibonacci y una suma recursiva fija. Se conserva esa base y se agregan pasos explícitos, acumuladores y pilas de llamadas. El Taller tenía búsqueda, filtros, guardado, ejecución por Ctrl/⌘ + Enter y un diseño vertical; faltaban navegación entre consignas y una distribución configurable. En mobile se ocultaban las etiquetas de filtros y todo el bloque de respaldo. La importación dependía de una etiqueta con un input oculto sin acceso directo por teclado. Además, se generaban todos los ejemplos del notebook en cada selección.

La implementación mantiene la identidad oscura y los componentes existentes. `laboratorio.js` concentra modelos puros, limitados y comprobables; `laboratorio-vistas.js` conecta controles y representaciones. `taller.js` unifica filtros, vecinos y validación de preferencias. `app.js` conserva la coordinación de borradores, aprendizaje, ayudas, Python y examen. No se agregan dependencias, servidores, animaciones automáticas ni instrumentación del código del estudiante.

### Laboratorio implementado

- **Matrices:** regiones anteriores, recorridos por filas/columnas, forma vacía, índices del paso actual, celdas visitadas, acumulador y resultado final. Cada valor sigue siendo `i + j`. El recorrido visita todas las celdas y suma únicamente las que pertenecen a la región seleccionada. Una región secundaria/superior rectangular queda detenida con explicación; no muestra un resultado inventado. Una matriz vacía termina con suma neutra 0. Cambiar forma/región/orden/celda de referencia reinicia el recorrido. Anterior y reiniciar permiten comparar pasos.
- **Teclado de matriz:** un único punto de entrada por Tab, flechas entre celdas, Inicio/Fin dentro de la fila y Ctrl + Inicio/Fin para extremos globales. La celda seleccionada recupera foco al actualizar la representación. Las etiquetas indican coordenadas, valor, región y visita; ✓ y el borde punteado complementan los colores.
- **Recursividad:** Fibonacci (n de 0 a 7), factorial (0 a 8) y suma de hasta ocho enteros entre −1000 y 1000, incluido el vector vacío. Se muestran parámetros, caso base, espera de hijos, retornos recibidos, combinación y resultado. La cima de la pila aparece arriba. Los eventos son snapshots independientes: un retorno muestra la llamada antes de retirarla; el último paso muestra la pila vacía. Se conservan los eventos anteriores y el ejemplo de suma en paneles desplegables. Un vector inválido informa el problema y conserva la simulación previa.
- **Pilas/colas:** insertar, extraer y consultar según LIFO/FIFO; etiquetas push/pop/top y enqueue/dequeue/front de los TP. Las consultas no cambian contenido ni orden. Se identifica cima/frente, se informa el vacío y se conservan doce operaciones con sus snapshots. El máximo visual es ocho elementos.
- **Diccionarios/conjuntos:** tres contratos explícitos: TDA Diccionario del TP6, dict nativo y set nativo. `insert` del TDA conserva una clave existente y la asignación reemplaza. Se distinguen get/remove del TDA y get/pop nativos cuando falta la clave. El conjunto evita duplicados y permite pertenencia/discard; la posición visual no implica un orden garantizado en Python. Claves, elementos y valores son texto acotado; máximo ocho entradas y doce eventos. Se escapa el contenido al generar HTML y las claves especiales no se usan como propiedades de objetos.

Todas estas vistas dicen **simulaciones controladas**. No ejecutan Python ni representan una traza del código escrito en el Taller. Los enlaces de práctica remiten a consignas reales de TP2, TP4, TP5 y TP6. El laboratorio no produce aprobaciones ni modifica el aprendizaje. Cambiar estructura/contrato comienza una simulación vacía; estas operaciones pequeñas son reversibles y se presentan explícitamente como reinicios. Su estado es temporal y no se incluye en el respaldo de progreso.

### Taller, mobile y accesibilidad

- Anterior/siguiente siguen exactamente la misma lista que el catálogo, con tema, objetivo, estado, búsqueda, nivel original y disponibilidad de pruebas. En examen se conserva el orden de selección y se restringe a sus respuestas. No hay salto circular ni cambio automático si una consigna queda fuera de filtros; se explica y se ofrece limpiar filtros, conservando el código abierto.
- Al navegar se conserva el borrador y el foco va al título de la nueva consigna. **Ir al editor** conserva código y selección. La navegación principal lleva el foco al encabezado de la sección elegida; el enlace de salto tiene un destino enfocable.
- Distribución vertical predeterminada y opción consigna/editor en columnas desde 1400 px de ancho. En pantallas menores queda apilada. El catálogo puede ocultarse y volver a mostrarse mediante un botón con aria-expanded/aria-controls. Las notas siguen disponibles en ambas distribuciones.
- Ctrl/⌘ + Enter ejecuta; Ctrl/⌘ + Shift + Enter prueba casos. Si faltan pruebas se informa sin iniciar Python. Se conserva Esc y luego Tab para salir del editor, con instrucciones asociadas al textarea mediante aria-describedby.
- En mobile quedan visibles las etiquetas de cada filtro y los controles de exportación, recuperación e importación. La importación tiene un botón nativo accesible por teclado y se desactiva durante examen. Se agregan tamaños de 44 px en controles principales, ajuste de nombres de archivo y textos extensos, foco visible para editor/summaries/títulos, respeto por movimiento reducido y texto del editor visible en colores forzados.
- Los ejemplos originales se generan al abrir su desplegable y se reutilizan mientras siga seleccionada la misma consigna. Su consulta sigue registrando asistencia; no se generan durante examen. Se conserva el contenido de todas las celdas.

### Persistencia y compatibilidad

El formato sigue siendo **v5**. Se agregan preferencias opcionales `layout: stacked|split` y `catalogCollapsed: boolean`, con valores por defecto que conservan el diseño anterior. Se validan al leer/importar y se incluyen en exportación. Importar un respaldo anterior sin preferencias conserva las elegidas en el navegador. Código, notas, reportes, repasos, ayudas y simulacros mantienen sus modelos y migraciones; se mantienen los límites del worker. Los doce scripts usan rutas relativas, carga defer y recursos locales compartidos por ambos HTML. El sitio sigue sin compilación.

### Archivos y verificación

- Nuevos: `ruta-entrenamiento/laboratorio.js`, `laboratorio-vistas.js`, `taller.js`; `tests/laboratorio.test.cjs`, `taller.test.cjs` y `test_estatico.py`.
- Modificados: ambos HTML; `app.js`, `pedagogia.js`, `estilos.css`, `verificar.py`; `tests/interfaz.test.cjs` y `pedagogia.test.cjs`; README, LEEME y este documento.
- Se conservan `datos.js`, todos los ejercicios, las soluciones oficiales, los materiales, el evaluador y el runtime Python.

Pasaron **95 pruebas JavaScript** (23 nuevas) y **12 pruebas Python** (9 del evaluador y 3 de estructura/semántica HTML). Las nuevas unidades verifican recorridos, vacíos, regiones, acumulación, casos base/retornos, snapshots, LIFO/FIFO, contratos de colecciones, límites, filtros y preferencias. La integración usa dobles de DOM/Worker y comprueba navegación, borradores, atajos, renderizado escapado, pasos, importación/recarga y restricciones de examen. La comprobación estática valida anidamiento completo, controles etiquetados, referencias ARIA y ausencia de tabindex positivo.

`verificar.py` confirma los 148 ejercicios, 127 consignas de notebooks, 24 materiales, 104 celdas originales idénticas y las 17 soluciones con 65 aserciones originales. La suite del evaluador sigue comprobando las 17 soluciones con 88 casos ampliados. Se comprobaron sintaxis de los doce JS, orden de carga, recursos relativos de ambos HTML, igualdad de entradas, `git diff --check` y ausencia de cambios en `datos.js`.

### Límites y próximos pasos

Quedan pendientes la apariencia real en desktop/mobile, los lectores de pantalla, colores forzados, foco nativo, consola y ejecución de Pyodide en navegador con conexión. Electron/Chromium no inicia por las restricciones de sandbox descritas anteriormente; Firefox headless también terminó con código 139 y sin captura utilizable. Las suites estáticas y los dobles de DOM no sustituyen esas pruebas. No se afirma una verificación visual, accesibilidad completa o ausencia de errores en consola real.

Antes de publicar: recorrer filas/columnas y vecinos con teclado; probar matriz vacía/rectangular; completar Fibonacci, factorial y suma vacía/negativa; comparar LIFO/FIFO y claves ausentes en los tres contratos; verificar filtros/navegación con borradores y repasos; probar ambos atajos; alternar distribución/catálogo en desktop y a 320–850 px; usar respaldo con teclado; comprobar contraste/foco/colores forzados y consola; repetir navegación en examen y abrir ejemplos después de entregarlo. La integración con código Python requeriría instrumentación adicional y se difiere; primero se evalúa el valor pedagógico de estas simulaciones.

La próxima etapa es **Robustez**: revisar volumen real y límites de almacenamiento, recuperación y combinación de respaldos, migraciones y regresiones; decidir IndexedDB solo si los datos y el mantenimiento lo justifican. No se cambia de almacenamiento en esta etapa.
