/* CaravanTechniker am Main - stable base (list + tree + offline-ready)
   Loads:
   1) localStorage override (admin import)
   2) repo file: content_full_with_fehlcodes_SK_DE.json (preferred)
   3) fallback: content.json
*/

const VERSION = "v0.4.0";
const LS_CONTENT = "ct_content_override_v1";
const LS_LANG = "ct_lang_v1";
const LS_PROTOCOL = "ct_protocol_v1";
const LS_ADMIN_UNLOCK = "ct_admin_unlock_v1";

const el = (id) => document.getElementById(id);

const ui = {
  brandTitle: el("brandTitle"),
  brandSub: el("brandSub"),
  versionLabel: el("versionLabel"),
  toast: el("toast"),

  // top buttons
  langBtn: el("langBtn"),
  adminBtn: el("adminBtn"),
  resetBtn: el("resetBtn"),

  // list
  listView: el("listView"),
  listTitle: el("listTitle"),
  listHint: el("listHint"),
  searchInput: el("searchInput"),
  chips: el("chips"),
  items: el("items"),

  // tree
  treeView: el("treeView"),
  backToListBtn: el("backToListBtn"),
  treeTitle: el("treeTitle"),
  treeSubtitle: el("treeSubtitle"),
  questionBox: el("questionBox"),
  yesBtn: el("yesBtn"),
  noBtn: el("noBtn"),
  stepBackBtn: el("stepBackBtn"),

  protocolTitle: el("protocolTitle"),
  protocolBox: el("protocolBox"),
  copyBtn: el("copyBtn"),
  clearPathBtn: el("clearPathBtn"),
  pdfBtn: el("pdfBtn"),

  // admin
  adminDialog: el("adminDialog"),
  adminPwd: el("adminPwd"),
  unlockBtn: el("unlockBtn"),
  lockBtn: el("lockBtn"),
  importFile: el("importFile"),
  useRepoBtn: el("useRepoBtn"),
  exportBtn: el("exportBtn"),
};

let lang = (localStorage.getItem(LS_LANG) || "de").toLowerCase(); // "de" | "sk"
let content = [];         // array of trees/items
let selectedCategory = "all";
let searchQuery = "";
let activeTree = null;    // currently opened tree item
let currentNodeId = null; // node id in activeTree.nodes
let historyStack = [];    // for step back

let protocol = {
  startedAt: null,
  lang: null,
  treeId: null,
  treeTitle: null,
  tags: [],
  steps: [] // {q, a}
};

function t(objOrString) {
  // objOrString: {de, sk} or string
  if (!objOrString) return "";
  if (typeof objOrString === "string") return objOrString;
  return objOrString[lang] || objOrString["de"] || objOrString["sk"] || "";
}

function toast(msg) {
  ui.toast.textContent = msg || "";
  if (!msg) return;
  setTimeout(() => { if (ui.toast.textContent === msg) ui.toast.textContent = ""; }, 2200);
}

function setLang(next) {
  lang = (next || "de").toLowerCase();
  localStorage.setItem(LS_LANG, lang);
  ui.langBtn.textContent = lang.toUpperCase();
  document.documentElement.lang = lang;
  renderAll();
}

function isUnlocked() {
  return localStorage.getItem(LS_ADMIN_UNLOCK) === "1";
}

function resetAll() {
  // No confirm (as you wanted)
  localStorage.removeItem(LS_PROTOCOL);
  historyStack = [];
  activeTree = null;
  currentNodeId = null;

  protocol = {
    startedAt: null, lang: null, treeId: null, treeTitle: null, tags: [], steps: []
  };

  // Keep imported content unless you explicitly remove it:
  // localStorage.removeItem(LS_CONTENT);

  location.hash = "#list";
  toast(lang === "de" ? "Reset OK" : "Reset OK");
  renderAll();
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("Fetch failed: " + path);
  return await res.json();
}

