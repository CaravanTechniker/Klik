// CaravanTechniker am Main – CATEGORY-first UI (stable)
// Fix: load from ADMIN override keys + support {trees:[...]} schema + robust category mapping

const VERSION = "0.2.1";

// ===== storage keys (MUSIA sedieť s tvojou appkou) =====
const STORAGE_LANG = "ct_lang_v1";
const STORAGE_OVERRIDE = "ct_content_override_v1"; // ADMIN import u teba ukladá sem
const DEFAULT_CONTENT_URL = "./content.json";

let LANG = localStorage.getItem(STORAGE_LANG) || "de";
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let path = [];

let activeCategory = null;

// =====================
// HELPERS
// =====================
const $ = (id) => document.getElementById(id);

function getText(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  return obj[LANG] ?? obj.de ?? obj.sk ?? "";
}

function safeLower(s){ return String(s||"").trim().toLowerCase(); }

// =====================
// NORMALIZE CONTENT
// - podporí: [...]
// - podporí: {trees:[...]}
// - podporí: staršie: { data:[...] } (ak by bolo)
// =====================
function normalizeContent(raw){
  const arr =
    Array.isArray(raw) ? raw :
    (raw && Array.isArray(raw.trees) ? raw.trees :
    (raw && Array.isArray(raw.data) ? raw.data : []));

  return arr.map(t => ({
    id: String(t.id || ""),
    category: t.category ?? t.cat ?? null,
    title: t.title || {de:"", sk:""},
    subtitle: t.subtitle || {de:"", sk:""},
    tags: Array.isArray(t.tags) ? t.tags : [],
    start: t.start || t.root || null,
    nodes: t.nodes || {}
  }))
  .filter(t => t.id && t.start && t.nodes && t.nodes[t.start]);
}

// =====================
// LOAD CONTENT
// priority:
// 1) localStorage override (ADMIN import)
// 2) fetch ./content.json
// =====================
async function loadContent(){
  const ov = localStorage.getItem(STORAGE_OVERRIDE);
  if(ov){
    try{
      const parsed = JSON.parse(ov);
      const norm = normalizeContent(parsed);
      if(norm.length){
        TREES = norm;
        return;
      }
    }catch(e){}
  }

  try{
    const res = await fetch(DEFAULT_CONTENT_URL, {cache:"no-store"});
    const data = await res.json();
    TREES = normalizeContent(data);
  }catch(e){
    TREES = [];
  }
}

// =====================
// CATEGORY MAPPING
// - podporí "Wasser" aj "water" aj "voda"
// - ak nič -> infer z tagov
// =====================
const CATEGORY_ORDER = ["Elektrik","Wasser","Gas","Heizung","Andere"];

function mapCategory(cat){
  const c = safeLower(cat);
  if(!c) return null;

  if(c === "elektrik" || c === "electric" || c.includes("elek")) return "Elektrik";
  if(c === "wasser" || c === "water" || c === "voda" || c.includes("wass") || c.includes("vod")) return "Wasser";
  if(c === "gas" || c === "plyn" || c.includes("gas") || c.includes("ply")) return "Gas";
  if(c === "heizung" || c === "heat" || c === "kurenie" || c.includes("heiz") || c.includes("kur")) return "Heizung";
  if(c === "andere" || c === "other" || c === "ostatne") return "Andere";

  return null;
}

function inferCategoryFromTags(tree){
  const tags = (tree.tags || []).map(x => safeLower(x)).join(" ");
  if(tags.includes("12v") || tags.includes("230v") || tags.includes("ebl") || tags.includes("elektr")) return "Elektrik";
  if(tags.includes("wasser") || tags.includes("voda") || tags.includes("pumpe") || tags.includes("druckpumpe") || tags.includes("tauchpumpe")) return "Wasser";
  if(tags.includes("gas") || tags.includes("plyn")) return "Gas";
  if(tags.includes("heizung") || tags.includes("kuren")) return "Heizung";
  return "Andere";
}

