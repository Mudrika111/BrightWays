import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../style.css";
import loginCss from "../login.css?inline";
import registerCss from "../register.css?inline";
import homeStyles from "./styles/home.css?inline";
import childStyles from "./styles/dashboardchild.css?inline";
import caregiverStyles from "./styles/dashboardcaregiver.css?inline";
import adhdStyles from "./styles/activityadhd.css?inline";
import autismStyles from "./styles/activityautism.css?inline";
import dyslexiaStyles from "./styles/activitydyxlexia.css?inline";
import { startActivityGame as startAdhdGame } from "./games/adhd";
import { startActivityGame as startAutismGame } from "./games/autism";
import { startActivityGame as startDyslexiaGame } from "./games/dyslexia";

const pageName = window.location.pathname.split("/").pop() || "index.html";
const stylesByPage = {
  "index.html": homeStyles,
  "login.html": loginCss,
  "register.html": registerCss,
  "dashboardchild.html": childStyles,
  "dashboardcaregiver.html": caregiverStyles,
  "activityadhd.html": adhdStyles,
  "activityautism.html": autismStyles,
  "activitydyxlexia.html": dyslexiaStyles
};
const titlesByPage = {
  "index.html": "BrightWays – Smart Learning Assistant",
  "login.html": "BrightWays – Sign In",
  "register.html": "BrightWays – Create Profile",
  "dashboardchild.html": "BrightWays – My Dashboard",
  "dashboardcaregiver.html": "BrightWays – Caregiver Dashboard",
  "activityadhd.html": "BrightWays – ADHD Activity",
  "activityautism.html": "BrightWays – Autism Activity",
  "activitydyxlexia.html": "BrightWays – Dyslexia Activity"
};

function PageStyle({ page }) {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "brightways-page-styles";
    style.textContent = `${stylesByPage[page] || ""}
      body.page-login, body.page-register { display: block; }
      .login-page, .register-page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
      @media (max-width: 760px) { .login-page, .register-page { grid-template-columns: 1fr; } }
    `;
    document.head.append(style);
    document.body.className = `page-${page.replace(".html", "")}`;
    document.title = titlesByPage[page] || titlesByPage["index.html"];
    return () => {
      style.remove();
      document.body.className = "";
    };
  }, [page]);
  return null;
}

function Logo({ caregiver = false }) {
  return <a className="logo" href="index.html">✦ Bright<span className="logo-dot">Ways</span></a>;
}

function HomePage() {
  return (
    <div id="s-home">
      <nav className="navbar">
        <Logo />
        <div className="nav-right">
          <a className="btn btn-ghost btn-sm" href="login.html">Login</a>
          <a className="btn btn-primary btn-sm" href="register.html">Get Started</a>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-left anim-up">
          <div className="hero-eyebrow">✦ Learning made joyful</div>
          <h1>Every child deserves to <em>thrive</em> in learning</h1>
          <p>BrightWays is a personalised adaptive platform for children with Autism, ADHD, and Dyslexia — with science-backed activities that actually feel like play.</p>
          <div className="hero-btns">
            <a className="btn btn-primary btn-lg" href="register.html">Start for Free</a>
            <a className="btn btn-ghost btn-lg" href="login.html">I have an account</a>
          </div>
        </div>
        <div className="hero-right">
          <Feature delay=".1s" icon="🧩" background="#FFF3E0" title="Autism Activities">Visual schedules, emotion recognition, social stories</Feature>
          <Feature delay=".2s" icon="⚡" background="#F0F9FF" title="ADHD Focus Games">Short-burst tasks, memory challenges with timers</Feature>
          <Feature delay=".3s" icon="📖" background="#FFF0F3" title="Dyslexia Phonics">Word recognition, sound matching, phonics fun</Feature>
          <Feature delay=".4s" icon="📊" background="#F0EFFF" title="Progress Dashboard">Charts, accuracy trends, session history</Feature>
        </div>
      </section>
      <div className="stats-bar">
        <Stat value="3" label="Conditions Supported" />
        <Stat value="5–12" label="Age Range" />
        <Stat value="12+" label="Activities" />
        <Stat value="Free" label="To Use" />
      </div>
    </div>
  );
}

function Feature({ delay, icon, background, title, children }) {
  return (
    <div className="feature-card anim-up" style={{ animationDelay: delay }}>
      <div className="fc-icon" style={{ background }}>{icon}</div>
      <div className="fc-text"><strong>{title}</strong><span>{children}</span></div>
    </div>
  );
}

