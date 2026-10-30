import 'server-only';
// One send path for both providers. Gmail (app password) can deliver to any address with no domain setup;
// Resend needs a verified domain to send to anyone other than the account owner.
export function mailProvider(){
 if(process.env.GMAIL_USER&&process.env.GMAIL_APP_PASSWORD)return 'gmail';
 if(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM)return 'resend';
 return null;
}
function gmailAuth(){return {user:process.env.GMAIL_USER?.trim(),pass:process.env.GMAIL_APP_PASSWORD?.replace(/\s/g,'')};}
async function gmailTransport(){
 const nodemailer=(await import('nodemailer')).default;
 return nodemailer.createTransport({service:'gmail',auth:gmailAuth(),connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
}
export function mailError(e){
 if(e?.code==='EAUTH')return 'Gmail 인증에 실패했습니다. 발신 계정과 Google 앱 비밀번호를 확인한 뒤 재배포해 주세요.';
 if(['ETIMEDOUT','ECONNECTION','ESOCKET','EDNS'].includes(e?.code))return '메일 서버 연결에 실패했습니다. 잠시 후 연결을 확인해 주세요.';
 return '메일 서비스 응답을 확인할 수 없습니다. 발송 기록을 확인해 주세요.';
}
export async function verifyMail(){
 const provider=mailProvider();
 if(!provider)return {configured:false,ready:false,message:'GMAIL_USER와 GMAIL_APP_PASSWORD를 Production 환경에 저장하고 재배포해 주세요.'};
 if(provider==='gmail'){
  try{const transport=await gmailTransport();try{await transport.verify();}finally{transport.close();}return {configured:true,ready:true,provider,message:'Gmail 서버 연결과 계정 인증에 성공했습니다. 실제 수신 여부는 테스트 발송으로 확인합니다.'};}
  catch(e){return {configured:true,ready:false,provider,message:mailError(e)};}
 }
 return {configured:true,ready:false,provider,message:'Resend 설정이 있습니다. 발신 도메인 인증과 테스트 수신 확인이 필요합니다.'};
}
export async function sendMail({to,subject,text,attachments=[],idempotencyKey}){
 const provider=mailProvider();
 if(provider==='gmail'){
  const transport=await gmailTransport();
  const from=process.env.EMAIL_FROM||`ACRYL ONE <${process.env.GMAIL_USER}>`;
  const info=await transport.sendMail({from,to,subject,text,headers:idempotencyKey?{'X-Entity-Ref-ID':idempotencyKey}:undefined,attachments:attachments.map(a=>({filename:a.filename,content:Buffer.from(a.content,'base64')}))});
  if(!info.accepted?.length)throw Error('PROVIDER_REJECTED');
  return {id:info.messageId};
 }
 if(provider==='resend'){
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json',...(idempotencyKey?{'Idempotency-Key':idempotencyKey}:{})},signal:AbortSignal.timeout(20000),body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,text,attachments})});
  const body=await r.json();if(!r.ok)throw Error('PROVIDER_REJECTED');return {id:body.id};
 }
 throw Error('MAIL_NOT_CONFIGURED');
}
