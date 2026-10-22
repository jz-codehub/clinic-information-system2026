// ============================================================
// verify_icons.js — emoji-font-safe icons
// The x-ray / stethoscope / bandage / blood-drop medical emojis (U+1FA78..7B)
// plus chair (U+1FA91) and lungs (U+1FAC1) only exist on Emoji-12+ fonts
// (Windows 11) and render BLANK on Windows 10. This guards that:
//   1) none of those codepoints remain in live files,
//   2) the Services radiology tab uses an inline SVG icon,
//   3) the data.js migration normalizes stale stored clinic icons.
// Run: node tests/verify_icons.js
// ============================================================
const fs = require("fs");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("PASS " + msg); } else { fail++; console.log("FAIL " + msg); } };
const read = (p) => fs.readFileSync(path.join(projectRoot, p), "utf8");

const RISKY = ["\u{1FA78}", "\u{1FA79}", "\u{1FA7A}", "\u{1FA7B}", "\u{1FA91}", "\u{1FAC1}"];

// ---- 1. No risky codepoints in live files ----
const live = ["assets/js/app.js", "assets/js/data.js", "assets/js/schedules.js", "assets/js/services.js"];
const pages = fs.readdirSync(path.join(projectRoot, "pages")).filter((f) => f.endsWith(".html")).map((f) => "pages/" + f);
const found = [];
for (const f of live.concat(pages)) {
  const src = read(f);
  for (const r of RISKY) if (src.includes(r)) found.push(f + " has U+" + r.codePointAt(0).toString(16).toUpperCase());
}
ok(found.length === 0, "no risky emoji codepoints in live files" + (found.length ? " — " + found.join(", ") : ""));

// ---- 2. Services radiology tab uses inline SVG ----
const svc = read("pages/services.html");
ok(svc.includes("ICON_XRAY"), "services.html defines ICON_XRAY");
ok(/class="svc-ico"/.test(svc), "SVG icon carries .svc-ico class");
ok(svc.includes('["radiology", ICON_XRAY + " Radiology"]'), "radiology tab uses ICON_XRAY");
ok(!RISKY.some((r) => svc.includes(r)), "services.html free of risky emojis");
const css = read("assets/css/style.css");
ok(/\.svc-tabs \.svc-ico \{[^}]*width: 13px/.test(css), "style.css styles .svc-ico (13px)");

// ---- 3. Safe replacements landed ----
const gmap = read("pages/guide-map.html");
ok(gmap.includes('icon:"\u{1F4F7}"') && gmap.includes('name:"X-Ray"'), "guide-map X-Ray room icon → \u{1F4F7}");
ok(gmap.includes('icon:"\u{2695}\u{FE0F}"'), "guide-map consultation rooms → medical symbol");
ok(gmap.includes('icon:"\u{1F4BA}"'), "guide-map lobby/waiting → seat icon");
ok(gmap.includes('icon:"\u{1F48A}"'), "guide-map treatment room → pill icon");
ok(gmap.includes('icon:"\u{1F4A7}"'), "guide-map dialysis → droplet icon");
const pd = read("pages/patient-detail.html");
ok(pd.includes("Blood Pressure") && pd.includes("\u{2764}\u{FE0F} Blood Pressure") === false ? pd.includes("\u{2764}\u{FE0F}") : true, "patient-detail vitals use safe glyphs");
ok(pd.includes("\u{1F4A8} Resp. Rate"), "patient-detail resp-rate → wind glyph");

// ---- 4. data.js seed + migration ----
const data = read("assets/js/data.js");
ok(data.includes('icon: "\u{2695}\u{FE0F}"'), "clinic seed c1 icon → medical symbol");
ok(data.includes("ICON_FIX"), "migration defines ICON_FIX map");
const fixLine = data.split("\n").find((l) => l.includes("ICON_FIX = {")) || "";
ok(fixLine.includes("{1FA7A}") && fixLine.includes("u2695") && fixLine.includes("uFE0F"), "ICON_FIX maps stethoscope → medical symbol");
ok(data.includes('if (ICON_FIX[c.icon])'), "migration applies ICON_FIX to stored clinics");

// ---- 5. data.js still parses ----
try {
  new Function(data);
  ok(true, "data.js parses as a function body");
} catch (e) {
  ok(false, "data.js parses — " + e.message);
}

console.log("");
console.log(fail === 0 ? `ALL ICON CHECKS PASSED (${pass})` : `${fail} FAILED / ${pass + fail} total`);
process.exit(fail ? 1 : 0);