function Stat({ value, label }) {
  return <div className="stat-item"><div className="sv">{value}</div><div className="sl">{label}</div></div>;
}

function LoginPage() {
  const [role, setRole] = useState("child");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    if (!username || !password) {
      setError("Please fill all fields.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, role })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Login failed");

      localStorage.removeItem("bw_user");
      const user = data.user;
      let childProfile = user.childProfile;
      if (Array.isArray(childProfile)) childProfile = childProfile[0] || null;
      const safeUser = {
        id: user.id,
        child_user_id: user.child_user_id || (childProfile && childProfile.child_user_id) || null,
        username: user.username,
        name: (childProfile && childProfile.child_name) || user.first_name || user.username,
        condition: user.condition || (childProfile && childProfile.condition_type) || null,
        user_type: user.user_type
      };
      localStorage.setItem("bw_user", JSON.stringify(safeUser));
      window.location.href = role === "caregiver" ? "dashboardcaregiver.html" : "dashboardchild.html";
    } catch (loginError) {
      setError(loginError.message);
      setBusy(false);
    }
  }

  const floaterPositions = [
    { top: "11%", left: "13%", "--dur": "3.8s", "--delay": "0s", "--ra": "-8deg", "--rb": "5deg" },
    { top: "21%", right: "16%", "--dur": "4.4s", "--delay": ".6s", "--ra": "4deg", "--rb": "-7deg" },
    { top: "40%", left: "7%", "--dur": "3.2s", "--delay": ".3s", "--ra": "-5deg", "--rb": "9deg" },
    { top: "54%", right: "11%", "--dur": "5s", "--delay": ".9s", "--ra": "7deg", "--rb": "-4deg" },
    { top: "68%", left: "18%", "--dur": "4.1s", "--delay": ".2s", "--ra": "-3deg", "--rb": "8deg" },
    { top: "31%", left: "52%", "--dur": "3.6s", "--delay": "1s", "--ra": "6deg", "--rb": "-6deg" }
  ];

  return (
    <div className="login-page">
      <div className="left-panel">
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
        <div className="floaters">
          {["🌟", "📖", "⚡", "🧩", "🎨", "🎯"].map((item, index) => <span className="floater" style={floaterPositions[index]} key={item + index}>{item}</span>)}
        </div>
        <div className="panel-logo">✦ Bright<span>Ways</span></div>
        <div className="panel-copy">
          <h2>Learning that feels<br />like <em>play</em></h2>
          <p>Every child is different. BrightWays adapts to how your child learns best — supporting Autism, ADHD, and Dyslexia.</p>
          <div className="testimonial">
            <div className="t-avatars"><div className="t-av" style={{ background: "#00A878", color: "#fff" }}>P</div><div className="t-av" style={{ background: "#F59E0B", color: "#fff" }}>R</div><div className="t-av" style={{ background: "#E84B6A", color: "#fff" }}>M</div></div>
            <p><strong>2,400+ families</strong> learning with BrightWays</p>
          </div>
        </div>
      </div>
      <div className="right-panel">
        <a className="back-link" href="index.html">←&nbsp; Back to home</a>
        <div className="form-wrap">
          <div className="eyebrow"><svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><circle cx="4" cy="4" r="4" /></svg>Sign in</div>
          <h1>Welcome<br />back</h1>
          <p id="login-instructions">{role === "child" ? "Children: enter your name and your parent's password." : "Parents: enter your name or username and your password."}</p>
          <div className="role-tabs">
            <button type="button" className={`role-tab ${role === "child" ? "active" : ""}`} onClick={() => setRole("child")}>🧒&nbsp; Child</button>
            <button type="button" className={`role-tab ${role === "caregiver" ? "active" : ""}`} onClick={() => setRole("caregiver")}>👩&nbsp; Caregiver</button>
          </div>
          <form onSubmit={handleLogin} noValidate>
            <div className="field">
              <label htmlFor="username">{role === "child" ? "Child's Name" : "Parent's Name or Username"}</label>
              <div className="field-wrap"><span className="fi">♙</span><input id="username" name="username" type="text" placeholder={role === "child" ? "e.g. Alex" : "e.g. Jane Doe"} required autoComplete="username" /></div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="field-wrap"><span className="fi">⌑</span><input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" /></div>
            </div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button type="submit" className="btn-submit" disabled={busy}>
              <span className="btn-text">{busy ? "Signing in..." : "Sign in"}</span><span aria-hidden="true">→</span>
              {busy && <span className="spinner" style={{ display: "block" }} />}
            </button>
          </form>
          <div className="divider"><span>new here?</span></div>
          <div className="footer-link">No account? <a href="register.html">Create one — it's free</a></div>
          <div className="trust-row"><span>◈ Secure login</span><span>♙ Child-safe</span><span>◷ Free forever</span></div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState(7);
  const [condition, setCondition] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState({ full_name: "", email: "", username: "", password: "", child_name: "" });
  const update = event => setFields(current => ({ ...current, [event.target.name]: event.target.value }));
  const progress = `${[0, 33, 66, 100][step]}%`;

  function nextStep(next) {
    setError("");
    if (next === 2 && (!fields.full_name.trim() || !fields.email.trim() || !fields.username.trim() || !fields.password)) {
      setError("Please fill all fields.");
      return;
    }
    if (next === 2 && fields.password.length < 6) {
      setError("Password too short");
      return;
    }
    if (next === 3 && !fields.child_name.trim()) {
      setError("Please enter your child's name");
      return;
    }
    setStep(next);
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (!condition) {
      setError("Please select a condition");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...fields,
          child_age: String(age),
          condition
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Registration failed");
      localStorage.removeItem("bw_user");
      localStorage.setItem("bw_user", JSON.stringify({
        id: data.user.id,
        username: data.user.username,
        name: data.user.username,
        condition: null,
        user_type: "caregiver"
      }));
      window.location.href = "dashboardcaregiver.html";
    } catch (registrationError) {
      setError(registrationError.message);
      setBusy(false);
    }
  }

  const floaterPositions = [
    { top: "8%", left: "12%", "--dur": "3.8s", "--delay": "0s", "--ra": "-7deg", "--rb": "5deg" },
    { top: "20%", right: "14%", "--dur": "4.5s", "--delay": ".5s", "--ra": "4deg", "--rb": "-6deg" },
    { top: "38%", left: "8%", "--dur": "3.3s", "--delay": ".2s", "--ra": "-4deg", "--rb": "8deg" },
    { top: "52%", right: "10%", "--dur": "5.1s", "--delay": ".8s", "--ra": "6deg", "--rb": "-3deg" },
    { top: "66%", left: "22%", "--dur": "4.2s", "--delay": ".3s", "--ra": "-3deg", "--rb": "7deg" }
  ];

  return (
    <div className="register-page">
      <div className="form-side">
        <div className="form-topbar"><Logo /><a className="back-link" href="index.html">←&nbsp; Back</a></div>
        <div className="step-bar">
          <div className="step-labels">
            {["Your Account", "Child's Profile", "Learning Needs"].map((label, index) => <span className={`step-label ${step === index + 1 ? "active" : ""}`} key={label}>{label}</span>)}
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: progress }} /></div>
        </div>
        <form className="form-body" onSubmit={handleRegister}>
          {step === 1 && <section className="step-panel active">
            <div className="step-eyebrow e-teal"><i />Step 1 of 3</div>
            <h2>Create your<br />account</h2>
            <p>This is your caregiver account — you'll use it to monitor your child's progress.</p>
            <div className="field-row">
              <RegisterField label="Your Full Name" name="full_name" value={fields.full_name} onChange={update} placeholder="Jane Doe" />
              <RegisterField label="Email Address" name="email" type="email" value={fields.email} onChange={update} placeholder="you@email.com" />
              <RegisterField label="Username" name="username" value={fields.username} onChange={update} placeholder="jane_doe" />
              <RegisterField label="Password" name="password" type="password" value={fields.password} onChange={update} placeholder="min. 8 characters" />
            </div>
            {error && <div className="error-box">{error}</div>}
            <div className="btn-row"><button type="button" className="btn-next" onClick={() => nextStep(2)}>Continue&nbsp; →</button></div>
          </section>}
          {step === 2 && <section className="step-panel active">
            <div className="step-eyebrow e-amber"><i />Step 2 of 3</div>
            <h2>Tell us about<br />your child</h2>
            <p>We use this to personalise activities and track progress over time.</p>
            <RegisterField label="Child's Name" name="child_name" value={fields.child_name} onChange={update} placeholder="e.g. Alex" />
            <div className="field">
              <label htmlFor="child-age">Child's Age</label>
              <div className="age-display"><span className="age-num">{age}</span><span className="age-label">years old</span></div>
              <input id="child-age" type="range" min="5" max="12" value={age} style={{ background: `linear-gradient(90deg, #00A878 ${((age - 5) / 7) * 100}%, #e5e7eb ${((age - 5) / 7) * 100}%)` }} onChange={event => setAge(Number(event.target.value))} />
            </div>
            {error && <div className="error-box">{error}</div>}
            <div className="btn-row"><button type="button" className="btn-prev" onClick={() => nextStep(1)}>←&nbsp; Back</button><button type="button" className="btn-next" onClick={() => nextStep(3)}>Continue&nbsp; →</button></div>
          </section>}
          {step === 3 && <section className="step-panel active">
            <div className="step-eyebrow e-violet"><i />Step 3 of 3</div>
            <h2>What does your<br />child need?</h2>
            <p>We'll tailor every activity to fit your child's learning style. You can update this anytime.</p>
            <div className="cond-grid">
              <ConditionCard value="Dyslexia" icon="📖" description="Phonics, word recognition & reading support" selected={condition === "Dyslexia"} onSelect={setCondition} />
              <ConditionCard value="ADHD" icon="⚡" description="Short focus tasks, memory games & timers" selected={condition === "ADHD"} onSelect={setCondition} />
              <ConditionCard value="Autism" icon="🌈" description="Visual schedules, emotion & social stories" selected={condition === "Autism"} onSelect={setCondition} />
            </div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <div className="btn-row"><button type="button" className="btn-prev" onClick={() => nextStep(2)}>←&nbsp; Back</button>            <button type="submit" className="btn-next" disabled={busy}>{busy ? "Creating..." : "Create account →"}{busy && <span className="spinner" style={{ display: "block" }} />}</button></div>
          </section>}
        </form>
        <div className="form-footer">Already have an account? <a href="login.html">Sign in here</a></div>
      </div>
      <aside className="info-side">
        <div className="iblob ib1" /><div className="iblob ib2" /><div className="iblob ib3" />
        <div className="floaters">{["🌟", "⚡", "📖", "🎯", "🧩"].map((item, index) => <span className="floater" style={floaterPositions[index]} key={item}>{item}</span>)}</div>
        <div className="info-copy">
          <h3>Three steps to<br />a <em>brighter</em> future</h3>
          <p>It takes under 2 minutes. After that, your child gets a personalised space built around how they learn.</p>
          <div className="step-previews">
            {["Your account", "Child's profile", "Learning needs"].map((title, index) => <div className={`preview-item ${step === index + 1 ? "active" : ""}`} key={title}><div className="preview-dot">{index + 1}</div><div className="preview-text"><strong>{title}</strong><span>{["Name, email & login details", "Name and age", "Condition & preferences"][index]}</span></div></div>)}
          </div>
        </div>
      </aside>
    </div>
  );
}

