# Yoon's Phonics Quest 업데이트 요약

> 작성일: 2026-06-30  
> 브랜치: `feature/data-vite-refactor`  
> 원격 저장소: `https://github.com/hyunqwer/phonics-game.git`

## 현재 방향

이 프로젝트는 윤선생 파닉스 18권 콘텐츠를 기반으로 하지만, 아이가 보는 첫인상은 교재 복습 앱이 아니라 **가볍게 성을 정복하고 보물을 모으는 게임**이어야 한다.

내부 구조는 `교재 권수 -> 음가/게이트 -> 단어 카드`를 유지한다. 다만 화면에서는 교재, 학습, 복습 같은 표현을 가능한 숨기고 `Castle`, `Realm`, `Quest`, `Guard`, `Loot`, `Treasure` 같은 게임 언어로 드러낸다.

## 주요 변경 이력

### 1. 프로젝트 정리와 버전관리

- 현재 상태 스냅샷과 Git 초기 커밋을 만들었다.
- 불필요한 PDF 파일을 제거했다.
- GitHub 원격 저장소 `hyunqwer/phonics-game.git`에 연결했다.
- 이후 작업은 `feature/data-vite-refactor` 브랜치에서 커밋/푸시하고 있다.

최근 주요 커밋:

- `55317c2` snapshot: current prototype before data and vite work
- `f8cfbd7` chore: remove source PDFs from workspace
- `fecdd3b` feat: rename game and load book content
- `c037591` refactor: migrate app shell to react vite
- `0cbb8be` feat: enable books one through three
- `9e6b885` feat: add castle map home mockup
- `b9f18b8` feat: make castle map feel like an adventure map
- `0165285` feat: add first castle choice flow
- `a825654` fix: repair collection screen layout
- `3bde99a` feat: redesign collection around castles and cards
- `8d60927` style: make collection feel like a game vault

## 앱 이름

게임 이름을 **Yoon's Phonics Quest**로 변경했다.

## 기술 구조

React/Vite 앱으로 1차 마이그레이션했다.

주요 파일:

- `src/App.jsx`: React 앱 셸과 기존 레거시 화면 마크업 마운트
- `src/legacyGame.js`: 게임 런타임, 콘텐츠 로딩, 저장 상태, 오디오, 보상, 미션
- `src/styles.css`: 기존 레거시 게임 UI 스타일
- `src/components/CastleMapHome.jsx`: 새 성 지도형 홈 화면
- `src/components/CastleMapHome.css`: 성 지도 홈 스타일
- `src/components/CollectionHome.jsx`: 새 보물창고형 Collection 화면
- `src/components/CollectionHome.css`: 보물창고형 Collection 스타일
- `public/content/`: 18권 콘텐츠 JSON 데이터

실행:

```bash
npm run dev
npm run build
```

## 콘텐츠 적용 상태

### 현재 게임 플레이 활성 범위

현재 실제 게임 플레이는 **1권, 2권, 3권**만 우선 적용했다.

- 1권: `s, t, b, h, m`
- 2권: `k, j, f, g, l`
- 3권: `d, n, w, c, r`

총 15개 음가/게이트가 현재 홈과 게임 플레이에 연결되어 있다.

### 18권 전체 데이터

`public/content/index.json`과 `book01.json`~`book18.json`은 18권 전체 구조를 가지고 있다.

Collection은 18권 전체 구조를 읽어 다음 총량을 보여준다.

- 18 Realms/Castles
- 113 Sound Friends/Gates
- 723 Treasure Cards

중요: 카드 수는 고유 단어 중복 제거 기준이 아니다.  
같은 단어라도 다른 성/음가에서 등장하면 별도의 카드로 취급한다.

카드 저장 기준:

```text
book:key:word
```

예를 들어 같은 `bag`이라도 Book 1의 특정 음가 카드와 Book 4의 특정 음가 카드는 서로 다른 카드다.

## 홈 화면 방향

