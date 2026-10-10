// Integration of app event handlers with DOM/Worker doubles; not a browser/layout test.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const key='unahur_training_route_v2';

function boot(initial,htmlName='index.html',failWrites=false,initialTime=Date.now(),initialSession={}){
 let clock=initialTime;
 class Clock extends Date {constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
 class Element {
  constructor(id=''){this.id=id;this.value='';this.textContent='';this.innerHTML='';this.hidden=false;this.disabled=false;this.open=false;this.selectionStart=0;this.style={};this.dataset={};this.listeners={};this.attributes={};this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,v)=>v?this.classes.add(k):this.classes.delete(k)};}
  addEventListener(kind,fn){(this.listeners[kind]||=[]).push(fn);}
  async emit(kind,event={}){for(const fn of this.listeners[kind]||[])await fn({target:this,preventDefault(){},...event});}
  setAttribute(name,value){this.attributes[name]=String(value);}getAttribute(name){return this.attributes[name]??null;}replaceChildren(){this.innerHTML='';}appendChild(){}insertAdjacentHTML(_where,html){this.innerHTML+=html;}querySelectorAll(){return [];}focus(){this.focused=true;}scrollIntoView(){}showModal(){this.open=true;}close(){this.open=false;}click(){return this.emit('click');}
 }
 const html=fs.readFileSync(path.join(root,htmlName),'utf8');
 const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
 Object.assign(elements['matrix-shape'],{value:'3,4'});elements['matrix-mode'].value='all';elements['fib-n'].value='4';
 for(const name of ['topic-filter','scope-filter','status-filter','level-filter','tests-filter'])elements[name].value='all';
 for(const [name,value] of Object.entries({'matrix-order':'rows','recursion-kind':'fibonacci','sum-input':'2, 3, 4','sequence-kind':'stack','sequence-input':'10','collection-kind':'tda-map','collection-key':'a','collection-value':'1'}))elements[name].value=value;
 const nav=new Element(),navigation=['ruta','practica','laboratorio','teoria','cronograma'].map(view=>Object.assign(new Element(),{dataset:{view}}));
 const storage=new Map(initial===undefined?[]:[[key,initial]]),session=new Map(Object.entries(initialSession)),timers=new Map(),intervals=new Map();let serial=0;
 const windowEvents={},documentEvents={};
 const store=map=>({getItem:k=>map.get(k)||null,setItem:(k,v)=>{if(failWrites)throw Error('quota');map.set(k,String(v));},removeItem:k=>map.delete(k)});
 const workers=[];
 class Worker {
  constructor(){workers.push(this);this.requests=[];}postMessage(data){this.payload=data;this.requests.push(data);}terminate(){this.terminated=true;}
  message(data){this.onmessage({data:{runId:this.payload.runId,...data}});}
 }
 const context=vm.createContext({console,Intl,Date:Clock,Blob,Worker,
  URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL:()=>{}},
  localStorage:store(storage),sessionStorage:store(session),confirm:()=>true,
  location:{hash:'#practica'},history:{replaceState(){}},scrollTo(){},addEventListener:(name,fn)=>{(windowEvents[name]||=[]).push(fn);},
  setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>{const id=++serial;intervals.set(id,{fn,ms});return id;},
  document:{getElementById:id=>elements[id]||null,createElement:()=>new Element(),createTextNode:s=>({textContent:s}),
   querySelector:()=>nav,querySelectorAll:sel=>sel==='.view'?Object.values(elements).filter(e=>e.id.startsWith('view-')):navigation,addEventListener:(name,fn)=>{(documentEvents[name]||=[]).push(fn);}}
 });
 context.window=context;
 for(const name of ['datos.js','aprendizaje.js','aprendizaje-vistas.js','simulacros.js','simulacros-vistas.js','taller.js','laboratorio.js','laboratorio-vistas.js','pedagogia.js','evaluador.js','runtime.js','mapa.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'ruta-entrenamiento',name),'utf8'),context,{filename:name});
 return {elements,context,storage,session,timers,intervals,workers,advanceTo:value=>{clock=value;},run:script=>vm.runInContext(script,context),
  emitWindow:async(name,event={})=>{for(const fn of windowEvents[name]||[])await fn(event);},
  emitDocument:async(name,event={})=>{for(const fn of documentEvents[name]||[])await fn(event);}};
}
const passed={mode:'tests',cases:[{id:1,status:'passed',input:'f(1)',expected:'1',actual:'1',durationMs:1,error:null}],total:1,passed:1,failed:0,skipped:0,error:null,durationMs:3};

test('ambos HTML arrancan con 148 ejercicios y los recursos/controles completos',()=>{
 for(const html of ['index.html','Guia primer parcial estructura de datos.html']){
  const app=boot(undefined,html);assert.match(app.elements['list-count'].textContent,/148/);
  assert.equal(app.run('state.version'),5);assert.ok(app.elements['exercise-title'].textContent);
  assert.equal(app.elements['explain-error'].disabled,true);assert.equal(app.elements['test-results'].hidden,true);
 }
});
test('migración crea copia v2 y un guardado corrupto queda protegido',()=>{
 const old=JSON.stringify({version:2,exercises:{'legacy-1':{code:'mi código',status:'mastered'}},log:'log'});
 const app=boot(old);assert.equal(app.storage.get(key+'_before_v3'),old);assert.equal(JSON.parse(app.storage.get(key)).version,5);
 assert.equal(app.run('state.exercises["legacy-1"].code'),'mi código');
 const corrupt=boot('{broken');assert.equal(corrupt.storage.get(key),'{broken');assert.equal(corrupt.elements['recover-progress'].hidden,false);
 const blocked=boot(old,'index.html',true);assert.equal(blocked.storage.get(key),old);assert.match(blocked.elements['save-status'].textContent,/protegido/);
});
test('pistas abren secuencialmente, se ocultan y persisten sin duplicar usos',async()=>{
 const app=boot(),e=app.elements;
 await e['hint-button'].click();assert.match(e['hints-content'].innerHTML,/Orientación/);assert.ok(!e['hints-content'].innerHTML.includes('Pseudocódigo'));
 await e['hide-hints'].click();assert.equal(e['hints-panel'].hidden,true);
 await e['hint-button'].click();assert.equal(app.run('entryFor(selectedId).help.used'),1);
 await e['next-hint'].click();await e['next-hint'].click();assert.equal(app.run('entryFor(selectedId).help.used'),3);
 assert.equal(e['next-hint'].disabled,true);assert.equal(e['original-hint'].hidden,false);
 const reloaded=boot(app.storage.get(key));assert.equal(reloaded.run('entryFor(selectedId).help.unlocked'),3);
 await e['fresh-attempt'].click();assert.equal(app.run('entryFor(selectedId).help.unlocked'),0);assert.equal(app.run('entryFor(selectedId).help.used'),3);
});
test('ayuda avanzada impide declarar dominio; pasar pruebas no cambia el estado a dominado',async()=>{
 const app=boot(),e=app.elements;
 await e['hint-button'].click();await e['next-hint'].click();e['exercise-status'].value='mastered';await e['exercise-status'].emit('change');
 assert.equal(e['exercise-status'].value,'review');
 await e['test-code'].click();app.workers[0].message({type:'done',report:passed});
 assert.equal(app.run('entryFor(selectedId).status'),'review');assert.equal(app.run('entryFor(selectedId).attempts[0].assisted'),true);
});
test('renderiza reporte escapado, persiste versión ejecutada y advierte ediciones posteriores',async()=>{
 const app=boot(),e=app.elements;
 e['code-editor'].value='def f(n): return n';await e['code-editor'].emit('input');await e['test-code'].click();
 const worker=app.workers[0];assert.match(worker.payload.tests,/assert/);assert.ok(worker.payload.evaluator.includes('_training_evaluate'));
 worker.message({type:'done',report:{...passed,cases:[{...passed.cases[0],actual:'<script>bad()</script>'}]}});
 assert.equal(e['test-results'].hidden,false);assert.match(e['test-summary'].textContent,/1 aprobados/);assert.ok(e['test-cases'].innerHTML.includes('&lt;script&gt;'));
 assert.equal(e['report-stale'].hidden,true);e['code-editor'].value+='\n# edición';await e['code-editor'].emit('input');assert.equal(e['report-stale'].hidden,false);
 const reloaded=boot(app.storage.get(key));assert.equal(reloaded.run('entryFor(selectedId).attempts.length'),1);assert.equal(reloaded.elements['report-stale'].hidden,false);
});
test('detención, cambio de ejercicio y mensajes obsoletos no atribuyen resultados al ejercicio nuevo',async()=>{
 const app=boot();await app.elements['test-code'].click();const worker=app.workers[0],original=app.run('selectedId');
 worker.message({type:'progress',report:passed});app.run('selectExercise("legacy-1")');
 assert.equal(worker.terminated,true);assert.equal(app.run(`state.exercises[${JSON.stringify(original)}].lastReport.error.category`),'cancelled');
 worker.message({type:'done',report:passed});assert.equal(app.run('entryFor(selectedId).lastReport'),undefined);
 await app.elements['run-code'].click();const next=app.workers[1];worker.message({type:'done',report:passed});assert.equal(app.run('running'),true);
 next.message({type:'done',report:{...passed,mode:'run',cases:[]}});assert.equal(app.run('running'),false);
});
test('timeout conserva casos terminados y clasifica carga y ejecución por separado',async()=>{
 const app=boot();await app.elements['test-code'].click();const worker=app.workers[0];
 worker.message({type:'phase',phase:'running',text:'Ejecutando'});worker.message({type:'progress',report:passed});
 [...app.timers.values()].find(t=>t.ms===12000).fn();
 assert.equal(worker.terminated,true);assert.equal(app.run('entryFor(selectedId).lastReport.passed'),1);
 assert.equal(app.run('entryFor(selectedId).lastReport.error.category'),'timeout');
 await app.elements['run-code'].click();[...app.timers.values()].find(t=>t.ms===120000).fn();
 assert.equal(app.run('entryFor(selectedId).lastReport.error.category'),'infrastructure');
});
test('simulacro cierra las ayudas ya abiertas y bloquea sus manejadores',async()=>{
 const app=boot(),e=app.elements;await e['hint-button'].click();await e['start-mock'].click();
 assert.equal(e['hint-button'].hidden,true);assert.equal(e['hints-panel'].hidden,true);assert.equal(e['explain-error'].hidden,true);
 await e['hint-button'].click();await e['next-hint'].click();await e['solution-button'].click();
 assert.equal(app.run('entryFor(selectedId).help.used'),0);assert.equal(e['help-panel'].hidden,true);
 await e['stop-mock'].click();assert.equal(e['hint-button'].hidden,false);
});
test('importación valida, conserva ayudas y reportes y requiere confirmar sobrescritura',async()=>{
 const app=boot(),e=app.elements;
 const imported={version:3,log:'nuevo',selected:'legacy-1',exercises:{'legacy-1':{code:'nuevo código',status:'review',help:{unlocked:2,used:4},lastReport:passed}}};
 const file={size:100,text:async()=>JSON.stringify(imported)};
 app.context.confirm=()=>false;await e['import-progress'].emit('change',{target:{files:[file],value:'archivo'}});assert.notEqual(app.run('selectedId'),'legacy-1');
 app.context.confirm=()=>true;await e['import-progress'].emit('change',{target:{files:[file],value:'archivo'}});assert.equal(app.run('selectedId'),'legacy-1');
 assert.equal(e['code-editor'].value,'nuevo código');assert.equal(app.run('entryFor(selectedId).help.used'),4);assert.equal(app.run('entryFor(selectedId).lastReport.passed'),1);
 const before=app.storage.get(key);await e['import-progress'].emit('change',{target:{files:[{size:10,text:async()=>'{broken'}],value:'archivo'}});assert.equal(app.storage.get(key),before);
});

const day=86400000,epoch=Date.parse('2026-01-01T12:00:00Z');
async function solve(app,code='def f(): return 1'){
 app.elements['code-editor'].value=code;await app.elements['code-editor'].emit('input');
 await app.elements['test-code'].click();app.workers.at(-1).message({type:'done',report:passed});
}
test('Etapa 2: declaraciones anteriores no aparecen como consolidación automática',()=>{
 const app=boot(JSON.stringify({version:3,selected:'legacy-1',exercises:{'legacy-1':{status:'mastered',code:'mi borrador'}}}),'index.html',false,epoch);
 assert.equal(app.elements['completed-count'].textContent,1);assert.equal(app.elements['approved-count'].textContent,0);
 assert.match(app.elements['declared-mastery'].textContent,/1 marcados/);
 assert.match(app.elements['mastery-count'].innerHTML,/^0 /);assert.equal(app.run('entryFor(selectedId).status'),'mastered');
 assert.equal(app.storage.get(key+'_before_v4')!==undefined,true);
});
test('Etapa 2: aprobación, dominio y completado son métricas distintas',async()=>{
 const app=boot(undefined,'index.html',false,epoch);
 await solve(app);
 assert.equal(app.elements['completed-count'].textContent,1);assert.equal(app.elements['approved-count'].textContent,1);
 assert.match(app.elements['mastery-count'].innerHTML,/^0 /);assert.equal(app.run('entryFor(selectedId).learning.streak'),1);
 assert.match(app.elements['attempt-history'].innerHTML,/1\/1 casos/);
 app.elements['exercise-completed'].checked=false;await app.elements['exercise-completed'].emit('change');
 assert.equal(app.elements['completed-count'].textContent,0);assert.equal(app.elements['approved-count'].textContent,1);
});
test('Etapa 2: repaso conserva borrador, cierra sesión y exige nuevos repasos espaciados',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 await solve(app,'# borrador principal');
 app.advanceTo(epoch+day);await e['start-review'].click();
 assert.notEqual(e['code-editor'].value,'# borrador principal');assert.equal(app.run('entryFor(selectedId).code'),'# borrador principal');
 assert.equal(app.run('entryFor(selectedId).session.edited'),false);
 await solve(app,'# primer repaso');assert.equal(app.run('entryFor(selectedId).learning.stage'),1);
 assert.equal(app.run('entryFor(selectedId).session.finished'),true);
 app.advanceTo(epoch+4*day);await e['test-code'].click();app.workers.at(-1).message({type:'done',report:passed});
 assert.equal(app.run('entryFor(selectedId).learning.stage'),1);assert.match(e['mastery-count'].innerHTML,/^0 /);
 await e['start-review'].click();assert.equal(app.run('entryFor(selectedId).session.finished'),false);
 await solve(app,'# segundo repaso');assert.equal(app.run('entryFor(selectedId).learning.stage'),2);
 assert.match(e['mastery-count'].innerHTML,/^1 /);assert.match(e['learning-state'].textContent,/Consolidado sin ayuda/);
 const restored=boot(app.storage.get(key),'index.html',false,epoch+4*day);
 assert.equal(restored.elements['code-editor'].value,'# segundo repaso');
 await restored.elements['return-draft'].click();assert.equal(restored.elements['code-editor'].value,'# borrador principal');
 assert.equal(restored.run('entryFor(selectedId).reviewCode'),'# segundo repaso');
});
test('Etapa 2: reiniciar repaso con ayuda pide confirmar y vuelve a plantilla',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 await solve(app,'# principal');app.advanceTo(epoch+day);await e['start-review'].click();
 await e['hint-button'].click();await solve(app,'# ayudado');assert.equal(app.run('entryFor(selectedId).learning.streak'),0);
 app.context.confirm=()=>false;await e['fresh-attempt'].click();assert.equal(e['code-editor'].value,'# ayudado');
 app.context.confirm=()=>true;await e['fresh-attempt'].click();assert.notEqual(e['code-editor'].value,'# ayudado');
 assert.equal(app.run('entryFor(selectedId).session.edited'),false);assert.equal(app.run('entryFor(selectedId).help.used'),1);
 assert.equal(app.run('entryFor(selectedId).code'),'# principal');
});
test('Etapa 2: autoevaluación sin pruebas se registra y no aumenta aprobaciones automáticas',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;app.run('selectExercise("legacy-1")');
 assert.equal(e['self-assessment'].hidden,false);e['self-result'].value='independent';await e['register-self-result'].click();
 assert.equal(app.run('entryFor(selectedId).learning.completed'),true);assert.equal(app.run('entryFor(selectedId).learning.approved'),false);
 assert.match(e['attempt-history'].innerHTML,/Autoevaluación/);assert.equal(e['approved-count'].textContent,0);
 app.advanceTo(epoch+day);await e['start-review'].click();e['code-editor'].value='# reescrito';await e['code-editor'].emit('input');
 e['self-result'].value='independent';await e['register-self-result'].click();assert.equal(app.run('entryFor(selectedId).learning.stage'),1);
});
test('Etapa 2: restablecer dentro de un repaso usa plantilla y preserva borrador y ayudas',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 await solve(app,'# principal');app.advanceTo(epoch+day);await e['start-review'].click();
 e['code-editor'].value='# en revisión';await e['code-editor'].emit('input');await e['hint-button'].click();
 await e['reset-code'].click();assert.match(e['reset-explanation'].textContent,/repaso/);await e['cancel-reset'].click();assert.equal(e['code-editor'].value,'# en revisión');
 await e['reset-code'].click();await e['confirm-reset'].click();assert.equal(e['code-editor'].value,app.run('DATA.exercises.find(e=>e.id===selectedId).starter'));
 assert.equal(app.run('entryFor(selectedId).code'),'# principal');assert.equal(app.run('entryFor(selectedId).help.unlocked'),1);assert.equal(app.run('entryFor(selectedId).session.edited'),false);
});
test('Etapa 2: importación v4 conserva el calendario, la sesión y los dos borradores',async()=>{
 const source=boot(undefined,'index.html',false,epoch);await solve(source,'# principal');
 source.advanceTo(epoch+day);await source.elements['start-review'].click();await solve(source,'# repaso');
 const backup=source.storage.get(key);
 const target=boot(undefined,'index.html',false,epoch+day);
 await target.elements['import-progress'].emit('change',{target:{files:[{size:backup.length,text:async()=>backup}],value:'archivo'}});
 assert.equal(target.run('state.version'),5);assert.equal(target.run('entryFor(selectedId).learning.stage'),1);
 assert.equal(target.run('entryFor(selectedId).learning.dueAt'),source.run('entryFor(selectedId).learning.dueAt'));
 assert.equal(target.run('entryFor(selectedId).code'),'# principal');assert.equal(target.elements['code-editor'].value,'# repaso');
 assert.equal(target.run('entryFor(selectedId).session.finished'),true);
});
test('Etapa 2: posponer recomendación conserva repaso y elegir manualmente conserva selección',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await solve(app);app.advanceTo(epoch+day);app.run('renderLearning()');
 const id=app.run('selectedId');
 await e['training-recommendations'].emit('click',{target:{closest:selector=>selector==='[data-postpone]'?{dataset:{postpone:id}}:null}});
 assert.equal(app.run('LEARNING.reviews(DATA.exercises,state.exercises).filter(r=>r.due).length'),1);
 assert.ok(!app.run('LEARNING.recommend(DATA.exercises,state.exercises).map(r=>r.exercise.id)').includes(id));
 await e['choose-training'].click();assert.equal(app.run('selectedId'),id);
 assert.match(e['review-count'].textContent,/1 ejercicio/);
});
test('Etapa 2: iniciar repaso durante ejecución conserva la cancelación en el historial',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 e['code-editor'].value='# principal';await e['code-editor'].emit('input');await e['test-code'].click();
 await e['start-review'].click();assert.equal(app.workers[0].terminated,true);
 assert.equal(app.run('entryFor(selectedId).session.kind'),'review');assert.equal(app.run('entryFor(selectedId).attempts[0].category'),'cancelled');
 assert.equal(app.run('entryFor(selectedId).code'),'# principal');
});
test('Etapa 2: simulacro oculta y bloquea los nuevos controles de repaso y autoevaluación',async()=>{
 const app=boot(),e=app.elements;await e['start-mock'].click();
 assert.equal(e['start-review'].hidden,true);assert.equal(e['self-assessment'].hidden,true);
 const before=app.run('entryFor(selectedId).session.kind');await e['start-review'].click();assert.equal(app.run('entryFor(selectedId).session.kind'),before);
 app.run('selectExercise("legacy-1")');e['self-result'].value='independent';await e['register-self-result'].click();
 assert.equal(app.run('entryFor(selectedId).attempts.length'),0);
});

