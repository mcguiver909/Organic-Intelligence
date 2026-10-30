// Curated questions, not patterns learned from the anonymized CRM workbook.
export const hypothesisLibrary=[
 {id:'gpu',statement:'여러 팀의 GPU 자원 배분·운영을 개선할 필요가 있습니다.',goal:'GPU 운영 효율',title:'여러 팀의 GPU 자원 배분·운영을 개선할 필요가 있나요?',effect:'GPU 사용 현황과 자원 배분 병목을 확인하고 운영 개선 범위를 검토합니다.'},
 {id:'knowledge',statement:'사내 문서 검색이나 반복 문의 대응에 드는 시간을 줄이고 싶습니다.',goal:'사내 AI 챗봇',title:'사내 문서 검색이나 반복 문의 대응에 시간이 많이 드나요?',effect:'문서 검색·답변 업무의 처리 시간과 답변 근거 확인 방식을 검토합니다.'},
 {id:'model',statement:'AI 모델의 학습·배포·운영 과정을 연결할 필요가 있습니다.',goal:'모델 개발·운영',title:'AI 모델의 학습·배포·운영 과정을 연결할 필요가 있나요?',effect:'모델 개발부터 운영까지 반복되는 작업과 관리 범위를 확인합니다.'},
 {id:'health',statement:'의료·연구 업무에 맞춘 AI 개발 또는 데이터 연동을 검토하고 싶습니다.',goal:'의료 AI',title:'의료·연구 업무에 맞춘 AI 개발이나 데이터 연동이 필요한가요?',effect:'업무·데이터·보안 제약을 확인해 맞춤 개발과 PoC 범위를 검토합니다.'},
 {id:'custom',statement:'현재 업무에 맞는 AI 자동화·시스템 연동을 검토하고 싶습니다.',goal:'아직 모르겠어요',title:'현재 업무에 맞는 AI 자동화·시스템 연동을 검토하고 있나요?',effect:'현재 업무의 입력·처리·결과를 정리하고 자동화 가능 범위를 확인합니다.'}
];
export function groundedAnalysis(raw,sources,url){
 const valid=x=>Number.isInteger(x?.source)&&sources[x.source]&&typeof x.quote==='string'&&x.quote.length>=12&&x.quote.length<=240&&sources[x.source].text.includes(x.quote);
 const facts=(raw.facts||[]).filter(valid).slice(0,3).map(x=>({quote:x.quote,url:sources[x.source].url}));
 const seen=new Set();
 const hypotheses=(raw.hypotheses||[]).filter(x=>valid(x)&&hypothesisLibrary.some(h=>h.id===x.id)&&!seen.has(x.id)&&seen.add(x.id)).slice(0,5).map(x=>({...hypothesisLibrary.find(h=>h.id===x.id),quote:x.quote,url:sources[x.source].url,response:'pending',correction:''}));
 return {url,pageTitle:sources[0]?.title||'',checkedAt:new Date().toISOString(),pages:sources.map(s=>s.url),snapshots:sources.map(s=>({url:s.url,text:s.text})),facts,hypotheses};
}
export function confirmedProblems(a){return (a?.hypotheses||[]).filter(h=>h.response==='yes'||h.response==='different'&&h.correction?.trim()).map(h=>h.response==='different'?h.correction:h.statement||h.title);}

export function monthsLater(date,months=3){const d=new Date(date);const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,end));return d.toISOString();}
