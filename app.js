let content;
fetch("content.json").then(r=>r.json()).then(d=>{content=d;renderList();});

function renderList(){
 const l=document.getElementById("listView");
 const t=document.getElementById("treeView");
 t.style.display="none"; l.innerHTML="";
 content.trees.forEach(tr=>{
  const c=document.createElement("div");
  c.className="card";
  c.innerHTML="<b>"+tr.title+"</b><br>"+tr.description;
  c.onclick=()=>openTree(tr);
  l.appendChild(c);
 });
}

let node;
function openTree(tr){
 node=tr.root;
 document.getElementById("listView").innerHTML="";
 renderNode();
}

function renderNode(){
 const t=document.getElementById("treeView");
 t.style.display="block"; t.innerHTML="";
 const q=document.createElement("div");
 q.className="card"; q.innerText=node.text;
 t.appendChild(q);
 node.answers.forEach(a=>{
  const b=document.createElement("div");
  b.className="button"; b.innerText=a.text;
  b.onclick=()=>{ if(a.next){ node=a.next; renderNode(); } };
  t.appendChild(b);
 });
}
