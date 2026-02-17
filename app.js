/* =========
   SETTINGS
   ========= */
const ADMIN_PIN = "2468";
const LS_LANG = "tam_lang";
const LS_CUSTOM = "tam_custom_trees";
const LS_TAGS = "tam_tags_on";

let LANG = (localStorage.getItem(LS_LANG) || "de"); // DE je priorita
let TREES = [];
let currentTree = null;
let currentNodeId = null;
let history = []; // stack of node ids
let tagsOn = new Set(JSON.parse(localStorage.getItem(LS_TAGS) || "[]"));

/* =========
   HELPERS
   ========= */
function tr(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  return obj[LANG] || obj.de || obj.sk || "";
}

function norm(s){
  return (s||"").toString().toLowerCase().trim();
}

function allTagsForLang(tree){
  // tree.tags môže byť:
  // - pole stringov (staré)
  // - alebo objekt {de:[...], sk:[...]}
  if(!tree.tags) return [];
  if(Array.isArray(tree.tags)) return tree.tags;
  if(typeof tree.tags === "object"){
    return tree.tags[LANG] || tree.tags.de || tree.tags.sk || [];
  }
  return [];
}

function getTreeSearchText(tree){
  const t = tr(tree.title);
  const s = tr(tree.subtitle);
  const tags = allTagsForLang(tree).join(" ");
  return norm(`${t} ${s} ${tags}`);
}

/* =========
   LOAD DATA
   ========= */
async function loadTrees(){
  // 1) custom (importované) stromy
  try{
    const local = localStorage.getItem(LS_CUSTOM);
    if(local){
      TREES = JSON.parse(local);
      return;
    }
  }catch{}

  // 2) web content.json
  const res = await fetch("content.json?ts="+Date.now(), { cache:"no-store" });
  TREES = await res.json();
}

/* =========
   UI TEXTS
   ========= */
function applyUiLanguage(){
  document.documentElement.lang = (LANG === "de") ? "de" : "sk";

  // header buttons
  document.getElementById("deBtn").style.opacity = (LANG==="de") ? "1" : ".55";
  document.getElementById("skBtn").style.opacity = (LANG==="sk") ? "1" : ".55";

  // left card
  document.getElementById("leftTitle").innerText = (LANG==="de") ? "Störungen" : "Poruchy";
  document.getElementById("leftHint").innerText =
    (LANG==="de") ? "Wähle eine Störung oder suche. Funktioniert auch offline."
                  : "Vyber poruchu alebo hľadaj. Funguje aj offline.";

  document.getElementById("search").placeholder =
    (LANG==="de") ? "Suchen (trittstufe, wasserpumpe, 12V...)" : "Hľadať (trittstufe, wasserpumpe, 12V...)";

  document.getElementById("tagsToggle").innerText = (LANG==="de") ? "Tags ▾" : "Tagy ▾";
  document.getElementById("tagsReset").innerText = (LANG==="de") ? "Filter Reset" : "Filter Reset";

  // right card
  document.getElementById("rightTitle").innerText = (LANG==="de") ? "Diagnose" : "Diagnostika";
  document.getElementById("rightHint").innerText =
    (LANG==="de") ? "Wähle links eine Störung. Dann klicke JA / NEIN."
                  : "Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.";

  document.getElementById("yesBtn").innerText = (LANG==="de") ? "JA" : "ÁNO";
  document.getElementById("noBtn").innerText  = (LANG==="de") ? "NEIN" : "NIE";
  document.getElementById("backBtn").innerText = (LANG==="de") ? "⟵ SCHRITT ZURÜCK" : "⟵ KROK SPÄŤ";

  document.getElementById("protoTitle").innerText = (LANG==="de") ? "Protokoll" : "Protokol";
  document.getElementById("copyProto").innerText = (LANG==="de") ? "Kopieren" : "Kopírovať";
  document.getElementById("downloadProto").innerText = (LANG==="de") ? "TXT Download" : "Stiahnuť TXT";
  document.getElementById("downloadContent").innerText = (LANG==="de") ? "content.json Download" : "Stiahnuť content.json";

  // rerender
  renderTagsBox();
  renderTreeList();
  renderNode();
  updateProtocol();
}

/* =========
   TAGS UI
   ========= */
function getAllUniqueTags(){
  const set = new Set();
  TREES.forEach(t=>{
    allTagsForLang(t).forEach(x=> set.add(norm(x)));
  });
  return Array.from(set).filter(Boolean).sort();
}

