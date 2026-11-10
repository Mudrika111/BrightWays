/* ═══════════════════════════════════════════════════════════════
   SHARED SETUP
═══════════════════════════════════════════════════════════════ */
const API_URL = "/api/activity";
let CARD_KEY      = new URLSearchParams(window.location.search).get("card") || "bw_done_adhd_memory";

let startTime = Date.now();

async function saveAndFinish(score, total, modalTitle = "") {
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
    <p class="game-instructions">Look at the pattern, then tap when you are ready. There is no timer.</p>
    <div class="mem-row" id="mem-row"></div>
    <button class="game-action" id="mm-ready" type="button">I'm ready</button>
    <div class="seq-opts" id="seq-opts"></div>
    <p class="game-feedback" id="mm-feedback" aria-live="polite"></p>
  `;

  const QUESTIONS = [
    { seq:['🐶','🐱','🐸'], options:[['🐶','🐱','🐸'],['🐱','🐸','🐶'],['🐸','🐶','🐱']], answer:0 },
    { seq:['🍎','🍌','🍇'], options:[['🍌','🍎','🍇'],['🍎','🍌','🍇'],['🍇','🍌','🍎']], answer:1 },
    { seq:['⭐','🌙','☀️'], options:[['☀️','⭐','🌙'],['🌙','☀️','⭐'],['⭐','🌙','☀️']], answer:2 }
  ];

  let score = 0, index = 0;
  document.getElementById("total").textContent = String(QUESTIONS.length);

  function show() {
    if (index >= QUESTIONS.length) return saveAndFinish(score, QUESTIONS.length);
    const q = QUESTIONS[index];
    document.getElementById("seq-opts").innerHTML = "";
    document.getElementById("mm-feedback").textContent = "";
    document.getElementById("mm-ready").style.display = "";
    document.getElementById("mem-row").innerHTML = q.seq.map(e => `<div class="mem-tile">${e}</div>`).join("");
    document.getElementById("mm-ready").onclick = () => hide(q);
    if (index > 0) document.getElementById("mm-ready").focus();
  }

  function hide(q) {
    document.getElementById("mm-ready").style.display = "none";
    document.querySelectorAll(".mem-tile").forEach(t => t.classList.add("hidden"));
    document.getElementById("seq-opts").innerHTML = q.options.map((opt, i) =>
      `<button class="seq-opt" type="button" onclick="mmCheck(${i},${q.answer},this)">${opt.join(" ")}</button>`
    ).join("");
    document.querySelector<HTMLButtonElement>(".seq-opt")?.focus();
  }

  window.mmCheck = function(chosen, answer, button) {
    const options = document.querySelectorAll<HTMLButtonElement>(".seq-opt");
    options.forEach(option => option.disabled = true);
    const correct = chosen === answer;
    button.classList.add(correct ? "correct" : "wrong");
    document.getElementById("mm-feedback").textContent = correct
      ? "Nice remembering! Let's try the next one."
      : `Good try! The pattern was ${QUESTIONS[index].seq.join(" ")}.`;
    if (correct) score++;
    document.getElementById("score").textContent = String(score);
    index++;
    setTimeout(show, 1500);
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
    <div class="qr-info">Take your time. Tap two cards to find a pair — there is no timer.</div>
    <div class="qr-stats"><span id="qr-attempts">0</span> tries</div>
    <div class="qr-grid" id="qr-grid"></div>
    <p class="game-feedback" id="qr-feedback" aria-live="polite"></p>
  `;

  const EMOJIS  = ['🦊','🌈','🍦','🚀'];
  // Duplicate and shuffle
  const cards   = [...EMOJIS, ...EMOJIS]
    .map((e, i) => ({ id: i, emoji: e, matched: false }))
    .sort(() => Math.random() - .5);

  let flipped   = [];   // indices currently face-up (unmatched)
  let locked    = false;
  let pairsFound = 0;
  let attempts = 0;
  let focusIndex: number | null = null;
  const TOTAL   = EMOJIS.length;

  function render() {
    const grid = document.getElementById("qr-grid");
    grid.innerHTML = cards.map((c, i) => {
      let cls = "qr-tile";
      if (c.matched)               cls += " matched";
      else if (flipped.includes(i)) cls += " revealed";
      else                          cls += " hidden";
      const content = (c.matched || flipped.includes(i)) ? c.emoji : "";
      const label = c.matched ? `Matched ${c.emoji}` : flipped.includes(i) ? `Card showing ${c.emoji}` : "Hidden card";
      return `<button class="${cls}" type="button" data-card-index="${i}" aria-label="${label}" aria-pressed="${flipped.includes(i) || c.matched}" ${c.matched || locked ? "disabled" : ""} onclick="qrFlip(${i})">${content}</button>`;
    }).join("");
    const preferred = focusIndex === null ? null : grid.querySelector<HTMLButtonElement>(`[data-card-index="${focusIndex}"]:not(:disabled)`);
    (preferred || grid.querySelector<HTMLButtonElement>(".qr-tile:not(:disabled)"))?.focus();
  }

  window.qrFlip = function(i) {
    if (locked || cards[i].matched || flipped.includes(i)) return;
    focusIndex = i;
    flipped.push(i);
    render();
    if (flipped.length < 2) return;
    locked = true;
    attempts++;
    document.getElementById("qr-attempts").textContent = String(attempts);
    const [a, b] = flipped;
    if (cards[a].emoji === cards[b].emoji) {
      cards[a].matched = cards[b].matched = true;
      pairsFound++;
      document.getElementById("qr-pairs").textContent = String(pairsFound);
      document.getElementById("qr-feedback").textContent = "Nice match!";
      flipped = [];
      locked  = false;
      render();
      if (pairsFound >= TOTAL) saveAndFinish(TOTAL, TOTAL);
    } else {
      document.getElementById("qr-feedback").textContent = "Not a pair this time. Try again when you are ready.";
      setTimeout(() => {
        const tiles = document.querySelectorAll<HTMLElement>(".qr-tile");
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
    <div class="std-hint" id="std-hint">Find the different picture in B. Take your time—there is no timer.</div>
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
      return `<button class="std-cell clickable" type="button" aria-label="Picture B item ${i + 1}: ${emoji}" onclick="stdCheck(${i}, ${r.diffIdx})">${emoji}</button>`;
    }).join("");
    if (index > 0) document.querySelector<HTMLButtonElement>("#std-b .std-cell")?.focus();
  }

  window.stdCheck = function(tapped, correctIdx) {
    document.querySelectorAll<HTMLButtonElement>("#std-b .std-cell").forEach(button => {
      button.classList.remove("clickable");
      button.disabled = true;
    });
    const cells = document.querySelectorAll<HTMLButtonElement>("#std-b .std-cell");
    if (tapped === correctIdx) {
      score++;
      cells[tapped].classList.add("correct-diff");
      document.getElementById("std-found").textContent = "✅ Found it! Great looking.";
      document.getElementById("std-score").textContent = String(score);
    } else {
      cells[tapped].classList.add("wrong-diff");
      cells[correctIdx].classList.add("correct-diff");
      document.getElementById("std-found").textContent = "Good try! The different one is highlighted.";
    }
    index++;
    setTimeout(showRound, 1300);
  };

  showRound();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 4 — NUMBER DASH  (cardKey: bw_done_adhd_number)
═══════════════════════════════════════════════════════════════ */
function initNumberDash() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Number Dash activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🔢 Number Dash</span>
      <span>⭐ <span id="nd-score">0</span>/4</span>
    </div>
    <p class="game-instructions">Look at the number for as long as you need. Tap when you are ready to try it from memory.</p>
    <div class="nd-display" id="nd-display">?</div>
    <div class="nd-prompt"  id="nd-prompt">Get ready…</div>
    <button class="game-action" id="nd-ready" type="button">Show number</button>
    <div class="nd-answer"  id="nd-answer"></div>
    <div class="nd-keypad"  id="nd-keypad" style="display:none">
      ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k =>
        k === ''
          ? `<div></div>`
          : `<button class="nd-key${k==='⌫'?' del':''}" type="button" onclick="ndKey('${k}')">${k}</button>`
      ).join("")}
    </div>
    <button class="game-action" id="nd-check" type="button" style="display:none">Check my answer</button>
    <div class="nd-feedback" id="nd-feedback"></div>
  `;
  const checkButton = box.querySelector<HTMLButtonElement>("#nd-check");
  if (!checkButton) throw new Error("Number Dash check button was not created.");

  const ROUNDS = [
    { number: "47"   },
    { number: "193"  },
    { number: "5826" },
    { number: "7341" }
  ];

  let index = 0, score = 0, answer = "";

  function showNumber() {
    if (index >= ROUNDS.length) return saveAndFinish(score, ROUNDS.length);
    const n = ROUNDS[index].number;
    answer  = "";
    document.getElementById("nd-display").textContent  = "?";
    document.getElementById("nd-prompt").textContent   = "Ready for the next number?";
    document.getElementById("nd-answer").textContent   = "";
    document.getElementById("nd-keypad").style.display = "none";
    document.getElementById("nd-ready").style.display = "";
    document.getElementById("nd-ready").textContent = "Show number";
    checkButton.style.display = "none";
    document.getElementById("nd-feedback").textContent = "";
    document.getElementById("nd-ready").onclick = () => showMemorizeNumber(n);
  }

  function showMemorizeNumber(number) {
    document.getElementById("nd-display").textContent = number;
    document.getElementById("nd-prompt").textContent = "Take your time. Tap when you are ready.";
    document.getElementById("nd-ready").textContent = "I'm ready";
    document.getElementById("nd-ready").onclick = () => hideNumber(number);
  }

  function hideNumber(correct) {
    document.getElementById("nd-display").textContent = "?";
    document.getElementById("nd-prompt").textContent = "Enter the number. You can fix a digit before checking.";
    document.getElementById("nd-ready").style.display = "none";
    document.getElementById("nd-keypad").style.display = "";
    checkButton.style.display = "";
    checkButton.disabled = false;
    checkButton.onclick = ndSubmit;
    window._ndCorrect = correct;
  }

  window.ndKey = function(k) {
    if (k === '⌫') {
      answer = answer.slice(0, -1);
    } else if (answer.length < 6) {
      answer += k;
    }
    document.getElementById("nd-answer").textContent = answer || " ";
  };

  function ndSubmit() {
    if (!window._ndCorrect || checkButton.disabled) return;
    checkButton.disabled = true;
    document.querySelectorAll<HTMLButtonElement>(".nd-key").forEach(b => b.disabled = true);
    const correct = window._ndCorrect;
    if (answer === correct) {
      score++;
      document.getElementById("nd-feedback").textContent = "✅ Correct!";
      document.getElementById("nd-feedback").style.color = "#00B894";
    } else {
      document.getElementById("nd-feedback").textContent = `Good try! The number was ${correct}.`;
      document.getElementById("nd-feedback").style.color = "#6B7280";
    }
    document.getElementById("nd-score").textContent = String(score);
    index++;
    setTimeout(() => {
      document.querySelectorAll<HTMLButtonElement>(".nd-key").forEach(b => b.disabled = false);
      showNumber();
    }, 1200);
  }

  showNumber();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 5 — FOCUS FINDER  (cardKey: bw_done_adhd_finder)
═══════════════════════════════════════════════════════════════ */
function initFocusFinder() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Focus Finder activity container was not found.");
  box.innerHTML = `
    <div class="mission-top"><span>🚀 SPACE SCANNER</span><span id="ff-round">SIGNAL 1 / 3</span></div>
    <div class="mission-track"><span id="ff-progress"></span></div>
    <div class="scanner-scene">
      <div class="scanner-copy"><span class="scanner-eyebrow">YOUR MISSION</span><h2 id="ff-title"></h2><p id="ff-prompt"></p></div>
      <div class="scanner-target" id="ff-target" aria-hidden="true"></div>
    </div>
    <div class="scanner-board"><div class="scanner-grid" id="ff-grid"></div><span class="scanner-sweep" aria-hidden="true"></span></div>
    <div class="scanner-actions"><p class="game-feedback" id="ff-feedback" aria-live="polite"></p><button class="game-action" id="ff-check" type="button" disabled onclick="ffCheck()">Lock onto target</button><button class="game-action" id="ff-next" type="button" style="display:none" onclick="ffNext()">Next signal →</button></div>
  `;
  const checkButton = box.querySelector<HTMLButtonElement>("#ff-check");
  if (!checkButton) throw new Error("Focus Finder check button was not created.");

  const ROUNDS = [
    { title: "Find the lost star", target: "⭐", choices: ["🌙", "✨", "🍎", "🐟", "🌟", "☀️", "🎈", "⭐", "🐸"], answer: 7 },
    { title: "Scan the forest", target: "🦊", choices: ["🐱", "🐻", "🐸", "🐰", "🦊", "🐼", "🐨", "🐯", "🦝"], answer: 4 },
    { title: "Rescue the red planet", target: "🔴", choices: ["🟠", "🟡", "🟣", "🔵", "🟢", "🔴", "⚫", "🟤", "⚪"], answer: 5 }
  ];
  let round = 0;
  let choice: number | null = null;
  let score = 0;

  function render() {
    const current = ROUNDS[round];
    choice = null;
    document.getElementById("ff-round").textContent = `SIGNAL ${round + 1} / ${ROUNDS.length}`;
    document.getElementById("ff-progress").style.width = `${round / ROUNDS.length * 100}%`;
    document.getElementById("ff-title").textContent = current.title;
    document.getElementById("ff-prompt").textContent = "Select the matching signal in the scanner.";
    document.getElementById("ff-target").textContent = current.target;
    document.getElementById("ff-feedback").textContent = "";
    checkButton.disabled = true;
    checkButton.style.display = "";
    document.getElementById("ff-next").style.display = "none";
    document.getElementById("ff-grid").innerHTML = current.choices.map((item, index) =>
      `<button class="focus-choice" type="button" aria-label="Signal ${index + 1}" aria-pressed="false" onclick="ffChoose(${index})"><span aria-hidden="true">${item}</span></button>`
    ).join("");
    if (round > 0) document.querySelector<HTMLButtonElement>(".focus-choice")?.focus();
  }

  window.ffChoose = index => {
    choice = index;
    document.querySelectorAll<HTMLButtonElement>(".focus-choice").forEach((button, itemIndex) => {
      button.classList.toggle("selected", itemIndex === index);
      button.setAttribute("aria-pressed", String(itemIndex === index));
    });
    checkButton.disabled = false;
  };

  window.ffCheck = () => {
    if (choice === null) return;
    const current = ROUNDS[round];
    const buttons = document.querySelectorAll<HTMLButtonElement>(".focus-choice");
    buttons.forEach(button => button.disabled = true);
    if (choice === current.answer) {
      score++;
      document.getElementById("ff-feedback").textContent = "Signal locked! Great scanning, space explorer.";
      buttons[choice].classList.add("correct-diff");
    } else {
      document.getElementById("ff-feedback").textContent = "The target is lighting up. Ready for the next scan?";
      buttons[current.answer].classList.add("correct-diff");
    }
    document.getElementById("ff-progress").style.width = `${(round + 1) / ROUNDS.length * 100}%`;
    checkButton.style.display = "none";
    document.getElementById("ff-next").style.display = "";
    document.getElementById("ff-next").textContent = round === ROUNDS.length - 1 ? "Return to base →" : "Next signal →";
    document.getElementById("ff-next").focus();
  };

  window.ffNext = () => {
    round++;
    if (round >= ROUNDS.length) return saveAndFinish(score, ROUNDS.length);
    render();
  };

  render();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 6 — STEP BY STEP (cardKey: bw_done_adhd_steps)
═══════════════════════════════════════════════════════════════ */
function initStepByStep() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="mission-top planning-top"><span>🧭 EVERYDAY QUEST</span><span id="so-round">QUEST 1 / 2</span></div>
    <div class="mission-track planning-track"><span id="so-progress"></span></div>
    <div class="quest-scene"><span class="quest-art" id="so-art" aria-hidden="true"></span><div><span class="scanner-eyebrow">PUT IT IN ORDER</span><h2 class="order-prompt" id="so-prompt"></h2><p class="game-instructions">Build the plan by choosing what happens first, next, and last. Change your mind? Tap a step in your plan to remove it.</p></div></div>
    <div class="plan-board"><div class="plan-label">YOUR PLAN <span>tap a step to undo</span></div><div class="order-picked" id="so-picked" aria-live="polite"></div></div>
    <div class="order-choices" id="so-choices"></div>
    <div class="plan-actions"><button class="seq-opt" type="button" onclick="soReset()">↺ Start over</button><button class="game-action" type="button" onclick="soCheck()">Check my plan →</button></div>
    <p class="game-feedback" id="so-feedback" aria-live="polite"></p>
    <button class="game-action" id="so-next" type="button" style="display:none" onclick="soNext()">Next quest →</button>
  `;

  const ROUNDS = [
    { icon: "🎒", prompt: "Pack your school bag", steps: ["Zip the bag", "Add your lunch", "Put books in your bag"], order: [2, 1, 0] },
    { icon: "🌱", prompt: "Plant a little seed", steps: ["Add a little water", "Place a seed in the soil", "Put soil in a pot"], order: [2, 1, 0] }
  ];
  let round = 0;
  let selected: number[] = [];
  let score = 0;
  let checked = false;

  function render() {
    const current = ROUNDS[round];
    selected = [];
    checked = false;
    document.getElementById("so-round").textContent = `QUEST ${round + 1} / ${ROUNDS.length}`;
    document.getElementById("so-progress").style.width = `${round / ROUNDS.length * 100}%`;
    document.getElementById("so-art").textContent = current.icon;
    document.getElementById("so-prompt").textContent = current.prompt;
    document.getElementById("so-feedback").textContent = "";
    document.getElementById("so-next").style.display = "none";
    document.getElementById("so-choices").innerHTML = current.steps.map((step, index) =>
      `<button class="order-choice" type="button" aria-pressed="false" onclick="soChoose(${index})"><span class="step-number">${index + 1}</span><span>${step}</span><span class="step-add">＋</span></button>`
    ).join("");
    renderSelected();
    if (round > 0) document.querySelector<HTMLButtonElement>(".order-choice:not(:disabled)")?.focus();
  }

  function renderSelected() {
    document.getElementById("so-picked").innerHTML = selected.length
      ? selected.map((index, position) => `<button class="plan-step" type="button" aria-label="Remove step ${position + 1}: ${ROUNDS[round].steps[index]}" onclick="soRemove(${position})"><span>${position + 1}</span>${ROUNDS[round].steps[index]}<span aria-hidden="true">×</span></button>`).join("")
      : "<p class='plan-empty'>Your first step will land here.</p>";
    document.querySelectorAll<HTMLButtonElement>(".order-choice").forEach((button, index) => {
      button.disabled = selected.includes(index) || checked;
      button.classList.toggle("step-picked", selected.includes(index));
      button.setAttribute("aria-pressed", String(selected.includes(index)));
    });
  }

  window.soChoose = index => {
    if (checked || selected.includes(index)) return;
    selected.push(index);
    renderSelected();
  };
  window.soRemove = position => {
    if (checked) return;
    selected.splice(position, 1);
    document.getElementById("so-feedback").textContent = "";
    renderSelected();
  };
  window.soReset = () => {
    if (checked) return;
    selected = [];
    document.getElementById("so-feedback").textContent = "";
    renderSelected();
    document.querySelector<HTMLButtonElement>(".order-choice:not(:disabled)")?.focus();
  };
  window.soCheck = () => {
    if (checked) return;
    if (selected.length !== ROUNDS[round].steps.length) {
      document.getElementById("so-feedback").textContent = `Add ${ROUNDS[round].steps.length - selected.length} more ${ROUNDS[round].steps.length - selected.length === 1 ? "step" : "steps"} to finish your plan.`;
      return;
    }
    checked = true;
    const correct = selected.every((step, index) => step === ROUNDS[round].order[index]);
    if (correct) {
      score++;
      document.getElementById("so-feedback").textContent = "Plan complete! You worked out a clear order.";
      document.getElementById("so-progress").style.width = `${(round + 1) / ROUNDS.length * 100}%`;
      document.getElementById("so-next").textContent = round === ROUNDS.length - 1 ? "Finish" : "Next";
      document.getElementById("so-next").style.display = "";
      document.getElementById("so-next").focus();
    } else {
      document.getElementById("so-feedback").textContent = "That plan could work another way. Build a new order and try again.";
      checked = false;
      selected = [];
      renderSelected();
      document.getElementById("so-next").style.display = "none";
      document.querySelector<HTMLButtonElement>(".order-choice:not(:disabled)")?.focus();
      return;
    }
    renderSelected();
  };
  window.soNext = () => {
    if (!checked) return;
    const correct = selected.every((step, index) => step === ROUNDS[round].order[index]);
    if (!correct) return render();
    round++;
    if (round >= ROUNDS.length) return saveAndFinish(score, ROUNDS.length);
    render();
  };

  render();
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY — MOVE & RESET (cardKey: bw_done_adhd_reset)
═══════════════════════════════════════════════════════════════ */
function initMoveAndReset() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Move & Reset activity container was not found.");
  box.innerHTML = `
    <div class="reset-world">
      <div class="reset-sky"><span class="reset-sun" aria-hidden="true">☀️</span><span class="reset-cloud cloud-one" aria-hidden="true">☁️</span><span class="reset-cloud cloud-two" aria-hidden="true">☁️</span></div>
      <div class="mission-top reset-top"><span>🌿 YOUR QUIET CORNER</span><span id="reset-count">PAUSE 1 / 3</span></div>
      <div class="mission-track reset-track"><span id="reset-progress"></span></div>
      <div class="reset-content"><span class="reset-step-icon" id="reset-icon" aria-hidden="true"></span><span class="scanner-eyebrow">A LITTLE RESET</span><h2 id="reset-title"></h2><p id="reset-prompt"></p></div>
      <div class="break-options" id="reset-options"></div>
      <p class="reset-selected" id="reset-selected" aria-live="polite">Pick whichever feels comfortable—or skip this pause.</p>
      <div class="reset-actions"><button class="seq-opt" type="button" onclick="resetSkip()">Skip this pause</button><button class="game-action" id="reset-next" type="button" disabled onclick="resetNext()">I did this →</button></div>
    </div>
  `;
  const continueButton = box.querySelector<HTMLButtonElement>("#reset-next");
  if (!continueButton) throw new Error("Move & Reset continue button was not created.");
  const pauses = [
    { icon: "🙆", title: "Unclench and stretch", prompt: "Choose a comfortable way to loosen up.", options: ["Reach up like a tall tree", "Roll your shoulders gently", "Stay seated and stretch your hands"] },
    { icon: "🌬️", title: "Find one calm breath", prompt: "No need to breathe in a special way. Choose what feels okay.", options: ["Breathe out slowly", "Notice your feet on the floor", "Skip breathing and look around"] },
    { icon: "🪴", title: "Notice your surroundings", prompt: "Pick one small thing to notice before you head back.", options: ["Find a color you like", "Listen for a quiet sound", "Choose a comfortable next step"] }
  ];
  let pauseIndex = 0;
  let selectedPauseOption: number | null = null;

  function renderPause() {
    const pause = pauses[pauseIndex];
    selectedPauseOption = null;
    document.getElementById("reset-count").textContent = `PAUSE ${pauseIndex + 1} / ${pauses.length}`;
    document.getElementById("reset-progress").style.width = `${pauseIndex / pauses.length * 100}%`;
    document.getElementById("reset-icon").textContent = pause.icon;
    document.getElementById("reset-title").textContent = pause.title;
    document.getElementById("reset-prompt").textContent = pause.prompt;
    document.getElementById("reset-selected").textContent = "Pick whichever feels comfortable—or skip this pause.";
    continueButton.disabled = true;
    continueButton.textContent = pauseIndex === pauses.length - 1 ? "Finish reset →" : "I did this →";
    document.getElementById("reset-options").innerHTML = pause.options.map((option, index) =>
      `<button class="break-choice" type="button" aria-pressed="false" onclick="resetChoose(${index})"><span class="break-choice-mark" aria-hidden="true"></span>${option}</button>`
    ).join("");
    if (pauseIndex > 0) document.querySelector<HTMLButtonElement>(".break-choice")?.focus();
  }

  window.resetChoose = index => {
    selectedPauseOption = index;
    document.querySelectorAll<HTMLButtonElement>(".break-choice").forEach((button, itemIndex) => {
      button.classList.toggle("break-selected", itemIndex === index);
      button.setAttribute("aria-pressed", String(itemIndex === index));
    });
    document.getElementById("reset-selected").textContent = "Whenever you're ready, move on to the next pause.";
    continueButton.disabled = false;
  };
  window.resetNext = () => {
    if (selectedPauseOption === null) return;
    nextPause();
  };
  window.resetSkip = () => nextPause();
  function nextPause() {
    pauseIndex++;
    if (pauseIndex >= pauses.length) {
      document.getElementById("reset-progress").style.width = "100%";
      return saveAndFinish(1, 1, "Your reset is complete 🌱");
    }
    renderPause();
  }

  renderPause();
}

