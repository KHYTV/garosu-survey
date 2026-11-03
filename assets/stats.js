// CSV 만들기·내려받기, 원자료·코드북, 데모용 가짜 응답
window.GS_STATS = (() => {
  const p2 = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
  const stamp = iso => { if (!iso) return ''; const d = new Date(iso); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };

  function toCsv(rows) {
    const cell = v => {
      const s = v == null ? '' : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return rows.map(r => r.map(cell).join(',')).join('\r\n');
  }
  function download(name, text, bom = false) {
    const blob = new Blob([bom ? '﻿' + text : text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  // 같은 참여자(pid)의 pre·post 행을 한 줄로 합친다
  function merge(rows) {
    const by = new Map();
    for (const r of rows) {
      const m = by.get(r.pid) || { pid: r.pid, pre: null, post: null, pre_at: null, post_at: null };
      m[r.stage] = r.answers;
      m[`${r.stage}_at`] = r.created_at || null;
      by.set(r.pid, m);
    }
    return [...by.values()];
  }

  const verNote = () => Object.entries(GS.ITEMS_VERSIONS).map(([v, t]) => `${v}=${t}`).join('; ');
  // 응답에 _items_v 가 없으면 버전 1(이 기능이 생기기 전 응답)
  const itemsV = ans => (ans ? (ans._items_v ?? 1) : '');
  const META_COLS = [
    ['id', '응답자 번호(세션 생성일+순번, 익명)'], ['session', '참여 코드'], ['pid', '기기 참여 토큰(익명)'],
    ['pre_at', '시작 문항 제출 시각'], ['post_at', '본 설문 제출 시각'],
    ['items_v_pre', '시작 문항(62~66)을 답한 화면의 문항 문구 버전'], ['items_v_post', '본 설문(1~61)을 답한 화면의 문항 문구 버전 — SUS4·SUS9 문구 구분에 사용'],
    ['usage_sec', '서비스 사용 화면에 머문 시간(초)'], ['app_opened', '서비스 열기 버튼 누른 횟수'],
    ['SUS_score', 'SUS 점수 0~100'], ['UEQ_prag', 'UEQ-S 실용 −3~+3'], ['UEQ_hed', 'UEQ-S 쾌락 −3~+3'], ['UEQ_all', 'UEQ-S 전체'],
    ['PU_mean', '유용성 평균'], ['PEOU_mean', '사용 용이성 평균'], ['ATT_mean', '태도 평균'], ['CI_mean', '지속 사용 의도 평균(CI3 역산)'],
  ];
  const r2 = v => (v == null ? '' : Math.round(v * 100) / 100);

  function rawCsv(rows, code, date) {
    const people = merge(rows).filter(m => m.pre || m.post);
    const items = GS.ALL_ITEMS;
    const head = [...META_COLS.map(c => c[0]), ...items.map(i => i.id), ...items.filter(i => i.other).map(i => `${i.id}_other`)];
    const body = people.map((m, k) => {
      const a = { ...(m.pre || {}), ...(m.post || {}) };
      const ueq = GS.score.ueq(a);
      const meta = [`${date}-${String(k + 1).padStart(3, '0')}`, code, m.pid, stamp(m.pre_at), stamp(m.post_at), itemsV(m.pre), itemsV(m.post), a._usage_sec ?? '', a._app_opened ?? '',
        r2(GS.score.sus(a)), r2(ueq.pragmatic), r2(ueq.hedonic), r2(ueq.overall), r2(GS.score.pu(a)), r2(GS.score.peou(a)), r2(GS.score.att(a)), r2(GS.score.ci(a))];
      return [...meta, ...items.map(i => a[i.id] ?? ''), ...items.filter(i => i.other).map(i => a[`${i.id}_other`] ?? '')];
    });
    return toCsv([head, ...body]);
  }

  function codebookCsv() {
    const rows = [['변수', '문항 번호(종이 설문지)', '문항', '값', '비고']];
    for (const [k, d] of META_COLS) rows.push([k, '', d, /^items_v/.test(k) ? verNote() + ' (값 없음=1)' : '', '']);
    for (const i of GS.ALL_ITEMS) {
      let values = '';
      if (i.type === 'likert') values = GS.SCALES[i.scale].filter(o => o[1]).map(o => `${o[0]}=${o[1]}`).join('; ') + (i.reverse ? ' (역문항)' : '');
      else if (i.type === 'single') values = i.options.map(o => `${o[0]}=${o[1]}`).join('; ');
      else if (i.type === 'sd') values = `1=${i.left} … 7=${i.right}`;
      else if (i.type === 'year') values = '출생연도(4자리)';
      else if (i.type === 'text') values = '서술';
      const note = i.changed ? `문항 버전 ${i.changed.v}부터 문구 변경(종이 설문지 2026-10-30판과 다름). 이전 문구: ${i.changed.from}` : '';
      rows.push([i.id, i.no ?? '', i.text || `${i.left} – ${i.right}`, values, note]);
      if (i.other) rows.push([`${i.id}_other`, i.no ?? '', `${i.text} (기타 내용)`, '서술', '']);
    }
    return toCsv(rows);
  }

  // Yale SASSY 분류 도구용: casenumber, important, worry, personal, future (영문 보기)
  function sassyCsv(rows) {
    const people = merge(rows).filter(m => m.pre);
    const eng = (id, v) => { const it = GS.ALL_ITEMS.find(i => i.id === id); const o = it.options.find(x => x[0] === v); return o ? o[2] : ''; };
    const head = ['casenumber', 'important', 'worry', 'personal', 'future'];
    return toCsv([head, ...people.map((m, k) => [k + 1, ...GS.SASSY_IDS.map(id => eng(id, m.pre[id]))])]);
  }

  // 데모용 가짜 응답
  function demoRows(n) {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
    const rows = [];
    for (let k = 0; k < n; k++) {
      const pid = 'DEMO' + String(k + 1).padStart(3, '0');
      // 앞쪽 절반은 문항 버전 기록이 없는(버전 1) 예전 응답처럼, 두 명은 참여자 번호 없이
      const v = k < n / 2 ? {} : { _items_v: GS.ITEMS_VERSION };
      const pnum = k === 1 || k === 4 ? null : String(k + 1);
      const pre = { D9: pick(1, 2), important: pick(2, 5), worry: pick(2, 4), personal: pick(0, 4), future: pick(1, 4), _pnum: pnum, ...v };
      const post = { _usage_sec: pick(300, 420), _app_opened: pick(1, 3), _pnum: pnum, ...v };
      for (const i of GS.itemsOf('post')) {
        if (i.type === 'likert') post[i.id] = i.scale === 'likert5' ? pick(2, 5) : pick(3, 7);
        else if (i.type === 'sd') post[i.id] = pick(3, 7);
        else if (i.type === 'single') post[i.id] = pick(1, Math.min(3, i.options.length));
        else if (i.type === 'year') post[i.id] = pick(1998, 2007);
        else if (i.type === 'text') post[i.id] = k % 3 ? '' : '캐릭터가 귀여워요';
      }
      rows.push({ pid, stage: 'pre', answers: pre, created_at: new Date(Date.now() - (n - k) * 600000).toISOString() });
      if (k < n - 2) rows.push({ pid, stage: 'post', answers: post, created_at: new Date(Date.now() - (n - k) * 600000 + 900000).toISOString() });
    }
    return rows;
  }

  // 참여자 번호: 본 설문에서 고쳐 넣은 값이 있으면 그것을, 없으면 시작 문항의 값
  const pnumOf = m => { const v = (m.post && m.post._pnum) || (m.pre && m.pre._pnum); return v == null ? '' : String(v).trim(); };

  return { toCsv, download, ymd, stamp, merge, rawCsv, codebookCsv, sassyCsv, demoRows, itemsV, pnumOf };
})();
