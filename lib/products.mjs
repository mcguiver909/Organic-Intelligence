// Official ACRYL product lineup, matching the product choices on https://www.acryl.ai/contact.
// Descriptions summarize the official product pages (checked 2026-10-31).
export const productLineup=[
 {id:'JONATHAN',group:'AX 인프라 플랫폼',summary:'GPU 자원 관리부터 AI 개발·운영까지 한 곳에서 연결하는 통합 플랫폼',detail:'GPU·NPU 등 서로 다른 AI 컴퓨팅 자원을 하나의 운영 체계로 묶고, 그 위에서 GPUBASE·MODELBASE·AGENTBASE 세 모듈이 함께 동작합니다. 모듈별로 단계적 도입도 가능합니다.',for:'AI 인프라 전체를 한 번에 정비하려는 기업·공공·데이터센터',source:'https://www.acryl.ai/products/jonathan'},
 {id:'GPUBASE',group:'JONATHAN 모듈 · 인프라',summary:'흩어진 GPU를 하나로 묶어 여러 팀이 나눠 쓰고, 사용 현황을 한눈에 관리',detail:'이기종 GPU·NPU·TPU를 단일 자원 풀로 통합하고, 성능 최적화·자원 격리·통합 모니터링을 지원합니다.',for:'GPU를 보유했지만 팀별 배분과 활용률 관리가 어려운 조직',source:'https://www.acryl.ai/products/gpubase'},
 {id:'AGENTBASE',group:'JONATHAN 모듈 · 업무용 AI',summary:'사내 문서를 찾아 답하는 챗봇과 업무 자동화 에이전트를 만들고 운영',detail:'LLM·에이전트 오케스트레이션 플랫폼입니다. RAG(사내 지식 검색), 시각적 워크플로우, 거버넌스를 한 곳에서 다룹니다.',for:'사내 지식 검색·반복 문의 응대·업무 자동화를 원하는 IT·DX 조직',source:'https://www.acryl.ai/products/agentbase'},
 {id:'MODELBASE',group:'JONATHAN 모듈 · 모델 운영',summary:'데이터 준비부터 학습·배포·운영까지 AI 모델의 전 과정을 관리',detail:'데이터 수집, 학습, 버전 관리, 배포, 실시간 모니터링까지 모델 라이프사이클을 하나의 흐름으로 통합합니다(MLOps).',for:'자체 AI 모델을 만들고 서비스로 운영하는 AI 개발팀·연구소',source:'https://www.acryl.ai/products/modelbase'},
 {id:'ALLM.H',group:'의료 파운데이션 모델',summary:'병원 안에서 직접 운영할 수 있는 한국어 의료 특화 대규모 언어모델',detail:'31B 규모의 한국 의료 파운데이션 모델로, 오픈 웨이트로 공개되어 온프레미스 운영이 가능합니다. 환자 데이터를 외부로 보내지 않는 구성을 안내합니다.',for:'의료 LLM을 내부에서 운영하려는 병원·바이오·연구기관',source:'https://www.acryl.ai/products/allmh'},
 {id:'NADIA-ANE',group:'의료 데이터 질의',summary:'병원 EMR 데이터를 말로 물어보면 찾아 주는 의료 특화 질의 시스템',detail:'기존 EMR·HIS를 바꾸지 않고, 자연어 임상 질문을 안전한 SQL로 바꿔 조회합니다. 환자 응대 챗봇이 아니라 의료진·연구자·운영자를 위한 도구입니다.',for:'EMR 데이터 조회·연구 데이터 추출에 시간이 드는 병원',source:'https://www.acryl.ai/products/nadia-ane'},
 {id:'솔루션',group:'분야별 도입 패키지',summary:'AI 데이터센터 · 바이오·헬스케어 · 엔터프라이즈·공공 분야별 도입 지원',detail:'AI 데이터센터 운영, 병원·바이오의 의료 AX, 보안·규제 환경의 기업·공공 AI 운영처럼 분야에 맞춰 제품을 조합해 도입을 지원합니다.',for:'제품보다 우리 분야의 도입 방식을 먼저 알고 싶은 조직',source:'https://www.acryl.ai/solutions/enterprise'},
 {id:'기타',group:'맞춤 개발 · 기타 문의',summary:'우리 업무에 맞춘 AI 개발이나 위에 없는 내용을 상담',detail:'특정 업무에 맞춘 AI 개발·시스템 연동, 기술 협력 등은 업무와 데이터, 운영 제약을 먼저 정리한 뒤 담당자가 검토합니다.',for:'정해진 제품보다 맞춤 개발을 검토하는 조직',source:'https://www.acryl.ai/contact'}
];

// Korean topic particle follows the spoken name: 조나단·솔루션 end in a consonant.
const topic={'JONATHAN':'은','솔루션':'은'};
export const productQuestion=id=>`${id}${topic[id]||'는'} 어떤 제품인가요?`;

// Deterministic answer used when the AI model is unavailable.
export function productAnswer(text){
 const p=productLineup.find(x=>text.trim()===productQuestion(x.id));
 if(!p)return '';
 return `${p.id} · ${p.group}\n${p.summary}.\n${p.detail}\n이런 곳에 맞습니다: ${p.for}.\n우리 회사 상황에 맞는지는 지금 겪는 문제를 말씀해 주시면 함께 확인하겠습니다.`;
}
