// 서버 호출 래퍼. 주소에 ?demo=1 을 붙이면 서버 없이 가짜 데이터로 동작(리허설용).
window.GS_API = (() => {
  const DEMO = new URLSearchParams(location.search).has('demo');

  const MESSAGES = {
    SESSION_NOT_FOUND: '참여 코드를 찾을 수 없습니다. 코드를 다시 확인해 주세요.',
    SESSION_CLOSED: '설문이 이미 종료되었습니다.',
    ALREADY_SUBMITTED: '이 기기에서는 이미 제출되었습니다.',
    INVALID_INPUT: '입력값을 확인해 주세요.',
    ADMIN_KEY_INVALID: '관리자 비밀번호가 맞지 않습니다.',
    SESSION_EXISTS: '이미 있는 참여 코드입니다. 다른 코드를 쓰세요.',
    CONFIG_MISSING: 'Supabase 설정(assets/config.js)이 아직 비어 있습니다.',
  };

  function friendly(e) {
    const msg = String((e && e.message) || e);
    for (const code in MESSAGES) {
      if (msg.includes(code)) return Object.assign(new Error(MESSAGES[code]), { code });
    }
    if (/fetch|network|load failed/i.test(msg)) {
      return Object.assign(new Error('서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.'), { code: 'NETWORK' });
    }
    return Object.assign(new Error('오류가 발생했습니다: ' + msg), { code: 'UNKNOWN' });
  }

  let client = null;
  function db() {
    const cfg = window.GS_CONFIG || {};
    if (!window.supabase || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.startsWith('YOUR_')) {
      throw new Error('CONFIG_MISSING');
    }
    if (!client) {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
    }
    return client;
  }

  async function rpc(fn, args) {
    try {
      const { data, error } = await db().rpc(fn, args);
      if (error) throw new Error(error.message || JSON.stringify(error));
      return data;
    } catch (e) {
      throw friendly(e);
    }
  }

  const real = {
    sessionInfo: code => rpc('gs_session_info', { p_code: code }),
    // stage: 'pre'(시작 문항) | 'post'(나머지). 같은 참여자(pid)의 pre는 덮어쓸 수 있고 post는 1회
    submit: (code, pid, stage, answers) => rpc('gs_submit', { p_code: code, p_pid: pid, p_stage: stage, p_answers: answers }),
    results: (code, key) => rpc('gs_results', { p_code: code, p_admin_key: key || null }),
    adminList: key => rpc('gs_admin_list', { p_admin_key: key }),
    adminCreate: (key, code, title) => rpc('gs_admin_create', { p_admin_key: key, p_code: code, p_title: title }),
    adminSetStatus: (key, code, status) => rpc('gs_admin_set_status', { p_admin_key: key, p_code: code, p_status: status }),
    adminRoster: (key, code) => rpc('gs_admin_roster', { p_admin_key: key, p_code: code }),
    adminDelete: (key, code) => rpc('gs_admin_delete', { p_admin_key: key, p_code: code }),
  };

  // ---- 데모 백엔드 (이 탭 안에서만 유지) ----
  const wait = (ms = 250) => new Promise(r => setTimeout(r, ms));
  const demoState = {
    sessions: { DEMO: { code: 'DEMO', title: '데모 세션 (가짜 응답 12명)', status: 'open', rows: null, created_at: new Date().toISOString() } },
  };
  const demoSession = code => {
    const s = demoState.sessions[String(code || '').trim().toUpperCase()];
    if (!s) throw Object.assign(new Error(MESSAGES.SESSION_NOT_FOUND), { code: 'SESSION_NOT_FOUND' });
    if (!s.rows) s.rows = s.code === 'DEMO' ? GS_STATS.demoRows(12) : [];
    return s;
  };
  const nPost = s => s.rows.filter(r => r.stage === 'post').length;
  const nPre = s => s.rows.filter(r => r.stage === 'pre').length;
  const info = s => ({ code: s.code, title: s.title, status: s.status, n: nPost(s), n_pre: nPre(s) });
  const demo = {
    async sessionInfo(code) { await wait(); try { return info(demoSession(code)); } catch { return null; } },
    async submit(code, pid, stage, answers) {
      await wait(400);
      const s = demoSession(code);
      if (s.status !== 'open') throw Object.assign(new Error(MESSAGES.SESSION_CLOSED), { code: 'SESSION_CLOSED' });
      const k = s.rows.findIndex(r => r.pid === pid && r.stage === stage);
      if (k >= 0) {
        if (stage === 'post') throw Object.assign(new Error(MESSAGES.ALREADY_SUBMITTED), { code: 'ALREADY_SUBMITTED' });
        s.rows[k] = { pid, stage, answers, created_at: new Date().toISOString() };
      } else s.rows.push({ pid, stage, answers, created_at: new Date().toISOString() });
      return { ok: true };
    },
    async results(code) { await wait(); const s = demoSession(code); return { code: s.code, title: s.title, status: s.status, rows: s.rows }; },
    async adminList() { await wait(); return Object.values(demoState.sessions).map(s => { demoSession(s.code); return { ...info(s), created_at: s.created_at }; }); },
    async adminCreate(key, code, title) {
      await wait();
      code = code.trim().toUpperCase();
      if (demoState.sessions[code]) throw Object.assign(new Error(MESSAGES.SESSION_EXISTS), { code: 'SESSION_EXISTS' });
      demoState.sessions[code] = { code, title, status: 'open', rows: [], created_at: new Date().toISOString() };
      return info(demoSession(code));
    },
    async adminSetStatus(key, code, status) { await wait(); const s = demoSession(code); s.status = status; return info(s); },
    async adminRoster(key, code) {
      await wait();
      const s = demoSession(code);
      const pids = [...new Set(s.rows.map(r => r.pid))];
      return pids.map(pid => ({ pid, pre_at: s.rows.find(r => r.pid === pid && r.stage === 'pre')?.created_at || null, post_at: s.rows.find(r => r.pid === pid && r.stage === 'post')?.created_at || null }));
    },
    async adminDelete(key, code) { await wait(); delete demoState.sessions[String(code).toUpperCase()]; return { ok: true }; },
  };

  return Object.assign(DEMO ? demo : real, { DEMO });
})();
