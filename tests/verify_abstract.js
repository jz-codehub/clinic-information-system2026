/* Verifies the Medical Abstract on the patient detail page:
   - ACCESS: the "Medical Abstract" action button appears only for role=doctor
   - ACCESS: openAbstract()/printAbstract() refuse non-doctors (defense-in-depth)
   - DESIGN: professional letterhead/title/strip/signature/footer (abstract + record)
   Run: node tests/verify_abstract.js  */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const projectRoot = path.resolve(__dirname, "..");

const dataSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "data.js"), "utf8");
const appSrc = fs.readFileSync(path.join(projectRoot, "assets", "js", "app.js"), "utf8");
const pdHtml = fs.readFileSync(path.join(projectRoot, "pages", "patient-detail.html"), "utf8");
const pdSrc = pdHtml.match(/<script>([\s\S]*?)<\/script>/)[1];

function makeEl() {
  const el = { _html: "", classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, toggle(c){this._s.has(c)?this._s.delete(c):this._s.add(c);}, contains(c){return this._s.has(c);} }, style:{}, dataset:{}, value:"", textContent:"", hidden:false, addEventListener(){}, appendChild(){}, setAttribute(){}, getAttribute(){return null;}, querySelectorAll(){return [];}, querySelector(){return null;} };
  Object.defineProperty(el, "innerHTML", { get(){return this._html;}, set(v){this._html = String(v);} });
  return el;
}

function runForRole(role) {
  const backing = {};
  backing["rmc_data_version"] = "v3";
  backing["rmc_clinics"] = JSON.stringify([{ id:"c1", name:"Clinic Room 101", room:"101", head:"Dr. Maria Santos", specialty:"Internal Medicine", color:"#0d9488", icon:"🩺" }]);
  backing["rmc_users"] = JSON.stringify([
    { id:"u0", name:"Rever Admin", role:"superadmin", clinicId:null },
    { id:"u2", name:"Lisa Gomez", role:"secretary", clinicId:"c1" },
    { id:"u3", name:"Dr. Maria Santos", role:"doctor", clinicId:"c1" },
    { id:"u1", name:"Juan Dela Cruz", role:"regular", clinicId:null },
  ]);
  backing["rmc_patients"] = JSON.stringify([{
    id:"P-001", fullName:"Test Patient", status:"waiting_doctor", clinicId:"c1",
    registeredAt:new Date().toISOString(), age:30, gender:"M", registeredBy:"u1",
    vitals:{ bp:"120/80", temp:"37", weight:"70", height:"170" },
    consultation:{ date:new Date().toISOString(), diagnosis:"Checkup", doctor:"Dr. Maria Santos", notes:"OK", fee:500 },
    employed:true, hmo:false, philhealth:true, yakap:false, complaint:"Fever", fee:500,
    contact:"09123456789", address:"Test Street",
    details:{
      lastName:"Patient", firstName:"Test", middleName:"Demo", birthplace:"Manila",
      nationality:"Filipino", religion:"Catholic", maritalStatus:"Single", occupation:"Teacher",
      companyName:"Demo School", fathersName:"Father Patient", spousesName:"Spouse Patient",
      mothersName:"Mother Patient", mothersCellphone:"09987654321", mothersAge:"52"
    },
    emergency:{ name:"Emergency Person", relationship:"Sibling", address:"Emergency Street", contact:"09111111111" },
    medicalAlerts:{ allergyStatus:"known", allergies:"Penicillin", currentMedications:"Vitamin C" },
  }]);
  const me = { superadmin:"u0", secretary:"u2", doctor:"u3", regular:"u1" }[role];
  backing["rmc_session"] = JSON.stringify({ userId: me, role, name: ({u0:"Rever Admin",u2:"Lisa Gomez",u3:"Dr. Maria Santos",u1:"Juan Dela Cruz"})[me], clinicId: role==="doctor"||role==="secretary" ? "c1" : null });

  const body = makeEl();
  const els = { appbarNav: makeEl(), overlayNav: makeEl(), appbarToggle: makeEl(), toastHost: null, abstractBody: makeEl(), abstractModal: makeEl() };
  let toastMsg = "";
  const sandbox = {
    console, Math, JSON, Date, isFinite, Array, Object, Uint8Array, Float64Array, Int32Array, Set, Map,
    URLSearchParams,
    localStorage: { getItem:(k)=>(k in backing?backing[k]:null), setItem:(k,v)=>{backing[k]=String(v);}, removeItem:(k)=>{delete backing[k];}, clear:()=>{} },
    document: { body, getElementById:(id)=>(id in els?els[id]:makeEl()), querySelector:()=>makeEl(), querySelectorAll:()=>[], addEventListener(){}, createElement:()=>makeEl() },
    getComputedStyle: () => ({ position: "relative" }),
    window: { addEventListener(){}, location:{ href:"", replace(){} }, print(){} },
    location: { pathname: "/pages/patient-detail.html", search: "?id=P-001" },
    confirm: ()=>true, alert: ()=>{}, prompt: ()=>null,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataSrc, sandbox, { filename: "data.js" });
  vm.runInContext(appSrc, sandbox, { filename: "app.js" });
  // capture toast text for guard assertions
  vm.runInContext("App.toast = (i,m)=>{ globalThis.__toast = m; };", sandbox);
  vm.runInContext(pdSrc, sandbox, { filename: "patient-detail.js" });
  return { html: body.innerHTML, sandbox };
}

