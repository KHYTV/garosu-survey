// 「우리동네가로수」 서비스 사용성 평가 설문 — 문항 정의
// 문항 번호(no)는 종이 설문지(2026-10-30판)의 번호. 화면 순서는 다르다:
//   시작 문항(62~66) → 서비스 5분 사용(잠금) → 과업 평가(1~4) → 5~61
window.GS = window.GS || {};

GS.APP_URL = 'https://khytv.github.io/woori-garosu/';

GS.SCALES = {
  likert5: [[1, '전혀 그렇지 않다'], [2, '그렇지 않다'], [3, '보통이다'], [4, '그렇다'], [5, '매우 그렇다']],
  likert7: [[1, '전혀 그렇지 않다'], [2, '그렇지 않다'], [3, '약간 그렇지 않다'], [4, '보통이다'], [5, '약간 그렇다'], [6, '그렇다'], [7, '매우 그렇다']],
  seq7: [[1, '매우 어렵다'], [2, ''], [3, ''], [4, ''], [5, ''], [6, ''], [7, '매우 쉽다']],
};

// SASSY 보기는 Yale 분류 도구용 영문을 같이 둔다
const HARM = [[4, '매우 많이', 'A great deal'], [3, '어느 정도', 'A moderate amount'], [2, '조금', 'Only a little'], [1, '전혀', 'Not at all'], [0, '모르겠다', "Don't know"]];

const likert = (no, id, text, scale, extra = {}) => ({ no, id, text, type: 'likert', scale, ...extra });
const single = (no, id, text, options, extra = {}) => ({ no, id, text, type: 'single', options, ...extra });

GS.TASKS = [
  { id: 'task1', title: '과업 1. 나무 찾기·친구 맺기', text: '지도에서 우리 동네(또는 진행자가 지정한 동)의 가로수 한 그루를 찾아 ‘친구 맺기’를 해 주세요.' },
  { id: 'task2', title: '과업 2. 내 나무 정보 확인', text: '‘내 나무’ 화면에서 친구 맺은 나무의 수종과 오늘 흡수량을 찾아보세요.' },
  { id: 'task3', title: '과업 3. 생활실천 기록', text: '오늘 한 생활실천 하나를 기록하고, 화면에 표시되는 감축량을 확인해 주세요.' },
  { id: 'task4', title: '과업 4. 도시 현황 확인', text: '‘전주 현황’에서 전주 가로수 전체의 연간 탄소 흡수량을 찾아보세요.' },
];
GS.TASK_RESULT = [[1, '혼자 완료했다'], [2, '도움을 받아 완료했다'], [3, '완료하지 못했다']];

