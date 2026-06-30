// Firebase 익명 인증 + Firestore 진도 동기화. 설정/네트워크 실패 시 graceful no-op(=오프라인 localStorage).
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.js';

let db = null, uid = null, enabled = false, saveTimer = null;

export async function initCloud(){
  try{
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    db = getFirestore(app);
    const cred = await signInAnonymously(auth);
    uid = cred.user.uid;
    enabled = true;
    return uid;
  }catch(e){
    console.warn('[cloud] disabled (offline/localStorage only):', e && e.message);
    enabled = false;
    return null;
  }
}
export function cloudEnabled(){ return enabled; }
export function cloudUid(){ return uid; }

export async function cloudLoad(){
  if(!enabled) return null;
  try{ const snap = await getDoc(doc(db,'users',uid)); return snap.exists() ? snap.data() : null; }
  catch(e){ console.warn('[cloud] load failed', e && e.message); return null; }
}

// 저장은 디바운스(0.8s) — 잦은 save() 호출을 묶어 한 번만 기록
export function cloudSave(data){
  if(!enabled) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async ()=>{
    try{ await setDoc(doc(db,'users',uid), Object.assign({}, data, { _updated: serverTimestamp() }), { merge:true }); }
    catch(e){ console.warn('[cloud] save failed', e && e.message); }
  }, 800);
}

export async function nicknameAvailable(name){
  if(!enabled) return true;
  try{ const snap = await getDoc(doc(db,'nicknames', name.toLowerCase())); return !snap.exists() || snap.data().uid === uid; }
  catch(e){ return true; }
}

// 닉네임 예약(트랜잭션) — 이미 남이 쓰면 false
export async function reserveNickname(name){
  if(!enabled) return true;
  const key = name.toLowerCase();
  try{
    return await runTransaction(db, async (tx)=>{
      const ref = doc(db,'nicknames', key);
      const snap = await tx.get(ref);
      if(snap.exists() && snap.data().uid !== uid) return false;
      tx.set(ref, { uid, name });
      return true;
    });
  }catch(e){ console.warn('[cloud] reserve failed (best-effort allow)', e && e.message); return true; }
}
