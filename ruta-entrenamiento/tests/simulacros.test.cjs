const {test}=require('node:test');
const assert=require('node:assert/strict');
const m=require('../simulacros.js');
const p=require('../pedagogia.js');
const catalog=[{id:'a',topic:'recursividad',level:'Integración',tests:'assert f()==1',starter:'pass',title:'A'},
 {id:'b',topic:'matriz',level:'Práctica',tests:'assert f()==1',starter:'pass',title:'B'},
 {id:'c',topic:'pila-cola',level:'Base',tests:'',starter:'pass',title:'C'},
 {id:'d',topic:'recursividad',level:'Base',tests:'assert f()==1',starter:'pass',title:'D'}];
const now=Date.parse('2026-01-01T12:00:00Z');
const create=(ids=['a','b'],minutes=90)=>m.create(catalog,{ids,minutes,id:'exam-1',previousSelected:'c'},now);
const pass={mode:'tests',cases:[{id:1,status:'passed',input:'f()',expected:'1',actual:'1',durationMs:1,error:null}],
 total:1,passed:1,failed:0,skipped:0,error:null,durationMs:2};
const fail={...pass,passed:0,failed:1,cases:[{...pass.cases[0],status:'failed',actual:'0',error:{category:'logic',type:'AssertionError',message:'difiere'}}]};
const infra={...pass,error:{category:'infrastructure',type:'RuntimeUnavailable',message:'network'},durationMs:null};
const write=(exam,id='a',code='def f(): return 1',at=now)=>m.write(exam,id,{code},catalog,at);

