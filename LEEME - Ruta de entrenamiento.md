# Mi ruta de entrenamiento

Abrí **Guia primer parcial estructura de datos.html** con tu navegador. La página ahora se llama “Mi ruta de entrenamiento” y conserva el nombre del archivo para que puedas seguir usando tu acceso habitual.

La carpeta `ruta-entrenamiento` debe permanecer junto al HTML y a los materiales de la materia. No requiere instalación ni servidor para leer, editar o guardar código. La guía original está conservada en `respaldos/Guia primer parcial original.html`.

## Qué incluye

- Ruta con énfasis en matrices, recursividad y Fibonacci, seguida de integración y continuidad de la materia.
- 148 ejercicios: los 17 de la guía anterior, 127 consignas de los nueve notebooks y cuatro refuerzos adicionales identificados como tales.
- 24 fuentes: PDFs, notebooks, documento de pilas y colas y modelos Python. En “Teoría y materiales”, el visor muestra las páginas originales de los 12 PDF, incluidas figuras y fórmulas. Elegí el apunte desde el selector o desde los enlaces de cada concepto. También hay una transcripción de texto integrada.
- 34 soluciones de referencia; 17 incluyen pruebas automáticas de entrenamiento. Las demás consignas permiten escribir y ejecutar tus propias pruebas.
- Cronograma completo, plan semanal sugerido y simulacro de 90 minutos con pistas y soluciones ocultas.
- Editor por ejercicio con resaltado, números de línea, sangría, consola, entrada para `input()` y descarga `.py`.

## Cómo entrenar

1. Entrá a “Mi ruta” y elegí la primera etapa pendiente.
2. Leé la consigna y anotá el contrato y los casos límite en tus notas.
3. Escribí código sin consultar la solución. **Tab** agrega cuatro espacios; **Enter** conserva la sangría; **Ctrl/⌘ + Enter** ejecuta. **Esc** permite salir del editor con Tab.
4. Usá `print(...)` para ver resultados. Para programas que usan `input()`, escribí las respuestas debajo de la consola, una por línea. “Probar casos” ejecuta los casos incluidos cuando existen; no ejecuta el bloque `if __name__ == '__main__'`.
5. Si te trabás, abrí primero una pista. Hay tres niveles: orientación, enfoque y pseudocódigo. Abrilos de a uno y ocultalos cuando quieras volver a intentar; reabrir un nivel no suma otro uso. La pista anterior se conserva detrás de una consulta explícita en el tercer nivel, porque algunas incluyen código. Las consignas con pruebas tienen pistas específicas; el resto usa una guía del tema identificada como tal.
6. Marcá “Dominado” cuando puedas resolver sin ayuda, respetar la consigna, probar bordes y explicar por qué termina. Si abriste niveles 2/3 o consultaste una referencia, no podés declararlo dominado en este intento; si ya estaba marcado, pasa a “Repasar”. “Comenzar intento sin ayuda” cierra las ayudas y comienza otro registro de asistencia; conserva tu código y el total histórico de pistas. Reescribí de memoria y volvé a probar. El dominio sigue siendo una declaración manual: aprobar casos no lo marca automáticamente. Repetí a las 48 horas.

“Probar casos” muestra aprobados, fallidos y casos sin ejecutar, con entrada/operaciones, esperado y obtenido. Continúa tras una comparación incorrecta o una excepción en un caso; si falla el código inicial o la preparación compartida, deja los siguientes sin ejecutar. El test que exige una excepción en Puerto también se cuenta como caso. Se conservan las pruebas originales y se añaden bordes en los ejercicios cuyo contrato ya estaba definido. El tiempo de evaluación incluye ejecución y comprobaciones Python, sin descarga; no es una medición de complejidad algorítmica.

“Explicame mi error” usa reglas locales para diferenciar sintaxis, ejecución, lógica, tiempo agotado y problemas de carga. Señala causas posibles y preguntas para revisar sin mostrar la solución. El diagnóstico usa la versión ejecutada; si editás después, se muestra una advertencia. La ejecución libre no comprueba automáticamente el contrato. Durante el simulacro se ocultan también las pistas progresivas y el diagnóstico.

El simulacro sugerido combina **intervalo creciente** y **TDA Puerto**. Sus 90 minutos son una propuesta de práctica, no la duración indicada por la cátedra para el examen.

## Simulacros y modo examen

