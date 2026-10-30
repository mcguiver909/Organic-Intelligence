// Live AI analysis shown beside the consultation chat.
// Shared by the server route (validates Gemini output) and the browser (rule fallback).
import {isCustom} from './consult.mjs';

export const fitProducts=['JONATHAN','GPUBASE','AGENTBASE','MODELBASE','ALLM.H','NADIA-ANE','맞춤 개발'];
export const intentStages=['정보 탐색','문제 인식','해결책 비교','도입 검토'];
export const requestCategories=['견적·가격 문의','도입 검토','미팅 요청','제휴·투자 문의','자료 요청','기타 문의','없음'];

// ACRYL CRM dataset ① (v4.2) aggregate: prospects grouped by 최근요청유형,
// share registered as lead grade A/B. Lead grades are simulated by the data provider.
export const crmBenchmark={
 '견적·가격 문의':{n:8,ab:1.0},
 '도입 검토':{n:30,ab:0.933},
 '미팅 요청':{n:17,ab:0.882},
 '제휴·투자 문의':{n:9,ab:0.778},
 '자료 요청':{n:113,ab:0.469},
 '기타 문의':{n:18,ab:0.222},
 '없음':{n:2553,ab:0.119}
};

export const insightJsonSchema={type:'object',properties:{
 intent:{type:'object',properties:{stage:{type:'string',enum:intentStages},evidence:{type:'string'}},required:['stage','evidence']},
 requestCategory:{type:'string',enum:requestCategories},
 productFit:{type:'array',items:{type:'object',properties:{product:{type:'string',enum:fitProducts},score:{type:'integer'},evidence:{type:'string'}},required:['product','score','evidence']}},
 nextQuestions:{type:'array',items:{type:'string'}}
},required:['intent','requestCategory','productFit','nextQuestions']};

export const insightInstruction='Also return "analysis" describing the WHOLE conversation so far (history user turns + current text), for a live analysis panel shown to the customer. intent.stage: "정보 탐색" (only browsing), "문제 인식" (described a concrete problem), "해결책 비교" (comparing options or asking product fit), "도입 검토" (talks about adoption, budget, schedule, PoC, quote or meeting). requestCategory: the closest of the listed CRM request types for what the customer asked ACRYL, "없음" if none. productFit: score 0-100 for every product the customer gave evidence for (JONATHAN = whole AX platform combining the three modules, ALLM.H = medical LLM, NADIA-ANE = natural-language query over hospital EMR/HIS data), including "맞춤 개발" for custom development/integration; 0-30 weak, 31-70 plausible, 71-100 strong and explicit. Never score above 30 without a concrete stated need. Each evidence (and intent.evidence) MUST be an exact substring copied from a customer message; use "" if none. nextQuestions: up to 3 short Korean labels (max 30 chars) of the most important still-unknown information. Do not include contacts or personal data.';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,Math.round(Number(v)||0)));
const found=(texts,e)=>typeof e==='string'&&e.trim().length>=2&&texts.some(t=>t.includes(e));

// Validate model output: enums only, scores clamped, evidence must be verbatim customer text.
export function sanitizeInsight(raw,userTexts){
 const a=raw&&typeof raw==='object'?raw:{};
 const stage=intentStages.includes(a.intent?.stage)?a.intent.stage:'정보 탐색';
 const intentEvidence=found(userTexts,a.intent?.evidence)?a.intent.evidence.slice(0,160):'';
 const seen=new Set();let checked=0,verified=0;
 const productFit=(Array.isArray(a.productFit)?a.productFit:[]).filter(p=>fitProducts.includes(p?.product)&&!seen.has(p.product)&&seen.add(p.product)).map(p=>{
  checked++;const ok=found(userTexts,p.evidence);if(ok)verified++;
  return {product:p.product,score:ok?clamp(p.score,0,100):Math.min(clamp(p.score,0,100),30),evidence:ok?p.evidence.slice(0,160):'',verified:ok};
 }).sort((x,y)=>y.score-x.score);
 return {
  intent:{stage,evidence:intentEvidence},
  requestCategory:requestCategories.includes(a.requestCategory)?a.requestCategory:'없음',
  productFit,
  nextQuestions:(Array.isArray(a.nextQuestions)?a.nextQuestions:[]).filter(q=>typeof q==='string'&&q.trim()).slice(0,3).map(q=>q.trim().slice(0,40)),
  evidenceCheck:{checked,verified}
 };
}

