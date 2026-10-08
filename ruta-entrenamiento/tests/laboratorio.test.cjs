const {test}=require('node:test');
const assert=require('node:assert/strict');
const lab=require('../laboratorio.js');

test('matrices recorren filas o columnas sin repetir ni perder celdas y acumulan la región',()=>{
 for(const order of ['rows','columns'])for(const mode of ['all','principal','secondary','upper','neighbors']){
  const options={rows:3,cols:3,order,mode,center:[0,0]},first=lab.matrix(options),last=lab.matrix(options,9);
  assert.equal(first.accumulator,0);assert.equal(first.current,null);assert.equal(first.finished,false);
  assert.equal(last.visited.length,9);assert.equal(new Set(last.path.map(c=>c.i+','+c.j)).size,9);
  const expected={all:18,principal:6,secondary:6,upper:6,neighbors:2}[mode];
  assert.equal(last.total,expected);assert.equal(last.accumulator,expected);assert.equal(last.finished,true);
  for(let step=1;step<=9;step++)assert.deepEqual(lab.matrix(options,step).current,last.path[step-1]);
 }
 const rows=lab.matrix({rows:2,cols:3},2),cols=lab.matrix({rows:2,cols:3,order:'columns'},2);
 assert.deepEqual([rows.current.i,rows.current.j],[0,1]);assert.deepEqual([cols.current.i,cols.current.j],[1,0]);
});
test('matriz vacía, mínima, rectangular, vecinos y retroceso mantienen límites y neutro',()=>{
 const empty=lab.matrix({rows:0,cols:3},20);assert.equal(empty.finished,true);assert.equal(empty.total,0);assert.equal(empty.step,0);
 assert.equal(lab.matrix({rows:1,cols:1,mode:'neighbors'}).total,0);
 assert.equal(lab.matrix({rows:3,cols:4,mode:'principal'}).total,6);
 for(const mode of ['secondary','upper']){const invalid=lab.matrix({rows:3,cols:4,mode},12);assert.equal(invalid.valid,false);assert.equal(invalid.total,null);assert.equal(invalid.step,0);}
 assert.equal(lab.matrix({rows:3,cols:3,mode:'neighbors',center:[1,1]}).total,8);
 assert.equal(lab.matrix({rows:3,cols:3},-1).step,0);
 assert.equal(lab.matrix({rows:3,cols:3},999).step,9);
 assert.throws(()=>lab.matrix({rows:9,cols:2}));assert.throws(()=>lab.matrix({rows:3,cols:3,mode:'inventado'}));
});
test('teclado de matriz respeta filas, columnas, extremos y matrices vacías',()=>{
 assert.deepEqual(lab.moveCell(3,4,[0,0],'ArrowUp'),[0,0]);
 assert.deepEqual(lab.moveCell(3,4,[1,3],'ArrowRight'),[1,3]);
 assert.deepEqual(lab.moveCell(3,4,[1,2],'Home'),[1,0]);assert.deepEqual(lab.moveCell(3,4,[1,2],'End'),[1,3]);
 assert.deepEqual(lab.moveCell(3,4,[1,2],'Home',true),[0,0]);assert.deepEqual(lab.moveCell(3,4,[1,2],'End',true),[2,3]);
 assert.equal(lab.moveCell(0,4,[0,0],'ArrowDown'),null);assert.equal(lab.moveCell(3,4,[0,0],'Tab'),null);
});
test('Fibonacci y factorial muestran casos base y retornos con una pila coherente',()=>{
 for(const [kind,expected] of [['fibonacci',[0,1,1,2,3,5,8,13]],['factorial',[1,1,2,6,24,120,720,5040,40320]]]){
  for(const [n,result] of expected.entries()){
   const model=lab.recursion(kind,n);assert.equal(model.result,result);
   assert.equal(model.steps[0].stack.length,1);assert.deepEqual(model.steps.at(-1).stack,[]);
   assert.equal(model.steps.filter(s=>s.type==='enter').length,model.calls);
   assert.equal(model.steps.filter(s=>s.type==='return').length,model.calls);
   for(const step of model.steps.filter(s=>s.type==='return')){assert.equal(step.stack.at(-1).id,step.frameId);assert.equal(step.stack.at(-1).result,step.result);}
  }
 }
 const fib=lab.recursion('fibonacci',4);assert.equal(fib.calls,9);assert.equal(fib.repeated,4);
 assert.equal(fib.steps[0].stack[0].status,'active');assert.deepEqual(fib.steps[0].stack[0].children,[]);
 assert.ok(fib.steps.some(s=>s.stack.some(frame=>frame.status==='waiting')));
 assert.throws(()=>lab.recursion('fibonacci',8));assert.throws(()=>lab.recursion('factorial',-1));
});
test('suma recursiva acepta negativos y vacío, conserva parámetros y rechaza entradas excesivas',()=>{
 const source=[2,-3,4],model=lab.recursion('sum',source);assert.equal(model.result,3);assert.equal(model.calls,4);
 assert.deepEqual(source,[2,-3,4]);assert.deepEqual(model.steps[0].stack[0].params,source);
 assert.equal(lab.recursion('sum','').result,0);assert.equal(lab.recursion('sum',Array(8).fill(1000)).result,8000);
 for(const invalid of ['1,,2','a','1.5',Array(9).fill(1).join(','),'1001'])assert.throws(()=>lab.recursion('sum',invalid));
});
test('LIFO, FIFO y consultas conservan contenido, orden y snapshots anteriores',()=>{
 for(const [kind,expected] of [['stack',20],['queue',10]]){
  const initial=lab.sequence(kind),one=lab.sequenceOperation(initial,'insert','10'),two=lab.sequenceOperation(one,'insert','20');
  const peek=lab.sequenceOperation(two,'peek'),remove=lab.sequenceOperation(peek,'remove');
  assert.equal(peek.last.result,expected);assert.deepEqual(peek.values,[10,20]);assert.equal(remove.last.result,expected);
  assert.deepEqual(remove.values,kind==='stack'?[10]:[20]);assert.deepEqual(initial.values,[]);assert.deepEqual(one.values,[10]);
  assert.deepEqual(remove.history[0].values,[10]);assert.equal(lab.sequenceOperation(initial,'remove').last.ok,false);
 }
});
test('operaciones se acotan a ocho valores y doce eventos sin mutación o ejecución arbitraria',()=>{
 let model=lab.sequence();for(let n=0;n<8;n++)model=lab.sequenceOperation(model,'insert',n);
 const full=lab.sequenceOperation(model,'insert',9);assert.equal(full.last.ok,false);assert.deepEqual(full.values,model.values);
 for(let n=0;n<20;n++)model=lab.sequenceOperation(model,'peek');assert.equal(model.history.length,12);
 for(const value of ['1.2','Infinity','1e3','print(1)',1001])assert.throws(()=>lab.sequenceOperation(model,'insert',value));
});
test('TDA TP6 conserva insert, permite asignación y distingue get/remove ausentes',()=>{
 const empty=lab.collection(),first=lab.collectionOperation(empty,'insert','a','1');
 const duplicate=lab.collectionOperation(first,'insert','a','2');assert.equal(duplicate.entries[0].value,'1');
 const assigned=lab.collectionOperation(duplicate,'assign','a','3');assert.equal(assigned.entries[0].value,'3');assert.equal(first.entries[0].value,'1');
 assert.equal(lab.collectionOperation(empty,'find','a').last.ok,false);
 const absent=lab.collectionOperation(empty,'remove','a');assert.equal(absent.last.ok,true);assert.equal(absent.last.result,null);
 const removed=lab.collectionOperation(assigned,'remove','a');assert.equal(removed.last.result,'3');assert.deepEqual(removed.entries,[]);
});
test('dict y set respetan contratos nativos, duplicados y claves especiales sin contaminación',()=>{
 const dict=lab.collection('dict'),missing=lab.collectionOperation(dict,'find','x');assert.equal(missing.last.result,null);assert.equal(missing.last.ok,true);
 assert.equal(lab.collectionOperation(dict,'remove','x').last.ok,false);
 let map=lab.collectionOperation(dict,'insert','__proto__','texto');map=lab.collectionOperation(map,'insert','__proto__','otro');
 assert.equal(map.entries.length,1);assert.equal(map.entries[0].value,'otro');assert.equal({}.texto,undefined);
 const set=lab.collection('set'),one=lab.collectionOperation(set,'insert','x'),duplicate=lab.collectionOperation(one,'insert','x');
 assert.equal(duplicate.entries.length,1);assert.equal(lab.collectionOperation(duplicate,'find','x').last.result,true);
 assert.equal(lab.collectionOperation(set,'find','x').last.result,false);assert.equal(lab.collectionOperation(set,'remove','x').last.ok,true);
 assert.deepEqual(lab.collectionOperation(one,'remove','x').entries,[]);
});
test('colecciones limitan texto y registros, reemplazando claves aun al alcanzar el máximo',()=>{
 let model=lab.collection('dict');for(let n=0;n<8;n++)model=lab.collectionOperation(model,'insert',String(n),String(n));
 assert.equal(lab.collectionOperation(model,'insert','9','9').last.ok,false);
 assert.equal(lab.collectionOperation(model,'assign','1','reemplazo').entries[1].value,'reemplazo');
 for(let n=0;n<15;n++)model=lab.collectionOperation(model,'find','1');assert.equal(model.history.length,12);
 for(const key of ['', ' ', 'a'.repeat(41)])assert.throws(()=>lab.collectionOperation(model,'find',key));
 assert.throws(()=>lab.collectionOperation(model,'insert','a','v'.repeat(41)));
});
