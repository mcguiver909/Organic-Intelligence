import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';
import {recommend,isCustom} from './consult.mjs';
import {productLineup} from './products.mjs';
import {consultationVideos} from './videos.mjs';
import {sourceLabel,isDocumentURL} from './document.mjs';

const W=595.28,H=841.89,X=44,CW=W-2*X,BOTTOM=64;
const ink=rgb(.08,.09,.12),muted=rgb(.45,.47,.52),faint=rgb(.6,.62,.66),brand=rgb(.141,.341,.694),purple=rgb(.42,.33,.83),boxFill=rgb(.955,.958,.965),line=rgb(.86,.87,.9),barBg=rgb(.9,.92,.95);
const clean=t=>String(t??'').replace(/[\x00-\x08\x0b-\x1f]/g,'').trim();
const kstDate=d=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(d));const g=t=>p.find(x=>x.type===t).value;return `${g('year')}.${g('month')}.${g('day')}`;};
const kstTime=t=>new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST';
export const pdfLabels={goal:'도입 목적',needType:'도입 방식',customTask:'대상 업무',dataReadiness:'데이터 준비',environment:'운영·연동 환경',scale:'운영 규모',timeline:'검토 일정',successCriteria:'성공 기준'};

export async function makePdf(lead){
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const font=await doc.embedFont(await fs.readFile(path.join(process.cwd(),'assets/NanumGothic-Regular.ttf')),{subset:false});
 let page,y,pageNo=0;
 const width=(t,s)=>font.widthOfTextAtSize(t,s);
 function wrapLines(text,size,max=CW){const out=[];for(const raw of clean(text).split('\n')){let row='';for(const c of raw){if(width(row+c,size)>max){out.push(row);row=c;}else row+=c;}out.push(row);}return out.filter((r,i,a)=>r||a.length===1);}
 function newPage(){page=doc.addPage([W,H]);pageNo++;y=H-60;if(pageNo>1)page.drawText('ACRYL ONE',{x:X,y:H-40,size:8,font,color:faint});page.drawText(String(pageNo),{x:W-X-8,y:30,size:8,font,color:faint});}
 function ensure(h){if(y-h<BOTTOM)newPage();}
 function text(t,{size=10,color=ink,x=X,max=CW-(x-X),gap=4}={}){for(const r of wrapLines(t,size,max)){ensure(size+gap);page.drawText(r,{x,y:y-size,size,font,color});y-=size+gap;}}
 function check(x,yy,c=brand){page.drawLine({start:{x,y:yy+4},end:{x:x+3,y:yy+1},thickness:1.4,color:c});page.drawLine({start:{x:x+3,y:yy+1},end:{x:x+8,y:yy+8},thickness:1.4,color:c});}
 function box(lines,{fill,border,pad=14}){
  // lines: [{t,size,color}] measured first so the box never splits across pages
  const rows=lines.flatMap(l=>wrapLines(l.t,l.size||10,CW-2*pad).map(r=>({...l,t:r})));
  const h=rows.reduce((s,r)=>s+(r.size||10)+(r.gap??5),0)+2*pad;
  ensure(h+8);const top=y;
  page.drawRectangle({x:X,y:top-h,width:CW,height:h,color:fill,borderColor:border,borderWidth:border?1.4:0});
  y=top-pad;for(const r of rows){const s=r.size||10;page.drawText(r.t,{x:X+pad,y:y-s,size:s,font,color:r.color||ink});y-=s+(r.gap??5);}
  y=top-h-14;
 }
 let n=0;const section=t=>{n++;ensure(52);y-=10;page.drawText(String(n).padStart(2,'0'),{x:X,y:y-13,size:13,font,color:brand});page.drawText(t,{x:X+26,y:y-13,size:13,font,color:ink});y-=13+4;page.drawLine({start:{x:X,y},end:{x:X+CW,y},thickness:.6,color:line});y-=10;};
 const bullet=(t,{size=10.5,color=ink}={})=>{const rows=wrapLines(t,size,CW-14);ensure(size+4);page.drawText('•',{x:X+2,y:y-size,size,font,color:brand});for(const r of rows){ensure(size+4);page.drawText(r,{x:X+14,y:y-size,size,font,color});y-=size+4;}};

 const brief=lead.customer_brief||lead.brief;
 const slots=lead.slots||{};
 const analysis=lead.company_analysis||lead.companyAnalysis;
 const fit=lead.productFit||lead.lead_score?.productFit||lead.signals?.productFit||[];
 const products=recommend(slots);
 const times=lead.preferred_times||lead.preferredTimes||[];

 // Header
 newPage();
 page.drawText('ACRYL ONE',{x:X,y:y-10,size:10,font,color:brand});y-=24;
 text('AI 도입 상담·미팅 준비 브리프',{size:21,gap:8});
 const name=clean(lead.name);
 text([clean(lead.company)||'회사명 미입력',name||null,kstDate(brief?.generatedAt||lead.created_at||Date.now())].filter(Boolean).join(' · '),{size:10,color:muted});
 y-=8;

 // At a glance
 const worry=brief?.issues?.[0]?.summary||clean(lead.summary).replace(/\s+/g,' ').slice(0,60);
 const direction=products.length?products.map(p=>p.id).join(' · '):isCustom(slots)?'맞춤 개발·연동 검토':'미팅에서 후보 선정';
 const next=lead.meeting?'30분 진단 미팅 · 담당자 확인 중':'30분 진단 미팅에서 범위 확정';
 box([{t:'한눈에 보기',size:9,color:muted,gap:8},{t:'고민   '+worry,size:10.5},{t:'추천 방향   '+direction,size:10.5},{t:'다음 단계   '+next,size:10.5,gap:0}],{fill:boxFill});

 // 01
 const said=[...(brief?.issues||[]),...(brief?.requirements||[])].filter(x=>clean(x?.summary));
 if(said.length){section('말씀해 주신 내용');for(const it of said){bullet(it.summary);if(clean(it.evidence))text('“'+clean(it.evidence)+'”',{size:8.5,color:faint,x:X+14,gap:3});y-=3;}}

 // 02
 const facts=(analysis?.facts||[]).filter(f=>clean(f.quote)).slice(0,3);
 if(facts.length){section(isDocumentURL(analysis.url)?'회사 문서에서 확인한 내용':'홈페이지에서 확인한 내용');for(const f of facts)bullet('“'+clean(f.quote)+'”',{size:10});text((isDocumentURL(analysis.url)?'참고 문서  ':'참고 홈페이지  ')+(isDocumentURL(analysis.url)?sourceLabel(analysis.url):analysis.url),{size:8.5,color:faint});}

 // 03
 if(products.length){section('추천 솔루션');for(const p of products){
  const f=fit.find(x=>x.product===p.id);const desc=productLineup.find(x=>x.id===p.id)?.summary||p.description;
  ensure(60);const top=y;page.drawText(p.id,{x:X,y:top-12,size:12,font,color:ink});page.drawText(p.id,{x:X+.35,y:top-12,size:12,font,color:ink});
  if(f){const bx=X+150,bw=200;page.drawRectangle({x:bx,y:top-11,width:bw,height:7,color:barBg});page.drawRectangle({x:bx,y:top-11,width:Math.max(2,bw*f.score/100),height:7,color:brand});page.drawText(f.score+'%',{x:bx+bw+8,y:top-12,size:10,font,color:brand});}
  y=top-18;text(desc,{size:10});text('공식 자료  '+p.source,{size:8.5,color:faint});y-=6;}}

 // 04 (always)
 section('확인된 조건 / 확인할 조건');
 const rows=Object.entries(pdfLabels);
 const c1=118,rowPad=7;
 for(const [k,label] of rows){
  const v=clean(slots[k]);const vs=v?wrapLines(v,10,CW-c1-28):['미팅에서 확인'];const h=vs.length*14+2*rowPad;
  ensure(h);const top=y;
  page.drawLine({start:{x:X,y:top},end:{x:X+CW,y:top},thickness:.5,color:line});
  page.drawText(label,{x:X+4,y:top-rowPad-10,size:10,font,color:muted});
  if(v)check(X+c1,top-rowPad-10);else page.drawText('□',{x:X+c1,y:top-rowPad-10,size:10,font,color:faint});
  vs.forEach((r,i)=>page.drawText(r,{x:X+c1+16,y:top-rowPad-10-i*14,size:10,font,color:v?ink:faint}));
  y=top-h;
 }
 page.drawLine({start:{x:X,y},end:{x:X+CW,y},thickness:.5,color:line});y-=6;

 // 05 (always)
 section('미팅에서 함께 정할 것');
 const qs=brief?.openQuestions?.length?brief.openQuestions:products.map(p=>p.question);
 (qs.length?qs:['어떤 업무를 먼저 개선하고, 어떤 기준으로 도입 효과를 확인할까요?']).forEach((q,i)=>{const rows2=wrapLines(q,10.5,CW-20);rows2.forEach((r,j)=>{ensure(15);if(!j)page.drawText(`${i+1}.`,{x:X+2,y:y-10.5,size:10.5,font,color:brand});page.drawText(r,{x:X+20,y:y-10.5,size:10.5,font,color:ink});y-=15;});});

 // 06 (always)
 section('미팅 전에 챙기면 좋은 것');
 const prep=brief?.preparation?.length?brief.preparation:['현재 업무 흐름, 데이터 종류, 운영 환경과 연동 제약을 정리해 주세요. 환자·개인·기밀 정보는 제외해 주세요.'];
 for(const p of prep){const rows3=wrapLines(p,10.5,CW-20);rows3.forEach((r,j)=>{ensure(15);if(!j)page.drawText('□',{x:X+2,y:y-10.5,size:10.5,font,color:muted});page.drawText(r,{x:X+20,y:y-10.5,size:10.5,font,color:ink});y-=15;});}

 // 07
 const videos=consultationVideos(slots);
 if(videos.length){section('먼저 보면 좋은 영상');for(const v of videos){bullet(`${v.title} (${v.duration})`);text('https://www.youtube.com/watch?v='+v.id,{size:8.5,color:faint,x:X+14});y-=2;}}

 // Next step
 y-=6;
 const nextLines=lead.meeting?[{t:'다음 단계',size:9,color:purple,gap:8},...times.slice(0,2).map((t,i)=>({t:`${i+1}순위  ${kstTime(t)}`,size:10.5})),...(lead.confirmed_start?[{t:'팀 확정 일정  '+kstTime(lead.confirmed_start),size:10.5}]:[]),{t:'담당자 확인 후 확정 안내',size:10.5,gap:0}]
  :[{t:'다음 단계',size:9,color:purple,gap:8},{t:'이 진단서로 30분 미팅을 요청하세요',size:11.5,gap:process.env.APP_URL?6:0},...(process.env.APP_URL?[{t:process.env.APP_URL,size:9.5,color:brand,gap:0}]:[])];
 box(nextLines,{fill:rgb(1,1,1),border:purple});

 // Footer
 const foot='고객님과의 대화를 바탕으로 정리한 자료이며, 가격·성과·구현 가능성은 미팅에서 확정됩니다. 해커톤 데모 서비스입니다.';
 ensure(24);text(foot+'  상담번호 '+clean(lead.id||lead.requestId),{size:7.5,color:faint,gap:3});
 return doc.save();
}
