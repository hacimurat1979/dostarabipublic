/* Gönül Defteri sayfalarında @revise (2026-10-28, kullanıcı isteği: "düzeltmeleri toplu şekilde json
   olarak yollayabilirim"). Bu sayfalar uygulama kabuğu değil, düz statik sayfalardır; edit-mode.js'in
   bağımlılıkları (graph-utils.js, panel CSS'i) yalnız kip AÇILIRSA indirilir: sıradan okuyucu bu
   betikten başka bir şey yüklemez ve kip dışında hiçbir şey yapmaz.
   Açma yolları (ana siteyle aynı): "@revise" yazmak, adrese "#revise" eklemek, üst bağlantıya
   (Dost Arabî) 700 ms basılı tutmak (telefon). Düzenlemeler yalnız bu tarayıcıda biriktirilir;
   "Claude'a gönder"/"Dışa aktar" JSON'u scripts/duzenleme-uygula.py işler (data/gonul/yazilar.json). */
(function () {
  "use strict";
  var KOD = "@revise", tampon = "", yukleniyor = false;
  var dil = (document.documentElement.lang || "tr").slice(0, 2);
  // edit-mode.js yalnız getLang()/pick3'e bakar: sayfanın KENDİ dili (adres = dil); i18n.js'in
  // localStorage tercihi bu sayfanın dilini ezmesin diye yedek tanım.
  if (!window.DostI18n) {
    window.DostI18n = {
      getLang: function () { return dil; },
      pick3: function (o) { return !o ? "" : (typeof o === "string" ? o : (o[dil] || o.tr || "")); },
      renderLangSwitcher: function () {},
    };
  }
  window.__dostKipYukleyici = true;   // edit-mode.js kendi klavye dinleyicisini kurmasın; kapıyı biz tutarız

  function sirayla(liste, sonra) {
    var i = 0;
    (function sonraki() {
      if (i >= liste.length) { sonra(); return; }
      var s = document.createElement("script");
      s.src = liste[i++];
      s.onload = sonraki;
      s.onerror = function () { yukleniyor = false; };
      document.head.appendChild(s);
    })();
  }
  function yukle(sonra) {
    if (window.__dostEditMode) { sonra(); return; }
    if (yukleniyor) return;
    yukleniyor = true;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "/assets/gonul-revise.css";
    document.head.appendChild(l);
    sirayla(["/assets/graph-utils.js", "/assets/edit-mode.js"], function () { yukleniyor = false; sonra(); });
  }
  function degistir() {
    yukle(function () { if (window.__dostEditMode) window.__dostEditMode.toggle(); });
  }

  window.addEventListener("keydown", function (e) {
    if (e.key.length !== 1 || e.metaKey) return;
    if ((e.ctrlKey || e.altKey) && !(e.ctrlKey && e.altKey)) return;   // AltGr "@" üretir
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    tampon = (tampon + e.key.toLowerCase()).slice(-KOD.length);
    if (tampon === KOD) { tampon = ""; degistir(); }
  });
  if (/^#revise$/i.test(location.hash)) {
    yukle(function () {
      if (window.__dostEditMode && !window.__dostEditMode.isOn()) window.__dostEditMode.toggle();
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* geçmiş yok */ }
    });
  }
  // Telefon: "Dost Arabî" bağlantısına 700 ms basılı tutmak.
  var zaman = null, x0 = 0, y0 = 0, yut = false;
  var kap = document.querySelector(".ust a");
  if (kap) {
    kap.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      x0 = e.clientX; y0 = e.clientY;
      clearTimeout(zaman);
      zaman = setTimeout(function () {
        zaman = null; yut = true;
        setTimeout(function () { yut = false; }, 900);
        if (navigator.vibrate) { try { navigator.vibrate(15); } catch (er) { /* titreşim yok */ } }
        degistir();
      }, 700);
    });
    kap.addEventListener("pointermove", function (e) {
      if (zaman && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) { clearTimeout(zaman); zaman = null; }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (a) { kap.addEventListener(a, function () { clearTimeout(zaman); zaman = null; }); });
    kap.addEventListener("click", function (e) { if (yut) { e.preventDefault(); } });
    kap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
})();
