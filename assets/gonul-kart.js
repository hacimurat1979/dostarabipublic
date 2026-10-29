// Gönül Defteri yazı sayfası: "Kart olarak kaydet" (2026-10-29, kullanıcı onaylı öneri).
// Yazının kapağı, mührü, başlığı ve ilk dizeleri tek bir dikey resim kartına çizilir (canvas, cihazda;
// hiçbir veri dışarı gitmez). Telefonda paylaşım sayfası, bilgisayarda PNG indirme.
// Kart HER ZAMAN açık zeminlidir (paylaşımda tema olmaz) ve altında "yazarın kendi sesi" künyesi taşır:
// kart bir okuma özeti gibi okunmasın. Canvas yoksa düğme hiç görünmez (bağlanmamış düğme yok).
(function () {
  "use strict";
  var btn = document.getElementById("gonul-kart");
  var makale = document.querySelector("article");
  if (!btn || !makale) return;
  var cv = document.createElement("canvas");
  if (!cv.getContext || !cv.toBlob) return;
  btn.hidden = false;

  var W = 1080, H = 1350, PAD = 84;
  var RENK = { zemin: "#f9f9f7", murekkep: "#1a1a1a", ikincil: "#52514e", soluk: "#6f6d65", cizgi: "#e1e0d9" };

  function satirlaraBol(ctx, metin, enGenis) {
    var satirlar = [];
    metin.split("\n").forEach(function (parca) {
      var kelimeler = parca.split(/\s+/).filter(Boolean), s = "";
      if (!kelimeler.length) { satirlar.push(""); return; }
      kelimeler.forEach(function (k) {
        var dene = s ? s + " " + k : k;
        if (ctx.measureText(dene).width > enGenis && s) { satirlar.push(s); s = k; } else { s = dene; }
      });
      if (s) satirlar.push(s);
    });
    return satirlar;
  }
  function gorselYukle(src) {
    return new Promise(function (coz) {
      if (!src) { coz(null); return; }
      var im = new Image();
      im.onload = function () { coz(im); };
      im.onerror = function () { coz(null); };
      im.src = src;
    });
  }
  function yuvarlakDikdortgen(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function metinAl(el) {
    var k = el.cloneNode(true);
    k.querySelectorAll("br").forEach(function (b) { b.replaceWith("\n"); });
    return k.textContent.replace(/[ \t]+/g, " ").replace(/\n +/g, "\n").trim();
  }

  function ciz() {
    var baslik = (makale.querySelector("h1") || {}).textContent || document.title;
    var tarih = (makale.querySelector("time") || {}).textContent || "";
    var kapakImg = makale.querySelector(".kapak img");
    var ilk = Array.prototype.find.call(makale.querySelectorAll("p.dize, p:not(.meta)"), function (p) { return p.textContent.trim(); });
    var govde = ilk ? metinAl(ilk) : "";
    var fontlar = Promise.all([
      document.fonts.load('600 64px "Fraunces Dost"'),
      document.fonts.load('400 38px "Source Sans Dost"'),
    ]).catch(function () {});
    return Promise.all([gorselYukle(kapakImg && (kapakImg.currentSrc || kapakImg.src)), fontlar]).then(function (r) {
      var im = r[0];
      cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = RENK.zemin; ctx.fillRect(0, 0, W, H);

      // kapak: üstte, köşeleri yuvarlak, "cover" kırpmayla
      var kh = 520, y = PAD;
      if (im) {
        ctx.save();
        yuvarlakDikdortgen(ctx, PAD, y, W - 2 * PAD, kh, 28); ctx.clip();
        var oran = Math.max((W - 2 * PAD) / im.width, kh / im.height);
        var iw = im.width * oran, ih = im.height * oran;
        ctx.drawImage(im, PAD + (W - 2 * PAD - iw) / 2, y + (kh - ih) / 2, iw, ih);
        ctx.restore();
        y += kh + 56;
      } else { y += 40; }

      // mühür (mürekkep halka + nokta) ve tarih
      ctx.strokeStyle = RENK.murekkep; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(PAD + 14, y + 14, 13, 0, 7); ctx.stroke();
      ctx.fillStyle = RENK.murekkep; ctx.beginPath(); ctx.arc(PAD + 14, y + 14, 6, 0, 7); ctx.fill();
      ctx.fillStyle = RENK.soluk; ctx.font = '400 32px "Source Sans Dost", system-ui, sans-serif';
      ctx.textBaseline = "middle"; ctx.fillText(tarih, PAD + 44, y + 15);
      y += 62; ctx.textBaseline = "alphabetic";

      // başlık
      ctx.fillStyle = RENK.murekkep; ctx.font = '600 64px "Fraunces Dost", Georgia, serif';
      var bsat = satirlaraBol(ctx, baslik, W - 2 * PAD);
      bsat.slice(0, 3).forEach(function (s) { y += 76; ctx.fillText(s, PAD, y); });
      y += 30;

      // ilk dizeler (en çok 7 satır; taşarsa …)
      ctx.fillStyle = RENK.ikincil; ctx.font = '400 38px "Source Sans Dost", system-ui, sans-serif';
      var gsat = satirlaraBol(ctx, govde, W - 2 * PAD);
      var kalan = H - 190 - y, adet = Math.max(1, Math.min(7, Math.floor(kalan / 54)));
      var gor = gsat.slice(0, adet);
      if (gsat.length > adet) gor[gor.length - 1] = gor[gor.length - 1].replace(/[\s.,;:!?]+$/, "") + " …";
      gor.forEach(function (s) { y += 54; ctx.fillText(s, PAD, y); });

      // alt şerit: site adı + künye
      ctx.strokeStyle = RENK.cizgi; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD, H - 150); ctx.lineTo(W - PAD, H - 150); ctx.stroke();
      ctx.fillStyle = RENK.murekkep; ctx.font = '600 36px "Fraunces Dost", Georgia, serif';
      ctx.fillText("dostarabi.com", PAD, H - 92);
      ctx.fillStyle = RENK.soluk; ctx.font = '400 30px "Source Sans Dost", system-ui, sans-serif';
      ctx.fillText(btn.dataset.alt || "", PAD, H - 48);
      return new Promise(function (coz) { cv.toBlob(coz, "image/png"); });
    });
  }

  var etiket = btn.textContent;
  btn.addEventListener("click", function () {
    btn.disabled = true; btn.textContent = btn.dataset.hazir || etiket;
    var bitir = function () { btn.disabled = false; btn.textContent = etiket; };
    ciz().then(function (blob) {
      if (!blob) { bitir(); return; }
      var slug = (location.pathname.replace(/\/+$/, "").split("/").pop() || "gonul") + ".png";
      var dosya = null;
      try { dosya = new File([blob], slug, { type: "image/png" }); } catch (e) {}
      if (dosya && navigator.canShare && navigator.share && navigator.canShare({ files: [dosya] })) {
        return navigator.share({ files: [dosya], title: document.title }).catch(function () {}).then(bitir);
      }
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = slug;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
      bitir();
    }, bitir);
  });
})();
