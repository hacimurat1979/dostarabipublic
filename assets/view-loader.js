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
    __sirlarGraphApp: { src: "assets/sirlar-graph.js", integrity: "sha384-HZJfV5UjNsG518yhfSPLkHgED+Eo4SCN9p0zD8FZGsxx/TkIkZx7vJTS9DjMCRy8", wrap: "sirlar-wrap" },
    __kavramApp: { src: "assets/kavram.js", integrity: "sha384-NZMZVkkFoPeOiG0CQ0/Kzenw673YxOl6NI93jqKe4nNBzGL6CKeQqlye+2U81Gwg", wrap: "kavram-wrap" },
    __ayetHadisApp: { src: "assets/ayet-hadis.js", integrity: "sha384-MfmDEpi64jN/oXKLLf+i1c+UYHj2uCZ6v/DGrlvnB5zxGz0grbr62iVQ1/TsXH/b", wrap: "ayethadis-wrap" },
    __siirlerApp: { src: "assets/siirler.js", integrity: "sha384-3DAmRScI+L9wWXXhl7hJ+vPPOCivyCDlNFjOkGi+POHuSA/16/KYsSWuqWgoKJ/9", wrap: "hakkinda-wrap" },
    __vahdetApp: { src: "assets/vahdet.js", integrity: "sha384-0rJbqChXtTiUMn1Rmhpu4aGkenqDUd/em73w7zgNq7d+z59Gp0ZkSY541ktt104J", wrap: "hakkinda-wrap" },
    __okumaYollariApp: { src: "assets/okuma-yollari.js", integrity: "sha384-WVd8Tqt6ZBDLetnvyT9kYtJxL1DM56TU45COH8rhEf2/W4/XrtkYPrJPPRphujEn", wrap: "hakkinda-wrap" },
    __neredenBaslamaliApp: { src: "assets/nereden-baslamali.js", integrity: "sha384-yDtO/XYSNvn8Pdmncj6PbBcRtcFwXHCYduLifAcnm764wmD5VDT4msgSMHvrPk+C", wrap: "hakkinda-wrap" },
    __bilmiyoruzApp: { src: "assets/bilmiyoruz.js", integrity: "sha384-SJrivBOAaNbhGcHmP5F/78ZdeZ6ptOse1Z56SIHJX9cXXlUo/Il6a4EpusVmQFnu", wrap: "bilmiyoruz-wrap" },
    __elestiriArkeolojisiApp: { src: "assets/elestiri-arkeolojisi.js", integrity: "sha384-KLYyS/GPKxkWOjjvljNjEQC1i1/fi3AJvApMSr9ZkmwLxCMvnRgNPGRMStwPgMZM", wrap: "elestiri-arkeolojisi-wrap" },
    __hocalarApp: { src: "assets/hocalar.js", integrity: "sha384-ZUg09P+CQfGKPQFH6sLcYbo8cMe41Kh3XqhNu1etnLJpM3LWSB5IMPg4DchLhQ+T", wrap: "hocalar-wrap" },
    __eserAgiApp: { src: "assets/eser-agi.js", integrity: "sha384-ziHcfuhv8Ezavd6RX2l3nt6AvnUanw+InQdnGxA82OOmgilcTWW3AwomYa6psmZ4", wrap: "eser-agi-wrap" },
    __seyahatAtlasiApp: { src: "assets/seyahat-atlasi.js", integrity: "sha384-r3AN66Afehf3Q4HDyRj+segIh2g9+XzCTOWnGhbK/greuc10ATqTz7Fe8E91S+D+", wrap: "seyahat-atlasi-wrap" },
    __yolculukApp: { src: "assets/yolculuk.js", integrity: "sha384-s804lnhKR0JbMDGeAF5V6Zd0zx+E9mwvNnun1pOadgt5XmFqk0GYGyt8F7CKE5Af", wrap: "yolculuk-wrap" },
    __kuranDokusuApp: { src: "assets/kuran-dokusu.js", integrity: "sha384-V/5Zhf1HESUHp45vXG9VlBL86cpm+25FTz0Hx5yIbnNdvAwirXd/pyOGt6cdSZWI", wrap: "kuran-dokusu-wrap" },
    __esmaApp: { src: "assets/esma.js", integrity: "sha384-8THn8Z/YTXp52BTIbOSLhw37R8z0NeHHHnMLUneolcI8SO8Eueg1DHlQOQebWA+D", wrap: "esma-wrap" },
    __halApp: { src: "assets/hal.js", integrity: "sha384-t8AD8n9DYK/pbZrtfiLh+QgzrjuRXVM98/NEgG89kApnXFsfATPoVBPZ0Gg8v83Z", wrap: "hal-wrap" },
    __terimlerApp: { src: "assets/terimler.js", integrity: "sha384-N8KLmXh5PCg162jkPdlyycR2+tgZ3ZGdfFHCU5U/+iHANNHHouekAuvzsBy/laRE", wrap: "terimler-wrap" },
    __sorularApp: { src: "assets/sorular.js", integrity: "sha384-t3yALi/sw4VvyMIwJo7gvQikZcGfDHhxTtXTh11A14nI0DR608kbbl9GttTBEsHg", wrap: "sorular-wrap" },
    __menzillerApp: { src: "assets/menziller.js", integrity: "sha384-IBMPVlLDuBIh7F55A9xpr2YS6TU+Zrwg5VBZrqO7y/sIi+yE9X7V6vi/zXBq9Md0", wrap: "menziller-wrap" },
    __futuhatApp: { src: "assets/futuhat.js", integrity: "sha384-SG/majcNhdx5Wuajpfy5E3cRjbTt9zRJLg9y9DccO+a4PtQwYmO5aFGyS7G05+1w", wrap: "futuhat-wrap" },
    __cizimlerApp: { src: "assets/cizimler.js", integrity: "sha384-5WXDFmmMhVmnZQoPtKF0jt4Pby5/U+XvY8u+K2qE5qUAvyQmY5pXUN7O8BoDMT7z", wrap: "cizimler-wrap" },
    __tasiyicilarApp: { src: "assets/tasiyicilar.js", integrity: "sha384-WHMiHe51h+RtW/DOCkKXKVQvnq+mhgX1Pzf15WRG3TTkAUXyGFT+LqASnnVeCWXq", wrap: "tasiyicilar-wrap" },
    __fususApp: { src: "assets/fusus.js", integrity: "sha384-Jv67WvOP6Vzl3Ey63gSAqRWKN8sjFWbAcWzysLbBWT9EPMJpTUK9/PtYJuSHUTQa", wrap: "fusus-wrap" },
    __miskatApp: { src: "assets/miskat.js", integrity: "sha384-NOh8ENdLDzKmI6fBUX+BISoeHA/dOxmgjATHQp21MKJV0laZe5oDntVOpkUPa/SK", wrap: "miskat-wrap" },
  };

  // Gizli kipler (bkz. dosya başı). Sıra önemsiz; @revise üçünü birlikte ister.
  var KIPLER = {
    "edit-mode": { src: "assets/edit-mode.js", integrity: "sha384-GKynyc6JFRWfznolredYoBc892ZkAi5+Am/2M9ioPYF8pvwc3BVD4z71jILMU2cE" },
    "durus-kontrol": { src: "assets/durus-kontrol.js", integrity: "sha384-Ils69HDB9I+FwCAmd78cZogJbzCDkSInA96ULy6QP1Mx3L+deUntKkER6JUyJQe9" },
    "tahkik-tarama": { src: "assets/tahkik-tarama.js", integrity: "sha384-xRKL39c70u4As3BIP+Hz3yHEtCb4LIYb6v82X15e4ad+mG2YXEwHJot+Kzs1jsHS" },
    "share-mode": { src: "assets/share-mode.js", integrity: "sha384-L4hxQr91esbod70wRrNzaRgn6yGwBH0eZRnZsdzZimpo4CpzLqXhUCOKNIuKQ94B" },
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
        reject(new Error("view-loader: " + cfg.src + " yüklenemedi"));
      };
      document.body.appendChild(el);
    });
    return loadingPromises[anahtar];
  }

  function loadScript(globalName) { return scriptYukle(globalName, VIEWS[globalName]); }
  function kipYukle(ad) { return scriptYukle("kip:" + ad, KIPLER[ad]); }

  // --- Gizli kipler ---------------------------------------------------
  window.__dostKipYukleyici = true;

  function reviseYukle() {
    return Promise.all([kipYukle("edit-mode"), kipYukle("durus-kontrol"), kipYukle("tahkik-tarama")]);
  }
  function kipHatasi(ad, err) {
    console.error("view-loader: " + ad + " kipi yüklenemedi --", err);
  }

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
      window.__dostShare.toggle();
    }
  });

  // --- Görünüm vekilleri ----------------------------------------------
  // Proxy yoksa (çok eski bir tarayıcı) vekil kurulmuyor -- o durumda mevcut
  // `window.__xApp && ...` guard'ları zaten no-op olarak sessizce atlar,
  // görünüm hiç açılmaz.
  if (typeof Proxy === "undefined") return;

  function hataGoster(globalName, prop, args, err) {
    console.error("view-loader: " + globalName + "." + prop + "() çalıştırılamadı --", err);
    var cfg = VIEWS[globalName];
    if (!cfg || !window.DostViewStatus) return;
    window.DostViewStatus.showLoadError(cfg.wrap, function () {
      cagir(globalName, prop, args);
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
