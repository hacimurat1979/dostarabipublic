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
    document.querySelectorAll("[data-olcum]").forEach(function (kap) {
      var d = kap.querySelector(".olcum__hal"), t = kap.querySelector(".olcum__durum");
      function yaz(ilk) {
        var acik = oku() === "granted";
        d.setAttribute("aria-pressed", String(acik));
        t.textContent = (acik ? d.getAttribute("data-ac") : d.getAttribute("data-kapat")) + (ilk ? "" : " " + d.getAttribute("data-not"));
      }
      d.addEventListener("click", function () {
        try { localStorage.setItem(KEY, oku() === "granted" ? "denied" : "granted"); } catch (e) {}
        yaz(false);
      });
      kap.hidden = false;
      yaz(true);
    });
  })();
