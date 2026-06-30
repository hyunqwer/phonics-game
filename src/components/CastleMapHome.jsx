import { useEffect, useMemo, useState } from 'react';
import './CastleMapHome.css';

const CASTLE_COPY = {
  s: { name: 'Seal Castle', region: 'Sunny Coast', terrain: 'coast', emblem: 'S' },
  t: { name: 'Tiger Tower', region: 'Sunny Coast', terrain: 'tower', emblem: 'T' },
  b: { name: 'Bear Keep', region: 'Sunny Coast', terrain: 'keep', emblem: 'B' },
  h: { name: 'Hog Hill Fort', region: 'Sunny Coast', terrain: 'hill', emblem: 'H' },
  m: { name: 'Moon Mouse Castle', region: 'Sunny Coast', terrain: 'moon', emblem: 'M' },
  k: { name: 'Key Castle', region: 'Keywood Forest', terrain: 'forest', emblem: 'K' },
  j: { name: 'Jungle Gate', region: 'Keywood Forest', terrain: 'jungle', emblem: 'J' },
  f: { name: 'Foxfire Fort', region: 'Keywood Forest', terrain: 'fire', emblem: 'F' },
  g: { name: 'Goat Garden Gate', region: 'Keywood Forest', terrain: 'garden', emblem: 'G' },
  l: { name: 'Lion Lookout', region: 'Keywood Forest', terrain: 'lookout', emblem: 'L' },
  d: { name: 'Dog Dungeon', region: 'Moon River', terrain: 'dungeon', emblem: 'D' },
  n: { name: 'Night Nook', region: 'Moon River', terrain: 'night', emblem: 'N' },
  w: { name: 'Wind Wall', region: 'Moon River', terrain: 'wind', emblem: 'W' },
  c: { name: 'Candy Castle', region: 'Moon River', terrain: 'candy', emblem: 'C' },
  r: { name: 'River Rock', region: 'Moon River', terrain: 'river', emblem: 'R' },
};

const REGION_ORDER = ['Sunny Coast', 'Keywood Forest', 'Moon River'];
const ROOM_LABELS = ['Bubble Gate', 'Echo Chamber', 'Guard Hall'];
const ROOM_ICONS = ['bubble', 'echo', 'guard'];

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
  if (status === 'conquered') return 'Flag raised';
  if (status === 'progress') return `Gate Power ${world.doneCount}/3`;
  if (status === 'locked') return 'Fog locked';
  return 'New gate';
}

function nodeStatusLabel(status, world) {
  if (status === 'treasure') return 'Treasure';
  if (status === 'conquered') return 'Flag';
  if (status === 'progress') return `${world.doneCount}/3`;
  if (status === 'locked') return 'Locked';
  return 'New';
}

function guideLine(status, castleName) {
  if (status === 'treasure') return `${castleName} is glowing. Open the treasure!`;
  if (status === 'conquered') return 'Your flag is flying here. Return for bonus quests.';
  if (status === 'progress') return 'One more room can push the gate open.';
  return 'Pick a castle, open the gate, and claim your flag.';
}

function CastleArt({ status, terrain, emblem, size = 'small' }) {
  return (
    <span className={`castle-art castle-art-${size} terrain-${terrain || 'coast'} status-${status}`} aria-hidden="true">
      <span className="castle-mist" />
      <span className="castle-tower left"><i /></span>
      <span className="castle-body"><i>{emblem}</i></span>
      <span className="castle-tower right"><i /></span>
      <span className="castle-gate" />
      <span className="castle-banner">{status === 'conquered' ? '✓' : emblem}</span>
      <span className="castle-treasure" />
    </span>
  );
}

