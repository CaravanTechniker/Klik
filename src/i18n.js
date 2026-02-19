// src/i18n.js
export function getLang() {
  // 1) preferuj globálnu app setting, ak existuje
  // 2) fallback na localStorage
  // 3) fallback na navigator
  const v =
    (typeof window !== "undefined" && window.APP_LANG) ||
    (typeof localStorage !== "undefined" && localStorage.getItem("lang")) ||
    (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage)) ||
    "de";

  const s = String(v).toLowerCase();
  if (s.startsWith("sk")) return "sk";
  if (s.startsWith("de")) return "de";
  return "de";
}

const M = {
  de: {
    gasFailure: "Gasfehler",
    resetDone: "Zurückgesetzt"
  },
  sk: {
    gasFailure: "Porucha plynu",
    resetDone: "Resetované"
  }
};

export function t(key) {
  const lang = getLang();
  return (M[lang] && M[lang][key]) || (M.de && M.de[key]) || key;
}
