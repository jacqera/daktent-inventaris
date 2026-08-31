import {CONFIG} from './config.js?v=21';import {auth} from './auth.js?v=21';
const base=CONFIG.supabaseUrl.replace(/\/$/,'');
async function headers(type){const s=await auth.refresh();if(!s)throw new Error('Je sessie is verlopen');return{apikey:CONFIG.supabasePublishableKey,Authorization:`Bearer ${s.access_token}`,...(type?{'Content-Type':type}:{})}}
const objectUrl=path=>`${base}/storage/v1/object/${CONFIG.storageBucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
export async function uploadPhoto(path,blob){const r=await fetch(objectUrl(path),{method:'POST',headers:{...(await headers(blob.type||'image/jpeg')),upsert:'true'},body:blob});if(!r.ok)throw new Error((await r.json().catch(()=>({}))).message||'Foto uploaden mislukt');return path}
export async function removePhoto(path){const r=await fetch(objectUrl(path),{method:'DELETE',headers:await headers()});if(!r.ok)throw new Error('Foto verwijderen mislukt')}
export async function signedPhotoUrl(path,expiresIn=3600){const r=await fetch(`${base}/storage/v1/object/sign/${CONFIG.storageBucket}/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:await headers('application/json'),body:JSON.stringify({expiresIn})});if(!r.ok)throw new Error('Foto bekijken mislukt');const x=await r.json();return `${base}/storage/v1${x.signedURL}`}
