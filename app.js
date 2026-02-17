const VERSION = "0.1.7-fix1";

const i18n = {
  sk: {
    faults:"Poruchy", hint:"Vyber poruchu alebo hľadaj. Funguje aj offline.",
    searchPh:"Hľadať (trittstufe, wasserpumpe, 12V...)", diag:"Diagnostika",
    empty:"Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.", yes:"ÁNO", no:"NIE",
    next:"Ďalej", done:"Hotovo", copy:"Kopírovať", cleared:"Vymazané.",
    clearPath:"Vymazať cestu", reset:"Reset", back:"Späť", offline:"offline",
    timestamp:"Čas", language:"Jazyk", fault:"Porucha", steps:"Kroky", result:"Výsledok",
    cause:"Pravdepodobná príčina", action:"Akcia", safety:"Bezpečnosť"
  },
  de: {
    faults:"Störungen", hint:"Wähle eine Störung oder suche. Funktioniert auch offline.",
    searchPh:"Suchen (Trittstufe, Wasserpumpe, 12V...)", diag:"Diagnose",
    empty:"Wähle links eine Störung. Dann JA / NEIN klicken.", yes:"JA", no:"NEIN",
    next:"Weiter", done:"Fertig", copy:"Kopieren", cleared:"Gelöscht.",
    clearPath:"Pfad löschen", reset:"Reset", back:"Zurück", offline:"offline",
    timestamp:"Zeit", language:"Sprache", fault:"Störung", steps:"Schritte", result:"Ergebnis",
    cause:"Wahrscheinliche Ursache", action:"Maßnahme", safety:"Sicherheit"
  }
};

let LANG = localStorage.getItem("lang") || "sk";
function t(k){ return (i18n[LANG] && i18n[LANG][k]) || k; }
function textByLang(obj){
  if(!obj) return "";
  if(typeof obj==="string") return obj;
  return obj[LANG] || obj.de || obj.sk || "";
}
function nowIso(){ return new Date().toISOString(); }
function fmtLocal(d){ try{ return new Date(d).toLocaleString(undefined,{hour12:false}); }catch{ return String(d); } }

const els = {
  langBtn: document.getElementById("langBtn"),
  resetBtn: document.getElementById("resetBtn"),
  fontMinus: document.getElementById("fontMinus"),
  fontPlus: document.getElementById("fontPlus"),
  backBtn: document.getElementById("backBtn"),
  faultsH: document.getElementById("hFaults"),
  hint: document.getElementById("hHint"),
  search: document.getElementById("search"),
  list: document.getElementById("faultList"),
  diagH: document.getElementById("hDiag"),
  diagEmpty: document.getElementById("diagEmpty"),
  diag: document.getElementById("diag"),
  nodeText: document.getElementById("nodeText"),
  nodeHelp: document.getElementById("nodeHelp"),
  answerBtns: document.getElementById("answerBtns"),
  proto: document.getElementById("proto"),
  copyBtn: document.getElementById("copyBtn"),
  clearPathBtn: document.getElementById("clearPathBtn"),
  faultTitleBadge: document.getElementById("faultTitleBadge"),
  faultTagsBadge: document.getElementById("faultTagsBadge"),
  ver: document.getElementById("ver"),
  offlinePill: document.getElementById("offlinePill")
};

// --- FONT SCALE (real change) ---
const FS_MIN=0.8, FS_MAX=2.0, FS_STEP=0.2;
let fontScale = parseFloat(localStorage.getItem("fontScale")||"1");
function applyFontScale(){
  document.documentElement.style.setProperty("--fs", String(fontScale.toFixed(2)));
  localStorage.setItem("fontScale", fontScale.toFixed(2));
}
applyFontScale();

let TREES = [];
let currentTree=null, currentNodeId=null;
let path=[];

// Safe bind helper
function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }

// Load content
async function loadContent(){
  const url = "./content.json?ts=" + Date.now();
  const res = await fetch(url, {cache:"no-store"});
  if(!res.ok) throw new Error("content.json fetch failed: " + res.status);
  const data = await res.json();

  // accept either array directly or {trees:[...]}
  if(Array.isArray(data)) return data;
  if(data && Array.isArray(data.trees)) return data.trees;
  throw new Error("content.json has invalid format (expected array or {trees:[]})");
}

