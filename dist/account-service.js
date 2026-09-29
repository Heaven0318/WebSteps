import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './account-config.js?v=2';
const STORAGE_KEY='websteps-account-session';
export const accountConfigured=()=>/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(SUPABASE_URL)&&/^sb_publishable_/.test(SUPABASE_PUBLISHABLE_KEY);
let session=null;
export function currentSession(){return session}
function base(){if(!accountConfigured())throw Error('Account service is not configured.');return SUPABASE_URL.replace(/\/$/,'')}
async function request(path,{method='GET',body,token,headers={}}={}){
  if(token&&session?.access_token===token&&session.expires_at<Date.now()+60000){await refreshSession();token=session.access_token}
  const response=await fetch(base()+path,{method,headers:{'apikey':SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{'Authorization':'Bearer '+token}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{data={message:raw}}
  if(!response.ok)throw Error(data.msg||data.message||data.error_description||data.error||'Account request failed.');
  return data;
}
function store(next){session=next;try{if(next)localStorage.setItem(STORAGE_KEY,JSON.stringify(next));else localStorage.removeItem(STORAGE_KEY)}catch{}return next}
export function clearSession(){store(null)}
export async function restoreSession(){
  if(!accountConfigured())return null;
  const hash=new URLSearchParams(location.hash.startsWith('#access_token=')?location.hash.slice(1):'');
  if(hash.get('access_token')&&hash.get('refresh_token')){
    store({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_at:Date.now()+Number(hash.get('expires_in')||3600)*1000});
    history.replaceState(null,'',location.pathname+location.search+'#/account');
  }else{try{store(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}catch{store(null)}}
  if(!session)return null;
  if(session.expires_at&&session.expires_at<Date.now()+60000){try{await refreshSession()}catch{clearSession();return null}}
  try{const user=await request('/auth/v1/user',{token:session.access_token});session.user=user;store(session);return user}catch{clearSession();return null}
}
export async function refreshSession(){if(!session?.refresh_token)throw Error('Your session expired. Sign in again.');const result=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});return store({...result,expires_at:Date.now()+result.expires_in*1000})}
export async function signUp(email,password){return request('/auth/v1/signup',{method:'POST',body:{email,password,options:{email_redirect_to:location.origin+location.pathname+'#/account'}}})}
export async function signIn(email,password){const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});store({...data,expires_at:Date.now()+data.expires_in*1000});return data}
export async function resendVerification(email){return request('/auth/v1/resend',{method:'POST',body:{type:'signup',email}})}
export async function sendReset(email){return request('/auth/v1/recover',{method:'POST',body:{email,redirect_to:location.origin+location.pathname+'#/account'}})}
export async function updatePassword(password){if(!session)throw Error('Sign in to change your password.');return request('/auth/v1/user',{method:'PUT',token:session.access_token,body:{password}})}
export async function signOut(){if(session){try{await request('/auth/v1/logout',{method:'POST',token:session.access_token})}finally{clearSession()}}}
export async function deleteAccount(){if(!session)throw Error('Sign in first.');await request('/functions/v1/delete-websteps-account',{method:'POST',token:session.access_token,body:{confirm:true}});clearSession()}
export async function readCloud(){if(!session?.user?.id)throw Error('Sign in first.');const rows=await request('/rest/v1/learning_state?select=payload,updated_at&user_id=eq.'+encodeURIComponent(session.user.id),{token:session.access_token});return rows[0]||null}
export async function writeCloud(payload){if(!session?.user?.id)throw Error('Sign in first.');return request('/rest/v1/learning_state?on_conflict=user_id',{method:'POST',token:session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{user_id:session.user.id,payload,updated_at:new Date().toISOString()}})}
