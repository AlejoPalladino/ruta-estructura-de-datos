'use strict';
(function(root){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const duration=ms=>Math.floor(Math.max(0,ms)/60000).toString().padStart(2,'0')+':'+Math.floor(Math.max(0,ms)%60000/1000).toString().padStart(2,'0');
 const labels={passed:'Aprobado por pruebas',failed:'No aprobó las pruebas',unanswered:'Sin respuesta',manual:'Revisión manual',ungraded:'Sin corrección completa'};
 function create({$,data,preset,getStore,getEntries,start,resume,submit,retry,openExercise,notify}){
  const model=root.TrainingExams,picked=new Set();let archiveId=null;
  const date=value=>new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
  $('exam-topic').innerHTML='<option value="all">Todos los temas</option>'+Object.entries(root.TrainingLearning.TOPICS).map(([topic,label])=>'<option value="'+topic+'">'+esc(label)+'</option>').join('');
  $('exam-level').innerHTML='<option value="all">Todos los niveles</option>'+[...new Set(data.exercises.map(ex=>ex.level))].map(level=>'<option value="'+esc(level)+'">'+esc(level)+'</option>').join('');
  function renderChoices(){
   const available=model.candidates(data.exercises,$('exam-topic').value||'all',$('exam-level').value||'all');
   $('exam-selection-count').textContent=picked.size+' de '+model.MAX_ITEMS+' seleccionados · '+available.length+' disponibles con estos filtros';
   $('exam-choices').innerHTML=available.length?available.map(ex=>`<label class="exam-choice"><input type="checkbox" data-exam-choice="${esc(ex.id)}" ${picked.has(ex.id)?'checked':''}><span>${esc(ex.title)}<small>${esc(root.TrainingLearning.TOPICS[ex.topic])} · ${esc(ex.level)} · ${ex.tests?'Con pruebas':'Revisión manual'}</small></span></label>`).join(''):'<p>No hay ejercicios con esta combinación.</p>';
   $('start-custom-mock').disabled=Boolean(getStore().active)||!picked.size;
  }
  function renderResults(exam){
   const result=model.summary(exam,data.exercises);
   $('exam-result-title').textContent=exam.label+' · '+date(exam.submittedAt);
   $('exam-result-summary').textContent=result.counts.passed+' aprobados · '+result.counts.failed+' no aprobados · '+result.counts.unanswered+' sin respuesta · '+result.counts.manual+' para revisión manual · '+result.counts.ungraded+' sin corrección completa';
   $('exam-result-coverage').textContent='Pruebas incluidas en '+result.testable+'/'+exam.items.length+' ejercicios. Se evaluaron '+result.evaluated+'. Casos de evaluaciones completadas: '+result.passedCases+' aprobados, '+result.failedCases+' fallidos y '+result.skippedCases+' omitidos.';
   $('exam-result-time').textContent='Duración del intento: '+duration(result.elapsedMs)+' · Tiempo registrado en ejercicios: '+duration(result.focusedMs)+(exam.legacy?' · El detalle de tiempos comienza desde la recuperación del temporizador anterior.':'');
   $('exam-result-rows').innerHTML=result.rows.map(row=>`<tr><td>${esc(row.exercise.title)}<small>${esc(root.TrainingLearning.TOPICS[row.exercise.topic])} · ${esc(row.exercise.level)}</small></td><td>${labels[row.verdict]}</td><td>${duration(row.item.elapsedMs)}</td></tr>`).join('');
   $('exam-strengths').innerHTML=result.groups.map(group=>{
    const findings=[];
    if(group.passed)findings.push('Fortaleza observada en los casos incluidos de '+group.passed+' ejercicio(s) aprobado(s).');
    if(group.failed)findings.push('A reforzar: '+group.failed+' ejercicio(s) no aprobaron.');
    if(group.unanswered)findings.push('Quedaron '+group.unanswered+' consignas sin responder; revisá cómo distribuís el tiempo.');
    if(group.manual+group.ungraded)findings.push((group.manual+group.ungraded)+' respuestas necesitan revisión manual o corrección completa.');
    return '<p><strong>'+esc(group.label)+':</strong> '+findings.join(' ')+'</p>';
   }).join('');
   $('exam-recommendations').innerHTML=model.recommendations(exam,data.exercises).map(item=>'<article><h3>'+esc(item.exercise.title)+'</h3><p>'+esc(item.reason)+'</p><button class="secondary" data-exam-practice="'+esc(item.exercise.id)+'">Practicar →</button></article>').join('')||'<p>Completá la corrección antes de sacar conclusiones sobre tu rendimiento.</p>';
   $('exam-result-details').innerHTML=result.rows.map(row=>{
    const report=row.item.lastReport;
    const advice=report?root.TrainingPedagogy.diagnose(report,row.item.reportCode||'',row.exercise):[];
    return `<details><summary>${esc(row.exercise.title)} · ${labels[row.verdict]}</summary><h3>Tu respuesta entregada</h3><pre>${esc(row.item.code)}</pre>${row.item.notes?'<h3>Notas del intento</h3><pre>'+esc(row.item.notes)+'</pre>':''}${advice.map(line=>'<p>'+esc(line)+'</p>').join('')}${report?.cases?.map(c=>'<details><summary>Caso '+c.id+' · '+({passed:'Aprobado',failed:'Fallido',skipped:'Sin ejecutar'}[c.status])+'</summary><dl><dt>Entrada / operaciones</dt><dd><pre>'+esc(c.input)+'</pre></dd><dt>Esperado</dt><dd><pre>'+esc(c.expected)+'</pre></dd><dt>Obtenido</dt><dd><pre>'+esc(c.actual)+'</pre></dd></dl></details>').join('')||''}</details>`;
   }).join('');
   $('retry-exam-grading').hidden=!result.rows.some(row=>row.verdict==='ungraded');
  }
  function render(){
   const store=getStore(),active=store.active;
   $('exam-banner').hidden=!active;$('mock-control').hidden=!active;$('exam-builder').disabled=Boolean(active);
   $('start-mock').disabled=Boolean(active);$('start-custom-mock').disabled=Boolean(active)||!picked.size;
   $('exam-history').hidden=Boolean(active);
   if(active){
    $('exam-live-label').textContent=active.label;
    $('exam-live-status').textContent=active.phase==='grading'?'Respuestas congeladas · corrección en curso':'Modo examen · pistas y referencias ocultas';
    $('stop-mock').hidden=active.phase!=='running';$('resume-mock').textContent=active.phase==='grading'?'Continuar corrección':'Continuar simulacro';
    $('exam-active-items').innerHTML=active.items.map(item=>'<button class="secondary" data-active-exam-exercise="'+esc(item.exerciseId)+'">'+esc(data.exercises.find(ex=>ex.id===item.exerciseId).title)+'</button>').join('');
   }
   $('exam-history-list').innerHTML=store.history.length?store.history.slice().reverse().map(exam=>'<button class="text-button" data-exam-history="'+esc(exam.id)+'">'+esc(exam.label)+' · '+esc(date(exam.submittedAt))+'</button>').join(''):'<p>Todavía no hay simulacros entregados.</p>';
   const chosen=store.history.find(exam=>exam.id===archiveId)||store.history.at(-1);
   $('exam-results').hidden=Boolean(active)||!chosen;
   if(chosen){archiveId=chosen.id;if(!active)renderResults(chosen);}
   tick();
  }
  function tick(now=Date.now()){
   const active=getStore().active;if(!active)return;
   $('mock-time').textContent=duration(active.phase==='running'?Math.max(0,root.TrainingLearning.timestamp(active.deadline)-now):0);
  }
  $('start-mock').addEventListener('click',()=>start(preset,90,'Intervalo creciente + TDA Puerto'));
  $('start-custom-mock').addEventListener('click',()=>start([...picked],Number($('exam-minutes').value||90),'Simulacro personalizado'));
  $('resume-mock').addEventListener('click',resume);$('stop-mock').addEventListener('click',()=>submit('submitted',true));
  for(const id of ['exam-topic','exam-level'])$(id).addEventListener('change',renderChoices);
  $('exam-choices').addEventListener('change',event=>{
   const input=event.target.closest('[data-exam-choice]');if(!input||getStore().active)return;
   if(input.checked){if(picked.size>=model.MAX_ITEMS){input.checked=false;notify('Podés seleccionar hasta seis ejercicios.');return;}picked.add(input.dataset.examChoice);}
   else picked.delete(input.dataset.examChoice);
   renderChoices();
  });
  $('suggest-exam').addEventListener('click',()=>{
   if(getStore().active)return;
   const available=model.candidates(data.exercises,$('exam-topic').value||'all',$('exam-level').value||'all');
   const ranked=root.TrainingLearning.recommend(available,getEntries(),Date.now(),2).map(r=>r.exercise);
   picked.clear();for(const ex of [...ranked,...available]){if(picked.size>=2)break;picked.add(ex.id);}
   renderChoices();
  });
  $('exam-active-items').addEventListener('click',event=>{const button=event.target.closest('[data-active-exam-exercise]');if(button)openExercise(button.dataset.activeExamExercise);});
  $('exam-history-list').addEventListener('click',event=>{const button=event.target.closest('[data-exam-history]');if(button){archiveId=button.dataset.examHistory;render();}});
  $('retry-exam-grading').addEventListener('click',()=>retry(archiveId));
  $('exam-recommendations').addEventListener('click',event=>{const button=event.target.closest('[data-exam-practice]');if(button&&!getStore().active)openExercise(button.dataset.examPractice);});
  renderChoices();
  return {render,tick,duration};
 }
 root.TrainingExamViews={create};
})(globalThis);
