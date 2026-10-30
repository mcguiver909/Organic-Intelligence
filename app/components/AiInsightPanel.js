'use client';
import {slotLabels,missingInfo} from '../../lib/insight.mjs';
import {productLineup} from '../../lib/products.mjs';

export default function AiInsightPanel({insight,slots,busy}){
 const fit=insight?.productFit||[];
 const filled=Object.entries(slots).filter(([k,v])=>v&&slotLabels[k]&&v!=='아직 모르겠어요');
 const missing=insight?.nextQuestions?.length?insight.nextQuestions:missingInfo(slots).slice(0,3);
 return <aside className="ai-panel" aria-label="상담 메모" aria-busy={busy}>
  <header className="insight-heading"><div><span className="insight-eyebrow">CONSULTATION NOTES</span><h2>함께 정리한 내용</h2></div><span className="insight-status" role="status">{busy?'정리 중':'상담 메모'}</span></header>
  <p className="insight-intro">대화에서 확인한 내용을 모아두었어요.</p>

  <section className="insight-section"><h3>검토할 솔루션</h3>
   {fit.length?<ul className="insight-solutions">{fit.slice(0,4).map(p=>{const product=productLineup.find(item=>item.id===p.product);return <li key={p.product}><h4>{p.product}</h4>{product?.summary&&<p className="insight-description">{product.summary}</p>}{p.evidence?<blockquote><span>말씀하신 내용</span><p>“{p.evidence}”</p></blockquote>:<p className="insight-muted">업무와 도입 조건을 조금 더 확인할게요.</p>}</li>;})}</ul>:<p className="insight-empty">해결하고 싶은 업무를 알려주시면,<br/>함께 검토할 방향을 정리해 드릴게요.</p>}
  </section>

  {missing.length>0&&<section className="insight-section"><h3>아직 확인할 사항</h3><ul className="insight-questions">{missing.map(m=><li key={m}>{m}</li>)}</ul></section>}

  <details className="insight-confirmed"><summary>확인한 상담 정보</summary>{filled.length?<dl>{filled.map(([k,v])=><div key={k}><dt>{slotLabels[k]}</dt><dd>{v}</dd></div>)}</dl>:<p className="insight-empty">대화하며 확인한 조건이 여기에 정리됩니다.</p>}</details>
  <p className="insight-footnote">검토 방향은 상담이 진행되며 달라질 수 있습니다.</p>
 </aside>;
}
