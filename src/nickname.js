// 영어 닉네임 추천 생성기 — 타이핑 어려운 아이용. 밝은 형용사 + 친근한 동물.
const ADJ = ['Sunny','Brave','Happy','Jolly','Sparkly','Mighty','Speedy','Clever','Bubbly','Cozy','Lucky','Merry','Cheery','Zippy','Fuzzy','Giggly','Breezy','Snowy','Starry','Witty'];
const ANIMAL = ['Seal','Tiger','Bear','Koala','Fox','Lion','Otter','Panda','Bunny','Whale','Puppy','Kitten','Penguin','Dolphin','Hedgehog','Squirrel','Duck','Owl','Frog','Robot'];

function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

export function suggestNickname(withNumber){
  const base = pick(ADJ) + pick(ANIMAL);
  return withNumber ? base + (Math.floor(Math.random()*89)+10) : base;
}

// 입력 정리: 영문/숫자만, 3~14자
export function cleanNickname(s){
  return String(s||'').replace(/[^A-Za-z0-9]/g,'').slice(0,14);
}
export function isValidNickname(s){
  const c = cleanNickname(s);
  return c.length >= 3 && c.length <= 14;
}
