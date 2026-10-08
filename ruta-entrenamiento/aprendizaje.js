'use strict';
(function (root) {
 const DAY = 24 * 60 * 60 * 1000;
 const INTERVALS = [1, 3, 7, 14];
 const TOPICS = {python:'Python',vector:'Vectores',matriz:'Matrices',recursividad:'Recursividad',tda:'TDA','pila-cola':'Pilas y colas',diccionario:'Diccionarios y conjuntos'};
 const ERROR_NAMES = {syntax:'sintaxis',execution:'ejecución',logic:'resultados incorrectos',timeout:'tiempo agotado'};
 const count = (value, max=100) => Number.isSafeInteger(value) && value>=0 ? Math.min(value,max) : 0;
 const timestamp = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
 const iso = value => new Date(value).toISOString();
 const emptyLearning = () => ({completed:false,approved:false,stage:0,streak:0,dueAt:null,lastQualifiedAt:null,lastReviewSessionAt:null,
  lastAssessmentAt:null,lastOutcome:null,lastSource:null,lastPracticeAt:null,dismissedUntil:null});

 function cleanLearning(value, ex, now=Date.now()) {
  const clean=emptyLearning();
  if (!value || typeof value!=='object') return clean;
  clean.completed=value.completed===true;
  clean.approved=Boolean(ex.tests) && value.approved===true;
  clean.streak=count(value.streak,5);
  clean.stage=Math.min(count(value.stage,3),Math.max(0,clean.streak-1));
  clean.lastOutcome=['passed','failed','assisted'].includes(value.lastOutcome)?value.lastOutcome:null;
  clean.lastSource=value.lastSource===(ex.tests?'tests':'self')?value.lastSource:null;
  for (const key of ['dueAt','lastQualifiedAt','lastReviewSessionAt','lastAssessmentAt','lastPracticeAt','dismissedUntil']) {
   const time=timestamp(value[key]);
   // Due dates can be future; evidence and past practice cannot.
   if(time!==null && (['dueAt','dismissedUntil'].includes(key) || time<=now)) clean[key]=iso(time);
  }
  if (!clean.lastQualifiedAt || clean.lastOutcome!=='passed' || !clean.lastAssessmentAt || !clean.lastSource) {
   clean.stage=0;clean.streak=0;
  }
  return clean;
 }

 function outcome(attempt) {
  if(attempt.mode==='self')return attempt.selfResult==='passed'?true:attempt.selfResult==='failed'?false:null;
  if(attempt.mode!=='tests' || ['infrastructure','cancelled'].includes(attempt.category))return null;
  if(attempt.failed>0 || ['syntax','execution','logic','timeout'].includes(attempt.category))return false;
  const total=attempt.total ?? (attempt.passed+attempt.failed+attempt.skipped);
  return total>0 && attempt.passed===total && attempt.failed===0 && attempt.skipped===0 ? true : null;
 }

 function applyAttempt(entry, attempt, ex, now=Date.now()) {
  const learning=cleanLearning(entry.learning,ex,now);
  const time=timestamp(attempt.at);
  const success=outcome(attempt);
  const validTime=time!==null && time<=now;
  const supported=attempt.mode==='self'?!ex.tests:attempt.mode==='tests'?Boolean(ex.tests):true;
  const assisted=attempt.assisted!==false || attempt.helpLevel>0 || attempt.assistanceKnown===false;
  const sessionTime=timestamp(attempt.sessionStartedAt);
  const newReviewSession=sessionTime!==null && sessionTime<=time && iso(sessionTime)!==learning.lastReviewSessionAt;
  let reviewAdvanced=false;
  if(validTime && !['infrastructure','cancelled'].includes(attempt.category))learning.lastPracticeAt=iso(time);
  if(validTime && supported && success!==null) {
   const previouslyResolved=learning.completed || learning.approved || Boolean(learning.dueAt);
   learning.lastAssessmentAt=iso(time);
   learning.lastSource=attempt.mode==='self'?'self':'tests';
   learning.lastOutcome=success?(assisted?'assisted':'passed'):'failed';
   if(success) {
    learning.completed=true;
    if(attempt.mode==='tests')learning.approved=true;
   }
   if(!success || assisted) {
    learning.stage=0;learning.streak=0;learning.lastQualifiedAt=null;
    if(success || previouslyResolved)learning.dueAt=iso(time+DAY);
   } else if(learning.streak===0) {
    learning.stage=0;learning.streak=1;learning.lastQualifiedAt=iso(time);learning.dueAt=iso(time+DAY);
   } else if(attempt.kind==='review' && attempt.reviewEdited===true && newReviewSession && timestamp(learning.dueAt)!==null && sessionTime>=timestamp(learning.dueAt) && time>=timestamp(learning.dueAt)) {
    learning.stage=Math.min(3,learning.stage+1);
    learning.streak=Math.min(5,learning.streak+1);
    learning.lastQualifiedAt=iso(time);
    learning.dueAt=iso(time+INTERVALS[learning.stage]*DAY);
    reviewAdvanced=true;
   }
   if(success && attempt.kind==='review' && sessionTime!==null && sessionTime<=time)learning.lastReviewSessionAt=iso(sessionTime);
  }
  const session=entry.session && validTime && supported && success===true && attempt.kind==='review'?{...entry.session,finished:true}:entry.session;
  return {...entry,...(session?{session}:{}),learning,attempts:[...(entry.attempts||[]),{...attempt,reviewAdvanced}].slice(-30)};
 }

 function migrateLearning(entry, ex, now=Date.now()) {
  if(entry.learning) return cleanLearning(entry.learning,ex,now);
  let rebuilt={learning:emptyLearning(),attempts:[]};
  // v3 has no deliberate review sessions: retain passes, never infer spaced mastery.
  const attempts=(entry.attempts||[]).slice().sort((a,b)=>(timestamp(a.at)||0)-(timestamp(b.at)||0));
  for(const attempt of attempts)rebuilt=applyAttempt(rebuilt,{...attempt,kind:'practice',reviewEdited:false},ex,now);
  if(entry.lastReport?.mode==='tests' && entry.lastReport.passed>0 && entry.lastReport.failed===0 && entry.lastReport.skipped===0 && !entry.lastReport.error) {
   rebuilt.learning.completed=true;
   rebuilt.learning.approved=Boolean(ex.tests);
  }
  if(entry.status==='mastered')rebuilt.learning.completed=true;
  if(rebuilt.learning.completed && !rebuilt.learning.dueAt) {
   const updated=timestamp(entry.updated);
   rebuilt.learning.dueAt=iso(updated!==null && updated<=now?updated+DAY:now);
  }
  return rebuilt.learning;
 }

 function setCompleted(entry, completed, now=Date.now()) {
  const learning={...entry.learning,completed:Boolean(completed)};
  if(completed && !learning.dueAt)learning.dueAt=iso(now+DAY);
  if(!completed && !learning.approved && !learning.lastOutcome)learning.dueAt=null;
  return {...entry,learning};
 }

 function isMastered(entry, now=Date.now()) {
  const value=entry?.learning;
  return Boolean(value && value.stage>=2 && value.streak>=3 && value.lastOutcome==='passed' &&
   timestamp(value.lastQualifiedAt)!==null && timestamp(value.lastQualifiedAt)<=now);
 }

 function reviews(exercises, entries, now=Date.now()) {
  return exercises.filter(ex=>timestamp(entries[ex.id]?.learning?.dueAt)!==null).map(ex=>({exercise:ex,
   dueAt:entries[ex.id].learning.dueAt,due:timestamp(entries[ex.id].learning.dueAt)<=now,
   stage:entries[ex.id].learning.stage,mastered:isMastered(entries[ex.id],now)}))
   .sort((a,b)=>timestamp(a.dueAt)-timestamp(b.dueAt)||a.exercise.id.localeCompare(b.exercise.id));
 }

 function dashboard(exercises, entries, now=Date.now()) {
  return Object.entries(TOPICS).filter(([topic])=>exercises.some(ex=>ex.topic===topic)).map(([topic,label])=>{
   const group=exercises.filter(ex=>ex.topic===topic);
   const tested=group.filter(ex=>ex.tests);
   const assessments=group.flatMap(ex=>(entries[ex.id]?.attempts||[]).filter(a=>a.mode==='tests' && ex.tests && timestamp(a.at)!==null && timestamp(a.at)<=now && outcome(a)!==null));
   const successes=assessments.filter(a=>outcome(a)===true).length;
   const errors=Object.create(null);
   for(const ex of group)for(const a of entries[ex.id]?.attempts||[]) {
    if(timestamp(a.at)===null || timestamp(a.at)>now || !Object.hasOwn(ERROR_NAMES,a.category))continue;
    const key=a.errorType || a.category;
    if(!errors[key])errors[key]={type:key,category:a.category,count:0};
    errors[key].count++;
   }
   const frequent=Object.values(errors).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type));
   const mastered=group.filter(ex=>isMastered(entries[ex.id],now));
   return {topic,label,total:group.length,testable:tested.length,
    completed:group.filter(ex=>entries[ex.id]?.learning?.completed).length,
    approved:tested.filter(ex=>entries[ex.id]?.learning?.approved).length,
    mastered:mastered.length,selfMastered:mastered.filter(ex=>!ex.tests).length,
    assessedAttempts:assessments.length,successfulAttempts:successes,
    performance:assessments.length?successes/assessments.length:null,
    due:group.filter(ex=>timestamp(entries[ex.id]?.learning?.dueAt)!==null && timestamp(entries[ex.id].learning.dueAt)<=now).length,
    frequentErrors:frequent};
  });
 }

 function recommend(exercises, entries, now=Date.now(), limit=3) {
  const competencies=dashboard(exercises,entries,now);
  const scored=[];
  exercises.forEach((ex,index)=>{
   const entry=entries[ex.id]||{},learning=entry.learning||emptyLearning();
   if(timestamp(learning.dismissedUntil)>now)return;
   const due=timestamp(learning.dueAt)!==null && timestamp(learning.dueAt)<=now;
   if(learning.completed && !due && !['failed','assisted'].includes(learning.lastOutcome))return;
   const topic=competencies.find(c=>c.topic===ex.topic);
   const reasons=[];let score=0;
   if(due) {
    const days=Math.floor((now-timestamp(learning.dueAt))/DAY);
    score+=100+Math.min(days,30);reasons.push(days?'El repaso está pendiente hace '+days+' día(s).':'El repaso vence hoy.');
   }
   if(learning.lastOutcome==='failed'){score+=65;reasons.push('Tu última evaluación mostró una dificultad; conviene reintentarlo.');}
   if(learning.lastOutcome==='assisted'){score+=50;reasons.push('Lo resolviste con ayuda; probá ahora de memoria.');}
   if(!learning.completed && entry.status==='practicing'){score+=35;reasons.push('Tenés una práctica empezada.');}
   if(!learning.completed){score+=20+20*(1-topic.completed/topic.total);reasons.push('Todavía tenés ejercicios pendientes de '+topic.label+'.');}
   const frequent=topic.frequentErrors[0];
   if(frequent && frequent.count>=2){score+=Math.min(20,frequent.count*4);reasons.push('Dificultad frecuente en este tema: '+(frequent.type===frequent.category?ERROR_NAMES[frequent.category]:frequent.type)+' ('+frequent.count+' intentos).');}
   const inactivity=timestamp(learning.lastPracticeAt);
   if(inactivity!==null && now-inactivity>=7*DAY){score+=Math.min(30,Math.floor((now-inactivity)/DAY));reasons.push('Hace al menos una semana que no lo practicás.');}
   const lastAssessed=exercises.filter(other=>other.topic===ex.topic && entries[other.id]?.learning?.lastAssessmentAt)
    .sort((a,b)=>timestamp(entries[b.id].learning.lastAssessmentAt)-timestamp(entries[a.id].learning.lastAssessmentAt))[0];
   if(lastAssessed && entries[lastAssessed.id].learning.lastOutcome==='failed' && lastAssessed.level==='Integración' && ['Base','Refuerzo'].includes(ex.level)){
    score+=8;reasons.unshift('Después de una dificultad en Integración, retomá una base o un refuerzo del tema.');
   } else if(lastAssessed && entries[lastAssessed.id].learning.lastOutcome==='passed' &&
    ({Base:'Práctica','Práctica':'Integración'}[lastAssessed.level])===ex.level) {
    score+=8;reasons.unshift('Después de resolver '+lastAssessed.level+', probá una consigna de '+ex.level+'.');
   } else if(!topic.completed && ex.level==='Base'){score+=8;}
   if(reasons.length)scored.push({exercise:ex,score,reasons,due,index});
  });
  scored.sort((a,b)=>Number(b.due)-Number(a.due)||b.score-a.score||a.index-b.index);
  const selected=[],topics=new Set();
  // Due reviews take precedence; otherwise offer more than one topic when possible.
  for(const item of scored){if(selected.length>=limit)break;if(item.due||!topics.has(item.exercise.topic)){selected.push(item);topics.add(item.exercise.topic);}}
  for(const item of scored){if(selected.length>=limit)break;if(!selected.includes(item))selected.push(item);}
  return selected;
 }

 function postpone(entry, now=Date.now()) {
  return {...entry,learning:{...entry.learning,dismissedUntil:iso(now+DAY)}};
 }

 const api={DAY,INTERVALS,TOPICS,ERROR_NAMES,timestamp,emptyLearning,cleanLearning,outcome,applyAttempt,migrateLearning,
  setCompleted,isMastered,reviews,dashboard,recommend,postpone};
 root.TrainingLearning=api;
 if(typeof module!=='undefined' && module.exports)module.exports=api;
})(globalThis);
