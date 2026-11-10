/* ═══════════════════════════════════════════════════════════════
   SHARED SETUP
═══════════════════════════════════════════════════════════════ */
const API_URL = "/api/activity";
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
    document.querySelectorAll<HTMLButtonElement>(".opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("score").textContent = String(score);
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
      document.getElementById("wm-score").textContent = String(score);
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
    document.querySelectorAll<HTMLButtonElement>(".rt-opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("rt-score").textContent = String(score);
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
    document.querySelectorAll<HTMLButtonElement>(".ls-opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("ls-score").textContent = String(score);
    index++;
    setTimeout(show, 1000);
  };

  show();
}

function initWordBuilder() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Word Builder activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🧱 Word Builder</span>
      <span id="wb-round">Word 1 / 4</span>
    </div>
    <p class="game-instructions">Put one letter in each box to build the word. Take your time—you can change any letter.</p>
    <div class="wb-clue">
      <span class="wb-picture" id="wb-picture" aria-hidden="true"></span>
      <span id="wb-clue"></span>
    </div>
    <div class="wb-slots" id="wb-slots" aria-label="Your word"></div>
    <div class="wb-tiles" id="wb-tiles" aria-label="Choose a letter"></div>
    <p class="game-feedback" id="wb-feedback" aria-live="polite"></p>
    <div class="wb-actions">
      <button class="seq-opt" type="button" onclick="wbClear()">Start over</button>
      <button class="game-action" id="wb-check" type="button" disabled onclick="wbCheck()">Check my word →</button>
      <button class="game-action" id="wb-next" type="button" style="display:none" onclick="wbNext()">Next word →</button>
    </div>
  `;
  const rounds = [
    { picture: "🐱", clue: "A pet that purrs and says meow", answer: "CAT", hint: "Listen for /k/ at the beginning." },
    { picture: "☀️", clue: "It shines in the sky during the day", answer: "SUN", hint: "Listen for /s/ at the beginning." },
    { picture: "🐶", clue: "A pet that barks", answer: "DOG", hint: "Listen for /d/ at the beginning." },
    { picture: "🗺️", clue: "You can use it to find your way", answer: "MAP", hint: "Listen for /m/ at the beginning." }
  ];
  let round = 0;
  let selected: number[] = [];
  let score = 0;
  let checked = false;

  function render() {
    const current = rounds[round];
    selected = [];
    checked = false;
    document.getElementById("wb-round").textContent = `Word ${round + 1} / ${rounds.length}`;
    document.getElementById("wb-picture").textContent = current.picture;
    document.getElementById("wb-clue").textContent = current.clue;
    document.getElementById("wb-feedback").textContent = current.hint;
    document.getElementById("wb-next").style.display = "none";
    document.getElementById("wb-check").style.display = "";
    document.getElementById("wb-tiles").innerHTML = [...current.answer, "E"].map((letter, index) =>
      `<button class="wb-tile" type="button" aria-label="Choose letter ${letter}" onclick="wbPick(${index})">${letter}</button>`
    ).join("");
    renderSlots();
  }

  function renderSlots() {
    const current = rounds[round];
    document.getElementById("wb-slots").innerHTML = Array.from({ length: current.answer.length }, (_, slot) => {
      const tileIndex = selected[slot];
      return tileIndex === undefined
        ? `<span class="wb-slot" aria-label="Empty letter ${slot + 1}">_</span>`
        : `<button class="wb-slot filled" type="button" aria-label="Remove ${current.answer[tileIndex]}" onclick="wbRemove(${slot})">${[...current.answer, "E"][tileIndex]}</button>`;
    }).join("");
    document.querySelectorAll<HTMLButtonElement>(".wb-tile").forEach((button, index) => {
      button.disabled = selected.includes(index) || checked;
      button.classList.toggle("used", selected.includes(index));
    });
    (document.getElementById("wb-check") as HTMLButtonElement).disabled = selected.length !== current.answer.length || checked;
  }

  window.wbPick = index => {
    if (checked || selected.length >= rounds[round].answer.length || selected.includes(index)) return;
    selected.push(index);
    document.getElementById("wb-feedback").textContent = "Keep going—one letter in each box.";
    renderSlots();
    const target = selected.length === rounds[round].answer.length
      ? document.getElementById("wb-check")
      : document.querySelector<HTMLButtonElement>(".wb-tile:not(:disabled)");
    target?.focus();
  };
  window.wbRemove = slot => {
    if (checked) return;
    selected.splice(slot, 1);
    document.getElementById("wb-feedback").textContent = rounds[round].hint;
    renderSlots();
    document.querySelector<HTMLButtonElement>(".wb-tile:not(:disabled)")?.focus();
  };
  window.wbClear = () => {
    if (checked) return;
    selected = [];
    document.getElementById("wb-feedback").textContent = rounds[round].hint;
    renderSlots();
    document.querySelector<HTMLButtonElement>(".wb-tile:not(:disabled)")?.focus();
  };
  window.wbCheck = () => {
    if (selected.length !== rounds[round].answer.length || checked) return;
    const letters = [...rounds[round].answer, "E"];
    const word = selected.map(index => letters[index]).join("");
    if (word !== rounds[round].answer) {
      document.getElementById("wb-feedback").textContent = "Not quite. Tap a letter in your word to change it, then try again.";
      return;
    }
    checked = true;
    score++;
    document.getElementById("wb-feedback").textContent = `Great building! ${word} is made of ${word.split("").join(" · ")}.`;
    document.getElementById("wb-check").style.display = "none";
    const next = document.getElementById("wb-next") as HTMLButtonElement;
    next.textContent = round === rounds.length - 1 ? "Finish →" : "Next word →";
    next.style.display = "";
    renderSlots();
    next.focus();
  };
  window.wbNext = () => {
    if (!checked) return;
    round++;
    if (round >= rounds.length) return saveAndFinish(score, rounds.length);
    render();
    document.querySelector<HTMLButtonElement>(".wb-tile")?.focus();
  };

  render();
}

function initSyllableBuilder() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Syllable Builder activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🧭 Syllable Safari</span>
      <span id="syllable-round">Word 1 / 3</span>
    </div>
    <p class="game-instructions">Tap the word parts in order to build the picture's name. You can undo and try again.</p>
    <div class="syllable-clue">
      <span id="syllable-picture" aria-hidden="true"></span>
      <span id="syllable-clue"></span>
    </div>
    <div class="syllable-built" id="syllable-built" aria-label="Your word"></div>
    <div class="syllable-pieces" id="syllable-pieces"></div>
    <p class="game-feedback" id="syllable-feedback" aria-live="polite"></p>
    <div class="wb-actions">
      <button class="seq-opt" type="button" onclick="syllableClear()">Start over</button>
      <button class="game-action" id="syllable-next" type="button" style="display:none" onclick="syllableNext()">Next word →</button>
    </div>
  `;
  const rounds = [
    { picture: "🌈", clue: "A colorful arc in the sky", pieces: ["bow", "rain"], answer: [1, 0] },
    { picture: "🧁", clue: "A little treat baked in a paper cup", pieces: ["cake", "cup"], answer: [1, 0] },
    { picture: "🌇", clue: "When the sun goes down", pieces: ["set", "sun"], answer: [1, 0] }
  ];
  let round = 0;
  let selected: number[] = [];
  let score = 0;
  let checked = false;

  function render() {
    const current = rounds[round];
    selected = [];
    checked = false;
    document.getElementById("syllable-round").textContent = `Word ${round + 1} / ${rounds.length}`;
    document.getElementById("syllable-picture").textContent = current.picture;
    document.getElementById("syllable-clue").textContent = current.clue;
    document.getElementById("syllable-feedback").textContent = "Build the word one part at a time.";
    document.getElementById("syllable-next").style.display = "none";
    document.getElementById("syllable-pieces").innerHTML = current.pieces.map((piece, index) =>
      `<button class="syllable-piece" type="button" onclick="syllablePick(${index})">${piece}</button>`
    ).join("");
    renderBuilt();
  }

  function renderBuilt() {
    const current = rounds[round];
    document.getElementById("syllable-built").innerHTML = current.answer.map((_, slot) => {
      const pieceIndex = selected[slot];
      return pieceIndex === undefined
        ? `<span class="syllable-slot" aria-label="Empty word part ${slot + 1}">…</span>`
        : `<button class="syllable-slot filled" type="button" aria-label="Remove ${current.pieces[pieceIndex]}" onclick="syllableRemove(${slot})">${current.pieces[pieceIndex]}</button>`;
    }).join("");
    document.querySelectorAll<HTMLButtonElement>(".syllable-piece").forEach((button, index) => {
      button.disabled = selected.includes(index) || checked;
      button.classList.toggle("used", selected.includes(index));
    });
  }

  window.syllablePick = index => {
    if (checked || selected.includes(index) || selected.length >= rounds[round].answer.length) return;
    selected.push(index);
    if (selected.length === rounds[round].answer.length) {
      const correct = selected.every((piece, slot) => piece === rounds[round].answer[slot]);
      if (correct) {
        checked = true;
        score++;
        document.getElementById("syllable-feedback").textContent = `You built it! ${selected.map(piece => rounds[round].pieces[piece]).join(" · ")}.`;
        const next = document.getElementById("syllable-next") as HTMLButtonElement;
        next.textContent = round === rounds.length - 1 ? "Finish safari →" : "Next word →";
        next.style.display = "";
        next.focus();
      } else {
        document.getElementById("syllable-feedback").textContent = "Those parts make a different word. Tap a part to change it, or start over.";
      }
    }
    renderBuilt();
    const target = checked
      ? document.getElementById("syllable-next")
      : selected.length === rounds[round].answer.length
        ? document.querySelector<HTMLButtonElement>(".syllable-slot.filled")
        : document.querySelector<HTMLButtonElement>(".syllable-piece:not(:disabled)");
    target?.focus();
  };
  window.syllableRemove = slot => {
    if (checked) return;
    selected.splice(slot, 1);
    document.getElementById("syllable-feedback").textContent = "Choose the word parts in the order that sounds right.";
    renderBuilt();
    document.querySelector<HTMLButtonElement>(".syllable-piece:not(:disabled)")?.focus();
  };
  window.syllableClear = () => {
    if (checked) return;
    selected = [];
    document.getElementById("syllable-feedback").textContent = "Build the word one part at a time.";
    renderBuilt();
    document.querySelector<HTMLButtonElement>(".syllable-piece:not(:disabled)")?.focus();
  };
  window.syllableNext = () => {
    if (!checked) return;
    round++;
    if (round >= rounds.length) return saveAndFinish(score, rounds.length);
    render();
    document.querySelector<HTMLButtonElement>(".syllable-piece")?.focus();
  };

  render();
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
    case 'bw_done_dyslexia_builder': initWordBuilder(); break;
    case 'bw_done_dyslexia_syllables': initSyllableBuilder(); break;
    default: initPhonics();
  }
}
