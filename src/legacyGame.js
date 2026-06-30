import { villageTheme, gameCopy } from './copy.js';

/* =====================================================================
   CONTENT DATA (엔진과 분리 — 다른 권/음가는 이 객체만 채우면 됨)
   ===================================================================== */
let WORLDS = {
  s:{phoneme:"/s/",letter:"S s",character:"Sammy the Seal",kr:"새미 물개",emoji:"🦭",locked:false,
     words:[{w:"sun",emo:"☀️"},{w:"soap",emo:"🧼"},{w:"seal",emo:"🦭"},{w:"sand",emo:"🏖️"},{w:"six",emo:"6️⃣"},{w:"sock",emo:"🧦"}],
     distractors:[{w:"tiger",emo:"🐯"},{w:"toy",emo:"🧸"},{w:"bear",emo:"🐻"},{w:"ball",emo:"⚽"},{w:"hat",emo:"🎩"},{w:"moon",emo:"🌙"},{w:"map",emo:"🗺️"},{w:"monkey",emo:"🐵"}]},
  t:{phoneme:"/t/",letter:"T t",character:"Timmy the Tiger",kr:"티미 호랑이",emoji:"🐯",locked:false,
     words:[{w:"tiger",emo:"🐯"},{w:"ten",emo:"🔟"},{w:"tent",emo:"⛺"},{w:"tie",emo:"👔"},{w:"toy",emo:"🧸"},{w:"talk",emo:"🗣️"}],
     distractors:[{w:"sun",emo:"☀️"},{w:"seal",emo:"🦭"},{w:"ball",emo:"⚽"},{w:"bear",emo:"🐻"},{w:"hat",emo:"🎩"},{w:"horse",emo:"🐴"},{w:"milk",emo:"🥛"},{w:"moon",emo:"🌙"}]},
  b:{phoneme:"/b/",letter:"B b",character:"Bobby the Bear",kr:"바비 곰",emoji:"🐻",locked:false,
     words:[{w:"ball",emo:"⚽"},{w:"bear",emo:"🐻"},{w:"bed",emo:"🛏️"},{w:"bell",emo:"🔔"},{w:"book",emo:"📖"},{w:"box",emo:"📦"}],
     distractors:[{w:"sun",emo:"☀️"},{w:"sock",emo:"🧦"},{w:"tiger",emo:"🐯"},{w:"tie",emo:"👔"},{w:"hand",emo:"✋"},{w:"hen",emo:"🐔"},{w:"map",emo:"🗺️"},{w:"mouse",emo:"🐭"}]},
  h:{phoneme:"/h/",letter:"H h",character:"Henry the Hog",kr:"헨리 돼지",emoji:"🐷",locked:false,
     words:[{w:"hand",emo:"✋"},{w:"hat",emo:"🎩"},{w:"hen",emo:"🐔"},{w:"horse",emo:"🐴"},{w:"house",emo:"🏠"},{w:"happy",emo:"😊"}],
     distractors:[{w:"soap",emo:"🧼"},{w:"six",emo:"6️⃣"},{w:"ten",emo:"🔟"},{w:"toy",emo:"🧸"},{w:"ball",emo:"⚽"},{w:"book",emo:"📖"},{w:"money",emo:"💰"},{w:"monkey",emo:"🐵"}]},
  m:{phoneme:"/m/",letter:"M m",character:"Mindy the Mouse",kr:"민디 쥐",emoji:"🐭",locked:false,
     words:[{w:"map",emo:"🗺️"},{w:"milk",emo:"🥛"},{w:"money",emo:"💰"},{w:"monkey",emo:"🐵"},{w:"moon",emo:"🌙"},{w:"mouse",emo:"🐭"}],
     distractors:[{w:"seal",emo:"🦭"},{w:"sand",emo:"🏖️"},{w:"tent",emo:"⛺"},{w:"tiger",emo:"🐯"},{w:"bear",emo:"🐻"},{w:"bell",emo:"🔔"},{w:"hat",emo:"🎩"},{w:"house",emo:"🏠"}]}
};
let CUR="s"; // set from SAVE after load()
const POOL=()=>WORLDS[CUR];
let homeView="map"; // 'map' = 모험 지도, 'mission' = 오늘의 미션 랜딩

const CONTENT_BOOKS_TO_LOAD=[1,2,3];
let CONTENT_INDEX=null;
let COLLECTION_BOOKS=[];
const WORLD_META={
  s:{phoneme:"/s/",letter:"S s",character:"Sammy the Seal",kr:"새미 물개",emoji:"🦭"},
  t:{phoneme:"/t/",letter:"T t",character:"Timmy the Tiger",kr:"티미 호랑이",emoji:"🐯"},
  b:{phoneme:"/b/",letter:"B b",character:"Bobby the Bear",kr:"바비 곰",emoji:"🐻"},
  h:{phoneme:"/h/",letter:"H h",character:"Henry the Hog",kr:"헨리 돼지",emoji:"🐷"},
  m:{phoneme:"/m/",letter:"M m",character:"Mindy the Mouse",kr:"민디 쥐",emoji:"🐭"},
  k:{phoneme:"/k/",letter:"K k",character:"Koko the Koala",kr:"코코 코알라",emoji:"🐨"},
  j:{phoneme:"/j/",letter:"J j",character:"Jimmy the Jaguar",kr:"지미 재규어",emoji:"🐆"},
  f:{phoneme:"/f/",letter:"F f",character:"Finn the Fox",kr:"핀 여우",emoji:"🦊"},
  g:{phoneme:"/g/",letter:"G g",character:"Gus the Goat",kr:"거스 염소",emoji:"🐐"},
  l:{phoneme:"/l/",letter:"L l",character:"Leo the Lion",kr:"레오 사자",emoji:"🦁"},
  d:{phoneme:"/d/",letter:"D d",character:"Danny the Dog",kr:"대니 강아지",emoji:"🐶"},
  n:{phoneme:"/n/",letter:"N n",character:"Nina the Newt",kr:"니나 도롱뇽",emoji:"🦎"},
  w:{phoneme:"/w/",letter:"W w",character:"Willy the Wolf",kr:"윌리 늑대",emoji:"🐺"},
  c:{phoneme:"/c/",letter:"C c",character:"Cathy the Cat",kr:"캐시 고양이",emoji:"🐱"},
  r:{phoneme:"/r/",letter:"R r",character:"Robby the Rabbit",kr:"로비 토끼",emoji:"🐰"}
};
const WORD_EMOJI={
  sad:"😢",sand:"🏖️",salt:"🧂",same:"👯",seal:"🦭",sink:"🚰",six:"6️⃣",soap:"🧼",sock:"🧦",sun:"☀️",
  table:"🪑",tail:"🐕",talk:"🗣️",tape:"📼",ten:"🔟",tent:"⛺",tie:"👔",tiger:"🐯",toe:"🦶",toy:"🧸",
  bag:"👜",ball:"⚽",bat:"🦇",bear:"🐻",bed:"🛏️",bell:"🔔",big:"🔠",book:"📖",box:"📦",boy:"👦",
  hair:"💇",hand:"✋",happy:"😊",hat:"🎩",head:"🙂",hen:"🐔",hill:"⛰️",hop:"🦘",horse:"🐴",house:"🏠",
  man:"👨",many:"👥",map:"🗺️",mat:"🧘",milk:"🥛",money:"💰",monkey:"🐵",moon:"🌙",mop:"🧹",mouse:"🐭",
  ketchup:"🍅",key:"🔑",kick:"🦵",kid:"🧒",kind:"💛",king:"👑",kiss:"💋",kitchen:"🍳",kite:"🪁",kitten:"🐱",
  jacket:"🧥",jail:"🚓",jam:"🍓",jar:"🏺",jeans:"👖",jeep:"🚙",jet:"✈️",juice:"🧃",jump:"🦘",jungle:"🌴",
  family:"👨‍👩‍👧",fan:"🪭",farm:"🚜",fat:"🟠",father:"👨",finger:"☝️",fire:"🔥",fish:"🐟",five:"5️⃣",fox:"🦊",
  game:"🎮",gap:"↔️",garden:"🌷",gate:"🚪",girl:"👧",give:"🎁",go:"➡️",goat:"🐐",gold:"🥇",gum:"🍬",
  lake:"🏞️",lamp:"💡",laugh:"😆",leaf:"🍃",letter:"✉️",lion:"🦁",little:"🤏",lock:"🔒",log:"🪵",lunch:"🍱",
  dark:"🌑",deer:"🦌",desk:"🪑",dish:"🍽️",doctor:"🧑‍⚕️",dog:"🐶",doll:"🪆",dolphin:"🐬",door:"🚪",duck:"🦆",
  name:"🏷️",neck:"🧣",net:"🥅",new:"🆕",night:"🌙",nine:"9️⃣",nose:"👃",number:"🔢",nurse:"👩‍⚕️",nut:"🥜",
  wagon:"🛒",wall:"🧱",watch:"⌚",water:"💧",wind:"💨",window:"🪟",wing:"🪽",winter:"❄️",wolf:"🐺",woman:"👩",
  cake:"🍰",call:"📞",can:"🥫",candy:"🍬",car:"🚗",cat:"🐱",cold:"🥶",cow:"🐄",cup:"🥤",cut:"✂️",
  rabbit:"🐰",rat:"🐀",read:"📖",red:"🔴",ring:"💍",river:"🏞️",rock:"🪨",rope:"🪢",rose:"🌹",run:"🏃"
};
function contentWordItem(word){return {w:word,emo:WORD_EMOJI[word]||"🔤"};}
function groupsFromBook(book){return (book.units||[]).flatMap(u=>(u.groups||[]).map(g=>Object.assign({book:book.book,step:book.step,bookTitle:book.title,category:book.category,focus:u.focus,lesson:u.lesson,pages:u.pages},g)));}
function buildWorldsFromBooks(books){
  const groups=books.flatMap(groupsFromBook).filter(g=>g.key&&g.words&&g.words.length);
  if(!groups.length)return null;
  const allWords=groups.flatMap(g=>g.words);
  const next={};
  groups.forEach(g=>{
    const meta=WORLD_META[g.key]||{phoneme:"/"+g.key.replaceAll("_","/")+"/",letter:g.key.toUpperCase(),character:"Phonics "+g.key.toUpperCase(),kr:"",emoji:"🔤"};
    const other=allWords.filter(w=>!g.words.includes(w));
    next[g.key]=Object.assign({},meta,{
      locked:false,
      words:g.words.map(contentWordItem),
      distractors:shuffle(other).slice(0,12).map(contentWordItem),
      source:{book:g.book,step:g.step,key:g.key}
    });
  });
  return next;
}
function groupMeta(key){
  return WORLD_META[key]||{phoneme:"/"+key.replaceAll("_","/").replaceAll("-","")+"/",letter:key.toUpperCase(),character:"Phonics "+key.toUpperCase(),kr:"",emoji:"🔤"};
}
function collectionGroups(){
  if(COLLECTION_BOOKS.length)return COLLECTION_BOOKS.flatMap(groupsFromBook).filter(g=>g.key&&g.words&&g.words.length);
  return Object.keys(WORLDS).map(k=>Object.assign({},WORLDS[k],{key:k,words:WORLDS[k].words.map(w=>w.w),book:WORLDS[k].source&&WORLDS[k].source.book,step:WORLDS[k].source&&WORLDS[k].source.step,bookTitle:""}));
}
function getCollectionState(){
  if(!SAVE.cards)SAVE.cards=[];
  const groups=collectionGroups();
  const activeBooks=new Set(CONTENT_BOOKS_TO_LOAD);
  let migrated=false;
  groups.forEach(g=>{if(activeBooks.has(g.book))g.words.forEach(w=>{if(SAVE.words.includes(w)){const id=cardId(g.book,g.key,w);if(!SAVE.cards.includes(id)){SAVE.cards.push(id);migrated=true;}}});});
  if(migrated)save();
  const bookSource=(CONTENT_INDEX&&CONTENT_INDEX.books)||[...new Map(groups.map(g=>[g.book,{book:g.book,step:g.step,title:g.bookTitle,wordCount:0,category:""}])).values()];
  const books=bookSource.map(book=>{
    const bookGroups=groups.filter(g=>g.book===book.book);
    const totalWords=bookGroups.reduce((sum,g)=>sum+g.words.length,0)||book.wordCount||0;
    const foundWords=bookGroups.reduce((sum,g)=>sum+g.words.filter(w=>hasCard(g.book,g.key,w)).length,0);
    const claimed=bookGroups.filter(g=>(SAVE.chestDone||{})[g.key]).length;
    const started=bookGroups.filter(g=>SAVE.chars.includes(g.key)||((SAVE.missionDone||{})[g.key]||[]).length>0).length;
    return {book:book.book,step:book.step,title:book.title,category:book.category,active:activeBooks.has(book.book),totalGates:bookGroups.length,totalWords,foundWords,claimed,started,soundFocus:book.soundFocus||bookGroups.map(g=>g.key)};
  });
  const sounds=groups.map(g=>{
    const meta=groupMeta(g.key), done=((SAVE.missionDone||{})[g.key]||[]), claimed=!!((SAVE.chestDone||{})[g.key]);
    return {key:g.key,book:g.book,step:g.step,lesson:g.lesson,pages:g.pages,focus:g.focus,phoneme:meta.phoneme,letter:meta.letter,character:meta.character,kr:meta.kr,emoji:meta.emoji,active:activeBooks.has(g.book),owned:SAVE.chars.includes(g.key),doneCount:done.length,claimed,wordCount:g.words.length};
  });
  const words=groups.flatMap(g=>g.words.map(word=>({w:word,emoji:(WORD_EMOJI[word]||"🔤"),book:g.book,step:g.step,key:g.key,cardId:cardId(g.book,g.key,word),got:hasCard(g.book,g.key,word)})));
  return {currentBook:SAVE.currentBook||SAVE.castleStartBook||1,books,sounds,words,totalBooks:bookSource.length,totalSounds:sounds.length,totalWords:words.length,foundWords:words.filter(w=>w.got).length};
}
function normalizeCurrentWorld(){
  if(!WORLDS[CUR]||WORLDS[CUR].locked)CUR=Object.keys(WORLDS).find(k=>!WORLDS[k].locked)||"s";
  if(!SAVE.curWorld||!WORLDS[SAVE.curWorld]||WORLDS[SAVE.curWorld].locked)SAVE.curWorld=CUR;
  if(WORLDS[SAVE.curWorld]&&!WORLDS[SAVE.curWorld].locked)CUR=SAVE.curWorld;
}
async function loadContentDb(){
  if(!window.fetch)return false;
  try{
    CONTENT_INDEX=await window.fetch("content/index.json").then(r=>{if(!r.ok)throw new Error("content index fetch failed");return r.json();});
    COLLECTION_BOOKS=await Promise.all((CONTENT_INDEX.books||[]).map(b=>window.fetch("content/"+b.file).then(r=>{if(!r.ok)throw new Error("content fetch failed");return r.json();})));
    const gameBooks=COLLECTION_BOOKS.filter(b=>CONTENT_BOOKS_TO_LOAD.includes(b.book));
    const next=buildWorldsFromBooks(gameBooks);
    if(next){WORLDS=next;normalizeCurrentWorld();return true;}
  }catch(e){console.warn("Using built-in fallback worlds.",e);}
  normalizeCurrentWorld();
  return false;
}

