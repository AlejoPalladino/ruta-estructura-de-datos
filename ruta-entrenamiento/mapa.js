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
 // Suggested learning relationships, not requirements that lock practice.
 const edges=[['python','vector','base'],['vector','matriz','base'],['matriz','integracion','base'],
  ['python','recursividad','recursion'],['recursividad','fibonacci','recursion'],['recursividad','listas','recursion'],['listas','arboles','recursion'],
  ['python','tda','structures'],['tda','pila-cola','structures'],['pila-cola','diccionario','structures'],
  ['tda','integracion','structures'],['recursividad','integracion','recursion'],['pila-cola','listas','structures']];
 const palette=['#36c4dc','#ff5267','#3dc879','#b886f6','#ffc928','#658bff','#f056a5','#bce331','#ff922e','#d89871','#c5bbef'];
 nodes.forEach((node,index)=>{node.color=palette[index];node.letter=String.fromCharCode(65+index);});
 const levels=['Base','Práctica','Refuerzo','Integración'];
 const densities={compacta:{radius:320,gap:15},media:{radius:385,gap:22},aireada:{radius:445,gap:31}};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function topicFor(ex){
  if(['TP_4_Recursividad_Com_5-3','refuerzo-fib-lineal'].includes(ex.id))return 'fibonacci';
  if(ex.source==='Practica_Parcial_1.ipynb'||ex.id==='refuerzo-suma-matriz')return 'integracion';
  return ex.topic;
 }
 function exercisesFor(node,data){return node.future?[]:data.exercises.filter(ex=>topicFor(ex)===node.id);}
 const polar=(x,y,r,a)=>[x+r*Math.cos(a),y+r*Math.sin(a)];
 const xy=p=>p.map(n=>n.toFixed(2)).join(' ');
 // Each exercise has one station. Rails group exercises; they do not impose prerequisites.
 function layout(data,view,density){
  const config=densities[density]||densities.media,groups=nodes.map(node=>({...node,exercises:exercisesFor(node,data)}));
  const width=1120,center=[560,530],stations=[],tracks=[],labels=[],guides=[];
  let height=1060;
  if(view==='grafo'){
   const weights=groups.map(group=>Math.max(9,Math.sqrt(group.exercises.length)*6)),total=weights.reduce((a,b)=>a+b,0);
   let angle=-Math.PI/2;
   groups.forEach((group,index)=>{
    const span=weights[index]/total*Math.PI*2,mid=angle+span/2;
    const hub=polar(...center,62,mid),label=polar(...center,config.radius+66,mid);
    labels.push({...group,x:label[0],y:label[1],hub,angle:mid});
    tracks.push({topic:group.id,d:`M ${xy(center)} L ${xy(polar(...center,config.radius+30,mid))}`,main:true});
    for(let level=0;level<levels.length;level++){
     const bucket=group.exercises.filter(ex=>ex.level===levels[level]);
     const lanes=Math.max(1,Math.ceil(bucket.length/12)),slots=Math.ceil(bucket.length/lanes);
     bucket.forEach((ex,i)=>{
      const a=mid+((Math.floor(i/lanes)+.5)/slots-.5)*span*.8;
      const r=config.radius*(.30+level*.215)+(i%lanes-(lanes-1)/2)*12;
      const point=polar(...center,r,a),bend=polar(...center,Math.max(76,r-40),mid);
      stations.push({id:ex.id,topic:group.id,x:point[0],y:point[1],level});
      tracks.push({topic:group.id,d:`M ${xy(hub)} Q ${xy(bend)} ${xy(point)}`});
     });
    }
    angle+=span;
   });
   levels.forEach((name,i)=>guides.push({r:config.radius*(.30+i*.215),name,index:i+1}));
  }else{
   let y=90;
   groups.forEach(group=>{
    const rows=Math.max(3,Math.min(12,Math.ceil(Math.sqrt(group.exercises.length)*1.65)));
    const band=rows*config.gap+62,mid=y+band/2;
    labels.push({...group,x:174,y:mid,hub:[236,mid],top:y,band});
    tracks.push({topic:group.id,d:`M 236 ${mid} H 1010`,main:true});
    for(let level=0;level<levels.length;level++){
     group.exercises.filter(ex=>ex.level===levels[level]).forEach((ex,i)=>{
      const x=355+level*185+(Math.floor(i/rows)-1)*25,ey=y+32+(i%rows)*config.gap;
      stations.push({id:ex.id,topic:group.id,x,y:ey,level});
      tracks.push({topic:group.id,d:`M 236 ${mid} H ${x-80} C ${x-48} ${mid} ${x-48} ${ey} ${x-22} ${ey} H ${x}`});
     });
    }
    y+=band;
   });
   height=y+40;
   levels.forEach((name,i)=>guides.push({x:355+i*185,name,index:i+1}));
  }
  return {width,height,center,stations,tracks,labels,guides};
 }
 function create({$,data,getState,save,openExercise,openSchedule}){
  let selected=null,exerciseId=null,zoom=1,expanded=false,directory=false,drag=null,suppressClick=false;
  let currentLayout=null,framed=false;
  const byId=Object.fromEntries(nodes.map(node=>[node.id,node]));
  const exerciseById=Object.fromEntries(data.exercises.map(ex=>[ex.id,ex]));
  function preferences(){const p=getState().preferences;return {view:p?.mapView==='subte'?'subte':'grafo',density:densities[p?.mapDensity]?p.mapDensity:'media'};}
  function status(ex){const entry=getState().exercises[ex.id];return root.TrainingLearning.isMastered(entry)?'consolidated':entry?.learning?.completed?'completed':'pending';}
  function updateSize(){
   if(!currentLayout)return;
   const viewport=$('map-viewport'),availableWidth=viewport.clientWidth||900;
   const fitted=preferences().view==='grafo'?Math.min(availableWidth,Math.max(500,(viewport.clientHeight||770)-70)*currentLayout.width/currentLayout.height):availableWidth;
   const width=Math.max(660,fitted)*zoom;
   $('map-canvas').style.width=width+'px';$('map-canvas').style.height=width*currentLayout.height/currentLayout.width+'px';
   $('map-zoom-level').textContent=Math.round(zoom*100)+'%';
   $('map-zoom-out').disabled=zoom<=.6;$('map-zoom-in').disabled=zoom>=2.8;
  }
  function resetFrame(){
   const viewport=$('map-viewport');
   viewport.scrollLeft=preferences().view==='grafo'?Math.max(0,(parseFloat($('map-canvas').style.width)-(viewport.clientWidth||900))/2):0;
   viewport.scrollTop=0;
  }
  function topicLabel(node,view){
   const lines=node.title==='Diccionarios y conjuntos'?['Diccionarios','y conjuntos']:node.title==='Integración · parcial'?['Integración','parcial']:node.title.split(' ').length>1?node.title==='Pilas y colas'?['Pilas y colas']:node.title.split(' ').map(s=>s):[node.title];
   const text=view==='grafo'?lines.map((line,i)=>`<tspan x="0" dy="${i?16:32}">${escape(line)}</tspan>`).join(''):
    lines.map((line,i)=>`<tspan x="-28" dy="${i?16:-(lines.length-1)*8}">${escape(line)}</tspan>`).join('');
   return `<g class="atlas-topic ${selected&&selected!==node.id?'is-muted':''}" transform="translate(${node.x} ${node.y})" role="button" tabindex="0" data-map-topic="${node.id}" aria-pressed="${selected===node.id}" aria-label="Línea ${node.letter}: ${escape(node.title)}${node.future?', en el cronograma':''}" aria-controls="map-detail" style="--rail:${node.color}"><title>${escape(node.title)} · ${node.future?'En el cronograma':node.exercises.length+' ejercicios'}</title><circle class="atlas-hit" r="23"/><circle class="atlas-disc" r="15"/><text class="atlas-letter" text-anchor="middle" dy="6">${node.letter}</text><text class="atlas-topic-name" text-anchor="${view==='grafo'?'middle':'end'}">${text}</text>${node.future?'<text class="atlas-future" text-anchor="middle" y="60">PRÓXIMAMENTE</text>':''}</g>`;
  }
  function render(){
   const {view,density}=preferences();currentLayout=layout(data,view,density);
   const {width,height,center,labels,tracks,stations,guides}=currentLayout;
   $('map-canvas').dataset.view=view;$('map-canvas').dataset.density=density;
   for(const choice of ['grafo','subte'])$('map-'+choice).setAttribute('aria-pressed',String(choice===view));
   for(const choice of Object.keys(densities))$('map-'+choice).setAttribute('aria-pressed',String(choice===density));
   $('map-lines').setAttribute('viewBox',`0 0 ${width} ${height}`);
   $('map-mode-description').textContent=view==='grafo'?'Cada tema nace en el centro. Los anillos agrupan las estaciones por nivel del catálogo.':'Cada tema es una línea; las columnas agrupan las estaciones por nivel del catálogo.';
   let svg='<g class="atlas-guides" aria-hidden="true">';
   if(view==='grafo')svg+=guides.map(g=>`<circle cx="${center[0]}" cy="${center[1]}" r="${g.r}"/><text x="${center[0]-8}" y="${center[1]-g.r-7}">${g.index}</text>`).join('');
   else{
    svg+=labels.map((node,i)=>i%2?`<rect x="20" y="${node.top}" width="1060" height="${node.band}"/>`:'').join('');
    svg+=guides.map(g=>`<path d="M ${g.x+62} 30 V ${height-30}"/><text x="${g.x-20}" y="32">${g.index} ${g.name.toUpperCase()}</text>`).join('');
    svg+=`<path class="atlas-backbone" d="M 228 55 V ${height-40} M 232 55 V ${height-40} M 236 55 V ${height-40}"/><text x="236" y="17" text-anchor="end">KM 0 · EMPEZAR</text>`;
   }
   svg+='</g><g aria-hidden="true">'+tracks.map(track=>`<path class="atlas-rail ${track.main?'atlas-main-rail':''} ${selected&&selected!==track.topic?'is-muted':''}" stroke="${byId[track.topic].color}" d="${track.d}"/>`).join('')+'</g>';
   if(selected){
    const positions=Object.fromEntries(labels.map(node=>[node.id,node.hub]));
    svg+='<g class="atlas-transfers" aria-hidden="true">'+edges.filter(([a,b])=>a===selected||b===selected).map(([a,b])=>{
     const p=positions[a],q=positions[b],control=view==='grafo'?center:[280,(p[1]+q[1])/2];
     return `<path d="M ${xy(p)} Q ${xy(control)} ${xy(q)}"/><circle cx="${p[0]}" cy="${p[1]}" r="5"/><circle cx="${q[0]}" cy="${q[1]}" r="5"/>`;
    }).join('')+'</g>';
   }
   svg+=stations.map(station=>{
    const ex=exerciseById[station.id],isSelected=exerciseId===ex.id,state=status(ex);
    return `<g class="atlas-station ${state} ${isSelected?'is-selected':''} ${selected&&selected!==station.topic?'is-muted':''}" transform="translate(${station.x} ${station.y})" role="button" tabindex="${selected&&selected!==station.topic?'-1':'0'}" data-map-exercise="${escape(ex.id)}" aria-pressed="${isSelected}" aria-controls="map-detail" aria-label="${escape(ex.title)} · ${ex.level} · ${state==='consolidated'?'Consolidado':state==='completed'?'Completado':'Pendiente'}" style="--rail:${byId[station.topic].color}"><title>${escape(ex.title)} · ${ex.level}</title><circle class="atlas-hit" r="9"/><circle class="atlas-halo" r="7"/><circle class="atlas-stop" r="3.7"/></g>`;
   }).join('');
   if(view==='grafo')svg+=`<g class="atlas-origin" aria-hidden="true" transform="translate(${xy(center)})"><circle r="15"/><circle r="9"/><text y="37" text-anchor="middle">KM 0 · TU PUNTO DE PARTIDA</text></g>`;
   svg+=labels.map(node=>topicLabel(node,view)).join('');
   $('map-lines').innerHTML=svg;
   $('map-topic-list').innerHTML=nodes.map(node=>`<button data-map-topic="${node.id}" aria-pressed="${selected===node.id}" style="--rail:${node.color}"><span>${node.letter}</span>${escape(node.title)}<small>${node.future?'↗':exercisesFor(node,data).length}</small></button>`).join('');
   $('map-show-all').hidden=!selected;
   updateSize();if(!framed){resetFrame();framed=true;}renderDetail();renderDirectory();
  }
  function renderDetail(){
   const node=byId[selected],ex=exerciseById[exerciseId];
   $('map-detail').hidden=!node;
   if(!node)return;
   $('map-selection-kind').textContent=ex?'ESTACIÓN · '+ex.level:'LÍNEA '+node.letter;
   $('map-topic-title').textContent=ex?.title||node.title;
   $('map-topic-description').textContent=ex?(ex.desc||'Abrí la consigna completa en el Taller de código.'):node.desc;
   const relation=index=>edges.filter(edge=>edge[index]===selected).map(edge=>byId[edge[1-index]].title).join(' · ')||'—';
   $('map-before').textContent=relation(1);$('map-after').textContent=relation(0);
   $('map-selection-progress').textContent=ex?(status(ex)==='consolidated'?'Consolidado sin ayuda':status(ex)==='completed'?'Completado':'Pendiente'):
    node.future?'Contenido del cronograma':exercisesFor(node,data).filter(item=>status(item)==='consolidated').length+' / '+exercisesFor(node,data).length+' consolidados';
   $('map-practice').textContent=node.future?'Ver cronograma ↗':ex?'Abrir ejercicio →':'Practicar esta línea →';
  }
  function renderDirectory(){
   $('map-directory').hidden=!directory;
   $('map-directory-toggle').setAttribute('aria-expanded',String(directory));
   if(!directory)return;
   const query=$('map-search').value.trim().toLocaleLowerCase('es');
   const list=data.exercises.filter(ex=>(!selected||topicFor(ex)===selected)&&(!query||(ex.title+' '+ex.level).toLocaleLowerCase('es').includes(query)));
   $('map-directory-count').textContent=list.length+' estaciones'+(selected?' · '+byId[selected].title:'');
   $('map-directory-list').innerHTML=list.length?list.map(ex=>`<button data-map-exercise="${escape(ex.id)}" aria-pressed="${exerciseId===ex.id}" style="--rail:${byId[topicFor(ex)].color}"><span>${escape(ex.title)}</span><small>${byId[topicFor(ex)].letter} · ${ex.level} · ${status(ex)==='consolidated'?'Consolidado':status(ex)==='completed'?'Completado':'Pendiente'}</small></button>`).join(''):'<p>No hay ejercicios para esta búsqueda.</p>';
  }
  function select(event){
   if(suppressClick){suppressClick=false;return;}
   const exercise=event.target.closest('[data-map-exercise]'),topic=event.target.closest('[data-map-topic]');
   if(exercise&&exerciseById[exercise.dataset.mapExercise]){exerciseId=exercise.dataset.mapExercise;selected=topicFor(exerciseById[exerciseId]);}
   else if(topic&&byId[topic.dataset.mapTopic]){selected=topic.dataset.mapTopic;exerciseId=null;}
   else return;
   const key=exercise?'mapExercise':'mapTopic',value=exercise?exerciseId:selected;
   const container=event.currentTarget;render();
   const attr=key==='mapExercise'?'data-map-exercise':'data-map-topic';
   // IDs come from the local catalog, never from imported progress.
   container?.querySelector?.(`[${attr}="${value}"]`)?.focus({preventScroll:true});
  }
  for(const id of ['map-lines','map-topic-list','map-directory-list'])$(id).addEventListener('click',select);
  $('map-lines').addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.closest('[role="button"]')){event.preventDefault();select(event);}});
  for(const view of ['grafo','subte'])$('map-'+view).addEventListener('click',()=>{getState().preferences={...getState().preferences,mapView:view};zoom=1;save();render();resetFrame();});
  for(const density of Object.keys(densities))$('map-'+density).addEventListener('click',()=>{getState().preferences={...getState().preferences,mapDensity:density};save();render();});
  $('map-show-all').addEventListener('click',()=>{selected=null;exerciseId=null;render();$('map-grafo').focus();});
  $('map-directory-toggle').addEventListener('click',()=>{directory=!directory;renderDirectory();if(directory)$('map-search').focus();});
  $('map-directory-close').addEventListener('click',()=>{directory=false;renderDirectory();$('map-directory-toggle').focus();});
  $('map-search').addEventListener('input',renderDirectory);
  function changeZoom(value){
   const viewport=$('map-viewport'),old=zoom,next=Math.max(.6,Math.min(2.8,value));
   const x=(viewport.scrollLeft+(viewport.clientWidth||900)/2)/old,y=(viewport.scrollTop+(viewport.clientHeight||700)/2)/old;
   zoom=next;updateSize();viewport.scrollLeft=x*zoom-(viewport.clientWidth||900)/2;viewport.scrollTop=y*zoom-(viewport.clientHeight||700)/2;
  }
  $('map-zoom-in').addEventListener('click',()=>changeZoom(zoom+.2));
  $('map-zoom-out').addEventListener('click',()=>changeZoom(zoom-.2));
  $('map-reset').addEventListener('click',()=>{zoom=1;updateSize();resetFrame();});
  function setExpanded(value){
   $('topic-map').setAttribute('role',value?'dialog':'region');$('topic-map').setAttribute('aria-modal',String(value));
   expanded=value;$('topic-map').classList.toggle('atlas-expanded',value);
   $('map-expand').setAttribute('aria-pressed',String(value));$('map-expand').textContent=value?'Cerrar mapa ↙':'Ampliar mapa ↗';
   if(document.body)document.body.classList.toggle('atlas-open',value);
   updateSize();resetFrame();
  }
  $('map-expand').addEventListener('click',()=>setExpanded(!expanded));
  document.addEventListener('keydown',event=>{
   if(!expanded)return;
   if(event.key==='Escape'){setExpanded(false);$('map-expand').focus();}
   if(event.key==='Tab'){
    const controls=Array.from($('topic-map').querySelectorAll('button,input,summary,[tabindex="0"]')).filter(el=>!el.disabled&&el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
   }
  });
  window.addEventListener('resize',()=>{updateSize();if(preferences().view==='grafo')resetFrame();});
  const viewport=$('map-viewport');
  viewport.addEventListener('pointerdown',event=>{
   if(event.pointerType==='touch'||event.button!==0)return;
   suppressClick=false;drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,id:event.pointerId,moved:false};
  });
  viewport.addEventListener('pointermove',event=>{
   if(!drag)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(Math.abs(dx)+Math.abs(dy)>5){drag.moved=true;viewport.setPointerCapture?.(drag.id);viewport.scrollLeft=drag.left-dx;viewport.scrollTop=drag.top-dy;}
  });
  const stopDrag=()=>{if(drag){suppressClick=drag.moved;drag=null;}};
  viewport.addEventListener('pointerup',stopDrag);viewport.addEventListener('pointercancel',stopDrag);viewport.addEventListener('lostpointercapture',stopDrag);
  $('map-practice').addEventListener('click',()=>{
   const node=byId[selected];if(!node)return;
   if(expanded)setExpanded(false);
   if(node.future){openSchedule();return;}
   const group=exercisesFor(node,data),next=exerciseById[exerciseId]||group.find(ex=>status(ex)!=='consolidated')||group[0];
   if(next)openExercise(next.id);
  });
  return {render};
 }
 root.TrainingMap={create,nodes,edges,exercisesFor,topicFor,layout};
})(globalThis);
