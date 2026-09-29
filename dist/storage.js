const DB_NAME='websteps-learning';
const DB_VERSION=1;
const KEY='state';
export const emptyState=()=>({schemaVersion:1,curriculumVersion:1,progress:{},drafts:{},projectData:{},resume:null,updatedAt:null});
let dbPromise;
function openDB(){
  if(!('indexedDB' in window)) return Promise.reject(Error('This browser does not support IndexedDB.'));
  if(!dbPromise) dbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('app'))request.result.createObjectStore('app')};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||Error('Cannot open browser storage.'));
  });
  return dbPromise;
}
export async function loadState(key=KEY){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const request=db.transaction('app').objectStore('app').get(key);
    request.onsuccess=()=>resolve(validState(request.result)?request.result:emptyState());
    request.onerror=()=>reject(request.error||Error('Cannot load learning data.'));
  });
}
export async function saveState(state,key=KEY){
  const db=await openDB();
  const copy=structuredClone({...state,updatedAt:new Date().toISOString()});
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('app','readwrite');
    tx.objectStore('app').put(copy,key);
    tx.oncomplete=()=>resolve(copy.updatedAt);
    tx.onerror=()=>reject(tx.error||Error('Cannot save learning data.'));
    tx.onabort=()=>reject(tx.error||Error('Save was interrupted.'));
  });
}
export function validState(value){
  return !!value && typeof value==='object' && value.schemaVersion===1 && value.curriculumVersion===1 &&
    value.progress && typeof value.progress==='object' && !Array.isArray(value.progress) &&
    value.drafts && typeof value.drafts==='object' && !Array.isArray(value.drafts) &&
    value.projectData && typeof value.projectData==='object' && !Array.isArray(value.projectData) &&
    (value.resume===null || typeof value.resume==='string');
}
export function backupPayload(state){return {app:'WebSteps',exportedAt:new Date().toISOString(),...structuredClone(state)}}
export function parseBackup(raw){const data=JSON.parse(raw);if(data.app!=='WebSteps'||!validState(data))throw Error('This is not a supported WebSteps backup.');return data}
