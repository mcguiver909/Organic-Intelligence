import {z} from 'zod';
import {identity,jsonBody,quota,fail} from '../../../lib/server';
import {collectCompany,websiteURL} from '../../../lib/public-site.mjs';
import {groundedAnalysis} from '../../../lib/company.mjs';
import {geminiCompanyAnalysis} from '../../../lib/company-ai.mjs';
export const runtime='nodejs';
export const maxDuration=60;
let localBusy=false;
export async function POST(req){let local=false,acquired=false;try{
 // Development-only access for local setup; deployed endpoints require Supabase identity and quota.
 local=process.env.NODE_ENV==='development'&&!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)&&['127.0.0.1','localhost'].includes(new URL(req.url).hostname);
 if(local){if(localBusy)return Response.json({error:'분석이 진행 중입니다.'},{status:429});localBusy=true;acquired=true;}else{if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('DB_NOT_CONFIGURED');const {db,user}=await identity(req);await quota(db,user.id,'lead');}
 const {url}=z.object({url:z.string().max(1000)}).parse(await jsonBody(req));websiteURL(url);
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Gemini 서버 키 설정 후 사용할 수 있습니다. 직접 상담은 계속 이용할 수 있습니다.'},{status:503});
 const sources=await collectCompany(url);if(!sources.length)throw Error('PAGE_UNAVAILABLE');
 const raw=await geminiCompanyAnalysis(sources);
 const result=groundedAnalysis(raw,sources,url);return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.warn('Company analysis failure',e.name,['UNSAFE_URL','PAGE_UNAVAILABLE','PAGE_TOO_LARGE','PAGE_TIMEOUT','DNS_TIMEOUT','AI_UNAVAILABLE'].includes(e.message)?e.message:'processing');if(['UNSAFE_URL','PAGE_UNAVAILABLE','PAGE_TOO_LARGE','PAGE_TIMEOUT','DNS_TIMEOUT','TOO_MANY_REDIRECTS','AI_UNAVAILABLE'].includes(e.message)||e.code)return Response.json({error:'공개 페이지를 읽거나 AI 응답을 확인하지 못했습니다. HTTPS 회사 주소를 확인하거나 직접 상담을 시작해 주세요.'},{status:422});return fail(e);}finally{if(acquired)localBusy=false;}}
