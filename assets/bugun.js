/* Bugünün parçası (2026-10-29, kullanıcı onayı): gün adına göre deterministik seçilen TEK bir Fütûhât kısmı ya da
 * Füsûs fassı. Bildirim yok, hesap yok, bir şey kaydedilmez: uygulamayı açan, Ara ya da Defterim'e bakan kişi
 * yalnız bir bağlantı görür. Seçim tarihin (YYYY-AA-GG) özetinden gelir; aynı gün herkese ve her cihazda aynıdır.
 * Yalnız başlık ve künye gösterilir (özet yok); yorum yazılmaz. Mişkât hadisleri bu turda dahil değil
 * (atlası ağır; indeksleri ayrı bir iş).
 * view-loader.js ONCE: search.js (boş arama) ve kavram-defteri.js (Defterim paneli) tembel indirir.
 */
(function () {
  "use strict";
  if (window.DostBugun) return;
  var GU = window.DostGraphUtils, I18n = window.DostI18n;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function bugunKey() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function ozet(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  var CILT = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];

  var sozu = null;
  function liste() {
    if (sozu) return sozu;
    var yukle = function (u) { return GU.fetchJson(u).catch(function () { return null; }); };
    sozu = Promise.all([yukle("data/ibn-arabi/futuhat-atlas-index.json"), yukle("data/ibn-arabi/fusus-atlas-index.json")]).then(function (r) {
      var out = [];
      ((r[0] && r[0].parts) || []).forEach(function (p) {
        if (p.status && p.status !== "active") return;
        out.push({ yol: "futuhat/" + p.id + "/", baslik: p.title, eyebrow: { tr: "Fütûhât-ı Mekkiyye · Cilt " + (CILT[p.cilt] || p.cilt) + " · Kısım " + p.kisim, en: "Futuhat · Volume " + (CILT[p.cilt] || p.cilt) + " · Part " + p.kisim, pt: "Futuhat · Volume " + (CILT[p.cilt] || p.cilt) + " · Parte " + p.kisim } });
      });
      ((r[1] && r[1].fasses) || []).forEach(function (f) {
        out.push({ yol: "fusus/" + f.id + "/", baslik: f.title, eyebrow: { tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" } });
      });
      return out;
    });
    return sozu;
  }
  function bugunun() {
    return liste().then(function (l) { return l.length ? l[ozet(bugunKey()) % l.length] : null; });
  }
  function satirEkle(kap) {
    if (!kap || kap.querySelector(".bugun-satir")) return;
    var a = document.createElement("a");
    a.className = "bugun-satir";
    a.hidden = true;
    kap.insertBefore(a, kap.firstChild);
    terimSatiriEkle(kap);
    bugunun().then(function (b) {
      if (!b || !a.isConnected) return;
      a.href = new URL(b.yol, document.baseURI).href;
      a.innerHTML = '<span class="bugun-satir__halka" aria-hidden="true"></span><span class="bugun-satir__metin"><span class="bugun-satir__et"></span><span class="bugun-satir__ad"></span><span class="bugun-satir__alt"></span></span>';
      a.querySelector(".bugun-satir__et").textContent = t({ tr: "Bugünün parçası", en: "Today's part", pt: "A parte de hoje" });
      a.querySelector(".bugun-satir__ad").textContent = t(b.baslik);
      a.querySelector(".bugun-satir__alt").textContent = t(b.eyebrow);
      a.hidden = false;
    });
  }
  // Bugünün terimi (2026-10-30, fikir L4): aynı ilke, Terimler sözlüğünden tek terim (başlık + Terimler bağlantısı).
  var terimSozu = null;
  function terimler() {
    if (!terimSozu) terimSozu = GU.fetchJson("data/ibn-arabi/felsefi-terimler.json").then(function (d) {
      var terms = (d && d.terms) || {};
      return Object.keys(terms).map(function (k) { return terms[k]; }).filter(function (x) { return x && x.id && x.title; });
    }).catch(function () { return []; });
    return terimSozu;
  }
  function terimSatiriEkle(kap) {
    if (!kap || kap.querySelector(".bugun-satir--terim")) return;
    var a = document.createElement("a");
    a.className = "bugun-satir bugun-satir--terim";
    a.hidden = true;
    var ilk = kap.querySelector(".bugun-satir");
    if (ilk) ilk.insertAdjacentElement("afterend", a); else kap.insertBefore(a, kap.firstChild);
    terimler().then(function (l) {
      if (!l.length || !a.isConnected) return;
      var x = l[ozet(bugunKey() + "|terim") % l.length];
      a.href = new URL("terimler/" + encodeURIComponent(x.id) + "/", document.baseURI).href;
      a.innerHTML = '<span class="bugun-satir__halka" aria-hidden="true"></span><span class="bugun-satir__metin"><span class="bugun-satir__et"></span><span class="bugun-satir__ad"></span></span>';
      a.querySelector(".bugun-satir__et").textContent = t({ tr: "Bugünün terimi", en: "Today's term", pt: "O termo de hoje" });
      a.querySelector(".bugun-satir__ad").textContent = t(x.title);
      a.hidden = false;
    });
  }
  window.DostBugun = { satirEkle: satirEkle, terimSatiriEkle: terimSatiriEkle, bugunun: bugunun, _anahtar: bugunKey, _ozet: ozet };
})();
