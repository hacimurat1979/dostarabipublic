(function () {
  "use strict";

  const I18n = window.DostI18n;

  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");
  const detailClose = document.getElementById("detail-close");

  I18n.applyStatic();
  // Dil değişince İKİ graf da yeniden çizilmeli: Daphne profili artık ayrı
  // bir sayfa değil, bu sayfanın bir sekmesi (2026-07-27).
  I18n.renderLangSwitcher(document.getElementById("lang-switch"), () => {
    if (window.__dostDaphneProfileApp) window.__dostDaphneProfileApp.render();
    if (window.__dostDaphneBaglarApp) window.__dostDaphneBaglarApp.render();
  });
  window.DostGraphUtils.setupLegendToggles();
  window.DostGraphUtils.setupDetailPanelFocus();

  // Sekmeler. "Daphne'nin Profili" ile "Taranan Yazılar" 2026-07-27'ye
  // kadar ayrı bir sayfaydı (daphne-profil.html, "understand" yazınca
  // açılıyordu); o sayfa silindi, içeriği buraya sekme olarak taşındı.
  // Profil grafiği ilk kez sekmesi açıldığında kuruluyor -- bölüm
  // gizliyken svg genişliği 0 olur ve graf bozuk çıkar.
  (function wireTabs() {
    const tabButtons = document.querySelectorAll("#compare-tabs .bookmap-tab");
    if (!tabButtons.length) return;
    const tabPanels = document.querySelectorAll("[data-tab-panel]");
    const introProfile = document.getElementById("intro-text-profile");
    const introBaglar = document.getElementById("intro-text-baglar");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        tabButtons.forEach((b) => {
          b.classList.toggle("bookmap-tab--active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        tabPanels.forEach((p) => { p.hidden = p.dataset.tabPanel !== tab; });
        if (introProfile) introProfile.hidden = tab !== "profil";
        if (introBaglar) introBaglar.hidden = tab !== "baglar";
        detailPanel.hidden = true;
        if ((tab === "profil" || tab === "yazilar") && window.__dostDaphneProfileApp) {
          // double-RAF ensures panel has reflowed (clientWidth > 0) before buildGraph reads it
          requestAnimationFrame(() => requestAnimationFrame(() => {
            window.__dostDaphneProfileApp.activate();
          }));
        }
        if (tab === "baglar" && window.__dostDaphneBaglarApp) {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            window.__dostDaphneBaglarApp.activate();
          }));
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
  // bu sayfanın dört sekmesi (temalar/profil/baglar/yazilar) ayrı
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

  // Açılış sekmesi Daphne'nin Profili (2026-10-09): "Ortak Temalar" sekmesi
  // kaldırıldı (bizim kurduğumuz İbn Arabî–Daphne köprüleriydi; gövdesi
  // assets/ortak-temalar.js'te, yayında değil). Profil grafiği ölçü
  // isterken ilk boyamadan sonra kurulur (sekme tıklamasındaki aynı
  // çift-RAF).
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (window.__dostDaphneProfileApp) window.__dostDaphneProfileApp.activate();
  }));
})();
