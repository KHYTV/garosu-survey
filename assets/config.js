// Supabase 프로젝트 설정: 대시보드 → Project Settings → API
//  - SUPABASE_URL : Project URL (https://xxxx.supabase.co)
//  - SUPABASE_KEY : publishable 키(sb_publishable_...) 또는 legacy anon 키
// 이 키는 브라우저에 공개되도록 만들어진 키입니다. service_role / secret 키는 절대 넣지 마세요.
// 우리동네가로수 앱과 같은 프로젝트를 씁니다(표 이름이 gs_로 시작해 겹치지 않음).
window.GS_CONFIG = {
  SUPABASE_URL: 'https://clegtsntgwitpqpfnhob.supabase.co',
  SUPABASE_KEY: 'sb_publishable_X0PsntbEoDODj9LLRZi1-Q_D2tCrjwS',
  LOCK_SECONDS: 300,   // 서비스 사용 잠금 시간(5분). 주소에 demo=1이면 15초
  MIN_N: 3,            // 응답이 이보다 적으면 결과 화면을 공개하지 않음
};
