'use strict';
const DATA = window.TRAINING_DATA;
const PEDAGOGY = window.TrainingPedagogy;
const LEARNING = window.TrainingLearning;
const EXAMS = window.TrainingExams;
const WORKSHOP = window.TrainingWorkshop;
const KEY = 'unahur_training_route_v2';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const topics = LEARNING.TOPICS;
const statuses = {pending:'Por empezar',practicing:'Practicando',review:'Repasar',mastered:'Dominado (declarado)'};
let toastTimer, storageError = false, corruptStorage = false, recoveryRaw = '';
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500); }
function validState(value) {
 return PEDAGOGY.validateState(value, DATA.exercises);
}
let state = {version:PEDAGOGY.VERSION,exercises:{},log:'',exams:EXAMS.empty(),preferences:WORKSHOP.cleanPreferences()};
try {
 const raw = localStorage.getItem(KEY);
 if (raw) {
  recoveryRaw=raw;
  const parsed=JSON.parse(raw);state=validState(parsed);
  if(parsed.version===2 && !localStorage.getItem(KEY+'_before_v3'))localStorage.setItem(KEY+'_before_v3',raw);
  if(parsed.version<4 && !localStorage.getItem(KEY+'_before_v4'))localStorage.setItem(KEY+'_before_v4',raw);
  if(parsed.version<5 && !localStorage.getItem(KEY+'_before_v5'))localStorage.setItem(KEY+'_before_v5',raw);
 }
 else {
  const legacy = JSON.parse(localStorage.getItem('unahur_parcial_1_progress') || '[]');
  if (Array.isArray(legacy)) for (const id of legacy) if (DATA.exercises.some(e => e.id === 'legacy-'+id)) state.exercises['legacy-'+id] = {status:'mastered'};
 }
} catch { corruptStorage=Boolean(recoveryRaw);$('recover-progress').hidden=!corruptStorage;toast('No se pudo leer o respaldar el guardado anterior. Se conserva; exportá tu trabajo para no perderlo.'); }
function saveState() {
 if(state.exams?.active)state.exams.active=EXAMS.checkpoint(state.exams.active);
 if(corruptStorage){$('save-status').textContent='Guardado anterior protegido · exportá tu trabajo';return false;}
 try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-status').textContent = 'Guardado en este navegador';return true; }
 catch { $('save-status').textContent = 'Sin guardado local · exportá respaldo'; if (!storageError) { storageError = true; toast('El navegador no permite guardar. Exportá un respaldo para conservar tu trabajo.'); }return false; }
}
const entryFor = id => {
 const entry=state.exercises[id] || (state.exercises[id]={status:'pending'});
 entry.help ||= PEDAGOGY.cleanHelp();entry.attempts ||= [];
 entry.learning ||= LEARNING.migrateLearning(entry,DATA.exercises.find(ex=>ex.id===id));
 entry.session ||= {kind:'practice',startedAt:null,edited:false,finished:false};
 return entry;
};
for(const ex of DATA.exercises)if(state.exercises[ex.id])entryFor(ex.id);
const getStatus = id => state.exercises[id]?.status || 'pending';
const initialCode = ex => ex.notebookCode || ex.starter;
const findId = (prefix, num) => DATA.exercises.find(e => e.id.startsWith(prefix) && e.id.endsWith('-'+num))?.id;
const fibId = findId('TP_4_Recursividad',3), puertoId = findId('Practica_Parcial',2), intervaloId = findId('Practica_Parcial',1);
let selectedId = state.selected || findId('TP_2_Arreglos',12), currentView = 'ruta', running = false;
let examFocused=document.hasFocus?.()??true,examCheckpointAt=Date.now();
const examView=window.TrainingExamViews.create({$,data:DATA,preset:[intervaloId,puertoId],getStore:()=>state.exams,
 getEntries:()=>state.exercises,start:startExam,resume:resumeExam,submit:submitExam,retry:retryExam,
 openExercise,notify:toast});
