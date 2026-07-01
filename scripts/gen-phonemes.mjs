/*
 * 음가(phoneme/pattern) 오디오 생성 — 빌드 타임 1회 실행용.
 * OpenAI TTS(gpt-4o-mini-tts)로 글자/패턴별 소리를 원어민 교사 시범처럼 만들어
 * public/content/sound/<key>.mp3 저장. 런타임 API 호출/키 노출 없음.
 * 파일명은 콘텐츠의 group key와 동일해야 한다(sayLetter가 content/sound/<key>.mp3 재생).
 *
 * 카테고리별 소리 단서(cue):
 *  - 단일 자음: 순수 음가(파열음은 모음 붙임: buh/kuh, 지속음은 길게: ssss)
 *  - 단모음/매직e word family: 라임 자체(at, ig, ake, one …)
 *  - 장모음 팀: 모음 소리(eee, oh, ay, eye …)
 *  - 블렌드: 두 자음 결합음(fr, st, sp …)  ← TTS가 글자이름으로 읽으면 튜닝 필요
 *  - 이중자음(digraph): 디그래프 소리(ch, sh, th … / ph=fff, ck=kuh, wr=rrrr, kn=nnnn)
 *  - 이중모음/모음팀: 모음 소리(oy, ow, aw, oo, ooo …)
 *  - r통제: ar, or, er
 *  - _end1/_end2(끝소리 복습)는 단일 소리가 아니라 제외 → 앱에서 단어로 폴백
 *
 * 실행 (cmd):        set OPENAI_API_KEY=sk-...   &&  node scripts/gen-phonemes.mjs
 * 실행 (PowerShell): $env:OPENAI_API_KEY="sk-..." ;  node scripts/gen-phonemes.mjs
 * 강제 재생성:       node scripts/gen-phonemes.mjs --force
 * 음성 바꾸기:       set OPENAI_TTS_VOICE=nova   (coral/nova/sage/alloy/ash/ballad/verse ...)
 */
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY 환경변수가 필요합니다.'); process.exit(1); }
const FORCE = process.argv.includes('--force');

