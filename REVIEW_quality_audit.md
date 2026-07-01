# Yoon's Phonics Quest — 품질 종합 검토 & 200점 개선 제안

> 검토 관점: 앱 디자인 · 게임 기획 · 서비스 기획
> 검토 일자: 2026-06-30 / 대상 브랜치: `feature/data-vite-refactor`
> 검토 범위: 실제 소스(`src/`, `public/content/`) 전수 — App.jsx, legacyGame.js(749줄), styles.css(337줄), React 홈 3종, copy.js, index.html

---

## 0. 핵심 요약 (TL;DR)

지금은 **"잘 만든 프로토타입(약 120/200점)"** 입니다. 게임 10종이 실제로 돌고, 사운드·콤보·보물상자 같은 주스(juice)와 데일리 루프가 살아 있어 "재미"의 뼈대는 섰습니다. 하지만 **200점(=상품화 가능한 학습 서비스)** 으로 가려면 세 가지 구조적 빚을 갚아야 합니다.

1. **렌더링·디자인 시스템이 3중으로 쪼개져 충돌** — 홈(React)과 게임(legacy DOM)이 *서로 다른 폰트·색·세계관 이름*을 씁니다. 화면을 넘나들 때 "다른 앱"처럼 보입니다.
2. **학습 데이터가 0** — 무엇을 배웠는지 측정·저장·리포트하는 레이어가 전혀 없습니다. 데이터 기반 의사결정과 학부모 리포트를 핵심 가치로 두는 회사의 상품으로서는 가장 큰 공백입니다.
3. **비독자(미취학) 온보딩 부재** — 글자를 못 읽는 아이가 타깃인데, 홈/네비게이션은 영어 텍스트 위주이고 음성 안내가 없습니다. 타깃 정의와 첫 화면이 모순됩니다.

아래는 **중요도(P0 → P2) 순**으로 정리한 제안과, 바로 적용 가능한 코드, 의사결정 비교표, 실행 로드맵입니다.

---

## 1. 현재 구조 개념도 (As-Is)

```
index.html (Nunito 폰트 로드)
   └─ main.jsx → App.jsx
        ├─ [A] dangerouslySetInnerHTML: appHtml  ← 레거시 DOM 전체
        │     ├─ #home  ……………………… styles.css에서 display:none!important (죽은 마크업)
        │     ├─ #g_bubble … #g_catch (게임 10종)  ← legacyGame.js가 직접 DOM 조작
        │     ├─ #result / #chest / #shop / #freeplay
        │     └─ #dex (레거시 도감)  ← renderDex()로 채워지지만 React가 위에서 덮음(낭비)
        │
        ├─ [B] <AdventureMapHome/>   ← 홈(지도뷰), z-index 20
        ├─ [B] <TodayMissionHome/>   ← 홈(미션뷰), z-index 20
        └─ [B] <CollectionHome/>     ← 도감(Treasure Vault), z-index 26  ※[A]의 #dex와 중복
                  ↕  window.__YPQ (전역객체) + CustomEvent('ypq:state'/'ypq:navigate')
        legacyGame.js  ← 단일 파일에 데이터·오디오·엔진·게임10종·보상 전부
```

문제의 본질: **React(선언형)와 vanilla DOM(명령형)이 전역 객체와 커스텀 이벤트로 느슨하게 접착**되어 있습니다. 단일 진실 공급원(single source of truth)이 없어, 상태가 `SAVE`(localStorage)·`G`(전역 게임상태)·React `useState` 세 곳에 흩어집니다.

### 실측으로 확인된 구체적 불일치
| 항목 | 홈/도감(React) | 게임(legacy override) | 근거 |
|---|---|---|---|
| 폰트 | `Trebuchet MS` | `Nunito` | AdventureMapHome.css:4 vs styles.css:298 |
| 배경 | 바다 블루 그라데이션 | 흰색(`#fff !important`) | *.css vs styles.css:298,336 |
| 텍스트 색 | `#1c3a52`,`#5a7e92`(하드코딩) | `--duo-ink #3c3c3c` | 토큰 미공유 |
| 세계관 이름(1권) | **Sea Town / 바다 마을** | — | copy.js:8 |
| 같은 1권(도감) | **Sunny Coast Keep** | — | CollectionHome.jsx:23 |

> 같은 1권이 지도에선 "바다 마을", 도감에선 "Sunny Coast Keep"로 불립니다. 아이·학부모에게 **두 개의 세계관**처럼 보입니다.

---

## 2. 중요도순 개선 제안

### 🔴 P0 — 상품화 전 반드시 (신뢰성·정체성·핵심가치)

