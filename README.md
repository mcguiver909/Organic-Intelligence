# ACRYL ONE — 영상의 관심을 도입 미팅으로

고객이 ACRYL 유튜브를 보고 홈페이지에 방문했지만, 자신에게 필요한 제품과 문의 내용을 결정하기 어려운 상황을 해결하는 AI+X Hackathon MVP입니다. 목표 행동은 **도입 진단 미팅 신청·팀 담당자 확정**입니다. 계약은 이후 기술 검토·PoC·견적 협의를 거치는 장기 성과입니다.

## 구현 범위와 현재 상태

| 기능 | 구현 | 실제 연결 상태 |
|---|---|---|
| `/campaign` 문제 중심 제품 소개·공식 영상 연결 | 완료 | 공개 채널의 제목·길이·URL 확인 |
| `/` 선택형 + 자유문장 상담 | 완료 | 키 없으면 규칙 기반 체험을 명시 |
| Gemini 대화 + 구조화 추출 | 구현 | Flash 실제 응답 확인. 익명 로그인 활성화 후 통합 확인 |
| 공식 제품 근거와 후보 추천 | 완료 | 2026-10-30 브라우저 확인한 3개 제품 |
| CRM 저장·UTM 기록 | 완료 | Supabase 프로젝트 설정 필요 |
| `/dashboard` 로그인·팀원 권한·실시간 조회 | 완료 | 실제 Supabase Auth/Realtime 검증 필요 |
| 미팅 희망 시간 2개·KST·30분 단위 | 완료 | 요청 상태로 저장 |
| 팀 담당자의 미팅 확정·중복 시간 방지 | 완료 | DB 트랜잭션 테스트 통과. 실제 기업 캘린더 미연결 |
| 한국어 미팅 준비서 PDF | 완료 | 로컬 HTTP 생성·페이지 시각 검증 |
| 수신 동의 + 담당자 확인 후 이메일 | 완료 | Resend 키·인증된 발신 도메인 필요. 발송 미실행 |

Supabase가 없으면 로컬 체험 모드입니다. 이 브라우저의 localStorage에 저장되며 팀 공유·인증은 제공되지 않습니다. 가상 정보만 사용하세요. 실제 서비스는 아래 설정이 필요합니다.

## 빠른 로컬 실행

Node 24와 pnpm을 준비한 뒤 이 폴더에서 실행합니다.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

브라우저에서 `http://127.0.0.1:3000/campaign`을 엽니다. `.env.local`을 비워도 제품 탐색·규칙 상담·로컬 접수·미팅 준비서 PDF를 체험할 수 있습니다.

## 팀 공유를 위한 Supabase 설정

1. 해커톤 전용 **새 Supabase 프로젝트**를 만듭니다. 실제 기업 운영 DB와 분리합니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 한 번 실행합니다. 기존 프로젝트에 반복 실행하는 마이그레이션 파일이 아닙니다.
3. Auth에서 Anonymous Sign-ins를 활성화합니다. 고객은 익명 사용자 토큰으로 서버 상담 API를 호출합니다. 공개 가입한 사용자에게도 팀원 권한을 주지 않습니다.
4. 팀원 로그인은 Supabase Dashboard에서 테스트용 이메일·비밀번호 계정을 만듭니다. 별도 회원가입·비밀번호 설정 화면은 이번 MVP 범위에서 제외했습니다. 로그인 가능한 계정의 UUID를 아래에 등록합니다. 외부 사람에게 초대 메일을 보내는 작업은 이 프로젝트에서 수행하지 않았습니다.

```sql
insert into public.team_members(user_id)
values ('팀원의-실제-auth-user-uuid');
```

5. 아래 환경변수를 설정합니다. 키를 채팅·공개 저장소에 붙여넣지 말고 로컬 `.env.local` 또는 Vercel 환경변수에 입력합니다.

