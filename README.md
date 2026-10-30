# ACRYL ONE — AI 도입 상담 MVP

ACRYL ONE AI+X Hackathon 독립 데모. 고객은 로그인 없이 회사 URL과 상담 질문으로 시작하고, 담당자는 인증된 팀 대시보드에서 이어받습니다. 실제 ACRYL 기업 DB·담당자 캘린더와 연결된 서비스는 아닙니다.

## 구현한 흐름

1. 회사 URL → 공개 홈페이지와 같은 출처의 관련 페이지 최대 3개 확인. 공개 문장을 정확히 인용한 질문 가설만 제안합니다.
2. 맞다 / 아니다 / 조금 달라요 → 좌측 회사 정보, 우측 실제 Gemini 채팅. 선택형 질문도 Gemini에 전송하며 최근 대화 6개, 공개 사업 근거, 고객이 수정한 회사 프로필, 가설 응답과 확인한 조건을 이어받습니다. 좌측 회사명·사업 분야·주요 서비스·규모를 직접 수정하면 다음 메시지부터 반영됩니다.
3. 실제 Gemini가 고객 발언 근거로 상담·미팅 준비 브리프를 작성합니다. 회사명·일시·현황·도입 조건·공식 제품 자료·미팅 질문·준비 자료·일정 상태를 별도 PDF로 생성합니다. 연락처 없이 미리 받을 수 있습니다.
4. 선택 접수 → 생성한 브리프가 자동 포함되며 요약을 다시 작성하지 않습니다. 추가 전달사항은 선택입니다. 이름·소속·이메일·상담 동의를 받습니다. 30분 미팅은 원하는 경우에만 희망 일정 2개까지 접수하고 팀원이 확인합니다.
5. 담당자 대시보드 → 권한 확인 후 상담 요약·가설 응답·내부 CRM 매핑·상태·담당자·메모·미팅·메일 검토.
6. ‘내가 찾아가자’ → 별도 동의한 고객의 보류 사유와 원문, 3개월 재확인 예정일 저장. 이전 본문과 새 공개 정보를 비교해 재접촉 후보·근거·불확실성·메일 초안을 생성합니다. 담당자가 승인해야 발송하며 이전 상담 재개·수신 거부 링크를 제공합니다.

## 실제 데이터 반영

CRM 데이터①의 원래 `기관 / 고객 / 접점` 컬럼 이름으로 내부 매핑을 저장합니다. 기존 기관ID·고객ID·등급·성별·연령대·VIP 여부는 추정하지 않습니다. 새 상담에서 받는 회사명·이름·이메일·URL·개발 요구·보류 사유는 `신규수집`으로 구분합니다. 뉴스레터 동의와 후속 제품 안내 동의는 다릅니다. 실제 기업 시스템으로 보내려면 승인된 API/자격증명과 ID·코드 매핑 합의가 필요합니다.

원본 Excel, 개인 식별 데이터, API 키, 담당자 로그인 정보는 저장소에 포함하지 않습니다. 익명 CRM으로 특정 기업의 성공 사례나 성과를 만들지 않습니다. 질문 라이브러리는 공식 제품 범위를 바탕으로 수동 작성했으며 CRM 자동 학습 모델이 아닙니다.

## 실행과 배포

