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
    const retry = el.querySelector(".view-status__retry:not(.view-status__yenile)");
    if (retry) retry.hidden = true;
    const yenile = el.querySelector(".view-status__yenile");
    if (yenile) yenile.hidden = true;
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
      // 2026-10-15 (K18): eski metin "bağlantını kontrol et" diyordu; sorun
      // bağlantı değil de açık kalmış eski bir sürümse tekrar denemek işe
      // yaramıyordu. Artık iki yol: tekrar dene, ya da sayfayı yenile.
      text.textContent = pick3({
        tr: "Bu sayfa şu an açılamadı. Tekrar deneyebilir ya da sayfayı yenileyebilirsin.",
        en: "This page couldn't open right now. You can try again or reload the page.",
        pt: "Esta página não pôde abrir agora. Pode tentar de novo ou recarregar a página.",
      });
    }
    const retry = el.querySelector(".view-status__retry:not(.view-status__yenile)");
    if (retry) {
      retry.hidden = false;
      retry.textContent = pick3({ tr: "Tekrar dene", en: "Retry", pt: "Tentar novamente" });
      retry.onclick = onRetry;
    }
    yenileDugmesi(el, retry);
  }

  // İkinci eylem: sayfayı yenile (K18). Durum kutusunda tek bir kez kurulur;
  // yeniden denemenin işe yaramadığı durumlar için (eski sürüm + yeni betik).
  function yenileDugmesi(el, retry) {
    let yenile = el.querySelector(".view-status__yenile");
    if (!yenile) {
      yenile = document.createElement("button");
      yenile.type = "button";
      yenile.className = "view-status__retry view-status__yenile";
      yenile.addEventListener("click", function () { location.reload(); });
      if (retry && retry.parentNode) retry.parentNode.insertBefore(yenile, retry.nextSibling);
      else el.appendChild(yenile);
    }
    yenile.hidden = false;
    yenile.textContent = pick3({ tr: "Sayfayı yenile", en: "Reload the page", pt: "Recarregar a página" });
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
    const retry = el.querySelector(".view-status__retry:not(.view-status__yenile)");
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
    // "Sayfayı yenile" (K18): bağlantı varken ikinci yol; çevrimdışıyken yenilemek
    // boşuna olurdu (yukarıdaki ipucu ve bağlantı gelince otomatik deneme var).
    if (cevrimdisi) {
      const y = el.querySelector(".view-status__yenile");
      if (y) y.hidden = true;
    } else yenileDugmesi(el, retry);
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
