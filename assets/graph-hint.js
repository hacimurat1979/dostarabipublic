(function () {
  "use strict";

  // .graph-hint butonları (Ontoloji/Esmâ/Hâller/Terimler/Sırlar grafiklerinin
  // sol üstündeki "i" ikonu) şimdiye kadar sadece native `title` tooltip'ine
  // güveniyordu -- hover ile görünüyordu ama tıklamak hiçbir şey yapmıyordu,
  // ve dokunmatik cihazlarda (hover diye bir şey olmadığı için) tamamen
  // erişilemezdi. Bu, tıklandığında aynı metni görünür bir baloncukta
  // gösteren, tekrar tıklayınca/Escape'le/başka yere tıklayınca kapanan
  // paylaşılan bir davranış ekliyor.

  const I18n = window.DostI18n;

  function pickFromTitle(title) {
    if (!title) return "";
    const parts = title.split(" / ");
    if (parts.length < 3) return title;
    const lang = I18n && I18n.getLang ? I18n.getLang() : "tr";
    const idx = lang === "en" ? 1 : lang === "pt" ? 2 : 0;
    return parts[idx] || parts[0];
  }

  // Telefon kabuğunda fare/klavye ipuçları dokunmaya çevrilir (2026-10-21 taraması MB-05:
  // ⓘ kartları telefonda "Ctrl (⌘) + tekerlek" diyordu). Metnin geri kalanı değişmez.
  const TELEFON_DEGIS = [
    [/Ctrl \(⌘\) \+ tekerlek ya da iki parmakla yakınlaştırın/g, "iki parmakla yakınlaştırın"],
    [/Ctrl \(⌘\) \+ tekerlek ile yakınlaştırın/g, "iki parmakla yakınlaştırın"],
    [/Ctrl \(⌘\) \+ scroll or pinch with two fingers to zoom/g, "pinch with two fingers to zoom"],
    [/Ctrl \(⌘\) \+ scroll to zoom/g, "pinch with two fingers to zoom"],
    [/Ctrl \(⌘\) \+ rolagem ou dois dedos para ampliar/g, "dois dedos para ampliar"],
    [/Ctrl \(⌘\) \+ rolagem para ampliar/g, "dois dedos para ampliar"],
    [/\btıklayın\b/g, "dokunun"], [/\bTıklayın\b/g, "Dokunun"],
    [/\bClick\b/g, "Tap"], [/\bclick\b/g, "tap"],
    [/\bClique\b/g, "Toque"], [/\bclique\b/g, "toque"],
  ];
  function telefonaUyarla(m) {
    if (!document.documentElement.classList.contains("dost-uygulama")) return m;
    return TELEFON_DEGIS.reduce((acc, [re, yeni]) => acc.replace(re, yeni), m);
  }

  let openPopover = null;
  let openForBtn = null;

  function close() {
    if (openPopover) {
      openPopover.remove();
      openPopover = null;
      openForBtn = null;
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".graph-hint");
    if (!btn) {
      close();
      return;
    }
    e.stopPropagation();
    const wasOpen = openForBtn === btn;
    close();
    if (wasOpen) return;

    const rect = btn.getBoundingClientRect();
    const pop = document.createElement("div");
    pop.className = "graph-hint-popover";
    pop.setAttribute("role", "tooltip");
    pop.textContent = telefonaUyarla(pickFromTitle(btn.getAttribute("title")));
    pop.style.top = rect.bottom + 8 + "px";
    pop.style.left = rect.left + "px";
    document.body.appendChild(pop);
    openPopover = pop;
    openForBtn = btn;
  });

  // Escape artık burada değil, GU.registerStepBack'in merkezi sırasında --
  // iki katman aynı anda açıkken tek Escape'in hepsini kapatmaması için.
  if (window.DostGraphUtils) {
    window.DostGraphUtils.registerStepBack(null, () => {
      if (!openPopover) return false;
      close();
      return true;
    });
  }
})();
