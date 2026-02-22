(() => {
  "use strict";

  // ====== CONFIG ======
  const LS_KEY = "womo_content_json_v1";
  const ADMIN_PASS = "1"; // Stani: heslo 1
  const STATUS_HIDE_MS = 1800;

  // ====== STATE ======
  const state = {
    lang: "de",
    content: null,
    categories: [],
    selectedTree: null,
    selectedNodeId: null,
    history: [],
    adminUnlocked: false,
    adminTapCount: 0,
    adminTapTimer: null,
    collapsed: false,
    statusTimer: null,
    lastResultText: "",
  };

  // ====== ELEMENTS ======
  const $ = (id) => document.getElementById(id);

  const el = {
    adminBtn: $("adminBtn"),
    contactBtn: $("contactBtn"),
    statusLine: $("statusLine"),

    langBtn: $("langBtn"),
    langLabel: $("langLabel"),
    langMenu: $("langMenu"),

    collapseBtn: $("collapseBtn"),
    feedbackBtn: $("feedbackBtn"),
    shareBtn: $("shareBtn"),

    inlinePanels: $("inlinePanels"),

    adminPanel: $("adminPanel"),
    adminTitle: $("adminTitle"),
    adminHint: $("adminHint"),
    closeAdminBtn: $("closeAdminBtn"),
    exportBtn: $("exportBtn"),
    importBtn: $("importBtn"),
    importFile: $("importFile"),
    resetBtn: $("resetBtn"),

    contactPanel: $("contactPanel"),
    closeContactBtn: $("closeContactBtn"),
    contactTitle: $("contactTitle"),
    lblPhone: $("lblPhone"),
    lblWa: $("lblWa"),
    lblMail: $("lblMail"),

    feedbackPanel: $("feedbackPanel"),
    closeFeedbackBtn: $("closeFeedbackBtn"),
    feedbackTitle: $("feedbackTitle"),
    fbLabel: $("fbLabel"),
    fbText: $("fbText"),
    fbSend: $("fbSend"),
    fbCopy: $("fbCopy"),
    fbHint: $("fbHint"),

    tabCategories: $("tabCategories"),
    tabDiagnosis: $("tabDiagnosis"),

    categoriesView: $("categoriesView"),
    diagnosisView: $("diagnosisView"),
    categoriesList: $("categoriesList"),
    categoriesTitle: $("categoriesTitle"),
    categoriesCount: $("categoriesCount"),

    selectedTreeLine: $("selectedTreeLine"),
    diagText: $("diagText"),
    nodeCount: $("nodeCount"),

    btnYes: $("btnYes"),
    btnNo: $("btnNo"),
    btnBack: $("btnBack"),
    btnResultCopy: $("btnResultCopy"),
    btnResultPdf: $("btnResultPdf"),

    telLink: $("telLink"),
    waLink: $("waLink"),
    mailLink: $("mailLink"),
    contactHint: $("contactHint"),

    appTitle: $("appTitle"),
    onlineLabel: $("onlineLabel"),
  };

  // ====== I18N ======
  const T = {
    de: {
      appTitle: "Wohnmobil Diagnose",
      brand: "CaravanTechniker am Main",
      collapse: "Einklappen",
      expand: "Ausklappen",
      feedback: "Feedback",
      share: "Teilen",
      categories: "Kategorien",
      diagnosis: "Diagnose",
      online: "Online",
      contact: "Kontakt",
      phone: "Telefon:",
      whatsapp: "WhatsApp:",
      email: "E-Mail:",
      contactHint: "Kontakt bitte bevorzugt per WhatsApp Nachricht oder E-Mail.",

      fbTitle: "Feedback",
      fbLabel: "Dein Feedback",
      fbPlaceholder: "Was fehlt, was ist unklar, welche Störung?",
      fbSend: "Senden",
      fbCopy: "Text kopieren",
      fbHint: "Senden öffnet E-Mail (Fallback: kopieren).",

      adminTitle: "Admin",
      adminHint: "Import nahradí aktuálny obsah (uloží sa do LocalStorage). Export stiahne aktuálnu verziu.",
      reset: "Reset na default",

      selectFirst: "Bitte zuerst links Kategorie/Problem auswählen.",
      selectedTree: "Ausgewählter Baum:",
      copied: "Link kopiert.",
      copiedText: "Text kopiert.",
      imported: "Import OK.",
      importFail: "Import zlyhal.",
      resetOk: "Reset OK.",
      adminUnlocked: "Admin aktiviert.",
      adminLocked: "Admin gesperrt.",
      wrongPass: "Falsches Passwort.",
      adminPrompt: "Admin-Passwort",

      yes: "Ja",
      no: "Nein",
      back: "Zurück",
      resultCopy: "TXT kopieren",
      resultPdf: "PDF",
      resultReady: "Ergebnis pripravený.",
    },
    sk: {
      appTitle: "Diagnostika obytného auta",
      brand: "CaravanTechniker am Main",
      collapse: "Zbaliť",
      expand: "Rozbaliť",
      feedback: "Pripomienky",
      share: "Zdieľať",
      categories: "Kategórie",
      diagnosis: "Diagnostika",
      online: "Online",
      contact: "Kontakt",
      phone: "Telefón:",
      whatsapp: "WhatsApp:",
      email: "E-mail:",
      contactHint: "Kontakt prosím preferovane cez WhatsApp správu alebo E-mail.",

      fbTitle: "Pripomienky",
      fbLabel: "Tvoja správa",
      fbPlaceholder: "Čo chýba, čo je nejasné, aká porucha?",
      fbSend: "Odoslať",
      fbCopy: "Kopírovať text",
      fbHint: "Odoslanie otvorí E-mail (ak nejde, skopíruj text).",

      adminTitle: "Admin",
      adminHint: "Import prepíše aktuálny obsah (uloží sa do LocalStorage). Export stiahne aktuálnu verziu.",
      reset: "Reset na default",

      selectFirst: "Najprv vyber kategóriu/problém.",
      selectedTree: "Vybraný strom:",
      copied: "Link skopírovaný.",
      copiedText: "Text skopírovaný.",
      imported: "Import OK.",
      importFail: "Import zlyhal.",
      resetOk: "Reset OK.",
      adminUnlocked: "Admin aktivovaný.",
      adminLocked: "Admin zamknutý.",
      wrongPass: "Zlé heslo.",
      adminPrompt: "Admin heslo",

      yes: "Áno",
      no: "Nie",
      back: "Späť",
      resultCopy: "TXT kopírovať",
      resultPdf: "PDF",
      resultReady: "Výsledok pripravený.",
    },
  };

  function tr(key) {
    return (T[state.lang] && T[state.lang][key]) || (T.de[key] || key);
  }

  // ====== UI TEXTS ======
  function applyTexts() {
    document.documentElement.lang = state.lang;

    el.appTitle.textContent = tr("appTitle");
    el.contactBtn.textContent = tr("brand");

    el.collapseBtn.textContent = state.collapsed ? tr("expand") : tr("collapse");
    el.feedbackBtn.textContent = tr("feedback");
    el.shareBtn.textContent = tr("share");

    el.categoriesTitle.textContent = tr("categories");
    el.diagnosisTitle.textContent = tr("diagnosis");
    el.onlineLabel.textContent = tr("online");

    el.contactTitle.textContent = tr("contact");
    el.lblPhone.textContent = tr("phone");
    el.lblWa.textContent = tr("whatsapp");
    el.lblMail.textContent = tr("email");
    el.contactHint.textContent = tr("contactHint");

    el.feedbackTitle.textContent = tr("fbTitle");
    el.fbLabel.textContent = tr("fbLabel");
    el.fbText.placeholder = tr("fbPlaceholder");
    el.fbSend.textContent = tr("fbSend");
    el.fbCopy.textContent = tr("fbCopy");
    el.fbHint.textContent = tr("fbHint");

    el.adminTitle.textContent = tr("adminTitle");
    el.adminHint.textContent = tr("adminHint");
    el.resetBtn.textContent = tr("reset");

    el.btnYes.textContent = tr("yes");
    el.btnNo.textContent = tr("no");
    el.btnBack.textContent = tr("back");
    el.btnResultCopy.textContent = tr("resultCopy");
    el.btnResultPdf.textContent = tr("resultPdf");

    el.selectedTreeLine.textContent = `${tr("selectedTree")} –`;
    if (!state.selectedTree && !state.lastResultText) {
      el.diagText.textContent = tr("selectFirst");
    }
  }

  // ====== STATUS (auto-hide) ======
  function setStatus(msg, ms = STATUS_HIDE_MS) {
    clearTimeout(state.statusTimer);
    el.statusLine.textContent = msg || "";
    if (!msg) return;
    state.statusTimer = setTimeout(() => {
      // after message hide, show admin state as baseline info
      el.statusLine.textContent = state.adminUnlocked ? tr("adminUnlocked") : "";
    }, ms);
  }

  // ====== HELPERS ======
  function toggle(node, show) {
    node.classList.toggle("hidden", !show);
  }

  function openPanel(which) {
    toggle(el.inlinePanels, true);
    toggle(el.adminPanel, which === "admin");
    toggle(el.contactPanel, which === "contact");
    toggle(el.feedbackPanel, which === "feedback");
    // scroll to top of panels to avoid hidden on small screens
    el.inlinePanels.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closePanels() {
    toggle(el.adminPanel, false);
    toggle(el.contactPanel, false);
    toggle(el.feedbackPanel, false);
    toggle(el.inlinePanels, false);
  }

  function safeNumber(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  }

  function catTitle(cat) {
    return state.lang === "sk" ? (cat.title_sk || cat.title_de) : (cat.title_de || cat.title_sk);
  }

  function treeTitle(tree) {
    const de = tree.title_de || tree.title || tree.name_de || tree.name || "Baum";
    const sk = tree.title_sk || tree.name_sk || tree.name || de;
    return state.lang === "sk" ? sk : de;
  }

  function nodeText(node) {
    if (!node) return "";
    if (state.lang === "sk") return node.text_sk || node.text || "";
    return node.text_de || node.text || "";
  }

  // ====== CONTENT LOADING ======
  async function loadContent() {
    // 1) LocalStorage has priority (after import)
    const fromLS = localStorage.getItem(LS_KEY);
    if (fromLS) {
      try {
        const parsed = JSON.parse(fromLS);
        state.content = parsed;
        state.categories = normalizeCategories(parsed);
        return;
      } catch (_) {
        // ignore broken LS
      }
    }

    // 2) default content.json
    const res = await fetch("content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("content.json load failed");
    const json = await res.json();

    state.content = json;
    state.categories = normalizeCategories(json);
  }

  function normalizeCategories(json) {
    if (json && Array.isArray(json.categories)) {
      return json.categories.map((c, idx) => ({
        id: c.id || `cat_${idx}`,
        title_de: c.title_de || c.title || c.name_de || c.name || `Kategorie ${idx + 1}`,
        title_sk: c.title_sk || c.name_sk || c.name || `Kategória ${idx + 1}`,
        trees: Array.isArray(c.trees) ? c.trees : [],
      }));
    }

    if (json && Array.isArray(json.trees)) {
      return [{
        id: "cat_default",
        title_de: "Kategorien",
        title_sk: "Kategórie",
        trees: json.trees,
      }];
    }

    return [];
  }

  // ====== RENDER ======
  function renderTabs() {
    const catCount = state.categories.length;
    el.tabCategories.textContent = `${tr("categories")} (${catCount})`;
    el.categoriesCount.textContent = `${catCount} ks`;

    const catActive = !el.categoriesView.classList.contains("hidden");
    el.tabCategories.classList.toggle("active", catActive);
    el.tabDiagnosis.classList.toggle("active", !catActive);
    el.tabDiagnosis.textContent = tr("diagnosis");
  }

  function renderCategories() {
    el.categoriesList.innerHTML = "";

    state.categories.forEach((cat) => {
      const item = document.createElement("div");
      item.className = "item";

      const left = document.createElement("div");
      left.className = "itemTitle";
      left.textContent = catTitle(cat);

      const right = document.createElement("div");
      right.className = "itemRight";

      const count = document.createElement("div");
      count.className = "ksp";
      count.textContent = `${safeNumber(cat.trees.length)} ks`;

      const btn = document.createElement("button");
      btn.className = "dropBtn";
      btn.type = "button";
      btn.textContent = "▾";

      const treeWrap = document.createElement("div");
      treeWrap.className = "treeList hidden";

      btn.addEventListener("click", () => {
        const open = !treeWrap.classList.contains("hidden");
        toggle(treeWrap, open); // if open => hide
        btn.textContent = open ? "▾" : "▴";
      });

      right.appendChild(count);
      right.appendChild(btn);

      item.appendChild(left);
      item.appendChild(right);

      // Trees
      cat.trees.forEach((tree) => {
        const tb = document.createElement("button");
        tb.className = "treeBtn";
        tb.type = "button";
        tb.textContent = treeTitle(tree);
        tb.addEventListener("click", () => {
          selectTree(tree);
          showDiagnosis();
        });
        treeWrap.appendChild(tb);
      });

      el.categoriesList.appendChild(item);
      el.categoriesList.appendChild(treeWrap);
    });
  }

  function showCategories() {
    toggle(el.categoriesView, true);
    toggle(el.diagnosisView, false);
    renderTabs();
  }

  function showDiagnosis() {
    toggle(el.categoriesView, false);
    toggle(el.diagnosisView, true);
    renderTabs();
  }

  function renderDiagnosisButtonsState() {
    const enabled = !!state.selectedTree && !!state.selectedNodeId;
    el.btnYes.disabled = !enabled;
    el.btnNo.disabled = !enabled;
    el.btnBack.disabled = state.history.length === 0; // back depends on history
    el.btnResultCopy.disabled = !state.lastResultText;
    el.btnResultPdf.disabled = !state.lastResultText;
  }

  function selectTree(tree) {
    state.selectedTree = tree;
    state.history = [];
    state.lastResultText = "";
    state.selectedNodeId = null;

    const name = treeTitle(tree);
    el.selectedTreeLine.textContent = `${tr("selectedTree")} ${name}`;

    const nodes = getNodesForTree(tree);
    el.nodeCount.textContent = String(Array.isArray(nodes) ? nodes.length : 0);

    // start at first node (question) if exists
    const first = Array.isArray(nodes) ? nodes.find(n => n && n.id && (n.type || "question")) : null;
    if (!first) {
      el.diagText.textContent = tr("selectFirst");
      state.selectedNodeId = null;
      renderDiagnosisButtonsState();
      return;
    }

    const start = nodes[0];
    goToNode(start.id, false);
  }

  function getNodesForTree(tree) {
    if (!tree) return [];
    if (Array.isArray(tree.nodes)) return tree.nodes;

    const id = tree.id || tree.treeId || tree.key;
    if (id && state.content && state.content.nodesByTreeId && Array.isArray(state.content.nodesByTreeId[id])) {
      return state.content.nodesByTreeId[id];
    }
    return [];
  }

  function findNode(nodes, nodeId) {
    return (Array.isArray(nodes) ? nodes.find(n => n && n.id === nodeId) : null);
  }

  function goToNode(nodeId, pushHistory = true) {
    const nodes = getNodesForTree(state.selectedTree);
    const node = findNode(nodes, nodeId);
    if (!node) return;

    if (pushHistory && state.selectedNodeId) {
      state.history.push(state.selectedNodeId);
    }

    state.selectedNodeId = nodeId;

    if ((node.type || "question") === "result") {
      const txt = nodeText(node).trim();
      state.lastResultText = txt || "";
      el.diagText.textContent = txt || tr("resultReady");
      setStatus(tr("resultReady"));
      renderDiagnosisButtonsState();
      return;
    }

    // question
    state.lastResultText = "";
    el.diagText.textContent = nodeText(node) || tr("selectFirst");
    renderDiagnosisButtonsState();
  }

  // ====== RESULTS: TXT + PDF ======
  async function copyResultTxt() {
    const txt = (state.lastResultText || "").trim();
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      setStatus(tr("copiedText"));
    } catch (_) {
      window.prompt("Copy:", txt);
    }
  }

  function downloadPdf() {
    const txt = (state.lastResultText || "").trim();
    if (!txt) return;

    // Minimal PDF via browser print-like approach (no external libs)
    // -> we generate a simple HTML blob and open print dialog; user can "Save as PDF"
    // But user asked "PDF" direct. We will generate a basic PDF with jsPDF-like manual? Not available.
    // So we do a safe universal fallback: open a printable page with the result.
    const html = `<!doctype html><html><head><meta charset="utf-8">
      <title>Ergebnis</title>
      <style>
        body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:24px;}
        h1{font-size:18px;margin:0 0 12px;}
        pre{white-space:pre-wrap;font-size:16px;}
      </style></head><body>
      <h1>Ergebnis / Výsledok</h1>
      <pre>${escapeHtml(txt)}</pre>
      <script>window.print();</script>
      </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // ====== ADMIN: IMPORT/EXPORT ======
  function exportContent() {
    const raw = localStorage.getItem(LS_KEY) || JSON.stringify(state.content || {}, null, 2);
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "content.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setStatus(tr("copied")); // reuse as success-ish
  }

  function importContentFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        localStorage.setItem(LS_KEY, JSON.stringify(parsed));
        state.content = parsed;
        state.categories = normalizeCategories(parsed);
        // re-render everything
        state.selectedTree = null;
        state.selectedNodeId = null;
        state.history = [];
        state.lastResultText = "";
        applyTexts();
        renderTabs();
        renderCategories();
        showCategories();
        renderDiagnosisButtonsState();
        setStatus(tr("imported"));
      } catch (e) {
        setStatus(tr("importFail"));
      }
    };
    reader.onerror = () => setStatus(tr("importFail"));
    reader.readAsText(file);
  }

  function resetToDefault() {
    localStorage.removeItem(LS_KEY);
    setStatus(tr("resetOk"));
    // hard reload to ensure clean state
    window.location.reload();
  }

  // ====== EVENTS ======
  function bindEvents() {
    // Tabs
    el.tabCategories.addEventListener("click", showCategories);
    el.tabDiagnosis.addEventListener("click", showDiagnosis);

    // Language menu
    el.langBtn.addEventListener("click", () => el.langMenu.classList.toggle("hidden"));
    el.langMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang]");
      if (!btn) return;
      state.lang = btn.dataset.lang;
      el.langLabel.textContent = state.lang.toUpperCase();
      el.langMenu.classList.add("hidden");

      // Update titles + list + current node text
      applyTexts();
      renderTabs();
      renderCategories();
      if (state.selectedTree && state.selectedNodeId) {
        goToNode(state.selectedNodeId, false);
        const name = treeTitle(state.selectedTree);
        el.selectedTreeLine.textContent = `${tr("selectedTree")} ${name}`;
      } else if (!state.selectedTree) {
        el.diagText.textContent = tr("selectFirst");
      }
      renderDiagnosisButtonsState();
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".langWrap")) return;
      el.langMenu.classList.add("hidden");
    });

    // Collapse (hide main parts)
    el.collapseBtn.addEventListener("click", () => {
      state.collapsed = !state.collapsed;
      el.collapseBtn.textContent = state.collapsed ? tr("expand") : tr("collapse");
      if (state.collapsed) {
        closePanels();
        toggle(el.categoriesView, false);
        toggle(el.diagnosisView, false);
      } else {
        showCategories();
      }
    });

    // Contact / Feedback inline
    el.contactBtn.addEventListener("click", () => openPanel("contact"));
    el.feedbackBtn.addEventListener("click", () => openPanel("feedback"));
    el.closeContactBtn.addEventListener("click", closePanels);
    el.closeFeedbackBtn.addEventListener("click", closePanels);
    el.closeAdminBtn.addEventListener("click", closePanels);

    // Share
    el.shareBtn.addEventListener("click", async () => {
      const url = window.location.href;
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, url });
          return;
        }
      } catch (_) {}

      try {
        await navigator.clipboard.writeText(url);
        setStatus(tr("copied"));
      } catch (_) {
        window.prompt("Copy link:", url);
      }
    });

    // Feedback copy/send
    el.fbCopy.addEventListener("click", async () => {
      const txt = (el.fbText.value || "").trim();
      if (!txt) return;
      try {
        await navigator.clipboard.writeText(txt);
        setStatus(tr("copiedText"));
      } catch (_) {
        window.prompt("Copy:", txt);
      }
    });

    el.fbSend.addEventListener("click", () => {
      const txt = (el.fbText.value || "").trim();
      if (!txt) return;
      const subject = encodeURIComponent("Wohnmobil Diagnose – Feedback");
      const body = encodeURIComponent(txt);
      const mailto = `mailto:caravantechnikerammain@gmail.com?subject=${subject}&body=${body}`;
      window.location.href = mailto;
    });

    // Admin: 5x tap on WOMO
    el.adminBtn.addEventListener("click", () => {
      state.adminTapCount += 1;
      if (state.adminTapTimer) clearTimeout(state.adminTapTimer);
      state.adminTapTimer = setTimeout(() => { state.adminTapCount = 0; }, 1100);

      if (state.adminTapCount >= 5) {
        state.adminTapCount = 0;
        adminUnlockFlow();
      }
    });

    // Admin panel actions
    el.exportBtn.addEventListener("click", exportContent);
    el.importBtn.addEventListener("click", () => el.importFile.click());
    el.importFile.addEventListener("change", () => {
      const file = el.importFile.files && el.importFile.files[0];
      if (!file) return;
      importContentFromFile(file);
      el.importFile.value = "";
    });
    el.resetBtn.addEventListener("click", resetToDefault);

    // Diagnosis buttons
    el.btnYes.addEventListener("click", () => answer(true));
    el.btnNo.addEventListener("click", () => answer(false));
    el.btnBack.addEventListener("click", () => {
      const prev = state.history.pop();
      if (!prev) return;
      goToNode(prev, false);
    });

    el.btnResultCopy.addEventListener("click", copyResultTxt);
    el.btnResultPdf.addEventListener("click", downloadPdf);
  }

  function answer(isYes) {
    if (!state.selectedTree || !state.selectedNodeId) return;
    const nodes = getNodesForTree(state.selectedTree);
    const node = findNode(nodes, state.selectedNodeId);
    if (!node) return;

    const next = isYes ? node.yes : node.no;
    if (!next) return;
    goToNode(next, true);
  }

  function adminUnlockFlow() {
    const pass = window.prompt(tr("adminPrompt"));
    if (!pass) return;

    if (String(pass).trim() === ADMIN_PASS) {
      state.adminUnlocked = true;
      setStatus(tr("adminUnlocked"));
      openPanel("admin");
    } else {
      state.adminUnlocked = false;
      setStatus(tr("wrongPass"));
    }
  }

  // ====== CONTACT LINKS ======
  function initContactLinks() {
    const phone = "+4915163812554";
    el.waLink.href = `https://wa.me/${phone.replace(/\+/g, "")}`;
  }

  // ====== INIT ======
  async function init() {
    initContactLinks();
    bindEvents();

    // service worker optional
    if ("serviceWorker" in navigator) {
      try { await navigator.serviceWorker.register("sw.js"); } catch (_) {}
    }

    try {
      await loadContent();
    } catch (_) {
      state.categories = [];
      state.content = {};
    }

    el.langLabel.textContent = state.lang.toUpperCase();
    applyTexts();
    renderTabs();
    renderCategories();
    renderDiagnosisButtonsState();
    showCategories();

    // baseline: no persistent "locked" message, only show when unlocked
    el.statusLine.textContent = "";
  }

  init();
})();