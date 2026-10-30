'use client';
import {useEffect,useRef} from 'react';
import {productLineup,productQuestion} from '../../lib/products.mjs';
// Official ACRYL lineup that drifts left on its own and can be swiped or dragged.
export default function ProductCarousel({onAsk,disabled}){
 const track=useRef(null);
 useEffect(()=>{
  const el=track.current;if(!el)return;
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  let paused=false,resume=0,frame=0,last=0,pos=el.scrollLeft;
  const hold=()=>{paused=true;clearTimeout(resume);};
  const release=()=>{clearTimeout(resume);resume=setTimeout(()=>{paused=false;pos=el.scrollLeft;},2500);};
  const tick=t=>{const dt=last?Math.min(48,t-last):16;last=t;
   if(!paused){const half=el.scrollWidth/2;pos+=dt*0.035;if(pos>=half)pos-=half;el.scrollLeft=pos;}
   else pos=el.scrollLeft;
   frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);
  const on=[['pointerenter',hold],['pointerdown',hold],['touchstart',hold],['focusin',hold],['pointerleave',release],['pointerup',release],['touchend',release],['focusout',release],['wheel',()=>{hold();release();}]];
  // Mouse drag; touch and trackpads already scroll natively.
  let drag=null;
  const down=e=>{if(e.pointerType!=='mouse'||e.target.closest('button,a'))return;drag={x:e.clientX,left:el.scrollLeft};el.classList.add('dragging');};
  const move=e=>{if(!drag)return;el.scrollLeft=drag.left-(e.clientX-drag.x);};
  const up=()=>{drag=null;el.classList.remove('dragging');};
  on.push(['pointerdown',down],['pointermove',move],['pointerup',up],['pointerleave',up]);
  on.forEach(([e,f])=>el.addEventListener(e,f,{passive:true}));
  return()=>{cancelAnimationFrame(frame);clearTimeout(resume);on.forEach(([e,f])=>el.removeEventListener(e,f));};
 },[]);
 // Rendered twice so the loop has no visible seam; the copy is hidden from assistive tech.
 const cards=copy=>productLineup.map(p=><article key={copy+p.id} className="lineup-card carousel-card" aria-hidden={copy?true:undefined}>
  <small>{p.group}</small><h3>{p.id}</h3><p>{p.summary}</p>
  <div className="lineup-actions"><button type="button" tabIndex={copy?-1:undefined} disabled={disabled} onClick={()=>onAsk(productQuestion(p.id))}>AI에게 물어보기</button><a href={p.source} target="_blank" rel="noreferrer" tabIndex={copy?-1:undefined}>공식 페이지 ↗</a></div>
 </article>);
 return <section className="product-carousel" aria-label="ACRYL 제품 라인업">
  <div className="carousel-head"><h2>ACRYL 제품 라인업 <span>{productLineup.length}</span></h2><p>카드를 옆으로 넘겨 보거나, 눌러서 AI에게 바로 물어보세요.</p></div>
  <div className="carousel-track" ref={track} tabIndex={0}>{cards(0)}{cards(1)}</div>
 </section>;
}
