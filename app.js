// === Language handling ===
const SUPPORTED_LANGS = ["de","sk","en","fr","it","es"];
const DEFAULT_LANG = "de";

function loadLang(){
  const saved = localStorage.getItem("lang");
  return SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

let lang = loadLang();
document.getElementById("langSelect").value = lang;

document.getElementById("langSelect").addEventListener("change", e=>{
  lang = e.target.value;
  localStorage.setItem("lang", lang);
});

// === Admin hidden access (Variant A – long press) ===
let pressTimer;
const logoBox = document.getElementById("logoBox");

logoBox.addEventListener("mousedown", ()=>{
  pressTimer = setTimeout(()=>{
    const pw = prompt("Admin password:");
    if(pw === "1"){
      alert("Admin režim aktivovaný");
    }
  },2000);
});
["mouseup","mouseleave"].forEach(ev=>{
  logoBox.addEventListener(ev,()=>clearTimeout(pressTimer));
});

// === Demo data ===
const trees = [
  {cat:"Kúrenie", name:"Truma Gasheizung"},
  {cat:"Kúrenie", name:"Truma Dieselheizung"},
  {cat:"Elektrika", name:"12V Elektrika"},
  {cat:"Voda", name:"Undichtigkeit"}
];

// === Render categories ===
const catsEl = document.getElementById("cats");
let openCats = {};

function render(){
  catsEl.innerHTML="";
  const grouped = {};
  trees.forEach(t=>{
    grouped[t.cat] = grouped[t.cat] || [];
    grouped[t.cat].push(t);
  });

  Object.keys(grouped).forEach(cat=>{
    const c = document.createElement("div");
    c.className = "cat" + (openCats[cat] ? " open" : "");

    const h = document.createElement("div");
    h.className = "catHead";
    h.innerHTML = `<span>${cat}</span><span>${openCats[cat]?"▾":"▸"}</span>`;
    h.onclick=()=>{
      openCats[cat]=!openCats[cat];
      render();
    };

    const b = document.createElement("div");
    b.className="catBody";
    grouped[cat].forEach(t=>{
      const ti = document.createElement("div");
      ti.className="treeItem";
      ti.textContent=t.name;
      b.appendChild(ti);
    });

    c.appendChild(h);
    c.appendChild(b);
    catsEl.appendChild(c);
  });
}

render();

// === Collapse all ===
document.getElementById("collapseBtn").onclick=()=>{
  openCats={};
  render();
  document.getElementById("wrap").dataset.view="cats";
  window.scrollTo({top:0,behavior:"smooth"});
};

// === Mobile tabs ===
document.getElementById("tabCats").onclick=()=>{
  document.getElementById("wrap").dataset.view="cats";
};
document.getElementById("tabDiag").onclick=()=>{
  document.getElementById("wrap").dataset.view="diag";
};