function initTreasureTrail() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Treasure Trail activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🗺️ Treasure Trail</span>
      <span id="trail-round">Trail 1 / 3</span>
    </div>
    <p class="game-instructions">Explore at your own pace. Collect every star, then find the rocket. There is no timer.</p>
    <div class="trail-map" id="trail-map" role="group" aria-label="Treasure map"></div>
    <p class="game-feedback" id="trail-feedback" aria-live="polite"></p>
    <div class="trail-controls" aria-label="Move your explorer">
      <button class="trail-move" type="button" aria-label="Move up" onclick="trailMove('up')">⬆️</button>
      <button class="trail-move" type="button" aria-label="Move left" onclick="trailMove('left')">⬅️</button>
      <button class="trail-move" type="button" aria-label="Move down" onclick="trailMove('down')">⬇️</button>
      <button class="trail-move" type="button" aria-label="Move right" onclick="trailMove('right')">➡️</button>
    </div>
    <p class="trail-count" id="trail-count" aria-live="polite"></p>
    <button class="game-action" id="trail-next" type="button" style="display:none" onclick="trailNext()">Next trail →</button>
  `;

  const trails = [
    { start: 12, stars: [8, 5], goal: 3, rocks: [10] },
    { start: 15, stars: [11, 6], goal: 1, rocks: [13, 14] },
    { start: 12, stars: [13, 9, 5], goal: 2, rocks: [10, 14] }
  ];
  let round = 0;
  let position = trails[0].start;
  let collected: number[] = [];
  let score = 0;
  let completed = false;

  function render(feedback = "Choose a direction to explore.") {
    const trail = trails[round];
    document.getElementById("trail-round").textContent = `Trail ${round + 1} / ${trails.length}`;
    document.getElementById("trail-count").textContent = `Stars: ${collected.length} / ${trail.stars.length}`;
    document.getElementById("trail-feedback").textContent = feedback;
    document.getElementById("trail-next").style.display = completed ? "" : "none";
    document.querySelectorAll<HTMLButtonElement>(".trail-move").forEach(button => button.disabled = completed);
    document.getElementById("trail-map").innerHTML = Array.from({ length: 16 }, (_, tile) => {
      const icon = tile === position ? "🚀" : trail.rocks.includes(tile) ? "🪨" :
        trail.stars.includes(tile) && !collected.includes(tile) ? "⭐" : tile === trail.goal ? "🏁" : "·";
      const label = tile === position ? "Explorer" : trail.rocks.includes(tile) ? "Rock" :
        trail.stars.includes(tile) && !collected.includes(tile) ? "Star" : tile === trail.goal ? "Rocket landing" : "Open path";
      return `<div class="trail-tile${tile === position ? " trail-player" : ""}" role="img" aria-label="${label}">${icon}</div>`;
    }).join("");
  }

  window.trailMove = direction => {
    const row = Math.floor(position / 4);
    const column = position % 4;
    const next = direction === "up" ? position - 4 : direction === "down" ? position + 4 :
      direction === "left" ? position - 1 : position + 1;
    const nextRow = Math.floor(next / 4);
    if (next < 0 || next >= 16 || (direction === "left" && nextRow !== row) ||
      (direction === "right" && nextRow !== row) || trails[round].rocks.includes(next)) {
      document.getElementById("trail-feedback").textContent = "That way is blocked. Try another path.";
      return;
    }
    if (next === trails[round].goal && collected.length < trails[round].stars.length) {
      document.getElementById("trail-feedback").textContent = "Collect all the stars before landing at the rocket.";
      return;
    }
    position = next;
    let feedback = "Choose a direction to explore.";
    if (trails[round].stars.includes(position) && !collected.includes(position)) {
      collected.push(position);
      feedback = "Star collected! Keep exploring.";
    }
    if (position === trails[round].goal) {
      completed = true;
      score++;
      feedback = "You found the rocket! Great exploring.";
      const nextButton = document.getElementById("trail-next") as HTMLButtonElement;
      nextButton.textContent = round === trails.length - 1 ? "Finish adventure →" : "Next trail →";
    }
    render(feedback);
    if (completed) document.getElementById("trail-next").focus();
  };
  window.trailNext = () => {
    round++;
    if (round >= trails.length) return saveAndFinish(score, trails.length, "Adventure complete! 🚀");
    position = trails[round].start;
    collected = [];
    completed = false;
    render();
  };

  render();
}

function initCritterCreator() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Critter Creator activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🐾 Critter Creator</span>
      <span id="critter-step">Choice 1 / 3</span>
    </div>
    <p class="game-instructions">Make a one-of-a-kind friend. Pick what you like—there are no wrong choices.</p>
    <div class="critter-preview" id="critter-preview" aria-live="polite"></div>
    <h2 class="critter-prompt" id="critter-prompt"></h2>
    <div class="critter-options" id="critter-options"></div>
    <div class="critter-actions">
      <button class="seq-opt" id="critter-back" type="button" onclick="critterBack()">← Back</button>
      <button class="game-action" id="critter-next" type="button" disabled onclick="critterNext()">Next choice →</button>
    </div>
  `;
  const choices = [
    { prompt: "Choose a cozy home", options: [{ emoji: "🌳", label: "Tree house" }, { emoji: "🏰", label: "Castle" }, { emoji: "🚀", label: "Space pod" }] },
    { prompt: "Pick a fun face", options: [{ emoji: "😊", label: "Smiley" }, { emoji: "😎", label: "Cool" }, { emoji: "🤩", label: "Starry-eyed" }] },
    { prompt: "Add a special touch", options: [{ emoji: "🎩", label: "A hat" }, { emoji: "🪽", label: "Wings" }, { emoji: "🌈", label: "Rainbow colors" }] }
  ];
  const picked: number[] = [];
  let step = 0;

  function render() {
    document.getElementById("critter-step").textContent = `Choice ${step + 1} / ${choices.length}`;
    document.getElementById("critter-prompt").textContent = choices[step].prompt;
    document.getElementById("critter-preview").textContent = picked.map((choice, index) =>
      choices[index].options[choice].emoji
    ).join(" ") || "✨ Your critter will appear here ✨";
    document.getElementById("critter-options").innerHTML = choices[step].options.map((option, index) =>
      `<button class="critter-option" type="button" aria-pressed="${picked[step] === index}" onclick="critterChoose(${index})"><span aria-hidden="true">${option.emoji}</span>${option.label}</button>`
    ).join("");
    const back = document.getElementById("critter-back") as HTMLButtonElement;
    const next = document.getElementById("critter-next") as HTMLButtonElement;
    back.disabled = step === 0;
    next.disabled = picked[step] === undefined;
    next.textContent = step === choices.length - 1 ? "Meet my critter! →" : "Next choice →";
  }

  window.critterChoose = index => {
    picked[step] = index;
    render();
    document.getElementById("critter-next").focus();
  };
  window.critterBack = () => {
    if (step === 0) return;
    step--;
    render();
    document.querySelector<HTMLButtonElement>(".critter-option")?.focus();
  };
  window.critterNext = () => {
    if (picked[step] === undefined) return;
    if (step === choices.length - 1) {
      const creature = picked.map((choice, index) => choices[index].options[choice]);
      document.getElementById("act-box").innerHTML = `
        <div class="critter-finale">
          <div class="critter-preview" aria-hidden="true">${creature.map(option => option.emoji).join(" ")}</div>
          <h2>Meet your one-of-a-kind critter!</h2>
          <p>${creature.map(option => option.label).join(" · ")}</p>
          <button class="game-action" type="button" onclick="critterFinish()">Save my creation →</button>
        </div>`;
      return;
    }
    step++;
    render();
    document.querySelector<HTMLButtonElement>(".critter-option")?.focus();
  };
  window.critterFinish = () => saveAndFinish(choices.length, choices.length, "Your critter is ready! 🐾");

  render();
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
    case 'bw_done_adhd_finder': initFocusFinder(); break;
    case 'bw_done_adhd_steps': initStepByStep(); break;
    case 'bw_done_adhd_reset': initMoveAndReset(); break;
    case 'bw_done_adhd_trail': initTreasureTrail(); break;
    case 'bw_done_adhd_critter': initCritterCreator(); break;
    default: initMemoryMatch();
  }
}
