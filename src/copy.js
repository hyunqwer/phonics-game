/* =====================================================================
   COPY / LANGUAGE RESOURCES
   영어 학습앱: 이름·게임·버튼은 영어, 작은 한글 글로스/방법 안내는 한글.
   교재 구조(권/Step)는 노출하지 않고 "마을(Village)" 테마명만 사용.
   ===================================================================== */

export const VILLAGE_THEME = {
  1: { en: 'Sea Town',   ko: '바다 마을',   emoji: '🏖️' },
  2: { en: 'Forest',     ko: '숲 마을',     emoji: '🌲' },
  3: { en: 'Night Sky',  ko: '밤하늘 마을', emoji: '🌙' },
  4: { en: 'Star Field', ko: '별숲 마을',   emoji: '⭐' },
  5: { en: 'Apple Hill', ko: '사과 언덕',   emoji: '🍎' },
  6: { en: 'Lava Land',  ko: '용암 마을',   emoji: '🌋' }
};

export function villageTheme(book) {
  return VILLAGE_THEME[book] || { en: `Land ${book}`, ko: `${book}번 마을`, emoji: '🏰' };
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
