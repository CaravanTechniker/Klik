// Caravan TaM - stable UI + TXT/PDF export
const VERSION = "0.1.5";

let LANG = localStorage.getItem("lang") || "de"; // PRIORITA DE
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let path = [];
let activeTag = "";
let tagsOpen = false;

// ---- DOM
const el = {
  pwaPill: document.getElementById("pwaPill"),
  offlinePill: document.getElementById("offlinePill"),
  langDE: document.getElementById("langDE"),
  langSK: document.getElementById("langSK"),
  adminBtn: document.getElementById("adminBtn"),
  resetBtn: document.getElementById("resetBtn"),

  hFaults: document.getElementById("hFaults"),
  hHint: document.getElementById("hHint"),
  hDiag: document.getElementById("hDiag"),
  diagEmpty: document.getElementById("diagEmpty"),
  hProto: document.getElementById("hProto"),

  search: document.getElementById("search"),
  tagBtn: document.getElementById("tagBtn"),
  filterResetBtn: document.getElementById("filterResetBtn"),
  tagChips: document.getElementById("tagChips"),
  faultList: document.getElementById("faultList"),

  faultTitleBadge: document.getElementById("faultTitleBadge"),
  faultTagsBadge: document.getElementById("faultTagsBadge"),

  nodeText: document.getElementById("nodeText"),
  nodeHelp: document.getElementById("nodeHelp"),
  answerBtns: document.getElementById("answerBtns"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  backBtn: document.getElementById("backBtn"),

  proto: document.getElementById("proto"),
  copyBtn: document.getElementById("copyBtn"),
  clearPathBtn: document.getElementById("clearPathBtn"),
  txtBtn: document.getElementById("txtBtn"),
  pdfBtn: document.getElementById("pdfBtn"),
  protoHint: document.getElementById("protoHint"),
  ver: document.getElementById("ver")
};

// ---- i18n
const I = {
  de: {
    faults:"Störungen",
    hint:"Wähle eine Störung oder suche. Funktioniert auch offline.",
    search:"Suche (trittstufe, wasserpumpe, 12V...)",
    diag:"Diagnose",
    empty:"Wähle links eine Störung. Dann JA / NEIN klicken.",
    proto:"Protokoll",
    copy:"Kopieren",
    clear:"Pfad löschen",
    yes:"JA",
    no:"NEIN",
    back:"← SCHRITT ZURÜCK",
    tags:"Tags ▾",
    filterReset:"Filter Reset",
    reset:"Reset",
    admin:"ADMIN",
    time:"Zeit",
    lang:"Sprache",
    fault:"Störung",
    tagsLabel:"Tags",
    steps:"Schritte",
    result:"Ergebnis",
    pdf:"PDF Download",
    txt:"TXT Download",
    copied:"Kopiert."
  },
  sk: {
    faults:"Poruchy",
    hint:"Vyber poruchu alebo hľadaj. Funguje aj offline.",
    search:"Hľadať (trittstufe, wasserpumpe, 12V...)",
    diag:"Diagnostika",
    empty:"Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.",
    proto:"Protokol",
    copy:"Kopírovať",
    clear:"Vymazať cestu",
    yes:"ÁNO",
    no:"NIE",
    back:"← KROK SPÄŤ",
    tags:"Tagy ▾",
    filterReset:"Reset filtra",
    reset:"Reset",
    admin:"ADMIN",
    time:"Čas",
    lang:"Jazyk",
    fault:"Porucha",
    tagsLabel:"Tagy",
    steps:"Kroky",
    result:"Výsledok",
    pdf:"PDF Download",
    txt:"TXT Download",
    copied:"Skopírované."
  }
};

function T(k){ return (I[LANG] && I[LANG][k]) || k; }

// ---- CRITICAL: object {de,sk} -> string
function L(x){
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  if (typeof x === "object"){
    // prefer current lang, then de, then sk, then first value
    if (x[LANG]) return String(x[LANG]);
    if (x.de) return String(x.de);
    if (x.sk) return String(x.sk);
    const v = Object.values(x)[0];
    return v == null ? "" : String(v);
  }
  return String(x);
}

function nowLocal(){
  try { return new Date().toLocaleString(undefined,{hour12:false}); }
  catch { return new Date().toISOString(); }
}

// ---- LOAD content.json
async function loadContent(){
  try{
    const r = await fetch("./content.json?v="+encodeURIComponent(VERSION), {cache:"no-store"});
    const data = await r.json();
    TREES = Array.isArray(data) ? data : (data.trees || []);
  }catch(e){
    TREES = [];
  }
}

// ---- UI init
function applyLangUI(){
  document.documentElement.lang = (LANG === "de") ? "de" : "sk";
  el.hFaults.textContent = T("faults");
  el.hHint.textContent = T("hint");
  el.hDiag.textContent = T("diag");
  el.diagEmpty.textContent = T("empty");
  el.hProto.textContent = T("proto");
  el.search.placeholder = T("search");
  el.tagBtn.textContent = T("tags");
  el.filterResetBtn.textContent = T("filterReset");
  el.resetBtn.textContent = T("reset");
  el.adminBtn.textContent = T("admin");
  el.yesBtn.textContent = T("yes");
  el.noBtn.textContent = T("no");
  el.backBtn.textContent = T("back");
  el.copyBtn.textContent = T("copy");
  el.clearPathBtn.textContent = T("clear");
  el.txtBtn.textContent = T("txt");
  el.pdfBtn.textContent = T("pdf");
  el.ver.textContent = "v"+VERSION;
  renderTagChips();
  renderList();
  renderNode();
  renderProtocol();
}

function updateOffline(){
  const on = navigator.onLine;
  el.offlinePill.textContent = "offline: " + (on ? "NO" : "YES");
}
window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);

