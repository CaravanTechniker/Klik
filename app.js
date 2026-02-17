let LANG = "sk";
const ADMIN_PIN = "2468";

let TREES = [];
let currentTree = null;
let currentNode = null;
let history = [];

function t(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  return obj[LANG] || obj.de || "";
}

async function loadTrees(){
  try{
    const local = localStorage.getItem("tam_custom_trees");
    if(local){
      TREES = JSON.parse(local);
      return;
    }
  }catch{}

  const res = await fetch("content.json?ts="+Date.now());
  TREES = await res.json();
}

function renderTreeSelect(){
  const sel = document.getElementById("treeSelect");
  sel.innerHTML = "";
  TREES.forEach(t=>{
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t(t.title);
    sel.appendChild(o);
  });
  sel.onchange = ()=>{
    startTree(sel.value);
  };
}

function startTree(id){
  currentTree = TREES.find(t=>t.id===id);
  currentNode = currentTree.start;
  history = [];
  renderNode();
}

function renderNode(){
  const n = currentTree.nodes[currentNode];
  document.getElementById("nodeText").innerText = t(n.text);

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
  p += "Jazyk: "+LANG.toUpperCase()+"\n";
  p += "Strom: "+t(currentTree.title)+"\n\n";
  history.forEach((h,i)=>{
    p += (i+1)+". "+t(currentTree.nodes[h].text)+"\n";
  });
  p += "\nAktuálny krok:\n"+t(node.text);
  document.getElementById("protocol").innerText = p;
}

/* ADMIN */
function admin(){
  const pin = prompt("PIN:");
  if(pin!==ADMIN_PIN) return alert("Zlý PIN");

  const a = prompt("ADMIN\n1 = Import\n2 = Export");
  if(a==="1") importJson();
  if(a==="2") exportJson();
}

function importJson(){
  const i = document.createElement("input");
  i.type="file";
  i.accept="application/json";
  i.onchange=async()=>{
    const f=i.files[0];
    const t=await f.text();
    const d=JSON.parse(t);
    localStorage.setItem("tam_custom_trees",JSON.stringify(d));
    location.reload();
  };
  i.click();
}

function exportJson(){
  const blob=new Blob([JSON.stringify(TREES,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="content.json";
  a.click();
}

/* EVENTS */
document.getElementById("yesBtn").onclick=()=>answer(true);
document.getElementById("noBtn").onclick=()=>answer(false);
document.getElementById("backBtn").onclick=back;
document.getElementById("adminBtn").onclick=admin;
document.getElementById("langBtn").onclick=()=>{
  LANG = LANG==="sk"?"de":"sk";
  document.getElementById("langBtn").innerText = LANG.toUpperCase();
  renderNode();
};

(async()=>{
  await loadTrees();
  renderTreeSelect();
  startTree(TREES[0].id);
})();
