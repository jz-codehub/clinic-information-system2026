/* ============================================================
   Rever Medical Center — Data Layer
   Mock data + localStorage persistence.
   NOTE: Designed to be swapped for Supabase later.
   All DB reads/writes go through the `DB` object below.
   ============================================================ */

const DB_KEYS = {
  clinics: "rmc_clinics",
  users: "rmc_users",
  patients: "rmc_patients",
  session: "rmc_session",
};

/* Bump when seed data changes and a full demo-data refresh is intended. */
const DATA_VERSION = "v3";

/* Patient workflow statuses */
const STATUS = {
  TRANSFERRED: "transferred",   // regular user sent data to clinic, waiting for secretary
  WITH_SECRETARY: "with_secretary", // secretary is doing intake/vitals
  WAITING_DOCTOR: "waiting_doctor", // vitals done, sent to doctor
  COMPLETED: "completed",       // doctor finished consultation
};

const STATUS_META = {
  transferred: { label: "Awaiting Intake", badge: "badge-info" },
  with_secretary: { label: "Intake in Progress", badge: "badge-warning" },
  waiting_doctor: { label: "Waiting for Doctor", badge: "badge-purple" },
  completed: { label: "Completed", badge: "badge-success" },
};

/* ------------------------- DEMO PATIENTS (for presentation) -------------------------
   Five pre-filled patient templates so the presenter can register a different
   patient in seconds, one after another, for a back-to-back demo. The fields
   below match the registration form input ids (see pages/register-patient.html). */
