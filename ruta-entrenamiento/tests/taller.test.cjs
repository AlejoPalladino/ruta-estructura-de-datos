const {test}=require('node:test');
const assert=require('node:assert/strict');
const workshop=require('../taller.js');
const data=[
 {id:'a',title:'Matriz',statement:'índice',source:'TP2',tags:[],topic:'matriz',scope:'recuperatorio',level:'Base',tests:'assert'},
 {id:'b',title:'Fibonacci',statement:'recursión',source:'TP4',tags:[],topic:'recursividad',scope:'recuperatorio',level:'Integración',tests:''},
 {id:'c',title:'Cola',statement:'FIFO',source:'TP5',tags:['insertar'],topic:'pila-cola',scope:'materia',level:'Práctica',tests:''}
];
test('búsqueda tolera acentos y combina tema, objetivo, estado, nivel y pruebas reales',()=>{
 assert.deepEqual(workshop.filter(data,{search:'indice'}).map(e=>e.id),['a']);
 assert.deepEqual(workshop.filter(data,{search:'insertar'}).map(e=>e.id),['c']);
 assert.deepEqual(workshop.filter(data,{topic:'matriz',scope:'recuperatorio',status:'review',level:'Base',tests:'yes'},id=>id==='a'?'review':'pending').map(e=>e.id),['a']);
 assert.deepEqual(workshop.filter(data,{tests:'no',scope:'recuperatorio'}).map(e=>e.id),['b']);
 assert.deepEqual(workshop.filter(data,{level:'Refuerzo'}),[]);
});
test('modo examen restringe y ordena según selección; scope mock conserva el preset',()=>{
 const options={examIds:['c','a']};assert.deepEqual(workshop.filter(data,options).map(e=>e.id),['c','a']);
 assert.deepEqual(workshop.filter(data,{...options,topic:'recursividad'}),[]);
 assert.deepEqual(workshop.filter(data,{scope:'mock',mockIds:['b']}).map(e=>e.id),['b']);
 assert.deepEqual(workshop.filter(data,{examIds:[]}),[]);assert.deepEqual(data.map(e=>e.id),['a','b','c']);
});
test('vecinos respetan extremos y una consigna excluida no provoca saltos',()=>{
 assert.deepEqual(workshop.neighbors(data,'a'),{index:0,total:3,previous:null,next:'b'});
 assert.deepEqual(workshop.neighbors(data,'c'),{index:2,total:3,previous:'b',next:null});
 assert.deepEqual(workshop.neighbors(data,'afuera'),{index:-1,total:3,previous:null,next:null});
 assert.deepEqual(workshop.neighbors([],'a'),{index:-1,total:0,previous:null,next:null});
});
test('preferencias opcionales mantienen distribución anterior y validan solo valores permitidos',()=>{
 assert.deepEqual(workshop.cleanPreferences(),{layout:'stacked',catalogCollapsed:false,mapView:'grafo',mapDensity:'media'});
 assert.deepEqual(workshop.cleanPreferences({layout:'split',catalogCollapsed:true}),{layout:'split',catalogCollapsed:true,mapView:'grafo',mapDensity:'media'});
 assert.deepEqual(workshop.cleanPreferences({layout:'inventada',catalogCollapsed:'false'}),{layout:'stacked',catalogCollapsed:false,mapView:'grafo',mapDensity:'media'});
});
