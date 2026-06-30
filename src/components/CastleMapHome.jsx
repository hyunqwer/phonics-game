import { useEffect, useMemo, useState } from 'react';
import './CastleMapHome.css';

const CASTLE_COPY = {
  s: { name: 'Seal Castle', region: 'Sunny Coast', terrain: 'coast', flag: '🦭' },
  t: { name: 'Tiger Tower', region: 'Sunny Coast', terrain: 'tower', flag: '🐯' },
  b: { name: 'Bear Keep', region: 'Sunny Coast', terrain: 'keep', flag: '🐻' },
  h: { name: 'Hog Hill Fort', region: 'Sunny Coast', terrain: 'hill', flag: '🐷' },
  m: { name: 'Moon Mouse Castle', region: 'Sunny Coast', terrain: 'moon', flag: '🐭' },
  k: { name: 'Key Castle', region: 'Keywood Forest', terrain: 'forest', flag: '🔑' },
  j: { name: 'Jungle Gate', region: 'Keywood Forest', terrain: 'jungle', flag: '🧃' },
  f: { name: 'Foxfire Fort', region: 'Keywood Forest', terrain: 'fire', flag: '🦊' },
  g: { name: 'Goat Garden Gate', region: 'Keywood Forest', terrain: 'garden', flag: '🐐' },
  l: { name: 'Lion Lookout', region: 'Keywood Forest', terrain: 'lookout', flag: '🦁' },
  d: { name: 'Dog Dungeon', region: 'Moon River', terrain: 'dungeon', flag: '🐶' },
  n: { name: 'Nose Night Nook', region: 'Moon River', terrain: 'night', flag: '👃' },
  w: { name: 'Wolf Wind Wall', region: 'Moon River', terrain: 'wind', flag: '🐺' },
  c: { name: 'Cat Candy Castle', region: 'Moon River', terrain: 'candy', flag: '🐱' },
  r: { name: 'Rabbit River Rock', region: 'Moon River', terrain: 'river', flag: '🐰' },
};

const REGION_ORDER = ['Sunny Coast', 'Keywood Forest', 'Moon River'];

function getApi() {
  return window.__YPQ;
}

function readState() {
  return getApi()?.getCastleHomeState?.() || null;
}

function castleStatus(world) {
  if (world.locked) return 'locked';
  if (world.chestReady) return 'treasure';
  if (world.chestDone) return 'conquered';
  if (world.doneCount > 0) return 'progress';
  return 'new';
}

function statusLabel(status, world) {
  if (status === 'treasure') return 'Treasure ready';
  if (status === 'conquered') return 'Conquered';
  if (status === 'progress') return `${world.doneCount}/3 rooms`;
  if (status === 'locked') return 'Locked';
  return 'New gate';
}

