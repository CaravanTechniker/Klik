// Caravan TaM - offline PWA decision trees (SK/DE)
// Data: in-memory JSON; later you can load external JSON files.

const VERSION = "0.1.3";

const i18n = {
  sk: {
    faults: "Poruchy",
    hint: "Vyber poruchu alebo hľadaj. Funguje aj offline.",
    searchPh: "Hľadať (trittstufe, wasserpumpe, 12V...)",
    diag: "Diagnostika",
    empty: "Vyber poruchu vľavo. Potom klikaj ÁNO / NIE.",
    path: "Cesta",
    proto: "Protokol (detail)",
    copy: "Kopírovať",
    cleared: "Vymazané.",
    clearPath: "Vymazať cestu",
    install: "Inštalovať",
    reset: "Reset",
    yes: "ÁNO",
    no: "NIE",
    next: "Ďalej",
    done: "Hotovo",
    cause: "Pravdepodobná príčina",
    action: "Akcia",
    note: "Poznámka",
    timestamp: "Čas",
    language: "Jazyk",
    fault: "Porucha",
    steps: "Kroky",
    result: "Výsledok",
    safety: "Bezpečnosť",
    offline: "offline",
    back: "Späť",
    font: "Písmo",
    all: "Všetko",

  }},
  de: {
    faults: "Störungen",
    hint: "Wähle eine Störung oder suche. Funktioniert auch offline.",
    searchPh: "Suchen (Trittstufe, Wasserpumpe, 12V...)",
    diag: "Diagnose",
    empty: "Wähle links eine Störung. Dann JA / NEIN klicken.",
    path: "Pfad",
    proto: "Protokoll (detailliert)",
    copy: "Kopieren",
    cleared: "Gelöscht.",
    clearPath: "Pfad löschen",
    install: "Installieren",
    reset: "Reset",
    yes: "JA",
    no: "NEIN",
    next: "Weiter",
    done: "Fertig",
    cause: "Wahrscheinliche Ursache",
    action: "Maßnahme",
    note: "Hinweis",
    timestamp: "Zeit",
    language: "Sprache",
    fault: "Störung",
    steps: "Schritte",
    result: "Ergebnis",
    safety: "Sicherheit",
    offline: "offline",
  }
};

let LANG = localStorage.getItem("lang") || "sk";

function t(key){ return (i18n[LANG] && i18n[LANG][key]) || key; }
function nowIso(){ return new Date().toISOString(); }
function fmtLocal(dt){
  try { return new Date(dt).toLocaleString(undefined, {hour12:false}); } catch { return dt; }
}