En **Mi ruta**, podés iniciar el preset anterior de 90 minutos o desplegar **Preparar otro simulacro**. Elegí de 1 a 6 consignas, filtrando por los temas reales y por Base, Práctica, Integración o Refuerzo. Las selecciones se conservan al cambiar el filtro, así podés combinar temas. La duración admite de 5 a 180 minutos. Las etiquetas del catálogo orientan la selección y no son una dificultad calibrada.

El intento comienza desde las plantillas y guarda código, notas y entradas por separado de tus borradores de práctica y repaso. Cambiá de ejercicio desde el banner o la lista del Taller. Durante el modo examen se ocultan pistas, soluciones, referencias, resultados de intentos anteriores y controles de repaso. Se limita la navegación a **Mi ruta** y **Taller**, y se bloquea la importación mientras el intento está activo. Podés ejecutar el código y probar casos cuando existan.

El banner conserva el temporizador visible. Cambiar de sección, perder foco, ocultar o cerrar la pestaña no pausa el límite general. El tiempo por ejercicio es distinto: se acumula mientras el Taller está visible, la ventana tiene foco y ese ejercicio está seleccionado. Se guarda periódicamente y al editar o cambiar de sección; ante un cierre abrupto puede faltar el tramo posterior al último guardado. No se interpreta tiempo con la pestaña cerrada como tiempo de trabajo.

**Entregar simulacro** pide confirmar antes de tiempo y congela las respuestas. Al vencer el plazo se entregan automáticamente los últimos borradores guardados; no se admiten cambios posteriores, incluso si venció mientras la confirmación estaba abierta. Se corrigen en secuencia las respuestas con pruebas incluidas. Un resultado anterior solo se reutiliza si corresponde al mismo código y las mismas entradas. La corrección puede terminar después del plazo: ese tiempo no se añade al tiempo del intento.

El resultado distingue:

- **Aprobado por pruebas:** pasó todos los casos del contrato disponible.
- **No aprobó las pruebas:** resultados incorrectos, excepciones del programa o tiempo de ejecución agotado.
- **Sin respuesta:** se entregó la plantilla sin cambios.
- **Revisión manual:** hay respuesta, pero esa consigna no tiene pruebas incluidas.
- **Sin corrección completa:** falta un resultado válido, por ejemplo por fallo del motor o cancelación.

El historial conserva las respuestas, notas, tiempos y resultados de los últimos diez simulacros. Muestra cobertura, pruebas por caso, diagnóstico local y práctica posterior basada en fallos u omisiones. Las fortalezas se refieren a los casos evaluados; no acreditan dominio de todo un tema ni una nota de examen. Exportá un respaldo si querés conservar intentos más antiguos.

Si falla el motor, podés **Reintentar corrección de las mismas respuestas**. El código entregado sigue congelado y no se duplica el intento ni el progreso ya publicado. Detener durante la corrección cancela el trabajo actual y continúa con los restantes; ese ejercicio queda para reintentar. Recargar conserva un intento activo o su corrección pendiente. Si el plazo venció con la pestaña cerrada, **Continuar corrección** ejecuta lo que falta, sin cargar Python automáticamente al abrir la página.

Al terminar, las aprobaciones y fallos evaluables se incorporan al aprendizaje como **Simulacro**. No cuentan como repasos espaciados ni convierten una sola aprobación en consolidación. Una cancelación o un fallo de carga no se publica como fallo del estudiante. Las consignas sin pruebas quedan para revisión manual, sin acreditación automática.

## Mi próximo entrenamiento y competencias

En **Mi ruta**, las recomendaciones eligen ejercicios del catálogo existente y explican por qué: repaso pendiente, dificultad reciente, resolución con ayuda o tema por completar. También consideran inactividad y los niveles originales Base, Práctica, Integración y Refuerzo; son etiquetas del catálogo, no una dificultad calibrada. **Posponer 24 h** oculta esa recomendación por un día y conserva la fecha del repaso. **Elegir manualmente** abre el ejercicio que tenías seleccionado.

El panel separa tres métricas:

- **Completados:** resolución aprobada por pruebas, autoevaluación de resolución o marca explícita «Lo doy por completado». Podés desmarcarla.
- **Aprobados por pruebas:** ejercicios que aprobaron todos los casos incluidos alguna vez. El denominador es la cantidad de ejercicios del tema que tienen pruebas; los temas sin pruebas lo indican.
- **Consolidados sin ayuda:** una resolución inicial y dos repasos espaciados aprobados sin abrir pistas ni referencias. Para ejercicios sin pruebas, se basa en autoevaluaciones declaradas. La antigua marca «Dominado» sigue disponible como estado declarado y no se transforma por sí sola en consolidación.

