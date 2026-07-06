import { useEffect, useState } from 'react';
import './VillageCompleteModal.css';

function api() { return window.__YPQ; }

export default function VillageCompleteModal() {
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState(1);
  const [friendsShown, setFriendsShown] = useState(0);
  const [reward, setReward] = useState(null);
  const [chestOpened, setChestOpened] = useState(false);

  useEffect(() => {
    const onVillageComplete = (e) => {
      const book = e.detail?.book;
      if (!book) return;
      const d = api()?.getVillageCompleteData?.(book);
      if (!d) return;
      setData(d); setPhase(1); setFriendsShown(0); setReward(null); setChestOpened(false);
      try { api()?.fx?.fanfare(); } catch (_) {}
      setTimeout(() => { try { api()?.fx?.fanfare(); } catch (_) {} }, 650);
      try { api()?.fx?.vibe([20, 40, 20, 40, 30]); } catch (_) {}
    };
    window.addEventListener('ypq:village-complete', onVillageComplete);
    return () => window.removeEventListener('ypq:village-complete', onVillageComplete);
  }, []);

  // Phase 1 → 2 자동 전환
  useEffect(() => {
    if (phase !== 1 || !data) return;
    const t = setTimeout(() => setPhase(2), 1800);
    return () => clearTimeout(t);
  }, [phase, data]);

  // Phase 2: 친구 순차 pop-in 후 Phase 3
  useEffect(() => {
    if (phase !== 2 || !data) return;
    const timers = [];
    data.friends.forEach((_, i) => {
      timers.push(setTimeout(() => {
        try { api()?.fx?.sfxPop(); } catch (_) {}
        setFriendsShown(i + 1);
      }, 320 * (i + 1)));
    });
    const allDone = 320 * (data.friends.length || 1);
    timers.push(setTimeout(() => {
      try { api()?.fx?.winJingle(); } catch (_) {}
    }, allDone + 50));
    timers.push(setTimeout(() => setPhase(3), allDone + 1100));
    return () => timers.forEach(clearTimeout);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChestTap = () => {
    if (chestOpened) return;
    setChestOpened(true);
    const r = api()?.openVillageChest?.() || { pearls: 60 };
    setReward(r);
    try { api()?.fx?.sfxChest(); api()?.fx?.fireworks(); api()?.fx?.vibe([10, 30, 10, 30, 40]); } catch (_) {}
    setTimeout(() => setPhase(4), 2600);
  };

  const handleGoNext = () => {
    const nb = data?.nextBook;
    setData(null);
    if (nb) api()?.enterNextVillage?.(nb);
    else api()?.goMap?.();
  };

  const handleLater = () => { setData(null); api()?.goMap?.(); };

  if (!data) return null;
  const { theme, friends, nextBook, nextTheme, nextFriends, nickname } = data;
  const isLast = !nextBook;

  return (
    <div className="vc-overlay">
      {/* Phase 1: 정복 선언 */}
      {phase === 1 && (
        <div className="vc-phase vc-p1" style={{ '--vc-accent': theme.color || '#1cb0f6' }}>
          <div className="vc-sparkles">✨🎊✨🎉✨🎊✨</div>
          <div className="vc-big-emoji">{theme.emoji}</div>
          <div className="vc-conquest">{theme.en} 정복! 🏆</div>
          <div className="vc-kogloss">{theme.ko}</div>
          {nickname && <div className="vc-nick">⭐ {nickname}, 최고야! ⭐</div>}
        </div>
      )}

      {/* Phase 2: 친구 퍼레이드 */}
      {phase === 2 && (
        <div className="vc-phase vc-p2">
          <div className="vc-p2-title">친구를 모두 만났어요! 🌟</div>
          <div className="vc-friends-row">
            {friends.map((f, i) => (
              <div key={f.key} className={`vc-friend${i < friendsShown ? ' vc-friend-in' : ''}`}>
                <div className="vc-f-emoji">{f.emoji}</div>
                <div className="vc-f-name">{f.name}</div>
              </div>
            ))}
          </div>
          {friendsShown >= friends.length && friends.length > 0 && (
            <div className="vc-friends-all">{friends.length}/{friends.length} 모두 수집! 🎉</div>
          )}
        </div>
      )}

      {/* Phase 3: 스페셜 빌리지 상자 */}
      {phase === 3 && (
        <div className="vc-phase vc-p3">
          <div className="vc-p3-title">⭐ 스페셜 빌리지 보상 ⭐</div>
          {!chestOpened ? (
            <div className="vc-s-chest" role="button" tabIndex={0} onClick={handleChestTap} onKeyDown={e => e.key === 'Enter' && handleChestTap()}>
              <div className="vc-chest-emoji">🎁</div>
              <div className="vc-chest-hint">탭해서 열어봐!</div>
            </div>
          ) : reward && (
            <div className="vc-reward-pop">
              <div className="vc-rew-icon">🦪</div>
              <div className="vc-rew-msg">🦪 +{reward.pearls} 진주 획득!</div>
            </div>
          )}
        </div>
      )}

      {/* Phase 4: 다음 마을 티저 */}
      {phase === 4 && (
        <div className="vc-phase vc-p4">
          {isLast ? (
            <>
              <div className="vc-all-title">🏆 모든 마을 정복! 🏆</div>
              <div className="vc-all-sub">Phonics Quest 완전 클리어!</div>
              <div className="vc-big-emoji" style={{ fontSize: '80px' }}>🎓</div>
              <button className="vc-cta-btn" style={{ background: '#ffc800', color: '#1a1a40' }} onClick={handleLater}>
                🗺️ 지도 보기
              </button>
            </>
          ) : (
            <>
              <div className="vc-next-label">🗺️ 다음 모험이 기다려...</div>
              <div className="vc-next-card" style={{ borderColor: nextTheme?.color || '#58cc02' }}>
                <div className="vc-nc-head">
                  <span className="vc-nc-emoji">{nextTheme?.emoji}</span>
                  <div>
                    <strong className="vc-nc-name">{nextTheme?.en}</strong>
                    <div className="vc-nc-ko">{nextTheme?.ko}</div>
                  </div>
                </div>
                <div className="vc-nc-friends">
                  {(nextFriends || []).slice(0, 6).map((_, i) => (
                    <span key={i} className="vc-nc-friend">❓</span>
                  ))}
                </div>
                <div className="vc-nc-prog">0/{nextFriends?.length || 0} 친구 대기 중...</div>
              </div>
              <button
                className="vc-cta-btn"
                style={{ background: nextTheme?.color || '#58cc02' }}
                onClick={handleGoNext}
              >
                {nextTheme?.emoji} {nextTheme?.ko} 탐험하러 가자! ▶
              </button>
              <button className="vc-later-btn" onClick={handleLater}>나중에</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
