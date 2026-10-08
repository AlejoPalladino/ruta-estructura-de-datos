const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function workerWith(pyodide){
 const messages=[];
 const self={postMessage:message=>messages.push(message)};
 const context=vm.createContext({self});
 const source=fs.readFileSync(path.join(__dirname,'../runtime.js'),'utf8');
 vm.runInContext(source,context);
 // Network-free double at the module import boundary; actual evaluator has Python tests.
 const body=context.TrainingRuntime.workerMain.toString().replace("import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs')",'Promise.resolve({loadPyodide:()=>fakePy})');
 context.fakePy=pyodide;
 vm.runInContext('('+body+')()',context);
 return {messages,self};
}
function fakePy(report,printCount=0){
 let stdout;
 const slots=new Map();let calls=0,destroyed=0;
 const py={
  loadPackagesFromImports:async()=>{},
  setStdout:value=>{stdout=value.batched;},setStderr:()=>{},
  toPy:()=>({set:(k,v)=>slots.set(k,v),destroy:()=>destroyed++}),
  runPythonAsync:async()=>{if(calls++===0)return;
   slots.get('notify')(JSON.stringify({...report,skipped:1}));
   for(let i=0;i<printCount;i++)stdout('abcdef');
   return JSON.stringify(report);
  },
  destroyed:()=>destroyed
 };
 return py;
}
const payload={runId:7,code:'print(1)',tests:'',stdin:'',filename:'e.py',evaluator:'source'};
const report={mode:'run',cases:[],passed:0,failed:0,skipped:0,total:0,error:null,durationMs:1};

test('worker transmite fases, avances y reporte con identidad y libera namespace',async()=>{
 const py=fakePy(report),worker=workerWith(py);
 await worker.self.onmessage({data:payload});
 assert.deepEqual(worker.messages.map(m=>m.type),['phase','phase','phase','progress','done']);
 assert.ok(worker.messages.every(m=>m.runId===7));
 assert.equal(worker.messages.at(-1).report.durationMs,1);assert.equal(py.destroyed(),1);
});
test('salida masiva queda acotada y agrupada en pocos mensajes',async()=>{
 const worker=workerWith(fakePy(report,30000));
 await worker.self.onmessage({data:payload});
 const output=worker.messages.filter(m=>m.type==='output');
 assert.ok(output.length<30);
 const text=output.map(m=>m.text).join('');
 assert.ok(text.length<100100);assert.equal((text.match(/Salida limitada/g)||[]).length,1);
});
test('fallo de paquetes informa infraestructura y permite reintentar',async()=>{
 const py=fakePy(report);let failures=0;
 py.loadPackagesFromImports=async()=>{if(!failures++)throw Error('network failure');};
 const worker=workerWith(py);
 await worker.self.onmessage({data:payload});
 assert.equal(worker.messages.at(-1).type,'error');assert.equal(worker.messages.at(-1).phase,'loading');
 await worker.self.onmessage({data:{...payload,runId:8}});
 assert.equal(worker.messages.at(-1).type,'done');assert.equal(worker.messages.at(-1).runId,8);
});
test('sintaxis incorrecta pasa al evaluador aun si falla el escaneo de imports',async()=>{
 const py=fakePy({...report,error:{category:'syntax',type:'SyntaxError'}});
 py.loadPackagesFromImports=async()=>{throw Error('SyntaxError: invalid syntax');};
 const worker=workerWith(py);await worker.self.onmessage({data:payload});
 assert.equal(worker.messages.at(-1).type,'done');
 assert.equal(worker.messages.at(-1).report.error.category,'syntax');
});