const productRules=[
 ['GPUBASE',/gpu|가속기|자원\s*(배분|분배|공유)|클러스터|데이터센터|추론\s*(최적화|서버)|h100|h200|a100|엔비디아|nvidia|서버/i,'GPU 운영 효율'],
 ['AGENTBASE',/챗봇|문서|검색|에이전트|rag|지식|상담\s*자동|업무\s*자동화|답변/i,'사내 AI 챗봇'],
 ['MODELBASE',/모델\s*(개발|학습|배포|운영|서빙)|mlops|파인\s*튜닝|드리프트|모니터링/i,'모델 개발·운영'],
 ['NADIA-ANE',/emr|his|임상\s*데이터|의료\s*데이터|진료\s*기록|데이터\s*(조회|추출)/i,null],
 ['ALLM.H',/의료\s*(llm|언어\s*모델|ai|특화)|병원|진료|간호|환자|제약|바이오/i,'의료 AI'],
 ['JONATHAN',/전체\s*(인프라|플랫폼)|통합\s*플랫폼|ax\s*인프라|jonathan|조나단/i,null],
 ['맞춤 개발',/맞춤|커스텀|연동|erp|개발해|구축/i,null]
];
const requestRules=[
 ['견적·가격 문의',/견적|가격|비용|얼마/],
 ['미팅 요청',/미팅|만나|방문|상담\s*일정|통화/],
 ['도입 검토',/도입|poc|구축\s*예정|검토\s*중/i],
 ['제휴·투자 문의',/제휴|투자|파트너/],
 ['자료 요청',/자료|소개서|브로슈어|카탈로그/]
];
function firstMatch(texts,re){for(const t of [...texts].reverse()){const m=t.match(re);if(m)return m[0];}return '';}

// Keyword fallback used when Gemini is unavailable. Evidence is always verbatim.
export function ruleInsight(userTexts,slots){
 const productFit=productRules.map(([product,re,goal])=>{
  const hits=userTexts.reduce((n,t)=>n+(t.match(new RegExp(re.source,'gi'))||[]).length,0);
  let score=Math.min(70,hits*22);
  if(goal&&slots.goal===goal)score=Math.max(score,75);
  if(product==='맞춤 개발'&&isCustom(slots))score=Math.max(score,75);
  return {product,score,evidence:firstMatch(userTexts,re),verified:true};
 }).filter(p=>p.score>0).sort((x,y)=>y.score-x.score);
 const req=requestRules.find(([,re])=>userTexts.some(t=>re.test(t)));
 const problem=firstMatch(userTexts,/[^.!?\n]{0,20}(어렵|느리|오래\s*걸|비효율|부족|문제|불편)[^.!?\n]{0,10}/);
 const stage=req&&req[0]!=='자료 요청'?'도입 검토':/어떤 제품|맞나요|차이|비교/.test(userTexts.join(' '))?'해결책 비교':problem?'문제 인식':'정보 탐색';
 return {
  intent:{stage,evidence:req?firstMatch(userTexts,req[1]):problem.trim()},
  requestCategory:req?req[0]:'없음',
  productFit,
  nextQuestions:missingInfo(slots).slice(0,3),
  evidenceCheck:{checked:productFit.length,verified:productFit.length}
 };
}

export const slotLabels={track:'검토 분야',needType:'도입 방식',goal:'도입 목적',industry:'산업 / 업무',customTask:'개발할 업무',dataReadiness:'데이터 준비 상태',successCriteria:'성공 기준',environment:'운영 환경',scale:'규모 / 현재 문제',timeline:'도입 일정',budget:'예산',requestType:'요청 유형',jobTitle:'직책'};
export function requiredSlots(slots){return isCustom(slots)?['goal','needType','customTask','dataReadiness','environment','successCriteria','timeline']:['goal','industry','environment','scale','timeline'];}
export function missingInfo(slots){return requiredSlots(slots).filter(k=>!slots[k]||slots[k]==='아직 모르겠어요').map(k=>slotLabels[k]);}
export function completeness(slots){const r=requiredSlots(slots);return Math.round(100*r.filter(k=>slots[k]&&slots[k]!=='아직 모르겠어요').length/r.length);}
