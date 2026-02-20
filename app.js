/* CT stable pack v0.3.0 */
const VERSION="0.3.0";
const STORAGE_LANG="ct_lang_v1";
const STORAGE_OVERRIDE="ct_content_override_v1";
const DEFAULT_CONTENT_URL="./content.json";
const LANGS=["de","sk","en","it","fr"];
let LANG=localStorage.getItem(STORAGE_LANG)||"de";
if(!LANGS.includes(LANG)) LANG="de";

let TREES=[], currentTree=null, currentNodeId=null, path=[];
let activeCategory=null, selectedTreeId=null, listCollapsed=false;

const el={
  subtitle:document.getElementById("subtitle"),
  btnLANG:document.getElementById("btnLANG"),
  btnADMIN:document.getElementById("btnADMIN"),
  btnRESET:document.getElementById("btnRESET"),
  hFaults:document.getElementById("hFaults"),
  hFaultHint:document.getElementById("hFaultHint"),
  howto:document.getElementById("howto"),
  search:document.getElementById("search"),
  catbar:document.getElementById("catbar"),
  list:document.getElementById("list"),
  treeCard:document.getElementById("treeCard"),
  version:document.getElementById("version"),
  hDiag:document.getElementById("hDiag"),
  hDiagHint:document.getElementById("hDiagHint"),
  qtitle:document.getElementById("qtitle"),
  qaButtons:document.getElementById("qaButtons"),
  yesBtn:document.getElementById("yesBtn"),
  noBtn:document.getElementById("noBtn"),
  backBtn:document.getElementById("backBtn"),
  hProto:document.getElementById("hProto"),
  proto:document.getElementById("proto"),
  copyBtn:document.getElementById("copyBtn"),
  clearPathBtn:document.getElementById("clearPathBtn"),
  pdfBtn:document.getElementById("pdfBtn"),
  langOverlay:document.getElementById("langOverlay"),
  langTitle:document.getElementById("langTitle"),
  langRow:document.getElementById("langRow"),
};

const I18N={
  de:{
    subtitle:"Wohnmobil Diagnose",
    faults:"Störungen",
    faultsHint:"Wähle oben eine Kategorie. Dann eine Störung auswählen.",
    howto:"Wähle oben eine Störung. Dann JA / NEIN klicken.",
    searchPH:"Suche (trittstufe, wasserpumpe, 12V...)",
    diag:"Diagnose",
    diagHint:"Wähle oben eine Störung. Dann JA / NEIN klicken.",
    proto:"Protokoll",
    copy:"Kopieren",
    clear:"Pfad löschen",
    pdf:"PDF Download",
    yes:"JA",
    no:"NEIN",
    back:"← SCHRITT ZURÜCK",
    importExportTitle:"ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK:"Import OK",
    importERR:"Import ERROR: JSON ungültig",
    resetOK:"Reset OK",
    resultLabel:"Ergebnis",
    actionLabel:"Aktion",
    chooseCategory:"Wähle oben eine Kategorie.",
    chooseFault:"Wähle oben eine Störung.",
    catElectric:"Elektrik",
    catWater:"Wasser",
    catGas:"Gas",
    catHeat:"Heizung",
    catOther:"Andere",
    langTitle:"Sprache wählen",
    changeFault:"Störung ändern",
    recommendTitle:"Empfehlung",
    disclaimerTitle:"Hinweis",
    disclaimer:"Diese Diagnose ist nur eine Hilfestellung. Keine Haftung für Schäden durch Unachtsamkeit oder falsche Eingriffe. Arbeiten an 230V- und Gasanlagen dürfen nur von fachkundigen Personen mit entsprechender Qualifikation durchgeführt werden."
  },
  sk:{
    subtitle:"Diagnostika obytných vozidiel",
    faults:"Poruchy",
    faultsHint:"Najprv vyber kategóriu. Potom vyber poruchu.",
    howto:"Vyber poruchu a potom klikaj ÁNO / NIE.",
    searchPH:"Hľadať (trittstufe, wasserpumpe, 12V...)",
    diag:"Diagnostika",
    diagHint:"Vyber hore poruchu. Potom klikaj ÁNO / NIE.",
    proto:"Protokol",
    copy:"Kopírovať",
    clear:"Vymazať cestu",
    pdf:"PDF stiahnuť",
    yes:"ÁNO",
    no:"NIE",
    back:"← SPÄŤ",
    importExportTitle:"ADMIN\n1 = Import JSON\n2 = Export JSON",
    importOK:"Import OK",
    importERR:"Chyba importu: neplatný JSON",
    resetOK:"Reset OK",
    resultLabel:"Výsledok",
    actionLabel:"Akcia",
    chooseCategory:"Najprv vyber kategóriu.",
    chooseFault:"Vyber poruchu hore.",
    catElectric:"Elektrika",
    catWater:"Voda",
    catGas:"Plyn",
    catHeat:"Kúrenie",
    catOther:"Ostatné",
    langTitle:"Vyber jazyk",
    changeFault:"Zmeniť poruchu",
    recommendTitle:"Odporúčanie",
    disclaimerTitle:"Upozornenie",
    disclaimer:"Táto diagnostika slúži len ako pomôcka. Nenesieme zodpovednosť za škody vzniknuté nepozornosťou alebo nesprávnym zásahom. Zásahy do 230V a plynových zariadení smú vykonávať len osoby s odbornou kvalifikáciou."
  }
};