| 변수 | 위치 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저+서버 | 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 | Publishable 키(또는 legacy anon). 데이터 보호는 RLS 담당 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버만 | Secret 키(또는 legacy service_role). 검증된 요청의 CRM 저장·권한 제어 |
| `GEMINI_API_KEY` | 서버만 | Google Gemini 호출 |
| `GEMINI_MODEL` | 서버만 | 기본 `gemini-3.6-flash`. 계정에서 사용 가능한 모델 확인 |
| `RESEND_API_KEY` | 서버만 | 선택적 이메일 발송 |
| `EMAIL_FROM` | 서버만 | 본인 소유 인증 도메인의 발신주소. acryl.ai 주소를 임의 사용하지 않음 |

6. `/dashboard`에서 팀원 계정으로 로그인합니다. 팀원 A 화면을 열어두고 다른 브라우저의 고객 상담을 저장해 새 행이 나타나는지 확인합니다. 팀원 B도 같은 DB를 보게 됩니다.
7. 팀원이 아닌 일반·익명 사용자가 상담 목록, PDF, 발송 API에 접근하지 못하는지 확인합니다. Realtime은 `leads`, `email_jobs`, `meeting_bookings` 테이블을 사용합니다.

Auth 설정 변경이나 유료 서비스 가입은 사용자가 직접 완료해야 합니다. 이번 작업은 계정 생성·결제·외부 발송을 수행하지 않았습니다.

## Vercel 배포

1. 앱 폴더만 팀의 GitHub 저장소에 올립니다. 원본 Excel, `work/`, 실제 고객 데이터, 키, `.env.local`은 포함하지 않습니다. 이 앱에는 원본 행 데이터가 들어 있지 않습니다.
2. Vercel에서 해당 저장소를 Import하고 Framework를 **Next.js**, Node를 **24.x**로 선택합니다. 저장소 루트에 앱을 올렸다면 Root Directory는 기본값입니다. 상위 폴더까지 올렸다면 `outputs/acryl-one`을 선택합니다.
3. Install Command는 `pnpm install --frozen-lockfile`, Build Command는 `pnpm build`입니다.
4. 위 환경변수를 Preview와 Production에 설정합니다. `NEXT_PUBLIC_` 변수는 빌드 시 반영되므로 변경 후 재배포합니다. 팀 테스트용 Preview DB와 발표용 DB를 구분하면 기록이 섞이지 않습니다.
5. Deploy 후 `/campaign`, `/`, `/dashboard`를 실제 URL에서 확인합니다. 키가 없을 때 나타나는 로컬 체험을 공유 CRM 성공으로 발표하지 않습니다.
6. 다음 URL을 영상 설명·고정 댓글에 넣을 수 있습니다. `YOUR_APP`을 배포 주소로 교체합니다. 이 저장소는 유튜브 채널을 수정하지 않았습니다.

```text
https://YOUR_APP/?goal=GPU%20%EC%9A%B4%EC%98%81%20%ED%9A%A8%EC%9C%A8&utm_source=youtube&utm_medium=description&utm_campaign=acryl_now_2026&utm_content=uhSaPMwp4V4
```

영상마다 `utm_content`를 해당 영상 ID로 바꿉니다. 이메일은 `utm_source=edm`, 행사 QR은 `utm_source=event`를 씁니다. UTM은 유입 링크의 정보이며 실제 영상 시청을 검증하지 않습니다. 앱 내부 캠페인 페이지의 링크는 `acryl_one / owned_landing`으로 구분합니다.

## 팀 협업과 마감 우선순위

마감: **2026-10-31 09:30 KST**. 아래는 완료 사실이 아닌 권장 작업 순서입니다.

1. 먼저 GitHub 저장소·Vercel·Supabase를 한 사람이 연결합니다. 다른 팀원은 동일한 URL로 테스트합니다. 개발 도구를 각자 켜야 공동 사용 가능한 구조가 아닙니다.
2. 프론트 담당은 제품 설명·질문·미팅 신청 UX, 데이터 담당은 Supabase·권한·실시간 저장, 발표 담당은 영상별 링크·근거·시연 시나리오를 맡습니다.
3. 기능 브랜치 → PR → Vercel Preview에서 확인 → main 반영 → 동일 Production URL로 시연합니다. 같은 파일의 동시 수정은 피합니다.
4. 첫 목표는 **가상 고객 1명 → GPUBASE 후보 → 슬롯 확인 → 미팅 요청 → 다른 팀원 화면에 표시 → 일정 확정**입니다.
5. 그 다음 Gemini 실제 호출과 PDF를 확인합니다. 이메일은 키·발신 도메인이 이미 준비된 경우에만 연결합니다. 마감 직전 신규 이메일 도메인 세팅으로 핵심 시연을 늦추지 않습니다.
6. 08:30까지 기능을 고정하고, 09:00까지 실제 배포 URL·화면 녹화·백업 PDF를 확보한 뒤 09:30 전에 제출합니다.

