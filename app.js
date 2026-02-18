/* CaravanTechniker am Main - app.js
   Stabilná verzia:
   - 1 tlačidlo na jazyk (dropdown)
   - stromy sa ukážu až po výbere kategórie
   - tagy default skryté (UI element existuje, ale nezobrazuje sa)
   - tyrkysové zvýraznenie aktívnych prvkov (kategória, jazyk, strom)
   - disclaimer sa pridá do každého protokolu + PDF
   - pripravené jazyky: DE, SK, EN, IT, FR
   - podporuje tags ako array aj ako object per lang
   - podporuje media odkazy (image/pdf) v nodes/result (pripravené na budúcnosť)
*/

const VERSION = "0.2.0";

/** STORAGE */
const STORAGE_LANG = "ct_lang_v2";
const STORAGE_OVERRIDE = "ct_content_override_v1";
const DEFAULT_CONTENT_URL = "./content.json";

/** UI refs */
const el = {
  subtitle: document.getElementById("subtitle"),
  btnLANG: document.getElementById("btnLANG"),
  btnADMIN: document.getElementById("btnADMIN"),
  btnRESET: document.getElementById("btnRESET"),

  hFaults: document.getElementById("hFaults"),
  hFaultHint: document.getElementById("hFaultHint"),
  howto: document.getElementById("howto"),

  search: document.getElementById("search"),
  catbar: document.getElementById("catbar"),
  list: document.getElementById("list"),
  version: document.getElementById("version"),

  hDiag: document.getElementById("hDiag"),
  hDiagHint: document.getElementById("hDiagHint"),
  qtitle: document.getElementById("qtitle"),
  tagline: document.getElementById("tagline"),

  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  backBtn: document.getElementById("backBtn"),

  hProto: document.getElementById("hProto"),
  proto: document.getElementById("proto"),
  copyBtn: document.getElementById("copyBtn"),
  clearPathBtn: document.getElementById("clearPathBtn"),
  pdfBtn: document.getElementById("pdfBtn"),

  langOverlay: document.getElementById("langOverlay"),
  langRow: document.getElementById("langRow"),
  langTitle: document.getElementById("langTitle"),
};

/** Languages */
const LANGS = ["de", "sk", "en", "it", "fr"];
let LANG = localStorage.getItem(STORAGE_LANG) || "de";
if (!LANGS.includes(LANG)) LANG = "de";

/** Content */
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let path = [];
let activeCategory = null; // null => nič neukazovať
let selectedTreeId = null;

