/* CaravanTechniker am Main – PWA Diagnostic
 * app.js – tree engine restored (tolerant parser)
 * VERSION: 0.3.1
 */

const VERSION = "0.3.1";
const STORAGE_KEY = "ctam_state_v1";
const LANG_KEY = "ctam_lang_v1";
const ADMIN_KEY = "ctam_admin_v1";

// !!! zmeň si PIN ak chceš
const ADMIN_PIN = "2468";

// ---------- helpers ----------
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const el = (tag, attrs = {}, children = []) => {
  const n = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k === "style") n.setAttribute("style", v);
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) n.setAttribute(k, String(v));
  });
  (children || []).forEach((c) => {
    if (c === null || c === undefined) return;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return n;
};

const safeJsonParse = (x) => {
  try { return JSON.parse(x); } catch { return null; }
};

const nowIso = () => new Date().toISOString();

// ---------- i18n (minimal) ----------
const I18N = {
  de: {
    title: "CaravanTechniker am Main",
    sub: "Wohnmobil Diagnose",
    search: "Suche (trittstufe, wasserpumpe, 12V...)",
    pickCat: "Wähle oben eine Kategorie. Dann eine Störung auswählen.",
    pickFault: "Wähle oben eine Störung. Dann JA / NEIN klicken.",
    yes: "JA",
    no: "NEIN",
    back: "Zurück",
    reset: "RESET",
    admin: "ADMIN",
    adminOn: "Admin: AN",
    adminOff: "Admin: AUS",
    pinTitle: "Admin PIN",
    pinHint: "PIN eingeben",
    pinBad: "Falscher PIN.",
    loadErr: "Fehler beim Laden von content.json",
    dataInfo: "Daten geladen",
    noResults: "Keine Ergebnisse",
    end: "Fertig",
    showAll: "Alle",
    hint: "Hinweis",
  },
  sk: {
    title: "CaravanTechniker am Main",
    sub: "Diagnostika obytného auta",
    search: "Hľadať (trittstufe, wasserpumpe, 12V...)",
    pickCat: "Vyber hore kategóriu. Potom vyber poruchu.",
    pickFault: "Vyber poruchu a potom klikaj ÁNO / NIE.",
    yes: "ÁNO",
    no: "NIE",
    back: "Späť",
    reset: "RESET",
    admin: "ADMIN",
    adminOn: "Admin: ZAP",
    adminOff: "Admin: VYP",
    pinTitle: "Admin PIN",
    pinHint: "Zadaj PIN",
    pinBad: "Zlý PIN.",
    loadErr: "Chyba pri načítaní content.json",
    dataInfo: "Dáta načítané",
    noResults: "Žiadne výsledky",
    end: "Hotovo",
    showAll: "Všetko",
    hint: "Tip",
  }
};

function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) || (I18N.de[key]) || key;
}

function getLang() {
  return localStorage.getItem(LANG_KEY) || "de";
}
function setLang(v) {
  localStorage.setItem(LANG_KEY, v);
}

// ---------- state ----------
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const st = safeJsonParse(raw);
  return st && typeof st === "object" ? st : {
    cat: null,
    q: "",

    // selection
    faultId: null,

    // tree navigation
    nodeId: null,
    path: [], // array of { nodeId, answer: "yes"|"no" }
  };
}
function saveState(st) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
}

function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === "1";
}
function setAdmin(v) {
  localStorage.setItem(ADMIN_KEY, v ? "1" : "0");
}

