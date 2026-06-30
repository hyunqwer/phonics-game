/* =====================================================================
   COPY / LANGUAGE RESOURCES
   영어 학습앱: 이름·게임·버튼은 영어, 작은 한글 글로스/방법 안내는 한글.
   교재 구조(권/Step)는 노출하지 않고 "마을(Village)" 테마명만 사용.
   ===================================================================== */

export const VILLAGE_THEME = {
  1: { en: 'Sea Town',   ko: '바다 마을',   emoji: '🏖️', color: '#1cb0f6' },
  2: { en: 'Forest',     ko: '숲 마을',     emoji: '🌲', color: '#58cc02' },
  3: { en: 'Night Sky',  ko: '밤하늘 마을', emoji: '🌙', color: '#7a5bd6' },
  4: { en: 'Star Field', ko: '별숲 마을',   emoji: '⭐', color: '#ffb01f' },
  5: { en: 'Apple Hill', ko: '사과 언덕',   emoji: '🍎', color: '#ff7a59' },
  6: { en: 'Lava Land',  ko: '용암 마을',   emoji: '🌋', color: '#e8632e' },
  7:  { en: 'Desert Dunes',  ko: '사막 마을',   emoji: '🏜️', color: '#e0a23b' },
  8:  { en: 'Snow Peak',     ko: '눈꽃 마을',   emoji: '⛄', color: '#5bc0eb' },
  9:  { en: 'Candy Town',    ko: '사탕 마을',   emoji: '🍭', color: '#ff6fb5' },
  10: { en: 'Coral Reef',    ko: '산호 바다',   emoji: '🐠', color: '#1fb6a6' },
  11: { en: 'Cloud Top',     ko: '구름 마을',   emoji: '☁️', color: '#8aa8ff' },
  12: { en: 'Jungle',        ko: '정글 마을',   emoji: '🌴', color: '#2aa84a' },
  13: { en: 'Crystal Cave',  ko: '수정 동굴',   emoji: '💎', color: '#7c5cff' },
  14: { en: 'Rainbow Hill',  ko: '무지개 언덕', emoji: '🌈', color: '#f06aa0' },
  15: { en: 'Dragon Castle', ko: '드래곤 성',   emoji: '🐲', color: '#9b4dff' },
  16: { en: 'Moon Base',     ko: '달 마을',     emoji: '🌕', color: '#9aa7bd' },
  17: { en: 'Treasure Isle', ko: '보물섬',      emoji: '💰', color: '#d9a521' },
  18: { en: 'Crown Peak',    ko: '왕관 봉우리', emoji: '👑', color: '#ffce3a' }
};

export function villageTheme(book) {
  return VILLAGE_THEME[book] || { en: `Land ${book}`, ko: `${book}번 마을`, emoji: '🏰', color: '#1cb0f6' };
}

export const GAME_COPY = {
  bubble:  { en: 'Bubble Pop',   ko: '거품 팡',   how: '떠오르는 친구를 팡!' },
  quiz:    { en: 'Quick Quiz',   ko: '번개 퀴즈', how: '잘 듣고 빠르게 콕!' },
  mole:    { en: 'Whack-a-Word', ko: '두더지 팡', how: '튀어나온 친구 콩!' },
  runner:  { en: 'Sound Run',    ko: '소리 달리기', how: '레인 바꿔 코인 줍기!' },
  shooter: { en: 'Sound Shooter',ko: '소리 슈팅', how: '우주선을 콕 쏴!' },
  jump:    { en: 'Lava Jump',    ko: '용암 점프', how: '안전한 발판으로!' },
  memory:  { en: 'Memory Match', ko: '짝 맞추기', how: '같은 짝을 찾아!' },
  hunt:    { en: 'Word Hunt',    ko: '단어 찾기', how: '숨은 친구를 찾아!' },
  spray:   { en: 'Bug Spray',    ko: '모기 잡기', how: '모기만 칙칙!' },
  catch:   { en: 'Word Catch',   ko: '바구니 받기', how: '바구니로 받아!' }
};

export function gameCopy(key) {
  return GAME_COPY[key] || { en: key, ko: '', how: '' };
}

export const NAV = [
  { key: 'map',      en: 'Map',      icon: '🗺️' },
  { key: 'play',     en: 'Play',     icon: '🎮' },
  { key: 'treasure', en: 'Treasure', icon: '🎁' },
  { key: 'style',    en: 'Style',    icon: '👕' }
];
