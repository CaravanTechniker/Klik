// CaravanTechniker am Main – stable CATEGORY-first UI
// Categories always visible, tags optional, list collapses after tree select

const VERSION = "0.2.0";

// =====================
// CATEGORY DEFINITIONS
// =====================
const CATEGORY_ORDER = ["Elektrik","Wasser","Gas","Heizung","Andere"];
const CATEGORY_KEYS = {
  Elektrik: "electric",
  Wasser: "water",
  Gas: "gas",
  Heizung: "heat",
  Andere: "other"
};

// =====================
// STATE
// =====================
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let path = [];
let activeCategory = null;

// =====================
// HELPERS
// =====================
const $ = id => document.getElementById(id);
const LANG = localStorage.getItem("ct_lang") || "de";

function txt(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  return obj[LANG] || obj.de || "";
}

// =====================
// LOAD CONTENT
// =====================
async function loadContent(){
  const override = localStorage.getItem("ct_content_override");
  if(override){
    TREES = JSON.parse(override);
    return;
  }
  const res = await fetch("./content.json",{cache:"no-store"});
  TREES = await res.json();
}

// =====================
// CATEGORY LOGIC
// =====================
function treeCategory(tree){
  if(tree.category) return tree.category;
  const tags = (tree.tags||[]).join(" ").toLowerCase();
  if(tags.includes("12v")||tags.includes("230v")) return "Elektrik";
  if(tags.includes("wasser")||tags.includes("pumpe")) return "Wasser";
  if(tags.includes("gas")) return "Gas";
  if(tags.includes("heizung")) return "Heizung";
  return "Andere";
}

// =====================
// RENDER CATEGORIES
// =====================
function renderCategories(){
  const bar = $("catbar");
  bar.innerHTML = "";
  CATEGORY_ORDER.forEach(cat=>{
    const b = document.createElement("div");
    b.className = "cat" + (activeCategory===cat?" active":"");
    b.textContent = cat;
    b.onclick = ()=>{
      activeCategory = cat;
      renderCategories();
      renderTreeList();
      expandTreeList();
    };
    bar.appendChild(b);
  });
}

// =====================
// TREE LIST
// =====================
function renderTreeList(){
  const list = $("list");
  list.innerHTML = "";
  if(!activeCategory) return;

  TREES
    .filter(t=>treeCategory(t)===activeCategory)
    .forEach(t=>{
      const d = document.createElement("div");
      d.className = "item";
      d.innerHTML = `<strong>${txt(t.title)}</strong><span>${txt(t.subtitle)}</span>`;
      d.onclick = ()=>selectTree(t);
      list.appendChild(d);
    });
}

// =====================
// COLLAPSE / EXPAND
// =====================
function collapseTreeList(){
  $("treeCard").style.display = "none";
}
function expandTreeList(){
  $("treeCard").style.display = "block";
}

// =====================
// TREE FLOW
// =====================
function selectTree(tree){
  currentTree = tree;
  currentNodeId = tree.start;
  path = [];
  collapseTreeList();
  renderNode();
}

function renderNode(){
  const q = $("qtitle");
  const node = currentTree.nodes[currentNodeId];

  if(node.type==="question"){
    q.textContent = txt(node.text);
    $("yesBtn").style.display="block";
    $("noBtn").style.display="block";
  }else{
    q.textContent =
      "Ergebnis:\n" +
      txt(node.cause) +
      (node.action ? "\n\nAktion:\n"+txt(node.action) : "") +
      "\n\nHinweis:\nDiese Diagnose dient nur als Unterstützung und ersetzt keine Fachprüfung. Arbeiten an 230V- oder Gasanlagen dürfen nur von qualifiziertem Fachpersonal durchgeführt werden.";

    $("yesBtn").style.display="none";
    $("noBtn").style.display="none";
  }
  renderProtocol();
}

function answer(yes){
  const node = currentTree.nodes[currentNodeId];
  path.push({q:txt(node.text),a:yes?"JA":"NEIN"});
  currentNodeId = yes ? node.yes : node.no;
  renderNode();
}

function back(){
  if(!path.length) return;
  path.pop();
  currentNodeId = currentTree.start;
  for(const p of path){
    const n = currentTree.nodes[currentNodeId];
    currentNodeId = p.a==="JA"?n.yes:n.no;
  }
  renderNode();
}

// =====================
// PROTOCOL
// =====================
function renderProtocol(){
  const out = [];
  out.push("Diagnoseprotokoll");
  out.push("----------------");
  out.push("Störung: "+txt(currentTree.title));
  out.push("");
  path.forEach((p,i)=>out.push(`${i+1}. ${p.q} [${p.a}]`));
  $("proto").value = out.join("\n");
}

// =====================
// BOOT
// =====================
(async function(){
  await loadContent();
  renderCategories();
})();