/** I18N UI */
const I18N = {
  de: {
    subtitle: "Wohnmobil Diagnose",
    faults: "Störungen",
    faultsHint: "Wähle zuerst eine Kategorie. Dann eine Störung auswählen.",
    howto: "Wähle eine Störung und dann JA / NEIN klicken.",
    searchPH: "Suche (trittstufe, wasserpumpe, 12V...)",
    diag: "Diagnose",
    diagHint: "Wähle links eine Störung. Dann JA / NEIN klicken.",
    proto: "Protokoll",
    copy: "Kopieren",
    clear: "Pfad löschen",
    pdf: "PDF Download",
    yes: "JA",
    no: "NEIN",
    back: "← SCHRITT ZURÜCK",
    importExportTitle: "ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK: "Import OK",
    importERR: "Import ERROR: JSON ungültig",
    resetOK: "Reset OK",
    resultLabel: "Ergebnis",
    actionLabel: "Aktion",
    chooseCategory: "Bitte zuerst eine Kategorie wählen.",
    chooseFault: "Wähle links eine Störung.",
    catElectric: "Elektrik",
    catWater: "Wasser",
    catGas: "Gas",
    catHeat: "Heizung",
    catDevices: "Geräte",
    catCodes: "Fehlercode",
    catOther: "Andere",
    langTitle: "Sprache wählen",
    disclaimerTitle: "Hinweis",
    disclaimer:
      "Diese Diagnose ist nur eine Hilfestellung. Keine Haftung für Schäden durch Unachtsamkeit oder falsche Eingriffe. " +
      "Arbeiten an 230V- und Gasanlagen dürfen nur von fachkundigen Personen mit entsprechender Qualifikation durchgeführt werden.",
  },
  sk: {
    subtitle: "Wohnmobil Diagnose",
    faults: "Poruchy",
    faultsHint: "Najprv vyber kategóriu. Potom vyber poruchu.",
    howto: "Vyber poruchu a potom klikaj ÁNO / NIE.",
    searchPH: "Hľadať (trittstufe, wasserpumpe, 12V...)",
    diag: "Diagnostika",
    diagHint: "Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.",
    proto: "Protokol",
    copy: "Kopírovať",
    clear: "Vymazať cestu",
    pdf: "PDF stiahnuť",
    yes: "ÁNO",
    no: "NIE",
    back: "← SPÄŤ",
    importExportTitle: "ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK: "Import OK",
    importERR: "Chyba importu: neplatný JSON",
    resetOK: "Reset OK",
    resultLabel: "Výsledok",
    actionLabel: "Akcia",
    chooseCategory: "Najprv vyber kategóriu.",
    chooseFault: "Vyber poruchu vľavo.",
    catElectric: "Elektrika",
    catWater: "Voda",
    catGas: "Plyn",
    catHeat: "Kúrenie",
    catDevices: "Zariadenia",
    catCodes: "Chybové kódy",
    catOther: "Ostatné",
    langTitle: "Vyber jazyk",
    disclaimerTitle: "Upozornenie",
    disclaimer:
      "Táto diagnostika slúži len ako pomôcka. Nenesieme zodpovednosť za škody vzniknuté nepozornosťou alebo nesprávnym zásahom. " +
      "Zásahy do 230V a plynových zariadení smú vykonávať len osoby s odbornou kvalifikáciou.",
  },
  en: {
    subtitle: "Motorhome Diagnosis",
    faults: "Faults",
    faultsHint: "Choose a category first. Then select a fault.",
    howto: "Select a fault, then press YES / NO.",
    searchPH: "Search (step, water pump, 12V...)",
    diag: "Diagnosis",
    diagHint: "Choose a fault on the left. Then press YES / NO.",
    proto: "Protocol",
    copy: "Copy",
    clear: "Clear path",
    pdf: "PDF Download",
    yes: "YES",
    no: "NO",
    back: "← BACK",
    importExportTitle: "ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK: "Import OK",
    importERR: "Import ERROR: invalid JSON",
    resetOK: "Reset OK",
    resultLabel: "Result",
    actionLabel: "Action",
    chooseCategory: "Please choose a category first.",
    chooseFault: "Choose a fault on the left.",
    catElectric: "Electric",
    catWater: "Water",
    catGas: "Gas",
    catHeat: "Heating",
    catDevices: "Devices",
    catCodes: "Error codes",
    catOther: "Other",
    langTitle: "Choose language",
    disclaimerTitle: "Notice",
    disclaimer:
      "This diagnosis is informational only. No liability for damage caused by inattention or incorrect intervention. " +
      "Work on 230V and gas systems must be performed only by qualified professionals.",
  },
  it: {
    subtitle: "Diagnosi Camper",
    faults: "Guasti",
    faultsHint: "Scegli prima una categoria. Poi seleziona un guasto.",
    howto: "Seleziona un guasto, poi premi SÌ / NO.",
    searchPH: "Cerca (gradino, pompa acqua, 12V...)",
    diag: "Diagnosi",
    diagHint: "Scegli un guasto a sinistra. Poi premi SÌ / NO.",
    proto: "Protocollo",
    copy: "Copia",
    clear: "Cancella percorso",
    pdf: "Scarica PDF",
    yes: "SÌ",
    no: "NO",
    back: "← INDIETRO",
    importExportTitle: "ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK: "Import OK",
    importERR: "Errore import: JSON non valido",
    resetOK: "Reset OK",
    resultLabel: "Risultato",
    actionLabel: "Azione",
    chooseCategory: "Scegli prima una categoria.",
    chooseFault: "Scegli un guasto a sinistra.",
    catElectric: "Elettrico",
    catWater: "Acqua",
    catGas: "Gas",
    catHeat: "Riscaldamento",
    catDevices: "Dispositivi",
    catCodes: "Codici errore",
    catOther: "Altro",
    langTitle: "Scegli lingua",
    disclaimerTitle: "Avviso",
    disclaimer:
      "Questa diagnosi è solo informativa. Nessuna responsabilità per danni causati da disattenzione o interventi errati. " +
      "Lavori su 230V e gas solo da personale qualificato.",
  },
  fr: {
    subtitle: "Diagnostic Camping-car",
    faults: "Pannes",
    faultsHint: "Choisissez d'abord une catégorie. Puis sélectionnez une panne.",
    howto: "Sélectionnez une panne, puis appuyez OUI / NON.",
    searchPH: "Rechercher (marche, pompe, 12V...)",
    diag: "Diagnostic",
    diagHint: "Choisissez une panne à gauche. Puis appuyez OUI / NON.",
    proto: "Protocole",
    copy: "Copier",
    clear: "Effacer le chemin",
    pdf: "Télécharger PDF",
    yes: "OUI",
    no: "NON",
    back: "← RETOUR",
    importExportTitle: "ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK: "Import OK",
    importERR: "Erreur import: JSON invalide",
    resetOK: "Reset OK",
    resultLabel: "Résultat",
    actionLabel: "Action",
    chooseCategory: "Veuillez d'abord choisir une catégorie.",
    chooseFault: "Choisissez une panne à gauche.",
    catElectric: "Électrique",
    catWater: "Eau",
    catGas: "Gaz",
    catHeat: "Chauffage",
    catDevices: "Appareils",
    catCodes: "Codes erreur",
    catOther: "Autre",
    langTitle: "Choisir la langue",
    disclaimerTitle: "Avertissement",
    disclaimer:
      "Ce diagnostic est uniquement informatif. Aucune responsabilité pour les dommages dus à l'inattention ou à une intervention incorrecte. " +
      "Travaux sur 230V et gaz uniquement par des professionnels qualifiés.",
  }
};

