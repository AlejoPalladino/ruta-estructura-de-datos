'use strict';
const DATA = window.TRAINING_DATA;
const KEY = 'unahur_training_route_v2';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const topics = {python:'Python',vector:'Vectores',matriz:'Matrices',recursividad:'Recursividad',tda:'TDA','pila-cola':'Pilas y colas',diccionario:'Diccionarios y conjuntos'};
const statuses = {pending:'Por empezar',practicing:'Practicando',review:'Repasar',mastered:'Dominado'};
let toastTimer, storageError = false;
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500); }
function validState(value) {
 if (!value || value.version !== 2 || typeof value.exercises !== 'object' || !value.exercises || Array.isArray(value.exercises)) throw Error('Formato de respaldo incompatible');
 const clean = {version:2, exercises:{}, log: typeof value.log === 'string' ? value.log : ''};
 for (const ex of DATA.exercises) {
  const entry = value.exercises[ex.id]; if (!entry || typeof entry !== 'object') continue;
  clean.exercises[ex.id] = {status: Object.hasOwn(statuses, entry.status) ? entry.status : 'pending'};
  for (const key of ['code','notes','stdin','updated']) if (typeof entry[key] === 'string') clean.exercises[ex.id][key] = entry[key];
 }
 if (DATA.exercises.some(e => e.id === value.selected)) clean.selected = value.selected;
 return clean;
}
let state = {version:2,exercises:{},log:''};
try {
 const raw = localStorage.getItem(KEY);
 if (raw) state = validState(JSON.parse(raw));
 else {
  const legacy = JSON.parse(localStorage.getItem('unahur_parcial_1_progress') || '[]');
  if (Array.isArray(legacy)) for (const id of legacy) if (DATA.exercises.some(e => e.id === 'legacy-'+id)) state.exercises['legacy-'+id] = {status:'mastered'};
 }
} catch { toast('No se pudo leer el guardado. Podés trabajar y exportar un respaldo.'); }
function saveState() {
 try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-status').textContent = 'Guardado en este navegador'; }
 catch { $('save-status').textContent = 'Sin guardado local · exportá respaldo'; if (!storageError) { storageError = true; toast('El navegador no permite guardar. Exportá un respaldo para conservar tu trabajo.'); } }
}
const entryFor = id => state.exercises[id] || (state.exercises[id] = {status:'pending'});
const getStatus = id => state.exercises[id]?.status || 'pending';
const findId = (prefix, num) => DATA.exercises.find(e => e.id.startsWith(prefix) && e.id.endsWith('-'+num))?.id;
const fibId = findId('TP_4_Recursividad',3), puertoId = findId('Practica_Parcial',2), intervaloId = findId('Practica_Parcial',1);
let selectedId = state.selected || findId('TP_2_Arreglos',12), currentView = 'ruta', running = false;
const route = [
 {title:'Índices sin adivinar',focus:true,desc:'Crear una matriz rectangular, recorrer filas y columnas, reconocer las esquinas y validar vecinos.',ids:[findId('TP_2_Arreglos',12),'refuerzo-vecinos','refuerzo-transpuesta'],gate:'Explicar shape y resolver una matriz 2×3.',time:'3 sesiones'},
 {title:'Diagonales y condiciones',focus:true,desc:'Suma superior, matriz diagonal y simetría. Aprender a buscar el primer contraejemplo.',ids:[findId('TP_2_Arreglos',13),findId('TP_2_Arreglos',14),findId('TP_2_Arreglos',15)],gate:'Distinguir i=j, j>i e i+j=n−1.',time:'3 sesiones'},
 {title:'Recursividad, paso a paso',focus:true,desc:'Factorial, triangular, suma y palíndromos. Escribir primero el caso base y seguir el retorno.',ids:[findId('TP_4_Recursividad',1),findId('TP_4_Recursividad',4),findId('TP_4_Recursividad',13),findId('TP_4_Recursividad',14)],gate:'Justificar qué disminuye en cada llamada.',time:'4 sesiones'},
 {title:'Fibonacci hasta entenderlo',focus:true,desc:'Dos casos base. Un término frente a una serie. Árbol de llamadas y versión con acumuladores.',ids:[fibId,'refuerzo-fib-lineal'],gate:'Trazar F(4) y generar 7 términos.',time:'3 sesiones'},
 {title:'Integración para el recuperatorio',desc:'Intervalo creciente, suma recursiva de matrices y TDA Puerto: contratos, regiones y transferencia.',ids:['refuerzo-suma-matriz',intervaloId,puertoId,'legacy-1','legacy-8'],gate:'Resolver un modelo sin ayuda y probar bordes.',time:'4 sesiones + simulacros'},
 {title:'Seguir con la materia',desc:'Pilas LIFO, colas FIFO, TDA en dos niveles, diccionarios y conjuntos. Consultar las clases de listas y árboles.',ids:[findId('TP_5_Pila_Cola',1),findId('TP_5_Pila_Cola',11),findId('TP5bis',1),findId('TP_6_Diccionario',1),findId('TP_6_Diccionario',6)],gate:'Conservar el orden y respetar las interfaces.',time:'2 sesiones por semana'}
];
function renderRoute() {
 $('route-cards').innerHTML = route.map((r,i) => {
  const completed = r.ids.filter(id => getStatus(id) === 'mastered').length;
  return `<article class="route-card ${r.focus?'focus':''}"><span class="step">${String(i+1).padStart(2,'0')}</span><h3>${r.title}</h3><p>${r.desc}</p><p><strong>Para avanzar:</strong> ${r.gate}</p><div class="route-footer"><button class="secondary" data-route="${i}">${completed === r.ids.length?'Repetir':'Entrenar'} →</button><small>${completed}/${r.ids.length} dominados · ${r.time}</small></div></article>`;
 }).join('');
 const mastered = DATA.exercises.filter(e => getStatus(e.id) === 'mastered').length;
 $('mastery-count').innerHTML = `${mastered} <small>/ ${DATA.exercises.length}</small>`;
 $('mastery-bar').style.width = (mastered / DATA.exercises.length * 100) + '%';
}
$('route-cards').addEventListener('click', event => { const btn = event.target.closest('[data-route]'); if (btn) openExercise(route[+btn.dataset.route].ids.find(id => getStatus(id)!=='mastered') || route[+btn.dataset.route].ids[0]); });
function switchView(view, writeHash = true) {
 if (!['ruta','practica','laboratorio','teoria','cronograma'].includes(view)) view = 'ruta';
 currentView = view;
 document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== 'view-'+view);
 document.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('active',b.dataset.view === view); b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'); });
 if (writeHash) history.replaceState(null,'','#'+view);
 window.scrollTo({top:0,behavior:'instant'});
}
document.querySelector('nav').addEventListener('click',event => { const btn=event.target.closest('[data-view]'); if(btn) switchView(btn.dataset.view); });
window.addEventListener('hashchange',()=>switchView(location.hash.slice(1),false));
function normalize(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function renderList() {
 const search=normalize($('exercise-search').value.trim()),topic=$('topic-filter').value,scope=$('scope-filter').value,status=$('status-filter').value;
 const filtered=DATA.exercises.filter(e => (!search || normalize([e.title,e.statement,e.source,...e.tags].join(' ')).includes(search)) && (topic==='all'||e.topic===topic) && (scope==='all'||scope===e.scope||(scope==='mock'&&[intervaloId,puertoId].includes(e.id))) && (status==='all'||getStatus(e.id)===status));
 $('exercise-count').textContent=DATA.exercises.length+' ejercicios · '+DATA.exercises.filter(e=>e.tests).length+' con pruebas';
 $('list-count').textContent=filtered.length+' consignas encontradas';
 $('exercise-list').innerHTML=filtered.length?filtered.map(e=>`<button class="exercise-item ${selectedId===e.id?'selected':''}" data-exercise="${esc(e.id)}" aria-pressed="${selectedId===e.id}"><small>${esc(topics[e.topic])} · ${statuses[getStatus(e.id)]}</small>${esc(e.title)}</button>`).join(''):'<p class="muted">No hay resultados con estos filtros. Tu ejercicio abierto se conserva.</p>';
}
$('exercise-list').addEventListener('click',event=>{const b=event.target.closest('[data-exercise]');if(b) selectExercise(b.dataset.exercise);});
for (const id of ['exercise-search','topic-filter','scope-filter','status-filter']) $(id).addEventListener(id==='exercise-search'?'input':'change',renderList);
function inlineMd(s) {
 return esc(s).replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">Imagen del enunciado: $1 ↗</a>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1 ↗</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
}
function markdown(s) {
 const lines=String(s).split('\n');let html='',list=false,inCode=false,code=[],table=false;
 for(const line of lines) {
  if(/^```/.test(line)){if(inCode){html+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';code=[];}inCode=!inCode;continue;}
  if(inCode){code.push(line);continue;}
  if(/^\s*[-*]\s+/.test(line)){if(!list){html+='<ul>';list=true;}html+='<li>'+inlineMd(line.replace(/^\s*[-*]\s+/,''))+'</li>';continue;}
  if(list){html+='</ul>';list=false;}
  if(/^\s*\|/.test(line)){if(!table){html+='<div class="table-wrap"><table>';table=true;}if(!/^\s*\|\s*:?[-]+/.test(line))html+='<tr>'+line.trim().replace(/^\||\|$/g,'').split('|').map(c=>'<td>'+inlineMd(c.trim())+'</td>').join('')+'</tr>';continue;}
  if(table){html+='</table></div>';table=false;}
  if(!line.trim())continue;
  if(/^#{1,5}\s*/.test(line))html+='<h3>'+inlineMd(line.replace(/^#{1,5}\s*/,''))+'</h3>';
  else html+='<p>'+inlineMd(line)+'</p>';
 }
 if(list)html+='</ul>';if(table)html+='</table></div>';if(code.length)html+='<pre>'+esc(code.join('\n'))+'</pre>';return html;
}
function selectExercise(id) {
 const ex=DATA.exercises.find(e=>e.id===id);if(!ex)return;
 if(running) stopRun('Ejecución detenida al cambiar de ejercicio.');
 selectedId=id;state.selected=id;const entry=entryFor(id);
 $('exercise-title').textContent=ex.title;$('exercise-origin').textContent=ex.origin;
 $('exercise-source').replaceChildren(document.createTextNode(ex.sourceLabel+' '));
 if(ex.source){const a=document.createElement('a');a.href=encodeURI(ex.source);a.textContent='Abrir fuente ↗';a.target='_blank';a.rel='noopener';$('exercise-source').appendChild(a);}
 $('exercise-statement').innerHTML=ex.markdown?markdown(ex.statement):ex.statement;
 if(id===fibId)$('exercise-statement').insertAdjacentHTML('beforeend','<div class="notice">Convención usada en esta ruta: F(0)=0 y F(1)=1. “Los primeros N números” usa los índices 0 a N−1. Entrená primero la función y después la impresión de la serie.</div>');
 $('exercise-status').value=entry.status;$('code-editor').value=entry.code??ex.starter;
 $('exercise-notes').value=entry.notes||'';$('stdin-input').value=entry.stdin||'';
 $('editor-filename').textContent=(ex.id.startsWith('legacy-')?'modelo_'+ex.legacyId:ex.id.replace(/[^\w-]/g,'_'))+'.py';
 $('help-panel').hidden=true;$('help-panel').replaceChildren();
 $('solution-button').disabled=!ex.solution;$('solution-button').textContent=ex.solution?'Ver solución explicada':'Solución no incluida';
 $('test-code').disabled=!ex.tests;$('test-code').title=ex.tests?'Casos de entrenamiento; no reemplazan la revisión de la consigna.':'Agregá tus propias pruebas y usá Ejecutar.';
 $('notebook-button').hidden=!ex.notebookCode;
 $('load-helpers').hidden=!ex.source.startsWith('TP_6_')&&!ex.source.startsWith('TP5bis_');
 $('console-output').classList.remove('error');$('console-output').textContent=ex.tests?'Usá Ejecutar para tus pruebas o Probar casos para las de entrenamiento.':'Este ejercicio no tiene pruebas automáticas incluidas. Agregá tus casos con print o assert.';
 updateHelpVisibility();updateEditor();renderList();saveState();
}
function openExercise(id) { $('exercise-search').value='';$('topic-filter').value='all';$('scope-filter').value='all';$('status-filter').value='all';selectExercise(id);switchView('practica'); }
$('continue-route').addEventListener('click',()=>openExercise(route.flatMap(r=>r.ids).find(id=>getStatus(id)!=='mastered')||route[0].ids[0]));
$('exercise-status').addEventListener('change',()=>{entryFor(selectedId).status=$('exercise-status').value;saveState();renderRoute();renderList();});
function showHelp(kind) {
 const ex=DATA.exercises.find(e=>e.id===selectedId);const panel=$('help-panel');
 if(kind==='hint')panel.innerHTML='<h3>Pista para arrancar</h3><p>'+esc(ex.hint)+'</p>';
 if(kind==='solution')panel.innerHTML='<h3>Razonamiento y solución de referencia</h3>'+(ex.steps?(ex.markdown?markdown(ex.steps):ex.steps):'')+(ex.reason?(ex.markdown?markdown(ex.reason):ex.reason):'')+'<pre><code>'+esc(ex.solution)+'</code></pre><p>Compará con tu intento. Reescribí la solución de memoria antes de marcar el ejercicio como dominado.</p>';
 if(kind==='notebook')panel.innerHTML='<h3>Código del notebook original</h3><p>Es una transcripción del archivo de cátedra. Puede contener borradores o errores; revisalo antes de usarlo como referencia.</p><pre>'+esc(ex.notebookCode)+'</pre>';
 panel.hidden=false;
}
$('hint-button').addEventListener('click',()=>showHelp('hint'));$('solution-button').addEventListener('click',()=>showHelp('solution'));$('notebook-button').addEventListener('click',()=>showHelp('notebook'));
function highlight(code) {
 const re=/(#[^\n]*|'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|\b(?:def|class|if|elif|else|return|for|while|in|and|or|not|is|None|True|False|import|from|as|raise|try|except|finally|with|pass|break|continue|lambda|yield)\b|\b\d+(?:\.\d+)?\b)/g;
 let result='',last=0;for(const m of code.matchAll(re)){result+=esc(code.slice(last,m.index));const t=m[0],cls=t[0]==='#'?'comment':/^["']/.test(t)?'str':/^\d/.test(t)?'number':'kw';result+='<span class="'+cls+'">'+esc(t)+'</span>';last=m.index+t.length;}return result+esc(code.slice(last))+'\n';
}
function updateEditor(){const ed=$('code-editor');$('code-highlight').innerHTML='<code>'+highlight(ed.value)+'</code>';$('line-numbers').textContent=Array.from({length:ed.value.split('\n').length},(_,i)=>i+1).join('\n');syncScroll();updateCursor();}
function syncScroll(){$('code-highlight').scrollTop=$('code-editor').scrollTop;$('code-highlight').scrollLeft=$('code-editor').scrollLeft;$('line-numbers').scrollTop=$('code-editor').scrollTop;}
function updateCursor(){const ed=$('code-editor'),before=ed.value.slice(0,ed.selectionStart).split('\n');$('cursor-position').textContent='Ln '+before.length+', Col '+(before.at(-1).length+1);}
function saveDraft(markPracticing=false){const entry=entryFor(selectedId);entry.code=$('code-editor').value;entry.updated=new Date().toISOString();if(markPracticing&&entry.status==='pending'){entry.status='practicing';$('exercise-status').value='practicing';renderList();}saveState();}
$('code-editor').addEventListener('input',()=>{updateEditor();saveDraft(true);});$('code-editor').addEventListener('scroll',syncScroll);for(const event of ['click','keyup','select'])$('code-editor').addEventListener(event,updateCursor);
let tabEscape=false;
$('code-editor').addEventListener('keydown',event=>{
 const ed=event.target,start=ed.selectionStart,end=ed.selectionEnd;
 if(event.key==='Escape'){tabEscape=true;$('save-status').textContent='Tab mueve el foco fuera del editor';return;}
 if(event.key==='Tab'&&!tabEscape){event.preventDefault();const first=ed.value.lastIndexOf('\n',start-1)+1;
  if(start===end&&!event.shiftKey){ed.setRangeText('    ',start,end,'end');}
  else{const lastBreak=ed.value.indexOf('\n',end),last=lastBreak===-1?ed.value.length:lastBreak;const region=ed.value.slice(first,last);const replacement=region.split('\n').map(l=>event.shiftKey?l.replace(/^ {1,4}/,''):'    '+l).join('\n');ed.setRangeText(replacement,first,last,'select');}
  updateEditor();saveDraft();
 }else if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){event.preventDefault();const line=ed.value.slice(ed.value.lastIndexOf('\n',start-1)+1,start);const indent=(line.match(/^\s*/)?.[0]||'')+(line.trimEnd().endsWith(':')?'    ':'');ed.setRangeText('\n'+indent,start,end,'end');updateEditor();saveDraft();}
 else if(event.key!=='Shift')tabEscape=false;
});
$('code-editor').addEventListener('blur',()=>tabEscape=false);
document.addEventListener('keydown',e=>{if(currentView==='practica'&&(e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runCode(false);}});
$('exercise-notes').addEventListener('input',()=>{entryFor(selectedId).notes=$('exercise-notes').value;saveState();});$('stdin-input').addEventListener('input',()=>{entryFor(selectedId).stdin=$('stdin-input').value;saveState();});
$('learning-log').value=state.log;$('learning-log').addEventListener('input',()=>{state.log=$('learning-log').value;saveState();$('log-save').textContent=storageError?'Exportá un respaldo para conservar el registro':'Guardado automático';});
function download(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-code').addEventListener('click',()=>download($('editor-filename').textContent,$('code-editor').value,'text/x-python;charset=utf-8'));
$('export-progress').addEventListener('click',()=>{saveDraft();download('mi-ruta-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2),'application/json');toast('Respaldo descargado: código, notas y estados.');});
$('import-progress').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>10_000_000)throw Error('El archivo excede 10 MB');const imported=validState(JSON.parse(await file.text()));state={...state,log:imported.log,exercises:{...state.exercises,...imported.exercises}};saveState();$('learning-log').value=state.log;selectExercise(imported.selected||selectedId);renderRoute();toast('Respaldo importado. Se conservaron los ejercicios no incluidos.');}catch(error){toast('No se importó: '+error.message);}finally{event.target.value='';}});
$('reset-code').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());$('confirm-reset').addEventListener('click',()=>{if(running)stopRun('Ejecución detenida.');$('code-editor').value=DATA.exercises.find(e=>e.id===selectedId).starter;updateEditor();saveDraft();$('reset-dialog').close();});
// The module worker is created from a Blob so opening the HTML via file:// works.
function pythonWorkerMain() {
 let pyPromise;
 self.onmessage=async ({data})=>{
  let ns, result;
  try{
   self.postMessage({type:'phase',phase:'loading',text:'Descargando Python…'});
   if(!pyPromise)pyPromise=import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs').then(({loadPyodide})=>loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'}));
   const py=await pyPromise;
   self.postMessage({type:'phase',phase:'loading',text:'Cargando paquetes del ejercicio…'});
   await py.loadPackagesFromImports(data.code+'\n'+data.tests);
   let outputSize=0, truncated=false;
   const output=text=>{const remaining=100_000-outputSize;if(remaining<=0){if(!truncated){self.postMessage({type:'output',text:'\n[Salida limitada a 100 KB]\n'});truncated=true;}return;}text=String(text).slice(0,remaining);outputSize+=text.length;self.postMessage({type:'output',text:text+'\n'});};
   py.setStdout({batched:output});py.setStderr({batched:output});
   ns=py.toPy({__name__:data.tests?'training_tests':'__main__',_training_input_lines:data.stdin ? data.stdin.split('\n') : []});
   result=await py.runPythonAsync(`_training_inputs = iter(_training_input_lines)
def input(prompt=''):
    print(prompt, end='')
    try:
        answer = next(_training_inputs)
    except StopIteration:
        raise EOFError('Faltan respuestas: completá Entradas para input(), una por línea')
    print(answer)
    return answer
`,{globals:ns});result?.destroy?.();
   self.postMessage({type:'phase',phase:'running',text:'Ejecutando Python…'});
   result=await py.runPythonAsync(data.code,{globals:ns,filename:data.filename});result?.destroy?.();
   if(data.tests){result=await py.runPythonAsync(data.tests,{globals:ns,filename:'casos_entrenamiento.py'});result?.destroy?.();output('✓ Pasaron todos los casos de entrenamiento. Revisá también las restricciones y explicá tu solución.');}
   self.postMessage({type:'done'});
  }catch(error){self.postMessage({type:'error',text:error.message||String(error)});}
  finally{ns?.destroy?.();}
 };
}
let worker=null,workerUrl=null,runTimer;
function destroyWorker(){if(worker)worker.terminate();worker=null;if(workerUrl)URL.revokeObjectURL(workerUrl);workerUrl=null;}
function setBusy(busy){running=busy;$('run-code').disabled=busy;$('test-code').disabled=busy||!DATA.exercises.find(e=>e.id===selectedId).tests;$('stop-code').disabled=!busy;}
function stopRun(message){clearTimeout(runTimer);destroyWorker();setBusy(false);$('runtime-status').textContent='Motor detenido; se recarga al ejecutar';if(message)$('console-output').textContent+='\n'+message;}
function startTimeout(ms){clearTimeout(runTimer);runTimer=setTimeout(()=>stopRun('Tiempo agotado. Revisá los bucles o el caso base; podés volver a ejecutar.'),ms);}
function runCode(withTests){if(running)return;saveDraft(true);const ex=DATA.exercises.find(e=>e.id===selectedId);if(withTests&&!ex.tests)return;
 $('console-output').textContent='';$('console-output').classList.remove('error');setBusy(true);$('runtime-status').textContent='Preparando Python…';startTimeout(120000);
 try{
  if(!worker){workerUrl=URL.createObjectURL(new Blob(['('+pythonWorkerMain.toString()+')();'],{type:'text/javascript'}));worker=new Worker(workerUrl,{type:'module'});}
  worker.onmessage=({data})=>{
   if(data.type==='phase'){$('runtime-status').textContent=data.text;if(data.phase==='running')startTimeout(12000);}
   if(data.type==='output'){$('console-output').textContent+=data.text;$('console-output').scrollTop=$('console-output').scrollHeight;}
   if(data.type==='done'){clearTimeout(runTimer);setBusy(false);$('runtime-status').textContent='Python disponible';if(!$('console-output').textContent)$('console-output').textContent='Programa terminado sin salida. Usá print(...) para mostrar resultados.';}
   if(data.type==='error'){clearTimeout(runTimer);setBusy(false);$('console-output').classList.add('error');$('console-output').textContent+='\n'+data.text;$('runtime-status').textContent='Error: revisá la consola';if(/fetch|import|network|load|download/i.test(data.text)){$('console-output').textContent+='\nNo se pudo cargar el motor o un paquete. Comprobá tu conexión. Podés descargar el código y ejecutarlo en Python local.';destroyWorker();}}
  };
  worker.onerror=event=>{event.preventDefault();stopRun('No se pudo cargar Python. Comprobá tu conexión o descargá el .py para ejecutarlo localmente.');$('console-output').classList.add('error');};
  worker.postMessage({code:$('code-editor').value,tests:withTests?ex.tests:'',stdin:$('stdin-input').value,filename:$('editor-filename').textContent});
 }catch(error){stopRun('No se pudo iniciar Python: '+error.message);}
}
$('load-helpers').addEventListener('click',()=>{
 const ex=DATA.exercises.find(e=>e.id===selectedId);let helpers=[];
 if(ex.source.startsWith('TP_6_')){
  const book=DATA.books.find(b=>b.file===ex.source);const code=book?.examples.find(c=>c.code.includes('class Diccionario:'))?.code;
  if(code&&!$('code-editor').value.includes('class Diccionario:'))helpers.push(code);
 }else{
  for(const num of [1,11]){const id=findId('TP_5_Pila_Cola',num);const saved=state.exercises[id]?.code;
   if(saved&&!$('code-editor').value.includes(num===1?'class Pila:':'class Cola:'))helpers.push(saved);
  }
 }
 if(!helpers.length){toast(ex.source.startsWith('TP_6_')?'El TDA Diccionario ya está en tu código.':'Primero implementá y guardá Pila (TP5 · 1) y Cola (TP5 · 11).');return;}
 $('code-editor').value=helpers.join('\n\n')+'\n\n# --- Tu ejercicio ---\n'+$('code-editor').value;updateEditor();saveDraft();toast('TDA auxiliares incorporados encima de tu código.');
});
$('run-code').addEventListener('click',()=>runCode(false));$('test-code').addEventListener('click',()=>runCode(true));$('stop-code').addEventListener('click',()=>stopRun('Ejecución detenida. Tu código se conserva.'));$('clear-console').addEventListener('click',()=>$('console-output').textContent='');
// A bounded visual trace makes both the pending calls and their return values visible.
let matrixCell=[0,0],fibSteps=[],fibStep=0,sumStep=0;
function renderMatrix(){const [rows,cols]=$('matrix-shape').value.split(',').map(Number),mode=$('matrix-mode').value;const square=rows===cols;if(matrixCell[0]>=rows||matrixCell[1]>=cols)matrixCell=[0,0];$('matrix-grid').style.gridTemplateColumns=`repeat(${cols},1fr)`;
 $('matrix-grid').innerHTML=Array.from({length:rows*cols},(_,k)=>{const i=Math.floor(k/cols),j=k%cols;const lit=mode==='all'||mode==='principal'&&i===j||mode==='secondary'&&square&&i+j===rows-1||mode==='upper'&&square&&j>i||mode==='neighbors'&&Math.abs(i-matrixCell[0])+Math.abs(j-matrixCell[1])===1;return `<button data-cell="${i},${j}" class="matrix-cell ${lit?'lit':''} ${i===matrixCell[0]&&j===matrixCell[1]?'selected':''}" aria-label="Fila ${i}, columna ${j}, valor ${i+j}" aria-pressed="${i===matrixCell[0]&&j===matrixCell[1]}">(${i}, ${j})<br>${i+j}</button>`;}).join('');
 const info={all:`shape = (${rows}, ${cols}). ${rows*cols} celdas; cada valor es i+j.`,principal:'Principal: i == j. En una rectangular también existe ese recorrido, hasta min(filas, columnas).',secondary:square?`Secundaria: i+j == ${rows-1}; j = n−1−i.`:'La fórmula de diagonal secundaria de este ejercicio requiere una matriz cuadrada. Elegí 3×3 o 1×1.',upper:square?'Superior: j > i. No incluye la diagonal principal.':'El TP pide una matriz cuadrada para el triángulo superior. Elegí 3×3 o 1×1.',neighbors:`Celda (${matrixCell.join(', ')}). Vecinos válidos: Manhattan = 1 y 0 ≤ i < ${rows}, 0 ≤ j < ${cols}. En una esquina hay menos vecinos.`};
 $('matrix-explanation').textContent=info[mode];
 $('matrix-code').textContent=mode==='neighbors'?'for di, dj in [(-1,0), (1,0), (0,-1), (0,1)]:\n    ni, nj = i + di, j + dj\n    if 0 <= ni < filas and 0 <= nj < columnas:\n        print(m[ni, nj])':`filas, columnas = m.shape\nfor i in range(filas):\n    for j in range(columnas):\n        ${mode==='all'?'print(i, j, m[i, j])':'if '+(mode==='principal'?'i == j':mode==='secondary'?'i + j == filas - 1':'j > i')+':\n            print(m[i, j])'}`;
 if(!square&&['secondary','upper'].includes(mode))$('matrix-code').textContent='# Para este patrón, primero verificá:\nif filas != columnas:\n    raise ValueError("se requiere matriz cuadrada")';
}
$('matrix-grid').addEventListener('click',event=>{const b=event.target.closest('[data-cell]');if(b){matrixCell=b.dataset.cell.split(',').map(Number);renderMatrix();}});$('matrix-shape').addEventListener('change',renderMatrix);$('matrix-mode').addEventListener('change',renderMatrix);$('matrix-practice').addEventListener('click',()=>{openExercise(findId('TP_2_Arreglos',12));$('topic-filter').value='matriz';renderList();});
function buildFib(){const n=+$('fib-n').value;fibSteps=[];fibStep=0;const counts={};function visit(k,depth){counts[k]=(counts[k]||0)+1;fibSteps.push({type:'enter',depth,text:`entra F(${k})${k>1?' → espera F('+(k-1)+') + F('+(k-2)+')':''}`});const value=k<2?k:visit(k-1,depth+1)+visit(k-2,depth+1);fibSteps.push({type:'return',depth,text:`retorna F(${k}) = ${value}`});return value;}const answer=visit(n,0);const values=[0,1];for(let i=2;i<=Math.max(7,n);i++)values.push(values[i-1]+values[i-2]);$('fib-values').innerHTML=values.slice(0,8).map((v,i)=>`<span class="${i===n?'selected':''}">F(${i})=${v}</span>`).join('');$('fib-n-label').textContent=n;$('fib-summary').textContent=`F(${n}) = ${answer}. ${fibSteps.length/2} llamadas; ${Object.values(counts).reduce((a,c)=>a+Math.max(0,c-1),0)} repiten un índice ya visitado. Seguí primero la bajada y después los retornos.`;renderFib();}
function renderFib(){$('fib-trace').innerHTML=fibSteps.slice(0,fibStep+1).map((s,i)=>`<div class="${s.type} ${i===fibStep?'current':''}" style="padding-left:${s.depth*13}px">${s.type==='enter'?'↘':'↗'} ${esc(s.text)}</div>`).join('');$('fib-next').disabled=fibStep>=fibSteps.length-1;$('fib-prev').disabled=fibStep===0;$('fib-trace').scrollTop=$('fib-trace').scrollHeight;}
$('fib-n').addEventListener('input',buildFib);$('fib-next').addEventListener('click',()=>{fibStep=Math.min(fibStep+1,fibSteps.length-1);renderFib();});$('fib-prev').addEventListener('click',()=>{fibStep=Math.max(fibStep-1,0);renderFib();});$('fib-reset').addEventListener('click',()=>{fibStep=0;renderFib();});$('fib-practice').addEventListener('click',()=>openExercise(fibId));
const sumSteps=['↘ suma([2,3,4]) espera 2 + suma([3,4])','  ↘ suma([3,4]) espera 3 + suma([4])','    ↘ suma([4]) espera 4 + suma([])','      ↘ suma([]): caso base','      ↗ suma([]) retorna 0','    ↗ suma([4]) retorna 4 + 0 = 4','  ↗ suma([3,4]) retorna 3 + 4 = 7','↗ suma([2,3,4]) retorna 2 + 7 = 9'];
function renderSum(){$('sum-trace').innerHTML=sumSteps.slice(0,sumStep+1).map((s,i)=>'<div class="'+(s.includes('↗')?'return':'enter')+(i===sumStep?' current':'')+'">'+esc(s).replace(/ /g,'&nbsp;')+'</div>').join('');$('sum-next').disabled=sumStep===sumSteps.length-1;}
$('sum-next').addEventListener('click',()=>{sumStep=Math.min(sumStep+1,sumSteps.length-1);renderSum();});$('sum-reset').addEventListener('click',()=>{sumStep=0;renderSum();});
// Learning summaries distinguish native Python containers from the TP interfaces.
const newTheory=[
 ['Matrices: un mapa de coordenadas','Antes de programar anotá filas, columnas y el significado de cada celda. En NumPy se accede con m[i,j]; en listas anidadas, m[i][j]. El TP2 usa arreglos de tamaño fijo y prohíbe concatenate y operaciones similares.','filas, columnas = m.shape\n# fila: 0 <= i < filas\n# columna: 0 <= j < columnas\n# principal: i == j\n# secundaria cuadrada: i + j == n - 1\n# superior: j > i','Arreglos_Clase_5.pdf','TP_2_Arreglos_Com_5.ipynb'],
 ['Recursividad: contrato y retorno','Declarar un caso base no alcanza: cada llamada debe reducir el problema y el resultado debe volver con return. La suma vacía es 0, el producto vacío 1 y “todos cumplen” sobre un vacío suele ser True. Elegí el caso base según el contrato.','def resolver(v):\n    if len(v) == 0:\n        return 0\n    aporte = v[0]\n    return aporte + resolver(v[1:])','Recursividad.pdf','TP_4_Recursividad_Com_5.ipynb'],
 ['Fibonacci: término, serie y costo','Usamos F(0)=0 y F(1)=1. F(6) vale 8; los primeros 6 términos son 0,1,1,2,3,5. La versión recursiva ingenua abre dos ramas y repite subproblemas. Entendé primero el árbol con n pequeño; después compará con acumuladores o memoización.','def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n# PRE: n entero no negativo','Recursion ED 2021.pdf','TP_4_Recursividad_Com_5.ipynb'],
 ['Pilas y colas: quién sale primero','Pila: el último que entra sale primero (LIFO); push, pop y top. Cola: el primero que entra sale primero (FIFO); enqueue, dequeue y front. Una consulta conserva contenido y orden. Desde el cliente usá las operaciones de la interfaz, como pide el TP5. Una clonación puede permitir recorrer sin destruir la original.','pila.push(10)\npila.push(20)\n# pila.pop() -> 20\ncola.enqueue(10)\ncola.enqueue(20)\n# cola.dequeue() -> 10\n# Requiere implementar o cargar Pila y Cola.','PIlas_y_Colas.pdf','TP_5_Pila_Cola_Com_5.ipynb'],
 ['TDA en dos niveles con pilas y colas','Elegí la estructura a partir de la regla de acceso: ventas desde la primera → cola; préstamos desde el último → pila; trabajos de impresión pendientes → cola. Modelá primero Venta, Libro, Paquete o Trabajo y después el contenedor. Conservá los datos cuando una consulta no deba modificar el historial.','1. Escribí el contrato de cada operación.\n2. Elegí Pila o Cola según el acceso.\n3. Usá auxiliares para conservar el orden.\n4. Probá vacío, un dato y varios datos.','Pilas y Colas.docx','TP5bis_Pila_Cola_TDA_Com_5.ipynb'],
 ['Diccionarios y conjuntos','El TDA Diccionario del TP6 tiene claves únicas. insert(k,v) conserva el valor si la clave ya existe; d[k]=v permite reemplazar. get(k) lanza una excepción si falta la clave. Usá keys(), values(), clone() y las operaciones que implementa el notebook. El código del TDA está en los ejemplos de la biblioteca.','d = Diccionario()\nd.insert("a", 1)\nd.insert("a", 2)  # conserva 1\nd["a"] = 3        # reemplaza\nfor clave in d.keys():\n    print(clave, d[clave])','Diccionarios_Comision-2.pdf','TP_6_Diccionario_Conjunto.ipynb'],
 ['Conjuntos y matriz dispersa','set() crea un conjunto vacío; {} crea un dict nativo vacío. Un conjunto elimina duplicados y permite unión, intersección y diferencia. Para una matriz dispersa guardá solo las celdas no nulas usando (fila,columna) como clave; la ausencia representa 0. No confundas este ejemplo de dict nativo con el TDA del TP.','a, b = {1,2,3}, {2,4}\nprint(a | b)  # unión\nprint(a & b)  # intersección\nprint(a - b)  # diferencia\npixels = {(0,1): 120}\nprint(pixels.get((1,1), 0))','Diccionario.pdf','TP_6_Diccionario_Conjunto.ipynb'],
 ['Práctica de parcial: integrar las reglas','Intervalo creciente exige recursividad: contá una racha de elementos, no de comparaciones. En Puerto, barcos >500 van en las primeras N//2 dársenas y los demás en las restantes. Al transferir, agregá en el destino y eliminá del origen. Probá la región llena aun cuando la otra mitad tenga huecos.','# N = 4\n# grandes: filas 0 y 1\n# pequeños (incluido 500): filas 2 y 3\n# None significa un lugar libre.','Practica_Parcial_1.ipynb','Practica_Parcial_1.ipynb']
];
$('new-theory').innerHTML=newTheory.map(([title,body,code,source,practice])=>`<article class="panel prose"><span class="eyebrow accent">CONCEPTO + APLICACIÓN</span><h2>${title}</h2><p>${body}</p><pre><code>${esc(code)}</code></pre><small>Fuentes: <a href="${encodeURI(source)}" target="_blank" rel="noopener">${esc(source)}</a> · <a href="${encodeURI(practice)}" target="_blank" rel="noopener">${esc(practice)}</a></small></article>`).join('');
$('original-theory').innerHTML=DATA.theory.map(t=>`<details><summary>${esc(t.title)}</summary><div class="prose">${t.html}</div></details>`).join('');
$('materials').innerHTML=DATA.materials.map((m,i)=>`<details data-material="${i}"><summary><span class="chip">${m.type}</span>${esc(m.file)}</summary><div class="material-actions"><a href="${encodeURI(m.file)}" target="_blank" rel="noopener">Abrir original ↗</a><a href="${encodeURI(m.file)}" download>↓ Descargar</a>${m.type==='IPYNB'?`<button class="text-button" data-book-practice="${esc(m.file)}">Practicar sus ejercicios →</button>`:''}</div><div class="material-content"></div></details>`).join('');
for(const details of $('materials').querySelectorAll('details'))details.addEventListener('toggle',()=>{if(!details.open||details.dataset.loaded)return;details.dataset.loaded='true';const m=DATA.materials[+details.dataset.material],target=details.querySelector('.material-content');if(m.text){const pre=document.createElement('pre');pre.textContent=m.text;target.appendChild(pre);}else{const book=DATA.books.find(b=>b.file===m.file);if(book){target.innerHTML='<h3>Contexto del práctico</h3><div class="prose">'+markdown(book.notes)+'</div><h3>Ejemplos y código del notebook</h3><p class="muted">Incluye borradores de trabajo. No todos los fragmentos son soluciones completas.</p>'+book.examples.map(c=>'<details><summary>Celda '+c.cell+'</summary><pre>'+esc(c.code)+'</pre></details>').join('');}}});
$('materials').addEventListener('click',event=>{const b=event.target.closest('[data-book-practice]');if(b){const ex=DATA.exercises.find(e=>e.source===b.dataset.bookPractice);if(ex)openExercise(ex.id);}});
const weeklyPlan=[['05–11 oct','Índices, recorridos y diagonales','Tres sesiones de matrices + dos de diccionarios. Repetí los errores a las 48 h.'],['12–18 oct','Caso base, reducción y retorno','Factorial, suma y palíndromo. Continuidad: TDA con pilas y colas (clase del 16/10).'],['19–25 oct','Fibonacci y sus dos ramas','Término, primeros N y acumuladores. Continuidad: listas (19 y 23/10).'],['26 oct–01 nov','Recursividad aplicada','Intervalo creciente + suma recursiva de matriz. Continuidad: listas recursivas (26 y 30/10).'],['02–08 nov','TDA Puerto y simulacros','Ubicación por regiones y transferencia. Dos intentos sin ayuda. Continuidad: árboles.'],['09–15 nov','Cerrar los puntos débiles','Repaso de segundo parcial y un simulacro de recuperatorio. Repetí lo que aún necesita pistas.'],['16–20 nov','Segundo parcial y recuperación','Segundo parcial el lunes 16. Martes y miércoles: dos prácticas cortas de recuperación; jueves: trazas y bordes. Viernes 20: recuperatorio.']];
$('weekly-plan').innerHTML=weeklyPlan.map(([dates,title,body])=>`<article class="week"><strong>${dates}</strong><div><strong>${title}</strong><p>${body}</p></div></article>`).join('');
const schedule=[
[1,'10/08','Python: tipos primitivos, operadores, comunicación y control.'],[1,'14/08','Python: funciones y paso de parámetros.'],[2,'17/08','Feriado: Paso a la Inmortalidad del Gral. José de San Martín.','holiday'],[2,'21/08','Python: tipos, operadores, control, funciones y parámetros.'],[3,'24/08','Arreglos uni y multidimensionales: operaciones, memoria y recorridos.'],[3,'28/08','Arreglos uni y multidimensionales: operaciones, memoria y recorridos.'],[4,'31/08','TDA: requerimientos, diseño, dos niveles, arreglos y matrices.'],[4,'04/09','TDA: requerimientos, diseño, dos niveles, arreglos y matrices.'],[5,'07/09','Introducción a recursividad e implementaciones.'],[5,'11/09','Introducción a recursividad e implementaciones.'],[6,'14/09','Recursividad con arreglos y matrices.'],[6,'18/09','Repaso del primer parcial.'],[7,'21/09','Primer parcial.','exam'],[7,'25/09','Corrección del primer parcial.'],[8,'28/09','Pilas y colas dinámicas: definición, operaciones e implementación con listas.'],[8,'02/10','Pilas y colas dinámicas: definición, operaciones e implementación con listas.'],[9,'05/10','Diccionarios y conjuntos: definición, operaciones e implementación.'],[9,'09/10','Diccionarios y conjuntos: definición, operaciones e implementación.'],[10,'12/10','Feriado: Día del Respeto a la Diversidad Cultural.','holiday'],[10,'16/10','TDA en dos niveles con pilas y colas.'],[11,'19/10','Estructuras dinámicas: listas, terminología y operaciones básicas.'],[11,'23/10','Estructuras dinámicas: listas, terminología y operaciones básicas.'],[12,'26/10','Listas: concepto e implementación recursiva.'],[12,'30/10','Listas: concepto e implementación recursiva.'],[13,'02/11','Árboles: terminología, binarios y de búsqueda, operaciones básicas.'],[13,'06/11','Árboles: terminología, binarios y de búsqueda, operaciones básicas.'],[14,'09/11','Árboles binarios de búsqueda: borrado.'],[14,'13/11','Repaso y práctica general para segundo parcial.'],[15,'16/11','Segundo parcial.','exam'],[15,'20/11','Recuperatorio del primer parcial.','exam'],[16,'23/11','Feriado: Día de la Soberanía Nacional (20/11).','holiday'],[16,'27/11','Recuperatorio del segundo parcial.','exam'],[17,'30/11 al 04/12','Semana libre.'],[18,'07/12 al 11/12','Semana de evaluación integradora / final.','exam']];
$('schedule-body').innerHTML=schedule.map(([week,date,topic,kind])=>`<tr class="${kind||''}"><td>${week}</td><td>${date}/2026</td><td>${topic}</td></tr>`).join('');
const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=key=>todayParts.find(x=>x.type===key).value;const days=Math.round((Date.UTC(2026,10,20)-Date.UTC(+part('year'),+part('month')-1,+part('day')))/86400000);$('countdown').textContent=days>0?days+' días para entrenar · calendario oficial':days===0?'Hoy es el recuperatorio':'Fecha del cronograma 2026';
let mockDeadline=0;
function updateHelpVisibility(){const mock=mockDeadline>Date.now();for(const id of ['hint-button','solution-button'])$(id).hidden=mock;const ex=DATA.exercises.find(e=>e.id===selectedId);$('notebook-button').hidden=mock||!ex.notebookCode;$('mock-control').hidden=!mock;}
$('start-mock').addEventListener('click',()=>{mockDeadline=Date.now()+90*60000;try{sessionStorage.setItem('unahur_mock_deadline',String(mockDeadline));}catch{}openExercise(intervaloId);$('scope-filter').value='mock';renderList();updateHelpVisibility();toast('Simulacro iniciado: 90 minutos, pistas y soluciones ocultas.');});
function finishMock(){mockDeadline=0;try{sessionStorage.removeItem('unahur_mock_deadline');}catch{}updateHelpVisibility();toast('Simulacro terminado. Registrá tus errores y planificá el siguiente intento.');}
$('stop-mock').addEventListener('click',finishMock);
try{mockDeadline=Number(sessionStorage.getItem('unahur_mock_deadline'))||0;}catch{}
setInterval(()=>{if(!mockDeadline)return;const remaining=mockDeadline-Date.now();if(remaining<=0){finishMock();return;}$('mock-time').textContent=String(Math.floor(remaining/60000)).padStart(2,'0')+':'+String(Math.floor((remaining%60000)/1000)).padStart(2,'0');},1000);
renderRoute();renderMatrix();buildFib();renderSum();selectExercise(selectedId);switchView(location.hash.slice(1)||'ruta',false);