## 기술 흐름

```text
YouTube 설명/고정댓글의 UTM 링크
  → 문제 중심 페이지/상담
  → 선택형 질문 + Gemini 서버 측 JSON 추출
  → 정확한 원문 근거 검증 + 고객의 슬롯 확인
  → 검증된 제품 카탈로그에서 후보·공식 출처 제공
  → 연락처·상담 동의·미팅 희망 시간 제출
  → 서버 인증/검증/쿼터 → Supabase leads 저장
  → RLS가 적용된 Realtime → 팀 대시보드
  → 팀 담당자 일정 확정 → 한국어 미팅 준비서 → 선택적 이메일
```

Gemini는 이름·이메일 입력 폼을 받지 않고 상담 문장과 슬롯을 처리합니다. 문장에 사용자가 직접 기입한 정보는 전송될 수 있으므로 민감정보 입력을 안내합니다. 추출값은 원문 인용이 실제 입력에 존재하는지 확인하고, 미확인값은 비워둡니다. 모델 응답 오류·시간초과에는 규칙 기반 안내로 전환하고 이를 표시합니다. 생성형 자유 제품 답변 대신 검증된 카탈로그 문장만 보여줍니다. 이는 소규모 근거 검색·주입 MVP이며 벡터 DB 기반 대규모 RAG는 아닙니다.

CRM은 기관·고객·접점으로 확장할 수 있는 호환 JSON과 새 상담 원문·동의·희망 시간·UTM을 하나의 `leads` 행에 저장합니다. 기존 Excel의 ID와 신규 실명 고객을 자동 매칭하지 않습니다. 고객등급·리드등급은 임의로 부여하지 않습니다.

## 미팅 확정의 정확한 의미

고객은 90일 이내 희망 시간을 최대 2개 제출합니다. 모두 한국 시간으로 입력하고 UTC로 저장합니다. 팀 담당자는 자신의 로그인 계정으로 한 시간을 확정합니다. DB에서 한 담당자의 같은 30분 시간 중복 확정을 막습니다. 미팅 확정은 로그인한 **해커톤 팀원**의 데모 일정입니다. ACRYL 직원의 실제 업무 가능 시간을 확인하거나 Google/Outlook 캘린더에 기록하는 기능은 연결되지 않았습니다. 미팅 링크는 담당자가 별도 안내합니다.

실제 기업용으로 만들려면 담당자·타임존·가용시간 정책, Google/Outlook free-busy 조회와 이벤트 생성 권한, 변경·취소·재예약·알림이 필요합니다. 이번 MVP에는 예약 취소·변경 UI를 넣지 않았습니다. 잘못 확정한 가상 일정은 관리자가 DB에서 검토해 처리합니다.

## 데모 DB와 ACRYL 기업 DB

이 앱이 저장하는 곳은 **팀이 만든 Supabase 데모 DB**입니다. 파일을 읽는 권한이나 홈페이지 공개 폼 접근은 기업 DB 쓰기 권한이 아닙니다. 실제 연결에는 ACRYL이 승인한 CRM API/DB 자격증명, 저장 필드 매핑, 접근 범위, 운영 담당자와 검증용 환경이 필요합니다. 권장 방식은 `POST /approved-crm/leads` 같은 사내 승인 API를 서버에서 호출하는 것입니다. 이 앱은 ACRYL 문의 폼을 자동 제출하지 않았고 실제 기업 DB에 쓰지 않았습니다.

## Sites와의 선택