const GAMES=[
  {key:"bubble", name:"Bubble Pop",  emoji:"🫧",desc:"떠오르는 /s/ 친구를 팡!",run:()=>startBubble()},
  {key:"quiz",   name:"Quick Quiz",  emoji:"⚡",desc:"잘 듣고 빠르게 고르기",  run:()=>startQuiz()},
  {key:"mole",   name:"Whack-a-Word",  emoji:"🔨",desc:"튀어나온 /s/만 두드려",  run:()=>startMole()},
  {key:"runner", name:"Sound Run",emoji:"🏃",desc:"레인 바꿔 코인 줍고 피하기",run:()=>startRunner()},
  {key:"shooter",name:"Sound Shooter",  emoji:"🚀",desc:"/s/ 우주선을 격추!",     run:()=>startShooter()},
  {key:"jump",   name:"Lava Jump",  emoji:"🪜",desc:"용암 피해 /s/ 발판으로!",run:()=>startJump()},
  {key:"memory", name:"Memory Match",emoji:"🃏",desc:"같은 짝을 기억해 맞춰요",run:()=>startMemory()},
  {key:"hunt",   name:"Word Hunt",   emoji:"🔭",desc:"듣고 숨은 단어를 찾아요",run:()=>startHunt()},
  {key:"spray",  name:"Bug Spray",   emoji:"🦟",desc:"/s/ 모기만 스프레이로!",run:()=>startSpray()},
  {key:"catch",  name:"Word Catch",  emoji:"🧺",desc:"바구니로 /s/ 단어 받기",run:()=>startCatch()}
];

const ITEMS=[
  {id:"hat",e:"🎩",slot:"hat",price:20},{id:"crown",e:"👑",slot:"hat",price:60},
  {id:"glass",e:"🕶️",slot:"glass",price:30},{id:"bow",e:"🎀",slot:"hat",price:25},
  {id:"scarf",e:"🧣",slot:"neck",price:35},{id:"halo",e:"⭐",slot:"halo",price:80}
];

/* =====================================================================
   SAVE
   ===================================================================== */
const DEFAULT={pearls:0,streak:0,lastStamp:null,owned:[],equipped:{},words:[],cards:[],chars:["s"],
  missionDate:null,missions:{},missionDone:{},chestDone:{},playedToday:[],xp:0,best:{},curWorld:"s",muted:false,castleStartBook:null,currentBook:null};
let SAVE=load();
if(SAVE.curWorld&&WORLDS[SAVE.curWorld]&&!WORLDS[SAVE.curWorld].locked)CUR=SAVE.curWorld;
function load(){try{const r=localStorage.getItem("soripang");if(r)return Object.assign({},JSON.parse(JSON.stringify(DEFAULT)),JSON.parse(r));}catch(e){}return JSON.parse(JSON.stringify(DEFAULT));}
function save(){try{localStorage.setItem("soripang",JSON.stringify(SAVE));}catch(e){}}
function today(){return new Date().toISOString().slice(0,10);}

/* =====================================================================
   HELPERS
   ===================================================================== */
function $(id){return document.getElementById(id);}
function cardId(book,key,word){return [book||"x",key||"x",word].join(":");}
function currentCardId(word){const w=WORLDS[CUR]||{};return cardId(w.source&&w.source.book,CUR,word);}
function hasCard(book,key,word){return (SAVE.cards||[]).includes(cardId(book,key,word));}
function emitNavigate(id){try{window.dispatchEvent(new CustomEvent('ypq:navigate',{detail:{screen:id}}));}catch(e){}}
function emitCastleState(){try{window.dispatchEvent(new CustomEvent('ypq:state',{detail:getCastleHomeState()}));}catch(e){}}
function go(id){if(id==='home')homeView=getLaunchRoute();document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');stopGame();emitNavigate(id);
  if(id==='home')renderHome();if(id==='shop')renderShop();if(id==='dex')renderDex();if(id==='freeplay')renderFree();
  if(id==='chest'){chestTaps=0;$('chestBig').style.display='block';$('chestBig').classList.remove('shaking');$('chestBig').style.filter='';$('chestHint').style.display='block';$('chestHint').textContent='Tap to open!';$('chestReward').style.display='none';$('chestRewardMsg').style.display='none';$('chestDone').style.display='none';}}
function go2(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');emitNavigate(id);}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function lvl(){return Math.floor(SAVE.xp/50)+1;}

const WORD_AUDIO_BASE="https://app.yoons.com/smartbefly/contents/word/"; // 단어 mp3 (소문자.mp3)
let _wa=null;
function say(t,opt){opt=opt||{};if(SAVE.muted)return;
  const w=String(t).toLowerCase().trim();
  try{ if(_wa){_wa.pause();_wa.currentTime=0;}
    _wa=new Audio(WORD_AUDIO_BASE+encodeURIComponent(w)+".mp3");
    const p=_wa.play();
    if(p&&p.catch)p.catch(()=>ttsSay(t,opt)); // mp3 없거나 차단 시 TTS로 대체
  }catch(e){ttsSay(t,opt);}}
function ttsSay(t,opt){opt=opt||{};if(SAVE.muted)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=opt.rate||0.95;u.pitch=opt.pitch||1.25;speechSynthesis.speak(u);}catch(e){}}
/* 단어 발음을 끝까지 들려준 뒤 콜백 (겹침 방지: 정답음 → 다음 단어음 순차) */
function sayThen(t,cb){if(SAVE.muted){if(cb)cb();return;}
  const w=String(t).toLowerCase().trim();let done=false;const go=()=>{if(done)return;done=true;if(cb)cb();};
  try{ if(_wa){_wa.pause();_wa.currentTime=0;}
    _wa=new Audio(WORD_AUDIO_BASE+encodeURIComponent(w)+".mp3");
    _wa.onended=go;
    const pr=_wa.play();
    if(pr&&pr.catch)pr.catch(()=>{ttsSay(t);setTimeout(go,650);});
    setTimeout(go,1500); // 안전장치(onended 미발생 대비)
  }catch(e){ttsSay(t);setTimeout(go,650);}}