function T(key){
  return (I18N[LANG] && I18N[LANG][key]) ? I18N[LANG][key] : (I18N.de[key] || key);
}

/** Helpers */
function pad2(n){ return String(n).padStart(2,"0"); }

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/** Text getter (prepared for more languages) */
function getText(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  // prefer current lang, else fallback order
  return (obj[LANG] ?? obj.de ?? obj.sk ?? obj.en ?? obj.it ?? obj.fr ?? "");
}

/** Tags getter supports:
 * - tags: ["a","b"]  (legacy)
 * - tags: {de:[...], sk:[...], en:[...]} (new)
 */
function getTags(tree){
  const t = tree.tags;
  if(!t) return [];
  if(Array.isArray(t)) return t.map(String);
  if(typeof t === "object"){
    const cur = Array.isArray(t[LANG]) ? t[LANG] : [];
    const de = Array.isArray(t.de) ? t.de : [];
    // merge unique: current + de
    const out = [];
    for(const x of [...cur, ...de]){
      const s = String(x);
      if(!out.includes(s)) out.push(s);
    }
    return out;
  }
  return [];
}

/** Normalize content:
 * Accepts: [...] or {trees:[...]}
 */
function normalizeContent(raw){
  const arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.trees) ? raw.trees : []);
  return arr.map(t => ({
    id: String(t.id || ""),
    category: t.category || t.cat || null,
    title: t.title || {de:"", sk:"", en:"", it:"", fr:""},
    subtitle: t.subtitle || {de:"", sk:"", en:"", it:"", fr:""},
    tags: t.tags ?? [],

    // optional media at tree level (future)
    media: t.media || null,

    start: t.start || t.root || null,
    nodes: t.nodes || {}
  })).filter(t => t.id && t.start && t.nodes && t.nodes[t.start]);
}

/** Load content: override (ADMIN import) > content.json */
async function loadContent(){
  const ov = localStorage.getItem(STORAGE_OVERRIDE);
  if(ov){
    try{
      TREES = normalizeContent(JSON.parse(ov));
      if(TREES.length) return;
    }catch(e){}
  }
  try{
    const res = await fetch(DEFAULT_CONTENT_URL, {cache:"no-store"});
    const data = await res.json();
    TREES = normalizeContent(data);
  }catch(e){
    TREES = [];
  }
}

/** Category mapping */
const CATEGORY_ORDER = [
  "electric",
  "water",
  "gas",
  "heat",
  "devices",
  "codes",
  "other",
];

