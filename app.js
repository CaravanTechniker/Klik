// UI v0.7 – responsive fixes + Poruchy/Kategórie naming + accordion persisted + WhatsApp feedback + contacts updated

const els = {
  wrap: document.getElementById("wrap"),

  cats: document.getElementById("cats"),
  treeCount: document.getElementById("treeCount"),
  catsTitle: document.getElementById("catsTitle"),

  activeTreeName: document.getElementById("activeTreeName"),
  questionText: document.getElementById("questionText"),
  hintText: document.getElementById("hintText"),

  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  backBtn: document.getElementById("backBtn"),
  resetBtn: document.getElementById("resetBtn"),

  langBtn: document.getElementById("langBtn"),
  langMenu: document.getElementById("langMenu"),

  shareBtn: document.getElementById("shareBtn"),
  shareMenu: document.getElementById("shareMenu"),

  feedbackBtn: document.getElementById("feedbackBtn"),
  infoBtn: document.getElementById("infoBtn"),

  infoModal: document.getElementById("infoModal"),
  infoClose: document.getElementById("infoClose"),
  infoTitle: document.getElementById("infoTitle"),
  infoContent: document.getElementById("infoContent"),

  fbModal: document.getElementById("fbModal"),
  fbClose: document.getElementById("fbClose"),
  fbTitle: document.getElementById("fbTitle"),
  fbText: document.getElementById("fbText"),
  fbCopy: document.getElementById("fbCopy"),
  fbWhatsApp: document.getElementById("fbWhatsApp"),
  fbMail: document.getElementById("fbMail"),

  tabCats: document.getElementById("tabCats"),
  tabDiag: document.getElementById("tabDiag"),

  logoImg: document.getElementById("logoImg"),
  logoPH: document.getElementById("logoPH"),

  netDot: document.getElementById("netDot"),
  netText: document.getElementById("netText"),
  verText: document.getElementById("verText"),
  statusRight: document.getElementById("statusRight"),
};

let lang = "sk";
let activeTreeId = null;

// Persist accordion open/close across refresh
const LS_OPEN_CATS = "ui_open_categories_v07";

// Updated contacts (point 1 + 2)
const CONTACT = {
  email: "caravantechnikerammain@gmail.com",
  phone: "+49 151 638 12 554",
  // WhatsApp send-to number: must be digits only (no spaces, no +)
  waDigits: "4915163812554"
};

// Demo data (later replace with content.json)
const trees = [
  { id:"truma_gas", cat:"Kúrenie", name:{sk:"Truma Gasheizung", de:"Truma Gasheizung"}, tag:{sk:"Demo", de:"Demo"} },
  { id:"truma_diesel", cat:"Kúrenie", name:{sk:"Truma Dieselheizung", de:"Truma Dieselheizung"}, tag:{sk:"Demo", de:"Demo"} },
  { id:"elektrik_12v", cat:"Elektrika", name:{sk:"12V Elektrika", de:"12V Elektrik"}, tag:{sk:"Demo", de:"Demo"} },
  { id:"wasser", cat:"Voda", name:{sk:"Wasser / Undichtigkeit", de:"Wasser / Undichtigkeit"}, tag:{sk:"Demo", de:"Demo"} },
];

