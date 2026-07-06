/* =====================================================================
   LEARNING TELEMETRY  — 학습 신호 수집 + 숙달도(mastery)
   ---------------------------------------------------------------------
   설계 원칙
   1) firebase를 직접 import하지 않는다(코드-스플릿 유지). 클라우드 전송은
      legacyGame이 연결해 두는 window.__saveEvents(batch) 어댑터로만 한다.
   2) 오프라인에서도 동작: 최근 이벤트를 localStorage 링버퍼에 보관해
      숙달도·약점 미션을 즉시 계산한다(읽기 비용 0).
   3) 게임 플레이를 절대 깨지 않는다: 모든 경로 try/catch.
   이벤트 형태: {game, phoneme, word, correct, latencyMs, mode, ts}
   ===================================================================== */

const LS_KEY = 'ypq_evlog';
const LOG_CAP = 300;   // 클라이언트 숙달도 계산용 최근 이벤트 보관 상한
const FLUSH_AT = 20;   // 이만큼 쌓이면 클라우드로 배치 전송

let LOG = load();      // 최근 이벤트(숙달도용)
let sendBuf = [];      // 클라우드 미전송 버퍼

function load() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : []; }
  catch (e) { return []; }
}
function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(LOG.slice(-LOG_CAP))); } catch (e) {}
}

/** 정답/오답 1건 기록 */
export function logAnswer(e) {
  try {
    const ev = {
      game: e.game || '',
      phoneme: e.phoneme || '',
      word: e.word || '',
      correct: !!e.correct,
      latencyMs: Math.max(0, Math.round(e.latencyMs || 0)),
      mode: e.mode || 'free',
      ts: Date.now()
    };
    LOG.push(ev);
    if (LOG.length > LOG_CAP) LOG = LOG.slice(-LOG_CAP);
    persist();
    sendBuf.push(ev);
    if (sendBuf.length >= FLUSH_AT) flushEvents();
  } catch (err) {}
}

/** 버퍼를 클라우드로 배치 전송(어댑터가 준비된 경우에만) */
export function flushEvents() {
  try {
    if (!sendBuf.length) return;
    const adapter = typeof window !== 'undefined' && window.__saveEvents;
    if (!adapter) return;            // 클라우드 미연결 → 다음 기회에(로컬 LOG엔 이미 보관됨)
    const batch = sendBuf.splice(0);
    Promise.resolve(adapter(batch)).catch(() => { sendBuf = batch.concat(sendBuf); });
  } catch (err) {}
}

/** 단어 숙달도 0~1 : 최근 8회 정답률(0.7) + 빠른정답률(0.3) */
export function mastery(word) {
  const xs = LOG.filter(r => r.word === word).slice(-8);
  if (!xs.length) return 0;
  const acc = xs.filter(r => r.correct).length / xs.length;
  const fast = xs.filter(r => r.correct && r.latencyMs > 0 && r.latencyMs < 2500).length / xs.length;
  return Math.min(1, acc * 0.7 + fast * 0.3);
}

/** 숙달도가 임계값 미만인 단어 목록(약점 미션용) */
export function weakWords(words, threshold = 0.6) {
  return (words || []).filter(w => mastery(typeof w === 'string' ? w : w.w) < threshold);
}

/** 음소별 정확도 요약 {phoneme:{seen,correct,acc}} — 리포트/대시보드 원천 */
export function phonemeStats() {
  const out = {};
  for (const r of LOG) {
    if (!r.phoneme) continue;
    const s = out[r.phoneme] || (out[r.phoneme] = { seen: 0, correct: 0, acc: 0 });
    s.seen++; if (r.correct) s.correct++;
  }
  for (const k in out) out[k].acc = out[k].seen ? out[k].correct / out[k].seen : 0;
  return out;
}

/** 이번 세션 요약(학부모 리포트 v0 재료) */
export function learningStats() {
  const learned = [...new Set(LOG.filter(r => r.correct && r.word).map(r => r.word))];
  const total = LOG.length, correct = LOG.filter(r => r.correct).length;
  return {
    answers: total,
    accuracy: total ? correct / total : 0,
    wordsPracticed: learned.length,
    phonemes: phonemeStats()
  };
}

// 창을 닫거나 백그라운드로 갈 때 남은 버퍼 전송(유실 방지)
if (typeof window !== 'undefined') {
  const bye = () => flushEvents();
  window.addEventListener('pagehide', bye);
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bye(); });
}
