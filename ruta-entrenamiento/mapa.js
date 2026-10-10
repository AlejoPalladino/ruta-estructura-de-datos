'use strict';
(function(root){
 const nodes=[
  {id:'python',title:'Python',line:'base',graph:[0,1],metro:[0,1],desc:'Tipos, condiciones, ciclos y funciones: el lenguaje para construir el resto.'},
  {id:'vector',title:'Vectores',line:'base',graph:[1,0],metro:[1,1],desc:'Índices, recorridos y acumuladores sobre una dimensión.'},
  {id:'matriz',title:'Matrices',line:'base',graph:[2,0],metro:[2,1],desc:'Filas, columnas, diagonales y regiones. Extendé los recorridos a dos dimensiones.'},
  {id:'recursividad',title:'Recursividad',line:'recursion',graph:[1,2],metro:[1,2],desc:'Caso base, reducción y retorno. Descomponé un problema en versiones más pequeñas.'},
  {id:'fibonacci',title:'Fibonacci',line:'recursion',graph:[2,3],metro:[2,2],desc:'Dos ramas recursivas, subproblemas repetidos y una alternativa con acumuladores.'},
  {id:'tda',title:'TDA',line:'structures',graph:[1,1],metro:[1,0],desc:'Definí un contrato y separá la interfaz de su implementación.'},
  {id:'pila-cola',title:'Pilas y colas',line:'structures',graph:[2,1],metro:[2,0],desc:'LIFO y FIFO: elegí la estructura según el orden de acceso.'},
  {id:'diccionario',title:'Diccionarios y conjuntos',line:'structures',graph:[3,0],metro:[3,0],desc:'Claves únicas, asociaciones y operaciones entre conjuntos.'},
  {id:'integracion',title:'Integración · parcial',line:'base',graph:[3,2],metro:[3,1],desc:'Combiná recorridos, recursividad y contratos en intervalo creciente, matrices y TDA Puerto.'},
  {id:'listas',title:'Listas recursivas',line:'recursion',graph:[3,3],metro:[3,2],desc:'Continuidad del cronograma: estructuras dinámicas y su recorrido recursivo.',future:true},
  {id:'arboles',title:'Árboles',line:'recursion',graph:[4,3],metro:[4,2],desc:'Continuidad del cronograma: árboles binarios, búsqueda y borrado.',future:true}
 ];
 const lines={base:{label:'A · Datos y recorridos',color:'#b6ed93'},recursion:{label:'B · Recursividad',color:'#a3c9f8'},structures:{label:'C · Abstracción',color:'#f4bf84'}};
 // Suggested learning relationships, not requirements that lock practice.
 const edges=[['python','vector','base'],['vector','matriz','base'],['matriz','integracion','base'],
  ['python','recursividad','recursion'],['recursividad','fibonacci','recursion'],['recursividad','listas','recursion'],['listas','arboles','recursion'],
  ['python','tda','structures'],['tda','pila-cola','structures'],['pila-cola','diccionario','structures'],
  ['tda','integracion','structures'],['recursividad','integracion','recursion'],['pila-cola','listas','structures']];
 const densities={compacta:{x:210,y:112},media:{x:240,y:145},aireada:{x:285,y:185}};
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function exercisesFor(node,data){
  if(node.future)return [];
  if(node.id==='fibonacci')return data.exercises.filter(ex=>ex.id==='TP_4_Recursividad_Com_5-3'||ex.id==='refuerzo-fib-lineal');
  if(node.id==='integracion')return data.exercises.filter(ex=>ex.source==='Practica_Parcial_1.ipynb'||ex.id==='refuerzo-suma-matriz');
  return data.exercises.filter(ex=>ex.topic===node.id);
 }
 function create({$,data,getState,save,openExercise,openSchedule}){
  let selected='matriz';
  function preferences(){const p=getState().preferences;return {view:p?.mapView==='subte'?'subte':'grafo',density:densities[p?.mapDensity]?p.mapDensity:'media'};}
  function render(){
   const {view,density}=preferences(),spacing=densities[density],width=spacing.x*4+210,height=spacing.y*(view==='grafo'?3:2)+(view==='grafo'?116:150);
   const point=node=>{const [x,y]=node[view==='grafo'?'graph':'metro'];return [105+x*spacing.x,58+y*spacing.y];};
   const byId=Object.fromEntries(nodes.map(node=>[node.id,node]));
   $('map-canvas').style.width=width+'px';$('map-canvas').style.height=height+'px';
   $('map-canvas').dataset.view=view;$('map-canvas').dataset.density=density;
   for(const choice of ['grafo','subte'])$('map-'+choice).setAttribute('aria-pressed',String(choice===view));
   for(const choice of Object.keys(densities))$('map-'+choice).setAttribute('aria-pressed',String(choice===density));
   $('map-lines').setAttribute('viewBox',`0 0 ${width} ${height}`);
   $('map-lines').innerHTML=edges.map(([from,to,line])=>{
    const [x,y]=point(byId[from]),[tx,ty]=point(byId[to]);
    const middle=(x+tx)/2,turn=24*Math.sign(ty-y);
    const path=view==='grafo'?`M ${x} ${y} C ${(x+tx)/2} ${y}, ${(x+tx)/2} ${ty}, ${tx} ${ty}`:
     (y===ty?`M ${x} ${y} H ${tx}`:`M ${x} ${y} H ${middle-24} L ${middle} ${y+turn} V ${ty-turn} L ${middle+24} ${ty} H ${tx}`);
    return `<path d="${path}" stroke="${lines[line].color}" class="${from===selected||to===selected?'map-connected':''}"/>`;
   }).join('');
   $('map-nodes').innerHTML=nodes.map(node=>{
    const [x,y]=point(node),group=exercisesFor(node,data),done=group.filter(ex=>root.TrainingLearning.isMastered(getState().exercises[ex.id])).length;
    return `<button type="button" class="map-node" data-map-topic="${node.id}" aria-pressed="${node.id===selected}" aria-controls="map-detail" style="left:${x}px;top:${y}px;--topic-color:${lines[node.line].color}"><span class="map-station" aria-hidden="true"></span><strong>${escape(node.title)}</strong><small>${node.future?'En el cronograma':done+'/'+group.length+' consolidados'}</small></button>`;
   }).join('');
   const node=byId[selected],group=exercisesFor(node,data);
   $('map-topic-title').textContent=node.title;$('map-topic-description').textContent=node.desc;
   const relation=(index)=>edges.filter(edge=>edge[index]===selected).map(edge=>byId[edge[1-index]].title).join(' · ')||'—';
   $('map-before').textContent=relation(1);$('map-after').textContent=relation(0);
   $('map-practice').textContent=node.future?'Ver en el cronograma →':'Practicar '+node.title+' →';
   $('map-practice').disabled=!node.future&&!group.length;
  }
  for(const view of ['grafo','subte'])$('map-'+view).addEventListener('click',()=>{getState().preferences={...getState().preferences,mapView:view};save();render();});
  for(const density of Object.keys(densities))$('map-'+density).addEventListener('click',()=>{getState().preferences={...getState().preferences,mapDensity:density};save();render();});
  $('map-nodes').addEventListener('click',event=>{
   const button=event.target.closest('[data-map-topic]');if(!button||!nodes.some(node=>node.id===button.dataset.mapTopic))return;
   selected=button.dataset.mapTopic;render();
   $('map-nodes').querySelector(`[data-map-topic="${selected}"]`)?.focus({preventScroll:true});
  });
  $('map-practice').addEventListener('click',()=>{
   const node=nodes.find(node=>node.id===selected);if(node.future){openSchedule();return;}
   const group=exercisesFor(node,data),next=group.find(ex=>!root.TrainingLearning.isMastered(getState().exercises[ex.id]))||group[0];
   if(next)openExercise(next.id);
  });
  return {render};
 }
 root.TrainingMap={create,nodes,edges,exercisesFor};
})(globalThis);
