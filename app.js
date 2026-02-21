/* CaravanTechniker am Main – stable base
   - Works with content.json in SIMPLE mode (list only) or FULL mode (with nodes)
   - No missing element crashes: all required IDs exist in index.html
*/

const APP_VERSION = "0.3.4";

/** ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);

function nowLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function isFullItem(item) {
  return item && typeof item === "object" && item.nodes && item.start;
}

function t(itemOrObj, lang, fallback="") {
  if (itemOrObj == null) return fallback;
  if (typeof itemOrObj === "string") return itemOrObj;
  if (typeof itemOrObj === "object") {
    return itemOrObj[lang] || itemOrObj.de || itemOrObj.sk || fallback;
  }
  return fallback;
}

function safeLower(s){ return (s || "").toString().toLowerCase(); }

/** ---------- state ---------- */
let LANG = localStorage.getItem("ct_lang") || "de";
let ALL = [];
let ACTIVE_CATEGORY = "Alle";
let QUERY = "";

let currentItem = null;         // selected item
let currentNodeId = null;       // active node in tree
let stack = [];                 // history of node ids for step-back
let path = [];                  // protocol steps {q, a}

/** ---------- elements ---------- */
const versionLabel = $("#versionLabel");
const langBtn = $("#langBtn");
const resetBtn = $("#resetBtn");
const adminBtn = $("#adminBtn");

const listView = $("#listView");
const diagView = $("#diagView");
const adminView = $("#adminView");

const adminBackBtn = $("#adminBackBtn");

const searchInput = $("#searchInput");
const chips = $("#chips");
const itemsEl = $("#items");

const backToListBtn = $("#backToListBtn");
const diagTitle = $("#diagTitle");
const selectedItemLabel = $("#selectedItemLabel");

const questionBox = $("#questionBox");
const yesBtn = $("#yesBtn");
const noBtn = $("#noBtn");
const stepBackBtn = $("#stepBackBtn");

const protocolEl = $("#protocol");
const copyBtn = $("#copyBtn");
const clearPathBtn = $("#clearPathBtn");
const pdfBtn = $("#pdfBtn");

/** ---------- init ---------- */
versionLabel.textContent = `v${APP_VERSION}`;
document.documentElement.lang = LANG;
langBtn.textContent = LANG.toUpperCase();

async function loadContent() {
  const res = await fetch("content.json", { cache: "no-store" });
  if (!res.ok) throw new Error("content.json load failed");
  const data = await res.json();
  // data can be array
  if (!Array.isArray(data)) throw new Error("content.json must be array");
  return data;
}

function buildCategories(data) {
  const set = new Set(["Alle"]);
  data.forEach(it => set.add(it.category || "Andere"));
  return Array.from(set);
}

function renderChips(categories) {
  chips.innerHTML = "";
  categories.forEach(cat => {
    const b = document.createElement("button");
    b.className = "pill" + (cat === ACTIVE_CATEGORY ? " pill--active" : "");
    b.type = "button";
    b.textContent = cat;
    b.addEventListener("click", () => {
      ACTIVE_CATEGORY = cat;
      renderChips(categories);
      renderItems();
    });
    chips.appendChild(b);
  });
}

function filterItems() {
  return ALL.filter(it => {
    const catOk = (ACTIVE_CATEGORY === "Alle") || ((it.category || "Andere") === ACTIVE_CATEGORY);
    if (!catOk) return false;

    const title = safeLower(t(it.title, LANG, it.title));
    const sub = safeLower(t(it.subtitle, LANG, it.subtitle));
    const tags = Array.isArray(it.tags) ? it.tags.join(" ") : "";
    const q = safeLower(QUERY);
    if (!q) return true;
    return title.includes(q) || sub.includes(q) || safeLower(tags).includes(q);
  });
}

function renderItems() {
  const list = filterItems();
  itemsEl.innerHTML = "";

  list.forEach(it => {
    const card = document.createElement("div");
    card.className = "item";
    card.tabIndex = 0;

    const title = document.createElement("div");
    title.className = "item__title";
    title.textContent = t(it.title, LANG, it.title || "");

    const sub = document.createElement("div");
    sub.className = "item__sub";
    sub.textContent = t(it.subtitle, LANG, it.subtitle || "");

    card.appendChild(title);
    card.appendChild(sub);

    card.addEventListener("click", () => openItem(it));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openItem(it);
    });

    itemsEl.appendChild(card);
  });
}

function show(view) {
  listView.classList.add("hidden");
  diagView.classList.add("hidden");
  adminView.classList.add("hidden");
  view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "instant" });
}

/** ---------- diagnose ---------- */
function openItem(it) {
  currentItem = it;
  stack = [];
  path = [];
  protocolEl.textContent = "";
  selectedItemLabel.textContent = `${t(it.title, LANG, it.title || "")} — ${t(it.subtitle, LANG, it.subtitle || "")}`;

  if (isFullItem(it)) {
    currentNodeId = it.start;
    renderNode();
    show(diagView);
  } else {
    // SIMPLE item: show placeholder (still no crash)
    currentNodeId = null;
    questionBox.textContent = (LANG === "de")
      ? "Dieser Eintrag hat noch keinen Diagnose-Baum (nodes/start fehlen in content.json)."
      : "Tento záznam ešte nemá diagnostický strom (chýba nodes/start v content.json).";
    yesBtn.disabled = true;
    noBtn.disabled = true;
    stepBackBtn.disabled = true;
    renderProtocol();
    show(diagView);
  }
}

function nodeById(id) {
  if (!currentItem || !currentItem.nodes) return null;
  return currentItem.nodes[id] || null;
}