function RegisterField({ label, name, type = "text", value, onChange, placeholder }) {
  const icon = type === "email" ? "✉" : type === "password" ? "⌑" : name === "username" ? "@" : "♙";
  return <div className="field"><label htmlFor={name}>{label}</label><div className="field-wrap"><span className="fi">{icon}</span><input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required /></div></div>;
}

function ConditionCard({ value, icon, description, selected, onSelect }) {
  return <button type="button" data-cond={value} className={`cond-card ${selected ? "sel" : ""}`} style={{ font: "inherit", color: "inherit" }} onClick={() => onSelect(value)}><span className="cond-check">✓</span><span className="cond-emoji">{icon}</span><span className="cond-name">{value}</span><span className="cond-desc">{description}</span></button>;
}

async function logout() {
  try {
    await fetch("/api/session/logout", { method: "POST", credentials: "include" });
  } catch (error) {
    console.error("Logout request failed:", error);
  }
  localStorage.removeItem("bw_user");
  window.location.href = "login.html";
}

const activitiesByCondition = {
  ADHD: [
    ["🧠", "Memory Match", 2, "Memory", "tag-sky", "c-sky", "activityadhd.html", "bw_done_adhd_memory"],
    ["⚡", "Quick Recall", 1, "Focus", "tag-teal", "c-teal", "activityadhd.html", "bw_done_adhd_recall"],
    ["🎯", "Spot the Diff", 3, "Challenge", "tag-violet", "c-violet", "activityadhd.html", "bw_done_adhd_spot"],
    ["🔢", "Number Dash", 2, "Attention", "tag-sun", "c-sun", "activityadhd.html", "bw_done_adhd_number"]
  ],
  Dyslexia: [
    ["🔤", "Phonics Play", 1, "Phonics", "tag-sun", "c-sun", "activitydyxlexia.html", "bw_done_dyslexia_phonics"],
    ["📖", "Word Match", 2, "Reading", "tag-teal", "c-teal", "activitydyxlexia.html", "bw_done_dyslexia_word"],
    ["🎵", "Rhyme Time", 2, "Phonics", "tag-rose", "c-rose", "activitydyxlexia.html", "bw_done_dyslexia_rhyme"],
    ["🔡", "Letter Sounds", 3, "Challenge", "tag-violet", "c-violet", "activitydyxlexia.html", "bw_done_dyslexia_letters"]
  ],
  Autism: [
    ["📅", "My Routine", 1, "Daily", "tag-violet", "c-violet", "activityautism.html", "bw_done_autism_routine"],
    ["😊", "Feelings", 2, "Emotions", "tag-rose", "c-rose", "activityautism.html", "bw_done_autism_feelings"],
    ["📖", "Story Time", 2, "Social", "tag-teal", "c-teal", "activityautism.html", "bw_done_autism_story"],
    ["🎨", "Sort & Match", 1, "Visual", "tag-sky", "c-sky", "activityautism.html", "bw_done_autism_sort"]
  ]
} as const;