// ---------- data normalization ----------
//
// Podporované vstupy (tolerantne):
// 1) Array: [{ id, category, title, subtitle, tree?... }]
// 2) Object: { faults: [...] }
// 3) Object: { categories: { Elektrik:[...], Wasser:[...] } }
// 4) Strom môže byť:
//    a) { rootId, nodes:[{id,text,yes,no,message,done}] }
//    b) { root, nodesById:{...} }
//    c) nested: { q/text/question, yes:{...}, no:{...}, message/done }
//
// Všetko prevedieme na:
// data = { faults:[{id,category,title,subtitle,tree:{rootId,nodesById}}], categories:[...]}.
//
function normalizeContent(raw) {
  let faults = [];

  if (Array.isArray(raw)) {
    faults = raw;
  } else if (raw && Array.isArray(raw.faults)) {
    faults = raw.faults;
  } else if (raw && raw.categories && typeof raw.categories === "object") {
    Object.entries(raw.categories).forEach(([cat, arr]) => {
      (arr || []).forEach((it) => faults.push({ ...it, category: it.category || cat }));
    });
  } else if (raw && raw.items && Array.isArray(raw.items)) {
    faults = raw.items;
  } else {
    // fallback: ak je to niečo iné, nechaj prázdne
    faults = [];
  }

  // ensure IDs + basic fields
  faults = faults.map((f, idx) => {
    const id = f.id || f.key || f.slug || `${(f.category || "cat").toString().toLowerCase()}_${idx}`;
    const category = f.category || f.cat || "Other";
    const title = f.title || f.name || f.fault || f.problem || `Fault ${idx + 1}`;
    const subtitle = f.subtitle || f.desc || f.description || "";
    const tree = normalizeTree(f.tree || f.flow || f.decisionTree || f.diagnose || null);
    return { ...f, id, category, title, subtitle, tree };
  });

  const categories = Array.from(new Set(faults.map(f => f.category))).sort((a,b)=>a.localeCompare(b));

  return { faults, categories, raw };
}

function normalizeTree(tree) {
  if (!tree) return null;

  // a) {rootId, nodes:[...]}
  if (tree.rootId && Array.isArray(tree.nodes)) {
    const nodesById = {};
    tree.nodes.forEach(n => { if (n && n.id) nodesById[n.id] = normalizeNode(n); });
    return { rootId: tree.rootId, nodesById };
  }

  // b) {root, nodesById}
  if ((tree.root || tree.rootId) && tree.nodesById && typeof tree.nodesById === "object") {
    const rootId = tree.rootId || tree.root;
    const nodesById = {};
    Object.entries(tree.nodesById).forEach(([id, n]) => { nodesById[id] = normalizeNode({ id, ...n }); });
    return { rootId, nodesById };
  }

  // c) nested tree
  if (typeof tree === "object") {
    const built = buildFromNested(tree);
    if (built) return built;
  }

  return null;
}

function normalizeNode(n) {
  // accept text/question/q
  const text = n.text ?? n.question ?? n.q ?? n.title ?? "";
  const hint = n.hint ?? n.tip ?? n.help ?? "";
  const message = n.message ?? n.msg ?? n.result ?? n.out ?? "";
  const done = Boolean(n.done ?? n.end ?? n.final ?? false);

  // yes/no can be: id string OR object OR array OR message
  return {
    id: n.id,
    text,
    hint,
    message,
    done,
    yes: n.yes ?? n.ja ?? n.true ?? null,
    no: n.no ?? n.nein ?? n.false ?? null,
  };
}

function buildFromNested(rootObj) {
  // find root question
  const rootText = rootObj.text ?? rootObj.question ?? rootObj.q;
  const rootMsg = rootObj.message ?? rootObj.msg ?? rootObj.result;
  const rootDone = Boolean(rootObj.done ?? rootObj.end ?? false);

  // if no tree-like keys, abort
  const hasBranch = ("yes" in rootObj) || ("no" in rootObj) || ("ja" in rootObj) || ("nein" in rootObj);
  if (!hasBranch && !rootText && !rootMsg) return null;

  let seq = 0;
  const nodesById = {};

  function walk(obj) {
    seq += 1;
    const id = obj.id || `n${seq}`;
    const node = normalizeNode({ id, ...obj, yes: obj.yes ?? obj.ja, no: obj.no ?? obj.nein });
    nodesById[id] = node;

    // branches can be nested objects => convert to ids
    const y = obj.yes ?? obj.ja;
    const n = obj.no ?? obj.nein;

    if (y && typeof y === "object") {
      const yid = walk(y);
      nodesById[id].yes = yid;
    }
    if (n && typeof n === "object") {
      const nid = walk(n);
      nodesById[id].no = nid;
    }
    return id;
  }

  const rootId = walk(rootObj);
  return { rootId, nodesById };
}

