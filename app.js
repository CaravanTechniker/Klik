/* CaravanTechniker am Main – v0.3.1
   Stable UI + safe admin + no-crash handlers
*/
(() => {
  "use strict";

  const VERSION = "0.3.1";

  // ===== Helpers =====
  const $ = (id) => document.getElementById(id);
  const log = (...a) => console.log("[CTAM]", ...a);

  const safeJsonParse = (txt) => {
    try { return { ok: true, data: JSON.parse(txt) }; }
    catch (e) { return { ok: false, error: e }; }
  };

  const nowIso = () => new Date().toISOString();

  // ===== State =====
  const state = {
    lang: "DE",
    filter: "Alle",
    search: "",
    items: [],         // {id, category, title, subtitle, treeId}
    trees: {},         // treeId -> { start, nodes }
    selectedItem: null,
    currentNodeId: null,
    history: [],       // stack of nodeIds
    adminUnlocked: false,
  };

  // ===== Elements (must exist) =====
  const el = {
    langBtn: $("langBtn"),
    adminBtn: $("adminBtn"),
    resetBtn: $("resetBtn"),

    searchInput: $("searchInput"),
    chips: $("chips"),
    items: $("items"),
    versionLabel: $("versionLabel"),

    questionBox: $("questionBox"),
    backBtn: $("backBtn"),
    yesBtn: $("yesBtn"),
    noBtn: $("noBtn"),

    adminModal: $("adminModal"),
    adminCloseBtn: $("adminCloseBtn"),
    adminPass: $("adminPass"),
    adminUnlockBtn: $("adminUnlockBtn"),
    adminLoadBtn: $("adminLoadBtn"),
    adminDownloadBtn: $("adminDownloadBtn"),
    adminApplyBtn: $("adminApplyBtn"),
    adminTextarea: $("adminTextarea"),
    adminLog: $("adminLog"),
  };

  // Hard fail early if any element missing (prevents silent broken buttons)
  for (const [k, v] of Object.entries(el)) {
    if (!v) {
      document.body.innerHTML = `<pre style="padding:16px;color:#b91c1c;font-weight:900">FATAL: missing element #${k}</pre>`;
      throw new Error(`Missing element: ${k}`);
    }
  }

  el.versionLabel.textContent = `v${VERSION}`;

  // ===== Content loading =====
  const STORAGE_KEY = "ctam_content_json_override_v1";

  async function loadContent() {
    // priority: localStorage override (admin apply) -> content.json network
    const override = localStorage.getItem(STORAGE_KEY);
    if (override) {
      const parsed = safeJsonParse(override);
      if (parsed.ok) {
        applyContent(parsed.data, { source: "localStorage" });
        return;
      } else {
        // broken override => remove to recover
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const r = await fetch("./content.json?v=" + VERSION, { cache: "no-store" });
    if (!r.ok) throw new Error("content.json load failed: " + r.status);
    const data = await r.json();
    applyContent(data, { source: "content.json" });
  }

  function applyContent(data, meta = {}) {
    // Validate minimal schema to avoid crashes
    if (!data || typeof data !== "object") throw new Error("Invalid content root");

    const items = Array.isArray(data.items) ? data.items : [];
    const trees = (data.trees && typeof data.trees === "object") ? data.trees : {};

    // Normalize
    state.items = items.map((x, idx) => ({
      id: String(x.id ?? idx),
      category: String(x.category ?? "Andere"),
      title: String(x.title ?? "—"),
      subtitle: String(x.subtitle ?? ""),
      treeId: String(x.treeId ?? ""),
    }));
    state.trees = trees;

    // Ensure at least empty categories exist
    renderChips();
    renderItems();
    resetDiagnosis();

    log("content applied", meta, "items:", state.items.length, "trees:", Object.keys(state.trees).length);
  }

  // ===== Rendering =====
  function getCategories() {
    const cats = new Set(state.items.map(i => i.category));
    return ["Alle", ...Array.from(cats).sort()];
  }

  function renderChips() {
    const cats = getCategories();
    el.chips.innerHTML = "";
    cats.forEach((c) => {
      const b = document.createElement("button");
      b.className = "chip" + (state.filter === c ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", () => {
        state.filter = c;
        renderChips();
        renderItems();
      });
      el.chips.appendChild(b);
    });
  }

  function renderItems() {
    const q = state.search.trim().toLowerCase();
    const list = state.items.filter(i => {
      const okFilter = (state.filter === "Alle") || (i.category === state.filter);
      if (!okFilter) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });

    el.items.innerHTML = "";
    list.forEach((i) => {
      const d = document.createElement("div");
      d.className = "item";
      d.innerHTML = `
        <div class="itemTitle">${escapeHtml(i.title)}</div>
        <div class="itemSub">${escapeHtml(i.subtitle)}</div>
      `;
      d.addEventListener("click", () => {
        selectItem(i.id);
      });
      el.items.appendChild(d);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===== Diagnosis engine =====
  function resetDiagnosis() {
    state.selectedItem = null;
    state.currentNodeId = null;
    state.history = [];
    el.questionBox.textContent = "—";
  }

  function selectItem(itemId) {
    const it = state.items.find(x => x.id === String(itemId));
    state.selectedItem = it || null;
    state.history = [];

    if (!it || !it.treeId || !state.trees[it.treeId]) {
      el.questionBox.textContent = "Keine Diagnose-Daten für diese Störung.";
      state.currentNodeId = null;
      return;
    }

    const tree = state.trees[it.treeId];
    state.currentNodeId = tree.start;
    showNode();
  }

  function showNode() {
    const it = state.selectedItem;
    if (!it) {
      el.questionBox.textContent = "—";
      return;
    }

    const tree = state.trees[it.treeId];
    if (!tree) {
      el.questionBox.textContent = "Tree missing.";
      return;
    }

    const node = tree.nodes?.[state.currentNodeId];
    if (!node) {
      el.questionBox.textContent = "Node missing: " + state.currentNodeId;
      return;
    }

    // node can be { q, yes, no } OR { result }
    if (node.result) {
      el.questionBox.textContent = node.result;
    } else if (node.q) {
      el.questionBox.textContent = node.q;
    } else {
      el.questionBox.textContent = "Invalid node.";
    }
  }

  function step(answerYes) {
    const it = state.selectedItem;
    if (!it) return;

    const tree = state.trees[it.treeId];
    if (!tree) return;

    const node = tree.nodes?.[state.currentNodeId];
    if (!node) return;

    if (node.result) {
      // already result => do nothing
      return;
    }

    const nextId = answerYes ? node.yes : node.no;
    if (!nextId) {
      el.questionBox.textContent = "Kein weiterer Schritt definiert.";
      return;
    }

    state.history.push(state.currentNodeId);
    state.currentNodeId = nextId;
    showNode();
  }

  function back() {
    if (state.history.length === 0) return;
    state.currentNodeId = state.history.pop();
    showNode();
  }

  // ===== Admin =====
  const ADMIN_PASS = "128hz"; // ZMEŇ si heslo tu

  function adminLog(msg) {
    el.adminLog.textContent = `log: ${msg}`;
  }

  function openAdmin() {
    el.adminModal.style.display = "flex";
    adminLog("ready");
  }

  function closeAdmin() {
    el.adminModal.style.display = "none";
    el.adminPass.value = "";
  }

  function adminUnlock() {
    try {
      const pw = String(el.adminPass.value || "");
      if (pw !== ADMIN_PASS) {
        state.adminUnlocked = false;
        adminLog("wrong password");
        return;
      }
      state.adminUnlocked = true;
      adminLog("unlocked");
      adminLoadCurrent();
    } catch (e) {
      state.adminUnlocked = false;
      adminLog("crash: " + (e.message || e));
    }
  }

  function adminLoadCurrent() {
    try {
      const current = buildExportJson();
      el.adminTextarea.value = JSON.stringify(current, null, 2);
      adminLog("loaded current content");
    } catch (e) {
      adminLog("load crash: " + (e.message || e));
    }
  }

  function adminDownload() {
    try {
      if (!state.adminUnlocked) { adminLog("locked"); return; }
      const txt = el.adminTextarea.value || "";
      const blob = new Blob([txt], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "content.json";
      a.click();
      URL.revokeObjectURL(a.href);
      adminLog("download started");
    } catch (e) {
      adminLog("download crash: " + (e.message || e));
    }
  }

  function adminApply() {
    try {
      if (!state.adminUnlocked) { adminLog("locked"); return; }
      const txt = el.adminTextarea.value || "";
      const parsed = safeJsonParse(txt);
      if (!parsed.ok) {
        adminLog("JSON error: " + parsed.error.message);
        return;
      }

      // Store override + apply immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
      applyContent(parsed.data, { source: "adminApply", at: nowIso() });
      adminLog("applied to localStorage (runtime). GitHub requires commit of content.json.");
    } catch (e) {
      adminLog("apply crash: " + (e.message || e));
    }
  }

  function buildExportJson() {
    return {
      meta: { version: VERSION, exportedAt: nowIso() },
      items: state.items.map(i => ({
        id: i.id,
        category: i.category,
        title: i.title,
        subtitle: i.subtitle,
        treeId: i.treeId,
      })),
      trees: state.trees
    };
  }

  // ===== Reset / language =====
  function hardReset() {
    // reset UI + clear admin override
    localStorage.removeItem(STORAGE_KEY);
    state.filter = "Alle";
    state.search = "";
    el.searchInput.value = "";
    resetDiagnosis();
    renderChips();
    renderItems();
  }

  function toggleLang() {
    // placeholder (only DE for now)
    state.lang = "DE";
    el.langBtn.textContent = "DE ▾";
  }

  // ===== Wire events (safe) =====
  el.searchInput.addEventListener("input", () => {
    state.search = el.searchInput.value || "";
    renderItems();
  });

  el.yesBtn.addEventListener("click", () => step(true));
  el.noBtn.addEventListener("click", () => step(false));
  el.backBtn.addEventListener("click", () => back());

  el.resetBtn.addEventListener("click", () => hardReset());
  el.langBtn.addEventListener("click", () => toggleLang());
  el.adminBtn.addEventListener("click", () => openAdmin());

  el.adminCloseBtn.addEventListener("click", () => closeAdmin());
  el.adminUnlockBtn.addEventListener("click", () => adminUnlock());
  el.adminLoadBtn.addEventListener("click", () => adminLoadCurrent());
  el.adminDownloadBtn.addEventListener("click", () => adminDownload());
  el.adminApplyBtn.addEventListener("click", () => adminApply());

  // Close modal on backdrop tap
  el.adminModal.addEventListener("click", (e) => {
    if (e.target === el.adminModal) closeAdmin();
  });

  // ===== Boot =====
  (async function boot() {
    try {
      log("boot", VERSION);
      await loadContent();
    } catch (e) {
      log("BOOT ERROR", e);
      el.items.innerHTML = `<div class="item"><div class="itemTitle">ERROR loading data</div><div class="itemSub">${escapeHtml(e.message || String(e))}</div></div>`;
      el.questionBox.textContent = "ERROR loading data";
    }
  })();
})();
