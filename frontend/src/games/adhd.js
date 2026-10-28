/* ═══════════════════════════════════════════════════════════════
   SHARED SETUP
═══════════════════════════════════════════════════════════════ */
const API_URL       = "/api/activity";
let CARD_KEY      = new URLSearchParams(window.location.search).get("card") || "bw_done_adhd_memory";

let startTime = Date.now();

async function saveAndFinish(score, total, modalTitle) {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  const percent   = total > 0 ? Math.round((score / total) * 100) : 100;
  if (modalTitle) document.getElementById("modal-title").textContent = modalTitle;
  document.getElementById("msg").textContent = `You scored ${score}/${total}`;
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
      document.getElementById("save-status").textContent = "⚠ Save failed: " + (data.message || "unknown error");
    }
  } catch(e) {
    document.getElementById("save-status").textContent = "⚠ Save failed: " + e.message;
  }
  const btn = document.getElementById("back-btn");
  btn.style.pointerEvents = "";
  btn.style.opacity = "1";
}

/* ═══════════════════════════════════════════════════════════════
   GAME 1 — MEMORY MATCH  (cardKey: bw_done_adhd_memory)
   Original game: remember the emoji sequence then pick it
═══════════════════════════════════════════════════════════════ */
function initMemoryMatch() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🧠 Memory Match</span>
      <span>⭐ <span id="score">0</span> / <span id="total">3</span></span>
    </div>
    <p>Remember the sequence!</p>
    <div class="timer-row">
      <span class="timer-count">⏱ <span id="timer-val">5</span>s</span>
      <div class="timer-track"><div class="timer-fill" id="timer-fill" style="width:100%"></div></div>
    </div>
    <div class="mem-row" id="mem-row"></div>
    <div class="seq-opts" id="seq-opts"></div>
  `;

  const QUESTIONS = [
    { seq:['🐶','🐱','🐸'], options:[['🐶','🐱','🐸'],['🐱','🐸','🐶'],['🐸','🐶','🐱']], answer:0 },
    { seq:['🍎','🍌','🍇'], options:[['🍌','🍎','🍇'],['🍎','🍌','🍇'],['🍇','🍌','🍎']], answer:1 },
    { seq:['⭐','🌙','☀️'], options:[['☀️','⭐','🌙'],['🌙','☀️','⭐'],['⭐','🌙','☀️']], answer:2 }
  ];

  let score = 0, index = 0, timer;
  document.getElementById("total").textContent = QUESTIONS.length;

  function show() {
    if (index >= QUESTIONS.length) return saveAndFinish(score, QUESTIONS.length);
    const q = QUESTIONS[index];
    document.getElementById("seq-opts").innerHTML = "";
    document.getElementById("mem-row").innerHTML = q.seq.map(e => `<div class="mem-tile">${e}</div>`).join("");
    let t = 5;
    document.getElementById("timer-val").textContent = t;
    document.getElementById("timer-fill").style.width = "100%";
    clearInterval(timer);
    timer = setInterval(() => {
      t--;
      document.getElementById("timer-val").textContent = t;
      document.getElementById("timer-fill").style.width = (t / 5 * 100) + "%";
      if (t <= 0) { clearInterval(timer); hide(q); }
    }, 1000);
  }

  function hide(q) {
    document.querySelectorAll(".mem-tile").forEach(t => t.classList.add("hidden"));
    document.getElementById("seq-opts").innerHTML = q.options.map((opt, i) =>
      `<button class="seq-opt" onclick="mmCheck(${i},${q.answer})">${opt.join(" ")}</button>`
    ).join("");
  }

  window.mmCheck = function(chosen, answer) {
    document.querySelectorAll(".seq-opt").forEach(b => b.disabled = true);
    if (chosen === answer) score++;
    document.getElementById("score").textContent = score;
    index++;
    setTimeout(show, 1000);
  };

  show();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 2 — QUICK RECALL  (cardKey: bw_done_adhd_recall)
   Flip & match pairs — classic concentration card game.
   Trains working memory & sustained attention.
═══════════════════════════════════════════════════════════════ */
function initQuickRecall() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">⚡ Quick Recall</span>
      <span>✅ <span id="qr-pairs">0</span>/4 pairs</span>
    </div>
    <div class="qr-info">Tap two cards — find the matching pairs!</div>
    <div class="qr-grid" id="qr-grid"></div>
  `;

  const EMOJIS  = ['🦊','🌈','🍦','🚀'];
  // Duplicate and shuffle
  const cards   = [...EMOJIS, ...EMOJIS]
    .map((e, i) => ({ id: i, emoji: e, matched: false }))
    .sort(() => Math.random() - .5);

  let flipped   = [];   // indices currently face-up (unmatched)
  let locked    = false;
  let pairsFound = 0;
  const TOTAL   = EMOJIS.length;

  function render() {
    document.getElementById("qr-grid").innerHTML = cards.map((c, i) => {
      let cls = "qr-tile";
      if (c.matched)               cls += " matched";
      else if (flipped.includes(i)) cls += " revealed";
      else                          cls += " hidden";
      const content = (c.matched || flipped.includes(i)) ? c.emoji : "";
      return `<div class="${cls}" onclick="qrFlip(${i})">${content}</div>`;
    }).join("");
  }

  window.qrFlip = function(i) {
    if (locked || cards[i].matched || flipped.includes(i)) return;
    flipped.push(i);
    render();
    if (flipped.length < 2) return;
    locked = true;
    const [a, b] = flipped;
    if (cards[a].emoji === cards[b].emoji) {
      cards[a].matched = cards[b].matched = true;
      pairsFound++;
      document.getElementById("qr-pairs").textContent = pairsFound;
      flipped = [];
      locked  = false;
      render();
      if (pairsFound >= TOTAL) saveAndFinish(TOTAL, TOTAL);
    } else {
      // Flash wrong then flip back
      setTimeout(() => {
        const tiles = document.querySelectorAll(".qr-tile");
        [a, b].forEach(idx => tiles[idx] && tiles[idx].classList.add("wrong-flash"));
        setTimeout(() => {
          flipped = [];
          locked  = false;
          render();
        }, 600);
      }, 700);
    }
  };

  render();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 3 — SPOT THE DIFF  (cardKey: bw_done_adhd_spot)
   Two emoji grids side by side — tap the cell that differs.
   Trains selective attention & visual scanning.
