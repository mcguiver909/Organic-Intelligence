'use client';
import {useEffect,useState} from 'react';
// Reveals a reply progressively so the answer reads as it is being written.
export default function TypeText({text,onDone}){
 const [n,setN]=useState(0);
 useEffect(()=>{
  if(typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setN(text.length);onDone?.();return;}
  setN(0);const step=Math.max(1,Math.ceil(text.length/90));let i=0;
  const t=setInterval(()=>{i=Math.min(text.length,i+step);setN(i);if(i>=text.length){clearInterval(t);onDone?.();}},18);
  return()=>clearInterval(t);
 },[text]);
 return <>{text.slice(0,n)}{n<text.length&&<span className="type-caret" aria-hidden="true"/>}</>;
}
