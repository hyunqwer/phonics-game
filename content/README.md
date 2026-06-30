# Yoon's Phonics Quest 콘텐츠 DB (`content/`)

YPW New Edition(NYPW) **전 18권**의 게임용 단어 데이터. 업로드된 Teacher's Guide Scope & Sequence(190226 Step1 / NYPW Step2~5 TG)에서 추출했습니다.

## 폴더 구성

```
content/
├─ index.json          ← 18권 메타(스텝·제목·소리·단어수·잠금/검증 플래그)
├─ book01.json … book18.json   ← 권별 단어 데이터
├─ all_words.json      ← 중복 제거 단어 563개 + 등장 권 (오디오/이미지 에셋 파이프라인용)
└─ README.md
```

## 권별 스키마 (`bookNN.json`)

```jsonc
{
  "book": 5,                       // 권 번호 (1~18, 교재/SB 연속 번호)
  "step": 2,                       // 학습 단계 (1~5)
  "stepTitle": "Step 2 단모음 (Short Vowels)",
  "title": "단모음 A · I",
  "category": "short_vowel",       // consonant|short_vowel|long_vowel|blend|digraph|other_vowel
  "soundFocus": ["a", "i"],        // 이 권에서 다루는 핵심 소리
  "needsSourceVerify": false,      // true면 원본 표 대조 권장(아래 참고)
  "wordCount": 40,
  "units": [                       // 차시(lesson) 단위
    {
      "lesson": "1A",
      "pages": "4-9",
      "focus": "Short Vowel A [-at/-an]",
      "groups": [                  // 소리/워드패밀리 단위 단어 묶음
        { "key": "-at", "words": ["bat","cat","fat","hat","mat"] },
        { "key": "-an", "words": ["can","fan","man","pan","van"] }
      ]
    }
  ]
}
```

`groups[].key`는 권 성격에 따라 다릅니다: Step 1 = 자음 글자(`s`,`t`…), Step 2~3 = 워드패밀리(`-at`,`-ake`…), Step 4 = 블렌드/다이그래프(`fr`,`ch_`…), Step 5 = 모음팀(`oi_oy`,`ar`…).

## 18권 매핑

| 권 | Step | 카테고리 | 핵심 소리 | 단어수 |
|---|---|---|---|---|
| 1 | 1 | 자음 | S T B H M | 50 |
| 2 | 1 | 자음 | K J F G L | 50 |
| 3 | 1 | 자음 | D N W C R | 50 |
| 4 | 1 | 자음 | P Q V Y Z + 끝소리 | 54 |
| 5 | 2 | 단모음 | A · I | 40 |
| 6 | 2 | 단모음 | U · O | 37 |
| 7 | 2 | 단모음 | E + 복습 | 17 |
| 8 | 3 | 장모음 | a_e i_e u_e | 45 |
| 9 | 3 | 장모음 | o_e ee | 35 |
| 10 | 3 | 장모음 | ai/ay igh/ie | 34 |
| 11 | 3 | 장모음 | oa/ow ea | 34 |
| 12 | 4 | 연속자음 | fr gr br pr / fl gl bl pl | 40 |
| 13 | 4 | 연속자음 | sm st sw sn sl sp + soft c/g | 40 |
| 14 | 4 | 자음이중자 | ch sh th | 48 |
| 15 | 4 | 자음이중자 | wh ph ng ck wr kn | 45 |
| 16 | 5 | 기타모음 | oi/oy ou/ow au/aw oo | 38 |
| 17 | 5 | 기타모음 | oo/ew ue y | 36 |
| 18 | 5 | 기타모음 | ar or ir/er/ur | 30 |

합계 **723 word-slot / 593 고유 단어**. 일부 단어는 여러 권에 중복 등장(자연 복습).

> 전 18권을 **교재개발2팀 스콥 엑셀과 단어 단위로 대조 완료** (2026-06-30). BK9·10·11·15·16을 엑셀 기준으로 보정(BK15에 wr·kn 그룹 추가, BK16 `good` 제거 등)하여 현재 18/18 전권 일치.

모든 권 `needsSourceVerify:false` — 엑셀 스콥 대조로 확정됨. 권별 검증 결과는 `master_compare.html`, 전체 단어표는 `word_list.html` 참고.

## 현재 게임(`index.html`)과의 관계

현재 `WORLDS` 객체는 **1권의 S·T·B·H·M만, 음가 1개=월드 1개** 구조입니다. 이 콘텐츠 DB는 그 상위 구조로, 게임 엔진 변경 없이 단계적으로 연결할 수 있습니다.

### 연결 방법 A — 기존 WORLDS로 평탄화(최소 변경)
권 파일을 읽어 `focus` 그룹 단어=정답, 다른 권 단어=distractor로 매핑:

```js
async function loadWorld(bookId, soundKey){
  const b = await fetch(`content/book${String(bookId).padStart(2,'0')}.json`).then(r=>r.json());
  const target = b.units.flatMap(u=>u.groups)
                  .filter(g=>g.key.includes(soundKey))
                  .flatMap(g=>g.words);
  // distractor는 all_words.json에서 다른 소리 단어 무작위 추출
  return { phoneme:`/${soundKey}/`, words:target.map(w=>({w})), distractors:[...] };
}
```

### 연결 방법 B — Firestore 이관(최종)
권 JSON 도큐먼트를 그대로 `books/{bookId}` 컬렉션에, 단어를 `words/{word}`(필드: `book`, `sound`, `family`)로 적재. 스키마가 1:1로 대응되도록 설계했습니다.

## 다음 단계(미완료, 의도적 분리)

- **이모지/이미지 매핑**: 단어-이모지는 미포함(593개 일관 매핑은 별도 에셋 작업). `all_words.json`을 입력으로 GPT 이미지 생성 파이프라인 권장. 현재 1권 이모지는 `index.html`에 이미 존재.
- **오디오**: `WORD_AUDIO_BASE`의 단어별 mp3 존재 여부를 `all_words.json` 기준으로 점검 → 누락분 ElevenLabs 렌더.