═══════════════════════════════════════════════════════════════ */
function initSpotTheDiff() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🎯 Spot the Diff</span>
      <span>⭐ <span id="std-score">0</span>/3</span>
    </div>
    <div class="std-hint" id="std-hint">Tap the cell in Picture B that is different!</div>
    <div class="std-panels">
      <div class="std-panel">
        <div class="std-label">Picture A</div>
        <div class="std-grid" id="std-a"></div>
      </div>
      <div class="std-panel">
        <div class="std-label">Picture B — tap the odd one!</div>
        <div class="std-grid" id="std-b"></div>
      </div>
    </div>
    <div class="std-found" id="std-found"></div>
  `;

  // Each round: a 3×3 grid (9 emojis). One cell in B is swapped.
  const ROUNDS = [
    {
      base: ['🍎','🍌','🍇','🍓','🍒','🍑','🍍','🥭','🍋'],
      diffIdx: 4, diffEmoji: '🍕'   // position 4 (centre) swapped to pizza
    },
    {
      base: ['🐶','🐱','🐸','🐻','🦊','🐼','🐨','🐯','🦁'],
      diffIdx: 7, diffEmoji: '🦋'
    },
    {
      base: ['⭐','🌙','☀️','🌈','⚡','🌊','🔥','❄️','🌸'],
      diffIdx: 2, diffEmoji: '🍦'
    }
  ];

  let index = 0, score = 0;

  function showRound() {
    if (index >= ROUNDS.length) return saveAndFinish(score, ROUNDS.length);
    const r = ROUNDS[index];
    document.getElementById("std-found").textContent = "";

    document.getElementById("std-a").innerHTML = r.base.map(e =>
      `<div class="std-cell">${e}</div>`
    ).join("");

    document.getElementById("std-b").innerHTML = r.base.map((e, i) => {
      const emoji = (i === r.diffIdx) ? r.diffEmoji : e;
      return `<div class="std-cell clickable" onclick="stdCheck(${i}, ${r.diffIdx})">${emoji}</div>`;
    }).join("");
  }

  window.stdCheck = function(tapped, correctIdx) {
    document.querySelectorAll("#std-b .std-cell").forEach(c => {
      c.classList.remove("clickable");
      c.onclick = null;
    });
    const cells = document.querySelectorAll("#std-b .std-cell");
    if (tapped === correctIdx) {
      score++;
      cells[tapped].classList.add("correct-diff");
      document.getElementById("std-found").textContent = "✅ Found it!";
      document.getElementById("std-score").textContent = score;
    } else {
      cells[tapped].classList.add("wrong-diff");
      cells[correctIdx].classList.add("correct-diff");
      document.getElementById("std-found").textContent = "❌ That one was the same!";
    }
    index++;
    setTimeout(showRound, 1300);
  };

  showRound();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 4 — NUMBER DASH  (cardKey: bw_done_adhd_number)
   A number flashes briefly — type it back on a keypad.
   Trains working memory for digits & impulse control.
═══════════════════════════════════════════════════════════════ */
function initNumberDash() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🔢 Number Dash</span>
      <span>⭐ <span id="nd-score">0</span>/4</span>
    </div>
    <div class="timer-row">
      <span class="timer-count">⏱ <span id="nd-timer">3</span>s</span>
      <div class="timer-track"><div class="timer-fill" id="nd-fill" style="width:100%"></div></div>
    </div>
    <div class="nd-display" id="nd-display">?</div>
    <div class="nd-prompt"  id="nd-prompt">Get ready…</div>
    <div class="nd-answer"  id="nd-answer"></div>
    <div class="nd-keypad"  id="nd-keypad" style="display:none">
      ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k =>
        k === ''
          ? `<div></div>`
          : `<button class="nd-key${k==='⌫'?' del':''}" onclick="ndKey('${k}')">${k}</button>`
      ).join("")}
    </div>
    <div class="nd-feedback" id="nd-feedback"></div>
  `;

  // Numbers grow in digit length for difficulty
  const ROUNDS = [
    { number: "47"   },
    { number: "193"  },
    { number: "5826" },
    { number: "7341" }
  ];

  let index = 0, score = 0, answer = "", timer;

  function showNumber() {
    if (index >= ROUNDS.length) return saveAndFinish(score, ROUNDS.length);
    const n = ROUNDS[index].number;
    answer  = "";
    document.getElementById("nd-display").textContent  = n;
    document.getElementById("nd-prompt").textContent   = "Remember this number!";
    document.getElementById("nd-answer").textContent   = "";
    document.getElementById("nd-keypad").style.display = "none";
    document.getElementById("nd-feedback").textContent = "";

    let t = 3;
    document.getElementById("nd-timer").textContent = t;
    document.getElementById("nd-fill").style.width  = "100%";
    clearInterval(timer);
    timer = setInterval(() => {
      t--;
      document.getElementById("nd-timer").textContent = t;
      document.getElementById("nd-fill").style.width  = (t / 3 * 100) + "%";
      if (t <= 0) { clearInterval(timer); hideNumber(n); }
    }, 1000);
  }

  function hideNumber(correct) {
    document.getElementById("nd-display").textContent  = "?";
    document.getElementById("nd-prompt").textContent   = "Type the number you saw!";
    document.getElementById("nd-keypad").style.display = "";
    window._ndCorrect = correct;
  }

  window.ndKey = function(k) {
    if (k === '⌫') {
      answer = answer.slice(0, -1);
    } else if (answer.length < 6) {
      answer += k;
    }
    document.getElementById("nd-answer").textContent = answer || " ";

    // Auto-submit when enough digits entered
    if (answer.length === window._ndCorrect.length) {
      setTimeout(ndSubmit, 300);
    }
  };

  function ndSubmit() {
    document.querySelectorAll(".nd-key").forEach(b => b.disabled = true);
    const correct = window._ndCorrect;
    if (answer === correct) {
      score++;
      document.getElementById("nd-feedback").textContent = "✅ Correct!";
      document.getElementById("nd-feedback").style.color = "#00B894";
    } else {
      document.getElementById("nd-feedback").textContent = `❌ It was ${correct}`;
      document.getElementById("nd-feedback").style.color = "#FF6584";
    }
    document.getElementById("nd-score").textContent = score;
    index++;
    setTimeout(() => {
      document.querySelectorAll(".nd-key").forEach(b => b.disabled = false);
      showNumber();
    }, 1200);
  }

  showNumber();
}

/* ═══════════════════════════════════════════════════════════════
   ROUTER — pick game based on card param
═══════════════════════════════════════════════════════════════ */


export function startActivityGame(cardKey) {
  CARD_KEY = cardKey || 'bw_done_adhd_memory';
  startTime = Date.now();
  switch (CARD_KEY) {
    case 'bw_done_adhd_memory': initMemoryMatch(); break;
    case 'bw_done_adhd_recall': initQuickRecall(); break;
    case 'bw_done_adhd_spot': initSpotTheDiff(); break;
    case 'bw_done_adhd_number': initNumberDash(); break;
    default: initMemoryMatch();
  }
}
