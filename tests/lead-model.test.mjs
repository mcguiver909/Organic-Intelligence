import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreLead,leadFeatures,rankFromTitle,emailType,orgType,model} from '../lib/lead-model.mjs';
import {documentSources,documentKind,sourceLabel,isDocumentURL} from '../lib/document.mjs';

test('lead model reproduces the trained logistic model and narrows with information',()=>{
 const full=scoreLead({직급수준:'실무자',이메일유형:'개인 웹메일',요청:'없음',세그:'헬스케어 AX',기관유형:'의료기관',다회접촉:'1회'});
 assert.equal(full.unknown.length,0);assert.equal(full.low,full.high);
 const partial=scoreLead({직급수준:null,이메일유형:null,요청:'도입 검토',세그:'GPUBASE',기관유형:'기업',다회접촉:'1회'});
 assert.deepEqual(partial.unknown,['직급수준','이메일유형']);
 assert.ok(partial.low<partial.score&&partial.score<partial.high);
 const known=scoreLead({...partial.features,직급수준:'경영진/임원',이메일유형:'기업/기관 도메인'});
 assert.ok(known.score>partial.score);assert.equal(known.low,known.high);
 assert.ok(model.metrics.holdoutAUC>0.85);
});

test('consultation facts map to CRM categories',()=>{
 assert.equal(rankFromTitle('인프라팀 팀장'),'관리자');assert.equal(rankFromTitle('대표이사'),'경영진/임원');assert.equal(rankFromTitle(''),null);
 assert.equal(emailType('kim@naver.com'),'개인 웹메일');assert.equal(emailType('a@snu.ac.kr'),'대학');assert.equal(emailType('a@acme.co.kr'),'기업/기관 도메인');
 assert.equal(orgType('서울대학교병원'),'의료기관');
 const f=leadFeatures({slots:{goal:'GPU 운영 효율',jobTitle:'연구원'},insight:{requestCategory:'자료 요청',productFit:[]},company:'데모테크'});
 assert.deepEqual(f,{직급수준:'실무자',이메일유형:null,요청:'자료 요청',세그:'GPUBASE',기관유형:'기업',다회접촉:'1회'});
});

test('uploaded documents become grounded sources',()=>{
 assert.equal(documentKind('소개서.PDF'),'pdf');assert.equal(documentKind('a.hwp'),null);
 const s=documentSources('가'.repeat(30000),'회사 소개서.docx');
 assert.equal(s.length,3);assert.ok(isDocumentURL(s[0].url));assert.equal(sourceLabel(s[0].url),'회사 소개서.docx');
});
