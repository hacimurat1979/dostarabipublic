/* Çevrimdışı okuma: "bütün içeriği indir" (2026-10-10, uygulama hazırlığı).
 *
 * Gezinme çekmecesinin altındaki tek satır (index.html #cevrimdisi). Kullanıcı
 * açıkça dokunmadıkça HİÇBİR ŞEY indirilmez; çekmece ilk açıldığında yalnız
 * ~100 baytlık özet (data/cevrimdisi-ozet.json) okunur ki satır boyutu
 * söyleyebilsin. Dokununca data/cevrimdisi-liste.json'daki dosyalar
 * (scripts/cevrimdisi-liste.py üretir) dörder dörder "dost-cevrimdisi"
 * önbelleğine iner; sw.js ağ yokken oradan okur.
 *
 * Tek düğme, durumuna göre tek iş (bağlanmamış düğme yok):
 *   boş/kısmi/eski -> indir (eksik ve değişmiş dosyaları; tekrar dokununca
 *                     kaldığı yerden sürer)
 *   iniyor         -> durdur
 *   tamam          -> denetle (sürüm değiştiyse yalnız değişenleri indirir)
 * "Kaldır" indirilmiş içeriği siler. Esc çekmeceyi kapatır (nav-drawer.js);
 * indirme sürer, satır durumu çekmece yeniden açılınca görünür.
 *
 * İndirmenin künyesi aynı önbellekte "__cevrimdisi-durum.json":
 * { surum, tamam, dosyalar: {yol: özet} }. Tarayıcı Cache API ya da
 * Service Worker desteklemiyorsa satır hiç görünmez.
 */
