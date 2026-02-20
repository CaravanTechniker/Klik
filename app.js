// CaravanTechniker am Main – app.js (stable)
// Version: 0.3.1 – search works without category selection

const VERSION = "0.3.1";

let LANG = localStorage.getItem("lang") || "de";
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let path = [];

const el = {
  search: document.getElementById("searchInput"),
  catBar: document.getElementById("categoryBar"),
  treeList: document.getElementById("treeList"),
  question: document.getElementById("question"),
  yesBtn: document.getElementById("btnYes"),
  noBtn: document.getElementById("btnNo"),
  resetBtn: document.getElementById("resetBtn"),
};

function T(obj) {
  if (!obj) return "";
  return obj[LANG] || obj["de"] || "";
}

// ===================== LOAD DATA =====================

async function loadContent() {
  try {
    const res = await fetch("./content.json?v=" + Date.now());
    const data = await res.json();
    TREES = Array.isArray(data) ? data : [];
    renderCategories();
    renderTreeList();
  } catch (e) {
    alert("Content konnte nicht geladen werden");
    console.error(e);
  }
}

// ===================== CATEGORIES =====================

function renderCategories() {
  if (!el.catBar) return;
  el.catBar.innerHTML = "";

  const cats = [...new Set(
    TREES
      .map(t => typeof t.category === "string" ? t.category.trim() : "")
      .filter(Boolean)
  )];

  cats.forEach(cat => {
    const b = document.createElement("button");
    b.textContent = cat;
    b.onclick = () => {
      renderTreeList(cat);
    };
    el.catBar.appendChild(b);
  });
}

// ===================== TREE LIST =====================

function renderTreeList(selectedCategory = null) {
  if (!el.treeList) return;
  el.treeList.innerHTML = "";

  const q = (el.search?.value || "").toLowerCase();

  TREES
    .filter(t => {
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        (T(t.title).toLowerCase().includes(q)) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    })
    .forEach(tree => {
      const div = document.createElement("div");
      div.className = "treeItem";
      div.innerHTML = `<strong>${T(tree.title)}</strong><br><small>${T(tree.subtitle)}</small>`;
      div.onclick = () => startTree(tree);
      el.treeList.appendChild(div);
    });
}

// ===================== TREE ENGINE =====================

function startTree(tree) {
  currentTree = tree;
  currentNodeId = tree.start;
  path = [];
  renderNode();
}

function renderNode() {
  if (!currentTree || !currentNodeId) return;

  const node = currentTree.nodes[currentNodeId];
  if (!node) return;

  if (node.type === "question") {
    el.question.textContent = T(node.text);
    el.yesBtn.onclick = () => goNext(node.yes);
    el.noBtn.onclick = () => goNext(node.no);
  }

  if (node.type === "result") {
    el.question.innerHTML =
      `<strong>${T(node.cause)}</strong><br><br>${T(node.action)}`;
    el.yesBtn.onclick = null;
    el.noBtn.onclick = null;
  }
}

function goNext(id) {
  path.push(currentNodeId);
  currentNodeId = id;
  renderNode();
}

// ===================== EVENTS =====================

el.search?.addEventListener("input", () => {
  renderTreeList();
});

el.resetBtn?.addEventListener("click", () => {
  currentTree = null;
  currentNodeId = null;
  path = [];
  el.question.textContent = "";
  renderTreeList();
});

// ===================== INIT =====================

loadContent();
