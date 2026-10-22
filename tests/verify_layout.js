/* Smoke test: verifies renderLayout() now emits a TOP HEADER NAVIGATOR
   (no sidebar / topbar remnants) and that mobile toggle wiring exists.
   Run: node tests/verify_layout.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const dataSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "data.js"), "utf8");
const appSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "app.js"), "utf8");

// Tolerant fake DOM that CAPTURES body.innerHTML so we can assert on the shell.
function makeEl() {
  const el = {
    _html: "",
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); },
      contains(c) { return this._s.has(c); },
    },
    style: {}, dataset: {}, value: "", textContent: "", hidden: false,
    addEventListener() {}, removeEventListener() {}, appendChild() {},
    setAttribute() {}, getAttribute() { return null; }, focus() {}, remove() {},
    querySelectorAll() { return []; }, querySelector() { return null; },
  };
  Object.defineProperty(el, "innerHTML", {
    get() { return this._html; },
    set(v) { this._html = String(v); },
  });
  return el;
}

// Seed a session for each role we test.
function run(role) {
  const backing = {};
  const body = makeEl();
  const els = { appbarNav: makeEl(), overlayNav: makeEl(), appbarToggle: makeEl(), toastHost: null };
  backing["rmc_session"] = JSON.stringify({ userId: "u0", name: "Test User", role });

  const sandbox = {
    console, Math, JSON, Date, isFinite, Array, Object, Uint8Array, Float64Array, Int32Array, Set, Map,
    localStorage: {
      getItem: (k) => (k in backing ? backing[k] : null),
      setItem: (k, v) => { backing[k] = String(v); },
      removeItem: (k) => { delete backing[k]; },
      clear: () => { for (const k in backing) delete backing[k]; },
    },
    document: {
      body,
      getElementById: (id) => (id in els ? els[id] : makeEl()),
      querySelector: () => makeEl(),
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => makeEl(),
    },
    window: { addEventListener() {}, removeEventListener() {}, location: { href: "", replace() {} } },
    location: { pathname: "/pages/dashboard.html", search: "" },
    confirm: () => true, alert: () => {}, prompt: () => null,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataSrc, sandbox, { filename: "data.js" });
  vm.runInContext(appSrc, sandbox, { filename: "app.js" });
  vm.runInContext(`renderLayout({ page: "dashboard.html", title: "Dashboard", subtitle: "A subtitle here", actions: "<button class='btn'>Act</button>", content: "<div id='bodyHost'><h1>Hi</h1></div>" });`, sandbox);
  return { html: body.innerHTML, sandbox };
}

let fail = 0;
const ok = (cond, msg) => { if (cond) console.log("PASS " + msg); else { console.log("FAIL " + msg); fail++; } };

const { html, sandbox } = run("superadmin");

// --- Header navigator present ---
ok(html.includes('<header class="appbar">'), "renders <header class='appbar'> (header navigator)");
ok(html.includes('class="appbar-nav"'), "renders .appbar-nav (horizontal nav container)");
ok(html.includes('id="appbarToggle"'), "renders hamburger toggle button");
ok(html.includes('class="overlay-nav"'), "renders mobile overlay-nav backdrop");

// --- Two-row header structure ---
ok(html.includes('appbar-row appbar-row--top'), "renders top row (brand + search + buttons)");
ok(html.includes('appbar-row appbar-row--nav'), "renders nav row (navbar links)");
ok((html.match(/appbar-row--/g) || []).length === 2, "exactly two header rows");
// nav must come AFTER the top row in the markup
ok(html.indexOf('appbar-row--top') < html.indexOf('appbar-row--nav'), "nav row is the 2nd row (below the top row)");

// --- Old sidebar/topbar fully removed ---
ok(!html.includes('class="sidebar"'), "no leftover .sidebar element");
ok(!html.includes('class="topbar"'), "no leftover .topbar element");
ok(!html.includes("overlay-sidebar"), "no leftover overlay-sidebar");
ok(!html.includes("sidebar-nav"), "no leftover sidebar-nav");
ok(!html.includes("toggleSidebar"), "no leftover toggleSidebar reference");

// --- Content still injected inside <main class="content"> ---
ok(html.includes('<main class="content" id="pageContent">'), "renders <main class='content'>");
ok(html.includes("Hi"), "page content is injected");

// --- 2nd-tier page title bar ---
ok(html.includes('<div class="pagebar">'), "renders 2nd-tier .pagebar");
ok(html.includes('class="pagebar-title"'), "pagebar shows the page title");
ok(html.includes("A subtitle here"), "pagebar shows the subtitle");
ok(html.includes("pagebar-actions"), "pagebar shows action buttons");
ok(!html.includes('class="page-head"'), "no leftover .page-head block in shell");

// --- Nav links generated (role-based), section labels NOT emitted ---
ok(html.includes('href="patients.html"'), "nav includes role links (patients.html for superadmin)");
ok(!html.includes('class="nav-label"'), "section labels (nav-label) are not emitted in header nav");
ok((html.match(/class="nav-item/g) || []).length >= 5, "multiple nav items rendered for superadmin");

// --- toggleNav is wired to the new IDs ---
const appNs = vm.runInContext("({ toggleNav: App.toggleNav })", sandbox);
ok(typeof appNs.toggleNav === "function", "App.toggleNav exists");

// --- Run for every role to ensure no crashes ---
["doctor", "secretary", "regular"].forEach((r) => {
  try { run(r); console.log("PASS renderLayout runs for role: " + r); }
  catch (e) { console.log("FAIL renderLayout threw for role " + r + ": " + e.message); fail++; }
});

/* ---- Auto-fit (wireNavFit) unit tests ----
   A stateful fake nav whose scrollWidth changes per data-nav-fit level lets us
   prove the algorithm picks the roomiest level that fits, uses the max compact
   level when nothing fits, and skips shrinking in the mobile dropdown. */
function fitLevel(widthsByLevel, clientW, mobile) {
  const state = { attr: "0" };
  const nav = {
    get scrollWidth() { return widthsByLevel[Number(state.attr) || 0]; },
    clientWidth: clientW,
  };
  const bar = {
    _a: {},
    setAttribute(k, v) { this._a[k] = String(v); if (k === "data-nav-fit") state.attr = String(v); },
    getAttribute(k) { return k in this._a ? this._a[k] : null; },
  };
  const sb = {
    console, Math, JSON, Date, Set, Map, Array, Object,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
    document: {
      getElementById: (id) => (id === "appbarNav" ? nav : null),
      querySelector: () => bar,
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => ({ className: "", id: "", innerHTML: "" }),
    },
    getComputedStyle: () => ({ position: mobile ? "absolute" : "relative" }),
    window: { addEventListener() {} },
    requestAnimationFrame: (fn) => fn(), cancelAnimationFrame() {},
  };
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(appSrc, sb, { filename: "app.js" });
  vm.runInContext("wireNavFit();", sb);
  return bar.getAttribute("data-nav-fit");
}

ok(fitLevel([500, 500, 500, 500], 800, false) === "0", "auto-fit: roomy nav stays at level 0 (no shrink)");
ok(fitLevel([2000, 2000, 2000, 2000], 800, false) === "3", "auto-fit: never-fitting nav uses max compact level 3");
ok(fitLevel([2000, 1200, 700, 700], 800, false) === "2", "auto-fit: picks the roomiest level that fits (level 2)");
ok(fitLevel([2000, 2000, 2000, 2000], 800, true) === "0", "auto-fit: mobile dropdown skips shrinking (level 0)");

console.log(fail === 0 ? "\nALL LAYOUT CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
process.exit(fail === 0 ? 0 : 1);
