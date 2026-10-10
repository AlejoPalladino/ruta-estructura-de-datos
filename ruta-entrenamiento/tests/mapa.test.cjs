const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context=vm.createContext({});context.window=context;
for(const name of ['datos.js','mapa.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
const {TrainingMap:map,TRAINING_DATA:data}=context;

test('atlas conserva cada ejercicio exactamente una vez en las seis combinaciones',()=>{
 const ids=data.exercises.map(ex=>ex.id).sort();
 for(const view of ['grafo','subte'])for(const density of ['compacta','media','aireada']){
  const result=map.layout(data,view,density);
  assert.equal(JSON.stringify(result.stations.map(s=>s.id).sort()),JSON.stringify(ids));
  assert.equal(result.labels.length,11);
  for(const station of result.stations){
   assert.ok(Number.isFinite(station.x)&&Number.isFinite(station.y));
   assert.ok(station.x>0&&station.x<result.width);
   assert.ok(station.y>0&&station.y<result.height);
   assert.equal(map.topicFor(data.exercises.find(ex=>ex.id===station.id)),station.topic);
  }
 }
});

test('densidad cambia el espacio real y grafo/subte cambian la distribución',()=>{
 const compact=map.layout(data,'grafo','compacta'),airy=map.layout(data,'grafo','aireada');
 const distance=(p,c)=>Math.hypot(p.x-c[0],p.y-c[1]);
 assert.ok(distance(airy.labels[0],airy.center)>distance(compact.labels[0],compact.center));
 assert.ok(map.layout(data,'subte','aireada').height>map.layout(data,'subte','compacta').height);
 assert.notEqual(JSON.stringify(compact.stations),JSON.stringify(map.layout(data,'subte','compacta').stations));
});

test('Fibonacci e integración no duplican estaciones de sus temas de origen',()=>{
 const ids=map.nodes.flatMap(node=>map.exercisesFor(node,data).map(ex=>ex.id));
 assert.equal(ids.length,148);assert.equal(new Set(ids).size,148);
 assert.equal(map.exercisesFor(map.nodes.find(n=>n.id==='fibonacci'),data).length,2);
 assert.equal(map.nodes.filter(n=>n.future).flatMap(n=>map.exercisesFor(n,data)).length,0);
});
