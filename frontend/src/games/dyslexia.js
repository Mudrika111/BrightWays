/* ═══════════════════════════════════════════════════════════════
   SHARED SETUP
═══════════════════════════════════════════════════════════════ */
const API_URL       = "/api/activity";
let CARD_KEY      = new URLSearchParams(window.location.search).get("card") || "bw_done_dyslexia_phonics";

async function saveAndFinish(score, total) {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  const percent   = Math.round((score / total) * 100);
  document.getElementById("msg").textContent = `Score: ${score}/${total}`;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("save-status").textContent = "Saving progress...";
  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        activity_key:       CARD_KEY,
        score_percent:      percent,
        time_spent_seconds: timeSpent
      })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("save-status").textContent = "✓ Progress saved!";
    } else {
      document.getElementById("save-status").textContent = "⚠ Save failed: " + (data.message || "unknown");
    }
  } catch(e) {
    document.getElementById("save-status").textContent = "⚠ Save failed: " + e.message;
  }
  const btn = document.getElementById("back-btn");
  btn.style.pointerEvents = "";
  btn.style.opacity = "1";
}

let startTime = Date.now();

/* ═══════════════════════════════════════════════════════════════
   GAME 1 — PHONICS PLAY  (cardKey: bw_done_dyslexia_phonics)
   Original game: pick the first letter of the pictured word
═══════════════════════════════════════════════════════════════ */
function initPhonics() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">📖 Phonics Play</span>
      <span>⭐ <span id="score">0</span>/3</span>
    </div>
    <p>Pick the first letter</p>
    <div class="word">
      <div id="img"></div>
      <div id="text"></div>
    </div>
    <div class="opts" id="opts"></div>
  `;

  const QUESTIONS = [
    { word:"CAT", img:"🐱", answer:"C", options:["C","B","D"] },
    { word:"SUN", img:"☀️", answer:"S", options:["S","P","T"] },
    { word:"DOG", img:"🐶", answer:"D", options:["D","G","B"] }
  ];
  let index = 0, score = 0;

  function show() {
    if (index >= QUESTIONS.length) return saveAndFinish(score, QUESTIONS.length);
    const q = QUESTIONS[index];
    document.getElementById("img").textContent  = q.img;
    document.getElementById("text").textContent = q.word;
    document.getElementById("opts").innerHTML   = q.options.map(o =>
      `<button class="opt" onclick="phonicsCheck('${o}',this,'${q.answer}')">${o}</button>`
    ).join("");
  }

  window.phonicsCheck = function(choice, btn, answer) {
    document.querySelectorAll(".opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("score").textContent = score;
    index++;
    setTimeout(show, 1000);
  };

  show();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 2 — WORD MATCH  (cardKey: bw_done_dyslexia_word)
   Match each picture to the correct word
═══════════════════════════════════════════════════════════════ */
function initWordMatch() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">📝 Word Match</span>
      <span>✅ <span id="wm-score">0</span>/4</span>
    </div>
    <p style="margin-bottom:8px">Match each picture to its word!</p>
    <div class="wm-pair-grid">
      <div class="wm-col" id="wm-imgs"></div>
      <div class="wm-col" id="wm-words"></div>
    </div>
  `;

  const PAIRS = [
    { img:"🐘", word:"ELEPHANT" },
    { img:"🌈", word:"RAINBOW"  },
    { img:"🍕", word:"PIZZA"    },
    { img:"⚽", word:"BALL"     }
  ];

  // Shuffle words column independently
  const shuffledWords = [...PAIRS].sort(() => Math.random() - .5);
  let selectedImg  = null;
  let matchedCount = 0;
  let score        = 0;

  function render() {
    document.getElementById("wm-imgs").innerHTML = PAIRS.map((p, i) =>
      `<div class="wm-item wm-img" id="img-${i}" data-idx="${i}" onclick="wmSelectImg(${i})">${p.img}</div>`
    ).join("");
    document.getElementById("wm-words").innerHTML = shuffledWords.map((p, i) =>
      `<div class="wm-item wm-word" id="word-${i}" data-word="${p.word}" onclick="wmSelectWord(${i})">${p.word}</div>`
    ).join("");
  }

  window.wmSelectImg = function(idx) {
    if (document.getElementById(`img-${idx}`).classList.contains("matched")) return;
    document.querySelectorAll(".wm-img").forEach(el => el.classList.remove("selected"));
    document.getElementById(`img-${idx}`).classList.add("selected");
    selectedImg = idx;
  };

  window.wmSelectWord = function(wIdx) {
    if (selectedImg === null) return;
    const wordEl  = document.getElementById(`word-${wIdx}`);
    if (wordEl.classList.contains("matched")) return;
    const imgEl   = document.getElementById(`img-${selectedImg}`);
    const correct = PAIRS[selectedImg].word;
    if (shuffledWords[wIdx].word === correct) {
      score++;
      matchedCount++;
      imgEl.classList.add("matched");
      wordEl.classList.add("matched");
      document.getElementById("wm-score").textContent = score;
      selectedImg = null;
      if (matchedCount >= PAIRS.length) setTimeout(() => saveAndFinish(score, PAIRS.length), 600);
    } else {
      wordEl.classList.add("wrong-flash");
      imgEl.classList.add("wrong-flash");
      setTimeout(() => {
        wordEl.classList.remove("wrong-flash");
        imgEl.classList.remove("wrong-flash");
      }, 700);
      selectedImg = null;
      document.querySelectorAll(".wm-img").forEach(el => el.classList.remove("selected"));
    }
  };

  render();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 3 — RHYME TIME  (cardKey: bw_done_dyslexia_rhyme)
   Pick the word that rhymes with the given word