const DEMO_PATIENTS = [
  {
    label: "Demo 1 — Juan Dela Cruz (Fever / Cough)",
    firstName: "Juan", lastName: "Dela Cruz", middleName: "Reyes",
    gender: "Male", birthdate: "1985-03-15", contact: "0917-123-4567", email: "juan.delacruz@example.com",
    address: "123 Mabini St., Brgy. Poblacion, Manila",
    employed: "yes", hmo: "no", philhealth: "yes", yakap: "no",
    complaint: "Fever and cough for 3 days", fee: "500",
    clinicId: "c1",
    birthplace: "Manila", nationality: "Filipino", religion: "Roman Catholic",
    maritalStatus: "Single", occupation: "Call Center Agent", companyName: "TeleTech",
    fathersName: "Jose Dela Cruz", spousesName: "", mothersName: "Maria Dela Cruz",
    mothersCellphone: "0917-987-6543", mothersAge: "55",
    emergencyName: "Ana Dela Cruz", emergencyRelationship: "Sister",
    emergencyAddress: "123 Mabini St., Brgy. Poblacion, Manila",
    emergencyContact: "0917-111-2222",
    allergyStatus: "none", allergies: "", currentMedications: "Paracetamol 500mg PRN",
  },
  {
    label: "Demo 2 — Maria Santos (Hypertension Checkup)",
    firstName: "Maria", lastName: "Santos", middleName: "Lim",
    gender: "Female", birthdate: "1970-07-22", contact: "0918-222-3333", email: "maria.santos@example.com",
    address: "456 Quezon Ave., Brgy. Central, Quezon City",
    employed: "no", hmo: "yes", philhealth: "yes", yakap: "yes",
    complaint: "Routine hypertension maintenance checkup", fee: "500",
    clinicId: "c2",
    birthplace: "Quezon City", nationality: "Filipino", religion: "Roman Catholic",
    maritalStatus: "Married", occupation: "Retired", companyName: "",
    fathersName: "Pedro Santos", spousesName: "Roberto Reyes", mothersName: "Carmen Lim",
    mothersCellphone: "0918-333-4444", mothersAge: "82",
    emergencyName: "Roberto Reyes", emergencyRelationship: "Husband",
    emergencyAddress: "456 Quezon Ave., Brgy. Central, Quezon City",
    emergencyContact: "0918-555-6666",
    allergyStatus: "known", allergies: "Penicillin", currentMedications: "Losartan 50mg OD, Amlodipine 5mg OD",
  },
  {
    label: "Demo 3 — Ana Reyes (Prenatal Visit)",
    firstName: "Ana", lastName: "Reyes", middleName: "Cruz",
    gender: "Female", birthdate: "1992-11-10", contact: "0919-333-4444", email: "ana.reyes@example.com",
    address: "789 Rizal St., Brgy. San Antonio, Makati",
    employed: "yes", hmo: "yes", philhealth: "yes", yakap: "no",
    complaint: "Second trimester prenatal visit", fee: "500",
    clinicId: "c6",
    birthplace: "Makati", nationality: "Filipino", religion: "Iglesia ni Cristo",
    maritalStatus: "Married", occupation: "Teacher", companyName: "San Antonio Elementary School",
    fathersName: "Luis Reyes", spousesName: "Mark Villanueva", mothersName: "Elena Cruz",
    mothersCellphone: "0919-444-5555", mothersAge: "58",
    emergencyName: "Mark Villanueva", emergencyRelationship: "Husband",
    emergencyAddress: "789 Rizal St., Brgy. San Antonio, Makati",
    emergencyContact: "0919-666-7777",
    allergyStatus: "none", allergies: "", currentMedications: "Prenatal vitamins OD",
  },
  {
    label: "Demo 4 — Carlos Mendoza (Chest Pain)",
    firstName: "Carlos", lastName: "Mendoza", middleName: "Villanueva",
    gender: "Male", birthdate: "1968-01-30", contact: "0920-444-5555", email: "carlos.mendoza@example.com",
    address: "101 Mendiola St., Brgy. Santa Cruz, Manila",
    employed: "yes", hmo: "yes", philhealth: "yes", yakap: "yes",
    complaint: "Occasional chest pain on exertion", fee: "700",
    clinicId: "c7",
    birthplace: "Manila", nationality: "Filipino", religion: "Roman Catholic",
    maritalStatus: "Married", occupation: "Construction Foreman", companyName: "BuildWell Corp.",
    fathersName: "Felipe Mendoza", spousesName: "Liza Mendoza", mothersName: "Teresa Villanueva",
    mothersCellphone: "0920-555-6666", mothersAge: "74",
    emergencyName: "Liza Mendoza", emergencyRelationship: "Wife",
    emergencyAddress: "101 Mendiola St., Brgy. Santa Cruz, Manila",
    emergencyContact: "0920-777-8888",
    allergyStatus: "known", allergies: "Aspirin", currentMedications: "Atorvastatin 20mg HS",
  },
  {
    label: "Demo 5 — Leah Garcia (Asthma)",
    firstName: "Leah", lastName: "Garcia", middleName: "Bautista",
    gender: "Female", birthdate: "1995-05-18", contact: "0921-555-6666", email: "leah.garcia@example.com",
    address: "202 Taft Ave., Brgy. Malate, Manila",
    employed: "yes", hmo: "no", philhealth: "yes", yakap: "no",
    complaint: "Wheezing and shortness of breath", fee: "500",
    clinicId: "c3",
    birthplace: "Manila", nationality: "Filipino", religion: "Roman Catholic",
    maritalStatus: "Single", occupation: "Graphic Designer", companyName: "Freelance",
    fathersName: "Ramon Garcia", spousesName: "", mothersName: "Celia Bautista",
    mothersCellphone: "0921-666-7777", mothersAge: "51",
    emergencyName: "Celia Bautista", emergencyRelationship: "Mother",
    emergencyAddress: "202 Taft Ave., Brgy. Malate, Manila",
    emergencyContact: "0921-888-9999",
    allergyStatus: "none", allergies: "", currentMedications: "Salbutamol inhaler PRN",
  },
];

/* ------------------------- CLINIC ROOMS -------------------------
   Rever Medical Center, Inc. is ONE hospital. Each doctor's clinic is
   a ROOM identified by its room number — not a separate branch.
   Room numbers below are editable seed defaults; replace them with the
   hospital's real room numbers via the Clinics management page. */