function renderTagsBox(){
  const box = document.getElementById("tagsBox");
  box.innerHTML = "";

  const tags = getAllUniqueTags();
  if(!tags.length){
    box.innerHTML = `<div class="muted">${(LANG==="de") ? "Keine Tags verfügbar." : "Tagy nie sú dostupné."}</div>`;
    return;
  }

  tags.forEach(tag=>{
    const el = document.createElement("span");
    el.className = "tag" + (tagsOn.has(tag) ? " on" : "");
    el.innerText = "#" + tag;
    el.onclick = ()=>{
      if(tagsOn.has(tag)) tagsOn.delete(tag); else tagsOn.add(tag);
      localStorage.setItem(LS_TAGS, JSON.stringify(Array.from(tagsOn)));
      renderTagsBox();
      renderTreeList();
    };
    box.appendChild(el);
  });
}

/* =========
   TREE LIST
   ========= */
function treeMatchesFilters(tree){
  // tags filter
  if(tagsOn.size){
    const ttags = new Set(allTagsForLang(tree).map(norm));
    for(const needed of tagsOn){
      if(!ttags.has(needed)) return false;
    }
  }

  // search
  const q = norm(document.getElementById("search").value);
  if(!q) return true;
  return getTreeSearchText(tree).includes(q);
}

function renderTreeList(){
  const list = document.getElementById("treeList");
  list.innerHTML = "";

  const filtered = TREES.filter(treeMatchesFilters);

  if(!filtered.length){
    list.innerHTML = `<div class="muted">${(LANG==="de") ? "Keine Treffer." : "Žiadne výsledky."}</div>`;
    return;
  }

  filtered.forEach(t=>{
    const div = document.createElement("div");
    div.className = "treeItem" + ((currentTree && currentTree.id===t.id) ? " active" : "");
    const title = tr(t.title);
    const sub = tr(t.subtitle);
    div.innerHTML = `<div class="t">${title}</div><div class="s">${sub}</div>`;
    div.onclick = ()=> startTree(t.id);
    list.appendChild(div);
  });
}

/* =========
   TREE ENGINE
   ========= */
function startTree(id){
  currentTree = TREES.find(t=>t.id===id) || TREES[0];
  currentNodeId = currentTree.start;
  history = [];
  renderTreeList();
  renderNode();
  updateProtocol();
}

function renderNode(){
  const titleEl = document.getElementById("nodeTitle");
  const textEl = document.getElementById("nodeText");

  if(!currentTree){
    titleEl.innerText = "–";
    textEl.innerText = "–";
    return;
  }

  const node = currentTree.nodes?.[currentNodeId];
  if(!node){
    titleEl.innerText = (LANG==="de") ? "Fehler" : "Chyba";
    textEl.innerText = (LANG==="de")
      ? "Node fehlt im Baum. Prüfe content.json."
      : "Chýba uzol v strome. Skontroluj content.json.";
    return;
  }

  titleEl.innerText = tr(currentTree.title);
  textEl.innerText = tr(node.text);
}

function answer(isYes){
  if(!currentTree) return;
  const node = currentTree.nodes?.[currentNodeId];
  if(!node) return;

  history.push(currentNodeId);
  currentNodeId = isYes ? node.yes : node.no;
  renderNode();
  updateProtocol();
}

function back(){
  if(!history.length) return;
  currentNodeId = history.pop();
  renderNode();
  updateProtocol();
}

/* =========
   PROTOCOL
   ========= */