GS.PARTS = [
  {
    id: 'pre', stage: 'pre', title: '시작 문항', lead: '서비스를 써 보기 전에 몇 가지 여쭙니다.',
    items: [
      single(62, 'D9', '환경 관련 앱·서비스(탄소발자국 계산, 걷기·자전거 기록, 분리배출 안내, 나무 심기 등)를 사용해 본 경험이 있습니까?', [[1, '사용 경험 있음'], [2, '사용한 적 없음']]),
      { no: null, id: null, type: 'note', text: '다음은 지구온난화에 대한 귀하의 생각을 묻는 질문입니다.' },
      single(63, 'important', '지구온난화 문제는 귀하 개인에게 얼마나 중요합니까?',
        [[5, '매우 중요하다', 'Extremely important'], [4, '중요하다', 'Very important'], [3, '어느 정도 중요하다', 'Somewhat important'], [2, '별로 중요하지 않다', 'Not too important'], [1, '전혀 중요하지 않다', 'Not at all important']]),
      single(64, 'worry', '귀하는 지구온난화에 대해 얼마나 걱정하십니까?',
        [[4, '매우 걱정한다', 'Very worried'], [3, '어느 정도 걱정한다', 'Somewhat worried'], [2, '별로 걱정하지 않는다', 'Not very worried'], [1, '전혀 걱정하지 않는다', 'Not at all worried']]),
      single(65, 'personal', '지구온난화가 귀하 개인에게 얼마나 해를 끼칠 것이라고 생각하십니까?', HARM),
      single(66, 'future', '지구온난화가 미래 세대에게 얼마나 해를 끼칠 것이라고 생각하십니까?', HARM),
    ],
  },
  { id: 'lock', type: 'lock', title: '서비스 사용해 보기' },
  {
    id: 'tasks', stage: 'post', title: 'Ⅰ. 과업 평가', lead: '방금 해 본 과업마다, 얼마나 어렵거나 쉬웠는지와 완료 여부를 표시해 주세요.',
    items: GS.TASKS.flatMap((t, k) => [
      { no: null, id: null, type: 'note', text: `${t.title} — ${t.text}` },
      likert(k + 1, `SEQ${k + 1}`, '전반적으로, 이 과업은 얼마나 어렵거나 쉬웠습니까?', 'seq7'),
      single(null, `SEQ${k + 1}_done`, '이 과업을 완료했습니까?', GS.TASK_RESULT),
    ]),
  },
  {
    id: 'sus', stage: 'post', title: 'Ⅱ-A. 사용 편의성', lead: '방금 사용해 본 ‘우리동네가로수’에 대해, 각 문장에 얼마나 동의하는지 하나만 표시해 주세요.',
    items: [
      likert(5, 'SUS1', '나는 이 앱을 자주 사용하고 싶다.', 'likert5'),
      likert(6, 'SUS2', '이 앱은 불필요하게 복잡하다.', 'likert5'),
      likert(7, 'SUS3', '이 앱은 사용하기 쉽다.', 'likert5'),
      likert(8, 'SUS4', '이 앱을 쓰려면 기술에 밝은 사람의 도움이 필요할 것 같다.', 'likert5'),
      likert(9, 'SUS5', '이 앱의 여러 기능은 잘 통합되어 있다.', 'likert5'),
      likert(10, 'SUS6', '이 앱에는 일관성이 없는 부분이 너무 많다.', 'likert5'),
      likert(11, 'SUS7', '대부분의 사람들은 이 앱 사용법을 매우 빨리 배울 것이다.', 'likert5'),
      likert(12, 'SUS8', '이 앱은 사용하기 매우 번거롭다.', 'likert5'),
      likert(13, 'SUS9', '나는 이 앱을 사용하면서 자신감을 느꼈다.', 'likert5'),
      likert(14, 'SUS10', '이 앱을 쓰기 전에 배워야 할 것이 많았다.', 'likert5'),
    ],
  },
  {
    id: 'ueq', stage: 'post', title: 'Ⅱ-B. 서비스에 대한 인상', lead: '‘우리동네가로수’에 대한 인상을 가장 잘 나타내는 칸에 하나만 표시해 주세요. 왼쪽 단어에 가까울수록 1, 오른쪽 단어에 가까울수록 7입니다.',
    items: [
      { no: 15, id: 'UEQ1', type: 'sd', left: '방해가 되는', right: '도움이 되는' },
      { no: 16, id: 'UEQ2', type: 'sd', left: '복잡한', right: '쉬운' },
      { no: 17, id: 'UEQ3', type: 'sd', left: '비효율적인', right: '효율적인' },
      { no: 18, id: 'UEQ4', type: 'sd', left: '혼란스러운', right: '명확한' },
      { no: 19, id: 'UEQ5', type: 'sd', left: '지루한', right: '흥미진진한' },
      { no: 20, id: 'UEQ6', type: 'sd', left: '흥미롭지 않은', right: '흥미로운' },
      { no: 21, id: 'UEQ7', type: 'sd', left: '평범한', right: '독창적인' },
      { no: 22, id: 'UEQ8', type: 'sd', left: '흔한', right: '앞서가는' },
    ],
  },
  {
    id: 'tam', stage: 'post', title: 'Ⅲ. 서비스의 유용성과 사용 용이성', lead: '방금 사용해 본 경험을 바탕으로, 각 문장에 얼마나 동의하는지 하나만 표시해 주세요.',
    items: [
      { no: null, id: null, type: 'note', text: 'A. 유용성' },
      likert(23, 'PU1', '이 앱을 쓰면 일상에서 기후 보호 실천을 더 쉽게 할 수 있을 것 같다.', 'likert7'),
      likert(24, 'PU2', '이 앱은 내 기후 보호 실천을 더 효과적으로 만들어 줄 것 같다.', 'likert7'),
      likert(25, 'PU3', '이 앱을 쓰면 내 실천을 더 빠르게 기록하고 확인할 수 있을 것 같다.', 'likert7'),
      likert(26, 'PU4', '이 앱은 내 기후 보호 실천의 성과를 높여 줄 것 같다.', 'likert7'),
      likert(27, 'PU5', '이 앱은 내가 기후 보호 실천을 더 많이 하도록 도와줄 것 같다.', 'likert7'),
      likert(28, 'PU6', '전반적으로 이 앱은 나에게 유용하다.', 'likert7'),
      { no: null, id: null, type: 'note', text: 'B. 사용 용이성' },
      likert(29, 'PEOU1', '이 앱 사용법을 익히는 것은 쉬웠다.', 'likert7'),
      likert(30, 'PEOU2', '이 앱에서 내가 하려던 것을 쉽게 할 수 있었다.', 'likert7'),
      likert(31, 'PEOU3', '이 앱의 화면과 조작은 명확하고 이해하기 쉬웠다.', 'likert7'),
      likert(32, 'PEOU4', '이 앱은 유연하게 사용할 수 있었다.', 'likert7'),
      likert(33, 'PEOU5', '이 앱을 능숙하게 쓰게 되는 것은 쉬울 것 같다.', 'likert7'),
      likert(34, 'PEOU6', '전반적으로 이 앱은 사용하기 쉽다.', 'likert7'),
    ],
  },
  {
    id: 'att', stage: 'post', title: 'Ⅳ. 서비스에 대한 태도와 앞으로의 사용 의향', lead: '각 문장에 얼마나 동의하는지 하나만 표시해 주세요.',
    items: [
      { no: null, id: null, type: 'note', text: 'A. 서비스에 대한 태도' },
      likert(35, 'ATT1', '이 앱을 사용하는 것은 좋은 생각이다.', 'likert7'),
      likert(36, 'ATT2', '이 앱은 기후 보호 실천을 더 흥미롭게 만들어 준다.', 'likert7'),
      likert(37, 'ATT3', '이 앱을 사용하는 것은 재미있다.', 'likert7'),
      likert(38, 'ATT4', '나는 이 앱을 사용하는 것이 좋다.', 'likert7'),
      { no: null, id: null, type: 'note', text: 'B. 앞으로의 사용 의향' },
      likert(39, 'CI1', '나는 이 앱을 그만두지 않고 계속 사용할 생각이다.', 'likert7'),
      likert(40, 'CI2', '나는 (메모나 다른 앱 같은) 다른 방법보다 이 앱을 계속 사용할 생각이다.', 'likert7'),
      likert(41, 'CI3', '할 수 있다면 나는 이 앱 사용을 그만두고 싶다.', 'likert7', { reverse: true }),
    ],
  },
  {
    id: 'fi', stage: 'post', title: 'Ⅴ. 첫인상과 정보 이해', lead: '각 문장에 얼마나 동의하는지 하나만 표시해 주세요.',
    items: [
      likert(42, 'FI1', '첫 화면만 보고도 이 앱이 무엇을 하는 서비스인지 알 수 있었다.', 'likert5'),
      likert(43, 'FI2', '나무와 ‘친구 맺기’를 하는 방법이 직관적이었다.', 'likert5'),
      likert(44, 'FI3', '지도에서 원하는 가로수를 찾기 쉬웠다.', 'likert5'),
      likert(45, 'FI4', '앱의 디자인(캐릭터, 색상, 화면 구성)이 마음에 들었다.', 'likert5'),
      likert(46, 'FI5', '화면에 표시된 탄소 수치(흡수량, 감축량)가 무엇을 뜻하는지 이해하기 쉬웠다.', 'likert5'),
      likert(47, 'FI6', '탄소 수치에 붙은 ‘검증 전’, ‘추정’, ‘80% 범위’ 같은 설명이 이해하기 쉬웠다.', 'likert5'),
      likert(48, 'FI7', '이 앱이 보여 주는 탄소 정보를 믿을 수 있었다.', 'likert5'),
      { no: null, id: null, type: 'note', text: '다음 문장이 맞는지 생각하시는 대로 표시해 주세요.' },
      single(49, 'DK1', '앱에 표시된 감축량은 내 행동으로 실제 줄어든 탄소의 양이다.', [[1, '예'], [2, '아니오'], [3, '모르겠다']]),
      single(50, 'DK2', '앱을 사용하면서 ‘검증 전’ 또는 ‘추정’이라는 표시를 보았다.', [[1, '예'], [2, '아니오']]),
    ],
  },
  {
    id: 'oe', stage: 'post', title: 'Ⅵ. 자유 의견', lead: '생각나는 대로 적어 주세요(선택).',
    items: [
      { no: 51, id: 'OE1', type: 'text', text: '이 앱을 써 보면서 가장 좋았던 점은 무엇입니까?' },
      { no: 52, id: 'OE2', type: 'text', text: '가장 불편하거나 헷갈렸던 점은 무엇입니까? (어느 화면이었는지 함께 적어 주세요)' },
      { no: 53, id: 'OE3', type: 'text', text: '바꾸거나 더했으면 하는 기능이 있다면 무엇입니까?' },
    ],
  },
  {
    id: 'demo', stage: 'post', title: 'Ⅶ. 응답자 정보', lead: '통계 분석을 위한 질문입니다.',
    items: [
      single(54, 'D1', '귀하의 성별은 무엇입니까?', [[1, '남성'], [2, '여성']]),
      { no: 55, id: 'D2', type: 'year', text: '귀하의 출생연도는 언제입니까?' },
      single(56, 'D3', '귀하의 현재 신분은 무엇입니까?', [[1, '학부 1학년'], [2, '학부 2학년'], [3, '학부 3학년'], [4, '학부 4학년 이상'], [5, '대학원생'], [6, '기타']], { other: true }),
      single(57, 'D4', '귀하의 전공 계열은 무엇입니까?', [[1, '인문'], [2, '사회'], [3, '자연'], [4, '공학'], [5, '예체능'], [6, '의약'], [7, '교육'], [8, '기타']], { other: true }),
      single(58, 'D5', '귀하의 현재 거주지는 어디입니까?', [[1, '전주시'], [2, '전주시 외 전북특별자치도'], [3, '그 외 지역']]),
      single(59, 'D6', '현재 거주지(시·군)에 산 기간은 얼마나 됩니까?', [[1, '1년 미만'], [2, '1년 이상~3년 미만'], [3, '3년 이상~5년 미만'], [4, '5년 이상']]),
      single(60, 'D7', '주로 사용하는 스마트폰 운영체제는 무엇입니까?', [[1, 'iOS (아이폰)'], [2, '안드로이드'], [3, '기타']]),
      single(61, 'D8', '하루 평균 스마트폰 이용 시간은 얼마나 됩니까?', [[1, '1시간 미만'], [2, '1~3시간 미만'], [3, '3~5시간 미만'], [4, '5~7시간 미만'], [5, '7시간 이상']]),
    ],
  },
];

