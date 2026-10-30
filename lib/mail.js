import 'server-only';
// One send path for both providers. Gmail (app password) can deliver to any address with no domain setup;
// Resend needs a verified domain to send to anyone other than the account owner.
export function mailProvider(){
 if(process.env.GMAIL_USER&&process.env.GMAIL_APP_PASSWORD)return 'gmail';
 if(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM)return 'resend';
 return null;
}
export async function sendMail({to,subject,text,attachments=[],idempotencyKey}){
 const provider=mailProvider();
 if(provider==='gmail'){
  const nodemailer=(await import('nodemailer')).default;
  const transport=nodemailer.createTransport({service:'gmail',auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}});
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