기존 목업의 책장/학습 여정 느낌은 사용자가 원하는 컨셉과 맞지 않았다. 그래서 홈은 다음 서사로 재정의했다.

> 아이가 원하는 성에서 시작하고, 성 안의 사운드 게이트를 하나씩 정복한다.  
> 사운드를 정복하면 성이 내 것이 되고, 언제든 이전 성으로 돌아가 복습할 수 있다.

현재 홈 구조:

- 첫 시작 시 원하는 시작 성 선택
- 선택 후에는 `Continue Quest` 중심의 단순 홈
- 현재 성 안의 5개 게이트만 우선 노출
- 다른 성은 별도 탐색 영역에서 이동 가능
- 앞으로는 순서대로 진행하되, 이전 성과 안 한 성도 자유롭게 갈 수 있는 구조

## Collection 방향

Collection은 내부적으로는 `18권 -> 음가 -> 단어 카드` 구조를 유지하지만, 화면에서는 학습앱처럼 보이지 않도록 게임 언어로 바꿨다.

현재 화면 표현:

- `Collection` 대신 `Treasure Vault`
- `Castles / Friends / Cards` 대신 `Map / Guard / Loot`
- `Book` 대신 `Realm`
- 교재 제목 노출 제거
- 카드 수는 `treasures`로 표현
- 보물창고, 지도, 수호자, 전리품 느낌의 UI로 변경

현재 탭:

- `Map`: 18개 Realm 카드
- `Guard`: 선택한 Realm 안의 Sound Friend/Gate
- `Loot`: 선택한 Realm 안의 단어 카드

## 저장 상태

localStorage 키는 기존과 동일하게 `soripang`을 사용한다.

주요 저장 값:

- `curWorld`: 현재 음가/게이트
- `castleStartBook`: 처음 선택한 시작 성
- `currentBook`: 현재 이어서 진행 중인 성
- `chars`: 발견한 Sound Friend
- `words`: 기존 단어 획득 기록
- `cards`: 새 카드 획득 기록, `book:key:word` 단위
- `missions`, `missionDone`, `chestDone`: 월드/게이트별 미션과 보상 상태
- `pearls`, `xp`, `best`, `playedToday`, `owned`, `equipped`

기존 `words` 저장 데이터가 있는 경우, 현재 플레이 가능한 1~3권 범위 안에서 `cards`로 마이그레이션하도록 보강했다.

## 현재 검증 상태

최근 변경마다 다음 검증을 수행했다.

- `npm run build` 통과
- Collection 구조 검증
  - 18개 Realm 표시
  - 113개 Sound Friend/Gate 집계
  - 723개 Treasure Card 집계
  - Book 1 기준 카드 50장 표시 확인
- Collection UI 문구 정적 검사
  - `Treasure Vault`, `Map`, `Guard`, `Loot`, `Realm`, `treasures` 중심으로 변경
  - 학습앱 느낌의 직접 문구를 줄임

주의: 마지막 Collection UI 변경 후 브라우저 자동 확인은 한 번 시간초과가 있었지만, 빌드와 코드 검사는 통과했다.

## 아직 남은 중요한 판단

### 1. 홈과 Collection의 시각 언어 통일

홈은 성 지도/모험 느낌이고, Collection은 보물창고 느낌으로 바뀌었다. 다음 단계에서는 두 화면의 색감, 아이콘, 카드 형태, 용어를 더 일관되게 맞추는 것이 좋다.

### 2. 캐릭터/Sound Friend 에셋

현재 2~3권 이후 일부 음가는 임시 이름과 이모지를 사용한다. 18권 전체에 대해 Sound Friend 캐릭터명, 아이콘, 이미지 스타일을 정해야 한다.

### 3. 18권 전체 플레이 적용

현재 게임 플레이는 1~3권만 활성화되어 있다. 18권 전체를 적용하려면 다음이 필요하다.

