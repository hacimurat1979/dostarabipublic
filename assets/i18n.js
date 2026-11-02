window.DostI18n = (function () {
  "use strict";

  const LANGS = ["tr", "en", "pt"];
  const LANG_LABEL = { tr: "TR", en: "EN", pt: "PT" };

  function detectBrowserLang() {
    const candidates = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ""];
    for (const raw of candidates) {
      const code = (raw || "").toLowerCase();
      if (code.startsWith("pt")) return "pt";
      if (code.startsWith("en")) return "en";
      if (code.startsWith("tr")) return "tr";
    }
    return "tr";
  }

  // Sitenin kök yolu (<base href>; canlıda "", önizlemede bir alt yol).
  function routeBase() {
    const baseEl = document.querySelector("base");
    if (!baseEl) return "";
    try {
      return new URL(baseEl.getAttribute("href"), location.origin).pathname.replace(/\/+$/, "");
    } catch (e) { return ""; }
  }

  // Adres çubuğundaki dil öneki (/en/..., /pt/...) ya da null.
  function urlLang() {
    let yol = location.pathname;
    const b = routeBase();
    if (b && yol.startsWith(b)) yol = yol.slice(b.length);
    const m = /^\/(en|pt)(?=\/|$)/.exec(yol);
    return m ? m[1] : null;
  }

  function getLang() {
    // 2026-10-09 (dalga-web): adresin dil öneki her şeyin önünde. /en/esma/
    // bağlantısı İngilizce sayfa vaat ediyor; daha önce Türkçe seçmiş bir
    // ziyaretçide bile (localStorage) o bağlantı İngilizce açılmalı --
    // eskiden localStorage öneki eziyordu ve /en/ sayfası Türkçe açılıyordu.
    // Önek ancak kullanıcı dil seçicisinden dil değiştirince değişir
    // (setLang adresi de çevirir).
    const onek = urlLang();
    if (onek) return onek;
    let l = null;
    try { l = localStorage.getItem("dost-lang"); } catch (e) {}
    if (LANGS.includes(l)) return l;
    // SEO-03/04 (uzman paneli denetimi 2026-08-17): /en/ ve /pt/ önekli
    // statik kopyalar <html data-dost-lang="en"> da taşıyor.
    const attr = document.documentElement.getAttribute("data-dost-lang");
    if (LANGS.includes(attr)) return attr;
    return detectBrowserLang();
  }

  function setLang(l) {
    if (!LANGS.includes(l)) return;
    try { localStorage.setItem("dost-lang", l); } catch (e) {}
    // Adreste dil öneki varsa yeni dile çevrilir (TR: önek kalkar) --
    // önek getLang'de localStorage'dan önce geldiği için eskisi kalsaydı
    // seçim yeniden yüklemede geri alınırdı. Öneksiz (TR-kanonik) adres
    // öneksiz kalır; seçim localStorage'da taşınır.
    const onek = urlLang();
    if (onek && onek !== l) {
      const b = routeBase();
      const govde = location.pathname.slice(b.length).replace(/^\/(en|pt)(?=\/|$)/, "") || "/";
      const yeni = b + (l === "tr" ? "" : "/" + l) + govde;
      try { history.replaceState(history.state, "", yeni + location.search + location.hash); } catch (e) {}
    }
  }

  // obj has keys like `${base}_tr`, `${base}_en`, `${base}_pt`
  function pick(obj, base) {
    const lang = getLang();
    return obj[base + "_" + lang] || obj[base + "_en"] || obj[base + "_tr"] || "";
  }

  // obj is a nested { tr, en, pt } dict (used by ontology.json)
  function pick3(obj) {
    if (!obj) return "";
    const lang = getLang();
    return obj[lang] || obj.en || obj.tr || "";
  }

  function applyStatic(root) {
    const scope = root || document;
    const lang = getLang();
    scope.querySelectorAll("[data-tr]").forEach((el) => {
      const v = el.dataset[lang] || el.dataset.en || el.dataset.tr;
      // Metni içinde bağlantı taşıyan statik öğe (index.html'deki
      // .hakkinda-poem__source: "<a href=futuhat/c12k147>"): textContent
      // <a>'yı silip etiketi düz metin olarak basıyordu -- ontology.js
      // applyStatic'i açılışta çağırdığı için bağlantı ilk yüklemede
      // kopuyordu (2026-10-06 bağlanmamış düğme taraması). Değer
      // index.html'in kendi yazılmış metni, veri/kullanıcı girdisi değil;
      // innerHTML yalnız zaten çocuk öğe taşıyan öğelerde.
      if (el.children.length) el.innerHTML = v;
      else el.textContent = v;
    });
    // Metin taşımayan ama ada ihtiyacı olan öğeler (ana graf svg'leri gibi)
    // adlarını data-{dil}-aria-label ile veriyor -- textContent'e yazmak
    // svg'nin içeriğini silerdi (2026-07-28 denetimi).
    scope.querySelectorAll("[data-tr-aria-label]").forEach((el) => {
      const v = el.dataset[lang + "AriaLabel"] || el.dataset.enAriaLabel || el.dataset.trAriaLabel;
      if (v) el.setAttribute("aria-label", v);
    });
    // Graf köşe düğmelerinin title/aria-label'ı önceden üç dili tek metinde
    // birleştiriyordu ("A / B / C") -- fare imleci üstünde duran yerel
    // balon üçünü birden gösterip okunaksızlaşıyordu. Artık dile göre TEK
    // dil gösteriliyor (2026-08-01, kullanıcı geri bildirimi).
    scope.querySelectorAll("[data-tr-title]").forEach((el) => {
      const v = el.dataset[lang + "Title"] || el.dataset.enTitle || el.dataset.trTitle;
      if (v) {
        el.setAttribute("title", v);
        // Görünen yazı erişilebilir adın BAŞINDA olsun (WCAG 2.5.3, tarama 30 Ekim E12): ses komutu
        // "Zât'tan başla'ya dokun" adı bulabilsin; açıklama (title'ın metni) adın sonuna eklenir.
        const gorunen = (el.dataset.trGorunen === "0") ? "" : ((el.textContent || "").replace(/\s+/g, " ").trim());
        const baslar = gorunen && v.toLowerCase().indexOf(gorunen.toLowerCase()) === 0;
        el.setAttribute("aria-label", gorunen && gorunen.length <= 40 && !baslar && gorunen.toLowerCase() !== v.toLowerCase() ? gorunen + " — " + v : v);
      }
    });
    // Dile göre adres: <a href="gizlilik/" data-href-en="gizlilik/en/" data-href-pt="gizlilik/pt/">
    // (2026-10-21: gizlilik sayfası dil başına ayrı adres). Tr için href'in kendisi.
    scope.querySelectorAll("[data-href-en], [data-href-pt]").forEach((el) => {
      if (!el.dataset.hrefTr) el.dataset.hrefTr = el.getAttribute("href");
      const v = (lang === "en" ? el.dataset.hrefEn : lang === "pt" ? el.dataset.hrefPt : null) || el.dataset.hrefTr;
      if (v) el.setAttribute("href", v);
    });
    // PT sitenin Brezilya Portekizcesidir: ekran okuyucu/konuşma motoru pt-BR sesini seçsin (2026-10-29).
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    ucDilliAyir(scope);
  }

  // Tarama 30 Ekim (E7): "Paylaş / Share / Compartilhar" gibi üç dili tek metinde taşıyan aria-label/title
  // ekran okuyucuda her dilde üç kez okunuyordu. Burada seçili dile göre TEK dile indirilir; özgün metin
  // data-uc-dil'de durur, dil değişince yeniden seçilir. Ayraç " / " (tam üç parça) ya da " — " (tam üç parça).
  function ucDilliAyir(scope) {
    const lang = getLang();
    const i = LANGS.indexOf(lang);
    const kok = scope && scope.querySelectorAll ? scope : document;
    ["aria-label", "title"].forEach((nitelik) => {
      const adaylar = Array.prototype.slice.call(kok.querySelectorAll("[" + nitelik + "*=' / '], [" + nitelik + "*=' — '], [data-uc-dil-" + nitelik + "]"));
      if (kok !== document && kok.getAttribute && kok.getAttribute(nitelik)) adaylar.push(kok);
      adaylar.forEach((el) => {
        const anahtar = "ucDil" + (nitelik === "title" ? "Title" : "AriaLabel");
        let ozgun = el.dataset[anahtar];
        if (!ozgun) {
          const v = el.getAttribute(nitelik) || "";
          let parca = v.split(" — ");
          if (parca.length !== 3 || parca.some((x) => !x.trim())) parca = v.split(" / ");
          if (parca.length !== 3 || parca.some((x) => !x.trim()) || v.length > 700) return;
          ozgun = v;
          el.dataset[anahtar] = ozgun;
        }
        let parca = ozgun.split(" — ");
        if (parca.length !== 3) parca = ozgun.split(" / ");
        const yeni = (parca[i] || parca[0]).trim();
        if (el.getAttribute(nitelik) !== yeni) el.setAttribute(nitelik, yeni);
      });
    });
  }
  // Sonradan kurulan öğeler (JS ile üretilen düğmeler) için tek gözlemci; kareden kareye birleştirilir.
  (function ucDilliGozle() {
    if (typeof MutationObserver === "undefined" || !document.documentElement) return;
    let bekliyor = false;
    const tara = () => { bekliyor = false; ucDilliAyir(document); };
    new MutationObserver((kayitlar) => {
      if (bekliyor) return;
      for (let k = 0; k < kayitlar.length; k++) { if (kayitlar[k].type === "childList" && kayitlar[k].addedNodes.length) { bekliyor = true; requestAnimationFrame(tara); return; } }
    }).observe(document.documentElement, { childList: true, subtree: true });
  })();

  function renderLangSwitcher(container, onChange) {
    container.innerHTML = "";
    const lang = getLang();
    LANGS.forEach((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = LANG_LABEL[l];
      b.className = "lang-btn" + (l === lang ? " lang-btn--active" : "");
      b.setAttribute("aria-pressed", String(l === lang));
      b.addEventListener("click", () => {
        if (getLang() === l) return;
        setLang(l);
        applyStatic();
        renderLangSwitcher(container, onChange);
        // Düğmeler yeniden kurulduğu için odak body'ye düşerdi (E-05): seçili dile ver.
        const yeni = container.querySelector(".lang-btn--active");
        if (yeni) { try { yeni.focus({ preventScroll: true }); } catch (e) { /* odaklanamaz */ } }
        if (onChange) onChange(l);
      });
      container.appendChild(b);
    });
  }

  return { LANGS, getLang, setLang, urlLang, pick, pick3, applyStatic, renderLangSwitcher };
})();