function examLocked(){return Boolean(state.exams.active);}
function examItem(id){return state.exams.active?.items.find(item=>item.exerciseId===id);}
function syncExamFocus(){
 if(!state.exams.active)return;
 state.exams.active=EXAMS.focus(state.exams.active,currentView==='practica'&&examFocused&&!document.hidden?selectedId:null);
 saveState();
}
function startExam(ids,minutes,label){
 if(examLocked()){toast('Ya hay un simulacro activo. Podés continuarlo o entregarlo.');return;}
 try{
  let suffix=state.exams.history.length+1,id='sim-'+Date.now()+'-'+suffix;
  while(state.exams.history.some(exam=>exam.id===id))id='sim-'+Date.now()+'-'+(++suffix);
  const exam=EXAMS.create(DATA.exercises,{ids,minutes,id,label,previousSelected:selectedId});
  if(running)stopRun('Ejecución detenida para comenzar el simulacro.');
  saveDraft();state.exams.active=exam;saveState();
  openExercise(exam.items[0].exerciseId);$('scope-filter').value='mock';renderList();examView.render();
  toast('Simulacro iniciado desde las plantillas. Tus borradores anteriores se conservan.');
 }catch(error){toast(error.message);}
}
function checkExamDeadline(){
 const exam=state.exams.active;
 if(exam?.phase==='running'&&Date.now()>=LEARNING.timestamp(exam.deadline)){submitExam('timeout',false);return true;}
 return false;
}
function submitExam(reason='submitted',ask=true){
 const exam=state.exams.active;if(!exam||exam.phase!=='running')return;
 if(ask&&!confirm('Se congelarán las respuestas y se corregirán los ejercicios con pruebas. No podrás seguir editando este intento. ¿Entregar el simulacro?'))return;
 const effectiveReason=Date.now()>=LEARNING.timestamp(state.exams.active.deadline)?'timeout':reason;
 if(running)stopRun('Ejecución detenida para congelar las respuestas del simulacro.');
 // Each input is saved immediately; accepting new editor text after deadline is forbidden.
 if(effectiveReason!=='timeout')state.exams.active=EXAMS.write(state.exams.active,selectedId,{code:$('code-editor').value,notes:$('exercise-notes').value,stdin:$('stdin-input').value},DATA.exercises);
 state.exams.active=EXAMS.submit(state.exams.active,effectiveReason);
 const frozen=examItem(selectedId);
 if(frozen){$('code-editor').value=frozen.code;$('exercise-notes').value=frozen.notes;$('stdin-input').value=frozen.stdin;updateEditor();}
 saveState();updateHelpVisibility();gradeNextExam();
}
function gradeNextExam(){
 const exam=state.exams.active;if(!exam||exam.phase!=='grading'||running)return;
 const item=EXAMS.nextToGrade(exam,DATA.exercises);
 if(!item){finishExam();return;}
 const ex=DATA.exercises.find(ex=>ex.id===item.exerciseId);
 $('exam-live-status').textContent='Corrigiendo: '+ex.title;
 launchRun({exerciseId:ex.id,code:item.code,stdin:item.stdin,withTests:true,kind:'exam',examId:exam.id,finalGrading:true,
  filename:ex.id.replace(/[^\w-]/g,'_')+'.py',partial:null});
}
function finishExam(){
 let exam=EXAMS.finish(state.exams.active);if(!exam)return;
 exam={...exam,items:exam.items.map(item=>{
  const ex=DATA.exercises.find(ex=>ex.id===item.exerciseId),verdict=EXAMS.verdict(item,ex);
  if(item.published||!['passed','failed'].includes(verdict))return item;
  const report=item.lastReport,entry=entryFor(item.exerciseId);
  const category=report.error?.category||report.cases.find(c=>c.error)?.error.category||null;
  const attempt={at:exam.submittedAt,mode:'tests',total:report.total,passed:report.passed,failed:report.failed,skipped:report.skipped,
   category,errorType:report.error?.type||report.cases.find(c=>c.error)?.error.type||'',helpLevel:0,assisted:false,assistanceKnown:true,
   kind:'exam',examId:exam.id,sessionStartedAt:exam.startedAt,reviewEdited:false,durationMs:report.durationMs};
  state.exercises[item.exerciseId]=LEARNING.applyAttempt(entry,attempt,ex);
  return {...item,published:true};
 })};
 const previous=exam.previousSelected||selectedId;
 state.exams=EXAMS.archive(state.exams,exam);
 try{sessionStorage.removeItem('unahur_mock_deadline');}catch{}
 saveState();$('scope-filter').value='all';selectExercise(previous);renderRoute();examView.render();switchView('ruta');
 toast('Simulacro entregado. Revisá los resultados y la cobertura de pruebas.');
}
function resumeExam(){
 if(checkExamDeadline())return;
 if(state.exams.active?.phase==='grading'){gradeNextExam();return;}
 if(examLocked())openExercise(examItem(selectedId)?selectedId:state.exams.active.items[0].exerciseId);
}
function retryExam(id){
 if(examLocked())return;
 const old=state.exams.history.find(exam=>exam.id===id);if(!old)return;
 if(!EXAMS.summary(old,DATA.exercises).counts.ungraded)return;
 if(running)stopRun('Ejecución detenida para retomar la corrección.');
 saveDraft();state.exams.active=EXAMS.retry(old,DATA.exercises);
 state.exams.history=state.exams.history.filter(exam=>exam.id!==id);saveState();
 selectExercise(state.exams.active.items[0].exerciseId);switchView('practica');updateHelpVisibility();gradeNextExam();
}
function restoreExam(){
 if(!state.exams.active){
  let deadline=0;try{deadline=Number(sessionStorage.getItem('unahur_mock_deadline'))||0;}catch{}
  if(deadline>Date.now()&&deadline<=Date.now()+90*EXAMS.MINUTE){
   let exam=EXAMS.create(DATA.exercises,{ids:[intervaloId,puertoId],minutes:90,label:'Simulacro sugerido recuperado',previousSelected:selectedId},deadline-90*EXAMS.MINUTE);
   exam={...exam,legacy:true};
   for(const item of exam.items){const entry=state.exercises[item.exerciseId],code=entry?.session?.kind==='review'?entry.reviewCode:entry?.code;
    if(typeof code==='string')exam=EXAMS.write(exam,item.exerciseId,{code,notes:entry?.notes||'',stdin:entry?.stdin||''},DATA.exercises);}
   state.exams.active=exam;if(saveState())try{sessionStorage.removeItem('unahur_mock_deadline');}catch{}
  }
 }
 const exam=state.exams.active;
 if(exam?.phase==='running'&&Date.now()>=LEARNING.timestamp(exam.deadline)){
  state.exams.active=EXAMS.submit(exam,'timeout');saveState();
 }
}
window.addEventListener('blur',()=>{examFocused=false;syncExamFocus();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)examFocused=document.hasFocus?.()??examFocused;checkExamDeadline();syncExamFocus();});
window.addEventListener('pagehide',()=>{examFocused=false;syncExamFocus();});
window.addEventListener('beforeunload',event=>{
 if(!examLocked())return;saveState();event.preventDefault();event.returnValue='';
});
setInterval(()=>{
 if(!examLocked())return;
 if(checkExamDeadline())return;
 examView.tick();
 if(Date.now()-examCheckpointAt>=10000){saveState();examCheckpointAt=Date.now();}
},1000);
const learningView=window.TrainingLearningViews.create({$,data:DATA,getState:()=>state,getSelected:()=>selectedId,
 openExercise,startReview,postpone:id=>{state.exercises[id]=LEARNING.postpone(entryFor(id));saveState();renderLearning();},refresh:renderLearning});
