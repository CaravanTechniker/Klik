(() => {
  "use strict";

  const APP_VERSION = "UI v1.0";

  // CONTACT (podľa tvojich požiadaviek)
  const CONTACT_EMAIL = "caravantechnikerammain@gmail.com";
  const CONTACT_PHONE = "+49 151 638 12 554";
  const CONTACT_PHONE_DIGITS = "4915163812554";

  // i18n
  const I18N = {
    de: {
      appTitle: "Wohnmobil Diagnose",
      tabFaults: "Störungen",
      tabDiag: "Diagnose",
      categoriesTitle: "Kategorien",
      collapseAll: "Einklappen",
      feedback: "Feedback",
      share: "Teilen",
      shareTxt: "TXT",
      sharePdf: "PDF",
      contactTitle: "Kontakt",
      contactBody:
        `Kontakt bitte bevorzugt per WhatsApp Nachricht oder E-Mail.\n\nE-Mail: ${CONTACT_EMAIL}\nWhatsApp: https://wa.me/${CONTACT_PHONE_DIGITS}\nTelefon: ${CONTACT_PHONE}`,
      feedbackTitle: "Feedback zur App",
      feedbackBody: "Schreibe mir bitte kurz per WhatsApp, was fehlt oder nicht passt.",
      loadedErr: "Inhalt konnte nicht geladen werden (content.json).",
      online: "Online"
    },
    sk: {
      appTitle: "Diagnostika obytného auta",
      tabFaults: "Poruchy",
      tabDiag: "Diagnostika",
      categoriesTitle: "Kategórie",
      collapseAll: "Zbaliť",
      feedback: "Pripomienky",
      share: "Zdieľať",
      shareTxt: "TXT",
      sharePdf: "PDF",
      contactTitle: "Kontakt",
      contactBody:
        `Kontakt prosím ideálne cez WhatsApp alebo e-mail.\n\nE-mail: ${CONTACT_EMAIL}\nWhatsApp: https://wa.me/${CONTACT_PHONE_DIGITS}\nTelefón: ${CONTACT_PHONE}`,
      feedbackTitle: "Pripomienky k appke",
      feedbackBody: "Napíš mi stručne cez WhatsApp, čo chýba alebo čo nefunguje.",
      loadedErr: "Obsah sa nepodarilo načítať (content.json).",
      online: "Online"
    }
  };

  // DOM
  const el = (id) => document.getElementById(id);

  const ui = {
    appTitle: el("appTitle"),
    langSelect: el("langSelect"),
    tabFaults: el("tabFaults"),
    tabDiag: el("tabDiag"),
    categoriesTitle: el("categoriesTitle"),
    categoriesCount: el("categoriesCount"),
    categories: el("categories"),
    collapseAllBtn: el("collapseAllBtn"),
    feedbackBtn: el("feedbackBtn"),
    shareBtn: el("shareBtn"),
    shareMenu: el("shareMenu"),
    shareTxtBtn: el("shareTxtBtn"),
    sharePdfBtn: el("sharePdfBtn"),
    contactBtn: el("contactBtn"),
    adminBtn: el("adminBtn"),
    uiVersion: el("uiVersion"),
    onlineLabel: el("onlineLabel"),

    modalBackdrop: el("modalBackdrop"),
    modal: el("modal"),
    modalTitle: el("modalTitle"),
    modalBody: el("modalBody"),
    modalClose: el("modalClose"),
    modalOk: el("modalOk")
  };

  const state = {
    lang: (localStorage.getItem("lang") || "de").toLowerCase() === "sk" ? "sk" : "de",
    mode: "faults", // "faults" | "diag"
    content: null
  };

  function t(key) {
    return (I18N[state.lang] && I18N[state.lang][key]) || (I18N.de[key] || key);
  }

  function setTexts() {
    document.documentElement.lang = state.lang;

    ui.appTitle.textContent = t("appTitle");
    ui.tabFaults.textContent = t("tabFaults");
    ui.tabDiag.textContent = t("tabDiag");
    ui.categoriesTitle.textContent = t("categoriesTitle");
    ui.collapseAllBtn.textContent = t("collapseAll");
    ui.feedbackBtn.textContent = t("feedback");
    ui.shareBtn.textContent = t("share");
    ui.shareTxtBtn.textContent = t("shareTxt");
    ui.sharePdfBtn.textContent = t("sharePdf");
    ui.uiVersion.textContent = APP_VERSION;
    ui.onlineLabel.textContent = t("online");

    if (ui.langSelect) ui.langSelect.value = state.lang;
  }

  function openModal(title, bodyText) {
    ui.modalTitle.textContent = title;
    ui.modalBody.textContent = bodyText;
    ui.modalBackdrop.classList.remove("hidden");
    ui.modal.classList.remove("hidden");
  }

  function closeModal() {
    ui.modalBackdrop.classList.add("hidden");
    ui.modal.classList.add("hidden");
  }

  function toggleShareMenu(force) {
    const isHidden = ui.shareMenu.classList.contains("hidden");
    const show = typeof force === "boolean" ? force : isHidden;
    ui.shareMenu.classList.toggle("hidden", !show);
  }

  function setTab(mode) {
    state.mode = mode;
    ui.tabFaults.classList.toggle("active", mode === "faults");
    ui.tabDiag.classList.toggle("active", mode === "diag");
    // UI logika ostáva rovnaká (zatiaľ len prepínač)
  }

  function render() {
    if (!state.content) return;

    const categories = state.content.categories || [];
    const trees = state.content.trees || [];

    ui.categoriesCount.textContent = `${categories.length} ks`;
    ui.categories.innerHTML = "";

    categories.forEach((cat) => {
      const catName = (cat.name && cat.name[state.lang]) || (cat.name && cat.name.de) || cat.id;

      const catTrees = trees.filter((tr) => tr.categoryId === cat.id);

      const wrap = document.createElement("div");
      wrap.className = "category";
      wrap.dataset.cat = cat.id;

      const row = document.createElement("div");
      row.className = "categoryRow";

      const left = document.createElement("div");
      left.className = "categoryTitle";
      left.textContent = catName;

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "10px";

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = `${catTrees.length} ks`;

      const chev = document.createElement("button");
      chev.className = "chev";
      chev.type = "button";
      chev.textContent = "▾";

      right.appendChild(badge);
      right.appendChild(chev);

      row.appendChild(left);
      row.appendChild(right);

      const body = document.createElement("div");
      body.className = "categoryBody";

      catTrees.forEach((tr) => {
        const title = (tr.title && tr.title[state.lang]) || (tr.title && tr.title.de) || tr.id;
        const sub = (tr.subtitle && tr.subtitle[state.lang]) || (tr.subtitle && tr.subtitle.de) || "";

        const item = document.createElement("div");
        item.className = "treeItem";
        item.dataset.tree = tr.id;

        const colA = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = title;
        const small = document.createElement("small");
        small.textContent = sub;
        colA.appendChild(strong);
        colA.appendChild(document.createElement("br"));
        colA.appendChild(small);

        const arrow = document.createElement("div");
        arrow.style.fontWeight = "900";
        arrow.textContent = "›";

        item.appendChild(colA);
        item.appendChild(arrow);

        item.onclick = () => {
          openModal(title, "Demo strom. Ďalšie kroky doplníme do stromovej logiky.");
        };

        body.appendChild(item);
      });

      wrap.appendChild(row);
      wrap.appendChild(body);

      const toggle = () => wrap.classList.toggle("open");

      row.onclick = toggle;
      chev.onclick = (e) => {
        e.stopPropagation();
        toggle();
      };

      ui.categories.appendChild(wrap);
    });
  }

  async function loadContent() {
    try {
      const res = await fetch("content.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      state.content = await res.json();
      render();
    } catch (e) {
      openModal("Error", t("loadedErr"));
    }
  }

  function bind() {
    ui.langSelect.onchange = (e) => {
      state.lang = e.target.value === "sk" ? "sk" : "de";
      localStorage.setItem("lang", state.lang);
      setTexts();
      render();
    };

    ui.tabFaults.onclick = () => setTab("faults");
    ui.tabDiag.onclick = () => setTab("diag");

    ui.collapseAllBtn.onclick = () => {
      document.querySelectorAll(".category.open").forEach((c) => c.classList.remove("open"));
    };

    ui.feedbackBtn.onclick = () => openModal(t("feedbackTitle"), t("feedbackBody"));

    ui.contactBtn.onclick = () => openModal(t("contactTitle"), t("contactBody"));

    ui.shareBtn.onclick = (e) => {
      e.stopPropagation();
      toggleShareMenu();
    };

    ui.shareTxtBtn.onclick = async () => {
      toggleShareMenu(false);
      const text = `${t("appTitle")} - CaravanTechniker am Main\n${location.href}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: t("appTitle"), text, url: location.href });
        } else {
          await navigator.clipboard.writeText(text);
          openModal("OK", "Skopírované do schránky.");
        }
      } catch (_) {}
    };

    ui.sharePdfBtn.onclick = () => {
      toggleShareMenu(false);
      openModal("PDF", "PDF export doplníme neskôr. Zatiaľ používaj TXT.");
    };

    ui.modalClose.onclick = closeModal;
    ui.modalOk.onclick = closeModal;
    ui.modalBackdrop.onclick = closeModal;

    document.addEventListener("click", () => toggleShareMenu(false));
  }

  async function setupPWA() {
    try {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("sw.js");
      }
    } catch (_) {}
  }

  document.addEventListener("DOMContentLoaded", async () => {
    setTexts();
    bind();
    await loadContent();
    await setupPWA();
  });
})();
