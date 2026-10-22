// ============================================================
// verify_theme.js — logo palette migration + design polish guard
// Ensures the live files keep the RMCI logo palette (azure/navy/mint)
// and never regress to the legacy medical-teal hexes.
// Run: node tests/verify_theme.js
// ============================================================
const fs = require("fs");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("PASS " + msg); } else { fail++; console.log("FAIL " + msg); } };
const read = (p) => fs.readFileSync(path.join(projectRoot, p), "utf8");

const css = read("assets/css/style.css");
const gmap = read("pages/guide-map.html");
const data = read("assets/js/data.js");

// ---- 1. :root palette matches the logo ----
ok(/--primary:\s*#0E79C4/i.test(css), "palette: --primary is logo azure (#0E79C4)");
ok(/--primary-dark:\s*#0A5E9C/i.test(css), "palette: --primary-dark (#0A5E9C)");
ok(/--primary-darker:\s*#16346E/i.test(css), "palette: --primary-darker is logo navy (#16346E)");
ok(/--primary-light:\s*#D8EDFB/i.test(css), "palette: --primary-light tint (#D8EDFB)");
ok(/--accent:\s*#45C98A/i.test(css), "palette: --accent is logo mint green (#45C98A)");
ok(css.includes("--brand-grad:"), "palette: --brand-grad gradient defined");
ok(/--sidebar-active:\s*#0E79C4/i.test(css), "palette: sidebar/nav active uses azure");

// ---- 2. No legacy teal anywhere in live files ----
const LEGACY = ["#0d9488", "#0f766e", "#115e59", "#ccfbf1", "#f0fdfa", "#14b8a6", "#eef7f6", "rgba(13, 148, 136"];
const legacyIn = (s) => { const l = s.toLowerCase(); return LEGACY.filter((c) => l.includes(c.toLowerCase())); };
ok(legacyIn(css).length === 0, "style.css free of legacy teal (" + (legacyIn(css).join(",") || "clean") + ")");
ok(legacyIn(gmap).length === 0, "guide-map.html free of legacy teal (" + (legacyIn(gmap).join(",") || "clean") + ")");
ok(legacyIn(data).length === 0, "data.js free of legacy teal (" + (legacyIn(data).join(",") || "clean") + ")");

// ---- 3. Guide map migrated to azure ----
ok(gmap.toLowerCase().includes("#0e79c4"), "guide-map uses azure primary");
ok(gmap.toLowerCase().includes("#0a5e9c"), "guide-map uses deep azure");

// ---- 4. Design polish present ----
ok(css.includes("::selection"), "global ::selection (brand highlight)");
ok(css.includes(":focus-visible"), "global :focus-visible ring");
ok(css.includes("scrollbar-width: thin"), "slim brand scrollbars");
ok(/linear-gradient\(120deg, #0C1329 0%, #14224B 52%, #0D3E6E 100%\)/.test(css), "header navy→azure brand gradient");
ok(css.includes(".pagebar-title::before"), "pagebar title accent bar");
ok(/\.btn-primary \{ background: var\(--brand-grad\)/.test(css), "primary buttons use --brand-grad");
ok(/box-shadow: 0 3px 12px rgba\(14, 121, 196, 0\.45\)/.test(css), "active nav item azure glow");
ok(/border-left: 4px solid var\(--primary\)/.test(css), "toast has brand accent border");
ok(/linear-gradient\(135deg, #1793d2, #16346e\)/.test(css), "avatar azure→navy gradient");
ok(css.includes("0 0 0 2px rgba(63, 176, 232, 0.55)"), "header logo-mark azure ring");
ok(/linear-gradient\(180deg, #ffffff 0%, #fafcff 100%\)/.test(css), "pagebar soft gradient surface");
ok(/\.card:hover \{[^}]*border-color: #cfe4f6;/.test(css), "card hover border tint");
ok(/\.card:hover \{[^}]*transform: translateY\(-2px\)/.test(css), "card lifts on hover");

// ---- 5. CSS still parses (balanced braces) ----
const open = (css.match(/\{/g) || []).length, close = (css.match(/\}/g) || []).length;
ok(open === close && open > 50, `style.css braces balanced (${open}/${close})`);

console.log("");
console.log(fail === 0 ? `ALL THEME CHECKS PASSED (${pass})` : `${fail} FAILED / ${pass + fail} total`);
process.exit(fail ? 1 : 0);