const CLINIC_ROOMS = {
  c1: { room: "101", head: "Dr. Maria Santos", specialty: "Internal Medicine" },
  c2: { room: "102", head: "Dr. Donna Bella Z. Davis", specialty: "Family Medicine" },
  c3: { room: "103", head: "Dr. Nathalie Mundo", specialty: "ENT" },
  c4: { room: "104", head: "Dr. Joanne Concepcion", specialty: "Ophthalmology" },
  c5: { room: "106", head: "Dr. Regine A. Dollaga", specialty: "Pediatrics" },
  c6: { room: "108", head: "Dr. Georgina Gladdlys B. Labis-Tamsi", specialty: "OB-Gynecology" },
  c7: { room: "109", head: "Dr. Richard Dl. Quing", specialty: "Surgery – General Surgeon" },
  c8: { room: "110", head: "Dr. Anna Janine B. Gamulo", specialty: "Pediatrics" },
  c9: { room: "111", head: "Dr. Abegail Carmie L. Taruc", specialty: "Internal Medicine" },
  c10: { room: "MEDICAL DIRECTOR", head: "Dr. Elaine G. Flores", specialty: "ENT" },
};

/* ------------------------- SEED DATA ------------------------- */
function seedData() {
  const hospitalPhone = "(02) 8123-4567";
  const clinics = [
    { id: "c1", name: "Clinic Room 101", room: "101", head: "Dr. Maria Santos", specialty: "Internal Medicine", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "🏥", color: "#0B5E9C" },
    { id: "c2", name: "Clinic Room 102", room: "102", head: "Dr. Donna Bella Z. Davis", specialty: "Family Medicine", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "⚕️", color: "#0B5E9C" },
    { id: "c3", name: "Clinic Room 103", room: "103", head: "Dr. Nathalie Mundo", specialty: "ENT", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "👂", color: "#7c3aed" },
    { id: "c4", name: "Clinic Room 104", room: "104", head: "Dr. Joanne Concepcion", specialty: "Ophthalmology", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "👁️", color: "#0284c7" },
    { id: "c5", name: "Clinic Room 106", room: "106", head: "Dr. Regine A. Dollaga", specialty: "Pediatrics", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "🧒", color: "#0284c7" },
    { id: "c6", name: "Clinic Room 108", room: "108", head: "Dr. Georgina Gladdlys B. Labis-Tamsi", specialty: "OB-Gynecology", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "🤰", color: "#4f46e5" },
    { id: "c7", name: "Clinic Room 109", room: "109", head: "Dr. Richard Dl. Quing", specialty: "Surgery – General Surgeon", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "🔪", color: "#b91c1c" },
    { id: "c8", name: "Clinic Room 110", room: "110", head: "Dr. Anna Janine B. Gamulo", specialty: "Pediatrics", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "🧒", color: "#0284c7" },
    { id: "c9", name: "Clinic Room 111", room: "111", head: "Dr. Abegail Carmie L. Taruc", specialty: "Internal Medicine", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "🏥", color: "#0B5E9C" },
    { id: "c10", name: "Medical Director's Office", room: "MEDICAL DIRECTOR", head: "Dr. Elaine G. Flores", specialty: "ENT", address: "Rever Medical Center, Inc.", phone: hospitalPhone, icon: "👔", color: "#7c3aed" },
  ];

  const users = [
    { id: "u0", name: "Rever Admin", email: "superadmin@rever.ph", password: "admin123", role: "superadmin", clinicId: null, phone: "0900-000-0001" },
    { id: "u1", name: "Juan Dela Cruz", email: "regular@rever.ph", password: "user123", role: "regular", clinicId: null, phone: "0917-000-0001" },
    { id: "u2", name: "Lisa Gomez", email: "secretary@rever.ph", password: "sec123", role: "secretary", clinicId: "c1", phone: "0918-000-0002", specialty: "Internal Medicine" },
    { id: "u3", name: "Dr. Maria Santos", email: "doctor@rever.ph", password: "doc123", role: "doctor", clinicId: "c1", phone: "0919-000-0003" },
    /* ---------- Secretaries (from updated doctor roster) ---------- */
    { id: "u4", name: "Mary Grace Lucagbo", email: "marygrace.lucagbo@rever.ph", password: "sec123", role: "secretary", clinicId: "c2", phone: "09361768349", specialty: "Family Medicine" },
    { id: "u5", name: "Catherine Capilador", email: "catherine.capilador@rever.ph", password: "sec123", role: "secretary", clinicId: "c4", phone: "09173099534", specialty: "Family Medicine" },
    { id: "u6", name: "Joan Marie Dabin", email: "joanmarie.dabin@rever.ph", password: "sec123", role: "secretary", clinicId: "c9", phone: "09052045311", specialty: "Internal Medicine" },
    { id: "u7", name: "Emelou A. Lerio", email: "emelou.lerio@rever.ph", password: "sec123", role: "secretary", clinicId: "c1", phone: "09754062009", specialty: "OB-Gynecology" },
    { id: "u8", name: "Pamela Cunado", email: "pamela.cunado@rever.ph", password: "sec123", role: "secretary", clinicId: "c6", phone: "09679123826", specialty: "OB-Gynecology" },
    { id: "u9", name: "Yhemlee Icat", email: "yhemlee.icat@rever.ph", password: "sec123", role: "secretary", clinicId: "c5", phone: "09555468455", specialty: "Pediatrics" },
    { id: "u10", name: "Angelica Gales", email: "angelica.gales@rever.ph", password: "sec123", role: "secretary", clinicId: "c5", phone: "09364572785", specialty: "Pediatrics" },
    { id: "u11", name: "Noraimah Dimakuta", email: "noraimah.dimakuta@rever.ph", password: "sec123", role: "secretary", clinicId: null, phone: "09350724361", specialty: "Ophthalmology" },
    { id: "u12", name: "Tara Faye Virtudazo", email: "tarafaye.virtudazo@rever.ph", password: "sec123", role: "secretary", clinicId: "c3", phone: "09166561411", specialty: "ENT" },
    { id: "u13", name: "Rela Mae Neri", email: "rela.mae.neri@rever.ph", password: "sec123", role: "secretary", clinicId: "c3", phone: "09762104860", specialty: "ENT" },
    { id: "u14", name: "Janine Dael", email: "janine.dael@rever.ph", password: "sec123", role: "secretary", clinicId: "c7", phone: "09669548099", specialty: "Surgery – General Surgeon" },
    /* ---------- Doctors (from updated doctor roster) ---------- */
    { id: "u15", name: "Dr. Ruel B. Atun", email: "ruel.atun@rever.ph", password: "doc123", role: "doctor", clinicId: "c4", phone: "09361768349" },
    { id: "u16", name: "Dr. Donna Bella Z. Davis", email: "donnabella.davis@rever.ph", password: "doc123", role: "doctor", clinicId: "c2", phone: "09361768349" },
    { id: "u17", name: "Dr. Vivian S. Adique", email: "vivian.adique@rever.ph", password: "doc123", role: "doctor", clinicId: "c4", phone: "09173099534" },
    { id: "u18", name: "Dr. Abegail Carmie L. Taruc", email: "abegail.taruc@rever.ph", password: "doc123", role: "doctor", clinicId: "c9", phone: "09052045311" },
    { id: "u19", name: "Dr. Ronald Carlos L. Amantiad", email: "ronald.amantiad@rever.ph", password: "doc123", role: "doctor", clinicId: "c9", phone: "09052045311" },
    { id: "u20", name: "Dr. John Noriel P. Lamique", email: "johnnoriel.lamique@rever.ph", password: "doc123", role: "doctor", clinicId: "c9", phone: "09052045311" },
    { id: "u21", name: "Dr. Hakan Anthony Oztemiz", email: "hakan.oztemiz@rever.ph", password: "doc123", role: "doctor", clinicId: "c9", phone: "09052045311" },
    { id: "u22", name: "Dr. Zhy Andrea G. Murillo", email: "zhy.murillo@rever.ph", password: "doc123", role: "doctor", clinicId: "c9", phone: "09052045311" },
    { id: "u23", name: "Dr. Aprille Joy M. Balano", email: "aprille.balano@rever.ph", password: "doc123", role: "doctor", clinicId: "c1", phone: "09754062009" },
    { id: "u24", name: "Dr. Georgina Gladdlys B. Labis-Tamsi", email: "georgina.labis-tamsi@rever.ph", password: "doc123", role: "doctor", clinicId: "c6", phone: "09679123826" },
    { id: "u25", name: "Dr. Joanne R. Boloncio", email: "joanne.boloncio@rever.ph", password: "doc123", role: "doctor", clinicId: "c6", phone: "09679123826" },
    { id: "u26", name: "Dr. Regine A. Dollaga", email: "regine.dollaga@rever.ph", password: "doc123", role: "doctor", clinicId: "c5", phone: "09555468455" },
    { id: "u27", name: "Dr. Geenen T. Macadaeg", email: "geenen.macadaeg@rever.ph", password: "doc123", role: "doctor", clinicId: null, phone: "09364572785" },
    { id: "u28", name: "Dr. Rona O. Ortenio", email: "rona.ortenio@rever.ph", password: "doc123", role: "doctor", clinicId: null, phone: "09364572785" },
    { id: "u29", name: "Dr. Anna Janine B. Gamulo", email: "annajanine.gamulo@rever.ph", password: "doc123", role: "doctor", clinicId: "c8", phone: "09364572785" },
    { id: "u30", name: "Dr. Ron Joseph Moreno", email: "ronjoseph.moreno@rever.ph", password: "doc123", role: "doctor", clinicId: null, phone: "09350724361" },
    { id: "u31", name: "Dr. Stricklyn Paasa", email: "stricklyn.paasa@rever.ph", password: "doc123", role: "doctor", clinicId: null, phone: "09350724361" },
    { id: "u32", name: "Dr. Joanne Concepcion", email: "joanne.concepcion@rever.ph", password: "doc123", role: "doctor", clinicId: null, phone: "09350724361" },
    { id: "u33", name: "Dr. Marlene R. Sinadjan", email: "marlene.sinadjan@rever.ph", password: "doc123", role: "doctor", clinicId: null, phone: "09350724361" },
    { id: "u34", name: "Dr. Nathalie Mundo", email: "nathalie.mundo@rever.ph", password: "doc123", role: "doctor", clinicId: "c3", phone: "09166561411" },
    { id: "u35", name: "Dr. Wilhelma M. Villan", email: "wilhema.villan@rever.ph", password: "doc123", role: "doctor", clinicId: "c3", phone: "09166561411" },
    { id: "u36", name: "Dr. Larson E. Taruc", email: "larson.taruc@rever.ph", password: "doc123", role: "doctor", clinicId: "c3", phone: "09166561411" },
    { id: "u37", name: "Dr. Ellaine Chezy Flores", email: "ellaine.flores@rever.ph", password: "doc123", role: "doctor", clinicId: "c10", phone: "09166561411" },
    { id: "u38", name: "Dr. Jesus Resurrection M. Jardin", email: "jesus.jardin@rever.ph", password: "doc123", role: "doctor", clinicId: "c10", phone: "09166561411" },
    { id: "u39", name: "Dr. Samsida Abaton", email: "samsida.abaton@rever.ph", password: "doc123", role: "doctor", clinicId: "c3", phone: "09762104860" },
    { id: "u40", name: "Dr. Richard Dl. Quing", email: "richard.quing@rever.ph", password: "doc123", role: "doctor", clinicId: "c7", phone: "09669548099" },
    { id: "u41", name: "Dr. Edgar Shaun W. Rey Inres", email: "edgar.reyinres@rever.ph", password: "doc123", role: "doctor", clinicId: "c7", phone: "09669548099" },
    { id: "u42", name: "Dr. Jobert Dale Chan", email: "jobert.chan@rever.ph", password: "doc123", role: "doctor", clinicId: "c7", phone: "09669548099" },
    { id: "u43", name: "Dr. John Kenneth Zaragoza", email: "johnkenneth.zaragoza@rever.ph", password: "doc123", role: "doctor", clinicId: "c7", phone: "09669548099" },
    { id: "u44", name: "Dr. Adrian Patrick P. Gomez", email: "adrian.gomez@rever.ph", password: "doc123", role: "doctor", clinicId: "c7", phone: "09669548099" },
  ];

  const today = new Date();
  const iso = (d) => d.toISOString();
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };

  const patients = [
    {
      id: "P-1001", fullName: "Mario Bautista", age: 54, gender: "Male",
      contact: "0917-555-1001", address: "Sampaloc, Manila", birthdate: "1971-03-12",
      employed: true, hmo: true, philhealth: true, yakap: false,
      clinicId: "c1", status: "completed", registeredBy: "u1", registeredAt: daysAgo(0),
      assignedDoctor: "u3", assignedSecretary: "u2",
      vitals: { bp: "130/85", temp: "37.2", hr: "78", rr: "18", weight: "72", height: "170", spo2: "97" },
      consultation: {
        symptoms: "Frequent headaches and dizziness for the past week.",
        diagnosis: "Hypertension stage 1",
        treatment: "Low-salt diet, regular exercise, monitor BP daily.",
        prescription: "Amlodipine 5mg once daily",
        notes: "Advised to return after 2 weeks for follow-up.",
        doctor: "Dr. Maria Santos", date: daysAgo(0),
      },
      fee: 500,
    },
    {
      id: "P-1002", fullName: "Anna Villanueva", age: 29, gender: "Female",
      contact: "0918-555-1002", address: "Diliman, QC", birthdate: "1996-07-21",
      employed: true, hmo: false, philhealth: true, yakap: true,
      clinicId: "c1", status: "waiting_doctor", registeredBy: "u1", registeredAt: daysAgo(0),
      assignedDoctor: "u3", assignedSecretary: "u2",
      vitals: { bp: "110/70", temp: "36.8", hr: "82", rr: "16", weight: "55", height: "160", spo2: "99" },
      consultation: null, fee: 350,
    },
    {
      id: "P-1003", fullName: "Roberto Sy", age: 63, gender: "Male",
      contact: "0920-555-1003", address: "Binondo, Manila", birthdate: "1962-01-05",
      employed: false, hmo: true, philhealth: true, yakap: true,
      clinicId: "c1", status: "transferred", registeredBy: "u1", registeredAt: daysAgo(0),
      assignedDoctor: "u3", assignedSecretary: "u2",
      vitals: null, consultation: null, fee: 400,
    },
    {
      id: "P-1004", fullName: "Grace Mendoza", age: 34, gender: "Female",
      contact: "0921-555-1004", address: "Legazpi, Makati", birthdate: "1991-11-30",
      employed: true, hmo: true, philhealth: false, yakap: false,
      clinicId: "c2", status: "completed", registeredBy: "u1", registeredAt: daysAgo(1),
      assignedDoctor: "u16", assignedSecretary: "u4",
      vitals: { bp: "118/76", temp: "36.9", hr: "70", rr: "17", weight: "60", height: "158", spo2: "98" },
      consultation: {
        symptoms: "Sore throat and mild fever.",
        diagnosis: "Acute pharyngitis",
        treatment: "Rest, hydration, warm salt-water gargle.",
        prescription: "Paracetamol 500mg as needed; lozenges",
        notes: "No antibiotics needed.",
        doctor: "Dr. Donna Bella Z. Davis", date: daysAgo(1),
      },
      fee: 500,
    },
    {
      id: "P-1005", fullName: "Danny Torres", age: 41, gender: "Male",
      contact: "0922-555-1005", address: "Fairview, QC", birthdate: "1984-05-18",
      employed: false, hmo: false, philhealth: true, yakap: true,
      clinicId: "c2", status: "waiting_doctor", registeredBy: "u1", registeredAt: daysAgo(1),
      assignedDoctor: "u16", assignedSecretary: "u4",
      vitals: { bp: "125/80", temp: "37.5", hr: "88", rr: "20", weight: "68", height: "172", spo2: "97" },
      consultation: null, fee: 450,
    },
  ];

  store(DB_KEYS.clinics, clinics);
  store(DB_KEYS.users, users);
  store(DB_KEYS.patients, patients);
}

