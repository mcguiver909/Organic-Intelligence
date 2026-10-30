import {z} from 'zod';
import {identity,jsonBody,fail,quota} from '../../../lib/server';
import {makePdf} from '../../../lib/pdf';
import {mailProvider,sendMail,verifyMail,mailError} from '../../../lib/mail';
export const maxDuration=30;
export async function GET(req){try{
 await identity(req,true);
 return Response.json(await verifyMail(),{headers:{'Cache-Control':'no-store'}});
}catch(e){return fail(e);}}

export async function POST(req){try{
 const {db,user}=await identity(req,true);await quota(db,user.id,'email');const {id}=z.object({id:z.uuid()}).parse(await jsonBody(req));
 if(!mailProvider())return Response.json({error:'메일 발송 설정이 없습니다. Gmail 앱 비밀번호(GMAIL_USER·GMAIL_APP_PASSWORD) 또는 Resend 키와 인증된 발신주소를 설정해 주세요.'},{status:503});
 const {data:lead,error}=await db.from('leads').select('*').eq('id',id).single();if(error||!lead)throw error||Error('missing');
 if(!lead.email_consent)return Response.json({error:'제안서 이메일 수신에 동의하지 않은 상담입니다.'},{status:400});
 // Atomic claim prevents concurrent sends. An uncertain network outcome stays blocked for manual review.
 const {data:job,error:claimError}=await db.from('email_jobs').insert({lead_id:id,status:'sending',requested_by:user.id}).select('*').single();
 if(claimError)return Response.json({error:'이미 발송을 요청한 상담입니다. 발송 기록을 확인해 주세요.'},{status:409});
 try{
  const {data:booking,error:bookingError}=await db.from('meeting_bookings').select('start_at').eq('lead_id',id).maybeSingle();if(bookingError)throw bookingError;
  const pdf=await makePdf({...lead,confirmed_start:booking?.start_at});
  const provider=await sendMail({to:lead.email,subject:'[ACRYL ONE 해커톤 데모] AI 도입 진단 미팅 준비서',text:'상담 내용에 따른 도입 검토 안내서를 첨부합니다. 자동 생성된 해커톤 데모 자료이며 공식 견적이나 성능 보증이 아닙니다. 가격과 적용 가능 범위는 ACRYL 담당자 확인이 필요합니다.',attachments:[{filename:'ACRYL-ONE-proposal.pdf',content:Buffer.from(pdf).toString('base64')}],idempotencyKey:`proposal-${id}`});
  const update=await db.from('email_jobs').update({status:'accepted',provider_id:provider.id}).eq('id',job.id);if(update.error)throw update.error;
  return Response.json({status:'accepted',message:'메일 서비스가 접수했습니다. 실제 수신·전달 완료는 확인되지 않았습니다.'});
 }catch(e){await db.from('email_jobs').update({status:'needs_review'}).eq('id',job.id);return Response.json({error:mailError(e)+' 자동 재발송하지 않습니다.'},{status:502});}
 }catch(e){return fail(e);}}