function T(k){return (I18N[LANG]&&I18N[LANG][k])?I18N[LANG][k]:(I18N.de[k]||k);}
function getText(obj){ if(!obj) return ""; if(typeof obj==="string") return obj; return obj[LANG] ?? obj.de ?? obj.sk ?? obj.en ?? obj.it ?? obj.fr ?? ""; }

function tagsToArray(t){
  if(!t) return [];
  if(Array.isArray(t)) return t.map(String);
  if(typeof t==="object"){
    const cur=Array.isArray(t[LANG])?t[LANG]:[];
    const de=Array.isArray(t.de)?t.de:[];
    const out=[];
    for(const x of [...cur,...de]){ const s=String(x); if(!out.includes(s)) out.push(s); }
    return out;
  }
  return [];
}

function normalizeContent(raw){
  const arr=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.trees)?raw.trees:[]);
  return arr.map(t=>({
    id:String(t.id||""),
    category:t.category||t.cat||null,
    title:t.title||{de:"",sk:""},
    subtitle:t.subtitle||{de:"",sk:""},
    tags:t.tags??[],
    start:t.start||t.root||null,
    nodes:t.nodes||{}
  })).filter(t=>t.id&&t.start&&t.nodes&&t.nodes[t.start]);
}

async function loadContent(){
  const ov=localStorage.getItem(STORAGE_OVERRIDE);
  if(ov){
    try{ const norm=normalizeContent(JSON.parse(ov)); if(norm.length){TREES=norm; return;} }catch(e){}
  }
  try{
    const res=await fetch(DEFAULT_CONTENT_URL,{cache:"no-store"});
    TREES=normalizeContent(await res.json());
  }catch(e){ TREES=[]; }
}

function mapCategory(tree){
  const c=String(tree.category||"").toLowerCase().trim();
  if(c){
    if(c.includes("ele")||c==="electric") return "electric";
    if(c.includes("wat")||c.includes("was")||c.includes("vod")||c==="water") return "water";
    if(c.includes("gas")||c.includes("ply")) return "gas";
    if(c.includes("hei")||c.includes("kur")||c==="heat") return "heat";
    return "other";
  }
  const tags=tagsToArray(tree.tags).join(" ").toLowerCase();
  if(tags.includes("12v")||tags.includes("230v")||tags.includes("ebl")||tags.includes("elektr")) return "electric";
  if(tags.includes("wasser")||tags.includes("voda")||tags.includes("pumpe")||tags.includes("druckpumpe")||tags.includes("tauchpumpe")) return "water";
  if(tags.includes("gas")||tags.includes("plyn")) return "gas";
  if(tags.includes("heizung")||tags.includes("kuren")) return "heat";
  return "other";
}

