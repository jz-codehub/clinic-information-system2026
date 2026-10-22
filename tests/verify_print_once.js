/* Verifies App.printSheet() fires window.print() EXACTLY ONCE per call,
   even when both the image-load path and the safety-timeout path would fire.
   (Regression: cancelling the 1st dialog used to let the overdue timeout pop a 2nd.)
   Run: node tests/verify_print_once.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const appSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "app.js"), "utf8");
const HTML_WITH_IMG = "<img>";
const HTML_NO_IMG = "<div>no images</div>";

// Controllable sandbox: count prints, capture (and manually fire) timers.
function makeSandbox(imgs) {
  let printCount = 0;
  let capturedTimer = null;
  const area = {
    _html: "",
    set innerHTML(v) { this._html = String(v); },
    get innerHTML() { return this._html; },
    querySelectorAll: () => imgs,   // array of fake <img> objects
  };
  const sb = {
    console, Math, JSON, Date, isFinite, Array, Object, Uint8Array, Float64Array, Int32Array, Set, Map,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
    document: { getElementById: () => area, createElement: () => area, body: { appendChild() {} }, addEventListener() {} },
    window: { print: () => { printCount += 1; } },
    setTimeout: (fn) => { capturedTimer = { fn, cleared: false }; return capturedTimer; },
    clearTimeout: (t) => { if (t) t.cleared = true; },
    confirm: () => true, alert: () => {}, prompt: () => null,
  };
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(appSrc, sb, { filename: "app.js" });
  return { sb, area, getPrints: () => printCount, getTimer: () => capturedTimer };
}
function call(s, html) {
  return vm.runInContext("App.printSheet(" + JSON.stringify(html) + ")", s);
}

let fail = 0;
function ok(c, m) { if (c) { console.log("PASS " + m); } else { console.log("FAIL " + m); fail++; } }

// --- A: image already loaded -> prints once; overdue timer must NOT re-print ---
const A = makeSandbox([{ complete: true, naturalWidth: 100, onload: null, onerror: null }]);
call(A.sb, HTML_WITH_IMG);
ok(A.getPrints() === 1, "A: prints once after image loads (count=" + A.getPrints() + ")");
ok(A.getTimer() && A.getTimer().cleared === true, "A: safety timer cleared after printing");
if (A.getTimer()) A.getTimer().fn();
ok(A.getPrints() === 1, "A: firing overdue safety timer does NOT double-print (count=" + A.getPrints() + ")");

// --- B: image not loaded -> no immediate print; timer first; late onload must NOT re-print ---
const imgB = { complete: false, naturalWidth: 0, onload: null, onerror: null };
const B = makeSandbox([imgB]);
call(B.sb, HTML_WITH_IMG);
ok(B.getPrints() === 0, "B: no print while image still loading (count=" + B.getPrints() + ")");
B.getTimer().fn();
ok(B.getPrints() === 1, "B: safety timer prints once (count=" + B.getPrints() + ")");
if (imgB.onload) imgB.onload();
ok(B.getPrints() === 1, "B: late image onload does NOT double-print (count=" + B.getPrints() + ")");

// --- C: no images -> prints immediately, once ---
const C = makeSandbox([]);
call(C.sb, HTML_NO_IMG);
ok(C.getPrints() === 1, "C: no-image sheet prints once (count=" + C.getPrints() + ")");

if (fail === 0) { console.log("\nALL PRINT-ONCE CHECKS PASSED"); }
else { console.log("\n" + fail + " CHECK(S) FAILED"); }
process.exit(fail === 0 ? 0 : 1);
