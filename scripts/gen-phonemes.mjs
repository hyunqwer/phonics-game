/*
 * 음가(phoneme) 오디오 생성 — 빌드 타임 1회 실행용.
 * OpenAI TTS(gpt-4o-mini-tts)로 글자별 "음가(소리)"를 원어민 교사 시범처럼 만들어
 * public/content/sound/<key>.mp3 저장. 런타임 API 호출/키 노출 없음.
 *
 * 핵심: 단일 자음 글자를 그대로 주면 TTS가 알파벳 "이름"(케이/비)을 읽어버린다.
 * → 파열음(stop)은 "buh/kuh"처럼 모음을 붙인 단서, 지속음은 길게 늘인 단서를 입력으로 준다.
 *
 * 실행 (cmd):        set OPENAI_API_KEY=sk-...   &&  node scripts/gen-phonemes.mjs
 * 실행 (PowerShell): $env:OPENAI_API_KEY="sk-..." ;  node scripts/gen-phonemes.mjs
 * 음성 바꾸기:       set OPENAI_TTS_VOICE=nova   (coral/nova/sage/alloy/ash/ballad/verse ...)
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY 환경변수가 필요합니다.'); process.exit(1); }

// key → { cue: TTS가 그대로 읽을 발음 단서, word: 음가가 들어간 예시 단어(지시문 맥락용) }
// 파열음 t·b·k·g·d·j·c → 모음(schwa) 붙인 "buh/kuh" 식(교사 시범 방식)
// 지속음 s·m·f·l·n·r → 길게 늘여 음가 자체가 들리게
const SOUNDS = {
  s: { cue: 'ssss',  word: 'sun'    },
  t: { cue: 'tuh',   word: 'tiger'  },
  b: { cue: 'buh',   word: 'ball'   },
  h: { cue: 'huh',   word: 'hat'    },
  m: { cue: 'mmmm',  word: 'mouse'  },
  k: { cue: 'kuh',   word: 'koala'  },
  j: { cue: 'juh',   word: 'jaguar' },
  f: { cue: 'ffff',  word: 'fox'    },
  g: { cue: 'guh',   word: 'goat'   },
  l: { cue: 'llll',  word: 'lion'   },
  d: { cue: 'duh',   word: 'dog'    },
  n: { cue: 'nnnn',  word: 'newt'   },
  w: { cue: 'wuh',   word: 'wolf'   },
  c: { cue: 'kuh',   word: 'cat'    },
  r: { cue: 'rrrr',  word: 'rabbit' }
};

function instructionFor(word) {
  return [
    'You are a warm, friendly native English phonics teacher modeling a sound for a 5-year-old child.',
    `Say the single English phonics SOUND — the sound this letter makes at the start of the word "${word}" — clearly, gently, and slowly, exactly once.`,
    'This is a sound demonstration, NOT the letter name: never say "ay/bee/see/kay/jay" etc. Only the pure sound.',
    'Encouraging, child-directed tone. No extra words.'
  ].join(' ');
}

const MODEL = 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'coral';
const outDir = path.resolve('public/content/sound');
fs.mkdirSync(outDir, { recursive: true });

let ok = 0, fail = 0;
for (const [key, { cue, word }] of Object.entries(SOUNDS)) {
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: cue, instructions: instructionFor(word), response_format: 'mp3' })
    });
    if (!res.ok) { console.error(`✗ ${key}: ${res.status} ${await res.text()}`); fail++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(outDir, `${key}.mp3`), buf);
    console.log(`✓ ${key}.mp3  (cue "${cue}", as in ${word}, ${buf.length} bytes)`);
    ok++;
  } catch (e) { console.error(`✗ ${key}:`, e.message); fail++; }
}
console.log(`\n완료: ${ok} 성공, ${fail} 실패 → ${outDir}  (voice: ${VOICE})`);
console.log('소리가 어색하면 SOUNDS의 cue를 조정(예: t를 "tuh"→"t-t-t")하거나 OPENAI_TTS_VOICE를 바꿔 다시 실행하세요.');
