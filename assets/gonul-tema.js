// Gönül Defteri / Gizlilik gibi düz statik sayfalar: sitenin temasını izler (2026-10-29).
// Uygulama kabuğu temayı localStorage "dost-theme" ile tutar; bu sayfalar yalnız
// sistem temasına bakıyordu — site gündüzdeyken geceye düşüyordu. Elle seçim yoksa
// sistem teması geçerli kalır. Sayfa boyanmadan çalışsın diye <head>'de, senkron.
(function () {
  try {
    var t = localStorage.getItem("dost-theme");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute("content", t === "dark" ? "#0d0d0d" : "#f9f9f7");
    }
  } catch (e) {}
})();
