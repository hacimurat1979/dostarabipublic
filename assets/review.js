/**
 * FAZ 4 — Öneri inceleme aracı (review.html).
 *
 * Amaç (plan metni): "Önerilen bağlantıları tek tek gözden geçirebileceğim
 * küçük, yerel, statik bir inceleme sayfası... iki pasajı yan yana göster,
 * neden bağlandığını yaz, onayla/reddet. Kararlar bir JSON'a yazılsın. Bu
 * dosya insan onayının kaydıdır."
 *
 * Statik site kuralı gereği bu sayfa hiçbir şeyi sunucuya YAZAMAZ --
 * kararlar tarayıcıda (localStorage) birikir, "Dışa Aktar" ile bir JSON
 * dosyası olarak indirilir (assets/edit-mode.js'teki export deseniyle
 * aynı), ve o dosya elle research/karar-defteri.json olarak commit edilir.
 * Sayfa açılışında research/karar-defteri.json (varsa) otomatik OKUNUP
 * localStorage'daki boşluklar doldurulur -- böylece bir önceki oturumda
 * committed edilen kararlar kaybolmaz, ama bu oturumdaki TAZE kararların
 * üzerine yazılmaz.
 */
(function () {
  "use strict";

  var LEDGER_KEY = "dost-review-kararlar";
  var LEDGER_URL = "research/karar-defteri.json";

  // 2026-10-09: genel karar defteri. Kaynaklardan biri artık @revise'ın
  // dışa aktardığı düzenleme paketi (dost-duzenlemeler-*.json): içe alınır,
  // her kayıt kelime düzeyinde farkıyla gösterilir, onay/ret verilir,
  // "Onaylandı paketi" yalnız onaylananları scripts/duzenleme-uygula.py'nin
  // okuduğu biçimde verir (CLAUDE.md: "onaylandı" = o kapsam için tam
  // yürütme yetkisi).
  var DUZENLEME_KAYNAK = { id: "duzenleme", dosya: null, tip: "duzenleme", baslik: "Düzenleme paketi (@revise)" };
  var duzenlemePaketi = null;

  var KAYNAKLAR = [
    { id: "anlamsal-tr", dosya: "research/anlamsal-komsuluk-tr.json", tip: "pasaj", baslik: "Anlamsal komşuluk — TR" },
    { id: "anlamsal-en", dosya: "research/anlamsal-komsuluk-en.json", tip: "pasaj", baslik: "Anlamsal komşuluk — EN" },
    { id: "anlamsal-pt", dosya: "research/anlamsal-komsuluk-pt.json", tip: "pasaj", baslik: "Anlamsal komşuluk — PT" },
    { id: "kavram", dosya: "research/turetilmis-kenarlar.json", tip: "kavram", baslik: "Kavram ko-okurans (PPMI) — Esmâ/Ontoloji/Terim" },
  ];

  // Ürün denetimi P2 (2026-09-02): önbelleksiz bir fallback tanımlıydı ama
  // review.html'de graph-utils.js her zaman review.js'ten ÖNCE yükleniyor
  // (satır sırası doğrulandı) -- window.DostGraphUtils asla eksik olmuyor,
  // fallback hiç tetiklenmeyen ölü koddu ve varsa da önbelleksiz olduğu
  // için LEDGER_URL/mevcutKaynak.dosya çift indirme riski taşıyordu.
  var fetchJson = window.DostGraphUtils.fetchJson;

  function keyOf(a, b) {
    return [a, b].sort().join("|");
  }

  function loadLedger() {
    try {
      return JSON.parse(localStorage.getItem(LEDGER_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveLedger(ledger) {
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
    } catch (e) {}
  }
  function ledgerKey(kaynakId, anahtar) {
    return kaynakId + "::" + anahtar;
  }

  var ledger = loadLedger();

  // Sayfa açılışında, daha önce commit edilmiş karar defterini oku ve
  // yalnız localStorage'da HENÜZ karşılığı olmayan anahtarları doldur.
  fetchJson(LEDGER_URL)
    .then(function (d) {
      var degisti = false;
      (d.kararlar || []).forEach(function (k) {
        var lk = ledgerKey(k.kaynak, k.anahtar);
        if (!(lk in ledger)) {
          ledger[lk] = { onay: k.onay, not: k.not || "", zaman: k.zaman || "" };
          degisti = true;
        }
      });
      if (degisti) { saveLedger(ledger); render(); }
    })
    .catch(function () { /* henüz commit edilmiş bir defter yok -- normal */ });

  function normalizePasaj(kaynakId, ciftler) {
    return (ciftler || []).map(function (c) {
      var anahtar = keyOf(c.a.kisim, c.b.kisim);
      return {
        kaynakId: kaynakId, tip: "pasaj", anahtar: anahtar,
        skorEtiket: "kosinüs", skor: c.skor,
        a: { baslik: c.a.baslik, route: c.a.route, metin: c.a.metin },
        b: { baslik: c.b.baslik, route: c.b.route, metin: c.b.metin },
        dosyaOnay: c.onay,
      };
    });
  }

  function normalizeKavram(kaynakId, kenarlar) {
    return (kenarlar || []).map(function (k) {
      var anahtar = keyOf(k.a.kaynak + ":" + k.a.id, k.b.kaynak + ":" + k.b.id);
      return {
        kaynakId: kaynakId, tip: "kavram", anahtar: anahtar,
        skorEtiket: "PPMI", skor: k.ppmi, ortakBelge: k.birlikte_belge,
        a: { baslik: k.a.ad, route: null, metin: "(" + k.a.kaynak + ")" },
        b: { baslik: k.b.ad, route: null, metin: "(" + k.b.kaynak + ")" },
        dosyaOnay: k.onay,
      };
    });
  }

  var mevcutKaynak = KAYNAKLAR[0];
  var mevcutAday = [];
  var kuyrukIndex = 0;

  var kaynakSec = document.getElementById("review-kaynak-sec");
  var filtreSec = document.getElementById("review-filtre-sec");
  var listEl = document.getElementById("review-list");
  var progressEl = document.getElementById("review-progress");

  KAYNAKLAR.forEach(function (k) {
    var opt = document.createElement("option");
    opt.value = k.id;
    opt.textContent = k.baslik;
    kaynakSec.appendChild(opt);
  });

  function kararOf(aday) {
    var lk = ledgerKey(aday.kaynakId, aday.anahtar);
    if (ledger[lk]) return ledger[lk];
    if (aday.dosyaOnay === true || aday.dosyaOnay === false) {
      return { onay: aday.dosyaOnay, not: "", zaman: "" };
    }
    return null;
  }

  function karar(aday, onay, not) {
    var lk = ledgerKey(aday.kaynakId, aday.anahtar);
    ledger[lk] = { onay: onay, not: not || "", zaman: new Date().toISOString() };
    saveLedger(ledger);
  }

  function kaynakYukle(id) {
    if (id === "duzenleme") {
      mevcutKaynak = DUZENLEME_KAYNAK;
      kuyrukIndex = 0;
      mevcutAday = duzenlemePaketi ? normalizeDuzenleme(duzenlemePaketi) : [];
      if (!duzenlemePaketi) {
        listEl.innerHTML = '<p class="review-empty">Önce “Düzenleme paketi yükle” ile @revise\'ın dışa aktardığı JSON\'u seç.</p>';
        progressEl.textContent = "";
        return;
      }
      render();
      return;
    }
    mevcutKaynak = KAYNAKLAR.filter(function (k) { return k.id === id; })[0];
    kuyrukIndex = 0;
    listEl.innerHTML = '<p class="review-empty">Yükleniyor…</p>';
    fetchJson(mevcutKaynak.dosya)
      .then(function (d) {
        mevcutAday = mevcutKaynak.tip === "pasaj"
          ? normalizePasaj(mevcutKaynak.id, d.ciftler)
          : normalizeKavram(mevcutKaynak.id, d.kenarlar);
        render();
      })
      .catch(function (e) {
        listEl.innerHTML = '<p class="review-empty">' + mevcutKaynak.dosya + " yüklenemedi: " + e.message +
          "<br>Bu sayfa yalnız yerelden (python3 -m http.server) çalıştırıldığında research/ dosyalarına erişebilir.</p>";
      });
  }

  function pasajBaslikHtml(taraf) {
    if (!taraf.route) return "<h3>" + escapeHtml(taraf.baslik) + "</h3>";
    return '<h3><a href="' + taraf.route + '" target="_blank" rel="noopener">' + escapeHtml(taraf.baslik) + " ↗</a></h3>";
  }

  // Ürün denetimi D1 (2026-09-02): ortak yardımcıya taşındı, bkz.
  // graph-utils.js:escapeHtml (aynı gerekçe: DOM tekniği " kaçırmıyordu,
  // burada zararsızdı ama tek fonksiyona taşırken en güvenli seçildi).
  var escapeHtml = window.DostGraphUtils.escapeHtml;

  // --- düzenleme paketi ----------------------------------------------------
  function duzMetin(s) {
    return String(s == null ? "" : s).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
  // Kelime düzeyi fark (edit-mode.js'tekiyle aynı küçük LCS).
  function kelimeFarki(a, b) {
    var A = String(a || "").split(/(\s+)/), B = String(b || "").split(/(\s+)/);
    if (A.length * B.length > 250000) return escapeHtml(b);
    var n = A.length, m = B.length, i, j;
    var L = [];
    for (i = 0; i <= n; i++) L.push(new Uint16Array(m + 1));
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = "";
    i = 0; j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { out += escapeHtml(A[i]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out += "<del>" + escapeHtml(A[i]) + "</del>"; i++; }
      else { out += "<ins>" + escapeHtml(B[j]) + "</ins>"; j++; }
    }
    while (i < n) out += "<del>" + escapeHtml(A[i++]) + "</del>";
    while (j < m) out += "<ins>" + escapeHtml(B[j++]) + "</ins>";
    return out;
  }
  function normalizeDuzenleme(paket) {
    var liste = Array.isArray(paket) ? paket : (paket.duzenlemeler || []);
    return liste.map(function (e, i) {
      return { kaynakId: "duzenleme", tip: "duzenleme", anahtar: e.id || ("sira-" + i + "-" + (e.timestamp || "")), kayit: e };
    });
  }
  function duzenlemeCardHtml(aday, karar_, salt) {
    var e = aday.kayit;
    var badge = karar_ ? '<span class="review-done-badge" data-onay="' + karar_.onay + '">' + (karar_.onay ? "onaylandı" : "reddedildi") + "</span>" : "";
    var adres = [e.dosya, e.kayit, e.alan, e.lang].filter(Boolean).join(" · ");
    var gorsel = e.type === "visual-note";
    var govde = gorsel
      ? "<p>" + escapeHtml(e.note || "(metinsiz not)") + "</p>" + (e.image ? '<img class="review-gorsel" alt="" src="' + escapeHtml(e.image) + '">' : "")
      : '<p class="review-fark">' + kelimeFarki(e.before_metin || duzMetin(e.before), e.after_metin || duzMetin(e.after)) + "</p>";
    var diller = "";
    if (e.diger_diller && Object.keys(e.diger_diller).length) {
      diller = '<div class="review-diller"><p class="review-diller__baslik">Öteki diller — aynı turda yeniden yazılmalı:</p>'
        + Object.keys(e.diger_diller).map(function (l) {
            return '<p><strong>' + escapeHtml(l.toUpperCase()) + ":</strong> " + escapeHtml(duzMetin(e.diger_diller[l])) + "</p>";
          }).join("") + "</div>";
    }
    var uyari = "";
    if (!gorsel && !e.alan) uyari = '<p class="review-uyari">Adres yok — Claude kaydı elle bulacak (' + escapeHtml(e.url || "") + ").</p>";
    else if (e.adres_dogrulandi === false) uyari = '<p class="review-uyari">Kayıttaki “önce” metni veri dosyasındakiyle aynı değil — kaynak dışa aktarımdan sonra değişmiş olabilir.</p>';
    var actions = salt
      ? '<div class="review-actions"><button type="button" data-act="geri-al">Geri Al (bekleyene döndür)</button></div>'
      : ('<div class="review-actions">' +
          '<button type="button" data-act="onayla">Onayla <kbd>A</kbd></button>' +
          '<button type="button" data-act="reddet">Reddet <kbd>R</kbd></button>' +
          '<button type="button" data-act="atla">Atla <kbd>S</kbd></button>' +
          "</div>" +
          '<input type="text" class="review-note" placeholder="Not (opsiyonel)">');
    return '<div class="review-card" data-kaynak="duzenleme" data-anahtar="' + encodeURIComponent(aday.anahtar) + '">' +
      '<div class="meta-row"><span>' + (gorsel ? "görsel not" : "metin düzenlemesi") + " · " + escapeHtml(e.heading || e.url || "") + "</span>" + badge + "</div>" +
      (adres ? '<p class="review-adres"><code>' + escapeHtml(adres) + "</code></p>" : "") +
      govde + uyari + diller + actions + "</div>";
  }
  function onaylandiPaketi() {
    var onaylanan = [], reddedilen = [];
    mevcutAdayDuzenleme().forEach(function (a) {
      var k = kararOf(a);
      if (!k) return;
      var e = Object.assign({}, a.kayit);
      if (k.not) e.karar_notu = k.not;
      if (k.onay) onaylanan.push(e); else reddedilen.push(e.id || a.anahtar);
    });
    return {
      tur: "dost-duzenlemeler",
      bicim: (duzenlemePaketi && duzenlemePaketi.bicim) || "e2",
      onay: "onaylandı",
      not: "review.html'de tek tek onaylanan kayıtlar. CLAUDE.md: \"onaylandı\" = bu kapsam için tam yürütme yetkisi. "
        + "Uygulama: python3 scripts/duzenleme-uygula.py --check/--apply <bu dosya>.",
      tarih: new Date().toISOString(),
      duzenlemeler: onaylanan,
      reddedilen: reddedilen,
      susturulan: (duzenlemePaketi && duzenlemePaketi.susturulan) || [],
    };
  }
  function mevcutAdayDuzenleme() { return duzenlemePaketi ? normalizeDuzenleme(duzenlemePaketi) : []; }

  // Eski vektör uyarısı: pasaj vektörleri 2026-10-05 yorum ayıklamasından
  // ÖNCE hesaplandı (CLAUDE.md "Bekleyen iş"). Aday pasajın metni kısmın
  // bugünkü metninde yoksa kart bunu söyler.
  var parcaSoz = {};
  function parcaMetni(kisim) {
    if (!parcaSoz[kisim]) {
      parcaSoz[kisim] = fetchJson("data/ibn-arabi/futuhat-parts/" + kisim + ".json").then(function (p) {
        return duzMetin(JSON.stringify(p)).replace(/\\"/g, '"');
      }).catch(function () { return null; });
    }
    return parcaSoz[kisim];
  }
  function eskiVektorDenetle(card, aday) {
    if (aday.tip !== "pasaj") return;
    ["a", "b"].forEach(function (yan, i) {
      var taraf = aday[yan];
      var kisim = taraf && taraf.route && (taraf.route.match(/\/futuhat\/([^/]+)/) || [])[1];
      if (!kisim) return;
      parcaMetni(kisim).then(function (t) {
        if (t == null) return;
        var parca = duzMetin(taraf.metin).replace(/["“”]/g, "").slice(0, 60);
        var bulundu = t.replace(/["“”]/g, "").indexOf(parca) >= 0;
        if (bulundu) return;
        var side = card.querySelectorAll(".review-side")[i];
        if (!side || side.querySelector(".review-eski")) return;
        var p = document.createElement("p");
        p.className = "review-eski";
        p.textContent = "⚠ Bu pasaj kısmın bugünkü metninde yok — vektörler 2026-10-05 ayıklamasından önce hesaplandı.";
        side.insertBefore(p, side.firstChild);
      });
    });
  }

  function cardHtml(aday, karar_, salt) {
    if (aday.tip === "duzenleme") return duzenlemeCardHtml(aday, karar_, salt);
    var skorTxt = aday.skorEtiket + ": " + (typeof aday.skor === "number" ? aday.skor.toFixed(3) : aday.skor);
    if (aday.ortakBelge != null) skorTxt += " · ortak belge: " + aday.ortakBelge;
    var badge = karar_ ? '<span class="review-done-badge" data-onay="' + karar_.onay + '">' + (karar_.onay ? "onaylandı" : "reddedildi") + "</span>" : "";
    var actions = salt
      ? '<div class="review-actions"><button type="button" data-act="geri-al">Geri Al (bekleyene döndür)</button></div>'
      : ('<div class="review-actions">' +
          '<button type="button" data-act="onayla">Onayla <kbd>A</kbd></button>' +
          '<button type="button" data-act="reddet">Reddet <kbd>R</kbd></button>' +
          '<button type="button" data-act="atla">Atla <kbd>S</kbd></button>' +
          "</div>" +
          '<input type="text" class="review-note" placeholder="Not (opsiyonel — neden onayladın/reddettin)">');
    return (
      '<div class="review-card" data-kaynak="' + aday.kaynakId + '" data-anahtar="' + encodeURIComponent(aday.anahtar) + '">' +
      '<div class="meta-row"><span>' + skorTxt + "</span>" + badge + "</div>" +
      '<div class="review-pair">' +
      '<div class="review-side">' + pasajBaslikHtml(aday.a) + "<p>" + escapeHtml(aday.a.metin) + "</p></div>" +
      '<div class="review-side">' + pasajBaslikHtml(aday.b) + "<p>" + escapeHtml(aday.b.metin) + "</p></div>" +
      "</div>" +
      '<p class="review-why">' + (aday.tip === "pasaj"
        ? "Neden önerildi: iki pasajın anlamsal gömme (embedding) vektörleri arasında yüksek kosinüs benzerliği ölçüldü — bu Dost'un aynı fikri iki yerde söylediği anlamına GELMEZ, yalnız bir adaydır."
        : "Neden önerildi: bu iki kavram, okuduğumuz bölümlerin beklenenden fazlasında birlikte geçiyor (PPMI) — Dost'un bunları ilişkilendirdiği anlamına GELMEZ, yalnız bir ölçümdür.") +
      "</p>" +
      '<p class="review-eski review-eski--genel">⚠ Eski vektör: bu aday 2026-10-05 yorum ayıklamasından önceki metinden hesaplandı; pasajlardan biri artık sitede olmayan bir cümleye dayanıyor olabilir.</p>' +
      actions +
      "</div>"
    );
  }

  function bekleyenler() {
    return mevcutAday.filter(function (a) { return !kararOf(a); });
  }

  function render() {
    var filtre = filtreSec.value;
    var toplam = mevcutAday.length;
    var bekleyenSayi = bekleyenler().length;
    progressEl.textContent = toplam
      ? (toplam - bekleyenSayi) + " / " + toplam + " incelendi (" + bekleyenSayi + " bekliyor)"
      : "";

    if (filtre === "bekleyen") {
      var kalan = bekleyenler();
      if (!kalan.length) {
        listEl.innerHTML = toplam
          ? '<p class="review-empty">Bu kaynakta bekleyen aday kalmadı. "Göster" menüsünden onaylanan/reddedilenleri gözden geçirebilir ya da "Dışa Aktar" ile karar defterini indirebilirsin.</p>'
          : '<p class="review-empty">Yükleniyor…</p>';
        return;
      }
      var aday = kalan[0];
      listEl.innerHTML = cardHtml(aday, null, false);
      wireActiveCard(aday);
      eskiVektorDenetle(listEl.querySelector(".review-card"), aday);
      return;
    }

    var gosterilecek = mevcutAday.filter(function (a) {
      var k = kararOf(a);
      if (filtre === "hepsi") return true;
      if (filtre === "onaylanan") return k && k.onay === true;
      if (filtre === "reddedilen") return k && k.onay === false;
      return true;
    });
    if (!gosterilecek.length) {
      listEl.innerHTML = '<p class="review-empty">Bu filtreye uyan bir aday yok.</p>';
      return;
    }
    listEl.innerHTML = gosterilecek.map(function (a) {
      return cardHtml(a, kararOf(a), true);
    }).join("");
    Array.prototype.forEach.call(listEl.querySelectorAll('[data-act="geri-al"]'), function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".review-card");
        var lk = ledgerKey(card.dataset.kaynak, decodeURIComponent(card.dataset.anahtar));
        delete ledger[lk];
        saveLedger(ledger);
        render();
      });
    });
  }

  function wireActiveCard(aday) {
    var card = listEl.querySelector(".review-card");
    if (!card) return;
    var noteInput = card.querySelector(".review-note");
    function act(onay) {
      karar(aday, onay, noteInput ? noteInput.value.trim() : "");
      render();
    }
    card.querySelector('[data-act="onayla"]').addEventListener("click", function () { act(true); });
    card.querySelector('[data-act="reddet"]').addEventListener("click", function () { act(false); });
    card.querySelector('[data-act="atla"]').addEventListener("click", function () {
      // atla: karar YAZMADAN kuyruğun sonuna atar (bu oturum için) --
      // bir sonraki sayfa yüklemesinde tekrar en başta çıkar.
      mevcutAday.splice(mevcutAday.indexOf(aday), 1);
      mevcutAday.push(aday);
      render();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (filtreSec.value !== "bekleyen") return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    var card = listEl.querySelector(".review-card");
    if (!card) return;
    if (e.key === "a" || e.key === "A") card.querySelector('[data-act="onayla"]').click();
    else if (e.key === "r" || e.key === "R") card.querySelector('[data-act="reddet"]').click();
    else if (e.key === "s" || e.key === "S") card.querySelector('[data-act="atla"]').click();
  });

  kaynakSec.addEventListener("change", function () { kaynakYukle(kaynakSec.value); });

  // Düzenleme paketi: içe al / onaylandı paketi.
  (function () {
    var opt = document.createElement("option");
    opt.value = "duzenleme";
    opt.textContent = DUZENLEME_KAYNAK.baslik;
    kaynakSec.appendChild(opt);
    var yukleBtn = document.getElementById("review-duzenleme-btn");
    var dosyaIn = document.getElementById("review-duzenleme-file");
    var paketBtn = document.getElementById("review-onay-paketi-btn");
    if (yukleBtn && dosyaIn) {
      yukleBtn.addEventListener("click", function () { dosyaIn.click(); });
      dosyaIn.addEventListener("change", function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            duzenlemePaketi = JSON.parse(r.result);
            kaynakSec.value = "duzenleme";
            opt.textContent = DUZENLEME_KAYNAK.baslik + " (" + normalizeDuzenleme(duzenlemePaketi).length + ")";
            kaynakYukle("duzenleme");
          } catch (err) { alert("Paket okunamadı: " + err.message); }
        };
        r.readAsText(f);
        e.target.value = "";
      });
    }
    if (paketBtn) {
      paketBtn.addEventListener("click", function () {
        if (!duzenlemePaketi) { alert("Önce bir düzenleme paketi yükle."); return; }
        var p = onaylandiPaketi();
        var blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "dost-onaylandi-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    }
    window.__dostReview = { onaylandiPaketi: onaylandiPaketi, paketYukle: function (p) {
      duzenlemePaketi = p; kaynakSec.value = "duzenleme"; kaynakYukle("duzenleme");
    } };
  })();
  filtreSec.addEventListener("change", render);

  document.getElementById("review-export-btn").addEventListener("click", function () {
    var kararlar = Object.keys(ledger).map(function (lk) {
      var idx = lk.indexOf("::");
      var kaynak = lk.slice(0, idx), anahtar = lk.slice(idx + 2);
      var v = ledger[lk];
      return { kaynak: kaynak, anahtar: anahtar, onay: v.onay, not: v.not, zaman: v.zaman };
    });
    var payload = {
      uretim: "review.html (elle, insan kararı)",
      not: "Bu dosya insan onayının kaydıdır. FAZ 4 -- research/karar-defteri.json olarak commit edilmeli.",
      tarih: new Date().toISOString(),
      toplam_karar: kararlar.length,
      kararlar: kararlar,
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "karar-defteri-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  document.getElementById("review-import-btn").addEventListener("click", function () {
    document.getElementById("review-import-file").click();
  });
  document.getElementById("review-import-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(reader.result);
        (d.kararlar || []).forEach(function (k) {
          ledger[ledgerKey(k.kaynak, k.anahtar)] = { onay: k.onay, not: k.not || "", zaman: k.zaman || "" };
        });
        saveLedger(ledger);
        render();
      } catch (err) {
        alert("Dosya okunamadı: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  kaynakYukle(mevcutKaynak.id);
})();