let TREES = [
  {
    id:"trittstufe_no_move",
    title:{sk:"Trittstufe nejde von / do", de:"Trittstufe fährt nicht aus / ein"},
    subtitle:{sk:"Schod nereaguje, ide len jedným smerom alebo sa zasekáva.", de:"Stufe reagiert nicht, fährt nur in eine Richtung oder klemmt."},
    tags:["trittstufe","step","thule","project2000","12V"],
    start:"q1",
    nodes:{
      q1:{type:"question", text:{sk:"Je palubné napätie ≥ 12,2 V?", de:"Ist die Bordspannung ≥ 12,2 V?"}, help:{sk:"Pod 11,8 V často krok/riadenie zlyhá alebo sa blokuje.", de:"Unter 11,8 V versagen Stufe/Steuerung häufig oder sperren."}, yes:"q2", no:"a1"},
      a1:{type:"action", text:{sk:"Dobíj batériu alebo pripoj externý zdroj. Potom opakuj test napätia.", de:"Batterie laden oder externes Netzteil anschließen. Danach Spannung erneut prüfen."}, next:"q1"},
      q2:{type:"question", text:{sk:"Je zapnutý hlavný vypínač schodu (pri dverách)?", de:"Ist der Hauptschalter der Stufe (bei der Tür) EIN?"}, yes:"q3", no:"a2"},
      a2:{type:"action", text:{sk:"Zapni vypínač schodu. Otestuj výjazd/vjazd.", de:"Schalter einschalten. Aus-/Einfahren testen."}, next:"q3"},
      q3:{type:"question", text:{sk:"Je zapnuté zapaľovanie?", de:"Ist die Zündung eingeschaltet?"}, help:{sk:"Mnohé systémy blokujú výjazd pri zapnutom zapaľovaní.", de:"Viele Systeme sperren das Ausfahren bei eingeschalteter Zündung."}, yes:"a3", no:"q4"},
      a3:{type:"action", text:{sk:"Vypni zapaľovanie. Skús znovu.", de:"Zündung AUS. Erneut testen."}, next:"q4"},
      q4:{type:"question", text:{sk:"Počuješ klik/motor pri stlačení OUT/IN?", de:"Hörst du Klicken/Motor bei OUT/IN?"}, yes:"q5", no:"q6"},
      q5:{type:"question", text:{sk:"Ide schod len jedným smerom?", de:"Fährt die Stufe nur in eine Richtung?"}, yes:"a5", no:"q7"},
      a5:{type:"action", text:{sk:"Skontroluj koncový spínač pre opačný smer + káble v ohybe. Zmeraj, či sa mení polarita na motorčeku (OUT↔IN).", de:"Endschalter für Gegenrichtung + Kabel im Knick prüfen. Messen, ob Polung am Motor umschaltet (OUT↔IN)."}, next:"q7"},
      q6:{type:"question", text:{sk:"Je 12 V prítomné na konektore motorčeka pri poveli?", de:"Liegt bei Befehl 12 V am Motorkabel an?"}, yes:"q8", no:"a6"},
      a6:{type:"action", text:{sk:"Skontroluj poistku, riadiacu jednotku/relé, dverový kontakt a kostru. Potom znovu test.", de:"Sicherung, Steuergerät/Relais, Türkontakt und Masse prüfen. Danach erneut testen."}, next:"q6"},
      q7:{type:"question", text:{sk:"Je mechanika voľná (bez napájania) – dá sa pohnúť bez extrémnej sily?", de:"Ist die Mechanik (stromlos) frei beweglich – ohne extreme Kraft?"}, yes:"q8", no:"a7"},
      a7:{type:"action", text:{sk:"Vyčisti vodiace lišty (kamienky/blato), skontroluj ohnuté ramená, premaž vhodným mazivom. Potom test.", de:"Führungen reinigen (Steinchen/Schmutz), verbogene Arme prüfen, geeignet schmieren. Danach testen."}, next:"q4"},
      q8:{type:"question", text:{sk:"Má motorček vysoký odber (>10 A) alebo sa výrazne hreje?", de:"Hat der Motor hohen Strom (>10 A) oder wird deutlich heiß?"}, yes:"r1", no:"q9"},
      q9:{type:"question", text:{sk:"Funguje dverový kontakt spoľahlivo (stav sa mení pri otvorení/zatvorení)?", de:"Funktioniert der Türkontakt zuverlässig (Statuswechsel)?"}, yes:"q10", no:"a9"},
      a9:{type:"action", text:{sk:"Otestuj/nahraď dverový kontakt. Premostenie len diagnosticky (krátko).", de:"Türkontakt testen/ersetzen. Überbrücken nur kurz diagnostisch."}, next:"q10"},
      q10:{type:"question", text:{sk:"Dáva riadiaca jednotka výstup na motor pri poveli?", de:"Gibt das Steuergerät Motorausgang bei Befehl?"}, yes:"r2", no:"r3"},
      r1:{type:"result", level:"danger", cause:{sk:"Mechanický odpor / prevodovka/vreteno opotrebované.", de:"Mechanischer Widerstand / Getriebe/Spindel verschlissen."},
          action:{sk:"Odporúčaná výmena motorčeka (s prevodovkou) + kontrola uchytenia a vedenia.", de:"Motor (mit Getriebe) ersetzen + Befestigung und Führungen prüfen."}},
      r2:{type:"result", level:"ok", cause:{sk:"Kabeláž medzi jednotkou a motorom (prerušenie, prechodový odpor) alebo mechanika pod záťažou.", de:"Kabelbaum zwischen Steuergerät und Motor (Unterbrechung/Übergangswiderstand) oder Mechanik unter Last."},
          action:{sk:"Premerať káble pod záťažou, opraviť zväzok, skontrolovať kostru. Potom funkčný test.", de:"Kabel unter Last messen, Kabelbaum reparieren, Masse prüfen. Danach Funktionstest."}},
      r3:{type:"result", level:"danger", cause:{sk:"Riadiaca jednotka / relé nedodáva napätie (korózia, vlhkosť, porucha).", de:"Steuergerät/Relais liefert keine Spannung (Korrosion, Feuchtigkeit, Defekt)."},
          action:{sk:"Reset (odpojenie 1–2 min). Ak bez zmeny: výmena jednotky/relé + kontrola konektorov.", de:"Reset (1–2 Min stromlos). Wenn unverändert: Steuergerät/Relais ersetzen + Stecker prüfen."}}
    }
    back: "Zurück",
    font: "Schrift",
    all: "Alle",

  }},
  {
    id:"wasserpumpe_off",
    title:{sk:"Wasserpumpe OFF / netečie voda", de:"Wasserpumpe AUS / kein Wasser"},
    subtitle:{sk:"Rozlišuje Druckpumpe vs. Tauchpumpe.", de:"Unterscheidet Druckpumpe vs. Tauchpumpe."},
    tags:["wasser","pumpe","druckpumpe","tauchpumpe","12V"],
    start:"q0",
    nodes:{
      q0:{type:"question", text:{sk:"Aký typ pumpy máš?", de:"Welchen Pumpentyp hast du?"}, help:{sk:"Ak je pumpa v nádrži = Tauchpumpe. Ak je mimo nádrže (externá) = Druckpumpe.", de:"Pumpe im Tank = Tauchpumpe. Extern außerhalb = Druckpumpe."},
          options:[
            {label:{sk:"Druckpumpe (externá)", de:"Druckpumpe (extern)"}, next:"a1"},
            {label:{sk:"Tauchpumpe (v nádrži)", de:"Tauchpumpe (im Tank)"}, next:"b1"},
            {label:{sk:"Neviem", de:"Weiß nicht"}, next:"q0h"}
          ]},
      q0h:{type:"action", text:{sk:"Skontroluj: vidíš pumpu mimo nádrže? → Druckpumpe. Je pumpa v nádrži na hadici? → Tauchpumpe.", de:"Prüfe: Pumpe außerhalb des Tanks sichtbar? → Druckpumpe. Pumpe im Tank am Schlauch? → Tauchpumpe."}, next:"q0"},

      // Druckpumpe branch
      a1:{type:"question", text:{sk:"Je palubné napätie ≥ 12,2 V?", de:"Ist die Bordspannung ≥ 12,2 V?"}, yes:"a2", no:"a1x"},
      a1x:{type:"action", text:{sk:"Dobíj batériu/externý zdroj. Potom opakuj test.", de:"Batterie laden/externes Netzteil. Danach erneut prüfen."}, next:"a1"},
      a2:{type:"question", text:{sk:"Je zapnutý hlavný vypínač vody (Pumpenschalter)?", de:"Ist der Hauptschalter Wasser (Pumpenschalter) EIN?"}, yes:"a3", no:"a2x"},
      a2x:{type:"action", text:{sk:"Zapni pumpenschalter. Otestuj kohútik.", de:"Pumpenschalter EIN. Wasserhahn testen."}, next:"a3"},
      a3:{type:"question", text:{sk:"Po otvorení kohútika pumpa beží (zvuk)?", de:"Läuft die Pumpe beim Öffnen des Hahns (Geräusch)?"}, yes:"a4", no:"a5"},
      a4:{type:"question", text:{sk:"Beží pumpa, ale voda netečie?", de:"Pumpe läuft, aber kein Wasser?"}, yes:"ar1", no:"ar2"},
      ar1:{type:"result", level:"danger",
          cause:{sk:"Zavzdušnenie / zanesený filter / problém na nasávaní.", de:"Luft im System / Filter zu / Problem auf der Saugseite."},
          action:{sk:"Odvzdušni: otvor všetky kohútiky postupne, skontroluj filter na pumpe, spätný ventil, nasávaciu hadicu a spojky.", de:"Entlüften: alle Hähne nacheinander öffnen, Filter an der Pumpe prüfen, Rückschlagventil, Saugschlauch und Verbindungen."}},
      ar2:{type:"result", level:"ok",
          cause:{sk:"Riadenie a pumpa reagujú. Problém bol dočasný alebo v jednom odbere.", de:"Steuerung/Pumpe reagieren. Problem war temporär oder an einer Entnahmestelle."},
          action:{sk:"Skontroluj ešte úniky a či pumpa nevypína príliš neskoro (tlak).", de:"Auf Lecks prüfen und ob die Pumpe zu spät abschaltet (Druck)."}},
      a5:{type:"question", text:{sk:"Je na pumpe 12 V pri otvorení kohútika?", de:"Liegt an der Pumpe 12 V an, wenn der Hahn offen ist?"}, yes:"ar3", no:"a6"},
      ar3:{type:"result", level:"danger",
          cause:{sk:"Pumpa/ motor alebo tlakový spínač je chybný.", de:"Pumpe/Motor oder Druckschalter defekt."},
          action:{sk:"Otestuj priamo 12 V na pumpe (krátko). Ak stále nejde: výmena pumpy. Ak ide: chyba v tlakovom spínači/riadení.", de:"Direkt 12 V kurz anlegen. Wenn weiterhin tot: Pumpe ersetzen. Wenn läuft: Druckschalter/Steuerung prüfen."}},
      a6:{type:"question", text:{sk:"Je poistka vody OK (merané, nie len vizuálne)?", de:"Ist die Wassersicherung OK (gemessen, nicht nur optisch)?"}, yes:"a7", no:"a6x"},
      a6x:{type:"action", text:{sk:"Vymeň poistku správnej hodnoty + skontroluj príčinu (skrat, vlhkosť).", de:"Sicherung korrekt ersetzen + Ursache prüfen (Kurzschluss, Feuchtigkeit)."}, next:"a7"},
      a7:{type:"result", level:"danger",
          cause:{sk:"Problém v ovládaní/káblovaní (Pumpenschalter, tlakový spínač, relé, kostra).", de:"Problem in Steuerung/Verkabelung (Schalter, Druckschalter, Relais, Masse)."},
          action:{sk:"Zmerať napätie po krokoch: schalter→riadenie→pumpa, skontrolovať kostru a konektory. Opraviť káble v prechodkách.", de:"Spannung Schritt für Schritt messen: Schalter→Steuerung→Pumpe, Masse/Stecker prüfen. Kabel in Durchführungen reparieren."}},

      // Tauchpumpe branch
      b1:{type:"question", text:{sk:"Je palubné napätie ≥ 12,2 V?", de:"Ist die Bordspannung ≥ 12,2 V?"}, yes:"b2", no:"b1x"},
      b1x:{type:"action", text:{sk:"Dobíj batériu/externý zdroj. Potom opakuj test.", de:"Batterie laden/externes Netzteil. Danach erneut prüfen."}, next:"b1"},
      b2:{type:"question", text:{sk:"Je zapnutý hlavný vypínač vody (Pumpenschalter)?", de:"Ist der Pumpenschalter EIN?"}, yes:"b3", no:"b2x"},
      b2x:{type:"action", text:{sk:"Zapni pumpenschalter. Otestuj kohútik.", de:"Pumpenschalter EIN. Wasserhahn testen."}, next:"b3"},
      b3:{type:"question", text:{sk:"Je systém s mikrospínačmi v batériách (kohútiky)?", de:"Hat das System Mikroschalter in den Armaturen?"}, help:{sk:"Pri Tauchpumpe je to najčastejšie.", de:"Bei Tauchpumpe sehr häufig."},
          options:[
            {label:{sk:"ÁNO (mikrospínače)", de:"JA (Mikroschalter)"}, next:"b4"},
            {label:{sk:"NIE / tlakový systém", de:"NEIN / Drucksystem"}, next:"br4"},
            {label:{sk:"Neviem", de:"Weiß nicht"}, next:"b3h"}
          ]},
      b3h:{type:"action", text:{sk:"Skús: pri otvorení kohútika počuť klik v batérii? Alebo meraj napätie na vodičoch k batérii. Potom vyber vetvu.", de:"Teste: Klick in der Armatur beim Öffnen? Oder Spannung an den Leitungen zur Armatur messen. Dann Zweig wählen."}, next:"b3"},
      b4:{type:"question", text:{sk:"Beží pumpa pri otvorení kohútika?", de:"Läuft die Pumpe beim Öffnen?"}, yes:"b5", no:"b6"},
      b5:{type:"question", text:{sk:"Beží pumpa, ale voda netečie?", de:"Pumpe läuft, aber kein Wasser?"}, yes:"br1", no:"br2"},
      br1:{type:"result", level:"danger",
          cause:{sk:"Zavzdušnenie / nízka hladina / zanesený filter alebo hadica na výstupe.", de:"Luft im System / niedriger Wasserstand / Filter zu oder Schlauch am Ausgang."},
          action:{sk:"Doplň vodu, odvzdušni (všetky kohútiky), vyčisti filter/sací kôš v nádrži, skontroluj hadice.", de:"Wasser auffüllen, entlüften (alle Hähne), Filter/Sieb im Tank reinigen, Schläuche prüfen."}},
      br2:{type:"result", level:"ok",
          cause:{sk:"Pumpa aj mikrospínače reagujú – problém bol dočasný alebo lokálny.", de:"Pumpe und Mikroschalter reagieren – Problem war temporär oder lokal."},
          action:{sk:"Skontroluj ešte, či pumpa nevypína zle a či nie sú úniky.", de:"Prüfe Abschaltverhalten und Lecks."}},
      b6:{type:"question", text:{sk:"Je 12 V prítomné na konektore v nádrži pri otvorení kohútika?", de:"Liegt 12 V am Tank-Stecker an, wenn der Hahn offen ist?"}, yes:"br3", no:"br4"},
      br3:{type:"result", level:"danger",
          cause:{sk:"Ponorná pumpa je chybná (motor).", de:"Tauchpumpe defekt (Motor)."},
          action:{sk:"Výmena ponornej pumpy. Skontroluj aj konektor/oxidáciu, aby sa porucha neopakovala.", de:"Tauchpumpe ersetzen. Stecker/Oxidation prüfen, damit es nicht wiederkommt."}},
      br4:{type:"result", level:"danger",
          cause:{sk:"Mikrospínač v batérii alebo kabeláž/konektory k nádrži (časté prerušenie).", de:"Mikroschalter in der Armatur oder Kabel/Stecker zum Tank (häufiger Bruch)."},
          action:{sk:"Otestuj každý kohútik zvlášť (sprcha býva prvá). Skontroluj zväzok a konektory pri servisnom otvore nádrže.", de:"Jeden Hahn nach dem anderen testen (Dusche oft zuerst). Kabelbaum und Stecker am Servicezugang prüfen."}},
      br4:{type:"result", level:"danger",
          cause:{sk:"Riadenie vody / tlakový spínač / kabeláž (ak nie sú mikrospínače).", de:"Wassersteuerung / Druckschalter / Verkabelung (wenn keine Mikroschalter)."},
          action:{sk:"Skontroluj tlakový spínač/riadenie, poistky, relé a kostru. Meraj napätie po krokoch až k pumpe.", de:"Druckschalter/Steuerung, Sicherungen, Relais und Masse prüfen. Spannung Schritt für Schritt bis zur Pumpe messen."}}
    }
  }
];

