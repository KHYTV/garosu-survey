# 우리동네가로수 사용성 평가 설문

「우리동네가로수」(https://khytv.github.io/woori-garosu/) 서비스의 사용성 평가 설문 웹. 종이 설문지(2026-10-30판, 66문항)를 그대로 옮기되
(단, 8번 SUS4·13번 SUS9 문구는 2026-11-04에 고침 → 아래 [문항 수정 이력](#문항-수정-이력)),
화면 순서는 **시작 문항(62~66) → 서비스 5분 사용(잠금) → 과업 평가(1~4) → 5~61** 이다.
구조와 코드는 [climate-survey](https://github.com/KHYTV/climate-survey)(GitHub Pages 정적 웹 + Supabase)를 그대로 따른다.

| 화면 | 주소 | 용도 |
|---|---|---|
| 참여자 설문 | `/?s=코드` | 동의 → 시작 문항 → 서비스 사용 5분 → 본 설문(전체 약 15~20분) |
| 결과 | `/results.html?s=코드` | 설문 종료 후 공개(진행자는 언제나). 척도 점수·과업 난이도·분포·자유 의견 |
| 진행자 콘솔 | `/admin.html` | 세션 생성, QR, 응답 수, 종료, 원자료 CSV, 코드북, SASSY CSV |

서버 없이 화면을 연습하려면 주소 끝에 `demo=1`을 붙인다(가짜 응답 12명, 잠금 15초):
`admin.html?demo=1` · `results.html?s=DEMO&demo=1` · `?s=DEMO&demo=1`

## 참여자 흐름

1. **참여 코드**(세션 코드) 입력(또는 QR) → **연구 안내·동의** + **참여자 번호**(진행자가 한 사람씩 준 번호, **필수**).
   번호 없이는 ‘설문 시작’이 되지 않고, 마지막 화면(Ⅶ)에서 제출 직전에 번호를 한 번 더 확인·입력받는다(예전 초안처럼 번호가 비어 있으면 여기서 채움).
   진행자 번호 없이 운영하는 세션이라면 `assets/config.js`의 `PNUM_REQUIRED: false`로 선택 입력으로 되돌릴 수 있다.
2. **시작 문항**: 62 환경 앱 사용 경험, 63~66 지구온난화 인식(Yale SASSY 4문항). 이 단계는 서비스를 쓰기 전에 **먼저 서버에 저장**된다.
3. **서비스 사용해 보기(잠금)**: 과업 1~4와 자유 탐색 안내, ‘우리동네가로수 열기’ 버튼(새 탭), **5분 카운트다운**.
   시작 시각을 기기에 기록해 두므로 다른 탭에 가 있거나 화면을 새로고침해도 시간은 계속 흐르고, 0이 되기 전에는 ‘다음 설문으로’ 버튼이 열리지 않는다
   (`assets/config.js`의 `LOCK_SECONDS`). 잠금 화면에 머문 시간과 열기 버튼을 누른 횟수가 응답에 함께 저장된다(`_usage_sec`, `_app_opened`).
4. **과업 평가(1~4)**: 과업별 SEQ(7점)와 완료 여부(혼자/도움/실패 — 종이 설문지의 진행자 기록을 자기보고로 대신)
5. Ⅱ 사용 편의성(SUS 5~14)·인상(UEQ-S 15~22) → Ⅲ 유용성·사용 용이성(23~34) → Ⅳ 태도·지속 사용 의도(35~41) → Ⅴ 첫인상·정보 이해(42~50) → Ⅵ 자유 의견(51~53) → Ⅶ 응답자 정보(54~61) → 제출
6. 중간에 창을 닫아도 같은 기기에서 다시 열면 이어서 할 수 있다(초안은 기기에만 저장). 제출은 기기(익명 토큰)당 1회.

## 1. Supabase 준비 (처음 1회)

우리동네가로수 앱과 **같은 프로젝트**를 써도 된다(표 이름이 `gs_`로 시작해 겹치지 않음). `assets/config.js`에는 이미 그 프로젝트의 주소와 공개 키가 들어 있다.

1. SQL Editor → `supabase/setup.sql` 전체 붙여넣기 → **맨 아래 `여기에-비밀번호`를 관리자 비밀번호(12자 이상)로 바꾼 뒤** Run.
2. 다른 프로젝트를 쓰려면 Project Settings → API의 Project URL과 **publishable(anon) 키**를 `assets/config.js`에 넣는다. secret/service_role 키는 절대 넣지 않는다.

### 프로젝트가 멈추지 않게 (keep-alive)

무료 프로젝트는 7일간 요청이 없으면 일시정지된다. `.github/workflows/keepalive.yml`이 **매일 06:00(KST)** 공개 키로 가벼운 조회 1회를 보내 깨어 있게 하고,
닿지 못하면 작업이 실패해 GitHub가 메일로 알린다 → 대시보드에서 **Restore project**. Actions 탭에서 "Run workflow"로 수동 실행도 된다.
(GitHub는 저장소에 60일간 커밋이 없으면 예약 작업을 멈추므로, 그때는 Actions 탭에서 다시 켠다.)

## 2. 리허설

1. `admin.html` → 관리자 비밀번호 → 테스트 세션 만들기 → QR로 참여 → 끝까지 제출
2. 콘솔에서 ‘시작 문항까지 n명 / 제출 완료 n명’ 확인 → **응답 원자료 CSV**·**코드북** 내려받아 열어 보기
3. 테스트 세션 삭제 → 본 조사용 세션은 당일 새로 만들기

## 3. 자료

- **원자료 CSV**: 응답자 1명 = 1행. 앞쪽에 메타(익명 id, 세션, 토큰, 제출 시각, 사용 시간)와 **척도 점수**(SUS 0~100, UEQ-S 실용·쾌락·전체, PU·PEOU·ATT·CI 평균, CI3 역산)가 붙고,
  그 뒤에 문항 원값(변수 이름은 종이 설문지 부록과 같음: SEQ1~4, SUS1~10, UEQ1~8, PU1~6, PEOU1~6, ATT1~4, CI1~3, FI1~7, DK1~2, OE1~3, D1~9, important/worry/personal/future).
  메타의 `items_v_pre`·`items_v_post`는 그 단계를 답한 화면의 **문항 문구 버전**(값 없는 예전 응답 = 1). SUS4·SUS9는 `items_v_post`로 이전/새 문구 응답을 나눈다.
- **코드북 CSV**: 변수, 종이 설문지 문항 번호, 문항, 값의 뜻, 비고(문구가 바뀐 문항의 이전 문구).
- **참여 현황 CSV**: 참여 토큰별 **참여자 번호**, 문항 버전, 시작·본 설문 제출 시각. 번호 없는 응답이 있으면 콘솔에 건수가 뜬다(아래 SQL로 붙이기).
- **SASSY 분류용 CSV**: `casenumber, important, worry, personal, future`(영문 보기) — Yale SASSY 도구에 올려 6개 집단을 배정한다(미국 표본 기준임을 한계로 밝힐 것).
- 개인정보: 이름·학번을 받지 않는다. 기기가 만든 익명 토큰으로 시작 문항과 본 설문을 잇고, 참여자 번호(`_pnum`)는 진행자 기록과 맞출 때만 쓴다(원자료 CSV에는 넣지 않고 참여 현황 CSV에만 — `pid`로 잇는다).
- 결과 화면은 응답 3명 미만이면 공개하지 않는다(`MIN_N`).

### 참여자 번호 없는 응답 붙이기

2026-11-04 이전 화면에서는 참여자 번호가 선택이어서 번호 없이 제출된 응답이 있을 수 있다(세션 코드는 그때도 필수였으므로 **세션에는 이미 묶여 있다**).
콘솔의 **참여 현황 CSV**에서 참여자 번호가 빈 토큰과 제출 시각을 확인하고, 진행자 기록(시각·순서·좌석)과 맞춘 뒤 Supabase SQL Editor에서 붙인다.

```sql
-- 1) 이 세션에서 참여자 번호 없이 들어온 응답 (ABCDE를 세션 코드로)
select pid, stage, created_at at time zone 'Asia/Seoul' as submitted_kst,
       answers->>'_pnum' as pnum, answers->>'_items_v' as items_v
from public.gs_responses
where session_code = 'ABCDE'
  and nullif(trim(coalesce(answers->>'_pnum', '')), '') is null
order by created_at;

-- 2) 확인한 번호를 그 토큰의 시작 문항·본 설문 행 모두에 붙이기 (사후 입력 시각도 남김)
update public.gs_responses
set answers = answers || jsonb_build_object('_pnum', '7', '_pnum_fixed_at', now())
where session_code = 'ABCDE' and pid = 'XXXXXXXX';
```

## 문항 수정 이력

문구를 바꿀 때는 `assets/items.js`의 `GS.ITEMS_VERSION`을 올리고 `GS.ITEMS_VERSIONS`에 내용을 적은 뒤, 바뀐 문항에 `changed: { v, from }`을 단다.
응답에는 각 단계를 처음 답한 화면의 버전이 `_items_v`로 저장되고(이미 일부 답한 예전 초안은 1로 기록), 원자료 CSV·참여 현황 CSV·결과 화면·코드북에 반영된다.
`?v=` 숫자(스크립트 캐시 무효화)도 함께 올린다. 서버(`gs_submit`)는 응답 값의 범위·문항 목록을 검사하지 않으므로 문구·메타 변경에 SQL 실행은 필요 없다.

| 버전 | 날짜 | 문항 | 이전 문구 | 새 문구 | 근거 |
|---|---|---|---|---|---|
| 2 | 2026-11-04 | 8번 SUS4 (화면 Ⅱ-A-4) | 이 앱을 쓰려면 기술에 밝은 사람의 도움이 필요할 것 같다. | 이 앱을 사용하려면 기술에 능숙한 사람의 도움이 필요할 것 같다. | ‘밝은 사람’이 무슨 뜻인지 모르겠다는 의견. 원문 *support of a technical person* |
| 2 | 2026-11-04 | 13번 SUS9 (화면 Ⅱ-A-9) | 나는 이 앱을 사용하면서 자신감을 느꼈다. | 나는 이 앱을 능숙하게 활용할 수 있다는 자신감을 느꼈다. | 자신감의 대상을 밝혀 달라는 의견. 원문 *confident using the system*(이 시스템을 쓰는 데 대한 자신감)을 넘지 않게 ‘이 앱 활용 능력’으로 한정 |

- **종이 설문지**(2026-10-30판)의 8·13번은 아직 이전 문구다. 종이로도 받는다면 같은 문구로 고쳐 인쇄해야 한다.
- **‘3. 관심 없다’ 보기 추가 의견은 반영하지 않았다.** 화면의 시작 문항 3번은 64번 `worry`(“지구온난화에 대해 얼마나 걱정하십니까?”, 4개 보기, 중립 없음)로,
  Yale SASSY 4문항 중 하나다. SASSY 분류 도구는 정해진 4개 보기(Very / Somewhat / Not very / Not at all worried)만 받으므로 보기를 늘리면 6개 집단 분류가 불가능해진다.

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 참여자 화면(동의 → 시작 문항 → 잠금 → 본 설문) |
| `admin.html` | 진행자 콘솔 |
| `results.html` | 결과 요약 |
| `assets/items.js` | 문항·척도·채점 규칙 |
| `assets/api.js` | Supabase RPC 래퍼(+ 데모 백엔드) |
| `assets/stats.js` | CSV·원자료·코드북·SASSY CSV·가짜 응답 |
| `assets/config.js` | Supabase 주소·공개 키, 잠금 시간, 최소 공개 인원 |
| `supabase/setup.sql` | 표·함수·관리자 비밀번호 |

문항 출처: SEQ Sauro & Dumas (2009) · SUS Brooke (1996) · UEQ-S Schrepp et al. (2017) · PU/PEOU Davis (1989) · ATT Venkatesh et al. (2003) · CI Bhattacherjee (2001) · SASSY Chryst et al. (2018).
UEQ-S 국문은 연구자 번역이므로 배포 전 공식 한국어판 표현으로 교체할 것.
