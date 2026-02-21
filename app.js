/* CaravanTechniker am Main - stable base (list + tree + offline-ready)
   Loads in this priority:
   1) localStorage override (admin import)
   2) repo file: content_full_with_fehlcodes_SK_DE.json  (preferred)
   3) fallback: content.json
*/

const VERSION = "v0.5.0";
const LS_CONTENT = "ct_content_override_v1";
const LS_LANG = "ct_lang_v1";

const el = (id) => document.getElementById(id);

// ---------- UI refs (ALL IDs exist in index.html) ----------
const ui = {
  brandTitle: el("brandTitle"),
  brandSubtitle: el("brandSubtitle"),
  versionLabel: el("versionLabel"),
  statusLabel: el("statusLabel"),

  langBtn: el("langBtn"),
  adminBtn: el("adminBtn"),
  resetBtn: el("resetBtn"),

  listView: el("listView"),
  treeView: el("treeView"),

  listTitle: el("listTitle"),
  listHint: el("listHint"),

  searchInput: el("searchInput"),
  filterAll: el("filterAll"),
  filterElektrik: el("filterElektrik"),
  filterWasser: el("filterWasser"),
  items: el("items"),
  noResults: el("noResults"),
  noResultsTitle: el("noResultsTitle"),
  noResultsHint: el("noResultsHint"),

  backBtn: el("backBtn"),
  treeTitle: el("treeTitle"),
  breadcrumb: el("breadcrumb"),
  questionBox: el("questionBox"),
  answersBox: el("answersBox"),
  resultBox: el("resultBox"),

  adminDialog: el("adminDialog"),
  adminCloseBtn: el("adminCloseBtn"),
  adminPwd: el("adminPwd"),
  unlockBtn: el("unlockBtn"),
  lockBtn: el("lockBtn"),
  importFile: el("importFile"),
  useRepoBtn: el("useRepoBtn"),
  exportBtn: el("exportBtn"),

  toast: el("toast"),
};

// ---------- HARD ADMIN: always unlocked ----------
const isAdmin = () => true;

// ---------- State ----------
let state = {
  lang: localStorage.getItem(LS_LANG) || "de",
  filter: "all", // all | elektrik | wasser
  query: "",
  dataset: null,
  list: [], // derived list items (cards)
  currentTree: null,
  path: [], // node ids path for breadcrumb
  currentNodeId: null,
};

// ---------- Helpers ----------
function toast(msg) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => ui.toast.classList.add("hidden"), 1800);
}

function setStatus(msg) {
  ui.statusLabel.textContent = msg || "";
}

