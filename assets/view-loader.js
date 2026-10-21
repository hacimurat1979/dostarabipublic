// FAZ (JS lazy-load): görünüm-özel script'ler sayfa ilk yüklendiğinde değil,
// o görünüm ilk kez açıldığında indirilsin diye eklendi (bkz. teknik analiz
// raporu, 2026-08). Başlangıçta 5 dosyayla (sirlar-graph/kavram/ayet-hadis/
// siirler/vahdet, ~82 KB) başladı; 2026-08-04 sonrası eklenen 7 görünüm de
// (acik-sorular, bilmiyoruz, elestiri-arkeolojisi, hocalar, eser-agi,
// seyahat-atlasi, kuran-dokusu) aynı desene katıldı.
//
// 2026-08-15: esma/hal/menziller/sorular/terimler/futuhat (~390 KB gzip,
// altısı da her sayfada koşulsuz iniyordu) de eklendi. Eskiden bu altısı
// (ve cizimler/tasiyicilar/fusus) registerCrossLinkTerm() çağırdığı için
// dışarıda bırakılmıştı -- ama terimler.js'in 2026-08-03 tarihli kendi
// yorumunun belgelediği gibi o bağımlılık artık yok: çapraz-bağlantı
// önizlemesi derleme zamanında üretilen ortak indeksten
// (data/ibn-arabi/capraz-baglanti-indeksi.json) besleniyor, ontology.js
// bunu SAYFA AÇILIŞINDA yüklüyor -- tek tek görünüm dosyalarının o anda
// yüklenmiş olmasına bağlı değil. cizimler/tasiyicilar/fusus/miskat şimdilik
// dışarıda kalmaya devam ediyor (ayrı bir ölçüm konusu).
//
// VIEWS'teki girişlerin hiçbiri cross-link kaydını SAYFA AÇILIŞINDA
// yapmıyor (doğrulandı), bu yüzden tembel yükleme güvenli.
//
// Yöntem: her görünüm dosyası kendi window.__xApp'ini KOŞULSUZ, TEK bir
// atamayla kurar (doğrulandı -- hiçbiri bir guard'ın arkasında değil). Bu
// script, gerçek dosya yüklenmeden ÖNCE aynı isme bir "vekil" (stub) nesne
// koyar; ontology.js'teki mevcut çağrı noktaları (`window.__sirlarGraphApp
// && window.__sirlarGraphApp.activate()`, `.isFocused()`, `.onLangChange()`,
// siirler.js'in kendi içindeki `.wireTabs()`/`.activate()` zinciri) HİÇBİRİ
// değişmeden çalışmaya devam eder -- vekil, çağrılan her metodu (Proxy ile,
// isim sabit kodlanmadan) yakalayıp script yüklenene kadar kuyruğa alır,
// yüklenince gerçek nesneye iletir.
//
// SRI: aşağıdaki INTEGRITY haritası scripts/sri-guncelle.py tarafından
// otomatik tazelenir (bkz. o dosyadaki guncelle_view_loader()) -- elle
// girilmez, kozmik-loader.js'teki (artık kaldırılmış) aynı desenin devamı.
//
// 2026-10-09 (dalga-web) iki ek:
//  1) HATA KUTUSU: bir görünüm betiği yüklenemezse (ağ, SRI uyuşmazlığı)
//     ya da ilk çağrısında çökerse sahne boş, köşe düğmeleri ölü
//     kalıyordu. Artık o görünümün sarmalayıcısında üç dilde "Bu bölüm
//     yüklenemedi" + çalışan bir "Yeniden dene" (view-status.js
//     showLoadError). Her girişin `wrap` alanı o sarmalayıcıdır.
//  2) GİZLİ KİPLER (@revise / @share): edit-mode + durus-kontrol +
//     tahkik-tarama + share-mode (~79 KB gzip) her ziyaretçiye açılışta
//     iniyordu; neredeyse hiçbiri bu kipleri açmıyor. Artık aşağıdaki
//     KIPLER haritasından, kip İLK istendiğinde (gizli kelime yazılınca,
//     "Görsel kart" düğmesine basılınca ya da @revise önceki oturumda açık
//     bırakıldıysa) iniyor. Gizli kelimeleri tek bir dinleyici yakalıyor;
//     kip betikleri kendi dinleyicilerini yalnız bu yükleyici YOKSA kuruyor
//     (compare.html onları hâlâ statik yüklüyor).
(function () {
  "use strict";

  var VIEWS = {
    __sirlarGraphApp: { src: "assets/sirlar-graph.js", integrity: "sha384-ouXCB20X7JWo/2boAYHLVDCguX9hmKhH90G74+2LJ6BvajKaE0Aqs5vubHCVACJJ", wrap: "sirlar-wrap" },
    __kavramApp: { src: "assets/kavram.js", integrity: "sha384-rICtEh3YCCAH6wqbpP9XzMc8gkbtkfH/yY9XB2lYUVsRFNdO0JI+qf9C0NQso0R8", wrap: "kavram-wrap" },
    __ayetHadisApp: { src: "assets/ayet-hadis.js", integrity: "sha384-gxa8ETsDLw+c2bAgrzbtiNLtw3pJ0OS08OoxoetbUTkAVvKdsNCY5VkkW7ekRT+O", wrap: "ayethadis-wrap" },
    __siirlerApp: { src: "assets/siirler.js", integrity: "sha384-QGD4/eAVmXFOtP8531heWaJMPVV5jEY2oOSskZ+uElAR/ZiAs2/ryFRy6AhjaB19", wrap: "hakkinda-wrap" },
    __vahdetApp: { src: "assets/vahdet.js", integrity: "sha384-yarcIFCWxztTdI7cuGp6KTGIBXdgoBjlkJdf1bfDOLV7iK3a7F6sHp38S4dHWTUa", wrap: "hakkinda-wrap" },
    __okumaYollariApp: { src: "assets/okuma-yollari.js", integrity: "sha384-qryq0WX/wOmcZPu3dyE52OPfqiQJPg0QyPyE6XSnp+oNZl3BWZcf/SeRoxml4s0Q", wrap: "hakkinda-wrap" },
    __neredenBaslamaliApp: { src: "assets/nereden-baslamali.js", integrity: "sha384-vPqdC+rvSMPZhymGwgfZ+Mx2Cf2vNGy6WryflpMGSpQCCGJAne1n9cuRMB3mrbBc", wrap: "hakkinda-wrap" },
    __girisApp: { src: "assets/giris-sayfalari.js", integrity: "sha384-Jm7jYuVnBuOAmjQXwsvhxBWLehKjStUs5uSHn7JwZC5Zju+hKb2CNuRVOjQc1FS1", wrap: "hakkinda-wrap" },
    __bilmiyoruzApp: { src: "assets/bilmiyoruz.js", integrity: "sha384-IfXzWmZ82kpEjWSpiMCCHQ+RvBk80Ci6ynN4oSVcUQvUSicIZPNN/njiz/RJzhi9", wrap: "bilmiyoruz-wrap" },
    __elestiriArkeolojisiApp: { src: "assets/elestiri-arkeolojisi.js", integrity: "sha384-eWgxrR7QCVqOIlpcwbUHQo139efYuzlBYFRf4a0JtA5r2WhV/ILLR901C5VZUhMD", wrap: "elestiri-arkeolojisi-wrap" },
    __hocalarApp: { src: "assets/hocalar.js", integrity: "sha384-ZUg09P+CQfGKPQFH6sLcYbo8cMe41Kh3XqhNu1etnLJpM3LWSB5IMPg4DchLhQ+T", wrap: "hocalar-wrap" },
    __eserAgiApp: { src: "assets/eser-agi.js", integrity: "sha384-xF/I8rHpk1yR2tOWZ/2G6pfevHOJbvfQrsob0eOKxlSkTjsQNuEWXqXPpczAIyUZ", wrap: "eser-agi-wrap" },
    __seyahatAtlasiApp: { src: "assets/seyahat-atlasi.js", integrity: "sha384-eeqvUz9Fftqy4Z7W8sqJcV1mHlNDQ9GIjWRQz7897IHptVqfoNlZgjSAyCNLvkVh", wrap: "seyahat-atlasi-wrap" },
    __yolculukApp: { src: "assets/yolculuk.js", integrity: "sha384-ZJ+W1ohrpGr6oRBiWuYNvtug8ma1vSqcm8S/s7UZ83Ua8u4in5a261v1PgA3SJrc", wrap: "yolculuk-wrap" },
    __kuranDokusuApp: { src: "assets/kuran-dokusu.js", integrity: "sha384-8Bb/1hv9XNViMOrANW2zKA6VsjJn3O8vZlqlMB4NJvcKf309svRpC2faxaWcHaK3", wrap: "kuran-dokusu-wrap" },
    __esmaApp: { src: "assets/esma.js", integrity: "sha384-FJ/zWpVvn5GYoHzsm6X5mFn1InLSdOfx8uy+k2vHue8/eI/sbNb07v4JPsF4RFfR", wrap: "esma-wrap" },
    __halApp: { src: "assets/hal.js", integrity: "sha384-gtASrea8ie31lnjO24iCIJdaj1BONhxkDJfKciRK+2+r9rgKpct8SyN3rNuGi9MW", wrap: "hal-wrap" },
    __terimlerApp: { src: "assets/terimler.js", integrity: "sha384-CJnjbSwU8iz6Fj5ASDmbnzIk6aw7Z+q5jmVDL7ADf/agerwX22Dx8yQ0jKkO5dtg", wrap: "terimler-wrap" },
    __sorularApp: { src: "assets/sorular.js", integrity: "sha384-B73uXjCS6OoZFeCeojmy4RENJpzO2ihjR5kDkRb9tzyq20SAaoUB0j/yovXvWfpK", wrap: "sorular-wrap" },
    __menzillerApp: { src: "assets/menziller.js", integrity: "sha384-PR4lTvb0ECieUAJ8fvDRgV/d8+1ZFd6oGZKkCe/Scbef08KkGUrW4F7agX3KQyUu", wrap: "menziller-wrap" },
    __futuhatApp: { src: "assets/futuhat.js", integrity: "sha384-+cEeGLn77bG5FcQGPN/IZd3bZUtIVP36hwovJAj8WiuHlh/OLWhRNglxbsEsf+vB", wrap: "futuhat-wrap", once: "okuma-yuzeyi" },
    __cizimlerApp: { src: "assets/cizimler.js", integrity: "sha384-nRtAoGfzRdxcsKff/qRHL7sMuBO7WR/cQEbcYc+XEOtITTl6798LcNqPGkvGpDKW", wrap: "cizimler-wrap" },
    __tasiyicilarApp: { src: "assets/tasiyicilar.js", integrity: "sha384-AOP5aDLS2dC8w8sffn6nZaVsbeevPni77ovb5yWgoca5rRLKlPwYZV6ELOvWjuHE", wrap: "tasiyicilar-wrap" },
    __fususApp: { src: "assets/fusus.js", integrity: "sha384-PM2sxwPPWLpk2wGRbxEZXuy+9HvS6qnB9uHeQkSH/2nf82TNRsm+JDbqkeVb8xmy", wrap: "fusus-wrap", once: "okuma-yuzeyi" },
    __miskatApp: { src: "assets/miskat.js", integrity: "sha384-idwHvrQlSn4MmQ2lp4iB2IfsyF2QAWJhqcPa2V2SDFXwB9+qQ5jpblPux9YR6q3b", wrap: "miskat-wrap", once: "okuma-yuzeyi" },
  };

  // Gizli kipler (bkz. dosya başı). Sıra önemsiz; @revise üçünü birlikte ister.
  var KIPLER = {
    "edit-mode": { src: "assets/edit-mode.js", integrity: "sha384-qvrpO+KjKI1YK0H1lSurUukInN1/stgZZFkibMESTzphSNLqRL51+jwdwM3mp1OJ" },
    "durus-kontrol": { src: "assets/durus-kontrol.js", integrity: "sha384-1PmxR3+hl+07fSLr3TRBvdTR8KB5bohyy5bIbVV/MvCejJK40VEZAZOQkk5zmJcz" },
    "tahkik-tarama": { src: "assets/tahkik-tarama.js", integrity: "sha384-xRKL39c70u4As3BIP+Hz3yHEtCb4LIYb6v82X15e4ad+mG2YXEwHJot+Kzs1jsHS" },
    "share-mode": { src: "assets/share-mode.js", integrity: "sha384-OetL6ZzUApIaeF6LIXNsT9ezDbL94Q7Tt+ydLwgqtlJ2X4i+cA9RJrD/suJKs/+o" },
    "geri-bildirim": { src: "assets/geri-bildirim.js", integrity: "sha384-3S1Oj5Et3xHCDE7EZdH3iTZC9QBADEmdIK8c05DpiyCZyYkEIZAnRe90J5RPbIx0" },
  };

  // Üçüncü taraf kitaplıklar (2026-10-10): yalnız gerektiği yerde iner.
  // use-gesture: telefon kabuğunun sürükleme hareketleri (uygulama-kabugu.js;
  // yalnız telefonda / Android uygulamasında istenir). Dosya repoda,
  // scripts/use-gesture-vendor-uret.py üretir (MIT, başlığında lisans).
  var VENDOR = {
    "use-gesture": { src: "assets/vendor/use-gesture.min.js", integrity: "sha384-LhyW3KlzpheznKnMTXB++7tcg1mRN6Ww91GrC18V+sDN0KXSdRGPHXYU79pV6G2j" },
  };

  // Telefonda harita katmanı (2026-10-10, taslak; assets/telefon-haritasi.js):
  // yalnız telefon kabuğu açıkken (html.dost-uygulama) iner -- masaüstünün
  // ilk yükü değişmez. Görünümler kaydını GU.telefonHaritasi kuyruğuna
  // bırakır; katman inince kurulur.
  var TELEFON = { src: "assets/telefon-haritasi.js", integrity: "sha384-CCQ8dgEsQNalLQ0SXA9jMO4LFZRt1Vt7aYWvoiPyBv9WA3So+uURCNS0lcWQ0vQZ" };

  // Okuma yüzeyi (2026-10-15): Fütûhât/Füsûs/Mişkât betiğinden ÖNCE iner
  // (VIEWS[...].once) -- görünümler çizimini bitirince ona haber verir
  // (okuma yeri, "Bu metinde" sayfası, Defterim yıldızı, çubukların çekilmesi).
  var ONCE = {
    "okuma-yuzeyi": { src: "assets/okuma-yuzeyi.js", integrity: "sha384-NQ/RbalHbW8oZxeK7xRekJQHMx7YMYGih+8xwmtgg+UjouTlpv76EGjoYnNLnKqt" },
  };

  var loadingPromises = {};

  function scriptYukle(anahtar, cfg) {
    if (loadingPromises[anahtar]) return loadingPromises[anahtar];
    loadingPromises[anahtar] = new Promise(function (resolve, reject) {
      var el = document.createElement("script");
      el.src = new URL(cfg.src, document.baseURI).href;
      if (cfg.integrity) el.integrity = cfg.integrity;
      el.onload = function () { resolve(); };
      el.onerror = function () {
        delete loadingPromises[anahtar];
        el.remove();
        var hata = new Error("view-loader: " + cfg.src + " yüklenemedi");
        hata.betikYuklemeHatasi = cfg.src; // hataGoster: bağlantı mı, SRI/404 mü ayırt etsin
        reject(hata);
      };
      document.body.appendChild(el);
    });
    return loadingPromises[anahtar];
  }

  function loadScript(globalName) {
    var cfg = VIEWS[globalName];
    var once = cfg.once && ONCE[cfg.once]
      ? scriptYukle("once:" + cfg.once, ONCE[cfg.once]).catch(function (e) { console.warn(e); })
      : Promise.resolve();
    return once.then(function () { return scriptYukle(globalName, cfg); });
  }
  function kipYukle(ad) { return scriptYukle("kip:" + ad, KIPLER[ad]); }
  (function telefonHaritasiIndir() {
    var html = document.documentElement;
    function dene() {
      if (!html.classList.contains("dost-uygulama")) return false;
      scriptYukle("telefon-haritasi", TELEFON).catch(function (e) { console.warn(e); });
      return true;
    }
    if (dene()) return;
    var mo = new MutationObserver(function () { if (dene()) mo.disconnect(); });
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
  })();
  window.__dostVendorYukle = function (ad) {
    return VENDOR[ad] ? scriptYukle("vendor:" + ad, VENDOR[ad]) : Promise.reject(new Error("view-loader: bilinmeyen kitaplık " + ad));
  };

  // --- Görünüm betiklerini çevrimdışı için önceden indir (2026-10-15, S-01) ---
  // Bu dosyadaki görünüm betikleri bölüm ilk açılınca iner; Service Worker
  // kabuğu onları içermiyordu, bu yüzden yalnız ana sayfa görülmüş cihazda
  // çevrimdışıyken her bölüm açılmıyordu. Sayfa yüklendikten ve boşta
  // kaldıktan sonra, bu listeyi (src + integrity) Service Worker'a gönderiyoruz;
  // o da sürüm önbelleğine, integrity doğrulamasıyla indiriyor (sw.js,
  // goruntuBetikleriniOnbellegeAl). Koşullar -- veri sorumluluğu:
  //  - veri tasarrufu (saveData) açıksa ya da bağlantı 3g ve altıysa hiç;
  //  - mobil veri (connection.type = cellular) ise yalnız yeniden gelen
  //    kullanıcıda (üçüncü yükleme ve sonrası); wifi/ethernet/bilinmeyen
  //    bağlantıda ilk boşta anında;
  //  - sekme görünür değilse bekler.
  // Gizli kipler (KIPLER) listeye girmez: yalnız yazar kullanır.
  (function goruntulerOnbellege() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    var gonderildi = false, bekliyor = false;
    function ziyaretSayisi() {
      try {
        var n = (+localStorage.getItem("dost-onbellek-ziyaret") || 0) + 1;
        localStorage.setItem("dost-onbellek-ziyaret", String(n));
        return n;
      } catch (e) { return 99; }
    }
    var ziyaret = ziyaretSayisi();
    function uygunMu() {
      var c = navigator.connection;
      if (!c) return true;
      if (c.saveData) return false;
      if (/^(slow-2g|2g|3g)$/.test(c.effectiveType || "")) return false;
      if (c.type === "cellular" && ziyaret < 3) return false;
      return true;
    }
    function gonder() {
      bekliyor = false;
      if (gonderildi) return;
      if (document.hidden) return;   // görünür olunca visibilitychange yeniden dener
      if (!uygunMu()) return;
      navigator.serviceWorker.ready.then(function (reg) {
        var sw = reg && reg.active;
        if (!sw) return;
        gonderildi = true;
        sw.postMessage({
          tip: "goruntu-betikleri",
          // Görünüm betikleri + onlardan önce inen ön betikler (ONCE: okuma
          // yüzeyi); yeni bir VIEWS/ONCE girişi kendiliğinden listeye katılır.
          liste: Object.keys(VIEWS).map(function (k) { return VIEWS[k]; })
            .concat(Object.keys(ONCE).map(function (k) { return ONCE[k]; }))
            .map(function (c) {
              return { src: new URL(c.src, document.baseURI).href, integrity: c.integrity };
            }),
        });
      }).catch(function () {});
    }
    function bekle() {
      if (gonderildi || bekliyor) return;
      bekliyor = true;
      var calis = function () { setTimeout(gonder, 3000); };
      if (window.requestIdleCallback) window.requestIdleCallback(calis, { timeout: 12000 });
      else setTimeout(calis, 4000);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) bekle(); });
    if (document.readyState === "complete") bekle();
    else window.addEventListener("load", bekle, { once: true });
  })();

  // --- Gizli kipler ---------------------------------------------------
  window.__dostKipYukleyici = true;

  function reviseYukle() {
    return Promise.all([kipYukle("edit-mode"), kipYukle("durus-kontrol"), kipYukle("tahkik-tarama")]);
  }
  function kipHatasi(ad, err) {
    console.error("view-loader: " + ad + " kipi yüklenemedi --", err);
  }

  // Geliştirici modu (2026-10-17, "Sorun bildir"): localStorage["dost-gelistirici"]
  // === "1". Açılış: adreste ?gelistirici=1 (kapatma: =0) ya da ⋮ Ayarlar
  // sayfasındaki sürüm satırına 7 dokunuş (uygulama-kabugu.js, degistir()).
  // Mod KAPALIYKEN yalnız bu satırlar çalışır: betik inmez, dinleyici yok, ağ yok.
  // Açıkken assets/geri-bildirim.js (olay tamponu + rapor sayfası) iner.
  var GEL = "dost-gelistirici", gelBellek = false;
  function gelAcikMi() { try { return localStorage.getItem(GEL) === "1"; } catch (e) { return gelBellek; } }
  // html.dost-gel: yalnız geliştirici modunda görünen düğmelerin (Yazdır,
  // Görsel kart) CSS kapısı; ilk boyamadan önce index.html başındaki betik de koyar.
  function gelSinif() { document.documentElement.classList.toggle("dost-gel", gelAcikMi()); }
  function gelYaz(ac) {
    gelBellek = ac;
    try { if (ac) localStorage.setItem(GEL, "1"); else localStorage.removeItem(GEL); } catch (e) { /* depo kapalı: oturumluk */ }
    gelSinif();
  }
  function gelYukle() {
    return kipYukle("geri-bildirim").then(function () {
      if (window.__dostGeriBildirim) window.__dostGeriBildirim.baslat();
    }, function (e) { kipHatasi("geri-bildirim", e); });
  }
  window.__dostGelistirici = {
    acikMi: gelAcikMi,
    yukle: gelYukle,
    degistir: function () {
      var ac = !gelAcikMi();
      gelYaz(ac);
      if (ac) gelYukle(); else if (window.__dostGeriBildirim) window.__dostGeriBildirim.durdur();
      return ac;
    },
  };
  (function () {
    var m = /(?:^|[?&])gelistirici=([01])(?:&|$)/.exec(location.search);
    if (m) gelYaz(m[1] === "1");
    gelSinif();
    if (gelAcikMi()) gelYukle();
  })();

  // @revise önceki oturumda açık bırakıldıysa (edit-mode.js sayfayı
  // yeniden yükleyerek kipi korur) kip betikleri hemen iner; gövde sınıfı
  // beklemeden konur ki ilk çizimler (Fütûhât ölçüm panosu gibi) kipi görsün.
  try {
    if (localStorage.getItem("dost-edit-mode-on") === "1") {
      if (document.body) document.body.classList.add("dost-edit-mode");
      reviseYukle().catch(function (e) { kipHatasi("@revise", e); });
    }
  } catch (e) { /* localStorage kapalı */ }

  // Telefon ve klavyesiz iPad girişleri (2026-10-09): "#revise" adresi ve
  // ☰ düğmesine 700 ms uzun basma. edit-mode.js inince bu girişleri kendisi
  // dinliyor; burada yalnız betik henüz inmemişken ilk dokunuş yakalanır.
  function reviseHash() {
    if (window.__dostEditMode || !/^#revise$/i.test(location.hash)) return;
    reviseYukle().catch(function (e) { kipHatasi("@revise", e); });
  }
  reviseHash();
  window.addEventListener("hashchange", reviseHash);
  var UZUN_SECICI = "#nav-toggle, .app-header__title";
  var uzunZaman = null, uzunX = 0, uzunY = 0, tikYut = false;
  function uzunIptal() { clearTimeout(uzunZaman); uzunZaman = null; }
  document.addEventListener("pointerdown", function (e) {
    if (window.__dostEditMode) return;
    var h = e.target.closest && e.target.closest(UZUN_SECICI);
    if (!h || e.button !== 0) return;
    uzunX = e.clientX; uzunY = e.clientY;
    clearTimeout(uzunZaman);
    uzunZaman = setTimeout(function () {
      uzunZaman = null;
      tikYut = true;
      setTimeout(function () { tikYut = false; }, 900);
      reviseYukle().then(function () {
        if (window.__dostEditMode) window.__dostEditMode.toggle();
      }).catch(function (err) { kipHatasi("@revise", err); });
    }, 700);
  }, true);
  document.addEventListener("pointermove", function (e) {
    if (uzunZaman && (Math.abs(e.clientX - uzunX) > 10 || Math.abs(e.clientY - uzunY) > 10)) uzunIptal();
  }, true);
  document.addEventListener("pointerup", uzunIptal, true);
  document.addEventListener("pointercancel", uzunIptal, true);
  document.addEventListener("click", function (e) {
    if (!tikYut || !(e.target.closest && e.target.closest(UZUN_SECICI))) return;
    tikYut = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);

  // "Görsel kart" düğmesi (ontology.js) ve @share aynı paneli açar: ilk
  // çağrıda betik iner, sonra gerçek nesne bu vekilin yerine geçer.
  var paylasVekil = {};
  ["open", "close", "toggle"].forEach(function (yontem) {
    paylasVekil[yontem] = function () {
      return kipYukle("share-mode").then(function () {
        var gercek = window.__dostShare;
        if (gercek && gercek !== paylasVekil && typeof gercek[yontem] === "function") gercek[yontem]();
      }).catch(function (e) { kipHatasi("@share", e); });
    };
  });
  if (!window.__dostShare) window.__dostShare = paylasVekil;

  // Gizli kelimeler -- edit-mode.js/share-mode.js'teki dinleyicilerin
  // birebir kuralı: tek tuş, Meta yok, AltGr (Ctrl+Alt) serbest; metin
  // kutusunda yazılmaz (@share contenteditable'da da yazılmaz -- düzenlenen
  // metnin içinde "@revise" yazmak kipi kapatabilmeli, @share değil).
  var tampon = "";
  window.addEventListener("keydown", function (e) {
    if (!e.key || e.key.length !== 1) return;
    if (e.metaKey) return;
    if ((e.ctrlKey || e.altKey) && !(e.ctrlKey && e.altKey)) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    tampon = (tampon + e.key.toLowerCase()).slice(-7);
    if (tampon.slice(-7) === "@revise") {
      tampon = "";
      reviseYukle().then(function () {
        if (window.__dostEditMode) window.__dostEditMode.toggle();
      }).catch(function (err) { kipHatasi("@revise", err); });
    } else if (tampon.slice(-6) === "@share" && !(t && t.isContentEditable)) {
      tampon = "";
      // @share yalnız geliştirici modunda (2026-10-18, kullanıcı notu #4).
      if (gelAcikMi()) window.__dostShare.toggle();
    }
  });

  // --- Görünüm vekilleri ----------------------------------------------
  // Proxy yoksa (çok eski bir tarayıcı) vekil kurulmuyor -- o durumda mevcut
  // `window.__xApp && ...` guard'ları zaten no-op olarak sessizce atlar,
  // görünüm hiç açılmaz.
  if (typeof Proxy === "undefined") return;

  // Çevrimdışı mı? (2026-10-15, S-01) Betik yüklenemediyse sebep çoğu zaman
  // bağlantıdır; ama navigator.onLine her durumu yakalamaz (arayüz açık, sunucu
  // ulaşılmaz: uçak modu dışındaki kesintiler). Bu yüzden betik hatasında
  // ayrıca küçük bir HEAD yoklaması yapılır: ağ hatası (fetch reddi) = bağlantı
  // yok; sunucu yanıt veriyorsa hata SRI/404 gibi başka bir şeydir ve genel
  // "yüklenemedi" metni kalır. Service Worker yalnız GET'i yakalar, HEAD
  // doğrudan ağa gider.
  function cevrimdisiMi(err, cfg) {
    if (navigator.onLine === false) return Promise.resolve(true);
    if (!err || !err.betikYuklemeHatasi || !window.fetch) return Promise.resolve(false);
    return fetch(new URL(cfg.src, document.baseURI).href, { method: "HEAD", cache: "no-store" })
      .then(function () { return false; }, function () { return true; });
  }

  function hataGoster(globalName, prop, args, err) {
    console.error("view-loader: " + globalName + "." + prop + "() çalıştırılamadı --", err);
    var cfg = VIEWS[globalName];
    if (!cfg || !window.DostViewStatus) return;
    cevrimdisiMi(err, cfg).then(function (cevrimdisi) {
      window.DostViewStatus.showLoadError(cfg.wrap, function () {
        cagir(globalName, prop, args);
      }, { cevrimdisi: cevrimdisi });
    });
  }

  // Yüklenen gerçek nesnenin yöntemleri bir kez sarılır: sonraki bir
  // çağrıda çökerse de aynı kutu çıkar (vekil yalnız İLK çağrıları görür,
  // sonra gerçek nesne doğrudan çağrılıyor).
  function sar(globalName, real) {
    if (!real || real.__dostSarili) return;
    try { Object.defineProperty(real, "__dostSarili", { value: true }); } catch (e) { return; }
    Object.keys(real).forEach(function (k) {
      var fn = real[k];
      if (typeof fn !== "function") return;
      real[k] = function () {
        try {
          var sonuc = fn.apply(this, arguments);
          if (sonuc && typeof sonuc.then === "function" && typeof sonuc.catch === "function") {
            var args = arguments;
            sonuc.catch(function (err) { hataGoster(globalName, k, args, err); });
          }
          return sonuc;
        } catch (err) {
          hataGoster(globalName, k, arguments, err);
        }
      };
    });
  }

  var vekiller = {};

  function cagir(globalName, prop, args) {
    var cfg = VIEWS[globalName];
    return loadScript(globalName)
      .then(function () {
        var real = window[globalName];
        if (!real || real === vekiller[globalName]) {
          // Betik indi ama kendi nesnesini kuramadan çöktü.
          throw new Error(cfg.src + " yüklendi ama görünüm kurulamadı");
        }
        sar(globalName, real);
        if (window.DostViewStatus) {
          var durum = document.getElementById(cfg.wrap + "-status");
          if (durum && durum.classList.contains("view-status--error")) window.DostViewStatus.hide(cfg.wrap);
        }
        if (typeof real[prop] === "function") return real[prop].apply(real, args);
      })
      .catch(function (err) { hataGoster(globalName, prop, args, err); });
  }

  Object.keys(VIEWS).forEach(function (globalName) {
    vekiller[globalName] = new Proxy(
      {},
      {
        get: function (_target, prop) {
          if (typeof prop !== "string") return undefined;
          return function () { return cagir(globalName, prop, arguments); };
        },
      }
    );
    window[globalName] = vekiller[globalName];
  });
})();
