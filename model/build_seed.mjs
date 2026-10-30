// Scores exported CRM prospects with the same model the app uses and writes a Supabase seed SQL file.
// Usage: node model/build_seed.mjs prospects.json seed-crm.sql   (keep the output out of git)
import fs from 'node:fs';
import {scoreLead} from '../lib/lead-model.mjs';
const [,,input,output]=process.argv;
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
const q=v=>v===null||v===undefined?'null':typeof v==='number'?String(v):typeof v==='boolean'?String(v):`'${String(v).replace(/'/g,"''")}'`;
const cols=['customer_id','org_id','lead_grade','sales_stage','segment','org_type','industry','job_level','interest_products','request_type','contact_count','first_event','email_type','onsite_request','interest_area','score','score_low','score_high','tier','rank_unknown','factors'];
const lines=['-- ACRYL CRM dataset ① prospects (pseudonymised IDs) scored by lib/lead-model.mjs. Hackathon use only; do not commit.','truncate public.crm_prospects;'];
for(let i=0;i<rows.length;i+=250){
 const values=rows.slice(i,i+250).map(r=>{const s=scoreLead(r.features);const rec={...r,score:s.score,score_low:s.low,score_high:s.high,tier:s.tier,rank_unknown:!r.features.직급수준,factors:JSON.stringify(s.factors.slice(0,3).map(f=>({f:f.feature,v:f.value,w:f.weight})))};return '('+cols.map(c=>c==='factors'?q(rec[c])+'::jsonb':q(rec[c])).join(',')+')';});
 lines.push(`insert into public.crm_prospects(${cols.join(',')}) values\n${values.join(',\n')};`);
}
fs.writeFileSync(output,lines.join('\n')+'\n');
console.log('rows',rows.length,'bytes',fs.statSync(output).size);
