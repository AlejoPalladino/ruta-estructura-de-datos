const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const m=require('../aprendizaje.js');
const p=require('../pedagogia.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../datos.js'),'utf8').replace(/^window.TRAINING_DATA = /,'').replace(/;\s*$/,''));
const ex={id:'matrix',topic:'matriz',level:'Práctica',tests:'assert f() == 1',title:'Matriz'};
const manual={id:'stack',topic:'pila-cola',level:'Base',tests:'',title:'Pila'};
const start=Date.parse('2026-01-01T12:00:00Z');
const entry=()=>({status:'practicing',attempts:[],learning:m.emptyLearning()});
function attempt(at,overrides={}){
 return {at:new Date(at).toISOString(),mode:'tests',total:2,passed:2,failed:0,skipped:0,
  category:null,assisted:false,assistanceKnown:true,helpLevel:0,kind:'practice',sessionStartedAt:new Date(at).toISOString(),reviewEdited:false,...overrides};
}
const apply=(e,a,exercise=ex)=>m.applyAttempt(e,a,exercise,Date.parse(a.at));

test('una aprobación completa pero no consolida; sigue intervalos de 1, 3, 7 y 14 días',()=>{
 let current=apply(entry(),attempt(start));
 assert.equal(current.learning.completed,true);assert.equal(current.learning.approved,true);
 assert.equal(current.learning.streak,1);assert.equal(m.isMastered(current,start),false);
 assert.equal(Date.parse(current.learning.dueAt),start+m.DAY);
 for(const [days,nextInterval,mastered] of [[1,3,false],[4,7,true],[11,14,true],[25,14,true]]){
  current=apply(current,attempt(start+days*m.DAY,{kind:'review',reviewEdited:true}));
  assert.equal(Date.parse(current.learning.dueAt),start+(days+nextInterval)*m.DAY);
  assert.equal(m.isMastered(current,start+days*m.DAY),mastered);
  assert.equal(current.attempts.at(-1).reviewAdvanced,true);
 }
 assert.deepEqual(m.INTERVALS,[1,3,7,14]);
});
test('repetir rápido, reejecutar el borrador o dejar la plantilla no avanza el repaso',()=>{
 const initial=apply(entry(),attempt(start));
 for(const a of [attempt(start+1000),attempt(start+1000,{kind:'review',reviewEdited:true}),
  attempt(start+m.DAY,{kind:'practice',reviewEdited:true}),attempt(start+m.DAY,{kind:'review',reviewEdited:false})]){
  const current=apply(initial,a);assert.equal(current.learning.stage,0);assert.equal(current.learning.streak,1);
  assert.equal(current.learning.dueAt,initial.learning.dueAt);assert.equal(current.attempts.at(-1).reviewAdvanced,false);
 }
 const early=apply(initial,attempt(start+2*m.DAY,{kind:'review',reviewEdited:true,sessionStartedAt:new Date(start+1000).toISOString()}));
 assert.equal(early.learning.stage,0);assert.equal(early.learning.dueAt,initial.learning.dueAt);
});
test('ayuda, fallo o asistencia desconocida reducen la evidencia sin borrar aprobaciones',()=>{
 let current=apply(entry(),attempt(start));
 current=apply(current,attempt(start+m.DAY,{kind:'review',reviewEdited:true}));
 current=apply(current,attempt(start+4*m.DAY,{kind:'review',reviewEdited:true}));
 assert.equal(m.isMastered(current,start+4*m.DAY),true);
 for(const overrides of [{assisted:true},{helpLevel:1},{assistanceKnown:false},{passed:1,failed:1,category:'logic'}]){
  const next=apply(current,attempt(start+5*m.DAY,{kind:'review',reviewEdited:true,...overrides}));
  assert.equal(next.learning.stage,0);assert.equal(next.learning.streak,0);
  assert.equal(next.learning.approved,true);assert.equal(next.learning.completed,true);
  assert.equal(Date.parse(next.learning.dueAt),start+6*m.DAY);assert.equal(m.isMastered(next,start+5*m.DAY),false);
 }
});
test('ejecución libre, cero casos, cancelación y fallos de carga no acreditan ni castigan el repaso',()=>{
 const initial=apply(entry(),attempt(start));
 for(const overrides of [{mode:'run'},{total:0,passed:0},{category:'infrastructure'},{category:'cancelled'}]){
  const fresh=apply(entry(),attempt(start,overrides));assert.equal(fresh.learning.completed,false);assert.equal(fresh.learning.approved,false);
  const current=apply(initial,attempt(start+2*m.DAY,overrides));
  assert.equal(current.learning.stage,initial.learning.stage);assert.equal(current.learning.dueAt,initial.learning.dueAt);
 }
 assert.equal(m.outcome(attempt(start,{total:5,passed:2})),null);
});
test('autoevaluaciones permiten repasar sin inventar aprobaciones automáticas',()=>{
 let current=apply(entry(),attempt(start,{mode:'self',selfResult:'passed',total:0,passed:0}),manual);
 current=apply(current,attempt(start+m.DAY,{mode:'self',selfResult:'passed',total:0,passed:0,kind:'review',reviewEdited:true}),manual);
 current=apply(current,attempt(start+4*m.DAY,{mode:'self',selfResult:'passed',total:0,passed:0,kind:'review',reviewEdited:true}),manual);
 assert.equal(current.learning.approved,false);assert.equal(m.isMastered(current,start+4*m.DAY),true);
 const topics=m.dashboard([manual],{stack:current},start+4*m.DAY);
 assert.equal(topics[0].selfMastered,1);assert.equal(topics[0].testable,0);assert.equal(topics[0].performance,null);
 const forbidden=apply(entry(),attempt(start,{mode:'self',selfResult:'passed'}));assert.equal(forbidden.learning.completed,false);
});
test('migración v2/v3 conserva declaraciones y aprobaciones sin fabricar repasos',()=>{
 const legacy=m.migrateLearning({status:'mastered',updated:new Date(start).toISOString()},manual,start+m.DAY);
 assert.equal(legacy.completed,true);assert.equal(legacy.approved,false);assert.equal(legacy.streak,0);
 const migrated=m.migrateLearning({status:'practicing',attempts:[attempt(start),attempt(start+m.DAY),attempt(start+4*m.DAY)]},ex,start+5*m.DAY);
 assert.equal(migrated.approved,true);assert.equal(migrated.stage,0);assert.equal(m.isMastered({learning:migrated},start+5*m.DAY),false);
 const guarded=m.cleanLearning({...migrated,stage:3,streak:5,lastQualifiedAt:'invalid'},ex,start+5*m.DAY);
 assert.equal(guarded.stage,0);assert.equal(guarded.streak,0);
});
test('fechas inválidas o futuras no acreditan aprendizaje ni rendimiento',()=>{
 const a=attempt(start+10*m.DAY);
 const current=m.applyAttempt(entry(),a,ex,start);
 assert.equal(current.learning.approved,false);
 assert.equal(m.dashboard([ex],{matrix:current},start)[0].assessedAttempts,0);
 const invalid=m.applyAttempt(entry(),{...attempt(start),at:'no es fecha'},ex,start);
 assert.equal(invalid.learning.completed,false);
});
test('métricas usan categorías reales, cobertura y denominadores independientes',()=>{
 const passed=apply(entry(),attempt(start));
 const failed=apply(passed,attempt(start+1000,{passed:1,failed:1,category:'logic',errorType:'AssertionError'}));
 const free=apply(failed,attempt(start+2000,{mode:'run',category:'execution',errorType:'IndexError'}));
 const ignored=apply(free,attempt(start+3000,{category:'infrastructure'}));
 const topics=m.dashboard([ex,manual],{matrix:ignored},start+4000);
 assert.deepEqual(topics.map(t=>t.topic),['matriz','pila-cola']);
 assert.equal(topics[0].completed,1);assert.equal(topics[0].approved,1);assert.equal(topics[0].mastered,0);
 assert.equal(topics[0].performance,1/2);assert.equal(topics[0].assessedAttempts,2);
 assert.deepEqual(topics[0].frequentErrors.map(e=>e.type).sort(),['AssertionError','IndexError']);
 const catalog=m.dashboard(data.exercises,{},start);
 assert.equal(catalog.length,7);assert.equal(catalog.reduce((n,t)=>n+t.total,0),148);
 assert.equal(catalog.reduce((n,t)=>n+t.testable,0),17);
});
test('repasos vencidos se priorizan, posponer no altera su calendario y se puede ignorar',()=>{
 const resolved=apply(entry(),attempt(start));
 const candidates=[manual,ex],entries={matrix:resolved};
 assert.equal(m.reviews(candidates,entries,start+m.DAY)[0].due,true);
 const suggested=m.recommend(candidates,entries,start+m.DAY);
 assert.equal(suggested[0].exercise.id,'matrix');assert.match(suggested[0].reasons.join(' '),/repaso/i);
 const postponed=m.postpone(resolved,start+m.DAY);assert.equal(postponed.learning.dueAt,resolved.learning.dueAt);
 assert.ok(!m.recommend(candidates,{matrix:postponed},start+m.DAY).some(r=>r.exercise.id==='matrix'));
 assert.ok(m.recommend(candidates,{matrix:postponed},start+2*m.DAY).some(r=>r.exercise.id==='matrix'));
 assert.equal(m.reviews(candidates,{matrix:postponed},start+m.DAY)[0].due,true);
});
test('recomendaciones explican ayuda, dificultades, inactividad y nivel del catálogo',()=>{
 const advanced={...ex,id:'advanced',level:'Integración'},base={...ex,id:'base',level:'Base'};
 let problem=apply(entry(),attempt(start,{passed:0,failed:2,category:'execution',errorType:'IndexError'}),advanced);
 problem=apply(problem,attempt(start+1000,{passed:0,failed:2,category:'execution',errorType:'IndexError'}),advanced);
 const suggestions=m.recommend([advanced,base],{advanced:problem},start+8*m.DAY);
 assert.match(suggestions.find(s=>s.exercise.id==='base').reasons.join(' '),/Integración/);
 assert.match(suggestions.find(s=>s.exercise.id==='advanced').reasons.join(' '),/IndexError/);
 assert.match(suggestions.find(s=>s.exercise.id==='advanced').reasons.join(' '),/semana/);
 const helped=apply(entry(),attempt(start,{assisted:true}));
 assert.match(m.recommend([ex],{matrix:helped},start)[0].reasons.join(' '),/ayuda/);
 assert.deepEqual(m.recommend([advanced,base],{advanced:problem},start+8*m.DAY),suggestions);
});
test('resumen mantiene aprendizaje tras acotar historial y respaldo v4 conserva calendario y borradores',()=>{
 let current=apply(entry(),attempt(start));
 for(let n=1;n<=40;n++)current=apply(current,attempt(start+n*1000,{mode:'run'}));
 assert.equal(current.attempts.length,30);assert.equal(current.learning.approved,true);
 const actual=data.exercises.find(e=>e.tests);
 const raw={version:4,exercises:{[actual.id]:{...current,code:'borrador',reviewCode:'repaso',session:{kind:'review',edited:true,startedAt:new Date(start).toISOString()}}}};
 const clean=p.validateState(raw,data.exercises);
 assert.equal(clean.exercises[actual.id].learning.dueAt,current.learning.dueAt);
 assert.equal(clean.exercises[actual.id].reviewCode,'repaso');assert.equal(clean.exercises[actual.id].session.kind,'review');
 assert.deepEqual(p.validateState(clean,data.exercises),clean);
 const before=JSON.stringify(raw);m.recommend(data.exercises,raw.exercises,start);assert.equal(JSON.stringify(raw),before);
});
test('desmarcar una declaración de completado puede quitar su repaso no evaluado',()=>{
 const completed=m.setCompleted(entry(),true,start);
 assert.equal(Date.parse(completed.learning.dueAt),start+m.DAY);
 const undo=m.setCompleted(completed,false,start);assert.equal(undo.learning.dueAt,null);
});
test('una sesión abierta no se vuelve a contar como repaso al ejecutarla varios días después',()=>{
 let current=apply(entry(),attempt(start));
 const first=attempt(start+m.DAY,{kind:'review',reviewEdited:true});
 current=apply(current,first);assert.equal(current.learning.stage,1);
 const repeated=apply(current,{...first,at:new Date(start+4*m.DAY).toISOString()});
 assert.equal(repeated.learning.stage,1);assert.equal(repeated.attempts.at(-1).reviewAdvanced,false);
 const fresh=apply(repeated,attempt(start+4*m.DAY,{kind:'review',reviewEdited:true}));assert.equal(fresh.learning.stage,2);
});
test('tipos de error importados no alteran prototipos de objetos',()=>{
 const malicious=apply(entry(),attempt(start,{passed:0,failed:2,category:'logic',errorType:'__proto__'}));
 const result=m.dashboard([ex],{matrix:malicious},start);
 assert.equal(result[0].frequentErrors[0].type,'__proto__');assert.equal(result[0].frequentErrors[0].count,1);
 assert.equal(Object.prototype.count,undefined);
});
test('el nivel siguiente se propone tras una resolución sin ayuda del nivel anterior',()=>{
 const base={...ex,id:'base',level:'Base'},practice={...ex,id:'practice',level:'Práctica'};
 const resolved=apply(entry(),attempt(start),base);
 const suggested=m.recommend([base,practice],{base:resolved},start);
 assert.equal(suggested[0].exercise.id,'practice');assert.match(suggested[0].reasons.join(' '),/resolver Base/);
});