async function loadContent() {
  // 1) local override
  const override = localStorage.getItem(LS_CONTENT);
  if (override) {
    try {
      const parsed = JSON.parse(override);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // 2) preferred full file
  try {
    const full = await fetchJson("./content_full_with_fehlcodes_SK_DE.json");
    if (Array.isArray(full) && full.length) return full;
  } catch {}

  // 3) fallback basic
  const basic = await fetchJson("./content.json");
  if (Array.isArray(basic)) return basic;

  return [];
}

function normalizeContent(arr) {
  // ensure each item has expected fields
  return (arr || []).map((it) => ({
    id: it.id || cryptoRandomId(),
    category: it.category || "Andere",
    title: it.title || { de: "Ohne Titel", sk: "Bez názvu" },
    subtitle: it.subtitle || { de: "", sk: "" },
    tags: Array.isArray(it.tags) ? it.tags : [],
    start: it.start || null,
    nodes: it.nodes && typeof it.nodes === "object" ? it.nodes : null,
  }));
}

function cryptoRandomId() {
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function getCategories() {
  const cats = new Set();
  content.forEach((it) => cats.add(it.category || "Andere"));
  return Array.from(cats).sort((a,b) => a.localeCompare(b));
}

function categoryLabel(cat) {
  // keep your DE category naming, but allow your future mapping
  return cat;
}

function matchesSearch(item, q) {
  if (!q) return true;
  const hay = [
    t(item.title),
    t(item.subtitle),
    (item.tags || []).join(" "),
    item.category || ""
  ].join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

function renderChips() {
  const cats = getCategories();
  const allLabel = (lang === "de") ? "Alle" : "Všetko";

  ui.chips.innerHTML = "";

  const makeChip = (key, label) => {
    const b = document.createElement("button");
    b.className = "chip" + (selectedCategory === key ? " active" : "");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => {
      selectedCategory = key;
      renderList();
    });
    ui.chips.appendChild(b);
  };

  makeChip("all", allLabel);
  cats.forEach((cat) => makeChip(cat, categoryLabel(cat)));
}

function renderList() {
  ui.listView.classList.remove("hidden");
  ui.treeView.classList.add("hidden");

  ui.versionLabel.textContent = VERSION;

  ui.listTitle.textContent = (lang === "de") ? "Störungen" : "Poruchy";
  ui.listHint.textContent = (lang === "de")
    ? "Wähle eine Störung oder suche. Funktioniert auch offline."
    : "Vyber poruchu alebo hľadaj. Funguje aj offline.";

  ui.searchInput.placeholder = (lang === "de")
    ? "Suche (Trittstufe, Wasserpumpe, 12V ...)"
    : "Hľadaj (schodík, pumpa, 12V ...)";

  renderChips();

  const q = (searchQuery || "").trim();
  const filtered = content
    .filter((it) => selectedCategory === "all" ? true : (it.category === selectedCategory))
    .filter((it) => matchesSearch(it, q));

  ui.items.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "card itemCard";
    empty.innerHTML = `
      <div class="itemTitle">${lang === "de" ? "Keine Treffer" : "Žiadne výsledky"}</div>
      <div class="itemSub">${lang === "de" ? "Prüfe Filter oder Suche." : "Skontroluj filter alebo vyhľadávanie."}</div>
    `;
    ui.items.appendChild(empty);
    return;
  }

  filtered.forEach((it) => {
    const card = document.createElement("div");
    card.className = "card itemCard";
    card.innerHTML = `
      <div class="itemTitle">${escapeHtml(t(it.title))}</div>
      <div class="itemSub">${escapeHtml(t(it.subtitle))}</div>
    `;
    card.addEventListener("click", () => openTree(it.id));
    ui.items.appendChild(card);
  });
}

function openTree(id) {
  const it = content.find((x) => x.id === id);
  if (!it) return;

  // If no nodes -> show info (still stable)
  activeTree = it;
  historyStack = [];
  protocol = {
    startedAt: new Date().toISOString(),
    lang,
    treeId: it.id,
    treeTitle: t(it.title),
    tags: it.tags || [],
    steps: []
  };
  saveProtocol();

  // Route
  location.hash = "#tree/" + encodeURIComponent(it.id);
  renderTree(); // immediate render
}

function renderTree() {
  ui.listView.classList.add("hidden");
  ui.treeView.classList.remove("hidden");

  ui.versionLabel.textContent = VERSION;

  ui.treeTitle.textContent = (lang === "de") ? "Diagnose" : "Diagnostika";
  ui.treeSubtitle.textContent = activeTree ? `${t(activeTree.title)} — ${t(activeTree.subtitle)}` : "";

  ui.backToListBtn.textContent = (lang === "de") ? "← Zurück" : "← Späť";
  ui.yesBtn.textContent = (lang === "de") ? "JA" : "ÁNO";
  ui.noBtn.textContent  = (lang === "de") ? "NEIN" : "NIE";
  ui.stepBackBtn.textContent = (lang === "de") ? "← SCHRITT ZURÜCK" : "← KROK SPÄŤ";
  ui.protocolTitle.textContent = (lang === "de") ? "Protokoll" : "Protokol";
  ui.copyBtn.textContent = (lang === "de") ? "Kopieren" : "Kopírovať";
  ui.clearPathBtn.textContent = (lang === "de") ? "Pfad löschen" : "Vymazať postup";
  ui.pdfBtn.textContent = (lang === "de") ? "PDF Download" : "PDF stiahnuť";

  if (!activeTree) {
    ui.questionBox.innerHTML = `<p class="qText">${lang === "de" ? "Kein Baum ausgewählt." : "Nie je vybraný strom."}</p>`;
    ui.yesBtn.disabled = true;
    ui.noBtn.disabled = true;
    ui.stepBackBtn.disabled = true;
    renderProtocol();
    return;
  }

  // If tree has no nodes
  if (!activeTree.nodes || !activeTree.start) {
    ui.questionBox.innerHTML = `
      <p class="qText">${escapeHtml(t(activeTree.title))}</p>
      <div class="resBlock">
        <p class="resLabel">${lang === "de" ? "Info" : "Info"}</p>
        <p class="resText">${lang === "de"
          ? "Dieser Eintrag hat noch keine Diagnose-Nodes."
          : "Tento záznam ešte nemá diagnostické uzly."}</p>
      </div>
    `;
    ui.yesBtn.disabled = true;
    ui.noBtn.disabled = true;
    ui.stepBackBtn.disabled = true;
    renderProtocol();
    return;
  }

  // set current node
  if (!currentNodeId) currentNodeId = activeTree.start;
  const node = activeTree.nodes[currentNodeId];

  if (!node) {
    ui.questionBox.innerHTML = `<p class="qText">${lang === "de" ? "Node fehlt." : "Chýba uzol."}</p>`;
    ui.yesBtn.disabled = true;
    ui.noBtn.disabled = true;
    ui.stepBackBtn.disabled = historyStack.length === 0;
    renderProtocol();
    return;
  }

  // Render node
  ui.yesBtn.disabled = false;
  ui.noBtn.disabled = false;
  ui.stepBackBtn.disabled = historyStack.length === 0;

  if (node.type === "question") {
    ui.questionBox.innerHTML = `
      <p class="qText">${escapeHtml(t(node.text))}</p>
      ${renderMedia(node)}
    `;
  } else if (node.type === "result") {
    ui.questionBox.innerHTML = `
      <p class="qText">${lang === "de" ? "Ergebnis" : "Výsledok"}</p>
      <div class="resBlock">
        <p class="resLabel">${lang === "de" ? "Ursache" : "Príčina"}</p>
        <p class="resText">${escapeHtml(t(node.cause))}</p>
      </div>
      <div class="resBlock">
        <p class="resLabel">${lang === "de" ? "Aktion" : "Akcia"}</p>
        <p class="resText">${escapeHtml(t(node.action))}</p>
      </div>
      ${renderMedia(node)}
    `;
  } else {
    ui.questionBox.innerHTML = `
      <p class="qText">${escapeHtml(t(node.text) || "…")}</p>
      ${renderMedia(node)}
    `;
  }

  renderProtocol();
}

function renderMedia(node) {
  // prepared for future: node.media = [{type:'image'|'pdf'|'video'|'link', url:'', label:{de,sk} }]
  if (!node || !Array.isArray(node.media) || !node.media.length) return "";
  const blocks = node.media.map((m) => {
    const label = escapeHtml(t(m.label) || m.url || "");
    const url = String(m.url || "").trim();
    if (!url) return "";
    if (m.type === "image") {
      return `<img src="${escapeAttr(url)}" alt="${label}" loading="lazy" />`;
    }
    if (m.type === "video") {
      return `<video src="${escapeAttr(url)}" controls playsinline></video>`;
    }
    if (m.type === "pdf") {
      return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${label || "PDF"}</a>`;
    }
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${label || "Link"}</a>`;
  }).filter(Boolean);

  if (!blocks.length) return "";
  return `<div class="media">${blocks.join("")}</div>`;
}

function step(answerYes) {
  if (!activeTree || !activeTree.nodes) return;
  const node = activeTree.nodes[currentNodeId];
  if (!node) return;

  // protocol step
  if (node.type === "question") {
    protocol.steps.push({
      q: t(node.text),
      a: answerYes ? (lang === "de" ? "JA" : "ÁNO") : (lang === "de" ? "NEIN" : "NIE")
    });
    saveProtocol();
  }

  // move
  historyStack.push(currentNodeId);

  let nextId = null;
  if (answerYes) nextId = node.yes;
  else nextId = node.no;

  // if no next -> keep current
  if (!nextId) {
    toast(lang === "de" ? "Kein nächster Schritt." : "Žiadny ďalší krok.");
    historyStack.pop();
    return;
  }

  currentNodeId = nextId;
  renderTree();
}

function stepBack() {
  if (!historyStack.length) return;
  currentNodeId = historyStack.pop();
  // also remove last protocol answer (optional)
  // keep it simple: do not delete past protocol (you can see full path)
  renderTree();
}

function renderProtocol() {
  const p = loadProtocol();
  if (!p || !p.startedAt) {
    ui.protocolBox.textContent = "";
    return;
  }

  const dt = new Date(p.startedAt);
  const dtStr = dt.toLocaleString();

  const lines = [];
  lines.push(`Zeit: ${dtStr}`);
  lines.push(`Sprache: ${p.lang?.toUpperCase() || ""}`);
  lines.push(`Störung: ${p.treeTitle || ""}`);
  if (p.tags && p.tags.length) lines.push(`Tags: ${p.tags.join(", ")}`);
  lines.push("");
  lines.push("Schritte:");
  (p.steps || []).forEach((s, i) => {
    lines.push(`${i + 1}. ${s.q} [${s.a}]`);
  });

  ui.protocolBox.textContent = lines.join("\n");
}

function saveProtocol() {
  localStorage.setItem(LS_PROTOCOL, JSON.stringify(protocol));
}

function loadProtocol() {
  const raw = localStorage.getItem(LS_PROTOCOL);
  if (!raw) return protocol;
  try { return JSON.parse(raw); } catch { return protocol; }
}

function handleHashRoute() {
  const h = (location.hash || "#list").replace(/^#/, "");
  if (!h || h === "list") {
    activeTree = null;
    currentNodeId = null;
    historyStack = [];
    renderList();
    return;
  }
  if (h.startsWith("tree/")) {
    const id = decodeURIComponent(h.slice("tree/".length));
    const it = content.find((x) => x.id === id);
    if (!it) {
      location.hash = "#list";
      return;
    }
    activeTree = it;
    if (!currentNodeId) currentNodeId = it.start || null;
    renderTree();
  }
}

function bindEvents() {
  ui.langBtn.addEventListener("click", () => {
    setLang(lang === "de" ? "sk" : "de");
  });

  ui.resetBtn.addEventListener("click", () => resetAll());

  ui.searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value || "";
    renderList();
  });

  ui.backToListBtn.addEventListener("click", () => {
    activeTree = null;
    currentNodeId = null;
    historyStack = [];
    location.hash = "#list";
    renderList();
  });

  ui.yesBtn.addEventListener("click", () => step(true));
  ui.noBtn.addEventListener("click", () => step(false));
  ui.stepBackBtn.addEventListener("click", () => stepBack());

  ui.copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ui.protocolBox.textContent || "");
      toast(lang === "de" ? "Kopiert." : "Skopírované.");
    } catch {
      toast(lang === "de" ? "Kopieren nicht möglich." : "Kopírovanie nie je možné.");
    }
  });

  ui.clearPathBtn.addEventListener("click", () => {
    protocol.steps = [];
    saveProtocol();
    renderProtocol();
    toast(lang === "de" ? "Pfad gelöscht." : "Postup zmazaný.");
  });

  ui.pdfBtn.addEventListener("click", () => window.print());

  // Admin
  ui.adminBtn.addEventListener("click", () => {
    ui.adminPwd.value = "";
    ui.adminDialog.showModal();
  });

  ui.unlockBtn.addEventListener("click", () => {
    const pwd = (ui.adminPwd.value || "").trim();
    // Simple lock: change later (you can harden it)
    if (pwd.length >= 4) {
      localStorage.setItem(LS_ADMIN_UNLOCK, "1");
      toast(lang === "de" ? "Admin unlocked." : "Admin odomknutý.");
    } else {
      toast(lang === "de" ? "Passwort zu kurz." : "Heslo je krátke.");
    }
  });

  ui.lockBtn.addEventListener("click", () => {
    localStorage.setItem(LS_ADMIN_UNLOCK, "0");
    toast(lang === "de" ? "Admin locked." : "Admin zamknutý.");
  });

  ui.useRepoBtn.addEventListener("click", () => {
    localStorage.removeItem(LS_CONTENT);
    toast(lang === "de" ? "Repo content aktiv." : "Repo content aktívny.");
    init(); // reload
  });

  ui.exportBtn.addEventListener("click", () => {
    const raw = localStorage.getItem(LS_CONTENT);
    const payload = raw ? raw : JSON.stringify(content, null, 2);
    downloadText(payload, "content_export.json", "application/json");
  });

  ui.importFile.addEventListener("change", async (e) => {
    if (!isUnlocked()) {
      toast(lang === "de" ? "Admin locked." : "Admin zamknutý.");
      ui.importFile.value = "";
      return;
    }
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
      localStorage.setItem(LS_CONTENT, JSON.stringify(parsed));
      toast(lang === "de" ? "Import OK." : "Import OK.");
      ui.importFile.value = "";
      init(); // reload
    } catch (err) {
      toast(lang === "de" ? "Import Fehler." : "Chyba importu.");
    }
  });

  window.addEventListener("hashchange", handleHashRoute);
}

function downloadText(text, filename, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function renderAll() {
  // update top texts if you later add SK branding etc.
  ui.langBtn.textContent = lang.toUpperCase();
  ui.versionLabel.textContent = VERSION;
  handleHashRoute();
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("`","&#096;");
}

async function init() {
  ui.versionLabel.textContent = VERSION;
  content = normalizeContent(await loadContent());

  // default category "all"
  selectedCategory = "all";
  searchQuery = ui.searchInput.value || "";

  // load protocol (keep if exists)
  const p = loadProtocol();
  if (p && p.startedAt) protocol = p;

  // route
  renderAll();
  registerSW();
}

bindEvents();
setLang(lang);
init();
