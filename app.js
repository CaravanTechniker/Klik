
// UI skeleton v0.5 (no real trees yet)

const els = {
  treeList: document.getElementById("treeList"),
  treeCount: document.getElementById("treeCount"),
  activeTreeName: document.getElementById("activeTreeName"),
  questionText: document.getElementById("questionText"),
  hintText: document.getElementById("hintText"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  backBtn: document.getElementById("backBtn"),
  resetBtn: document.getElementById("resetBtn"),
  adminBtn: document.getElementById("adminBtn"),
  exportBtn: document.getElementById("exportBtn"),
  shareBtn: document.getElementById("shareBtn"),

  langBtn: document.getElementById("langBtn"),
  langMenu: document.getElementById("langMenu"),

  treesTitle: document.getElementById("treesTitle"),
  selectedTreeLine: document.getElementById("selectedTreeLine"),
  infoBox: document.getElementById("infoBox"),

  netDot: document.getElementById("netDot"),
  netText: document.getElementById("netText"),
  verText: document.getElementById("verText"),
  statusRight: document.getElementById("statusRight"),
};

const demoTrees = [
  { id: "truma_gas", name: { sk:"Truma Gasheizung", de:"Truma Gasheizung" }, tag: { sk:"Demo", de:"Demo" } },
  { id: "truma_diesel", name: { sk:"Truma Dieselheizung", de:"Truma Dieselheizung" }, tag: { sk:"Demo", de:"Demo" } },
  { id: "elektrik_12v", name: { sk:"12V Elektrika", de:"12V Elektrik" }, tag: { sk:"Demo", de:"Demo" } },
  { id: "wasser", name: { sk:"Wasser / Undichtigkeit", de:"Wasser / Undichtigkeit" }, tag: { sk:"Demo", de:"Demo" } },
];

let activeId = null;
let lang = "sk";

const t = {
  sk: {
    trees: "Stromy",
    selected: "Vybraný strom",
    pickTree: "Vyber strom vľavo.",
    hint: "Potom sa tu zobrazí prvá otázka a tlačidlá.",
    yes: "Áno",
    no: "Nie",
    back: "Späť",
    reset: "Reset",
    share: "Zdieľať",
    ready: "Ready",
    uiInfo: "UI je pripravené. Ďalší krok: napojiť content.json a reálne stromy.",
    admin: "Admin",
    export: "Export",
    copied: "Link skopírovaný",
    manual: "Skopíruj link ručne:",
  },
  de: {
    trees: "Bäume",
    selected: "Ausgewählter Baum",
    pickTree: "Wähle links einen Baum.",
    hint: "Danach erscheinen hier die erste Frage und Buttons.",
    yes: "Ja",
    no: "Nein",
    back: "Zurück",
    reset: "Reset",
    share: "Link",
    ready: "Bereit",
    uiInfo: "UI ist bereit. Nächster Schritt: content.json + echte Bäume anschließen.",
    admin: "Admin",
    export: "Export",
    copied: "Link kopiert",
    manual: "Link manuell kopieren:",
  }
};

function applyLang() {
  els.treesTitle.textContent = t[lang].trees;
  els.selectedTreeLine.childNodes[0].nodeValue = t[lang].selected + ": ";
  els.questionText.textContent = activeId ? els.questionText.textContent : t[lang].pickTree;
  els.hintText.textContent = t[lang].hint;
  els.yesBtn.textContent = t[lang].yes;
  els.noBtn.textContent = t[lang].no;
  els.backBtn.textContent = t[lang].back;
  els.resetBtn.textContent = t[lang].reset;
  els.shareBtn.textContent = t[lang].share;
  els.adminBtn.textContent = t[lang].admin;
  els.exportBtn.textContent = t[lang].export;
  els.statusRight.textContent = t[lang].ready;
  els.infoBox.textContent = t[lang].uiInfo;

  // menu highlight
  [...els.langMenu.querySelectorAll("button[data-lang]")].forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });

  renderList();
}

function renderList() {
  els.treeList.innerHTML = "";
  for (const tr of demoTrees) {
    const row = document.createElement("div");
    row.className = "treeItem" + (tr.id === activeId ? " active" : "");
    row.innerHTML = `
      <div>
        <div class="name">${escapeHtml(tr.name[lang])}</div>
        <div class="tag">${escapeHtml(tr.tag[lang])}</div>
      </div>
      <div class="chev">›</div>
    `;
    row.addEventListener("click", () => selectTree(tr.id));
    els.treeList.appendChild(row);
  }
  els.treeCount.textContent = String(demoTrees.length);
}

function selectTree(id) {
  activeId = id;
  const tr = demoTrees.find(x => x.id === id);
  els.activeTreeName.textContent = tr ? tr.name[lang] : "–";
  els.questionText.textContent = lang === "sk"
    ? "Pripravené. V ďalšom kroku sem napojíme prvú otázku zo stromu."
    : "Bereit. Im nächsten Schritt verbinden wir hier die erste Frage aus dem Baum.";
  els.hintText.textContent = lang === "sk"
    ? "Zatiaľ je to UI test – logika stromov príde hneď po content.json."
    : "Das ist nur UI – Logik kommt gleich nach content.json.";
  renderList(); // to apply active highlight
}

function wireLangDropdown() {
  els.langBtn.addEventListener("click", () => {
    els.langMenu.classList.toggle("open");
  });

  els.langMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-lang]");
    if (!btn) return;
    lang = btn.dataset.lang;
    els.langMenu.classList.remove("open");
    applyLang();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) els.langMenu.classList.remove("open");
  });
}

function wireButtons() {
  els.yesBtn.addEventListener("click", () => toast(lang === "sk" ? "Áno (UI test)" : "Ja (UI test)"));
  els.noBtn.addEventListener("click", () => toast(lang === "sk" ? "Nie (UI test)" : "Nein (UI test)"));

  els.backBtn.addEventListener("click", () => toast(lang === "sk" ? "Späť (UI test)" : "Zurück (UI test)"));

  els.resetBtn.addEventListener("click", () => {
    activeId = null;
    els.activeTreeName.textContent = "–";
    els.questionText.textContent = t[lang].pickTree;
    els.hintText.textContent = t[lang].hint;
    toast(lang === "sk" ? "Reset" : "Reset");
    renderList();
  });

  els.adminBtn.addEventListener("click", () => toast(lang === "sk" ? "Admin (napojíme)" : "Admin (später)"));
  els.exportBtn.addEventListener("click", () => toast(lang === "sk" ? "Export (napojíme)" : "Export (später)"));

  els.shareBtn.addEventListener("click", async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast(t[lang].copied);
    } catch {
      toast(`${t[lang].manual} ${url}`);
    }
  });
}

function setNetworkStatus() {
  const update = () => {
    const online = navigator.onLine;
    els.netDot.classList.toggle("on", online);
    els.netText.textContent = online ? "Online" : "Offline";
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

function toast(msg) {
  els.statusRight.textContent = msg;
  setTimeout(() => els.statusRight.textContent = t[lang].ready, 1400);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init() {
  wireLangDropdown();
  wireButtons();
  setNetworkStatus();
  renderList();
  applyLang();
}

init();
