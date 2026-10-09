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
(function () {
  "use strict";

  var VIEWS = {
    __sirlarGraphApp: { src: "assets/sirlar-graph.js", integrity: "sha384-d/pfQ1KDF0+DZgfVCzE+lZbVvHmp7zipqtzPRsvlawv/Kh+AUagLWl6LwVG6QTrP" },
    __kavramApp: { src: "assets/kavram.js", integrity: "sha384-JM9UDx1ZAt8gHLZM7y9DyzyRNKO8LXv8bg7bmf9VNhbOdFNbILzvEwXqVea89LkF" },
    __ayetHadisApp: { src: "assets/ayet-hadis.js", integrity: "sha384-VnDFtGGR+nijTGvvnIwebT8G0opVm4f7QnL04kFwDxGrxqYmWq4RCGIYko1Jg0gl" },
    __siirlerApp: { src: "assets/siirler.js", integrity: "sha384-3DAmRScI+L9wWXXhl7hJ+vPPOCivyCDlNFjOkGi+POHuSA/16/KYsSWuqWgoKJ/9" },
    __vahdetApp: { src: "assets/vahdet.js", integrity: "sha384-0rJbqChXtTiUMn1Rmhpu4aGkenqDUd/em73w7zgNq7d+z59Gp0ZkSY541ktt104J" },
    __okumaYollariApp: { src: "assets/okuma-yollari.js", integrity: "sha384-WVd8Tqt6ZBDLetnvyT9kYtJxL1DM56TU45COH8rhEf2/W4/XrtkYPrJPPRphujEn" },
    __neredenBaslamaliApp: { src: "assets/nereden-baslamali.js", integrity: "sha384-yDtO/XYSNvn8Pdmncj6PbBcRtcFwXHCYduLifAcnm764wmD5VDT4msgSMHvrPk+C" },
    __bilmiyoruzApp: { src: "assets/bilmiyoruz.js", integrity: "sha384-SJrivBOAaNbhGcHmP5F/78ZdeZ6ptOse1Z56SIHJX9cXXlUo/Il6a4EpusVmQFnu" },
    __elestiriArkeolojisiApp: { src: "assets/elestiri-arkeolojisi.js", integrity: "sha384-KLYyS/GPKxkWOjjvljNjEQC1i1/fi3AJvApMSr9ZkmwLxCMvnRgNPGRMStwPgMZM" },
    __hocalarApp: { src: "assets/hocalar.js", integrity: "sha384-ZUg09P+CQfGKPQFH6sLcYbo8cMe41Kh3XqhNu1etnLJpM3LWSB5IMPg4DchLhQ+T" },
    __eserAgiApp: { src: "assets/eser-agi.js", integrity: "sha384-ziHcfuhv8Ezavd6RX2l3nt6AvnUanw+InQdnGxA82OOmgilcTWW3AwomYa6psmZ4" },
    __seyahatAtlasiApp: { src: "assets/seyahat-atlasi.js", integrity: "sha384-r3AN66Afehf3Q4HDyRj+segIh2g9+XzCTOWnGhbK/greuc10ATqTz7Fe8E91S+D+" },
    __yolculukApp: { src: "assets/yolculuk.js", integrity: "sha384-s804lnhKR0JbMDGeAF5V6Zd0zx+E9mwvNnun1pOadgt5XmFqk0GYGyt8F7CKE5Af" },
    __kuranDokusuApp: { src: "assets/kuran-dokusu.js", integrity: "sha384-V/5Zhf1HESUHp45vXG9VlBL86cpm+25FTz0Hx5yIbnNdvAwirXd/pyOGt6cdSZWI" },
    __esmaApp: { src: "assets/esma.js", integrity: "sha384-8THn8Z/YTXp52BTIbOSLhw37R8z0NeHHHnMLUneolcI8SO8Eueg1DHlQOQebWA+D" },
    __halApp: { src: "assets/hal.js", integrity: "sha384-t8AD8n9DYK/pbZrtfiLh+QgzrjuRXVM98/NEgG89kApnXFsfATPoVBPZ0Gg8v83Z" },
    __terimlerApp: { src: "assets/terimler.js", integrity: "sha384-N8KLmXh5PCg162jkPdlyycR2+tgZ3ZGdfFHCU5U/+iHANNHHouekAuvzsBy/laRE" },
    __sorularApp: { src: "assets/sorular.js", integrity: "sha384-lVJh04U0jAffn9074G6L0J+cVAE6RLuILGerYfFDG+uU+F3zxm5BOhQ2XAp1x+xJ" },
    __menzillerApp: { src: "assets/menziller.js", integrity: "sha384-XmbPJLpajg/wEQ0WldsOa30qZfM82sPKhBSTJfpSxM1gbz68qAMp7rj8NP8ni/y4" },
    __futuhatApp: { src: "assets/futuhat.js", integrity: "sha384-EtlMAd2pr7sr92ZOnLukGZJCDG1Sn734MF0BvSmOMfVR1GiX1tTZkhOByJThpM2g" },
    __cizimlerApp: { src: "assets/cizimler.js", integrity: "sha384-5WXDFmmMhVmnZQoPtKF0jt4Pby5/U+XvY8u+K2qE5qUAvyQmY5pXUN7O8BoDMT7z" },
    __tasiyicilarApp: { src: "assets/tasiyicilar.js", integrity: "sha384-QgCqx0oiM2uUWN4NfoO0RYMw9Vl1crt43kzKE4JzgG9To7+0U7bsNrmm3BAG5MVn" },
    __fususApp: { src: "assets/fusus.js", integrity: "sha384-2SrHMCzaC2Yh6P2U9BH7c0XSsMVXP3qMd16VlW2cxadcLzS5W3X1Ssvbc7tphUS2" },
    __miskatApp: { src: "assets/miskat.js", integrity: "sha384-meq3Aj4Y76hI8WH46FHXzDLZFpEQEd+lxHU5snMqxQDWGjWosc1is+A7zeYkJfJn" },
  };

  var loadingPromises = {};

  function loadScript(globalName) {
    if (loadingPromises[globalName]) return loadingPromises[globalName];
    var cfg = VIEWS[globalName];
    loadingPromises[globalName] = new Promise(function (resolve, reject) {
      var el = document.createElement("script");
      el.src = new URL(cfg.src, document.baseURI).href;
      el.integrity = cfg.integrity;
      el.onload = function () { resolve(); };
      el.onerror = function () {
        delete loadingPromises[globalName];
        reject(new Error("view-loader: " + cfg.src + " yüklenemedi"));
      };
      document.body.appendChild(el);
    });
    return loadingPromises[globalName];
  }

  // Proxy yoksa (çok eski bir tarayıcı) vekil kurulmuyor -- o durumda mevcut
  // `window.__xApp && ...` guard'ları zaten no-op olarak sessizce atlar,
  // görünüm hiç açılmaz. Bu yeni bir risk değil: aynı guard, bugün de dosya
  // yüklenemediğinde (ağ hatası) aynı şekilde sessizce atlıyordu.
  if (typeof Proxy === "undefined") return;

  Object.keys(VIEWS).forEach(function (globalName) {
    window[globalName] = new Proxy(
      {},
      {
        get: function (_target, prop) {
          if (typeof prop !== "string") return undefined;
          return function () {
            var args = arguments;
            return loadScript(globalName)
              .then(function () {
                var real = window[globalName];
                if (real && typeof real[prop] === "function") {
                  return real[prop].apply(real, args);
                }
              })
              .catch(function (err) {
                console.error(
                  "view-loader: " + globalName + "." + prop + "() çalıştırılamadı --",
                  err
                );
              });
          };
        },
      }
    );
  });
})();
