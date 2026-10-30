'use client';
import {productLineup,productQuestion} from '../../lib/products.mjs';
// Official ACRYL lineup (same choices as acryl.ai/contact). A card asks the AI about that product.
export default function ProductLineup({onAsk,disabled}){
 return <details className="product-lineup" open><summary>ACRYL 제품 라인업 <span>{productLineup.length}</span></summary>
  <p className="lineup-note">궁금한 제품을 누르면 AI가 쉽게 설명해 드립니다.</p>
  <div className="lineup-grid">{productLineup.map(p=><article key={p.id} className="lineup-card">
   <small>{p.group}</small>
   <h3>{p.id}</h3>
   <p>{p.summary}</p>
   <div className="lineup-actions"><button type="button" disabled={disabled} onClick={()=>onAsk(productQuestion(p.id))}>AI에게 물어보기</button><a href={p.source} target="_blank" rel="noreferrer">공식 페이지 ↗</a></div>
  </article>)}</div>
 </details>;
}