// key → { cue: TTS가 읽을 발음 단서, word: 지시문 맥락용 예시 단어 }
const SOUNDS = {
  // ── 1~3권 단일 자음 (기존; 파일 있으면 skip) ──
  s:{cue:'ssss',word:'sun'},   t:{cue:'tuh',word:'tiger'},  b:{cue:'buh',word:'ball'},
  h:{cue:'huh',word:'hat'},    m:{cue:'mmmm',word:'mouse'}, k:{cue:'kuh',word:'koala'},
  j:{cue:'juh',word:'jaguar'}, f:{cue:'ffff',word:'fox'},   g:{cue:'guh',word:'goat'},
  l:{cue:'llll',word:'lion'},  d:{cue:'duh',word:'dog'},    n:{cue:'nnnn',word:'newt'},
  w:{cue:'wuh',word:'wolf'},   c:{cue:'kuh',word:'cat'},    r:{cue:'rrrr',word:'rabbit'},

  // ── 4권 단일 자음 ──
  p:{cue:'puh',word:'penguin'}, q:{cue:'kwuh',word:'queen'}, v:{cue:'vvvv',word:'vulture'},
  y:{cue:'yuh',word:'yak'},     z:{cue:'zzzz',word:'zebra'},

  // ── 단모음 word family (라임) ──
  '-at':{cue:'at',word:'cat'},   '-an':{cue:'an',word:'van'},   '-ad':{cue:'ad',word:'dad'},   '-ap':{cue:'ap',word:'cap'},
  '-ig':{cue:'ig',word:'pig'},   '-it':{cue:'it',word:'sit'},   '-ill':{cue:'ill',word:'hill'},'-in':{cue:'in',word:'pin'},
  '-un':{cue:'un',word:'sun'},   '-ug':{cue:'ug',word:'bug'},   '-ut':{cue:'ut',word:'nut'},   '-ub':{cue:'ub',word:'tub'},
  '-og':{cue:'og',word:'log'},   '-ox':{cue:'ox',word:'box'},   '-ot':{cue:'ot',word:'pot'},   '-op':{cue:'op',word:'mop'},
  '-et':{cue:'et',word:'net'},   '-en':{cue:'en',word:'pen'},   '-ell':{cue:'ell',word:'shell'},'-ed':{cue:'ed',word:'bed'},

  // ── 매직-e · 장모음 family (라임) ──
  '-ake':{cue:'ake',word:'snake'}, '-ate':{cue:'ate',word:'gate'}, '-ame':{cue:'ame',word:'game'}, '-ace':{cue:'ace',word:'space'},
  '-ike':{cue:'ike',word:'bike'},  '-ide':{cue:'ide',word:'slide'},'-ime':{cue:'ime',word:'lime'}, '-ive':{cue:'ive',word:'five'},
  '-ule':{cue:'ule',word:'mule'},  '-ube':{cue:'ube',word:'cube'}, '-une':{cue:'une',word:'tune'}, '-ure':{cue:'ure',word:'cure'},
  '-ute':{cue:'ute',word:'flute'}, '-ole':{cue:'ole',word:'hole'}, '-ose':{cue:'ose',word:'rose'}, '-ope':{cue:'ope',word:'rope'},
  '-one':{cue:'one',word:'bone'},

  // ── 장모음 팀 ──
  '-ee':{cue:'eee',word:'bee'},  '-eep':{cue:'eep',word:'sheep'}, '-eed':{cue:'eed',word:'seed'}, '-eel':{cue:'eel',word:'wheel'},
  '-ay':{cue:'ay',word:'hay'},   '-ai':{cue:'ay',word:'train'},   'open_a':{cue:'ay',word:'baby'},
  '-igh':{cue:'eye',word:'light'},'-ie':{cue:'eye',word:'pie'},    'open_i':{cue:'eye',word:'spider'},
  '-oa':{cue:'oh',word:'boat'},  '-ow':{cue:'oh',word:'snow'},    '-oe':{cue:'oh',word:'toe'},   'open_o':{cue:'oh',word:'robot'},
  '-ea':{cue:'eee',word:'leaf'}, 'open_e':{cue:'eee',word:'me'},

  // ── 블렌드 ──
  'fr':{cue:'fr',word:'frog'}, 'gr':{cue:'gr',word:'grapes'}, 'br':{cue:'br',word:'bread'}, 'pr':{cue:'pr',word:'pretzel'},
  'fl':{cue:'fl',word:'flower'},'gl':{cue:'gl',word:'glove'}, 'bl':{cue:'bl',word:'blue'},  'pl':{cue:'pl',word:'plane'},
  'sm':{cue:'sm',word:'smile'},'st':{cue:'st',word:'star'},  'sw':{cue:'sw',word:'swan'},  'sn':{cue:'sn',word:'snail'},
  'sl':{cue:'sl',word:'sled'}, 'sp':{cue:'sp',word:'spoon'},

  // ── 소프트 c · g ──
  'soft_c':{cue:'sss',word:'city'}, 'soft_g':{cue:'juh',word:'giraffe'},

  // ── 이중자음(digraph) ──
  'ch_':{cue:'ch',word:'chick'}, '_ch':{cue:'ch',word:'peach'}, 'sh_':{cue:'sh',word:'ship'}, '_sh':{cue:'sh',word:'fish'},
  'th':{cue:'th',word:'thumb'},  'wh':{cue:'wh',word:'whale'},  'ph':{cue:'ffff',word:'photo'},'ng':{cue:'ng',word:'ring'},
  'ck':{cue:'kuh',word:'duck'},  'wr':{cue:'rrrr',word:'write'},'kn':{cue:'nnnn',word:'knife'},

  // ── 이중모음 · 모음팀 ──
  'oi_oy':{cue:'oy',word:'coin'}, 'ou_ow':{cue:'ow',word:'cow'}, 'au_aw':{cue:'aw',word:'paw'},
  'oo_short':{cue:'oo',word:'book'},'oo_ew':{cue:'ooo',word:'moon'},'ue_ui':{cue:'ooo',word:'juice'},
  'y_long_i':{cue:'eye',word:'fly'},'y_long_e':{cue:'eee',word:'candy'},

  // ── r 통제 모음 ──
  'ar':{cue:'ar',word:'shark'}, 'or':{cue:'or',word:'corn'}, 'ir_er_ur':{cue:'er',word:'bird'}
};

function instructionFor(word) {
  return [
    'You are a warm, friendly native English phonics teacher for a young child (age 5).',
    `Say the phonics sound written here clearly, gently and slowly, exactly once — the sound as heard in the word "${word}".`,
    'Do NOT spell it out and do NOT say any letter names; make only the sound. Encouraging, child-directed tone.'
  ].join(' ');
}

const MODEL = 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'coral';
const outDir = path.resolve('public/content/sound');
fs.mkdirSync(outDir, { recursive: true });

let ok = 0, skip = 0, fail = 0;
for (const [key, { cue, word }] of Object.entries(SOUNDS)) {
  const outPath = path.join(outDir, `${key}.mp3`);
  if (!FORCE && fs.existsSync(outPath)) { skip++; continue; }
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: cue, instructions: instructionFor(word), response_format: 'mp3' })
    });
    if (!res.ok) { console.error(`✗ ${key}: ${res.status} ${await res.text()}`); fail++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    console.log(`✓ ${key}.mp3  (cue "${cue}", as in ${word}, ${buf.length} bytes)`);
    ok++;
    await new Promise((r) => setTimeout(r, 150)); // 레이트리밋 여유
  } catch (e) { console.error(`✗ ${key}:`, e.message); fail++; }
}
console.log(`\n완료: 생성 ${ok} · 건너뜀 ${skip} · 실패 ${fail} → ${outDir}  (voice: ${VOICE})`);
console.log('블렌드(fr·st…)/디그래프가 글자 이름처럼 들리면 해당 key의 cue를 조정(예: fr→"fruh")하고 --force로 다시 실행하세요.');