let fail = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { console.log("FAIL " + m); fail++; } };

const doc = runForRole("doctor");
ok(/onclick="openAbstract\(/.test(doc.html), "doctor SEES the Medical Abstract button (trigger)");
ok(/onclick="printRecord\(/.test(doc.html), "doctor SEES the Print Record button (trigger)");
ok(/onclick="printReceta\(/.test(doc.html), "doctor SEES the Receta button (trigger)");

["secretary", "regular", "superadmin"].forEach((r) => {
  const x = runForRole(r);
  ok(!/onclick="openAbstract\(/.test(x.html), `${r} does NOT see the Medical Abstract button`);
  ok(!/onclick="printRecord\(/.test(x.html), `${r} does NOT see the Print Record button`);
  ok(!/onclick="printReceta\(/.test(x.html), `${r} does NOT see the Receta button`);
});

// Defense-in-depth: calling the print fns as a non-doctor is refused
const sec = runForRole("secretary");
sec.sandbox.__toast = "";
vm.runInContext(`openAbstract("P-001"); printRecord("P-001"); printReceta("P-001");`, sec.sandbox);
ok(/doctors only|for doctors only/i.test(sec.sandbox.__toast || ""), "print fns refuse non-doctor (toast shown)");

// --- Build output: full record + receta contain the right content ---
const rec = vm.runInContext(`buildRecord(DB.patients.find("P-001"))`, doc.sandbox);
ok(/COMPLETE PATIENT RECORD/.test(rec), "record sheet titled COMPLETE PATIENT RECORD");
ok(/Vital Signs/.test(rec) && /Consultation/.test(rec) && /Coverage/.test(rec), "record includes vitals, consultation, coverage");
ok(/Test Patient/.test(rec), "record includes the patient name");

const rx = vm.runInContext(`buildReceta(DB.patients.find("P-001"))`, doc.sandbox);
ok(/℞/.test(rx) && /Prescription \(Receta\)/.test(rx), "receta shows the ℞ symbol + Prescription heading");
ok(/Attending Physician/.test(rx), "receta has the doctor signature block");
ok(/Amlodipine|Checkup|Hypertension|Paracetamol/.test(rx) || /—/.test(rx), "receta shows the prescription text (or a dash when empty)");

// ---- Professional document design (abstract + full record) ----
// Letterhead: contact line + boxed date-issued stamp
ok(/class="ab-contact"/.test(doc.html), "letterhead has contact line");
ok(/class="ab-doc"[\s\S]{0,120}?Date Issued/.test(doc.html), "letterhead has boxed Date Issued stamp");
// Certificate-style title bar (both sheets)
ok(/class="ab-titlebar"[\s\S]{0,120}?MEDICAL ABSTRACT/.test(doc.html), "abstract has certificate-style title bar");
ok(/class="ab-titlebar"[\s\S]{0,120}?COMPLETE PATIENT RECORD/.test(rec), "record has certificate-style title bar");
// Patient identity strip with name + id
ok(/class="ab-strip"/.test(doc.html), "abstract has patient identity strip");
ok(/class="s-name".*Test Patient/.test(doc.html), "identity strip shows patient name");
// Numbered section titles
ok(/ab-num".*?>1<\/span>\s*Patient Information/.test(doc.html), "section 1: Patient Information");
ok(/ab-num".*?>2<\/span>\s*Vital Signs/.test(doc.html), "section 2: Vital Signs");
ok(/ab-num".*?>3<\/span>\s*Consultation Summary/.test(doc.html), "section 3: Consultation Summary (abstract)");
ok(/ab-num".*?>5<\/span>\s*Consultation/.test(rec), "section 5: Consultation (record)");
// Vitals chips panel (not free rows)
ok(/class="ab-vitals"/.test(doc.html), "abstract vitals use chips panel");
// Formal labels — no emoji prefixes left in the document sheets (abstract + record)
const abs = vm.runInContext(`buildAbstract(DB.patients.find("P-001"))`, doc.sandbox);
ok(/class="ab-sheet ab-abstract-sheet"/.test(abs), "abstract uses its own layout scope");
ok(/MEDICAL ABSTRACT/.test(abs), "abstract sheet titled MEDICAL ABSTRACT");
ok((abs.match(/class="ab-info-group"/g) || []).length === 9, "patient information remains organized into nine readable groups");
ok(/class="ab-info-group-title">Identity<\/div>/.test(abs) && /class="ab-info-pair"/.test(abs), "patient information uses simple titled rows");
ok(!/class="ab-info-group">\s*<div class="ab-info-group-title">[^<]+<\/div>\s*<\/div>/.test(abs), "patient information groups contain fields without decorative empty panels");
[
  ["Last Name", "Patient"], ["First Name", "Test"], ["Middle Name", "Demo"],
  ["Birthplace", "Manila"], ["Nationality", "Filipino"], ["Religion", "Catholic"],
  ["Marital Status", "Single"], ["Occupation", "Teacher"], ["Company Name", "Demo School"],
  ["Father's Name", "Father Patient"], ["Spouse's Name", "Spouse Patient"],
  ["Mother's Name", "Mother Patient"], ["Mother's Cellphone", "09987654321"], ["Mother's Age", "52"],
  ["Name", "Emergency Person"], ["Relationship", "Sibling"],
  ["Contact Number", "09111111111"], ["Address", "Emergency Street"],
  ["Employed", "Yes"], ["HMO Member", "No"], ["PhilHealth Member", "Yes"], ["YAKAP Member", "No"],
  ["MRN / Patient ID", "P-001"], ["Age / Gender", "30 yrs / M"], ["Birthdate", ""],
  ["Cellphone Number", "09123456789"], ["Complete Address", "Test Street"],
  ["Allergy Status", "Known allergy"], ["Known Allergies", "Penicillin"],
  ["Current Medications", "Vitamin C"], ["Chief Complaint", "Fever"], ["Clinic Room", "Clinic Room 101"],
  ["Registration Date / Time", ""], ["Consultation Fee", "500"],
].forEach(([label, value]) => {
  const labelPresent = new RegExp(`>${label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}<`).test(abs);
  const valuePresent = value ? abs.includes(value) : /Registration Date \/ Time/.test(abs);
  ok(labelPresent && valuePresent, `abstract includes registered field: ${label}`);
});
ok(!/⚕️ Symptoms|🔍 Diagnosis|💊 Treatment|📝 Prescription|🗒️ Notes/.test(abs + rec), "no emoji prefixes in consultation labels");
// Wet-signature blocks: physician + patient
const sigs = (doc.html.match(/class="ab-sign"/g) || []).length;
ok(sigs === 2, "abstract has two signature blocks (physician + patient)");
ok(/class="sig-name"[\s\S]{0,80}?Dr\. Maria Santos/.test(doc.html), "physician signature block shows doctor name");
ok(/class="sig-role"[\s\S]{0,80}?Attending Physician/.test(doc.html), "physician block labeled Attending Physician");
ok(/class="sig-role"[\s\S]{0,80}?Patient/.test(doc.html), "patient signature block labeled Patient");
// Confidentiality footer + document control
ok(/class="ab-conf"[\s\S]{0,160}?Confidential/.test(doc.html), "confidentiality notice present");
ok(/Form RMCI-MA-01/.test(doc.html), "abstract carries form control number");
ok(/Form RMCI-PR-01/.test(rec), "record carries form control number");
// (final summary prints at the very end — fit checks below run first)

/* --- ABSTRACT + RECORD A4 PAGE LAYOUT --- */
(function abstractPrintLayout() {
  const css = fs.readFileSync(path.join(projectRoot, "assets", "css", "style.css"), "utf8");
  const fitPrintStart = css.indexOf("#printArea.print-fit-one-page {");
  const printCss = css.slice(fitPrintStart, css.indexOf("\n}", fitPrintStart) + 2);
  const fitRules = css.slice(css.indexOf("#printArea.print-fit-one-page .ab-sheet"));
  const a4Page = /@page\s*{\s*size:\s*A4 portrait;\s*margin:\s*3mm 4mm;/.test(css);
  const fullPage = /#printArea\.print-fit-one-page\s*{[^}]*width:\s*202mm;[^}]*min-height:\s*291mm;[^}]*overflow:\s*visible/s.test(printCss);
  const readableTwoColumn = /#printArea\.print-fit-one-page \.ab-grid\s*{[^}]*grid-template-columns:\s*1\.1fr \.9fr/s.test(fitRules);
  const abstractSectionsStacked = /\.ab-abstract-sheet \.ab-grid\s*{\s*grid-template-columns:\s*1fr;/.test(css)
    && /#printArea\.print-fit-one-page \.ab-abstract-sheet \.ab-grid\s*{\s*grid-template-columns:\s*1fr;/.test(fitRules);
  const abstractVitalsUseThreeColumns = /\.ab-abstract-sheet \.ab-vitals\s*{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(css)
    && /#printArea\.print-fit-one-page \.ab-abstract-sheet \.ab-vitals\s*{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(fitRules);
  const patientInfoUsesThreeColumns = /\.ab-info-grid\s*{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(css)
    && /#printArea\.print-fit-one-page \.ab-info-grid\s*{\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(fitRules);
  const patientInfoIsPlainAndProfessional = /\.ab-info-group\s*{\s*min-width:\s*0;\s*padding:\s*2px 0;/.test(css)
    && !/\.ab-info-group\s*{[^}]*border:\s*1px solid/.test(css)
    && /\.ab-info-group-title\s*{[^}]*border-bottom:\s*1px solid/.test(css)
    && /\.ab-info-pair\s*{[^}]*border-bottom:\s*1px solid/.test(css);
  const patientInfoTypographyMatches = /\.ab-info-pair span\s*{[^}]*font-size:\s*10\.5px;/.test(css)
    && /\.ab-info-pair strong\s*{[^}]*font-size:\s*12\.5px;/.test(css)
    && /#printArea \.ab-info-pair span\s*{[^}]*font-size:\s*9px;/.test(css)
    && /#printArea \.ab-info-pair strong\s*{[^}]*font-size:\s*10\.5px;/.test(css)
    && /#printArea\.print-fit-one-page \.ab-info-pair span\s*{[^}]*font-size:\s*9px;/.test(fitRules)
    && /#printArea\.print-fit-one-page \.ab-info-pair strong\s*{[^}]*font-size:\s*10\.5px;/.test(fitRules);
  const vitalSignsHaveNoBoxes = /\.ab-vital\s*{[^}]*border:\s*0;[^}]*background:\s*transparent;/.test(css)
    && /#printArea \.ab-vital\s*{[^}]*border:\s*0;[^}]*background:\s*transparent;/.test(css)
    && /#printArea\.print-fit-one-page \.ab-vital\s*{[^}]*border:\s*0;[^}]*background:\s*transparent;/.test(fitRules);
  const verticalFill = /#printArea\.print-fit-one-page \.ab-sheet\s*{[^}]*min-height:\s*291mm;[^}]*padding:/s.test(fitRules)
    && /#printArea\.print-fit-one-page \.ab-grid\s*{[^}]*flex:\s*1 0 auto/s.test(fitRules);
  const noClipOrScale = !/overflow:\s*hidden/.test(printCss)
    && !/#printArea\.print-fit-one-page \.ab-sheet\s*{[^}]*transform:\s*scale/s.test(css)
    && !/contentHeight > 0 \? Math\.min\(1, usableHeight \/ contentHeight\)/.test(appSrc);
  const abstractFitsOnePage = /#printArea\.print-fit-abstract\s*{[^}]*width:\s*202mm;[^}]*height:\s*291mm;[^}]*break-inside:\s*avoid/s.test(css)
    && /#printArea\.print-fit-abstract \.ab-abstract-sheet\s*{[^}]*transform:\s*scale\(var\(--abstract-print-scale,\s*1\)\)/s.test(css)
    && /const fitAbstract = area\.querySelector[\s\S]*?const contentHeight = fitAbstract\.scrollHeight;[\s\S]*?Math\.min\(1,\s*\(usableHeight \/ contentHeight\) \* 0\.98\)[\s\S]*?area\.style\.setProperty\("--abstract-print-scale", String\(scale\)\)/.test(appSrc)
    && !/Math\.max\(0\.75,\s*\(usableHeight \/ contentHeight\)/.test(appSrc);
  const hasSpacer = /class="ab-fill"/.test(pdHtml);
  ok(a4Page, "all print pages are explicitly configured for A4 portrait paper");
  ok(fullPage, "print sheet uses the full printable A4 width and height without clipping");
  ok(readableTwoColumn, "print sections retain a spacious two-column layout");
  ok(abstractSectionsStacked, "abstract patient information and vital signs stack vertically");
  ok(abstractVitalsUseThreeColumns, "abstract vitals print in three columns, creating up to three rows");
  ok(patientInfoUsesThreeColumns, "patient information groups print in three columns across three rows");
  ok(patientInfoIsPlainAndProfessional, "patient information uses clean ruled rows without card boxes");
  ok(patientInfoTypographyMatches, "patient information label and value sizes match the rest of the abstract");
  ok(vitalSignsHaveNoBoxes, "vital signs print without boxes or highlighted backgrounds");
  ok(abstractFitsOnePage, "abstract print fits its content onto one A4 page without affecting full-record flow");
  ok(verticalFill, "sheet and section grid expand to use available page height");
  ok(noClipOrScale, "readable text is not shrunk and long content is not clipped");
  ok(!hasSpacer, "abstract does not use an artificial spacer before signatures");
})();

process.exit(fail === 0 ? 0 : 1);