function normalizeCondition(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "adhd" ? "ADHD" : normalized === "dyslexia" ? "Dyslexia" : normalized === "autism" ? "Autism" : null;
}

function ChildDashboard() {
  const [state, setState] = useState({ loading: true, error: "", user: null, done: [] });
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionResponse = await fetch("/api/session", { credentials: "include" });
        if (!sessionResponse.ok) {
          localStorage.removeItem("bw_user");
          window.location.href = "login.html";
          return;
        }
        const session = await sessionResponse.json();
        if (!session.success || !session.user || session.user.user_type !== "child") {
          window.location.href = "login.html";
          return;
        }
        const progressResponse = await fetch("/api/dashboard", { credentials: "include" });
        if (!progressResponse.ok) throw new Error("Could not load your activity progress.");
        const progress = await progressResponse.json();
        if (!progress.success) throw new Error(progress.message || "Could not load your activity progress.");
        if (active) setState({ loading: false, error: "", user: session.user, done: progress.completed_activity_keys || [] });
      } catch (error) {
        if (active) setState({ loading: false, error: error.message, user: null, done: [] });
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const condition = normalizeCondition(state.user && state.user.condition);
  const activities = condition ? activitiesByCondition[condition] : [];
  const completed = useMemo(() => new Set(state.done), [state.done]);
  if (state.loading) return <div className="state-box">Loading your activities…</div>;
  if (state.error) return <div className="state-box" role="alert">Could not load your dashboard: {state.error}</div>;
  return (
    <>
      <nav className="navbar"><Logo /><div className="nav-right"><span className="nav-badge">{condition || "Profile setup needed"}</span><button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button></div></nav>
      <main>
        <div className="child-hero"><div className="child-greet"><h2>Hi {state.user.first_name || state.user.username || "there"}! 👋</h2><p>{condition ? `${condition} activities just for you ✨` : "Your caregiver can set up your learning activities."}</p></div><div className="streak-badge">⭐ Ready to learn!</div></div>
        <div className="prog-section"><div className="prog-top"><span>Today's Progress</span><strong>{activities.length ? `${activities.filter(activity => completed.has(activity[7])).length} / ${activities.length} done` : "Activities unavailable"}</strong></div><div className="prog-track"><div className="prog-fill" style={{ width: `${activities.length ? activities.filter(activity => completed.has(activity[7])).length / activities.length * 100 : 0}%` }} /></div></div>
        <div className="section-head"><h3>🎮 Your Activities</h3></div>
        {activities.length ? <div className="act-grid">{activities.map(activity => <a key={activity[7]} className={`act-card ${activity[5]}${completed.has(activity[7]) ? " completed" : ""}`} href={`${activity[6]}?card=${activity[7]}`}><span className="act-icon">{activity[0]}</span><div className="act-name">{activity[1]}</div><div className="act-stars">{"⭐".repeat(activity[2])}{"☆".repeat(3 - activity[2])}</div><span className={`act-tag ${activity[4]}`}>{activity[3]}</span></a>)}</div> : <div className="act-grid">Your activities are not set up yet. Please ask your caregiver to check your profile.</div>}
      </main>
    </>
  );
}

