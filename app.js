(() => {
  "use strict";

  // ===== VERSION =====
  const APP_VERSION = "UI v1.0";

  // ===== CONTACT (podľa tvojich požiadaviek) =====
  const CONTACT_EMAIL = "caravantechnikerammain@gmail.com";
  const CONTACT_PHONE = "+49 151 638 12 554";
  const CONTACT_PHONE_DIGITS = "4915163812554"; // pre WhatsApp wa.me (bez + a medzier)
  const ADMIN_PASSWORD = "1";

  // ===== i18n =====
  const I18N = {
    de: {
      appTitle: "Wohnmobil Diagnose",
      subtitleBtn: "CaravanTechniker am Main",
      tabFaults: "Störungen",
      tabDiag: "Diagnose",
      categoriesTitle: "Kategorien",
      collapseAll: "Einklappen",
      feedback: "Feedback",
      share: "Teilen",
      shareTxt: "TXT",
      sharePdf: "PDF",
      pickTree: "Wähle einen Baum im Bereich Störungen.",
      uiNote: "Aktuell UI. Baum-Logik folgt nach Stabilisierung der Inhalte.",
      modalClose: "Schließen",
      contactTitle: "Kontakt",
      contactBody:
        "Kontakt bitte bevorzugt per WhatsApp Nachricht oder E-Mail. Telefon wegen Auslastung meist nicht erreichbar.",
      feedbackTitle: "Feedback zur App",
      feedbackBody:
        "Wähle eine einfache Versandmethode. WhatsApp ist am schnellsten.",
      adminTitle: "Admin",
      adminBody: "Passwort eingeben:",
      adminWrong: "Falsches Passwort.",
      adminOk: "Admin entsperrt. (Funktionen folgen.)",
      loadedErr: "Inhalt konnte nicht geladen werden (content.json)."
    },
    sk: {
      appTitle: "Wohnmobil Diagnose",
      subtitleBtn: "CaravanTechniker am Main",
      tabFaults: "Poruchy",
      tabDiag: "Diagnostika",
      categoriesTitle: "Kategórie",
      collapseAll: "Zbaliť",
      feedback: "Pripomienky",
      share: "Zdieľať",
      shareTxt: "TXT",
      sharePdf: "PDF",
      pickTree: "Vyber strom v časti Poruchy.",
      uiNote: "Zatiaľ je to UI. Logiku stromov napojíme po stabilizácii obsahu.",
      modalClose: "Zavrieť",
      contactTitle: "Kontakt",
      contactBody:
        "Kontakt preferujem cez WhatsApp správu alebo e-mail. Telefón kvôli vyťaženiu zvyčajne nezdvíham.",
      feedbackTitle: "Pripomienky k aplikácii",
      feedbackBody:
        "Vyber jednoduchý spôsob odoslania. WhatsApp je najrýchlejší.",
      adminTitle: "Admin",
      adminBody: "Zadaj heslo:",
      adminWrong: "Nesprávne heslo.",
      adminOk: "Admin odomknutý. (Funkcie doplníme.)",
      loadedErr: "Obsah sa nepodarilo načítať (content.json)."
    }
  };

  // ===== STATE =====
  const LS_LANG = "womo_lang";
  const LS_OPEN_CATS = "womo_open_cats";
  const LS_SELECTED_TREE = "womo_selected_tree";

  let lang = loadLang();
  let content = null;
  let adminUnlocked = false;

  // ===== ELEMENTS =====
  const $ = (id) => document.getElementById(id);

  const el = {
    logoBtn: $("logoBtn"),
    logoInner: $("logoInner"),
    appTitle: $("appTitle"),
    contactBtn: $("contactBtn"),

    langSelect: $("langSelect"),
    collapseAllBtn: $("collapseAllBtn"),
    feedbackBtn: $("feedbackBtn"),
    shareSelect: $("shareSelect"),

    tabFaults: $("tabFaults"),
    tabDiag: $("tabDiag"),
    faultsPanel: $("faultsPanel"),
    diagPanel: $("diagPanel"),

    categoriesTitle: $("categoriesTitle"),
    treeCount: $("treeCount"),
    accordion: $("accordion"),

    diagTitle: $("diagTitle"),
    diagHeadline: $("diagHeadline"),
    diagText: $("diagText"),

    ver: $("ver"),

    modalOverlay: $("modalOverlay"),
    modalTitle: $("modalTitle"),
    modalBody: $("modalBody"),
    modalExtra: $("modalExtra"),
    modalClose: $("modalClose")
  };

  // ===== INIT =====
  document.addEventListener("DOMContentLoaded", async () => {
    el.ver.textContent = APP_VERSION;

    // prevent long-press context menu on logo (mobile)
    el.logoBtn.addEventListener("contextmenu", (e) => e.preventDefault());

    bindUI();
    applyLangToUI();
    await loadContent();
    renderAll();

    // restore selected tree
    const savedTree = localStorage.getItem(LS_SELECTED_TREE);
    if (savedTree) setSelectedTree(savedTree, { scroll: false });
  });

  // ===== UI BINDINGS =====
  function bindUI() {
    el.langSelect.value = lang;
    el.langSelect.addEventListener("change", () => {
      lang = el.langSelect.value;
      localStorage.setItem(LS_LANG, lang);
      applyLangToUI();
      renderAll();
    });

    el.tabFaults.addEventListener("click", () => setTab("faults"));
    el.tabDiag.addEventListener("click", () => setTab("diag"));

    el.collapseAllBtn.addEventListener("click", () => {
      saveOpenCats([]);
      renderCategories();
    });

    el.feedbackBtn.addEventListener("click", () => openFeedback());

    el.shareSelect.addEventListener("change", async () => {
      const v = el.shareSelect.value;
      el.shareSelect.value = "";
      if (!v) return;

      if (v === "txt") await shareAsTXT();
      if (v === "pdf") shareAsPDF();
    });

    el.contactBtn.addEventListener("click", () => openContact());
    el.logoBtn.addEventListener("click", () => openAdminPrompt());

    el.modalClose.addEventListener("click", closeModal);
    el.modalOverlay.addEventListener("click", (e) => {
      if (e.target === el.modalOverlay) closeModal();
    });
  }

  // ===== TAB =====
  function setTab(which) {
    const isFaults = which === "faults";
    el.tabFaults.classList.toggle("active", isFaults);
    el.tabDiag.classList.toggle("active", !isFaults);
    el.faultsPanel.style.display = isFaults ? "block" : "none";
    el.diagPanel.style.display = isFaults ? "none" : "block";
  }

  // ===== LANGUAGE =====
  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.de[key] || key;
  }

  function applyLangToUI() {
    document.documentElement.lang = lang === "sk" ? "sk" : "de";
    el.appTitle.textContent = t("appTitle");
    el.contactBtn.textContent = t("subtitleBtn");

    el.tabFaults.textContent = t("tabFaults");
    el.tabDiag.textContent = t("tabDiag");

    el.categoriesTitle.textContent = t("categoriesTitle");
    el.collapseAllBtn.textContent = t("collapseAll");
    el.feedbackBtn.textContent = t("feedback");

    // share dropdown labels
    // Note: first option is placeholder
    el.shareSelect.options[0].text = t("share");
    el.shareSelect.options[1].text = t("shareTxt");
    el.shareSelect.options[2].text = t("sharePdf");

    el.diagTitle.textContent = t("tabDiag");
    el.diagHeadline.textContent = t("pickTree");
    el.diagText.textContent = t("uiNote");

    el.modalClose.textContent = t("modalClose");
  }

  function loadLang() {
    const saved = localStorage.getItem(LS_LANG);
    if (saved === "de" || saved === "sk") return saved;
    return "de"; // priorita DE
  }

  // ===== CONTENT LOADING =====
  async function loadContent() {
    try {
      const res = await fetch("./content.json", { cache: "no-store" });
      if (!res.ok) throw new Error("content.json not found");
      content = await res.json();
    } catch (err) {
      console.error(err);
      showModal("Error", t("loadedErr"));
      content = { categories: [], trees: [] };
    }
  }

  // ===== RENDER =====
  function renderAll() {
    renderCategories();
    updateCounts();
  }

  function updateCounts() {
    const cnt = content?.trees?.length || 0;
    el.treeCount.textContent = cnt ? `${cnt} ks` : "";
  }

  function renderCategories() {
    if (!content) return;

    const openCats = loadOpenCats();

    // clear
    el.accordion.innerHTML = "";

    const categories = content.categories || [];
    const trees = content.trees || [];

    categories.forEach((cat) => {
      const catId = cat.id;
      const catName = (cat.name && (cat.name[lang] || cat.name.de || cat.name.sk)) || catId;

      const catTrees = trees.filter((tr) => tr.categoryId === catId);
      const count = catTrees.length;

      const catEl = document.createElement("div");
      catEl.className = "cat" + (openCats.includes(catId) ? " open" : "");

      const header = document.createElement("button");
      header.className = "catHeader";
      header.type = "button";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.alignItems = "flex-start";

      const title = document.createElement("div");
      title.textContent = catName;

      const meta = document.createElement("div");
      meta.className = "catMeta";
      meta.textContent = `${count} ks`;

      left.appendChild(title);
      left.appendChild(meta);

      const chev = document.createElement("div");
      chev.className = "chev";
      chev.textContent = openCats.includes(catId) ? "▾" : "▸";

      header.appendChild(left);
      header.appendChild(chev);

      const body = document.createElement("div");
      body.className = "catBody";

      const list = document.createElement("div");
      list.className = "treeList";

      catTrees.forEach((tr) => {
        const item = document.createElement("div");
        item.className = "treeItem";
        item.dataset.treeId = tr.id;

        const tt = (tr.title && (tr.title[lang] || tr.title.de || tr.title.sk)) || tr.id;
        const st = (tr.subtitle && (tr.subtitle[lang] || tr.subtitle.de || tr.subtitle.sk)) || "";

        const l = document.createElement("div");
        l.innerHTML = `<div>${escapeHtml(tt)}</div><small>${escapeHtml(st)}</small>`;

        const r = document.createElement("div");
        r.style.fontWeight = "900";
        r.style.color = "var(--muted)";
        r.textContent = "›";

        item.appendChild(l);
        item.appendChild(r);

        item.addEventListener("click", () => {
          setSelectedTree(tr.id, { scroll: true });
          setTab("diag");
        });

        list.appendChild(item);
      });

      body.appendChild(list);

      header.addEventListener("click", () => {
        const currentlyOpen = loadOpenCats();
        const isOpen = catEl.classList.contains("open");

        if (isOpen) {
          catEl.classList.remove("open");
          chev.textContent = "▸";
          saveOpenCats(currentlyOpen.filter((x) => x !== catId));
        } else {
          catEl.classList.add("open");
          chev.textContent = "▾";
          saveOpenCats([...new Set([...currentlyOpen, catId])]);
        }
      });

      catEl.appendChild(header);
      catEl.appendChild(body);
      el.accordion.appendChild(catEl);
    });

    // re-apply selected highlight
    const sel = localStorage.getItem(LS_SELECTED_TREE);
    if (sel) highlightSelectedTree(sel);
  }

  function setSelectedTree(treeId, opts = { scroll: true }) {
    localStorage.setItem(LS_SELECTED_TREE, treeId);
    highlightSelectedTree(treeId);

    const tree = (content?.trees || []).find((t) => t.id === treeId);
    const title = tree?.title?.[lang] || tree?.title?.de || tree?.title?.sk || treeId;

    el.diagHeadline.textContent = title;
    el.diagText.textContent = t("uiNote");

    if (opts.scroll) {
      // open parent category
      const catId = tree?.categoryId;
      if (catId) {
        const openCats = loadOpenCats();
        if (!openCats.includes(catId)) saveOpenCats([...openCats, catId]);
        renderCategories();
        highlightSelectedTree(treeId);

        // scroll
        const node = el.accordion.querySelector(`[data-tree-id="${cssEscape(treeId)}"]`);
        if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function highlightSelectedTree(treeId) {
    el.accordion.querySelectorAll(".treeItem").forEach((n) => {
      n.classList.toggle("selected", n.dataset.treeId === treeId);
    });
  }

  function loadOpenCats() {
    try {
      const raw = localStorage.getItem(LS_OPEN_CATS);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function saveOpenCats(arr) {
    localStorage.setItem(LS_OPEN_CATS, JSON.stringify(arr || []));
  }

  // ===== MODALS =====
  function showModal(title, body, extraNode = null) {
    el.modalTitle.textContent = title;
    el.modalBody.textContent = body;
    el.modalExtra.innerHTML = "";
    if (extraNode) el.modalExtra.appendChild(extraNode);
    el.modalOverlay.classList.add("open");
  }
  function closeModal() {
    el.modalOverlay.classList.remove("open");
  }

  function openContact() {
    const box = document.createElement("div");
    box.className = "modalRow";

    const mail = document.createElement("a");
    mail.className = "btn primary";
    mail.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Wohnmobil Diagnose - Kontakt")}`;
    mail.textContent = "E-mail";

    const wa = document.createElement("a");
    wa.className = "btn";
    wa.href = `https://wa.me/${CONTACT_PHONE_DIGITS}?text=${encodeURIComponent("Dobrý deň, mám otázku k Wohnmobil Diagnose.")}`;
    wa.target = "_blank";
    wa.rel = "noreferrer";
    wa.textContent = "WhatsApp";

    const tel = document.createElement("a");
    tel.className = "btn";
    tel.href = `tel:${CONTACT_PHONE.replace(/\s/g, "")}`;
    tel.textContent = CONTACT_PHONE;

    box.appendChild(mail);
    box.appendChild(wa);
    box.appendChild(tel);

    showModal(t("contactTitle"), t("contactBody"), box);
  }

  function openFeedback() {
    const box = document.createElement("div");
    box.className = "modalRow";

    const subj = encodeURIComponent("Wohnmobil Diagnose - pripomienky");
    const body = encodeURIComponent(
      "Napíš pripomienku:\n\n" +
      "Verzia: " + APP_VERSION + "\n" +
      "URL: " + location.href + "\n" +
      "Jazyk: " + lang.toUpperCase() + "\n"
    );

    const mail = document.createElement("a");
    mail.className = "btn primary";
    mail.href = `mailto:${CONTACT_EMAIL}?subject=${subj}&body=${body}`;
    mail.textContent = "E-mail";

    const wa = document.createElement("a");
    wa.className = "btn";
    wa.href = `https://wa.me/${CONTACT_PHONE_DIGITS}?text=${encodeURIComponent("Pripomienky k aplikácii Wohnmobil Diagnose:\n\n")}`;
    wa.target = "_blank";
    wa.rel = "noreferrer";
    wa.textContent = "WhatsApp";

    box.appendChild(mail);
    box.appendChild(wa);

    showModal(t("feedbackTitle"), t("feedbackBody"), box);
  }

  function openAdminPrompt() {
    const wrap = document.createElement("div");
    wrap.className = "modalRow";

    const input = document.createElement("input");
    input.className = "input";
    input.type = "password";
    input.placeholder = "…";
    input.autocomplete = "off";
    input.inputMode = "numeric";

    const ok = document.createElement("button");
    ok.className = "btn primary";
    ok.type = "button";
    ok.textContent = "OK";

    ok.addEventListener("click", () => {
      if (input.value === ADMIN_PASSWORD) {
        adminUnlocked = true;
        closeModal();
        showModal(t("adminTitle"), t("adminOk"));
      } else {
        input.value = "";
        showModal(t("adminTitle"), t("adminWrong"));
      }
    });

    wrap.appendChild(input);
    wrap.appendChild(ok);

    showModal(t("adminTitle"), t("adminBody"), wrap);
    setTimeout(() => input.focus(), 50);
  }

  // ===== SHARE =====
  async function shareAsTXT() {
    const selectedId = localStorage.getItem(LS_SELECTED_TREE) || "";
    const selectedTree = (content?.trees || []).find((x) => x.id === selectedId);
    const selectedTitle =
      selectedTree?.title?.[lang] || selectedTree?.title?.de || selectedTree?.title?.sk || "";

    const text =
      `${t("appTitle")} (${APP_VERSION})\n` +
      `URL: ${location.href}\n` +
      `Jazyk: ${lang.toUpperCase()}\n` +
      (selectedTitle ? `Vybraný strom: ${selectedTitle}\n` : "") +
      `Kontakt: ${CONTACT_EMAIL} | ${CONTACT_PHONE}\n`;

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title: t("appTitle"), text });
        return;
      } catch (_) {}
    }

    // fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      showModal("OK", "TXT skopírované do schránky.");
    } catch {
      showModal("TXT", text);
    }
  }

  function shareAsPDF() {
    // Základ: otvorí print dialog (používateľ uloží ako PDF)
    showModal("PDF", "Otváram tlač. V dialógu vyber „Uložiť ako PDF“.");
    setTimeout(() => window.print(), 250);
  }

  // ===== HELPERS =====
  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cssEscape(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/"/g, '\\"');
  }
})();
