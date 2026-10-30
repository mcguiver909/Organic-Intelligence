// Lead priority model trained on the ACRYL CRM dataset (see model/train.py).
// Gemini only turns conversation into features; this deterministic model turns features into a score.
// Unknown features are not guessed: the score is averaged over how often each value occurs in the CRM,
// and the 10th–90th percentile of that spread is shown as the remaining uncertainty.
import model from './lead-model-weights.mjs';
export {model};
const keys=Object.keys(model.features);
const personal=/@(gmail|naver|daum|hanmail|kakao|hotmail|outlook|live|yahoo|icloud|me|nate|proton(mail)?)\./i;

export function rankFromTitle(text=''){
 const t=String(text);
 if(!t.trim())return null;
 if(/교수|의사|전문의|원장|간호|약사|연구위원|수석연구위원/.test(t))return '교수/의료진/연구위원';
 if(/대표|ceo|cto|cio|cfo|coo|이사|임원|상무|전무|부사장|사장|본부장|센터장|그룹장/i.test(t))return '경영진/임원';
 if(/팀장|부장|실장|차장|과장|파트장|매니저|manager|lead|head/i.test(t))return '관리자';
 if(/학생|인턴|대학원생|연구생/.test(t))return '학생/인턴';
 if(/사원|대리|주임|연구원|엔지니어|개발자|담당|선임|책임/.test(t))return '실무자';
 return '기타';
}
export function emailType(email=''){
 const e=String(email).trim().toLowerCase();
 if(!e.includes('@'))return null;
 if(personal.test(e))return '개인 웹메일';
 if(/\.(ac\.kr|edu)$|\.edu\./.test(e))return '대학';
 if(/\.(go\.kr|or\.kr|re\.kr|gov|org)$/.test(e))return '공공/비영리';
 return '기업/기관 도메인';
}
export function orgType(text=''){
 const t=String(text);
 if(!t.trim())return null;
 if(/병원|의료원|의원|클리닉|헬스케어센터|보건/.test(t))return '의료기관';
 if(/대학교|대학|학교|교육청/.test(t))return '대학/교육기관';
 if(/공단|공사|진흥원|연구원|연구소|정부|부처|청$|시청|구청|공공|재단/.test(t))return '공공/연구기관';
 return '기업';
}
const segOfProduct={JONATHAN:'GPUBASE',GPUBASE:'GPUBASE',AGENTBASE:'AI 플랫폼',MODELBASE:'AI 플랫폼','ALLM.H':'헬스케어 AX','NADIA-ANE':'헬스케어 AX'};
const segOfGoal={'GPU 운영 효율':'GPUBASE','사내 AI 챗봇':'AI 플랫폼','모델 개발·운영':'AI 플랫폼','의료 AI':'헬스케어 AX'};
export function segment(slots={},insight=null){
 if(segOfGoal[slots.goal])return segOfGoal[slots.goal];
 const top=(insight?.productFit||[]).find(p=>p.score>=50&&segOfProduct[p.product]);
 return top?segOfProduct[top.product]:null;
}

// Map what a consultation knows to model features. null = still unknown.
export function leadFeatures({slots={},insight=null,email='',company='',profile={},resumed=false}={}){
 const req=insight?.requestCategory;
 return {
  직급수준:rankFromTitle(slots.jobTitle),
  이메일유형:emailType(email),
  요청:req&&model.features.요청.includes(req)?req:(insight?'없음':null),
  세그:segment(slots,insight),
  기관유형:orgType([company,slots.industry,profile.businessSummary].filter(Boolean).join(' ')),
  다회접촉:resumed?'2회 이상':'1회'
 };
}

function logit(f){
 let z=model.intercept;
 for(const k of keys){const v=f[k];if(v&&v!==model.features[k][0])z+=model.coef[`${k}=${v}`]||0;}
 return 1/(1+Math.exp(-z));
}
function quantile(points,q){let acc=0;for(const [p,w] of points){acc+=w;if(acc>=q)return p;}return points.at(-1)[0];}
const wilson=(k,n,z=1.64)=>{if(!n)return [0,1];const p=k/n,d=1+z*z/n,c=p+z*z/(2*n),m=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return [Math.max(0,(c-m)/d),Math.min(1,(c+m)/d)];};

export function scoreLead(features){
 const unknown=keys.filter(k=>!features[k]);
 const prior=k=>k==='직급수준'?model.rankPrior:model.priors[k];
 let combos=[[{...features},1]];
 for(const k of unknown)combos=combos.flatMap(([f,w])=>Object.entries(prior(k)).filter(([,pw])=>pw>0).map(([v,pw])=>[{...f,[k]:v},w*pw]));
 const total=combos.reduce((s,[,w])=>s+w,0);
 const points=combos.map(([f,w])=>[logit(f),w/total]).sort((a,b)=>a[0]-b[0]);
 const expected=points.reduce((s,[p,w])=>s+p*w,0);
 const low=quantile(points,0.1),high=quantile(points,0.9);
 // Contribution relative to an average CRM prospect, so + raises and - lowers the score.
 const coefOf=(k,v)=>v===model.features[k][0]?0:(model.coef[`${k}=${v}`]||0);
 const mean=k=>Object.entries(prior(k)).reduce((s,[v,w])=>s+w*coefOf(k,v),0);
 const factors=keys.filter(k=>features[k]).map(k=>({feature:k,value:features[k],weight:Math.round((coefOf(k,features[k])-mean(k))*100)/100})).filter(f=>Math.abs(f.weight)>=0.15&&!(f.feature==='다회접촉'&&f.value==='1회')).sort((a,b)=>Math.abs(b.weight)-Math.abs(a.weight));
 const key=`${features.직급수준}|${features.요청}|${features.세그}`;
 const s=model.similar[key];
 const similar=s?{n:s[0],positive:s[1],rate:s[1]/s[0],interval:wilson(s[1],s[0])}:null;
 const tier=expected>=0.6?'우선 연락':expected>=0.3?'연락 대상':'관심 관리';
 const pct=v=>Math.min(99,Math.max(1,Math.round(v*100)));
 return {score:pct(expected),low:pct(low),high:pct(high),tier,unknown,factors,similar,features};
}

export const featureLabels={직급수준:'직급',이메일유형:'이메일 종류',요청:'요청 유형',세그:'관심 분야',기관유형:'기관 유형',다회접촉:'재방문'};