function CaregiverDashboard() {
  const [state, setState] = useState({ loading: true, error: "", caregiver: null, children: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const activeChild = state.children[activeIndex];
  const trendCanvas = useRef(null);
  const activityCanvas = useRef(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionResponse = await fetch("/api/session", { credentials: "include" });
        if (!sessionResponse.ok) {
          localStorage.removeItem("bw_user");
          window.location.href = "login.html";
          return;
        }
        const session = await sessionResponse.json();
        if (!session.success || session.user.user_type !== "caregiver") {
          window.location.href = "login.html";
          return;
        }
        localStorage.setItem("bw_user", JSON.stringify(session.user));
        const response = await fetch("/api/caregiver", { credentials: "include" });
        if (response.status === 401) {
          localStorage.removeItem("bw_user");
          window.location.href = "login.html";
          return;
        }
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Unable to load caregiver data.");
        if (active) setState({ loading: false, error: "", caregiver: data.caregiver, children: data.children || [] });
      } catch (error) {
        if (active) setState({ loading: false, error: `Could not reach the server — ${error.message}`, caregiver: null, children: [] });
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!activeChild || typeof window.Chart !== "function") return undefined;
    const trend = activeChild.accuracy_trend || {};
    const breakdown = activeChild.activity_breakdown || {};
    const line = trend.data && trend.data.length ? new window.Chart(trendCanvas.current, {
      type: "line",
      data: { labels: trend.labels, datasets: [{ label: "Accuracy %", data: trend.data, borderColor: "#00B894", backgroundColor: "rgba(0,184,148,0.08)", tension: 0.4, pointBackgroundColor: "#00B894", pointRadius: 5, fill: true }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 }, x: { grid: { display: false } } }, responsive: true, maintainAspectRatio: false }
    }) : null;
    const bar = breakdown.data && breakdown.data.length ? new window.Chart(activityCanvas.current, {
      type: "bar",
      data: { labels: breakdown.labels, datasets: [{ data: breakdown.data, backgroundColor: ["#FF9500", "#0EA5E9", "#6C63FF", "#FF6584", "#00B894"], borderRadius: 8, borderSkipped: false }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }, responsive: true, maintainAspectRatio: false }
    }) : null;
    return () => { line?.destroy(); bar?.destroy(); };
  }, [activeChild]);

  if (state.loading) return <div className="state-box"><div className="spinner" />Loading your dashboard…</div>;
  if (state.error) return <div className="state-box" role="alert">{state.error}</div>;
  const caregiver = state.caregiver || {};
  const stats = activeChild?.statistics || {};
  const sessions = activeChild?.sessions || [];
  const condition = activeChild?.condition_type || "";
  const chartsAvailable = typeof window.Chart === "function";
  const capitalize = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
  return (
    <>
      <nav className="navbar"><Logo /><div className="nav-right"><span className="nav-badge">Caregiver</span><button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button></div></nav>
      <main><div className="content">
        <header className="cg-header"><h2>Welcome back, {caregiver.first_name || caregiver.username}! 👋</h2><p>Signed in as @{caregiver.username}. {state.children.length ? `Here's how your ${state.children.length === 1 ? "child is" : `${state.children.length} children are`} progressing.` : "No child profiles are linked to this account yet."}</p></header>
        <div className="child-tabs"><span className="tabs-label">CHILD PROFILES</span><div id="tabs-container">{state.children.length ? state.children.map((child, index) => {
          const label = [child.child_name || "Child", child.child_age ? `Age ${child.child_age}` : "", capitalize(child.condition_type)].filter(Boolean).join(" · ");
          return <button key={child.profile_id || index} className={`ctab ${index === activeIndex ? "active" : ""}`} onClick={() => setActiveIndex(index)}>{label}</button>;
        }) : <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>No children linked to your account.</span>}</div></div>
        <div className="section-heading"><h3>Progress overview</h3><p>Learning activity and progress summary for the selected profile.</p></div>
        <div className="kpi-grid">
          <Kpi label="Average accuracy" value={stats.total_sessions > 0 && stats.avg_score != null ? `${stats.avg_score}%` : "—"} />
          <Kpi label="Sessions" value={stats.total_sessions ?? "—"} />
          <Kpi label="Activities completed" value={stats.total_completed ?? "—"} />
          <Kpi label="Learning profile" value={capitalize(condition)} sub={activeChild?.child_age ? `Age ${activeChild.child_age}` : ""} />
        </div>
        <div className="charts-grid">
          <div className="chart-card"><h4>Accuracy over time</h4>{activeChild?.accuracy_trend?.data?.length ? chartsAvailable ? <canvas ref={trendCanvas} height="180" /> : <ChartNotice>Charts are unavailable right now.</ChartNotice> : <ChartNotice>No sessions recorded yet.</ChartNotice>}</div>
          <div className="chart-card"><h4>Sessions by Activity</h4>{activeChild?.activity_breakdown?.data?.length ? chartsAvailable ? <canvas ref={activityCanvas} height="180" /> : <ChartNotice>Charts are unavailable right now.</ChartNotice> : <ChartNotice>No sessions recorded yet.</ChartNotice>}</div>
        </div>
        <div className="table-card"><h4>Recent activity</h4><div className="table-scroll"><table><thead><tr><th>Date</th><th>Activity</th><th>Type</th><th>Score</th><th>Duration</th><th>Status</th></tr></thead><tbody>{sessions.length ? sessions.map((session, index) => {
          const score = Math.max(0, Math.min(Number(session.score) || 0, 100));
          return <tr key={session.id || `${session.date}-${index}`}><td>{session.date}</td><td>{session.activity}</td><td>{session.type}</td><td><div className="mini-bar"><div className="mini-track"><div className="mini-fill" style={{ width: `${score}%`, background: score >= 80 ? "var(--teal)" : score >= 60 ? "#F59E0B" : "var(--rose)" }} /></div><span>{score}%</span></div></td><td>{session.time}</td><td><span className="badge-done">✓ Done</span></td></tr>;
        }) : <tr className="empty-row"><td colSpan={6}>{activeChild ? `No activities are recorded for ${activeChild.child_name || "this child"} yet. Check that the child is using the account linked to this caregiver.` : "No sessions yet."}</td></tr>}</tbody></table></div></div>
      </div></main>
    </>
  );
}

