'use strict';
(function(root){
 const learning=root.TrainingLearning || (typeof module!=='undefined'?require('./aprendizaje.js'):null);
 const MINUTE=60000,MAX_ITEMS=6,MAX_HISTORY=10;
 const time=learning.timestamp;
 const iso=value=>new Date(value).toISOString();
 const integer=(value,max)=>Number.isSafeInteger(value)&&value>=0?Math.min(value,max):0;
 const text=(value,max=200)=>typeof value==='string'?value.slice(0,max):'';
 const empty=()=>({active:null,history:[]});

 function candidates(exercises,topic='all',level='all') {
  return exercises.filter(ex=>(topic==='all'||ex.topic===topic)&&(level==='all'||ex.level===level));
 }
 function create(exercises,{ids,minutes=90,id,label='Simulacro',previousSelected=null},now=Date.now()) {
  const chosen=[...new Set(ids||[])];
  if(chosen.length<1||chosen.length>MAX_ITEMS||chosen.some(key=>!exercises.some(ex=>ex.id===key)))throw Error('Elegí entre 1 y 6 ejercicios del catálogo.');
  if(!Number.isInteger(minutes)||minutes<5||minutes>180)throw Error('La duración debe ser de 5 a 180 minutos.');
  return {id:String(id||'sim-'+now),label,phase:'running',startedAt:iso(now),deadline:iso(now+minutes*MINUTE),
   submittedAt:null,finishedAt:null,reason:null,previousSelected,legacy:false,focusId:null,focusSince:null,
   items:chosen.map(key=>({exerciseId:key,code:exercises.find(ex=>ex.id===key).starter,notes:'',stdin:'',touched:false,
    elapsedMs:0,lastReport:null,reportCode:null,reportStdin:null,graded:false,published:false}))};
 }
 function checkpoint(exam,now=Date.now()) {
  if(!exam||exam.phase!=='running'||!exam.focusId||time(exam.focusSince)===null)return exam;
  const until=Math.min(now,time(exam.deadline));
  const budget=Math.max(0,time(exam.deadline)-time(exam.startedAt)-exam.items.reduce((n,item)=>n+item.elapsedMs,0));
  const elapsed=Math.min(budget,Math.max(0,until-time(exam.focusSince)));
  return {...exam,focusSince:iso(until),items:exam.items.map(item=>item.exerciseId===exam.focusId?{...item,
   elapsedMs:Math.min(time(exam.deadline)-time(exam.startedAt),item.elapsedMs+elapsed)}:item)};
 }
 function focus(exam,id,now=Date.now()) {
  const flushed=checkpoint(exam,now);
  if(!flushed||flushed.phase!=='running')return flushed;
  const allowed=now<time(exam.deadline)&&flushed.items.some(item=>item.exerciseId===id);
  return {...flushed,focusId:allowed?id:null,focusSince:allowed?iso(now):null};
 }
 function write(exam,id,fields,exercises,now=Date.now()) {
  if(!exam||exam.phase!=='running'||now>=time(exam.deadline))return exam;
  const ex=exercises.find(e=>e.id===id);if(!ex)return exam;
  return {...exam,items:exam.items.map(item=>{
   if(item.exerciseId!==id)return item;
   const updated={...item};
   for(const key of ['code','notes','stdin'])if(typeof fields[key]==='string')updated[key]=fields[key];
   updated.touched=updated.code!==ex.starter;
   return updated;
  })};
 }
 function recordReport(exam,id,report,code,final=false,stdin='') {
  if(!exam||!['running','grading'].includes(exam.phase))return exam;
  return {...exam,items:exam.items.map(item=>item.exerciseId===id?{...item,lastReport:report,reportCode:code,reportStdin:stdin,
   graded:final || (report.mode==='tests'&&code===item.code&&stdin===item.stdin&&!['infrastructure','cancelled'].includes(report.error?.category))}:item)};
 }
 function submit(exam,reason='submitted',now=Date.now()) {
  if(!exam||exam.phase!=='running')return exam;
  const flushed=focus(exam,null,now);
  return {...flushed,phase:'grading',submittedAt:iso(Math.min(now,time(exam.deadline))),reason,
   focusId:null,focusSince:null};
 }
 function nextToGrade(exam,exercises) {
  if(!exam||exam.phase!=='grading')return null;
  return exam.items.find(item=>item.touched&&exercises.find(ex=>ex.id===item.exerciseId)?.tests&&
   (!item.graded||item.reportCode!==item.code||item.reportStdin!==item.stdin))||null;
 }
 function verdict(item,ex) {
  if(!item.touched)return 'unanswered';
  if(!ex.tests)return 'manual';
  const report=item.lastReport;
  if(!report||report.mode!=='tests'||item.reportCode!==item.code||item.reportStdin!==item.stdin)return 'ungraded';
  if(['infrastructure','cancelled'].includes(report.error?.category))return 'ungraded';
  if(report.error||report.failed>0)return 'failed';
  return report.total>0&&report.passed===report.total&&report.skipped===0?'passed':'ungraded';
 }
 function finish(exam,now=Date.now()) {
  if(!exam||exam.phase!=='grading')return exam;
  return {...exam,phase:'finished',finishedAt:iso(now),focusId:null,focusSince:null};
 }
 function retry(exam,exercises) {
  if(!exam||exam.phase!=='finished')return null;
  return {...exam,phase:'grading',finishedAt:null,items:exam.items.map(item=>({...item,
   graded:verdict(item,exercises.find(ex=>ex.id===item.exerciseId))==='ungraded'?false:item.graded}))};
 }
 function summary(exam,exercises) {
  const rows=exam.items.map(item=>({item,exercise:exercises.find(ex=>ex.id===item.exerciseId)})).filter(row=>row.exercise)
   .map(row=>({...row,verdict:verdict(row.item,row.exercise)}));
  const groups=Object.entries(learning.TOPICS).map(([topic,label])=>({topic,label,rows:rows.filter(row=>row.exercise.topic===topic)})).filter(group=>group.rows.length)
   .map(group=>({...group,passed:group.rows.filter(r=>r.verdict==='passed').length,failed:group.rows.filter(r=>r.verdict==='failed').length,
    unanswered:group.rows.filter(r=>r.verdict==='unanswered').length,manual:group.rows.filter(r=>r.verdict==='manual').length,
    ungraded:group.rows.filter(r=>r.verdict==='ungraded').length}));
  const counts=Object.fromEntries(['passed','failed','unanswered','manual','ungraded'].map(key=>[key,rows.filter(row=>row.verdict===key).length]));
  const measured=rows.filter(row=>['passed','failed'].includes(row.verdict));
  return {rows,groups,counts,testable:rows.filter(row=>row.exercise.tests).length,evaluated:measured.length,
   passedCases:measured.reduce((n,row)=>n+row.item.lastReport.passed,0),
   failedCases:measured.reduce((n,row)=>n+row.item.lastReport.failed,0),
   skippedCases:measured.reduce((n,row)=>n+row.item.lastReport.skipped,0),
   elapsedMs:Math.max(0,(time(exam.submittedAt)||time(exam.deadline))-time(exam.startedAt)),
   focusedMs:rows.reduce((n,row)=>n+row.item.elapsedMs,0)};
 }
 function recommendations(exam,exercises,limit=3) {
  const {rows}=summary(exam,exercises),suggested=[];
  for(const status of ['failed','unanswered','manual'])for(const row of rows.filter(r=>r.verdict===status)){
   if(suggested.length>=limit)break;
   suggested.push({exercise:row.exercise,reason:status==='failed'?'Reintentá el ejercicio que no aprobó sus pruebas.':status==='unanswered'?'Esta consigna quedó sin respuesta; retomá su contrato con tiempo.':'Revisá tu solución con casos propios: esta consigna no tiene pruebas incluidas.'});
  }
  for(const row of rows.filter(r=>r.verdict==='failed'&&r.exercise.level==='Integración')){
   const base=exercises.find(ex=>ex.topic===row.exercise.topic&&['Base','Refuerzo'].includes(ex.level)&&!suggested.some(s=>s.exercise.id===ex.id));
   if(base&&suggested.length<limit)suggested.push({exercise:base,reason:'Reforzá la base de '+learning.TOPICS[base.topic]+' antes de repetir Integración.'});
  }
  if(!suggested.length)for(const row of rows.filter(r=>r.verdict==='passed').slice(0,limit))suggested.push({exercise:row.exercise,
   reason:'Aprobaste los casos. Volvé a resolverlo sin borrador cuando llegue el próximo repaso.'});
  return suggested;
 }

 function cleanExam(value,exercises,cleanReport,now=Date.now()) {
  if(!value||typeof value!=='object'||!Array.isArray(value.items)||!['running','grading','finished'].includes(value.phase))return null;
  const started=time(value.startedAt),deadline=time(value.deadline);
  if(started===null||started>now||deadline===null||deadline-started<5*MINUTE||deadline-started>180*MINUTE)return null;
  const ids=new Set();let budget=deadline-started;
  const items=[];
  for(const raw of value.items.slice(0,MAX_ITEMS)){
   const ex=exercises.find(e=>e.id===raw?.exerciseId);if(!ex||ids.has(ex.id))continue;
   ids.add(ex.id);const elapsedMs=Math.min(integer(raw.elapsedMs,180*MINUTE),budget);budget-=elapsedMs;
   const report=cleanReport(raw.lastReport);
   items.push({exerciseId:ex.id,code:typeof raw.code==='string'?raw.code:ex.starter,notes:typeof raw.notes==='string'?raw.notes:'',
    stdin:typeof raw.stdin==='string'?raw.stdin:'',touched:raw.touched===true,elapsedMs,lastReport:report,
    reportCode:typeof raw.reportCode==='string'?raw.reportCode:null,reportStdin:typeof raw.reportStdin==='string'?raw.reportStdin:null,graded:raw.graded===true,published:raw.published===true});
  }
  if(!items.length)return null;
  const submitted=time(value.submittedAt),finished=time(value.finishedAt);
  if(value.phase!=='running'&&(submitted===null||submitted<started||submitted>deadline||submitted>now))return null;
  if(value.phase==='finished'&&(finished===null||finished<submitted||finished>now))return null;
  return {id:text(value.id,120)||'sim-'+started,label:text(value.label,150)||'Simulacro',phase:value.phase,startedAt:iso(started),deadline:iso(deadline),
   submittedAt:submitted!==null?iso(submitted):null,finishedAt:finished!==null?iso(finished):null,
   reason:['submitted','timeout','legacy'].includes(value.reason)?value.reason:null,
   previousSelected:exercises.some(ex=>ex.id===value.previousSelected)?value.previousSelected:null,legacy:value.legacy===true,
   // Restore a checkpoint, never count the time while a tab was closed.
   focusId:null,focusSince:null,items};
 }
 function cleanState(value,exercises,cleanReport,now=Date.now()) {
  if(value===undefined)return empty();
  if(!value||typeof value!=='object'||!Array.isArray(value.history))throw Error('Formato del historial de simulacros incompatible.');
  const active=value.active?cleanExam(value.active,exercises,cleanReport,now):null;
  if(value.active&&!active)throw Error('El simulacro activo contiene datos incompatibles.');
  const history=[],ids=new Set();
  for(const raw of value.history.slice(-MAX_HISTORY).reverse()){
   const exam=cleanExam(raw,exercises,cleanReport,now);
   if(exam?.phase==='finished'&&!ids.has(exam.id)){history.unshift(exam);ids.add(exam.id);}
  }
  if(active?.phase==='finished')return archive({history},active);
  return {active,history:history.filter(exam=>exam.id!==active?.id)};
 }
 function archive(store,exam) {
  return {active:null,history:[...store.history.filter(old=>old.id!==exam.id),exam].slice(-MAX_HISTORY)};
 }
 function merge(store,incoming) {
  const combined=new Map([...store.history,...incoming.history].map(exam=>[exam.id,exam]));
  const history=[...combined.values()].filter(exam=>exam.id!==incoming.active?.id)
   .sort((a,b)=>time(a.submittedAt)-time(b.submittedAt)).slice(-MAX_HISTORY);
  return {active:incoming.active,history};
 }
 const api={MINUTE,MAX_ITEMS,MAX_HISTORY,empty,candidates,create,checkpoint,focus,write,recordReport,submit,nextToGrade,verdict,
  finish,retry,summary,recommendations,cleanExam,cleanState,archive,merge};
 root.TrainingExams=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