export default function CastleMapHome() {
  const [visible, setVisible] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
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
  const selectedCopy = selectedWorld ? CASTLE_COPY[selectedWorld.key] || { name: selectedWorld.character, region: 'Sound Kingdom', terrain: 'coast', emblem: selectedWorld.key.toUpperCase() } : null;
  const selectedStatus = selectedWorld ? castleStatus(selectedWorld) : 'new';

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
    setDetailOpen(false);
    setSelectedKey(key);
    getApi()?.openCastleFromMap?.(key);
  };

  const openGate = () => {
    if (!selectedWorld) return;
    if (selectedWorld.chestReady) {
      getApi()?.openCastleFromMap?.(selectedWorld.key);
      getApi()?.go?.('chest');
      return;
    }
    setDetailOpen(true);
  };

  const startRoom = () => {
    if (selectedWorld) getApi()?.startCastleQuest?.(selectedWorld.key);
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
          <section className={`castle-hero castle-terrain-${selectedCopy.terrain || 'coast'} status-${selectedStatus}`}>
            <div className="castle-hero-copy">
              <span className="castle-kicker">Today&apos;s Castle</span>
              <h1>{selectedCopy.name}</h1>
              <p>{statusLabel(selectedStatus, selectedWorld)}</p>
              <span className="castle-sound-chip">{selectedWorld.phoneme} sound</span>
              <div className="castle-room-track" aria-label="Gate power progress">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < selectedWorld.doneCount ? 'clear' : ''}>{i < selectedWorld.doneCount ? '✓' : i + 1}</span>
                ))}
                <strong>{selectedWorld.chestReady ? '🎁' : selectedWorld.chestDone ? '🚩' : '⚡'}</strong>
              </div>
            </div>
            <div className="castle-hero-art">
              <CastleArt status={selectedStatus} terrain={selectedCopy.terrain} emblem={selectedCopy.emblem} size="large" />
            </div>
            <div className="castle-guide">
              <span className="guide-avatar">{selectedWorld.emoji}</span>
              <span>{guideLine(selectedStatus, selectedCopy.name)}</span>
            </div>
            <button className="castle-primary" type="button" onClick={openGate}>
              {selectedWorld.chestReady ? 'Open Treasure' : selectedWorld.chestDone ? 'Return to Castle' : 'Open the Gate'}
            </button>
          </section>
        )}

        <section className="castle-map-panel">
          <div className="castle-section-head">
            <span>Kingdom Map</span>
            <strong>{worlds.filter((w) => w.chestDone).length}/{worlds.length} castles claimed</strong>
          </div>
          <div className="castle-road">
            {regions.map(([region, items]) => (
              <div className="castle-region" key={region}>
                <div className="castle-region-title">{region}</div>
                <div className="castle-node-path">
                  {items.map((world, index) => {
                    const copy = CASTLE_COPY[world.key] || { name: world.character, terrain: 'coast', emblem: world.key.toUpperCase() };
                    const status = castleStatus(world);
                    return (
                      <button
                        type="button"
                        key={world.key}
                        className={`castle-node ${selectedWorld?.key === world.key ? 'selected' : ''} ${status} step-${index % 5}`}
                        onClick={() => chooseCastle(world.key)}
                      >
                        <CastleArt status={status} terrain={copy.terrain} emblem={copy.emblem} />
                        <span className="castle-node-name">{copy.name}</span>
                        <span className="castle-node-sound">{world.phoneme}</span>
                        <span className="castle-node-badge">{nodeStatusLabel(status, world)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {detailOpen && selectedWorld && (
        <section className="castle-detail" aria-label={`${selectedCopy.name} detail`}>
          <button className="castle-detail-back" type="button" onClick={() => setDetailOpen(false)}>‹ Map</button>
          <div className={`castle-detail-card castle-terrain-${selectedCopy.terrain || 'coast'}`}>
            <CastleArt status={selectedStatus} terrain={selectedCopy.terrain} emblem={selectedCopy.emblem} size="large" />
            <div className="castle-detail-copy">
              <span>{selectedCopy.region}</span>
              <h2>{selectedCopy.name}</h2>
              <p>Clear rooms, power the gate, and claim the castle flag.</p>
            </div>
          </div>
          <div className="castle-detail-rooms">
            {[0, 1, 2].map((room) => (
              <button
                type="button"
                key={ROOM_LABELS[room]}
                className={room < selectedWorld.doneCount ? 'clear' : room === selectedWorld.doneCount ? 'next' : ''}
                onClick={startRoom}
              >
                <span className={`room-icon ${ROOM_ICONS[room]}`} />
                <strong>{ROOM_LABELS[room]}</strong>
                <small>{room < selectedWorld.doneCount ? 'Cleared' : room === selectedWorld.doneCount ? 'Next room' : 'Waiting'}</small>
              </button>
            ))}
          </div>
          <button className="castle-primary detail-primary" type="button" onClick={startRoom}>Start Next Room</button>
        </section>
      )}

      <nav className="castle-bottom-nav" aria-label="Main">
        <button className="active" type="button">🏰<span>Map</span></button>
        <button type="button" onClick={() => getApi()?.openFreePlay?.()}>🎮<span>Quest</span></button>
        <button type="button" onClick={() => getApi()?.openDex?.()}>📖<span>Collection</span></button>
        <button type="button" onClick={() => getApi()?.openShop?.()}>✨<span>Outfit</span></button>
      </nav>
    </section>
  );
}