function getCategoryKey(tree){
  // explicit category
  if(tree.category){
    const c = String(tree.category).toLowerCase();

    // Wasser fix (Wasser/was/water/voda)
    if(c.includes("wasser") || c.includes("was") || c.includes("water") || c.includes("voda") || c.includes("vod")) return "water";
    if(c.includes("ele")) return "electric";
    if(c.includes("gas") || c.includes("ply")) return "gas";
    if(c.includes("hei") || c.includes("kur") || c.includes("heat")) return "heat";
    if(c.includes("gerät") || c.includes("geraet") || c.includes("device") || c.includes("zariad")) return "devices";
    if(c.includes("fehler") || c.includes("error") || c.includes("code") || c.includes("kód") || c.includes("kod")) return "codes";
    return "other";
  }

  // infer from tags (fallback)
  const tags = getTags(tree).map(x => String(x).toLowerCase());
  if(tags.some(t => t.includes("12v") || t.includes("elektr") || t.includes("ebl"))) return "electric";
  if(tags.some(t => t.includes("wasser") || t.includes("voda") || t.includes("pumpe"))) return "water";
  if(tags.some(t => t.includes("gas") || t.includes("plyn"))) return "gas";
  if(tags.some(t => t.includes("heizung") || t.includes("kuren") || t.includes("heat"))) return "heat";
  if(tags.some(t => t.includes("gerät") || t.includes("geraet") || t.includes("device") || t.includes("ebl"))) return "devices";
  if(tags.some(t => t.includes("fehler") || t.includes("error") || t.includes("code"))) return "codes";
  return "other";
}

function categoryLabel(key){
  switch(key){
    case "electric": return T("catElectric");
    case "water": return T("catWater");
    case "gas": return T("catGas");
    case "heat": return T("catHeat");
    case "devices": return T("catDevices");
    case "codes": return T("catCodes");
    default: return T("catOther");
  }
}

/** Build categories (no "Alle") */
function buildCategories(){
  el.catbar.innerHTML = "";
  CATEGORY_ORDER.forEach(c=>{
    const b = document.createElement("div");
    b.className = "cat" + (activeCategory===c ? " active":"");
    b.textContent = categoryLabel(c);
    b.onclick = ()=>{
      activeCategory = c;
      // po výbere kategórie zmaž vybraný strom a diagnostiku
      selectedTreeId = null;
      currentTree = null;
      currentNodeId = null;
      path = [];
      renderCategoriesActive();
      renderList();
      renderNode();
      renderProtocol();
    };
    el.catbar.appendChild(b);
  });
}

function renderCategoriesActive(){
  [...el.catbar.querySelectorAll(".cat")].forEach((node)=>{
    node.classList.remove("active");
    if(node.textContent === categoryLabel(activeCategory)) node.classList.add("active");
  });
}

/** List rendering: show nothing until category selected */
function renderList(){
  const q = (el.search.value || "").trim().toLowerCase();
  el.list.innerHTML = "";

  // disable search until category
  el.search.disabled = !activeCategory;
  if(!activeCategory){
    el.search.value = "";
    return;
  }

  const filtered = TREES
    .filter(t => getCategoryKey(t) === activeCategory)
    .filter(t=>{
      if(!q) return true;
      const title = getText(t.title).toLowerCase();
      const sub = getText(t.subtitle).toLowerCase();
      const tags = getTags(t).join(" ").toLowerCase();
      return title.includes(q) || sub.includes(q) || tags.includes(q);
    });

  filtered.forEach(t=>{
    const div = document.createElement("div");
    div.className = "item" + (selectedTreeId===t.id ? " active":"");
    div.innerHTML = `<strong>${escapeHtml(getText(t.title))}</strong><span>${escapeHtml(getText(t.subtitle))}</span>`;
    div.onclick = ()=>selectTree(t.id);
    el.list.appendChild(div);
  });
}

/** Tree flow */
function selectTree(treeId){
  currentTree = TREES.find(t=>t.id===treeId) || null;
  selectedTreeId = treeId;
  path = [];
  currentNodeId = currentTree ? currentTree.start : null;

  // update active state in list
  [...el.list.querySelectorAll(".item")].forEach((it)=>{
    it.classList.remove("active");
  });
  const idx = TREES.findIndex(t=>t.id===treeId);
  // safer: just rerender list (keeps filter + search)
  renderList();

  renderNode();
  renderProtocol();
}