const els = {
  langBtn: document.getElementById("langBtn"),
  resetBtn: document.getElementById("resetBtn"),
  fontMinus: document.getElementById("fontMinus"),
  fontPlus: document.getElementById("fontPlus"),
  fontLabel: document.getElementById("fontLabel"),
  tagChips: document.getElementById("tagChips"),
  backBtn: document.getElementById("backBtn"),
  faultsH: document.getElementById("hFaults"),
  hint: document.getElementById("hHint"),
  search: document.getElementById("search"),
  list: document.getElementById("faultList"),
  diagH: document.getElementById("hDiag"),
  diagEmpty: document.getElementById("diagEmpty"),
  diag: document.getElementById("diag"),
  nodeText: document.getElementById("nodeText"),
  nodeHelp: document.getElementById("nodeHelp"),
  answerBtns: document.getElementById("answerBtns"),
  pathH: document.getElementById("hPath"),
  pathList: document.getElementById("pathList"),
  protoH: document.getElementById("hProto"),
  proto: document.getElementById("proto"),
  copyBtn: document.getElementById("copyBtn"),
  clearPathBtn: document.getElementById("clearPathBtn"),
  protoHint: document.getElementById("protoHint"),
  faultTitleBadge: document.getElementById("faultTitleBadge"),
  faultTagsBadge: document.getElementById("faultTagsBadge"),
  installBtn: document.getElementById("installBtn"),
  ver: document.getElementById("ver"),
  offlinePill: document.getElementById("offlinePill")
};