const ui = {
  sk:{
    catsTitle:"Kategórie",
    tabCats:"Poruchy",
    tabDiag:"Diagnostika",
    selected:"Vybraný strom",
    pick:"Vyber kategóriu a poruchu.",
    hint:"Potom sa tu zobrazí prvá otázka a tlačidlá.",
    yes:"Áno",
    no:"Nie",
    back:"Späť",
    reset:"Reset",
    ready:"Ready",
    feedback:"Pripomienky",
    infoTitle:"Informácie a kontakt",
    share:"Zdieľať",
    copied:"Skopírované",
    manual:"Skopíruj ručne:",
    fbTitle:"Pripomienky k aplikácii",
    fbPlaceholder:"Napíš pripomienku...",
    fbCopy:"Kopírovať",
    fbMail:"Poslať e-mailom",
    fbWA:"WhatsApp",
    infoHtml:(c)=>`
      <div style="line-height:1.55; font-weight:900">
        <div style="font-size:14px; font-weight:950; margin-bottom:10px;">CaravanTechniker am Main</div>
        <div><b>E-mail:</b> ${escapeHtml(c.email)}</div>
        <div><b>Mobil:</b> ${escapeHtml(c.phone)}</div>
        <div style="margin-top:10px;">
          <b>WhatsApp:</b> iba správa (telefonáty kvôli vyťaženiu nedvíham).<br>
          Odpoviem hneď ako budem mať voľno.
        </div>
      </div>
    `,
    shareTxt:"TXT (kopírovať)",
    sharePdf:"PDF (tlač / uložiť)",
    catCount:(n)=>`${n} ks`,
  },
  de:{
    catsTitle:"Kategorien",
    tabCats:"Störungen",
    tabDiag:"Diagnose",
    selected:"Ausgewählter Baum",
    pick:"Kategorie und Störung auswählen.",
    hint:"Danach erscheinen hier die erste Frage und Buttons.",
    yes:"Ja",
    no:"Nein",
    back:"Zurück",
    reset:"Reset",
    ready:"Bereit",
    feedback:"Feedback",
    infoTitle:"Info & Kontakt",
    share:"Teilen",
    copied:"Kopiert",
    manual:"Manuell kopieren:",
    fbTitle:"Feedback zur App",
    fbPlaceholder:"Schreibe Feedback...",
    fbCopy:"Kopieren",
    fbMail:"Per E-Mail senden",
    fbWA:"WhatsApp",
    infoHtml:(c)=>`
      <div style="line-height:1.55; font-weight:900">
        <div style="font-size:14px; font-weight:950; margin-bottom:10px;">CaravanTechniker am Main</div>
        <div><b>E-Mail:</b> ${escapeHtml(c.email)}</div>
        <div><b>Mobil:</b> ${escapeHtml(c.phone)}</div>
        <div style="margin-top:10px;">
          <b>WhatsApp:</b> nur Nachricht (Anrufe nehme ich wegen Auslastung nicht an).<br>
          Ich antworte sobald ich frei bin.
        </div>
      </div>
    `,
    shareTxt:"TXT (kopieren)",
    sharePdf:"PDF (drucken / speichern)",
    catCount:(n)=>`${n} Stk`,
  }
};

function applyLang() {
  els.langBtn.textContent = (lang === "sk" ? "Jazyk ▾" : "Sprache ▾");
  els.feedbackBtn.textContent = ui[lang].feedback;
  els.shareBtn.textContent = ui[lang].share + " ▾";

  els.tabCats.textContent = ui[lang].tabCats;
  els.tabDiag.textContent = ui[lang].tabDiag;

  els.catsTitle.textContent = ui[lang].catsTitle;

  // Share menu
  els.shareMenu.querySelector('[data-share="txt"]').textContent = ui[lang].shareTxt;
  els.shareMenu.querySelector('[data-share="pdf"]').textContent = ui[lang].sharePdf;

  // Lang menu active
  [...els.langMenu.querySelectorAll("button[data-lang]")].forEach(b=>{
    b.classList.toggle("active", b.dataset.lang === lang);
  });

  // Modals
  els.infoTitle.textContent = ui[lang].infoTitle;
  els.fbTitle.textContent = ui[lang].fbTitle;
  els.fbText.placeholder = ui[lang].fbPlaceholder;
  els.fbCopy.textContent = ui[lang].fbCopy;
  els.fbMail.textContent = ui[lang].fbMail;
  els.fbWhatsApp.textContent = ui[lang].fbWA;

  // Main area
  els.questionText.textContent = activeTreeId ? els.questionText.textContent : ui[lang].pick;
  els.hintText.textContent = ui[lang].hint;
  els.yesBtn.textContent = ui[lang].yes;
  els.noBtn.textContent = ui[lang].no;
  els.backBtn.textContent = ui[lang].back;
  els.resetBtn.textContent = ui[lang].reset;

  renderCats();
}

function getOpenCats(){
  try{
    const raw = localStorage.getItem(LS_OPEN_CATS);
    if(!raw) return new Set(); // default: all closed (point 5)
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) return new Set(arr);
    return new Set();
  }catch{
    return new Set();
  }
}

function setOpenCats(set){
  try{
    localStorage.setItem(LS_OPEN_CATS, JSON.stringify([...set]));
  }catch{}
}