function renderNode(){
  // tagy sú default skryté
  el.tagline.style.display = "none";
  el.tagline.innerHTML = "";

  if(!activeCategory){
    el.qtitle.textContent = T("chooseCategory");
    el.yesBtn.disabled = true;
    el.noBtn.disabled = true;
    el.backBtn.disabled = true;
    return;
  }

  if(!currentTree){
    el.qtitle.textContent = T("chooseFault");
    el.yesBtn.disabled = true;
    el.noBtn.disabled = true;
    el.backBtn.disabled = true;
    return;
  }

  const node = currentTree.nodes[currentNodeId];
  if(!node){
    el.qtitle.textContent = T("chooseFault");
    el.yesBtn.disabled = true;
    el.noBtn.disabled = true;
    el.backBtn.disabled = true;
    return;
  }

  el.yesBtn.disabled = false;
  el.noBtn.disabled = false;
  el.backBtn.disabled = (path.length === 0);

  if(node.type === "question"){
    el.qtitle.textContent = getText(node.text) || "–";
    el.yesBtn.textContent = T("yes");
    el.noBtn.textContent = T("no");
    el.backBtn.textContent = T("back");
  } else if(node.type === "result"){
    const cause = getText(node.cause);
    const action = getText(node.action);
    el.qtitle.textContent = `${T("resultLabel")}: ${cause}${action ? " " + T("actionLabel") + ": " + action : ""}`;
    el.yesBtn.textContent = T("yes");
    el.noBtn.textContent = T("no");
    el.backBtn.textContent = T("back");
  } else {
    el.qtitle.textContent = "–";
  }
}

function answer(isYes){
  if(!currentTree) return;
  const node = currentTree.nodes[currentNodeId];
  if(!node || node.type !== "question") return;

  const nextId = isYes ? node.yes : node.no;

  path.push({
    q: getText(node.text),
    a: isYes ? T("yes") : T("no"),
  });

  currentNodeId = nextId;
  renderNode();
  renderProtocol();
}

function back(){
  if(!currentTree) return;
  if(path.length === 0) return;

  const replay = path.slice(0, -1);
  path = [];
  currentNodeId = currentTree.start;

  for(const step of replay){
    const node = currentTree.nodes[currentNodeId];
    if(!node || node.type !== "question") break;
    const isYes = (step.a === T("yes"));
    const nextId = isYes ? node.yes : node.no;
    path.push(step);
    currentNodeId = nextId;
  }

  renderNode();
  renderProtocol();
}

/** Protocol + Disclaimer */
function renderProtocol(){
  const lines = [];
  const now = new Date();
  const dt = `${pad2(now.getDate())}.${pad2(now.getMonth()+1)}.${now.getFullYear()}, ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  if(currentTree){
    lines.push(`${LANG==="de" ? "Zeit" : LANG==="sk" ? "Čas" : "Time"}: ${dt}`);
    lines.push(`${LANG==="de" ? "Sprache" : LANG==="sk" ? "Jazyk" : "Language"}: ${LANG.toUpperCase()}`);
    lines.push(`${LANG==="de" ? "Störung" : LANG==="sk" ? "Porucha" : "Fault"}: ${getText(currentTree.title)}`);
    const tags = getTags(currentTree);
    if(tags.length){
      lines.push(`${LANG==="de" ? "Tags" : LANG==="sk" ? "Tagy" : "Tags"}: ${tags.join(", ")}`);
    }
    lines.push("");
    lines.push(`${LANG==="de" ? "Schritte" : LANG==="sk" ? "Kroky" : "Steps"}:`);
    path.forEach((p,i)=> lines.push(`${i+1}. ${p.q} [${p.a}]`));

    const node = currentTree.nodes[currentNodeId];
    if(node && node.type === "result"){
      const cause = getText(node.cause);
      const action = getText(node.action);
      lines.push("");
      lines.push(`${T("resultLabel")}:`);
      if(cause) lines.push(cause);
      if(action) lines.push(`${T("actionLabel")}: ${action}`);
    }
  } else {
    if(!activeCategory) lines.push(T("chooseCategory"));
    else lines.push(T("chooseFault"));
  }

  // 5) Disclaimer – vždy na konci
  lines.push("");
  lines.push(`— ${T("disclaimerTitle")} —`);
  lines.push(T("disclaimer"));

  el.proto.value = lines.join("\n");
}

/** ADMIN import/export */
function admin(){
  const choice = prompt(T("importExportTitle"));
  if(!choice) return;

  if(choice.trim()==="1"){
    const inp = document.createElement("input");
    inp.type="file";
    inp.accept="application/json,.json";
    inp.onchange = async ()=>{
      const f = inp.files && inp.files[0];
      if(!f) return;
      const txt = await f.text();
      try{
        const data = JSON.parse(txt);
        const normalized = normalizeContent(data);
        if(!normalized.length) throw new Error("empty");
        localStorage.setItem(STORAGE_OVERRIDE, JSON.stringify(normalized));
        TREES = normalized;

        // po importe resetujeme UI
        hardReset(false);
        alert(T("importOK"));
      }catch(e){
        alert(T("importERR"));
      }
    };
    inp.click();
  }

  if(choice.trim()==="2"){
    const data = JSON.stringify(TREES, null, 2);
    const blob = new Blob([data], {type:"application/json;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `content_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }
}

