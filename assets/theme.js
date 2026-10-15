(function () {
  "use strict";

  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function currentTheme() {
    return document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  applyTheme(currentTheme());

  // Mobil teknik dalga 1 (E-06, 2026-10-15): kullanıcı temayı elle seçmediyse
  // (localStorage "dost-theme" yok) sistemin karanlık/aydınlık modu uygulama
  // AÇIKKEN değişince sayfa da değişir (Android'in akşam otomatik karanlık
  // modu: durum çubuğu koyulaşıyor, sayfa açık kalıyordu). Elle seçim
  // (düğme) kalıcıdır, sistem değişimi onu ezmez.
  try {
    const sistemMq = window.matchMedia("(prefers-color-scheme: dark)");
    const sistemDegisti = (e) => {
      let kayit = null;
      try { kayit = localStorage.getItem("dost-theme"); } catch (err) {}
      if (kayit === "light" || kayit === "dark") return;
      applyTheme(e.matches ? "dark" : "light");
    };
    if (sistemMq.addEventListener) sistemMq.addEventListener("change", sistemDegisti);
    else if (sistemMq.addListener) sistemMq.addListener(sistemDegisti);
  } catch (e) {}

  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("dost-theme", next);
    } catch (e) {}
    applyTheme(next);
  });
})();