export default function CastleMapHome() {
  const [visible, setVisible] = useState(true);
  const [homeState, setHomeState] = useState(null);
  const [selectedKey, setSelectedKey] = useState('s');

  useEffect(() => {
    const sync = () => {
      const next = readState();
      if (next) {
        setHomeState(next);
        setSelectedKey((current) => next.worlds.some((w) => w.key === current) ? current : next.curWorld);
      }
    };
    const onNavigate = (event) => setVisible((event.detail?.screen || 'home') === 'home');
    window.addEventListener('ypq:state', sync);
    window.addEventListener('ypq:navigate', onNavigate);
    sync();
    return () => {
      window.removeEventListener('ypq:state', sync);
      window.removeEventListener('ypq:navigate', onNavigate);
    };
  }, []);

  const worlds = homeState?.worlds || [];
  const selectedWorld = worlds.find((w) => w.key === selectedKey) || worlds.find((w) => w.key === homeState?.curWorld) || worlds[0];
  const selectedCopy = selectedWorld ? CASTLE_COPY[selectedWorld.key] || { name: selectedWorld.character, region: 'Sound Kingdom', flag: selectedWorld.emoji } : null;

  const regions = useMemo(() => {
    const grouped = new Map(REGION_ORDER.map((name) => [name, []]));
    worlds.forEach((world) => {
      const copy = CASTLE_COPY[world.key] || { region: 'Sound Kingdom' };
      if (!grouped.has(copy.region)) grouped.set(copy.region, []);
      grouped.get(copy.region).push(world);
    });
    return Array.from(grouped.entries()).filter(([, items]) => items.length);
  }, [worlds]);

  const chooseCastle = (key) => {
    setSelectedKey(key);
    getApi()?.openCastleFromMap?.(key);
  };

  const enterCastle = () => {
    if (!selectedWorld) return;
    if (selectedWorld.chestReady) {
      getApi()?.openCastleFromMap?.(selectedWorld.key);
      getApi()?.go?.('chest');
      return;
    }
    getApi()?.startCastleQuest?.(selectedWorld.key);
  };

  if (!visible) return null;

  return (
    <section className="castle-map-home" aria-label="Castle map home">
      <div className="castle-topbar">
        <div className="castle-pill">🦪 <span>{homeState?.pearls ?? 0}</span></div>
        <div className="castle-brand">Yoon&apos;s Phonics Quest</div>
        <div className="castle-top-actions">
          <button className="castle-icon-btn" type="button" onClick={() => getApi()?.toggleMute?.()} aria-label="Toggle sound">🔊</button>
          <button className="castle-avatar" type="button" onClick={() => getApi()?.openShop?.()} aria-label="Open outfit">{selectedWorld?.emoji || '🦭'}</button>
        </div>
      </div>

      <main className="castle-scroll">
        {selectedWorld && (
          <section className={`castle-hero castle-terrain-${selectedCopy.terrain || 'coast'}`}>
            <div className="castle-hero-copy">
              <span className="castle-kicker">Today&apos;s Castle</span>
              <h1>{selectedCopy.name}</h1>
              <p>{selectedWorld.phoneme} sound · {statusLabel(castleStatus(selectedWorld), selectedWorld)}</p>
              <div className="castle-room-track" aria-label="Castle room progress">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < selectedWorld.doneCount ? 'clear' : ''}>{i < selectedWorld.doneCount ? '✓' : i + 1}</span>
                ))}
                <strong>{selectedWorld.chestReady ? '🎁' : selectedWorld.chestDone ? '🏁' : '🏰'}</strong>
              </div>
            </div>
            <div className="castle-hero-art">
              <div className="castle-flag">{selectedWorld.chestDone ? '🚩' : selectedCopy.flag}</div>
              <div className="castle-keep">🏰</div>
            </div>
            <button className="castle-primary" type="button" onClick={enterCastle}>
              {selectedWorld.chestReady ? 'Open Treasure' : selectedWorld.chestDone ? 'Return Quest' : 'Enter Castle'}
            </button>
          </section>
        )}

        <section className="castle-map-panel">
          <div className="castle-section-head">
            <span>Kingdom Map</span>
            <strong>{worlds.filter((w) => w.chestDone).length}/{worlds.length} flags</strong>
          </div>
          <div className="castle-road">
            {regions.map(([region, items]) => (
              <div className="castle-region" key={region}>
                <div className="castle-region-title">{region}</div>
                <div className="castle-node-row">
                  {items.map((world) => {
                    const copy = CASTLE_COPY[world.key] || { name: world.character, flag: world.emoji };
                    const status = castleStatus(world);
                    return (
                      <button
                        type="button"
                        key={world.key}
                        className={`castle-node ${selectedWorld?.key === world.key ? 'selected' : ''} ${status}`}
                        onClick={() => chooseCastle(world.key)}
                      >
                        <span className="castle-node-art">{status === 'conquered' ? '🚩' : copy.flag}</span>
                        <span className="castle-node-name">{copy.name}</span>
                        <span className="castle-node-sound">{world.phoneme}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="castle-quest-panel">
          <div className="castle-section-head">
            <span>Quest Rooms</span>
            <strong>{selectedWorld?.doneCount || 0}/3</strong>
          </div>
          <div className="castle-room-grid">
            <button type="button" onClick={enterCastle}>🫧 Bubble Gate</button>
            <button type="button" onClick={enterCastle}>⚡ Echo Chamber</button>
            <button type="button" onClick={enterCastle}>🔨 Guard Hall</button>
          </div>
        </section>
      </main>

      <nav className="castle-bottom-nav" aria-label="Main">
        <button className="active" type="button">🏰<span>Map</span></button>
        <button type="button" onClick={() => getApi()?.openFreePlay?.()}>🎮<span>Quest</span></button>
        <button type="button" onClick={() => getApi()?.openDex?.()}>📖<span>Collection</span></button>
        <button type="button" onClick={() => getApi()?.openShop?.()}>✨<span>Outfit</span></button>
      </nav>
    </section>
  );
}
