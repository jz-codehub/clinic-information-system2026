// ============================================================
// verify_confirm.js — custom popup prompts (replaces native confirm/alert)
// 1) no native confirm()/alert()/prompt() left in live files
// 2) App.confirm() behavior: OK=true, Cancel/ESC/backdrop=false, popup injected
// 3) all 3 former call sites use await App.confirm(...)
// 4) .cfm-* popup styles exist in style.css
// Run: node tests/verify_confirm.js
// ============================================================
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("PASS " + msg); } else { fail++; console.log("FAIL " + msg); } };
const read = (p) => fs.readFileSync(path.join(projectRoot, p), "utf8");

// Native prompt detection — must NOT match method calls like App.confirm(
// nor the App.confirm/App.alert method DEFINITIONS themselves.
const nativeRe = /(?<![A-Za-z0-9_$.])(confirm|alert|prompt)\s*\(/;
// Blank out block comments (multi-line safe, keeps line structure) + line comments.
const stripComments = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
const isDefinition = (line) => /^\s*(async\s+)?(confirm|alert|prompt)\s*\([^)]*\)\s*\{\s*$/.test(line);

// ---- 1. Scan live files (app + all pages) ----
const live = ["assets/js/app.js", "assets/js/data.js", "assets/js/schedules.js"];
const pageFiles = fs.readdirSync(path.join(projectRoot, "pages")).filter((f) => f.endsWith(".html")).map((f) => "pages/" + f);
const offenders = [];
for (const f of live.concat(pageFiles)) {
  const lines = stripComments(read(f)).split("\n");
  lines.forEach((ln, i) => {
    if (nativeRe.test(ln) && !isDefinition(ln)) offenders.push(`${f}:${i + 1}`);
  });
}
ok(offenders.length === 0, "no native confirm()/alert()/prompt() in live files" + (offenders.length ? " — found " + offenders.join(", ") : ""));

// ---- 2. Live call sites migrated ----
const appSrc = read("assets/js/app.js");
const gmapSrc = read("pages/guide-map.html");
const mySrc = read("pages/myclinic.html");
ok(/await this\.confirm\(/.test(appSrc), "logout uses await this.confirm(...)");
ok(/await App\.confirm\(/.test(gmapSrc), "guide-map Reset layout uses await App.confirm(...)");
ok(/await App\.confirm\(/.test(mySrc), "myclinic Reset roster uses await App.confirm(...)");
ok(!/confirm\("Log out ngayon\?"/.test(appSrc), "old native logout confirm removed");
ok(!/confirm\("Reset all moved rooms/.test(gmapSrc), "old native reset-geo confirm removed");
ok(!/confirm\("I-reset ang buong roster/.test(mySrc), "old native roster confirm removed");

// ---- 3. Popup styles present ----
const css = read("assets/css/style.css");
ok(css.includes(".cfm-backdrop"), "style.css has .cfm-backdrop");
ok(css.includes(".cfm-modal"), "style.css has .cfm-modal");
ok(/\.cfm-backdrop \{[^}]*z-index: 10001/.test(css), "popup z-index (10001) sits above fullscreen map");
ok(css.includes(".cfm-modal.cfm-danger .cfm-ico"), "danger variant styled");

// ---- 4. Mini DOM shim for behavioral tests ----
function makeEl(tag) {
  const handlers = {};
  return {
    tagName: tag || "div", id: "", className: "", _html: "", textContent: "",
    parentNode: null, style: {},
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, force) { if (force === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (force) { this._s.add(c); } else { this._s.delete(c); } },
      contains(c) { return this._s.has(c); },
    },
    set innerHTML(v) { this._html = String(v); },
    get innerHTML() { return this._html; },
    addEventListener(t, fn) { (handlers[t] = handlers[t] || []).push(fn); },
    removeEventListener(t, fn) { if (handlers[t]) handlers[t] = handlers[t].filter((f) => f !== fn); },
    fire(t, ev) { (handlers[t] || []).slice().forEach((fn) => fn(ev || {})); },
    appendChild(c) { c.parentNode = this; (this.children = this.children || []).push(c); return c; },
    removeChild(c) { c.parentNode = null; this.children = (this.children || []).filter((x) => x !== c); return c; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    setAttribute() {}, getAttribute() { return null; },
    focus() {}, querySelectorAll() { return []; },
    querySelector(sel) { this._q = this._q || {}; if (!this._q[sel]) this._q[sel] = makeEl("div"); return this._q[sel]; },
  };
}
const body = makeEl("body");
const docHandlers = {};
const docShim = {
  body,
  getElementById(id) { return (body.children || []).find((c) => c.id === id) || null; },
  createElement: (t) => makeEl(t),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(t, fn) { (docHandlers[t] = docHandlers[t] || []).push(fn); },
  removeEventListener(t, fn) { if (docHandlers[t]) docHandlers[t] = docHandlers[t].filter((f) => f !== fn); },
};
const fireKey = (key) => (docHandlers.keydown || []).slice().forEach((fn) => fn({ key }));

const sandbox = {
  console, Math, JSON, Date, Array, Object, Set, Map, Promise, isFinite,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  document: docShim,
  window: { addEventListener() {}, removeEventListener() {}, location: { href: "" } },
  location: { pathname: "/pages/dashboard.html", search: "" },
  setTimeout: (fn) => { fn(); return 0 },   // run timers immediately in tests
  clearTimeout: () => {},
  // native prompts must NEVER fire — calling one fails loudly
  confirm: () => { throw new Error("native confirm() was called!"); },
  alert: () => { throw new Error("native alert() was called!"); },
  prompt: () => { throw new Error("native prompt() was called!"); },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(read("assets/js/data.js"), sandbox, { filename: "data.js" });
vm.runInContext(appSrc, sandbox, { filename: "app.js" });
vm.runInContext("globalThis.App = App;", sandbox); // export lexical const to the sandbox global

(async () => {
  ok(typeof sandbox.App.confirm === "function", "App.confirm exists");
  ok(typeof sandbox.App.alert === "function", "App.alert exists");

  // (a) OK click → true, popup removed
  let p = sandbox.App.confirm({ title: "T-One", message: "M-One" });
  ok(p && typeof p.then === "function", "App.confirm returns a Promise");
  let bd = body.children[body.children.length - 1];
  ok(bd && bd.id === "cfmBackdrop", "popup injected into body (#cfmBackdrop)");
  ok(bd.innerHTML.includes("cfm-modal"), "popup renders .cfm-modal markup");
  ok(bd.querySelector(".cfm-title").textContent === "T-One", "title text applied");
  ok(bd.querySelector(".cfm-msg").textContent === "M-One", "message text applied");
  ok(bd.classList.contains("open"), "popup gets .open (animated in)");
  bd.querySelector(".cfm-ok").fire("click");
  ok((await p) === true, "OK click resolves TRUE");
  ok(!body.children.includes(bd), "popup removed from DOM after OK");

  // (b) Cancel → false
  p = sandbox.App.confirm({ title: "T-Two" });
  bd = body.children[body.children.length - 1];
  bd.querySelector(".cfm-cancel").fire("click");
  ok((await p) === false, "Cancel click resolves FALSE");

  // (c) backdrop click → false, inner click ignored
  p = sandbox.App.confirm({ title: "T-Three" });
  bd = body.children[body.children.length - 1];
  bd.fire("click", { target: makeEl("div") });
  ok(body.children.includes(bd), "inner click does NOT dismiss");
  bd.fire("click", { target: bd });
  ok((await p) === false, "backdrop click resolves FALSE");

  // (d) ESC → false
  p = sandbox.App.confirm({ title: "T-Four" });
  fireKey("Escape");
  ok((await p) === false, "ESC key resolves FALSE");

  // (e) danger → red OK button; hideCancel → hidden cancel
  p = sandbox.App.confirm({ title: "T-Five", danger: true });
  bd = body.children[body.children.length - 1];
  ok(bd.querySelector(".cfm-modal").classList.contains("cfm-danger"), "danger:true sets .cfm-danger on modal");
  ok(bd.querySelector(".cfm-ok").classList.contains("btn-danger"), "danger:true → OK button is btn-danger");
  bd.querySelector(".cfm-ok").fire("click");
  await p;

  p = sandbox.App.confirm({ title: "T-Six", hideCancel: true });
  bd = body.children[body.children.length - 1];
  ok(bd.querySelector(".cfm-cancel").style.display === "none", "hideCancel hides the cancel button");
  bd.querySelector(".cfm-ok").fire("click");
  await p;

  // (f) stacked popup — old one dismissed, never leaks an unresolved promise
  const pOld = sandbox.App.confirm({ title: "Old" });
  const pNew = sandbox.App.confirm({ title: "New" });
  bd = body.children[body.children.length - 1];
  ok(bd.querySelector(".cfm-title").textContent === "New", "new popup replaces the open one");
  ok((await pOld) === false, "replaced popup resolves FALSE (no leak)");
  bd.querySelector(".cfm-ok").fire("click");
  ok((await pNew) === true, "replacing popup still resolves normally");

  // (g) App.alert → single-button popup
  const pa = sandbox.App.alert("Paunawa lang");
  const bda = body.children[body.children.length - 1];
  ok(bda.querySelector(".cfm-cancel").style.display === "none", "App.alert hides Cancel (single-button)");
  ok(bda.querySelector(".cfm-msg").textContent === "Paunawa lang", "App.alert sets message");
  bda.querySelector(".cfm-ok").fire("click");
  ok((await pa) === true, "App.alert resolves on OK");

  console.log("");
  console.log(fail === 0 ? `ALL CONFIRM-POPUP CHECKS PASSED (${pass})` : `${fail} FAILED / ${pass + fail} total`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(1); });
