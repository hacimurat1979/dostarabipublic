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
    __sirlarGraphApp: { src: "assets/sirlar-graph.js", integrity: "sha384-8h9YsrH/cpSprPvVFssdNAWMUNXuTEY9f2gyGFbBHJHtUJK0zlq3Vf9nMFG5A1hh" },
    __kavramApp: { src: "assets/kavram.js", integrity: "sha384-isR8+BDmByjR74Au/PblgxnW3tz1bUzKmo7YmMFulzDxckXZucGZtlyuGhz0gl0R" },
    __ayetHadisApp: { src: "assets/ayet-hadis.js", integrity: "sha384-nIFZDSqrBwHlvPJqtVx/Jgr+P4JtIuJki94cVcIk2Zhk+8d6D9HaiOFUE3f80zIB" },
    __siirlerApp: { src: "assets/siirler.js", integrity: "sha384-3DAmRScI+L9wWXXhl7hJ+vPPOCivyCDlNFjOkGi+POHuSA/16/KYsSWuqWgoKJ/9" },
    __vahdetApp: { src: "assets/vahdet.js", integrity: "sha384-0rJbqChXtTiUMn1Rmhpu4aGkenqDUd/em73w7zgNq7d+z59Gp0ZkSY541ktt104J" },
    __okumaYollariApp: { src: "assets/okuma-yollari.js", integrity: "sha384-f3AwGIN00ENzTIgo4xzB1bgSzYoqz0VsDiHFCA63q4mDpaEHg1fMRVfCESArkdzL" },
    __neredenBaslamaliApp: { src: "assets/nereden-baslamali.js", integrity: "sha384-yDtO/XYSNvn8Pdmncj6PbBcRtcFwXHCYduLifAcnm764wmD5VDT4msgSMHvrPk+C" },
    __bilmiyoruzApp: { src: "assets/bilmiyoruz.js", integrity: "sha384-4Ub3QqhV1mlCJ0zKJjEwqHCRVZFdL4wKRm+lT8SoV0ffggs3mWgCXJeASBQZl6i0" },
    __elestiriArkeolojisiApp: { src: "assets/elestiri-arkeolojisi.js", integrity: "sha384-bwyRYH8CUwUm51iwWBt3Sf6ulKSLh849AMmR5nNSZf3PyT39YvgZ3tXz/3xc4LgP" },
    __hocalarApp: { src: "assets/hocalar.js", integrity: "sha384-zcLam01u2hhsitjOxEAy74Z1eR36QELGCdHPTDa+IFekZtCvSZvQ06F0nuqSUnEK" },
    __eserAgiApp: { src: "assets/eser-agi.js", integrity: "sha384-57omR3wjoY3rD1vTnKv/z5KlRrSjO9IDcjxInujlN7wjAISFF5VIVEWvAn08F9vV" },
    __seyahatAtlasiApp: { src: "assets/seyahat-atlasi.js", integrity: "sha384-Bk6WbhSF/3MwwuTDCJ/kl9Oelf18XuCGsfs+hLXiUSNsX8LRzchrQp9swqZR7Cb3" },
    __yolculukApp: { src: "assets/yolculuk.js", integrity: "sha384-d0qOIuoaObPy0KCEoPs3FmhhyAPpDDmiyHUNFhmCURMr/77ZHa6lk40GJkOb7iMl" },
    __kuranDokusuApp: { src: "assets/kuran-dokusu.js", integrity: "sha384-oidFJfgo+xoAz+O7Bbd6B8dvvi7onts6hQrS9QUbJ6KlizRcMxipsiysamiWtf39" },
    __esmaApp: { src: "assets/esma.js", integrity: "sha384-OuufBtEfCPynjF0J+/ZhfSY8o+6y5GRrZB+Iqu8xutAoMj0I2KwaV43t2azkNTTC" },
    __halApp: { src: "assets/hal.js", integrity: "sha384-YdxWRxvIA3qXV5yAe88uqqr59DGxwbzwhEjfHxQjVhMW6kLK06IvRwW889OC7eH+" },
    __terimlerApp: { src: "assets/terimler.js", integrity: "sha384-EkYHOIbKwBYabAD+POgeHhhL9ap0fdCVdIPy8ZQffRycbJ6kC60xJ70uo31xkG4o" },
    __sorularApp: { src: "assets/sorular.js", integrity: "sha384-qR1nE0iuMglkMgOf0Upeb8YFlV50vvA/OiBEPu+rJ6HkSri0ZFJdferZnCRc12tt" },
    __menzillerApp: { src: "assets/menziller.js", integrity: "sha384-3dUE367vrmKaiVDqDvG/cKXSOsQDDYlbgcD+dX6GId4tPsDRGXw9DsR3UdiQhPl6" },
    __futuhatApp: { src: "assets/futuhat.js", integrity: "sha384-OMZfnjrYyh4HjK9pOTRB80g/ojWt3BIX9kuIrIDrwKN8y6ZuuudKnHznXtYGXGW3" },
    __cizimlerApp: { src: "assets/cizimler.js", integrity: "sha384-mt0ikh8D/Yuo0BC0WYDpGHMSt7hFl/KgK7G4lRfmNRFvogaRqkHnZIkYhOOWhqJO" },
    __tasiyicilarApp: { src: "assets/tasiyicilar.js", integrity: "sha384-QgCqx0oiM2uUWN4NfoO0RYMw9Vl1crt43kzKE4JzgG9To7+0U7bsNrmm3BAG5MVn" },
    __fususApp: { src: "assets/fusus.js", integrity: "sha384-otWNZqy32Ka+/FecohwmfYWK7NlYDKNAxMNyNfsBjWdJiPDQuk9lEU0SrGoRPlo6" },
    __miskatApp: { src: "assets/miskat.js", integrity: "sha384-VDQkXmvPHyrSfzNykXI0B6YBMSGh3hhe8sl82u8t7VArGloDDrdHM0DhRH9O8/4l" },
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
