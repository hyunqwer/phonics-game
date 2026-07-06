import { useEffect, useMemo, useState } from 'react';
import { villageTheme } from '../copy.js';
import './CollectionHome.css';

function getApi() {
  return window.__YPQ;
}

function readState() {
  return getApi()?.getCollectionState?.() || null;
}

function pct(done, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

function labelFromCharacter(name, fallback) {
  if (!name) return fallback;
  return name.split(' the ').pop() || name;
}

// 마을 이름/아이콘은 copy.js 한 곳에서만 정의 → 지도(AdventureMap)와 도감이 동일한 세계관 사용
function realmCopy(bookNumber) {
  const t = villageTheme(bookNumber);
  return { name: t.en, icon: t.emoji, ko: t.ko, color: t.color };
}

export default function CollectionHome() {
  const [visible, setVisible] = useState(false);
  const [collection, setCollection] = useState(null);
  const [badges, setBadges] = useState([]);
  const [tab, setTab] = useState('castles');
  const [selectedBook, setSelectedBook] = useState(1);

  useEffect(() => {
    const sync = () => {
      const next = readState();
      if (next) {
        setCollection(next);
        setSelectedBook((current) => next.books.some((book) => book.book === current) ? current : next.currentBook);
      }
      const bs = getApi()?.getBadges?.();
      if (bs) setBadges(bs);
    };
    const onNavigate = (event) => {
      const nextVisible = (event.detail?.screen || 'home') === 'dex';
      setVisible(nextVisible);
      if (nextVisible) sync();
    };
    window.addEventListener('ypq:state', sync);
    window.addEventListener('ypq:navigate', onNavigate);
    setVisible(document.querySelector('#dex')?.classList.contains('active') || false);
    sync();
    return () => {
      window.removeEventListener('ypq:state', sync);
      window.removeEventListener('ypq:navigate', onNavigate);
    };
  }, []);

  const books = collection?.books || [];
  const sounds = collection?.sounds || [];
  const words = collection?.words || [];
  const book = books.find((item) => item.book === selectedBook) || books[0];
  const bookSounds = useMemo(() => sounds.filter((sound) => sound.book === book?.book), [sounds, book]);
  const bookWords = useMemo(() => words.filter((word) => word.book === book?.book), [words, book]);
  const claimedBooks = books.filter((item) => item.claimed >= item.totalGates && item.totalGates > 0).length;
  const currentRealm = realmCopy(book?.book);

  const chooseBook = (bookNumber, nextTab = tab) => {
    setSelectedBook(bookNumber);
    setTab(nextTab);
  };

  if (!visible) return null;

  return (
    <section className="collection-home" aria-label="Treasure vault">
      <div className="collection-appbar">
        <button className="collection-back" type="button" onClick={() => getApi()?.go?.('home')}>◀ 홈</button>
        <div className="collection-title">Treasure Vault</div>
        <div className="collection-count">{collection?.foundWords || 0}/{collection?.totalWords || 0}</div>
      </div>

      <div className="collection-summary">
        <div>
          <strong>{claimedBooks}/{collection?.totalBooks || 0}</strong>
          <span>Flags</span>
        </div>
        <div>
          <strong>{sounds.filter((sound) => sound.owned).length}/{collection?.totalSounds || 0}</strong>
          <span>Allies</span>
        </div>
        <div>
          <strong>{collection?.foundWords || 0}/{collection?.totalWords || 0}</strong>
          <span>Loot</span>
        </div>
      </div>

      <div className="collection-tabs" role="tablist" aria-label="Treasure vault tabs">
        <button className={tab === 'castles' ? 'active' : ''} type="button" onClick={() => setTab('castles')}>🗺️<span>Map</span></button>
        <button className={tab === 'friends' ? 'active' : ''} type="button" onClick={() => setTab('friends')}>🛡️<span>Guard</span></button>
        <button className={tab === 'cards' ? 'active' : ''} type="button" onClick={() => setTab('cards')}>💎<span>Loot</span></button>
        <button className={tab === 'badges' ? 'active' : ''} type="button" onClick={() => setTab('badges')}>🏅<span>Badges</span></button>
      </div>

      {tab !== 'castles' && (
        <div className="book-strip" aria-label="Realm filter">
          {books.map((item) => (
            <button
              className={item.book === book?.book ? 'active' : ''}
              type="button"
              key={item.book}
              onClick={() => chooseBook(item.book)}
            >
              {realmCopy(item.book).icon}
            </button>
          ))}
        </div>
      )}

      <main className="collection-content">
        {tab === 'castles' && (
          <div className="castle-collection-grid">
            {books.map((item) => {
              const progress = pct(item.claimed, item.totalGates);
              const realm = realmCopy(item.book);
              return (
                <button className={`collection-castle ${item.active ? '' : 'future'}`} type="button" key={item.book} onClick={() => chooseBook(item.book, 'friends')}>
                  <div className="realm-art"><span>{realm.icon}</span><i>{item.book}</i></div>
                  <div className="castle-book-no">Realm {item.book}</div>
                  <strong>{realm.name}</strong>
                  <span>{item.totalGates} gates · {item.totalWords} treasures</span>
                  <div className="collection-meter"><i style={{ width: `${progress}%` }} /></div>
                  <small>{item.active ? `${item.claimed}/${item.totalGates} flags raised` : 'Mist locked'}</small>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'friends' && book && (
          <section className="collection-panel">
            <div className="collection-panel-head">
              <strong>{currentRealm.icon} {currentRealm.name}</strong>
              <span>{book.claimed}/{book.totalGates} flags</span>
            </div>
            <div className="friend-grid">
              {bookSounds.map((sound) => {
                const status = sound.claimed ? 'claimed' : sound.owned ? 'found' : sound.active ? 'new' : 'locked';
                return (
                  <article className={`friend-card ${status}`} key={`${sound.book}-${sound.key}`}>
                    <div className="friend-emoji">{status === 'locked' ? '❓' : sound.emoji}</div>
                    <div>
                      <strong>{status === 'locked' ? 'Mystery Friend' : labelFromCharacter(sound.character, sound.key)}</strong>
                      <span>{sound.phoneme} · {sound.wordCount} treasures</span>
                    </div>
                    <small>{sound.claimed ? 'Flag up' : sound.owned ? `${sound.doneCount}/3 rooms` : sound.active ? 'Hidden' : 'Mist'}</small>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'cards' && book && (
          <section className="collection-panel">
            <div className="collection-panel-head">
              <strong>{currentRealm.icon} Loot Chest</strong>
              <span>{book.foundWords}/{book.totalWords} treasures</span>
            </div>
            <div className="word-card-grid">
              {bookWords.map((word, index) => (
                <button
                  className={`word-collection-card ${word.got ? 'got' : 'locked'}`}
                  type="button"
                  key={`${word.book}-${word.key}-${word.w}-${index}`}
                  onClick={() => word.got && getApi()?.sayWord?.(word.w)}
                >
                  <span>{word.got ? word.emoji : '❓'}</span>
                  <strong>{word.got ? word.w : '???'}</strong>
                  <small>{word.key}</small>
                </button>
              ))}
            </div>
          </section>
        )}
        {tab === 'badges' && (
          <section className="collection-panel">
            <div className="collection-panel-head">
              <strong>🏅 Badges</strong>
              <span>{badges.filter((b) => b.earned).length}/{badges.length}</span>
            </div>
            <div className="badge-grid">
              {badges.map((b) => (
                <div className={`badge-card ${b.earned ? 'earned' : 'locked'}`} key={b.id}>
                  <div className="badge-emoji">{b.earned ? b.emoji : '🔒'}</div>
                  <strong>{b.name}</strong>
                  <small>{b.cond}</small>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </section>
  );
}
