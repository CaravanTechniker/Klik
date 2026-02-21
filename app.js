(() => {
  "use strict";

  const APP_VERSION = "UI v1.0";

  // CONTACT (podľa tvojich požiadaviek)
  const CONTACT_EMAIL = "caravantechnikerammain@gmail.com";
  const CONTACT_PHONE = "+49 151 638 12 554";
  const CONTACT_PHONE_DIGITS = "4915163812554"; // pre WhatsApp wa.me (bez medzier a +)
  const ADMIN_PASSWORD = "1";

  // i18n (DE a SK teraz, pripravené na ďalšie jazyky neskôr)
  const I18N = {
    de: {
      appName: "Wohnmobil Diagnose",
      subtitle: "CaravanTechniker am Main",
      tabIssues: "Störungen",
      tabDiag: "Diagnose",
      catsTitle: "Kategorien",
      collapseAll: "Einklappen",
      feedback: "Feedback",
      share: "Teilen",
      shareTxt: "TXT Export",
      sharePdf: "PDF (Drucken)",
      selectedTree: (name) => `Ausgewählt: ${name || "—"}`,
      ready: "Bereit.",
      readySub: "Wähle einen Baum unter „Störungen“ und starte dann.",
      yes: "Ja",
      no: "Nein",
      back: "Zurück",
      reset: "Reset",
      statusReady: "Ready",
      contactTitle: "Kontakt",
      contactLine1: "Kontakt bitte bevorzugt per WhatsApp Nachricht. Telefon wird wegen Auslastung nicht angenommen.",
      contactLine2: `Email: ${CONTACT_EMAIL} | Tel: ${CONTACT_PHONE}`,
      email: "Email",
      whatsapp: "WhatsApp Nachricht",
      close: "Schließen",
      fbTitle: "Feedback zur App",
      fbText: "Sende deine Rückmeldung per Email oder WhatsApp. Kurz + konkret.",
      adminTitle: "Admin",
      adminHint: "Passwort eingeben.",
      unlock: "Entsperren",
      adminHint2: "Importiere alle Bäume als eine JSON-Datei (gesamt).",
      import: "Importieren",
      exportJson: "JSON Export",
      note: "Hinweis: Import überschreibt die lokal gespeicherten Daten auf diesem Gerät.",
      treeCount: (n) => `${n} Stück`,
      catCount: (n) => `${n} Stück`,
      demo: "Demo",
      pdfTitle: "Wohnmobil Diagnose - Export"
    },
    sk: {
      appName: "Wohnmobil Diagnose",
      subtitle: "CaravanTechniker am Main",
      tabIssues: "Poruchy",
      tabDiag: "Diagnostika",
      catsTitle: "Kategórie",
      collapseAll: "Zbaliť",
      feedback: "Pripomienky",
      share: "Zdieľať",
      shareTxt: "TXT export",
      sharePdf: "PDF (Print)",
      selectedTree: (name) => `Vybraný strom: ${name || "—"}`,
      ready: "Pripravené.",
      readySub: "Vyber strom v „Poruchy“ a potom pokračuj.",
      yes: "Áno",
      no: "Nie",
      back: "Späť",
      reset: "Reset",
      statusReady: "Ready",
      contactTitle: "Kontakt",
      contactLine1: "Kontaktuj ma prosím cez WhatsApp správu. Telefón kvôli vyťaženiu nedvíham.",
      contactLine2: `Email: ${CONTACT_EMAIL} | Tel: ${CONTACT_PHONE}`,
      email: "Email",
      whatsapp: "WhatsApp správa",
      close: "Zavrieť",
      fbTitle: "Pripomienky k aplikácii",
      fbText: "Pošli pripomienku cez email alebo WhatsApp. Stručne a vecne.",
      adminTitle: "Admin",
      adminHint: "Zadaj heslo.",
      unlock: "Odomknúť",
      adminHint2: "Importuj celé stromy naraz ako jeden JSON súbor.",
      import: "Importovať",
      exportJson: "Exportovať JSON",
      note: "Poznámka: Import prepíše lokálne dáta na tomto zariadení.",
      treeCount: (n) => `${n} ks`,
      catCount: (n) => `${n} ks`,
      demo: "Demo",
      pdfTitle: "Wohnmobil Diagnose - Export"
    }
  };

  // DOM
  const elLang = document.getElementById("langSelect");
  const elAppName = document.getElementById("uiAppName");
  const elBtnContact = document.getElementById("btnContact");
  const elTabIssues = document.getElementById("tabIssues");
  const elTabDiag = document.getElementById("tabDiag");
  const panelIssues = document.getElementById("panelIssues");
  const panelDiag = document.getElementById("panelDiag");
  const elCatsTitle = document.getElementById("uiCatsTitle");
  const elTreeCount = document.getElementById("uiTreeCount");
  const elCategories = document.getElementById("categories");

  const elBtnCollapseAll = document.getElementById("btnCollapseAll");
  const elBtnFeedback = document.getElementById("btnFeedback");

  const elBtnShare = document.getElementById("btnShare");
  const elShareMenu = document.getElementById("shareMenu");
  const elShareTxt = document.getElementById("shareTxt");
  const elSharePdf = document.getElementById("sharePdf");

  const elSelectedTree = document.getElementById("uiSelectedTree");
  const elDiagHeadline = document.getElementById("uiDiagHeadline");
  const elDiagSub = document.getElementById("uiDiagSub");
  const elBtnYes = document.getElementById("btnYes");
  const elBtnNo = document.getElementById("btnNo");
  const elBtnBack = document.getElementById("btnBack");
  const elBtnReset = document.getElementById("btnReset");
  const elVersion = document.getElementById("uiVersion");
  const elStatus = document.getElementById("uiStatus");

  // Modals
  const modalContact = document.getElementById("modalContact");
  const modalFeedback = document.getElementById("modalFeedback");
  const modalAdmin = document.getElementById("modalAdmin");

  // Contact modal elements
  const contactTitle = document.getElementById("contactTitle");
  const contactLine1 = document.getElementById("contactLine1");
  const contactLine2 = document.getElementById("contactLine2");
  const btnMail = document.getElementById("btnMail");
  const btnWhatsApp = document.getElementById("btnWhatsApp");
  const closeContact = document.getElementById("closeContact");

  // Feedback modal elements
  const fbTitle = document.getElementById("fbTitle");
  const fbText = document.getElementById("fbText");
  const fbMail = document.getElementById("fbMail");
  const fbWa = document.getElementById("fbWa");
  const closeFeedback = document.getElementById("closeFeedback");

  // Admin modal elements
  const logoAdminBtn = document.getElementById("logoAdminBtn");
  const adminTitle = document.getElementById("adminTitle");
  const adminLocked = document.getElementById("adminLocked");
  const adminUnlocked = document.getElementById("adminUnlocked");
  const adminHint = document.getElementById("adminHint");
  const adminHint2 = document.getElementById("adminHint2");
  const adminPass = document.getElementById("adminPass");
  const adminUnlock = document.getElementById("adminUnlock");
  const adminFile = document.getElementById("adminFile");
  const adminImport = document.getElementById("adminImport");
  const adminExport = document.getElementById("adminExport");
  const adminClose1 = document.getElementById("adminClose1");
  const adminClose2 = document.getElementById("adminClose2");

  // State
  let lang = loadLang();
  let data = null;                 // content.json structure
  let selectedTreeId = null;
  let selectedTreeName = null;

  // Admin unlock (len v tomto zariadení, po refresh ostane)
  const ADMIN_KEY = "ct_admin_unlocked";
  let adminIsUnlocked = sessionStorage.getItem(ADMIN_KEY) === "1";

  // ----- INIT -----
  elVersion.textContent = APP_VERSION;
  elLang.value = lang;

  // Block long-press copy menu on logo button
  logoAdminBtn.addEventListener("contextmenu", (e) => e.preventDefault());

  // Hidden admin entry: 5 taps
  let tapCount = 0;
  let tapTimer = null;
  logoAdminBtn.addEventListener("click", () => {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (tapCount = 0), 900);
    if (tapCount >= 5) {
      tapCount = 0;
      openAdminModal();
    }
  });

  // Tabs
  elTabIssues.addEventListener("click", () => setTab("issues"));
  elTabDiag.addEventListener("click", () => setTab("diag"));

  // Collapse all
  elBtnCollapseAll.addEventListener("click", () => collapseAllCategories());

  // Feedback
  elBtnFeedback.addEventListener("click", () => openFeedbackModal());

  // Share dropdown
  elBtnShare.addEventListener("click", () => {
    elShareMenu.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!elBtnShare.contains(e.target) && !elShareMenu.contains(e.target)) {
      elShareMenu.classList.remove("open");
    }
  });

  elShareTxt.addEventListener("click", async () => {
    elShareMenu.classList.remove("open");
    await exportTxt();
  });

  elSharePdf.addEventListener("click", () => {
    elShareMenu.classList.remove("open");
    exportPdfPrint();
  });

  // Contact button
  elBtnContact.addEventListener("click", () => openContactModal());

  closeContact.addEventListener("click", () => closeModal(modalContact));
  closeFeedback.addEventListener("click", () => closeModal(modalFeedback));
  adminClose1.addEventListener("click", () => closeModal(modalAdmin));
  adminClose2.addEventListener("click", () => closeModal(modalAdmin));

  // Admin unlock flow
  adminUnlock.addEventListener("click", () => {
    const p = (adminPass.value || "").trim();
    if (p === ADMIN_PASSWORD) {
      adminIsUnlocked = true;
      sessionStorage.setItem(ADMIN_KEY, "1");
      adminPass.value = "";
      renderAdminModal();
    } else {
      adminPass.value = "";
      adminPass.focus();
    }
  });

  adminImport.addEventListener("click", async () => {
    const file = adminFile.files && adminFile.files[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const json = JSON.parse(txt);
      validateContentJson(json);
      saveLocalContent(json);
      data = json;
      selectedTreeId = null;
      selectedTreeName = null;
      closeModal(modalAdmin);
      renderAll();
      setTab("issues");
    } catch (err) {
      // ticho - nechceš vysvetlenia; keď niečo nejde, riešime ďalším krokom
    }
  });

  adminExport.addEventListener("click", () => {
    const current = loadLocalContent() || data;
    if (!current) return;
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: "application/json" });
    downloadBlob(blob, "content_export.json");
  });

  // Diagnostic buttons (zatiaľ demo)
  elBtnYes.addEventListener("click", () => setStatus("OK"));
  elBtnNo.addEventListener("click", () => setStatus("…"));
  elBtnBack.addEventListener("click", () => setStatus(I18N[lang].back));
  elBtnReset.addEventListener("click", () => {
    // reset bez confirm okna
    selectedTreeId = null;
    selectedTreeName = null;
    renderDiag();
    setTab("issues");
    collapseAllCategories();
  });

  // Language switch
  elLang.addEventListener("change", () => {
    lang = elLang.value;
    saveLang(lang);
    renderAll();
  });

  // Load data (prefer local import, otherwise fetch content.json)
  boot();

  async function boot() {
    applyText(); // initial UI labels
    const local = loadLocalContent();
    if (local) {
      data = local;
      renderAll();
      return;
    }

    try {
      const res = await fetch("./content.json", { cache: "no-store" });
      data = await res.json();
      renderAll();
    } catch (e) {
      data = makeFallbackData();
      renderAll();
    }
  }

  // ----- RENDER -----
  function renderAll() {
    applyText();
    renderCategories();
    renderDiag();
  }

  function applyText() {
    const t = I18N[lang];

    document.documentElement.lang = lang === "de" ? "de" : "sk";
    document.title = t.appName;

    elAppName.textContent = t.appName;
    elBtnContact.textContent = t.subtitle;

    elTabIssues.textContent = t.tabIssues;
    elTabDiag.textContent = t.tabDiag;

    elCatsTitle.textContent = t.catsTitle;

    elBtnCollapseAll.textContent = t.collapseAll;
    elBtnFeedback.textContent = t.feedback;
    elBtnShare.textContent = `${t.share} ▾`;

    elShareTxt.textContent = t.shareTxt;
    elSharePdf.textContent = t.sharePdf;

    elBtnYes.textContent = t.yes;
    elBtnNo.textContent = t.no;
    elBtnBack.textContent = t.back;
    elBtnReset.textContent = t.reset;

    elStatus.textContent = t.statusReady;

    // Contact modal strings
    contactTitle.textContent = t.contactTitle;
    contactLine1.textContent = t.contactLine1;
    contactLine2.textContent = t.contactLine2;

    // mail + whatsapp links
    btnMail.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.appName)}&body=${encodeURIComponent("Dobrý deň,\n\n")}`;
    btnWhatsApp.href = `https://wa.me/${CONTACT_PHONE_DIGITS}?text=${encodeURIComponent("Dobrý deň, mám otázku k aplikácii Wohnmobil Diagnose…")}`;

    // Feedback modal strings
    fbTitle.textContent = t.fbTitle;
    fbText.textContent = t.fbText;
    fbMail.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Pripomienky k aplikácii")}\
&body=${encodeURIComponent("Popis problému:\n\nZariadenie / prehliadač:\n\nKroky:\n1)\n2)\n3)\n\n")}`;
    fbWa.href = `https://wa.me/${CONTACT_PHONE_DIGITS}?text=${encodeURIComponent("Pripomienka k aplikácii: ")}`;

    // Admin modal strings
    adminTitle.textContent = t.adminTitle;
    adminHint.textContent = t.adminHint;
    adminHint2.textContent = t.adminHint2;

    adminUnlock.textContent = t.unlock;
    adminImport.textContent = t.import;
    adminExport.textContent = t.exportJson;

    renderAdminModal();
  }

  function renderAdminModal() {
    if (adminIsUnlocked) {
      adminLocked.style.display = "none";
      adminUnlocked.style.display = "block";
    } else {
      adminLocked.style.display = "block";
      adminUnlocked.style.display = "none";
    }
  }

  function renderCategories() {
    if (!data || !Array.isArray(data.categories)) {
      elCategories.innerHTML = "";
      elTreeCount.textContent = "—";
      return;
    }

    const allTrees = data.categories.flatMap(c => c.trees || []);
    elTreeCount.textContent = I18N[lang].treeCount(allTrees.length);

    elCategories.innerHTML = "";

    data.categories.forEach((cat, idx) => {
      const catId = `cat_${idx}`;
      const trees = Array.isArray(cat.trees) ? cat.trees : [];

      const wrap = document.createElement("div");
      wrap.className = "cat";

      const header = document.createElement("button");
      header.className = "catHeader";
      header.type = "button";
      header.setAttribute("aria-expanded", "false");

      const left = document.createElement("div");
      left.className = "catHeaderLeft";

      const name = document.createElement("div");
      name.textContent = getText(cat.name);
      name.style.fontSize = "16px";

      const meta = document.createElement("div");
      meta.className = "catMeta";
      meta.textContent = I18N[lang].catCount(trees.length);

      left.appendChild(name);
      left.appendChild(meta);

      const arrow = document.createElement("div");
      arrow.textContent = "▾";
      arrow.style.fontWeight = "900";
      arrow.style.opacity = ".75";

      header.appendChild(left);
      header.appendChild(arrow);

      const body = document.createElement("div");
      body.className = "catBody";
      body.id = catId;

      // Trees as cards (no long scroll, each category collapsible)
      trees.forEach(tree => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "treeBtn";
        if (tree.id === selectedTreeId) btn.classList.add("selected");

        const l = document.createElement("div");
        l.className = "left";

        const n = document.createElement("div");
        n.className = "name";
        n.textContent = getText(tree.title);

        const d = document.createElement("div");
        d.className = "desc";
        d.textContent = getText(tree.desc || I18N[lang].demo);

        l.appendChild(n);
        l.appendChild(d);

        const che = document.createElement("div");
        che.textContent = "›";
        che.style.fontSize = "20px";
        che.style.fontWeight = "900";
        che.style.opacity = ".6";

        btn.appendChild(l);
        btn.appendChild(che);

        btn.addEventListener("click", () => {
          selectedTreeId = tree.id;
          selectedTreeName = getText(tree.title);
          // zvýraznenie vybratého
          renderCategories();
          renderDiag();
          setTab("diag");
        });

        body.appendChild(btn);
      });

      header.addEventListener("click", () => {
        const isOpen = body.classList.contains("open");
        // toggle
        if (isOpen) {
          body.classList.remove("open");
          header.setAttribute("aria-expanded", "false");
          arrow.textContent = "▾";
        } else {
          body.classList.add("open");
          header.setAttribute("aria-expanded", "true");
          arrow.textContent = "▴";
        }
      });

      wrap.appendChild(header);
      wrap.appendChild(body);
      elCategories.appendChild(wrap);
    });
  }

  function renderDiag() {
    const t = I18N[lang];
    elSelectedTree.textContent = t.selectedTree(selectedTreeName);
    elDiagHeadline.textContent = t.ready;
    elDiagSub.textContent = selectedTreeId ? t.readySub : t.readySub;
