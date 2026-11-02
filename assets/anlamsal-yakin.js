/**
 * FAZ 5: "Anlamca yakın pasajlar".
 *
 * Vektörler scripts/anlamsal-komsuluk.mjs ile derleme zamanında
 * (Node/transformers.js, offline) üretiliyor -- hiçbir model/kütüphane
 * tarayıcıya inmiyor.
 *
 * 2026-10-09 (dalga-web): kosinüs artık TARAYICIDA da hesaplanmıyor. Sonuç
 * her ziyaretçi için aynı olduğu halde "Göster"e basan herkes ~1,7 MB int8
 * vektör (pasaj-vektorleri-<dil>.bin) + ~950 KB manifest indirip kısmın her
 * pasajını 2.000+ pasajla karşılaştırıyordu (~16 milyon çarpma; mobilde
 * saniyeler). Komşuluklar scripts/pasaj-komsu-uret.js ile derleme
 * zamanında, AYNI algoritmayla (int8 nokta çarpımı, her hedef kısımdan en
 * iyi pasaj, ilk 5) hesaplanıp data/ibn-arabi/pasaj-komsulari-<dil>.json'a
 * (~65 KB gzip) yazılıyor; bu dosya yalnız onu okuyor. Vektör dosyaları
 * özel repoda üreticinin girdisi olarak kalıyor, yayına gitmiyor.
 *
 * Yalnız istenince (bir kısım/fass sayfasında "Göster"e tıklanınca)
 * indirilir; ortak fetchJson önbelleğinden paylaşılır.
 *
 * DURUŞ: bu bir ÖNERİdir, Dost'un çapraz-referansı değildir -- aynı
 * temkin data/ibn-arabi/anlamsal-baglantilar.json (elle onaylanmış alt
 * küme) için de geçerli, ama BURADAKİ sonuçlar hiç insan gözden
 * geçirmesinden geçmemiştir. Çağıran kod (futuhat.js/fusus.js) bunu
 * görsel/metinsel olarak açıkça ayırt etmeli.
 */
window.DostAnlamsalYakin = (function () {
  "use strict";

  /**
   * kisimId'ye en yakın (farklı kısımlardaki) pasajlar -- önceden
   * hesaplanmış listeden. Döner: [{ skor, kisim, route, baslik, ozet }, ...]
   * (skor büyükten küçüğe sıralı, en çok topN).
   */
  function bul(kisimId, lang, topN) {
    return window.DostGraphUtils.fetchJson("data/ibn-arabi/pasaj-komsulari-" + lang + ".json").then(function (data) {
      var liste = (data.kisimlar && data.kisimlar[kisimId]) || [];
      return liste.slice(0, topN || 5).map(function (k) {
        var p = data.pasajlar[k[0]];
        return { skor: k[1], kisim: p.kisim, route: p.route, baslik: p.baslik, ozet: p.ozet };
      });
    });
  }

  return { bul: bul };
})();
