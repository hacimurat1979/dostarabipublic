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
    cevrimdisiTemizle(el, wrapId);
  }

  // --- Çevrimdışı durumu (2026-10-15, mobil teknik dalga 1, S-01) -------------
  // Görünüm betiği bağlantı yokluğundan yüklenemediyse (view-loader.js) genel
  // "yüklenemedi" yerine bunu söyler, nasıl önceden indirileceğini hatırlatır
  // ve bağlantı geri gelince bölümü kendiliğinden yeniden dener. "Yeniden dene"
  // bağlantı yokken boşuna istek atmaz: bağlantıyı beklediğini söyler.
  const bekleyenBaglanti = {};
  function cevrimdisiTemizle(el, wrapId) {
    el.classList.remove("view-status--cevrimdisi");
    const ip = el.querySelector(".view-status__hint");
    if (ip) ip.hidden = true;
    if (bekleyenBaglanti[wrapId]) {
      window.removeEventListener("online", bekleyenBaglanti[wrapId]);
      delete bekleyenBaglanti[wrapId];
    }
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
    if (el) { el.hidden = true; cevrimdisiTemizle(el, wrapId); }
  }

  // Görünüm BETİĞİ yüklenemedi ya da çöktü (2026-10-09, dalga-web; bkz.
  // view-loader.js). Eskiden sahne boş kalıyor, köşedeki düğmeler (ortala,
  // ipucu...) hiçbir şey yapmıyordu -- bağlanmamış düğme. Artık kısa bir
  // kutu ve ÇALIŞAN bir "yeniden dene". Durum düğümü olmayan sarmalayıcıya
  // (hakkinda-wrap) aynı yapı eklenir.
  function showLoadError(wrapId, onRetry, opts) {
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
    const cevrimdisi = !!(opts && opts.cevrimdisi);
    cevrimdisiTemizle(el, wrapId);
    el.classList.toggle("view-status--cevrimdisi", cevrimdisi);
    const text = el.querySelector(".view-status__text");
    if (text) {
      text.textContent = cevrimdisi
        ? pick3({
          tr: "Çevrimdışısın ve bu bölüm henüz indirilmedi.",
          en: "You're offline and this section hasn't been downloaded yet.",
          pt: "Você está offline e esta seção ainda não foi baixada.",
        })
        : pick3({
          tr: "Bu bölüm yüklenemedi.",
          en: "This section couldn't load.",
          pt: "Esta seção não pôde ser carregada.",
        });
    }
    let ip = el.querySelector(".view-status__hint");
    if (cevrimdisi) {
      if (!ip) {
        ip = document.createElement("p");
        ip.className = "view-status__hint";
        if (text) text.insertAdjacentElement("afterend", ip); else el.appendChild(ip);
      }
      ip.hidden = false;
      ip.textContent = pick3({
        tr: "Bağlantı gelince açılır. Önceden indirmek için “Çevrimdışı okuma”yı kullanabilirsin.",
        en: "It opens once you're back online. To get it ahead of time, use “Offline reading”.",
        pt: "Abre quando a conexão voltar. Para baixar com antecedência, use “Leitura offline”.",
      });
    }
    const retry = el.querySelector(".view-status__retry");
    const yeniden = function () {
      showLoading(wrapId);
      onRetry();
    };
    if (retry) {
      retry.hidden = false;
      retry.textContent = pick3({ tr: "Yeniden dene", en: "Try again", pt: "Tentar de novo" });
      retry.onclick = function () {
        if (cevrimdisi && navigator.onLine === false) {
          // Bağlantı yok: istek atmak boşuna. Beklediğimizi söyle; bağlantı
          // gelince aşağıdaki dinleyici yeniden dener.
          if (text) {
            text.textContent = pick3({
              tr: "Hâlâ çevrimdışısın. Bağlantı gelince bu bölüm kendiliğinden açılacak.",
              en: "Still offline. This section will open on its own once you're connected.",
              pt: "Ainda offline. Esta seção abrirá sozinha quando houver conexão.",
            });
          }
          return;
        }
        yeniden();
      };
    }
    if (cevrimdisi) {
      const acik = function () {
        const e2 = node(wrapId);
        if (!e2 || e2.hidden || !e2.classList.contains("view-status--error")) { cevrimdisiTemizle(el, wrapId); return; }
        yeniden();
      };
      bekleyenBaglanti[wrapId] = acik;
      window.addEventListener("online", acik, { once: true });
    }
  }

  return { showLoading, showError, showLoadError, hide };
})();