let currentTree = null;
let currentNodeId = null;
let activeTag = ""; // tag filter in list
let path = []; // {nodeId, text, answerLabel, answerValue, timestamp}

// --- FONT SIZE (A- / A+) ----------------------
const FS_MIN = 0.8;
const FS_MAX = 1.5;
const FS_STEP = 0.1;

let fontScale = parseFloat(localStorage.getItem("fontScale")) || 1.0;
function applyFontScale(){
  document.documentElement.style.setProperty("--fs", String(fontScale.toFixed(2)));
  localStorage.setItem("fontScale", fontScale.toFixed(2));
}
applyFontScale();

if(els.fontPlus){
  els.fontPlus.addEventListener("click", ()=>{
    fontScale = Math.min(FS_MAX, fontScale + FS_STEP);
    applyFontScale();
  });
}
if(els.fontMinus){
  els.fontMinus.addEventListener("click", ()=>{
    fontScale = Math.max(FS_MIN, fontScale - FS_STEP);
    applyFontScale();
  });
}

function setLang(newLang){
  LANG = newLang;
  localStorage.setItem("lang", LANG);
  els.langBtn.textContent = LANG.toUpperCase();
  els.faultsH.textContent = t("faults");
  els.hint.textContent = t("hint");
  els.search.placeholder = t("searchPh");
  els.diagH.textContent = t("diag");
  els.diagEmpty.textContent = t("empty");
  els.pathH.textContent = t("path");
  els.protoH.textContent = t("proto");
  els.copyBtn.textContent = t("copy");
  els.clearPathBtn.textContent = t("clearPath");
  els.resetBtn.textContent = t("reset");
  if(els.fontLabel) els.fontLabel.textContent = t("font");
  if(els.backBtn) els.backBtn.textContent = t("back");
  els.installBtn.textContent = t("install");
  renderTagChips();
  renderFaultList();
  renderNode();
  updateProtocol();
  updateBackBtn();
}

function textByLang(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  return obj[LANG] || obj.sk || obj.de || "";
}


function getAllTags(){
  const s = new Set();
  (TREES||[]).forEach(t=> (t.tags||[]).forEach(tag=>s.add(tag)));
  return Array.from(s).sort((a,b)=>a.localeCompare(b));
}

