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
  // @share görsel kart paneli haritalarda ve okuma görünümlerinde çalışır; burada neden açılmadığını söyler.
  function shareIpucu() {
    var o = document.getElementById("dost-share-ipucu");
    if (o) { o.remove(); return; }
    var d = { tr: ["@share haritalarda ve okuma görünümlerinde açılır.", "Ana siteye git"], en: ["@share opens in the maps and reading views.", "Go to the main site"], pt: ["@share abre nos mapas e nas visões de leitura.", "Ir ao site principal"] }[dil] || [];
    if (!d.length) d = ["@share haritalarda ve okuma görünümlerinde açılır.", "Ana siteye git"];
    o = document.createElement("div"); o.id = "dost-share-ipucu"; o.setAttribute("role", "status");
    o.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:84px;z-index:96;max-width:calc(100vw - 32px);padding:10px 14px;border-radius:14px;border:1px solid var(--gridline,#d9d6cd);background:var(--surface-1,#f1efe9);color:var(--text-primary,#1d1c1a);font:600 .9rem system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.18);display:flex;gap:12px;align-items:center";
    var t = document.createElement("span"); t.textContent = d[0];
    var a = document.createElement("a"); a.href = "/"; a.textContent = d[1]; a.style.cssText = "color:inherit;text-decoration:underline;min-height:44px;display:inline-flex;align-items:center";
    o.appendChild(t); o.appendChild(a); document.body.appendChild(o);
    setTimeout(function () { if (o.parentNode) o.remove(); }, 6000);
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
    // Öteki gizli kısayollar da düz statik sayfalarda çalışır (2026-11-02): ana uygulamanın yükleyicisi bu sayfalarda yok.
    else if (/@daphne$/.test(tampon)) { tampon = ""; location.href = "/compare.html"; }
    else if (/@share$/.test(tampon)) { tampon = ""; shareIpucu(); }
  });
  // Düz statik sayfalarda kip sayfadan sayfaya TAŞINMAZ (2026-11-02, kullanıcı notu: not düğmeleri yalnız "@revise" yazıldığında görünsün).
  // Ana uygulamadan açık kalmış bayrak burada temizlenir; "@revise" her zaman bu sayfada kipi açar.
  try { if (localStorage.getItem("dost-edit-mode-on") === "1") localStorage.setItem("dost-edit-mode-on", "0"); } catch (e) { /* localStorage kapalı */ }
  if (/^#revise$/i.test(location.hash)) {
    yukle(function () {
      if (window.__dostEditMode && !window.__dostEditMode.isOn()) window.__dostEditMode.toggle();
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* geçmiş yok */ }
    });
  }
  // Genel dil seçici (2026-11-02, kullanıcı notu: "dil seçim seçenekleri global olsa"): düz statik sayfaların üst satırına TR · EN · PT.
  // Sayfanın kendi dil bağlantıları varsa (Gönül, Gizlilik) dokunmaz. <link rel="alternate" hreflang> varsa oraya gider; yoksa
  // (Yan Yana yalnız Türkçe) EN/PT pasif ve nedeni başlıkta yazılı. Seçim "dost-lang" tercihine de yazılır.
  function dilSecici() {
    var ust = document.querySelector(".ust");
    if (!ust || ust.querySelector("a[hreflang]") || document.querySelector("a[hreflang][aria-current]")) return;
    var alt = {};
    [].forEach.call(document.querySelectorAll('link[rel="alternate"][hreflang]'), function (l) {
      var k = (l.getAttribute("hreflang") || "").slice(0, 2).toLowerCase();
      try { alt[k] = new URL(l.href).pathname; } catch (e) { /* geçersiz adres */ }
    });
    var kap = document.createElement("span");
    kap.setAttribute("role", "group"); kap.setAttribute("aria-label", "Dil / Language / Idioma");
    kap.style.cssText = "display:inline-flex;gap:4px;margin-left:auto";
    [["tr", "TR", "Türkçe"], ["en", "EN", "English"], ["pt", "PT", "Português (Brasil)"]].forEach(function (d) {
      var gecerli = d[0] === dil, yol = alt[d[0]] || (d[0] === "tr" && !Object.keys(alt).length ? location.pathname : "");
      var e = document.createElement(gecerli || !yol ? "span" : "a");
      e.textContent = d[1];
      e.style.cssText = "display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;padding:0 10px;border:1px solid var(--gridline,#d9d6cd);border-radius:22px;font-size:.85rem;text-decoration:none;color:var(--text-secondary,#4d4b46)";
      if (gecerli) { e.setAttribute("aria-current", "true"); e.style.borderColor = "var(--accent-interactive,#8a6100)"; e.style.color = "var(--text-primary,#1d1c1a)"; e.style.fontWeight = "600"; }
      else if (!yol) { e.setAttribute("aria-disabled", "true"); e.style.opacity = ".45"; e.title = { tr: "Bu bölüm şimdilik yalnız Türkçe", en: "This section is Turkish-only for now", pt: "Esta seção está só em turco por enquanto" }[dil] || "Yalnız Türkçe"; }
      else { e.href = yol; e.lang = d[0]; e.hreflang = d[0]; e.addEventListener("click", function () { try { localStorage.setItem("dost-lang", d[0]); } catch (er) { /* depolama kapalı */ } }); e.title = d[2]; }
      kap.appendChild(e);
    });
    ust.appendChild(kap);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", dilSecici); else dilSecici();
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
