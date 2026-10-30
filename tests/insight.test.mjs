import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeInsight,ruleInsight,completeness} from '../lib/insight.mjs';
import {blankSlots} from '../lib/consult.mjs';

test('insight keeps only verbatim evidence and caps unsupported scores',()=>{
 const texts=['GPU 20장을 여러 팀이 나눠 쓰기가 어려워요'];
 const r=sanitizeInsight({intent:{stage:'문제 인식',evidence:'나눠 쓰기가 어려워요'},requestCategory:'도입 검토',productFit:[{product:'GPUBASE',score:92,evidence:'GPU 20장'},{product:'AGENTBASE',score:80,evidence:'사내 챗봇이 필요'},{product:'없는제품',score:99,evidence:'GPU'}],nextQuestions:['운영 환경']},texts);
 assert.equal(r.productFit.length,2);
 assert.deepEqual(r.productFit[0],{product:'GPUBASE',score:92,evidence:'GPU 20장',verified:true});
 assert.equal(r.productFit[1].score,30);
 assert.equal(r.productFit[1].verified,false);
 assert.deepEqual(r.evidenceCheck,{checked:2,verified:1});
 assert.equal(r.intent.stage,'문제 인식');
});

test('insight rejects invented enums',()=>{
 const r=sanitizeInsight({intent:{stage:'구매 확정',evidence:'x'},requestCategory:'계약',productFit:'nope'},['hi']);
 assert.equal(r.intent.stage,'정보 탐색');assert.equal(r.requestCategory,'없음');assert.deepEqual(r.productFit,[]);
});

test('rule insight scores products from customer words',()=>{
 const r=ruleInsight(['GPU 서버 자원 배분이 어려워요','견적도 받고 싶어요'],{...blankSlots});
 assert.equal(r.productFit[0].product,'GPUBASE');
 assert.equal(r.requestCategory,'견적·가격 문의');
 assert.equal(r.intent.stage,'도입 검토');
 assert.equal(completeness({...blankSlots}),0);
});

import {productLineup,productAnswer,productQuestion} from '../lib/products.mjs';
test('lineup matches the official contact form and answers offline',()=>{
 assert.deepEqual(productLineup.map(p=>p.id),['JONATHAN','GPUBASE','AGENTBASE','MODELBASE','ALLM.H','NADIA-ANE','솔루션','기타']);
 assert.ok(productAnswer(productQuestion('NADIA-ANE')).includes('EMR'));
 assert.equal(productAnswer('아무 질문'),'');
});