const CATEGORY_ORDER=["electric","water","gas","heat","other"];
function categoryLabel(key){
  if(key==="electric") return T("catElectric");
  if(key==="water") return T("catWater");
  if(key==="gas") return T("catGas");
  if(key==="heat") return T("catHeat");
  return T("catOther");
}

function buildCategories(){
  el.catbar.innerHTML="";
  CATEGORY_ORDER.forEach(c=>{
    const b=document.createElement("div");
    b.className="cat"+(activeCategory===c?" active":"");
    b.textContent=categoryLabel(c);
    b.onclick=()=>{
      activeCategory=c;
      selectedTreeId=null;
      currentTree=null; currentNodeId=null; path=[];
      listCollapsed=false;
      buildCategories(); renderList(); renderNode(); renderProtocol();
    };
    el.catbar.appendChild(b);
  });
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function renderList(){
  el.list.innerHTML="";
  const q=(el.search.value||"").trim().toLowerCase();
  const showBySearch=q.length>0;
  if(!activeCategory && !showBySearch) return;

  if(listCollapsed){
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<strong>${escapeHtml(T("changeFault"))}</strong><span>${escapeHtml(T("chooseFault"))}</span>`;
    div.onclick=()=>{ listCollapsed=false; renderList(); el.treeCard.scrollIntoView({behavior:"smooth",block:"start"}); };
    el.list.appendChild(div);
    return;
  }

  const filtered=TREES.filter(t=>{
    const catKey=mapCategory(t);
    if(!showBySearch && activeCategory && catKey!==activeCategory) return false;
    const title=getText(t.title).toLowerCase();
    const sub=getText(t.subtitle).toLowerCase();
    const tags=tagsToArray(t.tags).join(" ").toLowerCase();
    if(!q) return true;
    return title.includes(q)||sub.includes(q)||tags.includes(q);
  });

  filtered.forEach(t=>{
    const div=document.createElement("div");
    div.className="item"+(selectedTreeId===t.id?" active":"");
    div.innerHTML=`<strong>${escapeHtml(getText(t.title))}</strong><span>${escapeHtml(getText(t.subtitle))}</span>`;
    div.onclick=()=>selectTree(t.id);
    el.list.appendChild(div);
  });
}

function renderNode(){
  if(!activeCategory){
    el.qtitle.textContent=T("chooseCategory");
    el.qaButtons.style.display="";
    el.yesBtn.disabled=true; el.noBtn.disabled=true; el.backBtn.disabled=true;
    return;
  }
  if(!currentTree){
    el.qtitle.textContent=T("chooseFault");
    el.qaButtons.style.display="";
    el.yesBtn.disabled=true; el.noBtn.disabled=true; el.backBtn.disabled=true;
    return;
  }
  const node=currentTree.nodes[currentNodeId];
  if(!node){ el.qtitle.textContent="–"; return; }

  el.backBtn.disabled=(path.length===0);

  if(node.type==="question"){
    el.qaButtons.style.display="";
    el.yesBtn.disabled=false; el.noBtn.disabled=false;
    el.yesBtn.textContent=T("yes");
    el.noBtn.textContent=T("no");
    el.qtitle.textContent=getText(node.text)||"–";
  }else if(node.type==="result"){
    el.qaButtons.style.display="none";
    const cause=getText(node.cause);
    const action=getText(node.action);
    const rec=getText(node.recommend);
    let txt=`${T("resultLabel")}: ${cause||""}`+(action?`\n${T("actionLabel")}: ${action}`:"");
    if(rec) txt+=`\n\n${T("recommendTitle")}: ${rec}`;
    el.qtitle.textContent=txt.trim();
  }else{
    el.qtitle.textContent="–";
  }
}

function selectTree(treeId){
  currentTree=TREES.find(t=>t.id===treeId)||null;
  selectedTreeId=treeId;
  path=[];
  currentNodeId=currentTree?currentTree.start:null;
  listCollapsed=true;
  renderList(); renderNode(); renderProtocol();
  setTimeout(()=>el.qtitle.scrollIntoView({behavior:"smooth",block:"start"}),30);
}

function answer(isYes){
  if(!currentTree) return;
  const node=currentTree.nodes[currentNodeId];
  if(!node||node.type!=="question") return;
  path.push({q:getText(node.text),a:isYes?T("yes"):T("no")});
  currentNodeId=isYes?node.yes:node.no;
  renderNode(); renderProtocol();
}

function back(){
  if(!currentTree||path.length===0) return;
  const replay=path.slice(0,-1);
  path=[];
  currentNodeId=currentTree.start;
  for(const step of replay){
    const node=currentTree.nodes[currentNodeId];
    if(!node||node.type!=="question") break;
    const isYes=(step.a===T("yes"));
    path.push(step);
    currentNodeId=isYes?node.yes:node.no;
  }
  renderNode(); renderProtocol();
}

function pad2(n){return String(n).padStart(2,"0");}

function renderProtocol(){
  const lines=[];
  const now=new Date();
  const dt=`${pad2(now.getDate())}.${pad2(now.getMonth()+1)}.${now.getFullYear()}, ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  if(currentTree){
    lines.push(`${LANG==="de"?"Zeit":"Čas"}: ${dt}`);
    lines.push(`${LANG==="de"?"Sprache":"Jazyk"}: ${LANG.toUpperCase()}`);
    lines.push(`${LANG==="de"?"Störung":"Porucha"}: ${getText(currentTree.title)}`);
    const tags=tagsToArray(currentTree.tags);
    if(tags.length) lines.push(`${LANG==="de"?"Tags":"Tagy"}: ${tags.join(", ")}`);
    lines.push("");
    lines.push(`${LANG==="de"?"Schritte":"Kroky"}:`);
    path.forEach((p,i)=>lines.push(`${i+1}. ${p.q} [${p.a}]`));
    const node=currentTree.nodes[currentNodeId];
    if(node&&node.type==="result"){
      lines.push("");
      lines.push(`${T("resultLabel")}:`);
      if(getText(node.cause)) lines.push(getText(node.cause));
      if(getText(node.action)) lines.push(`${T("actionLabel")}: ${getText(node.action)}`);
      if(getText(node.recommend)){
        lines.push("");
        lines.push(`${T("recommendTitle")}:`);
        lines.push(getText(node.recommend));
      }
    }
  }else{
    lines.push(!activeCategory?T("chooseCategory"):T("chooseFault"));
  }

  lines.push("");
  lines.push(`— ${T("disclaimerTitle")} —`);
  lines.push(T("disclaimer"));

  el.proto.value=lines.join("\n");
}

function admin(){
  const choice=prompt(T("importExportTitle"));
  if(!choice) return;

  if(choice.trim()==="1"){
    const inp=document.createElement("input");
    inp.type="file";
    inp.accept="application/json,.json";
    inp.onchange=async ()=>{
      const f=inp.files&&inp.files[0];
      if(!f) return;
      const txt=await f.text();
      try{
        const normalized=normalizeContent(JSON.parse(txt));
        if(!normalized.length) throw new Error("empty");
        localStorage.setItem(STORAGE_OVERRIDE, JSON.stringify(normalized));
        TREES=normalized;
        hardReset(false);
        alert(T("importOK"));
      }catch(e){
        alert(T("importERR"));
      }
    };
    inp.click();
  }

  if(choice.trim()==="2"){
    const data=JSON.stringify(TREES,null,2);
    const blob=new Blob([data],{type:"application/json;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`content_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }
}

function hardReset(clearOverride=true){
  if(clearOverride) localStorage.removeItem(STORAGE_OVERRIDE);
  currentTree=null; currentNodeId=null; path=[];
  selectedTreeId=null; listCollapsed=false;
  renderList(); renderNode(); renderProtocol();
  if(clearOverride) alert(T("resetOK"));
}

function openLangPicker(){
  el.langOverlay.classList.add("show");
  el.langOverlay.setAttribute("aria-hidden","false");
  el.langTitle.textContent=T("langTitle");
  el.langRow.innerHTML="";
  const labels={de:"Deutsch (DE)",sk:"Slovenčina (SK)",en:"English (EN)",it:"Italiano (IT)",fr:"Français (FR)"};
  LANGS.forEach(code=>{
    const b=document.createElement("button");
    b.className="langBtn"+(LANG===code?" active":"");
    b.textContent=labels[code]||code.toUpperCase();
    b.onclick=()=>{ setLang(code); closeLangPicker(); };
    el.langRow.appendChild(b);
  });
}

function closeLangPicker(){
  el.langOverlay.classList.remove("show");
  el.langOverlay.setAttribute("aria-hidden","true");
}

function setLang(code){
  if(!LANGS.includes(code)) return;
  LANG=code;
  localStorage.setItem(STORAGE_LANG, LANG);
  applyLangUI();
}

function applyLangUI(){
  document.documentElement.lang=LANG;
  el.subtitle.textContent=T("subtitle");
  el.hFaults.textContent=T("faults");
  el.hFaultHint.textContent=T("faultsHint");
  el.howto.textContent=T("howto");
  el.search.placeholder=T("searchPH");
  el.hDiag.textContent=T("diag");
  el.hDiagHint.textContent=T("diagHint");
  el.hProto.textContent=T("proto");
  el.copyBtn.textContent=T("copy");
  el.clearPathBtn.textContent=T("clear");
  el.pdfBtn.textContent=T("pdf");
  el.backBtn.textContent=T("back");
  el.version.textContent=`v${VERSION}`;
  el.btnLANG.textContent=`${LANG.toUpperCase()} ▾`;
  buildCategories(); renderList(); renderNode(); renderProtocol();
}

function downloadPdf(){
  const w=window.open("about:blank");
  if(!w) return;
  const proto=el.proto.value||"";
  const safe=proto.replace(/</g,"&lt;").replace(/>/g,"&gt;");
  w.document.write(`<html><head><meta charset="utf-8"><title>Protokoll</title><style>body{font-family:ui-monospace,Menlo,Consolas,monospace;padding:16px}pre{white-space:pre-wrap;word-break:break-word;font-size:14px}</style></head><body><pre>${safe}</pre></body></html>`);
  w.document.close(); w.focus();
  setTimeout(()=>w.print(),250);
}

(async function boot(){
  await loadContent();

  el.btnLANG.onclick=openLangPicker;
  el.langOverlay.onclick=(e)=>{ if(e.target===el.langOverlay) closeLangPicker(); };
  el.btnADMIN.onclick=admin;
  el.btnRESET.onclick=()=>hardReset(true);

  el.search.oninput=()=>renderList;
  el.search.oninput=()=>renderList();

  el.yesBtn.onclick=()=>answer(true);
  el.noBtn.onclick=()=>answer(false);
  el.backBtn.onclick=()=>back();

  el.copyBtn.onclick=async()=>{ try{ await navigator.clipboard.writeText(el.proto.value||""); }catch(e){} };
  el.clearPathBtn.onclick=()=>{ path=[]; if(currentTree) currentNodeId=currentTree.start; renderNode(); renderProtocol(); };
  el.pdfBtn.onclick=downloadPdf;

  for(const c of CATEGORY_ORDER){
    if(TREES.some(t=>mapCategory(t)===c)){ activeCategory=c; break; }
  }
  applyLangUI();
})();