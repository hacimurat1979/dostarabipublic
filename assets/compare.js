(function () {
  "use strict";

  const I18n = window.DostI18n;

  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");
  const detailClose = document.getElementById("detail-close");

  I18n.applyStatic();

  // Y7 (2026-10-21, kullanıcı onayı), Daphne haritalarına telefon sözleşmesinin dokunma ilkesi:
  // düğümler ~7 px görünüyordu; dar ekranda her düğümün çevresine, ekran pikselinde sabit (ölçekten
  // bağımsız) ~40 px'lik görünmez yakalama halkası eklenir (görünür nokta küçük kalsa da hedef
  // parmak boyunda). Grafik yeniden çizilince (dil/sekme) halka yeniden eklenir. Kip hapı ve yarım
  // panel bu sayfada yok: Daphne ayrı belge (uygulama kabuğu dışında), motor yalnız kabukta çalışır.
  (function dokunmaHedefleri() {
    if (!window.matchMedia) return;
    const dar = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const KOKLER = ["#graph", "#profile-graph", "#bagharita-graph", "#baglar-graph"];
    function ekle(svg) {
      if (!dar.matches) return;
      svg.querySelectorAll("g.node, g.daphne-leaf-node").forEach((g) => {
        if (g.querySelector(":scope > .node-hit")) return;
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("class", "node-hit"); c.setAttribute("r", "4"); c.setAttribute("aria-hidden", "true");
        g.insertBefore(c, g.firstChild);
      });
    }
    let t = null;
    function planla(svg) { clearTimeout(t); t = setTimeout(() => ekle(svg), 120); }
    KOKLER.forEach((sel) => {
      const svg = document.querySelector(sel);
      if (!svg || !window.MutationObserver) return;
      new MutationObserver(() => planla(svg)).observe(svg, { childList: true, subtree: true });
      ekle(svg);
    });
  })();

  // 2026-10-21 (tasarım revizyonu #19): geniş ekranda A−/A+ başlık şeridinin denetimlerine
  // taşınır (üst bölge tek satıra yaklaşır); telefonda eski yerinde kalır (şerit dar).
  (function yaziCubuguYerlestir() {
    const bar = document.querySelector(".daphne-yazi-cubugu");
    const kontrol = document.querySelector(".app-header__controls");
    if (!bar || !kontrol || !window.matchMedia) return;
    const ana = bar.parentNode, sonraki = bar.nextElementSibling;
    const mq = window.matchMedia("(min-width: 641px)");
    function uygula() {
      if (mq.matches) { if (bar.parentNode !== kontrol) kontrol.insertBefore(bar, kontrol.firstChild); bar.classList.add("daphne-yazi-cubugu--ust"); }
      else if (bar.parentNode !== ana) { ana.insertBefore(bar, sonraki); bar.classList.remove("daphne-yazi-cubugu--ust"); }
    }
    uygula();
    if (mq.addEventListener) mq.addEventListener("change", uygula);
  })();
  // Dil değişince İKİ graf da yeniden çizilmeli: Daphne profili artık ayrı
  // bir sayfa değil, bu sayfanın bir sekmesi (2026-07-27).
  // Tek dil kapısı (2026-10-19): sayfa başlığındaki seçici ve yazı okumasının
  // kendi seçicisi aynı işlevi çağırır; ikisi de güncel dili gösterir.
  const dilKap = document.getElementById("lang-switch");
  function dilDegisti() {
    if (window.__dostOrtakTemalarApp) window.__dostOrtakTemalarApp.render();
    if (window.__dostDaphneProfileApp) window.__dostDaphneProfileApp.render();
    if (window.__dostDaphneBagHaritasiApp) window.__dostDaphneBagHaritasiApp.render();
    if (window.__dostDaphneBaglarApp) window.__dostDaphneBaglarApp.render();
    if (window.__dostDaphneSeyirApp) window.__dostDaphneSeyirApp.render();
    if (window.__dostDaphneOkuma) window.__dostDaphneOkuma.yenile();
    I18n.applyStatic();
    baslikGuncelle();
    I18n.renderLangSwitcher(dilKap, dilDegisti);
  }
  window.__dostDilDegisti = dilDegisti;
  // Belge başlığı dile göre (2026-10-20 taraması F11: statik Türkçe kalıyordu).
  function baslikGuncelle() {
    document.title = I18n.pick3({
      tr: "Dost — Daphne: Yazılar ve Eksenler",
      en: "Dost — Daphne: Writings and Axes",
      pt: "Dost — Daphne: Textos e Eixos",
    });
  }
  baslikGuncelle();
  I18n.renderLangSwitcher(dilKap, dilDegisti);
  window.DostGraphUtils.setupLegendToggles();
  window.DostGraphUtils.setupDetailPanelFocus();

  // Yazı boyutu (2026-10-18, kullanıcı isteği): Daphne sayfalarının kendi
  // A−/A+ çifti -- detay panelindeki (reading-mode.js) ve yazı okumasındakiyle
  // aynı ortak ölçeği (assets/font-scale.js) kullanır.
  if (window.DostFontScale) window.DostFontScale.bindFontScaleButtons(
    document.getElementById("daphne-font-decrease"), document.getElementById("daphne-font-increase"));

  // Sekmeler. "Daphne'nin Profili" ile "Taranan Yazılar" 2026-07-27'ye
  // kadar ayrı bir sayfaydı (daphne-profil.html, "understand" yazınca
  // açılıyordu); o sayfa silindi, içeriği buraya sekme olarak taşındı.
  // Profil grafiği ilk kez sekmesi açıldığında kuruluyor -- bölüm
  // gizliyken svg genişliği 0 olur ve graf bozuk çıkar.
  (function wireTabs() {
    const tabButtons = document.querySelectorAll("#compare-tabs .bookmap-tab");
    if (!tabButtons.length) return;
    const tabPanels = document.querySelectorAll("[data-tab-panel]");
    // Her sekmenin kendi tanıtım metni ve kendi grafiği (2026-10-10: Ortak
    // Temalar ve Bağlar Haritası geri geldi, Eksen İplikleri yanında).
    const intros = {
      temalar: document.getElementById("intro-text-temalar"),
      profil: document.getElementById("intro-text-profile"),
      bagharita: document.getElementById("intro-text-bagharita"),
      baglar: document.getElementById("intro-text-baglar"),
      seyir: document.getElementById("intro-text-seyir"),
    };
    const uygulamalar = {
      temalar: () => window.__dostOrtakTemalarApp,
      profil: () => window.__dostDaphneProfileApp,
      yazilar: () => window.__dostDaphneProfileApp,
      bagharita: () => window.__dostDaphneBagHaritasiApp,
      baglar: () => window.__dostDaphneBaglarApp,
      seyir: () => window.__dostDaphneSeyirApp,
    };
    // ARIA sekme deseni (2026-10-20 taraması A7/F13): aria-controls +
    // role=tabpanel/aria-labelledby, roving tabindex, ←/→/Home/End.
    const panelBul = (tab) => document.querySelector('[data-tab-panel="' + tab + '"]');
    tabButtons.forEach((b) => {
      const tab = b.dataset.tab;
      const panel = panelBul(tab);
      b.id = b.id || ("tab-" + tab);
      if (panel) {
        panel.id = panel.id || ("panel-" + tab);
        b.setAttribute("aria-controls", panel.id);
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", b.id);
      }
      b.setAttribute("tabindex", b.classList.contains("bookmap-tab--active") ? "0" : "-1");
      b.addEventListener("keydown", (e) => {
        const i = Array.prototype.indexOf.call(tabButtons, b);
        let j = -1;
        if (e.key === "ArrowRight") j = (i + 1) % tabButtons.length;
        else if (e.key === "ArrowLeft") j = (i - 1 + tabButtons.length) % tabButtons.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabButtons.length - 1;
        if (j < 0) return;
        e.preventDefault();
        tabButtons[j].focus();
        tabButtons[j].click();
      });
    });
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        tabButtons.forEach((b) => {
          b.classList.toggle("bookmap-tab--active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
          b.setAttribute("tabindex", b === btn ? "0" : "-1");
        });
        tabPanels.forEach((p) => { p.hidden = p.dataset.tabPanel !== tab; });
        Object.keys(intros).forEach((k) => { if (intros[k]) intros[k].hidden = tab !== k; });
        detailPanel.hidden = true;
        // Dar ekranda sekme çubuğu yatay kayıyor: seçilen sekme görünsün.
        if (btn.scrollIntoView) btn.scrollIntoView({ block: "nearest", inline: "nearest" });
        const app = uygulamalar[tab] && uygulamalar[tab]();
        if (app) {
          // double-RAF ensures panel has reflowed (clientWidth > 0) before buildGraph reads it
          requestAnimationFrame(() => requestAnimationFrame(() => app.activate()));
        }
      });
    });
  })();

  detailClose.addEventListener("click", () => {
    detailPanel.hidden = true;
  });

  // Node clicks bubble up to this same listener; skip those so the panel
  // that a click just opened isn't immediately closed by that same click.
  document.addEventListener("click", (e) => {
    if (detailPanel.hidden) return;
    if (detailPanel.contains(e.target) || e.target === detailClose) return;
    if (e.target.closest && e.target.closest(".node")) return;
    detailPanel.hidden = true;
  });

  // Esc: bir adım geri (ETKILESIM_DILI.md üçüncü fiil). Önce detay paneli,
  // o kapalıysa sayfadan çıkış.
  //
  // 2026-08-28'de bir kaçamak çözümle "düzeltilmişti": iki ayrı window
  // keydown dinleyicisi (biri yakalama evresinde durumu not ediyor, diğeri
  // kabarma evresinde karara bağlıyordu), çünkü graph-utils.js'in merkezî
  // Esc zinciri (registerStepBack) kendi belgesiz yan etkisiyle -- hiçbir
  // stepBack üstlenmezse zincir sonunda `#detail-panel`i sessizce kapatıyor
  // -- compare.js'in kendi mantığından ÖNCE devreye giriyordu ve panel
  // zaten kapanmış görünüyordu. 2026-09-12 taramasında bu iki dinleyici
  // kaldırılıp aynı davranış zincirin KENDİSİNE bir stepBack olarak
  // kaydedildi -- artık zamanlamaya bağlı bir bayrağa (escPanelAcikti)
  // gerek yok, sıra tek bir merkezi yerde tanımlı. wrapId burada `null`:
  // bu sayfanın beş sekmesi (temalar/profil/bagharita/baglar/yazilar) ayrı
  // wrap'lara bölünmüş ve o an aktif olmayanı `hidden` -- sekme hangisi
  // olursa olsun Esc aynı anlama gelmeli, o yüzden görünürlük kapısına
  // bağlanmıyor (lightbox.js/graph-hint.js/durus-kontrol.js'teki aynı
  // desen: sayfa-genel bir davranış tek bir wrap'a hapsedilmez).
  window.DostGraphUtils.registerStepBack(null, () => {
    if (!detailPanel.hidden) {
      detailPanel.hidden = true;
      return true;
    }
    window.location.href = "index.html";
    return true;
  });

  // Touch devices have no Escape key. The tappable title below is the quiet
  // fallback, but it is invisible -- nothing tells you it can be tapped. The
  // header's back circle is the discoverable version of the same move.
  const headerBack = document.getElementById("header-back");
  if (headerBack) {
    headerBack.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  const headerTitle = document.querySelector(".app-header__title");
  if (headerTitle) {
    headerTitle.classList.add("app-header__title--clickable");
    headerTitle.style.cursor = "pointer";
    headerTitle.title = "Dost'a dön / Back to Dost / Voltar ao Dost";
    headerTitle.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Açılış sekmesi Daphne'nin Profili (2026-10-09'dan beri). Ortak Temalar
  // 2026-10-10'da birinci sekme olarak geri geldi ama açılış sekmesi
  // olmadı: köprüleri biz kurduk, sayfa okumanın özetiyle açılsın. Profil grafiği ölçü
  // isterken ilk boyamadan sonra kurulur (sekme tıklamasındaki aynı
  // çift-RAF).
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (window.__dostDaphneProfileApp) window.__dostDaphneProfileApp.activate();
  }));
})();