function renderCats() {
  const cats = groupByCat(trees);
  els.cats.innerHTML = "";

  const openSet = getOpenCats();

  let total = 0;
  for (const [catName, items] of Object.entries(cats)) {
    total += items.length;

    const cat = document.createElement("div");
    cat.className = "cat" + (openSet.has(catName) ? " open" : ""); // persisted open state

    const head = document.createElement("button");
    head.className = "catHead";
    head.type = "button";
    head.innerHTML = `
      <div>
        <div style="font-weight:950">${escapeHtml(catName)}</div>
        <div class="sub">${escapeHtml(ui[lang].catCount(items.length))}</div>
      </div>
      <div style="font-weight:950">${openSet.has(catName) ? "▾" : "▸"}</div>
    `;

    head.addEventListener("click", () => {
      const nowOpen = !cat.classList.contains("open");
      cat.classList.toggle("open", nowOpen);
      head.querySelector("div:last-child").textContent = nowOpen ? "▾" : "▸";

      if(nowOpen) openSet.add(catName);
      else openSet.delete(catName);
      setOpenCats(openSet);
    });

    const body = document.createElement("div");
    body.className = "catBody";

    for (const tr of items) {
      const row = document.createElement("div");
      row.className = "treeItem" + (tr.id === activeTreeId ? " active" : "");
      row.innerHTML = `
        <div>
          <div class="name">${escapeHtml(tr.name[lang])}</div>
          <div class="tag">${escapeHtml(tr.tag[lang])}</div>
        </div>
        <div class="chev">›</div>
      `;
      row.addEventListener("click", () => {
        selectTree(tr.id);
        // open selected category automatically (useful)
        openSet.add(catName);
        setOpenCats(openSet);
        // on mobile switch to Diagnose view
        if (window.matchMedia("(max-width: 980px)").matches) setView("diag");
      });
      body.appendChild(row);
    }

    cat.appendChild(head);
    cat.appendChild(body);
    els.cats.appendChild(cat);
  }

  els.treeCount.textContent = String(total);
}

function selectTree(id){
  activeTreeId = id;
  const tr = trees.find(x=>x.id===id);
  els.activeTreeName.textContent = tr ? tr.name[lang] : "–";
  els.questionText.textContent = (lang === "sk")
    ? "Pripravené. Ďalší krok: napojíme prvú otázku zo stromu."
    : "Bereit. Nächster Schritt: erste Frage aus dem Baum anschließen.";
  els.hintText.textContent = (lang === "sk")
    ? "UI je hotové. Teraz napojíme content.json a reálne stromy."
    : "UI ist fertig. Jetzt verbinden wir content.json und echte Bäume.";
  renderCats();
}

function wireDropdown(btn, menu){
  btn.addEventListener("click", () => menu.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) menu.classList.remove("open");
  });
}

function wireLang(){
  wireDropdown(els.langBtn, els.langMenu);
  els.langMenu.addEventListener("click", (e)=>{
    const b = e.target.closest("button[data-lang]");
    if(!b) return;
    lang = b.dataset.lang;
    els.langMenu.classList.remove("open");
    applyLang();
  });
}

function openModal(m){ m.classList.add("open"); }
function closeModal(m){ m.classList.remove("open"); }

function wireInfo(){
  els.infoBtn.addEventListener("click", ()=>{
    els.infoContent.innerHTML = ui[lang].infoHtml(CONTACT);
    openModal(els.infoModal);
  });
  els.infoClose.addEventListener("click", ()=> closeModal(els.infoModal));
  els.infoModal.addEventListener("click", (e)=>{ if(e.target===els.infoModal) closeModal(els.infoModal); });
}

function wireFeedback(){
  els.feedbackBtn.addEventListener("click", ()=> openModal(els.fbModal));
  els.fbClose.addEventListener("click", ()=> closeModal(els.fbModal));
  els.fbModal.addEventListener("click", (e)=>{ if(e.target===els.fbModal) closeModal(els.fbModal); });

  els.fbCopy.addEventListener("click", async ()=>{
    const text = els.fbText.value.trim();
    if(!text){ toast(lang==="sk" ? "Prázdne" : "Leer"); return; }
    try{
      await navigator.clipboard.writeText(text);
      toast(ui[lang].copied);
    }catch{
      toast(ui[lang].manual);
    }
  });

  // WhatsApp (point 7)
  els.fbWhatsApp.addEventListener("click", ()=>{
    const text = els.fbText.value.trim();
    if(!text){ toast(lang==="sk" ? "Prázdne" : "Leer"); return; }
    const msg = encodeURIComponent(`[Wohnmobil Diagnose]\n${text}\n\nURL: ${location.href}`);
    const url = `https://wa.me/${CONTACT.waDigits}?text=${msg}`;
    window.open(url, "_blank");
  });

  els.fbMail.addEventListener("click", ()=>{
    const text = encodeURIComponent(els.fbText.value.trim());
    const subj = encodeURIComponent(lang==="sk"
      ? "Pripomienky k aplikácii Wohnmobil Diagnose"
      : "Feedback zur App Wohnmobil Diagnose"
    );
    const mail = `mailto:${CONTACT.email}?subject=${subj}&body=${text}`;
    location.href = mail;
  });
}

