/* Caravan TaM - simple offline decision tree (DE/SK) + TXT/PDF export
   v0.1.5-pdf
*/

const I18N = {
  sk: {
    appTitle: "CaravanTechniker am Main",
    poruchyTitle: "Poruchy",
    poruchyHint: "Vyber poruchu alebo hľadaj. Funguje aj offline.",
    diagTitle: "Diagnostika",
    diagHint: "Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.",
    yes: "ÁNO",
    no: "NIE",
    back: "← KROK SPÄŤ",
    protoTitle: "Protokol",
    copy: "Kopírovať",
    clearPath: "Vymazať cestu",
    txt: "Stiahnuť TXT",
    pdf: "Stiahnuť PDF",
    noProto: "Nie je čo exportovať (protokol je prázdny).",
    pdfLibMissing: "Chýba knižnica pre PDF. Skontroluj index.html.",
    errMissingNode: "Chýba uzol v strome. Skontroluj content.json.",
    searchPH: "Hľadať (trittstufe, wasserpumpe, 12V...)",
    qEmpty: "—",
    time: "Čas",
    lang: "Jazyk",
    fault: "Porucha",
    tags: "Tagy",
    steps: "Kroky",
    result: "Výsledok",
    currentStep: "Aktuálny krok"
  },
  de: {
    appTitle: "CaravanTechniker am Main",
    poruchyTitle: "Störungen",
    poruchyHint: "Wähle eine Störung oder suche. Funktioniert auch offline.",
    diagTitle: "Diagnose",
    diagHint: "Wähle links eine Störung. Dann klicke JA / NEIN.",
    yes: "JA",
    no: "NEIN",
    back: "← SCHRITT ZURÜCK",
    protoTitle: "Protokoll",
    copy: "Kopieren",
    clearPath: "Pfad löschen",
    txt: "TXT Download",
    pdf: "PDF Download",
    noProto: "Nichts zu exportieren (Protokoll ist leer).",
    pdfLibMissing: "PDF-Bibliothek fehlt. Prüfe index.html.",
    errMissingNode: "Node fehlt im Baum. Prüfe content.json.",
    searchPH: "Suche (trittstufe, wasserpumpe, 12V...)",
    qEmpty: "—",
    time: "Zeit",
    lang: "Sprache",
    fault: "Störung",
    tags: "Tags",
    steps: "Schritte",
    result: "Ergebnis",
    currentStep: "Aktueller Schritt"
  }
};

const state = {
  lang: "de",
  data: [],
  selectedId: null,
  path: [], // {nodeId, answer}
  admin: false
};

