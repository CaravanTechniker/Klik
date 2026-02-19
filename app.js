// app.js
// BEZPEČNÁ VERZIA – reset NIKDY nemaže stromy ani admin import

const STORAGE_CONTENT_KEY = "admin_content_json";

// ===== CONTENT LOAD =====
function loadContent() {
  // 1️⃣ pokus: admin import (má PRIORITU)
  try {
    const stored = localStorage.getItem(STORAGE_CONTENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Stored content invalid, fallback to default", e);
  }

  // 2️⃣ fallback: default content.json
  return fetch("./content.json", { cache: "no-store" })
    .then((r) => r.json())
    .catch((e) => {
      console.error("Failed to load content.json", e);
      return null;
    });
}

// ===== ADMIN SAVE (volaj pri importe) =====
function saveAdminContent(content) {
  localStorage.setItem(STORAGE_CONTENT_KEY, JSON.stringify(content));
}

// ===== SAFE RESET =====
function resetApp() {
  // ⛔️ NESMIE SA POUŽIŤ localStorage.clear()

  const SAFE_DELETE = [
    "protocol",
    "currentTreeId",
    "currentNodeId",
    "lastSelection",
    "searchQuery",
    "ui_state",
    "history"
  ];

  SAFE_DELETE.forEach((k) => localStorage.removeItem(k));

  // reset UI bez straty dát
  window.location.hash = "";
  location.reload();
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  const content = await loadContent();
  if (!content) {
    alert("Content konnte nicht geladen werden");
    return;
  }

  // TU máš pôvodný init kód appky
  // napr. initApp(content);
  if (typeof initApp === "function") {
    initApp(content);
  } else {
    console.warn("initApp() not found");
  }
});

// ===== EXPORT DO GLOBÁLU (aby to vedel volať Admin / UI) =====
window.resetApp = resetApp;
window.saveAdminContent = saveAdminContent;
