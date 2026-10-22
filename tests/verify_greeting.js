// ============================================================
// verify_greeting.js — dashboard time-of-day greeting has a mood emoji
// (all glyphs are old Win-10-safe BMP emoji, never Emoji-12+).
// Run: node tests/verify_greeting.js
// ============================================================
const fs = require("fs");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("PASS " + msg); } else { fail++; console.log("FAIL " + msg); } };
const src = fs.readFileSync(path.join(projectRoot, "pages", "dashboard.html"), "utf8");

// Title wires the mood emoji in front of the greeting text
ok(/title:\s*greeting\(\)\.emoji\s*\+\s*" "/.test(src), "page title starts with the mood emoji");
ok(/greeting\(\)\.text/.test(src), "page title still uses greeting text + first name");

// Time → mood mapping (morning / afternoon / night)
ok(/if \(h < 12\) return \{ emoji: "☀️", text: "Magandang umaga" \}/.test(src), "morning (h<12) → ☀️ Magandang umaga");
ok(/if \(h < 18\) return \{ emoji: "⛅", text: "Magandang hapon" \}/.test(src), "afternoon (h<18) → ⛅ Magandang hapon");
ok(/return \{ emoji: "🌙", text: "Magandang gabi" \}/.test(src), "night → 🌙 Magandang gabi");

// No Emoji-12+ glyphs anywhere on the page (renders on Win 10)
const RISKY = ["\u{1FA78}", "\u{1FA79}", "\u{1FA7A}", "\u{1FA7B}", "\u{1FA91}", "\u{1FAC1}"];
const found = RISKY.filter((r) => src.includes(r));
ok(found.length === 0, "dashboard free of risky Emoji-12+ glyphs" + (found.length ? " — " + found.join(",") : ""));

console.log("");
console.log(fail === 0 ? `ALL GREETING CHECKS PASSED (${pass})` : `${fail} FAILED / ${pass + fail} total`);
process.exit(fail ? 1 : 0);