// ---------- UI ----------
function injectBaseStyles() {
  const css = `
    :root { --bg:#b9d8ee; --card:#ffffffcc; --text:#0b2233; --muted:#476a7f; --line:#cfe7f5; --btn:#ffffff; --shadow:0 10px 30px rgba(0,0,0,.12); }
    * { box-sizing:border-box; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; background: var(--bg); color: var(--text); }
    .wrap { max-width: 900px; margin: 0 auto; padding: 18px 14px 40px; }
    .top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .h1 { font-size: 44px; font-weight: 900; letter-spacing: -0.5px; line-height: 1.0; margin:0; }
    .h2 { font-size: 22px; font-weight: 700; margin: 6px 0 0; color: var(--muted); }
    .pillRow { display:flex; gap:10px; align-items:center; justify-content:flex-end; flex-wrap:wrap; }
    .pill { border:0; padding:10px 14px; border-radius:999px; background: var(--btn); box-shadow: var(--shadow); font-weight:700; cursor:pointer; }
    .pill.small { padding:8px 12px; font-weight:800; }
    .card { margin-top: 16px; background: var(--card); border-radius: 24px; padding: 16px; box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,.04); }
    .cardTitle { font-size: 50px; margin: 0; font-weight: 900; letter-spacing: -1px; }
    .hintBox { margin-top: 10px; padding: 10px 12px; border-radius: 14px; background: rgba(255,255,255,.65); border: 1px solid rgba(0,0,0,.06); }
    .muted { color: var(--muted); font-weight: 650; }
    .search { width:100%; padding: 14px 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,.12); outline: none; font-size: 16px; background: rgba(255,255,255,.92); }
    .cats { display:flex; gap:10px; flex-wrap:wrap; margin-top: 10px; }
    .catBtn { border:0; padding: 10px 14px; border-radius: 999px; background: rgba(255,255,255,.75); cursor:pointer; font-weight:800; }
    .catBtn.active { outline: 3px solid rgba(0,0,0,.14); background: rgba(255,255,255,.95); }
    .faultList { margin-top: 12px; display:flex; flex-direction:column; gap: 12px; }
    .faultItem { background: rgba(255,255,255,.78); border: 1px solid rgba(0,0,0,.07); border-radius: 18px; padding: 14px 14px; cursor:pointer; }
    .faultItem.active { outline: 3px solid rgba(11,34,51,.22); background: rgba(255,255,255,.92); }
    .faultTitle { margin:0; font-size: 18px; font-weight: 900; }
    .faultSub { margin:6px 0 0; color: var(--muted); font-weight: 650; }
    .diag { margin-top: 16px; background: var(--card); border-radius: 24px; padding: 16px; box-shadow: var(--shadow); border: 1px solid rgba(0,0,0,.04); }
    .diagTitle { font-size: 44px; margin: 0; font-weight: 900; letter-spacing: -0.7px; }
    .qText { margin: 14px 0 0; font-size: 20px; font-weight: 850; }
    .crumb { margin-top: 10px; font-size: 13px; color: var(--muted); font-weight: 650; }
    .btnRow { margin-top: 14px; display:flex; gap: 12px; align-items:center; }
    .btn { flex: 1; border:0; padding: 18px 16px; border-radius: 18px; font-size: 24px; font-weight: 950; cursor:pointer; box-shadow: var(--shadow); }
    .btn.yes { background: #1f8a3b; color: #fff; }
    .btn.no { background: #b40f0f; color: #fff; }
    .btn.secondary { background: rgba(255,255,255,.92); color: var(--text); font-size: 16px; font-weight: 900; padding: 12px 14px; border-radius: 14px; flex: 0 0 auto; }
    .result { margin-top: 14px; padding: 12px 12px; border-radius: 16px; background: rgba(255,255,255,.75); border: 1px solid rgba(0,0,0,.07); }
    .ver { margin-top: 10px; font-weight: 900; color: rgba(11,34,51,.55); }
    .adminBox { margin-top: 12px; padding: 12px; border-radius: 16px; border: 1px dashed rgba(0,0,0,.18); background: rgba(255,255,255,.55); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
    a { color: inherit; }
  `;
  const s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
}

