/* CaravanTechniker am Main - minimal stable (2 trees, full branching)
   Data source priority:
   1) localStorage override (admin import)
   2) repo file: content.json
*/
(() => {
  "use strict";

  const VERSION = "v0.6.0";

  const LS_CONTENT = "ct_content_override_v1";
  const LS_LANG = "ct_lang_v1";
  const LS_FILTER = "ct_filter_v1";
  const LS_ADMIN_UNLOCK = "ct_admin_unlock_v1";

  const el = (id) => document.getElementById(id);

  const ui = {
    versionLabel: el("versionLabel"),
    langBtn: el("langBtn"),
    adminBtn: el("adminBtn"),
    resetBtn: el("resetBtn"),

    listView: el("listView"),
    treeView: el("treeView"),
    cards: el("cards"),
    emptyState: el("emptyState"),

    listTitle: el("listTitle"),
    listHint: el("listHint"),
    searchInput: el("searchInput"),
    filterAll: el("filterAll"),
    filterElektrik: el("filterElektrik"),
    filterWasser: el("filterWasser"),

    backToList: el("backToList"),
    treeHeader: el("treeHeader"),
    treePath: el("treePath"),
    nodeBox: el("nodeBox"),
    answersBox: el("answersBox"),

    adminDialog: el("adminDialog"),
    adminPwd: el("adminPwd"),
    unlockBtn: el("unlockBtn"),
    lockBtn: el("lockBtn"),
    importFile: el("importFile"),
    useRepoBtn: el("useRepoBtn"),
    exportBtn: el("exportBtn"),

    toast: el("toast"),
    brandTitle: el("brandTitle"),
    brandSub: el("brandSub"),
    pwdLabel: el("pwdLabel"),
    adminHint: el("adminHint"),
    emptyTitle: el("emptyTitle"),
    emptyText: el("emptyText"),
  };

  let state = {
    data: null,
    lang: (localStorage.getItem(LS_LANG) || "de"),
    filter: (localStorage.getItem(LS_FILTER) || "all"),
    query: "",
    currentTree: null,
    currentNodeId: null,
    stack: [],
  };

  function toast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => ui.toast.classList.add("hidden"), 1800);
  }

  function t(mapOrString) {
    if (mapOrString == null) return "";
    if (typeof mapOrString === "string") return mapOrString;
    return mapOrString[state.lang] ?? mapOrString.de ?? Object.values(mapOrString)[0] ?? "";
  }

  function applyI18n() {
    ui.brandTitle.textContent = "CaravanTechniker am Main";
    ui.brandSub.textContent = "Wohnmobil Diagnose";

    if (state.lang === "sk") {
      ui.listTitle.textContent = "Poruchy";
      ui.listHint.textContent = "Vyber poruchu alebo hľadaj. Funguje aj offline.";
      ui.searchInput.placeholder = "Hľadať (schodík, vodná pumpa, 12V ...)";
      ui.filterAll.textContent = "Všetko";
      ui.filterElektrik.textContent = "Elektrika";
      ui.filterWasser.textContent = "Voda";
      ui.treeHeader.textContent = "Diagnostika";
      ui.backToList.textContent = "← Späť";
      ui.pwdLabel.textContent = "Heslo";
      ui.adminHint.textContent = "Import sa uloží lokálne do zariadenia (localStorage). Nezničí repo súbory.";
      ui.emptyTitle.textContent = "Bez výsledkov";
      ui.emptyText.textContent = "Skontroluj filter alebo hľadanie.";
    } else {
      ui.listTitle.textContent = "Störungen";
      ui.listHint.textContent = "Wähle eine Störung oder suche. Funktioniert auch offline.";
      ui.searchInput.placeholder = "Suche (Trittstufe, Wasserpumpe, 12V ...)";
      ui.filterAll.textContent = "Alle";
      ui.filterElektrik.textContent = "Elektrik";
      ui.filterWasser.textContent = "Wasser";
      ui.treeHeader.textContent = "Diagnose";
      ui.backToList.textContent = "← Zurück";
      ui.pwdLabel.textContent = "Passwort";
      ui.adminHint.textContent = "Import wird lokal im Gerät gespeichert (localStorage). Repo-Dateien bleiben unverändert.";
      ui.emptyTitle.textContent = "Keine Treffer";
      ui.emptyText.textContent = "Prüfe Filter oder Suche.";
    }

    ui.langBtn.textContent = state.lang.toUpperCase();
  }

  function setLang(next) {
    state.lang = next;
    localStorage.setItem(LS_LANG, state.lang);
    applyI18n();
    renderList();
    if (state.currentTree) renderNode();
  }

  async function loadData() {
    const override = localStorage.getItem("ct_content_override_v1");
    if (override) {
      try { state.data = JSON.parse(override); return; } catch (_) { localStorage.removeItem("ct_content_override_v1"); }
    }
    const res = await fetch("content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("content.json load failed");
    state.data = await res.json();
  }

  function normalizeTrees(raw) {
    const trees = (raw?.trees || []);
    return trees.map(tr => ({
      id: tr.id,
      category: tr.category || "andere",
      title: tr.title,
      desc: tr.desc,
      start: tr.start,
      nodes: tr.nodes || {}
    }));
  }

  function setFilter(filter) {
    state.filter = filter;
    localStorage.setItem(LS_FILTER, state.filter);
    for (const btn of document.querySelectorAll(".chip")) btn.classList.remove("chip--active");
    const active = document.querySelector(`.chip[data-filter="${filter}"]`);
    if (active) active.classList.add("chip--active");
    renderList();
  }

  function filterTrees(trees) {
    const q = (state.query || "").trim().toLowerCase();
    return trees.filter(tr => {
      if (state.filter !== "all" && tr.category !== state.filter) return false;
      if (!q) return true;
      const hay = (t(tr.title) + " " + t(tr.desc)).toLowerCase();
      return hay.includes(q);
    });
  }

  function renderList() {
    const trees = normalizeTrees(state.data);
    const visible = filterTrees(trees);
    ui.cards.innerHTML = "";
    ui.emptyState.classList.toggle("hidden", visible.length !== 0);

    for (const tr of visible) {
      const card = document.createElement("div");
      card.className = "cardItem";
      card.tabIndex = 0;

      const title = document.createElement("div");
      title.className = "cardItem__title";
      title.textContent = t(tr.title);

      const desc = document.createElement("div");
      desc.className = "cardItem__desc";
      desc.textContent = t(tr.desc);

      card.appendChild(title);
      card.appendChild(desc);

      const open = () => openTree(tr.id);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });

      ui.cards.appendChild(card);
    }
  }

  function openTree(treeId) {
    const tr = normalizeTrees(state.data).find(x => x.id === treeId);
    if (!tr) return;

    state.currentTree = tr;
    state.currentNodeId = tr.start;
    state.stack = [];

    ui.listView.classList.add("hidden");
    ui.treeView.classList.remove("hidden");

    ui.treePath.textContent = t(tr.title);
    renderNode();
  }

  function renderNode() {
    const tr = state.currentTree;
    if (!tr) return;

    const node = tr.nodes?.[state.currentNodeId];
    if (!node) {
      ui.nodeBox.textContent = state.lang === "sk" ? "Chýba uzol v strome." : "Knoten fehlt im Baum.";
      ui.answersBox.innerHTML = "";
      const b = document.createElement("button");
      b.className = "answerBtn answerBtn--ok";
      b.textContent = "OK";
      b.addEventListener("click", backToList);
      ui.answersBox.appendChild(b);
      return;
    }

    ui.nodeBox.textContent = t(node.text);
    ui.answersBox.innerHTML = "";

    if (node.type === "question") {
      const answers = Array.isArray(node.answers) ? node.answers : [];
      for (const a of answers) {
        const btn = document.createElement("button");
        btn.className = "answerBtn";
        btn.textContent = t(a.label);
        btn.addEventListener("click", () => {
          state.stack.push(state.currentNodeId);
          state.currentNodeId = a.next;
          renderNode();
        });
        ui.answersBox.appendChild(btn);
      }

      if (state.stack.length) {
        const backBtn = document.createElement("button");
        backBtn.className = "answerBtn answerBtn--ok";
        backBtn.textContent = state.lang === "sk" ? "Späť o krok" : "Einen Schritt zurück";
        backBtn.addEventListener("click", () => {
          state.currentNodeId = state.stack.pop();
          renderNode();
        });
        ui.answersBox.appendChild(backBtn);
      }
    } else {
      const ok = document.createElement("button");
      ok.className = "answerBtn answerBtn--ok";
      ok.textContent = "OK";
      ok.addEventListener("click", backToList);
      ui.answersBox.appendChild(ok);
    }
  }

  function backToList() {
    state.currentTree = null;
    state.currentNodeId = null;
    state.stack = [];
    ui.treeView.classList.add("hidden");
    ui.listView.classList.remove("hidden");
  }

  function resetAll() {
    localStorage.removeItem("ct_content_override_v1");
    localStorage.removeItem("ct_filter_v1");
    toast(state.lang === "sk" ? "Reset hotový." : "Reset erledigt.");
    location.reload();
  }

  function isUnlocked() { return localStorage.getItem(LS_ADMIN_UNLOCK) === "1"; }

  ui.adminBtn.addEventListener("click", () => {
    ui.adminPwd.value = "";
    ui.adminDialog.showModal();
  });

  ui.unlockBtn.addEventListener("click", () => {
    const pwd = (ui.adminPwd.value || "").trim();
    if (pwd.length >= 4) {
      localStorage.setItem(LS_ADMIN_UNLOCK, "1");
      toast(state.lang === "sk" ? "Admin odomknutý." : "Admin unlocked.");
    } else {
      toast(state.lang === "sk" ? "Heslo je krátke." : "Password too short.");
    }
  });

  ui.lockBtn.addEventListener("click", () => {
    localStorage.setItem(LS_ADMIN_UNLOCK, "0");
    toast(state.lang === "sk" ? "Admin zamknutý." : "Admin locked.");
  });

  ui.importFile.addEventListener("change", async () => {
    if (!isUnlocked()) { toast(state.lang === "sk" ? "Najprv odomkni Admin." : "Unlock admin first."); ui.importFile.value = ""; return; }
    const file = ui.importFile.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!parsed || !Array.isArray(parsed.trees)) throw new Error("invalid");
      localStorage.setItem("ct_content_override_v1", JSON.stringify(parsed));
      toast(state.lang === "sk" ? "Import OK. Reload..." : "Import OK. Reload...");
      setTimeout(() => location.reload(), 250);
    } catch (e) {
      toast(state.lang === "sk" ? "Chybný JSON súbor." : "Invalid JSON file.");
    } finally {
      ui.importFile.value = "";
    }
  });

  ui.useRepoBtn.addEventListener("click", () => {
    if (!isUnlocked()) { toast(state.lang === "sk" ? "Najprv odomkni Admin." : "Unlock admin first."); return; }
    localStorage.removeItem("ct_content_override_v1");
    toast(state.lang === "sk" ? "Repo content aktívny." : "Repo content active.");
    setTimeout(() => location.reload(), 200);
  });

  ui.exportBtn.addEventListener("click", () => {
    if (!isUnlocked()) { toast(state.lang === "sk" ? "Najprv odomkni Admin." : "Unlock admin first."); return; }
    const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "content_export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  ui.searchInput.addEventListener("input", () => { state.query = ui.searchInput.value || ""; renderList(); });
  ui.backToList.addEventListener("click", backToList);
  document.getElementById("filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    setFilter(btn.dataset.filter);
  });

  ui.langBtn.addEventListener("click", () => setLang(state.lang === "de" ? "sk" : "de"));
  ui.resetBtn.addEventListener("click", resetAll);

  async function registerSW() {
    try { if ("serviceWorker" in navigator) await navigator.serviceWorker.register("sw.js"); } catch (_) {}
  }

  async function init() {
    ui.versionLabel.textContent = VERSION;
    applyI18n();
    await loadData();
    setFilter(state.filter);
    renderList();
    registerSW();
  }

  init().catch(() => { document.body.innerHTML = "<pre style='padding:16px;font-weight:800'>FATAL: app init failed</pre>"; });
})();
