import {randomBytes,createHash} from 'node:crypto';
import {z} from 'zod';
import {followupAllowed} from '../../../../lib/nurture-rules.mjs';
import {identity,quota,jsonBody,fail} from '../../../../lib/server';
import {mailProvider,sendMail} from '../../../../lib/mail';
export const maxDuration=30;
export async function POST(req){let db,jobId;try{
 const access=await identity(req,true);db=access.db;await quota(db,access.user.id,'email');const {id,draft}=z.object({id:z.uuid(),draft:z.string().trim().min(20).max(5000)}).parse(await jsonBody(req));
 if(!mailProvider()||!process.env.APP_URL)return Response.json({error:'후속 발송은 메일 발송 설정(Gmail 또는 Resend)과 APP_URL이 필요합니다. 아직 발송하지 않았습니다.'},{status:503});
 const base=new URL(process.env.APP_URL);if(base.protocol!=='https:'||base.username||base.password)throw Error('INVALID_APP_URL');
 const {data:review,error}=await db.from('nurture_reviews').select('*').eq('id',id).single();if(error||review?.status!=='승인 대기')return Response.json({error:'승인 대기 중인 근거가 있는 재접촉 후보만 발송할 수 있습니다.'},{status:409});
 const {data:lead}=await db.from('leads').select('*').eq('id',review.lead_id).single();if(!followupAllowed(lead))throw Error('FORBIDDEN');
 if(Date.parse(lead.nurture_due_at)>Date.now())return Response.json({error:'고객이 동의한 재확인 예정일 전에는 발송하지 않습니다.'},{status:409});
 const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
 const claim=await db.from('nurture_reviews').update({status:'발송 중',draft,approved_by:access.user.id,resume_hash:hash}).eq('id',id).eq('status','승인 대기').select('id').maybeSingle();if(claim.error||!claim.data)return Response.json({error:'이미 처리된 발송 요청입니다.'},{status:409});jobId=id;
 const resume=new URL('/#resume='+token,base).href,unsubscribe=new URL('/#unsubscribe='+token,base).href;
 const finalConsent=await db.from('leads').select('nurture_withdrawn_at').eq('id',lead.id).single();if(finalConsent.error||finalConsent.data?.nurture_withdrawn_at)throw Error('CONSENT_WITHDRAWN');
 const provider=await sendMail({to:lead.email,subject:'(광고) [ACRYL ONE] 이전 상담에 이어 확인할 AI 도입 정보',text:draft+'\n\n이전 상담 이어가기: '+resume+'\n후속 안내 수신 거부: '+unsubscribe+'\n\n수신 동의한 후속 제품 안내입니다.',idempotencyKey:'nurture-'+id});const update=await db.from('nurture_reviews').update({status:'메일 서비스 접수',provider_id:provider.id}).eq('id',id);if(update.error)throw update.error;await db.from('leads').update({nurture_status:'메일 서비스 접수'}).eq('id',lead.id);return Response.json({status:'accepted',message:'메일 서비스에 접수됐습니다. 실제 배달 완료는 확인되지 않았습니다.'});
 }catch(e){if(db&&jobId){await db.from('nurture_reviews').update({status:'발송 결과 확인 필요'}).eq('id',jobId);return Response.json({error:'발송 결과를 확정하지 못했습니다. 자동 재발송하지 않습니다.'},{status:502});}return fail(e);}}
