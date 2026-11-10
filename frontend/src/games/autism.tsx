/* ═══════════════════════════════════════════════════════════════
   SHARED SETUP
═══════════════════════════════════════════════════════════════ */
const API_URL = "/api/activity";
let CARD_KEY      = new URLSearchParams(window.location.search).get("card") || "bw_done_autism_routine";

let startTime = Date.now();

async function saveAndFinish(score, total, modalTitle = "") {
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  const percent   = total > 0 ? Math.round((score / total) * 100) : 100;
  if (modalTitle) document.getElementById("modal-title").textContent = modalTitle;
  document.getElementById("msg").textContent = total > 0 ? `Score: ${score}/${total}` : "Great job!";
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

/* ═══════════════════════════════════════════════════════════════
   GAME 1 — MY ROUTINE  (cardKey: bw_done_autism_routine)
   Original game: tap morning steps in the correct order
═══════════════════════════════════════════════════════════════ */
function initRoutine() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">📅 My Routine</span>
      <span>Step <span id="step">1</span>/5</span>
    </div>
    <p>Tap steps in correct order</p>
    <div class="sched-wrap" id="wrap"></div>
  `;

  const ROUTINE = [
    { icon:"⏰", label:"Wake Up"     },
    { icon:"🪥", label:"Brush Teeth" },
    { icon:"🍳", label:"Breakfast"   },
    { icon:"👕", label:"Get Dressed" },
    { icon:"🎒", label:"Pack Bag"    }
  ];
  let index = 0;

  function render() {
    document.getElementById("step").textContent = String(index + 1);
    document.getElementById("wrap").innerHTML = ROUTINE.map((r, i) => `
      <div class="sched-step ${i < index ? 'done' : i === index ? 'active' : ''}" onclick="routineTap(${i})">
        <div>${r.icon}</div><div>${r.label}</div>
      </div>
    `).join("");
  }

  window.routineTap = function(i) {
    if (i !== index) return;
    index++;
    if (index >= ROUTINE.length) return saveAndFinish(5, 5, "Completed! 🌟");
    render();
  };

  render();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 2 — FEELINGS  (cardKey: bw_done_autism_feelings)
   Look at a scene and pick the emotion the character is feeling
═══════════════════════════════════════════════════════════════ */
function initFeelings() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">😊 Feelings</span>
      <span>⭐ <span id="feel-score">0</span>/4</span>
    </div>
    <div class="feel-scene" id="feel-scene"></div>
    <div class="feel-question" id="feel-question"></div>
    <div class="feel-opts" id="feel-opts"></div>
  `;

  const QUESTIONS = [
    {
      scene: "🎂🎉🎁",
      question: "It's Maya's birthday and everyone is cheering for her. How does Maya feel?",
      answer: "Happy",
      options: [
        { emoji:"😄", label:"Happy"  },
        { emoji:"😢", label:"Sad"    },
        { emoji:"😠", label:"Angry"  },
        { emoji:"😨", label:"Scared" }
      ]
    },
    {
      scene: "🌧️😔🏠",
      question: "Leo's football game got cancelled because of rain. How does Leo feel?",
      answer: "Sad",
      options: [
        { emoji:"😄", label:"Happy"     },
        { emoji:"😢", label:"Sad"       },
        { emoji:"😴", label:"Sleepy"    },
        { emoji:"😮", label:"Surprised" }
      ]
    },
    {
      scene: "🧸💥😤",
      question: "Sam's little sister broke his favourite toy. How does Sam feel?",
      answer: "Angry",
      options: [
        { emoji:"😄", label:"Happy"  },
        { emoji:"😢", label:"Sad"    },
        { emoji:"😠", label:"Angry"  },
        { emoji:"😴", label:"Sleepy" }
      ]
    },
    {
      scene: "🌑👻🔦",
      question: "Zara has to walk through a dark room all alone. How does Zara feel?",
      answer: "Scared",
      options: [
        { emoji:"😄", label:"Happy"  },
        { emoji:"😠", label:"Angry"  },
        { emoji:"😨", label:"Scared" },
        { emoji:"😮", label:"Surprised" }
      ]
    }
  ];

  let index = 0, score = 0;

  function show() {
    if (index >= QUESTIONS.length) return saveAndFinish(score, QUESTIONS.length);
    const q = QUESTIONS[index];
    document.getElementById("feel-scene").textContent    = q.scene;
    document.getElementById("feel-question").textContent = q.question;
    const shuffled = [...q.options].sort(() => Math.random() - .5);
    document.getElementById("feel-opts").innerHTML = shuffled.map(opt => `
      <button class="feel-opt" onclick="feelCheck('${opt.label}', this, '${q.answer}')">
        <span class="feel-emoji">${opt.emoji}</span>
        <span class="feel-label">${opt.label}</span>
      </button>
    `).join("");
  }

  window.feelCheck = function(choice, btn, answer) {
    document.querySelectorAll<HTMLButtonElement>(".feel-opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("feel-score").textContent = String(score);
    index++;
    setTimeout(show, 1100);
  };

  show();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 3 — STORY TIME  (cardKey: bw_done_autism_story)
   Read a short story moment and answer a social question about it
═══════════════════════════════════════════════════════════════ */
function initStoryTime() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">📖 Story Time</span>
      <span>⭐ <span id="st-score">0</span>/3</span>
    </div>
    <div class="story-panel">
      <div class="story-scene" id="st-scene"></div>
      <div class="story-text"  id="st-text"></div>
    </div>
    <div class="story-question" id="st-question"></div>
    <div class="story-opts"    id="st-opts"></div>
  `;

  const STORIES = [
    {
      scene: "🛝👫",
      text: "Tom and Amy are playing at the park. Amy falls down and hurts her knee. She starts to cry.",
      question: "What should Tom do?",
      answer: "Ask if Amy is okay and help her",
      options: [
        "Keep playing and ignore Amy",
        "Ask if Amy is okay and help her",
        "Laugh at Amy",
        "Run away from the park"
      ]
    },
    {
      scene: "🍱🏫",
      text: "It's lunchtime at school. Jin has forgotten his lunch box. He looks worried and hungry.",
      question: "What is the kind thing to do?",
      answer: "Offer to share your food with Jin",
      options: [
        "Tell everyone Jin forgot his lunch",
        "Eat your lunch and say nothing",
        "Offer to share your food with Jin",
        "Take Jin's bag and look inside"
      ]
    },
    {
      scene: "🎨🖌️",
      text: "In art class, Priya draws a picture and shows it to the group. She looks excited and proud.",
      question: "What is a kind response?",
      answer: "Say something nice about her drawing",
      options: [
        "Say her drawing looks bad",
        "Say something nice about her drawing",
        "Grab the drawing and crumple it",
        "Turn away and ignore her"
      ]
    }
  ];

  let index = 0, score = 0;

  function show() {
    if (index >= STORIES.length) return saveAndFinish(score, STORIES.length);
    const s = STORIES[index];
    document.getElementById("st-scene").textContent    = s.scene;
    document.getElementById("st-text").textContent     = s.text;
    document.getElementById("st-question").textContent = s.question;
    const shuffled = [...s.options].sort(() => Math.random() - .5);
    document.getElementById("st-opts").innerHTML = shuffled.map(opt => `
      <button class="story-opt" onclick="storyCheck(this, \`${opt}\`, \`${s.answer}\`)">${opt}</button>
    `).join("");
  }

  window.storyCheck = function(btn, choice, answer) {
    document.querySelectorAll<HTMLButtonElement>(".story-opt").forEach(b => b.disabled = true);
    if (choice === answer) { score++; btn.classList.add("correct"); }
    else btn.classList.add("wrong");
    document.getElementById("st-score").textContent = String(score);
    index++;
    setTimeout(show, 1200);
  };

  show();
}

/* ═══════════════════════════════════════════════════════════════
   GAME 4 — SORT & MATCH  (cardKey: bw_done_autism_sort)
   Drag (tap) items into the correct category bin
═══════════════════════════════════════════════════════════════ */
function initSortMatch() {
  const box = document.getElementById("act-box");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🎨 Sort & Match</span>
      <span>⭐ <span id="sm-score">0</span>/3</span>
    </div>
    <div class="sort-instructions">Tap an item, then tap the right bin!</div>
    <div class="sort-bins" id="sort-bins"></div>
    <div class="sort-items-pool" id="sort-pool"></div>
    <div class="sort-feedback" id="sort-feedback"></div>
  `;

  const ROUNDS = [
    {
      instruction: "Sort into: Animals, Food, or Vehicles",
      bins: ["Animals", "Food", "Vehicles"],
      items: [
        { emoji:"🐶", bin:"Animals"  },
        { emoji:"🍕", bin:"Food"     },
        { emoji:"🚗", bin:"Vehicles" },
        { emoji:"🐱", bin:"Animals"  },
        { emoji:"🍎", bin:"Food"     },
        { emoji:"✈️", bin:"Vehicles" }
      ]
    },
    {
      instruction: "Sort into: Big, Small, or Round",
      bins: ["Big", "Small", "Round"],
      items: [
        { emoji:"🐘", bin:"Big"   },
        { emoji:"🐜", bin:"Small" },
        { emoji:"⚽", bin:"Round" },
        { emoji:"🏠", bin:"Big"   },
        { emoji:"🐝", bin:"Small" },
        { emoji:"🍪", bin:"Round" }
      ]
    },
    {
      instruction: "Sort into: Day, Night, or Weather",
      bins: ["Day", "Night", "Weather"],
      items: [
        { emoji:"☀️", bin:"Day"     },
        { emoji:"🌙", bin:"Night"   },
        { emoji:"🌧️", bin:"Weather" },
        { emoji:"⭐", bin:"Night"   },
        { emoji:"🌈", bin:"Weather" },
        { emoji:"🌤️", bin:"Day"     }
      ]
    }
  ];

  let roundIdx  = 0;
  let score     = 0;
  let selected  = null;   // index into current items
  let placed    = {};     // itemIdx -> binLabel

  function startRound() {
    selected = null;
    placed   = {};
    const round = ROUNDS[roundIdx];
    document.getElementById("sort-feedback").textContent = round.instruction;

    // Render bins
    document.getElementById("sort-bins").innerHTML = round.bins.map(b => `
      <div class="sort-bin" id="bin-${b}" onclick="smDropIntoBin('${b}')">
        <div class="sort-bin-label">${b}</div>
        <div class="sort-bin-items" id="bin-items-${b}"></div>
      </div>
    `).join("");

    // Render shuffled pool
    const shuffled = round.items.map((it, i) => ({ ...it, origIdx: i })).sort(() => Math.random() - .5);
    window._smItems = shuffled;
    renderPool();
  }

  function renderPool() {
    document.getElementById("sort-pool").innerHTML = window._smItems.map((it, i) =>
      placed[i] !== undefined
        ? `<span class="sort-item placed">${it.emoji}</span>`
        : `<span class="sort-item${selected === i ? ' selected' : ''}" onclick="smSelectItem(${i})">${it.emoji}</span>`
    ).join("");
  }

  window.smSelectItem = function(i) {
    selected = (selected === i) ? null : i;
    renderPool();
  };

  window.smDropIntoBin = function(binLabel) {
    if (selected === null) return;
    const item = window._smItems[selected];
    const correct = item.bin === binLabel;

    // Flash feedback on bin
    const binEl = document.getElementById(`bin-${binLabel}`);
    if (correct) {
      binEl.classList.add("correct-bin");
      document.getElementById(`bin-items-${binLabel}`).innerHTML +=
        `<span style="font-size:1.3rem">${item.emoji}</span>`;
      placed[selected] = binLabel;
      document.getElementById("sort-feedback").textContent = "✅ Correct!";
    } else {
      binEl.style.borderColor = "#ef4444";
      binEl.style.background  = "#fee2e2";
      document.getElementById("sort-feedback").textContent = "❌ Try again!";
      setTimeout(() => {
        binEl.style.borderColor = "";
        binEl.style.background  = "";
      }, 700);
    }
    selected = null;
    renderPool();

    // Check if round complete
    if (Object.keys(placed).length === window._smItems.length) {
      // Count correct placements
      const roundCorrect = window._smItems.filter((it, i) => placed[i] === it.bin).length;
      if (roundCorrect === window._smItems.length) score++;
      roundIdx++;
      if (roundIdx >= ROUNDS.length) {
        setTimeout(() => saveAndFinish(score, ROUNDS.length), 700);
      } else {
        setTimeout(() => {
          document.getElementById("sort-feedback").textContent = "Great! Next round…";
          setTimeout(startRound, 900);
        }, 700);
      }
    }
  };

  startRound();
}

function initComfortKit() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("Comfort Kit activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🧰 My Comfort Kit</span>
      <span>Pick what works for you</span>
    </div>
    <div class="comfort-scene" aria-hidden="true">🎒✨</div>
    <p class="game-instructions">Choose any things that might feel helpful. You can pick one, several, or none.</p>
    <div class="comfort-options" id="comfort-options"></div>
    <p class="comfort-summary" id="comfort-summary" aria-live="polite">Your choices will appear here.</p>
    <div class="comfort-actions">
      <button class="seq-opt" type="button" onclick="comfortSkip()">I don't need a kit right now</button>
      <button class="game-action" id="comfort-finish" type="button" disabled onclick="comfortFinish()">My kit is ready →</button>
    </div>
  `;
  const options = [
    { emoji: "🧸", label: "A familiar toy" },
    { emoji: "🎧", label: "Headphones" },
    { emoji: "🧩", label: "A fidget or puzzle" },
    { emoji: "📕", label: "A favorite book" },
    { emoji: "💧", label: "A drink of water" },
    { emoji: "🛋️", label: "A quiet place" },
    { emoji: "🤝", label: "Help from someone I trust" }
  ];
  const selected = new Set<number>();

  function render() {
    document.getElementById("comfort-options").innerHTML = options.map((option, index) =>
      `<button class="comfort-option${selected.has(index) ? " selected" : ""}" type="button" data-comfort-index="${index}" aria-pressed="${selected.has(index)}" onclick="comfortToggle(${index})"><span aria-hidden="true">${option.emoji}</span>${option.label}</button>`
    ).join("");
    const names = [...selected].map(index => options[index].label);
    document.getElementById("comfort-summary").textContent = names.length
      ? `In your kit: ${names.join(", ")}`
      : "Your choices will appear here.";
    (document.getElementById("comfort-finish") as HTMLButtonElement).disabled = selected.size === 0;
  }

  window.comfortToggle = index => {
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
    render();
    document.querySelector<HTMLButtonElement>(`[data-comfort-index="${index}"]`)?.focus();
  };
  window.comfortFinish = () => {
    if (selected.size === 0) return;
    saveAndFinish(1, 1, "Your kit, your way! 🌟");
  };
  window.comfortSkip = () => saveAndFinish(1, 1, "Thanks for exploring! 🌟");

  render();
}

function initChoiceAdventure() {
  const box = document.getElementById("act-box");
  if (!box) throw new Error("My Choice Adventure activity container was not found.");
  box.innerHTML = `
    <div class="act-header">
      <span class="act-title">🌈 My Choice Adventure</span>
      <span id="choice-step">Scene 1 / 3</span>
    </div>
    <p class="game-instructions">Help Kai through the day. Choose what feels right—there is no single correct answer.</p>
    <div class="choice-story-card">
      <div class="choice-story-scene" id="choice-scene" aria-hidden="true"></div>
      <h2 id="choice-prompt"></h2>
      <div class="story-opts" id="choice-options"></div>
    </div>
    <p class="choice-outcome" id="choice-outcome" aria-live="polite"></p>
    <button class="game-action" id="choice-next" type="button" style="display:none" onclick="choiceNext()">Next scene →</button>
  `;
  const scenes = [
    {
      icon: "🎨🔊",
      prompt: "The art room feels louder than Kai expected. What could Kai do?",
      options: [
        { label: "Ask to move somewhere quieter", outcome: "Kai asks for a quieter spot and feels ready to keep creating." },
        { label: "Use headphones if they feel helpful", outcome: "Kai chooses headphones and takes the time they need." },
        { label: "Watch for a little while first", outcome: "Kai watches until the room feels more familiar. That works too." }
      ]
    },
    {
      icon: "📅🔄",
      prompt: "Kai's class plan changes. What might help?",
      options: [
        { label: "See the new plan", outcome: "Kai looks at what is coming next and feels more prepared." },
        { label: "Ask someone to explain the change", outcome: "Kai asks a trusted person a clear question and gets an answer." },
        { label: "Take a quiet moment before starting", outcome: "Kai takes a moment, then chooses when to begin." }
      ]
    },
    {
      icon: "⚽👋",
      prompt: "Some children invite Kai to play. What can Kai choose?",
      options: [
        { label: "Join the game", outcome: "Kai joins in and finds a way to play that feels comfortable." },
        { label: "Watch first, then decide", outcome: "Kai watches the game and can join later if they want." },
        { label: "Say 'not now' and choose something else", outcome: "Kai lets the group know and picks another activity. That is okay." }
      ]
    }
  ];
  let step = 0;
  let score = 0;

  function render() {
    const scene = scenes[step];
    document.getElementById("choice-step").textContent = `Scene ${step + 1} / ${scenes.length}`;
    document.getElementById("choice-scene").textContent = scene.icon;
    document.getElementById("choice-prompt").textContent = scene.prompt;
    document.getElementById("choice-outcome").textContent = "";
    document.getElementById("choice-next").style.display = "none";
    document.getElementById("choice-options").innerHTML = scene.options.map((option, index) =>
      `<button class="story-opt" type="button" onclick="choiceSelect(${index})">${option.label}</button>`
    ).join("");
    if (step > 0) document.querySelector<HTMLButtonElement>(".story-opt")?.focus();
  }

  window.choiceSelect = index => {
    const scene = scenes[step];
    document.querySelectorAll<HTMLButtonElement>("#choice-options .story-opt").forEach(button => button.disabled = true);
    document.getElementById("choice-outcome").textContent = scene.options[index].outcome;
    score++;
    const next = document.getElementById("choice-next") as HTMLButtonElement;
    next.textContent = step === scenes.length - 1 ? "Finish adventure →" : "Next scene →";
    next.style.display = "";
    next.focus();
  };
  window.choiceNext = () => {
    step++;
    if (step >= scenes.length) return saveAndFinish(score, scenes.length, "You made the story your own! 🌈");
    render();
  };

  render();
}

/* ═══════════════════════════════════════════════════════════════
   ROUTER — pick game based on card param
═══════════════════════════════════════════════════════════════ */


export function startActivityGame(cardKey) {
  CARD_KEY = cardKey || 'bw_done_autism_routine';
  startTime = Date.now();
  switch (CARD_KEY) {
    case 'bw_done_autism_routine': initRoutine(); break;
    case 'bw_done_autism_feelings': initFeelings(); break;
    case 'bw_done_autism_story': initStoryTime(); break;
    case 'bw_done_autism_sort': initSortMatch(); break;
    case 'bw_done_autism_kit': initComfortKit(); break;
    case 'bw_done_autism_choice': initChoiceAdventure(); break;
    default: initRoutine();
  }
}