function renderTagChips(){
  if(!els.tagChips) return;
  els.tagChips.innerHTML = "";

  const chips = [
    {id:"", label:t("all")}
  ].concat(getAllTags().map(tag=>({id:tag, label:tag})));

  chips.forEach(c=>{
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (activeTag===c.id ? " active" : "");
    b.textContent = c.label;
    b.addEventListener("click", ()=>{
      activeTag = (activeTag===c.id) ? "" : c.id; // toggle
      renderTagChips();
      renderFaultList();
    });
    els.tagChips.appendChild(b);
  });
}
function renderFaultList(){
  const q = (els.search.value || "").trim().toLowerCase();
  els.list.innerHTML = "";
  TREES
    .filter(tree => {
      if(activeTag && !(tree.tags||[]).includes(activeTag)) return false;
      if(!q) return true;
      const hay = (textByLang(tree.title)+" "+textByLang(tree.subtitle)+" "+tree.tags.join(" ")).toLowerCase();
      return hay.includes(q);
    })
    .forEach(tree => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<div class="t">${escapeHtml(textByLang(tree.title))}</div>
                       <div class="s">${escapeHtml(textByLang(tree.subtitle))}</div>`;
      div.addEventListener("click", ()=>selectTree(tree.id));
      els.list.appendChild(div);
    });
}

function selectTree(id){
  currentTree = TREES.find(t=>t.id===id) || null;
  currentNodeId = currentTree ? currentTree.start : null;
  path = [];
  persistSession();
  els.diagEmpty.style.display = currentTree ? "none" : "block";
  els.diag.style.display = currentTree ? "block" : "none";
  renderNode();
  updateProtocol();
  updateBackBtn();
}

function renderNode(){
  if(!currentTree || !currentNodeId){
    return;
  }
  const node = currentTree.nodes[currentNodeId];
  if(!node){
    els.nodeText.textContent = "Node not found: "+currentNodeId;
    return;
  }

  els.faultTitleBadge.textContent = textByLang(currentTree.title);
  els.faultTagsBadge.textContent = currentTree.tags.slice(0,3).map(x=>"#"+x).join(" ");

  els.nodeText.textContent = textByLang(node.text);
  const help = textByLang(node.help);
  if(help){
    els.nodeHelp.style.display = "block";
    els.nodeHelp.textContent = help;
  } else {
    els.nodeHelp.style.display = "none";
    els.nodeHelp.textContent = "";
  }

  // buttons
  els.answerBtns.innerHTML = "";

  if(node.type === "question"){
    if(node.options && Array.isArray(node.options)){
      node.options.forEach(opt=>{
        const b = document.createElement("button");
        b.className = "btn primary";
        b.textContent = textByLang(opt.label);
        b.addEventListener("click", ()=>advance(opt.next, textByLang(opt.label), "option"));
        els.answerBtns.appendChild(b);
      });
    } else {
      const yes = document.createElement("button");
      yes.className = "btn ok";
      yes.textContent = t("yes");
      yes.addEventListener("click", ()=>advance(node.yes, t("yes"), "yes"));
      const no = document.createElement("button");
      no.className = "btn danger";
      no.textContent = t("no");
      no.addEventListener("click", ()=>advance(node.no, t("no"), "no"));
      els.answerBtns.appendChild(yes);
      els.answerBtns.appendChild(no);
    }
  } else if(node.type === "action"){
    const b = document.createElement("button");
    b.className = "btn primary";
    b.textContent = t("next");
    b.addEventListener("click", ()=>advance(node.next, t("next"), "next"));
    els.answerBtns.appendChild(b);
  } else if(node.type === "result"){
    const b = document.createElement("button");
    b.className = "btn primary";
    b.textContent = t("done");
    b.addEventListener("click", ()=>{/* keep result */});
    els.answerBtns.appendChild(b);

    // show result details inline
    const details = [];
    if(node.cause) details.push(`${t("cause")}: ${textByLang(node.cause)}`);
    if(node.action) details.push(`${t("action")}: ${textByLang(node.action)}`);
    els.nodeHelp.style.display = "block";
    els.nodeHelp.textContent = details.join("\n\n");
  }

  renderPath();
  updateBackBtn();
}

function advance(nextId, answerLabel, answerValue){
  if(!currentTree) return;
  const node = currentTree.nodes[currentNodeId];
  path.push({
    nodeId: currentNodeId,
    nodeType: node.type,
    text: textByLang(node.text),
    answerLabel,
    answerValue,
    at: nowIso()
  });
  currentNodeId = nextId;
  persistSession();
  renderNode();
  updateProtocol();
}

function updateBackBtn(){
  if(!els.backBtn) return;
  els.backBtn.disabled = !(path && path.length>0);
}

if(els.backBtn){
  els.backBtn.addEventListener("click", ()=>{
    if(!currentTree) return;
    if(!path.length) return;
    const last = path.pop();
    currentNodeId = last.nodeId;
    persistSession();
    renderNode();
    updateProtocol();
    updateBackBtn();
  });
}

function renderPath(){
  els.pathList.innerHTML = "";
  path.forEach(step=>{
    const li = document.createElement("li");
    li.textContent = `${step.text} → ${step.answerLabel}`;
    els.pathList.appendChild(li);
  });
}

function updateProtocol(){
  if(!currentTree){
    els.proto.value = "";
    return;
  }
  const node = currentTree.nodes[currentNodeId];
  const lines = [];
  lines.push(`${t("timestamp")}: ${fmtLocal(new Date())}`);
  lines.push(`${t("language")}: ${LANG.toUpperCase()}`);
  lines.push(`${t("fault")}: ${textByLang(currentTree.title)}`);
  lines.push(`Tags: ${currentTree.tags.join(", ")}`);
  lines.push("");
  lines.push(`${t("steps")}:`);
  if(path.length === 0){
    lines.push("- (zatiaľ nič)");
  } else {
    path.forEach((s, idx)=>{
      lines.push(`${idx+1}. ${s.text}`);
      lines.push(`   → ${s.answerLabel}`);
    });
  }
  lines.push("");
  lines.push(`${t("result")}:`);
  if(node){
    if(node.type === "result"){
      if(node.cause) lines.push(`- ${t("cause")}: ${textByLang(node.cause)}`);
      if(node.action) lines.push(`- ${t("action")}: ${textByLang(node.action)}`);
    } else if(node.type === "action"){
      lines.push(`- ${t("action")}: ${textByLang(node.text)}`);
    } else {
      lines.push(`- Aktuálny krok: ${textByLang(node.text)}`);
    }
  }
  lines.push("");
  lines.push(`${t("safety")}:`);
  lines.push(`- 12V merania: meraj aj pod záťažou, skontroluj kostru a poistky meraním.`);
  lines.push(`- Plyn: G607 je kontrola, nie inštalácia. 230V práce nerob bez oprávnenia.`);
  els.proto.value = lines.join("\n");

  els.protoHint.textContent = (LANG==="sk")
    ? "Tip: Kopírovať a vložiť do správy zákazníkovi / do protokolu."
    : "Tipp: Kopieren und in Kunden-Nachricht / Protokoll einfügen.";
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]||c));
}

// persistence
function persistSession(){
  const payload = { LANG, currentTreeId: currentTree?.id || null, currentNodeId, path };
  localStorage.setItem("session", JSON.stringify(payload));
}
function restoreSession(){
  try{
    const raw = localStorage.getItem("session");
    if(!raw) return;
    const s = JSON.parse(raw);
    if(s.LANG) LANG = s.LANG;
    if(s.currentTreeId){
      const tree = TREES.find(t=>t.id===s.currentTreeId);
      if(tree){
        currentTree = tree;
        currentNodeId = s.currentNodeId || tree.start;
        path = Array.isArray(s.path) ? s.path : [];
        els.diagEmpty.style.display = "none";
        els.diag.style.display = "block";
      }
    }
  }catch{}
}

// install prompt
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.style.display = "inline-block";
});
els.installBtn.addEventListener("click", async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.style.display = "none";
});

// buttons
els.langBtn.addEventListener("click", ()=>{
  setLang(LANG === "sk" ? "de" : "sk");
});
els.resetBtn.addEventListener("click", ()=>{
  localStorage.removeItem("session");
  currentTree = null;
  currentNodeId = null;
  path = [];
  els.diagEmpty.style.display = "block";
  els.diag.style.display = "none";
  updateProtocol();
  updateBackBtn();
});
els.copyBtn.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(els.proto.value);
    els.copyBtn.textContent = (LANG==="sk") ? "Skopírované" : "Kopiert";
    setTimeout(()=>els.copyBtn.textContent = t("copy"), 900);
  }catch{
    // fallback
    els.proto.select();
    document.execCommand("copy");
  }
});
els.clearPathBtn.addEventListener("click", ()=>{
  path = [];
  persistSession();
  renderPath();
  updateProtocol();
});

// search
els.search.addEventListener("input", renderFaultList);

// offline indicator
function updateOffline(){
  const off = !navigator.onLine;
  els.offlinePill.textContent = `${t("offline")}: ${off ? "YES" : "NO"}`;
}
window.addEventListener("online", updateOffline);
window.addEventListener("offline", updateOffline);

// init
(async ()=>{
  els.ver.textContent = "v"+VERSION;

  // load external trees if content.json exists (preferred for easy updates)
  try{
    const res = await fetch("./content.json?ts=" + Date.now(), {cache:"no-store"});
    if(res.ok){
      const data = await res.json();
      if(Array.isArray(data) && data.length){
        TREES = data;
      }
    }
  }catch{}

  // local admin overrides (device only)
  try{
    const local = localStorage.getItem("tam_custom_trees");
    if(local){
      const data = JSON.parse(local);
      if(Array.isArray(data) && data.length){ TREES = data; }
    }
  }catch{}

  restoreSession();
  setLang(LANG);
  renderTagChips();
  renderFaultList();
  renderNode();
  updateProtocol();
  updateOffline();
})();


// --- ADMIN (hidden) -------------------------------------------------
(function(){
  const pwaPill = document.getElementById("pwaPill");
  if(!pwaPill) return;

  let tapCount = 0;
  let tapTimer = null;
  function resetTaps(){ tapCount = 0; if(tapTimer){ clearTimeout(tapTimer); tapTimer=null; } }

  function slugify(s){
    return (s||"").toLowerCase()
      .replace(/[áàäâ]/g,"a").replace(/[č]/g,"c").replace(/[ď]/g,"d").replace(/[éèëê]/g,"e")
      .replace(/[íìïî]/g,"i").replace(/[ľĺ]/g,"l").replace(/[ň]/g,"n").replace(/[óòöô]/g,"o")
      .replace(/[ŕ]/g,"r").replace(/[š]/g,"s").replace(/[ť]/g,"t").replace(/[úùüû]/g,"u")
      .replace(/[ý]/g,"y").replace(/[ž]/g,"z")
      .replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,40);
  }

  function downloadJson(filename, obj){
    const blob = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function ensureOverlay(){
    let ov = document.getElementById("adminOverlay");
    if(ov) return ov;

    ov = document.createElement("div");
    ov.id = "adminOverlay";
    ov.style.position = "fixed";
    ov.style.inset = "0";
    ov.style.background = "rgba(0,0,0,.7)";
    ov.style.zIndex = "9999";
    ov.style.display = "flex";
    ov.style.alignItems = "center";
    ov.style.justifyContent = "center";
    ov.style.padding = "16px";

    const card = document.createElement("div");
    card.style.width = "min(980px, 100%)";
    card.style.maxHeight = "90vh";
    card.style.overflow = "auto";
    card.style.background = "#0b0c10";
    card.style.border = "1px solid rgba(255,255,255,.12)";
    card.style.borderRadius = "18px";
    card.style.padding = "14px";

    const h = document.createElement("div");
    h.style.display="flex";
    h.style.gap="10px";
    h.style.alignItems="center";
    h.style.justifyContent="space-between";
    h.innerHTML = `<div style="font-weight:700;font-size:16px">ADMIN – Stromy</div>
      <button id="adminClose" style="background:#111;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:8px 12px">Zavrieť</button>`;
    card.appendChild(h);

    const top = document.createElement("div");
    top.style.display="flex";
    top.style.gap="8px";
    top.style.flexWrap="wrap";
    top.style.margin="12px 0";

    top.innerHTML = `
      <select id="admTreeSel" style="flex:1;min-width:220px;background:#111;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px"></select>
      <button id="admNewTree" style="background:#1b2a34;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px 12px">Nový strom</button>
      <button id="admDelTree" style="background:#3a1b1b;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px 12px">Zmazať</button>
      <button id="admExport" style="background:#0f2a1c;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px 12px">Export content.json</button>
      <button id="admImportBtn" style="background:#1b1f3a;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px 12px">Import content.json</button>
      <input id="admImportFile" type="file" accept="application/json" style="display:none" />
      <button id="admSave" style="background:#2a2a0f;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px 12px">Uložiť zmeny</button>
    `;
    card.appendChild(top);

    const meta = document.createElement("div");
    meta.style.display="grid";
    meta.style.gridTemplateColumns="1fr 1fr";
    meta.style.gap="10px";
    meta.innerHTML = `
      <div>
        <div style="opacity:.8;font-size:12px;margin:2px 0">Názov (SK)</div>
        <input id="admTitleSk" style="width:100%;background:#111;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px" />
      </div>
      <div>
        <div style="opacity:.8;font-size:12px;margin:2px 0">Podnadpis (SK)</div>
        <input id="admSubSk" style="width:100%;background:#111;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px" />
      </div>
      <div style="grid-column:1 / -1">
        <div style="opacity:.8;font-size:12px;margin:2px 0">Tagy (oddelené čiarkou)</div>
        <input id="admTags" style="width:100%;background:#111;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:10px" />
      </div>
    `;
    card.appendChild(meta);

    const nodeHdr = document.createElement("div");
    nodeHdr.style.display="flex";
    nodeHdr.style.gap="8px";
    nodeHdr.style.alignItems="center";
    nodeHdr.style.margin="12px 0 6px";
    nodeHdr.innerHTML = `
      <div style="font-weight:700">Uzly</div>
      <button id="admAddQ" style="margin-left:auto;background:#1b2a34;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:8px 10px">+ Otázka</button>
      <button id="admAddA" style="background:#1b2a34;border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:12px;padding:8px 10px">+ Akcia</button>
    `;
    card.appendChild(nodeHdr);

    const nodes = document.createElement("div");
    nodes.id = "admNodes";
    nodes.style.display="flex";
    nodes.style.flexDirection="column";
    nodes.style.gap="10px";
    card.appendChild(nodes);

    const hint = document.createElement("div");
    hint.style.marginTop="12px";
    hint.style.opacity=".8";
    hint.style.fontSize="12px";
    hint.textContent = "Tip: Pri otázke nastav YES/NO na ďalší uzol. Pri akcii nastav NEXT. Po uložení sa aktualizuje zoznam porúch.";
    card.appendChild(hint);

    ov.appendChild(card);
    document.body.appendChild(ov);

    // close
    card.querySelector("#adminClose").addEventListener("click", ()=>{ ov.remove(); });

    return ov;
  }

  function getTreeById(id){ return TREES.find(t=>t.id===id); }

  function rebuildTreeSelect(selId){
    const sel = document.getElementById(selId);
    if(!sel) return;
    sel.innerHTML = "";
    TREES.forEach(t=>{
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = (t.title && (t.title[L] || t.title.sk || t.id)) || t.id;
      sel.appendChild(opt);
    });
  }

  function renderNodeRows(tree){
    const wrap = document.getElementById("admNodes");
    wrap.innerHTML = "";

    const nodeIds = Object.keys(tree.nodes || {});
    if(nodeIds.length===0){
      const d=document.createElement("div");
      d.style.opacity=".7";
      d.textContent="Strom nemá uzly. Pridaj otázku alebo akciu.";
      wrap.appendChild(d);
      return;
    }

    function mkSel(options, val){
      const s=document.createElement("select");
      s.style.background="#111"; s.style.border="1px solid rgba(255,255,255,.18)";
      s.style.color="#fff"; s.style.borderRadius="10px"; s.style.padding="8px";
      const empty=document.createElement("option"); empty.value=""; empty.textContent="—";
      s.appendChild(empty);
      options.forEach(o=>{
        const op=document.createElement("option"); op.value=o; op.textContent=o;
        if(o===val) op.selected=true;
        s.appendChild(op);
      });
      return s;
    }

    nodeIds.forEach(id=>{
      const n = tree.nodes[id];

      const row=document.createElement("div");
      row.style.border="1px solid rgba(255,255,255,.12)";
      row.style.borderRadius="14px";
      row.style.padding="10px";
      row.style.background="#0f1116";

      const top=document.createElement("div");
      top.style.display="flex";
      top.style.gap="8px";
      top.style.alignItems="center";
      top.innerHTML = `<div style="font-weight:700">ID: ${id}</div>`;
      const del=document.createElement("button");
      del.textContent="Zmazať uzol";
      del.style.marginLeft="auto";
      del.style.background="#3a1b1b";
      del.style.border="1px solid rgba(255,255,255,.18)";
      del.style.color="#fff";
      del.style.borderRadius="12px";
      del.style.padding="8px 10px";
      del.addEventListener("click", ()=>{
        // remove references
        Object.values(tree.nodes).forEach(nn=>{
          if(nn.yes===id) nn.yes="";
          if(nn.no===id) nn.no="";
          if(nn.next===id) nn.next="";
        });
        delete tree.nodes[id];
        if(tree.start===id){
          tree.start = Object.keys(tree.nodes)[0] || "";
        }
        renderNodeRows(tree);
      });
      top.appendChild(del);
      row.appendChild(top);

      const grid=document.createElement("div");
      grid.style.display="grid";
      grid.style.gridTemplateColumns="120px 1fr";
      grid.style.gap="8px";
      grid.style.marginTop="8px";

      // type
      const typeSel=document.createElement("select");
      typeSel.style.background="#111"; typeSel.style.border="1px solid rgba(255,255,255,.18)";
      typeSel.style.color="#fff"; typeSel.style.borderRadius="10px"; typeSel.style.padding="8px";
      ["question","action"].forEach(v=>{
        const op=document.createElement("option"); op.value=v; op.textContent=v;
        if(n.type===v) op.selected=true;
        typeSel.appendChild(op);
      });
      typeSel.addEventListener("change", ()=>{ n.type=typeSel.value; renderNodeRows(tree); });

      grid.appendChild(Object.assign(document.createElement("div"), {textContent:"Typ", style:"opacity:.8;font-size:12px;margin-top:8px"}));
      grid.appendChild(typeSel);

      // sk text
      const sk=document.createElement("textarea");
      sk.value = (n.text && (n.text.sk||"")) || "";
      sk.rows=2;
      sk.style.width="100%"; sk.style.resize="vertical";
      sk.style.background="#111"; sk.style.border="1px solid rgba(255,255,255,.18)";
      sk.style.color="#fff"; sk.style.borderRadius="10px"; sk.style.padding="8px";
      sk.addEventListener("input", ()=>{ n.text = n.text||{}; n.text.sk = sk.value; });
      grid.appendChild(Object.assign(document.createElement("div"), {textContent:"Text SK", style:"opacity:.8;font-size:12px;margin-top:8px"}));
      grid.appendChild(sk);

      // de text optional
      const de=document.createElement("textarea");
      de.value = (n.text && (n.text.de||"")) || "";
      de.rows=2;
      de.style.width="100%"; de.style.resize="vertical";
      de.style.background="#111"; de.style.border="1px solid rgba(255,255,255,.18)";
      de.style.color="#fff"; de.style.borderRadius="10px"; de.style.padding="8px";
      de.addEventListener("input", ()=>{ n.text = n.text||{}; n.text.de = de.value; });
      grid.appendChild(Object.assign(document.createElement("div"), {textContent:"Text DE", style:"opacity:.8;font-size:12px;margin-top:8px"}));
      grid.appendChild(de);

      // help for question
      if(n.type==="question"){
        const help=document.createElement("textarea");
        help.value = (n.help && (n.help.sk||"")) || "";
        help.rows=2;
        help.style.width="100%"; help.style.resize="vertical";
        help.style.background="#111"; help.style.border="1px solid rgba(255,255,255,.18)";
        help.style.color="#fff"; help.style.borderRadius="10px"; help.style.padding="8px";
        help.addEventListener("input", ()=>{ n.help = n.help||{}; n.help.sk = help.value; });
        grid.appendChild(Object.assign(document.createElement("div"), {textContent:"Help SK", style:"opacity:.8;font-size:12px;margin-top:8px"}));
        grid.appendChild(help);

        const selYes = mkSel(Object.keys(tree.nodes), n.yes||"");
        selYes.addEventListener("change", ()=>{ n.yes = selYes.value; });
        grid.appendChild(Object.assign(document.createElement("div"), {textContent:"YES →", style:"opacity:.8;font-size:12px;margin-top:8px"}));
        grid.appendChild(selYes);

        const selNo = mkSel(Object.keys(tree.nodes), n.no||"");
        selNo.addEventListener("change", ()=>{ n.no = selNo.value; });
        grid.appendChild(Object.assign(document.createElement("div"), {textContent:"NO →", style:"opacity:.8;font-size:12px;margin-top:8px"}));
        grid.appendChild(selNo);
      }else{
        const selNext = mkSel(Object.keys(tree.nodes), n.next||"");
        selNext.addEventListener("change", ()=>{ n.next = selNext.value; });
        grid.appendChild(Object.assign(document.createElement("div"), {textContent:"NEXT →", style:"opacity:.8;font-size:12px;margin-top:8px"}));
        grid.appendChild(selNext);
      }

      row.appendChild(grid);
      wrap.appendChild(row);
    });
  }

  function openAdmin(){
    const ov = ensureOverlay();

    const sel = ov.querySelector("#admTreeSel");
    rebuildTreeSelect("admTreeSel");
    if(!sel.value && TREES[0]) sel.value = TREES[0].id;

    function loadTree(){
      const tree = getTreeById(sel.value);
      if(!tree) return;
      ov.querySelector("#admTitleSk").value = (tree.title && (tree.title.sk||"")) || "";
      ov.querySelector("#admSubSk").value = (tree.subtitle && (tree.subtitle.sk||"")) || "";
      ov.querySelector("#admTags").value = (tree.tags||[]).join(", ");
      renderNodeRows(tree);
    }

    sel.addEventListener("change", loadTree);
    loadTree();

    ov.querySelector("#admNewTree").addEventListener("click", ()=>{
      const titleSk = prompt("Názov stromu (SK):", "Nový strom");
      if(!titleSk) return;
      const id = slugify(titleSk) + "_" + Date.now().toString(36);
      const t = {
        id,
        title:{sk:titleSk, de:""},
        subtitle:{sk:"", de:""},
        tags:[],
        start:"q1",
        nodes:{
          q1:{type:"question", text:{sk:"Prvá otázka", de:""}, help:{sk:"", de:""}, yes:"", no:""}
        }
      };
      TREES.unshift(t);
      rebuildTreeSelect("admTreeSel");
      sel.value = id;
      loadTree();
    });

    ov.querySelector("#admDelTree").addEventListener("click", ()=>{
      const tree = getTreeById(sel.value);
      if(!tree) return;
      if(!confirm(`Zmazať strom "${tree.title?.sk || tree.id}"?`)) return;
      TREES = TREES.filter(t=>t.id!==tree.id);
      rebuildTreeSelect("admTreeSel");
      sel.value = TREES[0]?.id || "";
      loadTree();
    });

    ov.querySelector("#admAddQ").addEventListener("click", ()=>{
      const tree = getTreeById(sel.value);
      if(!tree) return;
      const ids = Object.keys(tree.nodes||{});
      const nextNum = ids.filter(x=>x.startsWith("q")).length + 1;
      const id = "q"+nextNum;
      tree.nodes[id] = {type:"question", text:{sk:"Nová otázka", de:""}, help:{sk:"", de:""}, yes:"", no:""};
      if(!tree.start) tree.start=id;
      renderNodeRows(tree);
    });

    ov.querySelector("#admAddA").addEventListener("click", ()=>{
      const tree = getTreeById(sel.value);
      if(!tree) return;
      const ids = Object.keys(tree.nodes||{});
      const nextNum = ids.filter(x=>x.startsWith("a")).length + 1;
      const id = "a"+nextNum;
      tree.nodes[id] = {type:"action", text:{sk:"Nová akcia", de:""}, next:""};
      if(!tree.start) tree.start=id;
      renderNodeRows(tree);
    });

    ov.querySelector("#admExport").addEventListener("click", ()=>{
      downloadJson("content.json", TREES);
    });

    const importBtn = ov.querySelector("#admImportBtn");
    const importFile = ov.querySelector("#admImportFile");
    importBtn.addEventListener("click", ()=> importFile.click());
    importFile.addEventListener("change", async ()=>{
      const f = importFile.files && importFile.files[0];
      if(!f) return;
      try{
        const txt = await f.text();
        const data = JSON.parse(txt);
        if(!Array.isArray(data)) throw new Error("content.json musí byť pole stromov");
        TREES = data;
        try{ localStorage.setItem("tam_custom_trees", JSON.stringify(TREES)); }catch{}
        rebuildTreeSelect("admTreeSel");
        sel.value = TREES[0]?.id || "";
        loadTree();
        alert("Import OK.");
      }catch(e){
        alert("Import zlyhal: " + (e?.message || e));
      }finally{
        importFile.value = "";
      }
    });

    ov.querySelector("#admSave").addEventListener("click", ()=>{
      const tree = getTreeById(sel.value);
      if(!tree) return;

      // write meta
      tree.title = tree.title || {};
      tree.subtitle = tree.subtitle || {};
      tree.title.sk = ov.querySelector("#admTitleSk").value.trim();
      tree.subtitle.sk = ov.querySelector("#admSubSk").value.trim();
      const tags = ov.querySelector("#admTags").value.split(",").map(x=>x.trim()).filter(Boolean);
      tree.tags = tags;

      // validate basic
      if(!tree.title.sk){ alert("Názov (SK) je povinný."); return; }
      if(!tree.start || !tree.nodes[tree.start]){
        tree.start = Object.keys(tree.nodes)[0] || "";
      }

      // persist on this device
      try{ localStorage.setItem("tam_custom_trees", JSON.stringify(TREES)); }catch{}

      // refresh main UI
      renderTagChips();
  renderFaultList();
      alert("Uložené. Zoznam porúch aktualizovaný. (Uložené aj do tohto zariadenia)");
    });
  }

  // 7 taps on PWA pill -> admin
  pwaPill.addEventListener("click", ()=>{
    tapCount++;
    if(!tapTimer) tapTimer = setTimeout(resetTaps, 1500);
    if(tapCount>=7){
      resetTaps();
      openAdmin();
    }
  });
})();


// service worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