Node 24 / pnpm 11.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
pnpm test
pnpm build
```

| 환경변수 | 용도 |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | 데모 프로젝트 URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Publishable key 또는 Legacy anon. 브라우저 공개 가능 |
| SUPABASE_SERVICE_ROLE_KEY | Secret key 또는 Legacy service_role. 서버만 |
| GEMINI_API_KEY | Google AI Studio 키. 서버만 |
| GEMINI_MODEL | 기본 `gemini-3.5-flash-lite` |
| APP_URL | 공개 배포 주소. 후속 메일의 상담 재개·수신 거부 링크 |
| CRON_SECRET | 무작위 32자 이상. 서버 스케줄러 인증 |
| GMAIL_USER / GMAIL_APP_PASSWORD | 실제 메일 발송(권장). Google 계정 2단계 인증 후 만든 앱 비밀번호. 누구에게나 발송 가능 |
| RESEND_API_KEY / EMAIL_FROM | Gmail 대신 Resend 사용 시. 인증된 도메인 발신주소가 없으면 계정 주인 이메일로만 발송됨 |

Supabase 새 프로젝트에서는 `supabase/schema.sql`을 한 번 실행합니다. 이미 초기 스키마가 있으면 추가 기능에 맞춰 `migration-company.sql`, `migration-nurture.sql`, `migration-brief.sql`, `migration-profile.sql`을 적용합니다. 이미 적용한 정책·발행 테이블 추가를 중복 실행하지 마세요. Auth → Sign In / Providers에서 Anonymous Sign-Ins를 켜야 고객에게 로그인 폼 없이 방문자 세션을 발급할 수 있습니다.

담당자는 Auth 사용자로 생성한 뒤 `team_members`에 해당 사용자 UUID를 등록합니다. 고객의 익명 세션은 다른 상담을 조회할 수 없습니다. 팀원도 접수 토큰 해시·상담 재개 토큰 해시와 비밀 키를 읽을 수 없습니다. 고객 이메일/동의 등 원본을 브라우저에서 임의 수정할 수 없고, 팀원은 상태·담당자·메모만 수정합니다.

Vercel에서 이 저장소를 Next.js 프로젝트로 연결하고 위 변수를 등록한 뒤 재배포하세요. 공개 변수는 Config, 서버 키는 Secret으로 등록합니다. 로컬 `.env.local`은 Vercel에 자동 전달되지 않습니다. `NEXT_PUBLIC_`에 비밀 키를 넣으면 빌드를 중단합니다. GitHub main push가 Vercel 자동 배포를 시작합니다.

## 후속 재상담 운영

`vercel.json`은 매일 10:00 KST에 재확인 API를 호출하도록 구성합니다. **CRON_SECRET이 배포 서버에 설정되기 전에는 실행되지 않습니다.** 한 번에 예정 고객 1개를 처리하는 MVP이며 대량 고객용 작업 큐는 아닙니다. 별도 후속 동의·예정일·동의 유효기간을 확인합니다. 만료/철회 고객은 제외합니다.

담당자는 예정일 전에도 변화 비교를 시연할 수 있습니다. 이 결과는 `시연` 상태로 남고 발송할 수 없으며 실제 예정 주기를 소비하지 않습니다. 정식 검토는 주기별 유일 키로 중복 생성하지 않습니다. 동일 본문·기존 문장·추정 변화만으로 재접촉 후보를 확정하지 않습니다. 새 인용이 있어도 구매 의향을 단정하지 않고 담당자가 원문·제품 근거·남은 불확실성을 확인합니다.

이메일은 발신 서비스와 APP_URL 설정, 유효한 동의, 예정일 경과, 승인 대기 후보, 담당자 승인이 모두 있어야 요청합니다. 중복 클릭을 원자적으로 막고 결과 불명 시 자동 재발송하지 않습니다. 서비스 접수는 실제 수신 완료와 다릅니다. Resend 실발송과 메일 링크의 실제 수신함 검증은 아직 하지 않았습니다. 보관기간·동의 철회/삭제 요청은 운영자가 관리하고 데모 종료 후 정리해야 합니다.

## 제한과 검증

- 실제 회사 URL 수집, Gemini 채팅·요약, Supabase 저장, PDF 생성, 방문자 조회 차단을 검증했습니다. ACRYL·WEFUN 공개 페이지 수집 확인.
- 17개 테스트와 Next 프로덕션 빌드 통과. SSRF 방지, DNS 주소 고정, 정확한 발언/공개 문장 검증, 등급 비추정, RLS·비밀 컬럼 보호·요청 제한·미팅 중복 방지·동의/변화 검증을 포함합니다.
- 문장 단위 채팅 응답이며 토큰 스트리밍·음성 Live API는 없습니다. 모델 혼잡·연결 실패 시 원문/기본 질문으로 전환하고 이를 표시합니다.
- 크롤러는 HTTPS 공개 문서만 읽고 JS를 실행하지 않습니다. 내부망·IP 리터럴·인증 URL·비표준 포트를 차단하며 DNS 응답·리디렉션·용량·시간을 제한합니다. 외부 채용 사이트, JS 전용 본문과 차단 페이지는 누락될 수 있습니다.
- 공개 정보로 회사 규모·디지털 수준·실제 고충·예산·성과를 확정하지 않습니다. 후속 비교는 페이지 앞 14,000자와 저장된 본문 범위 내에서만 가능합니다.
- 공식 자료 카탈로그 기반의 작은 MVP이며 전체 제품 문서를 검색하는 벡터 RAG는 아닙니다. 기존 제품 도입과 의료/맞춤 개발은 구분하고 적용 가능성은 기술 검토로 남깁니다.

## 팀 공동작업

GitHub Collaborators에 팀원을 추가하고 각자 브랜치 → PR → main 병합 순서로 작업하세요. 각 개발자는 별도 `.env.local`을 설정합니다. GitHub 코드 접근과 담당자 대시보드 접근은 별도 권한입니다. 개인 Plus 계정끼리 Sites 공동 편집으로 옮기는 대신 이 저장소를 공유할 수 있습니다.

공식 근거: [ACRYL 문의](https://www.acryl.ai/contact), [JONATHAN](https://www.acryl.ai/products/jonathan), [GPUBASE](https://www.acryl.ai/products/gpubase), [AGENTBASE](https://www.acryl.ai/products/agentbase), [MODELBASE](https://www.acryl.ai/products/modelbase), [Gemini 구조화 출력](https://ai.google.dev/gemini-api/docs/structured-output).

시연 서버에는 Gemini·Supabase·스케줄러 보안 키를 등록했습니다. 실제 담당자 시연 계정은 비공개 로컬 안내 파일로 제공하며 저장소에 포함하지 않습니다. 후속 이메일 발송은 Resend 키와 인증된 발신주소를 추가해야 합니다.

## CRM 학습 리드 점수와 유입고객 DB

- `model/train.py`: 아크릴 CRM 데이터① 잠재고객 중 직급이 확인된 1,817명으로 로지스틱 회귀를 학습합니다. 레이블은 리드등급 A·B 여부이며 데이터 제공사의 모의 생성값입니다. 홀드아웃 AUC 0.922, 5겹 교차검증 0.917±0.009, 직급만 쓴 기준 모델 0.775.
- `lib/lead-model.mjs`: 같은 가중치로 브라우저·서버에서 점수를 계산합니다. Gemini는 대화에서 직책·요청 유형·관심 제품만 추출하고, 점수는 이 모델이 결정적으로 계산합니다. 모르는 항목은 CRM 분포로 평균 내어 점수와 10~90% 범위를 함께 표시합니다.
- 유입고객 DB: `supabase/migration-crm.sql` 실행 후, 로컬에서 엑셀로 시드를 만들어 Supabase SQL 편집기에서 실행합니다. 고객 단위 데이터이므로 저장소에 커밋하지 않습니다.
  ```sh
  python3 model/export_prospects.py 데이터셋①.xlsx /tmp/prospects.json
  node model/build_seed.mjs /tmp/prospects.json supabase/seed-crm.sql
  ```