El rendimiento del tema es `intentos aprobados por pruebas / intentos evaluables por pruebas × 100`, redondeado al entero más cercano. Usa los últimos 30 registros por ejercicio. Una ejecución libre no prueba el contrato; tampoco se incluyen autoevaluaciones, cancelaciones o fallos de carga en ese porcentaje. Los errores frecuentes cuentan intentos, no la cantidad de casos fallidos de un mismo intento. Las fórmulas y reglas completas están en `ETAPAS.md` y también se explican en el panel.

## Cómo hacer un repaso

1. Una resolución programa un repaso a las **24 horas**. Una declaración de completado también puede programarlo, sin acreditar una aprobación ni dominio.
2. Elegí **Iniciar repaso sin borrador**: el editor usa la plantilla y tu código principal se conserva aparte. Escribí la resolución de memoria; evitá pistas y referencias. Podés volver al borrador principal cuando quieras y retomar un repaso aún abierto al recargar.
3. En ejercicios con pruebas, usá **Probar casos**. En ejercicios sin ellas, revisá el contrato con tus propias pruebas y registrá una **autoevaluación**. Esa declaración se identifica en el historial y no suma una aprobación automática.
4. Si el repaso empezó a partir de su fecha, trabajaste en el editor y aprobaste sin ayuda, el próximo intervalo pasa a **3, 7 y 14 días**; luego se mantiene en 14. El primer aprobado no alcanza para consolidar: la primera consolidación puede aparecer tras el segundo repaso válido, como mínimo cuatro días después de la resolución inicial.
5. Un resultado incorrecto o una resolución con ayuda reinicia la evidencia de autonomía y el intervalo en 24 horas, conservando las aprobaciones históricas. Una cancelación o un problema del motor conserva el calendario. Un repaso anticipado, reejecutar el borrador principal o volver a ejecutar una sesión ya registrada no avanza el intervalo.

El historial de cada ejercicio muestra práctica/repaso, resultado, ayudas, fecha y tiempo Python cuando existe. Guarda los últimos 30 registros; el resumen de aprendizaje conserva aprobaciones y calendario aunque salgan registros antiguos. Al iniciar otro repaso con un borrador anterior, se pide confirmar su reemplazo; el principal sigue intacto. «Comenzar intento sin ayuda» dentro de un repaso pide confirmar y vuelve a la plantilla. Restablecer código en un repaso también usa la plantilla, sin borrar las ayudas ya registradas.

Estos indicadores orientan la práctica. No verifican que hayas escrito de memoria, que puedas explicar la solución ni todas las restricciones de una consigna. En los ejercicios sin pruebas, dependen especialmente de tu autoevaluación.

## Guardado y ejecución

El código, las notas, las entradas y el estado de cada ejercicio se guardan en este navegador. El progreso de la guía anterior se importa si el navegador lo permite desde el mismo archivo. Cambiar de navegador, mover el HTML o borrar los datos del navegador puede afectar ese guardado: usá **Exportar respaldo** e **Importar respaldo** para conservarlo. El respaldo JSON contiene todos tus ejercicios guardados y tu registro de dificultades.

El formato v5 conserva ayudas, evaluaciones, calendario, progreso, sesión de repaso y los últimos 30 intentos por ejercicio, además del simulacro activo y diez simulacros entregados. Guarda por separado el borrador principal, el último borrador de repaso, las respuestas de examen y la última versión ejecutada para el diagnóstico; no duplica el código de todos los intentos de práctica. Se aceptan respaldos v2, v3, v4 y v5. Antes de migrar un guardado anterior a v5 se conserva una copia local en `unahur_training_route_v2_before_v5` (además de las copias de migraciones anteriores cuando corresponda). Los datos v2/v3 conservan declaraciones y aprobaciones conocidas, pero no se inventan repasos autónomos a partir de sus ejecuciones antiguas.

Importar pide confirmación antes de reemplazar los ejercicios incluidos y los simulacros con el mismo identificador. Los historiales se combinan conservando los diez más recientes; un respaldo antiguo sin historial no borra los simulacros actuales. Durante un simulacro activo se bloquea la importación. Si el guardado anterior está corrupto o no puede respaldarse, se protege de sobrescritura: **Rescatar guardado anterior** descarga sus datos sin modificar y **Exportar respaldo** conserva el trabajo actual. Un respaldo válido puede importarse para recuperar el guardado normal. Las cuotas de localStorage siguen dependiendo del navegador: si no permite guardar, exportá antes de cerrar.

