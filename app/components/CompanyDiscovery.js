'use client';
import {useState} from 'react';
import {api,supabase} from '../../lib/browser';
export default function CompanyDiscovery({analysis,onChange,onContinue,disabled}){
 const [url,setUrl]=useState(analysis?.url||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function analyze(e){e.preventDefault();setBusy(true);setError('');try{const input={url:url.startsWith('https://')?url:'https://'+url};const r=supabase()?await api('/api/company',input):await fetch('/api/company',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const data=await r.json();if(!r.ok)throw Error(data.error);onChange(data);}catch(e){setError(e.message);}finally{setBusy(false);}}
 function respond(id,response,correction){onChange({...analysis,hypotheses:analysis.hypotheses.map(h=>h.id===id?{...h,response,correction:correction??h.correction}:h)});}
 return <section className="company-discovery panel"><div className="eyebrow">COMPANY DISCOVERY</div><h2>우리 회사에 맞는 AI를 찾아보세요.</h2><p>상담받을 회사의 홈페이지를 알려주세요. 사업 분야를 먼저 확인하고, 대화하며 필요한 기술을 정리합니다.</p>
 <form className="url-form" onSubmit={analyze}><label htmlFor="company-url">상담받을 회사의 홈페이지 주소</label><div><input id="company-url" required maxLength={1000} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.company.com" disabled={busy||disabled}/><button className="primary" disabled={busy||disabled}>{busy?'공개 정보 확인 중…':'분석하기 →'}</button></div></form>
 <small>공개 페이지 본문을 Google Gemini로 전송합니다.<br/>비공개 문서·인증 정보가 포함된 주소는 입력하지 마세요.<br/>최대 3개 페이지를 확인하며, 차단된 사이트와 외부 채용 사이트는 확인하지 못할 수 있습니다.</small>
 {busy&&<p role="status">공개 페이지를 읽고, 근거 문장이 있는 질문을 검토하고 있습니다. 약 10~40초 걸릴 수 있습니다.</p>}{error&&<p role="alert">{error}</p>}
 {analysis&&<div>{analysis.facts.map((f,i)=><blockquote key={i}>“{f.quote}” <a href={f.url} target="_blank" rel="noreferrer">원문 ↗</a></blockquote>)}{!analysis.facts.length&&<p>검증 가능한 사업 소개 문장을 확보하지 못했습니다. 직접 입력하신 내용을 바탕으로 상담을 시작합니다.</p>}<details><summary>실제로 확인한 페이지 {analysis.pages.length}개</summary>{analysis.pages.map(p=><p key={p}><a href={p} target="_blank" rel="noreferrer">{p}</a></p>)}</details>
 <p>ACRYL AI의 분석 결과를 바탕으로 다음 상담 주제를 제안합니다.</p><div className="hypothesis-grid">{analysis.hypotheses.map(h=><article key={h.id}><small>확인할 가설 · {h.response==='yes'?'맞다':h.response==='no'?'아니다':h.response==='different'?'수정 중':'미응답'}</small><h3>{h.title}</h3><blockquote>참고내용: “{h.quote}”</blockquote><a href={h.url} target="_blank" rel="noreferrer">참고 내용으로 이동하기 ↗</a><div className="hypothesis-actions">{[['yes','맞다'],['no','아니다'],['different','조금 달라요']].map(([v,label])=><button type="button" disabled={disabled} aria-pressed={h.response===v} className={h.response===v?'active':''} key={v} onClick={()=>respond(h.id,v)}>{label}</button>)}</div>{h.response==='different'&&<label>실제 상황을 한 줄로 알려주세요.<input maxLength={300} value={h.correction} onChange={e=>respond(h.id,'different',e.target.value)} disabled={disabled}/></label>}{h.response==='yes'&&<p>검토 목표: {h.effect} 수치 효과는 진단 후 확인합니다.</p>}</article>)}</div>
 <button className="primary" type="button" disabled={disabled||busy||analysis.hypotheses.some(h=>h.response==='different'&&!h.correction.trim())} onClick={onContinue}>확인한 내용으로 상담 이어가기 →</button></div>}
 {!analysis&&<button className="skip-discovery" type="button" onClick={onContinue} disabled={busy||disabled}>홈페이지 주소 없이 바로 대화하기 →</button>}
 </section>;
}