ChatGPT Sites도 팀 도구·폼·저장 기능이 있는 앱을 호스팅할 수 있습니다. 현재 공식 문서는 D1/R2와 인증 가능한 Site 형태를 안내합니다. 다만 이번 요청의 Next.js·Vercel·Supabase 조합을 그대로 재현하는 목적에서는 Vercel이 직접적입니다. Sites의 서버 배포는 별도 Cloudflare Workers 호환 구성이므로 Next.js 저장소가 그대로 배포된다고 가정하지 않습니다. 설명용 캠페인 사이트나 가벼운 내부 도구는 Sites로 별도로 만들 수 있습니다.

## 검증

```sh
pnpm test
pnpm build
# Supabase 환경변수를 비운 로컬 서버를 실행한 상태에서:
node tests/http-smoke.mjs
```

- 8개 테스트 통과: 후보 선택, 의료/불명확 요구의 검토 전환, 근거 없는 추출 차단, 원문과 다른 값 차단, CRM 등급 미생성, PostgreSQL RLS/쿼터/미팅 중복 확정 차단.
- PostgreSQL 테스트는 PGlite에서 Supabase Auth 역할·auth.uid를 모사합니다. 실제 Supabase Auth·Realtime 네트워크 테스트를 대신하지 않습니다.
- 브라우저에서 로컬 상담·저장·대시보드와 PDF 응답을 확인했습니다. 한국어 샘플 PDF를 렌더링해 시각 검증했습니다.
- 실제 Vercel 배포, Gemini 인증 호출, Supabase 실시간 연결, Resend 발송, 실제 기업 DB/캘린더 쓰기는 자격증명이 없어 미실행입니다.

이메일은 수신 동의와 팀원 권한을 확인하고 한 상담당 하나의 발송 작업만 생성합니다. Resend 접수는 `accepted`, 불확실한 결과는 `needs_review`로 남기며 자동 재발송하지 않습니다. `accepted`는 고객 수신 완료가 아닙니다. 실제 기업 서비스 전에 수신 결과 웹훅·운영 모니터링을 연결해야 합니다. 쿼터는 사용자별/전체 분당 제한이며, 대규모 공개 운영에는 추가 봇 방어와 예산 제한이 필요합니다.

## 공식 참고

