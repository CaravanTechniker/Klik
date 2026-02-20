// app.js
// FINÁLNA STABILNÁ VERZIA – stromy sa NIKDY nemažú

const STORAGE_CONTENT_KEY = "admin_content_json";

/* =========================
   CONTENT LOADING
========================= */
async function loadContent() {
  // 1️⃣ ADMIN CONTENT MÁ ABSOLÚTNU PRIORITU
  try {
    const stored = localStorage.getItem(STORAGE_CONTENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Invalid admin content, fallback to default", e);
  }

  // 2️⃣ DEFAULT CONTENT LEN AK NIČ INÉ NIE JE
  try {
    const res = await fetch("./content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch (e) {
    console.error("Failed to load content.json", e);
    return null;
  }
}

/* =========================
   ADMIN SAVE
========================= */
function saveAdminContent(content) {
  localStorage.setItem(STORAGE_CONTENT_KEY, JSON.stringify(content));
}

/* =========================
   SAFE RESET (UI ONLY)
========================= */
function resetApp() {
  // ❌ nikdy nemažeme celý localStorage

  const RUNTIME_KEYS = [
    "protocol",
    "currentTreeId",
    "currentNodeId",
    "lastSelection",
    "searchQuery",
    "ui_state",
    "history"
  ];

  RUNTIME_KEYS.forEach((k) => localStorage.removeItem(k));

  // reset UI stavu BEZ reloadu dát
  window.location.hash = "";

  // znovu inicializuj app s EXISTUJÚCIM CONTENTOM
  loadContent().then((content) => {
    if (content && typeof initApp === "function") {
      initApp(content);
    }
  });
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const content = await loadContent();
  if (!content) {
    alert("Content konnte nicht geladen werden");
    return;
  }

  if (typeof initApp === "function") {
    initApp(content);
  } else {
    console.warn("initApp() not found");
  }
});

/* =========================
   GLOBAL EXPORTS
========================= */
window.resetApp = resetApp;
window.saveAdminContent = saveAdminContent;
