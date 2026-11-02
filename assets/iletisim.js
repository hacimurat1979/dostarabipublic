/* İletişim düğmesi (issue #9, 2026-11-02): adres düz metin DEĞİL; tıklayınca kurulur ve kullanıcının e-posta uygulaması açılır.
   Sayfa kaynağında, altbilgide ya da Daha'da adres görünmez. Dış servis yok, sunucuya bir şey gitmez. */
(function () {
  "use strict";
  var P = "bW9jLmxpYW1nQG5hbWFyYWsudGFydW1pY2Fo";
  function adres() { try { return atob(P).split("").reverse().join(""); } catch (e) { return ""; } }
  function bilgi(dil) {
    var and = /Android\s+([0-9.]+)/.exec(navigator.userAgent || "");
    return "dil: " + dil + " · site" + (and ? " · Android " + and[1] : "");
  }
  function ac(dugme) {
    var a = adres(); if (!a) return;
    var dil = dugme.getAttribute("data-dil") || "tr";
    var konu = dugme.getAttribute("data-konu") || "Dost Arabî";
    location.href = "mailto:" + a + "?subject=" + encodeURIComponent(konu) + "&body=" + encodeURIComponent("\n\n\n--\n" + bilgi(dil));
  }
  document.addEventListener("click", function (e) {
    var d = e.target.closest && e.target.closest("[data-iletisim]");
    if (d) { e.preventDefault(); ac(d); }
  });
})();