function renderLearning(){learningView.render();}
function learningLabel(entry){return learningView.badge(entry);}
function renderExerciseLearning(){learningView.renderExercise();}
function replaceEntry(id,value){state.exercises[id]=value;saveState();renderRoute();renderList();if(id===selectedId)renderExerciseLearning();}
function startReview(id){
 if(examLocked()){toast('Terminá el simulacro antes de iniciar un repaso.');return;}
 const ex=DATA.exercises.find(e=>e.id===id);if(!ex)return;
 let entry=entryFor(id);
 if(entry.session.kind==='review' && !entry.session.finished){openExercise(id);return;}
 if(typeof entry.reviewCode==='string' && !confirm('Se reemplazará el borrador del repaso anterior por la plantilla. Tu borrador principal se conserva. ¿Comenzar otro repaso?'))return;
 if(running)stopRun('Ejecución detenida para iniciar el repaso.');
 entry=entryFor(id);
 if(id===selectedId)saveDraft();
 entry.reviewCode=ex.starter;entry.session={kind:'review',startedAt:new Date().toISOString(),edited:false,finished:false};
 entry.help={...PEDAGOGY.cleanHelp(),used:entry.help.used};
 saveState();openExercise(id);renderLearning();toast('Repaso desde la plantilla. Tu borrador principal se conserva.');
}
$('start-review').addEventListener('click',()=>startReview(selectedId));
$('return-draft').addEventListener('click',()=>{
 if(examLocked())return;
 if(running)stopRun('Ejecución detenida para volver al borrador.');
 saveDraft();entryFor(selectedId).session={kind:'practice',startedAt:null,edited:false,finished:false};
 selectExercise(selectedId);toast('Borrador principal restaurado. El código del repaso también queda guardado.');
});
$('exercise-completed').addEventListener('change',()=>{if(examLocked())return;replaceEntry(selectedId,LEARNING.setCompleted(entryFor(selectedId),$('exercise-completed').checked));});
$('register-self-result').addEventListener('click',()=>{
 if(examLocked())return;
 const ex=DATA.exercises.find(e=>e.id===selectedId),entry=entryFor(selectedId),result=$('self-result').value;
 if(running){toast('Terminá la ejecución antes de registrar el resultado.');return;}
 if(ex.tests || !['independent','helped','retry'].includes(result)){toast('Elegí un resultado de autoevaluación.');return;}
 const attempt={at:new Date().toISOString(),mode:'self',selfResult:result==='retry'?'failed':'passed',
  total:0,passed:0,failed:0,skipped:0,category:result==='retry'?'logic':null,errorType:'',
  helpLevel:entry.help.unlocked,assisted:result==='helped'||PEDAGOGY.assisted(entry.help),assistanceKnown:true,
  kind:entry.session.kind,sessionStartedAt:entry.session.startedAt,reviewEdited:entry.session.edited && !entry.session.finished && $('code-editor').value!==ex.starter,durationMs:null};
 replaceEntry(selectedId,LEARNING.applyAttempt(entry,attempt,ex));
 $('self-result').value='';
 toast('Autoevaluación guardada. No cuenta como aprobación por pruebas.');
});
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
  const completed = r.ids.filter(id => LEARNING.isMastered(state.exercises[id])).length;
  return `<article class="route-card ${r.focus?'focus':''}"><span class="step">${String(i+1).padStart(2,'0')}</span><h3>${r.title}</h3><p>${r.desc}</p><p><strong>Para avanzar:</strong> ${r.gate}</p><div class="route-footer"><button class="secondary" data-route="${i}">${completed === r.ids.length?'Repetir':'Entrenar'} →</button><small>${completed}/${r.ids.length} consolidados · ${r.time}</small></div></article>`;
 }).join('');
 const mastered = DATA.exercises.filter(e => LEARNING.isMastered(state.exercises[e.id])).length;
 $('mastery-count').innerHTML = `${mastered} <small>/ ${DATA.exercises.length}</small>`;
 $('mastery-bar').style.width = (mastered / DATA.exercises.length * 100) + '%';
 renderLearning();
}
$('route-cards').addEventListener('click', event => { const btn = event.target.closest('[data-route]'); if (btn) openExercise(route[+btn.dataset.route].ids.find(id => !LEARNING.isMastered(state.exercises[id])) || route[+btn.dataset.route].ids[0]); });
function switchView(view, writeHash = true) {
 if(examLocked()&&!['ruta','practica'].includes(view)){toast('Durante el simulacro usá Mi ruta o el Taller. Las referencias vuelven al entregar.');history.replaceState(null,'','#'+currentView);return;}
 if (!['ruta','practica','laboratorio','teoria','cronograma'].includes(view)) view = 'ruta';
 currentView = view;
 document.querySelectorAll('.view').forEach(v => v.hidden = v.id !== 'view-'+view);
 document.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('active',b.dataset.view === view); b.setAttribute('aria-current', b.dataset.view === view ? 'page' : 'false'); });
 if (writeHash) history.replaceState(null,'','#'+view);
 if(view==='ruta')renderLearning();
 syncExamFocus();
 window.scrollTo({top:0,behavior:'instant'});
}
document.querySelector('nav').addEventListener('click',event => {
 const btn=event.target.closest('[data-view]');if(!btn)return;
 switchView(btn.dataset.view);
 if(currentView===btn.dataset.view){const heading=$('view-'+currentView).querySelector?.('h1');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
});
window.addEventListener('hashchange',()=>switchView(location.hash.slice(1),false));
function filteredExercises(){
 return WORKSHOP.filter(DATA.exercises,{search:$('exercise-search').value,topic:$('topic-filter').value,
  scope:$('scope-filter').value,status:$('status-filter').value,level:$('level-filter').value,tests:$('tests-filter').value,
  examIds:state.exams.active?.items.map(item=>item.exerciseId)||null,mockIds:[intervaloId,puertoId]},getStatus);
}
function renderList() {
 const filtered=filteredExercises(),navigation=WORKSHOP.neighbors(filtered,selectedId);
 $('exercise-count').textContent=DATA.exercises.length+' ejercicios · '+DATA.exercises.filter(e=>e.tests).length+' con pruebas';
 $('list-count').textContent=filtered.length+' consignas encontradas';
 $('exercise-list').innerHTML=filtered.length?filtered.map(e=>`<button class="exercise-item ${selectedId===e.id?'selected':''}" data-exercise="${esc(e.id)}" aria-pressed="${selectedId===e.id}"><small>${esc(topics[e.topic])} · ${esc(e.level)} · ${statuses[getStatus(e.id)]}</small>${esc(e.title)}<small>${learningLabel(state.exercises[e.id])}</small></button>`).join(''):'<p class="muted">No hay resultados con estos filtros. Tu ejercicio abierto se conserva.</p>';
 $('previous-exercise').disabled=!navigation.previous;$('next-exercise').disabled=!navigation.next;
 $('exercise-position').textContent=navigation.index<0?'La consigna abierta queda fuera de los filtros. Limpiá los filtros para navegar.':`Ejercicio ${navigation.index+1} de ${navigation.total} en estos filtros`;
}
function focusExercise(){ $('exercise-title').scrollIntoView({block:'start'});$('exercise-title').focus({preventScroll:true}); }
function navigateExercise(direction){
 const id=WORKSHOP.neighbors(filteredExercises(),selectedId)[direction];
 if(!id)return;saveDraft();selectExercise(id);focusExercise();
}
function clearFilters(){
 $('exercise-search').value='';for(const id of ['topic-filter','scope-filter','status-filter','level-filter','tests-filter'])$(id).value='all';
 renderList();
}
function applyWorkshopPreferences(){
 state.preferences=WORKSHOP.cleanPreferences(state.preferences);
 $('workshop-layout').value=state.preferences.layout;
 $('workshop-workspace').classList.toggle('catalog-collapsed',state.preferences.catalogCollapsed);
 $('exercise-browser').hidden=state.preferences.catalogCollapsed;
 $('exercise-detail').classList.toggle('split-layout',state.preferences.layout==='split');
 $('toggle-catalog').textContent=state.preferences.catalogCollapsed?'Mostrar catálogo':'Ocultar catálogo';
 $('toggle-catalog').setAttribute('aria-expanded',String(!state.preferences.catalogCollapsed));
}
$('previous-exercise').addEventListener('click',()=>navigateExercise('previous'));
$('next-exercise').addEventListener('click',()=>navigateExercise('next'));
$('clear-filters').addEventListener('click',clearFilters);
$('jump-editor').addEventListener('click',()=>{$('code-editor').scrollIntoView({block:'center'});$('code-editor').focus({preventScroll:true});});
$('workshop-layout').addEventListener('change',()=>{state.preferences.layout=$('workshop-layout').value;applyWorkshopPreferences();saveState();});
$('toggle-catalog').addEventListener('click',()=>{state.preferences.catalogCollapsed=!state.preferences.catalogCollapsed;applyWorkshopPreferences();saveState();});
$('exercise-list').addEventListener('click',event=>{const b=event.target.closest('[data-exercise]');if(b){saveDraft();selectExercise(b.dataset.exercise);focusExercise();}});
for (const id of ['exercise-search','topic-filter','scope-filter','status-filter','level-filter','tests-filter']) $(id).addEventListener(id==='exercise-search'?'input':'change',renderList);
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
 if(examLocked()&&!examItem(id)){toast('Ese ejercicio no forma parte del simulacro activo.');return;}
 const ex=DATA.exercises.find(e=>e.id===id);if(!ex)return;
 if(running&&!activeRun?.finalGrading) stopRun('Ejecución detenida al cambiar de ejercicio.');
 if(examLocked())state.exams.active=EXAMS.focus(state.exams.active,null);
 selectedId=id;state.selected=id;const entry=entryFor(id);
 $('exercise-title').textContent=ex.title;$('exercise-origin').textContent=ex.origin;
 $('exercise-source').replaceChildren(document.createTextNode(ex.sourceLabel+' '));
 if(ex.source){const a=document.createElement('a');a.href=encodeURI(ex.source);a.textContent='Abrir fuente ↗';a.target='_blank';a.rel='noopener';$('exercise-source').appendChild(a);}
 $('exercise-statement').innerHTML=ex.markdown?markdown(ex.statement):ex.statement;
 if(id===fibId)$('exercise-statement').insertAdjacentHTML('beforeend','<div class="notice">Convención usada en esta ruta: F(0)=0 y F(1)=1. “Los primeros N números” usa los índices 0 a N−1. Entrená primero la función y después la impresión de la serie.</div>');
 $('exercise-status').value=entry.status;
 const item=examItem(id);
 $('code-editor').value=item?item.code:entry.session.kind==='review'?(entry.reviewCode??ex.starter):(entry.code??initialCode(ex));
 const book=DATA.books.find(b=>b.file===ex.source);
 $('notebook-examples').hidden=!book?.examples.length;
 $('notebook-examples').open=false;
 $('notebook-examples-content').innerHTML='';$('notebook-examples').dataset.exercise='';
 $('add-notebook-code').hidden=!ex.notebookCode;
 $('exercise-notes').value=item?item.notes:entry.notes||'';$('stdin-input').value=item?item.stdin:entry.stdin||'';
 $('editor-filename').textContent=(ex.id.startsWith('legacy-')?'modelo_'+ex.legacyId:ex.id.replace(/[^\w-]/g,'_'))+'.py';
 $('help-panel').hidden=true;$('help-panel').replaceChildren();$('hide-help').hidden=true;
 $('hints-panel').hidden=true;renderHints();renderReport(item?item.lastReport:entry.lastReport);$('diagnosis-panel').hidden=true;
 $('self-result').value='';renderExerciseLearning();
 $('solution-button').disabled=!ex.solution;$('solution-button').textContent=ex.solution?'Ver solución explicada':'Solución no incluida';
 $('test-code').disabled=!ex.tests;$('test-code').title=ex.tests?'Casos de entrenamiento; no reemplazan la revisión de la consigna.':'Agregá tus propias pruebas y usá Ejecutar.';
 $('notebook-button').hidden=!ex.notebookCode;
 $('load-helpers').hidden=!ex.source.startsWith('TP_6_')&&!ex.source.startsWith('TP5bis_');
 $('console-output').classList.remove('error');$('console-output').textContent=ex.tests?'Usá Ejecutar para tus pruebas o Probar casos para las de entrenamiento.':'Este ejercicio no tiene pruebas automáticas incluidas. Agregá tus casos con print o assert.';
 updateHelpVisibility();updateEditor();renderList();syncExamFocus();saveState();
}
function openExercise(id) { clearFilters();selectExercise(id);switchView('practica');focusExercise(); }
$('continue-route').addEventListener('click',()=>openExercise(selectedId));
$('exercise-status').addEventListener('change',()=>{
 if(examLocked())return;
 const entry=entryFor(selectedId);
 if($('exercise-status').value==='mastered' && PEDAGOGY.needsRetry(entry.help)){
  entry.status='review';$('exercise-status').value='review';toast('Este intento usó ayuda avanzada. Reintentá sin ayudas antes de declarar dominio.');
 }else entry.status=$('exercise-status').value;
 saveState();renderRoute();renderList();
});
function showHelp(kind) {
 if(examLocked()){toast('Las ayudas están ocultas durante el simulacro.');return;}
 const ex=DATA.exercises.find(e=>e.id===selectedId);const panel=$('help-panel');
 if(kind==='hint'){
  if(!entryFor(selectedId).help.unlocked)useNextHint();
  $('hints-panel').hidden=false;renderHints();return;
 }
 if(kind==='solution'||kind==='notebook'){entryFor(selectedId).help.solutionViewed=true;recordAssistance();}
 if(kind==='solution')panel.innerHTML='<h3>Razonamiento y solución de referencia</h3>'+(ex.steps?(ex.markdown?markdown(ex.steps):ex.steps):'')+(ex.reason?(ex.markdown?markdown(ex.reason):ex.reason):'')+'<pre><code>'+esc(ex.solution)+'</code></pre><p>Compará con tu intento. Reescribí la solución de memoria antes de marcar el ejercicio como dominado.</p>';
 if(kind==='notebook')panel.innerHTML='<h3>Código del notebook original</h3><p>Es una transcripción del archivo de cátedra. Puede contener borradores o errores; revisalo antes de usarlo como referencia.</p><pre>'+esc(ex.notebookCode)+'</pre>';
 panel.hidden=false;
 panel.dataset.kind=kind;
 $('hide-help').hidden=false;
}
function recordAssistance(){
 const entry=entryFor(selectedId);
 if(PEDAGOGY.needsRetry(entry.help) && entry.status==='mastered'){
  entry.status='review';$('exercise-status').value='review';renderRoute();renderList();
 }
 renderHints();saveState();
}
function renderHints(){
 const ex=DATA.exercises.find(e=>e.id===selectedId),help=entryFor(selectedId).help;
 $('hint-usage').textContent=help.used+' pistas abiertas en total · '+help.unlocked+'/3 en este intento'+(help.solutionViewed?' · referencia consultada':'');
 $('hints-content').innerHTML=PEDAGOGY.hintsFor(ex).slice(0,help.unlocked).map(h=>'<article><h3>Nivel '+h.level+' — '+h.title+'</h3>'+(h.topicGuide?'<small>Guía del tema: adaptala al contrato de esta consigna.</small>':'')+(h.level===3?'<pre>'+esc(h.body)+'</pre>':'<p>'+esc(h.body)+'</p>')+'</article>').join('');
 $('next-hint').disabled=help.unlocked>=3;
 $('next-hint').textContent=help.unlocked>=3?'Tres niveles abiertos':'Abrir nivel '+(help.unlocked+1);
 $('original-hint').hidden=help.unlocked<3||!ex.hint;
 $('original-hint-content').textContent=help.originalViewed?ex.hint:'';
 $('original-hint-content').hidden=!help.originalViewed;
 $('hint-button').textContent=help.unlocked?'Volver a mis pistas':'Ver primera pista';
}
function useNextHint(){
 if(examLocked())return;
 const entry=entryFor(selectedId);entry.help=PEDAGOGY.unlockHint(entry.help);recordAssistance();
}
$('next-hint').addEventListener('click',useNextHint);
$('hide-hints').addEventListener('click',()=>{$('hints-panel').hidden=true;$('hint-button').focus();});
$('hide-help').addEventListener('click',()=>{const kind=$('help-panel').dataset.kind;$('help-panel').hidden=true;$('hide-help').hidden=true;$(kind==='notebook'?'notebook-button':'solution-button').focus();});
$('original-hint').addEventListener('click',()=>{if(examLocked()||entryFor(selectedId).help.unlocked<3)return;entryFor(selectedId).help.originalViewed=true;recordAssistance();});
$('fresh-attempt').addEventListener('click',()=>{
 if(examLocked())return;
 if(running){toast('Detené la ejecución antes de comenzar otro intento.');return;}
 const entry=entryFor(selectedId);
 if(entry.session.kind==='review'){
  if(!confirm('Se reemplazará este borrador de repaso por la plantilla para volver a intentar sin ayuda. El borrador principal se conserva. ¿Reiniciar el repaso?'))return;
  entry.reviewCode=DATA.exercises.find(ex=>ex.id===selectedId).starter;
  entry.session={kind:'review',startedAt:new Date().toISOString(),edited:false,finished:false};
 }
 entry.help={...PEDAGOGY.cleanHelp(),used:entry.help.used};
 $('hints-panel').hidden=true;$('help-panel').hidden=true;$('hide-help').hidden=true;
 $('notebook-examples').open=false;
 if(entry.session.kind==='review')selectExercise(selectedId);
 renderHints();saveState();toast('Nuevo intento: las ayudas se cierran y su uso histórico se conserva. Reescribí de memoria antes de declarar dominio.');
});
$('hint-button').addEventListener('click',()=>showHelp('hint'));$('solution-button').addEventListener('click',()=>showHelp('solution'));$('notebook-button').addEventListener('click',()=>showHelp('notebook'));
$('notebook-examples').addEventListener('toggle',()=>{
 if($('notebook-examples').open && !examLocked()){
  if($('notebook-examples').dataset.exercise!==selectedId){
   const ex=DATA.exercises.find(ex=>ex.id===selectedId),book=DATA.books.find(book=>book.file===ex.source);
   $('notebook-examples-content').innerHTML=book?book.examples.map(c=>'<details><summary>Celda '+c.cell+'</summary><pre><code>'+esc(c.code)+'</code></pre></details>').join(''):'';
   $('notebook-examples').dataset.exercise=selectedId;
  }
  entryFor(selectedId).help.solutionViewed=true;recordAssistance();
 }
});
$('add-notebook-code').addEventListener('click',()=>{
 if(examLocked())return;
 const original=DATA.exercises.find(e=>e.id===selectedId).notebookCode;
 if(!original)return;
 if($('code-editor').value.includes(original)){toast('El código original ya está en el editor.');return;}
 $('code-editor').value=original+'\n\n# --- Mi trabajo ---\n'+$('code-editor').value;
 entryFor(selectedId).help.solutionViewed=true;recordAssistance();
 updateEditor();saveDraft();toast('Ejemplos originales agregados. Tu código se conserva debajo.');
});
function highlight(code) {
 const re=/(#[^\n]*|'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|\b(?:def|class|if|elif|else|return|for|while|in|and|or|not|is|None|True|False|import|from|as|raise|try|except|finally|with|pass|break|continue|lambda|yield)\b|\b\d+(?:\.\d+)?\b)/g;
 let result='',last=0;for(const m of code.matchAll(re)){result+=esc(code.slice(last,m.index));const t=m[0],cls=t[0]==='#'?'comment':/^["']/.test(t)?'str':/^\d/.test(t)?'number':'kw';result+='<span class="'+cls+'">'+esc(t)+'</span>';last=m.index+t.length;}return result+esc(code.slice(last))+'\n';
}
function updateEditor(){const ed=$('code-editor');$('code-highlight').innerHTML='<code>'+highlight(ed.value)+'</code>';$('line-numbers').textContent=Array.from({length:ed.value.split('\n').length},(_,i)=>i+1).join('\n');syncScroll();updateCursor();}
function syncScroll(){$('code-highlight').scrollTop=$('code-editor').scrollTop;$('code-highlight').scrollLeft=$('code-editor').scrollLeft;$('line-numbers').scrollTop=$('code-editor').scrollTop;}
function updateCursor(){const ed=$('code-editor'),before=ed.value.slice(0,ed.selectionStart).split('\n');$('cursor-position').textContent='Ln '+before.length+', Col '+(before.at(-1).length+1);}
function saveDraft(markPracticing=false){
 if(examLocked()){
  if(checkExamDeadline())return;
  if(state.exams.active.phase==='running')state.exams.active=EXAMS.write(state.exams.active,selectedId,{code:$('code-editor').value},DATA.exercises);
  updateReportFreshness();saveState();return;
 }
 const entry=entryFor(selectedId);
 entry[entry.session.kind==='review'?'reviewCode':'code']=$('code-editor').value;
 if(markPracticing)entry.session.edited=true;
 entry.updated=new Date().toISOString();updateReportFreshness();
 if(markPracticing&&entry.status==='pending'){entry.status='practicing';$('exercise-status').value='practicing';renderList();}
 saveState();
}
$('code-editor').addEventListener('input',()=>{updateEditor();saveDraft(true);});$('code-editor').addEventListener('scroll',syncScroll);for(const event of ['click','keyup','select'])$('code-editor').addEventListener(event,updateCursor);
let tabEscape=false;
$('code-editor').addEventListener('keydown',event=>{
 if(event.target.readOnly)return;
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
document.addEventListener('keydown',e=>{if(currentView==='practica'&&(e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();if(e.shiftKey&&!DATA.exercises.find(ex=>ex.id===selectedId)?.tests){toast('Esta consigna no tiene pruebas incluidas. Podés ejecutar tus propios casos.');return;}runCode(e.shiftKey);}});
for(const [id,key] of [['exercise-notes','notes'],['stdin-input','stdin']])$(id).addEventListener('input',()=>{
 if(examLocked()){if(checkExamDeadline())return;state.exams.active=EXAMS.write(state.exams.active,selectedId,{[key]:$(id).value},DATA.exercises);}
 else entryFor(selectedId)[key]=$(id).value;saveState();if(examLocked())updateReportFreshness();
});
$('learning-log').value=state.log;$('learning-log').addEventListener('input',()=>{state.log=$('learning-log').value;saveState();$('log-save').textContent=storageError||corruptStorage?'Exportá un respaldo para conservar el registro':'Guardado automático';});
function download(filename,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download-code').addEventListener('click',()=>download($('editor-filename').textContent,$('code-editor').value,'text/x-python;charset=utf-8'));
$('export-progress').addEventListener('click',()=>{saveDraft();download('mi-ruta-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2),'application/json');toast('Respaldo descargado: código, notas, estados, ayudas y evaluaciones.');});
$('recover-progress').addEventListener('click',()=>download('guardado-anterior-sin-modificar.json',recoveryRaw,'application/json'));
$('import-backup').addEventListener('click',()=>{if(examLocked()){toast('Entregá el simulacro antes de importar otro respaldo.');return;}$('import-progress').click();});
$('import-progress').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 if(examLocked()){toast('Entregá el simulacro antes de importar otro respaldo.');event.target.value='';return;}
 try{
  if(file.size>10_000_000)throw Error('El archivo excede 10 MB');
  const imported=validState(JSON.parse(await file.text()));
  if(!Object.keys(imported.exercises).length && !imported.exams.active && !imported.exams.history.length && Object.keys(state.exercises).length)throw Error('El respaldo no contiene ejercicios reconocidos ni simulacros');
  if(!confirm('Se reemplazarán los ejercicios incluidos, el registro de dificultades y los simulacros con el mismo identificador. Los demás se conservan; el historial guarda los diez más recientes. ¿Importar?'))return;
  if(running)stopRun('Ejecución detenida para importar el respaldo.');
  if(corruptStorage)download('guardado-anterior-sin-modificar.json',recoveryRaw,'application/json');
  state={...state,log:imported.log,exercises:{...state.exercises,...imported.exercises},exams:EXAMS.merge(state.exams,imported.exams),preferences:imported.preferences||state.preferences};
  applyWorkshopPreferences();
  corruptStorage=false;$('recover-progress').hidden=true;
  saveState();$('learning-log').value=state.log;restoreExam();selectExercise(state.exams.active?.items[0]?.exerciseId||imported.selected||selectedId);renderRoute();examView.render();toast('Respaldo importado. Se conservaron los ejercicios no incluidos.');
 }catch(error){toast('No se importó: '+error.message);}finally{event.target.value='';}
});
$('reset-code').addEventListener('click',()=>{
 if(state.exams.active?.phase==='grading')return;
 $('reset-explanation').textContent=examLocked()?'Se reemplazará esta respuesta del simulacro por la plantilla. Los borradores de práctica y repaso se conservan.':entryFor(selectedId).session.kind==='review'?'Se reemplazará el borrador del repaso por la plantilla. El borrador principal, las ayudas registradas y las notas se conservan.':'Se reemplazará tu código por los ejemplos originales de este ejercicio, o por la plantilla si la celda original estaba vacía. Tus notas y tu estado se conservan.';
 $('reset-dialog').showModal();
});
$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click',()=>{
 if(running)stopRun('Ejecución detenida.');
 if(state.exams.active?.phase==='grading')return;
 const ex=DATA.exercises.find(e=>e.id===selectedId),entry=entryFor(selectedId);
 if(examLocked()){$('code-editor').value=ex.starter;state.exams.active=EXAMS.write(state.exams.active,selectedId,{code:ex.starter},DATA.exercises);updateEditor();saveDraft();$('reset-dialog').close();return;}
 if(entry.session.kind==='review')entry.session={kind:'review',startedAt:new Date().toISOString(),edited:false,finished:false};
 $('code-editor').value=entry.session.kind==='review'?ex.starter:initialCode(ex);
 updateEditor();saveDraft();renderExerciseLearning();$('reset-dialog').close();
});
// One active request; terminated workers and stale messages cannot update another exercise.
let worker=null,workerUrl=null,runTimer,runSerial=0,activeRun=null;
const errorLabels={syntax:'Error de sintaxis',execution:'Error de ejecución',logic:'Resultado incorrecto',timeout:'Tiempo agotado',cancelled:'Ejecución detenida',infrastructure:'Motor no disponible'};
function renderReport(report){
 const panel=$('test-results');panel.hidden=!report;
 $('explain-error').disabled=running||!report;
 if(!report){$('test-cases').replaceChildren();return;}
 $('test-summary').textContent=report.mode==='tests'?`${report.passed} aprobados · ${report.failed} fallidos · ${report.skipped} sin ejecutar · ${report.total} casos`:'Ejecución libre · no verifica automáticamente la consigna';
 $('execution-time').textContent=report.durationMs==null?'Tiempo Python no disponible':`Tiempo de evaluación: ${report.durationMs.toFixed(2)} ms (sin descarga)`;
 const firstError=report.error||report.cases.find(c=>c.error)?.error;
 $('result-guidance').textContent=firstError?`${errorLabels[firstError.category]||'Error'}${firstError.line?' · línea '+firstError.line:''}: ${firstError.message}`:report.mode==='tests'?'Revisá también las restricciones de la consigna. Pasar los casos no marca dominio.':'Programa terminado sin excepciones.';
 $('result-guidance').classList.toggle('failure',Boolean(firstError));
 $('test-cases').innerHTML=report.cases.map(c=>`<details class="test-case ${c.status}"><summary>Caso ${c.id} · ${{passed:'Aprobado',failed:'Fallido',skipped:'Sin ejecutar'}[c.status]}${c.error?' · '+esc(errorLabels[c.error.category]||'Error'):''}</summary><dl><dt>Entrada / operaciones</dt><dd><pre>${esc(c.input)}</pre></dd><dt>Resultado esperado</dt><dd><pre>${esc(c.expected)}</pre></dd><dt>Resultado obtenido</dt><dd><pre>${esc(c.actual)}</pre></dd></dl>${c.error?'<p>'+esc(c.error.type+': '+c.error.message)+'</p>':''}<small>${c.status==='skipped'?'No se evaluó este caso':c.durationMs.toFixed(3)+' ms'}</small></details>`).join('');
 updateReportFreshness();
}
function updateReportFreshness(){
 const item=examItem(selectedId),entry=entryFor(selectedId);
 $('report-stale').hidden=item?(!item.lastReport||item.reportCode===$('code-editor').value&&item.reportStdin===$('stdin-input').value):(!entry.lastReport||entry.lastRunCode===$('code-editor').value);
}
function completeRun(report){
 const request=activeRun;if(!request)return;
 clearTimeout(runTimer);activeRun=null;setBusy(false);
 if(request.examId){
  if(state.exams.active?.id!==request.examId)return;
  state.exams.active=EXAMS.recordReport(state.exams.active,request.exerciseId,PEDAGOGY.cleanReport(report),request.code,request.finalGrading,request.stdin);
  saveState();examView.render();
  if(selectedId===request.exerciseId)renderReport(report);
  if(request.finalGrading)Promise.resolve().then(gradeNextExam);
  return;
 }
 const entry=entryFor(request.exerciseId);entry.lastReport=PEDAGOGY.cleanReport(report);entry.lastRunCode=request.code;
 const category=report.error?.category||report.cases.find(c=>c.error)?.error.category||null;
 const attempt={at:new Date().toISOString(),mode:report.mode,total:report.total,passed:report.passed,failed:report.failed,skipped:report.skipped,category,
  errorType:report.error?.type||report.cases.find(c=>c.error)?.error.type||'',
  helpLevel:entry.help.unlocked,assisted:PEDAGOGY.assisted(entry.help),assistanceKnown:true,
  kind:request.kind,sessionStartedAt:request.sessionStartedAt,reviewEdited:request.reviewEdited,durationMs:report.durationMs};
 state.exercises[request.exerciseId]=LEARNING.applyAttempt(entry,attempt,DATA.exercises.find(ex=>ex.id===request.exerciseId));
 saveState();renderRoute();renderList();renderExerciseLearning();
 if(selectedId===request.exerciseId){renderReport(entry.lastReport);$('diagnosis-panel').hidden=true;}
}
$('explain-error').addEventListener('click',()=>{
 if(examLocked()){toast('El diagnóstico está oculto durante el simulacro.');return;}
 const entry=entryFor(selectedId),ex=DATA.exercises.find(e=>e.id===selectedId);
 $('diagnosis-content').innerHTML=PEDAGOGY.diagnose(entry.lastReport,entry.lastRunCode||'',ex).map(t=>'<p>'+esc(t)+'</p>').join('');
 $('diagnosis-panel').hidden=false;
});
$('hide-diagnosis').addEventListener('click',()=>{$('diagnosis-panel').hidden=true;$('explain-error').focus();});
function destroyWorker(){if(worker)worker.terminate();worker=null;if(workerUrl)URL.revokeObjectURL(workerUrl);workerUrl=null;}
function setBusy(busy){running=busy;const grading=state.exams.active?.phase==='grading';$('run-code').disabled=busy||grading;$('test-code').disabled=busy||grading||!DATA.exercises.find(e=>e.id===selectedId).tests;$('stop-code').disabled=!busy;$('explain-error').disabled=busy||!entryFor(selectedId).lastReport;$('fresh-attempt').disabled=busy;}
function stopRun(message,category='cancelled'){
 clearTimeout(runTimer);destroyWorker();
 if(activeRun){const report=activeRun.partial||{mode:activeRun.withTests?'tests':'run',cases:[],total:0,passed:0,failed:0,skipped:0};
  completeRun({...report,durationMs:null,error:{category,type:category==='timeout'?'TimeoutError':category==='infrastructure'?'RuntimeUnavailable':'Interrupted',message:message||'Ejecución interrumpida',line:null,source:'worker'}});
 }else setBusy(false);
 $('runtime-status').textContent='Motor detenido; se recarga al ejecutar';
 if(message)$('console-output').textContent+='\n'+message;
}
function startTimeout(ms,category){clearTimeout(runTimer);runTimer=setTimeout(()=>stopRun(category==='timeout'?'Se alcanzó el límite de 12 segundos. Revisá los bucles, el caso base o el costo del algoritmo.':'No se pudo cargar Python y sus paquetes en dos minutos. Comprobá la conexión.',category),ms);}
function runCode(withTests){
 if(checkExamDeadline()||state.exams.active?.phase==='grading')return;
 if(running)return;saveDraft();const ex=DATA.exercises.find(e=>e.id===selectedId);if(withTests&&!ex.tests)return;
 const entry=entryFor(selectedId);
 if(!examLocked()&&entry.status==='pending'){entry.status='practicing';$('exercise-status').value='practicing';saveState();renderList();}
 launchRun({exerciseId:selectedId,code:$('code-editor').value,stdin:$('stdin-input').value,filename:$('editor-filename').textContent,withTests,partial:null,
  kind:examLocked()?'exam':entry.session.kind,examId:state.exams.active?.id||null,finalGrading:false,
  sessionStartedAt:entry.session.startedAt,reviewEdited:entry.session.edited && !entry.session.finished && $('code-editor').value!==ex.starter});
}
function launchRun(request){
 if(running)return;activeRun={...request,runId:++runSerial};
 const ex=DATA.exercises.find(ex=>ex.id===request.exerciseId),withTests=request.withTests;
 $('console-output').textContent='';$('console-output').classList.remove('error');$('test-results').hidden=true;$('diagnosis-panel').hidden=true;
 setBusy(true);$('runtime-status').textContent='Preparando Python…';startTimeout(120000,'infrastructure');
 try{
  if(!worker){workerUrl=URL.createObjectURL(new Blob(['('+window.TrainingRuntime.workerMain.toString()+')();'],{type:'text/javascript'}));worker=new Worker(workerUrl,{type:'module'});}
  worker.onmessage=({data})=>{
   if(!activeRun||data.runId!==activeRun.runId)return;
   if(data.type==='phase'){$('runtime-status').textContent=data.text;if(data.phase==='running')startTimeout(12000,'timeout');}
   if(data.type==='output'){$('console-output').textContent+=data.text;$('console-output').scrollTop=$('console-output').scrollHeight;}
   if(data.type==='progress')activeRun.partial=PEDAGOGY.cleanReport(data.report);
   if(data.type==='done'){
    completeRun(data.report);$('runtime-status').textContent=data.report.error?'Revisá el resultado':'Python disponible';
    if(data.report.error){$('console-output').classList.add('error');$('console-output').textContent+='\n'+data.report.error.type+': '+data.report.error.message;}
    if(!$('console-output').textContent)$('console-output').textContent=withTests?'Evaluación terminada. Consultá los resultados por caso.':'Programa terminado sin salida. Usá print(...) para mostrar resultados.';
   }
   if(data.type==='error'){stopRun('No se pudo completar la evaluación: '+data.text,'infrastructure');$('console-output').classList.add('error');}
  };
  worker.onerror=event=>{event.preventDefault();stopRun('No se pudo cargar el motor. Comprobá la conexión o descargá el .py.','infrastructure');$('console-output').classList.add('error');};
  worker.postMessage({runId:activeRun.runId,code:activeRun.code,tests:withTests?PEDAGOGY.testsFor(ex):'',stdin:request.stdin,filename:request.filename,evaluator:window.TRAINING_EVALUATOR});
 }catch(error){stopRun('No se pudo iniciar Python: '+error.message,'infrastructure');}
}
$('load-helpers').addEventListener('click',()=>{
 if(examLocked())return;
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
// Models and rendering of the controlled lab are independent of Python execution.
const labView=window.TrainingLabViews.create({$,openExercise,findId});
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
const pdfMaterials=DATA.materials.filter(m=>m.type==='PDF');
$('pdf-select').innerHTML=pdfMaterials.map(m=>`<option value="${esc(m.file)}">${esc(m.file)}</option>`).join('');
let selectedPdf='';
function selectPdf(file) {
 const material=pdfMaterials.find(m=>m.file===file);if(!material)return;
 $('pdf-select').value=file;$('pdf-title').textContent=file;
 const url=encodeURI(file);
 $('pdf-open').href=url;$('pdf-download').href=url;
 if(selectedPdf!==file){
  selectedPdf=file;
  $('pdf-frame').title='Contenido de '+file;
  $('pdf-frame').src=url+'#view=FitH';
  $('pdf-text').textContent=material.text||'No hay transcripción para este documento. Abrí el PDF original.';
  $('pdf-transcription').open=false;
 }
}
function openPdf(file) {
 if(examLocked()){toast('Las referencias están ocultas durante el simulacro.');return;}
 selectPdf(file);switchView('teoria');
 $('pdf-reader').scrollIntoView({block:'start'});$('pdf-select').focus({preventScroll:true});
}
$('pdf-select').addEventListener('change',event=>selectPdf(event.target.value));
if(pdfMaterials.length)selectPdf(pdfMaterials[0].file);
document.addEventListener('click',event=>{
 const link=event.target.closest('[data-pdf]');
 if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();openPdf(link.dataset.pdf);}
});
$('new-theory').innerHTML=newTheory.map(([title,body,code,source,practice])=>`<article class="panel prose"><span class="eyebrow accent">CONCEPTO + APLICACIÓN</span><h2>${title}</h2><p>${body}</p><pre><code>${esc(code)}</code></pre><small>Fuentes: <a href="${encodeURI(source)}" ${source.endsWith('.pdf')?`data-pdf="${esc(source)}"`:'target="_blank" rel="noopener"'}>${esc(source)}</a> · <a href="${encodeURI(practice)}" target="_blank" rel="noopener">${esc(practice)}</a></small></article>`).join('');
$('original-theory').innerHTML=DATA.theory.map(t=>`<details><summary>${esc(t.title)}</summary><div class="prose">${t.html}</div></details>`).join('');
$('materials').innerHTML=DATA.materials.map((m,i)=>`<details data-material="${i}"><summary><span class="chip">${m.type}</span>${esc(m.file)}</summary><div class="material-actions">${m.type==='PDF'?`<a href="${encodeURI(m.file)}" data-pdf="${esc(m.file)}">Leer en el visor ↑</a>`:''}<a href="${encodeURI(m.file)}" target="_blank" rel="noopener">Abrir original ↗</a><a href="${encodeURI(m.file)}" download>↓ Descargar</a>${m.type==='IPYNB'?`<button class="text-button" data-book-practice="${esc(m.file)}">Practicar sus ejercicios →</button>`:''}</div><div class="material-content"></div></details>`).join('');
for(const details of $('materials').querySelectorAll('details'))details.addEventListener('toggle',()=>{if(!details.open||details.dataset.loaded)return;details.dataset.loaded='true';const m=DATA.materials[+details.dataset.material],target=details.querySelector('.material-content');if(m.text){const pre=document.createElement('pre');pre.textContent=m.text;target.appendChild(pre);}else{const book=DATA.books.find(b=>b.file===m.file);if(book){target.innerHTML='<h3>Contexto del práctico</h3><div class="prose">'+markdown(book.notes)+'</div><h3>Ejemplos y código del notebook</h3><p class="muted">Incluye borradores de trabajo. No todos los fragmentos son soluciones completas.</p>'+book.examples.map(c=>'<details><summary>Celda '+c.cell+'</summary><pre>'+esc(c.code)+'</pre></details>').join('');}}});
$('materials').addEventListener('click',event=>{const b=event.target.closest('[data-book-practice]');if(b){const ex=DATA.exercises.find(e=>e.source===b.dataset.bookPractice);if(ex)openExercise(ex.id);}});
const weeklyPlan=[['05–11 oct','Índices, recorridos y diagonales','Tres sesiones de matrices + dos de diccionarios. Repetí los errores a las 48 h.'],['12–18 oct','Caso base, reducción y retorno','Factorial, suma y palíndromo. Continuidad: TDA con pilas y colas (clase del 16/10).'],['19–25 oct','Fibonacci y sus dos ramas','Término, primeros N y acumuladores. Continuidad: listas (19 y 23/10).'],['26 oct–01 nov','Recursividad aplicada','Intervalo creciente + suma recursiva de matriz. Continuidad: listas recursivas (26 y 30/10).'],['02–08 nov','TDA Puerto y simulacros','Ubicación por regiones y transferencia. Dos intentos sin ayuda. Continuidad: árboles.'],['09–15 nov','Cerrar los puntos débiles','Repaso de segundo parcial y un simulacro de recuperatorio. Repetí lo que aún necesita pistas.'],['16–20 nov','Segundo parcial y recuperación','Segundo parcial el lunes 16. Martes y miércoles: dos prácticas cortas de recuperación; jueves: trazas y bordes. Viernes 20: recuperatorio.']];
$('weekly-plan').innerHTML=weeklyPlan.map(([dates,title,body])=>`<article class="week"><strong>${dates}</strong><div><strong>${title}</strong><p>${body}</p></div></article>`).join('');
const schedule=[
[1,'10/08','Python: tipos primitivos, operadores, comunicación y control.'],[1,'14/08','Python: funciones y paso de parámetros.'],[2,'17/08','Feriado: Paso a la Inmortalidad del Gral. José de San Martín.','holiday'],[2,'21/08','Python: tipos, operadores, control, funciones y parámetros.'],[3,'24/08','Arreglos uni y multidimensionales: operaciones, memoria y recorridos.'],[3,'28/08','Arreglos uni y multidimensionales: operaciones, memoria y recorridos.'],[4,'31/08','TDA: requerimientos, diseño, dos niveles, arreglos y matrices.'],[4,'04/09','TDA: requerimientos, diseño, dos niveles, arreglos y matrices.'],[5,'07/09','Introducción a recursividad e implementaciones.'],[5,'11/09','Introducción a recursividad e implementaciones.'],[6,'14/09','Recursividad con arreglos y matrices.'],[6,'18/09','Repaso del primer parcial.'],[7,'21/09','Primer parcial.','exam'],[7,'25/09','Corrección del primer parcial.'],[8,'28/09','Pilas y colas dinámicas: definición, operaciones e implementación con listas.'],[8,'02/10','Pilas y colas dinámicas: definición, operaciones e implementación con listas.'],[9,'05/10','Diccionarios y conjuntos: definición, operaciones e implementación.'],[9,'09/10','Diccionarios y conjuntos: definición, operaciones e implementación.'],[10,'12/10','Feriado: Día del Respeto a la Diversidad Cultural.','holiday'],[10,'16/10','TDA en dos niveles con pilas y colas.'],[11,'19/10','Estructuras dinámicas: listas, terminología y operaciones básicas.'],[11,'23/10','Estructuras dinámicas: listas, terminología y operaciones básicas.'],[12,'26/10','Listas: concepto e implementación recursiva.'],[12,'30/10','Listas: concepto e implementación recursiva.'],[13,'02/11','Árboles: terminología, binarios y de búsqueda, operaciones básicas.'],[13,'06/11','Árboles: terminología, binarios y de búsqueda, operaciones básicas.'],[14,'09/11','Árboles binarios de búsqueda: borrado.'],[14,'13/11','Repaso y práctica general para segundo parcial.'],[15,'16/11','Segundo parcial.','exam'],[15,'20/11','Recuperatorio del primer parcial.','exam'],[16,'23/11','Feriado: Día de la Soberanía Nacional (20/11).','holiday'],[16,'27/11','Recuperatorio del segundo parcial.','exam'],[17,'30/11 al 04/12','Semana libre.'],[18,'07/12 al 11/12','Semana de evaluación integradora / final.','exam']];
$('schedule-body').innerHTML=schedule.map(([week,date,topic,kind])=>`<tr class="${kind||''}"><td>${week}</td><td>${date}/2026</td><td>${topic}</td></tr>`).join('');
const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=key=>todayParts.find(x=>x.type===key).value;const days=Math.round((Date.UTC(2026,10,20)-Date.UTC(+part('year'),+part('month')-1,+part('day')))/86400000);$('countdown').textContent=days>0?days+' días para entrenar · calendario oficial':days===0?'Hoy es el recuperatorio':'Fecha del cronograma 2026';
function updateHelpVisibility(){
 const mock=examLocked(),grading=state.exams.active?.phase==='grading',ex=DATA.exercises.find(e=>e.id===selectedId);
 $('import-backup').disabled=mock;
 for(const id of ['hint-button','solution-button','explain-error','fresh-attempt','notebook-button','add-notebook-code','load-helpers','start-review'])$(id).hidden=mock;
 if(mock){$('hints-panel').hidden=true;$('help-panel').hidden=true;$('hide-help').hidden=true;$('diagnosis-panel').hidden=true;$('notebook-examples').open=false;}
 const book=DATA.books.find(b=>b.file===ex.source);
 $('notebook-button').hidden=mock||!ex.notebookCode;$('add-notebook-code').hidden=mock||!ex.notebookCode;
 $('load-helpers').hidden=mock||!ex.source.startsWith('TP_6_')&&!ex.source.startsWith('TP5bis_');
 $('notebook-examples').hidden=mock||!book?.examples.length;$('exercise-source').hidden=mock;
 $('return-draft').hidden=mock||entryFor(selectedId).session.kind!=='review';$('self-assessment').hidden=mock||Boolean(ex.tests);
 $('exercise-completed').disabled=mock;$('exercise-status').disabled=mock;
 $('exercise-learning-panel').hidden=mock;$('hint-usage').hidden=mock;
 for(const id of ['code-editor','exercise-notes','stdin-input'])$(id).readOnly=grading;
 $('reset-code').disabled=grading;
 $('run-code').disabled=running||grading;$('test-code').disabled=running||grading||!ex.tests;
 examView.render();
}
setInterval(()=>{if(currentView==='ruta'&&!document.activeElement?.closest?.('[data-recommendation],[data-postpone],[data-review-exercise],[data-train-topic]'))renderLearning();},60000);
window.addEventListener('focus',()=>{examFocused=true;checkExamDeadline();syncExamFocus();renderLearning();renderExerciseLearning();updateHelpVisibility();});
restoreExam();
applyWorkshopPreferences();renderRoute();labView.init();selectExercise(state.exams.active?.items[0]?.exerciseId||selectedId);switchView(location.hash.slice(1)||'ruta',false);