const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('Etapa 3: examen conserva borrador principal, repaso, ayudas, notas y entradas de práctica',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 const matrix=app.run('selectedId');app.run('entryFor(selectedId).reviewCode="repaso previo";entryFor(selectedId).notes="nota previa";entryFor(selectedId).stdin="entrada previa"');
 e['code-editor'].value='# principal';await e['code-editor'].emit('input');
 app.run(`startExam([${JSON.stringify(matrix)}],30,"Uno")`);
 assert.notEqual(e['code-editor'].value,'# principal');e['code-editor'].value='# respuesta examen';await e['code-editor'].emit('input');
 e['exercise-notes'].value='nota del examen';await e['exercise-notes'].emit('input');e['stdin-input'].value='entrada del examen';await e['stdin-input'].emit('input');
 assert.equal(app.run('entryFor(selectedId).code'),'# principal');assert.equal(app.run('entryFor(selectedId).reviewCode'),'repaso previo');
 assert.equal(app.run('entryFor(selectedId).notes'),'nota previa');assert.equal(app.run('entryFor(selectedId).stdin'),'entrada previa');
 assert.equal(app.run('examItem(selectedId).stdin'),'entrada del examen');assert.equal(e['exercise-learning-panel'].hidden,true);
});
test('Etapa 3: entregar antes de tiempo pide confirmar y aprobar durante examen no publica aún progreso',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await e['start-mock'].click();
 await solve(app,'# respuesta');assert.equal(app.run('entryFor(selectedId).learning.approved'),false);
 app.context.confirm=()=>false;await e['stop-mock'].click();assert.equal(app.run('state.exams.active.phase'),'running');
 app.context.confirm=()=>true;await e['stop-mock'].click();
 assert.equal(app.run('state.exams.active'),null);assert.equal(app.run('state.exams.history.length'),1);
 assert.equal(app.run('state.exams.history[0].items[0].published'),true);
 assert.equal(app.run('state.exercises[intervaloId].attempts[0].kind'),'exam');
 assert.equal(app.run('state.exercises[intervaloId].learning.streak'),1);
 assert.equal(app.workers[0].requests.length,1);assert.match(e['exam-result-summary'].textContent,/1 aprobados/);
});
test('Etapa 3: entrega corrige las respuestas congeladas en orden y conserva resultados individuales',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await e['start-mock'].click();
 e['code-editor'].value='# intervalo';await e['code-editor'].emit('input');app.run('selectExercise(puertoId)');
 e['code-editor'].value='# puerto';await e['code-editor'].emit('input');await e['stop-mock'].click();
 assert.equal(app.run('state.exams.active.phase'),'grading');assert.equal(e['code-editor'].readOnly,true);assert.equal(e['hint-button'].hidden,true);
 const worker=app.workers[0];assert.equal(worker.payload.code,'# intervalo');assert.equal(worker.payload.tests,app.run('PEDAGOGY.testsFor(DATA.exercises.find(ex=>ex.id===intervaloId))'));
 const firstRun=worker.payload.runId;worker.message({type:'done',report:passed});await settle();
 assert.equal(worker.payload.code,'# puerto');assert.equal(worker.requests.length,2);
 worker.message({type:'done',report:passed,runId:firstRun});assert.equal(app.run('running'),true);
 worker.message({type:'done',report:passed});await settle();
 assert.equal(app.run('state.exams.active'),null);assert.equal(app.run('state.exams.history[0].items.filter(i=>i.published).length'),2);
 assert.equal(e['exam-results'].hidden,false);assert.equal(e['code-editor'].readOnly,false);assert.match(e['exam-result-coverage'].textContent,/2\/2/);
});
test('Etapa 3: vencimiento automático ignora ediciones tardías y congela al minuto indicado',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 app.run('startExam([selectedId],5,"Corto")');e['code-editor'].value='# antes';await e['code-editor'].emit('input');
 app.advanceTo(epoch+5*60000);e['code-editor'].value='# después';await e['code-editor'].emit('input');
 assert.equal(app.run('state.exams.active.phase'),'grading');assert.equal(app.workers[0].payload.code,'# antes');
 assert.equal(app.run('state.exams.active.submittedAt'),new Date(epoch+5*60000).toISOString());
 app.workers[0].message({type:'done',report:passed});await settle();
 assert.equal(app.run('state.exams.history[0].reason'),'timeout');assert.equal(app.run('state.exams.history[0].items[0].elapsedMs'),5*60000);
});
test('Etapa 3: foco, visibilidad y sección controlan tiempo por ejercicio sin pausar el límite general',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await e['start-mock'].click();
 app.advanceTo(epoch+10000);await app.emitWindow('blur');app.advanceTo(epoch+40000);await app.emitWindow('focus');
 app.advanceTo(epoch+50000);app.run('switchView("ruta")');app.advanceTo(epoch+90000);await e['resume-mock'].click();
 app.advanceTo(epoch+100000);await e['stop-mock'].click();
 assert.equal(app.run('state.exams.history[0].items[0].elapsedMs'),30000);
 assert.equal(app.run('EXAMS.summary(state.exams.history[0],DATA.exercises).elapsedMs'),100000);
 const another=boot(undefined,'index.html',false,epoch);await another.elements['start-mock'].click();
 another.advanceTo(epoch+5000);another.context.document.hidden=true;await another.emitDocument('visibilitychange');
 another.advanceTo(epoch+20000);another.context.document.hidden=false;await another.emitDocument('visibilitychange');
 another.advanceTo(epoch+25000);await another.elements['stop-mock'].click();assert.equal(another.run('state.exams.history[0].items[0].elapsedMs'),10000);
});
test('Etapa 3: recargar conserva el intento y no cuenta el tiempo con la pestaña cerrada',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await e['start-mock'].click();
 e['code-editor'].value='# guardado';await e['code-editor'].emit('input');app.advanceTo(epoch+10000);app.run('saveState()');
 const reloaded=boot(app.storage.get(key),'index.html',false,epoch+60000);
 assert.equal(reloaded.elements['code-editor'].value,'# guardado');assert.equal(reloaded.run('state.exams.active.items[0].elapsedMs'),10000);
 assert.equal(reloaded.run('state.exams.active.deadline'),app.run('state.exams.active.deadline'));
 reloaded.advanceTo(epoch+65000);reloaded.run('saveState()');assert.equal(reloaded.run('state.exams.active.items[0].elapsedMs'),15000);
});
test('Etapa 3: vencimiento durante cierre de pestaña restaura corrección pendiente sin cargar Python al abrir',async()=>{
 const app=boot(undefined,'index.html',false,epoch);app.run('startExam([selectedId],5,"Corto")');
 app.elements['code-editor'].value='# respuesta';await app.elements['code-editor'].emit('input');
 const restored=boot(app.storage.get(key),'index.html',false,epoch+6*60000);
 assert.equal(restored.run('state.exams.active.phase'),'grading');assert.equal(restored.workers.length,0);assert.equal(restored.elements['code-editor'].readOnly,true);
 await restored.elements['resume-mock'].click();assert.equal(restored.workers[0].payload.code,'# respuesta');
 restored.workers[0].message({type:'done',report:passed});await settle();assert.equal(restored.run('state.exams.history.length'),1);
});
test('Etapa 3: fallo de motor queda sin corregir, puede reintentarse y no duplica aprendizaje ni historial',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;app.run('startExam([selectedId],30,"Uno")');
 e['code-editor'].value='# respuesta';await e['code-editor'].emit('input');await e['stop-mock'].click();
 app.workers[0].message({type:'error',phase:'loading',text:'network'});await settle();
 assert.equal(app.run('state.exams.history[0].items[0].published'),false);assert.equal(app.run('entryFor(selectedId).attempts.length'),0);
 assert.match(e['exam-result-summary'].textContent,/1 sin corrección/);assert.equal(e['retry-exam-grading'].hidden,false);
 const id=app.run('state.exams.history[0].id');await e['retry-exam-grading'].click();app.workers.at(-1).message({type:'done',report:passed});await settle();
 assert.equal(app.run('state.exams.history.length'),1);assert.equal(app.run('state.exams.history[0].id'),id);assert.equal(app.run('entryFor(selectedId).attempts.length'),1);
 await e['retry-exam-grading'].click();assert.equal(app.run('entryFor(selectedId).attempts.length'),1);
});
test('Etapa 3: navegación y referencias no interrumpen ni exponen ayudas; salir activa protección',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await e['start-mock'].click();
 const id=app.run('selectedId');app.run('selectExercise("legacy-1")');assert.equal(app.run('selectedId'),id);
 app.run('switchView("teoria")');assert.equal(app.run('currentView'),'practica');
 await e['notebook-button'].click();await e['load-helpers'].click();assert.equal(app.run('entryFor(selectedId).help.solutionViewed'),false);
 assert.equal(e['exercise-source'].hidden,true);assert.equal(e['exam-history'].hidden,true);
 let prevented=false;const event={preventDefault(){prevented=true;}};await app.emitWindow('beforeunload',event);assert.equal(prevented,true);assert.equal(event.returnValue,'');
 const file={size:2,text:async()=>{throw Error('No debe leer un respaldo durante el examen');}};
 await e['import-progress'].emit('change',{target:{files:[file],value:'file'}});assert.equal(app.run('state.exams.active.phase'),'running');
});
test('Etapa 3: filtros conservan selección entre temas y crean un simulacro mixto sin inventar niveles',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 const ids=app.run('[DATA.exercises.find(e=>e.topic==="matriz").id,DATA.exercises.find(e=>e.topic==="pila-cola").id]');
 for(const id of ids){const input={checked:true,dataset:{examChoice:id},closest:()=>input};await e['exam-choices'].emit('change',{target:input});}
 e['exam-topic'].value='recursividad';await e['exam-topic'].emit('change');assert.match(e['exam-selection-count'].textContent,/2 de 6/);
 e['exam-minutes'].value='45';await e['start-custom-mock'].click();assert.deepEqual([...app.run('state.exams.active.items.map(i=>i.exerciseId)')],[...ids]);
 assert.equal(app.run('LEARNING.timestamp(state.exams.active.deadline)-LEARNING.timestamp(state.exams.active.startedAt)'),45*60000);
});
test('Etapa 3: sin pruebas se conserva respuesta para revisión manual y no se inventa aprobación',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;app.run('startExam(["legacy-1"],30,"Manual")');
 e['code-editor'].value='# respuesta manual';await e['code-editor'].emit('input');await e['stop-mock'].click();
 assert.equal(app.workers.length,0);assert.match(e['exam-result-summary'].textContent,/1 para revisión manual/);
 assert.equal(app.run('state.exercises["legacy-1"].learning.approved'),false);assert.equal(app.run('state.exercises["legacy-1"].attempts.length'),0);
});
test('Etapa 3: temporizador anterior se recupera sin inventar tiempos por ejercicio',()=>{
 const deadline=epoch+45*60000;
 const raw={version:4,exercises:{'Practica_Parcial_1-1':{code:'# anterior',status:'practicing'}}};
 const app=boot(JSON.stringify(raw),'index.html',false,epoch,{unahur_mock_deadline:String(deadline)});
 assert.equal(app.run('state.exams.active.legacy'),true);assert.equal(app.run('state.exams.active.deadline'),new Date(deadline).toISOString());
 assert.equal(app.elements['code-editor'].value,'# anterior');assert.equal(app.run('state.exams.active.items[0].elapsedMs'),0);
 assert.equal(app.session.has('unahur_mock_deadline'),false);assert.ok(app.storage.has(key+'_before_v5'));
});
test('Etapa 3: importación v5 restaura simulacro y conserva historial local al importar progreso anterior',async()=>{
 const source=boot(undefined,'index.html',false,epoch);await source.elements['start-mock'].click();
 source.elements['code-editor'].value='# vivo';await source.elements['code-editor'].emit('input');const backup=source.storage.get(key);
 const target=boot(undefined,'index.html',false,epoch+1000);await target.elements['start-mock'].click();await target.elements['stop-mock'].click();
 const oldId=target.run('state.exams.history[0].id');
 await target.elements['import-progress'].emit('change',{target:{files:[{size:backup.length,text:async()=>backup}],value:'file'}});
 assert.equal(target.elements['code-editor'].value,'# vivo');assert.equal(target.run('state.exams.history[0].id'),oldId);assert.equal(target.run('examLocked()'),true);
});
test('Etapa 3: cambiar entradas invalida el resultado anterior aunque el código coincida',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;app.run('startExam([selectedId],30,"Uno")');
 await solve(app,'# respuesta');const worker=app.workers[0];
 e['stdin-input'].value='nueva entrada';await e['stdin-input'].emit('input');assert.equal(e['report-stale'].hidden,false);
 await e['stop-mock'].click();assert.equal(worker.requests.length,2);assert.equal(worker.payload.stdin,'nueva entrada');
 worker.message({type:'done',report:passed});await settle();assert.equal(app.run('state.exams.history[0].items[0].reportStdin'),'nueva entrada');
});
test('Etapa 3: confirmar entrega tras vencer el plazo guarda motivo timeout sin admitir nueva edición',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;app.run('startExam([selectedId],5,"Corto")');
 e['code-editor'].value='# a tiempo';await e['code-editor'].emit('input');
 app.context.confirm=()=>{app.advanceTo(epoch+6*60000);e['code-editor'].value='# tarde';return true;};
 await e['stop-mock'].click();assert.equal(app.run('state.exams.active.reason'),'timeout');assert.equal(e['code-editor'].value,'# a tiempo');
 app.workers[0].message({type:'done',report:passed});await settle();assert.equal(app.run('state.exams.history[0].reason'),'timeout');
});
test('Etapa 3: resultado fallido produce refuerzo y conserva el diagnóstico sin aprobar el ejercicio',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;app.run('startExam([selectedId],30,"Uno")');
 e['code-editor'].value='# incorrecto';await e['code-editor'].emit('input');await e['stop-mock'].click();
 const failed={...passed,passed:0,failed:1,cases:[{...passed.cases[0],status:'failed',actual:'0',error:{category:'logic',type:'AssertionError',message:'difiere'}}]};
 app.workers[0].message({type:'done',report:failed});await settle();
 assert.match(e['exam-result-summary'].textContent,/1 no aprobados/);assert.match(e['exam-strengths'].innerHTML,/A reforzar/);
 assert.equal(app.run('entryFor(selectedId).learning.approved'),false);assert.equal(app.run('entryFor(selectedId).attempts[0].category'),'logic');
 assert.match(e['exam-result-details'].innerHTML,/no cumple este caso/);assert.ok(e['exam-recommendations'].innerHTML.includes('Reintentá'));
});
test('Etapa 3: detener corrección cancela solo el trabajo actual y continúa con los demás',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;await e['start-mock'].click();
 e['code-editor'].value='# uno';await e['code-editor'].emit('input');app.run('selectExercise(puertoId)');
 e['code-editor'].value='# dos';await e['code-editor'].emit('input');await e['stop-mock'].click();
 await e['stop-code'].click();await settle();assert.equal(app.workers[0].terminated,true);assert.equal(app.workers[1].payload.code,'# dos');
 app.workers[1].message({type:'done',report:passed});await settle();
 assert.equal(app.run('state.exams.history[0].items[0].published'),false);assert.equal(app.run('state.exams.history[0].items[1].published'),true);
 assert.equal(app.run('EXAMS.summary(state.exams.history[0],DATA.exercises).counts.ungraded'),1);
});