/** RESET */
function hardReset(clearOverride=true){
  if(clearOverride) localStorage.removeItem(STORAGE_OVERRIDE);

  currentTree = null;
  currentNodeId = null;
  path = [];
  selectedTreeId = null;
  activeCategory = null;

  el.search.value = "";
  el.search.disabled = true;

  buildCategories();
  renderList();
  renderNode();
  renderProtocol();

  if(clearOverride) alert(T("resetOK"));
}

/** PDF (print) */
function downloadPdf(){
  const w = window.open("about:blank");
  if(!w) return;
  const proto = el.proto.value || "";
  const safe = proto.replace(/</g,"&lt;").replace(/>/g,"&gt;");
  w.document.write(`
    <html><head><meta charset="utf-8">
    <title>Protokoll</title>
    <style>
      body{font-family: ui-monospace, Menlo, Consolas, monospace; padding:16px;}
      pre{white-space:pre-wrap; word-break:break-word; font-size:14px;}
    </style>
    </head><body>
      <pre>${safe}</pre>
    </body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(()=>w.print(), 250);
}

/** Language dropdown */
function openLangPicker(){
  el.langOverlay.classList.add("show");
  el.langOverlay.setAttribute("aria-hidden", "false");

  el.langTitle.textContent = T("langTitle");
  el.langRow.innerHTML = "";

  const labels = {
    de: "Deutsch (DE)",
    sk: "Slovenčina (SK)",
    en: "English (EN)",
    it: "Italiano (IT)",
    fr: "Français (FR)",
  };

  LANGS.forEach(code=>{
    const b = document.createElement("button");
    b.className = "langBtn" + (LANG===code ? " active":"");
    b.textContent = labels[code] || code.toUpperCase();
    b.onclick = ()=>{
      setLang(code);
      closeLangPicker();
    };
    el.langRow.appendChild(b);
  });
}

function closeLangPicker(){
  el.langOverlay.classList.remove("show");
  el.langOverlay.setAttribute("aria-hidden", "true");
}

function setLang(code){
  if(!LANGS.includes(code)) return;
  LANG = code;
  localStorage.setItem(STORAGE_LANG, LANG);
  applyLangUI();
}

/** Apply UI language + active states */
function applyLangUI(){
  document.documentElement.lang = LANG;

  el.subtitle.textContent = T("subtitle");
  el.hFaults.textContent = T("faults");
  el.hFaultHint.textContent = T("faultsHint");
  el.hDiag.textContent = T("diag");
  el.hDiagHint.textContent = T("diagHint");
  el.hProto.textContent = T("proto");
  el.copyBtn.textContent = T("copy");
  el.clearPathBtn.textContent = T("clear");
  el.pdfBtn.textContent = T("pdf");
  el.search.placeholder = T("searchPH");
  el.howto.textContent = T("howto");

  // jazyk tlačidlo (aktívne tyrkys)
  el.btnLANG.textContent = `${LANG.toUpperCase()} ▾`;
  el.btnLANG.classList.add("active");

  // version
  el.version.textContent = `v${VERSION}`;

  // rebuild cats (labels depend on lang)
  buildCategories();
  renderList();
  renderNode();
  renderProtocol();
}

/** Boot */
(async function boot(){
  await loadContent();

  // bind
  el.btnLANG.onclick = openLangPicker;
  el.langOverlay.onclick = (e)=>{
    // klik mimo sheet zavrie bez zmeny
    if(e.target === el.langOverlay) closeLangPicker();
  };

  el.btnADMIN.onclick = ()=>admin();
  el.btnRESET.onclick = ()=>hardReset(true);

  el.search.oninput = ()=>renderList();

  el.yesBtn.onclick = ()=>answer(true);
  el.noBtn.onclick = ()=>answer(false);
  el.backBtn.onclick = ()=>back();

  el.copyBtn.onclick = async ()=>{
    try{ await navigator.clipboard.writeText(el.proto.value || ""); }catch(e){}
  };

  el.clearPathBtn.onclick = ()=>{
    path = [];
    if(currentTree) currentNodeId = currentTree.start;
    renderNode();
    renderProtocol();
  };

  el.pdfBtn.onclick = ()=>downloadPdf();

  // initial state: no category selected => list empty
  activeCategory = null;
  el.search.disabled = true;

  applyLangUI();
})();