function buildAppShell() {
  const root = document.getElementById("app") || document.body.appendChild(el("div", { id: "app" }));
  root.innerHTML = "";
  injectBaseStyles();

  const wrap = el("div", { class: "wrap" });

  const left = el("div", {}, [
    el("h1", { class: "h1" }, [t("title")]),
    el("div", { class: "h2" }, [t("sub")]),
  ]);

  const langSel = el("button", { class: "pill small", id: "langBtn" }, [getLang().toUpperCase()]);
  const adminBtn = el("button", { class: "pill small", id: "adminBtn" }, [t("admin")]);
  const resetBtn = el("button", { class: "pill small", id: "resetBtn" }, [t("reset")]);
  const right = el("div", { class: "pillRow" }, [langSel, adminBtn, resetBtn]);

  const top = el("div", { class: "top" }, [left, right]);

  const stCard = el("div", { class: "card" }, [
    el("div", { class: "cardTitle" }, ["Störungen"]),
    el("div", { class: "muted", style: "margin-top:6px" }, [t("pickCat")]),
    el("div", { class: "hintBox", id: "topHint" }, [t("pickFault")]),
    el("input", { class: "search", id: "search", placeholder: t("search") }),
    el("div", { class: "cats", id: "cats" }),
    el("div", { class: "faultList", id: "faultList" }),
    el("div", { class: "ver" }, [`v${VERSION}`]),
    el("div", { class: "adminBox", id: "adminBox", style: "display:none" }, [""]),
  ]);

  const diag = el("div", { class: "diag" }, [
    el("div", { class: "diagTitle" }, ["Diagnose"]),
    el("div", { class: "muted", style: "margin-top:6px" }, [t("pickFault")]),
    el("div", { class: "qText", id: "qText" }, ["—"]),
    el("div", { class: "crumb", id: "crumb" }, [""]),
    el("div", { class: "btnRow" }, [
      el("button", { class: "btn secondary", id: "backBtn" }, [t("back")]),
      el("button", { class: "btn yes", id: "yesBtn" }, [t("yes")]),
      el("button", { class: "btn no", id: "noBtn" }, [t("no")]),
    ]),
    el("div", { class: "result", id: "resultBox", style: "display:none" }, [""]),
  ]);

  wrap.appendChild(top);
  wrap.appendChild(stCard);
  wrap.appendChild(diag);
  root.appendChild(wrap);

  return { root };
}

// ---------- engine ----------
let APP = {
  data: null,      // normalized data
  state: loadState()
};

async function loadContent() {
  // cache-buster + no-store
  const url = `content.json?v=${encodeURIComponent(VERSION)}&t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${t("loadErr")} (HTTP ${res.status})`);
  const raw = await res.json();
  return normalizeContent(raw);
}

function getFaultById(id) {
  if (!APP.data) return null;
  return APP.data.faults.find(f => f.id === id) || null;
}

function getActiveFaultsFiltered() {
  const st = APP.state;
  const q = (st.q || "").trim().toLowerCase();

  let arr = APP.data ? [...APP.data.faults] : [];
  if (st.cat && st.cat !== "__ALL__") {
    arr = arr.filter(f => f.category === st.cat);
  }
  if (q) {
    arr = arr.filter(f => {
      const s = `${f.category} ${f.title} ${f.subtitle}`.toLowerCase();
      return s.includes(q);
    });
  }
  // stable sort: title
  arr.sort((a,b)=>String(a.title).localeCompare(String(b.title)));
  return arr;
}

function setCategory(cat) {
  APP.state.cat = cat;
  // if selected fault not in cat, clear selection
  const fault = getFaultById(APP.state.faultId);
  if (fault && cat && cat !== "__ALL__" && fault.category !== cat) {
    APP.state.faultId = null;
    APP.state.nodeId = null;
    APP.state.path = [];
  }
  saveState(APP.state);
  renderAll();
}

function setSearch(q) {
  APP.state.q = q;
  saveState(APP.state);
  renderFaultList();
}

function selectFault(faultId) {
  const f = getFaultById(faultId);
  APP.state.faultId = faultId;
  APP.state.path = [];
  if (f && f.tree && f.tree.rootId) {
    APP.state.nodeId = f.tree.rootId;
  } else {
    APP.state.nodeId = null;
  }
  saveState(APP.state);
  renderAll();
}

function currentNode() {
  const f = getFaultById(APP.state.faultId);
  if (!f || !f.tree || !APP.state.nodeId) return null;
  return f.tree.nodesById[APP.state.nodeId] || null;
}

function follow(answer /* "yes"|"no" */) {
  const f = getFaultById(APP.state.faultId);
  const n = currentNode();
  if (!f || !n) return;

  const nextRef = answer === "yes" ? n.yes : n.no;

  // push history
  APP.state.path.push({ nodeId: APP.state.nodeId, answer });
  // resolve next:
  if (typeof nextRef === "string") {
    APP.state.nodeId = nextRef;
  } else if (typeof nextRef === "number") {
    APP.state.nodeId = String(nextRef);
  } else if (typeof nextRef === "object" && nextRef) {
    // nested node object -> convert on the fly into nodesById
    const tmp = buildFromNested(nextRef);
    if (tmp && tmp.rootId) {
      // merge nodes into current tree
      Object.assign(f.tree.nodesById, tmp.nodesById);
      APP.state.nodeId = tmp.rootId;
    } else {
      APP.state.nodeId = null;
    }
  } else {
    // end if no branch
    APP.state.nodeId = null;
  }

  saveState(APP.state);
  renderDiagnosis();
}