function treeCategory(tree){
  const mapped = mapCategory(tree.category);
  if(mapped) return mapped;
  return inferCategoryFromTags(tree);
}

// =====================
// UI: categories + list
// =====================
function buildCategories(){
  const bar = $("catbar");
  if(!bar) return;
  bar.innerHTML = "";

  CATEGORY_ORDER.forEach(cat=>{
    const b = document.createElement("div");
    b.className = "cat" + (activeCategory === cat ? " active" : "");
    b.textContent = cat;
    b.onclick = ()=>{
      activeCategory = cat;
      buildCategories();
      renderList();
      expandList(); // vždy zobraz list po kliknutí na kategóriu
    };
    bar.appendChild(b);
  });
}

function expandList(){
  const card = $("treeCard");
  if(card) card.style.display = "block";
}

function collapseList(){
  const card = $("treeCard");
  if(card) card.style.display = "none";
}

function renderList(){
  const list = $("list");
  if(!list) return;

  list.innerHTML = "";

  // ak ešte nemáš vybranú kategóriu -> vyber prvú, kde sú stromy
  if(!activeCategory){
    for(const c of CATEGORY_ORDER){
      if(TREES.some(t => treeCategory(t) === c)){
        activeCategory = c;
        buildCategories();
        break;
      }
    }
  }

  const filtered = TREES.filter(t => treeCategory(t) === activeCategory);

  // keď je prázdne, ukáž aspoň info (aby si vedel, že data sú prázdne)
  if(!filtered.length){
    const info = document.createElement("div");
    info.className = "item";
    info.innerHTML = `<strong>–</strong><span>Žiadne stromy v kategórii: ${activeCategory || "?"}</span>`;
    list.appendChild(info);
    return;
  }

  filtered.forEach(t=>{
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>${escapeHtml(getText(t.title))}</strong><span>${escapeHtml(getText(t.subtitle))}</span>`;
    div.onclick = ()=>selectTree(t.id);
    list.appendChild(div);
  });
}

// =====================
// TREE FLOW
// =====================
function selectTree(treeId){
  currentTree = TREES.find(t=>t.id===treeId) || null;
  path = [];
  currentNodeId = currentTree ? currentTree.start : null;

  // po výbere stromu zbal list -> hneď vidíš diagnostiku
  collapseList();

  renderNode();
  renderProtocol();
}

function renderNode(){
  const q = $("qtitle");
  const yesBtn = $("yesBtn");
  const noBtn = $("noBtn");
  const backBtn = $("backBtn");

  if(!q || !yesBtn || !noBtn || !backBtn){
    return;
  }

  if(!currentTree){
    q.textContent = LANG==="de" ? "Wähle oben eine Störung." : "Vyber hore poruchu.";
    yesBtn.disabled = true;
    noBtn.disabled = true;
    backBtn.disabled = true;
    return;
  }

  const node = currentTree.nodes[currentNodeId];
  if(!node){
    q.textContent = "–";
    return;
  }

  backBtn.disabled = (path.length === 0);

  if(node.type === "question"){
    q.textContent = getText(node.text) || "–";
    yesBtn.style.display = "inline-block";
    noBtn.style.display = "inline-block";
    yesBtn.disabled = false;
    noBtn.disabled = false;
  } else if(node.type === "result"){
    const cause = getText(node.cause);
    const action = getText(node.action);

    const resultLabel = (LANG==="de" ? "Ergebnis" : "Výsledok");
    const actionLabel = (LANG==="de" ? "Aktion" : "Akcia");

    q.textContent =
      `${resultLabel}: ${cause || ""}` +
      (action ? `\n${actionLabel}: ${action}` : "") +
      `\n\n` +
      (LANG==="de"
        ? "Hinweis: Diese Diagnose ist nur eine Unterstützung und ersetzt keine Fachprüfung. Arbeiten an 230V- oder Gasanlagen dürfen nur von qualifiziertem Fachpersonal durchgeführt werden."
        : "Upozornenie: Táto diagnóza je len pomôcka a nenahrádza odbornú kontrolu. Práce na 230V alebo plyne smie vykonávať iba kvalifikovaná osoba.");

    // na výsledku schovaj JA/NEIN (tvoj bod 5)
    yesBtn.style.display = "none";
    noBtn.style.display = "none";
  } else {
    q.textContent = "–";
  }
}

function answer(isYes){
  if(!currentTree) return;
  const node = currentTree.nodes[currentNodeId];
  if(!node || node.type !== "question") return;

  const nextId = isYes ? node.yes : node.no;

  path.push({
    q: getText(node.text),
    a: isYes ? (LANG==="de" ? "JA" : "ÁNO") : (LANG==="de" ? "NEIN" : "NIE")
  });

  currentNodeId = nextId;
  renderNode();
  renderProtocol();
}

function back(){
  if(!currentTree) return;
  if(path.length === 0) return;

  const replay = path.slice(0, -1);
  path = [];
  currentNodeId = currentTree.start;

  for(const step of replay){
    const node = currentTree.nodes[currentNodeId];
    if(!node || node.type !== "question") break;

    const isYes = (safeLower(step.a) === "ja" || safeLower(step.a) === "áno");
    const nextId = isYes ? node.yes : node.no;

    path.push(step);
    currentNodeId = nextId;
  }

  renderNode();
  renderProtocol();
}

// =====================
// PROTOCOL
// =====================
function renderProtocol(){
  const proto = $("proto");
  if(!proto) return;

  const lines = [];
  if(!currentTree){
    proto.value = "";
    return;
  }

  const now = new Date();
  const dt = `${pad2(now.getDate())}.${pad2(now.getMonth()+1)}.${now.getFullYear()} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  lines.push(LANG==="de" ? `Zeit: ${dt}` : `Čas: ${dt}`);
  lines.push((LANG==="de" ? "Störung: " : "Porucha: ") + getText(currentTree.title));
  lines.push("");

  path.forEach((p,i)=> lines.push(`${i+1}. ${p.q} [${p.a}]`));

  const node = currentTree.nodes[currentNodeId];
  if(node && node.type === "result"){
    lines.push("");
    lines.push(LANG==="de" ? "Hinweis:" : "Upozornenie:");
    lines.push(
      LANG==="de"
        ? "Diese Diagnose ist nur eine Unterstützung und ersetzt keine Fachprüfung. Arbeiten an 230V- oder Gasanlagen dürfen nur von qualifiziertem Fachpersonal durchgeführt werden."
        : "Táto diagnóza je len pomôcka a nenahrádza odbornú kontrolu. Práce na 230V alebo plyne smie vykonávať iba kvalifikovaná osoba."
    );
  }

  proto.value = lines.join("\n");
}

// =====================
// ADMIN / RESET HOOKS (ak ich máš v indexe)
// =====================
function hardReset(){
  currentTree = null;
  currentNodeId = null;
  path = [];
  expandList();
  renderList();
  renderNode();
  renderProtocol();
}

// =====================
// HELPERS
// =====================
function pad2(n){ return String(n).padStart(2,"0"); }
function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// =====================
// BOOT
// =====================
(async function boot(){
  await loadContent();

  // ak existujú UI prvky v indexe, napojíme ich bez toho, aby sa app rozbila
  const yesBtn = $("yesBtn");
  const noBtn = $("noBtn");
  const backBtn = $("backBtn");
  const resetBtn = $("btnRESET");

  if(yesBtn) yesBtn.onclick = ()=>answer(true);
  if(noBtn) noBtn.onclick = ()=>answer(false);
  if(backBtn) backBtn.onclick = ()=>back();
  if(resetBtn) resetBtn.onclick = ()=>hardReset();

  buildCategories();
  renderList();
  renderNode();
})();