test('Etapa 4: navegación y catálogo comparten filtros y conservan borradores',async()=>{
 const app=boot(),e=app.elements;
 e['topic-filter'].value='matriz';e['tests-filter'].value='yes';await e['topic-filter'].emit('change');
 const ids=JSON.parse(app.run('JSON.stringify(filteredExercises().map(ex=>ex.id))'));
 app.run(`selectExercise(${JSON.stringify(ids[0])})`);
 e['code-editor'].value='# borrador protegido';await e['code-editor'].emit('input');
 assert.equal(e['previous-exercise'].disabled,true);assert.equal(e['next-exercise'].disabled,false);
 await e['next-exercise'].click();assert.equal(app.run('selectedId'),ids[1]);assert.equal(e['exercise-title'].focused,true);
 await e['previous-exercise'].click();assert.equal(e['code-editor'].value,'# borrador protegido');assert.equal(e['topic-filter'].value,'matriz');
 e['exercise-search'].value='ningún resultado imaginable';await e['exercise-search'].emit('input');
 assert.equal(e['previous-exercise'].disabled,true);assert.equal(e['next-exercise'].disabled,true);assert.match(e['exercise-position'].textContent,/fuera de los filtros/);
 await e['next-exercise'].click();assert.equal(app.run('selectedId'),ids[0]);assert.equal(e['code-editor'].value,'# borrador protegido');
 await e['clear-filters'].click();assert.match(e['list-count'].textContent,/148/);
});
test('Etapa 4: distribución y catálogo persisten, se exportan e importaciones anteriores los conservan',async()=>{
 const app=boot(),e=app.elements;
 e['workshop-layout'].value='split';await e['workshop-layout'].emit('change');await e['toggle-catalog'].click();
 assert.equal(e['exercise-detail'].classes.has('split-layout'),true);assert.equal(e['exercise-browser'].hidden,true);
 assert.equal(e['toggle-catalog'].getAttribute('aria-expanded'),'false');
 const reloaded=boot(app.storage.get(key));assert.equal(reloaded.elements['workshop-layout'].value,'split');assert.equal(reloaded.elements['exercise-browser'].hidden,true);
 const older={version:2,selected:'legacy-1',exercises:{'legacy-1':{code:'# importado'}}};
 await e['import-progress'].emit('change',{target:{files:[{size:100,text:async()=>JSON.stringify(older)}],value:'file'}});
 assert.equal(e['workshop-layout'].value,'split');assert.equal(e['exercise-browser'].hidden,true);
 await e['toggle-catalog'].click();assert.equal(e['exercise-browser'].hidden,false);assert.equal(e['toggle-catalog'].getAttribute('aria-expanded'),'true');
 await e['jump-editor'].click();assert.equal(e['code-editor'].focused,true);assert.equal(e['code-editor'].value,'# importado');
});
test('Etapa 4: atajos distinguen ejecutar y probar, avisan si no hay casos',async()=>{
 const app=boot();let prevented=0;
 await app.emitDocument('keydown',{key:'Enter',ctrlKey:true,shiftKey:true,preventDefault(){prevented++;}});
 assert.match(app.workers[0].payload.tests,/assert/);assert.equal(prevented,1);
 app.workers[0].message({type:'done',report:passed});
 await app.emitDocument('keydown',{key:'Enter',metaKey:true,shiftKey:false,preventDefault(){}});
 assert.equal(app.workers[0].payload.tests,'');app.workers[0].message({type:'done',report:{...passed,mode:'run',cases:[]}});
 app.run('openExercise(DATA.exercises.find(ex=>!ex.tests).id)');
 await app.emitDocument('keydown',{key:'Enter',ctrlKey:true,shiftKey:true,preventDefault(){}});
 assert.match(app.elements.toast.textContent,/no tiene pruebas/);assert.equal(app.run('running'),false);
 app.run('switchView("laboratorio")');await app.emitDocument('keydown',{key:'Enter',ctrlKey:true,preventDefault(){throw Error('No interceptar otra sección');}});
});
test('Etapa 4: controles de matriz muestran acumulador, orden, final y formas inválidas',async()=>{
 const app=boot(),e=app.elements;
 assert.match(e['matrix-progress'].textContent,/Paso 0\/12/);await e['matrix-next'].click();await e['matrix-next'].click();
 assert.match(e['matrix-progress'].textContent,/i=0, j=1 · acumulador = 1/);assert.match(e['matrix-grid'].innerHTML,/aria-current="step"/);
 e['matrix-order'].value='columns';await e['matrix-order'].emit('change');await e['matrix-next'].click();await e['matrix-next'].click();
 assert.match(e['matrix-progress'].textContent,/i=1, j=0/);
 for(let n=2;n<12;n++)await e['matrix-next'].click();assert.match(e['matrix-progress'].textContent,/resultado final = 30/);assert.equal(e['matrix-next'].disabled,true);
 await e['matrix-prev'].click();assert.equal(e['matrix-next'].disabled,false);
 e['matrix-mode'].value='secondary';await e['matrix-mode'].emit('change');assert.equal(e['matrix-next'].disabled,true);assert.match(e['matrix-explanation'].textContent,/requiere una matriz cuadrada/);
 e['matrix-mode'].value='all';e['matrix-shape'].value='0,3';await e['matrix-shape'].emit('change');assert.match(e['matrix-progress'].textContent,/resultado final = 0/);assert.match(e['matrix-grid'].innerHTML,/Matriz vacía/);
});
test('Etapa 4: pila de llamadas, casos base y vector inválido conservan la simulación vigente',async()=>{
 const app=boot(),e=app.elements;
 assert.match(e['fib-stack'].innerHTML,/F\(4\)/);assert.equal(e['fib-prev'].disabled,true);
 await e['fib-next'].click();assert.match(e['fib-stack'].innerHTML,/espera un retorno/);
 e['recursion-kind'].value='factorial';e['fib-n'].value='0';await e['recursion-kind'].emit('change');await e['fib-next'].click();assert.match(e['fib-summary'].textContent,/Caso base: resultado directo 1/);
 await e['fib-next'].click();await e['fib-next'].click();assert.match(e['fib-stack'].innerHTML,/Pila vacía. Resultado final: 1/);
 e['sum-input'].value='a, b';await e['sum-apply'].click();assert.ok(e['sum-error'].textContent);assert.match(e['sum-stack'].innerHTML,/suma\(\[2, 3, 4\]\)/);
 e['sum-input'].value='';await e['sum-apply'].click();await e['sum-next'].click();assert.match(e['sum-summary'].textContent,/Caso base: resultado directo 0/);
 await e['fib-practice'].click();assert.match(app.run('selectedId'),/TP_4_.*-1$/);
});
test('Etapa 4: operaciones visuales conservan consultas y escapan textos ingresados',async()=>{
 const app=boot(),e=app.elements;
 await e['sequence-insert'].click();e['sequence-input'].value='20';await e['sequence-insert'].click();
 await e['sequence-peek'].click();assert.match(e['sequence-status'].textContent,/Consulta sin modificar: 20/);assert.match(e['sequence-status'].textContent,/\[10, 20\]/);
 await e['sequence-remove'].click();assert.match(e['sequence-status'].textContent,/\[10\]/);
 e['sequence-kind'].value='queue';await e['sequence-kind'].emit('change');await e['sequence-remove'].click();assert.match(e['sequence-status'].textContent,/vacía/);
 e['collection-key'].value='<script>';e['collection-value'].value='valor <b>';await e['collection-insert'].click();assert.ok(e['collection-values'].innerHTML.includes('&lt;script&gt;'));assert.ok(!e['collection-values'].innerHTML.includes('<script>'));
 e['collection-value'].value='nuevo';await e['collection-insert'].click();assert.match(e['collection-status'].textContent,/conserva/);
 await e['collection-assign'].click();assert.match(e['collection-values'].innerHTML,/nuevo/);
 e['collection-kind'].value='set';await e['collection-kind'].emit('change');assert.equal(e['collection-value-field'].hidden,true);assert.equal(e['collection-assign'].hidden,true);assert.match(e['collection-contract'].textContent,/no representa un orden garantizado/);
});
test('Etapa 4: navegación de examen sigue la selección, conserva respuestas y bloquea laboratorio',async()=>{
 const app=boot(undefined,'index.html',false,epoch),e=app.elements;
 const ids=JSON.parse(app.run('JSON.stringify(DATA.exercises.filter(ex=>ex.tests).slice(0,2).map(ex=>ex.id).reverse())'));
 app.run(`startExam(${JSON.stringify(ids)},30,"Navegación")`);
 assert.equal(app.run('selectedId'),ids[0]);assert.equal(e['previous-exercise'].disabled,true);
 e['code-editor'].value='# respuesta propia';await e['code-editor'].emit('input');await e['next-exercise'].click();assert.equal(app.run('selectedId'),ids[1]);assert.equal(e['next-exercise'].disabled,true);
 await e['previous-exercise'].click();assert.equal(e['code-editor'].value,'# respuesta propia');assert.equal(e['hint-button'].hidden,true);
 e['workshop-layout'].value='split';await e['workshop-layout'].emit('change');app.run('switchView("laboratorio")');assert.equal(app.run('currentView'),'practica');
 await e['matrix-practice'].click();assert.equal(app.run('selectedId'),ids[0]);assert.equal(e['hint-button'].hidden,true);
});
test('Etapa 4: ejemplos se cargan al consultar, registran ayuda y no se generan durante examen',async()=>{
 const app=boot(),e=app.elements;
 app.run('openExercise(fibId)');assert.equal(e['notebook-examples-content'].innerHTML,'');
 e['notebook-examples'].open=true;await e['notebook-examples'].emit('toggle');
 assert.match(e['notebook-examples-content'].innerHTML,/Celda/);assert.equal(app.run('entryFor(selectedId).help.solutionViewed'),true);
 const content=e['notebook-examples-content'].innerHTML;e['notebook-examples'].open=false;await e['notebook-examples'].emit('toggle');e['notebook-examples'].open=true;await e['notebook-examples'].emit('toggle');assert.equal(e['notebook-examples-content'].innerHTML,content);
 await e['start-mock'].click();assert.equal(e['notebook-examples-content'].innerHTML,'');assert.equal(e['import-backup'].disabled,true);
 e['notebook-examples'].open=true;await e['notebook-examples'].emit('toggle');assert.equal(e['notebook-examples-content'].innerHTML,'');assert.equal(app.run('entryFor(selectedId).help.solutionViewed'),false);
});