test('configuración usa temas y niveles existentes, IDs únicos y límites de duración/cantidad',()=>{
 assert.deepEqual(m.candidates(catalog,'recursividad','Base').map(e=>e.id),['d']);
 assert.throws(()=>create([]));assert.throws(()=>create(['inventado']));
 assert.throws(()=>create(['a'],4));assert.throws(()=>create(['a'],181));assert.throws(()=>create(['a'],NaN));
 assert.equal(create(['a','a']).items.length,1);assert.equal(create().items[0].code,'pass');
 const before=JSON.stringify(catalog);create();assert.equal(JSON.stringify(catalog),before);
});
test('tiempo por ejercicio se acumula por foco, pausa y cambio, sin exceder vencimiento',()=>{
 let exam=m.focus(create(),'a',now);exam=m.focus(exam,'b',now+10000);exam=m.focus(exam,null,now+20000);
 exam=m.focus(exam,'a',now+40000);exam=m.focus(exam,null,now+50000);
 assert.equal(exam.items[0].elapsedMs,20000);assert.equal(exam.items[1].elapsedMs,10000);
 const once=JSON.stringify(exam);exam=m.checkpoint(exam,now+60000);assert.equal(JSON.stringify(exam),once);
 const late=m.checkpoint(m.focus(create(['a'],5),'a',now),now+60*60000);
 assert.equal(late.items[0].elapsedMs,5*60000);
});
test('entrega congela respuestas y el timeout recorta la duración al límite',()=>{
 const running=write(create());const submitted=m.submit(running,'timeout',now+100*60000);
 assert.equal(submitted.phase,'grading');assert.equal(Date.parse(submitted.submittedAt),now+90*60000);
 assert.equal(m.write(submitted,'a',{code:'changed'},catalog,now+100*60000),submitted);
 assert.equal(m.write(running,'a',{code:'late'},catalog,now+90*60000),running);
 assert.equal(m.submit(submitted,'submitted',now+200*60000),submitted);
});
test('corrección reutiliza únicamente pruebas de la misma respuesta y entradas',()=>{
 let exam=write(create());exam=m.recordReport(exam,'a',pass,exam.items[0].code);
 assert.equal(m.nextToGrade(m.submit(exam,'submitted',now+1000),catalog),null);
 exam=write(exam,'a','def f(): return 2');
 assert.equal(m.nextToGrade(m.submit(exam,'submitted',now+1000),catalog).exerciseId,'a');
 exam=write(create());exam=m.recordReport(exam,'a',pass,exam.items[0].code);
 exam=m.write(exam,'a',{stdin:'otro'},catalog,now);
 assert.equal(m.verdict(exam.items[0],catalog[0]),'ungraded');
 assert.equal(m.nextToGrade(m.submit(exam,'submitted',now+1000),catalog).exerciseId,'a');
});
test('resultados distinguen pruebas, fallo, omisión, revisión manual e infraestructura',()=>{
 let exam=write(create(['a','b','c','d']));exam=write(exam,'b');exam=write(exam,'c');
 exam=m.recordReport(exam,'a',pass,exam.items[0].code);exam=m.recordReport(exam,'b',fail,exam.items[1].code);
 const result=m.summary(m.finish(m.submit(exam,'submitted',now+1000),now+2000),catalog);
 assert.deepEqual(result.counts,{passed:1,failed:1,unanswered:1,manual:1,ungraded:0});
 assert.equal(result.testable,3);assert.equal(result.evaluated,2);assert.equal(result.passedCases,1);assert.equal(result.failedCases,1);
 const unavailable=m.recordReport(write(create(['a'])),'a',infra,'def f(): return 1',true);
 assert.equal(m.summary(unavailable,catalog).counts.ungraded,1);assert.equal(m.summary(unavailable,catalog).counts.failed,0);
});
test('errores globales del estudiante son fallos y ejecuciones libres no aprueban',()=>{
 const syntax={...pass,passed:0,skipped:1,cases:[{...pass.cases[0],status:'skipped'}],error:{category:'syntax',type:'SyntaxError'}};
 const exam=write(create(['a']));
 assert.equal(m.verdict(m.recordReport(exam,'a',syntax,exam.items[0].code).items[0],catalog[0]),'failed');
 assert.equal(m.verdict(m.recordReport(exam,'a',{...pass,mode:'run'},exam.items[0].code).items[0],catalog[0]),'ungraded');
});
test('reintentar corrección no permite editar y conserva identidad/entrega',()=>{
 const draft=write(create(['a']));const graded=m.recordReport(m.submit(draft,'submitted',now+1000),'a',infra,draft.items[0].code,true);
 const finished=m.finish(graded,now+2000),retry=m.retry(finished,catalog);
 assert.equal(retry.phase,'grading');assert.equal(retry.id,finished.id);assert.equal(retry.submittedAt,finished.submittedAt);
 assert.equal(m.nextToGrade(retry,catalog).exerciseId,'a');
 assert.equal(m.write(retry,'a',{code:'another'},catalog,now+2000),retry);
});
test('recomendaciones parten de fallos y omisiones reales, sin inventar ejercicios',()=>{
 let exam=write(create(['a']));exam=m.recordReport(exam,'a',fail,exam.items[0].code);
 const recommendations=m.recommendations(exam,catalog);
 assert.deepEqual(recommendations.map(r=>r.exercise.id),['a','d']);assert.match(recommendations[1].reason,/base/);
 const unavailable=m.recordReport(write(create(['a'])),'a',infra,'def f(): return 1',true);
 assert.deepEqual(m.recommendations(unavailable,catalog),[]);
});
test('restaurar progreso descarta reloj de foco antiguo y conserva código, reportes y tiempo',()=>{
 let exam=m.focus(write(create()),'a',now);exam=m.checkpoint(exam,now+10000);
 const clean=m.cleanState({active:exam,history:[]},catalog,p.cleanReport,now+60000);
 assert.equal(clean.active.focusId,null);assert.equal(clean.active.focusSince,null);
 assert.equal(clean.active.items[0].elapsedMs,10000);assert.equal(clean.active.items[0].code,'def f(): return 1');
 assert.deepEqual(m.cleanState(clean,catalog,p.cleanReport,now+60000),clean);
});
test('importación valida fases, fechas, IDs, contadores y evita activos terminados',()=>{
 assert.throws(()=>m.cleanState({active:{},history:[]},catalog,p.cleanReport,now));
 assert.throws(()=>m.cleanState({active:null,history:{}},catalog,p.cleanReport,now));
 const invalid={...create(),startedAt:'future'};assert.equal(m.cleanExam(invalid,catalog,p.cleanReport,now),null);
 const duplicate={...create(),items:[{...create().items[0],elapsedMs:1e12},create().items[0]]};
 const cleaned=m.cleanExam(duplicate,catalog,p.cleanReport,now);assert.equal(cleaned.items.length,1);assert.equal(cleaned.items[0].elapsedMs,90*60000);
 const finished=m.finish(m.submit(create(),'submitted',now+1000),now+2000);
 const normalized=m.cleanState({active:finished,history:[]},catalog,p.cleanReport,now+3000);
 assert.equal(normalized.active,null);assert.equal(normalized.history.length,1);
});
test('historial acotado y combinación de respaldos conservan los diez intentos más recientes',()=>{
 let store=m.empty();
 for(let n=0;n<12;n++)store=m.archive(store,{...m.finish(m.submit(create(),'submitted',now+n*1000),now+n*1000),id:'sim-'+n});
 assert.equal(store.history.length,10);assert.equal(store.history[0].id,'sim-2');
 const replacement={...store.history[0],label:'revisado'};
 const combined=m.merge(store,{active:null,history:[replacement]});assert.equal(combined.history.length,10);assert.equal(combined.history[0].label,'revisado');
});
