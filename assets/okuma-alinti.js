/* Alıntı ve atıf (2026-10-29, kullanıcı onayı): okuma görünümlerinde sayfayı atıflama, paragrafı alıntılama
 * ve paragrafı kart olarak kaydetme. okuma-kipi.js panelindeki "Alıntı ve atıf" düğmesiyle tembel iner
 * (view-loader.js ONCE, window.__dostOnceYukle). Hiçbir şey sunucuya gitmez; kart canvas ile cihazda çizilir.
 *
 * Dürüstlük: atıf, siteyi (Dost Arabî) ve o sayfanın adresini kaynak gösterir; yazar olarak İbn Arabî ya da
 * Dost'u göstermez -- sayfa bizim okuma özetimizdir, birincil metin değildir. Yayın yılı bilinmediği için
 * APA'da "t.y." (n.d.) kullanılır; erişim tarihi bugündür. Kart her zaman açık zeminlidir (paylaşımda tema
 * olmaz) ve altında "okuma özeti, kaynağın kendi metni değildir" künyesi taşır.
 */
(function () {
  "use strict";
  if (window.DostOkumaAlinti) return;
  var GU = window.DostGraphUtils;
  var I18n = window.DostI18n;
  function lang() { return (I18n && I18n.getLang && I18n.getLang()) || "tr"; }
  function t3(tr, en, pt) { var l = lang(); return l === "en" ? en : l === "pt" ? pt : tr; }
  function gk(fn, y) { try { return fn(); } catch (e) { return y; } }

  var AYLAR = {
    tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  };
  var KISA_AY = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

  function adres() {
    var c = document.querySelector('link[rel="canonical"]');
    var h = c && c.getAttribute("href");
    return h || (location.origin + location.pathname);
  }
  function tarih(bugun, bicim) {
    var l = lang(), g = bugun.getDate(), a = bugun.getMonth(), y = bugun.getFullYear();
    if (bicim === "iso") return y + "-" + ("0" + (a + 1)).slice(-2) + "-" + ("0" + g).slice(-2);
    if (bicim === "mla") return g + " " + KISA_AY[a] + " " + y;
    if (l === "en") return AYLAR.en[a] + " " + g + ", " + y;
    return g + " " + AYLAR[l][a] + " " + y;
  }
  function eserBilgisi(b) {
    // "Fütûhât-ı Mekkiyye · Cilt I · Kısım X" gibi bir eyebrow'u başlığın yanına künye olarak ekler.
    var e = (b.eyebrow || "").replace(/\s+/g, " ").trim();
    return e ? b.baslik + " (" + e + "; " + t3("okuma özeti", "reading summary", "resumo de leitura") + ")" : b.baslik + " (" + t3("okuma özeti", "reading summary", "resumo de leitura") + ")";
  }
  var BICIMLER = ["APA", "Chicago", "MLA", "BibTeX", "RIS", "CSL-JSON"];
  function atif(bicim, b) {
    var bugun = new Date(), u = adres(), bas = eserBilgisi(b), l = lang();
    if (bicim === "APA") {
      var yok = l === "en" ? "n.d." : l === "pt" ? "s.d." : "t.y.";
      var erisim = l === "en" ? "Retrieved " + tarih(bugun) + ", from " + u : l === "pt" ? "Recuperado em " + tarih(bugun) + ", de " + u : "Erişim tarihi " + tarih(bugun) + ", " + u;
      return "Dost Arabî. (" + yok + "). " + bas + ". Dost Arabî. " + erisim;
    }
    if (bicim === "Chicago") {
      return "Dost Arabî. “" + bas + ".” Dost Arabî. " + (l === "en" ? "Accessed " : l === "pt" ? "Acesso em " : "Erişim ") + tarih(bugun) + ". " + u + ".";
    }
    if (bicim === "MLA") {
      return "“" + bas + ".” Dost Arabî, " + u.replace(/^https?:\/\//, "") + ". Accessed " + tarih(bugun, "mla") + ".";
    }
    var anahtar = "dostarabi-" + (location.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "ana");
    // Zotero / Mendeley içe aktarımı (2026-10-30, fikir S5): RIS ve CSL-JSON. Yazar siteyi (Dost Arabî) gösterir; İbn Arabî yazar değildir.
    if (bicim === "RIS") {
      return ["TY  - ELEC", "AU  - Dost Arabî", "TI  - " + bas, "T2  - Dost Arabî", "UR  - " + u, "Y2  - " + tarih(bugun, "iso").replace(/-/g, "/") + "/", "LA  - " + l, "ER  - "].join("\n");
    }
    if (bicim === "CSL-JSON") {
      var p = tarih(bugun, "iso").split("-").map(Number);
      return JSON.stringify([{ id: anahtar, type: "webpage", title: bas, "container-title": "Dost Arabî", URL: u, author: [{ literal: "Dost Arabî" }], accessed: { "date-parts": [p] }, language: l }], null, 2);
    }
    return "@misc{" + anahtar + ",\n  author = {{Dost Arabî}},\n  title = {" + bas + "},\n  howpublished = {\\url{" + u + "}},\n  note = {"
      + t3("Erişim", "Accessed", "Acesso") + ": " + tarih(bugun, "iso") + "},\n}";
  }
  function alinti(b) {
    var m = (b.metin || "").replace(/\s+/g, " ").trim();
    if (m.length > 900) m = m.slice(0, 900).replace(/\s+\S*$/, "") + "…";
    return "“" + m + "”\n— " + eserBilgisi(b) + ", Dost Arabî, " + adres();
  }

  // ── Kart ───────────────────────────────────────────────────────────────
  var W = 1080, H = 1350, PAD = 84;
  var RENK = { zemin: "#f9f9f7", murekkep: "#1a1a1a", ikincil: "#52514e", soluk: "#6f6d65", cizgi: "#e1e0d9", altin: "#d99a12" };
  function satirla(ctx, metin, enGenis) {
    var s = [], cur = "";
    metin.split(/\s+/).filter(Boolean).forEach(function (k) {
      var d = cur ? cur + " " + k : k;
      if (ctx.measureText(d).width > enGenis && cur) { s.push(cur); cur = k; } else cur = d;
    });
    if (cur) s.push(cur);
    return s;
  }
  function kartCiz(b) {
    var cv = document.createElement("canvas");
    if (!cv.getContext || !cv.toBlob) return Promise.resolve(null);
    var fontlar = Promise.all([
      document.fonts.load('italic 400 44px "Fraunces Dost"'), document.fonts.load('600 60px "Fraunces Dost"'), document.fonts.load('400 32px "Source Sans Dost"'),
    ]).catch(function () {});
    return fontlar.then(function () {
      cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = RENK.zemin; ctx.fillRect(0, 0, W, H);
      // altın halka (okuma özeti işareti) + etiket
      ctx.strokeStyle = RENK.altin; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(PAD + 16, PAD + 16, 15, 0, 7); ctx.stroke();
      ctx.fillStyle = RENK.soluk; ctx.font = '600 30px "Source Sans Dost", system-ui, sans-serif'; ctx.textBaseline = "middle";
      ctx.fillText(t3("OKUMA ÖZETİ", "READING SUMMARY", "RESUMO DE LEITURA"), PAD + 50, PAD + 18);
      ctx.textBaseline = "alphabetic";
      var y = PAD + 100;
      if (b.eyebrow) {
        ctx.fillStyle = RENK.soluk; ctx.font = '400 30px "Source Sans Dost", system-ui, sans-serif';
        satirla(ctx, b.eyebrow, W - 2 * PAD).slice(0, 2).forEach(function (s) { ctx.fillText(s, PAD, y); y += 40; });
        y += 10;
      }
      // alıntı: sığana dek küçülen italik serif
      var metin = (b.metin || "").replace(/\s+/g, " ").trim(), boy = 46, sat = [], satH = 0;
      var alt = H - 290;
      for (; boy >= 30; boy -= 2) {
        ctx.font = 'italic 400 ' + boy + 'px "Fraunces Dost", Georgia, serif';
        sat = satirla(ctx, "“" + metin + "”", W - 2 * PAD); satH = Math.round(boy * 1.45);
        if (y + sat.length * satH <= alt) break;
      }
      var kapasite = Math.max(1, Math.floor((alt - y) / satH));
      var goster = sat.slice(0, kapasite);
      if (sat.length > kapasite) goster[goster.length - 1] = goster[goster.length - 1].replace(/[\s.,;:!?”]+$/, "") + " …”";
      ctx.fillStyle = RENK.murekkep;
      goster.forEach(function (s) { y += satH; ctx.fillText(s, PAD, y); });
      // alt şerit
      ctx.strokeStyle = RENK.cizgi; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD, H - 250); ctx.lineTo(W - PAD, H - 250); ctx.stroke();
      ctx.fillStyle = RENK.murekkep; ctx.font = '600 38px "Fraunces Dost", Georgia, serif';
      satirla(ctx, b.baslik, W - 2 * PAD).slice(0, 2).forEach(function (s, i) { ctx.fillText(s, PAD, H - 190 + i * 46); });
      ctx.fillStyle = RENK.soluk; ctx.font = '400 28px "Source Sans Dost", system-ui, sans-serif';
      ctx.fillText("dostarabi.com", PAD, H - 92);
      ctx.fillText(t3("Bu kart bir okuma özetinden alıntıdır; kaynağın kendi metni değildir.", "This card quotes a reading summary; it is not the source's own text.", "Este cartão cita um resumo de leitura; não é o texto da própria fonte."), PAD, H - 50);
      return new Promise(function (coz) { cv.toBlob(coz, "image/png"); });
    });
  }

  // ── Pencere ────────────────────────────────────────────────────────────
  var kutu = null, oncekiOdak = null, bicim = "APA", hedef = null;
  function kopyala(metin) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(metin).then(function () { return true; }, function () { return false; });
    return Promise.resolve(false);
  }
  function kapat() {
    if (!kutu) return false;
    kutu.remove(); kutu = null;
    if (oncekiOdak && oncekiOdak.focus) gk(function () { oncekiOdak.focus(); });
    return true;
  }
  function ac(b) {
    if (kutu) return;
    hedef = b; oncekiOdak = document.activeElement;
    kutu = document.createElement("section");
    kutu.className = "alinti-pencere"; kutu.setAttribute("role", "dialog"); kutu.setAttribute("aria-modal", "true");
    kutu.setAttribute("aria-label", t3("Alıntı ve atıf", "Quote and cite", "Citar e referenciar"));
    kutu.innerHTML = '<div class="alinti-pencere__kart">'
      + '<header class="alinti-pencere__bas"><h2></h2><button type="button" class="alinti-pencere__kapat" data-e="kapat">×</button></header>'
      + '<p class="alinti-pencere__not"></p>'
      + '<div class="alinti-pencere__grup"><h3 data-y="sayfa"></h3><div class="alinti-pencere__bicimler" role="group"></div>'
      + '<textarea class="alinti-pencere__metin" rows="5" readonly></textarea>'
      + '<div class="alinti-pencere__sira"><button type="button" data-e="kopya"></button></div></div>'
      + '<div class="alinti-pencere__grup"><h3 data-y="paragraf"></h3><blockquote class="alinti-pencere__onizleme"></blockquote>'
      + '<div class="alinti-pencere__sira"><button type="button" data-e="alinti-kopya"></button><button type="button" data-e="kart"></button></div></div>'
      + '<p class="alinti-pencere__durum" role="status" aria-live="polite"></p></div>';
    var T = {
      h2: t3("Alıntı ve atıf", "Quote and cite", "Citar e referenciar"),
      not: t3("Atıf bu sayfayı (Dost Arabî okuma özetini) kaynak gösterir; İbn Arabî'nin kendi metninin atfı değildir.", "The citation points to this page (a Dost Arabî reading summary); it is not a citation of Ibn Arabi's own text.", "A referência aponta para esta página (um resumo de leitura do Dost Arabî); não é uma citação do texto do próprio Ibn Arabi."),
      sayfa: t3("Sayfayı atıfla", "Cite this page", "Referenciar esta página"),
      paragraf: t3("Paragrafı alıntıla", "Quote the paragraph", "Citar o parágrafo"),
      kopya: t3("Atıfı kopyala", "Copy citation", "Copiar referência"),
      "alinti-kopya": t3("Alıntıyı kopyala", "Copy quote", "Copiar citação"),
      kart: t3("Kart olarak kaydet", "Save as card", "Salvar como cartão"),
    };
    kutu.querySelector("h2").textContent = T.h2;
    kutu.querySelector(".alinti-pencere__not").textContent = T.not;
    kutu.querySelectorAll("h3[data-y]").forEach(function (h) { h.textContent = T[h.dataset.y]; });
    kutu.querySelectorAll("button[data-e]").forEach(function (x) { if (T[x.dataset.e]) x.textContent = T[x.dataset.e]; });
    kutu.querySelector(".alinti-pencere__kapat").setAttribute("aria-label", t3("Kapat", "Close", "Fechar"));
    var onizleme = kutu.querySelector(".alinti-pencere__onizleme");
    var kisa = (b.metin || "").replace(/\s+/g, " ").trim();
    onizleme.textContent = kisa.length > 220 ? kisa.slice(0, 220).replace(/\s+\S*$/, "") + "…" : kisa;
    var metinEl = kutu.querySelector(".alinti-pencere__metin"), durum = kutu.querySelector(".alinti-pencere__durum");
    var bg = kutu.querySelector(".alinti-pencere__bicimler");
    function bicimleriCiz() {
      bg.innerHTML = BICIMLER.map(function (x) { return '<button type="button" class="alinti-pencere__chip" data-bicim="' + x + '" aria-pressed="' + (x === bicim) + '">' + x + "</button>"; }).join("");
      metinEl.value = atif(bicim, hedef);
    }
    bicimleriCiz();
    kutu.addEventListener("click", function (ev) {
      var x = ev.target.closest("button");
      if (!x) { if (ev.target === kutu) kapat(); return; }
      if (x.dataset.bicim) { bicim = x.dataset.bicim; bicimleriCiz(); durum.textContent = ""; return; }
      var e = x.dataset.e;
      if (e === "kapat") kapat();
      else if (e === "kopya" || e === "alinti-kopya") {
        var m = e === "kopya" ? atif(bicim, hedef) : alinti(hedef);
        if (e === "alinti-kopya") metinEl.value = m;
        kopyala(m).then(function (ok) {
          if (!ok) { metinEl.select(); }
          durum.textContent = ok ? t3("Kopyalandı.", "Copied.", "Copiado.") : t3("Kopyalanamadı; metin seçildi, elle kopyala.", "Could not copy; the text is selected, copy it by hand.", "Não foi possível copiar; o texto está selecionado, copie manualmente.");
        });
      } else if (e === "kart") {
        x.disabled = true;
        kartCiz(hedef).then(function (blob) {
          x.disabled = false;
          if (!blob) { durum.textContent = t3("Kart çizilemedi.", "The card could not be drawn.", "Não foi possível desenhar o cartão."); return; }
          var ad = (location.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "dost") + "-alinti.png";
          var dosya = null; try { dosya = new File([blob], ad, { type: "image/png" }); } catch (er) { /* File yok */ }
          if (dosya && navigator.canShare && navigator.share && navigator.canShare({ files: [dosya] })) {
            return navigator.share({ files: [dosya], title: hedef.baslik }).catch(function () {});
          }
          var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ad;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          durum.textContent = t3("Kart indirildi.", "Card downloaded.", "Cartão baixado.");
        });
      }
    });
    kutu.addEventListener("keydown", function (ev) {
      if (ev.key !== "Tab") return;
      var f = Array.prototype.filter.call(kutu.querySelectorAll("button, textarea"), function (z) { return z.offsetParent !== null && !z.disabled; });
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    });
    document.body.appendChild(kutu);
    gk(function () { kutu.querySelector('button[data-e="kopya"]').focus({ preventScroll: true }); });
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return kapat(); }, { oncelikli: true });
  window.DostOkumaAlinti = { ac: ac, _atif: atif, _alinti: alinti, bicimler: function () { return BICIMLER.slice(); } };
})();
