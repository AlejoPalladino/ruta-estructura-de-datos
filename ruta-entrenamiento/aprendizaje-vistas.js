'use strict';
(function(root){
 function create({$,data,getState,getSelected,openExercise,startReview,postpone,refresh}) {
  const model=root.TrainingLearning;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>model.timestamp(value)===null?'Sin fecha':new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
  function badge(entry,now=Date.now()) {
   if(!entry?.learning)return 'Nuevo';
   const value=entry.learning;
   const due=model.timestamp(value.dueAt)!==null && model.timestamp(value.dueAt)<=now;
   return (model.isMastered(entry,now)?'Consolidado sin ayuda':value.approved?'Aprobado por pruebas':value.completed?'Completado (declarado)':'En aprendizaje')+(due?' · Repaso pendiente':'');
  }
  function render(now=Date.now()) {
   const state=getState(),entries=state.exercises;
   const competencies=model.dashboard(data.exercises,entries,now);
   $('completed-count').textContent=competencies.reduce((n,t)=>n+t.completed,0);
   $('approved-count').textContent=competencies.reduce((n,t)=>n+t.approved,0);
   $('approved-total').textContent=competencies.reduce((n,t)=>n+t.testable,0)+' con pruebas';
   $('declared-mastery').textContent=data.exercises.filter(ex=>entries[ex.id]?.status==='mastered').length+' marcados como dominados en tu estado declarado. Esa marca no acredita consolidación.';
   $('competency-grid').innerHTML=competencies.map(t=>`<article class="competency-card"><h3>${esc(t.label)}</h3><dl class="competency-metrics"><div><dt>Completados</dt><dd>${t.completed}/${t.total}</dd></div><div><dt>Aprobados por pruebas</dt><dd>${t.testable?t.approved+'/'+t.testable:'Sin pruebas'}</dd></div><div><dt>Consolidados sin ayuda</dt><dd>${t.mastered}/${t.total}</dd></div></dl><progress max="${t.total}" value="${t.completed}" aria-label="Completados en ${esc(t.label)}"></progress><p>${t.performance===null?'Todavía no hay intentos evaluables por pruebas.':'Rendimiento: '+t.successfulAttempts+'/'+t.assessedAttempts+' intentos aprobados ('+Math.round(t.performance*100)+'%).'}</p><small>${t.due} repasos pendientes${t.selfMastered?' · '+t.selfMastered+' consolidados mediante autoevaluación':''}</small>${t.frequentErrors[0]?.count>=2?'<p>Se repite '+esc(t.frequentErrors[0].type)+' en '+t.frequentErrors[0].count+' intentos.</p>':''}<button class="text-button" data-train-topic="${esc(t.topic)}">${t.due?'Repasar':t.completed<t.total?'Reforzar':'Practicar'} ${esc(t.label)} →</button></article>`).join('');
   const recommended=model.recommend(data.exercises,entries,now);
   $('training-recommendations').innerHTML=recommended.length?recommended.map(item=>`<article class="training-card"><span class="eyebrow">${item.due?'REPASO':'PRÁCTICA'} · ${esc(model.TOPICS[item.exercise.topic])} · ${esc(item.exercise.level)}</span><h3>${esc(item.exercise.title)}</h3>${item.reasons.slice(0,2).map(reason=>'<p>'+esc(reason)+'</p>').join('')}<button class="secondary" data-recommendation="${esc(item.exercise.id)}" data-review="${item.due}">${item.due?'Iniciar repaso sin borrador':'Practicar'} →</button><button class="text-button" data-postpone="${esc(item.exercise.id)}">Posponer 24 h</button></article>`).join(''):'<p>No hay recomendaciones pendientes ahora. Podés elegir cualquier ejercicio manualmente.</p>';
   const scheduled=model.reviews(data.exercises,entries,now),due=scheduled.filter(r=>r.due);
   $('review-count').textContent=due.length+' ejercicio(s) pendientes';
   $('next-review').textContent=scheduled.length?'Próximo repaso: '+scheduled[0].exercise.title+' · '+date(scheduled[0].dueAt):'Cuando completes una resolución, se programará el primer repaso.';
   const visible=due.length?due:scheduled.slice(0,3);
   $('review-list').innerHTML=visible.length?visible.map(r=>`<li><div><strong>${esc(r.exercise.title)}</strong><small>${r.due?'Pendiente':'Programado'} · ${esc(date(r.dueAt))} · ${r.mastered?'Consolidado':'En consolidación'}</small></div><button class="secondary" data-review-exercise="${esc(r.exercise.id)}">${entries[r.exercise.id]?.session?.kind==='review'&&!entries[r.exercise.id]?.session?.finished?'Continuar repaso':'Iniciar repaso'}</button></li>`).join(''):'<li>Sin repasos programados todavía.</li>';
  }
  function renderExercise(now=Date.now()) {
   const id=getSelected(),ex=data.exercises.find(e=>e.id===id),entry=getState().exercises[id];
   if(!ex||!entry)return;
   const learning=entry.learning;
   $('exercise-completed').checked=learning.completed;
   $('learning-state').textContent=badge(entry,now)+(learning.dueAt?' · Próximo repaso: '+date(learning.dueAt):'');
   const review=entry.session.kind==='review';
   $('review-session').hidden=!review;$('return-draft').hidden=!review;
   $('start-review').textContent=review&&!entry.session.finished?'Continuar este repaso':'Iniciar repaso sin borrador';
   $('review-session').textContent=(entry.session.finished?'Este repaso ya fue registrado. Iniciá otro desde la plantilla cuando llegue su fecha. ':'Estás en un repaso desde la plantilla. ')+'Tu borrador principal se conserva. Solo un repaso a partir de su fecha, sin ayudas y con trabajo en este editor, avanza el intervalo.';
   $('self-assessment').hidden=Boolean(ex.tests);
   const history=(entry.attempts||[]).slice().reverse();
   $('attempt-history').innerHTML=history.length?history.map(a=>{
    const outcome=model.outcome(a);
    const result=a.mode==='self'?'Autoevaluación: '+(outcome===true?'resuelto':outcome===false?'volver a intentar':'sin resultado'):
     a.mode==='tests'?a.passed+'/'+(a.total??(a.passed+a.failed+a.skipped))+' casos · '+(outcome===true?'aprobado':outcome===false?'fallido':a.category==='infrastructure'?'motor no disponible':a.category==='cancelled'?'detenido':'incompleto'):'Ejecución libre'+(a.category?' · '+(model.ERROR_NAMES[a.category]||({infrastructure:'motor no disponible',cancelled:'detenida'}[a.category])||a.category):'');
    const assistance=a.assistanceKnown===false?'No registrada':a.assisted||a.helpLevel>0?'Con ayuda':'Sin ayuda';
    return `<tr><td>${esc(date(a.at))}</td><td>${a.kind==='review'?'Repaso':a.kind==='exam'?'Simulacro':'Práctica'}</td><td>${esc(result)}${a.reviewAdvanced?'<br><small>Avanzó el repaso</small>':''}</td><td>${assistance}</td><td>${a.durationMs==null?'—':a.durationMs.toFixed(2)+' ms'}</td></tr>`;
   }).join(''):'<tr><td colspan="5">Todavía no hay intentos registrados para este ejercicio.</td></tr>';
  }
  $('training-recommendations').addEventListener('click',event=>{
   const deferred=event.target.closest('[data-postpone]');
   if(deferred){postpone(deferred.dataset.postpone);return;}
   const button=event.target.closest('[data-recommendation]');
   if(button){if(button.dataset.review==='true')startReview(button.dataset.recommendation);else openExercise(button.dataset.recommendation);}
  });
  $('review-list').addEventListener('click',event=>{const button=event.target.closest('[data-review-exercise]');if(button)startReview(button.dataset.reviewExercise);});
  $('competency-grid').addEventListener('click',event=>{
   const button=event.target.closest('[data-train-topic]');if(!button)return;
   const group=data.exercises.filter(ex=>ex.topic===button.dataset.trainTopic),entries=getState().exercises;
   const recommended=model.recommend(group,entries)[0];
   const id=recommended?.exercise.id||group[0]?.id;
   if(id){if(recommended?.due)startReview(id);else openExercise(id);}
  });
  $('choose-training').addEventListener('click',()=>openExercise(getSelected()));
  $('refresh-training').addEventListener('click',refresh);
  return {render,renderExercise,badge};
 }
 root.TrainingLearningViews={create};
})(globalThis);
