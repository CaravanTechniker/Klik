/* app.js — Caravan TaM (PRO) */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const STORAGE = {
    lang: "ctam_lang",
    selectedTreeId: "ctam_selectedTreeId",
    path: "ctam_path",
    step: "ctam_step",
    answers: "ctam_answers",
    admin: "ctam_admin"
  };

  // ---------- STATE ----------
  const state = {
    lang: localStorage.getItem(STORAGE.lang) || "de", // DE priorita
    trees: [],
    treeById: new Map(),
    selectedTreeId: localStorage.getItem(STORAGE.selectedTreeId) || "",
    path: safeJsonParse(localStorage.getItem(STORAGE.path), []),
    stepNodeId: localStorage.getItem(STORAGE.step) || "",
    answers: safeJsonParse(localStorage.getItem(STORAGE.answers), []),
    filterTags: new Set()
  };

  function safeJsonParse(s, fallback) {
    try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
  }

  // ---------- HELPERS ----------
  function pad2(n) { return String(n).padStart(2, "0"); }

  function t(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[state.lang] ?? obj.de ?? obj.sk ?? "";
  }

  function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags
      .map(x => String(x || "").trim())
      .filter(Boolean);
  }

  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem(STORAGE.lang, lang);
    renderAll();
  }

  // ---------- LOAD CONTENT ----------
  async function loadContent() {
    // cache-bust pri fetchi (aby sa nepouzil starý JSON)
    const url = `./content.json?ts=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("content.json load failed");
    const data = await res.json();

    // content.json je pole stromov
    if (!Array.isArray(data)) throw new Error("content.json invalid (expected array)");

    state.trees = data;
    state.treeById = new Map();
    for (const tree of state.trees) state.treeById.set(tree.id, tree);

    // default: ak nic nevybrate, vyber prvy strom
    if (!state.selectedTreeId || !state.treeById.has(state.selectedTreeId)) {
      state.selectedTreeId = state.trees[0]?.id || "";
      localStorage.setItem(STORAGE.selectedTreeId, state.selectedTreeId);
    }
  }

  // ---------- UI BUILD ----------
  function buildHeader() {
    $("#btnDE").classList.toggle("active", state.lang === "de");
    $("#btnSK").classList.toggle("active", state.lang === "sk");

    $("#btnDE").onclick = () => setLang("de");
    $("#btnSK").onclick = () => setLang("sk");

    $("#btnReset").onclick = hardReset;
    $("#btnBack").onclick = stepBack;

    $("#btnAdmin").onclick = adminMenu;
  }

  function hardReset() {
    // vycisti vsetko, co ovplyvnuje UI
    localStorage.removeItem(STORAGE.selectedTreeId);
    localStorage.removeItem(STORAGE.path);
    localStorage.removeItem(STORAGE.step);
    localStorage.removeItem(STORAGE.answers);

    state.selectedTreeId = state.trees[0]?.id || "";
    state.path = [];
    state.stepNodeId = "";
    state.answers = [];

    // pre istotu komplet reload (najspolahlivejsie aj na Fold/Chrome)
    location.reload();
  }

  function stepBack() {
    if (state.path.length === 0) return;
    state.path.pop();
    state.answers.pop();

    const last = state.path[state.path.length - 1] || null;
    state.stepNodeId = last?.nodeId || "";

    persistProgress();
    renderDiagnosis();
    renderProtocol();
  }

  function persistProgress() {
    localStorage.setItem(STORAGE.selectedTreeId, state.selectedTreeId);
    localStorage.setItem(STORAGE.path, JSON.stringify(state.path));
    localStorage.setItem(STORAGE.step, state.stepNodeId);
    localStorage.setItem(STORAGE.answers, JSON.stringify(state.answers));
  }

  function selectTree(treeId) {
    state.selectedTreeId = treeId;
    state.path = [];
    state.stepNodeId = "";
    state.answers = [];
    persistProgress();
    renderDiagnosis();
    renderProtocol();
  }

  // ---------- TREE LIST (ACCORDION + NUMBER) ----------
  function getAllTags() {
    const all = new Set();
    for (const tree of state.trees) {
      for (const tag of normalizeTags(tree.tags)) all.add(tag);
    }
    return Array.from(all).sort((a, b) => a.localeCompare(b));
  }

  function renderTagsFilter() {
    const btn = $("#btnTags");
    const menu = $("#tagsMenu");
    const reset = $("#btnFilterReset");

    const allTags = getAllTags();

    btn.onclick = () => {
      menu.classList.toggle("open");
    };

    reset.onclick = () => {
      state.filterTags.clear();
      menu.classList.remove("open");
      renderTreeList();
    };

    menu.innerHTML = "";
    for (const tag of allTags) {
      const row = document.createElement("label");
      row.className = "tagRow";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = state.filterTags.has(tag);
      cb.onchange = () => {
        if (cb.checked) state.filterTags.add(tag);
        else state.filterTags.delete(tag);
        renderTreeList();
      };

      const span = document.createElement("span");
      span.textContent = tag;

      row.appendChild(cb);
      row.appendChild(span);
      menu.appendChild(row);
    }

    // klik mimo menu -> zavri
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("open")) return;
      const inside = menu.contains(e.target) || btn.contains(e.target);
      if (!inside) menu.classList.remove("open");
    }, { passive: true });
  }

  function matchesFilter(tree) {
    if (state.filterTags.size === 0) return true;
    const tags = new Set(normalizeTags(tree.tags));
    for (const need of state.filterTags) if (!tags.has(need)) return false;
    return true;
  }

  function renderTreeList() {
    const q = ($("#search").value || "").trim().toLowerCase();
    const wrap = $("#trees");

    wrap.innerHTML = "";

    state.trees.forEach((tree, idx) => {
      if (!matchesFilter(tree)) return;

      const title = t(tree.title);
      const subtitle = t(tree.subtitle);
      const tags = normalizeTags(tree.tags);

      const hay = `${title} ${subtitle} ${tags.join(" ")}`.toLowerCase();
      if (q && !hay.includes(q)) return;

      const num = pad2(idx + 1);

      // accordion: <details>
      const details = document.createElement("details");
      details.className = "treeItem";
      if (tree.id === state.selectedTreeId) details.open = true;

      const summary = document.createElement("summary");
      summary.className = "treeSummary";
      summary.innerHTML = `<span class="treeNum">${num}</span><span class="treeTitle">${escapeHtml(title)}</span>`;

      // klik na summary len rozklik, neprepina automaticky (prehladne)
      // vyber spravime tlacidlom "Použiť"
      const body = document.createElement("div");
      body.className = "treeBody";

      const sub = document.createElement("div");
      sub.className = "treeSubtitle";
      sub.textContent = subtitle || "";

      const btnUse = document.createElement("button");
      btnUse.className = "btnUse";
      btnUse.textContent = state.lang === "de" ? "Auswählen" : "Vybrať";
      btnUse.onclick = () => selectTree(tree.id);

      body.appendChild(sub);
      body.appendChild(btnUse);

      details.appendChild(summary);
      details.appendChild(body);

      wrap.appendChild(details);
    });
  }

  // ---------- DIAGNOSIS ENGINE ----------
  function getSelectedTree() {
    return state.treeById.get(state.selectedTreeId) || null;
  }

  function getNode(tree, nodeId) {
    if (!tree || !tree.nodes) return null;
    return tree.nodes[nodeId] || null;
  }

  function startNodeId(tree) {
    return tree.start || "start";
  }

  function renderDiagnosis() {
    const tree = getSelectedTree();
    const errBox = $("#diagError");

    if (!tree) {
      errBox.textContent = state.lang === "de" ? "Kein Baum gewählt." : "Nie je vybraný strom.";
      errBox.classList.remove("hidden");
      $("#question").textContent = "";
      return;
    }

    // nastav stepNodeId ak prazdny
    if (!state.stepNodeId) {
      state.stepNodeId = startNodeId(tree);
      persistProgress();
    }

    const node = getNode(tree, state.stepNodeId);

    if (!node) {
      // toto je tvoja chyba "missing node"
      errBox.textContent = state.lang === "de"
        ? "Node fehlt im Baum. Prüfe content.json."
        : "Chýba uzol v strome. Skontroluj content.json.";
      errBox.classList.remove("hidden");

      $("#question").textContent = "";
      return;
    }

    errBox.classList.add("hidden");

    // ak je to KONIEC / VÝSLEDOK (node.type === "result" alebo node.result)
    if (node.type === "result" || node.result) {
      const resultText = t(node.result || node.text);
      $("#question").innerHTML = `<div class="resultTitle">${state.lang === "de" ? "Ergebnis" : "Výsledok"}</div>
                                  <div class="resultText">${escapeHtml(resultText)}</div>`;
      $("#btnYes").disabled = true;
      $("#btnNo").disabled = true;
      $("#btnBack").disabled = state.path.length === 0;
      renderProtocol(true, resultText);
      return;
    }

    $("#btnYes").disabled = false;
    $("#btnNo").disabled = false;
    $("#btnBack").disabled = state.path.length === 0;

    const qText = t(node.question || node.text);
    $("#question").textContent = qText || "";

    $("#btnYes").textContent = state.lang === "de" ? "JA" : "ÁNO";
    $("#btnNo").textContent = state.lang === "de" ? "NEIN" : "NIE";
    $("#btnBack").textContent = state.lang === "de" ? "← SCHRITT ZURÜCK" : "← KROK SPÄŤ";

    $("#btnYes").onclick = () => answer(tree, node, true);
    $("#btnNo").onclick = () => answer(tree, node, false);

    renderProtocol(false, "");
  }

  function answer(tree, node, yes) {
    const nextId = yes ? node.yes : node.no;

    state.path.push({
      nodeId: state.stepNodeId,
      q: t(node.question || node.text),
      a: yes ? (state.lang === "de" ? "JA" : "ÁNO") : (state.lang === "de" ? "NEIN" : "NIE")
    });

    state.answers.push(yes);

    state.stepNodeId = nextId || "";

    persistProgress();
    renderDiagnosis();
  }

  // ---------- PROTOCOL / EXPORT ----------
  function renderProtocol(isResult = false, resultText = "") {
    const tree = getSelectedTree();
    const box = $("#protocol");

    const now = new Date();
    const dt = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

    const title = tree ? t(tree.title) : "";
    const tags = tree ? normalizeTags(tree.tags).join(", ") : "";

    let lines = [];
    lines.push(`${state.lang === "de" ? "Zeit" : "Čas"}: ${dt}`);
    lines.push(`${state.lang === "de" ? "Sprache" : "Jazyk"}: ${state.lang.toUpperCase()}`);
    lines.push(`${state.lang === "de" ? "Störung" : "Porucha"}: ${title}`);
    if (tags) lines.push(`${state.lang === "de" ? "Tags" : "Tagy"}: ${tags}`);
    lines.push("");
    lines.push(state.lang === "de" ? "Schritte:" : "Kroky:");

    state.path.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.q}  [${p.a}]`);
    });

    if (isResult) {
      lines.push("");
      lines.push(state.lang === "de" ? "Ergebnis:" : "Výsledok:");
      lines.push(resultText || "-");
    }

    box.textContent = lines.join("\n");

    $("#btnCopy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(box.textContent);
        toast(state.lang === "de" ? "Kopiert" : "Skopírované");
      } catch {
        toast(state.lang === "de" ? "Kopieren fehlgeschlagen" : "Kopírovanie zlyhalo");
      }
    };

    $("#btnDownloadTxt").onclick = () => {
      const blob = new Blob([box.textContent], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `caravan_tam_${state.lang}_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    };

    // !!! DÔLEŽITÉ: žiadne "download content.json" tlačidlo tu už NIE JE !!!
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1200);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ---------- ADMIN ----------
  async function adminMenu() {
    const choice = prompt("ADMIN\n1 = Import\n2 = Export\n\n(OK = pokračovať)");
    if (!choice) return;

    if (choice.trim() === "1") {
      // Import: file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          alert(state.lang === "de" ? "JSON ungültig" : "Neplatný JSON");
          return;
        }
        if (!Array.isArray(data)) {
          alert(state.lang === "de" ? "JSON muss ein Array sein" : "JSON musí byť pole");
          return;
        }

        // uloz do localStorage ako override (app načíta preferenčne z override)
        localStorage.setItem("ctam_override_content", JSON.stringify(data));
        toast(state.lang === "de" ? "Import OK – Reload" : "Import OK – Reload");

        // reload aby sa načítalo nové
        location.reload();
      };
      input.click();
    }

    if (choice.trim() === "2") {
      // Export: uloz aktualny content (override ak existuje, inak fetchnuty)
      const data = getEffectiveContent();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `content_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    }
  }

  function getEffectiveContent() {
    const override = localStorage.getItem("ctam_override_content");
    if (override) {
      try {
        const parsed = JSON.parse(override);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return state.trees;
  }

  async function loadOverrideIfAny() {
    const override = localStorage.getItem("ctam_override_content");
    if (!override) return false;
    try {
      const parsed = JSON.parse(override);
      if (!Array.isArray(parsed)) return false;
      state.trees = parsed;
      state.treeById = new Map();
      for (const tree of state.trees) state.treeById.set(tree.id, tree);

      if (!state.selectedTreeId || !state.treeById.has(state.selectedTreeId)) {
        state.selectedTreeId = state.trees[0]?.id || "";
        localStorage.setItem(STORAGE.selectedTreeId, state.selectedTreeId);
      }
      return true;
    } catch {
      return false;
    }
  }

  // ---------- INIT ----------
  async function init() {
    buildHeader();

    // load override first (admin import)
    const hasOverride = await loadOverrideIfAny();
    if (!hasOverride) await loadContent();

    $("#search").addEventListener("input", renderTreeList);

    renderTagsFilter();
    renderAll();
  }

  function renderAll() {
    // title
    $("#brand").textContent = "CaravanTechniker am Main";

    // texts
    $("#secTreesTitle").textContent = state.lang === "de" ? "Störungen" : "Poruchy";
    $("#secTreesHint").textContent = state.lang === "de"
      ? "Wähle eine Störung oder suche. Funktioniert auch offline."
      : "Vyber poruchu alebo hľadaj. Funguje aj offline.";

    $("#secDiagTitle").textContent = state.lang === "de" ? "Diagnose" : "Diagnostika";
    $("#secDiagHint").textContent = state.lang === "de"
      ? "Wähle links eine Störung. Dann klicke JA / NEIN."
      : "Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.";

    $("#secProtTitle").textContent = state.lang === "de" ? "Protokoll" : "Protokol";

    // buttons
    $("#btnFilterReset").textContent = state.lang === "de" ? "Filter Reset" : "Filter Reset";
    $("#btnTags").textContent = state.lang === "de" ? "Tags ▾" : "Tagy ▾";
    $("#btnCopy").textContent = state.lang === "de" ? "Kopieren" : "Kopírovať";
    $("#btnDownloadTxt").textContent = state.lang === "de" ? "TXT Download" : "Stiahnuť TXT";

    renderTreeList();
    renderDiagnosis();
    renderProtocol();
  }

  init().catch((e) => {
    console.error(e);
    $("#diagError").textContent = "Init error. Check console.";
    $("#diagError").classList.remove("hidden");
  });
})();
