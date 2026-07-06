import { useEffect, useState } from 'react';
import './TodayMissionHome.css';

function api() { return window.__YPQ; }

export default function TodayMissionHome() {
  const [state, setState] = useState(null);
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    const sync = () => { const s = api()?.getVillageState?.(); if (s) setState(s); };
    const onNav = (e) => { setScreen(e.detail?.screen || 'home'); sync(); };
    window.addEventListener('ypq:state', sync);
    window.addEventListener('ypq:navigate', onNav);
    if (document.querySelector('#home')?.classList.contains('active')) setScreen('home');
    sync();
    return () => {
      window.removeEventListener('ypq:state', sync);
      window.removeEventListener('ypq:navigate', onNav);
    };
  }, []);

  if (!state) return null;
  const visible = screen === 'home' && state.homeView === 'mission';
  if (!visible) return null;

  const theme = state.activeTheme;
  const friend = state.curFriend;
  const mission = state.mission || [];
  if (!theme || !friend) return null;

  const lt = (friend.letter || '').trim();
  const sound = /^[A-Za-z]\s[A-Za-z]$/.test(lt) ? lt.charAt(0).toLowerCase() : lt;
  const firstName = (friend.enName || '').split(' ')[0];
  const nextGame = mission.find((m) => !m.done) || mission[0];

  const xpPct = Math.round((state.xpProgress || 0) * 100);
  const wod = state.wordOfDay;
  const showReview = (state.reviewCount || 0) > 0 && !state.reviewDoneToday;

  const handleClaimWord = () => {
    const claimed = api()?.claimWordOfDay?.();
    if (claimed) {
      const s = api()?.getVillageState?.();
      if (s) setState(s);
    }
  };

  return (
    <section className="tm-root" aria-label="Today's mission" style={{ '--world': theme.color || '#1cb0f6' }}>
      <div className="tm-top">
        <div className="tm-pill">🦪 {state.pearls ?? 0}</div>
        <div className="tm-town"><div className="tm-tn">{theme.emoji} {theme.en}</div><div className="tm-gloss">{theme.ko}</div></div>
        <button className="tm-ic" type="button" aria-label="sound" onClick={() => api()?.toggleMute?.()}>{state.muted ? '🔇' : '🔊'}</button>
      </div>

      {/* CR-4-5: XP 진행바 */}
      <div className="tm-xp-bar" title={`Lv.${state.level} · ${state.xp || 0} XP`}>
        <div className="tm-xp-fill" style={{ width: `${xpPct}%` }} />
        <span className="tm-xp-label">Lv.{state.level}</span>
      </div>

      <button className="tm-back" type="button" onClick={() => api()?.goMap?.()}>◀ Map</button>

      <div className="tm-body">
        <div className="tm-inner">
          <div className="tm-hero">
            <div className="tm-mascot">{friend.emoji}</div>
            <div className="tm-bubble">오늘은 나랑 놀자!<br/><b>"{sound}"</b> 소리를 찾아줘 🐾</div>
          </div>
          <div className="tm-who">
            <div className="tm-nm">{friend.enName}<div className="tm-gloss">{friend.ko}</div></div>
            <button className="tm-letter" type="button" aria-label="letter sound" onClick={() => api()?.sayLetter?.(friend.key)}>{friend.letter}</button>
            <button className="tm-hear" type="button" aria-label="letter sound" onClick={() => api()?.sayLetter?.(friend.key)}>🔊</button>
          </div>

          {/* CR-4-3: 오늘의 단어 */}
          {wod && (
            <div className="tm-wod" onClick={() => { api()?.sayWord?.(wod.w); handleClaimWord(); }}>
              <span className="tm-wod-emo">{wod.emo || '🔤'}</span>
              <div className="tm-wod-info">
                <div className="tm-wod-label">오늘의 단어<span className="tm-gloss"> Word of the Day</span></div>
                <strong className="tm-wod-w">{wod.w}</strong>
              </div>
              <div className="tm-wod-claim">{state.wordOfDayClaimed ? '✅' : '+3🦪'}</div>
            </div>
          )}

          <div className="tm-card">
            <div className="tm-mh"><div className="tm-mt">⭐ Today's Mission<div className="tm-gloss">오늘의 미션</div></div><div className="tm-mc">{state.doneCount} / {mission.length || 3}</div></div>
            {mission.map((m) => (
              <button
                key={m.key}
                className={`tm-row ${m.done ? 'done' : (nextGame && nextGame.key === m.key ? 'now' : '')}`}
                type="button"
                onClick={() => api()?.playMission?.(m.key)}
              >
                <div className="tm-e">{m.emoji}</div>
                <div><div className="tm-n">{m.en}</div><div className="tm-s">{m.how}</div></div>
                <div className="tm-chk">{m.done ? '✅' : '▶'}</div>
              </button>
            ))}

            {/* CR-4-2: 오늘의 복습 */}
            {showReview && (
              <button className="tm-row tm-review" type="button" onClick={() => api()?.startReviewQuiz?.()}>
                <div className="tm-e">🔁</div>
                <div><div className="tm-n">오늘의 복습</div><div className="tm-s">{state.reviewCount}개 단어 다시 풀기</div></div>
                <div className="tm-chk">▶</div>
              </button>
            )}

            <div className="tm-reward">미션 {mission.length || 3}개 → 🎁 + {friend.emoji} <b>{firstName}</b> 친구 획득!</div>
          </div>
          <button className="tm-cta" type="button" onClick={() => api()?.playMission?.(nextGame ? nextGame.key : null)}>Start! ▶</button>
        </div>
      </div>

      <nav className="tm-nav" aria-label="Main">
        <button className="on" type="button" onClick={() => api()?.goMap?.()}>🗺️<span>Map</span></button>
        <button type="button" onClick={() => api()?.openFreePlay?.()}>🎮<span>Play</span></button>
        <button type="button" onClick={() => api()?.openDex?.()}>🎁<span>Treasure</span></button>
        <button type="button" onClick={() => api()?.openShop?.()}>👕<span>Style</span></button>
      </nav>
    </section>
  );
}
