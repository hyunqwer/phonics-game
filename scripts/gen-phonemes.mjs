/*
 * 음가(phoneme) 오디오 생성 — 빌드 타임 1회 실행용.
 * OpenAI TTS(gpt-4o-mini-tts)로 글자별 음가 mp3를 만들어 public/content/sound/<key>.mp3 저장.
 * 런타임에 API를 부르지 않으므로 키 노출/비용/지연이 없다. (나중에 ElevenLabs로 교체 가능)
 *
 * 실행 (PowerShell):
 *   $env:OPENAI_API_KEY="sk-..."; node scripts/gen-phonemes.mjs
 * 실행 (bash):
 *   OPENAI_API_KEY=sk-... node scripts/gen-phonemes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY 환경변수가 필요합니다.'); process.exit(1); }

// 글자별 "발음 단서" — 순수 음가(letter name 아님)를 유도하는 입력 텍스트
const SOUNDS = {
  s: 'sss', t: 't', b: 'b', h: 'h', m: 'mmm',
  k: 'k', j: 'j', f: 'fff', g: 'g', l: 'lll',
  d: 'd', n: 'nnn', w: 'w', c: 'k', r: 'rrr'
};

const instructions = [
  'You are a gentle phonics teacher for young children learning English.',
  'Say ONLY the short English phonics sound represented by the input, exactly once, clearly and warmly.',
  'Do NOT say the letter name (no "ess", "tee"). Do NOT say any whole word. Just the pure sound.'
].join(' ');

const MODEL = 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'alloy';
const outDir = path.resolve('public/content/sound');
fs.mkdirSync(outDir, { recursive: true });

let ok = 0, fail = 0;
for (const [key, text] of Object.entries(SOUNDS)) {
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, instructions, response_format: 'mp3' })
    });
    if (!res.ok) { console.error(`✗ ${key}: ${res.status} ${await res.text()}`); fail++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(outDir, `${key}.mp3`), buf);
    console.log(`✓ ${key}.mp3 (${buf.length} bytes)`);
    ok++;
  } catch (e) { console.error(`✗ ${key}:`, e.message); fail++; }
}
console.log(`\n완료: ${ok} 성공, ${fail} 실패 → ${outDir}`);
console.log('생성된 소리를 듣고 어색하면 SOUNDS 단서 텍스트나 instructions를 조정해 다시 실행하세요.');
