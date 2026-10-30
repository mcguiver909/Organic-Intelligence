export function followupAllowed(lead,now=Date.now()){
 const at=Date.parse(lead?.nurture_consent_at);
 return Number.isFinite(at)&&at<=now&&now-at<=183*86400000&&!lead.nurture_withdrawn_at;
}
export function verifyChange(raw,old,sources){
 const validRelation=['relevant_change','no_relevant_change','uncertain'].includes(raw?.relation);
 if(!validRelation||typeof raw.reason!=='string'||typeof raw.uncertainty!=='string')throw Error('INVALID_COMPARISON');
 const source=Number.isInteger(raw.source)?sources[raw.source]:null;
 const previousSource=source&&old.find(o=>o.url===source.url);
 const verified=!!(source&&previousSource&&typeof raw.quote==='string'&&raw.quote.length>=12&&raw.quote.length<=240&&source.text.includes(raw.quote)&&!old.some(o=>o.text.includes(raw.quote)));
 return {relation:raw.relation==='relevant_change'&&!verified?'uncertain':raw.relation,reason:raw.reason.slice(0,700),uncertainty:raw.uncertainty.slice(0,700),quote:verified?raw.quote:'',url:verified?source.url:'',sources:sources.map(s=>s.url)};
}