**P0-1. 학습 데이터 레이어 신설 (서비스 기획 · 최우선)**
지금 "단어 학습"은 *게임 중 한 번 터치 = 수집*(legacyGame.js:364-368)으로 처리됩니다. 이건 학습이 아니라 노출입니다. 회사의 핵심(평가·학부모 리포트·데이터 의사결정)을 위해 **이벤트 로그 + 음소/단어별 숙달도(mastery) 모델**이 필요합니다.
- 모든 정답/오답을 `{uid, ts, game, phoneme, word, correct, latencyMs, mode}`로 기록.
- 단어별 숙달도(정답률·반응속도·최근성)를 계산 → 약한 단어를 미션·복습에 우선 투입(간격 반복).
- → P0-4(Firebase)와 합쳐 학부모 리포트/교사 대시보드의 원천 데이터가 됨.

**P0-2. 디자인 토큰 단일화 + 세계관 이름 통일 (앱디자인)**
색·폰트·라운드·그림자를 **CSS 변수 한 곳**으로 모으고, React 홈과 legacy 게임이 같은 토큰을 참조하게 합니다. 화면 전환 시 "같은 앱" 느낌이 핵심. 세계관 이름은 `copy.js` 하나로 단일화(Sea Town 계열 or Keep 계열 택1). (코드는 §4-A)

**P0-3. 비독자 온보딩 + 음성 네비게이션 (UX · 게임기획)**
첫 실행 시 마스코트가 음성으로 안내하는 30초 튜토리얼(탭 한 번 따라하기)과, 홈 메뉴(Map/Play/Treasure/Style)에 **탭 시 한국어 음성 라벨**을 답니다. "글자 못 읽는 아이도 가능"이라는 설계 원칙(HANDOFF §1)을 실제 첫 화면에서 지켜야 합니다.

**P0-4. Firebase Auth + Firestore 영속화 (서비스 기획)**
localStorage 단일 의존은 기기 교체·복수 자녀·교실 공용기기에서 데이터가 사라집니다. 익명 로그인→학부모 계정 연결, `SAVE`/이벤트 로그를 Firestore로. (HANDOFF TODO에 이미 있음 — 우선순위만 끌어올림.)

---

### 🟠 P1 — 품질 도약 (이게 120점→180점)

**P1-1. legacyGame.js(749줄 단일 파일) 모듈 분해 + 테스트**
`data/`(WORLDS·콘텐츠 로더), `engine/`(타이머·hit/miss·보상), `audio/`, `games/<key>.js`로 분리. 미니게임 추가가 1파일 추가로 끝나는 구조를 실제로 완성(현재는 한 파일에 다 있음). 순수 로직(숙달도 계산, 미션 선택)에 vitest 단위 테스트. devDependencies 비어 있음 → CI 기반 마련.

**P1-2. 에셋: 이모지 → 브랜드 일러스트/오디오 파이프라인 (앱디자인 · IP)**
지금 캐릭터·단어·보상이 전부 이모지(기기마다 다르게 렌더, 플레이스홀더 느낌). 장기 IP 사업이 목표라면 **Sammy the Seal 등 캐릭터 정식 일러스트 + 단어 일러스트 세트**가 200점의 절반. 단어→이미지/오디오를 콘텐츠 JSON에 키로 연결하는 파이프라인부터(현재 `WORD_EMOJI` 수기 맵은 18권 확장 불가).

**P1-3. 진짜 파닉스 교수 설계 보강 (게임기획 · 학습효과)**
현재 게임 대부분이 "단어 통째로 듣고 그림 고르기" = 어휘·청취에 가깝습니다. 파닉스 핵심인 **글자-소리 대응·블렌딩(s-u-n→sun)·세그멘팅**을 가르치는 모먼트가 거의 없습니다(순수 음 변별은 Lava Jump 1종뿐). 음가 도입 화면(이 글자는 /s/ 소리!) + 블렌딩 미니게임 1종 추가를 권장.

**P1-4. 핵심 루프 마찰 제거 (게임기획)**
결과 화면이 항상 "Home ▶"(legacyGame.js:380)이라, 다음 미션을 하려면 홈→미션→게임 3탭이 필요합니다. 결과 화면에 **"다음 미션 ▶" / "한 번 더"** 를 넣어 루프를 짧게. 데일리 미션의 게임 3종도 완전 랜덤(legacyGame.js:236) 대신 **약한 음소·약한 단어를 노린 선택**으로(P0-1 데이터 활용).

