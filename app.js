(() => {
  "use strict";

  const APP_VERSION = "UI v1.0";

  // CONTACT
  const CONTACT_EMAIL = "caravantechnikerammain@gmail.com";
  const CONTACT_PHONE = "+49 151 638 12 554";
  const CONTACT_PHONE_DIGITS = "4915163812554";

  // i18n
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
      back: "← Zurück",
      online: "Online",
      contactTitle: "Kontakt",
      contactBody:
        "Kontakt bitte bevorzugt per WhatsApp Nachricht oder E-Mail.\nTelefon wegen Auslastung meist nicht erreichbar.\n\nWhatsApp: +" + CONTACT_PHONE + "\nE-Mail: " + CONTACT_EMAIL,
      feedbackTitle: "Feedback zur App",
      feedbackBody:
        "Sende Feedback bitte per WhatsApp oder E-Mail.\n\nWhatsApp: wa.me/" + CONTACT_PHONE_DIGITS + "\nE-Mail: " + CONTACT_EMAIL,
      loadedErr: "Inhalt konnte nicht geladen werden (content.json).",
      pickTree: "Wähle einen Baum aus."
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
      back: "← Späť",
      online: "Online",
      contactTitle: "Kontakt",
      contactBody:
        "Kontakt prosím preferuj cez WhatsApp alebo e-mail.\nTelefon zvyčajne nedostupný.\n\nWhatsApp: +" + CONTACT_PHONE + "\nE-mail: " + CONTACT_EMAIL,
      feedbackTitle: "Pripomienky k aplikácii",
      feedbackBody:
        "Pripomienky pošli cez WhatsApp alebo e-mail.\n\nWhatsApp: wa.me/" + CONTACT_PHONE_DIGITS + "\nE-mail: " + CONTACT_EMAIL,
      loadedErr: "Obsah sa nepodarilo načítať (content.json).",
      pickTree: "Vyber strom."
    }
  };

  // DOM
  const $ = (id) => document.getElementById(id);

  const el = {
    appTitle: $("appTitle"),
    contactBtn: $("contactBtn"),
    langBtn: $("langBtn"),
    langLabel: $("langLabel"),
    langMenu: $("langMenu"),
    collapseAllBtn: $("collapseAllBtn"),
    feedbackBtn: $("feedbackBtn"),
    shareBtn: $("shareBtn"),
    shareMenu: $("shareMenu"),
    shareTxtBtn: $("shareTxtBtn"),
    sharePdfBtn: $("sharePdfBtn"),

    tabFaults: $("tabFaults"),
    tabDiag: $("tabDiag"),
    categoriesTitle: $("categoriesTitle"),
    categoryCount: $("categoryCount"),
    categories: $("categories"),

    treePanel: $("treePanel"),
    treeTitle: $("treeTitle"),
    treeSubtitle: $("treeSubtitle"),
    treeBody: $("treeBody"),
    backBtn: $("backBtn"),

    onlineText: $("onlineText"),
    versionText: $("versionText"),

    modalOverlay: $("modalOverlay"),
    modal: $("modal"),
    modalTitle: $("modalTitle"),
    modalBody: $("modalBody"),
    modalClose: $("modalClose"),
    modalOk: $("modalOk"),
  };

  // STATE
  let lang = localStorage.getItem("lang") || "de";
  let tab = localStorage.getItem("tab") || "faults"; // faults | diag
  let content = null;

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || (I18N.de && I18N.de[key]) || key;
  }

  function setTexts() {
    el.appTitle.textContent = t("appTitle");
    el.contactBtn.textContent = t("subtitleBtn");

    el.tabFaults.textContent = t("tabFaults");
    el.tabDiag.textContent = t("tabDiag");
    el.categoriesTitle.textContent = t("categoriesTitle");

    el.collapseAllBtn.textContent = t("collapseAll");
    el.feedbackBtn.textContent = t("feedback");
    el.shareBtn.textContent = t("share");
    el.shareTxtBtn.textContent = t("shareTxt");
    el.sharePdfBtn.textContent = t("sharePdf");

    el.backBtn.textContent = t("back");
    el.onlineText.textContent = t("online");
    el.versionText.textContent = APP_VERSION;

    el.langLabel.textContent = lang.toUpperCase();
  }

  function openMenu(menuEl) {
    menuEl.classList.remove("hidden");
    setTimeout(() => {
      const onDoc = (e) => {
        if (!menuEl.contains(e.target) && e.target !== el.langBtn && e.target !== el.shareBtn) {
          menuEl.classList.add("hidden");
          document.removeEventListener("click", onDoc, true);
        }
      };
      document.addEventListener("click", onDoc, true);
    }, 0);
  }

  function showModal(title, body) {
    el.modalTitle.textContent = title;
    el.modalBody.textContent = body;
    el.modalOverlay.classList.remove("hidden");
    el.modal.classList.remove("hidden");
  }

  function closeModal() {
    el.modalOverlay.classList.add("hidden");
    el.modal.classList.add("hidden");
  }

  function setTab(nextTab) {
    tab = nextTab;
    localStorage.setItem("tab", tab);
    el.tabFaults.classList.toggle("active", tab === "faults");
    el.tabDiag.classList.toggle("active", tab === "diag");

    // pre demo/UI zatiaľ renderujeme rovnaké kategórie
    renderCategories();
  }

  function collapseAll() {
    [...document.querySelectorAll(".accItem")].forEach((x) => x.classList.remove("open"));
  }

  function renderCategories() {
    if (!content) return;

    const categories = content.categories || [];
    const trees = content.trees || [];

    el.categoryCount.textContent = `${categories.length} ks`;

    el.categories.innerHTML = "";

    categories.forEach((cat) => {
      const catName = (cat.name && cat.name[lang]) || (cat.name && cat.name.de) || cat.id;

      const catTrees = trees.filter((tr) => tr.categoryId === cat.id);

      const item = document.createElement("div");
      item.className = "accItem";

      const head = document.createElement("div");
      head.className = "accHead";

      const left = document.createElement("div");
      left.className = "accTitle";
      left.textContent = catName;

      const meta = document.createElement("div");
      meta.className = "accMeta";
      meta.innerHTML = `<span>${catTrees.length} ks</span><span class="chev">▾</span>`;

      head.appendChild(left);
      head.appendChild(meta);

      const body = document.createElement("div");
      body.className = "accBody";

      const list = document.createElement("div");
      list.className = "treeList";

      catTrees.forEach((tr) => {
        const title = (tr.title && tr.title[lang]) || (tr.title && tr.title.de) || tr.id;
        const subtitle = (tr.subtitle && tr.subtitle[lang]) || (tr.subtitle && tr.subtitle.de) || "";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "treeBtn";
        btn.innerHTML = `
          <div class="left">
            <div class="t">${escapeHtml(title)}</div>
            <div class="s">${escapeHtml(subtitle)}</div>
          </div>
          <div class="chev">›</div>
        `;

        btn.addEventListener("click", () => openTree(tr));
        list.appendChild(btn);
      });

      body.appendChild(list);

      head.addEventListener("click", () => {
        item.classList.toggle("open");
      });

      item.appendChild(head);
      item.appendChild(body);

      el.categories.appendChild(item);
    });

    // panel stromu skryť pri rendri kategórií
    el.treePanel.classList.add("hidden");
  }

  function openTree(tr) {
    const title = (tr.title && tr.title[lang]) || (tr.title && tr.title.de) || tr.id;
    const subtitle = (tr.subtitle && tr.subtitle[lang]) || (tr.subtitle && tr.subtitle.de) || "";

    el.treeTitle.textContent = title;
    el.treeSubtitle.textContent = subtitle || "";
    el.treeBody.textContent = t("pickTree");

    el.treePanel.classList.remove("hidden");
    el.treePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadContent() {
    // vždy z webu (bez cache)
    const url = `content.json?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    content = await res.json();
  }

  function initEvents() {
    el.langBtn.addEventListener("click", () => {
      if (el.langMenu.classList.contains("hidden")) openMenu(el.langMenu);
      else el.langMenu.classList.add("hidden");
    });

    el.langMenu.querySelectorAll(".menuItem").forEach((btn) => {
      btn.addEventListener("click", () => {
        lang = btn.dataset.lang;
        localStorage.setItem("lang", lang);
        el.langMenu.classList.add("hidden");
        setTexts();
        renderCategories();
      });
    });

    el.shareBtn.addEventListener("click", () => {
      if (el.shareMenu.classList.contains("hidden")) openMenu(el.shareMenu);
      else el.shareMenu.classList.add("hidden");
    });

    el.shareTxtBtn.addEventListener("click", async () => {
      el.shareMenu.classList.add("hidden");
      const text = buildShareText();
      try {
        await navigator.clipboard.writeText(text);
        showModal("TXT", text);
      } catch {
        showModal("TXT", text);
      }
    });

    el.sharePdfBtn.addEventListener("click", () => {
      el.shareMenu.classList.add("hidden");
      showModal("PDF", "PDF export zatiaľ nie je zapnutý.");
    });

    el.collapseAllBtn.addEventListener("click", collapseAll);

    el.feedbackBtn.addEventListener("click", () => {
      showModal(t("feedbackTitle"), t("feedbackBody"));
    });

    el.contactBtn.addEventListener("click", () => {
      showModal(t("contactTitle"), t("contactBody"));
    });

    el.tabFaults.addEventListener("click", () => setTab("faults"));
    el.tabDiag.addEventListener("click", () => setTab("diag"));

    el.backBtn.addEventListener("click", () => {
      el.treePanel.classList.add("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    el.modalOverlay.addEventListener("click", closeModal);
    el.modalClose.addEventListener("click", closeModal);
    el.modalOk.addEventListener("click", closeModal);
  }

  function buildShareText() {
    return [
      t("appTitle"),
      "CaravanTechniker am Main",
      "",
      "URL:",
      location.href.split("?")[0],
      "",
      "Kontakt:",
      "WhatsApp: wa.me/" + CONTACT_PHONE_DIGITS,
      "E-mail: " + CONTACT_EMAIL
    ].join("\n");
  }

  async function boot() {
    setTexts();
    initEvents();
    setTab(tab);

    try {
      await loadContent();
      renderCategories();
    } catch (e) {
      showModal("Error", t("loadedErr"));
    }
  }

  boot();
})();
