let LANG = "sk";
const ADMIN_PIN = "2468";

let TREES = [];
let currentTree = null;
let currentNode = null;
let history = [];

function tr(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  return obj[LANG] || obj.de || "";
}

async function loadTrees(){
  // 1) najprv custom (importované) stromy
  try{
    const local = localStorage.getItem("tam_custom_trees");
    if(local){
      TREES = JSON.parse(local);
      return;
    }
  }catch{}

  // 2) inak content.json z webu
  const res = await fetch("content.json?ts="+Date.now(), { cache:"no-store" });
  TREES = await res.json();
}

function renderTreeSelect(){
  const sel = document.getElementById("treeSelect");
  sel.innerHTML = "";
  TREES.forEach(t=>{
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = tr(t.title);
    sel.appendChild(o);
  });
  sel.onchange = ()=> startTree(sel.value);
}

function startTree(id){
  currentTree = TREES.find(t=>t.id===id);
  currentNode = currentTree.start;
  history = [];
  renderNode();
}

function renderNode(){
  const n = currentTree.nodes[currentNode];
  document.getElementById("nodeText").innerText = tr(n.text);
  updateProtocol(n);
}

function answer(val){
  const n = currentTree.nodes[currentNode];
  history.push(currentNode);
  currentNode = val ? n.yes : n.no;
  renderNode();
}

function back(){
  if(!history.length) return;
  currentNode = history.pop();
  renderNode();
}

function updateProtocol(node){
  let p = "";
  p += "Jazyk: " + LANG.toUpperCase() + "\n";
  p += "Strom: " + tr(currentTree.title) + "\n\n";
  history.forEach((h,i)=>{
    p += (i+1) + ". " + tr(currentTree.nodes[h].text) + "\n";
  });
  p += "\nAktuálny krok:\n" + tr(node.text);
  document.getElementById("protocol").innerText = p;
}

/* =======================
   ADMIN (bez prompt reťaze)
   ======================= */
function openAdmin(){
  const pin = prompt("PIN:");
  if(pin !== ADMIN_PIN){
    alert("Zlý PIN");
    return;
  }

  const panel = document.getElementById("adminPanel");
  panel.style.display = "block";

  const info = document.getElementById("adminInfo");
  info.textContent =
    "Custom trees: " + (localStorage.getItem("tam_custom_trees") ? "ÁNO" : "NIE") + "\n" +
    "Po importe sa uloží do localStorage.\n" +
    "Ak chceš späť webový content.json: ADMIN → Reset local (vymazať localStorage).";
}

function closeAdmin(){
  document.getElementById("adminPanel").style.display = "none";
}

function importJsonViaClick(){
  // musí byť spustené PRIAMO klikom na tlačidlo (gesto používateľa)
  const fi = document.getElementById("fileInput");
  fi.value = "";
  fi.click();
}

async function handleFileChosen(file){
  const txt = await file.text();
  const data = JSON.parse(txt);

  // základná kontrola formátu
  if(!Array.isArray(data) || !data.length || !data[0].id){
    alert("Chybný formát JSON. Očakávam pole stromov.");
    return;
  }

  localStorage.setItem("tam_custom_trees", JSON.stringify(data));
  alert("Import OK. Obnovujem aplikáciu.");
  location.reload();
}

function exportJson(){
  const blob = new Blob([JSON.stringify(TREES,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "content.json";
  a.click();
}

/* EVENTS */
document.getElementById("yesBtn").onclick = ()=>answer(true);
document.getElementById("noBtn").onclick  = ()=>answer(false);
document.getElementById("backBtn").onclick = back;

document.getElementById("adminBtn").onclick = openAdmin;
document.getElementById("closeAdminBtn").onclick = closeAdmin;

document.getElementById("importBtn").onclick = importJsonViaClick;
document.getElementById("exportBtn").onclick = exportJson;

document.getElementById("fileInput").addEventListener("change", (e)=>{
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  handleFileChosen(f).catch(err=>{
    console.error(err);
    alert("Import zlyhal: " + err.message);
  });
});

document.getElementById("langBtn").onclick = ()=>{
  LANG = (LANG==="sk") ? "de" : "sk";
  document.getElementById("langBtn").innerText = LANG.toUpperCase();
  renderNode();
};

(async()=>{
  await loadTrees();
  renderTreeSelect();
  startTree(TREES[0].id);
})();