function buildProtocolText(){
  if(!currentTree) return "";

  const now = new Date();
  const pad = (n)=> String(n).padStart(2,"0");
  const ts = `${pad(now.getDate())}.${pad(now.getMonth()+1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const lines = [];
  lines.push((LANG==="de") ? `Zeit: ${ts}` : `Čas: ${ts}`);
  lines.push((LANG==="de") ? `Sprache: ${LANG.toUpperCase()}` : `Jazyk: ${LANG.toUpperCase()}`);
  lines.push((LANG==="de") ? `Störung: ${tr(currentTree.title)}` : `Porucha: ${tr(currentTree.title)}`);

  const tags = allTagsForLang(currentTree);
  if(tags.length){
    lines.push((LANG==="de") ? `Tags: ${tags.join(", ")}` : `Tagy: ${tags.join(", ")}`);
  }

  lines.push("");
  lines.push((LANG==="de") ? "Schritte:" : "Kroky:");

  history.forEach((nid, i)=>{
    const n = currentTree.nodes?.[nid];
    if(!n) return;
    lines.push(`${i+1}. ${tr(n.text)}`);
  });

  lines.push("");
  lines.push((LANG==="de") ? "Aktueller Schritt:" : "Aktuálny krok:");
  const cur = currentTree.nodes?.[currentNodeId];
  lines.push(cur ? tr(cur.text) : "–");

  return lines.join("\n");
}

function updateProtocol(){
  document.getElementById("protocol").innerText = buildProtocolText();
}

function copyProtocol(){
  const txt = buildProtocolText();
  navigator.clipboard.writeText(txt).then(()=>{
    // silent ok
  }).catch(()=> alert((LANG==="de") ? "Kopieren fehlgeschlagen" : "Kopírovanie zlyhalo"));
}

function downloadText(filename, text){
  const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function downloadProtocol(){
  const txt = buildProtocolText();
  downloadText("protokol.txt", txt);
}

function downloadContent(){
  const blob = new Blob([JSON.stringify(TREES, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "content.json";
  a.click();
}

/* =========
   ADMIN
   ========= */
function openAdmin(){
  const pin = prompt("PIN:");
  if(pin !== ADMIN_PIN){
    alert((LANG==="de") ? "Falscher PIN" : "Zlý PIN");
    return;
  }
  const panel = document.getElementById("adminPanel");
  panel.style.display = "block";
  const info = document.getElementById("adminInfo");
  info.innerText =
    `LANG=${LANG}\n`+
    `customTrees=${localStorage.getItem(LS_CUSTOM) ? "YES" : "NO"}\n`+
    `tagsOn=${Array.from(tagsOn).join(", ") || "-"}`;
}

function closeAdmin(){
  document.getElementById("adminPanel").style.display = "none";
}

function importJsonViaClick(){
  const fi = document.getElementById("fileInput");
  fi.value = "";
  fi.click();
}

async function handleFileChosen(file){
  const txt = await file.text();
  const data = JSON.parse(txt);

  if(!Array.isArray(data) || !data.length || !data[0].id){
    alert((LANG==="de") ? "Ungültiges JSON Format (erwarte Array von Bäumen)." : "Chybný formát JSON (očakávam pole stromov).");
    return;
  }

  localStorage.setItem(LS_CUSTOM, JSON.stringify(data));
  alert((LANG==="de") ? "Import OK. App wird neu geladen." : "Import OK. Obnovujem aplikáciu.");
  location.reload();
}

function wipeLocal(){
  localStorage.removeItem(LS_CUSTOM);
  localStorage.removeItem(LS_TAGS);
  // jazyk necháme
  alert((LANG==="de") ? "Lokale Daten gelöscht. Neu laden." : "Lokálne dáta vymazané. Obnovujem.");
  location.reload();
}

/* =========
   EVENTS
   ========= */
document.getElementById("deBtn").onclick = ()=>{
  LANG = "de";
  localStorage.setItem(LS_LANG, LANG);
  applyUiLanguage();
};
document.getElementById("skBtn").onclick = ()=>{
  LANG = "sk";
  localStorage.setItem(LS_LANG, LANG);
  applyUiLanguage();
};

document.getElementById("yesBtn").onclick = ()=>answer(true);
document.getElementById("noBtn").onclick  = ()=>answer(false);
document.getElementById("backBtn").onclick = back;

document.getElementById("copyProto").onclick = copyProtocol;
document.getElementById("downloadProto").onclick = downloadProtocol;
document.getElementById("downloadContent").onclick = downloadContent;

document.getElementById("adminBtn").onclick = openAdmin;
document.getElementById("closeAdminBtn").onclick = closeAdmin;
document.getElementById("importBtn").onclick = importJsonViaClick;
document.getElementById("exportBtn").onclick = downloadContent;
document.getElementById("wipeLocalBtn").onclick = wipeLocal;

document.getElementById("resetBtn").onclick = ()=>{
  tagsOn = new Set();
  localStorage.setItem(LS_TAGS, "[]");
  document.getElementById("search").value = "";
  renderTagsBox();
  renderTreeList();
};

document.getElementById("search").addEventListener("input", ()=>{
  renderTreeList();
});

document.getElementById("tagsToggle").onclick = ()=>{
  const box = document.getElementById("tagsBox");
  const isOpen = box.style.display === "block";
  box.style.display = isOpen ? "none" : "block";
  document.getElementById("tagsToggle").innerText = (LANG==="de" ? "Tags" : "Tagy") + (isOpen ? " ▾" : " ▴");
};

document.getElementById("tagsReset").onclick = ()=>{
  tagsOn = new Set();
  localStorage.setItem(LS_TAGS, "[]");
  renderTagsBox();
  renderTreeList();
};

document.getElementById("fileInput").addEventListener("change", (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  handleFileChosen(f).catch(err=>{
    console.error(err);
    alert((LANG==="de") ? ("Import Fehler: " + err.message) : ("Import chyba: " + err.message));
  });
});

/* =========
   BOOT
   ========= */
(async()=>{
  await loadTrees();
  applyUiLanguage();
  renderTagsBox();
  renderTreeList();
  startTree(TREES[0]?.id);
})();
