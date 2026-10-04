# Mi ruta de entrenamiento

Abrí **Guia primer parcial estructura de datos.html** con tu navegador. La página ahora se llama “Mi ruta de entrenamiento” y conserva el nombre del archivo para que puedas seguir usando tu acceso habitual.

La carpeta `ruta-entrenamiento` debe permanecer junto al HTML y a los materiales de la materia. No requiere instalación ni servidor para leer, editar o guardar código. La guía original está conservada en `respaldos/Guia primer parcial original.html`.

## Qué incluye

- Ruta con énfasis en matrices, recursividad y Fibonacci, seguida de integración y continuidad de la materia.
- 148 ejercicios: los 17 de la guía anterior, 127 consignas de los nueve notebooks y cuatro refuerzos adicionales identificados como tales.
- 24 fuentes: PDFs, notebooks, documento de pilas y colas y modelos Python. Los PDFs y el documento tienen transcripción de texto integrada; las figuras se consultan en el original.
- 34 soluciones de referencia; 17 incluyen pruebas automáticas de entrenamiento. Las demás consignas permiten escribir y ejecutar tus propias pruebas.
- Cronograma completo, plan semanal sugerido y simulacro de 90 minutos con pistas y soluciones ocultas.
- Editor por ejercicio con resaltado, números de línea, sangría, consola, entrada para `input()` y descarga `.py`.

## Cómo entrenar

1. Entrá a “Mi ruta” y elegí la primera etapa pendiente.
2. Leé la consigna y anotá el contrato y los casos límite en tus notas.
3. Escribí código sin consultar la solución. **Tab** agrega cuatro espacios; **Enter** conserva la sangría; **Ctrl/⌘ + Enter** ejecuta. **Esc** permite salir del editor con Tab.
4. Usá `print(...)` para ver resultados. Para programas que usan `input()`, escribí las respuestas debajo de la consola, una por línea. “Probar casos” ejecuta los casos incluidos cuando existen; no ejecuta el bloque `if __name__ == '__main__'`.
5. Si te trabás, abrí primero una pista. Compará con la solución después de intentar.
6. Marcá “Dominado” cuando puedas resolver sin ayuda, respetar la consigna, probar bordes y explicar por qué termina. Repetí a las 48 horas.

El simulacro sugerido combina **intervalo creciente** y **TDA Puerto**. Sus 90 minutos son una propuesta de práctica, no la duración indicada por la cátedra para el examen.

## Guardado y ejecución

El código, las notas, las entradas y el estado de cada ejercicio se guardan en este navegador. El progreso de la guía anterior se importa si el navegador lo permite desde el mismo archivo. Cambiar de navegador, mover el HTML o borrar los datos del navegador puede afectar ese guardado: usá **Exportar respaldo** e **Importar respaldo** para conservarlo. El respaldo JSON contiene todos tus ejercicios guardados y tu registro de dificultades.

La interfaz y el contenido funcionan sin conexión. La primera ejecución carga Python y sus paquetes con Pyodide desde internet; la disponibilidad posterior depende de la conexión y la caché del navegador. Si no carga, descargá el `.py` y ejecutalo con tu Python habitual. **Detener** cancela la tarea sin perder el código. El motor se recarga después de detenerlo. Hay un límite de 12 segundos de ejecución, y la consola limita la salida a 100 KB. Los gráficos de Matplotlib no se muestran en esta consola.

Los ejercicios de diccionarios permiten incorporar el TDA provisto por el TP6. Los del TP5bis permiten incorporar tus implementaciones guardadas de Pila y Cola de los ejercicios 1 y 11 del TP5. Los fragmentos originales de los notebooks se muestran como material de cátedra y pueden contener borradores; no se presentan automáticamente como soluciones correctas.

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
