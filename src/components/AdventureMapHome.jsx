import { useEffect, useRef, useState } from 'react';
import './AdventureMapHome.css';

function api() { return window.__YPQ; }

export default function AdventureMapHome() {
  const [state, setState] = useState(null);
  const [screen, setScreen] = useState('home');
  const curRef = useRef(null);

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

  // 현재 마을 카드로 자동 스크롤(보일 때 / 현재 마을이 바뀔 때)
  useEffect(() => {
    if (curRef.current) curRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [state?.activeBook, state?.homeView, screen]);

  if (!state) return null;
  const visible = screen === 'home' && state.homeView === 'map';
  if (!visible) return null;

  const villages = state.villages || [];
  if (!villages.length) return null;
  // 강조할 현재 마을: 진행 중 → 첫 미완 → 첫 마을
  const featured = villages.find((v) => v.status === 'current')
    || villages.find((v) => v.status !== 'done')
    || villages[0];

  return (
    <section className="am-root" aria-label="Adventure map" style={{ '--world': featured.theme.color || '#1cb0f6' }}>
      <div className="am-hud">
        <div className="am-pill">🦪 {state.pearls ?? 0}</div>
        <div className="am-pill">🔥 {state.streak ?? 0}</div>
        <button className="am-ic" type="button" aria-label="sound" onClick={() => api()?.toggleMute?.()}>{state.muted ? '🔇' : '🔊'}</button>
      </div>

      <div className="am-map">
        <div className="am-inner">
          <span className="am-flag">🚩</span>
          {villages.map((v, i) => {
            const isCur = v.book === featured.book;
            const mascot = (v.friends.find((f) => !f.collected) || v.friends[0] || {}).emoji || '🦭';
            return (
              <div key={v.book}>
                <div className="am-trail" />
                {isCur ? (
                  <div className="am-cur" ref={curRef}>
                    <div className="am-curtop">
                      <div className="am-mascot">{mascot}</div>
                      <div className="am-bubble">여기서 놀자!<br/><b>{v.theme.en}</b> 친구를 모아줘 🐚</div>
                    </div>
                    <div className="am-curname">{v.theme.emoji} {v.theme.en}</div>
                    <div className="am-gloss" style={{ marginBottom: 2 }}>{v.theme.ko}</div>
                    <div className="am-friends">
                      {v.friends.map((f) => (
                        <div key={f.key} className={`am-fr ${f.collected ? 'done' : ''}`}>{f.emoji}</div>
                      ))}
                    </div>
                    <div className="am-prog">🐚 Friends {v.collected} / {v.total}</div>
                    <button className="am-cta" type="button" onClick={() => api()?.enterVillage?.(v.book)}>Go! ▶</button>
                  </div>
                ) : (
                  <button
                    className={`am-vill ${i % 2 === 0 ? 'right' : 'left'} ${v.status}`}
                    type="button"
                    onClick={() => api()?.enterVillage?.(v.book)}
                  >
                    <div className="am-ve">{v.theme.emoji}</div>
                    <div>
                      <div className="am-vt">{v.theme.en}
                        <span className="am-vbadge">{v.status === 'done' ? '✓' : `${v.collected}/${v.total}`}</span>
                      </div>
                      <div className="am-gloss">{v.theme.ko}</div>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <nav className="am-nav" aria-label="Main">
        <button className="on" type="button" onClick={() => api()?.goMap?.()}>🗺️<span>Map</span></button>
        <button type="button" onClick={() => api()?.openFreePlay?.()}>🎮<span>Play</span></button>
        <button type="button" onClick={() => api()?.openDex?.()}>🎁<span>Treasure</span></button>
        <button type="button" onClick={() => api()?.openShop?.()}>👕<span>Style</span></button>
      </nav>
    </section>
  );
}
