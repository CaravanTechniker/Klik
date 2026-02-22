(() => {
  "use strict";

  // ====== CONFIG ======
  // Admin heslá: primárne "1" (podľa teba), nechávam aj "128hz" ako fallback
  const ADMIN_PASSWORDS = new Set(["1", "128hz"]);

  // Status/toast auto-hide (ms)
  const STATUS_TOAST_MS = 1800;

  // LocalStorage keys
  const LS_CONTENT_OVERRIDE = "womo_content_override_v1";

  // ====== STATE ======
  const state = {
    lang: "de",
    content: null,
    categories: [],
    selectedTree: null,

    // diagnose runtime
    nodes: [],
    currentNodeId: null,
    history: [],

    adminUnlocked: false,
    adminTapCount: 0,
    adminTapTimer: null,

    collapsed: false,

    // status
    statusTimer: null,
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
    contactPanel: $("contactPanel"),
    feedbackPanel: $("feedbackPanel"),
    adminPanel: $("adminPanel"),

    closePanelsBtn: $("closePanelsBtn"),
    closePanelsBtn2: $("closePanelsBtn2"),
    closePanelsBtn3: $("closePanelsBtn3"),

    fbText: $("fbText"),
    fbSend: $("fbSend"),
    fbCopy: $("fbCopy"),

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

    // result
    resultBox: $("resultBox"),
    resultTitle: $("resultTitle"),
    resultText: $("resultText"),
    btnCopyResult: $("btnCopyResult"),
    btnDownloadTxt: $("btnDownloadTxt"),
    btnDownloadPdf: $("btnDownloadPdf"),

    // contact
    telLink: $("telLink"),
    waLink: $("waLink"),
    mailLink: $("mailLink"),
    contactHint: $("contactHint"),

    lblPhone: $("lblPhone"),
    lblWa: $("lblWa"),
    lblMail: $("lblMail"),

    // admin tools
    adminTitle: $("adminTitle"),
    adminHint: $("adminHint"),
    btnExportContent: $("btnExportContent"),
    btnImportContent: $("btnImportContent"),
    fileImport: $("fileImport"),

    // headings
    contactTitle: $("contactTitle"),
    feedbackTitle: $("feedbackTitle"),
    fbLabel: $("fbLabel"),
    fbHint: $("fbHint"),
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

      selectFirst: "Bitte zuerst links Kategorie/Problem auswählen.",
      selectedTree: "Ausgewähltes Problem:",
      demoEmpty: "Demo: Dieses Problem hat noch keine Fragen/Nodes im content.json.",

      adminLocked: "Admin gesperrt.",
      adminUnlocked: "Admin entsperrt.",
      adminPrompt: "Admin-Passwort",
      wrongPass: "Falsches Passwort.",

      copied: "Link kopiert.",
      copiedText: "Text kopiert.",
      copiedResult: "Ergebnis kopiert.",
      openMailFail: "E-Mail konnte nicht geöffnet werden – Text kopieren.",

      resultTitle: "Ergebnis",
      copy: "Copy",
      txt: "TXT",
      pdf: "PDF",

      adminTitle: "Admin",
      adminHint:
        "Import nahradí aktuálny obsah (ukladá sa do LocalStorage). Export stiahne aktuálnu verziu.",
      exportContent: "Export content.json",
      importContent: "Import content.json",
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
      fbPlaceholder: "Čo chýba, čo je nejasné, aká porucha/problém?",
      fbSend: "Odoslať",
      fbCopy: "Kopírovať text",
      fbHint: "Odoslanie otvorí E-mail (ak nejde, skopíruj text).",

      selectFirst: "Najprv vyber kategóriu a problém.",
      selectedTree: "Vybraný problém:",
      demoEmpty: "Demo: Tento problém ešte nemá otázky/nody v content.json.",

      adminLocked: "Admin zamknutý.",
      adminUnlocked: "Admin odomknutý.",
      adminPrompt: "Admin heslo",
      wrongPass: "Zlé heslo.",

      copied: "Link skopírovaný.",
      copiedText: "Text skopírovaný.",
      copiedResult: "Výsledok skopírovaný.",
      openMailFail: "E-mail sa nepodarilo otvoriť – skopíruj text.",

      resultTitle: "Výsledok",
      copy: "Copy",
      txt: "TXT",
      pdf: "PDF",

      adminTitle: "Admin",
      adminHint:
        "Import nahradí aktuálny obsah (uloží sa do LocalStorage). Export stiahne aktuálnu verziu.",
      exportContent: "Export content.json",
      importContent: "Import content.json",
    },
  };

  function tr(key) {
    return (T[state.lang] && T[state.lang][key]) || (T.de[key] || key);
  }

  function applyTexts() {
    document.documentElement.lang = state.lang;

    el.appTitle.textContent = tr("appTitle");
    el.contactBtn.textContent = tr("brand");

    el.collapseBtn.textContent = state.collapsed ? tr("expand") : tr("collapse");
    el.feedbackBtn.textContent = tr("feedback");
    el.shareBtn.textContent = tr("share");

    el.tabDiagnosis.textContent = tr("diagnosis");
    el.categoriesTitle.textContent = tr("categories");
    el.diagnosisTitle.textContent = tr("diagnosis");

    el.contactTitle.textContent = tr("contact");
    el.feedbackTitle.textContent = tr("fbTitle");

    el.lblPhone.textContent = tr("phone");
    el.lblWa.textContent = tr("whatsapp");
    el.lblMail.textContent = tr("email");
    el.contactHint.textContent = tr("contactHint");

    el.fbLabel.textContent = tr("fbLabel");
    el.fbText.placeholder = tr("fbPlaceholder");
    el.fbSend.textContent = tr("fbSend");
    el.fbCopy.textContent = tr("fbCopy");
    el.fbHint.textContent = tr("fbHint");

    el.selectedTreeLine.textContent = `${tr("selectedTree")} –`;
    el.diagText.textContent = tr("selectFirst");

    el.resultTitle.textContent = tr("resultTitle");
    el.btnCopyResult.textContent = tr("copy");
    el.btnDownloadTxt.textContent = tr("txt");
    el.btnDownloadPdf.textContent = tr("pdf");

    el.adminTitle.textContent = tr("adminTitle");
    el.adminHint.textContent = tr("adminHint");
    el.btnExportContent.textContent = tr("exportContent");
    el.btnImportContent.textContent = tr("importContent");

    el.onlineLabel.textContent = tr("online");

    // status baseline (no alert)
    el.statusLine.textContent = state.adminUnlocked ? tr("adminUnlocked") : tr("adminLocked");
  }

  // ====== HELPERS ======
  function setStatus(msg, transient = true) {
    if (state.statusTimer) clearTimeout(state.statusTimer);

    el.statusLine.textContent = msg;

    if (transient) {
      state.statusTimer = setTimeout(() => {
        el.statusLine.textContent = state.adminUnlocked ? tr("adminUnlocked") : tr("adminLocked");
      }, STATUS_TOAST_MS);
    }
  }

  function toggle(elm, show) {
    elm.classList.toggle("hidden", !show);
  }

  function closePanels() {
    toggle(el.inlinePanels, false);
    toggle(el.contactPanel, false);
    toggle(el.feedbackPanel, false);
    toggle(el.adminPanel, false);
  }

  function openPanel(which) {
    toggle(el.inlinePanels, true);
    toggle(el.contactPanel, which === "contact");
    toggle(el.feedbackPanel, which === "feedback");
    toggle(el.adminPanel, which === "admin");
  }

  function safeNumber(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  }

  function downloadBlob(filename, mime, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadText(filename, text) {
    downloadBlob(filename, "text/plain;charset=utf-8", new Blob([text], { type: "text/plain;charset=utf-8" }));
  }

  // ====== CONTENT LOADING ======
  async function loadContent() {
    // 1) ak je override z admin importu, použijeme ten
    const override = localStorage.getItem(LS_CONTENT_OVERRIDE);
    if (override) {
      try {
        const parsed = JSON.parse(override);
        state.content = parsed;
        state.categories = normalizeCategories(parsed);
        return;
      } catch (_) {
        // zlé dáta v LS → zruš
        localStorage.removeItem(LS_CONTENT_OVERRIDE);
      }
    }

    // 2) inak načítaj content.json relatívne (GitHub Pages aj Netlify)
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

  function catTitle(cat) {
    return state.lang === "sk"
      ? (cat.title_sk || cat.title_de)
      : (cat.title_de || cat.title_sk);
  }

  function treeTitle(tree) {
    const de = tree.title_de || tree.title || tree.name_de || tree.name || "Problem";
    const sk = tree.title_sk || tree.name_sk || tree.name || de;
    return state.lang === "sk" ? sk : de;
  }

  // ====== RENDER ======
  function render() {
    applyTexts();
    renderTabs();
    renderCategories();
    renderDiagnosisButtonsState();
    renderAdminVisibility();
  }

  function renderTabs() {
    el.tabCategories.classList.toggle("active", !el.categoriesView.classList.contains("hidden"));
    el.tabDiagnosis.classList.toggle("active", !el.diagnosisView.classList.contains("hidden"));

    const catCount = state.categories.length;
    el.tabCategories.textContent = `${tr("categories")} (${catCount})`;
    el.categoriesCount.textContent = `${catCount} ks`;
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
        toggle(treeWrap, open); // when open==true -> hide, else show
        btn.textContent = open ? "▾" : "▴";
      });

      right.appendChild(count);
      right.appendChild(btn);

      item.appendChild(left);
      item.appendChild(right);

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

  function renderAdminVisibility() {
    // admin panel sa zobrazí iba keď je odomknutý (otvára sa z WOMO tlačidla po odomknutí)
    // tu len nič - UI zostáva jednoduché
  }

  // ====== DIAGNOSE FLOW ======
  function selectTree(tree) {
    state.selectedTree = tree;
    state.history = [];

    const name = treeTitle(tree);
    el.selectedTreeLine.textContent = `${tr("selectedTree")} ${name}`;

    state.nodes = Array.isArray(tree.nodes) ? tree.nodes : [];
    el.nodeCount.textContent = String(state.nodes.length);

    // reset result UI
    hideResult();

    if (!state.nodes.length) {
      el.diagText.textContent = tr("demoEmpty");
      state.currentNodeId = null;
      renderDiagnosisButtonsState();
      return;
    }

    // start node
    const startId = tree.start || state.nodes[0].id;
    state.currentNodeId = startId;
    renderCurrentNode();
    renderDiagnosisButtonsState();
  }

  function findNodeById(id) {
    return state.nodes.find((n) => n.id === id) || null;
  }

  function nodeText(node) {
    if (!node) return "";
    if (node.type === "result") {
      return state.lang === "sk"
        ? (node.text_sk || node.text || "")
        : (node.text_de || node.text || "");
    }
    return state.lang === "sk"
      ? (node.q_sk || node.question_sk || node.text_sk || "")
      : (node.q_de || node.question_de || node.text_de || "");
  }

  function renderCurrentNode() {
    hideResult();

    const node = findNodeById(state.currentNodeId);
    if (!node) {
      el.diagText.textContent = tr("demoEmpty");
      return;
    }

    if (node.type === "result") {
      // Ergebnis
      const res = nodeText(node).trim();
      showResult(res || "—");
      // keď je výsledok, disable Ja/Nein, nech ostane iba Zurück + exporty
      el.btnYes.disabled = true;
      el.btnNo.disabled = true;
      el.btnBack.disabled = state.history.length === 0;
      return;
    }

    el.diagText.textContent = nodeText(node) || tr("demoEmpty");
  }

  function goNext(answerKey) {
    const node = findNodeById(state.currentNodeId);
    if (!node || node.type === "result") return;

    const nextId = node[answerKey];
    if (!nextId) {
      // ak nie je definované, skončíme do výsledku
      showResult(tr("demoEmpty"));
      return;
    }

    state.history.push(state.currentNodeId);
    state.currentNodeId = nextId;
    renderCurrentNode();
    renderDiagnosisButtonsState();
  }

  function goBack() {
    if (!state.history.length) return;
    hideResult();
    state.currentNodeId = state.history.pop();
    renderCurrentNode();
    renderDiagnosisButtonsState();
  }

  function showResult(text) {
    toggle(el.resultBox, true);
    el.resultText.textContent = text;
    // auto scroll do výsledku (na menších displejoch)
    el.resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideResult() {
    toggle(el.resultBox, false);
    el.resultText.textContent = "";
  }

  function renderDiagnosisButtonsState() {
    const enabled = !!state.selectedTree && !!state.currentNodeId;
    // ak nie je vybrané nič
    el.btnYes.disabled = !enabled;
    el.btnNo.disabled = !enabled;
    el.btnBack.disabled = !enabled || state.history.length === 0;
  }

  // ====== PDF (self-contained minimal PDF generator) ======
  // Vytvorí jednoduchý PDF so základným textom (Helvetica). Bez knižníc.
  function makeSimplePdf(text) {
    // normalize lines
    const lines = (text || "").replace(/\r/g, "").split("\n");

    // PDF text stream (very basic)
    const escapePdf = (s) =>
      s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

    // page size A4 points
    const pageW = 595.28, pageH = 841.89;
    const margin = 50;
    const fontSize = 12;
    const lineH = 16;

    let y = pageH - margin;

    let stream = "BT\n/F1 " + fontSize + " Tf\n";
    stream += `${margin} ${y} Td\n`;

    for (const ln of lines) {
      const safe = escapePdf(ln);
      stream += `(${safe}) Tj\n0 -${lineH} Td\n`;
      y -= lineH;
      if (y < margin) {
        // cut off (single page minimal)
        break;
      }
    }
    stream += "ET\n";

    // Build PDF objects
    const objs = [];
    const offsets = [];

    const addObj = (str) => {
      offsets.push(null); // placeholder
      objs.push(str);
      return objs.length;
    };

    const header = "%PDF-1.3\n";
    // 1 Catalog
    addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    // 2 Pages
    addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    // 3 Page
    addObj(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    // 4 Font
    addObj("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
    // 5 Contents
    addObj(`5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`);

    // xref
    let body = "";
    let pos = header.length;

    for (let i = 0; i < objs.length; i++) {
      offsets[i] = pos;
      body += objs[i];
      pos += objs[i].length;
    }

    const xrefStart = header.length + body.length;
    let xref = "xref\n0 " + (objs.length + 1) + "\n";
    xref += "0000000000 65535 f \n";
    for (const off of offsets) {
      xref += String(off).padStart(10, "0") + " 00000 n \n";
    }

    const trailer =
      `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    const pdf = header + body + xref + trailer;
    return new Blob([pdf], { type: "application/pdf" });
  }

  // ====== UI NAV ======
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

  // ====== EVENTS ======
  function bindEvents() {
    // Tabs
    el.tabCategories.addEventListener("click", showCategories);
    el.tabDiagnosis.addEventListener("click", showDiagnosis);

    // Language menu
    el.langBtn.addEventListener("click", () => {
      el.langMenu.classList.toggle("hidden");
    });
    el.langMenu.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lang]");
      if (!btn) return;
      state.lang = btn.dataset.lang;
      el.langLabel.textContent = state.lang.toUpperCase();
      el.langMenu.classList.add("hidden");
      render();
      // re-render list and current node/result
      renderCategories();
      if (state.selectedTree) {
        // refresh titles + node text
        selectTree(state.selectedTree);
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".langWrap")) return;
      el.langMenu.classList.add("hidden");
    });

    // Collapse
    el.collapseBtn.addEventListener("click", () => {
      state.collapsed = !state.collapsed;
      const hide = state.collapsed;

      // skryjeme všetko okrem headera
      toggle(el.categoriesView, !hide && !el.categoriesView.classList.contains("hidden"));
      toggle(el.diagnosisView, !hide && !el.diagnosisView.classList.contains("hidden"));
      toggle(el.inlinePanels, !hide && !el.inlinePanels.classList.contains("hidden"));

      el.collapseBtn.textContent = state.collapsed ? tr("expand") : tr("collapse");
      if (hide) closePanels();
    });

    // Contact / Feedback inline
    el.contactBtn.addEventListener("click", () => openPanel("contact"));
    el.feedbackBtn.addEventListener("click", () => openPanel("feedback"));

    el.closePanelsBtn.addEventListener("click", closePanels);
    el.closePanelsBtn2.addEventListener("click", closePanels);
    el.closePanelsBtn3.addEventListener("click", closePanels);

    // Share
    el.shareBtn.addEventListener("click", async () => {
      const url = window.location.href;
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, url });
          return;
        }
      } catch (_) { /* ignore */ }

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

      try {
        window.location.href = mailto;
      } catch (_) {
        setStatus(tr("openMailFail"));
      }
    });

    // Admin: 5x tap on WOMO
    el.adminBtn.addEventListener("click", () => {
      state.adminTapCount += 1;

      if (state.adminTapTimer) clearTimeout(state.adminTapTimer);
      state.adminTapTimer = setTimeout(() => {
        state.adminTapCount = 0;
      }, 1100);

      if (state.adminTapCount >= 5) {
        state.adminTapCount = 0;
        adminUnlockFlow();
      }
    });

    // Diagnose buttons
    el.btnYes.addEventListener("click", () => goNext("yes"));
    el.btnNo.addEventListener("click", () => goNext("no"));
    el.btnBack.addEventListener("click", () => goBack());

    // Ergebnis actions
    el.btnCopyResult.addEventListener("click", async () => {
      const txt = (el.resultText.textContent || "").trim();
      if (!txt) return;
      try {
        await navigator.clipboard.writeText(txt);
        setStatus(tr("copiedResult"));
      } catch (_) {
        window.prompt("Copy:", txt);
      }
    });

    el.btnDownloadTxt.addEventListener("click", () => {
      const txt = (el.resultText.textContent || "").trim();
      if (!txt) return;
      downloadText("ergebnis.txt", txt);
      setStatus("OK");
    });

    el.btnDownloadPdf.addEventListener("click", () => {
      const txt = (el.resultText.textContent || "").trim();
      if (!txt) return;
      const pdfBlob = makeSimplePdf(txt);
      downloadBlob("ergebnis.pdf", "application/pdf", pdfBlob);
      setStatus("OK");
    });

    // Admin import/export
    el.btnExportContent.addEventListener("click", () => {
      if (!state.adminUnlocked) return;
      const json = JSON.stringify(state.content || { categories: [] }, null, 2);
      downloadText("content.json", json);
      setStatus("OK");
    });

    el.btnImportContent.addEventListener("click", () => {
      if (!state.adminUnlocked) return;
      el.fileImport.click();
    });

    el.fileImport.addEventListener("change", async () => {
      const f = el.fileImport.files && el.fileImport.files[0];
      if (!f) return;

      try {
        const txt = await f.text();
        const parsed = JSON.parse(txt);

        // validate minimally
        const cats = normalizeCategories(parsed);
        state.content = parsed;
        state.categories = cats;

        // persist override
        localStorage.setItem(LS_CONTENT_OVERRIDE, JSON.stringify(parsed));

        // re-render
        render();
        showCategories();
        closePanels();
        setStatus("OK");
      } catch (e) {
        setStatus("Import failed", true);
      } finally {
        el.fileImport.value = "";
      }
    });
  }

  function adminUnlockFlow() {
    const pass = window.prompt(tr("adminPrompt"));
    if (pass == null) return;

    if (ADMIN_PASSWORDS.has(String(pass).trim())) {
      state.adminUnlocked = true;
      setStatus(tr("adminUnlocked"), true);
      // otvor admin panel hneď po odomknutí (bez ďalšieho klikania)
      openPanel("admin");
    } else {
      state.adminUnlocked = false;
      setStatus(tr("wrongPass"), true);
      closePanels();
    }
  }

  // WhatsApp link
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
      try {
        await navigator.serviceWorker.register("sw.js");
      } catch (_) { /* ignore */ }
    }

    try {
      await loadContent();
    } catch (_) {
      state.categories = [];
      state.content = { categories: [] };
    }

    el.langLabel.textContent = state.lang.toUpperCase();

    render();
    setStatus(tr("adminLocked"), false);
    showCategories();
  }

  init();
})();
