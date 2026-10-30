'use client';
import {useEffect,useState,useCallback} from 'react';
import {model,featureLabels} from '../../lib/lead-model.mjs';
// Inbound customer DB: ACRYL CRM prospects scored by the lead model, with new AI consultations on top.
const views=[['all','전체 (점수순)'],['priority','우선 연락'],['revisit','다시 볼 리드 · 직급 미상']];
const tierClass=s=>s>=60?'t3':s>=30?'t2':'t1';
export default function InboundDb({db,leads}){
 const [view,setView]=useState('all'),[rows,setRows]=useState([]),[counts,setCounts]=useState(null),[fresh,setFresh]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  if(!db){setFresh((leads||[]).filter(l=>l.lead_score));setError('공유 DB가 연결되지 않아 기존 CRM 고객은 표시하지 않습니다. 이 브라우저의 상담만 보여 줍니다.');return;}
  setBusy(true);setError('');
  try{
   let q=db.from('crm_prospects').select('customer_id,job_level,request_type,segment,org_type,email_type,first_event,lead_grade,onsite_request,interest_area,score,score_low,score_high,tier,rank_unknown,factors');
   q=view==='priority'?q.gte('score',60).order('score',{ascending:false}):view==='revisit'?q.eq('rank_unknown',true).gte('score_high',60).order('score_high',{ascending:false}).order('score',{ascending:false}):q.order('score',{ascending:false});
   const r=await q.limit(150);if(r.error)throw r.error;setRows(r.data);
   const c=async f=>{let x=db.from('crm_prospects').select('customer_id',{count:'exact',head:true});x=f(x);const res=await x;if(res.error)throw res.error;return res.count;};
   setCounts({all:await c(x=>x),priority:await c(x=>x.gte('score',60)),revisit:await c(x=>x.eq('rank_unknown',true).gte('score_high',60))});
   const n=await db.from('leads').select('id,created_at,company,name,lead_score,slots').not('lead_score','is',null).order('created_at',{ascending:false}).limit(30);
   if(n.error)throw n.error;setFresh(n.data);
  }catch(e){setError(/lead_score|crm_prospects/.test(e.message||'')?'고객 DB 테이블이 아직 없습니다. Supabase에서 migration-crm.sql과 시드 SQL을 실행해 주세요.':e.message);}
  finally{setBusy(false);}
 },[db,view,leads]);
 useEffect(()=>{load();},[load]);
 const Score=({s,low,high})=><div className="db-score"><b className={tierClass(s)}>{s}%</b><span className="db-range"><i style={{left:low+'%',width:Math.max(2,high-low)+'%'}}/><em style={{left:s+'%'}}/></span><small>{low===high?'확정':`${low}~${high}%`}</small></div>;
 return <section className="panel inbound-db">
  <div className="panel-head"><div><small>INBOUND CUSTOMER DB</small><h2>통합 유입고객 DB</h2></div><button onClick={load} disabled={busy}>{busy?'불러오는 중…':'새로고침'}</button></div>
  <div className="db-model">
   <p><b>{model.name}</b> · 아크릴 CRM에서 직급이 확인된 잠재고객 {model.trainRows.toLocaleString()}명으로 학습했습니다. 처음 보는 고객 {model.metrics.holdoutRows}명으로 검증한 AUC는 <b>{model.metrics.holdoutAUC}</b>입니다(직급만 쓰면 {model.metrics.rankOnlyAUC}). 모르는 정보는 추측하지 않고 CRM 분포로 평균 내어 점수와 범위를 함께 보여 줍니다.</p>
   <small>정답 레이블은 데이터 제공사가 모의 생성한 리드등급(A·B)입니다. 실제 계약 성사 확률이 아니라 영업팀 우선순위 기준을 재현한 점수입니다.</small>
  </div>
  {fresh.length>0&&<><h3 className="db-sub">새로 접수된 AI 상담 <span>{fresh.length}</span></h3>
   <div className="table-wrap"><table className="db-table"><thead><tr><th>접수 (KST)</th><th>회사 / 담당자</th><th>직책</th><th>점수 · 범위</th><th>판단</th><th>점수를 움직인 요인</th></tr></thead><tbody>{fresh.map(l=>{const s=l.lead_score;return <tr key={l.id} className="db-new"><td><span className="db-badge">NEW · AI 상담</span><br/>{new Date(l.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</td><td>{l.company}<small>{l.name}</small></td><td>{l.slots?.jobTitle||'미입력'}</td><td><Score s={s.score} low={s.low} high={s.high}/></td><td>{s.tier}</td><td className="db-factors">{(s.factors||[]).slice(0,3).map(f=><span key={f.feature} className={f.weight>0?'up':'down'}>{f.weight>0?'▲':'▼'} {featureLabels[f.feature]} {f.value}</span>)}</td></tr>;})}</tbody></table></div></>}
  <h3 className="db-sub">기존 CRM 유입고객</h3>
  <div className="db-tabs" role="tablist">{views.map(([k,label])=><button key={k} role="tab" aria-selected={view===k} className={view===k?'active':''} onClick={()=>setView(k)}>{label}{counts&&<span>{(counts[k]??0).toLocaleString()}</span>}</button>)}</div>
  {view==='revisit'&&<p className="db-hint">직급을 몰라 영업 대상에서 빠졌지만, 직급만 확인되면 우선 연락 수준(60% 이상)이 될 수 있는 고객입니다. 범위가 넓을수록 확인할 가치가 큽니다.</p>}
  {error&&<p className="db-error">{error}</p>}
  {db&&!error&&<div className="table-wrap db-scroll"><table className="db-table"><thead><tr><th>고객 ID</th><th>첫 접촉</th><th>직급</th><th>요청</th><th>관심 분야</th><th>점수 · 범위</th><th>기존 등급</th><th>현장 메모</th></tr></thead><tbody>{rows.map(r=><tr key={r.customer_id}><td>{r.customer_id}</td><td>{r.first_event||'-'}</td><td>{r.job_level}</td><td>{r.request_type||'-'}</td><td>{r.segment||'미분류'}</td><td><Score s={r.score} low={r.score_low} high={r.score_high}/></td><td>{r.lead_grade||'-'}</td><td className="db-note">{r.onsite_request||r.interest_area||'-'}</td></tr>)}</tbody></table></div>}
 </section>;
}
