export const goals = ['GPU 운영 효율','사내 AI 챗봇','모델 개발·운영','의료 AI','아직 모르겠어요'];
export const needTypes=['기존 제품 도입','맞춤 개발·시스템 연동','아직 판단하기 어려움'];
export const catalog = [
 {id:'GPUBASE',goal:goals[0],description:'GPU 성능 최적화, 자원 격리·통합, 통합 모니터링을 지원합니다.',source:'https://www.acryl.ai/products/gpubase',section:'3개 모듈 · 한 플랫폼',verified:'2026-10-30',question:'GPU 종류·대수와 현재 자원 배분 방식은 어떻게 되나요?'},
 {id:'AGENTBASE',goal:goals[1],description:'시각적 워크플로우로 LLM 에이전트를 구축·운영하며, RAG 지식 관리와 서비스 배포를 지원합니다.',source:'https://www.acryl.ai/products/agentbase',section:'AGENTBASE 핵심 모듈',verified:'2026-10-30',question:'검색할 사내 문서와 사용자가 이용할 채널은 무엇인가요?'},
 {id:'MODELBASE',goal:goals[2],description:'모델 개발, 학습·카탈로그, 서빙·실시간 모니터링을 하나의 흐름으로 관리합니다.',source:'https://www.acryl.ai/products/modelbase',section:'MODELBASE 핵심 모듈',verified:'2026-10-30',question:'현재 모델 개발 도구와 배포·모니터링에서 가장 어려운 부분은 무엇인가요?'}
];
export const solutionTracks=[{id:'AI 데이터센터 운영',title:'다른 고객에게 GPU·AI 인프라를 제공해요',summary:'고객별 자원 격리, 과금, 학습·추론 품질과 통합 관제 문제를 확인합니다.',source:'https://www.acryl.ai/solutions/data-center'},{id:'기업·공공 AX',title:'우리 조직의 업무에 AI를 도입해요',summary:'사내 지식 검색, 고객 상담, 데이터 조회, 모델 운영과 보안 요구를 확인합니다.',source:'https://www.acryl.ai/solutions/enterprise'},{id:'헬스케어 AX',title:'병원·바이오의 업무에 AI를 도입해요',summary:'의료 데이터 질의, 의료 특화 모델, 병원 내 운영 목적을 구분해 담당자 검토로 연결합니다.',source:'https://www.acryl.ai/solutions/healthcare'}];
export const blankSlots={track:'',needType:'',goal:'',industry:'',customTask:'',dataReadiness:'',successCriteria:'',environment:'',scale:'',timeline:'',budget:'',requestType:''};
export function isCustom(slots){return slots.needType===needTypes[1];}
export function inferGoal(text){
 if(/간호|의료|병원|진료|emr/i.test(text))return goals[3];
 if(/gpu|가속기|자원.*배분|데이터센터 운영/i.test(text))return goals[0];
 if(/챗봇|문서.*검색|사내.*검색|에이전트|rag/i.test(text))return goals[1];
 if(/mlops|모델.*(개발|학습|배포|운영)|드리프트/i.test(text))return goals[2];
 return '';
}
export function recommend(slots){if(isCustom(slots))return [];return catalog.filter(p=>p.goal===slots.goal);}
export function reply(slots){
 if(isCustom(slots)){
  const q=!slots.customTask?'어떤 담당자가 어떤 입력을 받아 어떤 결과를 만드는 업무인가요? 예: 연구원이 논문과 내부 보고서를 읽고 후보 물질 검토표를 작성합니다.':!slots.dataReadiness?'사용할 문서·데이터의 종류와 준비 상태는 어떤가요? 실제 환자 정보·회사 기밀 대신 자료의 종류만 알려주세요.':!slots.environment?'기존 시스템과의 연동, 온프레미스·클라우드 등 운영 제약은 무엇인가요?':!slots.successCriteria?'PoC가 성공했다고 판단할 기준은 무엇인가요? 예: 처리 시간, 담당자 검토 정확도, 기존 시스템 연동 여부.':'도입 검토 브리프를 만들면 맞춤 개발의 업무 범위·데이터·운영 제약·성공 기준을 담당자와 함께 확인할 수 있습니다.';
  return `맞춤 개발·시스템 연동 검토로 분기했습니다. 제품을 바로 확정하지 않고 업무와 개발 범위를 먼저 정리하겠습니다.\n${q}\n개발 가능 여부·일정·비용은 기술 검토 후 확인됩니다.`;
 }
 const p=recommend(slots)[0];
 if(slots.goal===goals[3])return '의료·바이오 AI는 기존 제품 도입과 특정 업무에 맞춘 개발·연동을 구분해야 합니다. 현재 공식 페이지는 NADIA-ANE의 의료 데이터 질의, ALLM.H 의료 특화 모델, 병원 내 운영 및 산업별 도메인 에이전트 사례를 안내합니다. 도입 방식을 선택한 뒤 환자 정보 없이 해결하려는 업무를 설명해 주세요. 제품 적합성은 담당자 검토로 연결합니다.';
 if(!p)return '어떤 업무를 개선하고 싶으신가요? GPU 운영, 사내 지식 검색, 모델 개발·운영 중 하나를 선택하거나 문제를 설명해 주세요.';
 const next=!slots.environment?'현재 운영 환경은 온프레미스, 클라우드, 하이브리드 중 어느 쪽인가요?':!slots.scale?p.question:!slots.timeline?'도입 검토 일정은 어떻게 되나요?':'상담 정리하기를 누르면 추출된 정보를 확인·수정하고 도입 검토 브리프를 볼 수 있습니다.';
 return `${p.id}를 검토 후보로 안내합니다. ${p.description}\n${next}\n가격·도입 가능 범위는 담당자 확인이 필요합니다.`;
}
export function evidenceMerge(previous,extracted,text){
 const result={...previous};
 for(const k of Object.keys(blankSlots)){
  const item=extracted[k];
  if(item && typeof item.value==='string' && typeof item.evidence==='string' && item.evidence.trim() && text.includes(item.evidence) && item.value.length<=300){
   if(k==='goal'&&!goals.includes(item.value))continue;
   if(k==='needType'&&!needTypes.includes(item.value))continue;
   // Non-enum slots must remain verbatim customer wording.
   if(!['goal','needType'].includes(k)&&item.value!==item.evidence)continue;
   result[k]=item.value;
  }
 }
 return result;
}
export function fallbackSlots(previous,text){
 const inquiry=/[?？]|가능한가|무엇인가|무엇을 준비|어떤 제품/.test(text);const goal=inquiry&&!goals.includes(text)?null:inferGoal(text);const track=solutionTracks.find(t=>t.id===text)?.id;const needType=needTypes.includes(text)?text:!inquiry&&/맞춤.*(개발|연동)|업무.*(개발해|만들어)|커스텀/i.test(text)?needTypes[1]:null;return {...previous,...(goal?{goal}:{} ),...(track?{track}:{}),...(needType?{needType}:{})};
}
export function crmProjection(lead){
 const s=lead.slots,products=recommend(s).map(p=>p.id);
 return {기관:{기관ID:null,관계등급:null,기관유형:null,산업분류:s.industry||null,세그먼트:null,시장축:null,채널구분:'웹',유입경로:lead.utm?.utm_source||null,접촉고객수:null},고객:{고객ID:null,기관ID:null,고객등급:null,리드등급:null,영업단계:null,단계변경일:null,유입경로:lead.utm?.utm_source||null,세그먼트:null,기관유형:null,산업분류:s.industry||null,직급수준:null,직종:null,성별:null,연령대:null,지역:null,관심제품:products,최근요청유형:s.requestType||null,접촉횟수:null,첫접촉행사:null,뉴스레터수신동의:null,이메일유형:null,이메일보유:!!lead.email,전화보유:false},접점:{접점ID:null,고객ID:null,행사ID:null,접촉일시:lead.created_at||new Date().toISOString(),수집채널:'웹 AI 상담',세그먼트:null,요청유형:s.requestType||null,관심제품:products,관심분야:s.track||s.goal||null,현장요청:lead.summary,참관목적:null,후속미팅희망:lead.meeting,VIP접촉:null},신규수집:{상담ID:lead.requestId||lead.id,회사소속:lead.company,이름:lead.name,이메일:lead.email,회사URL:lead.companyAnalysis?.url||null,도입방식:s.needType||null,맞춤개발업무:s.customTask||null,데이터준비상태:s.dataReadiness||null,성공기준:s.successCriteria||null,보류사유:lead.holdReason||null,보류원문:lead.holdEvidence||null,후속제품안내동의:!!lead.nurtureConsent,처리상태:'담당자 검토 대기'}};
}
