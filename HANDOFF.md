# Yoon's Phonics Quest — 개발 핸드오프 문서

> 작성 목적: 본 프로토타입을 **Claude Code**로 이어받아 개발하기 위한 인수인계 문서
> 현재 산출물: `index.html` (단일 파일, 데이터-구동 웹앱 프로토타입)
> 최종 업데이트: 2026-06-30 (게임명 변경·`content/book01.json` 런타임 연결 반영)

---

## 1. 프로젝트 개요 / 비전

윤선생 파닉스 교재(**Yoon's Phonics World – New Edition, NYPW**)를 기반으로 한 **게임형 학습 웹앱**.

- **핵심 컨셉**: "저녁에 아이가 심심해서 자발적으로 켜는 파닉스 게임". 1% 연산처럼 **학습 활동 자체가 게임**이고, 그 위에 포인트·꾸미기·보물상자·출석으로 **매일 돌아올 이유**를 얹는다.
- **타깃**: 미취학~초1 (파닉스 입문). 글자를 못 읽는 아이도 가능 → **듣고 찾기(listen-led)** 적극 활용.
- **학부모 포지셔닝**: 무거운 학습 느낌 없이 "영어 소리 노출 게임"으로 인지될 정도의 음성. 의미 없는 상시 반복 음성은 배제.
- **장기 목표**: 교육 AI 플랫폼. 캐릭터 IP·시리즈(전 18권) 확장.

### 설계 원칙
1. **진도 비연동** — 자유롭게 플레이하며 자연 습득.
2. **데이터-구동** — 엔진과 콘텐츠(음가/단어/캐릭터) 분리.
3. **가벼운 스테이크** — 벌점 대신 콤보 끊김·시간 감소 등 부드러운 긴장감.
4. **재미 우선** — 효과음·콤보·폭죽·보물 등 주스(juice)로 몰입.

---

## 2. 현재 상태 (구현 완료)

단일 HTML(`index.html`)로 동작. 브라우저에서 바로 실행.

- 홈 허브, **미니게임 10종**, 결과/보상, 보물상자, 꾸미기(샵), 도감
- **월드(음가)별 데일리 미션** — 매일 S·T·B·H·M 각각 다른 랜덤 3종 + 월드별 진행도·보물상자
- **자유 놀기**: 오늘 플레이한 게임 카드에 초록 ✅ 완료 표시(`playedToday`, 매일 리셋)
- 진주 경제, 출석 연속, **게임별 최고기록(신기록 팡파레)**
- **통일된 시간 긴장감 엔진**(정답=잠깐 멈춤, 콤보=+시간, 실수=급감)
- **단어 발음 = 윤선생 실제 mp3**(없으면 TTS 대체), **순차 재생(겹침 방지)**, **음소거 토글**
- **사운드/이펙트 시스템(P1)**: 콤보 상승 정답음·게임별 시그니처음·팡파레·오답 웜프·UI 클릭음·파티클·**모바일 햅틱**
- **보물상자: 듀오링고식 탭-빌드업**(여러 번 탭 → 흔들림·글로우·진동 누적 후 열림)
- **Duolingo 스타일 디자인**(흰 배경·컬러 3D 푸시버튼·2px 보더, Nunito)
- **UI 영어화** + 게임 중 지시문 한국어
- localStorage 영속(전 진행 데이터)

콘텐츠는 **Step 1 / 1권 5개 월드(S·T·B·H·M)** 활성, 홈 월드 칩으로 전환. 현재 `content/book01.json`을 런타임에 읽어 `WORLDS`를 생성하며, 파일 직접 실행 등 fetch가 실패하는 환경에서는 내장 폴백 월드로 동작한다.

---

## 3. 파일 구조

```
phonics-game/
├─ index.html              ← 게임 본체 (단일 파일)
├─ HANDOFF.md              ← (본 문서)
├─ CHANGE_REQUEST.md       ← 기획 변경 요청(Cowork→Code 전달 채널)
└─ Phonics World-New Edition (NYPW)/  ← 교재 PDF 18권 세트 + Scope&Sequence(53118)
```

---

## 4. 아키텍처 (데이터-구동)

### 4.1 `WORLDS` — 음가별 콘텐츠
```js
WORLDS.s = { phoneme:"/s/", letter:"S s", character:"Sammy the Seal", kr:"새미 물개",
  emoji:"🦭", locked:false, words:[{w,emo}...6], distractors:[{w,emo}...8] }
// t,b,h,m 동일 구조 활성
let CUR="s"; const POOL=()=>WORLDS[CUR];   // SAVE.curWorld로 복원, selectWorld()로 변경
```

`loadContentDb()`가 `content/book01.json`을 로드해 1권의 10개 단어/음가 그룹을 앱 월드 구조로 변환한다. `WORLD_META`는 캐릭터/음가 표시 정보를, `WORD_EMOJI`는 현재 1권 단어의 임시 이모지 에셋을 담당한다.

### 4.2 `GAMES` — 미니게임 레지스트리(10종)
`{key, name(영문), emoji, desc(한글), run:()=>start<Game>()}` — 배열에 1줄 추가 시 미션·자유놀기 자동 노출.

### 4.3 `ITEMS` — 아바타 꾸미기 `{id,e,slot,price}`

### 4.4 `SAVE` — 영속 상태 (localStorage 키 `"soripang"`)
```js
{ pearls, streak, lastStamp, owned[], equipped{}, words[], chars[],
  missionDate,                 // 일일 리셋 트리거
  missions:{ s:[3keys], t:[...], ... },     // ★ 월드별 데일리 미션
  missionDone:{ s:[done...], ... },         // ★ 월드별 완료
  chestDone:{ s:true, ... },                // ★ 월드별 보물상자 오픈 여부
  playedToday:[gameKeys],      // 자유놀기 완료표시(매일 리셋)
  xp, best:{게임별 최고점}, curWorld, muted }
```
> ⚠️ 구조 변경됨(과거 전역 `mission/missionDone/chestOpenedToday` → 월드별 객체). `ensureMission()`이 구버전 저장 데이터를 자동 마이그레이션.

### 4.5 오디오 시스템
```js
WORD_AUDIO_BASE="https://app.yoons.com/smartbefly/contents/word/"; // <소문자>.mp3
say(word)      // mp3 재생(단일 채널, 이전 정지) → 실패 시 ttsSay()
sayHit(word)   // say + 300ms 디바운스(1탭=1단어). hit()에서 호출
sayThen(word,cb) // 발음 끝까지 재생 후 cb (정답음→다음문제 순차, 겹침 방지)
tone/slide/noise/jingle/correctSfx/fanfare/winJingle/uiClick // WebAudio 합성
vibe(pattern)  // navigator.vibrate (음소거 시 정지)
```

---

## 5. 미니게임 10종

| 게임(영문/key) | 메커닉 | 스테이크 |
|---|---|---|
| Bubble Pop `bubble` | 떠오르는 /s/ 버블 탭 (모드 교차: 변별↔듣고찾기) | 놓친 /s/ 가라앉음 |
| Quick Quiz `quiz` | 단어 듣고 그림 3택 | 문항 카운트다운·오답 시간↓ |
| Whack-a-Word `mole` | 튀어나온 /s/ 두드리기 | 놓침/오답/💣폭탄 시간↓ |
| Sound Run `runner` | 3레인 러너, 레인이동→/s/코인 | 충돌·놓침 시간↓ |
| Sound Shooter `shooter` | 하강 단어 격추(레이저) | ❤️3, /s/ 착륙 시 하트↓ |
| Lava Jump `jump` | **소리만 듣고** 같은 단어 발판 밟기(글자 노출 X) | 용암 차오름·오답 시 ↑ |
| Memory Match `memory` | 그림↔단어 짝 맞추기(뒤집을 때 발음) | 라운드 3→4→5쌍, 시간↓ |
| Word Hunt `hunt` | 망원경으로 들려준 단어 탐색 | 오답 시간↓ |
| Bug Spray `spray` | 불규칙 비행 모기 AoE 스프레이 | 오답 분사 시간↓ |
| Word Catch `catch` | 바구니 좌우 드래그로 /s/ 받기 | 오답·놓침 시간↓ |

**공통 보상(`hit()`)**: 진주 `1 + floor(combo/5) + bonus`, 5콤보마다 폭죽+배너+**+2초**, 정답 시 단어 발음 1회(opts.silent로 생략 가능).

> **Lava Jump 특이사항**: 문제는 소리만(글자 미노출), 선택 시 **정답/오답 효과음만**(단어 재발음 없음), 0.5초 텀 후 다음 문제 소리 → 듣기 변별이 핵심.

---

## 6. 시간 긴장감 엔진

`startTimer(sec, barId)` + 헬퍼(모두 `G.maxTime` 가드):
- `timeFreeze(ms)` 정답 시 0.55s 멈춤 · `timeAdd(sec)` 5콤보 +2초 · `timePenalty(sec)` 오답 -3/놓침 -1.5/폭탄 추가 (+빨강 플래시)
- bubble/mole/runner/shooter/hunt/spray/catch=startTimer · quiz=문항별 · jump=용암 · memory=라운드별 자체 타이머

---

## 7. 사운드 & 이펙트 (P1 구현 완료)

- **단어 발음**: 윤선생 mp3 우선, 없으면 TTS. **단일 채널·순차 재생**으로 겹침/잔향 제거(`sayThen`).
- **정답음**: 콤보에 따라 **음높이 상승** + **게임별 시그니처음**(두더지=텅, 스프레이=치익, 러너=코인, 메모리=차임, 헌트=딩, 점프=보잉, 슈팅=레이저, 캐치=퐁, 버블=블룹).
- **이벤트**: 신기록=팡파레, 완료=윈 징글, 보물=샤르륵.
- **오답**: 부드러운 2음 하강 웜프(벌점 톤 아님).
- **UI**: 버튼/아이콘 탭 클릭음.
- **이펙트**: 정답 시 **컬러 파티클 버스트** + 점수 팝, 콤보 폭죽, 배너, screenShake.
- **햅틱**: 정답/오답/신기록/보물상자에 진동. **음소거 토글(🔊/🔇)**이 mp3·TTS·효과음·진동 모두 제어.
- **보물상자**: 한 번에 안 열리고 **탭 누적(4회)** → 흔들림·금색 글로우·상승음·진동으로 긴장감 빌드업 후 오픈.

미구현(P2 후보): 남은 시간 위기 틱+타이머 펄스, 화면전환 휘릭, 단어 재생 시 효과음 덕킹, 피치 랜덤화.

---

## 8. 교재 소스 데이터 (53118 — Step 1)

| 음가 | 캐릭터 | 단어(10개) | 대표 Chant |
|---|---|---|---|
| /s/ | Sammy the Seal | sad,sand,salt,same,seal,sink,six,soap,sock,sun | Sammy the Seal swims in the sea. |
| /t/ | Timmy the Tiger | table,tail,talk,tape,ten,tent,tie,tiger,toe,toy | Timmy the Tiger sets the timer. |
| /b/ | Bobby the Bear | bag,ball,bat,bear,bed,bell,big,book,box,boy | Bobby the Bear is bored. |
| /h/ | Henry the Hog | hair,hand,happy,hat,head,hen,hill,hop,horse,house | Henry the Hog sees a horse. |
| /m/ | Mindy the Mouse | man,many,map,mat,milk,money,monkey,moon,mop,mouse | Mindy the Mouse makes muffins! |

> 단어 mp3는 `WORD_AUDIO_BASE`에 대부분 존재(소문자 파일명). 캐릭터 음성/챈트 문장 오디오 경로는 추후 확인.

---

## 9. 확장 방법
- **새 월드**: `WORLDS.<key>`에 데이터+`locked:false` → 홈 칩 자동 노출, 단어 mp3 자동 연결.
- **새 게임**: `start<Game>()`(startGameState→startTimer→hit/miss/escaped→finishGame) + `<section id="g_<key>">`+`<key>_score`/`<key>_combo` + `GAMES`에 1줄.

---

## 10. TODO (Claude Code 작업 대상)
- [x] 단어 mp3 연결 + TTS 폴백 / [x] 월드별 데일리 미션 / [x] 자유놀기 완료표시 / [x] P1 사운드·이펙트·햅틱 / [x] 보물상자 탭 빌드업 / [x] Duolingo 디자인 / [x] UI 영어화 / [x] 단어 폰트 확대 / [x] 도감 세로 스크롤
- [ ] 단어/캐릭터 **AI 이미지**로 이모지 교체, 캐릭터 모션
- [ ] 캐릭터 음성·챈트 오디오 연결(경로 확인)
- [ ] **React/Vite 모듈화** (데이터/엔진 분리)
- [ ] **Firebase** 로그인·저장·기록
- [ ] P2 사운드(시간 위기 틱·덕킹), 접근성/모바일 반응형, 밸런싱 상수화
- [ ] STT(따라 말하기) 재도입 검토
- [ ] 메타: 아바타 확대, 소셜(뽐내기/좋아요), 보상 경제 밸런싱

---

## 11. 실행 / 테스트
- `index.html` 더블클릭(Chrome 권장). 단어 mp3·Nunito는 인터넷 연결 시 로드(미연결 시 폴백).
- 초기화: 콘솔 `localStorage.removeItem('soripang')` 후 새로고침.
- ⚠️ Cowork 샌드박스 마운트가 동일 파일 덮어쓰기를 캐싱하는 이슈 → 개발 중 Read 기반 구간 검증 + 신규 함수 격리 node 검증 병행. Claude Code(실제 환경)는 브라우저로 바로 확인 권장.

---

## 12. 다음 단계 권장 순서
1. React+Vite 모듈화(데이터/엔진 분리) → 2. 에셋 파이프라인(AI 이미지·캐릭터 음성) → 3. Firebase 백엔드 → 4. 밸런싱·접근성·모바일 → 내부 시연/파일럿

---

## 부록. Cowork ↔ Claude Code 워크플로우
같은 로컬 폴더 공유. 기획·검토는 Cowork → `CHANGE_REQUEST.md`/`HANDOFF.md`로 전달 → Claude Code가 구현·`git push`·`firebase deploy` 실행.
