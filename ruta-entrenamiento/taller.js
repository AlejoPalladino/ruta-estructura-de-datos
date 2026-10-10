'use strict';
(function(root){
 const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function filter(exercises,{search='',topic='all',scope='all',status='all',level='all',tests='all',examIds=null,mockIds=[]}={},statusFor=()=> 'pending'){
  const query=normalize(search.trim());
  const result=exercises.filter(ex=>(!examIds||examIds.includes(ex.id))&&
   (!query||normalize([ex.title,ex.statement,ex.source,...ex.tags].join(' ')).includes(query))&&
   (topic==='all'||ex.topic===topic)&&(scope==='all'||ex.scope===scope||scope==='mock'&&(examIds||mockIds).includes(ex.id))&&
   (status==='all'||statusFor(ex.id)===status)&&(level==='all'||ex.level===level)&&
   (tests==='all'||(tests==='yes'?Boolean(ex.tests):!ex.tests)));
  return examIds?result.sort((a,b)=>examIds.indexOf(a.id)-examIds.indexOf(b.id)):result;
 }
 function neighbors(exercises,selected){
  const index=exercises.findIndex(ex=>ex.id===selected);
  return {index,total:exercises.length,previous:index>0?exercises[index-1].id:null,
   next:index>=0&&index<exercises.length-1?exercises[index+1].id:null};
 }
 function cleanPreferences(value){return {layout:value?.layout==='split'?'split':'stacked',catalogCollapsed:value?.catalogCollapsed===true,mapView:value?.mapView==='subte'?'subte':'grafo',mapDensity:['compacta','media','aireada'].includes(value?.mapDensity)?value.mapDensity:'media'};}
 const api={filter,neighbors,cleanPreferences};
 root.TrainingWorkshop=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
