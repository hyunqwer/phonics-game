import { useEffect, useMemo, useState } from 'react';
import './CastleMapHome.css';

const BOOK_CASTLES = {
  1: { name: 'Sunny Coast Castle', shortName: 'Sunny Coast', region: 'First Kingdom', terrain: 'coast', emblem: 'S', gates: ['s', 't', 'b', 'h', 'm'], blurb: 'Bright beach gates and friendly first sounds.' },
  2: { name: 'Keywood Forest', shortName: 'Keywood', region: 'Second Kingdom', terrain: 'forest', emblem: 'K', gates: ['k', 'j', 'f', 'g', 'l'], blurb: 'Forest doors, hidden keys, and bouncy sound quests.' },
  3: { name: 'Moon River Castle', shortName: 'Moon River', region: 'Third Kingdom', terrain: 'night', emblem: 'D', gates: ['d', 'n', 'w', 'c', 'r'], blurb: 'Moonlit bridges, river stones, and brave night gates.' },
};

const GATE_COPY = {
  s: { name: 'Seal Gate', terrain: 'coast', emblem: 'S' },
  t: { name: 'Tiger Tower', terrain: 'tower', emblem: 'T' },
  b: { name: 'Bear Keep', terrain: 'keep', emblem: 'B' },
  h: { name: 'Hog Hill', terrain: 'hill', emblem: 'H' },
  m: { name: 'Mouse Moon', terrain: 'moon', emblem: 'M' },
  k: { name: 'Key Gate', terrain: 'forest', emblem: 'K' },
  j: { name: 'Jungle Gate', terrain: 'jungle', emblem: 'J' },
  f: { name: 'Foxfire Gate', terrain: 'fire', emblem: 'F' },
  g: { name: 'Garden Gate', terrain: 'garden', emblem: 'G' },
  l: { name: 'Lion Lookout', terrain: 'lookout', emblem: 'L' },
  d: { name: 'Dog Dungeon', terrain: 'dungeon', emblem: 'D' },
  n: { name: 'Night Nook', terrain: 'night', emblem: 'N' },
  w: { name: 'Wind Wall', terrain: 'wind', emblem: 'W' },
  c: { name: 'Candy Castle', terrain: 'candy', emblem: 'C' },
  r: { name: 'River Rock', terrain: 'river', emblem: 'R' },
};

const ROOM_LABELS = ['Bubble Gate', 'Echo Chamber', 'Guard Hall'];
const ROOM_ICONS = ['bubble', 'echo', 'guard'];

function getApi() {
  return window.__YPQ;
}

function readState() {
  return getApi()?.getCastleHomeState?.() || null;
}

function castleStatus(world) {
  if (!world || world.locked) return 'locked';
  if (world.chestReady) return 'treasure';
  if (world.chestDone) return 'conquered';
  if (world.doneCount > 0) return 'progress';
  return 'new';
}

function statusLabel(status, world) {
  if (status === 'treasure') return 'Treasure ready';
  if (status === 'conquered') return 'Gate claimed';
  if (status === 'progress') return `Gate Power ${world.doneCount}/3`;
  if (status === 'locked') return 'Fog locked';
  return 'New gate';
}

function nodeStatusLabel(status, world) {
  if (status === 'treasure') return 'Treasure';
  if (status === 'conquered') return 'Claimed';
  if (status === 'progress') return `${world.doneCount}/3`;
  if (status === 'locked') return 'Locked';
  return 'New';
}

