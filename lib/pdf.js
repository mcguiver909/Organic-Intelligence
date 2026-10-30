import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';
import {confirmedProblems} from './company.mjs';
import {recommend,isCustom} from './consult.mjs';
export async function makePdf(lead){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const font=await doc.embedFont(await fs.readFile(path.join(process.cwd(),'assets/NanumGothic-Regular.ttf')),{subset:true});
 let page,y;
 const newPage=()=>{page=doc.addPage([595.28,841.89]);y=780;page.drawText('ACRYL ONE / AI+X HACKATHON DEMO',{x:44,y:810,size:9,font,color:rgb(.25,.35,.5)});};
 newPage();
 const line=(text,size=11,color=rgb(.12,.17,.25))=>{if(y<65)newPage();page.drawText(text,{x:44,y,size,font,color});y-=size+8;};
 const wrap=(text,size=11)=>{for(const raw of String(text||'미확인').replace(/[\x00-\x08\x0b-\x1f]/g,'').split('\n')){let s='';for(const c of raw){if(font.widthOfTextAtSize(s+c,size)>505){line(s,size);s=c;}else s+=c;}if(s)line(s,size);}y-=6;};
 line(isCustom(lead.slots)?'맞춤 AI 개발 검토 브리프':'AI 도입 검토 브리프',22);line('자동 생성된 해커톤 데모 자료 · 공식 견적 아님',10);y-=14;
 wrap(`기관: ${lead.company} / 담당자: ${lead.name}`);wrap(`상담 ID: ${lead.id}`);wrap(`작성 기준: ${new Date(lead.created_at||Date.now()).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} KST`);
 line('01  고객 요구사항',14);wrap(lead.summary);
 const analysis=lead.company_analysis||lead.companyAnalysis;
 if(analysis){line('회사 공개 정보 · 고객 확인 결과',14);wrap(`홈페이지: ${analysis.url}`,9);for(const problem of confirmedProblems(analysis))wrap(`고객 확인/수정: ${problem}`);for(const h of analysis.hypotheses){wrap(`${{yes:'확인',no:'부정',different:'수정',pending:'미응답'}[h.response]}: ${h.title}`,9);if(h.correction)wrap(h.correction,9);wrap(`질문의 공개 근거: ${h.quote}`,9);wrap(h.url,8);}wrap('공개 정보는 질문의 근거이며 실제 문제·성과의 증거가 아닙니다. 유사 기업 성공 사례·정량 효과는 확인하지 않았습니다.',9);}
 line('02  확인된 도입 조건',14);
 const labels={track:'검토 분야',needType:'도입 방식',goal:'목적',industry:'산업',customTask:'개발할 업무',dataReadiness:'데이터 준비 상태',successCriteria:'PoC 성공 기준',environment:'환경·연동 제약',scale:'규모',timeline:'일정',budget:'예산',requestType:'요청'};
 for(const [k,label]of Object.entries(labels)){if(['customTask','dataReadiness','successCriteria'].includes(k)&&!isCustom(lead.slots))continue;wrap(`${label}: ${lead.slots[k]||'미확인'}`);}
 line('03  제품 검토 후보와 공식 근거',14);
 const products=recommend(lead.slots);
 if(!products.length)wrap(isCustom(lead.slots)?'맞춤 개발 검토입니다. 업무의 입력·처리·결과, 데이터 확보, 연동 범위, PoC 기준을 확인한 뒤 기존 제품 구성과 별도 개발 범위를 함께 검토합니다. 기술적 가능성·비용·일정은 확정하지 않았습니다.':'요구사항에 맞는 제품을 확정하지 않았습니다. 담당자 검토가 필요합니다.');
 for(const p of products){wrap(`${p.id}: ${p.description}`);wrap(`연결 이유: 고객이 확인한 목적 '${p.goal}'과 제품의 공식 기능 범위가 일치합니다.`);wrap(`공식 출처: ${p.source}`,9);wrap(`참조 섹션: ${p.section} / 확인일 ${p.verified}`,9);wrap(`추가 확인: ${p.question}`);}
 line('04  미팅에서 확인할 사항',14);wrap('보유 환경과 제약, 현재 운영의 어려움, 적용 가능한 제품 구성과 PoC 성공 기준을 확인합니다. 가격은 별도 협의이며, 성능·절감 효과는 고객 환경 진단 없이 확정하지 않습니다.');
 if(lead.meeting){const times=lead.preferred_times||lead.preferredTimes||[];wrap('미팅 희망 일시 (KST): '+(times.length?times.map(t=>new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})).join(' / '):'담당자와 협의'));if(lead.confirmed_start)wrap('해커톤 팀 확정 일정 (KST): '+new Date(lead.confirmed_start).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}));wrap('30분 온라인 도입 진단 미팅. 확정 일정이 기재되지 않은 경우 희망 일정 접수 상태입니다. 실제 ACRYL 담당자 캘린더에는 등록되지 않습니다. 미팅 링크는 담당자가 별도 안내합니다.');}
 wrap('담당자가 상담 내용을 검토하고 추가 환경 정보를 확인한 뒤 기술 미팅 또는 PoC 범위를 협의합니다.');
 return doc.save();
}
