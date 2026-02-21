/* ==========================================
   CaravanTechniker – Stable Tree Engine (v0.3.4)
   FIX: Cards are real <button> (mobile tap works)
   ========================================== */

const DATA = [
  {
    id: "el_12v_tot",
    category: "Elektrik",
    title: "12V komplett ausgefallen (Aufbau tot)",
    intro: "Kein Licht, keine Pumpe, Panel dunkel.",
    tree: {
      start: "q1",
      nodes: {
        q1: { type: "question", text: "Ist der Hauptschalter für den Aufbau eingeschaltet?", yes: "q2", no: "r1" },
        q2: { type: "question", text: "Sind Aufbaubatterien angeschlossen und liegt die Spannung über 12,0 V?", yes: "r2", no: "r3" },
        r1: { type: "result", title: "Aktion: Hauptschalter einschalten", text: "Schalte den Hauptschalter ein. Prüfe danach Licht/Pumpe/Panel erneut." },
        r2: { type: "result", title: "Batteriespannung OK – Fehler weiter im Aufbau-System", text: "Aktion: EBL prüfen: Batteriespannung am Eingang, Hauptsicherung, Masseverbindung." },
        r3: { type: "result", title: "Batterie / Anschluss / Spannung zu niedrig", text: "Aktion: Batterie laden, Polklemmen prüfen, Sicherungen prüfen, Spannung unter Last messen." }
      }
    }
  },
  {
    id: "el_12v_partial",
    category: "Elektrik",
    title: "12V funktioniert teilweise",
    intro: "Einige Verbraucher gehen, andere nicht.",
    tree: {
      start: "q1",
      nodes: {
        q1: { type: "question", text: "Fallen die gleichen Verbraucher immer aus?", yes: "q2", no: "r1" },
        q2: { type: "question", text: "Sind die betroffenen Verbraucher auf dem gleichen Sicherungskreis?", yes: "r2", no: "r3" },
        r1: { type: "result", title: "Aktion: Wackelkontakt / Masse / Übergangswiderstand", text: "Prüfe Massepunkte, Steckverbindungen, Klemmen, EBL-Ausgänge. Unter Last messen." },
        r2: { type: "result", title: "Aktion: Sicherungskreis prüfen", text: "Sicherung prüfen/tauschen. Kontaktfedern prüfen. Ausgangsspannung am EBL messen." },
        r3: { type: "result", title: "Aktion: Verbraucher einzeln prüfen", text: "Prüfe jeden Verbraucher direkt am Anschluss: Spannung, Masse, Stecker, Leitungsweg." }
      }
    }
  },
  {
    id: "wa_pumpe_tot",
    category: "Wasser",
    title: "Wasserpumpe läuft nicht",
    intro: "Kein Geräusch, kein Druck.",
    tree: {
      start: "q1",
      nodes: {
        q1: { type: "question", text: "Hörst du die Pumpe laufen?", yes: "q2", no: "q3" },
        q2: { type: "question", text: "Kommt Wasser aus irgendeinem Hahn?", yes: "r1", no: "r2" },
        q3: { type: "question", text: "Ist Wasseranlage am Bedienpanel eingeschaltet (Pumpenschalter)?", yes: "r3", no: "r4" },
        r1: { type: "result", title: "Teilweise Durchfluss", text: "Aktion: Luft im System, Filter/Sieb, Rückschlagventil, Frostschaden prüfen." },
        r2: { type: "result", title: "Pumpe läuft aber kein Druck", text: "Aktion: Ansaugseite und Filter prüfen, Schlauchklemmen, Tankentnahme, Leck, Ventile." },
        r3: { type: "result", title: "Kein Pumpenlauf trotz EIN", text: "Aktion: Sicherung, Relais, Pumpenstecker, Masse, Spannung an Pumpe messen." },
        r4: { type: "result", title: "Aktion: Pumpenschalter einschalten", text: "Schalte Wasseranlage/Pumpe am Panel ein und teste erneut." }
      }
    }
  }
];

/* ========= DOM ========= */
const itemsEl = document.getElementById("items");
const chipsEl = document.getElementById("chips");
const searchEl = document.getElementById("searchInput");
const versionEl = document.getElementById("versionLabel");

const diagScreen = document.getElementById("diagScreen");
const diagTitle = document.getElementById("diagTitle");
const questionBox = document.getElementById("questionBox");
const diagContent = document.getElementById("diagContent");
const backBtn = document.getElementById("diagBackBtn");