const els = {
  appTitle: document.getElementById("appTitle"),
  poruchyTitle: document.getElementById("poruchyTitle"),
  poruchyHint: document.getElementById("poruchyHint"),
  diagTitle: document.getElementById("diagTitle"),
  diagHint: document.getElementById("diagHint"),
  search: document.getElementById("search"),
  list: document.getElementById("list"),
  question: document.getElementById("question"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  backBtn: document.getElementById("backBtn"),
  protoTitle: document.getElementById("protoTitle"),
  proto: document.getElementById("proto"),
  copyBtn: document.getElementById("copyBtn"),
  clearPathBtn: document.getElementById("clearPathBtn"),
  txtBtn: document.getElementById("txtBtn"),
  pdfBtn: document.getElementById("pdfBtn"),
  langDeBtn: document.getElementById("langDeBtn"),
  langSkBtn: document.getElementById("langSkBtn"),
  adminBtn: document.getElementById("adminBtn"),
  resetBtn: document.getElementById("resetBtn")
};

function t(key){
  return (I18N[state.lang] && I18N[state.lang][key]) ? I18N[state.lang][key] : key;
}

async function loadContent(){
  const url = "./content.json?nocache=" + Date.now();
  const res = await fetch(url, {cache:"no-store"});
  if(!res.ok) throw new Error("content.json load failed");
  state.data = await res.json();
}

function buildIndex(){
  // expects array of "trees"
  // each tree: { id, title:{de,sk}, subtitle:{de,sk}, tags:[...], root:"nodeId", nodes:{...} }
  // We keep it tolerant.
  return state.data.map((t, idx) => {
    const title = (t.title && (t.title[state.lang] || t.title.de || t.title.sk)) || t.id || ("Tree " + (idx+1));
    const subtitle = (t.subtitle && (t.subtitle[state.lang] || t.subtitle.de || t.subtitle.sk)) || "";
    return { id: t.id, title, subtitle, idx };
  });
}

function renderList(){
  const q = (els.search.value || "").trim().toLowerCase();
  const items = buildIndex().filter(it => {
    if(!q) return true;
    return (it.title + " " + it.subtitle).toLowerCase().includes(q);
  });

  els.list.innerHTML = "";
  for(const it of items){
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>${it.title}</strong><div class="muted">${it.subtitle}</div>`;
    div.addEventListener("click", () => {
      state.selectedId = it.id;
      state.path = [];
      render();
      // scroll to diagnosis card on mobile
      els.question.scrollIntoView({behavior:"smooth", block:"start"});
    });
    els.list.appendChild(div);
  }
}

function getSelectedTree(){
  if(!state.selectedId) return null;
  return state.data.find(t => t.id === state.selectedId) || null;
}

function getNode(tree, nodeId){
  if(!tree) return null;
  if(tree.nodes && tree.nodes[nodeId]) return tree.nodes[nodeId];
  if(Array.isArray(tree.nodes)){
    return tree.nodes.find(n => n.id === nodeId) || null;
  }
  return null;
}

function getCurrentNode(tree){
  if(!tree) return null;
  const rootId = tree.root || tree.rootId || tree.start || (tree.nodes && tree.nodes.root) || null;
  if(!rootId) return null;

  let nodeId = rootId;
  for(const step of state.path){
    const node = getNode(tree, nodeId);
    if(!node) return null;
    const next = step.answer ? (node.yes || node.nextYes || node.onYes) : (node.no || node.nextNo || node.onNo);
    if(!next) return null;
    nodeId = next;
  }
  return getNode(tree, nodeId);
}

function renderQuestion(){
  const tree = getSelectedTree();
  if(!tree){
    els.question.textContent = t("qEmpty");
    return;
  }

  const node = getCurrentNode(tree);
  if(!node){
    els.question.textContent = t("errMissingNode");
    return;
  }

  const q = (node.q && (node.q[state.lang] || node.q.de || node.q.sk)) || node.question || node.text || "";
  els.question.textContent = q || t("qEmpty");
}

function protocolText(){
  const tree = getSelectedTree();
  const now = new Date();

  const pad = (n)=>String(n).padStart(2,"0");
  const dt = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let title = "";
  let tags = [];
  if(tree){
    title = (tree.title && (tree.title[state.lang] || tree.title.de || tree.title.sk)) || tree.id || "";
    tags = Array.isArray(tree.tags) ? tree.tags : [];
  }

  const lines = [];
  lines.push(`${t("time")}: ${dt}`);
  lines.push(`${t("lang")}: ${state.lang.toUpperCase()}`);
  if(title) lines.push(`${t("fault")}: ${title}`);
  if(tags.length) lines.push(`${t("tags")}: ${tags.join(", ")}`);
  lines.push("");
  lines.push(`${t("steps")}:`);

  if(tree){
    // walk path and include questions + answers
    let nodeId = tree.root || tree.rootId || tree.start;
    for(let i=0;i<state.path.length;i++){
      const node = getNode(tree, nodeId);
      if(!node) break;
      const q = (node.q && (node.q[state.lang] || node.q.de || node.q.sk)) || node.question || node.text || "";
      const a = state.path[i].answer ? t("yes") : t("no");
      lines.push(`${i+1}. ${q}  [${a}]`);
      const next = state.path[i].answer ? (node.yes || node.nextYes || node.onYes) : (node.no || node.nextNo || node.onNo);
      if(!next) { nodeId = null; break; }
      nodeId = next;
    }

    // final result if leaf/result exists
    const cur = getCurrentNode(tree);
    if(cur){
      const result = (cur.result && (cur.result[state.lang] || cur.result.de || cur.result.sk)) || cur.outcome || cur.end || "";
      if(result){
        lines.push("");
        lines.push(`${t("result")}:`);
        lines.push(result);
      }
    }
  }

  return lines.join("\n");
}

function renderProtocol(){
  els.proto.value = protocolText();
}

function render(){
  renderList();
  renderQuestion();
  renderProtocol();
}

function copyToClipboard(text){
  if(!text) return;
  navigator.clipboard.writeText(text).catch(()=>{});
}

function downloadBlob(filename, blob){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

function makeExportBase(){
  const lang = state.lang || "de";
  const ts = new Date();
  const pad = (n)=>String(n).padStart(2,"0");
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`;
  return `caravan_tam_${lang}_${stamp}`;
}

function exportTxt(){
  const text = (els.proto && els.proto.value ? els.proto.value : "").trim();
  if(!text){ alert(t("noProto")); return; }
  const withBOM = "\ufeff" + text + "\n";
  const blob = new Blob([withBOM], {type:"text/plain;charset=utf-8"});
  downloadBlob(makeExportBase()+".txt", blob);
}

function exportPdf(){
  const text = (els.proto && els.proto.value ? els.proto.value : "").trim();
  if(!text){ alert(t("noProto")); return; }
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert(t("pdfLibMissing"));
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"mm", format:"a4"});
  doc.setFont("courier", "normal");
  doc.setFontSize(11);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const maxW = pageW - margin*2;
  const lineH = 5.2;
  let y = margin;

  const lines = doc.splitTextToSize(text, maxW);
  for(const line of lines){
    if(y > pageH - margin){
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineH;
  }
  doc.save(makeExportBase()+".pdf");
}

function applyLangUI(){
  els.appTitle.textContent = t("appTitle");
  els.poruchyTitle.textContent = t("poruchyTitle");
  els.poruchyHint.textContent = t("poruchyHint");
  els.diagTitle.textContent = t("diagTitle");
  els.diagHint.textContent = t("diagHint");
  els.yesBtn.textContent = t("yes");
  els.noBtn.textContent = t("no");
  els.backBtn.textContent = t("back");
  els.protoTitle.textContent = t("protoTitle");
  els.copyBtn.textContent = t("copy");
  els.clearPathBtn.textContent = t("clearPath");
  if (els.txtBtn) els.txtBtn.textContent = t("txt");
  if (els.pdfBtn) els.pdfBtn.textContent = t("pdf");
  els.search.placeholder = t("searchPH");
}

function adminPrompt(){
  // Simple prompt like before: 1 import / 2 export (kept basic)
  const v = prompt("ADMIN\n1 = Import\n2 = Export");
  if(v === "1"){
    // import via file input
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if(!f) return;
      const text = await f.text();
      try{
        const parsed = JSON.parse(text);
        state.data = parsed;
        alert("OK");
        render();
      }catch(e){
        alert("JSON error");
      }
    };
    inp.click();
  } else if(v === "2"){
    // export content as json
    const blob = new Blob([JSON.stringify(state.data, null, 2)], {type:"application/json;charset=utf-8"});
    downloadBlob("content_export.json", blob);
  }
}