/* ------------------------- HELPERS ------------------------- */
function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Storage error", e); }
}
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

/* One-time reframe of legacy multi-branch clinic data into clinic rooms.
   Additive + non-destructive: only sets room/head/specialty and relabels the
   known demo rooms; patient/user clinicId references are left untouched. */
function migrateClinicRooms() {
  const list = read(DB_KEYS.clinics, []);
  if (!Array.isArray(list) || !list.length) return;
  let changed = false;
  // Emoji-14+ glyphs (U+1FA78..U+1FA7B etc.) render BLANK on Windows 10 /
  // older emoji fonts — normalize any stored copies to glyphs that exist everywhere.
  const ICON_FIX = { "\u{1FA78}": "\u{1F4A7}", "\u{1FA79}": "\u{1F48A}", "\u{1FA7A}": "\u2695\uFE0F", "\u{1FA7B}": "\u{1F4F7}", "\u{1FA91}": "\u{1F4BA}", "\u{1FAC1}": "\u{1F4A8}" };
  list.forEach((c) => {
    if (ICON_FIX[c.icon]) { c.icon = ICON_FIX[c.icon]; changed = true; }
    const ref = CLINIC_ROOMS[c.id];
    if (ref && !c.room) {
      c.room = ref.room;
      c.name = "Clinic Room " + ref.room;
      c.head = ref.head;
      c.specialty = ref.specialty;
      c.address = "Rever Medical Center, Inc.";
      changed = true;
    }
  });
  if (changed) store(DB_KEYS.clinics, list);
}

