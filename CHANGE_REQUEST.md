# 변경 요청 (Change Request) — 2026-06-29

> 대상: `index.html` · **Claude Code 구현용**. `HANDOFF.md`와 함께 읽을 것.
> 워크플로우: 기획/검토는 Cowork에서 → 이 문서로 전달 → Claude Code가 구현.
> 원칙: **기능/레이아웃은 유지**하고 아래 항목만 반영.

---

## CR-1. 오디오: "1 터치 = 1 단어 발음" 정책 정정

### 배경 / 문제
반복 음성을 없애려다 **과교정**되어 단어 발음이 전부 묵음 처리되고 효과음(pop)만 남음.
원래 문제는 "한 번의 액션에 발음이 **끊이지 않고 여러 번** 재생"된 것 — 원인은 발음 제거가 아니라 **TTS 큐 적체/겹침**.

### 목표
단어를 터치하면 그 단어 발음이 **딱 한 번** 깔끔하게. 겹침·연속반복 없음. 단어 발음은 학습의 핵심이자 학부모 노출 인지 요소이므로 반드시 유지.

### 수용 기준 (Acceptance Criteria)
1. 모든 게임에서 **정답 탭**(버블/두더지/코인/적/발판/퀴즈 카드) → 해당 단어 발음 **1회** + 효과음 동시 재생.
2. 새 발음 재생 직전 이전 발음을 **즉시 취소**(`speechSynthesis.cancel()`) → 큐 적체·겹침 금지.
3. 단일 액션이 발음을 2회 이상 트리거하지 않음. **동일 단어 300ms 디바운스**.
4. 음가(/s/ /s/ …) **자동 루프 재생 금지**(스팸 원인). 음가/단어 음성은 *듣고찾기·퀴즈 출제·도감 탭* 등 의미 있는 맥락에서만.
5. 헤더에 **음소거 토글(🔊/🔇)** 추가, 상태 `SAVE.muted` 영속. 음소거 시 시각 피드백(콤보·플래시 등)은 유지.

### 구현 힌트
- `hit(word,x,y,opts)` 에서 정답 시 `say(word.w)` **복구**(단 `opts.silent`면 생략). `say()`는 이미 `cancel→speak`라 겹침 방지됨 → 사실상 "hit에서 say 복구 + 디바운스 + mute 게이트"만 추가하면 됨.
- 전역 `let muted=false;` → `say()`/`tone()` 진입부에서 `if(muted)return;`.
- 디바운스: 마지막 발화 단어/시각 저장, 같은 단어가 300ms 내 재요청되면 skip.
- 빠른 연타 게임도 탭 간격이 있어 자연 노출이 되므로, **겹침만 막으면** 스팸 안 됨.

### 향후(별도 단계)
- 라이브 `SpeechSynthesis` → **ElevenLabs 사전 렌더 오디오 클립**(단어별 파일) 단일 `Audio` 채널 재생(새 재생 시 이전 `pause()`)로 품질·지연·겹침 동시 해결.

---

## CR-2. Claymorphism 디자인 시스템 적용

### 목표
말랑한 점토(클레이) 질감의 **통일 디자인 시스템**. 기존 평면 하드 섀도(`0 5px 0 …`)를 클레이 토큰으로 전면 교체. 레이아웃/기능은 유지, 스타일만 교체.

### 디자인 토큰 (`:root`에 추가)
```css
:root{
  /* 파스텔 팔레트 (아동 친화) */
  --clay-bg:#e7eefc; --clay-surface:#f4f7ff;
  --clay-mint:#a8e6cf; --clay-peach:#ffc9a8; --clay-lavender:#c9b8ff;
  --clay-sky:#a8d8ff;  --clay-lemon:#ffe9a8; --clay-pink:#ffb3c6;
  --clay-ink:#4a4a6a;
  --clay-r:26px;          /* 기본 큰 라운드 (작은 요소는 16~18px) */

  /* 클레이 시그니처: 바깥 소프트(어둠+밝음) + 안쪽 하이라이트/음영 */
  --clay-shadow:
     8px 8px 18px rgba(120,130,170,.45),
    -8px -8px 18px rgba(255,255,255,.90),
     inset 3px 3px 6px rgba(255,255,255,.70),
     inset -5px -6px 10px rgba(120,130,170,.35);

  /* 눌림(:active) — 쑥 들어가는 점토 */
  --clay-shadow-press:
     inset 5px 5px 10px rgba(120,130,170,.45),
     inset -4px -4px 8px rgba(255,255,255,.80);
}
```

### 컴포넌트 규칙
- 적용 대상: `.btn .card .pill .iconbtn .mrow .wcard .qcard .bubble .mole .pad .coin .ufo .shopItem .dexItem .stamp .chestIco` 등 모든 표면 요소.
- 공통: `border-radius:var(--clay-r)`(작은 요소 16~18px), `box-shadow:var(--clay-shadow)`, **테두리 없음**, 파스텔 단색 채움(그라데이션은 아주 약하게).
- `:active`/눌림: `box-shadow:var(--clay-shadow-press)` + `transform` 살짝.
- 색 배정 가이드(예): 버블=`--clay-sky`, 두더지 카드=`--clay-peach`, 발판=`--clay-mint`, 보상/별=`--clay-lemon`, 보스/특수=`--clay-lavender`. 게임별로 일관 톤.
- 배경: `--clay-bg`(라이트). 어두운 슈팅 배경 등은 클레이 톤의 진한 파스텔로 조정.
- 이모지/아이콘은 유지(향후 클레이 렌더 3D 일러스트로 교체 가능).
- 정답=민트 계열, 오답=핑크 계열로 의미 색 일관.

