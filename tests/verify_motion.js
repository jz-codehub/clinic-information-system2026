// ============================================================
// verify_motion.js — lightweight interface motion layer
// (pure CSS, GPU-only: transform/opacity, no JS, no heavy filters)
// Run: node tests/verify_motion.js
// ============================================================
const fs = require("fs");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("PASS " + msg); } else { fail++; console.log("FAIL " + msg); } };
const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");

// ---- Entrance: staggered fade-up, once per load ----
ok(/\.content > \*:nth-child\(1\) \{ animation: pageIn/.test(css), "stagger: 1st content child animates");
ok(/\.content > \*:nth-child\(5\) \{ animation: pageIn [^;]*0\.24s/.test(css), "stagger: 5th child delayed 0.24s (cascade)");
ok(/@keyframes pageIn \{\s*from \{[^}]*opacity: 0; transform: translateY\(14px\);/.test(css), "pageIn: opacity+translateY only");
ok(/@keyframes pageIn[\s\S]{0,200}?to \{[^}]*transform: none/.test(css), "pageIn ends at rest state");

// ---- Hover micro-interactions ----
ok(/\.stat:hover \{\s*transform: translateY\(-4px\)/.test(css), "stat cards lift on hover");
ok(/\.stat:hover \.stat-ico \{\s*transform: scale\(1\.1\) rotate\(-4deg\)/.test(css), "stat icon pops on hover");
ok(/\.nav-item::after[\s\S]{0,300}?transform: scaleX\(0\)[\s\S]{0,300}?transform-origin: left/.test(css), "nav underline starts hidden");
ok(/\.nav-item:hover::after, \.nav-item\.active::after \{ transform: scaleX\(1\)/.test(css), "nav underline sweeps in on hover/active");
ok(/table\.tbl tbody tr:hover \{[^}]*transform: translateX\(3px\)/.test(css), "table rows nudge right on hover");
ok(/\.card:hover \{[^}]*transform: translateY\(-2px\)/.test(css), "cards lift on hover");
ok(/\.queue-item:hover \{[^}]*transform: translateX\(4px\)/.test(css), "queue rows nudge right on hover");
ok(/\.btn:active \{[^}]*transform: translateY\(1px\) scale\(0\.98\)/.test(css), "buttons give press-down feedback");
ok(/\.badge:hover \{[^}]*transform: scale\(1\.06\)/.test(css), "badges pop on hover");

// ---- Performance guardrails: no layout-thrashing properties ----
// Allowed animatable props in motion layer: transform, opacity, box-shadow,
// background/border-color/color/filter (cheap on modern browsers).
const motionProps = [...css.matchAll(/@keyframes\s+\w+\s*{([\s\S]*?)\n}/g)].map((m) => m[1]).join(" ");
const banned = ["width", "height", "margin", "padding", "top:", "left:", "right:", "bottom:"];
const hits = banned.filter((p) => new RegExp(`(^|[\\s{;])${p.replace(":", "")}\\s*:`).test(motionProps));
ok(hits.length === 0, "keyframes animate GPU-only props (no width/height/margin/position)" + (hits.length ? " — " + hits.join(",") : ""));
ok(!/animation:[^;]*[\s,](2s|3s|infinite)(?=[\s;,])/.test(css), "no long or infinite animations (all short, one-shot)");

// ---- Safety: print + reduced-motion kill-switches ----
ok(/#printArea[^{]*\{[^}]*animation: none !important/.test(css), "motion disabled inside #printArea");
ok(/@media print \{\s*\*, \*::before, \*::after \{[^}]*animation: none !important/.test(css), "motion disabled when printing");
ok(/@media \(prefers-reduced-motion: reduce\)[\s\S]{0,400}?animation-duration: 0\.01ms !important/.test(css), "reduced-motion users get a calm interface");
ok(!/\.cfm-modal\s*\{[^}]*animation:/.test(css), "confirm popup keeps its transition (not doubled)");

// ---- CSS still parses (balanced braces) ----
const open = (css.match(/\{/g) || []).length, close = (css.match(/\}/g) || []).length;
ok(open === close && open > 100, `style.css braces balanced (${open}/${close})`);

console.log("");
console.log(fail === 0 ? `ALL MOTION CHECKS PASSED (${pass})` : `${fail} FAILED / ${pass + fail} total`);
process.exit(fail ? 1 : 0);
