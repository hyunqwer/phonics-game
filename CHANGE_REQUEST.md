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

## Claude Code 지시 예시
```
이 폴더의 HANDOFF.md와 CHANGE_REQUEST.md를 읽고,
index.html에 CR-1(오디오 정정)과 CR-2(Claymorphism)를 구현해줘.
기능/레이아웃은 유지하고, 변경 후 6개 게임이 정상 동작하는지 확인해줘.
```
