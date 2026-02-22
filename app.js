(() => {
  "use strict";

  // ====== STATE ======
  const state = {
    lang: "de",
    content: null,
    categories: [],
    selectedTree: null,
    adminUnlocked: false,
    adminTapCount: 0,
    adminTapTimer: null,
    collapsed: false,

    toastTimer: null,
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
    closePanelsBtn: $("closePanelsBtn"),
    closePanelsBtn2: $("closePanelsBtn2"),

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

    telLink: $("telLink"),
    waLink: $("waLink"),
    mailLink: $("mailLink"),
    contactHint: $("contactHint"),

    contactTitle: $("contactTitle"),
    feedbackTitle: $("feedbackTitle"),
    fbLabel: $("fbLabel"),
    fbHint: $("fbHint"),
    appTitle: $("appTitle"),

    onlineLabel: $("onlineLabel"),
    diagnosisTitle: $("diagnosisTitle"),
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
      fbSend: "Senden",
      fbCopy: "Text kopieren",
      fbHint: "Senden öffnet E-Mail (Fallback: kopieren).",
      fbPlaceholder: "Was fehlt, was ist unklar, welche Störung?",
      selectFirst: "Bitte zuerst links Kategorie/Baum auswählen.",
      selectedTree: "Ausgewählter Baum:",
      demoEmpty: "Demo: Dieser Baum hat noch keine Fragen/Nodes im content.json.",
      adminPrompt: "Admin-Passwort",
      wrongPass: "Falsches Passwort.",
      adminUnlocked: "Admin aktiviert.",
      copied: "Link kopiert.",
      copiedText: "Text kopiert.",
      openMailFail: "E-Mail konnte nicht geöffnet werden – Text kopieren.",
      ok: "OK",
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
      fbSend: "Odoslať",
      fbCopy: "Kopírovať text",
      fbHint: "Odoslanie otvorí E-mail (ak nejde, skopíruj text).",
      fbPlaceholder: "Čo chýba, čo je nejasné, aká porucha?",
      selectFirst: "Najprv vyber kategóriu a strom.",
      selectedTree: "Vybraný strom:",
      demoEmpty: "Demo: Tento strom ešte nemá otázky/nody v content.json.",
      adminPrompt: "Admin heslo",
      wrongPass: "Zlé heslo.",
      adminUnlocked: "Admin aktivovaný.",
      copied: "Link skopírovaný.",
      copiedText: "Text skopírovaný.",
      openMailFail: "E-mail sa nepodarilo otvoriť – skopíruj text.",
      ok: "OK",
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
    // tabCategories = doplníme pri renderTabs()

    el.categoriesTitle.textContent = tr("categories");
    el.diagnosisTitle.textContent = tr("diagnosis");

    el.contactTitle.textContent = tr("contact");
    el.feedbackTitle.textContent = tr("fbTitle");
    el.fbLabel.textContent = tr("fbLabel");
    el.fbSend.textContent = tr("fbSend");
    el.fbCopy.textContent = tr("fbCopy");
    el.fbHint.textContent = tr("fbHint");

    el.fbText.placeholder = tr("fbPlaceholder");

    el.contactHint.textContent = tr("contactHint");
    el.selectedTreeLine.textContent = `${tr("selectedTree")} –`;

    el.onlineLabel.textContent = tr("online");
  }

  // ====== TOAST (AUTO HIDE) ======
  function toast(msg, ms = 1800) {
    if (!msg) return;

    el.statusLine.textContent = msg;
    el.statusLine.classList.add("show");

    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      el.statusLine.classList.remove("show");
      // necháme text, aby pri rýchlom flickeri nebolo prázdno; vizuálne je skryté
    }, ms);
  }

  function toggle(elm, show) {
    elm.classList.toggle("hidden", !show);
  }

  function closePanels() {
    toggle(el.inlinePanels, false);
    toggle(el.contactPanel, false);
    toggle(el.feedbackPanel, false);
  }

  function openPanel(which) {
    toggle(el.inlinePanels, true);
    toggle(el.contactPanel, which === "contact");
    toggle(el.feedbackPanel, which === "feedback");
  }

  function safeNumber(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  }

  // ====== CONTENT LOADING ======
  async function loadContent() {
    // relatívna cesta (GitHub Pages aj Netlify)
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
    return state.lang === "sk" ? (cat.title_sk || cat.title_de) : (cat.title_de || cat.title_sk);
  }

  function treeTitle(tree) {
    const de = tree.title_de || tree.title || tree.name_de || tree.name || "Baum";
    const sk = tree.title_sk || tree.name_sk || tree.name || de;
    return state.lang === "sk" ? sk : de;
  }

  // ====== RENDER ======
  function render() {
    applyTexts();
    renderTabs();
    renderCategories();
    renderDiagnosisButtonsState();

    // ak nie je vybraný strom, ukáž správu podľa jazyka
    if (!state.selectedTree) {
      el.diagText.textContent = tr("selectFirst");
      el.nodeCount.textContent = "0";
      el.selectedTreeLine.textContent = `${tr("selectedTree")} –`;
    }
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
        toggle(treeWrap, open);          // ak open=true, tak schováme
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

  function selectTree(tree) {
    state.selectedTree = tree;

    const name = treeTitle(tree);
    el.selectedTreeLine.textContent = `${tr("selectedTree")} ${name}`;

    const nodes = getNodesForTree(tree);
    const nodeLen = Array.isArray(nodes) ? nodes.length : 0;
    el.nodeCount.textContent = String(nodeLen);

    if (!nodeLen) {
      el.diagText.textContent = tr("demoEmpty");
      renderDiagnosisButtonsState();
      return;
    }

    const first = nodes[0];
    const txt = (state.lang === "sk")
      ? (first.text_sk || first.text || first.question_sk || first.question || "")
      : (first.text_de || first.text || first.question_de || first.question || "");

    el.diagText.textContent = txt || tr("demoEmpty");
    renderDiagnosisButtonsState();
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
    const enabled = !!state.selectedTree;
    el.btnYes.disabled = !enabled;
    el.btnNo.disabled = !enabled;
    el.btnBack.disabled = !enabled;
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

      // preložiť list a aj vybraný strom
      renderCategories();
      if (state.selectedTree) selectTree(state.selectedTree);
    });

    // Close language menu on outside click
    document.addEventListener("click", (e) => {
      if (e.target.closest(".langWrap")) return;
      el.langMenu.classList.add("hidden");
    });

    // Collapse
    el.collapseBtn.addEventListener("click", () => {
      state.collapsed = !state.collapsed;

      // Skryjeme obsah, header ostane
      if (state.collapsed) {
        closePanels();
        toggle(el.inlinePanels, false);
        toggle(el.categoriesView, false);
        toggle(el.diagnosisView, false);
      } else {
        // vrátime ten view, ktorý bol aktívny podľa tabov
        const catActive = el.tabCategories.classList.contains("active");
        toggle(el.categoriesView, catActive);
        toggle(el.diagnosisView, !catActive);
      }

      el.collapseBtn.textContent = state.collapsed ? tr("expand") : tr("collapse");
    });

    // Contact / Feedback inline (žiadny modal)
    el.contactBtn.addEventListener("click", () => openPanel("contact"));
    el.feedbackBtn.addEventListener("click", () => openPanel("feedback"));

    el.closePanelsBtn.addEventListener("click", closePanels);
    el.closePanelsBtn2.addEventListener("click", closePanels);

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
        toast(tr("copied"));
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
        toast(tr("copiedText"));
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
        toast(tr("openMailFail"));
      }
    });

    // Admin: 5x tap on WOMO (bez alertov)
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

    // Diagnose buttons – zatiaľ placeholder (napojíme neskôr na strom)
    el.btnYes.addEventListener("click", () => {
      if (!state.selectedTree) return;
      toast(tr("ok"));
    });
    el.btnNo.addEventListener("click", () => {
      if (!state.selectedTree) return;
      toast(tr("ok"));
    });
    el.btnBack.addEventListener("click", () => {
      if (!state.selectedTree) return;
      toast(tr("ok"));
    });
  }

  function adminUnlockFlow() {
    const pass = window.prompt(tr("adminPrompt"));
    if (!pass) return;

    if (pass === "128hz" || pass === "admin") {
      state.adminUnlocked = true;
      toast(tr("adminUnlocked"), 2200);
    } else {
      state.adminUnlocked = false;
      toast(tr("wrongPass"), 2200);
    }
  }

  function initContactLinks() {
    const phone = "+4915163812554";
    el.waLink.href = `https://wa.me/${phone.replace(/\+/g, "")}`;
  }

  // ====== INIT ======
  async function init() {
    initContactLinks();
    bindEvents();

    // Service worker (ponechávam, nech je to PWA-ready)
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("sw.js");
      } catch (_) { /* ignore */ }
    }

    try {
      await loadContent();
    } catch (e) {
      state.categories = [];
      state.content = {};
    }

    el.langLabel.textContent = state.lang.toUpperCase();
    render();
    showCategories();
  }

  init();
})();