Un temporizador anterior que todavía no venció se recupera junto con sus borradores disponibles. Se conserva su límite y se indica que el detalle de tiempos comienza desde la recuperación. Los temporizadores antiguos ya vencidos no se convierten en resultados históricos inventados.

La interfaz y el contenido funcionan sin conexión. La primera ejecución carga Python y sus paquetes con Pyodide desde internet; la disponibilidad posterior depende de la conexión y la caché del navegador. Si no carga, descargá el `.py` y ejecutalo con tu Python habitual. **Detener** cancela la tarea sin perder el código. El motor se recarga después de detenerlo. Hay un límite de 12 segundos de ejecución, y la consola limita la salida a 100 KB. Los gráficos de Matplotlib no se muestran en esta consola.

Los ejercicios de diccionarios permiten incorporar el TDA provisto por el TP6. Los del TP5bis permiten incorporar tus implementaciones guardadas de Pila y Cola de los ejercicios 1 y 11 del TP5. El editor empieza con el código y los comentarios originales del ejercicio cuando existen; si su celda estaba vacía, usa una plantilla. Tus borradores guardados se conservan: “Agregar código original” incorpora los ejemplos encima de tu trabajo. “Restablecer código inicial” recupera ese punto de partida. En “Ejemplos originales del práctico” podés consultar todas las celdas de código del notebook, incluidos los ejemplos introductorios. Los fragmentos se conservan tal como aparecen en el material de cátedra y pueden contener borradores.

El visor de PDF funciona con los archivos locales, sin descargas adicionales ni conexión. Si tu navegador no muestra PDF integrados, desplegá “Leer transcripción de texto” o usá “Abrir original”.

Las pruebas incluidas evalúan resultados y casos límite. No califican el examen ni verifican automáticamente todas las restricciones, por ejemplo el uso obligatorio de recursividad o de una interfaz TDA.

## Fechas del cronograma 2026

- Segundo parcial: **16 de noviembre**.
- Recuperatorio del primer parcial: **20 de noviembre**.
- Recuperatorio del segundo parcial: **27 de noviembre**.

Clases: lunes y viernes de 18:00 a 22:00. La fuente es `Cronograma-1.pdf`. Listas y árboles tienen su lugar en el calendario; todavía no hay apuntes específicos de esos temas en la carpeta.

## Verificación del contenido

Desde esta carpeta, con Python y NumPy disponibles:

```bash
python3 ruta-entrenamiento/verificar.py
```

Comprueba cobertura de consignas, enlaces locales, identificadores, plantillas, sintaxis de soluciones y los casos de entrenamiento de las 17 soluciones con pruebas. La carga de Pyodide y la apariencia del editor deben comprobarse en un navegador con internet.

## Laboratorio y navegación del Taller

El laboratorio usa simulaciones controladas; no muestra una traza del Python que escribiste. En matrices elegí forma, región y orden, y avanzá celda por celda para comparar índices y acumulador. Podés probar la matriz vacía. Tab entra a la matriz y las flechas cambian la celda de referencia; cambiarla reinicia el recorrido.

En recursividad seguí Fibonacci, factorial o la suma de un vector propio. La pila muestra la cima arriba, con parámetros, caso base y retornos. En pilas/colas compará insertar, extraer y consultar. En colecciones elegí explícitamente TDA Diccionario del TP6, dict nativo o set: sus contratos difieren. Cambiar estructura/contrato vacía la simulación; sus datos son temporales.

En el Taller, **Ejercicio anterior/siguiente** respeta los filtros activos. Si la consigna abierta queda fuera de ellos, conservás tu código y podés usar **Limpiar filtros**. Base, Práctica, Integración y Refuerzo son los niveles originales del catálogo. También podés filtrar por disponibilidad de pruebas, ir directamente al editor u ocultar el catálogo. **Distribución** permite consigna y editor en columnas en pantallas de 1400 px o más; en mobile se apilan. Esa preferencia y la visibilidad del catálogo se guardan y exportan.

Ctrl/⌘ + Enter ejecuta código; Ctrl/⌘ + Shift + Enter prueba los casos incluidos cuando existen. Para salir del editor mediante teclado, presioná Esc y luego Tab. Los controles de respaldo están disponibles también en pantalla pequeña; **Importar respaldo** se opera con un botón nativo y sigue requiriendo confirmar antes de sobrescribir información. Durante examen quedan vigentes los bloqueos de ayudas, referencias y otras consignas.
