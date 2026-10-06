(function () {
  "use strict";

  const STORAGE_KEY = "dost-font-scale";
  const MIN_SCALE = 0.8;
  const MAX_SCALE = 1.8;
  const STEP = 0.2;

  function getStoredScale() {
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    return parseFloat(stored) || 1;
  }

  function applyScale(scale) {
    document.documentElement.style.setProperty("--detail-font-scale", scale);
  }

  function storeScale(scale) {
    try { localStorage.setItem(STORAGE_KEY, scale); } catch (e) {}
  }

  // Wires up a decrease/increase button pair sharing the site-wide
  // --detail-font-scale variable and dost-font-scale storage key, so the
  // reading-panel and Fütûhât toolbar controls stay in sync with each other.
  // Ölçek bütün düğme çiftlerinin paylaştığı tek değişkende (2026-10-06):
  // önceden her çift kendi kapanımında bir kopya tutuyordu -- araç
  // çubuğunda ölçek değişince okuma panelindeki A-/A+ eski değerden
  // sıçrıyordu. Depo (localStorage) engelliyse de çalışır.
  let current = null;

  function bindFontScaleButtons(decreaseEl, increaseEl) {
    if (current === null) current = getStoredScale();
    applyScale(current);

    function step(delta) {
      current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((current + delta) * 100) / 100));
      applyScale(current);
      storeScale(current);
    }
    if (decreaseEl) decreaseEl.addEventListener("click", () => step(-STEP));
    if (increaseEl) increaseEl.addEventListener("click", () => step(STEP));
  }

  window.DostFontScale = { getStoredScale, applyScale, bindFontScaleButtons };
})();