function wireShare(){
  wireDropdown(els.shareBtn, els.shareMenu);

  els.shareMenu.addEventListener("click", async (e)=>{
    const b = e.target.closest("button[data-share]");
    if(!b) return;
    els.shareMenu.classList.remove("open");

    if(b.dataset.share === "txt"){
      const txt = buildShareText();
      try{
        await navigator.clipboard.writeText(txt);
        toast(ui[lang].copied);
      }catch{
        toast(ui[lang].manual);
      }
    }

    if(b.dataset.share === "pdf"){
      openPrintView();
    }
  });
}

function buildShareText(){
  const tr = trees.find(x=>x.id===activeTreeId);
  const treeName = tr ? tr.name[lang] : (lang==="sk" ? "bez výberu" : "nicht gewählt");
  return [
    "Wohnmobil Diagnose",
    "CaravanTechniker am Main",
    "",
    `${ui[lang].selected}: ${treeName}`,
    "",
    `URL: ${location.href}`
  ].join("\n");
}

function openPrintView(){
  const txt = buildShareText().replaceAll("<","&lt;").replaceAll(">","&gt;");
  const w = window.open("", "_blank");
  if(!w){ toast(lang==="sk" ? "Popup blokovaný" : "Popup blockiert"); return; }
  w.document.write(`
    <html><head><title>Export PDF</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px;}
      pre{white-space:pre-wrap; font-size:14px; line-height:1.4; font-weight:900;}
      .hint{margin-top:14px; color:#24324f; font-weight:900;}
    </style>
    </head><body>
      <h2>Wohnmobil Diagnose</h2>
      <pre>${txt}</pre>
      <div class="hint">${lang==="sk" ? "Menu → Tlačiť → Uložiť ako PDF" : "Menü → Drucken → Als PDF speichern"}</div>
      <script>window.onload=()=>{setTimeout(()=>window.print(), 200);}</script>
    </body></html>
  `);
  w.document.close();
}

function wireButtons(){
  els.yesBtn.addEventListener("click", ()=> toast(lang==="sk" ? "Áno (UI)" : "Ja (UI)"));
  els.noBtn.addEventListener("click", ()=> toast(lang==="sk" ? "Nie (UI)" : "Nein (UI)"));
  els.backBtn.addEventListener("click", ()=> toast(lang==="sk" ? "Späť (UI)" : "Zurück (UI)"));

  els.resetBtn.addEventListener("click", ()=>{
    activeTreeId = null;
    els.activeTreeName.textContent = "–";
    els.questionText.textContent = ui[lang].pick;
    els.hintText.textContent = ui[lang].hint;
    toast(ui[lang].reset);
    renderCats();
    if (window.matchMedia("(max-width: 980px)").matches) setView("cats");
  });
}

function setView(v){
  els.wrap.dataset.view = v;
  els.tabCats.classList.toggle("active", v==="cats");
  els.tabDiag.classList.toggle("active", v==="diag");
}

function wireTabs(){
  els.tabCats.addEventListener("click", ()=> setView("cats"));
  els.tabDiag.addEventListener("click", ()=> setView("diag"));
}

function setNetworkStatus(){
  const update = () => {
    const online = navigator.onLine;
    els.netDot.classList.toggle("on", online);
    els.netText.textContent = online ? "Online" : "Offline";
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

function toast(msg){
  els.statusRight.textContent = msg;
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> els.statusRight.textContent = ui[lang].ready, 1400);
}

function groupByCat(list){
  const out = {};
  for (const t of list){
    const c = t.cat || (lang==="sk" ? "Iné" : "Andere");
    if(!out[c]) out[c] = [];
    out[c].push(t);
  }
  return out;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init(){
  // default view on mobile -> cats (Poruchy)
  setView(window.matchMedia("(max-width: 980px)").matches ? "cats" : "cats");

  wireLang();
  wireShare();
  wireInfo();
  wireFeedback();
  wireButtons();
  wireTabs();
  setNetworkStatus();
  renderCats();
  applyLang();

  // Logo placeholder: neskôr zavoláš setLogo(url)
  // setLogo("https://.../womo.jpg");
}

function setLogo(url){
  els.logoImg.src = url;
  els.logoImg.style.display = "block";
  els.logoPH.style.display = "none";
}

init();
