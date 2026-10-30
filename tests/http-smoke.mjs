// Run separately against a local server with NO Supabase configuration.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {blankSlots} from '../lib/consult.mjs';
const root=process.env.TEST_URL||'http://127.0.0.1:3000';
for(const path of ['/','/dashboard','/campaign','/guide','/videos'])assert.equal((await fetch(root+path)).status,200);
for(const route of ['consult','leads','email','meeting']){
 const r=await fetch(`${root}/api/${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,401,route);
}
const lead={requestId:crypto.randomUUID(),name:'해커톤 테스트',company:'데모 연구소',email:'demo@example.com',summary:'GPU 20장을 여러 연구팀이 함께 사용합니다. 자원 배분 효율과 모니터링을 개선하고 싶습니다.',slots:{...blankSlots,goal:'GPU 운영 효율',industry:'IT·소프트웨어',environment:'온프레미스',scale:'GPU 20장',timeline:'다음 달 PoC 검토',requestType:'도입·PoC 상담'},consent:true,emailConsent:false,meeting:true,preferredTimes:[new Date(Math.ceil((Date.now()+86400000)/1800000)*1800000).toISOString()],utm:{utm_source:'hackathon'}};
const r=await fetch(root+'/api/proposal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({demo:lead})});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/application\/pdf/);
const bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(0,4).toString(),'%PDF');
await fs.writeFile('../ACRYL-ONE-sample-proposal.pdf',bytes);
const custom={...lead,slots:{...blankSlots,track:'헬스케어 AX',needType:'맞춤 개발·시스템 연동',goal:'의료 AI',customTask:'연구원이 논문과 보고서에서 정보를 추출해 후보 물질 검토표를 작성',dataReadiness:'공개 논문과 사내 문서의 종류를 정리 중',environment:'사내 시스템 연동 · 온프레미스 여부 검토',successCriteria:'처리 시간과 담당자 검토 정확도 비교'},summary:'제약 연구의 자료 조사 업무에 맞춘 AI 개발과 기존 시스템 연동을 검토하고 싶습니다.'};
const c=await fetch(root+'/api/proposal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({demo:custom})});assert.equal(c.status,200);await fs.mkdir('../../work',{recursive:true});await fs.writeFile('../../work/custom-brief.pdf',Buffer.from(await c.arrayBuffer()));
console.log('HTTP smoke passed: pages, unauthorized access, Korean PDF response.');
