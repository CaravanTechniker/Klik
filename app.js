(() => {
  "use strict";

  // ====== VERSION ======
  const APP_VERSION = "UI v1.0";

  // ====== CONTACT (podľa tvojich požiadaviek) ======
  const CONTACT_EMAIL = "caravantechnikerammain@gmail.com";
  const CONTACT_PHONE = "+49 151 638 12 554";
  const CONTACT_WHATSAPP = "+49 151 638 12 554";
  const CONTACT_PHONE_DIGITS = "4915163812554"; // pre WhatsApp wa.me (bez + a medzier)

  // ====== ADMIN ======
  const ADMIN_PASSWORD = "1";
  const ADMIN_CLICKS_REQUIRED = 5;
  const ADMIN_CLICK_WINDOW_MS = 1800;

  // ====== i18n ======
  const I18N = {
    de: {
      appTitle: "Wohnmobil Diagnose",
      subtitleBtn: "CaravanTechniker am Main",
      tabCategories: "Kategorien",
      tabDiag: "Diagnose",
      collapseAll: "Einklappen",
      feedback: "Feedback",
      share: "Teilen",
      shareTxt: "TXT",
      sharePdf: "PDF",
      pickTree: "Wähle einen Baum im Bereich Kategorien.",
      uiNote: "Aktuell UI. Baum-Logik folgt nach Stabilisierung der Inhalte.",
      modalClose: "Schließen",
      contactTitle: "Kontakt",
      contactBody:
        `Telefon: ${CONTACT_PHONE}\n` +
        `WhatsApp: ${CONTACT_WHATSAPP}\n` +
        `E-Mail: ${CONTACT_EMAIL}\n\n` +
        `Kontakt bitte bevorzugt per WhatsApp Nachricht oder E-Mail.`,
      adminTitle: "Admin",
      adminBody: "Passwort eingeben:",
      adminWrong: "Falsches Passwort.",
      adminOk: "Admin entsperrt.",
      loadedErr: "Inhalt konnte nicht geladen werden (content.json).",
      yes: "Ja",
      no: "Nein",
      back: "Zurück"
    },
    sk: {
      appTitle: "Diagnostika obytného auta",
      subtitleBtn: "CaravanTechniker am Main",
      tabCategories: "Kategórie",
      tabDiag: "Diagnostika",
      collapseAll: "Zbaliť",
      feedback: "Pripomienky",
      share: "Zdieľať",
      shareTxt: "TXT",
      sharePdf: "PDF",
      pickTree: "Vyber strom v časti Kategórie.",
      uiNote: "Aktuálne UI. Stromová logika príde po stabilizácii obsahu.",
      modalClose: "Zavrieť",
      contactTitle: "Kontakt",
      contactBody:
        `Telefón: ${CONTACT_PHONE}\n` +
        `WhatsApp: ${CONTACT_WHATSAPP}\n` +
        `E-mail: ${CONTACT_EMAIL}\n\n` +
        `Kontakt bitte bevorzugt per WhatsApp Nachricht oder E-Mail.`,
      adminTitle: "Admin",
      adminBody: "Zadaj heslo:",
      adminWrong: "Nesprávne heslo.",
      adminOk: "Admin odomknutý.",
      loadedErr: "Obsah sa nepodarilo načítať (content.json).",
      yes: "Áno",
      no: "Nie",
      back: "Späť"
    }
  };

  // ====== STATE ======
  let lang = localStorage.getItem("lang") || "de";
  let adminUnlocked = localStorage.getItem("adminUnlocked") === "1";
  let activeTab = "categories"; // "categories" | "diag"
  let content = null;

  // ====== DOM ======
  const qs = (s) => document.querySelector(s);

  // Modal
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modalOverlay";
  modalOverlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h3 class="modalTitle" id="modalTitle"></h3>
      <div class="modalBody" id="modalBody"></div>
      <div class="modalActions">
        <button class="btn primary" id="modalCloseBtn"></button>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const openModal = (title, body) => {
    qs("#modalTitle").textContent = title;
    qs("#modalBody").textContent = body;
    qs("#modalCloseBtn").textContent = t().modalClose;
    modalOverlay.classList.add("open");
  };
  const closeModal = () => modalOverlay.classList.remove("open");
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  qs("#modalCloseBtn").addEventListener("click", closeModal);

  // ====== HELPERS ======
  function t() {
    return I18N[lang] || I18N.de;
  }

  function setLang(newLang) {
    lang = newLang;
    localStorage.setItem("lang", lang);
    render();
  }

  // ====== LOAD CONTENT ======
  async function loadContent() {
    const res = await fetch("content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("content.json load failed");
    content = await res.json();
  }

  // ====== ADMIN CLICK (WOMO 5x) ======
  let clickCount = 0;
  let clickTimer = null;
  function onAdminLogoClick() {
    // reset window
    if (!clickTimer) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        clickTimer = null;
      }, ADMIN_CLICK_WINDOW_MS);
    }
    clickCount += 1;

    if (clickCount >= ADMIN_CLICKS_REQUIRED) {
      clickCount = 0;
      clearTimeout(clickTimer);
      clickTimer = null;

      const pwd = prompt(t().adminBody);
      if (pwd === null) return;
      if (pwd === ADMIN_PASSWORD) {
        adminUnlocked = true;
        localStorage.setItem("adminUnlocked", "1");
        alert(t().adminOk);
        // tu je miesto pre budúce admin funkcie
      } else {
        alert(t().adminWrong);
      }
    }
  }

  // ====== UI BUILD ======
  function buildHeader() {
    const app = qs("#app");
    const topbar = document.createElement("header");
    topbar.className = "topbar";
    topbar.innerHTML = `
      <div class="brand">
        <div id="adminBtn" class="logo">WOMO</div>
        <div class="titles">
          <h1 id="appTitle">${t().appTitle}</h1>
          <button id="contactBtn" class="subtitle">${t().subtitleBtn}</button>
        </div>
      </div>

      <div class="actions">
        <select class="pill" id="langSel" aria-label="Language">
          <option value="de">DE</option>
          <option value="sk">SK</option>
        </select>
        <button class="pill" id="collapseBtn">${t().collapseAll}</button>
        <button class="pill" id="feedbackBtn">${t().feedback}</button>
        <button class="pill primary" id="shareBtn">${t().share}</button>
      </div>
    `;
    app.appendChild(topbar);

    qs("#adminBtn").addEventListener("click", onAdminLogoClick);
    qs("#contactBtn").addEventListener("click", () => openModal(t().contactTitle, t().contactBody));

    const langSel = qs("#langSel");
    langSel.value = lang;
    langSel.addEventListener("change", (e) => setLang(e.target.value));

    qs("#feedbackBtn").addEventListener("click", () => {
      openModal(t().feedback, "WhatsApp je najrýchlejší. (Feature doplníme.)");
    });

    qs("#shareBtn").addEventListener("click", () => {
      const url = location.href;
      const msg = `${t().appTitle}\n${url}`;
      if (navigator.share) {
        navigator.share({ title: t().appTitle, text: msg, url }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(msg).catch(() => {});
        openModal(t().share, msg);
      }
    });

    qs("#collapseBtn").addEventListener("click", () => {
      document.querySelectorAll(".accordion.open").forEach((a) => a.classList.remove("open"));
    });
  }

  function buildTabs() {
    const app = qs("#app");

    const categoriesCount = Array.isArray(content?.categories) ? content.categories.length : 0;

    const tabs = document.createElement("div");
    tabs.className = "tabs";
    tabs.innerHTML = `
      <button class="tab ${activeTab === "categories" ? "active" : ""}" id="tabCategories">
        ${t().tabCategories} (${categoriesCount})
      </button>
      <button class="tab ${activeTab === "diag" ? "active" : ""}" id="tabDiag">
        ${t().tabDiag}
      </button>
    `;
    app.appendChild(tabs);

    qs("#tabCategories").addEventListener("click", () => { activeTab = "categories"; render(); });
    qs("#tabDiag").addEventListener("click", () => { activeTab = "diag"; render(); });
  }

  function buildCategoriesView() {
    const app = qs("#app");
    const section = document.createElement("section");
    section.className = "section";

    const cats = Array.isArray(content?.categories) ? content.categories : [];
    const trees = Array.isArray(content?.trees) ? content.trees : [];

    section.innerHTML = `
      <div class="sectionTitleRow">
        <h2 class="sectionTitle">${t().tabCategories}</h2>
        <div class="countBadge">${cats.length} ks</div>
      </div>
    `;

    cats.forEach((cat) => {
      const catName = cat?.name?.[lang] || cat?.name?.de || cat?.id || "—";
      const catTrees = trees.filter((tr) => tr.categoryId === cat.id);

      const acc = document.createElement("div");
      acc.className = "accordion";
      acc.innerHTML = `
        <button class="accHead" type="button">
          <span>${catName}</span>
          <span class="accRight">
            <span class="accCount">${catTrees.length} ks</span>
            <span class="chev">▾</span>
          </span>
        </button>
        <div class="accBody"></div>
      `;

      acc.querySelector(".accHead").addEventListener("click", () => acc.classList.toggle("open"));

      const body = acc.querySelector(".accBody");
      catTrees.forEach((tr) => {
        const title = tr?.title?.[lang] || tr?.title?.de || tr.id;
        const sub = tr?.subtitle?.[lang] || tr?.subtitle?.de || "";

        const btn = document.createElement("button");
        btn.className = "treeBtn";
        btn.type = "button";
        btn.innerHTML = `
          <div class="treeBtnTitle">${title}</div>
          <div class="treeBtnSub">${sub}</div>
        `;
        btn.addEventListener("click", () => {
          // zatiaľ demo – stromová logika doplníme
          openModal(title, t().uiNote);
        });
        body.appendChild(btn);
      });

      section.appendChild(acc);
    });

    const footer = document.createElement("div");
    footer.className = "footerRow";
    footer.innerHTML = `
      <div><span class="onlineDot"></span>Online</div>
      <div>${APP_VERSION}</div>
    `;
    section.appendChild(footer);

    app.appendChild(section);
  }

  function buildDiagView() {
    const app = qs("#app");
    const section = document.createElement("section");
    section.className = "section";

    section.innerHTML = `
      <div class="sectionTitleRow">
        <h2 class="sectionTitle">${t().tabDiag}</h2>
        <div class="countBadge">—</div>
      </div>
      <div style="margin-top:10px;font-weight:900">${t().pickTree}</div>
      <div class="diagRow" id="diagRow"></div>
    `;

    // Demo tlačidlá aby si hneď videl farby (Áno/Nie/Späť)
    const row = section.querySelector("#diagRow");

    const btnYes = document.createElement("button");
    btnYes.className = "diagBtn yes";
    btnYes.textContent = t().yes;

    const btnNo = document.createElement("button");
    btnNo.className = "diagBtn no";
    btnNo.textContent = t().no;

    const btnBack = document.createElement("button");
    btnBack.className = "diagBtn back";
    btnBack.textContent = t().back;

    row.appendChild(btnYes);
    row.appendChild(btnNo);
    row.appendChild(btnBack);

    app.appendChild(section);
  }

  function render() {
    const root = qs("#app");
    root.innerHTML = "";

    buildHeader();
    buildTabs();

    if (activeTab === "categories") buildCategoriesView();
    else buildDiagView();
  }

  // ====== BOOT ======
  (async function boot() {
    try {
      await loadContent();
      render();
    } catch (e) {
      const root = qs("#app");
      root.innerHTML = `<div class="section"><h2 class="sectionTitle">Error</h2><div>${t().loadedErr}</div></div>`;
    }
  })();
})();
