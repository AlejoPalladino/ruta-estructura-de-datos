'use strict';
(function (root) {
 const VERSION = 5;
 const LEARNING = root.TrainingLearning || (typeof module!=='undefined' ? require('./aprendizaje.js') : null);
 const EXAMS = root.TrainingExams || (typeof module!=='undefined' ? require('./simulacros.js') : null);
 const WORKSHOP = root.TrainingWorkshop || (typeof module!=='undefined' ? require('./taller.js') : null);
 const STATUS = ['pending','practicing','review','mastered'];
 const CATEGORIES = ['syntax','execution','logic','timeout','cancelled','infrastructure'];
 const profiles = {
  python: [
   '¿Qué datos recibe el programa y qué debería mostrar o devolver para una entrada mínima?',
   'Separá lectura, transformación y salida. Identificá las condiciones y qué variables cambian; distinguí mostrar con print de devolver con return.',
   'IDENTIFICAR las entradas del contrato\nOBTENER los datos\nAPLICAR las condiciones o el recorrido pedido\nMOSTRAR o DEVOLVER según la consigna\nCOMPROBAR un caso mínimo a mano'
  ],
  vector: [
   '¿Qué debería ocurrir con un único elemento? ¿Qué posición estás consultando en cada paso?',
   'Recorré solo índices válidos. Decidí qué estado necesitás conservar y si la consigna permite modificar el vector recibido.',
   'PREPARAR el estado inicial según el contrato\nPARA cada posición válida del vector\n    EXAMINAR el elemento y actualizar el estado\nDEVOLVER el resultado solicitado\nVERIFICAR el caso mínimo y los extremos'
  ],
  matriz: [
   '¿Cuántas filas y columnas hay? ¿Cómo decidirías a mano si una celda participa del resultado?',
   'Separá fila y columna. Validá la forma exigida y expresá la condición de participación antes de recorrer las celdas.',
   'LEER filas y columnas\nVALIDAR la forma requerida por la consigna\nPREPARAR el resultado\nPARA cada fila\n    PARA cada columna\n        SI la celda cumple la condición del ejercicio\n            ACTUALIZAR el resultado\nDEVOLVER el resultado'
  ],
  recursividad: [
   '¿Qué entrada podés resolver sin otra llamada? ¿Qué dato se hace más pequeño en cada paso?',
   'Escribí el caso base antes del recursivo. Cada llamada debe acercarse a ese caso; distinguí el resultado de la llamada del aporte del paso actual.',
   'SI la entrada corresponde a un caso base\n    DEVOLVER su resultado directo\nREDUCIR el problema hacia el caso base\nOBTENER el resultado del subproblema\nCOMBINAR con el aporte actual si corresponde\nDEVOLVER el resultado al nivel anterior'
  ],
  tda: [
   '¿Qué información guarda cada objeto? ¿Qué condición debe seguir siendo cierta después de cada operación?',
   'Separá representación y operaciones públicas. Anotá precondiciones, cambios de estado y qué devuelve o qué excepción lanza cada método.',
   'CONSTRUIR el estado válido del objeto\nPARA cada operación solicitada\n    COMPROBAR sus precondiciones\n    CONSULTAR o MODIFICAR la representación\n    CONSERVAR las condiciones del modelo\n    DEVOLVER el valor o LANZAR la excepción indicada'
  ],
  'pila-cola': [
   '¿Qué elemento debería salir primero? ¿Cómo queda la estructura luego de una inserción y una extracción?',
   'Identificá si corresponde LIFO o FIFO. Usá la interfaz del TDA y seguí el orden con tres elementos distintos; verificá qué debe conservar la operación.',
   'IDENTIFICAR la interfaz de Pila o Cola requerida\nCOMPROBAR el caso vacío según el contrato\nREALIZAR las inserciones o extracciones solicitadas\nCONSERVAR o CAMBIAR el orden según la consigna\nCOMPROBAR el estado final con tres elementos'
  ],
  diccionario: [
   '¿Necesitás asociar claves a valores o conservar elementos sin repeticiones? ¿Qué ocurre con una clave repetida?',
   'Elegí según el contrato: diccionario para asociaciones o conjunto para pertenencia. Si se exige un TDA, utilizá su interfaz en lugar de reemplazarlo por un tipo nativo.',
   'IDENTIFICAR claves, valores o elementos\nCREAR o RECIBIR la estructura requerida\nPARA cada dato u operación\n    CONSULTAR pertenencia con la interfaz indicada\n    AGREGAR, ACTUALIZAR o ELIMINAR según el contrato\nDEVOLVER la estructura o el resultado pedido'
  ]
 };
 // Focused hints for the exercises with automatic contracts; fallback is a topic guide.
 const focused = {
  'Practica_Parcial_1-1': ['¿L mide elementos o comparaciones? ¿Qué pasa con dos valores iguales?', 'Llevá el largo de la racha creciente actual y recorré recursivamente. Una igualdad rompe la subida.', 'CONSIDERAR el vector vacío\nRECORRER desde la primera racha\nSI la racha alcanza L: indicar éxito\nSI no hay más elementos: indicar fracaso\nACTUALIZAR o reiniciar la racha según el par siguiente\nCONTINUAR con un índice mayor'],
  'Practica_Parcial_1-2': ['¿Qué región admite un barco de exactamente 500 metros? ¿Alcanza con que haya lugar en cualquier parte?', 'Modelá Barco y Puerto por separado. La región depende del tamaño; transferir también debe quitar los barcos del origen.', 'CREAR las dársenas vacías\nPARA acomodar: elegir la región permitida y buscar lugar\nSI no hay lugar en esa región: lanzar excepción\nPARA contar: inspeccionar carga en la fila solicitada\nPARA transferir: acomodar cada barco y liberar su posición original'],
  'TP_2_Arreglos_Com_5-12': ['¿Qué valor tendría la celda de fila 1 y columna 2? ¿La forma cambia si intercambiás las dimensiones?', 'Creá una matriz con las dimensiones recibidas; cada celda depende de sus dos índices.', 'CREAR una matriz de filas por columnas\nRECORRER cada par de índices válido\n    ASIGNAR la suma de ambos índices\nDEVOLVER la matriz'],
  'TP_2_Arreglos_Com_5-13': ['¿La diagonal principal participa de la suma? ¿Qué sucede con una matriz de una celda?', 'Sumá únicamente las celdas estrictamente por encima de la diagonal principal.', 'INICIAR la suma en cero\nRECORRER las filas\n    RECORRER las columnas posteriores a la diagonal\n        ACUMULAR el valor de la celda\nDEVOLVER la suma'],
  'TP_2_Arreglos_Com_5-14': ['¿Una diagonal con ceros deja de ser diagonal? ¿Dónde buscarías un contraejemplo?', 'Comprobá la forma cuadrada y buscá un valor distinto de cero fuera de la diagonal.', 'VALIDAR que la matriz sea cuadrada\nRECORRER las celdas fuera de la diagonal\n    SI una no es cero: indicar que no cumple\nSI no hubo contraejemplo: indicar que cumple'],
  'TP_2_Arreglos_Com_5-15': ['¿Qué celda es el reflejo de la posición (fila, columna)?', 'Comprobá la forma cuadrada y compará cada par reflejado; basta una diferencia para descartar simetría.', 'VALIDAR la forma cuadrada\nRECORRER pares a un lado de la diagonal\n    COMPARAR cada celda con su reflejo\n    SI difieren: indicar fracaso\nSI todas coinciden: indicar éxito'],
  'TP_4_Recursividad_Com_5-1': ['¿Cuánto vale el factorial de cero? ¿Qué factor podés separar del producto?', 'Reducí el número en cada llamada y combiná el factor actual con el factorial del número anterior.', 'SI es el caso base: devolver el producto neutro\nOBTENER el factorial del número anterior\nCOMBINAR el factor actual con ese resultado\nDEVOLVER el producto'],
  'TP_4_Recursividad_Com_5-3': ['¿Cuántos casos base necesita Fibonacci? ¿Un término es lo mismo que los primeros N términos?', 'Usá la convención de la ruta F(0)=0 y F(1)=1. Separá el cálculo de un término de la generación de la serie.', 'PARA un término: resolver los dos casos base\nEN otro caso: combinar los dos términos anteriores\nPARA la serie: reunir los términos desde el índice cero hasta N−1'],
  'TP_4_Recursividad_Com_5-4': ['¿Qué agrega el índice actual al triangular anterior?', 'El número triangular acumula el índice actual sobre el resultado del índice anterior; cero cierra la suma.', 'SI el índice es cero: devolver la suma neutra\nOBTENER el triangular del índice anterior\nSUMAR el índice actual\nDEVOLVER el resultado'],
  'TP_4_Recursividad_Com_5-8': ['¿Qué ocurre cuando el exponente vale uno? ¿Y en la extensión con exponente cero?', 'Conservá la base y reducí el exponente. El exponente cero es una extensión de entrenamiento ya incluida en esta ruta.', 'RESOLVER el exponente base\nREDUCIR solo el exponente\nOBTENER el resultado del subproblema\nMULTIPLICAR por la base y devolver'],
  'TP_4_Recursividad_Com_5-13': ['¿Qué debería devolver una suma sin elementos? ¿Qué parte podés separar?', 'Separá un elemento y resolvé la suma del resto. La lista vacía aporta cero.', 'SI no hay elementos: devolver la suma neutra\nSEPARAR el elemento actual\nSUMARLO al resultado recursivo del resto\nDEVOLVER la suma'],
  'TP_4_Recursividad_Com_5-14': ['¿Qué extremos compararías primero? ¿Qué cambia cuando queda un carácter?', 'Compará extremos y reducí por ambos lados. La comparación de esta ruta es literal.', 'SI quedan cero o un carácter: indicar éxito\nSI los extremos difieren: indicar fracaso\nCONTINUAR recursivamente con el interior\nDEVOLVER ese resultado'],
  'TP_4_Recursividad_Com_5-17': ['¿Sería correcto empezar el máximo en cero si todos los valores son negativos?', 'Usá un elemento real como referencia. Compará el actual con el máximo recursivo del resto.', 'SI queda un elemento: devolverlo\nOBTENER el máximo del resto\nCOMPARAR con el elemento actual\nDEVOLVER el mayor'],
  'refuerzo-fib-lineal': ['¿Qué representan los dos acumuladores al inicio y después de un paso?', 'Conservá dos términos consecutivos y avanzá ambos al reducir el contador.', 'SI no quedan pasos: devolver el acumulador del término actual\nAVANZAR los dos acumuladores\nREDUCIR el contador\nDEVOLVER el resultado de la siguiente llamada'],
  'refuerzo-suma-matriz': ['¿Cuándo debés pasar de columna a fila? ¿Qué ocurre si no hay columnas?', 'Recorré con fila y columna como estado; detené el recorrido antes de consultar una posición inexistente.', 'SI no hay celdas pendientes: devolver la suma neutra\nSI terminó la fila: continuar en la siguiente\nEN otro caso: sumar la celda actual y continuar en la columna siguiente'],
  'refuerzo-vecinos': ['¿Cuántos vecinos válidos tiene una esquina? ¿Un índice negativo representa un vecino de esta grilla?', 'Considerá desplazamientos ortogonales y validá ambos límites antes de admitir un vecino.', 'PREPARAR los cuatro desplazamientos ortogonales\nPARA cada candidato\n    COMPROBAR sus límites de fila y columna\n    SI es válido: agregarlo al resultado\nDEVOLVER los vecinos'],
  'refuerzo-transpuesta': ['¿Dónde queda la celda (1, 2) al transponer? ¿Qué forma tiene la salida?', 'Intercambiá tanto los índices de cada celda como las dimensiones de la matriz de salida.', 'CREAR la salida con dimensiones intercambiadas\nRECORRER las celdas originales\n    COPIAR cada valor a sus índices intercambiados\nDEVOLVER la salida']
 };
 const extraTests = {
  'Practica_Parcial_1-1': 'assert intervaloCreciente([7], 1) is True\nassert intervaloCreciente([4,3,2], 2) is False\nassert intervaloCreciente([1,2,2,3,4], 3) is True',
  'TP_2_Arreglos_Com_5-12': 'assert rellenaMatriz(3, 0).shape == (3, 0)\nassert np.array_equal(rellenaMatriz(1, 1), [[0]])',
  'TP_2_Arreglos_Com_5-13': 'assert suma_superior(np.array([[9,-3],[4,7]])) == -3',
  'TP_2_Arreglos_Com_5-14': 'assert es_diagonal(np.array([[0]])) is True\nassert es_diagonal(np.array([[1,0],[2,3]])) is False',
  'TP_2_Arreglos_Com_5-15': 'assert es_simetrica(np.array([[1,-2],[-2,3]])) is True',
  'TP_4_Recursividad_Com_5-1': 'assert factorial(2) == 2',
  'TP_4_Recursividad_Com_5-3': 'assert primeros_fibonacci(1) == [0]',
  'TP_4_Recursividad_Com_5-4': 'assert triangular(2) == 3',
  'TP_4_Recursividad_Com_5-8': 'assert potencia(-2, 3) == -8',
  'TP_4_Recursividad_Com_5-13': 'assert suma_recursiva([0,0]) == 0',
  'TP_4_Recursividad_Com_5-14': "assert palindromo('abba') is True\nassert palindromo('ab') is False",
  'TP_4_Recursividad_Com_5-17': 'assert maximo_recursivo([-3,-3]) == -3',
  'refuerzo-fib-lineal': 'assert fibonacci_lineal(2) == 1',
  'refuerzo-suma-matriz': 'assert suma_matriz_rec(np.array([[0,0],[0,0]])) == 0',
  'refuerzo-vecinos': 'assert set(vecinos(3,1,1,0)) == {(0,0),(2,0)}',
  'refuerzo-transpuesta': 'assert transpuesta(np.zeros((3,0), int)).shape == (0,3)\nassert np.array_equal(transpuesta(np.array([[5]])), [[5]])'
 };
 const integer = (value, max=1_000_000) => Number.isSafeInteger(value) && value >= 0 ? Math.min(value,max) : 0;
 const text = (value, max=2500) => typeof value === 'string' ? value.slice(0,max) : '';
 function cleanError(value) {
  if (!value || typeof value !== 'object' || !CATEGORIES.includes(value.category)) return null;
  return {category:value.category, type:text(value.type,100), message:text(value.message,2000),
   line:integer(value.line)||null, source:text(value.source,100)};
 }
 function cleanReport(value) {
  if (!value || typeof value !== 'object' || !['tests','run'].includes(value.mode) || !Array.isArray(value.cases)) return null;
  const cases=value.cases.slice(0,100).map((c,i)=>({id:i+1,input:text(c?.input),expected:text(c?.expected,1500),actual:text(c?.actual,1500),
   status:['passed','failed','skipped'].includes(c?.status)?c.status:'skipped',error:cleanError(c?.error),
   durationMs:Number.isFinite(c?.durationMs)&&c.durationMs>=0?Math.min(c.durationMs,120000):0}));
  return {mode:value.mode,cases,total:cases.length,passed:cases.filter(c=>c.status==='passed').length,
   failed:cases.filter(c=>c.status==='failed').length,skipped:cases.filter(c=>c.status==='skipped').length,
   error:cleanError(value.error),durationMs:Number.isFinite(value.durationMs)&&value.durationMs>=0?Math.min(value.durationMs,120000):null};
 }
 function cleanHelp(value={}) {
  return {unlocked:integer(value?.unlocked,3),used:integer(value?.used),
   solutionViewed:value?.solutionViewed===true,originalViewed:value?.originalViewed===true};
 }
 function validateState(value, exercises) {
  if (!value || ![2,3,4,VERSION].includes(value.version) || !value.exercises || typeof value.exercises!=='object' || Array.isArray(value.exercises)) throw Error('Formato de respaldo incompatible');
  const clean={version:VERSION,exercises:{},log:text(value.log,1_000_000)};
  for (const ex of exercises) {
   if (!Object.hasOwn(value.exercises,ex.id)) continue;
   const entry=value.exercises[ex.id];
   if (!entry || typeof entry!=='object' || Array.isArray(entry)) continue;
   const target={status:STATUS.includes(entry.status)?entry.status:'pending',help:cleanHelp(entry.help)};
   for (const key of ['code','reviewCode','notes','stdin','updated','lastRunCode']) if (typeof entry[key]==='string') target[key]=entry[key];
   target.lastReport=cleanReport(entry.lastReport);
   target.attempts=Array.isArray(entry.attempts)?entry.attempts.slice(-30).filter(a=>a && typeof a==='object' && ['run','tests','self'].includes(a.mode)).map(a=>({
    at:text(a.at,50),mode:a.mode,passed:integer(a.passed,100),failed:integer(a.failed,100),skipped:integer(a.skipped,100),
    category:CATEGORIES.includes(a.category)?a.category:null,errorType:text(a.errorType,100),helpLevel:integer(a.helpLevel,3),assisted:a.assisted===true||integer(a.helpLevel,3)>0,
    assistanceKnown:a.assistanceKnown!==false && typeof a.assisted==='boolean',
    total:integer(a.total ?? (integer(a.passed,100)+integer(a.failed,100)+integer(a.skipped,100)),100),
    kind:['review','exam'].includes(a.kind)?a.kind:'practice',examId:text(a.examId,120),reviewEdited:a.reviewEdited===true,reviewAdvanced:a.reviewAdvanced===true,
    sessionStartedAt:LEARNING.timestamp(a.sessionStartedAt)!==null?new Date(LEARNING.timestamp(a.sessionStartedAt)).toISOString():null,
    selfResult:['passed','failed'].includes(a.selfResult)?a.selfResult:null,
    durationMs:Number.isFinite(a.durationMs)&&a.durationMs>=0?Math.min(a.durationMs,120000):null})) : [];
   target.session={kind:entry.session?.kind==='review'?'review':'practice',
    startedAt:LEARNING.timestamp(entry.session?.startedAt)!==null?new Date(LEARNING.timestamp(entry.session.startedAt)).toISOString():null,edited:entry.session?.edited===true,finished:entry.session?.finished===true};
   target.learning=value.version>=4 && entry.learning?LEARNING.cleanLearning(entry.learning,ex):LEARNING.migrateLearning(target,ex);
   clean.exercises[ex.id]=target;
  }
  if (exercises.some(e=>e.id===value.selected)) clean.selected=value.selected;
  clean.exams=EXAMS.cleanState(value.exams,exercises,cleanReport);
  if(value.preferences)clean.preferences=WORKSHOP.cleanPreferences(value.preferences);
  return clean;
 }
 function hintsFor(ex) {
  const values=focused[ex.id] || profiles[ex.topic] || profiles.python;
  return values.map((body,i)=>({level:i+1,title:['Orientación','Enfoque','Pseudocódigo'][i],body,topicGuide:!focused[ex.id]}));
 }
 function unlockHint(help) {
  const next=cleanHelp(help);
  if (next.unlocked<3) { next.unlocked++; next.used++; }
  return next;
 }
 const assisted = help => Boolean(help?.unlocked || help?.solutionViewed || help?.originalViewed);
 const needsRetry = help => Boolean(help?.unlocked>=2 || help?.solutionViewed || help?.originalViewed);
 function testsFor(ex) { return ex.tests ? ex.tests+'\n'+(extraTests[ex.id]||'') : ''; }
 function diagnose(report, code, ex) {
  if (!report) return ['Ejecutá tu código o probá los casos para obtener un diagnóstico.'];
  const failed=report.cases.find(c=>c.status==='failed');
  const error=report.error || failed?.error;
  if (!error && !failed) return [report.mode==='tests'?'Los casos ejecutados coinciden. Revisá además las restricciones de la consigna; pasar pruebas no demuestra dominio.':'El programa terminó sin excepciones. Esta ejecución no verifica si el resultado cumple la consigna.'];
  const advice=[];
  if (error?.line) advice.push('Empezá por la línea '+error.line+' de la versión ejecutada.');
  const type=error?.type||'';
  if (error?.category==='infrastructure') advice.push('No se pudo preparar el motor. Comprobá la conexión y reintentá; también podés descargar el .py. Este fallo no evalúa tu solución.');
  else if (error?.category==='cancelled') advice.push('La ejecución se interrumpió y no permite evaluar los casos pendientes. Volvé a ejecutar cuando estés listo.');
  else if (error?.category==='timeout') advice.push('Se alcanzó el límite de 12 segundos. Revisá si el bucle avanza o si cada llamada reduce el problema; un algoritmo lento también puede agotar el tiempo.');
  else if (/IndentationError|TabError/.test(type)) advice.push('Python usa la sangría para agrupar instrucciones. Usá cuatro espacios por nivel y verificá qué bloque contiene esta línea.');
  else if (error?.category==='syntax') advice.push('Python no pudo interpretar el programa. Revisá los dos puntos al abrir un bloque, paréntesis y comillas en la línea indicada y la anterior.');
  else if (type==='IndexError') advice.push('Se consultó una posición que no existe. Anotá el tamaño y el índice antes de acceder: el último índice es tamaño−1; en matrices verificá fila y columna por separado.');
  else if (type==='RecursionError') advice.push('La pila de llamadas se agotó. Probá una entrada pequeña y comprobá que cada llamada se acerque al caso base. La recursividad profunda también puede exceder el límite aunque termine.');
  else if (type==='NameError') advice.push('Se usó un nombre sin definir. Compará nombres y mayúsculas con el contrato; verificá que la función o variable exista antes de usarla.');
  else if (type==='TypeError') advice.push('Una operación recibió un tipo o cantidad de argumentos incompatible. Revisá los parámetros, la llamada y los valores que devuelve cada función.');
  else if (type==='AttributeError') advice.push('El objeto no tiene ese atributo o método. Revisá la interfaz del TDA y si la variable contiene el objeto esperado o None.');
  else if (type==='EOFError') advice.push('Faltan respuestas para input(). Completá una línea por cada lectura; recordá convertir el texto si necesitás números.');
  else if (type==='ZeroDivisionError') advice.push('Se intentó dividir por cero. Identificá qué entrada produce ese divisor y revisá cómo la contempla el contrato.');
  else if (type==='ValueError') advice.push('Un valor no es válido para la operación. Revisá su rango, formato y las precondiciones del ejercicio.');
  else if (error?.category==='logic' || failed) {
   advice.push('El programa produjo un resultado que no cumple este caso. Seguí esa entrada a mano y compará el primer paso donde difiere del esperado.');
   if (failed?.actual==='None') advice.push('Se obtuvo None. Una causa frecuente es mostrar con print sin devolver con return, u olvidar el retorno en alguna rama.');
   if (ex.topic==='matriz') advice.push('Revisá dimensiones, límites y qué celdas participan. Una matriz rectangular ayuda a detectar si confundiste filas con columnas.');
   if (ex.topic==='recursividad' && /\bprint\s*\(/.test(code)) advice.push('Comprobá que también devolvés el resultado al nivel anterior: imprimirlo no lo devuelve.');
   if (ex.id==='Practica_Parcial_1-1') advice.push('Verificá qué sucede ante valores iguales y si L cuenta elementos o comparaciones.');
  } else advice.push('Revisá el tipo de excepción y la última operación sobre tus datos. Reducí la entrada al caso más pequeño que reproduce el fallo.');
  if (report.skipped) advice.push(report.skipped+' casos quedaron sin ejecutar; corregí primero el error de preparación o del programa.');
  return advice;
 }
 const api={VERSION,validateState,cleanReport,cleanHelp,hintsFor,unlockHint,assisted,needsRetry,testsFor,diagnose};
 root.TrainingPedagogy=api;
 if (typeof module!=='undefined' && module.exports) module.exports=api;
})(globalThis);