(function () {
  "use strict";

  var kok = document.getElementById("cevrimdisi");
  if (!kok) return;
  if (!("caches" in window) || !("serviceWorker" in navigator) || !window.isSecureContext) return;

  var dugme = document.getElementById("cevrimdisi-dugme");
  var metinEl = document.getElementById("cevrimdisi-metin");
  var kaldirBtn = document.getElementById("cevrimdisi-kaldir");
  var notEl = document.getElementById("cevrimdisi-not");
  var dolu = kok.querySelector(".cevrimdisi__dolu");
  var drawer = document.getElementById("nav-drawer");
  if (!dugme || !metinEl || !kaldirBtn || !notEl) return;

  var CACHE = "dost-cevrimdisi";
  var DURUM = "__cevrimdisi-durum.json";
  var BASLIK = "X-Dost-Cevrimdisi"; // sw.js bu başlığı taşıyan isteğe karışmaz
  var LISTE = "data/cevrimdisi-liste.json";
  var OZET = "data/cevrimdisi-ozet.json";
  var ESZAMANLI = 4;
  var CEVRE = 2 * Math.PI * 7.5; // halkanın çevresi (index.html: r=7.5)

  var durum = null;  // indirmenin künyesi (önbellekten)
  var ozet = null;   // { surum, toplamBayt } (ağdan, çekmece ilk açılınca)
  var is = null;     // süren indirme: { ac, bitti, toplam }
  var not = null;    // son bildirim {tr,en,pt}

  function t(d) { return window.DostI18n ? window.DostI18n.pick3(d) : d.tr; }
  function dil() { return window.DostI18n ? window.DostI18n.getLang() : "tr"; }
  function mutlak(u) { return new URL(u, document.baseURI).href; }
  function mb(b) {
    var m = b / 1048576;
    try {
      return new Intl.NumberFormat(dil(), { maximumFractionDigits: m >= 10 ? 0 : 1 }).format(m) + " MB";
    } catch (e) { return m.toFixed(1) + " MB"; }
  }
  function ag(u, sinyal) {
    var h = {}; h[BASLIK] = "1";
    return fetch(mutlak(u), { cache: "no-store", headers: h, signal: sinyal });
  }

  function durumOku() {
    return caches.has(CACHE).then(function (varMi) {
      if (!varMi) return null;
      return caches.open(CACHE).then(function (c) { return c.match(mutlak(DURUM)); })
        .then(function (r) { return r ? r.json() : null; });
    }).catch(function () { return null; });
  }
  function durumYaz(cache, d) {
    return cache.put(mutlak(DURUM), new Response(JSON.stringify(d), { headers: { "Content-Type": "application/json" } }));
  }

  function hal() {
    if (is) return "iniyor";
    if (!durum) return "bos";
    if (!durum.tamam) return "kismi";
    if (ozet && ozet.surum && ozet.surum !== durum.surum) return "eski";
    return "tamam";
  }

  function render() {
    var h = hal();
    var yazi;
    var oran = 0;
    if (h === "iniyor") {
      oran = is.toplam ? is.bitti / is.toplam : 0;
      yazi = is.toplam
        ? t({ tr: "İndiriliyor: ", en: "Downloading: ", pt: "A descarregar: " }) + mb(is.bitti) + " / " + mb(is.toplam)
          + t({ tr: " · durdur", en: " · stop", pt: " · parar" })
        : t({ tr: "İndirme hazırlanıyor · durdur", en: "Preparing download · stop", pt: "A preparar · parar" });
    } else if (h === "tamam") {
      oran = 1;
      yazi = t({ tr: "Çevrimdışı okuma hazır", en: "Offline reading ready", pt: "Leitura offline pronta" })
        + (durum.bayt ? " (" + mb(durum.bayt) + ")" : "")
        + t({ tr: " · denetle", en: " · check", pt: " · verificar" });
    } else if (h === "eski") {
      oran = 1;
      yazi = t({ tr: "Çevrimdışı okuma: güncelle", en: "Offline reading: update", pt: "Leitura offline: atualizar" });
    } else if (h === "kismi") {
      oran = ozet && ozet.toplamBayt ? Math.min(1, (durum.bayt || 0) / ozet.toplamBayt) : 0;
      var kalan = ozet && ozet.toplamBayt ? Math.max(0, ozet.toplamBayt - (durum.bayt || 0)) : 0;
      yazi = kalan
        ? t({ tr: "Çevrimdışı okuma: kalan ", en: "Offline reading: download the remaining ", pt: "Leitura offline: descarregar os " })
          + mb(kalan) + t({ tr: "’ı indir", en: "", pt: " restantes" })
        : t({ tr: "Çevrimdışı okuma: kalanı indir", en: "Offline reading: download the rest", pt: "Leitura offline: descarregar o resto" });
    } else {
      yazi = ozet && ozet.toplamBayt
        ? t({ tr: "Çevrimdışı okuma: ", en: "Offline reading: download ", pt: "Leitura offline: descarregar " })
          + mb(ozet.toplamBayt) + t({ tr: " indir", en: "", pt: "" })
        : t({ tr: "Çevrimdışı okuma: bütün içeriği indir", en: "Offline reading: download all content", pt: "Leitura offline: descarregar todo o conteúdo" });
    }
    metinEl.textContent = yazi;
    kok.setAttribute("data-hal", h);
    dugme.setAttribute("aria-busy", h === "iniyor" ? "true" : "false");
    if (dolu) dolu.style.strokeDashoffset = String(CEVRE * (1 - oran));
    kaldirBtn.hidden = h === "iniyor" || h === "bos";
    notEl.textContent = not ? t(not) : "";
    notEl.hidden = !not;
  }

  function ozetiAl() {
    if (ozet) return Promise.resolve(ozet);
    return ag(OZET).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (o) { ozet = o; render(); return o; })
      .catch(function () { return null; });
  }

  function indir() {
    if (is) return;
    var ac = new AbortController();
    var hata = null;
    is = { ac: ac, bitti: 0, toplam: 0 };
    not = null;
    render();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) { /* yok */ }

    ag(LISTE, ac.signal).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (liste) {
      ozet = { surum: liste.surum, toplamBayt: liste.toplamBayt };
      return Promise.all([caches.open(CACHE), durumOku()]).then(function (ikili) {
        var cache = ikili[0];
        var d = ikili[1] && ikili[1].dosyalar ? ikili[1] : { surum: null, tamam: false, dosyalar: {} };
        d.tamam = false;
        var gecerli = {};
        liste.dosyalar.forEach(function (g) { gecerli[g[0]] = g; });
        var yap = liste.dosyalar.filter(function (g) { return d.dosyalar[g[0]] !== g[2]; });
        var kalanBayt = yap.reduce(function (s, g) { return s + g[1]; }, 0);
        is.toplam = liste.toplamBayt;
        is.bitti = Math.max(0, liste.toplamBayt - kalanBayt);
        render();
        var i = 0;
        var sonYazim = Date.now();
        function sonraki() {
          if (ac.signal.aborted || hata) return Promise.resolve();
          var g = yap[i++];
          if (!g) return Promise.resolve();
          return ag(g[0], ac.signal).then(function (r) {
            if (r.status !== 200) throw new Error("HTTP " + r.status + " " + g[0]);
            return cache.put(mutlak(g[0]), r);
          }).then(function () {
            d.dosyalar[g[0]] = g[2];
            is.bitti += g[1];
            render();
            if (Date.now() - sonYazim > 2000) { sonYazim = Date.now(); return durumYaz(cache, d); }
          }).catch(function (e) {
            if (ac.signal.aborted) return;
            hata = e && e.name === "QuotaExceededError" ? "yer" : "ag";
          }).then(sonraki);
        }
        var isciler = [];
        for (var k = 0; k < ESZAMANLI; k++) isciler.push(sonraki());
        return Promise.all(isciler).then(function () {
          // Listeden çıkmış eski dosyalar önbellekten de kalkar.
          var silinecek = Object.keys(d.dosyalar).filter(function (u) { return !gecerli[u]; });
          return Promise.all(silinecek.map(function (u) { delete d.dosyalar[u]; return cache.delete(mutlak(u)); }));
        }).then(function () {
          d.tamam = !ac.signal.aborted && !hata
            && liste.dosyalar.every(function (g) { return d.dosyalar[g[0]] === g[2]; });
          if (d.tamam) d.surum = liste.surum;
          d.bayt = liste.dosyalar.reduce(function (s, g) { return s + (d.dosyalar[g[0]] === g[2] ? g[1] : 0); }, 0);
          return durumYaz(cache, d).then(function () { durum = d; return yap.length; });
        });
      });
    }).then(function (indirilen) {
      if (ac.signal.aborted) not = { tr: "Durduruldu; tekrar dokununca kaldığı yerden sürer.", en: "Stopped; tap again to continue where it left off.", pt: "Parado; toque de novo para continuar de onde ficou." };
      else if (hata === "yer") not = { tr: "Cihazda yer yetmedi.", en: "Not enough space on the device.", pt: "Espaço insuficiente no dispositivo." };
      else if (hata) not = { tr: "Bağlantı koptu; tekrar dokununca kaldığı yerden sürer.", en: "The connection dropped; tap again to continue where it left off.", pt: "A ligação caiu; toque de novo para continuar de onde ficou." };
      else if (!indirilen) not = { tr: "Güncel: değişen dosya yok.", en: "Up to date: no files changed.", pt: "Atualizado: nenhum ficheiro mudou." };
      else not = { tr: "Hazır: bütün içerik bu cihazda, bağlantısız da okunur.", en: "Ready: all content is on this device and reads without a connection.", pt: "Pronto: todo o conteúdo está neste dispositivo e lê-se sem ligação." };
    }).catch(function () {
      if (ac.signal.aborted) not = { tr: "Durduruldu.", en: "Stopped.", pt: "Parado." };
      else not = { tr: "Şu an indirilemedi; bağlantını denetleyip tekrar dene.", en: "Couldn't download right now; check your connection and try again.", pt: "Não foi possível descarregar agora; verifique a ligação e tente de novo." };
      return durumOku().then(function (d) { durum = d; });
    }).then(function () {
      is = null;
      render();
    });
  }

  function kaldir() {
    if (is) return;
    caches.delete(CACHE).then(function () {
      durum = null;
      not = { tr: "İndirilen içerik kaldırıldı.", en: "Downloaded content removed.", pt: "Conteúdo descarregado removido." };
      render();
      dugme.focus();
    });
  }

  dugme.addEventListener("click", function () {
    if (is) { is.ac.abort(); return; }
    indir();
  });
  kaldirBtn.addEventListener("click", kaldir);

  // Dil değişince (i18n.js applyStatic <html lang>'ı yazar) metin yeniden.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  // Özet yalnız çekmece açılınca, bir kez.
  if (drawer) {
    new MutationObserver(function () { if (!drawer.hidden) ozetiAl(); })
      .observe(drawer, { attributes: true, attributeFilter: ["hidden"] });
  }

  // Telefon kabuğu (uygulama-kabugu.js) bu satırı "Daha" sayfasına taşıyınca
  // boyutu söyleyebilsin diye özeti oradan da ister (çekmece açılmadan).
  window.DostCevrimdisi = { hazirla: ozetiAl };

  durumOku().then(function (d) {
    durum = d;
    render();
    kok.hidden = false;
    if (drawer && !drawer.hidden) ozetiAl();
  });
})();