function renderNode() {
  const node = nodeById(currentNodeId);
  if (!node) {
    questionBox.textContent = (LANG === "de")
      ? "Fehler: Node nicht gefunden."
      : "Chyba: Node sa nenašiel.";
    yesBtn.disabled = true;
    noBtn.disabled = true;
    stepBackBtn.disabled = stack.length === 0;
    return;
  }

  yesBtn.disabled = false;
  noBtn.disabled = false;
  stepBackBtn.disabled = stack.length === 0;

  if (node.type === "question") {
    questionBox.textContent = t(node.text, LANG, "");
  } else if (node.type === "result") {
    // result screen – show combined info
    const cause = t(node.cause, LANG, "");
    const action = t(node.action, LANG, "");
    questionBox.textContent = `${(LANG==="de" ? "Ergebnis:" : "Výsledok:")} ${cause}\n\n${(LANG==="de" ? "Aktion:" : "Akcia:")} ${action}`;
    // on result we can disable yes/no to prevent nonsense clicks
    yesBtn.disabled = true;
    noBtn.disabled = true;
  } else {
    questionBox.textContent = (LANG === "de")
      ? "Unbekannter Node-Typ."
      : "Neznámy typ node.";
    yesBtn.disabled = true;
    noBtn.disabled = true;
  }

  renderProtocol();
}

function answer(isYes) {
  const node = nodeById(currentNodeId);
  if (!node || node.type !== "question") return;

  const qText = t(node.text, LANG, "");
  const aText = isYes ? (LANG === "de" ? "JA" : "ÁNO") : (LANG === "de" ? "NEIN" : "NIE");

  path.push({ q: qText, a: aText });

  const next = isYes ? node.yes : node.no;
  if (!next) {
    renderProtocol();
    return;
  }

  stack.push(currentNodeId);
  currentNodeId = next;
  renderNode();
}

function stepBack() {
  if (stack.length === 0) return;
  // remove last answer too
  if (path.length > 0) path.pop();
  currentNodeId = stack.pop();
  renderNode();
}

function renderProtocol() {
  if (!currentItem) { protocolEl.textContent = ""; return; }

  const title = t(currentItem.title, LANG, currentItem.title || "");
  const tags = Array.isArray(currentItem.tags) ? currentItem.tags.join(", ") : "";
  const lines = [];

  lines.push(`Zeit: ${nowLocal()}`);
  lines.push(`Sprache: ${LANG.toUpperCase()}`);
  lines.push(`Störung: ${title}`);
  if (tags) lines.push(`Tags: ${tags}`);
  lines.push("");
  lines.push("Schritte:");
  if (path.length === 0) {
    lines.push(LANG === "de" ? "- (noch keine Auswahl)" : "- (zatiaľ bez výberu)");
  } else {
    path.forEach((s, i) => {
      lines.push(`${i+1}. ${s.q} [${s.a}]`);
    });
  }

  protocolEl.textContent = lines.join("\n");
}

/** ---------- actions ---------- */
langBtn.addEventListener("click", () => {
  LANG = (LANG === "de") ? "sk" : "de";
  localStorage.setItem("ct_lang", LANG);
  document.documentElement.lang = LANG;
  langBtn.textContent = LANG.toUpperCase();

  // rerender list + current screen
  renderItems();
  renderChips(buildCategories(ALL));
  if (!diagView.classList.contains("hidden") && currentItem) {
    selectedItemLabel.textContent = `${t(currentItem.title, LANG, currentItem.title || "")} — ${t(currentItem.subtitle, LANG, currentItem.subtitle || "")}`;
    if (isFullItem(currentItem) && currentNodeId) renderNode();
    else renderProtocol();
  }
});

resetBtn.addEventListener("click", () => {
  // hard reset state, but keep language
  ACTIVE_CATEGORY = "Alle";
  QUERY = "";
  searchInput.value = "";
  currentItem = null;
  currentNodeId = null;
  stack = [];
  path = [];
  renderChips(buildCategories(ALL));
  renderItems();
  show(listView);
});

adminBtn.addEventListener("click", () => show(adminView));
adminBackBtn.addEventListener("click", () => show(listView));

searchInput.addEventListener("input", (e) => {
  QUERY = e.target.value || "";
  renderItems();
});

backToListBtn.addEventListener("click", () => show(listView));

yesBtn.addEventListener("click", () => answer(true));
noBtn.addEventListener("click", () => answer(false));
stepBackBtn.addEventListener("click", () => stepBack());

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(protocolEl.textContent || "");
  } catch (e) {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = protocolEl.textContent || "";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
});

clearPathBtn.addEventListener("click", () => {
  stack = [];
  path = [];
  if (isFullItem(currentItem)) {
    currentNodeId = currentItem.start;
    renderNode();
  } else {
    renderProtocol();
  }
});

pdfBtn.addEventListener("click", () => {
  // simplest robust "PDF": print dialog -> Save as PDF works on Android/desktop, on iOS uses share/print
  const w = window.open("", "_blank");
  const safe = (s) => (s || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  w.document.write(`
    <html><head><meta charset="utf-8"><title>Protokoll</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;}
      pre{white-space:pre-wrap;border:1px solid #ccc;border-radius:12px;padding:16px;}
      h1{margin:0 0 12px 0;}
    </style></head>
    <body>
      <h1>CaravanTechniker am Main – Protokoll</h1>
      <pre>${safe(protocolEl.textContent || "")}</pre>
      <script>window.onload=()=>window.print();</script>
    </body></html>
  `);
  w.document.close();
});

/** ---------- service worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

/** ---------- boot ---------- */
(async function boot(){
  ALL = await loadContent();
  const categories = buildCategories(ALL);
  ACTIVE_CATEGORY = "Alle";
  renderChips(categories);
  renderItems();
  show(listView);
})();