// 응답 키 목록(필수 여부 포함)
GS.itemsOf = stage => GS.PARTS.filter(p => p.stage === stage).flatMap(p => p.items.filter(i => i.id));
GS.requiredKeys = stage => GS.itemsOf(stage).filter(i => i.type !== 'text').map(i => i.id);
GS.ALL_ITEMS = GS.PARTS.flatMap(p => (p.items || []).filter(i => i.id));
GS.SASSY_IDS = ['important', 'worry', 'personal', 'future'];

// 척도 점수 (연구자용 부록의 채점 규칙)
GS.score = {
  sus(a) {
    const vals = [];
    for (let k = 1; k <= 10; k++) {
      const v = a[`SUS${k}`];
      if (v == null) return null;
      vals.push(k % 2 ? v - 1 : 5 - v);
    }
    return vals.reduce((s, v) => s + v, 0) * 2.5;
  },
  mean(a, ids, transform = v => v) {
    const vals = ids.map(id => a[id]).filter(v => v != null).map(transform);
    return vals.length === ids.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  },
  ueq(a) {
    const prag = GS.score.mean(a, ['UEQ1', 'UEQ2', 'UEQ3', 'UEQ4'], v => v - 4);
    const hed = GS.score.mean(a, ['UEQ5', 'UEQ6', 'UEQ7', 'UEQ8'], v => v - 4);
    return { pragmatic: prag, hedonic: hed, overall: prag != null && hed != null ? (prag + hed) / 2 : null };
  },
  pu: a => GS.score.mean(a, ['PU1', 'PU2', 'PU3', 'PU4', 'PU5', 'PU6']),
  peou: a => GS.score.mean(a, ['PEOU1', 'PEOU2', 'PEOU3', 'PEOU4', 'PEOU5', 'PEOU6']),
  att: a => GS.score.mean(a, ['ATT1', 'ATT2', 'ATT3', 'ATT4']),
  ci: a => GS.score.mean({ ...a, CI3: a.CI3 == null ? null : 8 - a.CI3 }, ['CI1', 'CI2', 'CI3']),
};