function hardReset(){
  // Clear localStorage + caches, then reload
  try{ localStorage.clear(); }catch(e){}
  if(window.caches){
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).finally(()=>location.reload(true));
  } else {
    location.reload(true);
  }
}

async function init(){
  // restore lang if saved
  try{
    const saved = localStorage.getItem("ctam_lang");
    if(saved === "de" || saved === "sk") state.lang = saved;
  }catch(e){}

  applyLangUI();

  els.langDeBtn.addEventListener("click", () => {
    state.lang = "de";
    try{ localStorage.setItem("ctam_lang","de"); }catch(e){}
    applyLangUI();
    render();
  });

  els.langSkBtn.addEventListener("click", () => {
    state.lang = "sk";
    try{ localStorage.setItem("ctam_lang","sk"); }catch(e){}
    applyLangUI();
    render();
  });

  els.resetBtn.addEventListener("click", hardReset);

  els.search.addEventListener("input", renderList);

  els.yesBtn.addEventListener("click", () => {
    const tree = getSelectedTree();
    if(!tree) return;
    const node = getCurrentNode(tree);
    if(!node) return;
    state.path.push({nodeId: node.id || null, answer: true});
    render();
  });

  els.noBtn.addEventListener("click", () => {
    const tree = getSelectedTree();
    if(!tree) return;
    const node = getCurrentNode(tree);
    if(!node) return;
    state.path.push({nodeId: node.id || null, answer: false});
    render();
  });

  els.backBtn.addEventListener("click", () => {
    state.path.pop();
    render();
  });

  els.copyBtn.addEventListener("click", () => {
    const text = (els.proto.value || "").trim();
    if(!text){ alert(t("noProto")); return; }
    copyToClipboard(text);
  });

  els.clearPathBtn.addEventListener("click", () => {
    state.path = [];
    render();
  });

  if (els.txtBtn) els.txtBtn.addEventListener("click", exportTxt);
  if (els.pdfBtn) els.pdfBtn.addEventListener("click", exportPdf);

  // admin by 7 clicks on ADMIN (kept simple)
  let adminClicks = 0;
  let adminTimer = null;
  els.adminBtn.addEventListener("click", () => {
    adminClicks++;
    clearTimeout(adminTimer);
    adminTimer = setTimeout(()=>adminClicks = 0, 800);
    if(adminClicks >= 7){
      adminClicks = 0;
      adminPrompt();
    }
  });

  await loadContent();
  render();
}

init().catch(err => {
  console.error(err);
  els.question.textContent = "Init error";
});