function stepBack() {
  const f = getFaultById(APP.state.faultId);
  if (!f) return;

  const prev = APP.state.path.pop();
  if (!prev) {
    // if no history, go to root if exists, else clear node
    if (f.tree && f.tree.rootId) APP.state.nodeId = f.tree.rootId;
    else APP.state.nodeId = null;
  } else {
    APP.state.nodeId = prev.nodeId;
  }
  saveState(APP.state);
  renderDiagnosis();
}

function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  // admin/lang ponechaj, nech nemusíš furt nastavovať
  APP.state = loadState();
  renderAll();
}

// ---------- rendering ----------
function renderCats() {
  const catsEl = qs("#cats");
  catsEl.innerHTML = "";

  const st = APP.state;
  const cats = APP.data ? APP.data.categories : [];

  const allBtn = el("button", {
    class: `catBtn ${(!st.cat || st.cat === "__ALL__") ? "active" : ""}`,
    onclick: () => setCategory("__ALL__")
  }, [t("showAll")]);

  catsEl.appendChild(allBtn);

  cats.forEach((c) => {
    const btn = el("button", {
      class: `catBtn ${(st.cat === c) ? "active" : ""}`,
      onclick: () => setCategory(c)
    }, [c]);
    catsEl.appendChild(btn);
  });
}

function renderFaultList() {
  const listEl = qs("#faultList");
  listEl.innerHTML = "";

  const arr = APP.data ? getActiveFaultsFiltered() : [];
  if (!arr.length) {
    listEl.appendChild(el("div", { class: "muted", style:"padding:8px 4px" }, [t("noResults")]));
    return;
  }

  arr.forEach((f) => {
    const active = APP.state.faultId === f.id;
    const item = el("div", {
      class: `faultItem ${active ? "active" : ""}`,
      onclick: () => selectFault(f.id)
    }, [
      el("div", { class: "faultTitle" }, [f.title]),
      el("div", { class: "faultSub" }, [f.subtitle || ""]),
    ]);
    listEl.appendChild(item);
  });
}

function renderDiagnosis() {
  const qEl = qs("#qText");
  const crumb = qs("#crumb");
  const result = qs("#resultBox");
  const backBtn = qs("#backBtn");
  const yesBtn = qs("#yesBtn");
  const noBtn = qs("#noBtn");

  const f = getFaultById(APP.state.faultId);

  // no selection
  if (!f) {
    qEl.textContent = "—";
    crumb.textContent = "";
    result.style.display = "none";
    backBtn.disabled = true;
    yesBtn.disabled = true;
    noBtn.disabled = true;
    return;
  }

  // breadcrumb
  const parts = [];
  parts.push(f.category);
  parts.push(f.title);
  if (APP.state.path.length) {
    parts.push(APP.state.path.map(p => (p.answer === "yes" ? t("yes") : t("no"))).join(" › "));
  }
  crumb.textContent = parts.filter(Boolean).join(" • ");

  // tree mode
  if (f.tree && f.tree.rootId) {
    const node = currentNode();

    backBtn.disabled = false;
    yesBtn.disabled = false;
    noBtn.disabled = false;

    if (!node) {
      // end state – show fault subtitle or end message
      qEl.textContent = t("end");
      const msg = (f.subtitle || "");
      result.textContent = msg ? msg : t("end");
      result.style.display = "block";
      yesBtn.disabled = true;
      noBtn.disabled = true;
      return;
    }

    // question
    qEl.textContent = node.text || f.title;

    // show hint/message if exists (non-final)
    const msg = (node.hint ? `${t("hint")}: ${node.hint}` : "") || (node.message || "");
    if (msg) {
      result.textContent = msg;
      result.style.display = "block";
    } else {
      result.style.display = "none";
    }

    // if node.done -> disable yes/no
    if (node.done) {
      yesBtn.disabled = true;
      noBtn.disabled = true;
    }

    return;
  }

  // fallback – no tree in this fault
  backBtn.disabled = true;
  yesBtn.disabled = true;
  noBtn.disabled = true;

  qEl.textContent = f.title;
  result.textContent = f.subtitle || "";
  result.style.display = result.textContent ? "block" : "none";
}

