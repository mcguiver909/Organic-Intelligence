import {randomBytes,createHash} from 'node:crypto';
import {identity,jsonBody,fail,quota,leadSchema} from '../../../lib/server';
import {crmProjection} from '../../../lib/consult.mjs';
export async function POST(req){try{
 const {db,user}=await identity(req);await quota(db,user.id,'lead');const input=leadSchema.parse(await jsonBody(req));
 const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
 const row={id:input.requestId,owner_id:user.id,name:input.name,company:input.company,email:input.email,slots:input.slots,summary:input.summary,crm:crmProjection(input),meeting:input.meeting,preferred_times:input.meeting?input.preferredTimes:[],email_consent:input.emailConsent,consent_at:new Date().toISOString(),consent_version:'hackathon-2026-10-v1',receipt_hash:hash,utm:input.utm};
 const {data,error}=await db.from('leads').insert(row).select('id').single();
 if(error?.code==='23505')return Response.json({error:'이미 접수된 요청입니다. 중복 저장하지 않았습니다. 팀 대시보드에서 확인해 주세요.'},{status:409});
 if(error)throw error;return Response.json({id:data.id,receipt:token,status:'saved'},{status:201});
 }catch(e){return fail(e);}}
