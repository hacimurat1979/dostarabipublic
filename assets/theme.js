(function () {
  "use strict";

  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function currentTheme() {
    return document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  // Durum çubuğu rengi (2026-10-15, mobil kabuk taraması K06): index.html'deki
  // iki <meta name="theme-color"> yalnız cihazın temasına (prefers-color-scheme)
  // bağlıydı; uygulama içinden tema değiştirilince başlık #0d0d0d olurken
  // çubuk açık kalıyordu. Artık ikisi de seçilen temanın sayfa zemini
  // (--page-plane) renginde: açık #f9f9f7, karanlık #0d0d0d.
  const TEMA_RENGI = { light: "#f9f9f7", dark: "#0d0d0d" };

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", TEMA_RENGI[theme]));
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
