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

// Dil: uygulamada EN/PT seçiliyken dışarıdan (arama, bağlantı) gelen Türkçe Gönül/Gizlilik adresi
// kendi dilindeki kopyasına geçer (tarama 30 Ekim, L1). Sayfanın kendi dil düğmeleri (aynı bölümden gelen
// tıklama) yönlendirilmez; böylece "TR"ye basan geri atılmaz.
(function () {
  try {
    var dil = localStorage.getItem("dost-lang");
    if (dil !== "en" && dil !== "pt") return;
    var m = location.pathname.match(/^\/(gonul|gizlilik)\/(.*)$/);
    if (!m || /^(en|pt)(\/|$)/.test(m[2])) return;
    var ref = document.referrer || "";
    if (ref.indexOf(location.origin + "/gonul/") === 0 || ref.indexOf(location.origin + "/gizlilik/") === 0) return;
    location.replace("/" + m[1] + "/" + dil + "/" + m[2] + location.search + location.hash);
  } catch (e) {}
})();