function guideLine(status, gateName, bookName) {
  if (status === 'treasure') return `${gateName} is glowing. Open the treasure!`;
  if (status === 'conquered') return 'Nice flag. You can replay it anytime.';
  if (status === 'progress') return 'Continue here and push the gate open.';
  return `Start the next quest inside ${bookName}.`;
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
  const [selectedGateKey, setSelectedGateKey] = useState(null);

  useEffect(() => {
    const sync = () => {
      const next = readState();
      if (next) {
        setHomeState(next);
        setSelectedGateKey((current) => {
          if (current && next.worlds.some((w) => w.key === current)) return current;
          return next.recommendedKey || next.curWorld;
        });
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

  const books = homeState?.books || [];
  const currentBookNumber = homeState?.currentBook || homeState?.castleStartBook || books[0]?.book || 1;
  const currentBook = books.find((book) => book.book === currentBookNumber) || books[0];
  const bookCopy = currentBook ? BOOK_CASTLES[currentBook.book] || { name: `Castle ${currentBook.book}`, shortName: `Castle ${currentBook.book}`, terrain: 'coast', emblem: String(currentBook.book), gates: currentBook.gates.map((g) => g.key), blurb: 'Choose a gate and start a quest.' } : null;
  const gates = currentBook?.gates || [];
  const selectedGate = gates.find((gate) => gate.key === selectedGateKey) || gates.find((gate) => gate.key === currentBook?.recommendedKey) || gates[0];
  const gateCopy = selectedGate ? GATE_COPY[selectedGate.key] || { name: selectedGate.character, terrain: bookCopy?.terrain || 'coast', emblem: selectedGate.key.toUpperCase() } : null;
  const gateStatus = castleStatus(selectedGate);
  const firstRun = !homeState?.castleStartBook;

  const totalClaimed = useMemo(() => books.reduce((sum, book) => sum + book.doneGates, 0), [books]);
  const totalGates = useMemo(() => books.reduce((sum, book) => sum + book.totalGates, 0), [books]);

  const chooseFirstCastle = (book) => {
    getApi()?.chooseStartBook?.(book);
    setDetailOpen(false);
  };

  const switchBook = (book) => {
    getApi()?.openBookCastle?.(book);
    const nextBook = books.find((item) => item.book === book);
    setSelectedGateKey(nextBook?.recommendedKey || nextBook?.gates?.[0]?.key || null);
    setDetailOpen(false);
  };

  const chooseGate = (key) => {
    setSelectedGateKey(key);
    getApi()?.openCastleFromMap?.(key);
    setDetailOpen(false);
  };

  const openGate = () => {
    if (!selectedGate) return;
    if (selectedGate.chestReady) {
      getApi()?.openCastleFromMap?.(selectedGate.key);
      getApi()?.go?.('chest');
      return;
    }
    setDetailOpen(true);
  };

  const startRoom = () => {
    if (selectedGate) getApi()?.startCastleQuest?.(selectedGate.key);
  };

  if (!visible) return null;

  return (
    <section className="castle-map-home" aria-label="Castle map home">
      <div className="castle-topbar">
        <div className="castle-pill">🦪 <span>{homeState?.pearls ?? 0}</span></div>
        <div className="castle-brand">Yoon&apos;s Phonics Quest</div>
        <div className="castle-top-actions">
          <button className="castle-icon-btn" type="button" onClick={() => getApi()?.toggleMute?.()} aria-label="Toggle sound">🔊</button>
          <button className="castle-avatar" type="button" onClick={() => getApi()?.openShop?.()} aria-label="Open outfit">{selectedGate?.emoji || '🦭'}</button>
        </div>
      </div>

      {firstRun ? (
        <main className="castle-scroll start-scroll">
          <section className="start-hero">
            <span className="castle-kicker">Choose your first castle</span>
            <h1>Where should your quest begin?</h1>
            <p>Pick any castle. After this, your path will continue one gate at a time.</p>
          </section>
          <section className="start-castles">
            {books.map((book) => {
              const copy = BOOK_CASTLES[book.book] || { name: `Castle ${book.book}`, shortName: `Castle ${book.book}`, terrain: 'coast', emblem: String(book.book), blurb: 'Start here.' };
              return (
                <button className={`start-castle castle-terrain-${copy.terrain}`} type="button" key={book.book} onClick={() => chooseFirstCastle(book.book)}>
                  <CastleArt status="new" terrain={copy.terrain} emblem={copy.emblem} size="large" />
                  <span>{copy.region}</span>
                  <strong>{copy.name}</strong>
                  <small>{book.totalGates} gates · {copy.blurb}</small>
                </button>
              );
            })}
          </section>
        </main>
      ) : (
        <main className="castle-scroll">
          {selectedGate && currentBook && (
            <section className={`castle-hero castle-terrain-${bookCopy.terrain || 'coast'} status-${gateStatus}`}>
              <div className="castle-hero-copy">
                <span className="castle-kicker">Continue Quest</span>
                <h1>{bookCopy.name}</h1>
                <p>{gateCopy.name} · {statusLabel(gateStatus, selectedGate)}</p>
                <span className="castle-sound-chip">{selectedGate.phoneme} sound</span>
                <div className="castle-room-track" aria-label="Gate power progress">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < selectedGate.doneCount ? 'clear' : ''}>{i < selectedGate.doneCount ? '✓' : i + 1}</span>
                  ))}
                  <strong>{selectedGate.chestReady ? '🎁' : selectedGate.chestDone ? '🚩' : '⚡'}</strong>
                </div>
              </div>
              <div className="castle-hero-art">
                <CastleArt status={gateStatus} terrain={gateCopy.terrain} emblem={gateCopy.emblem} size="large" />
              </div>
              <div className="castle-guide">
                <span className="guide-avatar">{selectedGate.emoji}</span>
                <span>{guideLine(gateStatus, gateCopy.name, bookCopy.name)}</span>
              </div>
              <button className="castle-primary" type="button" onClick={openGate}>
                {selectedGate.chestReady ? 'Open Treasure' : selectedGate.chestDone ? 'Replay Gate' : 'Continue Quest'}
              </button>
            </section>
          )}

          <section className="castle-map-panel">
            <div className="castle-section-head">
              <span>{bookCopy?.shortName || 'Adventure Path'}</span>
              <strong>{currentBook?.doneGates || 0}/{currentBook?.totalGates || 0} gates claimed</strong>
            </div>
            <div className="gate-path-card">
              <div className="castle-node-path single-path">
                {gates.map((gate, index) => {
                  const copy = GATE_COPY[gate.key] || { name: gate.character, terrain: bookCopy?.terrain || 'coast', emblem: gate.key.toUpperCase() };
                  const status = castleStatus(gate);
                  return (
                    <button
                      type="button"
                      key={gate.key}
                      className={`castle-node ${selectedGate?.key === gate.key ? 'selected' : ''} ${status} step-${index % 5}`}
                      onClick={() => chooseGate(gate.key)}
                    >
                      <CastleArt status={status} terrain={copy.terrain} emblem={copy.emblem} />
                      <span className="castle-node-name">{copy.name}</span>
                      <span className="castle-node-sound">{gate.phoneme}</span>
                      <span className="castle-node-badge">{nodeStatusLabel(status, gate)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="other-castles">
            <div className="castle-section-head">
              <span>Explore other castles</span>
              <strong>{totalClaimed}/{totalGates} total</strong>
            </div>
            <div className="other-castle-row">
              {books.map((book) => {
                const copy = BOOK_CASTLES[book.book] || { shortName: `Castle ${book.book}`, terrain: 'coast', emblem: String(book.book) };
                return (
                  <button type="button" className={book.book === currentBook?.book ? 'active' : ''} key={book.book} onClick={() => switchBook(book.book)}>
                    <CastleArt status={book.doneGates === book.totalGates ? 'conquered' : book.doneGates > 0 ? 'progress' : 'new'} terrain={copy.terrain} emblem={copy.emblem} />
                    <span>{copy.shortName}</span>
                    <small>{book.doneGates}/{book.totalGates}</small>
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {detailOpen && selectedGate && (
        <section className="castle-detail" aria-label={`${gateCopy.name} detail`}>
          <button className="castle-detail-back" type="button" onClick={() => setDetailOpen(false)}>‹ Path</button>
          <div className={`castle-detail-card castle-terrain-${gateCopy.terrain || 'coast'}`}>
            <CastleArt status={gateStatus} terrain={gateCopy.terrain} emblem={gateCopy.emblem} size="large" />
            <div className="castle-detail-copy">
              <span>{bookCopy.name}</span>
              <h2>{gateCopy.name}</h2>
              <p>Clear rooms, power the gate, and claim the castle flag.</p>
            </div>
          </div>
          <div className="castle-detail-rooms">
            {[0, 1, 2].map((room) => (
              <button
                type="button"
                key={ROOM_LABELS[room]}
                className={room < selectedGate.doneCount ? 'clear' : room === selectedGate.doneCount ? 'next' : ''}
                onClick={startRoom}
              >
                <span className={`room-icon ${ROOM_ICONS[room]}`} />
                <strong>{ROOM_LABELS[room]}</strong>
                <small>{room < selectedGate.doneCount ? 'Cleared' : room === selectedGate.doneCount ? 'Next room' : 'Waiting'}</small>
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