let _lw='',_lt=0;function sayHit(w){const n=Date.now();if(w===_lw&&n-_lt<300)return;_lw=w;_lt=n;say(w);}/* 1탭=1단어, 겹침/연속 방지 */
/* 글자 음가 재생: 미리 생성한 content/sound/<key>.mp3 → 없으면 예시 단어로 폴백 */
const SOUND_BASE="content/sound/";
function sayLetter(key){if(SAVE.muted)return;const w=WORLDS[key]||{};const fw=(w.words&&w.words[0]&&w.words[0].w)||'';
  try{ if(_wa){_wa.pause();_wa.currentTime=0;}
    _wa=new Audio(SOUND_BASE+encodeURIComponent(key)+".mp3");
    const p=_wa.play();
    if(p&&p.catch)p.catch(()=>{if(fw)say(fw);}); // 음가 파일 없거나 차단 시 단어로
  }catch(e){if(fw)say(fw);}}
function toggleMute(){SAVE.muted=!SAVE.muted;save();const b=$('muteBtn');if(b)b.textContent=SAVE.muted?'🔇':'🔊';if(SAVE.muted){try{speechSynthesis.cancel();}catch(e){}try{if(_wa)_wa.pause();}catch(e){}}}
let AC;
function actx(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;}
function tone(freq,dur,type,vol){if(SAVE.muted)return;const c=actx();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.value=freq;g.gain.value=vol||0.18;o.connect(g);g.connect(c.destination);const t=c.currentTime;o.start(t);g.gain.exponentialRampToValueAtTime(0.0001,t+(dur||0.15));o.stop(t+(dur||0.15));}
function sfxPop(){tone(520,0.12,'triangle',0.2);}
function sfxGood(){tone(660,0.1,'sine',0.2);setTimeout(()=>tone(880,0.14,'sine',0.2),90);}
function sfxBad(){tone(330,0.1,'square',0.1);setTimeout(()=>tone(196,0.16,'square',0.1),90);}
function sfxCombo(n){[523,659,784,1046].slice(0,Math.min(4,1+Math.floor(n/3))).forEach((f,i)=>setTimeout(()=>tone(f,0.12,'sine',0.2),i*70));}
function sfxChest(){[523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'triangle',0.2),i*90));}
/* --- P1 사운드/이펙트 시스템 --- */
function vibe(p){if(SAVE.muted)return;try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}
function uiClick(){tone(600,0.04,'square',0.07);}
function slide(f1,f2,dur,type,vol){if(SAVE.muted)return;const c=actx();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';const t=c.currentTime;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(1,f2),t+dur);g.gain.value=vol||0.18;o.connect(g);g.connect(c.destination);o.start(t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.stop(t+dur);}
function noise(dur,vol,freq){if(SAVE.muted)return;const c=actx();if(!c)return;const n=c.createBufferSource();const b=c.createBuffer(1,Math.max(1,Math.floor(c.sampleRate*dur)),c.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=freq||1200;const g=c.createGain();g.gain.value=vol||0.15;n.connect(f);f.connect(g);g.connect(c.destination);const t=c.currentTime;n.start(t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);n.stop(t+dur);}
function jingle(seq){seq.forEach(s=>setTimeout(()=>tone(s[0],s[2]||0.16,'triangle',0.2),s[1]));}
function fanfare(){jingle([[523,0,0.14],[659,110,0.14],[784,220,0.14],[1046,350,0.3]]);}
function winJingle(){jingle([[523,0,0.12],[784,110,0.12],[1046,230,0.22]]);}
function correctSfx(){const semis=Math.min(14,(G.combo-1));const p=Math.pow(2,semis/12);const k=G.key;
  if(k==='mole'){noise(0.07,0.18,800);tone(300*p,0.1,'square',0.14);}
  else if(k==='spray'){noise(0.12,0.16,1600);}
  else if(k==='runner'){tone(740*p,0.07,'sine',0.18);setTimeout(()=>tone(1050*p,0.1,'sine',0.15),55);}
  else if(k==='memory'){tone(660*p,0.1,'sine',0.18);setTimeout(()=>tone(990*p,0.12,'sine',0.15),80);}
  else if(k==='hunt'){tone(900*p,0.09,'sine',0.16);}
  else if(k==='jump'){slide(300*p,560*p,0.16,'triangle',0.2);}
  else if(k==='shooter'){slide(950*p,240,0.12,'square',0.12);}
  else if(k==='catch'){tone(520*p,0.1,'triangle',0.18);}
  else if(k==='quiz'){tone(620*p,0.08,'sine',0.18);setTimeout(()=>tone(930*p,0.1,'sine',0.15),60);}
  else{slide(440*p,720*p,0.14,'sine',0.2);}}
function burst(x,y){const cols=['#58cc02','#1cb0f6','#ffc800','#ff7a59','#ce82ff'];for(let i=0;i<7;i++){const s=document.createElement('div');s.className='spark';s.style.left=x+'px';s.style.top=y+'px';s.style.background=cols[i%cols.length];document.body.appendChild(s);const a=Math.random()*6.28,d=16+Math.random()*24;s.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.3)`,opacity:0}],{duration:420+Math.random()*200,easing:'ease-out'});setTimeout(()=>s.remove(),700);}}

function fxPop(x,y,txt){const e=document.createElement('div');e.className='fx';e.textContent=txt;e.style.left=x+'px';e.style.top=y+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),800);}
function fireworks(){const cols=['#ffc940','#ff7a59','#5ec576','#7a5bd6','#9be7ff'];for(let i=0;i<24;i++){const p=document.createElement('div');p.className='firework';const cx=innerWidth/2,cy=innerHeight*0.4;p.style.left=cx+'px';p.style.top=cy+'px';p.style.background=cols[i%cols.length];document.body.appendChild(p);const ang=Math.random()*6.28,dist=80+Math.random()*120;p.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${Math.cos(ang)*dist}px,${Math.sin(ang)*dist}px)`,opacity:0}],{duration:800+Math.random()*300,easing:'ease-out'});setTimeout(()=>p.remove(),1200);}}
function banner(txt){const b=$('banner');b.textContent=txt;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');}
function screenShake(){const a=$('app');a.classList.remove('shake');void a.offsetWidth;a.classList.add('shake');setTimeout(()=>a.classList.remove('shake'),320);}

/* =====================================================================
   HOME / 출석 / 미션
   ===================================================================== */
function ensureMission(){if(SAVE.missionDate!==today()||!SAVE.missions||typeof SAVE.missions!=='object'||Array.isArray(SAVE.missions)){SAVE.missionDate=today();SAVE.missions={};SAVE.missionDone={};SAVE.chestDone={};SAVE.playedToday=[];Object.keys(WORLDS).forEach(k=>{if(!WORLDS[k].locked)SAVE.missions[k]=shuffle(GAMES.map(g=>g.key)).slice(0,3);});save();}}
function renderHome(){
  ensureMission();
  $('pearls').textContent=SAVE.pearls;$('streakN').textContent=SAVE.streak;$('lvl').textContent=lvl();
  const st=$('stamps');st.innerHTML='';const on=SAVE.streak===0?0:((SAVE.streak-1)%7)+1;
  for(let i=0;i<7;i++){const d=document.createElement('div');d.className='stamp'+(i<on?' on':'');d.textContent=i<on?'⭐':(i+1);st.appendChild(d);}
  $('stampBtn').disabled=(SAVE.lastStamp===today());
  $('stampBtn').textContent=(SAVE.lastStamp===today())?'Checked in! 🎉':'Daily Check-in +5🦪';
  $('homeChar').textContent=WORLDS[CUR].character;const mb=$('muteBtn');if(mb)mb.textContent=SAVE.muted?'🔇':'🔊';
  renderWorlds();
  renderAvatar('avatarHome');
  if(!SAVE.missions[CUR])SAVE.missions[CUR]=shuffle(GAMES.map(g=>g.key)).slice(0,3);
  if(!SAVE.missionDone[CUR])SAVE.missionDone[CUR]=[];
  const mission=SAVE.missions[CUR],mdone=SAVE.missionDone[CUR];
  const ml=$('missionList');ml.innerHTML='';
  mission.forEach(k=>{const g=GAMES.find(x=>x.key===k);const done=mdone.includes(k);const best=SAVE.best[k]||0;
    const r=document.createElement('div');r.className='mrow'+(done?' done':'');
    r.innerHTML=`<div class="e">${g.emoji}</div><div><div class="n">${g.name}</div><div class="s">${g.desc.replace('/s/',POOL().phoneme)}</div><div class="best">🏆 Best ${best}</div></div><div class="chk">${done?'✅':'▶'}</div>`;
    r.onclick=()=>playGame(k,true);ml.appendChild(r);});
  $('missionProg').textContent=mdone.length+'/3';
  const allDone=mdone.length>=3;const chestOpened=!!(SAVE.chestDone&&SAVE.chestDone[CUR]);
  $('chestHome').classList.toggle('ready',allDone&&!chestOpened);
  $('chestMsg').textContent=allDone?(chestOpened?'Done for today — see you tomorrow!':'Chest ready! Tap it!'):'Clear 3 missions for the chest!';
  $('chestIco').onclick=(allDone&&!chestOpened)?(()=>go('chest')):null;
  emitCastleState();
}
function doStamp(){if(SAVE.lastStamp===today())return;const y=new Date(Date.now()-86400000).toISOString().slice(0,10);SAVE.streak=(SAVE.lastStamp===y)?SAVE.streak+1:1;SAVE.lastStamp=today();addPearls(5);sfxGood();banner('🔥 '+SAVE.streak+' day streak!');save();renderHome();}
function renderWorlds(){const wp=$('worldPick');if(!wp)return;wp.innerHTML='';
  Object.keys(WORLDS).forEach(k=>{const w=WORLDS[k];const b=document.createElement('button');
    b.className='wchip'+(k===CUR?' sel':'')+(w.locked?' lock':'');
    b.innerHTML=`${w.locked?'🔒':w.emoji}<span class="wp">${w.phoneme}</span>`;
    b.onclick=()=>selectWorld(k);wp.appendChild(b);});}
function setWorldKey(k,withBanner){const w=WORLDS[k];if(!w||w.locked)return false;CUR=k;SAVE.curWorld=k;if(!SAVE.chars.includes(k))SAVE.chars.push(k);save();if(withBanner)banner(w.emoji+' '+w.character+'!');return true;}
function selectWorld(k){const w=WORLDS[k];if(!w||w.locked){sfxBad();banner('Coming soon');return;}if(k===CUR)return;
  setWorldKey(k,true);sfxPop();renderHome();}
function renderAvatar(boxId){const box=$(boxId);box.innerHTML='';const base=document.createElement('div');base.className='avatarBase';base.textContent=WORLDS[CUR].emoji;box.appendChild(base);Object.keys(SAVE.equipped).forEach(slot=>{const it=ITEMS.find(i=>i.id===SAVE.equipped[slot]);if(!it)return;const a=document.createElement('div');a.className='acc '+slot;a.textContent=it.e;box.appendChild(a);});}
function addPearls(n){SAVE.pearls+=n;save();const e=$('pearls');if(e)e.textContent=SAVE.pearls;}
function worldsForBook(book){return Object.keys(WORLDS).map(k=>Object.assign({key:k},WORLDS[k])).filter(w=>(w.source&&w.source.book)===book);}
function worldState(k){
  const w=WORLDS[k], done=((SAVE.missionDone||{})[k]||[]), mission=((SAVE.missions||{})[k]||[]);
  const complete=done.length>=3, chestDone=!!((SAVE.chestDone||{})[k]);
  return {key:k,phoneme:w.phoneme,letter:w.letter,character:w.character,emoji:w.emoji,book:w.source&&w.source.book,step:w.source&&w.source.step,locked:!!w.locked,mission,doneCount:done.length,complete,chestReady:complete&&!chestDone,chestDone,bestWords:w.words.length};
}
function recommendedWorldForBook(book){
  const gates=worldsForBook(book);
  if(!gates.length)return CUR;
  const currentInBook=gates.find(w=>w.key===CUR);
  if(currentInBook&&!((SAVE.chestDone||{})[CUR]))return CUR;
  const progress=gates.find(w=>(((SAVE.missionDone||{})[w.key]||[]).length>0)&&!((SAVE.chestDone||{})[w.key]));
  if(progress)return progress.key;
  const fresh=gates.find(w=>!((SAVE.chestDone||{})[w.key]));
  return (fresh||gates[0]).key;
}
function bookState(book){
  const gates=worldsForBook(book).map(w=>worldState(w.key));
  const doneGates=gates.filter(g=>g.chestDone).length;
  return {book,gates,doneGates,totalGates:gates.length,recommendedKey:recommendedWorldForBook(book)};
}
function chooseStartBook(book){const target=recommendedWorldForBook(book);SAVE.castleStartBook=book;SAVE.currentBook=book;setWorldKey(target,false);save();renderHome();emitCastleState();}
function openBookCastle(book){const target=recommendedWorldForBook(book);SAVE.currentBook=book;setWorldKey(target,false);save();renderHome();emitCastleState();}
function getCastleHomeState(){
  ensureMission();
  const worlds=Object.keys(WORLDS).map(k=>worldState(k));
  const loadedBooks=[...new Set(worlds.map(w=>w.book).filter(Boolean))].sort((a,b)=>a-b);
  const currentBook=SAVE.currentBook||SAVE.castleStartBook||(WORLDS[CUR].source&&WORLDS[CUR].source.book)||loadedBooks[0]||1;
  if(!SAVE.currentBook&&SAVE.castleStartBook){SAVE.currentBook=SAVE.castleStartBook;save();}
  const recommendedKey=recommendedWorldForBook(currentBook);
  return {curWorld:CUR,pearls:SAVE.pearls,streak:SAVE.streak,level:lvl(),muted:SAVE.muted,castleStartBook:SAVE.castleStartBook,currentBook,recommendedKey,worlds,books:loadedBooks.map(bookState)};
}
function openCastleFromMap(k){if(setWorldKey(k,false)){renderHome();emitCastleState();}}
function startCastleQuest(k){if(!setWorldKey(k,false)){sfxBad();return;}const b=WORLDS[CUR].source&&WORLDS[CUR].source.book;if(b)SAVE.currentBook=b;save();ensureMission();if(!SAVE.missions[CUR])SAVE.missions[CUR]=shuffle(GAMES.map(g=>g.key)).slice(0,3);if(!SAVE.missionDone[CUR])SAVE.missionDone[CUR]=[];const mission=SAVE.missions[CUR];const done=SAVE.missionDone[CUR];const next=mission.find(key=>!done.includes(key))||mission[0]||GAMES[0].key;playGame(next,true);}

/* ---- 마을(Village) 모델 + 접속 라우팅 (모험 지도 ↔ 오늘의 미션) ---- */
function loadedBooks(){return [...new Set(Object.keys(WORLDS).map(k=>WORLDS[k].source&&WORLDS[k].source.book).filter(Boolean))].sort((a,b)=>a-b);}
function villageDone(book){const f=worldsForBook(book);return f.length>0&&f.every(w=>!!(SAVE.chestDone||{})[w.key]);}
function getLaunchRoute(){const b=SAVE.currentBook;if(!b)return 'map';return villageDone(b)?'map':'mission';}
function friendOf(w){return {key:w.key,emoji:w.emoji,enName:w.character,ko:w.kr,letter:w.letter,word:(w.words&&w.words[0]&&w.words[0].w)||'',collected:!!(SAVE.chestDone||{})[w.key]};}
function getVillageState(){
  ensureMission();
  const books=loadedBooks();const active=SAVE.currentBook||null;
  const villages=books.map(b=>{
    const friends=worldsForBook(b).map(friendOf);
    const collected=friends.filter(f=>f.collected).length;
    let status='future';if(collected>=friends.length&&friends.length)status='done';else if(b===active)status='current';
    return {book:b,theme:villageTheme(b),friends,collected,total:friends.length,status};
  });
  let curFriend=null,mission=[],doneCount=0;
  if(active){const k=recommendedWorldForBook(active);const w=WORLDS[k];if(w){curFriend=friendOf(w);
    const m=(SAVE.missions||{})[k]||[],d=(SAVE.missionDone||{})[k]||[];doneCount=d.length;
    mission=m.map(gk=>Object.assign({key:gk,emoji:(GAMES.find(g=>g.key===gk)||{}).emoji,done:d.includes(gk)},gameCopy(gk)));}}
  return {homeView,route:getLaunchRoute(),pearls:SAVE.pearls,streak:SAVE.streak,muted:SAVE.muted,
    villages,activeBook:active,activeTheme:active?villageTheme(active):null,curFriend,mission,doneCount};
}
function showHomeSurface(){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$('home').classList.add('active');stopGame();renderHome();emitNavigate('home');}
function enterVillage(book){const target=recommendedWorldForBook(book);if(setWorldKey(target,false)){SAVE.currentBook=book;save();}homeView='mission';showHomeSurface();}
function goMap(){homeView='map';showHomeSurface();}
function playMission(gameKey){const k=recommendedWorldForBook(SAVE.currentBook||loadedBooks()[0]);if(!setWorldKey(k,false)){sfxBad();return;}ensureMission();if(!SAVE.missions[k])SAVE.missions[k]=shuffle(GAMES.map(g=>g.key)).slice(0,3);if(!SAVE.missionDone[k])SAVE.missionDone[k]=[];const key=gameKey||SAVE.missions[k].find(x=>!SAVE.missionDone[k].includes(x))||SAVE.missions[k][0];playGame(key,true);}
function startTodayMission(){playMission(null);}

/* =====================================================================
   GAME RUNTIME (공통)
   ===================================================================== */
let G=null;
function startGameState(key,isMission){G={key,isMission,score:0,combo:0,bestCombo:0,words:new Set(),timers:[],ended:false,_done:false};try{actx()&&AC.resume&&AC.resume();}catch(e){}}
function playGame(key,isMission){const g=GAMES.find(x=>x.key===key);if(g){startGameState(key,isMission);g.run();}}
function gAddTimer(t){G&&G.timers.push(t);}
function stopGame(){if(G){G.timers.forEach(t=>{clearTimeout(t);clearInterval(t);});G.timers=[];G.ended=true;}}
function quitGame(){stopGame();go('home');}

function hit(word,x,y,opts){opts=opts||{};G.combo++;G.bestCombo=Math.max(G.bestCombo,G.combo);
  let gain=1+Math.floor(G.combo/5)+(opts.bonus||0);G.score+=gain;G.words.add(word.w);
  correctSfx();vibe(12);burst(x,y);fxPop(x,y,'+'+gain+'🦪');showCombo(G.key);if(!opts.silent)sayHit(word.w);timeFreeze(550);
  if(G.combo>0&&G.combo%5===0){sfxCombo(G.combo);fireworks();timeAdd(2);banner(G.combo+' Combo! +2s 🎆');}}
function miss(){if(G)G.combo=0;sfxBad();vibe([15,30,15]);timePenalty(3);}
function escaped(x,y,label){if(G)G.combo=0;tone(240,0.14,'sine',0.1);if(x!=null)fxPop(x,y,label||'Miss!');const c=G&&$(G.key+'_combo');if(c)c.classList.remove('show');timePenalty(1.5);}
function showCombo(key){const c=$(key+'_combo');if(!c)return;if(G.combo>=2){c.textContent='🔥 '+G.combo+' COMBO';c.classList.add('show');clearTimeout(c._t);c._t=setTimeout(()=>c.classList.remove('show'),900);}else c.classList.remove('show');}
function setScoreLabel(key){const e=$(key+'_score');if(e)e.textContent=G.score;}
/* --- 공통 시간 긴장감 엔진 (정답=잠깐 멈춤, 콤보=+시간, 실수/폭탄=확 줄음) --- */
function startTimer(sec,barId){G.time=sec;G.maxTime=sec;G.freezeUntil=0;G.barId=barId;updateTimeBar();const it=setInterval(()=>{if(!G||G.ended)return;if(Date.now()>=G.freezeUntil)G.time-=0.1;if(G.time<=0){G.time=0;updateTimeBar();clearInterval(it);finishGame();return;}updateTimeBar();},100);gAddTimer(it);}
function updateTimeBar(){if(!G||!G.barId||!G.maxTime)return;const b=$(G.barId);if(b)b.style.width=Math.max(0,Math.min(100,G.time/G.maxTime*100))+'%';}
function timeFreeze(ms){if(G&&G.maxTime)G.freezeUntil=Date.now()+(ms||550);}
function timeAdd(sec){if(G&&G.maxTime){G.time=Math.min(G.maxTime,G.time+sec);updateTimeBar();}}
function timePenalty(sec){if(G&&G.maxTime){G.time=Math.max(0,G.time-sec);updateTimeBar();const b=$(G.barId);if(b){b.style.background='#ff5d5d';setTimeout(()=>{if(b)b.style.background='';},220);}}}

function finishGame(){
  if(!G||G._done)return;G._done=true;stopGame();
  const earned=G.score;addPearls(earned);SAVE.xp+=earned;
  if(!SAVE.cards)SAVE.cards=[];
  G.words.forEach(w=>{
    if(!SAVE.words.includes(w))SAVE.words.push(w);
    const id=currentCardId(w);
    if(!SAVE.cards.includes(id))SAVE.cards.push(id);
  });
  const prevBest=SAVE.best[G.key]||0;const isRec=G.score>prevBest;if(isRec)SAVE.best[G.key]=G.score;
  if(!SAVE.playedToday)SAVE.playedToday=[];if(!SAVE.playedToday.includes(G.key))SAVE.playedToday.push(G.key);
  let chestPending=false;
  if(G.isMission){if(!SAVE.missionDone[CUR])SAVE.missionDone[CUR]=[];const dw=SAVE.missionDone[CUR];if(!dw.includes(G.key))dw.push(G.key);if(dw.length>=3&&!(SAVE.chestDone&&SAVE.chestDone[CUR]))chestPending=true;}
  save();
  $('res_title').textContent=isRec?'🏆 New Record!':(G.bestCombo>=8?'Awesome! 🌟':'Great job!');
  {const rc=$('res_char');if(rc)rc.textContent=(WORLDS[CUR]&&WORLDS[CUR].emoji)||'🌟';}
  $('res_pearls').textContent=earned;$('res_combo').textContent=G.bestCombo;
  $('res_best').textContent='Best 🏆 '+Math.max(prevBest,G.score);
  $('res_words').textContent='Words: '+[...G.words].join(', ');
  if(isRec){fireworks();fanfare();vibe([10,40,10,40,20]);banner('🏆 New Record!');}else{winJingle();}
  $('res_next').onclick=chestPending?(()=>go('chest')):(()=>go('home'));
  $('res_next').textContent=chestPending?'Open Chest 🎁':'Home ▶';
  go2('result');
}

/* =====================================================================
   GAME 1 — Bubble Pop (버블)  모드교차 + 황금 + 놓침
   ===================================================================== */
const BUBBLE_TIME=35,BUBBLE_SIZE=84,BUBBLE_TARGET_NEED=3;let bubMode,bubTarget,bubHits=0;
function startBubble(){
  bubMode=Math.random()<0.5?'target':'all';
  if(bubMode==='target'){setBubbleTarget(null,true);}
  else{$('bub_prompt').innerHTML=POOL().phoneme+' 소리 친구를 모아!';$('bub_prompt').onclick=null;}
  $('bubble_score').textContent='0';$('bubbleArea').innerHTML='';go2('g_bubble');
  startTimer(BUBBLE_TIME,'bub_timer');
  const spawn=setInterval(()=>spawnBubble($('bubbleArea')),760);gAddTimer(spawn);
}
function setBubbleTarget(prevWord,playSound){
  const words=POOL().words,choices=words.filter(w=>w.w!==prevWord);
  bubTarget=shuffle(choices.length?choices:words)[0];bubHits=0;
  $('bub_prompt').innerHTML='듣고 같은 단어 3개를 찾아요! 🔊 <span style="font-size:14px;opacity:.7">0/'+BUBBLE_TARGET_NEED+'</span>';
  $('bub_prompt').onclick=()=>say(bubTarget.w);if(playSound)setTimeout(()=>say(bubTarget.w),160);
}
function updateBubbleTargetProgress(area){
  bubHits++;$('bub_prompt').innerHTML='듣고 같은 단어 3개를 찾아요! 🔊 <span style="font-size:14px;opacity:.7">'+bubHits+'/'+BUBBLE_TARGET_NEED+'</span>';
  if(bubHits>=BUBBLE_TARGET_NEED){const prev=bubTarget.w;banner('Next sound! 🔊');area.querySelectorAll('.bubble').forEach(x=>{if(!x._x)x.remove();});setTimeout(()=>{if(G&&!G.ended)setBubbleTarget(prev,true);},520);}
}
function spawnBubble(area){
  if(!G||G.ended)return;const p=POOL();let item,good;
  if(bubMode==='target'){const r=Math.random();if(r<0.4)item=bubTarget;else if(r<0.7)item=shuffle(p.words.filter(w=>w.w!==bubTarget.w))[0]||bubTarget;else item=shuffle(p.distractors)[0];good=(item.w===bubTarget.w);}
  else{good=Math.random()<0.5;item=good?shuffle(p.words)[0]:shuffle(p.distractors)[0];}
  const golden=good&&Math.random()<0.12;
  const pad=6,maxLeft=Math.max(pad,(area.clientWidth||BUBBLE_SIZE)-BUBBLE_SIZE-pad);
  const b=document.createElement('div');b.className='bubble'+(golden?' gold':'');b.style.left=(pad+Math.random()*(maxLeft-pad))+'px';
  b.style.animation='rise '+(4.0+Math.random()*1.6)+'s linear forwards';
  b.innerHTML=`<div class="be">${item.emo}</div><div class="bl">${item.w}</div>`;
  b.onclick=()=>{if(b._x)return;b._x=1;const r=b.getBoundingClientRect();
    if(good){b.classList.add('pop');hit(item,r.left+r.width/2,r.top,{bonus:golden?3:0});if(golden)banner('✨ Gold Bonus!');setScoreLabel('bubble');if(bubMode==='target')updateBubbleTargetProgress(area);}
    else{miss();b.classList.add('sink');fxPop(r.left+r.width/2,r.top,'❌');}
    setTimeout(()=>b.remove(),300);};
  b.addEventListener('animationend',()=>{if(!b._x&&good){const r=b.getBoundingClientRect();escaped(r.left+r.width/2,Math.max(60,r.top));}b.remove();});
  area.appendChild(b);
}

/* =====================================================================
   GAME 2 — Quick Quiz  실타이머 + 스피드보너스 + 미세청취 + 스캐폴드
   ===================================================================== */
const QUIZ_N=8,Q_TIME=6;let quizRound=0,quizCur=null,quizWrong=0,quizStart=0,quizLeft=0;
function startQuiz(){quizRound=0;$('quiz_score').textContent='0';$('quiz_char').textContent=POOL().emoji;go2('g_quiz');nextQuiz();}
function nextQuiz(){
  if(!G||G.ended)return;if(quizRound>=QUIZ_N){finishGame();return;}
  quizWrong=0;const p=POOL();quizCur=shuffle(p.words)[0];
  let pool=(quizRound>=5)?p.words.filter(w=>w.w!==quizCur.w):p.distractors; // 후반: 보기 전부 /s/ → 미세청취
  const opts=shuffle([quizCur,...shuffle(pool).slice(0,2)]);
  const grid=$('quizGrid');grid.innerHTML='';
  opts.forEach(o=>{const c=document.createElement('div');c.className='qcard';c.dataset.w=o.w;
    c.innerHTML=`<div class="emo">${o.emo}</div><div class="lab">${o.w}</div>`;
    c.onclick=()=>{const r=c.getBoundingClientRect();
      if(o.w===quizCur.w){clearInterval(quizTimer);c.classList.add('correct');const fast=(Date.now()-quizStart)<2500;hit(quizCur,r.left+r.width/2,r.top,{bonus:fast?2:0});if(fast)fxPop(r.left+r.width/2,r.top-30,'⚡빠름!');setScoreLabel('quiz');quizRound++;setTimeout(nextQuiz,650);}
      else{c.classList.add('wrong');miss();quizLeft=Math.max(8,quizLeft-15);$('quiz_timer').style.width=(quizLeft/(Q_TIME*10)*100)+'%';quizWrong++;if(quizWrong>=2){const t=grid.querySelector('[data-w="'+quizCur.w+'"]');if(t)t.classList.add('hint');}setTimeout(()=>c.classList.remove('wrong'),350);}};
    grid.appendChild(c);});
  setTimeout(()=>say(quizCur.w),200);
  quizStart=Date.now();quizLeft=Q_TIME*10;$('quiz_timer').style.width='100%';
  clearInterval(quizTimer);quizTimer=setInterval(()=>{quizLeft--;$('quiz_timer').style.width=(quizLeft/(Q_TIME*10)*100)+'%';if(quizLeft<=0){clearInterval(quizTimer);const t=grid.querySelector('[data-w="'+quizCur.w+'"]');if(t)t.classList.add('hint');miss();quizRound++;setTimeout(nextQuiz,500);}},100);gAddTimer(quizTimer);
}
let quizTimer;
function quizRepeat(){if(quizCur)say(quizCur.w);}

/* =====================================================================
   GAME 3 — Whack-a-Word  속도램프 + 놓침 + 황금/폭탄 + 더블
   ===================================================================== */
const MOLE_TIME=35;let moleElapsed=0;
function startMole(){
  $('mole_prompt').innerHTML=POOL().phoneme+' 친구만 두드려! 💣 폭탄은 피해';$('mole_score').textContent='0';
  const area=$('moleArea');area.innerHTML='';const holes=[];
  for(let i=0;i<9;i++){const h=document.createElement('div');h.className='hole';area.appendChild(h);holes.push(h);}
  go2('g_mole');moleElapsed=0;startTimer(MOLE_TIME,'mole_timer');
  const etick=setInterval(()=>{moleElapsed++;},1000);gAddTimer(etick);
  function loop(){if(!G||G.ended)return;popMole(holes);if(moleElapsed>=24&&Math.random()<0.5)popMole(holes);const iv=Math.max(820,1350-moleElapsed*14);const to=setTimeout(loop,iv);gAddTimer(to);}
  loop();
}
function popMole(holes){
  if(!G||G.ended)return;const p=POOL();const free=holes.filter(h=>!h._busy);if(!free.length)return;
  const h=shuffle(free)[0];h._busy=1;
  let good=Math.random()<0.5;let bomb=false,golden=false,item;
  if(good){golden=Math.random()<0.12;item=shuffle(p.words)[0];}
  else{bomb=Math.random()<0.22;item=bomb?{w:"bomb",emo:"💣"}:shuffle(p.distractors)[0];}
  const m=document.createElement('div');m.className='mole'+(golden?' gold':'')+(bomb?' bomb':'');
  m.innerHTML=`<div class="emo">${item.emo}</div>`+(bomb?'':`<div class="lab">${item.w}</div>`);
  h.appendChild(m);requestAnimationFrame(()=>m.classList.add('up'));
  const life=Math.max(1150,1850-moleElapsed*18);
  const lifeT=setTimeout(()=>{if(!m._x&&good){const r=m.getBoundingClientRect();escaped(r.left+r.width/2,r.top);}m.classList.remove('up');setTimeout(()=>{m.remove();h._busy=0;},220);},life);
  m.onclick=()=>{if(m._x)return;m._x=1;clearTimeout(lifeT);const r=m.getBoundingClientRect();
    if(bomb){miss();timePenalty(3);screenShake();fxPop(r.left+r.width/2,r.top,'Boom! 💥');}
    else if(good){m.classList.add('correct');hit(item,r.left+r.width/2,r.top,{bonus:golden?3:0});if(golden)banner('✨ Gold!');setScoreLabel('mole');}
    else{m.classList.add('wrong');miss();fxPop(r.left+r.width/2,r.top,'❌');}
    setTimeout(()=>{m.classList.remove('up');setTimeout(()=>{m.remove();h._busy=0;},200);},250);};
}

/* =====================================================================
   GAME 4 — Sound Run (진짜 레인 러너)
   ===================================================================== */
const RUN_TIME=35,LANES=[18,45,72];let runLane=1,runDist=0;
function startRunner(){
  $('runner_score').textContent='0';const area=$('runArea');
  $('runner_prompt').innerHTML='위/아래를 눌러 '+POOL().phoneme+' 코인 레인으로! 장애물은 피해';
  area.innerHTML='<div id="runChar">'+POOL().emoji+'</div><div id="runDist">0m</div>';
  runLane=1;runDist=0;setRunChar();
  area.onclick=(e)=>{const r=area.getBoundingClientRect();const rel=(e.clientY-r.top)/r.height;runLane=rel<0.4?0:(rel<0.7?1:2);setRunChar();};
  go2('g_runner');startTimer(RUN_TIME,'run_timer');
  const dtick=setInterval(()=>{runDist+=8;const rd=$('runDist');if(rd)rd.textContent=runDist+'m';},1000);gAddTimer(dtick);
  let elapsed=0;
  const spawn=setInterval(()=>{elapsed++;spawnRunItem(area,Math.max(2.2,4.6-elapsed*0.06));},820);gAddTimer(spawn);
  const poll=setInterval(()=>checkRun(area),70);gAddTimer(poll);
}
function setRunChar(){const c=$('runChar');if(c)c.style.top=LANES[runLane]+'%';}
function spawnRunItem(area,speed){
  if(!G||G.ended)return;const p=POOL();const good=Math.random()<0.55;
  const item=good?shuffle(p.words)[0]:shuffle(p.distractors)[0];const lane=Math.floor(Math.random()*3);
  const c=document.createElement('div');c.className='coin'+(good?'':' obst');c.style.top=LANES[lane]+'%';c.dataset.lane=lane;c.dataset.good=good?1:0;
  c.style.animation='slideL '+speed+'s linear forwards';
  c.innerHTML=`<div class="be">${item.emo}</div><div class="bl">${item.w}</div>`;c._item=item;
  c.addEventListener('animationend',()=>{if(!c._res&&good){const r=c.getBoundingClientRect();escaped(r.left+r.width/2,Math.max(60,r.top));}c.remove();});
  area.appendChild(c);
}
function checkRun(area){
  if(!G||G.ended)return;const ch=$('runChar');if(!ch)return;const chR=ch.getBoundingClientRect();const chx=chR.left+chR.width;
  area.querySelectorAll('.coin').forEach(c=>{if(c._res)return;const r=c.getBoundingClientRect();
    if(r.left<=chx&&(+c.dataset.lane)===runLane){c._res=1;
      if(c.dataset.good==='1'){c.classList.add('pop');hit(c._item,r.left+r.width/2,r.top);setScoreLabel('runner');setTimeout(()=>c.remove(),250);}
      else{miss();ch.classList.add('bump');setTimeout(()=>ch.classList.remove('bump'),300);fxPop(chR.left+chR.width/2,chR.top,'Oops!');c.classList.add('pop');setTimeout(()=>c.remove(),250);}}});
}

/* =====================================================================
   GAME 5 — Sound Shooter  레이저+흔들림 + 착륙 스테이크 + 보스
   ===================================================================== */
const SHOOT_TIME=35;let shootHearts=3,shootBoss=false;
function startShooter(){
  $('shooter_score').textContent='0';const area=$('shootArea');
  $('shooter_prompt').innerHTML=POOL().phoneme+' 우주선을 탭해서 쏴라! 💥';
  shootHearts=3;shootBoss=false;
  area.innerHTML='<div id="cannon">'+POOL().emoji+'🔫</div><div class="hearts" id="shootHearts">❤️❤️❤️</div>';
  go2('g_shooter');startTimer(SHOOT_TIME,'shoot_timer');
  const bossTO=setTimeout(()=>{if(G&&!G.ended&&!shootBoss){shootBoss=true;spawnEnemy(area,9,true);}},(SHOOT_TIME-8)*1000);gAddTimer(bossTO);
  let elapsed=0;
  const spawn=setInterval(()=>{elapsed++;spawnEnemy(area,Math.max(3.2,6.2-elapsed*0.07),false);},900);gAddTimer(spawn);
}
function setHearts(){const h=$('shootHearts');if(h)h.textContent='❤️'.repeat(Math.max(0,shootHearts))+'🖤'.repeat(Math.max(0,3-shootHearts));}
function spawnEnemy(area,speed,boss){
  if(!G||G.ended)return;const p=POOL();let good,item,golden=false;
  if(boss){good=true;item=shuffle(p.words)[0];}
  else{good=Math.random()<0.55;golden=good&&Math.random()<0.1;item=good?shuffle(p.words)[0]:shuffle(p.distractors)[0];}
  const u=document.createElement('div');u.className='ufo'+(boss?' boss':'')+(golden?' gold':'');u.style.left=(6+Math.random()*74)+'%';u.dataset.good=good?1:0;
  u.style.animation='descend '+speed+'s linear forwards';
  u.innerHTML=`<div class="be">${item.emo}</div><div class="bl">${boss?'BOSS '+item.w:item.w}</div>`;
  u.addEventListener('animationend',()=>{if(!u._x&&good){shootHearts--;setHearts();escaped(innerWidth/2,innerHeight-90,'Miss!');screenShake();if(shootHearts<=0)finishGame();}u.remove();});
  u.onclick=()=>{if(u._x)return;u._x=1;const r=u.getBoundingClientRect();const can=$('cannon').getBoundingClientRect();
    laser(can.left+can.width/2,can.top,r.left+r.width/2,r.top+r.height/2);tone(900,0.06,'square',0.15);
    if(good){u.classList.add('pop');hit(item,r.left+r.width/2,r.top,{bonus:(boss?5:0)+(golden?3:0)});fxPop(r.left+r.width/2,r.top,boss?'💥 BOSS!':'💥');screenShake();if(boss)banner('🚀 Boss down!');setScoreLabel('shooter');}
    else{miss();fxPop(r.left+r.width/2,r.top,'❌');u.style.opacity=.3;}
    setTimeout(()=>u.remove(),300);};
  area.appendChild(u);
}
function laser(x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1;const len=Math.hypot(dx,dy);const ang=Math.atan2(dy,dx)*180/Math.PI;const l=document.createElement('div');l.className='laser';l.style.left=x1+'px';l.style.top=y1+'px';l.style.width=len+'px';l.style.transform='rotate('+ang+'deg)';document.body.appendChild(l);setTimeout(()=>l.remove(),150);}

/* =====================================================================
   GAME 6 — Lava Jump  용암 + 듣기모드 + 미끄러짐 + 콤보배수
   ===================================================================== */
const JUMP_CATCH=44;let jLava=8,jElapsed=0;
function renderLava(){
  const h=Math.max(0,Math.min(JUMP_CATCH,jLava));
  $('lava').style.height=h+'%';
  $('jump_timer').style.width=((JUMP_CATCH-h)/JUMP_CATCH*100)+'%';
  $('jumpArea').classList.toggle('danger',h>=JUMP_CATCH-9);
}
function startJump(){
  $('jump_score').textContent='0';jLava=8;jElapsed=0;
  $('jumper').textContent=POOL().emoji;
  $('jump_prompt').innerHTML='🌋 '+POOL().phoneme+' 발판을 밟아 용암을 눌러요!';
  go2('g_jump');renderLava();
  const tick=setInterval(()=>{jElapsed++;jLava+=3+Math.floor(jElapsed/8);if(jLava>=JUMP_CATCH){jLava=JUMP_CATCH;renderLava();clearInterval(tick);return jumpCaught();}renderLava();},1000);gAddTimer(tick);
  jumpRound();
}
function jumpCaught(){if(!G||G._done)return;const j=$('jumper');if(j)j.classList.add('slip');banner('🌋 Caught by lava!');finishGame();}
function jumpRound(){
  if(!G||G.ended)return;const p=POOL();
  const correct=shuffle(p.words)[0];
  let wrong=(Math.random()<0.5)?shuffle(p.words.filter(w=>w.w!==correct.w))[0]:shuffle(p.distractors)[0];
  if(!wrong||wrong.w===correct.w)wrong=shuffle(p.distractors)[0];
  $('jump_prompt').innerHTML='🌋 잘 듣고 같은 단어를 밟아요! 🔊';$('jump_prompt').onclick=()=>say(correct.w);say(correct.w);
  const pads=shuffle([{it:correct,good:true},{it:wrong,good:false}]);
  const box=$('jumpPads');box.innerHTML='';
  pads.forEach(o=>{const d=document.createElement('div');d.className='pad';
    d.innerHTML=`<div class="be">${o.it.emo}</div><div class="bl">${o.it.w}</div>`;
    d.onclick=()=>{const r=d.getBoundingClientRect();
      if(o.good){d.classList.add('correct');const j=$('jumper');j.classList.add('hop');setTimeout(()=>j.classList.remove('hop'),400);
        jLava=Math.max(0,jLava-7);renderLava();
        const mult=G.combo>=5?2:1;hit(o.it,r.left+r.width/2,r.top,{bonus:mult-1,silent:true});setScoreLabel('jump');
        fxPop(innerWidth/2,innerHeight*0.66,'용암 ↓');setTimeout(()=>{if(G&&!G.ended)jumpRound();},500);}
      else{d.classList.add('wrong');miss();jLava=Math.min(JUMP_CATCH,jLava+4);renderLava();const j=$('jumper');j.classList.add('slip');setTimeout(()=>j.classList.remove('slip'),400);fxPop(r.left+r.width/2,r.top,'앗! 용암 ↑');}};
    box.appendChild(d);});
}

/* =====================================================================
   GAME 7 — Memory Match (카드 뒤집기, 라운드↑·시간↓)
   ===================================================================== */
const MEMORY_ROUND_SECONDS=[28,40,52];
let memRound=0,memTime=0,memMax=0,memTimer=null,memFirst=null,memLock=false,memMatched=0,memPairs=0;
function startMemory(){memRound=0;$('memory_score').textContent='0';go2('g_memory');nextMemRound();}
function nextMemRound(){
  if(!G||G.ended)return;
  if(memRound>=3){finishGame();return;}
  memPairs=3+memRound;
  const words=shuffle(POOL().words).slice(0,memPairs);
  let cards=[];words.forEach((it,i)=>{cards.push({pid:i,kind:'pic',it});cards.push({pid:i,kind:'word',it});});
  cards=shuffle(cards);
  const grid=$('memGrid');grid.innerHTML='';grid.style.gridTemplateColumns='repeat('+(cards.length<=6?3:4)+',1fr)';
  memFirst=null;memLock=false;memMatched=0;
  $('mem_prompt').innerHTML='같은 짝을 찾아요! (Round '+(memRound+1)+'/3)';
  cards.forEach(c=>{const d=document.createElement('div');d.className='mcard';d.innerHTML='<div class="mface">❓</div>';d.onclick=()=>flipCard(d,c);grid.appendChild(d);});
  memTime=MEMORY_ROUND_SECONDS[memRound]||40;memMax=memTime;$('mem_timer').style.width='100%';
  clearInterval(memTimer);memTimer=setInterval(()=>{memTime-=0.1;$('mem_timer').style.width=Math.max(0,memTime/memMax*100)+'%';if(memTime<=0){clearInterval(memTimer);finishGame();}},100);gAddTimer(memTimer);
}
function flipCard(d,c){
  if(memLock||d._f||d._done)return;
  d._f=1;d.classList.add('flip');d.querySelector('.mface').textContent=c.kind==='pic'?c.it.emo:c.it.w;sayHit(c.it.w);
  if(!memFirst){memFirst={d,c};return;}
  if(memFirst.d===d)return;
  const a=memFirst;memFirst=null;
  if(a.c.pid===c.pid){
    a.d._done=d._done=1;a.d.classList.add('done');d.classList.add('done');
    const r=d.getBoundingClientRect();hit(c.it,r.left+r.width/2,r.top);setScoreLabel('memory');memMatched++;
    if(memMatched>=memPairs){clearInterval(memTimer);winJingle();vibe([10,30,10]);banner('Round '+(memRound+1)+' clear! 🎉');memRound++;setTimeout(nextMemRound,800);}
  }else{
    memLock=true;miss();memTime=Math.max(0,memTime-2);
    setTimeout(()=>{a.d._f=0;d._f=0;a.d.classList.remove('flip');d.classList.remove('flip');const fa=a.d.querySelector('.mface');if(fa)fa.textContent='❓';const fb=d.querySelector('.mface');if(fb)fb.textContent='❓';memLock=false;},800);
  }
}

/* =====================================================================
   GAME 8 — Word Hunt (스나이퍼 조준경 + 움직이는 카드)
   ===================================================================== */
const HUNT_TIME=40,HUNT_CARD_SIZE=58,HUNT_SCOPE_RADIUS=92;let huntTarget=null,huntPresent=[],huntCards=[];
function startHunt(){$('hunt_score').textContent='0';go2('g_hunt');scatterHunt();startTimer(HUNT_TIME,'hunt_timer');
  const area=$('huntArea');const aim=(e)=>{const r=area.getBoundingClientRect();const p=e.touches?e.touches[0]:e;aimHunt(area,p.clientX-r.left,p.clientY-r.top);};
  area.onmousemove=aim;area.ontouchmove=(e)=>{aim(e);e.preventDefault();};area.onclick=(e)=>{const r=area.getBoundingClientRect();aimHunt(area,e.clientX-r.left,e.clientY-r.top);};
  aimHunt(area,area.clientWidth/2,area.clientHeight/2);
  let el=0;const mv=setInterval(()=>{el++;moveHuntCards(area,el);},50);gAddTimer(mv);}
function huntBounds(area){const pad=HUNT_CARD_SIZE/2+6;const w=Math.max(HUNT_CARD_SIZE+12,area.clientWidth||HUNT_CARD_SIZE+12),h=Math.max(HUNT_CARD_SIZE+12,area.clientHeight||HUNT_CARD_SIZE+12);
  return {minX:pad/w*100,maxX:100-pad/w*100,minY:pad/h*100,maxY:100-pad/h*100};}
function scatterHunt(){
  const p=POOL();const tgts=shuffle(p.words).slice(0,4);const decoys=shuffle(p.distractors).slice(0,6);
  const all=shuffle([...tgts,...decoys]);const area=$('huntArea');const bd=huntBounds(area);area.innerHTML='<div id="scope"><div class="scope-ring"></div></div>';huntCards=[];
  all.forEach(it=>{const d=document.createElement('div');d.className='hitem';d.dataset.w=it.w;
    const card={it,el:d,x:bd.minX+Math.random()*(bd.maxX-bd.minX),y:bd.minY+Math.random()*(bd.maxY-bd.minY),vx:(Math.random()-.5)*0.45,vy:(Math.random()-.5)*0.45};
    d.innerHTML=`<div class="be">${it.emo}</div><div class="bl">${it.w}</div>`;d.onclick=(e)=>{e.stopPropagation();const ar=area.getBoundingClientRect();aimHunt(area,e.clientX-ar.left,e.clientY-ar.top);pickHunt(d,it);};area.appendChild(d);huntCards.push(card);placeHuntCard(card);});
  huntPresent=tgts;newHuntTarget();}
function placeHuntCard(card){card.el.style.left=card.x+'%';card.el.style.top=card.y+'%';}
function aimHunt(area,x,y){area.style.setProperty('--sx',x+'px');area.style.setProperty('--sy',y+'px');
  huntCards.forEach(c=>{const r=c.el.getBoundingClientRect(),ar=area.getBoundingClientRect();const cx=r.left+r.width/2-ar.left,cy=r.top+r.height/2-ar.top;c.el.classList.toggle('scoped',Math.hypot(cx-x,cy-y)<HUNT_SCOPE_RADIUS);});}
function moveHuntCards(area,el){if(!G||G.ended)return;const bd=huntBounds(area),sp=1+el*0.0015;huntCards.forEach(c=>{if(Math.random()<0.025){c.vx=(Math.random()-.5)*0.45;c.vy=(Math.random()-.5)*0.45;}
  c.x+=c.vx*sp;c.y+=c.vy*sp;if(c.x<bd.minX||c.x>bd.maxX){c.vx*=-1;c.x=Math.max(bd.minX,Math.min(bd.maxX,c.x));}if(c.y<bd.minY||c.y>bd.maxY){c.vy*=-1;c.y=Math.max(bd.minY,Math.min(bd.maxY,c.y));}placeHuntCard(c);});
  const sx=parseFloat(getComputedStyle(area).getPropertyValue('--sx'))||area.clientWidth/2,sy=parseFloat(getComputedStyle(area).getPropertyValue('--sy'))||area.clientHeight/2;aimHunt(area,sx,sy);}
function newHuntTarget(){huntTarget=shuffle(huntPresent)[0];$('hunt_prompt').innerHTML='🎯 Target: <b>'+huntTarget.w+'</b> 🔊';say(huntTarget.w);}
function pickHunt(d,it){if(!G||G.ended)return;const r=d.getBoundingClientRect(),area=$('huntArea'),ar=area.getBoundingClientRect();const sx=parseFloat(getComputedStyle(area).getPropertyValue('--sx'))||ar.width/2,sy=parseFloat(getComputedStyle(area).getPropertyValue('--sy'))||ar.height/2;
  const cx=r.left+r.width/2-ar.left,cy=r.top+r.height/2-ar.top;if(Math.hypot(cx-sx,cy-sy)>HUNT_SCOPE_RADIUS){fxPop(r.left+r.width/2,r.top,'Aim!');return;}
  if(huntTarget&&it.w===huntTarget.w){hit(it,r.left+r.width/2,r.top,{silent:true});setScoreLabel('hunt');d.classList.add('hit');setTimeout(()=>d.classList.remove('hit'),250);sayThen(it.w,()=>{if(G&&!G.ended)newHuntTarget();});}
  else{miss();d.classList.add('wrong');setTimeout(()=>d.classList.remove('wrong'),300);}}

/* =====================================================================
   GAME 9 — Bug Spray (불규칙 비행 + AoE 스프레이)
   ===================================================================== */
const SPRAY_TIME=35;const BUG_SIZE=72,SPRAY_BUG_COUNT=9;let bugs=[];
function startSpray(){$('spray_score').textContent='0';$('spray_prompt').innerHTML=POOL().phoneme+' 모기만 잡아!';
  const area=$('sprayArea');area.innerHTML='';bugs=[];go2('g_spray');startTimer(SPRAY_TIME,'spray_timer');
  for(let i=0;i<SPRAY_BUG_COUNT;i++)addBug(area,i===0);
  area.onclick=(e)=>sprayAt(area,e);
  let el=0;const mv=setInterval(()=>{el++;moveBugs(el);},40);gAddTimer(mv);}
function bugBounds(area){const pad=BUG_SIZE/2+4;const w=Math.max(BUG_SIZE+8,area.clientWidth||BUG_SIZE+8),h=Math.max(BUG_SIZE+8,area.clientHeight||BUG_SIZE+8);
  return {minX:pad/w*100,maxX:100-pad/w*100,minY:pad/h*100,maxY:100-pad/h*100};}
function addBug(area,forceGood=false){const p=POOL();const good=forceGood||Math.random()<0.62;const item=good?shuffle(p.words)[0]:shuffle(p.distractors)[0];
  const bd=bugBounds(area);
  const b={x:bd.minX+Math.random()*(bd.maxX-bd.minX),y:bd.minY+Math.random()*(bd.maxY-bd.minY),vx:(Math.random()-.5)*1.6,vy:(Math.random()-.5)*1.6,good,item,el:document.createElement('div')};
  b.el.className='bug';b.el.innerHTML=`<div class="be">🦟</div><div class="bl">${item.w}</div>`;b.el.style.left=b.x+'%';b.el.style.top=b.y+'%';area.appendChild(b.el);bugs.push(b);}
function moveBugs(el){const sp=1+el*0.004;bugs.forEach(b=>{if(Math.random()<0.03){b.vx=(Math.random()-.5)*1.6;b.vy=(Math.random()-.5)*1.6;}
  const bd=bugBounds(b.el.parentElement);b.x+=b.vx*sp;b.y+=b.vy*sp;if(b.x<bd.minX||b.x>bd.maxX){b.vx*=-1;b.x=Math.max(bd.minX,Math.min(bd.maxX,b.x));}if(b.y<bd.minY||b.y>bd.maxY){b.vy*=-1;b.y=Math.max(bd.minY,Math.min(bd.maxY,b.y));}
  b.el.style.left=b.x+'%';b.el.style.top=b.y+'%';});}
function sprayAt(area,e){if(!G||G.ended)return;const px=e.clientX,py=e.clientY;
  const s=document.createElement('div');s.className='spray';s.style.left=px+'px';s.style.top=py+'px';document.body.appendChild(s);setTimeout(()=>s.remove(),400);tone(300,0.08,'sawtooth',0.12);
  for(let i=bugs.length-1;i>=0;i--){const b=bugs[i];const br=b.el.getBoundingClientRect();const cx=br.left+br.width/2,cy=br.top+br.height/2;
    if(Math.hypot(cx-px,cy-py)<56){if(b.good){hit(b.item,cx,cy);}else{miss();fxPop(cx,cy,'Miss!');}b.el.remove();bugs.splice(i,1);addBug(area,!bugs.some(x=>x.good));}}
  setScoreLabel('spray');}

/* =====================================================================
   GAME 10 — Word Catch (바구니 드래그)
   ===================================================================== */
const CATCH_TIME=35,DROP_SIZE=74;
function startCatch(){$('catch_score').textContent='0';$('catch_prompt').innerHTML='바구니로 '+POOL().phoneme+' 단어를 받아요!';
  const area=$('catchArea');area.innerHTML='<div id="basket">🧺</div>';go2('g_catch');startTimer(CATCH_TIME,'catch_timer');
  const mv=(e)=>{const r=area.getBoundingClientRect();const p=e.touches?e.touches[0]:e;let x=p.clientX-r.left;x=Math.max(30,Math.min(r.width-30,x));const bk=$('basket');if(bk){bk.style.left=x+'px';bk.style.transform='translateX(-50%)';}};
  area.onmousemove=mv;area.ontouchmove=mv;
  let el=0;const spawn=setInterval(()=>{el++;spawnDrop(area,Math.max(2.2,4.5-el*0.06));},800);gAddTimer(spawn);
  const poll=setInterval(()=>checkCatch(area),60);gAddTimer(poll);}
function spawnDrop(area,speed){if(!G||G.ended)return;const p=POOL();const good=Math.random()<0.55;const it=good?shuffle(p.words)[0]:shuffle(p.distractors)[0];
  const pad=6,maxLeft=Math.max(pad,(area.clientWidth||DROP_SIZE)-DROP_SIZE-pad);
  const d=document.createElement('div');d.className='drop'+(good?'':' obst');d.style.left=(pad+Math.random()*(maxLeft-pad))+'px';d.dataset.good=good?1:0;d._it=it;
  d.style.animation='fall '+speed+'s linear forwards';d.innerHTML=`<div class="be">${it.emo}</div><div class="bl">${it.w}</div>`;
  d.addEventListener('animationend',()=>{if(!d._res&&good){const r=d.getBoundingClientRect();escaped(r.left+r.width/2,Math.max(60,r.top));}d.remove();});area.appendChild(d);}
function checkCatch(area){if(!G||G.ended)return;const bk=$('basket');if(!bk)return;const bR=bk.getBoundingClientRect();
  area.querySelectorAll('.drop').forEach(d=>{if(d._res)return;const r=d.getBoundingClientRect();
    if(r.bottom>=bR.top&&r.top<=bR.bottom&&r.left<bR.right&&r.right>bR.left){d._res=1;
      if(d.dataset.good==='1'){d.classList.add('pop');hit(d._it,r.left+r.width/2,r.top);setScoreLabel('catch');setTimeout(()=>d.remove(),200);}
      else{miss();fxPop(r.left+r.width/2,r.top,'Miss!');d.classList.add('pop');setTimeout(()=>d.remove(),200);}}});}

/* =====================================================================
   CHEST
   ===================================================================== */
let chestTaps=0;
function chestTap(){
  if(SAVE.chestDone&&SAVE.chestDone[CUR])return;
  chestTaps++;
  const ico=$('chestBig');ico.classList.remove('shaking');void ico.offsetWidth;ico.classList.add('shaking');
  ico.style.filter='drop-shadow(0 0 '+(chestTaps*7)+'px #ffc800)';
  tone(280+chestTaps*70,0.06,'square',0.12);vibe(18+chestTaps*16);
  const need=4;
  $('chestHint').textContent=(chestTaps>=need)?'🎉':'Keep tapping! ('+chestTaps+'/'+need+')';
  if(chestTaps>=need)setTimeout(openChest,180);
}
function openChest(){
  if(SAVE.chestDone&&SAVE.chestDone[CUR])return;sfxChest();fireworks();vibe([10,30,10,30,40]);
  const roll=Math.random();let icon,msg;
  if(roll<0.45){const bonus=15+Math.floor(Math.random()*20);addPearls(bonus);icon='🦪';msg='Bonus +'+bonus+' pearls!';}
  else if(roll<0.8){const owns=ITEMS.filter(i=>!SAVE.owned.includes(i.id));if(owns.length){const it=shuffle(owns)[0];SAVE.owned.push(it.id);icon=it.e;msg='New item unlocked!';}else{addPearls(25);icon='🦪';msg='Bonus +25 pearls!';}}
  else{addPearls(30);icon='🎟️';msg='Lucky! +30 pearls!';}
  if(!SAVE.chestDone)SAVE.chestDone={};SAVE.chestDone[CUR]=true;save();
  $('chestBig').style.display='none';$('chestHint').style.display='none';
  const rw=$('chestReward');rw.textContent=icon;rw.style.display='block';
  $('chestRewardMsg').textContent=msg;$('chestRewardMsg').style.display='block';$('chestDone').style.display='inline-block';
}

/* =====================================================================
   SHOP / FREE / DEX
   ===================================================================== */
function openShop(){go('shop');}
function renderShop(){$('shop_pearls').textContent=SAVE.pearls;renderAvatar('avatarShop');const g=$('shopGrid');g.innerHTML='';
  ITEMS.forEach(it=>{const owned=SAVE.owned.includes(it.id);const eq=SAVE.equipped[it.slot]===it.id;
    const d=document.createElement('div');d.className='shopItem'+(eq?' eq':owned?' owned':'');
    d.innerHTML=`<div class="e">${it.e}</div><div class="p">${owned?(eq?'Worn':'Wear'):it.price+'🦪'}</div>`;
    d.onclick=()=>{if(!owned){if(SAVE.pearls>=it.price){SAVE.pearls-=it.price;SAVE.owned.push(it.id);sfxGood();save();renderShop();}else{sfxBad();banner('Not enough pearls');}}else{if(eq)delete SAVE.equipped[it.slot];else SAVE.equipped[it.slot]=it.id;sfxPop();save();renderShop();}};
    g.appendChild(d);});}
function openFreePlay(){go('freeplay');}
function renderFree(){const fl=$('freeList');fl.innerHTML='';GAMES.forEach(g=>{const best=SAVE.best[g.key]||0;const done=(SAVE.playedToday||[]).includes(g.key);const r=document.createElement('div');r.className='mrow'+(done?' done':'');r.innerHTML=`<div class="e">${g.emoji}</div><div><div class="n">${g.name}</div><div class="s">${g.desc.replace('/s/',POOL().phoneme)}</div><div class="best">🏆 Best ${best}</div></div><div class="chk">${done?'✅':'▶'}</div>`;r.onclick=()=>playGame(g.key,false);fl.appendChild(r);});}
function openDex(){go('dex');}
function renderDex(){const c=$('dexChars');c.innerHTML='';
  Object.keys(WORLDS).forEach(k=>{const w=WORLDS[k];const owned=SAVE.chars.includes(k), label=(w.character||'').split(' the ').pop()||w.letter||k.toUpperCase();const d=document.createElement('div');d.className='dexItem'+(owned?'':' lock');d.innerHTML=`<div class="e">${owned?w.emoji:'❓'}</div><div class="l">${owned?label:'Coming soon'}<br>${w.phoneme}</div>`;c.appendChild(d);});
  const allWords=[...POOL().words,...POOL().distractors];$('dexWordCount').textContent='('+SAVE.words.length+'/'+allWords.length+')';
  const wg=$('dexWords');wg.innerHTML='';allWords.forEach(it=>{const got=SAVE.words.includes(it.w);const d=document.createElement('div');d.className='dexItem'+(got?'':' lock');d.innerHTML=`<div class="e">${got?it.emo:'❓'}</div><div class="l">${got?it.w:'???'}</div>`;if(got)d.onclick=()=>say(it.w);wg.appendChild(d);});}

export async function bootstrapGame(){
  try{speechSynthesis.getVoices();}catch(e){}
  await loadContentDb();
  homeView=getLaunchRoute();
  renderHome();
  if(!window.__ypqClickBound){
    document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('.btn,.iconbtn');if(t)uiClick();},true);
    window.__ypqClickBound=true;
  }
}
Object.assign(window,{toggleMute,openDex,doStamp,openFreePlay,openShop,go,quitGame,quizRepeat,chestTap});
window.__YPQ={getCastleHomeState,getCollectionState,getVillageState,getLaunchRoute,enterVillage,goMap,startTodayMission,playMission,chooseStartBook,openBookCastle,openCastleFromMap,startCastleQuest,openFreePlay,openShop,openDex,toggleMute,doStamp,go,sayWord:say,sayLetter};
