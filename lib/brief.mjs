export function verifyBrief(raw,text){
 const verified=items=>(Array.isArray(items)?items:[]).filter(x=>typeof x?.summary==='string'&&x.summary.length<=300&&typeof x.evidence==='string'&&x.evidence.length>=4&&x.evidence.length<=500&&text.includes(x.evidence)&&[...x.summary.matchAll(/\d+(?:\.\d+)?/g)].every(m=>x.evidence.includes(m[0]))).slice(0,4).map(x=>({summary:x.summary,evidence:x.evidence}));
 return {issues:verified(raw.issues),requirements:verified(raw.requirements),openQuestions:(raw.openQuestions||[]).filter(q=>typeof q==='string'&&q.length<=200).slice(0,4),preparation:(raw.preparation||[]).filter(q=>typeof q==='string'&&q.length<=200).slice(0,3)};
}
