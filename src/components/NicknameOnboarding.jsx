import { useEffect, useState } from 'react';
import './NicknameOnboarding.css';

function api() { return window.__YPQ; }

export default function NicknameOnboarding() {
  const [need, setNeed] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const sync = () => { const s = api()?.getVillageState?.(); if (s) setNeed(!s.nickname); };
    window.addEventListener('ypq:state', sync);
    sync();
    const sug = api()?.nickSuggest?.(); if (sug) setName(sug);
    return () => window.removeEventListener('ypq:state', sync);
  }, []);

  if (!need) return null;

  const reroll = () => { setMsg(''); const s = api()?.nickSuggest?.(); if (s) setName(s); };

  const start = async () => {
    setBusy(true); setMsg('');
    const r = await api()?.nickCheck?.(name);
    if (!r || !r.ok) {
      if (r && r.reason === 'taken') { setMsg('이미 있는 이름이에요. 다른 이름을 골라줘!'); setName(api()?.nickSuggest?.(true) || name); }
      else setMsg('영어·숫자 3~14글자로 정해줘!');
      setBusy(false); return;
    }
    const ok = await api()?.setNickname?.(r.clean);
    if (!ok) { setMsg('앗, 다시 한 번 해볼까?'); setBusy(false); return; }
    // 성공 시 ypq:state 갱신으로 need=false → 자동으로 사라짐
  };

  return (
    <section className="nk-root" aria-label="Choose nickname">
      <div className="nk-card">
        <div className="nk-mascot">🦭</div>
        <h1 className="nk-title">너의 이름을 정해줘!</h1>
        <p className="nk-sub">친구들이 부를 영어 이름이야</p>
        <div className="nk-row">
          <input
            className="nk-input"
            value={name}
            maxLength={14}
            placeholder="SunnySeal"
            onChange={(e) => { setMsg(''); setName(e.target.value.replace(/[^A-Za-z0-9]/g, '')); }}
          />
          <button className="nk-dice" type="button" onClick={reroll} aria-label="다른 이름 추천">🎲</button>
        </div>
        {msg && <div className="nk-msg">{msg}</div>}
        <button className="nk-go" type="button" disabled={busy} onClick={start}>{busy ? '...' : '시작! ▶'}</button>
        <div className="nk-hint">🎲 를 누르면 다른 이름을 받아볼 수 있어</div>
      </div>
    </section>
  );
}
