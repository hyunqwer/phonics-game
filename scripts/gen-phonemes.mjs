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
 * cue 확인만:        node scripts/gen-phonemes.mjs --plan
 * 전체 강제 재생성:  node scripts/gen-phonemes.mjs --force --backup
 * 일부만 재생성:     node scripts/gen-phonemes.mjs --only bl,c,d,fl,fr,gl,ng,sl,sm,sn,st,sw,th --force
 * 음성 바꾸기:       set OPENAI_TTS_VOICE=nova   (coral/nova/sage/alloy/ash/ballad/verse ...)
 */
import fs from 'node:fs';
import path from 'node:path';

function readArg(name, fallback = '') {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

const FORCE = process.argv.includes('--force');
const PLAN = process.argv.includes('--plan') || process.argv.includes('--dry-run');
const BACKUP = process.argv.includes('--backup');
const ONLY_VALUE = readArg('--only');
const ONLY = ONLY_VALUE
  ? new Set(ONLY_VALUE.split(',').map((key) => key.trim()).filter(Boolean))
  : null;
const RATE_MS = Number(readArg('--rate-ms', '150'));

// key → { cue: TTS가 읽을 발음 단서, word: 지시문 맥락용 예시 단어 }
const SOUNDS = {
  // ── 1~3권 단일 자음 (기존; 파일 있으면 skip) ──
  s:{cue:'suh',word:'sun',type:'consonant',hint:'Keep it short; do not sustain a long hissing sound.'},   t:{cue:'tuh',word:'tiger',type:'stop'},  b:{cue:'buh',word:'ball',type:'stop'},
  h:{cue:'huh',word:'hat',type:'consonant'},    m:{cue:'muh',word:'mouse',type:'consonant',hint:'Make the /m/ sound clearly audible; do not make it too soft.'}, k:{cue:'kuh',word:'koala',type:'stop'},
  j:{cue:'juh',word:'jaguar',type:'stop'}, f:{cue:'fuh',word:'fox',type:'consonant',hint:'Keep it short; do not sustain f for a long time.'},   g:{cue:'guh',word:'goat',type:'stop'},
  l:{cue:'llll',word:'lion',type:'consonant'},  d:{cue:'duh',word:'dog',type:'stop',hint:'Make the initial /d/ sound audible and clear; do not make it silent.'},    n:{cue:'nnnn',word:'newt',type:'consonant'},
  w:{cue:'wuh',word:'wolf',type:'consonant'},   c:{cue:'kuh',word:'cat',type:'stop',hint:'Say it once only, not twice.'},    r:{cue:'ruh',word:'rabbit',type:'consonant',hint:'Keep it short; do not sustain r for a long time.'},

  // ── 4권 단일 자음 ──
  p:{cue:'puh',word:'penguin',type:'stop'}, q:{cue:'kwuh',word:'queen',type:'stop'}, v:{cue:'vvvv',word:'vulture',type:'consonant'},
  y:{cue:'yuh',word:'yak',type:'consonant'},     z:{cue:'zzzz',word:'zebra',type:'consonant'},

  // ── 단모음 word family (라임) ──
  '-at':{cue:'at',word:'cat',type:'rime'},   '-an':{cue:'an',word:'van',type:'rime'},   '-ad':{cue:'ad',word:'dad',type:'rime'},   '-ap':{cue:'ap',word:'cap',type:'rime'},
  '-ig':{cue:'ig',word:'pig',type:'rime'},   '-it':{cue:'it',word:'sit',type:'rime'},   '-ill':{cue:'ill',word:'hill',type:'rime'},'-in':{cue:'in',word:'pin',type:'rime'},
  '-un':{cue:'un',word:'sun',type:'rime'},   '-ug':{cue:'ug',word:'bug',type:'rime'},   '-ut':{cue:'ut',word:'nut',type:'rime'},   '-ub':{cue:'ub',word:'tub',type:'rime'},
  '-og':{cue:'og',word:'log',type:'rime'},   '-ox':{cue:'ox',word:'box',type:'rime'},   '-ot':{cue:'ot',word:'pot',type:'rime'},   '-op':{cue:'op',word:'mop',type:'rime'},
  '-et':{cue:'et',word:'net',type:'rime'},   '-en':{cue:'en',word:'pen',type:'rime'},   '-ell':{cue:'ell',word:'shell',type:'rime'},'-ed':{cue:'ed',word:'bed',type:'rime'},

  // ── 매직-e · 장모음 family (라임) ──
  '-ake':{cue:'ake',word:'snake',type:'rime'}, '-ate':{cue:'ate',word:'gate',type:'rime'}, '-ame':{cue:'ame',word:'game',type:'rime'}, '-ace':{cue:'ace',word:'space',type:'rime'},
  '-ike':{cue:'ike',word:'bike',type:'rime'},  '-ide':{cue:'ide',word:'slide',type:'rime'},'-ime':{cue:'ime',word:'lime',type:'rime'}, '-ive':{cue:'ive',word:'five',type:'rime'},
  '-ule':{cue:'ule',word:'mule',type:'rime'},  '-ube':{cue:'yoob',word:'tube',type:'rime',hint:'This is the rime sound in tube: /yoob/. Do not say "urb" or "ulb".'}, '-une':{cue:'une',word:'tune',type:'rime'}, '-ure':{cue:'ure',word:'cure',type:'rime'},
  '-ute':{cue:'ute',word:'flute',type:'rime'}, '-ole':{cue:'ole',word:'hole',type:'rime'}, '-ose':{cue:'ose',word:'rose',type:'rime'}, '-ope':{cue:'ope',word:'rope',type:'rime'},
  '-one':{cue:'own',word:'bone',type:'rime',hint:'This is the rime sound in bone: /own/, not the word "one".'},

  // ── 장모음 팀 ──
  '-ee':{cue:'eee',word:'bee',type:'vowelTeam'},  '-eep':{cue:'eep',word:'sheep',type:'rime'}, '-eed':{cue:'eed',word:'seed',type:'rime'}, '-eel':{cue:'eel',word:'wheel',type:'rime'},
  '-ay':{cue:'ay',word:'hay',type:'vowelTeam'},   '-ai':{cue:'ay',word:'train',type:'vowelTeam'},   'open_a':{cue:'ay',word:'baby',type:'vowelTeam',hint:'Say only the long A vowel /ay/ as in baby. Do not say the words "open A".'},
  '-igh':{cue:'eye',word:'light',type:'vowelTeam'},'-ie':{cue:'eye',word:'pie',type:'vowelTeam'},    'open_i':{cue:'eye',word:'spider',type:'vowelTeam',hint:'Say only the long I vowel /eye/ as in spider. Do not say the words "open I".'},
  '-oa':{cue:'oh',word:'boat',type:'vowelTeam'},  '-ow':{cue:'oh',word:'snow',type:'vowelTeam'},    '-oe':{cue:'oh',word:'toe',type:'vowelTeam'},   'open_o':{cue:'oh',word:'robot',type:'vowelTeam',hint:'Say only the long O vowel /oh/ as in robot. Do not say the words "open O".'},
  '-ea':{cue:'eee',word:'leaf',type:'vowelTeam'}, 'open_e':{cue:'ee',word:'me',type:'vowelTeam',hint:'Say only the long E vowel /ee/ as in me. Do not say the words "open E".'},

  // ── 블렌드 ──
  'fr':{cue:'fruh',word:'frog',type:'blend'}, 'gr':{cue:'gruh',word:'grapes',type:'blend'}, 'br':{cue:'bruh',word:'bread',type:'blend'}, 'pr':{cue:'pruh',word:'pretzel',type:'blend'},
  'fl':{cue:'fluh',word:'flower',type:'blend'},'gl':{cue:'gluh',word:'glove',type:'blend'}, 'bl':{cue:'bluh',word:'blue',type:'blend'},  'pl':{cue:'pluh',word:'plane',type:'blend'},
  'sm':{cue:'smuh',word:'smile',type:'blend'},'st':{cue:'stuh',word:'star',type:'blend'},  'sw':{cue:'swuh',word:'swan',type:'blend'},  'sn':{cue:'snuh',word:'snail',type:'blend'},
  'sl':{cue:'sluh',word:'sled',type:'blend'}, 'sp':{cue:'spuh',word:'spoon',type:'blend'},

  // ── 소프트 c · g ──
  'soft_c':{cue:'suh',word:'city',type:'consonant',hint:'Make the soft c /s/ sound clearly audible and short.'}, 'soft_g':{cue:'juh',word:'giraffe',type:'stop'},

  // ── 이중자음(digraph) ──
  'ch_':{cue:'chuh',word:'chick',type:'digraph'}, '_ch':{cue:'chuh',word:'peach',type:'digraph'}, 'sh_':{cue:'shuh',word:'ship',type:'digraph'}, '_sh':{cue:'shuh',word:'fish',type:'digraph',hint:'Make the /sh/ sound clearly audible; do not make it silent.'},
  'th':{cue:'thuh',word:'thumb',type:'digraph',hint:'Make the unvoiced /th/ sound clearly audible, like thumb. Do not say T H.'},  'wh':{cue:'whuh',word:'whale',type:'digraph'},  'ph':{cue:'fuh',word:'photo',type:'digraph',hint:'Keep it short; ph sounds like /f/ but should not be long.'},'ng':{cue:'ung',word:'ring',type:'digraph',hint:'Say the ending nasal sound from ring, like /ung/. Do not say N G, en-gay, or en-gee.'},
  'ck':{cue:'kuh',word:'duck',type:'digraph'},  'wr':{cue:'rrrr',word:'write',type:'digraph'},'kn':{cue:'nnnn',word:'knife',type:'digraph'},

  // ── 이중모음 · 모음팀 ──
  'oi_oy':{cue:'oy',word:'coin',type:'vowelTeam'}, 'ou_ow':{cue:'ow',word:'cow',type:'vowelTeam'}, 'au_aw':{cue:'aw',word:'paw',type:'vowelTeam'},
  'oo_short':{cue:'oo',word:'book',type:'vowelTeam'},'oo_ew':{cue:'ooo',word:'moon',type:'vowelTeam'},'ue_ui':{cue:'ooo',word:'juice',type:'vowelTeam'},
  'y_long_i':{cue:'eye',word:'fly',type:'vowelTeam'},'y_long_e':{cue:'eee',word:'candy',type:'vowelTeam'},

  // ── r 통제 모음 ──
  'ar':{cue:'arr',word:'shark',type:'rControlled',hint:'Make the /ar/ sound clearly audible, like in shark.'}, 'or':{cue:'or',word:'corn',type:'rControlled'}, 'ir_er_ur':{cue:'er',word:'bird',type:'rControlled'}
};

function instructionFor({ key, cue, word, type, hint = '' }) {
  const common = [
    'You are a warm, friendly native English phonics teacher for a young child (age 5).',
    `Cue text: "${cue}". Example word: "${word}".`,
    `Say the target phonics sound clearly, gently and slowly, exactly once, as heard in the word "${word}".`,
    'Do NOT spell it out and do NOT say any letter names; make only the sound.',
    'Do NOT say the example word. Do NOT add explanations, labels, or praise.'
  ];
  const typed = {
    stop: 'For stop consonants, a tiny child-friendly schwa is okay, but keep it short and crisp.',
    consonant: 'For continuant consonants, sustain the sound very briefly and naturally.',
    rime: 'For word-family rimes, say the rime chunk only, not the full example word.',
    vowelTeam: 'For vowel teams and long vowel patterns, say the vowel sound only.',
    blend: 'For consonant blends, say one smooth blended phonics sound with a tiny schwa if needed; never pronounce separate letter names.',
    digraph: 'For digraphs, say the combined digraph sound only; never pronounce separate letter names.',
    rControlled: 'For r-controlled vowels, say the combined vowel-r sound only.'
  }[type] || '';
  return [
    ...common,
    typed,
    key === 'c' ? 'For c, say one short /k/ sound like the beginning of cat; do not repeat it.' : '',
    key === 'th' ? 'For th, use the soft unvoiced /th/ sound from thumb, not the letter names T H.' : '',
    key === 'ng' ? 'For ng, use the ending sound from ring, not the letter names N G.' : '',
    hint,
    'Voice style: friendly, clean, close-mic teacher voice for a child.'
  ].join(' ');
}

const MODEL = 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'coral';
const outDir = path.resolve('public/content/sound');
fs.mkdirSync(outDir, { recursive: true });

if (ONLY) {
  const unknown = [...ONLY].filter((key) => !Object.hasOwn(SOUNDS, key));
  if (unknown.length) {
    console.error(`알 수 없는 --only key: ${unknown.join(', ')}`);
    console.error(`사용 가능한 key: ${Object.keys(SOUNDS).join(', ')}`);
    process.exit(1);
  }
}

const entries = Object.entries(SOUNDS).filter(([key]) => !ONLY || ONLY.has(key));

if (PLAN) {
  console.log(`대상 ${entries.length}개 / 전체 ${Object.keys(SOUNDS).length}개`);
  for (const [key, sound] of entries) {
    console.log(`${key.padEnd(10)} cue=${String(sound.cue).padEnd(8)} type=${String(sound.type).padEnd(12)} word=${sound.word}`);
  }
  process.exit(0);
}

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('OPENAI_API_KEY 환경변수가 필요합니다. cmd에서 set OPENAI_API_KEY=sk-... 후 실행하세요.'); process.exit(1); }