- [실제 문의 페이지](https://www.acryl.ai/contact)
- [GPUBASE](https://www.acryl.ai/products/gpubase), [AGENTBASE](https://www.acryl.ai/products/agentbase), [MODELBASE](https://www.acryl.ai/products/modelbase)
- [ACRYL 유튜브](https://www.youtube.com/@acryl/videos)
- [Gemini 구조화 출력 / Generate Content API](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes), [익명 로그인](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [ChatGPT Sites 공식 문서](https://learn.chatgpt.com/docs/sites)

코드는 이번 프로젝트를 위해 작성했습니다. Hugging Face 모델 가중치나 외부 GitHub 챗봇 저장소를 복제하지 않습니다. 글꼴은 Google Fonts의 Nanum Gothic이며 라이선스는 `assets/OFL.txt`에 포함했습니다.

## 최종 UX 반영

상담 결과 화면의 도입 검토 브리프는 연락처 없이 열 수 있습니다. 미팅 신청은 기본 해제 상태이며, 원하는 고객만 체크하고 희망 일정을 제출합니다. 상담 끝에는 목적·규모에 따른 공식 유튜브 영상을 안내합니다. GPU 입문은 하이라이트, 규모를 확인한 경우는 제품 시연입니다. 검증한 단일 영상이 없는 주제는 공식 채널로 안내합니다. 기술 웨비나·발표 자료는 제품 시연과 구분합니다. PDF는 상담 접수 후 받을 수 있습니다.

LinkedIn·Facebook·YouTube 역할 분담과 데이터셋 분석은 앱 폴더 밖의 PROJECT-REVIEW.md에 정리했습니다. 원본 Excel이나 비공개 마케팅 통계는 웹 앱 배포 소스에 포함하지 않았습니다.

## 사업 구조·맞춤 개발·상담 중 영상

`/guide`에서 AX, JONATHAN, 모듈과 적용 분야를 구분합니다. 상담은 데이터센터 운영 / 기업·공공 AX / 의료·바이오 AX와 기존 제품 / 맞춤 개발·시스템 연동 / 미정으로 분기합니다. 맞춤 개발은 업무 입력·처리·결과, 데이터 준비 상태, 연동 환경, PoC 성공 기준을 브리프와 CRM에 남기고 제품 자동 확정을 피합니다.

상담에 소개·시연 영상 카드와 클릭 후 로드되는 YouTube 플레이어를 넣었습니다. `/videos`에는 공식 채널에서 확인한 10개 자료를 분류했습니다. 과거 의료 챗봇·의료 AI 개발·Flightbase 자료는 과거 사례·버전으로 명시합니다. 영상 전체 내용이나 타임코드는 분석하지 않았습니다.

홈페이지 심층 검토와 Excel 제품 설명의 차이는 앱 폴더 밖 `WEBSITE-MAP.md`에 정리했습니다.

## 디자인

화이트 배경, 검정 타이포그래피·주요 버튼, 회색 구분선·보조 영역으로 정리했습니다. 기존 ACRYL 사이트의 큰 제목과 간결한 메뉴를 참고했으며 공식 영상의 색상은 유지합니다.


## 회사 URL 선행 분석과 단계별 상담

화면은 회사 URL/가설 확인 → 실제 Gemini 채팅 → 브리프/공식 영상 → 선택 접수·미팅으로 나뉩니다. 질문 버튼은 예시 답변을 재생하지 않고 현재 대화와 함께 Gemini에 전송합니다. 최근 6개 메시지와 슬롯을 전달하며 공식 제품 카탈로그 밖의 기능·성과를 약속하지 않도록 제한합니다. 문장 단위 응답이며 토큰 스트리밍·음성 Live API는 구현하지 않았습니다.

`/api/company`는 HTTPS 공개 홈페이지와 같은 출처의 관련 페이지를 최대 3개 읽습니다. JS로만 렌더링되는 본문, 외부 채용 사이트, 차단 페이지는 누락될 수 있습니다. IP 리터럴·내부망·인증 URL·비표준 포트를 차단하고 모든 DNS 응답이 공개 주소인지 확인한 뒤 연결 주소를 고정합니다. 리디렉션도 재검증하며 페이지 크기·시간·이동 횟수를 제한합니다.

Gemini는 본문에서 정확히 복사한 근거 문장으로 질문 후보를 선택하며, 카드 수를 억지로 채우지 않습니다. 규모·디지털 수준·실제 고충은 확정하지 않습니다. 라이브러리는 수동 작성이며 CRM 학습 결과가 아닙니다. 맞다/아니다/수정 응답은 `company_analysis`에 저장하고 PDF와 팀 브리핑에 포함합니다. 수정 응답은 고객이 쓴 설명으로 처리합니다. 거절된 가설은 추천 근거에서 제외합니다. 자동 재학습·유사 고객 성과 매칭은 구현하지 않았습니다.

기존 DB는 `supabase/migration-company.sql`만 추가 실행하세요. 새 프로젝트는 `schema.sql`을 한 번 실행합니다. Auth → Sign In / Providers → Anonymous Sign-Ins를 활성화해야 로그인 없는 방문자의 API 요청이 가능합니다. 팀 DB 조회는 `team_members`로 제한합니다.

로컬 `.env.local` 변경은 배포 환경에 전달되지 않습니다. Vercel → Project Settings → Environment Variables에 Supabase URL, Publishable key(ANON_KEY 이름), Secret key(SERVICE_ROLE_KEY 이름), Gemini 키, `GEMINI_MODEL=gemini-3.6-flash`를 설정하고 재배포하세요. 비밀 키에 NEXT_PUBLIC 접두사를 붙이지 않습니다. `/api/status`는 설정 존재 여부이며 서비스 성공 보장은 아닙니다.

검증: 12개 테스트·Next 빌드 통과. ACRYL 홈페이지와 하위 2개 페이지 수집 확인. Gemini 3.8은 503 혼잡 응답, 3.6 Flash는 200 확인하여 기본 모델 변경. Supabase 키 인증·leads 접근 확인. 방문자 통합 흐름은 익명 로그인 활성화 후 검증 필요. 기업 실제 DB·캘린더 연결은 별도 권한/API가 필요합니다.
