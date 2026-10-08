const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const p=require('../pedagogia.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../datos.js'),'utf8').replace(/^window.TRAINING_DATA = /,'').replace(/;\s*$/,''));

test('migración v2 conserva borradores, notas, entradas, dominio declarado y selección',()=>{
 const ex=data.exercises[0];
 const old={version:2,selected:ex.id,log:'índices',exercises:{[ex.id]:{status:'mastered',code:'print(1)',notes:'nota',stdin:'4',updated:'2026-10-07'}}};
 const migrated=p.validateState(old,data.exercises);
 assert.equal(migrated.version,5);assert.equal(migrated.selected,ex.id);
 for(const key of ['status','code','notes','stdin','updated'])assert.equal(migrated.exercises[ex.id][key],old.exercises[ex.id][key]);
 assert.equal(migrated.exercises[ex.id].help.unlocked,0);
 assert.deepEqual(p.validateState(migrated,data.exercises),migrated);
 assert.equal(old.version,2);
});
test('rechaza versiones o estructuras corruptas sin aceptar prototipos ni IDs ajenos',()=>{
 for(const bad of [null,{}, {version:6,exercises:{}},{version:3,exercises:[]}])assert.throws(()=>p.validateState(bad,data.exercises));
 const ex=data.exercises[0];
 const clean=p.validateState({version:3,selected:'inventado',exercises:{inventado:{code:'x'},[ex.id]:{status:'inventado',help:{unlocked:-1,used:'7'}}}},data.exercises);
 assert.deepEqual(Object.keys(clean.exercises),[ex.id]);assert.equal(clean.exercises[ex.id].status,'pending');
 assert.equal(clean.exercises[ex.id].help.used,0);assert.equal(clean.selected,undefined);
 const inherited=Object.create({[ex.id]:{code:'bad'}});
 assert.deepEqual(p.validateState({version:3,exercises:inherited},data.exercises).exercises,{});
});
test('tres niveles en todos los ejercicios, secuenciales y sin duplicar conteo al reabrir',()=>{
 for(const ex of data.exercises){const hints=p.hintsFor(ex);assert.equal(hints.length,3);assert.deepEqual(hints.map(h=>h.level),[1,2,3]);assert.ok(hints[0].body.includes('¿'));assert.ok(hints.every(h=>h.body.length>20));assert.ok(!hints[2].body.includes('def '));}
 let help=p.cleanHelp();for(let i=0;i<5;i++)help=p.unlockHint(help);
 assert.equal(help.unlocked,3);assert.equal(help.used,3);
 assert.equal(p.needsRetry({unlocked:1}),false);assert.equal(p.needsRetry({unlocked:2}),true);
 assert.equal(p.needsRetry({solutionViewed:true}),true);assert.equal(p.needsRetry({originalViewed:true}),true);
});
test('reportes importados recalculan conteos, acotan textos e historial y preservan asistencia',()=>{
 const ex=data.exercises[0];
 const report={mode:'tests',passed:999,cases:[{status:'passed',actual:'1',expected:'1'},{status:'failed',input:'x'.repeat(5000),error:{category:'logic',message:'difiere'}}],durationMs:-2};
 const entry={status:'review',help:{unlocked:2,used:9,solutionViewed:true},lastReport:report,lastRunCode:'x',attempts:Array.from({length:50},()=>({mode:'tests',at:'hoy',passed:1,assisted:true,helpLevel:2}))};
 const clean=p.validateState({version:3,exercises:{[ex.id]:entry}},data.exercises).exercises[ex.id];
 assert.equal(clean.lastReport.passed,1);assert.equal(clean.lastReport.failed,1);assert.equal(clean.lastReport.total,2);
 assert.equal(clean.lastReport.cases[1].input.length,2500);assert.equal(clean.lastReport.durationMs,null);
 assert.equal(clean.attempts.length,30);assert.equal(clean.help.used,9);assert.equal(clean.help.solutionViewed,true);
 assert.deepEqual(p.validateState({version:4,exercises:{[ex.id]:clean}},data.exercises).exercises[ex.id],clean);
});
test('diagnóstico diferencia sintaxis, ejecución, lógica e infraestructura sin usar soluciones',()=>{
 const ex={topic:'recursividad',solution:'SECRETO'};
 const reports=['syntax','execution','logic','timeout','cancelled','infrastructure'].map(category=>({mode:'tests',cases:[],error:{category,type:category==='execution'?'IndexError':'Error',line:3},skipped:2}));
 for(const report of reports){const advice=p.diagnose(report,'print(x)',ex).join(' ');assert.ok(advice.length>50);assert.ok(!advice.includes('SECRETO'));assert.ok(advice.includes('2 casos'));}
 const report={mode:'tests',cases:[{status:'failed',actual:'None',error:{category:'logic'}}],skipped:0};
 assert.match(p.diagnose(report,'',ex).join(' '),/return/);
 assert.match(p.diagnose({mode:'run',cases:[],skipped:0},'',ex).join(' '),/no verifica/);
});
test('casos límite solo amplían ejercicios que ya tienen contrato automático',()=>{
 const original=data.exercises.map(ex=>ex.tests);
 for(const ex of data.exercises){const tests=p.testsFor(ex);if(ex.tests)assert.ok(tests.startsWith(ex.tests));else assert.equal(tests,'');}
 assert.deepEqual(data.exercises.map(ex=>ex.tests),original);
});
test('preferencias opcionales v5 sobreviven validación sin imponer cambios a respaldos anteriores',()=>{
 const source={version:5,exercises:{},preferences:{layout:'split',catalogCollapsed:true,desconocido:'ignorar'}};
 const validated=p.validateState(source,data.exercises);
 assert.deepEqual(validated.preferences,{layout:'split',catalogCollapsed:true});assert.deepEqual(p.validateState(validated,data.exercises),validated);
 assert.deepEqual(p.validateState({...source,preferences:{layout:'no existe',catalogCollapsed:'sí'}},data.exercises).preferences,{layout:'stacked',catalogCollapsed:false});
 assert.equal(Object.hasOwn(p.validateState({version:2,exercises:{}},data.exercises),'preferences'),false);
});