function setLang(newLang){
  LANG = newLang;
  localStorage.setItem("lang", LANG);
  if(els.langBtn) els.langBtn.textContent = LANG.toUpperCase();
  if(els.faultsH) els.faultsH.textContent = t("faults");
  if(els.hint) els.hint.textContent = t("hint");
  if(els.search) els.search.placeholder = t("searchPh");
  if(els.diagH) els.diagH.textContent = t("diag");
  if(els.diagEmpty) els.diagEmpty.textContent = t("empty");
  if(els.copyBtn) els.copyBtn.textContent = t("copy");
  if(els.clearPathBtn) els.clearPathBtn.textContent = t("clearPath");
  if(els.resetBtn) els.resetBtn.textContent = t("reset");
  if(els.backBtn) els.backBtn.textContent = t("back");
  renderFaultList();
  renderNode();
  updateProtocol();
  updateBackBtn();
}

function renderFaultList(){
  if(!els.list) return;
  const q=(els.search?.value||"").trim().toLowerCase();
  els.list.innerHTML="";

  const visible = (TREES||[]).filter(tree=>{
    if(!tree) return false;
    const title = textByLang(tree.title);
    const sub = textByLang(tree.subtitle);
    const tags = (tree.tags||[]).join(" ");
    const hay = (title+" "+sub+" "+tags).toLowerCase();
    if(!q) return true;
    return hay.includes(q);
  });

  if(visible.length===0){
    const d=document.createElement("div");
    d.className="muted";
    d.textContent = "—";
    els.list.appendChild(d);
    return;
  }

  visible.forEach(tree=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML = `<div class="t">${escapeHtml(textByLang(tree.title) || tree.id || "—")}</div>
                     <div class="s">${escapeHtml(textByLang(tree.subtitle) || "")}</div>`;
    div.addEventListener("click", ()=>selectTree(tree.id));
    els.list.appendChild(div);
  });
}

function selectTree(id){
  currentTree = TREES.find(x=>x.id===id) || null;
  currentNodeId = currentTree ? currentTree.start : null;
  path = [];
  if(els.diagEmpty) els.diagEmpty.style.display = currentTree ? "none" : "block";
  if(els.diag) els.diag.style.display = currentTree ? "block" : "none";
  renderNode();
  updateProtocol();
  updateBackBtn();
}

function renderNode(){
  if(!currentTree || !currentNodeId) return;
  const node = currentTree.nodes && currentTree.nodes[currentNodeId];
  if(!node){
    if(els.nodeText) els.nodeText.textContent = "Node not found: " + currentNodeId;
    return;
  }

  if(els.faultTitleBadge) els.faultTitleBadge.textContent = textByLang(currentTree.title) || currentTree.id;
  if(els.faultTagsBadge) els.faultTagsBadge.textContent = (currentTree.tags||[]).slice(0,3).map(x=>"#"+x).join(" ");

  if(els.nodeText) els.nodeText.textContent = textByLang(node.text) || "";
  const help = textByLang(node.help);
  if(els.nodeHelp){
    if(help){
      els.nodeHelp.style.display="block";
      els.nodeHelp.textContent=help;
    }else{
      els.nodeHelp.style.display="none";
      els.nodeHelp.textContent="";
    }
  }

  if(!els.answerBtns) return;
  els.answerBtns.innerHTML="";

  if(node.type==="question"){
    const yes=document.createElement("button");
    yes.className="btn ok";
    yes.textContent=t("yes");
    yes.addEventListener("click", ()=>advance(node.yes, t("yes")));
    const no=document.createElement("button");
    no.className="btn no";
    no.textContent=t("no");
    no.addEventListener("click", ()=>advance(node.no, t("no")));
    els.answerBtns.appendChild(yes);
    els.answerBtns.appendChild(no);
  }else if(node.type==="action"){
    const b=document.createElement("button");
    b.className="btn primary";
    b.textContent=t("next");
    b.addEventListener("click", ()=>advance(node.next, t("next")));
    els.answerBtns.appendChild(b);
  }else if(node.type==="result"){
    const b=document.createElement("button");
    b.className="btn primary";
    b.textContent=t("done");
    els.answerBtns.appendChild(b);

    const details=[];
    if(node.cause) details.push(`${t("cause")}: ${textByLang(node.cause)}`);
    if(node.action) details.push(`${t("action")}: ${textByLang(node.action)}`);
    if(els.nodeHelp){
      els.nodeHelp.style.display="block";
      els.nodeHelp.textContent = details.join("\n\n");
    }
  }
}