- `CONTENT_BOOKS_TO_LOAD` 확장
- 113개 음가/게이트의 메타데이터 정리
- 각 음가별 캐릭터/아이콘/이름 확정
- 단어 이모지 또는 이미지 에셋 확장
- 미션/난이도/진행 순서 밸런싱

### 4. 카드 획득 UX

현재는 게임에서 맞힌 단어가 카드로 저장된다. 앞으로는 다음 연출을 붙이면 더 게임다워진다.

- 새 카드 획득 팝업
- 보물상자에서 카드 공개
- Realm별 카드 완성 보상
- Sound Friend별 카드 세트 완성 보상

### 5. Firebase 배포/저장

현재는 localStorage 기반이다. 완성도를 높인 뒤 Firebase Hosting 및 로그인/저장 구조를 붙일 예정이다.

## 다음 작업 추천 순서

1. 홈 화면과 Treasure Vault 화면의 게임 톤 통일
2. 1~3권 플레이 루프를 실제 아이가 쓰는 흐름으로 다듬기
3. 카드 획득 연출 추가
4. Sound Friend/Realm 네이밍 및 에셋 방향 확정
5. 4권 이후 콘텐츠 확장 전략 수립
6. Firebase 배포 준비

## 현재 한 줄 요약

현재 앱은 **1~3권 파닉스 게임 플레이가 가능한 React/Vite 기반 프로토타입**이며, 홈은 **성 정복 모험**, Collection은 **18개 Realm의 Treasure Vault** 구조로 전환 중이다.

---

## 2026-07-01 업데이트: 1~18권 단어 이미지 전체 반영

### 작업 범위

- `source_assets/nypw-source-capture/`의 권별 캡처 이미지를 기준으로 1~18권 전체 단어 이미지를 구축했다.
- 기존에 먼저 작업한 5~9권 개별 시트와 새 보충 캡처를 함께 반영했다.
- `public/content/book01.json`부터 `book18.json`까지의 모든 단어가 `public/content/img/words/<word>.webp`를 갖도록 보강했다.

### 산출물

- 단어 이미지 총수: `595개`
- 교재 JSON 기준 고유 단어 수: `593개`
- 단어 이미지 누락 수: `0개`
- 추가/보강된 추출 스크립트:
  - `scripts/extract-word-card-images.py`
  - `scripts/extract-nypw-source-captures.py`
- 원본 보존 경로:
  - `source_assets/word-card-sheets/`
  - `source_assets/nypw-source-capture/`

### 처리 방식

- 권별 캡처에서 단어 그림 영역을 잘라 512x512 WebP로 정규화했다.
- 이미 존재하는 이미지가 있는 단어는 기본적으로 건너뛰고, 품질 보정이 필요한 일부 단어만 강제 재생성했다.
- 번호 배지, 라벨 글자, 셀 테두리가 노출되는 경우 수동 crop 좌표로 보정했다.
- 마지막 보충 캡처 5장으로 다음 누락 단어 13개를 마저 반영했다:
  - `bus`, `root`, `drum`
  - `apron`, `bacon`, `idea`, `idol`, `pilot`
  - `oval`, `open`, `erase`, `evening`, `me`

### 클로드 작업 반영

- 클로드가 작성한 품질 리뷰 문서 `REVIEW_quality_audit.md`를 함께 커밋 대상에 포함한다.
- 클로드 검토 과정에서 생긴 `tmp_ppt_review/`는 임시 산출물이라 커밋하지 않고 `.gitignore`에 추가했다.

### 검증

- 1~18권 전체 단어 이미지 누락 검사: `0개`
- `npm run build` 통과
- 단어 카드 이미지가 없는 경우 발생하는 이모지 fallback 대상 단어 없음

### 참고

- 마을 아이콘, 게임 아이콘, Sound Friend 캐릭터 이모지는 단어 카드 이미지와 별개 UI 요소라 계속 이모지를 사용할 수 있다.
- 이번 완료 기준은 **교재 단어 카드 이미지**에 한정한다.
