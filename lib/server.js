import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {blankSlots,goals,needTypes} from './consult.mjs';
export const slotsSchema=z.object(Object.fromEntries(Object.keys(blankSlots).map(k=>[k,k==='goal'?z.enum(['',...goals]):k==='needType'?z.enum(['',...needTypes]):z.string().max(300)])));
export const leadSchema=z.object({requestId:z.uuid(),name:z.string().trim().min(1).max(80),company:z.string().trim().min(1).max(160),email:z.email().max(254),slots:slotsSchema,summary:z.string().trim().min(5).max(3000),consent:z.literal(true),emailConsent:z.boolean(),meeting:z.boolean(),preferredTimes:z.array(z.iso.datetime()).max(2).default([]),utm:z.record(z.string(),z.string().max(200)).default({})}).superRefine((v,ctx)=>{if(v.meeting&&!v.preferredTimes.length)ctx.addIssue({code:'custom',message:'희망 시간을 입력해 주세요.'});for(const t of v.preferredTimes){const date=new Date(t);if(date.getTime()<=Date.now()||date.getTime()>Date.now()+90*86400000||date.getUTCMinutes()%30||date.getUTCSeconds())ctx.addIssue({code:'custom',message:'90일 이내의 미래 시각을 30분 단위로 선택해 주세요.'});}});
export function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('DB_NOT_CONFIGURED');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function identity(req,staff=false){
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'');
 if(!token)throw new Error('UNAUTHORIZED');
 const db=admin();const {data,error}=await db.auth.getUser(token);
 if(error||!data.user)throw new Error('UNAUTHORIZED');
 if(staff){const m=await db.from('team_members').select('user_id').eq('user_id',data.user.id).maybeSingle();if(m.error||!m.data)throw new Error('FORBIDDEN');}
 return {db,user:data.user};
}
export async function quota(db,userId,kind){
 const {data,error}=await db.rpc('consume_quota',{p_user:userId,p_kind:kind});
 if(error)throw new Error('QUOTA_UNAVAILABLE');if(!data)throw new Error('RATE_LIMIT');
}
export async function jsonBody(req){if(Number(req.headers.get('content-length')||0)>20000)throw new Error('PAYLOAD_TOO_LARGE');const t=await req.text();if(t.length>20000)throw new Error('PAYLOAD_TOO_LARGE');return JSON.parse(t);}
export function fail(e){
 const msg=e?.message||''; const code=msg==='UNAUTHORIZED'?401:msg==='FORBIDDEN'?403:msg==='RATE_LIMIT'?429:msg==='DB_NOT_CONFIGURED'?503:e instanceof z.ZodError||e instanceof SyntaxError||msg==='PAYLOAD_TOO_LARGE'?400:500;
 return Response.json({error:code===400?'입력값을 확인해 주세요.':code===401?'로그인이 필요합니다.':code===403?'등록된 팀원만 접근할 수 있습니다.':code===429?'요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.':'연결 설정 또는 처리 상태를 확인해 주세요. 저장 성공으로 처리되지 않았습니다.'},{status:code});
}