**P1-5. 접근성 / 반응형 (앱디자인)**
- 대비: 밝은 블루 위 흰 텍스트+그림자(.logo, .am-gloss `#5a7e92`)는 WCAG AA 미달 소지. 명도 대비 4.5:1 점검.
- 터치 타깃: `.wchip`(7×11px 패딩) 등 일부 44px 미만 → 미취학 손가락 기준 상향.
- 태블릿/가로: `max-width:520px` 고정이라 학원 태블릿에서 가운데 작은 컬럼. classroom 대응 레이아웃 필요.

---

### 🟡 P2 — 200점 마감 (완성도·확장성)

- **P2-1 성능**: hunt/spray가 매 프레임 `getBoundingClientRect`를 루프 호출(legacyGame.js:638,668) → 저가 안드로이드 태블릿서 잰크. 좌표를 상태로 관리해 레이아웃 thrash 제거.
- **P2-2 사운드 P2**: 시간 위기 틱·타이머 펄스·단어 재생 시 효과음 덕킹(HANDOFF §7 미구현분).
- **P2-3 메타 깊이**: 샵 아이템 6개로 빈약(ITEMS). 아바타가 월드 이모지에 종속돼 월드 바꾸면 "내 캐릭터"가 바뀜 → 고정 아바타 + 꾸미기 분리.
- **P2-4 교사 도구**: 반 단위 진도/취약 음소 히트맵, 숙제 배정. (회사 제품군과 직접 연결.)
- **P2-5 죽은 코드 정리**: `#home` 죽은 마크업, 레거시 `renderDex()`(React가 덮음), 네이밍 잔재(localStorage 키 `"soripang"`). AdventureMapHome.jsx:74 `f.collected ? f.emoji : f.emoji`(양쪽 동일 — 미수집 표시 버그).

---

## 3. 의사결정 비교표

**(A) 구조 리팩터링: 전면 재작성 vs 점진적 분해**
| 기준 | 전면 React 재작성 | 점진적 분해(권장) |
|---|---|---|
| 위험 | 높음(동작하는 10게임 재구현) | 낮음(게임 엔진 보존) |
| 기간 | 4–6주 | 1–2주 |
| 즉시 효과 | 늦음 | 토큰·이벤트 레이어부터 바로 |
| 권장 | △ | ✅ data/engine 분리 + 토큰 통일부터 |

**(B) 캐릭터 에셋: 이모지 유지 vs 일러스트 vs AI 생성**
| 기준 | 이모지(현재) | 정식 일러스트 | AI 생성 |
|---|---|---|---|
| 브랜드/IP | ✕ | ◎ | ○ |
| 비용·속도 | 0 / 즉시 | 높음 / 느림 | 중 / 빠름 |
| 일관성 | 기기마다 다름 | 완벽 | 프롬프트 관리 필요 |
| 권장 | MVP만 | 주력 캐릭터 5종 | 단어 일러스트 대량(150+) |

**(C) 학습 모델: 현 "터치=수집" vs 숙달도 기반**
| 기준 | 현재 | 숙달도(권장) |
|---|---|---|
| 학습 측정 | 불가 | 단어/음소별 정답률·속도 |
| 리포트 | 불가 | 학부모/교사 리포트 가능 |
| 복습 | 없음 | 약점 우선 간격반복 |
| 구현 난도 | — | 중(이벤트 로그+집계) |

---

## 4. 바로 적용 가능한 코드 (MVP 지향)

### A. 디자인 토큰 단일화 + 세계관 이름 통일
`src/tokens.css` 신설 후 `main.jsx`에서 최상단 import. 모든 하드코딩 색을 변수로 교체.

```css
/* src/tokens.css — 단일 진실 공급원 */
:root{
  --c-green:#58cc02; --c-greenD:#46a302;
  --c-blue:#1cb0f6;  --c-blueD:#1899d6;
  --c-yellow:#ffc800;--c-red:#ff4b4b;
  --c-ink:#3c3c3c;   --c-sub:#5a6b7a; --c-line:#e5e5e5;
  --c-bg:#ffffff;    --r:16px;
  --font:"Nunito","Baloo 2",system-ui,sans-serif;
}
/* 홈·게임 공통 적용 → 화면 전환 시 동일 룩 */
body,.am-root,.tm-root,.collection-home{font-family:var(--font);}
.am-gloss,.tm-gloss{color:var(--c-sub);}  /* 대비 보강 */
```