/* Clear staff assignments that no longer match a patient's clinic.
   This keeps old browser-stored demo records from getting stuck in another
   clinic's queue after staff or clinic assignments change. */
function migratePatientAssignments() {
  const patients = read(DB_KEYS.patients, []);
  const users = read(DB_KEYS.users, []);
  if (!Array.isArray(patients) || !Array.isArray(users)) return;
  let changed = false;
  patients.forEach((patient) => {
    const doctor = users.find((user) => user.id === patient.assignedDoctor);
    if (patient.assignedDoctor && (!doctor || doctor.role !== "doctor" || doctor.clinicId !== patient.clinicId)) {
      delete patient.assignedDoctor;
      changed = true;
    }
    const secretary = users.find((user) => user.id === patient.assignedSecretary);
    if (patient.assignedSecretary && (!secretary || secretary.role !== "secretary" || secretary.clinicId !== patient.clinicId)) {
      delete patient.assignedSecretary;
      changed = true;
    }
  });
  if (changed) store(DB_KEYS.patients, patients);
}

/* ------------------------- DB API ------------------------- */
const DB = {
  init() {
    const storedVersion = localStorage.getItem("rmc_data_version");
    if (!localStorage.getItem(DB_KEYS.clinics) || storedVersion !== DATA_VERSION) {
      seedData();
      localStorage.setItem("rmc_data_version", DATA_VERSION);
    }
    migrateClinicRooms();
    migratePatientAssignments();
  },
  reset() { localStorage.clear(); seedData(); },

  clinics: {
    all() { return read(DB_KEYS.clinics, []); },
    save(clinic) {
      const list = this.all();
      const idx = list.findIndex((c) => c.id === clinic.id);
      if (idx >= 0) list[idx] = clinic; else list.push(clinic);
      store(DB_KEYS.clinics, list);
    },
    nextId() {
      const max = this.all().reduce((value, c) => {
        const n = parseInt(String(c.id).replace(/\D/g, ""), 10);
        return !isNaN(n) && n > value ? n : value;
      }, 0);
      return "c" + (max + 1);
    },
    find(id) { return this.all().find((c) => c.id === id); },
    name(id) { const c = this.find(id); return c ? c.name : "—"; },
    // "Clinic Room 101" when a room number is known, else the stored name.
    label(id) { const c = this.find(id); if (!c) return "—"; return c.room ? ("Clinic Room " + c.room) : c.name; },
    // Just the room number (e.g. "101") for compact table cells; else the name.
    roomNo(id) { const c = this.find(id); if (!c) return "—"; return c.room ? c.room : c.name; },
    head(id) { const c = this.find(id); return c && c.head ? c.head : "—"; },
    specialty(id) { const c = this.find(id); return c && c.specialty ? c.specialty : "—"; },
    phone(id) { const c = this.find(id); return c && c.phone ? c.phone : ""; },
  },
  users: {
    all() { return read(DB_KEYS.users, []); },
    save(user) {
      const list = this.all();
      const idx = list.findIndex((u) => u.id === user.id);
      if (idx >= 0) list[idx] = user; else list.push(user);
      store(DB_KEYS.users, list);
    },
    nextId() {
      const max = this.all().reduce((value, u) => {
        const n = parseInt(String(u.id).replace(/\D/g, ""), 10);
        return !isNaN(n) && n > value ? n : value;
      }, 0);
      return "u" + (max + 1);
    },
    find(id) { return this.all().find((u) => u.id === id); },
    name(id) { const u = this.find(id); return u ? u.name : "—"; },
    byRole(role) { return this.all().filter((u) => u.role === role); },
  },
  patients: {
    all() { return read(DB_KEYS.patients, []); },
    find(id) { return this.all().find((p) => p.id === id); },
    save(patient) {
      const list = this.all();
      const idx = list.findIndex((p) => p.id === patient.id);
      if (idx >= 0) list[idx] = patient; else list.push(patient);
      store(DB_KEYS.patients, list);
    },
    nextId() {
      const list = this.all();
      let max = 1000;
      list.forEach((p) => { const n = parseInt(String(p.id).replace(/\D/g, ""), 10); if (!isNaN(n) && n > max) max = n; });
      return "P-" + (max + 1);
    },
    nextQueueNumber(clinicId, date) {
      return this.all()
        .filter((p) => p.clinicId === clinicId && p.registeredAt && p.registeredAt.slice(0, 10) === date)
        .reduce((max, p) => Math.max(max, Number(p.queueNumber) || 0), 0) + 1;
    },
    byClinic(clinicId) { return this.all().filter((p) => p.clinicId === clinicId); },
    byStatus(status) { return this.all().filter((p) => p.status === status); },
    /* Wipe every patient record — used to start a fresh demo presentation. */
    clearAll() { store(DB_KEYS.patients, []); },
  },

  /* ------------------ Session ------------------ */
  session() { return read(DB_KEYS.session, null); },
  login(email, password) {
    const user = this.users.all().find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
    if (!user) return null;
    const session = { userId: user.id, role: user.role, name: user.name, email: user.email, clinicId: user.clinicId, loginAt: new Date().toISOString() };
    store(DB_KEYS.session, session);
    return session;
  },
  logout() { localStorage.removeItem(DB_KEYS.session); },
  currentUser() {
    const s = this.session();
    if (!s) return null;
    return this.users.find(s.userId) || null;
  },
};

/* ------------------------- FORMATTERS ------------------------- */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }) + ", " +
    d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}
function fmtMoney(n) {
  return "₱" + Number(n || 0).toLocaleString("en-PH");
}
function initials(name) {
  return String(name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
function todayKey() { return new Date().toISOString().slice(0, 10); }
function ageFromBirthdate(bd) {
  if (!bd) return "—";
  const b = new Date(bd);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
