# Codex 작업 지시 — #4 단어 일러스트 (이모지 → 실제 그림)

> 작성: 2026-07-01 / 대상 브랜치: `feature/data-vite-refactor`
> 목표: 게임·도감에서 단어를 나타내는 **이모지**를 **일관된 실제 일러스트**로 교체.

## 0. 핵심 원칙 (음가 오디오 파이프라인과 동일 패턴)
1. **빌드타임 생성 → 정적 파일**: 런타임에 이미지 API를 호출하지 않는다. 미리 생성해 `public/content/img/<word>.webp`로 저장하고 앱은 파일만 참조. (키 노출/지연/비용 0, 정적 호스팅에 적합)
2. **graceful 폴백**: 이미지가 없으면 **기존 이모지로 표시**. 점진 적용 가능, 절대 안 깨짐.
3. **아트 디렉션 고정**: 모든 단어가 같은 스타일·구도·배경이 되도록 프롬프트 템플릿 고정 → 전체 톤 통일(현재 "Clean World" 디자인과 어울리게).
4. **범위**: 우선 **활성 권(books 1~3)** 단어만. 이후 권 확장 시 같은 스크립트 재실행.

---

## 1. 생성 스크립트 `scripts/gen-images.mjs` (신규)
참고: 동일 패턴의 기존 스크립트 `scripts/gen-phonemes.mjs`(OpenAI TTS) 구조를 따른다.

- **입력 단어 목록**: `public/content/all_words.json`(`{count, words:[{w, books:[..]}]}`)에서 `books`에 1~3이 포함된 단어만 추출. (인자로 권 범위 받게: 예 `--books 1,2,3`)
- **이미지 생성**: OpenAI Images API `gpt-image-1`. `OPENAI_API_KEY` 환경변수 사용.
- **출력**: `public/content/img/<word>.webp` (소문자 단어명). 정사각 512×512, **투명 배경**(없으면 아주 연한 단색). webp로 저장(필요 시 png→webp 변환, 장당 <50KB 목표).
- **증분**: 이미 있으면 skip, `--force`로 재생성.
- **레이트리밋/안정성**: 순차 처리 + 소폭 딜레이, 실패는 로그만 남기고 계속, 끝에 성공/실패 요약.
- **스타일 프롬프트(고정 템플릿)** — 단어만 끼워넣기:
  ```
  Flat vector illustration of a single "<WORD>", centered, friendly storybook style for young children.
  Thick rounded outlines, bright cheerful palette, soft simple shapes, gentle soft shadow.
  Transparent background. No text, no letters, no numbers in the image. One clear object only.
  ```
- **추상어 처리**: 사물이 아닌 단어(예: happy, talk, big, many, new, give, go, little, kind, six, ten …)는
  - (a) 행동/개념을 명확히 보여주는 보조 프롬프트로 생성(예: happy = "a smiling happy child face"), 또는
  - (b) 애매하면 **생성 제외 → 이모지 유지**(폴백). 제외 목록을 스크립트 상단 `SKIP` 배열로 관리.
- **실행법(주석에 명시)**: `set OPENAI_API_KEY=sk-...  &&  node scripts/gen-images.mjs` (cmd) / PowerShell은 `$env:...`.

## 2. 앱 연동
- **공유 헬퍼** 신규 `src/wordImage.js`:
  ```js
  export function wordVisual(item, cls){
    const w=String(item.w).toLowerCase();
    const emo=item.emo||'🔤';
    return `<img class="${cls} wimg" src="content/img/${encodeURIComponent(w)}.webp" alt=""
      loading="lazy" onerror="this.outerHTML='<span class=\\'${cls}\\'>${emo}</span>'">`;
  }
  ```
  - 이미지 로드 실패 시 onerror로 같은 클래스의 이모지 span으로 교체(폴백).
- **치환 위치** (`src/legacyGame.js`의 렌더 템플릿 — 현재 `${...emo}`를 `${wordVisual(...,'클래스')}`로):
  - 버블 `.be`, 퀴즈 `.emo`, 두더지 `.emo`, 러너 `.be`, 슈터 `.be`, 점프 `.be`, 워드헌트 `.be`, 워드캐치 `.be`, 메모리 카드 face, 도감 `dexWords`의 `.e`.
  - (정확한 라인은 바뀔 수 있으니 `${item.emo}` / `${o.emo}` / `${o.it.emo}` / `${it.emo}` 패턴으로 찾아 교체)
  - 각 자리의 기존 클래스(.be/.emo/.e)를 헬퍼 `cls`로 넘겨 크기/레이아웃 유지.
- **CSS**(`src/styles.css`): `.wimg{width:100%;height:100%;object-fit:contain;display:block;}` + 각 컨테이너(.be/.emo/.e)가 이미지를 담도록 크기 보정(기존 이모지 font-size 자리만큼).
- **범위 제외**: 캐릭터 마스코트(`WORLD_META.emoji` — 동물 친구)는 **단어가 아니므로 이번 작업 대상 아님**. 단어 일러스트만 교체.

## 3. 일관성 / 품질 기준
- 모든 이미지 동일 스타일·구도·배경(투명). 글자/숫자 미포함(글자 학습 방해 방지).
- 동물 캐릭터(🦭🐯…)와 톤이 어울리는 밝고 둥근 스타일.
- 아동 적합성 확인. 단어 의미와 명확히 일치.

## 4. 성능 / 에셋 관리
- webp + `loading="lazy"`. 활성 권만(수십 장) 우선.
- **대용량 바이너리 주의**: 이미지가 많아지면 git 레포가 비대해진다.
  - 1차: `public/content/img/`에 커밋(활성 권만, 용량 모니터링).
  - 확장 시: **Firebase Storage/CDN 업로드 후 URL 참조**로 전환 고려(헬퍼의 src만 변경). 이미 Firebase 프로젝트(`yoons-phonics-quest`) 사용 중.

## 5. 검증
1. 스크립트 실행 → `public/content/img/` 채움 → 이미지 몇 장 열어 스타일 일관성 확인.
2. `npm run dev` → 게임 8종 + 메모리 + 도감에서 단어 이미지 표시 확인, **이미지 없는 단어는 이모지 폴백** 확인, 콘솔 에러 0.
3. `npm run build` → `dist/content/img` 포함 확인.
4. `firebase deploy --only hosting` → 라이브 확인.

## 6. 주의 (협업)
- **같은 브랜치를 Claude와 번갈아 편집** 중. 시작 전 `git fetch` + 상태 확인, 작업 단위로 자주 커밋·푸시. `legacyGame.js` 렌더부가 자주 바뀌니 최신 기준으로 패턴 치환.
- 커밋 메시지 규칙은 기존 히스토리(`feat:`/`fix:`/`chore:`/`assets:`) 따르기.

## 7. 산출물 체크리스트
- [ ] `scripts/gen-images.mjs` (+ 재생성법 주석)
- [ ] `src/wordImage.js` 헬퍼 + `styles.css` `.wimg`
- [ ] `legacyGame.js` 렌더 사이트 ~10곳 치환(이모지 폴백 유지)
- [ ] `public/content/img/*.webp` (books 1~3)
- [ ] dev/build/deploy 검증 후 라이브 반영
