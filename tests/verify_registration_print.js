const fs = require("fs");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");
const appSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "app.js"), "utf8");
const pageSrc = fs.readFileSync(path.join(projectRoot, "pages", "register-patient.html"), "utf8");

let fail = 0;
function ok(condition, message) {
  if (condition) console.log("PASS " + message);
  else { console.log("FAIL " + message); fail++; }
}

ok(/@page registration\s*{\s*size:\s*auto;\s*margin:\s*10mm;\s*}/.test(css),
  "registration print honors the paper size selected in the print dialog");
ok(/const fitRegistration = area\.querySelector \? area\.querySelector\("\.registration-print"\)/.test(appSrc)
  && /const fitRegistrationFrame = area\.querySelector \? area\.querySelector\("\.registration-print-frame"\)/.test(appSrc)
  && /area\.classList\.add\("print-fit-registration"\)/.test(appSrc),
  "registration print uses its dedicated one-page layout");
ok(/class="registration-print-frame"[\s\S]*?class="ab-sheet registration-print"/.test(pageSrc),
  "registration form is wrapped in a one-page print frame");
ok(/#printArea\.print-fit-registration \.registration-print-frame\s*{[^}]*width:\s*100%;[^}]*height:\s*250mm;[^}]*page-break-inside:\s*avoid;/s.test(css)
  && /#printArea\.print-fit-registration \.registration-print-frame\s*{\s*height:\s*100%;\s*min-height:\s*250mm;/.test(css),
  "frame fills the selected paper height while supporting A4 and bond sizes");
ok(/#printArea\.print-fit-registration \.registration-print\s*{[^}]*transform:\s*scale\(var\(--registration-print-scale,\s*1\)\);[^}]*transform-origin:\s*top left;/s.test(css)
  && /const usableWidth = 185 \* \(96 \/ 25\.4\);[\s\S]*?const usableHeight = 250 \* \(96 \/ 25\.4\);[\s\S]*?Math\.min\(1,\s*scaleW,\s*scaleH\)/.test(appSrc)
  && /area\.style\.setProperty\("--registration-print-scale", String\(scale\)\)/.test(appSrc),
  "registration is measured and scaled to stay on a single page");
ok(/#printArea\.print-fit-registration \.registration-print \.ab-info-grid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(css)
  && /#printArea\.print-fit-registration \.registration-print \.ab-info-grid\s*{[^}]*grid-template-rows:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\);/.test(css)
  && /#printArea\.print-fit-registration \.registration-print \.registration-print-section\s*{[^}]*flex:\s*7 1 0;/.test(css)
  && /registration-print-section:nth-of-type\(2\) \.ab-info-grid,[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/.test(css)
  && /#printArea\.print-fit-registration \.registration-print \.ab-info-pair span\s*{[^}]*font-size:\s*8\.5px;/.test(css)
  && /#printArea\.print-fit-registration \.registration-print \.ab-info-pair strong\s*{[^}]*font-size:\s*10px;/.test(css),
  "patient fields expand evenly to use the full page while preserving readable text");
ok(!/file:\/\/\/C:\/Users\/USER\/Documents\/Web Development\/clinic-information-system2026\/pages\/register-patient\.html/.test(pageSrc),
  "local register page URL is not embedded in the registration sheet");

if (fail === 0) console.log("\nALL REGISTRATION PRINT CHECKS PASSED");
else console.log("\n" + fail + " CHECK(S) FAILED");
process.exit(fail === 0 ? 0 : 1);
