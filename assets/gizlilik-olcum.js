// Gizlilik sayfası: ölçüm tercihi halka düğmesi (tasarım önerisi 9, 2026-10-21).
// Aynı localStorage anahtarını (dost-analytics-consent) okur/yazar; uygulamada gösterilmez.
  (function () {
    var KEY = "dost-analytics-consent";
    var uygulama = false;
    try { uygulama = /(?:^|[?&])kaynak=twa(?:&|$)/.test(location.search) || sessionStorage.getItem("dost-uygulama") === "1" || localStorage.getItem("dost-uygulama") === "1"; } catch (e) {}
    try { uygulama = uygulama || !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches); } catch (e) {}
    // Uygulama içinde hiçbir ölçüm aracı yüklenmez: tercih satırı gösterilmez.
    if (uygulama) return;
    function oku() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    var yazanlar = [];
    document.querySelectorAll("[data-olcum]").forEach(function (kap) {
      var d = kap.querySelector(".olcum__hal"), t = kap.querySelector(".olcum__durum");
      function yaz(ilk) {
        var acik = oku() === "granted";
        d.setAttribute("aria-pressed", String(acik));
        t.textContent = (acik ? d.getAttribute("data-ac") : d.getAttribute("data-kapat")) + (ilk ? "" : " " + d.getAttribute("data-not"));
      }
      yazanlar.push(yaz);
      d.addEventListener("click", function () {
        try { localStorage.setItem(KEY, oku() === "granted" ? "denied" : "granted"); } catch (e) {}
        // Üç dil bölümündeki düğmelerin hepsi aynı kararı gösterir (yalnız tıklanan değil).
        yazanlar.forEach(function (y) { y(y === yaz ? false : true); });
      });
      kap.hidden = false;
      yaz(true);
    });
    // Başka sekmede değişirse düğmeler eşitlenir.
    window.addEventListener("storage", function (e) { if (e.key === KEY) yazanlar.forEach(function (y) { y(true); }); });
  })();
