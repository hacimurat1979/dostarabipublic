/* Defterim yedeği ve cihaz taşıma (2026-10-29, Defterim 2.0; kavram-defteri.js "Yedek ve taşıma" düğmesiyle tembel iner).
 *
 * Defterim (dost-defter: yıldızlı kayıtlar) ve Notlarım (dost-notlarim: paragraf notları) yalnız bu cihazın
 * localStorage'ındadır; bu pencere onları cihazdan çıkarmanın üç yolunu verir, hiçbiri sunucuya gitmez:
 *   - Markdown: okunur bir döküm (panoya kopyala / .md dosyası).
 *   - JSON yedeği: dosya olarak indir; "Yedekten yükle" ile geri getir.
 *   - Taşıma kodu: yedeğin metin hâli (sıkıştırılmış, base64); başka cihazda "Kodu yapıştır" ile birleşir.
 * Yükleme birleştirir, üstüne yazmaz: aynı adresli kayıt ve aynı paragraftaki not zaten varsa dokunulmaz.
 * QR yok: bir not defteri tek bir QR'a sığmaz; kod kopyalanıp bir mesajla ya da kendine e-postayla taşınır.
 */
(function () {
  "use strict";
  if (window.DostDefterYedek) return;
  var GU = window.DostGraphUtils;
  function t3(tr, en, pt) { var I = window.DostI18n; return I && I.pick3 ? I.pick3({ tr: tr, en: en, pt: pt }) : tr; }
  function gk(fn, y) { try { return fn(); } catch (e) { return y; } }
  var DEFTER = "dost-defter", NOTLAR = "dost-notlarim", VURGULAR = "dost-vurgular";

  function oku(k) { var a = gk(function () { return JSON.parse(localStorage.getItem(k) || "[]"); }, []); return Array.isArray(a) ? a : []; }
  function yaz(k, a) { gk(function () { localStorage.setItem(k, JSON.stringify(a)); }); }
  // Ayarlar (2026-10-30, fikir E7): dil, tema, yazı boyu, okuma kipi ve hızı, çevrimdışı paket seçimi yedeğe girer;
  // içe alınınca yazılır. Başka hiçbir depo anahtarı taşınmaz.
  var AYARLAR = ["dost-lang", "dost-theme", "dost-font-scale", "dost-okuma-kipi", "dost-okuma-hiz", "dost-gunluk-acik", "dost-okuma-satir", "dost-okuma-sutun", "dost-okuma-yazi", "dost-cevrimdisi-paketler"];
  function ayarlar() { var o = {}; AYARLAR.forEach(function (k) { var v = gk(function () { return localStorage.getItem(k); }, null); if (v != null) o[k] = v; }); return o; }
  function yedek() { return { dost: "defterim", surum: 1, tarih: new Date().toISOString(), defter: oku(DEFTER), notlar: oku(NOTLAR), vurgular: oku(VURGULAR), ayarlar: ayarlar() }; }

  // ── Markdown ───────────────────────────────────────────────────────────
  function mutlak(yol) { try { return new URL(yol, location.origin).href; } catch (e) { return yol; } }
  function etk(e) { return Array.isArray(e.etiketler) && e.etiketler.length ? "  " + e.etiketler.map(function (x) { return "#" + String(x).replace(/\s+/g, "_"); }).join(" ") : ""; }
  function gunlukObj() { try { var o = JSON.parse(localStorage.getItem("dost-gunluk") || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function markdown() {
    var d = oku(DEFTER), n = oku(NOTLAR), vg = oku(VURGULAR);
    // Obsidian / Notion için YAML başlığı (2026-10-30, fikir D12): kaynak, tarih, sayılar.
    var s = "---\nkaynak: Dost Arabî (dostarabi.com)\ntur: defterim\ntarih: " + new Date().toISOString().slice(0, 10) + "\nkayit: " + d.length + "\nnot: " + n.length + "\nvurgu: " + vg.length + "\n---\n\n# " + t3("Defterim — Dost Arabî", "My Notebook — Dost Arabî", "Meu Caderno — Dost Arabî") + "\n\n"
      + "_" + t3("Dışa aktarma", "Exported", "Exportado") + ": " + new Date().toISOString().slice(0, 10) + "_\n";
    if (d.length) {
      s += "\n## " + t3("Kayıtlar", "Saved items", "Itens salvos") + "\n\n";
      d.forEach(function (e) { s += "- [" + (e.title || e.href) + "](" + e.href + ")" + (e.eyebrow ? " — " + e.eyebrow : "") + etk(e) + "\n"; });
    }
    if (n.length) {
      s += "\n## " + t3("Notlarım", "My notes", "Minhas notas") + "\n";
      n.forEach(function (e) {
        s += "\n### [" + (e.baslik || e.yol) + "](" + mutlak(e.yol) + ")\n\n> “" + (e.alinti || "") + "…”\n\n" + (e.metin || "") + etk(e) + "\n";
      });
    }
    var gl = gunlukObj(), gunler = Object.keys(gl).sort().reverse();
    if (gunler.length) {
      s += "\n## " + t3("Okuma günlüğüm", "My reading log", "Meu diário de leitura") + "\n";
      gunler.forEach(function (g) {
        s += "\n### " + g + "\n\n";
        gl[g].forEach(function (x) { s += "- [" + (x.baslik || x.yol) + "](" + mutlak(x.yol) + ")\n"; });
      });
    }
    if (vg.length) {
      s += "\n## " + t3("Vurgularım", "My highlights", "Meus destaques") + "\n";
      vg.forEach(function (e) {
        s += "\n- [" + (e.baslik || e.yol) + "](" + mutlak(e.yol) + "): “" + (e.metin || "") + "”" + etk(e) + "\n";
      });
    }
    return s;
  }

  // ── Taşıma kodu ────────────────────────────────────────────────────────
  function b64uYaz(bayt) { var s = ""; for (var i = 0; i < bayt.length; i++) s += String.fromCharCode(bayt[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64uOku(str) {
    var s = str.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
    var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a;
  }
  function akisBayt(akis) { return new Response(akis).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function kodUret() {
    var ham = new TextEncoder().encode(JSON.stringify(yedek()));
    if (typeof CompressionStream === "function") {
      var cs = new CompressionStream("deflate-raw");
      var w = cs.writable.getWriter(); w.write(ham); w.close();
      return akisBayt(cs.readable).then(function (b) { return "DOST1z." + b64uYaz(b); });
    }
    return Promise.resolve("DOST1." + b64uYaz(ham));
  }
  function kodCoz(kod) {
    kod = (kod || "").trim().replace(/\s+/g, "");
    var m = kod.match(/^DOST1(z?)\.(.+)$/);
    if (!m) return Promise.reject(new Error("biçim"));
    var bayt = gk(function () { return b64uOku(m[2]); }, null);
    if (!bayt) return Promise.reject(new Error("biçim"));
    if (m[1]) {
      if (typeof DecompressionStream !== "function") return Promise.reject(new Error("sıkıştırma"));
      var ds = new DecompressionStream("deflate-raw");
      var w = ds.writable.getWriter(); w.write(bayt); w.close();
      return akisBayt(ds.readable).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
    }
    return Promise.resolve(JSON.parse(new TextDecoder().decode(bayt)));
  }

  // ── Birleştirme ────────────────────────────────────────────────────────
  function birlestir(y) {
    if (!y || y.dost !== "defterim") throw new Error("biçim");
    var d = oku(DEFTER), n = oku(NOTLAR), vg = oku(VURGULAR), ed = 0, en = 0, ev = 0;
    function etiketTemizle(a) { return Array.isArray(a) ? a.map(function (x) { return String(x).slice(0, 24); }).slice(0, 8) : undefined; }
    (y.defter || []).forEach(function (e) {
      if (e && e.href && e.title && !d.some(function (x) { return x.href === e.href; })) { d.push({ href: String(e.href), title: String(e.title), eyebrow: String(e.eyebrow || ""), addedAt: +e.addedAt || Date.now(), etiketler: etiketTemizle(e.etiketler) }); ed++; }
    });
    (y.notlar || []).forEach(function (e) {
      if (e && e.yol && e.metin && !n.some(function (x) { return x.yol === e.yol && x.alinti === e.alinti; })) {
        n.push({ id: String(e.id || "n" + Date.now().toString(36) + en), yol: String(e.yol), baslik: String(e.baslik || ""), alinti: String(e.alinti || ""), metin: String(e.metin).slice(0, 800), t: +e.t || Date.now(), etiketler: etiketTemizle(e.etiketler) }); en++;
      }
    });
    (y.vurgular || []).forEach(function (e) {
      if (e && e.yol && e.metin && e.alinti && !vg.some(function (x) { return x.yol === e.yol && x.alinti === e.alinti && x.bas === e.bas && x.son === e.son; })) {
        vg.push({ id: String(e.id || "v" + Date.now().toString(36) + ev), yol: String(e.yol), baslik: String(e.baslik || ""), alinti: String(e.alinti), bas: +e.bas || 0, son: +e.son || 0, metin: String(e.metin).slice(0, 300), renk: ["altin", "mavi", "yesil"].indexOf(e.renk) >= 0 ? e.renk : "altin", t: +e.t || Date.now(), etiketler: etiketTemizle(e.etiketler) }); ev++;
      }
    });
    var aySay = 0;
    if (y.ayarlar && typeof y.ayarlar === "object") AYARLAR.forEach(function (k) { if (typeof y.ayarlar[k] === "string") { gk(function () { localStorage.setItem(k, y.ayarlar[k]); }); aySay++; } });
    yaz(DEFTER, d); yaz(NOTLAR, n); yaz(VURGULAR, vg);
    gk(function () { window.dispatchEvent(new Event("dost-notlar")); window.dispatchEvent(new Event("storage")); });
    return { kayit: ed, not: en, vurgu: ev, ayar: aySay };
  }

  // ── Pencere ────────────────────────────────────────────────────────────
  var kutu = null, durumEl = null, oncekiOdak = null;
  function durum(metin) { if (durumEl) durumEl.textContent = metin; }
  function indir(ad, metin, tur) {
    var u = URL.createObjectURL(new Blob([metin], { type: tur }));
    var a = document.createElement("a"); a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function kopyala(metin) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(metin).then(function () { return true; }, function () { return false; });
    return Promise.resolve(false);
  }
  function kapat() {
    if (!kutu) return false;
    kutu.remove(); kutu = null; durumEl = null;
    if (oncekiOdak && oncekiOdak.focus) gk(function () { oncekiOdak.focus(); });
    return true;
  }
  function ac() {
    if (kutu) return;
    oncekiOdak = document.activeElement;
    kutu = document.createElement("section");
    kutu.className = "defter-yedek"; kutu.setAttribute("role", "dialog"); kutu.setAttribute("aria-modal", "true");
    kutu.setAttribute("aria-label", t3("Yedek ve taşıma", "Backup and transfer", "Backup e transferência"));
    var d = oku(DEFTER).length, n = oku(NOTLAR).length;
    kutu.innerHTML = '<div class="defter-yedek__kart">'
      + '<header class="defter-yedek__bas"><h2></h2><button type="button" class="defter-yedek__kapat" data-e="kapat">×</button></header>'
      + '<p class="defter-yedek__ozet"></p>'
      + '<div class="defter-yedek__grup"><h3 data-y="md"></h3><div class="defter-yedek__sira"><button type="button" data-e="md-kopya"></button><button type="button" data-e="md-indir"></button></div></div>'
      + '<div class="defter-yedek__grup"><h3 data-y="json"></h3><div class="defter-yedek__sira"><button type="button" data-e="json-indir"></button><button type="button" data-e="json-yukle"></button><input type="file" accept="application/json,.json" hidden></div></div>'
      + '<div class="defter-yedek__grup"><h3 data-y="kod"></h3><textarea class="defter-yedek__kod" rows="3" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>'
      + '<div class="defter-yedek__sira"><button type="button" data-e="kod-uret"></button><button type="button" data-e="kod-kopya"></button><button type="button" data-e="kod-al"></button></div></div>'
      + '<p class="defter-yedek__durum" role="status" aria-live="polite"></p></div>';
    var T = {
      h2: t3("Yedek ve taşıma", "Backup and transfer", "Backup e transferência"),
      ozet: t3(d + " kayıt, " + n + " not — hepsi yalnız bu cihazda; buradan çıkardığın şey senin elinde.", d + " items, " + n + " notes — all on this device only; whatever you export is in your hands.", d + " itens, " + n + " notas — tudo apenas neste dispositivo; o que você exporta fica com você."),
      md: t3("Okunur döküm (Markdown)", "Readable copy (Markdown)", "Cópia legível (Markdown)"),
      json: t3("Yedek dosyası", "Backup file", "Arquivo de backup"),
      kod: t3("Başka cihaza taşı: taşıma kodu", "Move to another device: transfer code", "Levar para outro dispositivo: código de transferência"),
      "md-kopya": t3("Panoya kopyala", "Copy to clipboard", "Copiar"), "md-indir": t3("Dosya olarak indir (.md)", "Download as file (.md)", "Baixar arquivo (.md)"),
      "json-indir": t3("Yedeği indir (.json)", "Download backup (.json)", "Baixar backup (.json)"), "json-yukle": t3("Yedekten yükle", "Restore from backup", "Restaurar do backup"),
      "kod-uret": t3("Kodu üret", "Generate code", "Gerar código"), "kod-kopya": t3("Kodu kopyala", "Copy code", "Copiar código"), "kod-al": t3("Kodu yapıştırdım, al", "I pasted a code, import it", "Colei um código, importar"),
    };
    kutu.querySelector("h2").textContent = T.h2;
    kutu.querySelector(".defter-yedek__ozet").textContent = T.ozet;
    kutu.querySelectorAll("h3[data-y]").forEach(function (h) { h.textContent = T[h.dataset.y]; });
    kutu.querySelectorAll("button[data-e]").forEach(function (b) { if (T[b.dataset.e]) b.textContent = T[b.dataset.e]; });
    kutu.querySelector(".defter-yedek__kapat").setAttribute("aria-label", t3("Kapat", "Close", "Fechar"));
    kutu.querySelector(".defter-yedek__kod").placeholder = t3("Başka cihazdan aldığın kodu buraya yapıştır…", "Paste the code from your other device here…", "Cole aqui o código do seu outro dispositivo…");
    durumEl = kutu.querySelector(".defter-yedek__durum");
    var kod = kutu.querySelector(".defter-yedek__kod"), dosya = kutu.querySelector('input[type="file"]');

    function sonuc(r) { durum(t3(r.kayit + " kayıt, " + r.not + " not ve " + r.vurgu + " vurgu eklendi" + (r.ayar ? "; " + r.ayar + " ayar yazıldı (sayfayı yenile)." : "."), r.kayit + " items, " + r.not + " notes and " + r.vurgu + " highlights added" + (r.ayar ? "; " + r.ayar + " setting(s) written (reload the page)." : "."), r.kayit + " itens, " + r.not + " notas e " + r.vurgu + " destaques adicionados" + (r.ayar ? "; " + r.ayar + " ajuste(s) gravado(s) (recarregue a página)." : "."))); }
    function hata() { durum(t3("Bu bir Defterim yedeği ya da taşıma kodu gibi görünmüyor.", "This does not look like a notebook backup or transfer code.", "Isto não parece um backup ou código de transferência do caderno.")); }
    kutu.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-e]");
      if (!b) { if (ev.target === kutu) kapat(); return; }
      var e = b.dataset.e;
      if (e === "kapat") kapat();
      else if (e === "md-kopya") kopyala(markdown()).then(function (ok) { durum(ok ? t3("Kopyalandı.", "Copied.", "Copiado.") : t3("Kopyalanamadı; dosya olarak indirmeyi dene.", "Could not copy; try downloading the file.", "Não foi possível copiar; tente baixar o arquivo.")); });
      else if (e === "md-indir") { indir("dost-defterim.md", markdown(), "text/markdown"); durum(t3("İndirme başlatıldı (dosya yoksa panoya kopyalamayı dene).", "Download started (if no file appears, try copying instead).", "Download iniciado (se nenhum arquivo aparecer, tente copiar).")); }
      else if (e === "json-indir") { indir("dost-defterim.json", JSON.stringify(yedek(), null, 2), "application/json"); durum(t3("İndirme başlatıldı.", "Download started.", "Download iniciado.")); }
      else if (e === "json-yukle") dosya.click();
      else if (e === "kod-uret") kodUret().then(function (k) { kod.value = k; kod.select(); durum(t3("Kod hazır; kopyalayıp diğer cihazda yapıştır.", "Code ready; copy it and paste on the other device.", "Código pronto; copie e cole no outro dispositivo.")); });
      else if (e === "kod-kopya") { if (!kod.value) { durum(t3("Önce kodu üret.", "Generate the code first.", "Gere o código primeiro.")); return; } kopyala(kod.value).then(function (ok) { if (!ok) kod.select(); durum(ok ? t3("Kopyalandı.", "Copied.", "Copiado.") : t3("Kod seçildi; elle kopyala.", "Code selected; copy it by hand.", "Código selecionado; copie manualmente.")); }); }
      else if (e === "kod-al") kodCoz(kod.value).then(function (y) { sonuc(birlestir(y)); }).catch(hata);
    });
    dosya.addEventListener("change", function () {
      var f = dosya.files && dosya.files[0]; if (!f) return;
      f.text().then(function (m) { sonuc(birlestir(JSON.parse(m))); }).catch(hata);
      dosya.value = "";
    });
    kutu.addEventListener("keydown", function (ev) {
      if (ev.key !== "Tab") return;
      var f = Array.prototype.filter.call(kutu.querySelectorAll("button, textarea"), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    });
    document.body.appendChild(kutu);
    gk(function () { kutu.querySelector('button[data-e="md-kopya"]').focus({ preventScroll: true }); });
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return kapat(); }, { oncelikli: true });
  window.DostDefterYedek = { ac: ac, _markdown: markdown, _kodUret: kodUret, _kodCoz: kodCoz, _birlestir: birlestir };
})();
