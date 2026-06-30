import { useEffect, useState } from 'react';
import './AdventureMapHome.css';

function api() { return window.__YPQ; }

export default function AdventureMapHome() {
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
  const visible = screen === 'home' && state.homeView === 'map';
  if (!visible) return null;

  const villages = state.villages || [];
  const featured = villages.find((v) => v.status === 'current')
    || villages.find((v) => v.status !== 'done')
    || villages[0];
  if (!featured) return null;
  const others = villages.filter((v) => v.book !== featured.book).sort((a, b) => b.book - a.book);
  const mascot = (featured.friends.find((f) => !f.collected) || featured.friends[0] || {}).emoji || '🦭';

  return (
    <section className="am-root" aria-label="Adventure map">
      <div className="am-hud">
        <div className="am-pill">🦪 {state.pearls ?? 0}</div>
        <div className="am-pill">🔥 {state.streak ?? 0}</div>
        <button className="am-ic" type="button" aria-label="sound" onClick={() => api()?.toggleMute?.()}>{state.muted ? '🔇' : '🔊'}</button>
      </div>

      <div className="am-map">
        <div className="am-inner">
          <span className="am-flag">🚩</span>
          {others.map((v, i) => (
            <div key={v.book}>
              <div className="am-trail" />
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
            </div>
          ))}
          <div className="am-trail" />
          <div className="am-cur">
            <div className="am-curtop">
              <div className="am-mascot">{mascot}</div>
              <div className="am-bubble">여기서 놀자!<br/><b>{featured.theme.en}</b> 친구를 모아줘 🐚</div>
            </div>
            <div className="am-curname">{featured.theme.emoji} {featured.theme.en}</div>
            <div className="am-gloss" style={{ marginBottom: 2 }}>{featured.theme.ko}</div>
            <div className="am-friends">
              {featured.friends.map((f) => (
                <div key={f.key} className={`am-fr ${f.collected ? 'done' : ''}`}>{f.collected ? f.emoji : f.emoji}</div>
              ))}
            </div>
            <div className="am-prog">🐚 Friends {featured.collected} / {featured.total}</div>
            <button className="am-cta" type="button" onClick={() => api()?.enterVillage?.(featured.book)}>Go! ▶</button>
          </div>
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
