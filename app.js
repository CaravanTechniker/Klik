/* ================================
   CaravanTechniker – UI CORE
   Stable base for fullscreen trees
   ================================ */

const DATA = [
  {
    id: "el_12v_tot",
    category: "Elektrik",
    title: "12V komplett ausgefallen (Aufbau tot)",
    intro: "Kein Licht, keine Pumpe, Panel dunkel.",
    firstQuestion: "Ist die Aufbaubatterie geladen?"
  },
  {
    id: "el_12v_partial",
    category: "Elektrik",
    title: "12V funktioniert teilweise",
    intro: "Einige Verbraucher gehen, andere nicht.",
    firstQuestion: "Fallen die gleichen Verbraucher immer aus?"
  },
  {
    id: "wa_pumpe_tot",
    category: "Wasser",
    title: "Wasserpumpe läuft nicht",
    intro: "Kein Geräusch, kein Druck.",
    firstQuestion: "Hörst du die Pumpe laufen?"
  }
];

const itemsEl = document.getElementById("items");
const chipsEl = document.getElementById("chips");
const searchEl = document.getElementById("searchInput");

const diagScreen = document.getElementById("diagScreen");
const diagTitle = document.getElementById("diagTitle");
const questionBox = document.getElementById("questionBox");
const diagContent = document.getElementById("diagContent");
const backBtn = document.getElementById("diagBackBtn");

/* ================================
   Render category chips
   ================================ */

const categories = ["Alle", ...new Set(DATA.map(d => d.category))];

categories.forEach(cat => {
  const b = document.createElement("button");
  b.className = "pill";
  b.textContent = cat;
  b.onclick = () => renderList(cat);
  chipsEl.appendChild(b);
});

/* ================================
   Render list
   ================================ */

function renderList(filter = "Alle") {
  itemsEl.innerHTML = "";

  const q = searchEl.value.toLowerCase();

  DATA.filter(d =>
    (filter === "Alle" || d.category === filter) &&
    (d.title.toLowerCase().includes(q) || d.intro.toLowerCase().includes(q))
  ).forEach(d => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = d.id;

    card.innerHTML = `
      <div class="h1">${d.title}</div>
      <div class="muted">${d.intro}</div>
    `;

    card.onclick = () => openDiagnosis(d);
    itemsEl.appendChild(card);
  });
}

/* ================================
   Diagnosis fullscreen
   ================================ */

function openDiagnosis(d) {
  diagTitle.textContent = d.title;
  questionBox.textContent = d.firstQuestion;
  diagContent.textContent = d.intro;

  diagScreen.style.display = "block";
  document.body.style.overflow = "hidden";
}

backBtn.onclick = () => {
  diagScreen.style.display = "none";
  document.body.style.overflow = "";
};

/* ================================
   Search
   ================================ */

searchEl.oninput = () => renderList();

/* ================================
   Init
   ================================ */

renderList();
document.getElementById("versionLabel").textContent = "v0.3.2";
