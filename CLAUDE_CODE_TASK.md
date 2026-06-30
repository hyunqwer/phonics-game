# Claude Code 작업 지시 — git 안정화 → 배포 준비

> 작성: 2026-06-30 (Cowork 점검 결과 인계)
> 환경: 로컬 Windows `C:\project\phonics-game` / 브랜치 `feature/data-vite-refactor`
> 원격: https://github.com/hyunqwer/phonics-game.git

## 배경 (Cowork에서 점검한 현재 상태)

10:28경 토큰 소진으로 Cowork 작업이 멈춘 뒤 Codex로 이어서 git 연결·커밋, 홈 화면 재기획·연결을 진행함. 이후 Cowork에서 코드 상태를 점검한 결과:

- **코드는 정상**: `vite build`가 32개 모듈 모두 정상 변환. App.jsx + legacyGame.js(미니게임 10종) + CastleMapHome/CollectionHome + 18권 콘텐츠 JSON 모두 정상.
- **수정·복구됨**: `index.html`이 정상 내용(570B) 뒤에 널 문자 약 49KB가 붙어 손상돼 빌드가 깨졌었음 → 커밋된 HEAD의 정상본으로 복구 완료(현재 HEAD와 일치, 추가 조치 불필요).
- **남은 정리 대상**: 스테일 `.git/index.lock`, 빈 폴더 `.git.broken-20260630-102845`, 미커밋 콘텐츠 변경 24개(HANDOFF.md + 18권 JSON + index.json + all_words.json + README.md + html 2개 — 전부 실제 변경), 푸시 안 된 커밋 1개(`5f35d55`).

## TASK 1 — git 안정화 (먼저)

```powershell
cd C:\project\phonics-game
Remove-Item .git\index.lock -ErrorAction SilentlyContinue
Remove-Item .git.broken-20260630-102845 -Recurse -Force -ErrorAction SilentlyContinue

# index.html이 짧은 Vite 진입점(약 13줄)인지 확인. 깨진 글자가 보이면 손상 잔존.
git status -s        # index.html 은 목록에 없어야 정상
git add -A
git commit -m "content: apply book content and home wiring updates from codex"
git push
```

확인 기준: `git status -s` 깨끗, `git push` 성공, `origin/feature/data-vite-refactor`가 최신.

## TASK 2 — 홈→화면 연결 동작 검증

`npm install` 후 `npm run dev` → 브라우저에서:
- 새 홈(CastleMapHome)에서 성/게이트 선택 → 미니게임 진입까지 끊김 없는지
- Collection(Treasure Vault) Map/Guard/Loot 탭 정상 표시
- 결과/보상/보물상자 흐름, 음소거 토글, 단어 발음 1회 재생(CR-1)
끊긴 연결이나 콘솔 에러가 있으면 수정 후 커밋.

## TASK 3 — Firebase Hosting 배포 (초안 웹 공유)

정적 호스팅으로 먼저 공유. 이후 Auth/Firestore는 같은 프로젝트에 추가.

```powershell
npm install -g firebase-tools
firebase login
firebase init hosting     # public: dist, SPA rewrite: Yes, GitHub 자동배포: 선택
npm run build
firebase deploy
```

`firebase.json` 권장 설정:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

확인 기준: `firebase deploy` 출력의 Hosting URL에서 게임이 정상 로드·플레이.

## 주의

- 빌드 산출물 `dist/`는 배포물이므로 호스팅이 자동 생성. git에 올릴 필요 없음(필요 시 `.gitignore`에 `dist/` 확인).
- 손상 재발 방지: 동일 파일을 여러 도구로 교차 편집할 때 인코딩(UTF-8, 널 문자) 주의.
