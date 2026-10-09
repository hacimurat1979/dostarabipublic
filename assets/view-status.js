window.DostViewStatus = (function () {
  "use strict";

  function node(wrapId) {
    return document.getElementById(wrapId + "-status");
  }

  function pick3(dict) {
    return window.DostI18n ? window.DostI18n.pick3(dict) : (dict && (dict.tr || dict.en || dict.pt)) || "";
  }

  function showLoading(wrapId) {
    const el = node(wrapId);
    if (!el) return;
    el.hidden = false;
    el.classList.remove("view-status--error");
    const text = el.querySelector(".view-status__text");
    if (text) text.textContent = pick3({ tr: "Yükleniyor…", en: "Loading…", pt: "Carregando…" });
    const retry = el.querySelector(".view-status__retry");
    if (retry) retry.hidden = true;
  }

  function showError(wrapId, onRetry) {
    const el = node(wrapId);
    if (!el) return;
    el.hidden = false;
    el.classList.add("view-status--error");
    const text = el.querySelector(".view-status__text");
    if (text) {
      text.textContent = pick3({
        tr: "Bu sayfa şu an açılamadı; bağlantını kontrol edip bir daha dener misin?",
        en: "This page couldn't open right now; check your connection and try again?",
        pt: "Esta página não pôde abrir agora; verifique sua conexão e tente de novo?",
      });
    }
    const retry = el.querySelector(".view-status__retry");
    if (retry) {
      retry.hidden = false;
      retry.textContent = pick3({ tr: "Tekrar dene", en: "Retry", pt: "Tentar novamente" });
      retry.onclick = onRetry;
    }
  }

  function hide(wrapId) {
    const el = node(wrapId);
    if (el) el.hidden = true;
  }

  // Görünüm BETİĞİ yüklenemedi ya da çöktü (2026-10-09, dalga-web; bkz.
  // view-loader.js). Eskiden sahne boş kalıyor, köşedeki düğmeler (ortala,
  // ipucu...) hiçbir şey yapmıyordu -- bağlanmamış düğme. Artık kısa bir
  // kutu ve ÇALIŞAN bir "yeniden dene". Durum düğümü olmayan sarmalayıcıya
  // (hakkinda-wrap) aynı yapı eklenir.
  function showLoadError(wrapId, onRetry) {
    let el = node(wrapId);
    if (!el) {
      const wrap = document.getElementById(wrapId);
      if (!wrap) return;
      el = document.createElement("div");
      el.className = "view-status";
      el.id = wrapId + "-status";
      el.innerHTML = '<div class="view-status__spinner" aria-hidden="true"></div>'
        + '<p class="view-status__text"></p><button class="view-status__retry" type="button" hidden></button>';
      wrap.insertBefore(el, wrap.firstChild);
    }
    el.hidden = false;
    el.classList.add("view-status--error");
    el.setAttribute("role", "alert");
    const text = el.querySelector(".view-status__text");
    if (text) {
      text.textContent = pick3({
        tr: "Bu bölüm yüklenemedi.",
        en: "This section couldn't load.",
        pt: "Esta seção não pôde ser carregada.",
      });
    }
    const retry = el.querySelector(".view-status__retry");
    if (retry) {
      retry.hidden = false;
      retry.textContent = pick3({ tr: "Yeniden dene", en: "Try again", pt: "Tentar de novo" });
      retry.onclick = function () {
        showLoading(wrapId);
        onRetry();
      };
    }
  }

  return { showLoading, showError, showLoadError, hide };
})();
