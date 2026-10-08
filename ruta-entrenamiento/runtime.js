'use strict';
// Serialized into a Blob by app.js: no module import from a file:// page.
globalThis.TrainingRuntime = {
 workerMain: function () {
  let pyPromise;
  self.onmessage = async ({data}) => {
   let ns, result, phase = 'loading', buffer = '', outputSize = 0, truncated = false;
   const send = message => self.postMessage({...message, runId: data.runId});
   const flush = () => { if (buffer) { send({type:'output', text:buffer}); buffer=''; } };
   const output = value => {
    const remaining = 100_000 - outputSize;
    if (remaining <= 0) {
     if (!truncated) { buffer += '\n[Salida limitada a 100 000 caracteres]\n'; truncated=true; flush(); }
     return;
    }
    const chunk = (String(value)+'\n').slice(0, remaining);
    outputSize += chunk.length; buffer += chunk;
    if (buffer.length >= 4096) flush();
   };
   try {
    send({type:'phase', phase, text:'Descargando Python…'});
    if (!pyPromise) pyPromise = import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs')
     .then(({loadPyodide}) => loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'}));
    const py = await pyPromise;
    send({type:'phase', phase, text:'Cargando paquetes del ejercicio…'});
    // Syntax validation belongs to the evaluator; package scanning may fail on bad syntax.
    try { await py.loadPackagesFromImports(data.code+'\n'+data.tests); }
    catch (error) { if (!/SyntaxError|IndentationError|TabError/.test(String(error))) throw error; }
    py.setStdout({batched:output}); py.setStderr({batched:output});
    ns = py.toPy({code:data.code, tests:data.tests, stdin:data.stdin, filename:data.filename});
    ns.set('notify', value => send({type:'progress',report:JSON.parse(String(value))}));
    result = await py.runPythonAsync(data.evaluator, {globals:ns}); result?.destroy?.();
    phase = 'running';
    send({type:'phase', phase, text:'Ejecutando Python…'});
    result = await py.runPythonAsync('_training_evaluate(code, tests, stdin, filename, notify)', {globals:ns});
    const report = JSON.parse(String(result)); result?.destroy?.(); result=null;
    flush(); send({type:'done', report});
   } catch (error) {
    flush(); send({type:'error', phase, text:error.message || String(error)});
    // Discard a failed loader so retrying after a connection failure can work.
    if (phase === 'loading') pyPromise=null;
   } finally { result?.destroy?.(); ns?.destroy?.(); }
  };
 }
};
