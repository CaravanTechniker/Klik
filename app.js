// Caravan TaM - stable UI + TXT/PDF export
const VERSION = "0.1.5";

// --- CATEGORY (servisná schéma)
const CATEGORY_ORDER = ["Elektrik","Wasser","Gas","Heizung","Andere"];
const KNOWN_CATEGORIES = new Set(CATEGORY_ORDER);

function normCategory(cat){
  if(cat===undefined || cat===null) return "Andere";
  const c = String(cat).trim();
  return KNOWN_CATEGORIES.has(c) ? c : "Andere";
}

let LANG = localStorage.getItem("lang") || "de"; // PRIORITA DE
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let path = [];
let activeTag = "";        // re-used as CATEGORY selector
let tagsOpen = false;      // re-used as CATEGORY panel toggle

// ---- DOM
const el = {
  pwaPill: document.getElementById("pwaPill"),
  offlinePill: document.getElementById("offlinePill"),
  ver: document.getElementById("ver"),

  hFaults: document.getElementById("hFaults"),
  hDiag: document.getElementById("hDiag"),
  hProto: document.getElementById("hProto"),
  hHint: document.getElementById("hHint"),

  langDE: document.getElementById("langDE"),
  langSK: document.getElementById("langSK"),

  search: document.getElementById("search"),
  tagBtn: document.getElementById("tagBtn"),
  tagChips: document.getElementById("tagChips"),
  filterResetBtn: document.getElementById("filterResetBtn"),

  faultList: document.getElementById("faultList"),
  diagEmpty: document.getElementById("diagEmpty"),

  faultTitleBadge: document.getElementById("faultTitleBadge"),
  faultTagsBadge: document.getElementById("faultTagsBadge"),

  nodeText: document.getElementById("nodeText"),
  nodeHelp: document.getElementById("nodeHelp"),

  answerBtns: document.getElementById("answerBtns"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  backBtn: document.getElementById("backBtn"),

  proto: document.getElementById("proto"),
  protoHint: document.getElementById("protoHint"),
  clearPathBtn: document.getElementById("clearPathBtn"),

  copyBtn: document.getElementById("copyBtn"),
  txtBtn: document.getElementById("txtBtn"),
  pdfBtn: document.getElementById("pdfBtn"),
  adminBtn: document.getElementById("adminBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

// ---- helpers
function isPWA(){
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}

function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function L(val){
  if(!val) return "";
  if(typeof val === "string") return val;
  return val[LANG] || val.de || val.sk || "";
}

function allCategories(){
  const s = new Set();
  for(const tr of TREES){
    s.add(normCategory(tr.category));
  }
  const present = new Set(Array.from(s));
  const ordered = CATEGORY_ORDER.filter(c=>present.has(c));
  return ordered;
}

function updateOffline(){
  const offline = !navigator.onLine;
  el.offlinePill.style.display = offline ? "inline-flex" : "none";
}

window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);

// ---- load content
async function loadContent(){
  // admin override (import)
  const override = localStorage.getItem("content_override");
  if(override){
    try{
      const data = JSON.parse(override);
      TREES = Array.isArray(data) ? data : (data.trees || []);
    }catch(e){
      TREES = [];
    }
    renderAll();
    return;
  }

  // default content.json
  try{
    const r = await fetch("./content.json", { cache: "no-store" });
    const data = await r.json();
    TREES = Array.isArray(data) ? data : (data.trees || []);
  }catch(e){
    TREES = [];
  }
  renderAll();
}

// ---- UI lang
function applyLangUI(){
  el.langDE.classList.toggle("active", LANG==="de");
  el.langSK.classList.toggle("active", LANG==="sk");
}

function setLang(l){
  LANG = l;
  localStorage.setItem("lang", LANG);
  applyLangUI();
  renderAll();
}

// ---- category chips (re-using tag UI)
function renderTagChips(){
  el.tagChips.innerHTML = "";
  if(!tagsOpen){ el.tagChips.style.display="none"; return; }
  el.tagChips.style.display="flex";

  const cats = ["__ALL__"].concat(allCategories());

  for(const cat of cats){
    const b = document.createElement("button");
    b.className = "tagBtn" + ((activeTag === cat) ? " active" : "");
    const label = (cat==="__ALL__") ? "ALL" : cat;

    const count = (cat==="__ALL__")
      ? TREES.length
      : TREES.filter(t=>normCategory(t.category)===cat).length;

    b.textContent = `${label} (${count})`;

    b.onclick = ()=>{
      activeTag = (activeTag === cat) ? "" : cat;
      renderList();
      renderTagChips();
    };
    el.tagChips.appendChild(b);
  }
}

function filterReset(){
  activeTag = "";
  el.search.value = "";
  renderList();
  renderTagChips();
}

// ---- LIST
function matchTree(tr, q){
  // activeTag now means selected CATEGORY
  if(activeTag && activeTag!=="__ALL__"){
    if(normCategory(tr.category)!==activeTag) return false;
  }
  if(!q) return true;
  // search across title/subtitle/id/tags for speed
  const hay = (L(tr.title)+" "+L(tr.subtitle)+" "+(tr.id||"")+" "+(tr.tags||[]).join(" ")).toLowerCase();
  return hay.includes(q);
}

function renderList(){
  const q = (el.search.value||"").trim().toLowerCase();
  el.faultList.innerHTML = "";

  const list = TREES.filter(tr=>matchTree(tr,q));

  list.forEach((tr, idx)=>{
    const item = document.createElement("button");
    item.className = "item";
    const title = `${String(idx+1).padStart(2,"0")} ${L(tr.title)}`;
    item.innerHTML = `<div class="t">${escapeHtml(title)}</div><div class="s">${escapeHtml(L(tr.subtitle))}</div>`;
    item.onclick = ()=>selectTree(tr);
    el.faultList.appendChild(item);
  });

  el.diagEmpty.style.display = list.length ? "none" : "block";
}

function selectTree(tr){
  currentTree = tr;
  currentNodeId = tr.start;
  path = [];
  el.faultTitleBadge.style.display = "inline-flex";
  el.faultTitleBadge.textContent = `${normCategory(tr.category)} · ${L(tr.title)}`;
  el.faultTagsBadge.style.display = "inline-flex";
  el.faultTagsBadge.textContent = (tr.tags && tr.tags.length) ? ("#"+(tr.tags||[]).join(" #")) : "";
  renderNode();
  renderProtocol();
}

// ---- NODE
function node(){
  if(!currentTree || !currentNodeId) return null;
  return (currentTree.nodes||{})[currentNodeId] || null;
}

function renderNode(){
  const n = node();
  if(!currentTree || !n){
    el.answerBtns.style.display = "none";
    el.nodeText.textContent = "";
    el.nodeHelp.textContent = "";
    return;
  }

  el.nodeText.textContent = L(n.text);
  el.nodeHelp.textContent = L(n.help);

  if(n.type === "question"){
    el.answerBtns.style.display = "flex";
    el.yesBtn.style.display = n.yes ? "inline-flex" : "none";
    el.noBtn.style.display  = n.no  ? "inline-flex" : "none";
  }else{
    el.answerBtns.style.display = "none";
  }

  el.backBtn.disabled = path.length === 0;
}

function answer(nextId, answerLabel){
  const n = node();
  if(!n) return;

  path.push({
    nodeId: currentNodeId,
    answer: answerLabel,
    text: L(n.text)
  });

  currentNodeId = nextId;
  renderNode();
  renderProtocol();
}

function goBack(){
  if(path.length===0) return;
  const prev = path.pop();
  currentNodeId = prev.nodeId;
  renderNode();
  renderProtocol();
}

function clearPath(){
  path = [];
  renderNode();
  renderProtocol();
}

// ---- PROTOCOL
function renderProtocol(){
  if(!currentTree){
    el.proto.textContent = "";
    el.protoHint.style.display = "none";
    return;
  }
  const lines = [];
  lines.push(`Störung: ${L(currentTree.title)}`);
  lines.push(`Kategorie: ${normCategory(currentTree.category)}`);
  lines.push(`Sprache: ${LANG.toUpperCase()}`);
  lines.push(`Zeit: ${new Date().toLocaleString()}`);

  if(path.length){
    lines.push("");
    lines.push("Ablauf:");
    path.forEach((p,i)=>{
      lines.push(`${i+1}. ${p.text} -> ${p.answer}`);
    });
  }

  const n = node();
  if(n && n.type === "result"){
    lines.push("");
    if(n.cause) lines.push(`Ursache: ${L(n.cause)}`);
    if(n.action) lines.push(`Aktion: ${L(n.action)}`);
  }

  el.proto.textContent = lines.join("\n");
  el.protoHint.style.display = path.length ? "none" : "block";
}

// ---- EXPORT helpers
function copyProtocol(){
  const t = el.proto.textContent || "";
  navigator.clipboard.writeText(t);
}

function downloadTxt(){
  const t = el.proto.textContent || "";
  const blob = new Blob([t], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `diagnose_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadPdf(){
  // minimal PDF: print-to-PDF fallback
  window.print();
}

// ---- ADMIN
function admin(){
  const choice = prompt(
`ADMIN
1 = Import JSON
2 = Export JSON
3 = Clear Override`,
""
  );
  if(!choice) return;

  if(choice.trim()==="1"){
    const input = document.createElement("input");
    input.type="file";
    input.accept="application/json,.json";
    input.onchange = async ()=>{
      const file = input.files && input.files[0];
      if(!file) return;
      const text = await file.text();
      let data;
      try{ data = JSON.parse(text); }catch(e){ alert("Invalid JSON"); return; }
      const arr = Array.isArray(data) ? data : (data.trees || []);
      localStorage.setItem("content_override", JSON.stringify(arr));
      TREES = arr;
      filterReset();
      renderAll();
      alert("Import OK");
    };
    input.click();
    return;
  }

  if(choice.trim()==="2"){
    const blob = new Blob([JSON.stringify(TREES, null, 2)], {type:"application/json;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `content_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  if(choice.trim()==="3"){
    localStorage.removeItem("content_override");
    alert("Override cleared. Reload page.");
    return;
  }
}

// ---- RESET
function resetAll(){
  if(!confirm("RESET: vymazať dáta tejto appky?")) return;
  localStorage.removeItem("content_override");
  localStorage.removeItem("lang");
  location.reload();
}

// ---- render all
function renderAll(){
  renderList();
  renderTagChips();
  renderNode();
  renderProtocol();
}

// ---- init
(async function init(){
  el.ver.textContent = VERSION;
  el.pwaPill.style.display = isPWA() ? "inline-flex" : "none";

  el.langDE.onclick = ()=>setLang("de");
  el.langSK.onclick = ()=>setLang("sk");

  el.search.oninput = ()=>renderList();

  el.tagBtn.onclick = ()=>{
    tagsOpen = !tagsOpen;
    renderTagChips();
  };

  el.filterResetBtn.onclick = ()=>filterReset();

  el.yesBtn.onclick = ()=>{
    const n = node();
    if(n && n.yes) answer(n.yes, "JA");
  };
  el.noBtn.onclick = ()=>{
    const n = node();
    if(n && n.no) answer(n.no, "NEIN");
  };

  el.backBtn.onclick = ()=>goBack();
  el.clearPathBtn.onclick = ()=>clearPath();

  el.copyBtn.onclick = ()=>copyProtocol();

  el.resetBtn.onclick = ()=>resetAll();

  el.txtBtn.onclick = ()=>downloadTxt();
  el.pdfBtn.onclick = ()=>downloadPdf();
  el.adminBtn.onclick = ()=>admin();

  applyLangUI();
  updateOffline();
  await loadContent();
})();