/* optional buttons (exist but may be unused) */
const langBtn = document.getElementById("langBtn");
const adminBtn = document.getElementById("adminBtn");
const resetBtn = document.getElementById("resetBtn");

/* ========= State ========= */
let activeCategory = "Alle";
let activeItem = null;
let activeNodeId = null;
let historyStack = [];

/* ========= UI helpers ========= */
function openDiag() {
  diagScreen.style.display = "block";
  document.body.style.overflow = "hidden";
}
function closeDiag() {
  diagScreen.style.display = "none";
  document.body.style.overflow = "";
}

backBtn.addEventListener("click", closeDiag);
if (resetBtn) resetBtn.addEventListener("click", () => location.reload());

/* ========= Chips ========= */
function renderChips() {
  chipsEl.innerHTML = "";
  const categories = ["Alle", ...new Set(DATA.map(d => d.category))];

  categories.forEach(cat => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pill";
    b.textContent = cat;
    if (cat === activeCategory) b.classList.add("active");

    b.addEventListener("click", () => {
      activeCategory = cat;
      renderChips();
      renderList();
    });

    chipsEl.appendChild(b);
  });
}

/* ========= List ========= */
function renderList() {
  itemsEl.innerHTML = "";
  const q = (searchEl.value || "").toLowerCase().trim();

  const filtered = DATA.filter(d => {
    const catOk = (activeCategory === "Alle" || d.category === activeCategory);
    const searchOk = (!q || d.title.toLowerCase().includes(q) || d.intro.toLowerCase().includes(q));
    return catOk && searchOk;
  });

  filtered.forEach(d => {
    // IMPORTANT: real button => mobile tap works reliably
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.id = d.id;

    card.innerHTML = `
      <div class="h1">${escapeHtml(d.title)}</div>
      <div class="muted">${escapeHtml(d.intro)}</div>
    `;

    card.addEventListener("click", () => startDiagnosis(d));
    itemsEl.appendChild(card);
  });
}

/* ========= Tree Engine ========= */
function startDiagnosis(item) {
  activeItem = item;
  historyStack = [];
  activeNodeId = item.tree.start;

  diagTitle.textContent = item.title;
  openDiag();
  renderNode();
}

function renderNode() {
  if (!activeItem) return;

  const node = activeItem.tree.nodes[activeNodeId];
  questionBox.textContent = "";
  diagContent.innerHTML = "";

  if (!node) {
    questionBox.textContent = "Fehler: Node nicht gefunden.";
    return;
  }

  if (node.type === "question") {
    questionBox.textContent = node.text;

    const wrap = document.createElement("div");
    wrap.className = "yn";

    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "btn btn-yes";
    yesBtn.textContent = "JA";

    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "btn btn-no";
    noBtn.textContent = "NEIN";

    yesBtn.addEventListener("click", () => {
      historyStack.push(activeNodeId);
      activeNodeId = node.yes;
      renderNode();
    });

    noBtn.addEventListener("click", () => {
      historyStack.push(activeNodeId);
      activeNodeId = node.no;
      renderNode();
    });

    wrap.appendChild(yesBtn);
    wrap.appendChild(noBtn);
    diagContent.appendChild(wrap);

    const stepBack = document.createElement("button");
    stepBack.type = "button";
    stepBack.className = "btn btn-back";
    stepBack.textContent = "← SCHRITT ZURÜCK";
    stepBack.addEventListener("click", () => {
      if (historyStack.length === 0) return;
      activeNodeId = historyStack.pop();
      renderNode();
    });
    diagContent.appendChild(stepBack);

  } else if (node.type === "result") {
    const h = document.createElement("div");
    h.className = "h1";
    h.textContent = node.title;

    const p = document.createElement("div");
    p.className = "muted";
    p.textContent = node.text;

    diagContent.appendChild(h);
    diagContent.appendChild(p);

    const stepBack = document.createElement("button");
    stepBack.type = "button";
    stepBack.className = "btn btn-back";
    stepBack.textContent = "← SCHRITT ZURÜCK";
    stepBack.addEventListener("click", () => {
      if (historyStack.length === 0) return;
      activeNodeId = historyStack.pop();
      renderNode();
    });
    diagContent.appendChild(stepBack);
  }
}

/* ========= Search ========= */
searchEl.addEventListener("input", renderList);

/* ========= Utils ========= */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

/* ========= Init ========= */
versionEl.textContent = "v0.3.4";
renderChips();
renderList();
