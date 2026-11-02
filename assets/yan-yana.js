/* Yan yana oku (2026-10-29, kullanıcı onayı; genişte): iki kaydı (bir kısım, bir fass, bir hadis) yan yana
 * okumak için tam ekran pencere. Her kolon gerçek sayfanın kendisidir (aynı kökenli iframe), kaydırmalar
 * bağımsızdır. Site hiçbir bağı kendisi kurmaz: karşılaştırmayı okuyucu yapar, burada yorum ya da eşleştirme YOK.
 * "Defterim'e kaydet" iki adresi tek bir kayıt olarak saklar (/?yanyana=<sol>,<sağ>); o kayıt açılınca pencere
 * aynı ikiliyle yeniden açılır. okuma-kipi.js (okuma araçları paneli) ve kavram-defteri.js (kayıtlı ikili) açar;
 * view-loader.js ONCE "yan-yana" ile tembel iner. Yalnız geniş ekranda (>= 1000 px) sunulur.
 */
(function () {
  "use strict";
  if (window.DostYanYana) return;
  var GU = window.DostGraphUtils, I18n = window.DostI18n;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function t3(tr, en, pt) { return t({ tr: tr, en: en, pt: pt }); }
  function gk(fn, y) { try { return fn(); } catch (e) { return y; } }
  function norm(s) { return (s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’‘ʿʾ-]/g, " ").replace(/\s+/g, " ").trim(); }
  var CILT = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];

  var sozu = null;
  function secenekler() {
    if (sozu) return sozu;
    var y = function (u) { return GU.fetchJson(u).catch(function () { return null; }); };
    sozu = Promise.all([y("data/ibn-arabi/futuhat-atlas-index.json"), y("data/ibn-arabi/fusus-atlas-index.json"), y("data/ibn-arabi/miskat-atlas.json")]).then(function (r) {
      var o = [];
      ((r[0] && r[0].parts) || []).forEach(function (p) {
        if (p.status && p.status !== "active") return;
        o.push({ yol: "/futuhat/" + p.id + "/", baslik: p.title, alt: { tr: "Fütûhât · Cilt " + (CILT[p.cilt] || p.cilt) + " · Kısım " + p.kisim, en: "Futuhat · Volume " + (CILT[p.cilt] || p.cilt) + " · Part " + p.kisim, pt: "Futuhat · Volume " + (CILT[p.cilt] || p.cilt) + " · Parte " + p.kisim } });
      });
      ((r[1] && r[1].fasses) || []).forEach(function (f) { o.push({ yol: "/fusus/" + f.id + "/", baslik: f.title, alt: { tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" } }); });
      ((r[2] && r[2].hadisler) || []).forEach(function (h) {
        if (h.status !== "active") return;
        o.push({ yol: "/miskat/" + h.id + "/", baslik: h.title, alt: { tr: "Mişkâtü'l-Envâr · hadis " + h.id.replace(/^h/, ""), en: "Mishkat al-Anwar · hadith " + h.id.replace(/^h/, ""), pt: "Mishkat al-Anwar · hadith " + h.id.replace(/^h/, "") } });
      });
      o.forEach(function (x) { x.ara = norm(t(x.baslik) + " " + x.baslik.en + " " + x.baslik.pt + " " + t(x.alt)); });
      return o;
    });
    return sozu;
  }
  function bul(yol) { return secenekler().then(function (l) { return l.filter(function (x) { return x.yol === yol; })[0] || null; }); }

  var kutu = null, oncekiOdak = null, durum = { sol: null, sag: null };
  function icKur(fr) {
    var n = 0;
    var z = setInterval(function () {
      gk(function () {
        var d = fr.contentDocument;
        if (d && d.documentElement) {
          d.documentElement.classList.add("yy-ic");
          if (d.defaultView && d.defaultView.__dostAppReady) { fr.classList.add("yy__hazir"); clearInterval(z); }
        }
      });
      if (++n > 160) { fr.classList.add("yy__hazir"); clearInterval(z); }
    }, 60);
  }
  function kolCiz(ad) {
    var kol = kutu.querySelector('[data-kol="' + ad + '"]'), s = durum[ad];
    kol.innerHTML = "";
    var bas = document.createElement("div"); bas.className = "yy__kol-bas";
    var ba = document.createElement("span"); ba.className = "yy__kol-ad";
    bas.appendChild(ba);
    if (s) {
      ba.textContent = t(s.baslik);
      var d = document.createElement("button"); d.type = "button"; d.dataset.e = "degistir-" + ad; d.textContent = t3("Değiştir", "Change", "Trocar"); bas.appendChild(d);
    } else ba.textContent = t3("İkinci metni seç", "Choose the second text", "Escolha o segundo texto");
    kol.appendChild(bas);
    if (s) {
      var fr = document.createElement("iframe");
      fr.className = "yy__iframe"; fr.title = t(s.baslik); fr.src = new URL(s.yol.replace(/^\//, ""), document.baseURI).href;
      kol.appendChild(fr); icKur(fr);
    } else secici(kol, ad);
    durumuTazele();
  }
  function secici(kol, ad) {
    var w = document.createElement("div"); w.className = "yy__sec";
    var i = document.createElement("input"); i.type = "search"; i.className = "yy__ara"; i.placeholder = t3("Kısım, fass ya da hadis ara…", "Search a part, chapter or hadith…", "Buscar parte, capítulo ou hadith…");
    i.setAttribute("aria-label", i.placeholder);
    var u = document.createElement("ul"); u.className = "yy__liste";
    w.appendChild(i); w.appendChild(u); kol.appendChild(w);
    function ciz() {
      var q = norm(i.value);
      secenekler().then(function (l) {
        var s = (q ? l.filter(function (x) { return x.ara.indexOf(q) >= 0; }) : l).slice(0, 80);
        u.innerHTML = "";
        s.forEach(function (x) {
          var li = document.createElement("li"), b = document.createElement("button"); b.type = "button"; b.className = "yy__oge";
          b.innerHTML = '<span class="yy__oge-ad"></span><span class="yy__oge-alt"></span>';
          b.querySelector(".yy__oge-ad").textContent = t(x.baslik); b.querySelector(".yy__oge-alt").textContent = t(x.alt);
          b.addEventListener("click", function () { durum[ad] = x; kolCiz(ad); });
          li.appendChild(b); u.appendChild(li);
        });
        if (!s.length) { var e = document.createElement("li"); e.className = "yy__bos"; e.textContent = t3("Eşleşen kayıt yok.", "No matching record.", "Nenhum registro correspondente."); u.appendChild(e); }
      });
    }
    i.addEventListener("input", ciz); ciz();
    gk(function () { i.focus({ preventScroll: true }); });
  }
  var durumEl = null;
  function durumuTazele() { var k = kutu && kutu.querySelector('[data-e="kaydet"]'); if (k) k.disabled = !(durum.sol && durum.sag); }
  function defterEkle() {
    if (!durum.sol || !durum.sag) return;
    var href = location.origin + "/?yanyana=" + encodeURIComponent(durum.sol.yol + "," + durum.sag.yol);
    var a = gk(function () { var x = JSON.parse(localStorage.getItem("dost-defter") || "[]"); return Array.isArray(x) ? x : []; }, []);
    if (a.some(function (e) { return e.href === href; })) { durumEl.textContent = t3("Bu ikili zaten Defterim'de.", "This pair is already in My Notebook.", "Este par já está no Meu Caderno."); return; }
    a.unshift({ href: href, title: t3("Yan yana: ", "Side by side: ", "Lado a lado: ") + t(durum.sol.baslik) + " | " + t(durum.sag.baslik), eyebrow: t3("Karşılaştırma (yan yana okuma)", "Comparison (side-by-side reading)", "Comparação (leitura lado a lado)"), addedAt: Date.now() });
    gk(function () { localStorage.setItem("dost-defter", JSON.stringify(a)); window.dispatchEvent(new Event("dost-notlar")); });
    durumEl.textContent = t3("Defterim'e kaydedildi.", "Saved to My Notebook.", "Salvo no Meu Caderno.");
  }
  function kapat() {
    if (!kutu) return false;
    kutu.remove(); kutu = null; durum = { sol: null, sag: null };
    HTMLoku(false);
    if (oncekiOdak && oncekiOdak.focus) gk(function () { oncekiOdak.focus(); });
    return true;
  }
  function HTMLoku(ac) { document.documentElement.classList.toggle("yy-acik", ac); }
  function ac(sol, sag) {
    if (kutu) return Promise.resolve();
    oncekiOdak = document.activeElement;
    return Promise.all([sol ? bul(sol) : null, sag ? bul(sag) : null]).then(function (r) {
      durum = { sol: r[0], sag: r[1] };
      kutu = document.createElement("section");
      kutu.className = "yy"; kutu.setAttribute("role", "dialog"); kutu.setAttribute("aria-modal", "true");
      kutu.setAttribute("aria-label", t3("Yan yana oku", "Read side by side", "Ler lado a lado"));
      kutu.innerHTML = '<header class="yy__ust"><h2></h2><span class="yy__durum" role="status" aria-live="polite"></span><div class="yy__eylem"><button type="button" data-e="kaydet"></button><button type="button" data-e="kapat" class="yy__kapat">×</button></div></header>'
        + '<div class="yy__cift"><div class="yy__kol" data-kol="sol"></div><div class="yy__kol" data-kol="sag"></div></div>';
      kutu.querySelector("h2").textContent = t3("Yan yana oku", "Read side by side", "Ler lado a lado");
      kutu.querySelector('[data-e="kaydet"]').textContent = t3("Defterim'e kaydet", "Save to My Notebook", "Salvar no Meu Caderno");
      kutu.querySelector(".yy__kapat").setAttribute("aria-label", t3("Kapat", "Close", "Fechar"));
      durumEl = kutu.querySelector(".yy__durum");
      kutu.addEventListener("click", function (ev) {
        var b = ev.target.closest("button[data-e]"); if (!b) return;
        var e = b.dataset.e;
        if (e === "kapat") kapat();
        else if (e === "kaydet") defterEkle();
        else if (e.indexOf("degistir-") === 0) { var ad = e.slice(9); durum[ad] = null; kolCiz(ad); }
      });
      document.body.appendChild(kutu);
      HTMLoku(true);
      kolCiz("sol"); kolCiz("sag");
    });
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return kapat(); }, { oncelikli: true });
  window.DostYanYana = { ac: ac, kapat: kapat, ekranUygun: function () { return window.matchMedia("(min-width: 1000px)").matches; } };
})();
