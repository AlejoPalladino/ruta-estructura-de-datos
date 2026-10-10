# Ruta de entrenamiento · Estructuras de datos

Ruta de estudio de UNAHUR con 148 ejercicios, materiales de la materia y editor de Python en el navegador. Incluye matrices, recursividad, Fibonacci, TDA, pilas, colas, diccionarios y conjuntos.

Cada estudiante guarda su código y su progreso en su propio navegador. La ejecución de Python descarga Pyodide desde internet al primer uso. No requiere instalar Python para practicar desde la página.

## Publicar con GitHub Pages

1. Crear un repositorio público llamado `ruta-estructura-de-datos`.
2. Subir **el contenido** de esta carpeta a la raíz del repositorio. `index.html`, `ruta-entrenamiento/` y los materiales deben quedar al mismo nivel; no subirlos dentro de otra carpeta ni subir un ZIP.
3. Abrir **Settings → Pages**.
4. En **Source**, elegir **Deploy from a branch**.
5. Elegir la rama **main**, la carpeta **/(root)** y guardar con **Save**.
6. Esperar la publicación y abrir el enlace que aparece en Pages con **Visit site**.

La dirección tendrá este formato: `https://TU-USUARIO.github.io/ruta-estructura-de-datos/`.

## Abrir en tu computadora

Abrir `index.html` con el navegador. Las instrucciones de práctica, guardado y respaldo están en `LEEME - Ruta de entrenamiento.md`.

La Etapa 1 agrega resultados por caso, diagnóstico local y pistas progresivas. El alcance, la auditoría y las próximas etapas están en [ETAPAS.md](ETAPAS.md). No requiere compilación ni nuevas dependencias del sitio; Python mantiene su carga inicial desde el CDN de Pyodide.

La Etapa 2 agrega competencias por tema, **Mi próximo entrenamiento**, repasos de 1/3/7/14 días e historial de intentos. Completar, aprobar pruebas y consolidar sin ayuda son métricas distintas. Los ejercicios sin pruebas permiten autoevaluación identificada como tal. El borrador del repaso se guarda separado del principal; la exportación v4 conserva ambos y acepta respaldos v2/v3/v4.

La Etapa 3 conserva el simulacro de intervalo creciente + Puerto y agrega selección de 1–6 ejercicios por temas/niveles, duración configurable, borradores propios, entrega con corrección automática parcial, tiempos por ejercicio e historial de diez intentos. El respaldo actual es v5 y acepta formatos v2–v5. Los resultados sin pruebas o con problemas del motor se identifican sin inventar una aprobación ni una nota académica.

## Verificar los cambios

Desde esta carpeta, con Python, NumPy y Node disponibles:

```bash
python3 ruta-entrenamiento/verificar.py
python3 -m unittest discover -s ruta-entrenamiento/tests -p 'test_*.py' -v
node --test --test-isolation=none ruta-entrenamiento/tests/*.test.cjs
```

Si Node no admite `--test-isolation=none`, ejecutar cada archivo `.test.cjs` directamente con `node` en una versión compatible con `node:test`. Las pruebas de interfaz usan dobles de DOM y Worker; no verifican apariencia ni sustituyen una prueba de Pyodide en navegador. El protocolo de comprobación manual está en [ETAPAS.md](ETAPAS.md).

## Actualizar

Los cambios en `ruta-entrenamiento/` afectan ambos archivos HTML. Si se modifica la estructura de `Guia primer parcial estructura de datos.html`, copiar ese HTML a `index.html` antes de subir la actualización.

El progreso se guarda por navegador y sitio, sin sincronización entre equipos. Para llevar avances locales a la página publicada, usar **Exportar respaldo** en la versión local e **Importar respaldo** en la página.

Fuentes del procedimiento: [crear un sitio](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) y [configurar la publicación desde una rama](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

La Etapa 4 amplía el laboratorio con recorridos y acumuladores de matrices, pilas de llamadas recursivas y operaciones de pila/cola y diccionario/conjunto. Son simulaciones controladas, identificadas como tales. El Taller agrega anterior/siguiente según filtros, filtro de nivel/pruebas, salto al editor, distribución configurable y catálogo plegable. Los respaldos y las etiquetas de filtros quedan accesibles en mobile; las preferencias opcionales se conservan en v5. La verificación actual comprende 95 pruebas JavaScript y 12 Python; sigue pendiente comprobar apariencia, accesibilidad y Pyodide en navegador real.

En **Mi ruta**, el mapa de temas permite alternar entre **Grafo** y **Subte**, con densidad **Compacta**, **Media** o **Aireada**. Seleccioná un tema para ver sus conexiones y entrar a practicar; listas y árboles llevan al cronograma. Las conexiones son una orientación de estudio. La vista y densidad elegidas se guardan en el navegador y se incluyen en el respaldo v5. En pantallas pequeñas, el mapa se puede desplazar sin reducir el tamaño del texto.
