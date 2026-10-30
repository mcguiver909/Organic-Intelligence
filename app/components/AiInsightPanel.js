'use client';
import {useEffect,useState} from 'react';
import {intentStages,crmBenchmark,slotLabels,completeness,missingInfo} from '../../lib/insight.mjs';

const steps=['질문 이해','조건 추출 · 근거 검증','제품 적합도 계산','답변 작성'];
const pct=v=>Math.round(v*1000)/10+'%';

export default function AiInsightPanel({insight,slots,newKeys,busy}){
 const [step,setStep]=useState(0);
 useEffect(()=>{if(!busy){setStep(steps.length);return;}setStep(0);const t=setInterval(()=>setStep(s=>Math.min(s+1,steps.length-1)),650);return()=>clearInterval(t);},[busy]);
 const fit=insight?.productFit||[];
 const stageIndex=insight?intentStages.indexOf(insight.intent.stage):-1;
 const bench=crmBenchmark[insight?.requestCategory||'없음'];
 const filled=Object.entries(slots).filter(([k,v])=>v&&slotLabels[k]&&v!=='아직 모르겠어요');
 const done=completeness(slots);
 const missing=insight?.nextQuestions?.length?insight.nextQuestions:missingInfo(slots).slice(0,3);
 const ec=insight?.evidenceCheck,ex=insight?.extraction;
 return <aside className="ai-panel" aria-label="AI 실시간 분석">
  <div className="ai-head"><span className={'ai-dot'+(busy?' live':'')} aria-hidden="true"/><div><small>LIVE AI ANALYSIS</small><h2>AI 실시간 분석</h2></div>{insight&&<span className="ai-engine">{insight.engine==='gemini'?'Gemini':'규칙 기반'}</span>}</div>

  <section className="ai-block"><h3>AI 처리 과정</h3><ol className="ai-steps">{steps.map((s,i)=><li key={s} className={busy?(i<step?'done':i===step?'run':''):insight?'done':''}><span aria-hidden="true"/>{s}</li>)}</ol>
   {insight&&!busy&&<p className="ai-meta">응답 {(insight.latencyMs/1000).toFixed(1)}초{ex&&ex.proposed>0?` · 조건 ${ex.accepted}/${ex.proposed}개 원문 대조 통과`:''}{ec&&ec.checked>0?` · 적합도 근거 ${ec.verified}/${ec.checked}개 확인`:''}</p>}
   {!insight&&!busy&&<p className="ai-meta">첫 메시지를 보내면 AI가 대화를 분석해 이곳에 보여 줍니다.</p>}
  </section>

  <section className="ai-block"><h3>제품 적합도</h3>
   {fit.length?<ul className="ai-fit">{fit.slice(0,4).map(p=><li key={p.product}><div className="ai-fit-row"><b>{p.product}</b><span>{p.score}</span></div><div className="ai-bar"><i style={{width:p.score+'%'}}/></div>{p.evidence&&<q>{p.evidence}</q>}</li>)}</ul>:<p className="ai-empty">아직 근거가 부족합니다. 업무나 문제를 말씀해 주시면 계산합니다.</p>}
  </section>

  <section className="ai-block"><h3>구매 여정 단계</h3>
   <ol className="ai-journey">{intentStages.map((s,i)=><li key={s} className={i<=stageIndex?'on':''} aria-current={i===stageIndex?'step':undefined}>{s}</li>)}</ol>
   {insight?.intent.evidence&&<q className="ai-quote">{insight.intent.evidence}</q>}
  </section>

  <section className="ai-block"><h3>파악한 조건 <span className="ai-count">{done}%</span></h3>
   <div className="ai-progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={100}><i style={{width:done+'%'}}/></div>
   {filled.length?<dl className="ai-slots">{filled.map(([k,v])=><div key={k} className={newKeys.includes(k)?'new':''}><dt>{slotLabels[k]}{newKeys.includes(k)&&<em>NEW</em>}</dt><dd>{v}</dd></div>)}</dl>:<p className="ai-empty">대화에서 확인한 조건이 여기에 쌓입니다.</p>}
   {missing.length>0&&<><h4>AI가 다음에 확인할 정보</h4><ul className="ai-missing">{missing.map(m=><li key={m}>{m}</li>)}</ul></>}
  </section>

  {insight&&insight.requestCategory!=='없음'&&bench&&<section className="ai-block ai-bench"><h3>아크릴 CRM 기준 영업 신호</h3>
   <p><b>{insight.requestCategory}</b>로 분류했습니다. 아크릴 CRM에서 같은 요청을 남긴 잠재고객 {bench.n}명 중 <b>{pct(bench.ab)}</b>가 우선 영업 대상(A·B)이었습니다. 요청 기록이 없는 고객은 {pct(crmBenchmark['없음'].ab)}입니다.</p>
   <small>출처: 아크릴 고객 데이터 v4.2 집계. 리드 등급은 데이터 제공사가 모의 생성한 값입니다.</small>
  </section>}
 </aside>;
}
