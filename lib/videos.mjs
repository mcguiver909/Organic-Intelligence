export const videoLibrary=[
 {id:'uhSaPMwp4V4',product:'GPUBASE',kind:'제품 소개',title:'ACRYL NOW GPUBASE Highlights | 핵심 기능과 로드맵',duration:'1분 52초',verified:'2026-10-30',reason:'처음 검토할 때 짧게 제품을 알아보는 공식 하이라이트입니다.'},
 {id:'aQQwitezCUg',product:'GPUBASE',kind:'실제 시연',title:'GPUBASE 실제 시연: 자원 배분부터 추론 최적화까지',duration:'약 9분 15초',verified:'2026-10-30',reason:'공식 설명에 GPU 분할, 서버 간 학습 통신, 추론 우선순위, 토큰 예산 제어 시연을 안내합니다.'},
 {id:'GgSCmw1XFZc',product:'GPUBASE',kind:'기능 소개',title:'GPUBASE: 주요 기능 소개',duration:'3분 6초',verified:'2026-10-30',reason:'제품의 주요 기능을 확인하는 공식 소개 영상입니다.'},
 {id:'wpnMIG4TmUw',product:'GPUBASE',kind:'기술 소개',title:'GPUBASE: 이기종 가속기 지원과 글로벌 CSP 3사 환경 검증',duration:'3분 39초',verified:'2026-10-30',reason:'이기종 가속기·클라우드 환경을 검토할 때 참고할 공식 영상입니다.'},
 {id:'RTvbPVrxGRQ',product:'Healthcare',kind:'행사·솔루션 소개',title:'ACRYL NOW Healthcare: EMR은 그대로, 병원 안에서 돌아가는 의료 AI',duration:'1시간 6분',verified:'2026-10-30',reason:'의료·바이오 AI의 범위를 알아보는 공식 행사 영상입니다. 개별 업무의 개발 가능성은 기술 검토가 필요합니다.'},
 {id:'pPlYEIjGxUQ',product:'MLOps',kind:'기술 웨비나',title:'[Acryl] 디모아 웨비나 - Driving AI Forward: GPU and MLOps',duration:'40분',verified:'2026-10-30',reason:'GPU·MLOps를 다루는 공식 기술 웨비나입니다. 현재 제품의 개별 기능 시연으로 확인한 영상은 아닙니다.'},
 {id:'g34sbVrO82g',product:'JONATHAN',kind:'기술 발표',title:'GPU, 파운데이션 모델, 그리고 LLM OPs: 주권형 AX에 대하여',duration:'18분',verified:'2026-10-30',reason:'GPU·모델·LLM 운영의 관계를 알아보는 공식 채널의 기술 발표입니다. 제품 시연과 구분합니다.'},
 {id:'HfyXRAhciQE',product:'Healthcare-history',kind:'과거 의료 챗봇 시연',title:'의료 챗봇 시연',duration:'1분 31초',verified:'2026-10-30',reason:'공식 채널에 7년 전 자료로 표시됩니다. 현재 판매 제품의 기능·지원 범위와 구분하는 과거 사례입니다.'},
 {id:'bK9lkPElROo',product:'Healthcare-history',kind:'과거 맞춤 AI 개발 사례',title:'AI 플랫폼 Jonathan을 이용한 갑상선 결절 진단 서비스 개발 사례',duration:'5분 20초',verified:'2026-10-30',reason:'공식 채널에 5년 전 자료로 표시됩니다. 업무별 AI 개발 과정을 이해하기 위한 과거 사례이며, 현재 제품 성능·임상 적용 가능성은 별도 확인해야 합니다.'},
 {id:'QcE72y6DE-s',product:'JONATHAN-history',kind:'과거 버전 제품 소개',title:'조나단 플라이트베이스 v2.0 — 멀티 GPU 기반 머신러닝 플랫폼',duration:'1분 22초',verified:'2026-10-30',reason:'과거 Flightbase v2.0 소개 자료입니다. 현재 MODELBASE·JONATHAN 구성과 동일한 기능·버전으로 설명하지 않습니다.'}
];
export function consultationVideos(slots){
 if(slots.track==='헬스케어 AX'||slots.goal==='의료 AI')return slots.needType==='맞춤 개발·시스템 연동'?[videoLibrary[8],videoLibrary[4]]:videoLibrary.filter(v=>v.product==='Healthcare');
 if(slots.goal==='GPU 운영 효율')return [videoLibrary[slots.scale?1:0],videoLibrary[slots.scale?2:1]];
 if(slots.goal==='모델 개발·운영')return videoLibrary.filter(v=>v.product==='MLOps');
 if(slots.goal==='사내 AI 챗봇')return videoLibrary.filter(v=>v.product==='JONATHAN');
 return [];
}
export function nextVideo(slots){return consultationVideos(slots)[0]||{title:'ACRYL 공식 채널에서 추가 자료 찾기',url:'https://www.youtube.com/@acryl/videos',duration:'공식 채널',reason:'이 주제에 대한 단일 영상의 내용을 검증하지 않아 공식 채널로 안내합니다.'};}
