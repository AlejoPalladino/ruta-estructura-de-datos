'use strict';
(function(root){
 const LAB=root.TrainingLab;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function create({$,openExercise,findId}){
  let matrixCell=[0,0],matrixStep=0,fibStep=0,sumStep=0,fib,sum;
  let sequence=LAB.sequence(),collection=LAB.collection();
  function matrixConfig(){
   const [rows,cols]=$('matrix-shape').value.split(',').map(Number);
   return {rows,cols,mode:$('matrix-mode').value,order:$('matrix-order').value||'rows',center:matrixCell};
  }
  function renderMatrix(focus=false){
   const config=matrixConfig(),{rows,cols,mode,order}=config;
   if(matrixCell[0]>=rows||matrixCell[1]>=cols)matrixCell=[0,0];
   config.center=matrixCell;
   const model=LAB.matrix(config,matrixStep);matrixStep=model.step;
   const visited=new Set(model.visited.map(c=>c.i+','+c.j));
   $('matrix-grid').style.gridTemplateColumns=`repeat(${Math.max(1,cols)},minmax(0,1fr))`;
   $('matrix-grid').innerHTML=model.cells.map(c=>{
    const cell=c.i+','+c.j,selected=cell===matrixCell.join(','),current=cell===[model.current?.i,model.current?.j].join(',');
    return `<button data-cell="${cell}" tabindex="${selected?0:-1}" class="matrix-cell ${c.included?'lit':''} ${selected?'selected':''} ${visited.has(cell)?'visited':''} ${current?'current':''}" aria-pressed="${selected}" ${current?'aria-current="step"':''} aria-label="Fila ${c.i}, columna ${c.j}, valor ${c.value}, ${c.included?'en la región':'fuera de la región'}, ${visited.has(cell)?'visitada':'sin visitar'}${current?', paso actual':''}">(${c.i}, ${c.j})<br>${c.value}${visited.has(cell)?'<span aria-hidden="true"> ✓</span>':''}</button>`;
   }).join('')||'<p>Matriz vacía: no hay celdas que visitar.</p>';
   const info={all:'Cada valor es i + j.',principal:'Principal: i == j; en rectangular llega hasta min(filas, columnas).',secondary:'Secundaria cuadrada: i + j == filas − 1.',upper:'Triángulo superior cuadrado: j > i, sin diagonal principal.',neighbors:`Vecinos de (${matrixCell.join(', ')}): distancia Manhattan = 1 y dentro de los límites.`};
   $('matrix-explanation').textContent=`Forma (${rows}, ${cols}). ${info[mode]} `+(model.valid?'Se visitan todas las celdas y se suman solo las de la región.':'Este patrón requiere una matriz cuadrada. Elegí 3 × 3 o 1 × 1.');
   $('matrix-progress').textContent=model.valid?`Paso ${model.step}/${model.path.length} · índices ${model.current?'i='+model.current.i+', j='+model.current.j:'todavía sin visitar'} · acumulador = ${model.accumulator}`+(model.finished?` · resultado final = ${model.total}`:''):'Recorrido detenido: forma incompatible con esta región.';
   $('matrix-prev').disabled=!model.valid||matrixStep===0;
   $('matrix-next').disabled=!model.valid||model.finished;
   const condition={all:'True',principal:'i == j',secondary:'i + j == filas - 1',upper:'j > i',neighbors:`abs(i - ${matrixCell[0]}) + abs(j - ${matrixCell[1]}) == 1`}[mode];
   const loops=order==='rows'?'for i in range(filas):\n    for j in range(columnas):':'for j in range(columnas):\n    for i in range(filas):';
   $('matrix-code').textContent=model.valid?`filas, columnas = m.shape\nacumulador = 0\n${loops}\n        if ${condition}:\n            acumulador += m[i, j]\n# Resultado al terminar el recorrido`:'# Este patrón requiere una matriz cuadrada.\nif filas != columnas:\n    raise ValueError("se requiere matriz cuadrada")';
   if(focus)$('matrix-grid').querySelector?.(`[data-cell="${matrixCell.join(',')}"]`)?.focus();
  }
  function resetMatrix(){matrixStep=0;renderMatrix();}
  $('matrix-grid').addEventListener('click',event=>{
   const button=event.target.closest('[data-cell]');if(!button)return;
   matrixCell=button.dataset.cell.split(',').map(Number);matrixStep=0;renderMatrix(true);
  });
  $('matrix-grid').addEventListener('keydown',event=>{
   const button=event.target.closest('[data-cell]');if(!button)return;
   const {rows,cols}=matrixConfig(),next=LAB.moveCell(rows,cols,button.dataset.cell.split(',').map(Number),event.key,event.ctrlKey);
   if(next){event.preventDefault();matrixCell=next;matrixStep=0;renderMatrix(true);}
  });
  for(const id of ['matrix-shape','matrix-mode','matrix-order'])$(id).addEventListener('change',resetMatrix);
  $('matrix-next').addEventListener('click',()=>{matrixStep++;renderMatrix();});
  $('matrix-prev').addEventListener('click',()=>{matrixStep--;renderMatrix();});
  $('matrix-reset').addEventListener('click',resetMatrix);
  $('matrix-practice').addEventListener('click',()=>openExercise(findId('TP_2_Arreglos',12)));
  function renderRecursion(prefix,model,position){
   const step=model.steps[position];
   $(prefix+'-summary').textContent=`Paso ${position+1}/${model.steps.length}: ${step.text}. ${model.calls} llamadas en total; ${model.repeated} repiten parámetros.`;
   $(prefix+'-stack').innerHTML=step.stack.length?'<ol>'+step.stack.slice().reverse().map(call=>`<li><strong>${esc(call.name)}(${esc(Array.isArray(call.params)?'['+call.params.join(', ')+']':call.params)})</strong><span>${call.base?'Caso base · ':''}${({active:'en ejecución',waiting:'espera un retorno',returning:'retorna '+call.result})[call.status]}</span>${call.children.length?'<small>Retornos recibidos: '+esc(call.children.join(', '))+'</small>':''}</li>`).join('')+'</ol>':'<p>Pila vacía. Resultado final: '+model.result+'.</p>';
   $(prefix+'-trace').innerHTML=model.steps.slice(0,position+1).map((s,i)=>`<div class="${s.type==='return'||s.type==='done'?'return':'enter'} ${i===position?'current':''}" style="padding-left:${s.depth*13}px">${esc(s.text)}</div>`).join('');
   $(prefix+'-trace').scrollTop=$(prefix+'-trace').scrollHeight;
   $(prefix+'-prev').disabled=position===0;$(prefix+'-next').disabled=position===model.steps.length-1;
  }
  function buildFib(){
   const kind=$('recursion-kind').value||'fibonacci',max=kind==='fibonacci'?7:8;
   $('fib-n').max=max;$('fib-n').value=Math.min(max,Number($('fib-n').value)||0);
   fib=LAB.recursion(kind,$('fib-n').value);fibStep=0;$('fib-n-label').textContent=fib.input;
   $('fib-values').innerHTML=Array.from({length:max+1},(_,n)=>`<span class="${n===fib.input?'selected':''}">${kind==='fibonacci'?'F':'factorial'}(${n})=${LAB.recursion(kind,n).result}</span>`).join('');
   $('recursion-contract').textContent=kind==='fibonacci'?'F(0)=0, F(1)=1. Para n≥2, F(n)=F(n−1)+F(n−2). La versión ingenua repite subproblemas.':'factorial(0)=1. Para n>0, factorial(n)=n × factorial(n−1). El problema se reduce en cada llamada.';
   $('fib-practice').textContent=kind==='fibonacci'?'Practicar Fibonacci →':'Practicar factorial →';
   renderRecursion('fib',fib,fibStep);
  }
  function buildSum(){
   try{sum=LAB.recursion('sum',$('sum-input').value);sumStep=0;$('sum-error').textContent='';renderRecursion('sum',sum,sumStep);}
   catch(error){$('sum-error').textContent=error.message;}
  }
  for(const prefix of ['fib','sum']){
   $(prefix+'-next').addEventListener('click',()=>{if(prefix==='fib')renderRecursion(prefix,fib,++fibStep);else renderRecursion(prefix,sum,++sumStep);});
   $(prefix+'-prev').addEventListener('click',()=>{if(prefix==='fib')renderRecursion(prefix,fib,--fibStep);else renderRecursion(prefix,sum,--sumStep);});
   $(prefix+'-reset').addEventListener('click',()=>{if(prefix==='fib'){fibStep=0;renderRecursion(prefix,fib,0);}else{sumStep=0;renderRecursion(prefix,sum,0);}});
  }
  $('fib-n').addEventListener('input',buildFib);$('recursion-kind').addEventListener('change',buildFib);
  $('sum-apply').addEventListener('click',buildSum);
  $('fib-practice').addEventListener('click',()=>openExercise(findId('TP_4_Recursividad',$('recursion-kind').value==='factorial'?1:3)));
  $('sum-practice').addEventListener('click',()=>openExercise(findId('TP_4_Recursividad',13)));
  function renderSequence(){
   const stack=sequence.kind==='stack',values=stack?sequence.values.slice().reverse():sequence.values;
   $('sequence-values').className='sequence-values '+(stack?'stack-values':'queue-values');
   $('sequence-values').innerHTML=values.length?values.map((value,i)=>`<span>${value}${i===0?'<small>'+ (stack?'cima':'frente')+'</small>':!stack&&i===values.length-1?'<small>final</small>':''}</span>`).join(''):'<p>Estructura vacía</p>';
   $('sequence-status').textContent=(sequence.last?.message||'Insertá un valor para empezar.')+' Contenido '+(stack?'de base a cima':'de frente a final')+': ['+sequence.values.join(', ')+'].';
   for(const [id,label] of [['sequence-insert',stack?'push · insertar':'enqueue · insertar'],['sequence-remove',stack?'pop · extraer':'dequeue · extraer'],['sequence-peek',stack?'top · consultar':'front · consultar']])$(id).textContent=label;
   $('sequence-history').innerHTML=sequence.history.map(s=>'<li>'+esc(s.message)+' ['+esc(s.values.join(', '))+']</li>').join('');
  }
  for(const operation of ['insert','remove','peek'])$('sequence-'+operation).addEventListener('click',()=>{
   try{sequence=LAB.sequenceOperation(sequence,operation,$('sequence-input').value);renderSequence();}
   catch(error){$('sequence-status').textContent=error.message;}
  });
  $('sequence-kind').addEventListener('change',()=>{sequence=LAB.sequence($('sequence-kind').value);renderSequence();});
  $('sequence-reset').addEventListener('click',()=>{sequence=LAB.sequence(sequence.kind);renderSequence();});
  $('sequence-practice').addEventListener('click',()=>openExercise(findId('TP_5_Pila_Cola',sequence.kind==='stack'?1:11)));
  function renderCollection(){
   const set=collection.kind==='set',tda=collection.kind==='tda-map';
   $('collection-value-field').hidden=set;$('collection-assign').hidden=!tda;
   $('collection-key-label').textContent=set?'Elemento (texto)':'Clave (texto)';
   $('collection-contract').textContent=set?'set: add no duplica; in consulta pertenencia; discard elimina si existe. La posición visual no representa un orden garantizado en Python.':tda?'TDA Diccionario del TP6: insert conserva claves existentes; d[k]=v reemplaza; get lanza una excepción si falta; remove ausente no cambia el contenido.':'dict nativo de Python: d[k]=v inserta o reemplaza; get sin predeterminado devuelve None si falta; pop sin predeterminado lanza KeyError si falta.';
   $('collection-insert').textContent=set?'add · agregar':tda?'insert · insertar':'d[k]=v · guardar';
   $('collection-find').textContent=set?'in · buscar':'get · buscar';$('collection-remove').textContent=set?'discard · eliminar':tda?'remove · eliminar':'pop · eliminar';
   $('collection-values').innerHTML=collection.entries.length?collection.entries.map(item=>`<span><strong>${esc(item.key)}</strong>${set?'':' → '+esc(item.value)}</span>`).join(''):'<p>Colección vacía</p>';
   $('collection-status').textContent=collection.last?.message||'Elegí una clave o elemento para probar una operación. Hasta ocho entradas; claves y valores de texto.';
   $('collection-history').innerHTML=collection.history.map(s=>'<li>'+esc(s.message)+' Contenido: '+esc(s.entries.map(e=>set?e.key:e.key+' → '+e.value).join('; ')||'vacío')+'</li>').join('');
  }
  for(const operation of ['insert','assign','find','remove'])$('collection-'+operation).addEventListener('click',()=>{
   try{collection=LAB.collectionOperation(collection,operation,$('collection-key').value,$('collection-value').value);renderCollection();}
   catch(error){$('collection-status').textContent=error.message;}
  });
  $('collection-kind').addEventListener('change',()=>{collection=LAB.collection($('collection-kind').value);renderCollection();});
  $('collection-reset').addEventListener('click',()=>{collection=LAB.collection(collection.kind);renderCollection();});
  $('collection-practice').addEventListener('click',()=>openExercise(findId('TP_6_Diccionario',collection.kind==='set'?6:1)));
  return {init(){renderMatrix();buildFib();buildSum();renderSequence();renderCollection();}};
 }
 root.TrainingLabViews={create};
})(globalThis);
