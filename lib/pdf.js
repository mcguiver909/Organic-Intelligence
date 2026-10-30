import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';
import {recommend,isCustom} from './consult.mjs';
export async function makePdf(lead){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);const font=await doc.embedFont(await fs.readFile(path.join(process.cwd(),'assets/NanumGothic-Regular.ttf')),{subset:true});let page,y,pageNo=0;
 const ink=rgb(.08,.08,.08),muted=rgb(.4,.4,.4);
 function newPage(){page=doc.addPage([595.28,841.89]);pageNo++;y=775;page.drawText('ACRYL ONE  /  MEETING BRIEF',{x:44,y:806,size:9,font,color:muted});page.drawText(String(pageNo),{x:540,y:30,size:9,font,color:muted});}
 function line(text,size=10,color=ink){if(y<65)newPage();page.drawText(text,{x:44,y,size,font,color});y-=size+5;}
 function wrap(text,size=10,color=ink){for(const raw of String(text||'미확인').replace(/[\x00-\x08\x0b-\x1f]/g,'').split('\n')){let row='';for(const c of raw){if(font.widthOfTextAtSize(row+c,size)>505){line(row,size,color);row=c;}else row+=c;}if(row)line(row,size,color);}y-=3;}
 function section(title){if(y<130)newPage();y-=8;line(title,12);y-=3;}
 function bullets(items,fallback){if(!items?.length){if(fallback)wrap(fallback,10,muted);return;}for(const item of items)wrap('• '+(typeof item==='string'?item:item.summary));}
 newPage();line('AI 도입 상담·미팅 준비 브리프',21);y-=7;
 const brief=lead.customer_brief||lead.brief;
 wrap('상담기업  '+lead.company,11);wrap('상담자  '+(lead.name||'미입력')+'  |  작성일시  '+new Date(brief?.generatedAt||lead.created_at||Date.now()).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST',9,muted);
 wrap('상담번호  '+lead.id,8,muted);if(lead.company_analysis?.url||lead.companyAnalysis?.url)wrap('참고 홈페이지  '+(lead.company_analysis||lead.companyAnalysis).url,8,muted);
 section('01  현재 상황과 상담에서 확인한 요구');
 bullets(brief?.issues,lead.summary);if(brief?.requirements?.length)bullets(brief.requirements);
 section('02  함께 검토할 도입 조건');
 const labels={goal:'도입 목적',needType:'도입 방식',customTask:'대상 업무',dataReadiness:'데이터 준비',environment:'운영·연동 환경',scale:'운영 규모',timeline:'검토 일정',successCriteria:'성공 기준'};
 const known=Object.entries(labels).filter(([k])=>lead.slots[k]);for(const [k,label] of known)wrap(label+'  '+lead.slots[k]);if(!known.length)wrap('구체적인 업무·운영 조건은 미팅에서 추가 확인이 필요합니다.',10,muted);
 section('03  검토 방향과 공식 자료');
 const products=recommend(lead.slots);if(!products.length)wrap(isCustom(lead.slots)?'맞춤 개발·연동 검토: 업무의 입력·처리·결과와 데이터, 보안·연동 제약을 확인해 구현 범위와 PoC 기준을 협의합니다.':'제품 적합성은 아직 확정하지 않았습니다. 업무와 환경을 확인한 뒤 후보를 좁힙니다.');
 for(const p of products){wrap(p.id+'  '+p.description);wrap('공식 기능 근거: '+p.source,8,muted);}
 section('04  미팅에서 함께 확인할 질문');
 bullets(brief?.openQuestions?.length?brief.openQuestions:products.map(p=>p.question),'어떤 업무를 먼저 개선하고, 어떤 기준으로 도입 효과를 확인할까요?');
 section('05  미팅 전에 준비하면 좋은 자료');
 bullets(brief?.preparation,'현재 업무 흐름, 데이터 종류, 운영 환경과 연동 제약을 정리해 주세요. 환자·개인·기밀 정보는 제외해 주세요.');
 section('06  미팅 희망 일정과 다음 단계');
 const times=lead.preferred_times||lead.preferredTimes||[];
 if(lead.meeting){wrap('30분 온라인 도입 진단 미팅 희망 · 담당자 확인 후 확정');for(const [i,t] of times.entries())wrap((i+1)+'순위  '+new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST');if(lead.confirmed_start)wrap('팀 확정 일정  '+new Date(lead.confirmed_start).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST');}
 else wrap('미팅은 아직 신청하지 않았습니다. 원하시는 경우 이 브리프를 바탕으로 30분 도입 진단 미팅을 요청하실 수 있습니다.');
 y-=7;wrap((brief?.engine==='gemini'?'Gemini가 고객 대화를 요약한 검토 자료입니다.':'고객 입력을 바탕으로 정리한 검토 자료입니다.')+' 가격·성과·개발 가능성은 확정 전입니다. 실제 ACRYL 담당자 캘린더와 연결되지 않은 해커톤 독립 데모입니다.',8,muted);
 return doc.save();
}