// ---- TAGS
function allTags(){
  const s = new Set();
  for(const tr of TREES){
    for(const tg of (tr.tags||[])) s.add(tg);
  }
  return Array.from(s).sort((a,b)=>a.localeCompare(b));
}

function renderTagChips(){
  el.tagChips.innerHTML = "";
  if(!tagsOpen){ el.tagChips.style.display="none"; return; }
  el.tagChips.style.display="flex";
  const tags = ["__ALL__"].concat(allTags());
  for(const tg of tags){
    const b = document.createElement("button");
    b.className = "tagBtn" + ((activeTag === tg) ? " active" : "");
    b.textContent = (tg==="__ALL__") ? "ALL" : tg;
    b.onclick = ()=>{
      activeTag = (activeTag === tg) ? "" : tg;
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
  if(activeTag && activeTag!=="__ALL__"){
    if(!(tr.tags||[]).includes(activeTag)) return false;
  }
  if(!q) return true;
  const hay = (L(tr.title)+" "+L(tr.subtitle)+" "+(tr.tags||[]).join(" ")).toLowerCase();
  return hay.includes(q);
}

function renderList(){
  const q = (el.search.value||"").trim().toLowerCase();
  el.faultList.innerHTML = "";

  // numbering: use index in filtered list (stabilné)
  const list = TREES.filter(tr=>matchTree(tr,q));

  list.forEach((tr, idx)=>{
    const item = document.createElement("button");
    item.className = "item";
    const title = `${String(idx+1).padStart(2,"0")} ${L(tr.title)}`;
    item.innerHTML = `<div class="t">${escapeHtml(title)}</div><div class="s">${escapeHtml(L(tr.subtitle))}</div>`;
    item.onclick = ()=>selectTree(tr);
    el.faultList.appendChild(item);
  });
}

function selectTree(tr){
  currentTree = tr;
  currentNodeId = tr.start;
  path = [];
  el.faultTitleBadge.style.display = "inline-flex";
  el.faultTitleBadge.textContent = L(tr.title);
  el.faultTagsBadge.style.display = "inline-flex";
  el.faultTagsBadge.textContent = "#"+(tr.tags||[]).join(" #");
  renderNode();
  renderProtocol();
}

// ---- NODE
function node(){
  if(!currentTree || !currentNodeId) return null;
  return (currentTree.nodes||{})[currentNodeId] || null;
}

function renderNode(){
  if(!currentTree){
    el.answerBtns.style.display = "none";
    el.nodeText.textContent = "";
    el.nodeHelp.textContent = "";
    return;
  }
  const n = node();
  if(!n){
    el.nodeText.textContent = (LANG==="de") ? "Fehler: Node fehlt im Baum." : "Chyba: chýba uzol v strome.";
    el.nodeHelp.textContent = (LANG==="de") ? "Prüfe content.json." : "Skontroluj content.json.";
    el.answerBtns.style.display = "none";
    return;
  }

  if(n.type === "question"){
    el.nodeText.textContent = L(n.text);
    el.nodeHelp.textContent = L(n.help);
    el.answerBtns.style.display = "grid";
  } else if(n.type === "result"){
    // show result as node text (so user sees solution immediately)
    const cause = L(n.cause);
    const action = L(n.action);
    const head = (LANG==="de") ? "Ergebnis" : "Výsledok";
    el.nodeText.textContent = head + ": " + (cause || "");
    el.nodeHelp.textContent = action ? ((LANG==="de") ? "Maßnahme: " : "Akcia: ") + action : "";
    el.answerBtns.style.display = "none";
  } else if(n.type === "action"){
    // action node -> show text and provide YES as "weiter" only
    el.nodeText.textContent = L(n.text);
    el.nodeHelp.textContent = "";
    el.answerBtns.style.display = "grid";
  } else {
    el.nodeText.textContent = L(n.text);
    el.nodeHelp.textContent = L(n.help);
    el.answerBtns.style.display = "grid";
  }
}

// ---- ANSWER FLOW
function go(nextId, answerLabel){
  const n = node();
  if(!n) return;

  // store protocol step as TEXT (never object)
  if(n.type === "question"){
    path.push({ q: L(n.text), a: answerLabel });
  } else if(n.type === "action"){
    path.push({ q: L(n.text), a: answerLabel });
  }

  currentNodeId = nextId || null;
  renderNode();
  renderProtocol();
}

function yes(){
  const n = node(); if(!n) return;
  if(n.type === "question") return go(n.yes, (LANG==="de") ? "[JA]" : "[ÁNO]");
  if(n.type === "action") return go(n.next || currentNodeId, (LANG==="de") ? "[JA]" : "[ÁNO]");
}
function no(){
  const n = node(); if(!n) return;
  if(n.type === "question") return go(n.no, (LANG==="de") ? "[NEIN]" : "[NIE]");
  if(n.type === "action") return go(n.next || currentNodeId, (LANG==="de") ? "[NEIN]" : "[NIE]");
}
function back(){
  // go one step back in protocol path: reset and replay steps
  if(!currentTree) return;
  if(path.length === 0){
    currentNodeId = currentTree.start;
    renderNode(); renderProtocol();
    return;
  }
  path.pop();
  // replay from start
  currentNodeId = currentTree.start;
  const replay = [...path];
  path = [];
  for(const st of replay){
    // find node by matching text – stable enough for our trees
    const n = node();
    if(!n) break;
    const wantYes = st.a.includes("JA") || st.a.includes("ÁNO");
    if(n.type === "question"){
      path.push({ q: L(n.text), a: st.a });
      currentNodeId = wantYes ? n.yes : n.no;
    }else break;
  }
  renderNode(); renderProtocol();
}

// ---- PROTOCOL
function renderProtocol(){
  if(!currentTree){
    el.proto.value = "";
    return;
  }
  const n = node();

  let out = "";
  out += `${T("time")}: ${nowLocal()}\n`;
  out += `${T("lang")}: ${LANG.toUpperCase()}\n`;
  out += `${T("fault")}: ${L(currentTree.title)}\n`;
  out += `${T("tagsLabel")}: ${(currentTree.tags||[]).join(", ")}\n\n`;

  out += `${T("steps")}:\n`;
  path.forEach((st, i)=>{
    out += `${i+1}. ${st.q} ${st.a}\n`;
  });

  // if current node is result -> append result
  if(n && n.type === "result"){
    out += `\n${T("result")}:\n`;
    const cause = L(n.cause);
    const action = L(n.action);
    if(cause) out += `${cause}\n`;
    if(action) out += `${action}\n`;
  }
  el.proto.value = out;
}

// ---- TXT / PDF
function downloadTxt(){
  const blob = new Blob([el.proto.value], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `caravan_tam_${LANG}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}

function downloadPdf(){
  // simple: open print window with <pre> (PDF -> "Save as PDF")
  const w = window.open("", "_blank");
  const safe = escapeHtml(el.proto.value);
  w.document.write(`
    <html><head><meta charset="utf-8">
    <title>Caravan TaM Protocol</title>
    <style>
      body{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding:18px;}
      pre{white-space:pre-wrap; font-size:14px; line-height:1.35;}
    </style></head><body>
    <pre>${safe}</pre>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>
  `);
  w.document.close();
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ---- RESET
function hardReset(){
  activeTag = "";
  tagsOpen = false;
  currentTree = null;
  currentNodeId = null;
  path = [];
  el.faultTitleBadge.style.display="none";
  el.faultTagsBadge.style.display="none";
  el.search.value = "";
  el.tagChips.style.display="none";
  renderList();
  renderNode();
  el.proto.value = "";
}

// ---- ADMIN (IMPORT/EXPORT)
async function admin(){
  const choice = prompt("ADMIN\n1 = Import content.json\n2 = Export content.json");
  if(!choice) return;

  if(choice.trim()==="1"){
    const inp = document.createElement("input");
    inp.type="file";
    inp.accept="application/json,.json";
    inp.onchange = async ()=>{
      const f = inp.files && inp.files[0];
      if(!f) return;
      const txt = await f.text();
      try{
        const data = JSON.parse(txt);
        const arr = Array.isArray(data) ? data : (data.trees || []);
        localStorage.setItem("content_override", JSON.stringify(arr));
        TREES = arr;
        hardReset();
        applyLangUI();
        alert("Import OK");
      }catch(e){
        alert("Import ERROR: JSON invalid");
      }
    };
    inp.click();
  }

  if(choice.trim()==="2"){
    const data = JSON.stringify(TREES, null, 2);
    const blob = new Blob([data], {type:"application/json;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `content_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  }
}

// ---- boot
(async function(){
  // content override from localStorage (admin import)
  const ov = localStorage.getItem("content_override");
  if(ov){
    try{ TREES = JSON.parse(ov); }
    catch{ TREES = []; }
  } else {
    await loadContent();
  }

  // handlers
  el.langDE.onclick = ()=>{ LANG="de"; localStorage.setItem("lang",LANG); applyLangUI(); };
  el.langSK.onclick = ()=>{ LANG="sk"; localStorage.setItem("lang",LANG); applyLangUI(); };
  el.resetBtn.onclick = ()=>hardReset();
  el.search.oninput = ()=>renderList();

  el.tagBtn.onclick = ()=>{
    tagsOpen = !tagsOpen;
    renderTagChips();
  };
  el.filterResetBtn.onclick = ()=>filterReset();

  el.yesBtn.onclick = ()=>yes();
  el.noBtn.onclick = ()=>no();
  el.backBtn.onclick = ()=>back();

  el.copyBtn.onclick = async ()=>{
    try{ await navigator.clipboard.writeText(el.proto.value); el.protoHint.textContent=T("copied"); }
    catch{ el.protoHint.textContent=""; }
    setTimeout(()=>el.protoHint.textContent="", 1000);
  };

  el.clearPathBtn.onclick = ()=>{
    path = [];
    if(currentTree) currentNodeId = currentTree.start;
    renderNode(); renderProtocol();
  };

  el.txtBtn.onclick = ()=>downloadTxt();
  el.pdfBtn.onclick = ()=>downloadPdf();
  el.adminBtn.onclick = ()=>admin();

  applyLangUI();
  updateOffline();
})();
