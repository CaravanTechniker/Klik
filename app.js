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

// === Admin hidden access (Variant A – long press 2s) ===
let pressTimer;
const logoBox = document.getElementById("logoBox");

logoBox.addEventListener("touchstart", ()=>{
  pressTimer = setTimeout(()=>{
    const pw = prompt("Admin password:");
    if(pw === "1"){
      alert("Admin režim aktivovaný");
    }
  },2000);
},{passive:true});

logoBox.addEventListener("touchend", ()=>clearTimeout(pressTimer));
logoBox.addEventListener("touchcancel", ()=>clearTimeout(pressTimer));

// aj pre myš (desktop)
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
  {id:"truma-gas", cat:"Kúrenie", name:"Truma Gasheizung"},
  {id:"truma-diesel", cat:"Kúrenie", name:"Truma Dieselheizung"},
  {id:"12v", cat:"Elektrika", name:"12V Elektrika"},
  {id:"water", cat:"Voda", name:"Wasser / Undichtigkeit"}
];

// === State ===
const catsEl = document.getElementById("cats");
const wrapEl = document.getElementById("wrap");
const qTitle = document.getElementById("qTitle");
const qSub = document.getElementById("qSub");

let openCats = {};
let selectedTreeId = null;

// === Render categories ===
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
      ti.className="treeItem" + (t.id===selectedTreeId ? " active" : "");
      ti.innerHTML = `<span>${t.name}</span><span>›</span>`;

      ti.onclick=()=>{
        selectedTreeId = t.id;
        qTitle.textContent = `Vybraný strom: ${t.name}`;
        qSub.textContent = `Pripravené. Prejdi na Diagnostika. (Logika stromov príde z content.json)`;
        render();

        // mobile: automaticky prepni na Diagnostika
        if (window.matchMedia("(max-width: 980px)").matches){
          wrapEl.dataset.view = "diag";
          setTabs("diag");
          window.scrollTo({top:0,behavior:"smooth"});
        }
      };

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
  openCats = {};
  selectedTreeId = null;
  qTitle.textContent = "Vyber poruchu";
  qSub.textContent = "Potom sa prepneš na diagnostiku.";
  render();

  wrapEl.dataset.view="cats";
  setTabs("cats");
  window.scrollTo({top:0,behavior:"smooth"});
};

// === Mobile tabs ===
const tabCats = document.getElementById("tabCats");
const tabDiag = document.getElementById("tabDiag");

function setTabs(view){
  if(view==="cats"){
    tabCats.classList.add("active");
    tabDiag.classList.remove("active");
  }else{
    tabDiag.classList.add("active");
    tabCats.classList.remove("active");
  }
}

tabCats.onclick=()=>{
  wrapEl.dataset.view="cats";
  setTabs("cats");
};
tabDiag.onclick=()=>{
  wrapEl.dataset.view="diag";
  setTabs("diag");
};

// === Dummy answer buttons (zatlaľ iba UI) ===
document.getElementById("btnYes").onclick=()=>{
  alert("Áno – napojíme na strom z content.json");
};
document.getElementById("btnNo").onclick=()=>{
  alert("Nie – napojíme na strom z content.json");
};