function advance(nextId, answerLabel){
  if(!currentTree) return;
  const node = currentTree.nodes[currentNodeId];
  path.push({ nodeId: currentNodeId, text: textByLang(node.text), answerLabel, at: nowIso() });
  currentNodeId = nextId;
  renderNode();
  updateProtocol();
  updateBackBtn();
}

function updateBackBtn(){
  if(!els.backBtn) return;
  els.backBtn.disabled = !(path && path.length>0);
}

function updateProtocol(){
  if(!els.proto){ return; }
  if(!currentTree){
    els.proto.value="";
    return;
  }
  const node = currentTree.nodes[currentNodeId];
  const lines=[];
  lines.push(`${t("timestamp")}: ${fmtLocal(new Date())}`);
  lines.push(`${t("language")}: ${LANG.toUpperCase()}`);
  lines.push(`${t("fault")}: ${textByLang(currentTree.title)}`);
  lines.push(`Tags: ${(currentTree.tags||[]).join(", ")}`);
  lines.push("");
  lines.push(`${t("steps")}:`);
  if(path.length===0) lines.push("- (—)");
  else path.forEach((s,i)=>{ lines.push(`${i+1}. ${s.text}`); lines.push(`   → ${s.answerLabel}`); });
  lines.push("");
  lines.push(`${t("result")}:`);
  if(node){
    if(node.type==="result"){
      if(node.cause) lines.push(`- ${t("cause")}: ${textByLang(node.cause)}`);
      if(node.action) lines.push(`- ${t("action")}: ${textByLang(node.action)}`);
    }else{
      lines.push(`- ${textByLang(node.text)}`);
    }
  }
  lines.push("");
  lines.push(`${t("safety")}:`);
  lines.push(LANG==="de"
    ? "- 12V: immer auch unter Last messen. Masse und Sicherungen messen, nicht nur ansehen."
    : "- 12V: meraj aj pod záťažou. Kostru a poistky meraj, nestačí pozrieť.");
  els.proto.value = lines.join("\n");
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]||c));
}

function updateOffline(){
  if(!els.offlinePill) return;
  els.offlinePill.textContent = `${t("offline")}: ${navigator.onLine ? "NO" : "YES"}`;
}

// --- binds ---
on(els.langBtn, "click", ()=> setLang(LANG==="sk" ? "de" : "sk"));
on(els.fontPlus, "click", ()=>{ fontScale=Math.min(FS_MAX, fontScale+FS_STEP); applyFontScale(); });
on(els.fontMinus, "click", ()=>{ fontScale=Math.max(FS_MIN, fontScale-FS_STEP); applyFontScale(); });
on(els.backBtn, "click", ()=>{ if(path.length){ const last=path.pop(); currentNodeId=last.nodeId; renderNode(); updateProtocol(); updateBackBtn(); }});
on(els.resetBtn, "click", ()=>{ currentTree=null; currentNodeId=null; path=[]; if(els.diagEmpty) els.diagEmpty.style.display="block"; if(els.diag) els.diag.style.display="none"; updateProtocol(); updateBackBtn(); });
on(els.copyBtn, "click", async ()=>{
  try{ await navigator.clipboard.writeText(els.proto.value); els.copyBtn.textContent = (LANG==="de"?"Kopiert":"Skopírované"); setTimeout(()=>els.copyBtn.textContent=t("copy"),900); }
  catch{ els.proto.select(); document.execCommand("copy"); }
});
on(els.clearPathBtn, "click", ()=>{ path=[]; updateProtocol(); updateBackBtn(); });
on(els.search, "input", ()=>renderFaultList());

window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);

// init
(async ()=>{
  if(els.ver) els.ver.textContent = "v" + VERSION;
  updateOffline();

  TREES = await loadContent();
  setLang(LANG);

  // show list
  renderFaultList();
})();