═══════════════════════════════════════════════════════════════ */
function initRhymeTime() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🎵 Rhyme Time</span>
      <span>⭐ <span id="rt-score">0</span>/4</span>
    </div>
    <div class="rt-instruction">Which word rhymes?</div>
    <div class="rt-word" id="rt-word"></div>
    <div class="rt-opts" id="rt-opts"></div>
  `;

  const QUESTIONS = [
    { word:"CAT",  answer:"HAT",  options:["HAT","SUN","BIG","RUN"]  },
    { word:"CAKE", answer:"LAKE", options:["FISH","LAKE","TREE","BOX"] },
    { word:"MOON", answer:"SPOON",options:["SPOON","STAR","HAND","COLD"] },
    { word:"RING", answer:"SING", options:["JUMP","COLD","SING","DOOR"] }
  ];
  let index = 0, score = 0;

  function show() {
    if (index >= QUESTIONS.length) return saveAndFinish(score, QUESTIONS.length);
    const q = QUESTIONS[index];
    document.getElementById("rt-word").textContent = q.word;
    const shuffled = [...q.options].sort(() => Math.random() - .5);
    document.getElementById("rt-opts").innerHTML = shuffled.map(o =>
      `<button class="rt-opt" onclick="rtCheck('${o}',this,'${q.answer}')">${o}</button>`
    ).join("");
  }

  window.rtCheck = function(choice, btn, answer) {
    document.querySelectorAll(".rt-opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("rt-score").textContent = score;
    index++;
    setTimeout(show, 1000);
  };

  show();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 4 — LETTER SOUNDS  (cardKey: bw_done_dyslexia_letters)
   See a letter, pick which picture starts with that sound
═══════════════════════════════════════════════════════════════ */
function initLetterSounds() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🔡 Letter Sounds</span>
      <span>⭐ <span id="ls-score">0</span>/4</span>
    </div>
    <div class="ls-prompt">Which picture starts with this letter?</div>
    <div class="ls-letter" id="ls-letter"></div>
    <div class="ls-opts" id="ls-opts"></div>
  `;

  const QUESTIONS = [
    { letter:"B", answer:{ emoji:"🦋", word:"Butterfly" }, distractors:[{emoji:"🐟",word:"Fish"},{emoji:"🐘",word:"Elephant"},{emoji:"🌸",word:"Flower"}] },
    { letter:"T", answer:{ emoji:"🐢", word:"Turtle"    }, distractors:[{emoji:"🦁",word:"Lion"},{emoji:"🐸",word:"Frog"},{emoji:"🍌",word:"Banana"}] },
    { letter:"P", answer:{ emoji:"🍕", word:"Pizza"     }, distractors:[{emoji:"🚗",word:"Car"},{emoji:"🌙",word:"Moon"},{emoji:"🎈",word:"Kite"}] },
    { letter:"S", answer:{ emoji:"⭐", word:"Star"      }, distractors:[{emoji:"🐱",word:"Cat"},{emoji:"🍎",word:"Apple"},{emoji:"🐸",word:"Frog"}] }
  ];
  let index = 0, score = 0;

  function show() {
    if (index >= QUESTIONS.length) return saveAndFinish(score, QUESTIONS.length);
    const q = QUESTIONS[index];
    document.getElementById("ls-letter").textContent = q.letter;
    const options = [q.answer, ...q.distractors].sort(() => Math.random() - .5);
    document.getElementById("ls-opts").innerHTML = options.map(opt =>
      `<button class="ls-opt" onclick="lsCheck('${opt.word}',this,'${q.answer.word}')">
         <span class="ls-emoji">${opt.emoji}</span>
         <span class="ls-word">${opt.word}</span>
       </button>`
    ).join("");
  }

  window.lsCheck = function(choice, btn, answer) {
    document.querySelectorAll(".ls-opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("ls-score").textContent = score;
    index++;
    setTimeout(show, 1000);
  };

  show();
}

/* ═══════════════════════════════════════════════════════════════
   ROUTER — pick game based on card param
═══════════════════════════════════════════════════════════════ */


export function startActivityGame(cardKey) {
  CARD_KEY = cardKey || 'bw_done_dyslexia_phonics';
  startTime = Date.now();
  switch (CARD_KEY) {
    case 'bw_done_dyslexia_phonics': initPhonics(); break;
    case 'bw_done_dyslexia_word': initWordMatch(); break;
    case 'bw_done_dyslexia_rhyme': initRhymeTime(); break;
    case 'bw_done_dyslexia_letters': initLetterSounds(); break;
    default: initPhonics();
  }
}