function safeJsonParse(txt) {
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function isObject(x) {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

// Normalize content to a stable internal format.
// Supported input formats:
// A) { items:[{id,title,desc,category,root}], nodes:{id:{q,answers:[{t,next}], result}} }
// B) array of trees: [{id,title,desc,category,root,nodes:{...}}]
function normalizeContent(raw) {
  // If already in preferred format
  if (isObject(raw) && Array.isArray(raw.items) && isObject(raw.nodes)) {
    return raw;
  }

  // If file is array of trees
  if (Array.isArray(raw)) {
    // merge into one dataset
    const items = [];
    const nodes = {};
    for (const tree of raw) {
      if (!tree) continue;
      const tid = tree.id || tree.treeId || tree.key || ("t_" + Math.random().toString(16).slice(2));
      const root = tree.root || tree.rootId || tree.start || tree.startId;
      items.push({
        id: tid,
        title: tree.title || tree.name || "Ohne Titel",
        desc: tree.desc || tree.description || "",
        category: tree.category || tree.cat || "andere",
        root: root || null,
      });

      const tn = tree.nodes || tree.tree || tree.data || {};
      // prefix node ids by tree id to avoid collisions if needed
      for (const [nid, node] of Object.entries(tn)) {
        nodes[`${tid}:${nid}`] = normalizeNode(node, tid);
      }

      // Fix root if not prefixed
      if (root && !nodes[root] && nodes[`${tid}:${root}`]) {
        items[items.length - 1].root = `${tid}:${root}`;
      } else if (root && nodes[root]) {
        items[items.length - 1].root = root;
      }
    }
    return { items, nodes };
  }

  // If object with trees inside
  if (isObject(raw) && Array.isArray(raw.trees)) {
    return normalizeContent(raw.trees);
  }

  // Fallback demo
  return demoContent();
}

function normalizeNode(node, tid) {
  // Accept shapes:
  // { q:"", answers:[{t:"", next:""}], result:"" }
  // { question:"", options:[{text:"", next:""}], resultText:"" }
  const q = node.q || node.question || "";
  const ansRaw = node.answers || node.options || node.choices || [];
  const answers = Array.isArray(ansRaw) ? ansRaw.map(a => ({
    t: a.t || a.text || a.label || "",
    next: a.next ? (a.next.includes(":") ? a.next : `${tid}:${a.next}`) : null,
    result: a.result || a.resultText || null,
  })) : [];

  const result = node.result || node.resultText || node.r || null;

  return { q, answers, result };
}

function demoContent() {
  return {
    items: [
      { id: "elektrik_12v_tot", title: "12V komplett ausgefallen (Aufbau tot)", desc: "Kein Licht, keine Pumpe, Panel dunkel.", category: "elektrik", root: "elektrik_12v_tot:root" },
      { id: "elektrik_12v_teilweise", title: "12V funktioniert teilweise", desc: "Einige Verbraucher gehen, andere nicht.", category: "elektrik", root: "elektrik_12v_teilweise:root" },
      { id: "wasser_pumpe", title: "Wasserpumpe läuft nicht", desc: "Kein Geräusch, kein Druck.", category: "wasser", root: "wasser_pumpe:root" },
    ],
    nodes: {
      "elektrik_12v_tot:root": {
        q: "Ist Landstrom (230V) verfügbar und eingeschaltet?",
        answers: [
          { t: "Ja", next: "elektrik_12v_tot:a1" },
          { t: "Nein", next: "elektrik_12v_tot:a2" },
        ],
        result: null
      },
      "elektrik_12v_tot:a1": {
        q: "Sind Sicherungen am EBL / Hauptsicherung geprüft?",
        answers: [
          { t: "Ja", next: "elektrik_12v_tot:r1" },
          { t: "Nein", next: "elektrik_12v_tot:r2" },
        ],
        result: null
      },
      "elektrik_12v_tot:r1": {
        q: "",
        answers: [],
        result: "Weiter: Batterie-Spannung messen (Aufbaubatterie), EBL Eingang + Masse prüfen, ggf. Batterie-Trennschalter / Hauptschalter."
      },
      "elektrik_12v_tot:r2": {
        q: "",
        answers: [],
        result: "Sicherungen/Hauptsicherung prüfen und ggf. ersetzen. Danach erneut testen."
      },
      "elektrik_12v_tot:a2": {
        q: "",
        answers: [],
        result: "Ohne 230V: Batterie-Spannung prüfen, Hauptschalter, Sicherungen, Massepunkt, Ladebooster/Regler als Fehlerquelle ausschließen."
      },

      "elektrik_12v_teilweise:root": {
        q: "Sind die betroffenen Verbraucher immer die gleichen (z.B. nur Pumpe/Licht)?",
        answers: [
          { t: "Ja", next: "elektrik_12v_teilweise:r1" },
          { t: "Nein / wechselnd", next: "elektrik_12v_teilweise:r2" },
        ],
        result: null
      },
      "elektrik_12v_teilweise:r1": { q: "", answers: [], result: "Zielgerichtet: Sicherung/Leitung dieses Kreises prüfen. Bei Pumpe: Pumpschalter, Druckschalter, Steckverbindung, Masse." },
      "elektrik_12v_teilweise:r2": { q: "", answers: [], result: "Hinweis auf Unterspannung/Kontaktproblem: Batterie, Massepunkte, Hauptschalter, EBL-Stecker, Spannungsabfall unter Last messen." },

      "wasser_pumpe:root": {
        q: "Hörst du die Pumpe laufen, aber kein Druck?",
        answers: [
          { t: "Ja", next: "wasser_pumpe:r1" },
          { t: "Nein, keine Geräusche", next: "wasser_pumpe:r2" },
        ],
        result: null
      },
      "wasser_pumpe:r1": { q: "", answers: [], result: "Luft im System / Ansaugseite undicht: Tankfüllstand, Filter/Strainer, Schlauchschellen, Rückschlagventil, Entlüften." },
      "wasser_pumpe:r2": { q: "", answers: [], result: "12V an Pumpe messen (unter Last), Sicherung, Pumpenschalter, Druckschalter, Steckkontakt, Massepunkt prüfen." },
    }
  };
}

// ---------- Loading ----------
async function fetchText(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error(String(r.status));
  return await r.text();
}

async function loadDataset() {
  // 1) local override
  const override = localStorage.getItem(LS_CONTENT);
  if (override) {
    const parsed = safeJsonParse(override);
    if (parsed) {
      setStatus(state.lang === "de" ? "Content: lokal (Import)" : "Content: lokálny (Import)");
      return normalizeContent(parsed);
    }
  }

  // 2) preferred repo file (must be in /Klik/ root)
  try {
    const txt = await fetchText("content_full_with_fehlcodes_SK_DE.json");
    const parsed = safeJsonParse(txt);
    if (parsed) {
      setStatus(state.lang === "de" ? "Content: repo (full)" : "Content: repo (full)");
      return normalizeContent(parsed);
    }
  } catch (_) {}

  // 3) fallback content.json
  try {
    const txt = await fetchText("content.json");
    const parsed = safeJsonParse(txt);
    if (parsed) {
      setStatus(state.lang === "de" ? "Content: repo (content.json)" : "Content: repo (content.json)");
      return normalizeContent(parsed);
    }
  } catch (_) {}

  setStatus(state.lang === "de" ? "Content: Demo (Fallback)" : "Content: Demo (Fallback)");
  return demoContent();
}

// ---------- Rendering list ----------
function applyActiveChip() {
  const set = (btn, on) => btn.classList.toggle("active", !!on);
  set(ui.filterAll, state.filter === "all");
  set(ui.filterElektrik, state.filter === "elektrik");
  set(ui.filterWasser, state.filter === "wasser");
}

function filterList(items) {
  let out = items;

  if (state.filter !== "all") {
    out = out.filter(x => (x.category || "").toLowerCase() === state.filter);
  }

  const q = (state.query || "").trim().toLowerCase();
  if (q) {
    out = out.filter(x =>
      (x.title || "").toLowerCase().includes(q) ||
      (x.desc || "").toLowerCase().includes(q)
    );
  }

  return out;
}

function renderList() {
  ui.items.innerHTML = "";
  applyActiveChip();

  const visible = filterList(state.dataset.items || []);

  ui.noResults.classList.toggle("hidden", visible.length !== 0);

  for (const item of visible) {
    const card = document.createElement("div");
    card.className = "itemCard";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const t = document.createElement("div");
    t.className = "itemTitle";
    t.textContent = item.title || "";

    const d = document.createElement("p");
    d.className = "itemDesc";
    d.textContent = item.desc || "";

    card.appendChild(t);
    card.appendChild(d);

    const open = () => openTree(item);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") open();
    });

    ui.items.appendChild(card);
  }
}