### 수용 기준
1. 전 화면의 버튼·카드·필·게임 오브젝트가 **동일한 클레이 섀도/라운드 토큰** 사용.
2. 라이트 배경에서 입체감이 또렷하고, 눌림 피드백이 일관.
3. 기존 평면 `box-shadow:... 0 Npx 0 ...` 패턴이 잔존하지 않음.
4. 기능/레이아웃/게임 로직 변화 없음.

### 구현 노트
- 단일 HTML: `<style>`의 공통 클래스에 토큰 적용(전역 일괄).
- React/Vite 리팩터링 시: 위 토큰을 `theme`/CSS 변수 파일로 분리해 재사용.

---

## CR-3. 학습 신호 수집(Telemetry) + 숙달도 — P0-1 (Cowork 구현 완료 → Code 검증·배포)

> 대상: **React/Vite 소스**(`src/`). 작성 2026-07-06.
> 상태: **코드는 Cowork에서 이미 작성함**. Claude Code는 아래 "할 일"만 하면 됨.
> ⚠️ Cowork 샌드박스 마운트가 편집 파일을 잘림/NUL 손상 사본으로 캐싱하는 이슈(→ `CLAUDE_CODE_TASK.md` 참고)로 **Cowork에서 `vite build` 검증 불가**. 실제 환경에서 빌드·플레이 검증 필수.

### 배경 / 문제
Firebase(cloud.js)는 있으나 동기화 대상이 `SAVE`(진주·연속·수집단어)뿐이라 **"무엇을 배웠나"라는 학습 신호가 0**. 단어 학습이 *한 번 터치 = 수집*으로만 처리됨. 평가·학부모 리포트·데이터 의사결정의 원천 데이터가 없음.

### 목표
모든 정답/오답을 이벤트로 적재 → 단어·음소별 **숙달도(mastery)** 산출 → (a) 약점 우선 미션, (b) 학부모 리포트, (c) 교사 대시보드의 원천 확보. **firebase 코드-스플릿은 유지**(telemetry는 firebase를 직접 import하지 않음).

### 변경된 파일 (구현 완료)
1. **`src/engine/telemetry.js` (신규)** — `logAnswer()`, `flushEvents()`, `mastery(word)`, `weakWords()`, `phonemeStats()`, `learningStats()`. 최근 300건을 localStorage(`ypq_evlog`) 링버퍼에 보관(오프라인 동작). 클라우드 전송은 `window.__saveEvents(batch)` 어댑터로만.
2. **`src/cloud.js`** — `firebase/firestore`에서 `collection, addDoc` 추가 import. `saveEvents(batch)` 추가: `users/{uid}/eventBatches/{autoId}`에 20건씩 1회 쓰기.
3. **`src/legacyGame.js`** — telemetry import; `startGameState`에 `_qStart`(반응속도); `hit()`/`miss()`에 `logAnswer` 1줄씩; `finishGame`에서 `flushEvents()`; `syncCloud`에서 인증 성공 시 `window.__saveEvents` 어댑터 연결; `window.__YPQ.learningStats` 노출.

### 데이터 스키마
```
이벤트: { game, phoneme, word, correct, latencyMs, mode, ts }
숙달도: mastery = 최근8회 정답률×0.7 + 빠른정답(<2.5s)률×0.3   // 0~1
Firestore: users/{uid}/eventBatches/{autoId} = { events:[...20], n, _t }
```

### Claude Code 할 일
1. **빌드 검증**: `npm run build` 성공 확인(Cowork 마운트 캐시 이슈로 미검증). 파싱/임포트 에러 시 위 3개 파일 확인.
2. **플레이 스모크**: 게임 플레이 → 브라우저 콘솔 `window.__YPQ.learningStats()`가 `{answers, accuracy, wordsPracticed, phonemes}` 반환하는지.
3. **Firestore 보안 규칙 배포**(필수 — 없으면 `eventBatches` 쓰기 실패/무방비). 초안:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
         match /{sub=**} { allow read, write: if request.auth != null && request.auth.uid == uid; }
       }
       match /nicknames/{name} {
         allow read: if true;
         allow write: if request.auth != null;   // 트랜잭션에서 중복 검증
       }
     }
   }
   ```
4. **확인**: 실제 플레이 후 Firestore 콘솔에 `users/{uid}/eventBatches` 문서가 쌓이는지.

### 수용 기준
1. 빌드 성공, 콘솔 에러 없음. 게임 로직·레이아웃 변화 없음.
2. 정답/오답 시 `ypq_evlog`(localStorage)에 이벤트 적재, 오프라인에서도 `mastery()` 계산됨.
3. 로그인(온라인) 시 20건마다/게임 종료 시 `eventBatches`로 업로드.
4. 보안 규칙 배포로 본인 데이터만 접근 가능.

### 다음 단계(후속 CR 후보)
- 약점 우선 데일리 미션(`pickDailyMission` — `weakWords()` 활용, 현재 완전 랜덤 대체).
- 학부모 리포트 v0(주간: 배운 단어·정확도·연속일) — `learningStats()` 소비.

---

## Claude Code 지시 예시
```
이 폴더의 HANDOFF.md와 CHANGE_REQUEST.md를 읽고,
CR-3(학습 Telemetry)의 "할 일"을 수행해줘:
npm run build 검증 → 플레이 스모크(window.__YPQ.learningStats()) →
Firestore 보안 규칙 배포 → eventBatches 유입 확인.
기능/레이아웃은 유지할 것.
(과거 CR-1 오디오·CR-2 Claymorphism은 이미 반영됨)
```