function Kpi({ label, value, sub = "" }) {
  return <div className="kpi-card"><div className="kpi-label">{label}</div><div className="kpi-val">{value}</div>{sub && <div className="kpi-sub">{sub}</div>}</div>;
}

function ChartNotice({ children }) {
  return <p className="chart-empty" style={{ color: "var(--muted)", textAlign: "center", padding: "35px 0" }}>{children}</p>;
}

const activityPages = {
  "activityadhd.html": { type: "ADHD", back: startAdhdGame, defaultKey: "bw_done_adhd_memory", title: "ADHD Activity" },
  "activityautism.html": { type: "Autism", back: startAutismGame, defaultKey: "bw_done_autism_routine", title: "Autism Activity" },
  "activitydyxlexia.html": { type: "Dyslexia", back: startDyslexiaGame, defaultKey: "bw_done_dyslexia_phonics", title: "Dyslexia Activity" }
};

function ActivityPage({ page }) {
  const config = activityPages[page];
  useEffect(() => {
    config.back(new URLSearchParams(window.location.search).get("card") || config.defaultKey);
  }, [config]);
  return (
    <>
      <nav className="navbar"><Logo /><a className="btn-back" href="dashboardchild.html">← Back</a></nav>
      <main><div className="act-screen"><div className="act-box" id="act-box" /></div></main>
      <div id="modal" className="modal-wrap hidden"><div className="modal-box"><h3 id="modal-title">Done! 🎉</h3><p id="msg" /><p className="save-status" id="save-status">Saving...</p><a className="btn btn-primary" id="back-btn" href="dashboardchild.html" style={{ pointerEvents: "none", opacity: 0.5 }}>Back</a></div></div>
    </>
  );
}

function App() {
  const route = pageName;
  let page;
  if (route === "login.html") page = <LoginPage />;
  else if (route === "register.html") page = <RegisterPage />;
  else if (route === "dashboardchild.html") page = <ChildDashboard />;
  else if (route === "dashboardcaregiver.html") page = <CaregiverDashboard />;
  else if (activityPages[route]) page = <ActivityPage page={route} />;
  else page = <HomePage />;
  return <><PageStyle page={route} />{page}</>;
}

createRoot(document.getElementById("root")).render(<App />);