function renderAdminBox() {
  const box = qs("#adminBox");
  if (!isAdmin()) {
    box.style.display = "none";
    return;
  }
  box.style.display = "block";

  const st = APP.state;
  const fault = getFaultById(st.faultId);

  const debug = {
    version: VERSION,
    time: nowIso(),
    lang: getLang(),
    selectedFault: fault ? { id: fault.id, category: fault.category, title: fault.title, hasTree: Boolean(fault.tree && fault.tree.rootId) } : null,
    nodeId: st.nodeId,
    pathLen: st.path.length,
    faultsCount: APP.data ? APP.data.faults.length : 0,
    categories: APP.data ? APP.data.categories : [],
  };

  box.textContent =
`ADMIN DEBUG
${JSON.stringify(debug, null, 2)}

TIP:
- Ak sa UI zasekne po PWA, klikni RESET (čistí len state) a refreshni.
- content.json sa načítava no-store + cache-buster, takže staré dáta by sa nemali držať.
`;
}

function renderAll() {
  if (!APP.data) return;
  // cats
  renderCats();
  // search input sync
  const s = qs("#search");
  if (s && s.value !== (APP.state.q || "")) s.value = APP.state.q || "";
  // list
  renderFaultList();
  // diagnosis
  renderDiagnosis();
  // admin
  renderAdminBox();
}

// ---------- UI wiring ----------
function wireUi() {
  // language
  qs("#langBtn").addEventListener("click", () => {
    const cur = getLang();
    const next = cur === "de" ? "sk" : "de";
    setLang(next);

    // rebuild whole UI text
    APP.state = loadState(); // keep state
    buildAppShell();
    wireUi();
    renderAll();
    qs("#langBtn").textContent = next.toUpperCase();
  });

  // admin
  qs("#adminBtn").addEventListener("click", () => {
    if (isAdmin()) {
      setAdmin(false);
      renderAdminBox();
      return;
    }
    const pin = prompt(`${t("pinTitle")} – ${t("pinHint")}`);
    if (pin === ADMIN_PIN) {
      setAdmin(true);
      renderAdminBox();
    } else if (pin !== null) {
      alert(t("pinBad"));
    }
  });

  // reset state
  qs("#resetBtn").addEventListener("click", () => {
    resetAll();
  });

  // search
  qs("#search").addEventListener("input", (e) => setSearch(e.target.value));

  // nav buttons
  qs("#backBtn").addEventListener("click", () => stepBack());
  qs("#yesBtn").addEventListener("click", () => follow("yes"));
  qs("#noBtn").addEventListener("click", () => follow("no"));

  // enable keyboard quick nav (optional)
  window.addEventListener("keydown", (e) => {
    if (!APP.state.faultId) return;
    if (e.key === "ArrowLeft") stepBack();
    if (e.key === "y" || e.key === "Y") follow("yes");
    if (e.key === "n" || e.key === "N") follow("no");
  });
}

// ---------- boot ----------
(async function main() {
  console.log("APP.JS LOADED", VERSION, nowIso());

  buildAppShell();
  wireUi();

  try {
    APP.data = await loadContent();
    console.log(t("dataInfo"), { faults: APP.data.faults.length, categories: APP.data.categories.length });
    renderAll();

    // restore selected fault tree state sanity
    const f = getFaultById(APP.state.faultId);
    if (f && f.tree && f.tree.rootId && !APP.state.nodeId) {
      APP.state.nodeId = f.tree.rootId;
      saveState(APP.state);
      renderDiagnosis();
    }
  } catch (err) {
    console.error(err);
    const appRoot = document.getElementById("app");
    if (appRoot) {
      appRoot.innerHTML = "";
      appRoot.appendChild(el("div", { class: "wrap" }, [
        el("div", { class: "card" }, [
          el("div", { class: "cardTitle" }, ["ERROR"]),
          el("div", { class: "muted", style:"margin-top:10px" }, [String(err && err.message ? err.message : err)]),
          el("div", { class: "adminBox", style:"margin-top:12px" }, [
            "Skontroluj, či content.json existuje v repozitári a je public na GitHub Pages.\n" +
            "Tip: Ak si menil názov súboru/umiestnenie, musí sedieť cesta: ./content.json\n"
          ])
        ])
      ]));
    }
  }
})();
