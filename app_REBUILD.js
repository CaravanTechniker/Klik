const VERSION="1.0.0";
const $=id=>document.getElementById(id);

const i18n={
  de:{faults:"Störungen",hint:"Wähle eine Störung oder suche. Funktioniert auch offline.",searchPh:"Suchen (12V, Solar, EBL...)",diag:"Diagnose",diagHint:"Wähle links eine Störung. Danach klicke JA / NEIN.",yes:"JA",no:"NEIN",offline:"offline"},
  sk:{faults:"Poruchy",hint:"Vyber poruchu alebo hľadaj. Funguje aj offline.",searchPh:"Hľadať (12V, solár, EBL...)",diag:"Diagnostika",diagHint:"Vľavo vyber poruchu. Potom klikaj ÁNO / NIE.",yes:"ÁNO",no:"NIE",offline:"offline"}
};

let lang=localStorage.getItem("ctam_lang")||"de";
let scale=parseFloat(localStorage.getItem("ctam_scale")||"1");
let content=null;
let activeTree=null;
let activeNode=null;

function t(k){return (i18n[lang]&&i18n[lang][k])||k;}
function safeText(v){ if(!v) return ""; if(typeof v==="string") return v; return v[lang]||v.de||v.sk||""; }
function normalize(s){ return (s||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

function setScale(v){
  scale=Math.max(0.8,Math.min(2.2,v));
  document.documentElement.style.setProperty("--scale",String(scale));
  localStorage.setItem("ctam_scale",String(scale));
}
function setLang(l){
  lang=l; localStorage.setItem("ctam_lang",l);
  applyTexts(); renderList(); renderSafety();
}
function applyTexts(){
  $("hFaults").textContent=t("faults");
  $("hint").textContent=t("hint");
  $("search").placeholder=t("searchPh");
  $("hDiag").textContent=t("diag");
  $("diagHint").textContent=t("diagHint");
  $("version").textContent="v"+VERSION;
  $("appName").textContent=safeText(content?.meta?.appName)||"CaravanTechniker am Main";
}
function setOfflineBadge(){
  const off=!navigator.onLine;
  $("offlineBadge").textContent=`${t("offline")}: ${off ? (lang==="de"?"JA":"ÁNO") : (lang==="de"?"NEIN":"NIE")}`;
}

function findNode(id){ return (activeTree?.nodes||[]).find(n=>n.id===id)||null; }

function showStep(node){
  $("stepBox").classList.remove("hidden");
  $("stepBox").innerHTML=safeText(node.text).replace(/\n/g,"<br/>");
  const row=$("answerRow"); row.innerHTML="";
  if(node.type==="question"){
    const by=document.createElement("button"); by.className="btn"; by.textContent=t("yes");
    by.onclick=()=>step(node.yes,t("yes"));
    const bn=document.createElement("button"); bn.className="btn"; bn.textContent=t("no");
    bn.onclick=()=>step(node.no,t("no"));
    row.appendChild(by); row.appendChild(bn);
  }else{
    row.innerHTML="";
  }
}

function addProtoLine(s){
  const prev=$("proto").value.trimEnd();
  $("proto").value = prev ? (prev+"\n"+s) : s;
}

function step(nextId, choice){
  const node=findNode(activeNode);
  if(node && node.type==="question"){
    addProtoLine(`- ${safeText(node.text)}`);
    addProtoLine(`  → ${choice}`);
  }
  activeNode=nextId;
  const n=findNode(activeNode);
  if(!n){ addProtoLine("ERROR: node missing"); return; }
  if(n.type==="result"){
    addProtoLine(""); addProtoLine("Ergebnis/Výsledok:"); addProtoLine(safeText(n.text));
  }
  showStep(n);
}

function selectTree(id){
  activeTree=content.trees.find(x=>x.id===id);
  if(!activeTree) return;
  $("proto").value="";
  addProtoLine(`Sprache/Jazyk: ${lang.toUpperCase()}`);
  addProtoLine(`Störung/Porucha: ${safeText(activeTree.title)}`);
  addProtoLine("");
  activeNode=activeTree.start;
  const n=findNode(activeNode);
  showStep(n);
}

function renderList(){
  const q=normalize($("search").value||"");
  const list=$("list"); list.innerHTML="";
  const items=(content?.trees||[]).filter(tr=>{
    const a=normalize(safeText(tr.title));
    const b=normalize(safeText(tr.subtitle));
    return !q || a.includes(q) || b.includes(q);
  });
  for(const tr of items){
    const div=document.createElement("div"); div.className="item"; div.onclick=()=>selectTree(tr.id);
    div.innerHTML=`<div class="itemTitle">${safeText(tr.title)}</div><div class="itemSub">${safeText(tr.subtitle)}</div>`;
    list.appendChild(div);
  }
}

function renderSafety(){
  const arr = content?.safety?.[lang] || [];
  $("safety").innerHTML = arr.map(x=>`• ${x}`).join("<br/>");
}

async function loadContent(){
  try{
    const res=await fetch("./content.json?cb="+Date.now(),{cache:"no-store"});
    content=await res.json();
  }catch(e){
    $("loadErr").classList.remove("hidden");
    $("loadErr").textContent="content.json konnte nicht geladen werden.";
    content={meta:{appName:{de:"CaravanTechniker am Main",sk:"CaravanTechniker am Main"}},safety:{de:[],sk:[]},trees:[]};
  }
}

function registerSW(){
  if(!("serviceWorker" in navigator)) return;
  window.addEventListener("load", ()=> navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

(async function init(){
  setScale(scale);
  await loadContent();
  applyTexts();
  setOfflineBadge();
  renderSafety();
  renderList();
  $("btnDE").onclick=()=>setLang("de");
  $("btnSK").onclick=()=>setLang("sk");
  $("btnAminus").onclick=()=>setScale(scale-0.1);
  $("btnAplus").onclick=()=>setScale(scale+0.1);
  $("btnReset").onclick=()=>location.reload();
  $("search").addEventListener("input", renderList);
  window.addEventListener("online", setOfflineBadge);
  window.addEventListener("offline", setOfflineBadge);
  registerSW();
})();
