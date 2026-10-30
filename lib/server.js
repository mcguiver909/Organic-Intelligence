import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {blankSlots,goals,needTypes} from './consult.mjs';
export const slotsSchema=z.object(Object.fromEntries(Object.keys(blankSlots).map(k=>[k,k==='goal'?z.enum(['',...goals]):k==='needType'?z.enum(['',...needTypes]):z.string().max(300)])));
const sourceURL=z.string().url().max(1000).refine(v=>v.startsWith('https://'));
export const companyProfileSchema=z.object({name:z.string().max(160).default(''),industry:z.string().max(300).default(''),businessSummary:z.string().max(1000).default(''),size:z.string().max(100).default(''),editedFields:z.array(z.enum(['name','industry','businessSummary','size'])).max(4).default([])}).default({name:'',industry:'',businessSummary:'',size:'',editedFields:[]});
export const consultationCompanySchema=z.object({url:z.union([sourceURL,z.literal('')]),profile:companyProfileSchema,facts:z.array(z.object({quote:z.string().max(240),url:sourceURL})).max(3).default([]),hypotheses:z.array(z.object({title:z.string().max(200),response:z.enum(['pending','yes','no','different']),correction:z.string().max(300)})).max(5).default([])}).nullable().default(null);
export const companyAnalysisSchema=z.object({url:sourceURL,pageTitle:z.string().max(160).optional(),checkedAt:z.iso.datetime(),snapshots:z.array(z.object({url:sourceURL,text:z.string().max(14000)})).max(3).default([]),pages:z.array(sourceURL).max(3),facts:z.array(z.object({quote:z.string().max(240),url:sourceURL})).max(3),hypotheses:z.array(z.object({id:z.enum(['gpu','knowledge','model','health','custom']),goal:z.string().max(50),statement:z.string().max(300).optional(),title:z.string().max(200),effect:z.string().max(300),quote:z.string().max(240),url:sourceURL,response:z.enum(['pending','yes','no','different']),correction:z.string().max(300)})).max(5)}).nullable().default(null);
const briefItem=z.object({summary:z.string().max(300),evidence:z.string().max(500)});
export const briefSchema=z.object({issues:z.array(briefItem).max(4),requirements:z.array(briefItem).max(4),openQuestions:z.array(z.string().max(200)).max(4),preparation:z.array(z.string().max(200)).max(3),engine:z.enum(['gemini','rules']),generatedAt:z.iso.datetime()}).nullable().default(null);
export const leadSchema=z.object({additionalNote:z.string().max(1000).default(''),companyProfile:companyProfileSchema,brief:briefSchema,conversation:z.array(z.object({role:z.enum(['user','assistant']),text:z.string().max(1500)})).max(20).default([]),holdReason:z.enum(['','시기상조','예산 미정','기능 부적합','정보 부족','기타']).default(''),holdEvidence:z.string().max(500).default(''),nurtureConsent:z.boolean().default(false),contactOutcome:z.enum(['검토 중','현재 필요 없음']).default('검토 중'),companyAnalysis:companyAnalysisSchema,requestId:z.uuid(),name:z.string().trim().min(1).max(80),company:z.string().trim().min(1).max(160),email:z.email().max(254),slots:slotsSchema,summary:z.string().trim().min(5).max(3000),consent:z.literal(true),emailConsent:z.boolean(),meeting:z.boolean(),preferredTimes:z.array(z.iso.datetime()).max(2).default([]),utm:z.record(z.string(),z.string().max(200)).default({})}).superRefine((v,ctx)=>{if(v.nurtureConsent&&!v.companyAnalysis)ctx.addIssue({code:'custom',message:'후속 재확인을 위해 회사 URL 분석이 필요합니다.'});if(v.meeting&&!v.preferredTimes.length)ctx.addIssue({code:'custom',message:'희망 시간을 입력해 주세요.'});for(const t of v.preferredTimes){const date=new Date(t);if(date.getTime()<=Date.now()||date.getTime()>Date.now()+90*86400000||date.getUTCMinutes()%30||date.getUTCSeconds())ctx.addIssue({code:'custom',message:'90일 이내의 미래 시각을 30분 단위로 선택해 주세요.'});}});
export function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key||key.startsWith('sb_publishable_')||key===process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)throw new Error('DB_NOT_CONFIGURED');
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
export async function jsonBody(req){if(Number(req.headers.get('content-length')||0)>300000)throw new Error('PAYLOAD_TOO_LARGE');const t=await req.text();if(t.length>140000)throw new Error('PAYLOAD_TOO_LARGE');return JSON.parse(t);}
export function fail(e){
 const msg=e?.message||''; const code=msg==='UNAUTHORIZED'?401:msg==='FORBIDDEN'?403:msg==='RATE_LIMIT'?429:msg==='DB_NOT_CONFIGURED'?503:e instanceof z.ZodError||e instanceof SyntaxError||msg==='PAYLOAD_TOO_LARGE'?400:500;
 return Response.json({error:code===400?'입력값을 확인해 주세요.':code===401?'로그인이 필요합니다.':code===403?'등록된 팀원만 접근할 수 있습니다.':code===429?'요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.':'연결 설정 또는 처리 상태를 확인해 주세요. 저장 성공으로 처리되지 않았습니다.'},{status:code});
}

export async function consultationAccess(req){
 const local=process.env.NODE_ENV==='development'&&!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)&&['127.0.0.1','localhost'].includes(new URL(req.url).hostname);
 if(local)return;if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('DB_NOT_CONFIGURED');const {db,user}=await identity(req);await quota(db,user.id,'consult');
}