// ---------- Tree navigation ----------
function showList() {
  ui.treeView.classList.add("hidden");
  ui.listView.classList.remove("hidden");
  state.currentTree = null;
  state.path = [];
  state.currentNodeId = null;
}

function showTree() {
  ui.listView.classList.add("hidden");
  ui.treeView.classList.remove("hidden");
}

function openTree(item) {
  if (!item || !item.root) {
    toast(state.lang === "de" ? "Tree ohne Root." : "Strom bez root.");
    return;
  }
  state.currentTree = item;
  state.path = [item.root];
  state.currentNodeId = item.root;

  ui.treeTitle.textContent = state.lang === "de" ? "Diagnose" : "Diagnostika";
  showTree();
  renderNode();
}

function currentNode() {
  return (state.dataset.nodes || {})[state.currentNodeId] || null;
}

function renderBreadcrumb() {
  const name = state.currentTree?.title || "";
  const p = state.path.length;
  ui.breadcrumb.textContent = name ? `${name}  •  ${p}` : "";
}

function renderNode() {
  renderBreadcrumb();
  ui.answersBox.innerHTML = "";
  ui.resultBox.classList.add("hidden");
  ui.resultBox.innerHTML = "";

  const node = currentNode();
  if (!node) {
    ui.questionBox.textContent = state.lang === "de" ? "Knoten nicht gefunden." : "Uzel nenajdeny.";
    return;
  }

  // If result node
  if (node.result && (!node.answers || node.answers.length === 0)) {
    ui.questionBox.textContent = state.lang === "de" ? "Ergebnis" : "Vysledok";
    ui.resultBox.classList.remove("hidden");
    ui.resultBox.innerHTML = `<div>${escapeHtml(node.result)}</div>`;
    return;
  }

  ui.questionBox.textContent = node.q || "";

  const answers = node.answers || [];
  for (const a of answers) {
    const btn = document.createElement("button");
    btn.className = "answerBtn";
    btn.type = "button";
    btn.textContent = a.t || "";

    btn.addEventListener("click", () => {
      if (a.next) {
        state.currentNodeId = a.next;
        state.path.push(a.next);
        renderNode();
        return;
      }
      // direct result
      if (a.result) {
        ui.resultBox.classList.remove("hidden");
        ui.resultBox.innerHTML = `<div>${escapeHtml(a.result)}</div>`;
        return;
      }
      toast(state.lang === "de" ? "Keine Aktion." : "Ziadna akcia.");
    });

    ui.answersBox.appendChild(btn);
  }
}

function goBack() {
  if (!state.path || state.path.length <= 1) {
    showList();
    return;
  }
  state.path.pop();
  state.currentNodeId = state.path[state.path.length - 1];
  renderNode();
}

