import {identity,quota,fail} from '../../../lib/server';
import {groundedAnalysis} from '../../../lib/company.mjs';
import {geminiCompanyAnalysis} from '../../../lib/company-ai.mjs';
import {maxDocumentBytes,documentKind,documentSources} from '../../../lib/document.mjs';
export const runtime='nodejs';
export const maxDuration=60;
async function extract(kind,buffer){
 if(kind==='pdf'){const {extractText,getDocumentProxy}=await import('unpdf');const pdf=await getDocumentProxy(new Uint8Array(buffer));const {text}=await extractText(pdf,{mergePages:true});return text;}
 const mammoth=(await import('mammoth')).default;return (await mammoth.extractRawText({buffer:Buffer.from(buffer)})).value;
}
export async function POST(req){try{
 const local=process.env.NODE_ENV==='development'&&!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)&&['127.0.0.1','localhost'].includes(new URL(req.url).hostname);
 if(!local){if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('DB_NOT_CONFIGURED');const {db,user}=await identity(req);await quota(db,user.id,'lead');}
 if(Number(req.headers.get('content-length')||0)>maxDocumentBytes+100000)return Response.json({error:'4MB 이하의 PDF 또는 DOCX 파일을 올려 주세요.'},{status:413});
 const form=await req.formData();const file=form.get('file');
 if(!file||typeof file==='string')return Response.json({error:'파일을 선택해 주세요.'},{status:400});
 const kind=documentKind(file.name,file.type);
 if(!kind)return Response.json({error:'PDF 또는 DOCX 파일만 분석할 수 있습니다.'},{status:415});
 if(file.size>maxDocumentBytes)return Response.json({error:'4MB 이하의 PDF 또는 DOCX 파일을 올려 주세요.'},{status:413});
 if(!process.env.GEMINI_API_KEY)return Response.json({error:'Gemini 서버 키 설정 후 사용할 수 있습니다. 직접 상담은 계속 이용할 수 있습니다.'},{status:503});
 let text;try{text=await extract(kind,await file.arrayBuffer());}catch{return Response.json({error:'문서를 읽지 못했습니다. 암호가 걸려 있거나 손상된 파일인지 확인해 주세요.'},{status:422});}
 const sources=documentSources(text,file.name);
 if(!sources.length)return Response.json({error:'문서에서 글자를 찾지 못했습니다. 스캔 이미지로 된 PDF는 분석할 수 없습니다.'},{status:422});
 const raw=await geminiCompanyAnalysis(sources);
 const result={...groundedAnalysis(raw,sources,sources[0].url),pageTitle:'',sourceType:'document'};
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.warn('Document analysis failure',e.name,e.message==='AI_UNAVAILABLE'?e.message:'processing');if(e.message==='AI_UNAVAILABLE')return Response.json({error:'AI 응답을 확인하지 못했습니다. 잠시 후 다시 시도하거나 직접 상담을 시작해 주세요.'},{status:422});return fail(e);}}