test('mapa alterna vistas y densidades y conserva preferencias al recargar',async()=>{
 const app=boot(),e=app.elements;
 assert.equal(e['map-canvas'].dataset.view,'grafo');
 assert.equal(e['map-canvas'].dataset.density,'media');
 const mediumWidth=parseInt(e['map-canvas'].style.width);
 await e['map-subte'].click();
 assert.equal(e['map-canvas'].dataset.view,'subte');
 assert.equal(e['map-subte'].getAttribute('aria-pressed'),'true');
 assert.equal(e['map-grafo'].getAttribute('aria-pressed'),'false');
 await e['map-compacta'].click();assert.ok(parseInt(e['map-canvas'].style.width)<mediumWidth);
 await e['map-aireada'].click();assert.ok(parseInt(e['map-canvas'].style.width)>mediumWidth);
 const reloaded=boot(app.storage.get(key));
 assert.equal(reloaded.elements['map-canvas'].dataset.view,'subte');
 assert.equal(reloaded.elements['map-canvas'].dataset.density,'aireada');
 await e['map-practice'].click();assert.equal(app.run('DATA.exercises.find(ex=>ex.id===selectedId).topic'),'matriz');
});

test('mapa cubre todos los temas y sus conexiones sin inventar ejercicios futuros',()=>{
 const app=boot();
 assert.equal(app.run('Object.keys(topics).every(id=>TrainingMap.nodes.some(node=>node.id===id))'),true);
 assert.equal(app.run('TrainingMap.edges.every(([a,b])=>TrainingMap.nodes.some(n=>n.id===a)&&TrainingMap.nodes.some(n=>n.id===b))'),true);
 assert.equal(app.run('TrainingMap.nodes.every(node=>node.future || TrainingMap.exercisesFor(node,DATA).length>0)'),true);
 assert.equal(app.run('TrainingMap.nodes.filter(n=>n.future).every(node=>TrainingMap.exercisesFor(node,DATA).length===0)'),true);
});
