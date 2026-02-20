/* CaravanTechniker am Main – robust app.js (stable loader + UI)
   - Loads ./content.json (with cache-bust)
   - Renders categories + fault list + search
   - Runs decision tree (JA/NEIN)
   - Simple ADMIN import/export via localStorage override
*/

(() => {
  "use strict";

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const safeText = (v) => (typeof v === "string" ? v : "");
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

  const nowTs = () => String(Date.now());

  function tryParseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // -----------------------------
  // Element discovery (robust)
  // -----------------------------
  function findEl() {
    // Try common ids/classes from your UI screenshots
    const root = document.body;

    const langBtn =
      $("#langBtn") ||
      $('[data-role="lang"]') ||
      $$("button").find((b) => /^(DE|SK)$/i.test(b.textContent.trim())) ||
      null;

    const adminBtn =
      $("#adminBtn") ||
      $$("button").find((b) => b.textContent.trim().toUpperCase() === "ADMIN") ||
      null;

    const resetBtn =
      $("#resetBtn") ||
      $$("button").find((b) => b.textContent.trim().toUpperCase() === "RESET") ||
      null;

    const searchInput =
      $("#search") ||
      $('input[type="search"]') ||
      $$("input").find((i) => /suche|hlada/i.test((i.placeholder || "").toLowerCase())) ||
      null;

    // Containers
    const catBar =
      $("#catBar") ||
      $('[data-role="categories"]') ||
      $(".catbar") ||
      $(".categories") ||
      null;

    const treeList =
      $("#treeList") ||
      $('[data-role="fault-list"]') ||
      $(".fault-list") ||
      $(".list") ||
      null;

    // Main diagnosis box
    const diagTitle =
      $("#diagTitle") ||
      $$("h1,h2,h3,h4").find((h) => /diagnose/i.test(h.textContent)) ||
      null;

    const diagText =
      $("#diagText") ||
      $('[data-role="diag-text"]') ||
      $(".diag-text") ||
      null;

    const yesBtn =
      $("#yesBtn") ||
      $$("button").find((b) => b.textContent.trim().toUpperCase() === "JA") ||
      null;

    const noBtn =
      $("#noBtn") ||
      $$("button").find((b) => b.textContent.trim().toUpperCase() === "NEIN") ||
      null;

    const protoBox =
      $("#protocol") ||
      $('[data-role="protocol"]') ||
      $(".protocol") ||
      null;

    const versionEl =
      $("#version") ||
      $$("*").find((n) => n.textContent && /^v\d+\.\d+/.test(n.textContent.trim())) ||
      null;

    // If some containers are missing, create minimal ones into page
    let catBarFinal = catBar;
    let treeListFinal = treeList;
    let diagTextFinal = diagText;
    let protoBoxFinal = protoBox;

    // Create fallback areas inside first "Störungen" card if possible
    const cards = $$(".card, .panel, .box, section, main, div").slice(0, 50);
    const stoerungenHeading = $$("h1,h2,h3,h4").find((h) => /störung|poruch/i.test(h.textContent.toLowerCase()));
    const stoerungenArea = stoerungenHeading ? stoerungenHeading.closest("div,section,main") : (cards[0] || root);

    if (!catBarFinal) {
      catBarFinal = document.createElement("div");
      catBarFinal.id = "catBar";
      catBarFinal.style.display = "flex";
      catBarFinal.style.gap = "8px";
      catBarFinal.style.flexWrap = "wrap";
      catBarFinal.style.margin = "10px 0";
      stoerungenArea.appendChild(catBarFinal);
    }

    if (!treeListFinal) {
      treeListFinal = document.createElement("div");
      treeListFinal.id = "treeList";
      treeListFinal.style.display = "grid";
      treeListFinal.style.gap = "8px";
      treeListFinal.style.margin = "10px 0";
      stoerungenArea.appendChild(treeListFinal);
    }

    // Diagnosis text fallback
    if (!diagTextFinal) {
      // Find "Diagnose" section
      const diagnoseHeading = $$("h1,h2,h3,h4").find((h) => /diagnose/i.test(h.textContent.toLowerCase()));
      const diagnoseArea = diagnoseHeading ? diagnoseHeading.closest("div,section,main") : root;

      diagTextFinal = document.createElement("div");
      diagTextFinal.id = "diagText";
      diagTextFinal.style.whiteSpace = "pre-wrap";
      diagTextFinal.style.margin = "12px 0";
      diagnoseArea.appendChild(diagTextFinal);
    }

    if (!protoBoxFinal) {
      protoBoxFinal = document.createElement("div");
      protoBoxFinal.id = "protocol";
      protoBoxFinal.style.whiteSpace = "pre-wrap";
      protoBoxFinal.style.opacity = "0.85";
      protoBoxFinal.style.marginTop = "10px";
      // put near diagnosis text
      diagTextFinal.parentElement?.appendChild(protoBoxFinal);
    }

    // Version
    if (versionEl) {
      versionEl.textContent = "v0.3.1";
    }

    return {
      langBtn,
      adminBtn,
      resetBtn,
      searchInput,
      catBar: catBarFinal,
      treeList: treeListFinal,
      diagText: diagTextFinal,
      yesBtn,
      noBtn,
      protoBox: protoBoxFinal,
    };
  }

  // -----------------------------
  // Data model
  // -----------------------------
  const STATE = {
    LANG: (localStorage.getItem("lang") || "de").toLowerCase() === "sk" ? "sk" : "de",
    TREES: [],
    ACTIVE_CATEGORY: null,
    ACTIVE_TREE_ID: null,
    ACTIVE_NODE_ID: null,
    PATH: [], // protocol steps
    CONTENT_SOURCE: "remote", // remote|local
  };

  function t(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (isObj(obj)) return safeText(obj[STATE.LANG] ?? obj.de ?? obj.sk ?? "");
    return "";
  }

  function normalizeCategory(cat) {
    const s = safeText(cat).trim();
    return s || "Other";
  }

  function buildCategories(trees) {
    const set = new Set();
    trees.forEach((tr) => set.add(normalizeCategory(tr.category)));
    return Array.from(set);
  }

  function getTreeById(id) {
    return STATE.TREES.find((t) => t.id === id) || null;
  }

  function getActiveTree() {
    return STATE.ACTIVE_TREE_ID ? getTreeById(STATE.ACTIVE_TREE_ID) : null;
  }

  function getNode(tree, nodeId) {
    if (!tree || !tree.nodes) return null;
    return tree.nodes[nodeId] || null;
  }

  // -----------------------------
  // Loading
  // -----------------------------
  async function loadTrees() {
    // If admin imported local content, prefer it
    const local = localStorage.getItem("content_override");
    if (local) {
      const parsed = tryParseJson(local);
      if (Array.isArray(parsed)) {
        STATE.CONTENT_SOURCE = "local";
        return parsed;
      }
      // if broken local override, remove it
      localStorage.removeItem("content_override");
    }

    const url = `./content.json?ts=${nowTs()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`content.json load failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("content.json is not an array");
    STATE.CONTENT_SOURCE = "remote";
    return data;
  }

  // -----------------------------
  // Rendering
  // -----------------------------
  function renderCategories(el) {
    const cats = buildCategories(STATE.TREES);
    if (!STATE.ACTIVE_CATEGORY) STATE.ACTIVE_CATEGORY = cats[0] || null;

    el.catBar.innerHTML = "";
    cats.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = cat;
      btn.style.padding = "8px 12px";
      btn.style.borderRadius = "999px";
      btn.style.border = "1px solid rgba(0,0,0,0.12)";
      btn.style.cursor = "pointer";
      btn.style.fontWeight = "600";
      btn.style.background = cat === STATE.ACTIVE_CATEGORY ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.85)";
      btn.onclick = () => {
        STATE.ACTIVE_CATEGORY = cat;
        STATE.ACTIVE_TREE_ID = null;
        STATE.ACTIVE_NODE_ID = null;
        STATE.PATH = [];
        renderAll(el);
      };
      el.catBar.appendChild(btn);
    });
  }

  function filterTreesByUI(el) {
    const q = safeText(el.searchInput?.value || "").trim().toLowerCase();
    return STATE.TREES
      .filter((tr) => normalizeCategory(tr.category) === STATE.ACTIVE_CATEGORY)
      .filter((tr) => {
        if (!q) return true;
        const hay = [
          t(tr.title),
          t(tr.subtitle),
          ...(Array.isArray(tr.tags) ? tr.tags : []),
          tr.id,
          normalizeCategory(tr.category),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }

  function renderTreeList(el) {
    const list = filterTreesByUI(el);
    el.treeList.innerHTML = "";

    if (!list.length) {
      const info = document.createElement("div");
      info.textContent = STATE.CONTENT_SOURCE === "local"
        ? "Žiadne položky (local content). Skús RESET alebo ADMIN import znova."
        : "Žiadne položky. Skontroluj content.json dáta alebo vyhľadávanie.";
      info.style.opacity = "0.75";
      info.style.padding = "8px";
      el.treeList.appendChild(info);
      return;
    }

    list.forEach((tr) => {
      const card = document.createElement("button");
      card.type = "button";
      card.style.textAlign = "left";
      card.style.padding = "12px";
      card.style.borderRadius = "14px";
      card.style.border = "1px solid rgba(0,0,0,0.10)";
      card.style.background = tr.id === STATE.ACTIVE_TREE_ID ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.90)";
      card.style.cursor = "pointer";

      const title = document.createElement("div");
      title.textContent = t(tr.title) || tr.id;
      title.style.fontWeight = "800";
      title.style.marginBottom = "4px";

      const sub = document.createElement("div");
      sub.textContent = t(tr.subtitle);
      sub.style.opacity = "0.8";
      sub.style.fontSize = "0.95em";

      card.appendChild(title);
      card.appendChild(sub);

      card.onclick = () => {
        STATE.ACTIVE_TREE_ID = tr.id;
        STATE.ACTIVE_NODE_ID = tr.start || null;
        STATE.PATH = [];
        renderAll(el);
      };

      el.treeList.appendChild(card);
    });
  }

  function renderDiagnosis(el) {
    const tree = getActiveTree();
    if (!tree || !STATE.ACTIVE_NODE_ID) {
      el.diagText.textContent = "—";
      if (el.yesBtn) el.yesBtn.disabled = true;
      if (el.noBtn) el.noBtn.disabled = true;
      renderProtocol(el);
      return;
    }

    const node = getNode(tree, STATE.ACTIVE_NODE_ID);
    if (!node) {
      el.diagText.textContent = "Chyba: Node neexistuje. Skontroluj start/nodes v content.json.";
      if (el.yesBtn) el.yesBtn.disabled = true;
      if (el.noBtn) el.noBtn.disabled = true;
      renderProtocol(el);
      return;
    }

    if (node.type === "question") {
      el.diagText.textContent = t(node.text);
      if (el.yesBtn) el.yesBtn.disabled = false;
      if (el.noBtn) el.noBtn.disabled = false;
    } else if (node.type === "result") {
      const cause = t(node.cause);
      const action = t(node.action);
      el.diagText.textContent =
        `${cause ? "Príčina:\n" + cause + "\n\n" : ""}` +
        `${action ? "Postup:\n" + action : ""}`;
      // hide/disable yes/no on result
      if (el.yesBtn) el.yesBtn.disabled = true;
      if (el.noBtn) el.noBtn.disabled = true;
    } else {
      el.diagText.textContent = "Chyba: neznámy typ node (očakávam question/result).";
      if (el.yesBtn) el.yesBtn.disabled = true;
      if (el.noBtn) el.noBtn.disabled = true;
    }

    renderProtocol(el);
  }

  function renderProtocol(el) {
    const tree = getActiveTree();
    const head = tree ? `Tree: ${tree.id} (${normalizeCategory(tree.category)})` : "Tree: —";
    const lines = [head, `Lang: ${STATE.LANG.toUpperCase()}`, `Source: ${STATE.CONTENT_SOURCE}`];

    if (STATE.PATH.length) {
      lines.push("", "Protokol:");
      STATE.PATH.forEach((p, i) => {
        lines.push(`${i + 1}. ${p}`);
      });
    }

    el.protoBox.textContent = lines.join("\n");
  }

  function renderAll(el) {
    renderCategories(el);
    renderTreeList(el);
    renderDiagnosis(el);
  }

  // -----------------------------
  // Actions
  // -----------------------------
  function goAnswer(el, answer /* true=yes false=no */) {
    const tree = getActiveTree();
    if (!tree || !STATE.ACTIVE_NODE_ID) return;

    const node = getNode(tree, STATE.ACTIVE_NODE_ID);
    if (!node || node.type !== "question") return;

    const qText = t(node.text);
    const ansLabel = answer ? "JA" : "NEIN";
    STATE.PATH.push(`${qText} -> ${ansLabel}`);

    const nextId = answer ? node.yes : node.no;
    STATE.ACTIVE_NODE_ID = nextId || null;
    renderAll(el);
  }

  function doReset(el) {
    STATE.ACTIVE_CATEGORY = null;
    STATE.ACTIVE_TREE_ID = null;
    STATE.ACTIVE_NODE_ID = null;
    STATE.PATH = [];
    if (el.searchInput) el.searchInput.value = "";
    renderAll(el);
  }

  async function adminPanel(el) {
    // Minimal admin: import content.json from file OR paste JSON; export override; clear override
    const choice = prompt(
      "ADMIN:\n1 = Import (paste JSON array)\n2 = Export current content\n3 = Clear local override\n\nZadaj 1/2/3:"
    );
    if (!choice) return;

    if (choice.trim() === "1") {
      const pasted = prompt("Vlož celý JSON (musí to byť pole [ ... ]):");
      if (!pasted) return;
      const parsed = tryParseJson(pasted);
      if (!Array.isArray(parsed)) {
        alert("Import zlyhal: nie je to JSON pole.");
        return;
      }
      localStorage.setItem("content_override", JSON.stringify(parsed));
      alert("Import OK. Reloadni stránku (refresh).");
      location.reload();
      return;
    }

    if (choice.trim() === "2") {
      const data = STATE.TREES;
      downloadText("content_backup.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
      return;
    }

    if (choice.trim() === "3") {
      localStorage.removeItem("content_override");
      alert("Local override zmazaný. Reloadni stránku (refresh).");
      location.reload();
      return;
    }

    alert("Neplatná voľba.");
  }

  // -----------------------------
  // Boot
  // -----------------------------
  async function boot() {
    const el = findEl();

    // Wire UI
    if (el.searchInput) {
      el.searchInput.addEventListener("input", () => renderAll(el));
    }

    if (el.yesBtn) el.yesBtn.onclick = () => goAnswer(el, true);
    if (el.noBtn) el.noBtn.onclick = () => goAnswer(el, false);

    if (el.resetBtn) el.resetBtn.onclick = () => doReset(el);

    if (el.langBtn) {
      el.langBtn.onclick = () => {
        STATE.LANG = STATE.LANG === "de" ? "sk" : "de";
        localStorage.setItem("lang", STATE.LANG);
        renderAll(el);
      };
    }

    if (el.adminBtn) el.adminBtn.onclick = () => adminPanel(el);

    // Load
    try {
      const trees = await loadTrees();
      STATE.TREES = trees;
      // Default category
      const cats = buildCategories(STATE.TREES);
      STATE.ACTIVE_CATEGORY = cats[0] || null;
      renderAll(el);
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e);
      el.diagText.textContent =
        "CHYBA načítania dát.\n\n" +
        msg +
        "\n\nOver:\n- content.json je v tom istom priečinku ako index.html/app.js\n- GitHub Pages deploy je hotový\n- content.json je validný JSON array\n";
      renderProtocol(el);
    }
  }

  // Run after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
