'use client';
import {createClient} from '@supabase/supabase-js';
let client;
export function supabase(){
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)return null;
 return client??=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
export async function headers(){const db=supabase();if(!db)throw Error('Supabase 연결이 필요합니다.');let {data:{session}}=await db.auth.getSession();if(!session){const r=await db.auth.signInAnonymously();if(r.error)throw Error(r.error.code==='anonymous_provider_disabled'?'상담 서버의 방문자 연결이 아직 준비되지 않았습니다. 고객 로그인은 필요하지 않습니다.':r.error.message);session=r.data.session;}return {'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`};}
export async function api(path,body){const r=await fetch(path,{method:'POST',headers:await headers(),body:JSON.stringify(body)});if(!r.ok)throw Error((await r.json()).error||'처리 실패');return r;}
