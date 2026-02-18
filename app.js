/* ===============================
   CaravanTechniker am Main – app.js
   Category-based filtering (Wasser/Gas/Elektrik)
   SOURCE OF TRUTH: tree.category
================================ */

let TREES = [];
let CURRENT_CATEGORY = "Alle";
let SEARCH_QUERY = "";

/* ---------- CATEGORY SETUP ---------- */

const CATEGORY_ORDER = ["Alle", "Elektrik", "Wasser", "Gas", "Heizung", "Andere"];
const KNOWN_CATEGORIES = new Set(["Elektrik", "Wasser", "Gas", "Heizung"]);

function normalizeCategory(cat) {
  if (!cat) return "Andere";
  const c = String(cat).trim();
  return KNOWN_CATEGORIES.has(c) ? c : "Andere";
}

/* ---------- LOAD CONTENT ---------- */

async function loadContent() {
  const override = localStorage.getItem("content_override");
  if (override) {
    const data = JSON.parse(override);
    TREES = Array.isArray(data) ? data : (data.trees || []);
    render();
    return;
  }

  const r = await fetch("./content.json");
  const data = await r.json();
  TREES = Array.isArray(data) ? data : (data.trees || []);
  render();
}

/* ---------- FILTERING ---------- */

function filterTrees() {
  return TREES.filter(tree => {
    const cat = normalizeCategory(tree.category);

    if (CURRENT_CATEGORY !== "Alle" && cat !== CURRENT_CATEGORY) {
      return false;
    }

    if (!SEARCH_QUERY) return true;

    const q = SEARCH_QUERY.toLowerCase();
    const title =
      (tree.title?.de || tree.title?.sk || "").toLowerCase();
    const subtitle =
      (tree.subtitle?.de || tree.subtitle?.sk || "").toLowerCase();
    const id = (tree.id || "").toLowerCase();

    return (
      title.includes(q) ||
      subtitle.includes(q) ||
      id.includes(q)
    );
  });
}

/* ---------- RENDER UI ---------- */

function renderCategories() {
  const wrap = document.getElementById("categories");
  if (!wrap) return;

  wrap.innerHTML = "";

  CATEGORY_ORDER.forEach(cat => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = "cat-btn" + (cat === CURRENT_CATEGORY ? " active" : "");
    btn.onclick = () => {
      CURRENT_CATEGORY = cat;
      render();
    };
    wrap.appendChild(btn);
  });
}

function renderTrees() {
  const list = document.getElementById("treeList");
  if (!list) return;

  list.innerHTML = "";

  const trees = filterTrees();

  trees.forEach(tree => {
    const card = document.createElement("div");
    card.className = "tree-card";

    const title = tree.title?.de || tree.title?.sk || tree.id;
    const subtitle = tree.subtitle?.de || tree.subtitle?.sk || "";

    card.innerHTML = `
      <div class="tree-title">${title}</div>
      <div class="tree-sub">${subtitle}</div>
      <div class="tree-cat">${normalizeCategory(tree.category)}</div>
    `;

    card.onclick = () => startTree(tree);
    list.appendChild(card);
  });
}

function render() {
  renderCategories();
  renderTrees();
}

/* ---------- SEARCH ---------- */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", e => {
    SEARCH_QUERY = e.target.value || "";
    render();
  });
}

/* ---------- TREE START (EXISTING LOGIC) ---------- */

function startTree(tree) {
  console.log("Start tree:", tree.id);
  // tvoja existujúca logika stromu ostáva nedotknutá
}

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  loadContent();
});
