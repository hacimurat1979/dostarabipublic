/* Çevrimdışı okuma: "bütün içeriği indir" (2026-10-10, uygulama hazırlığı).
 *
 * Gezinme çekmecesinin altındaki tek satır (index.html #cevrimdisi). Kullanıcı
 * açıkça dokunmadıkça HİÇBİR ŞEY indirilmez; çekmece ilk açıldığında yalnız
 * ~100 baytlık özet (data/cevrimdisi-ozet.json) okunur ki satır boyutu
 * söyleyebilsin. Dokununca data/cevrimdisi-liste.json'daki dosyalar
 * (scripts/cevrimdisi-liste.py üretir) dörder dörder "dost-cevrimdisi"
 * önbelleğine iner; sw.js ağ yokken oradan okur.
 *
 * PAKETLER (2026-10-29, katmanlı çevrimdışı paket): liste dosyaları [yol, bayt, özet, paket] taşır; kullanıcı
 * hangi paketlerin ineceğini işaretler (Çekirdek her zaman; Fütûhât, Füsûs, Mişkât, Metin içi arama isteğe
 * bağlı). Seçim bu cihazın localStorage'ında (dost-cevrimdisi-paketler); varsayılan yalnız Çekirdek.
 * Daha önce "hepsini" indirmiş cihazın künyesi (paketler alanı yok) hepsi inmiş sayılır.
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

  var PAKETLER = ["cekirdek", "futuhat", "fusus", "miskat", "arama"];
  var PAKET_AD = {
    cekirdek: { tr: "Çekirdek: harita, Esmâ, Terimler, başlık araması", en: "Core: map, Names, Terms, title search", pt: "Núcleo: mapa, Nomes, Termos, busca por título" },
    futuhat: { tr: "Fütûhât-ı Mekkiyye", en: "Al-Futuhat al-Makkiyya", pt: "Al-Futuhat al-Makkiyya" },
    fusus: { tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" },
    miskat: { tr: "Mişkâtü'l-Envâr", en: "Mishkat al-Anwar", pt: "Mishkat al-Anwar" },
    arama: { tr: "Metin içi arama dizini", en: "Full-text search index", pt: "Índice de busca no texto" },
  };
  var SECIM_ANAHTAR = "dost-cevrimdisi-paketler";
  var secili = (function () {
    var a = null;
    try { a = JSON.parse(localStorage.getItem(SECIM_ANAHTAR) || "null"); } catch (e) { /* yok */ }
    a = Array.isArray(a) ? a.filter(function (x) { return PAKETLER.indexOf(x) >= 0; }) : [];
    if (a.indexOf("cekirdek") < 0) a.unshift("cekirdek");
    return a;
  })();
  function seciliListe() { return PAKETLER.filter(function (x) { return secili.indexOf(x) >= 0; }); }
  function seciliYaz() { try { localStorage.setItem(SECIM_ANAHTAR, JSON.stringify(seciliListe())); } catch (e) { /* depo yok */ } }
  function paketBayt(id) { return ozet && ozet.paketler && ozet.paketler[id] ? ozet.paketler[id].bayt : 0; }
  function seciliToplam() {
    if (ozet && ozet.paketler) return seciliListe().reduce(function (s, id) { return s + paketBayt(id); }, 0);
    return ozet && ozet.toplamBayt ? ozet.toplamBayt : 0;
  }
  // Künyedeki paket durumu: eski künyede (paketler yok) tamamsa hepsi inmiş sayılır.
  function durumPaketleri() {
    if (!durum) return {};
    if (durum.paketler) return durum.paketler;
    var o = {};
    if (durum.tamam) PAKETLER.forEach(function (id) { o[id] = durum.surum; });
    return o;
  }
  function inenBayt() {
    if (!durum) return 0;
    if (durum.paketBayt) return seciliListe().reduce(function (s, id) { return s + (durum.paketBayt[id] || 0); }, 0);
    return durum.bayt || 0;
  }

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
    var dp = durumPaketleri(), sec = seciliListe();
    var tamam = sec.every(function (id) { return !!dp[id]; });
    if (!tamam) return "kismi";
    if (ozet && ozet.surum && sec.some(function (id) { return dp[id] !== ozet.surum; })) return "eski";
    return "tamam";
  }

  function render() {
    var h = hal();
    var yazi;
    var oran = 0;
    if (h === "iniyor") {
      oran = is.toplam ? is.bitti / is.toplam : 0;
      yazi = is.toplam
        ? t({ tr: "İndiriliyor: ", en: "Downloading: ", pt: "Baixando: " }) + mb(is.bitti) + " / " + mb(is.toplam)
          + t({ tr: " · durdur", en: " · stop", pt: " · parar" })
        : t({ tr: "İndirme hazırlanıyor · durdur", en: "Preparing download · stop", pt: "Preparando · parar" });
    } else if (h === "tamam") {
      oran = 1;
      yazi = t({ tr: "Çevrimdışı okuma hazır", en: "Offline reading ready", pt: "Leitura offline pronta" })
        + (inenBayt() ? " (" + mb(inenBayt()) + ")" : "")
        + t({ tr: " · denetle", en: " · check", pt: " · verificar" });
    } else if (h === "eski") {
      oran = 1;
      yazi = t({ tr: "Çevrimdışı okuma: güncelle", en: "Offline reading: update", pt: "Leitura offline: atualizar" });
    } else if (h === "kismi") {
      oran = seciliToplam() ? Math.min(1, inenBayt() / seciliToplam()) : 0;
      var kalan = seciliToplam() ? Math.max(0, seciliToplam() - inenBayt()) : 0;
      // Boş dize YOK (2026-10-15): pick3 boş alanı yanlış sayıp Türkçeye düşer;
      // her dil kendi tam cümlesini taşır, boyut ortadan yerleşir.
      yazi = kalan
        ? t({ tr: "Çevrimdışı okuma: kalan " + mb(kalan) + "’ı indir", en: "Offline reading: download the remaining " + mb(kalan), pt: "Leitura offline: baixar os " + mb(kalan) + " restantes" })
        : t({ tr: "Çevrimdışı okuma: kalanı indir", en: "Offline reading: download the rest", pt: "Leitura offline: baixar o resto" });
    } else {
      yazi = seciliToplam()
        ? t({ tr: "Çevrimdışı okuma: " + mb(seciliToplam()) + " indir", en: "Offline reading: download " + mb(seciliToplam()), pt: "Leitura offline: baixar " + mb(seciliToplam()) })
        : t({ tr: "Çevrimdışı okuma: seçili paketleri indir", en: "Offline reading: download the selected packs", pt: "Leitura offline: baixar os pacotes selecionados" });
    }
    paketleriCiz(h);
    metinEl.textContent = yazi;
    kok.setAttribute("data-hal", h);
    dugme.setAttribute("aria-busy", h === "iniyor" ? "true" : "false");
    if (dolu) dolu.style.strokeDashoffset = String(CEVRE * (1 - oran));
    kaldirBtn.hidden = h === "iniyor" || h === "bos";
    notEl.textContent = not ? t(not) : "";
    notEl.hidden = !not;
  }

  var paketKap = document.getElementById("cevrimdisi-paketler");
  function paketleriCiz(h) {
    if (!paketKap) return;
    if (!paketKap.dataset.kuruldu) {
      paketKap.dataset.kuruldu = "1";
      paketKap.setAttribute("role", "group");
      paketKap.innerHTML = PAKETLER.map(function (id) {
        return '<div class="cevrimdisi__satir"><label class="cevrimdisi__paket"><input type="checkbox" data-paket="' + id + '"' + (id === "cekirdek" ? " checked disabled" : "") + '><span class="cevrimdisi__paket-ad"></span><span class="cevrimdisi__paket-boyut"></span></label><button type="button" class="cevrimdisi__paket-sil" data-paket-sil="' + id + '" hidden></button></div>';
      }).join("");
      paketKap.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-paket-sil]");
        if (b && !is) paketSil(b.dataset.paketSil);
      });
      paketKap.addEventListener("change", function (e) {
        var c = e.target.closest("input[data-paket]");
        if (!c || is) return;
        var id = c.dataset.paket, i = secili.indexOf(id);
        if (c.checked && i < 0) secili.push(id);
        else if (!c.checked && i >= 0) secili.splice(i, 1);
        seciliYaz();
        render();
      });
    }
    paketKap.setAttribute("aria-label", t({ tr: "Çevrimdışı paketler", en: "Offline packs", pt: "Pacotes offline" }));
    var dp = durumPaketleri();
    paketKap.querySelectorAll("label").forEach(function (l) {
      var c = l.querySelector("input"), id = c.dataset.paket;
      c.checked = secili.indexOf(id) >= 0;
      if (id !== "cekirdek") c.disabled = h === "iniyor";
      l.querySelector(".cevrimdisi__paket-ad").textContent = t(PAKET_AD[id]);
      var zaman = durum && durum.zaman && durum.zaman[id];
      l.querySelector(".cevrimdisi__paket-boyut").textContent = (dp[id] ? "✓ " : "") + (paketBayt(id) ? mb(paketBayt(id)) : "")
        + (dp[id] && zaman ? " · " + new Date(zaman).toLocaleDateString(dil() === "tr" ? "tr-TR" : dil() === "pt" ? "pt-BR" : "en-GB", { day: "numeric", month: "short" }) : "");
      // Depolama yönetimi (2026-10-30, fikir U3): inmiş paket tek başına silinir (kalanlar durur).
      var sil = l.parentNode.querySelector("button[data-paket-sil]");
      if (sil) {
        sil.hidden = !dp[id] || h === "iniyor";
        sil.textContent = t({ tr: "Sil", en: "Remove", pt: "Remover" });
        sil.setAttribute("aria-label", t({ tr: "Bu cihazdan sil: ", en: "Remove from this device: ", pt: "Remover deste dispositivo: " }) + t(PAKET_AD[id]));
      }
    });
    paketKap.hidden = false;
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
      ozet = { surum: liste.surum, toplamBayt: liste.toplamBayt, paketler: liste.paketler };
      var sec = seciliListe();
      var secilen = liste.dosyalar.filter(function (g) { return sec.indexOf(g[3] || "cekirdek") >= 0; });
      var secToplam = secilen.reduce(function (sum, g) { return sum + g[1]; }, 0);
      return Promise.all([caches.open(CACHE), durumOku()]).then(function (ikili) {
        var cache = ikili[0];
        var d = ikili[1] && ikili[1].dosyalar ? ikili[1] : { surum: null, tamam: false, dosyalar: {} };
        d.tamam = false;
        if (!d.paketler) d.paketler = d.surum && ikili[1] && ikili[1].tamam ? PAKETLER.reduce(function (o, id) { o[id] = d.surum; return o; }, {}) : {};
        var gecerli = {};
        liste.dosyalar.forEach(function (g) { gecerli[g[0]] = g; });
        var yap = secilen.filter(function (g) { return d.dosyalar[g[0]] !== g[2]; });
        var kalanBayt = yap.reduce(function (s, g) { return s + g[1]; }, 0);
        is.toplam = secToplam;
        is.bitti = Math.max(0, secToplam - kalanBayt);
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
          // Paket başına: o paketin bütün dosyaları güncel mi, kaç bayt iniyor.
          d.paketBayt = {};
          PAKETLER.forEach(function (id) {
            var ic = liste.dosyalar.filter(function (g) { return (g[3] || "cekirdek") === id; });
            d.paketBayt[id] = ic.reduce(function (s, g) { return s + (d.dosyalar[g[0]] === g[2] ? g[1] : 0); }, 0);
            var inSecili = sec.indexOf(id) >= 0;
            if (inSecili && !ac.signal.aborted && !hata && ic.every(function (g) { return d.dosyalar[g[0]] === g[2]; })) { d.paketler[id] = liste.surum; d.zaman = d.zaman || {}; if (!d.zaman[id] || yap.length) d.zaman[id] = Date.now(); }
            else if (inSecili) delete d.paketler[id];
          });
          d.tamam = !ac.signal.aborted && !hata && sec.every(function (id) { return d.paketler[id] === liste.surum; });
          if (d.tamam) d.surum = liste.surum;
          d.bayt = liste.dosyalar.reduce(function (s, g) { return s + (d.dosyalar[g[0]] === g[2] ? g[1] : 0); }, 0);
          return durumYaz(cache, d).then(function () { durum = d; return yap.length; });
        });
      });
    }).then(function (indirilen) {
      if (ac.signal.aborted) not = { tr: "Durduruldu; tekrar dokununca kaldığı yerden sürer.", en: "Stopped; tap again to continue where it left off.", pt: "Parado; toque de novo para continuar de onde ficou." };
      else if (hata === "yer") not = { tr: "Cihazda yer yetmedi.", en: "Not enough space on the device.", pt: "Espaço insuficiente no dispositivo." };
      else if (hata) not = { tr: "Bağlantı koptu; tekrar dokununca kaldığı yerden sürer.", en: "The connection dropped; tap again to continue where it left off.", pt: "A conexão caiu; toque de novo para continuar de onde ficou." };
      else if (!indirilen) not = { tr: "Güncel: değişen dosya yok.", en: "Up to date: no files changed.", pt: "Atualizado: nenhum arquivo mudou." };
      else not = { tr: "Hazır: seçtiğin paketler bu cihazda, bağlantısız da okunur.", en: "Ready: the packs you chose are on this device and read without a connection.", pt: "Pronto: os pacotes escolhidos estão neste dispositivo e podem ser lidos sem conexão." };
    }).catch(function () {
      if (ac.signal.aborted) not = { tr: "Durduruldu.", en: "Stopped.", pt: "Parado." };
      else not = { tr: "Şu an indirilemedi; bağlantını denetleyip tekrar dene.", en: "Couldn't download right now; check your connection and try again.", pt: "Não foi possível baixar agora; verifique a conexão e tente de novo." };
      return durumOku().then(function (d) { durum = d; });
    }).then(function () {
      is = null;
      render();
    });
  }

  function paketSil(id) {
    if (is) return;
    Promise.all([ag(LISTE).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }), caches.open(CACHE), durumOku()]).then(function (v) {
      var liste = v[0], cache = v[1], d = v[2];
      if (!d || !d.dosyalar) return;
      var silinecek = liste.dosyalar.filter(function (g) { return (g[3] || "cekirdek") === id; });
      return Promise.all(silinecek.map(function (g) { delete d.dosyalar[g[0]]; return cache.delete(mutlak(g[0])); })).then(function () {
        if (d.paketler) delete d.paketler[id];
        if (d.paketBayt) d.paketBayt[id] = 0;
        if (d.zaman) delete d.zaman[id];
        d.tamam = false;
        d.bayt = liste.dosyalar.reduce(function (s, g) { return s + (d.dosyalar[g[0]] === g[2] ? g[1] : 0); }, 0);
        var i = secili.indexOf(id);
        if (i >= 0 && id !== "cekirdek") { secili.splice(i, 1); seciliYaz(); }
        return durumYaz(cache, d).then(function () { durum = d; });
      });
    }).then(function () {
      not = { tr: "Paket bu cihazdan silindi.", en: "The pack was removed from this device.", pt: "O pacote foi removido deste dispositivo." };
      render();
    }).catch(function () {
      not = { tr: "Paket silinemedi.", en: "The pack could not be removed.", pt: "Não foi possível remover o pacote." };
      render();
    });
  }

  function kaldir() {
    if (is) return;
    caches.delete(CACHE).then(function () {
      durum = null;
      not = { tr: "İndirilen içerik kaldırıldı.", en: "Downloaded content removed.", pt: "Conteúdo baixado removido." };
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
