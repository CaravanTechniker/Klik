(() => {
  "use strict";

  const CONTACT_EMAIL = "caravantechnikerammain@gmail.com";
  const CONTACT_PHONE = "+49 151 638 12 554";
  const CONTACT_PHONE_DIGITS = "4915163812554";
  const ADMIN_PASSWORD = "1";

  let lang = localStorage.getItem("lang") || "de";

  const el = (id) => document.getElementById(id);

  el("langSelect").value = lang;
  el("langSelect").onchange = (e) => {
    lang = e.target.value;
    localStorage.setItem("lang", lang);
    load();
  };

  el("collapseAllBtn").onclick = () => {
    document
      .querySelectorAll(".category")
      .forEach((c) => c.classList.remove("open"));
  };

  el("contactBtn").onclick = () => {
    alert(
      `E-mail: ${CONTACT_EMAIL}\nWhatsApp: ${CONTACT_PHONE}\nTelefon nezdvíham`
    );
  };

  el("feedbackBtn").onclick = () => {
    window.open(
      `https://wa.me/${CONTACT_PHONE_DIGITS}?text=Feedback%20zur%20App`,
      "_blank"
    );
  };

  el("adminBtn").onclick = () => {
    const p = prompt("Admin password:");
    alert(p === ADMIN_PASSWORD ? "Admin OK" : "Zlé heslo");
  };

  async function load() {
    const res = await fetch("./content.json");
    const data = await res.json();
    render(data);
  }

  function render(data) {
    const root = el("categories");
    root.innerHTML = "";

    data.categories.forEach((cat) => {
      const box = document.createElement("div");
      box.className = "category";

      const head = document.createElement("div");
      head.className = "cat-header";
      head.textContent = cat.name[lang];
      head.onclick = () => box.classList.toggle("open");

      const body = document.createElement("div");
      body.className = "cat-body";

      data.trees
        .filter((t) => t.categoryId === cat.id)
        .forEach((t) => {
          const item = document.createElement("div");
          item.className = "tree";
          item.innerHTML = `<strong>${t.title[lang]}</strong><div>${t.subtitle[lang]}</div>`;
          body.appendChild(item);
        });

      box.appendChild(head);
      box.appendChild(body);
      root.appendChild(box);
    });
  }

  load();
})();