// ---------- Text / i18n ----------
function applyLanguage() {
  const de = state.lang === "de";

  ui.langBtn.textContent = de ? "DE" : "SK";

  ui.brandSubtitle.textContent = de ? "Wohnmobil Diagnose" : "Diagnostika obytného auta";

  ui.listTitle.textContent = de ? "Störungen" : "Poruchy";
  ui.listHint.textContent = de ? "Wähle eine Störung oder suche. Funktioniert auch offline." : "Vyber poruchu alebo hľadaj. Funguje aj offline.";

  ui.searchInput.placeholder = de ? "Suche (Trittstufe, Wasserpumpe, 12V ...)" : "Hľadaj (schodík, pumpa, 12V ...)";
  ui.filterAll.textContent = de ? "Alle" : "Všetko";
  ui.filterElektrik.textContent = de ? "Elektrik" : "Elektrika";
  ui.filterWasser.textContent = de ? "Wasser" : "Voda";

  ui.noResultsTitle.textContent = de ? "Keine Treffer" : "Žiadne výsledky";
  ui.noResultsHint.textContent = de ? "Prüfe Filter oder Suche." : "Skontroluj filter alebo hľadanie.";

  ui.backBtn.textContent = de ? "← Zurück" : "← Späť";

  ui.versionLabel.textContent = VERSION;
}

// ---------- Admin actions ----------
function openAdmin() {
  // Admin is always allowed
  ui.adminDialog.showModal();
}

function closeAdmin() {
  ui.adminDialog.close();
}

async function importJsonFromFile(file) {
  const text = await file.text();
  const parsed = safeJsonParse(text);
  if (!parsed) {
    toast(state.lang === "de" ? "JSON ungültig." : "Neplatny JSON.");
    return;
  }
  localStorage.setItem(LS_CONTENT, JSON.stringify(parsed));
  toast(state.lang === "de" ? "Import OK." : "Import OK.");
  state.dataset = normalizeContent(parsed);
  showList();
  renderList();
}

function exportCurrentContent() {
  const obj = state.dataset || demoContent();
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "content_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function useRepoContent() {
  localStorage.removeItem(LS_CONTENT);
  toast(state.lang === "de" ? "Repo content aktiv." : "Repo content aktivny.");
  init(); // reload
}

// ---------- Reset ----------
function hardReset() {
  // keeps language, clears local content override only
  localStorage.removeItem(LS_CONTENT);
  toast(state.lang === "de" ? "Reset OK." : "Reset OK.");
  init();
}

// ---------- Escape ----------
function escapeHtml(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---------- Service worker ----------
function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ---------- Events ----------
function wireEvents() {
  ui.langBtn.addEventListener("click", () => {
    state.lang = state.lang === "de" ? "sk" : "de";
    localStorage.setItem(LS_LANG, state.lang);
    applyLanguage();
    renderList();
    if (!ui.treeView.classList.contains("hidden")) renderNode();
  });

  ui.adminBtn.addEventListener("click", openAdmin);
  ui.adminCloseBtn.addEventListener("click", closeAdmin);
  ui.resetBtn.addEventListener("click", () => {
    // bez confirm okna – okamžitý reset
    hardReset();
  });

  ui.searchInput.addEventListener("input", (e) => {
    state.query = e.target.value || "";
    renderList();
  });

  ui.filterAll.addEventListener("click", () => { state.filter = "all"; renderList(); });
  ui.filterElektrik.addEventListener("click", () => { state.filter = "elektrik"; renderList(); });
  ui.filterWasser.addEventListener("click", () => { state.filter = "wasser"; renderList(); });

  ui.backBtn.addEventListener("click", goBack);

  // Admin controls: password ignored, always unlocked
  ui.unlockBtn.addEventListener("click", () => toast(state.lang === "de" ? "Admin unlocked." : "Admin odomknuty."));
  ui.lockBtn.addEventListener("click", () => toast(state.lang === "de" ? "Admin is always on." : "Admin je stale aktivny."));

  ui.importFile.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    await importJsonFromFile(f);
    // reset file input so same file can be re-imported
    ui.importFile.value = "";
  });

  ui.exportBtn.addEventListener("click", exportCurrentContent);
  ui.useRepoBtn.addEventListener("click", useRepoContent);
}

// ---------- Init ----------
async function init() {
  applyLanguage();
  setStatus(state.lang === "de" ? "Lade…" : "Nahravam…");

  state.dataset = await loadDataset();

  // Safety: if dataset broken, fallback demo
  if (!state.dataset || !Array.isArray(state.dataset.items) || !isObject(state.dataset.nodes)) {
    state.dataset = demoContent();
  }

  setStatus(state.statusLabel || "");
  showList();
  renderList();
  registerSW();
}

wireEvents();
init();