```js
// copy.js — 세계관 이름을 '한 곳'에서만 정의(지도=도감 동일)
export const REALM = {
  1:{en:'Sea Town', ko:'바다 마을', emoji:'🏖️'},
  2:{en:'Forest',   ko:'숲 마을',   emoji:'🌲'},
  3:{en:'Night Sky',ko:'밤하늘 마을',emoji:'🌙'},
  // …18권. CollectionHome의 REALMS 배열은 삭제하고 이걸 import.
};
export const realm = b => REALM[b] || {en:`Land ${b}`,ko:`${b}번 마을`,emoji:'🏰'};
```

### B. 학습 이벤트 로깅 + 숙달도 (P0-1) — 엔진에 1줄 연결
```js
// src/engine/telemetry.js
const buf = [];
export function logAnswer(e){            // e: {game,phoneme,word,correct,latencyMs}
  buf.push({...e, ts: Date.now()});
  if (buf.length >= 20) flush();         // 배치로 Firestore 전송
}
export function flush(){
  if (!buf.length) return;
  const batch = buf.splice(0);
  window.__saveEvents?.(batch);          // Firebase 어댑터가 구현(P0-4)
}
// 단어별 숙달도(0~1): 정답률·최근성 가중
export function mastery(word, log){
  const xs = log.filter(r=>r.word===word).slice(-8);
  if(!xs.length) return 0;
  const acc = xs.filter(r=>r.correct).length / xs.length;
  const fast = xs.filter(r=>r.correct && r.latencyMs<2500).length / xs.length;
  return Math.min(1, acc*0.7 + fast*0.3);
}
```
```js
// legacyGame.js hit()/miss()에 연결 (예시)
import { logAnswer } from './engine/telemetry.js';
// hit() 안:
logAnswer({game:G.key, phoneme:POOL().phoneme, word:word.w, correct:true,  latencyMs:Date.now()-(G._qStart||Date.now())});
// miss() 안:
logAnswer({game:G.key, phoneme:POOL().phoneme, word:'', correct:false, latencyMs:0});
```

### C. 약점 우선 데일리 미션 (P1-4) — 랜덤을 데이터로 교체
```js
// 현재: SAVE.missions[k] = shuffle(GAMES.map(g=>g.key)).slice(0,3)  // 완전 랜덤
// 개선: 약한 단어가 많이 나오는 게임/모드를 우선 배치 + 변별 게임 1 보장
function pickDailyMission(worldKey, log){
  const weak = POOL().words.filter(w => mastery(w.w, log) < 0.6);
  const must = weak.length ? ['quiz'] : [];           // 약점 있으면 평가형 포함
  const rest = shuffle(GAMES.map(g=>g.key).filter(k=>!must.includes(k)));
  return [...must, ...rest].slice(0,3);
}
```

### D. 비독자 음성 네비게이션 (P0-3) — 메뉴에 음성 라벨
```jsx
// 홈/도감 nav 버튼에 한국어 음성 안내
const NAV_VOICE = { map:'지도', play:'게임', treasure:'보물', style:'꾸미기' };
function speakKo(t){ const u=new SpeechSynthesisUtterance(t); u.lang='ko-KR'; speechSynthesis.speak(u); }
<button onClick={()=>{ speakKo(NAV_VOICE.play); api()?.openFreePlay?.(); }}>
  🎮<span>Play</span>
</button>
```

---

## 5. 실행 로드맵 (권장 순서)

1. **주 1–2 (P0 기반)**: `tokens.css`로 토큰·폰트·세계관 이름 통일(A) → 즉시 "한 앱" 느낌. 동시에 telemetry 스텁(B) 삽입.
2. **주 3–4 (P0 서비스)**: Firebase 익명 로그인 + Firestore에 SAVE·이벤트 저장(P0-4) → 숙달도 집계 가동.
3. **주 5 (P0 UX)**: 비독자 온보딩 + 음성 네비(C·D).
4. **주 6–8 (P1)**: legacyGame.js 모듈 분해 + vitest, 약점기반 미션, 결과화면 루프 단축, 접근성/태블릿.
5. **병행 트랙**: 캐릭터 5종 일러스트 + 단어 에셋 파이프라인(P1-2) → 9–12주 내 학부모 리포트 v1.

---

## 6. 잘 되어 있는 점 (유지)
시간 긴장감 엔진(freeze/add/penalty)·콤보·신기록 팡파레 등 주스 설계, mp3→TTS 폴백과 오프라인 폴백 월드, 데이터-콘텐츠 분리 방향성, 듀오링고식 보상 루프(출석·미션·보물·꾸미기)는 MVP로서 탄탄합니다. 위 제안은 이 토대를 **상품·플랫폼 등급**으로 끌어올리는 작업입니다.