let backupDir = null;
if (BACKUP) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  backupDir = path.resolve('source_assets/phoneme-sound-backups', stamp);
  fs.mkdirSync(backupDir, { recursive: true });
}

let ok = 0, skip = 0, fail = 0;
for (const [key, sound] of entries) {
  const { cue, word } = sound;
  const outPath = path.join(outDir, `${key}.mp3`);
  if (!FORCE && fs.existsSync(outPath)) { skip++; continue; }
  try {
    if (backupDir && fs.existsSync(outPath)) {
      fs.copyFileSync(outPath, path.join(backupDir, `${key}.mp3`));
    }
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, voice: VOICE, input: cue, instructions: instructionFor({ key, ...sound }), response_format: 'mp3' })
    });
    if (!res.ok) { console.error(`✗ ${key}: ${res.status} ${await res.text()}`); fail++; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    console.log(`✓ ${key}.mp3  (cue "${cue}", type ${sound.type}, as in ${word}, ${buf.length} bytes)`);
    ok++;
    await new Promise((r) => setTimeout(r, RATE_MS)); // 레이트리밋 여유
  } catch (e) { console.error(`✗ ${key}:`, e.message); fail++; }
}
console.log(`\n완료: 생성 ${ok} · 건너뜀 ${skip} · 실패 ${fail} → ${outDir}  (voice: ${VOICE})`);
if (backupDir) console.log(`백업: ${backupDir}`);
console.log('블렌드(fr·st…)/디그래프가 글자 이름처럼 들리면 해당 key의 cue를 조정하고 --only <key> --force로 다시 실행하세요.');
