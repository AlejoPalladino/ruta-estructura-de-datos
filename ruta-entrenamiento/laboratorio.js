'use strict';
(function(root){
 const MAX_VALUES=8;
 function integer(value,min=-1000,max=1000){
  const text=String(value).trim();
  if(!/^-?\d+$/.test(text)||!Number.isSafeInteger(Number(text))||Number(text)<min||Number(text)>max)throw Error('Ingresá un entero entre '+min+' y '+max+'.');
  return Number(text);
 }
 function numberList(value){
  if(!String(value).trim())return [];
  const items=String(value).split(',');
  if(items.length>MAX_VALUES)throw Error('Usá hasta ocho valores separados por comas.');
  return items.map(item=>integer(item));
 }
 function matrix({rows,cols,order='rows',mode='all',center=[0,0]},step=0){
  rows=integer(rows,0,5);cols=integer(cols,0,5);
  if(!['rows','columns'].includes(order)||!['all','principal','secondary','upper','neighbors'].includes(mode))throw Error('Elegí un recorrido y una región disponibles.');
  const square=rows===cols,valid=square||!['secondary','upper'].includes(mode);
  const eligible=(i,j)=>mode==='all'||mode==='principal'&&i===j||mode==='secondary'&&square&&i+j===rows-1||mode==='upper'&&square&&j>i||mode==='neighbors'&&Math.abs(i-center[0])+Math.abs(j-center[1])===1;
  const cells=Array.from({length:rows*cols},(_,k)=>{const i=Math.floor(k/cols),j=k%cols;return {i,j,value:i+j,included:eligible(i,j)};});
  const path=(order==='rows'?cells:cells.slice().sort((a,b)=>a.j-b.j||a.i-b.i));
  const position=valid?Math.min(path.length,Math.max(0,Number.isInteger(step)?step:0)):0;
  const visited=path.slice(0,position),current=visited.at(-1)||null;
  const total=valid?cells.filter(c=>c.included).reduce((sum,c)=>sum+c.value,0):null;
  return {rows,cols,cells,path,valid,step:position,current,visited,total,
   accumulator:visited.filter(c=>c.included).reduce((sum,c)=>sum+c.value,0),finished:valid&&position===path.length};
 }
 function moveCell(rows,cols,cell,key,ctrl=false){
  if(!rows||!cols)return null;
  const [i,j]=cell;
  const moved={ArrowUp:[i-1,j],ArrowDown:[i+1,j],ArrowLeft:[i,j-1],ArrowRight:[i,j+1],
   Home:ctrl?[0,0]:[i,0],End:ctrl?[rows-1,cols-1]:[i,cols-1]}[key];
  return moved?[Math.min(rows-1,Math.max(0,moved[0])),Math.min(cols-1,Math.max(0,moved[1]))]:null;
 }
 function recursion(kind,input){
  if(!['fibonacci','factorial','sum'].includes(kind))throw Error('Ejemplo recursivo no disponible.');
  const data=kind==='sum'?(Array.isArray(input)?input.slice():numberList(input)):integer(input,0,kind==='fibonacci'?7:8);
  if(kind==='sum'&&(data.length>MAX_VALUES||data.some(n=>!Number.isInteger(n)||Math.abs(n)>1000)))throw Error('Usá hasta ocho enteros entre −1000 y 1000.');
  const stack=[],steps=[],counts=new Map();let nextId=0;
  const name={fibonacci:'F',factorial:'factorial',sum:'suma'}[kind];
  const parameters=value=>Array.isArray(value)?'['+value.join(', ')+']':String(value);
  function snapshot(type,frame,text,result=null){
   steps.push({type,text,result,depth:frame.depth,frameId:frame.id,
    stack:stack.map(call=>({...call,params:Array.isArray(call.params)?call.params.slice():call.params,children:call.children.slice()}))});
  }
  function visit(value,depth=0){
   const base=kind==='sum'?value.length===0:kind==='fibonacci'?value<=1:value===0;
   const frame={id:nextId++,name,params:Array.isArray(value)?value.slice():value,depth,base,children:[],status:'active',result:null};
   stack.push(frame);const signature=parameters(value);counts.set(signature,(counts.get(signature)||0)+1);
   snapshot('enter',frame,'Entra '+name+'('+signature+')');
   let result;
   if(base){result=kind==='sum'?0:kind==='factorial'?1:value;snapshot('base',frame,'Caso base: resultado directo '+result,result);}
   else{
    frame.status='waiting';
    const child=visit(kind==='sum'?value.slice(1):value-1,depth+1);frame.children.push(child);
    if(kind==='fibonacci'){const other=visit(value-2,depth+1);frame.children.push(other);result=child+other;}
    else result=kind==='sum'?value[0]+child:value*child;
    frame.status='active';snapshot('combine',frame,'Combina '+name+'('+signature+') con retorno(s) '+frame.children.join(', ')+' → '+result,result);
   }
   frame.status='returning';frame.result=result;snapshot('return',frame,'Retorna '+name+'('+signature+') = '+result,result);stack.pop();
   return result;
  }
  const result=visit(data);
  steps.push({type:'done',text:'Resultado final: '+result,result,depth:0,frameId:null,stack:[]});
  return {kind,name,input:data,result,steps,calls:nextId,repeated:[...counts.values()].reduce((sum,n)=>sum+Math.max(0,n-1),0)};
 }
 function sequence(kind='stack'){
  if(!['stack','queue'].includes(kind))throw Error('Estructura no disponible.');
  return {kind,values:[],history:[],last:null};
 }
 function sequenceOperation(state,operation,value){
  const values=state.values.slice();let result=null,ok=true,message;
  if(operation==='insert'){
   const item=integer(value);
   if(values.length>=MAX_VALUES){ok=false;message='Límite visual de ocho elementos; extraé uno para continuar.';}
   else {values.push(item);message=(state.kind==='stack'?'Apilaste ':'Encolaste ')+item+'.';}
  }else if(operation==='remove'||operation==='peek'){
   if(!values.length){ok=false;message='La estructura está vacía: no hay elemento para '+(operation==='peek'?'consultar.':'extraer.');}
   else{
    result=state.kind==='stack'?values.at(-1):values[0];
    if(operation==='remove'){if(state.kind==='stack')values.pop();else values.shift();}
    message=(operation==='peek'?'Consulta sin modificar: ':'Elemento extraído: ')+result+'.';
   }
  }else throw Error('Operación no disponible.');
  const last={operation,result,ok,message,values:values.slice()};
  return {...state,values,last,history:[...state.history,last].slice(-12)};
 }
 function collection(kind='tda-map'){
  if(!['tda-map','dict','set'].includes(kind))throw Error('Colección no disponible.');
  return {kind,entries:[],history:[],last:null};
 }
 function collectionOperation(state,operation,key,value=''){
  key=String(key).trim();value=String(value);
  if(!key||key.length>40||value.length>40)throw Error('Usá una clave o elemento de 1 a 40 caracteres y un valor de hasta 40.');
  const entries=state.entries.map(item=>({...item})),index=entries.findIndex(item=>item.key===key),exists=index!==-1;
  let result=null,ok=true,message;
  if(operation==='insert'||operation==='assign'){
   if(!exists&&entries.length>=MAX_VALUES){ok=false;message='Límite visual de ocho entradas; eliminá una para continuar.';}
   else if(state.kind==='set'){
    if(!exists)entries.push({key,value:null});
    message=exists?'El elemento ya estaba; el conjunto no agrega un duplicado.':'Elemento agregado al conjunto.';
   }else if(state.kind==='tda-map'&&operation==='insert'&&exists){
    result=entries[index].value;message='insert conserva el valor existente en el TDA del TP6: '+result+'.';
   }else{
    if(exists)entries[index]={key,value};else entries.push({key,value});
    message=exists?'Valor reemplazado para esa clave.':'Par clave–valor agregado.';
   }
  }else if(operation==='find'){
   if(state.kind==='set'){result=exists;message=exists?'El elemento pertenece al conjunto.':'El elemento no pertenece al conjunto.';}
   else if(exists){result=entries[index].value;message='Valor encontrado: '+result+'.';}
   else if(state.kind==='dict'){message='dict.get devuelve None cuando falta la clave.';}
   else {ok=false;message='El TDA del TP6 lanza una excepción cuando get no encuentra la clave.';}
  }else if(operation==='remove'){
   if(exists){result=state.kind==='set'?null:entries[index].value;entries.splice(index,1);message='Entrada eliminada.';}
   else if(state.kind==='dict'){ok=false;message='dict.pop sin valor predeterminado lanza KeyError si falta la clave.';}
   else message=state.kind==='set'?'discard no cambia el conjunto si falta el elemento.':'remove no cambia el TDA si falta la clave; devuelve None.';
  }else throw Error('Operación no disponible.');
  const last={operation,key,result,ok,message,entries:entries.map(item=>({...item}))};
  return {...state,entries,last,history:[...state.history,last].slice(-12)};
 }
 const api={MAX_VALUES,integer,numberList,matrix,moveCell,recursion,sequence,sequenceOperation,collection,collectionOperation};
 root.TrainingLab=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
