/* Dost Arabî — Füsûsu'l-Hikem görünümü.
 *
 * Fütûhât görünümüyle aynı iskelet (açılışta bütünün haritası, tıklayınca o
 * parçanın yazısı), ama iki farkı var ve ikisi de bilerek:
 *
 *  1. Bütün şemalar SARMAL. Fütûhât'ta bölüm-içi çizimler ağaç/ikili/üçlü
 *     olabiliyor; burada tek bir dil var (assets/helix.js). Gerekçe CLAUDE.md:
 *     "iki boyutlu bir halka ile üç boyutlu bir sarmal arasında seçim varken
 *     sarmalı tercih et." Füsûs'un kendi yapısı da buna elverişli -- kitap
 *     yirmi yedi peygamberde yirmi yedi hikmeti dolaşıp aynı meseleye başka
 *     bir yükseklikten dönüyor.
 *  2. Açılış haritasının kendisi de bir sarmal: yirmi yedi fass, okunma
 *     sırasıyla dizilmiş; okunmuş olanlar vurgulu, henüz okunmamışlar sönük.
 *
 * Veri: data/ibn-arabi/fusus-atlas.json (tek dosya -- Fütûhât'taki gibi
 * kısım başına ayrı dosyaya bölmek için henüz sebep yok; 27 fass hepsi
 * yazıldığında bile atlas'ın bugünkü boyunun çok altında kalıyor).
 */
(function () {
  "use strict";

  var I18n = window.DostI18n;
  var wrap = document.getElementById("fusus-wrap");
  if (!wrap) return;

  var mapEl = document.getElementById("fusus-map");
  var listEl = document.getElementById("fusus-list");
  var articleEl = document.getElementById("fusus-article");

  var data = null;
  var dataPromise = null;
  var activeId = null;
  // Görünen fass adresten / kullanıcı seçiminden mi geldi, yoksa görünüm
  // kendiliğinden mi açtı (kaldığın yer / varsayılan)? Kendiliğinden
  // açılışta adres /fusus/ kalır, meta görünümün kendisidir -- statik
  // /fusus/ sayfasıyla aynı canonical (2026-10-09, scripts/meta-testi.js).
  var adreste = false;
  var mapScene = null;
  var sectionScenes = [];
  var crossLinkSubscribed = false;

  // B2 "Kaldığın yer": bkz. futuhat.js'teki aynı isimli mantık.
  var LAST_FASS_KEY = "dost-fusus-last-fass";
  function saveLastFass(id) {
    try { localStorage.setItem(LAST_FASS_KEY, id); } catch (_) {}
  }
  function loadLastFass() {
    try { return localStorage.getItem(LAST_FASS_KEY); } catch (_) { return null; }
  }

  // B1 "başlangıç güzergâhı": bkz. futuhat.js'teki aynı isimli mantık --
  // activeFassId (fs27) de okumanın en son ulaştığı fass, fs1 değil.
  var isDefaultLanding = false;

  function t(d) { return d ? I18n.pick3(d) : ""; }
  // Ortak kaçış (2026-10-09): graph-utils.js escapeHtml ile birebir aynı
  // davranıştaki yerel kopyanın yerine (& < > " ; null -> "").
  function esc(s) { return window.DostGraphUtils.escapeHtml(s); }

  // Yazdır düğmesinin yanına paylaş düğmesi (kullanıcı isteği, 2026-08-16):
  // futuhat.js'teki sharePart/showToast ile aynı desen -- navigator.share
  // varsa oradan, yoksa panoya kopyala + geçici bir uyarı.
  function routeBase() {
    var baseEl = document.querySelector("base");
    if (!baseEl) return "";
    try {
      var u = new URL(baseEl.getAttribute("href"), location.origin);
      return u.pathname.replace(/\/+$/, "");
    } catch (e) { return ""; }
  }
  function shareFass(f) {
    var url = location.origin + routeBase() + "/fusus/" + f.id;
    var title = t({ tr: "Dost Arabî", en: "Dost Arabi", pt: "Dost Arabi" }) + " — " + t(f.prophet ? { tr: f.no + ". " + f.prophet.tr, en: f.no + ". " + f.prophet.en, pt: f.no + ". " + f.prophet.pt } : f.title);
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast(t({ tr: "Bağlantı kopyalandı", en: "Link copied", pt: "Link copiado" }));
      });
    }
  }
  var toastEl = null, toastTimer = null;
  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "futuhat-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add("futuhat-toast--visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("futuhat-toast--visible"); }, 2400);
  }
  function linkify(text) {
    return window.__dostCrossLink ? window.__dostCrossLink.linkify(text) : text;
  }

  function load() {
    if (dataPromise) return dataPromise;
    if (window.DostViewStatus) window.DostViewStatus.showLoading("fusus-wrap");
    dataPromise = window.DostGraphUtils.fetchJson("data/ibn-arabi/fusus-atlas.json")
      .then(function (d) {
        data = d;
        if (window.DostViewStatus) window.DostViewStatus.hide("fusus-wrap");
        return d;
      })
      .catch(function (err) {
        console.error("Füsûs verisi yüklenemedi / Failed to load Fusus data", err);
        dataPromise = null;
        if (window.DostViewStatus) {
          window.DostViewStatus.showError("fusus-wrap", function () { window.__fususApp.activate(); });
        }
      });
    return dataPromise;
  }

  function fassById(id) {
    if (!data) return null;
    for (var i = 0; i < data.fasses.length; i++) {
      if (data.fasses[i].id === id) return data.fasses[i];
    }
    return null;
  }

  function fassLabel(f) {
    // Sarmal düğümünde yer dar: peygamber adı + numara yeter, hikmetin adı
    // ipucuna (title/aria) kalıyor.
    return { tr: f.no + ". " + f.prophet.tr, en: f.no + ". " + f.prophet.en, pt: f.no + ". " + f.prophet.pt };
  }

  function fassIndex(id) {
    for (var i = 0; i < data.fasses.length; i++) if (data.fasses[i].id === id) return i;
    return 0;
  }

  // --- açılış haritası: yirmi yedi fassın sarmalı --------------------------
  // "Buradasın" (2026-10-09, görsel taraması madde 5): bkz. miskat.js'teki
  // aynı adlı fonksiyon -- sarmal bir kez kurulur, okunan fass ışıkla
  // belirir, başka fass seçilince sahne dönerek onu öne getirir.
  function renderMap() {
    if (!mapEl || !window.DostHelix) return;
    var cur = fassIndex(activeId);
    if (mapScene) { mapScene.setCurrent(cur); renderSerit(cur); return; }
    var nodes = data.fasses.map(function (f) {
      return {
        id: f.id,
        label: fassLabel(f),
        accent: f.status === "active",
      };
    });
    mapScene = window.DostHelix.mount(mapEl, {
      id: "fusus-map",
      nodes: nodes,
      turns: 2.4,
      closing: false,
      // Yirmi yedi düğüm dar bir kutuda üst üste yığılıyordu; harita
      // sarmalı bu yüzden geniş değil UZUN çiziliyor (2026-07-29).
      hRatio: 1.45,
      maxH: 620,
      numbered: false,   // etiket zaten "1. Âdem" diye başlıyor
      // Yirmi yedi ad yan yana okunmaz; yalnız yazılmış fassların ve
      // odaktakinin adı yazılıyor, gerisi ipucunda (2026-07-29).
      labelMode: "sparse",
      title: { tr: "Yirmi yedi fassın sarmalı", en: "The spiral of the twenty-seven bezels", pt: "A espiral dos vinte e sete engastes" },
      current: cur,
      onActivate: function (node) {
        var f = fassById(node.id);
        if (!f) return;
        if (f.status !== "active") return;   // henüz okunmamış fass açılmaz
        activate(f.id);
      },
    });
    renderSerit(cur);
  }

  // Mobil şerit (2026-10-09, görsel taraması madde 14): bkz. miskat.js.
  var seritScene = null;
  function renderSerit(cur) {
    if (!window.DostHelix.mountStrip) return;
    if (seritScene) { seritScene.setCurrent(cur); return; }
    var shell = wrap.querySelector(".fusus-shell");
    if (!shell || !articleEl) return;
    var seritEl = document.createElement("div");
    seritEl.className = "fusus-serit";
    shell.insertBefore(seritEl, articleEl);
    seritScene = window.DostHelix.mountStrip(seritEl, {
      nodes: data.fasses.map(function (f) {
        return { id: f.id, label: fassLabel(f), disabled: f.status !== "active" };
      }),
      current: cur,
      perTurn: 8,
      gap: 20,
      title: { tr: "Yirmi yedi fassın sarmalı", en: "The spiral of the twenty-seven bezels", pt: "A espiral dos vinte e sete engastes" },
      onActivate: function (node) { activate(node.id); },
    });
  }

  function renderList() {
    if (!listEl) return;
    var yazildi = t({ tr: "yazıldı", en: "written", pt: "escrito" });
    var bekliyor = t({ tr: "henüz okunmadı", en: "not yet read", pt: "ainda não lido" });
    listEl.innerHTML = data.fasses.map(function (f) {
      var on = f.status === "active";
      return '<button type="button" class="fusus-chip' + (on ? "" : " is-planned")
        + (f.id === activeId ? " is-active" : "") + '"'
        + (on ? ' data-id="' + esc(f.id) + '"' : ' disabled aria-disabled="true"')
        + ' title="' + esc(t(f.hikmet)) + " — " + esc(on ? yazildi : bekliyor) + '">'
        + '<span class="fusus-chip__no">' + f.no + "</span>"
        + '<span class="fusus-chip__name">' + esc(t(f.prophet)) + "</span>"
        + "</button>";
    }).join("");
    listEl.querySelectorAll("button[data-id]").forEach(function (b) {
      b.addEventListener("click", function () { activate(b.dataset.id); });
    });
    window.DostGraphUtils.cipOrtala(listEl);
  }

  // --- bir fassın yazısı ---------------------------------------------------
  function clearSectionScenes() {
    sectionScenes.forEach(function (s) { s.destroy(); });
    sectionScenes = [];
  }

  function helixBlockHtml(block, key) {
    return '<figure class="fusus-figure">'
      + '<div class="fusus-figure__scene" data-helix="' + esc(key) + '"></div>'
      + '<button type="button" class="fusus-figure__expand" data-expand="' + esc(key) + '" aria-label="'
      + esc(t({ tr: "Çizimi büyüt", en: "Enlarge diagram", pt: "Ampliar diagrama" })) + '">⤢</button>'
      + '<figcaption class="fusus-figure__cap">'
      + (window.DostGraphUtils.has3(block.caption) ? linkify(t(block.caption)) : "")
      + (window.DostGraphUtils.has3(block.source) ? '<cite>' + esc(t(block.source)) + "</cite>" : "")
      + "</figcaption></figure>";
  }

  // Lightbox açıkken içeride ayrıca kurulan (daha büyük) sarmal sahnesi --
  // Fütûhât'taki gibi statik SVG kopyalamıyoruz, çünkü sarmalın kendi
  // dönüşü ve tıklanınca değişen not paneli D3 gibi canlı bir mekanizma;
  // kopyalanan innerHTML bu davranışı taşımazdı. Onun yerine aynı `spec`
  // ile DostHelix.mount()'u lightbox'ın içinde bir daha çağırıyoruz.
  var lightboxScene = null;

  function openHelixLightbox(spec, captionHtml) {
    if (!window.DostLightbox || !window.DostHelix) return;
    window.DostLightbox.open({
      closeLabel: t({ tr: "Kapat", en: "Close", pt: "Fechar" }),
      svgHtml: "",
      caption: captionHtml || "",
      onClose: function () {
        if (lightboxScene) { lightboxScene.destroy(); lightboxScene = null; }
      },
    });
    var wrap = document.querySelector(".cizim-lightbox__svg-wrap");
    if (!wrap) return;
    // `.cizim-lightbox__svg-wrap` sitedeki HER lightbox kullanımının
    // paylaştığı tek (kalıcı) düğüm -- kendi sınıf listesine dokunmak
    // (DostHelix.mount()'un ekleyip hiç kaldırmadığı "helix-scene" gibi)
    // sonraki, Füsûs'le ilgisiz bir lightbox açılışına da yapışık kalırdı.
    // Bunun yerine kendi alt kabımızı açıyoruz; `open()` zaten her
    // çağrıda wrap'ın içeriğini temizliyor, o yüzden ayrıca silmemiz
    // gerekmiyor.
    var host = document.createElement("div");
    host.className = "fusus-figure__scene fusus-figure__scene--lightbox";
    wrap.appendChild(host);
    lightboxScene = window.DostHelix.mount(host, Object.assign({}, spec, { maxH: 620 }));
  }

  function mountHelixBlocks(scope, blocks, captions) {
    Object.keys(blocks).forEach(function (key) {
      var host = scope.querySelector('[data-helix="' + key + '"]');
      if (!host || !window.DostHelix) return;
      var spec = blocks[key];
      var s = window.DostHelix.mount(host, spec);
      if (s) sectionScenes.push(s);
      // Büyüt düğmesi ayrı bir öğe -- sahnenin kendi düğümleri zaten
      // tıklamayı not panelini değiştirmek için kullanıyor (bkz. helix.js);
      // aynı tıklamayı hem nota hem popup'a bağlamak ikisini çakıştırırdı.
      var btn = scope.querySelector('[data-expand="' + key + '"]');
      if (btn) {
        var captionHtml = (captions && captions[key]) || "";
        btn.addEventListener("click", function () { openHelixLightbox(spec, captionHtml); });
      }
    });
  }

  function lightboxCaptionText(block) {
    // Fütûhât'ın diyagram büyütme kalıbıyla aynı kural (assets/futuhat.js):
    // büyütülmüş görünümde caption VEYA source gösterilir, ikisi birden
    // değil, ve çapraz-link eklenmez (kapanmayan bir bağlantı modalin
    // içinde kafa karıştırırdı).
    if (window.DostGraphUtils.has3(block.caption)) return t(block.caption);
    if (window.DostGraphUtils.has3(block.source)) return t(block.source);
    return "";
  }

  function renderArticle(f) {
    // Sekme başlığı/canonical bu fassın kendisi (statik rotayla aynı biçim,
    // graph-utils.js DostMeta) -- eskiden genel "Füsûs" başlığı kalıyordu.
    if (adreste && window.DostMeta) window.DostMeta.setRecord("fusus", f.id, t(f.title), t(f.hero && f.hero.summary));
    clearSectionScenes();
    var helixes = {};
    var captions = {};
    var idx = 0;

    var html = "";
    if (isDefaultLanding && data.fasses[0] && data.fasses[0].id !== f.id) {
      // Bant yerine küçük bir halka çipi (2026-10-09, görsel taraması madde 14).
      html += window.DostGraphUtils.baslangicCipiHtml("data-start-fass", data.fasses[0].id, {
        tr: "Bu, okumanın en son ulaştığı yer. Yeni geliyorsan, baştan başlamak isteyebilirsin.",
        en: "This is where the reading currently stands. If you're new here, you may want to start from the beginning.",
        pt: "É aqui que a leitura chegou. Se você é novo aqui, talvez queira começar do início.",
      }, "fusus-start-hint");
    }
    html += '<header class="fusus-article__head">'
      + '<button type="button" class="fusus-print-btn" title="Yazdır / Print / Imprimir" aria-label="Yazdır / Print / Imprimir">'
      + '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="6" y="3" width="12" height="6" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="9" width="16" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="7" y="14" width="10" height="7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
      + "</button>"
      + '<button type="button" class="fusus-share-btn" title="Paylaş / Share / Compartilhar" aria-label="Paylaş / Share / Compartilhar">'
      + '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="5.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="18.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="8.3" y1="10.8" x2="15.7" y2="6.7" stroke="currentColor" stroke-width="1.6"/><line x1="8.3" y1="13.2" x2="15.7" y2="17.3" stroke="currentColor" stroke-width="1.6"/></svg>'
      + "</button>"
      + '<button type="button" class="fusus-kart-btn" title="Görsel kart oluştur / Create visual card / Criar cartão visual" aria-label="Görsel kart oluştur / Create visual card / Criar cartão visual">'
      + '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="9.5" r="1.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 16.5l4.8-4.8a1.4 1.4 0 0 1 2 0l2.9 2.9 2-2a1.4 1.4 0 0 1 2 0l2.3 2.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      + "</button>"
      + '<p class="fusus-article__eyebrow">'
      + esc(t({ tr: "Fass " + f.no, en: "Bezel " + f.no, pt: "Engaste " + f.no })) + " · "
      + esc(t(f.hikmet)) + "</p>"
      + '<h2 class="fusus-article__title">' + esc(t(f.title)) + "</h2>"
      + '<p class="fusus-article__range">' + esc(t(f.pageRange)) + "</p>"
      + '<div class="fusus-article__summary" data-dost-alan="hero.summary">' + linkify(t(f.hero.summary)) + "</div>"
      + "</header>";

    if (f.mainHelix) {
      var mk = "m" + (idx++);
      helixes[mk] = Object.assign({}, f.mainHelix.helix, { title: f.title });
      captions[mk] = lightboxCaptionText(f.mainHelix);
      html += helixBlockHtml(f.mainHelix, mk);
    }

    f.sections.forEach(function (sec, si) {
      html += '<section class="fusus-section" id="' + esc(sec.id) + '">'
        + "<h3>" + esc(t(sec.heading)) + "</h3>";
      sec.blocks.forEach(function (b, bi) {
        // @revise adresi: sections[i].blocks[j].<alan> (2026-10-09).
        var adr = "sections[" + si + "].blocks[" + bi + "].";
        if (b.type === "p") {
          html += '<p data-dost-alan="' + adr + 'text">' + linkify(t(b.text)) + "</p>";
        } else if (b.type === "serh") {
          html += '<div class="fusus-serh">'
            + '<div class="fusus-serh__col fusus-serh__col--konuk">'
            + '<span class="fusus-serh__eyebrow">' + esc(t({ tr: "Konuk'un okuduğu", en: "What Konuk reads", pt: "O que Konuk lê" })) + "</span>"
            + '<p data-dost-alan="' + adr + 'konuk">' + linkify(t(b.konuk)) + "</p></div>"
            + '<div class="fusus-serh__col fusus-serh__col--konevi">'
            + '<span class="fusus-serh__eyebrow">' + esc(t({ tr: "Konevî'nin eklediği", en: "What Qunawi adds", pt: "O que Qunawi acrescenta" })) + "</span>"
            + '<p data-dost-alan="' + adr + 'konevi">' + linkify(t(b.konevi)) + "</p>"
            + '<cite class="fusus-serh__kaynak">' + esc(t(b.kaynak)) + "</cite>"
            + "</div></div>";
        } else if (b.type === "helix") {
          var k = "s" + (idx++);
          helixes[k] = Object.assign({}, b.helix, { title: sec.heading });
          captions[k] = lightboxCaptionText(b);
          html += helixBlockHtml(b, k);
        }
      });
      html += "</section>";
    });

    html += '<div id="fusus-anlamsal"></div>';
    html += '<div id="fusus-yakin-pasaj"></div>';

    if (f.sources && f.sources.length) {
      html += '<footer class="fusus-article__sources"><h3>'
        + esc(t({ tr: "Kaynak", en: "Source", pt: "Fonte" })) + "</h3><ul>"
        + f.sources.map(function (s) { return "<li>" + esc(t(s)) + "</li>"; }).join("")
        + "</ul></footer>";
    }

    // Metnin sonunda önceki/sonraki (2026-10-07; bkz. graph-utils readingNavHtml).
    html += window.DostGraphUtils.readingNavHtml(
      data.fasses.filter(function (x) { return x.status === "active"; }).map(function (x) {
        return { id: x.id, label: t({ tr: x.no + ". Fass · " + t(x.prophet), en: "Bezel " + x.no + " · " + t(x.prophet), pt: "Engaste " + x.no + " · " + t(x.prophet) }), title: t(x.title) };
      }), f.id);

    articleEl.dataset.dostDosya = "data/ibn-arabi/fusus-atlas.json";
    articleEl.dataset.dostKaynak = f.id;
    articleEl.innerHTML = html;
    window.DostGraphUtils.wireReadingNav(articleEl.querySelector(".okuma-gezinti"), function (id) { activate(id); });
    mountHelixBlocks(articleEl, helixes, captions);
    // Üç ses: Dost'un doğrudan sözü ayrı dokuda; değinince künye
    // (graph-utils dostSozIsaretle; şerh sütunları dışarıda).
    window.DostGraphUtils.dostSozIsaretle(articleEl, {
      baslik: t({ tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" }) + " · "
        + t({ tr: "Fass " + f.no, en: "Bezel " + f.no, pt: "Engaste " + f.no }) + " · " + t(f.prophet),
      sayfa: t(f.pageRange),
    });
    renderAnlamsalBaglantilar(f);
    renderYakinPasajlar(f);
    var printBtn = articleEl.querySelector(".fusus-print-btn");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    var shareBtn = articleEl.querySelector(".fusus-share-btn");
    if (shareBtn) shareBtn.addEventListener("click", function () { shareFass(f); });
    // "Bu kaydı paylaş" (2026-10-09): künyeli görsel kart (share-mode.js).
    // Paylaşım kipi yoksa düğme görünmez -- bağlanmamış düğme olmasın.
    var kartBtn = articleEl.querySelector(".fusus-kart-btn");
    if (kartBtn) {
      if (!(window.__dostShare && window.__dostShare.open)) kartBtn.hidden = true;
      else kartBtn.addEventListener("click", function () { window.__dostShare.open({ view: "fusus", id: f.id }); });
    }
    var startBtn = articleEl.querySelector("[data-start-fass]");
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        isDefaultLanding = false;
        activate(startBtn.getAttribute("data-start-fass"));
      });
    }
  }

  // Embedding altyapısı: bkz. assets/futuhat.js'teki aynı adlı fonksiyon --
  // burada Füsûs tarafı. Aynı veri dosyası (data/ibn-arabi/anlamsal-
  // baglantilar.json), aynı görsel aile (kesikli çerçeve = bizim ölçümümüz).
  var anlamsalPromise = null;
  function fetchAnlamsalBaglantilar() {
    if (!anlamsalPromise) {
      anlamsalPromise = window.DostGraphUtils.fetchJson("data/ibn-arabi/anlamsal-baglantilar.json").catch(function () { return null; });
    }
    return anlamsalPromise;
  }
  function renderAnlamsalBaglantilar(f) {
    var mount = document.getElementById("fusus-anlamsal");
    if (!mount) return;
    fetchAnlamsalBaglantilar().then(function (baglantiData) {
      var liste = baglantiData && baglantiData.dizin && baglantiData.dizin[f.id];
      if (!mount.isConnected || !liste || !liste.length) return;
      var html = '<div class="futuhat-anlamsal-box"><p class="futuhat-anlamsal-box__eyebrow">'
        + esc(t({ tr: "Bu konuyu başka nerelerde görüyoruz?", en: "Where else do we see this?", pt: "Onde mais vemos isto?" }))
        + "</p>";
      liste.forEach(function (baglanti) {
        html += '<a class="futuhat-anlamsal-box__item" href="' + esc(window.__dostNav.href(baglanti.view, baglanti.id)) + '" data-view="' + esc(baglanti.view) + '" data-id="' + esc(baglanti.id) + '">'
          + '<span class="futuhat-anlamsal-box__title">' + esc(t(baglanti.title)) + "</span>"
          + '<span class="futuhat-anlamsal-box__sebep">' + esc(t(baglanti.sebep)) + "</span></a>";
      });
      html += "</div>";
      mount.innerHTML = html;
      mount.querySelectorAll(".futuhat-anlamsal-box__item").forEach(function (item) {
        item.addEventListener("click", function (e) {
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          window.__dostNav.goTo(item.dataset.view, item.dataset.id);
        });
      });
    });
  }

  // FAZ 5: bkz. assets/futuhat.js'teki aynı adlı fonksiyon -- burada Füsûs
  // tarafı. Bu sonuçlar HİÇ insan gözden geçirmesinden geçmedi (yukarıdaki
  // elle onaylanmış anlamsal-baglantilar.json'dan farklı); yalnız
  // "Göster"e basılınca data/ibn-arabi/pasaj-vektorleri-<dil>.bin iniyor.
  function renderYakinPasajlar(f) {
    var mount = document.getElementById("fusus-yakin-pasaj");
    if (!mount || !window.DostAnlamsalYakin) return;
    var html = '<div class="futuhat-anlamsal-box futuhat-anlamsal-box--deneysel">'
      + '<p class="futuhat-anlamsal-box__eyebrow">' + esc(t({
        tr: "Anlamca yakın olabilecek pasajlar (deneysel)",
        en: "Passages that may be semantically close (experimental)",
        pt: "Passagens que podem ser semanticamente próximas (experimental)",
      })) + "</p>"
      + '<p class="futuhat-anlamsal-box__not">' + esc(t({
        tr: "Bu bizim ölçümümüzdür, Dost'un çapraz-referansı değildir; embedding benzerliğine göre hesaplanmıştır ve hiçbir insan gözden geçirmesinden geçmemiştir.",
        en: "This is our own measurement, not Dost's cross-reference; computed from embedding similarity, and has not passed any human review.",
        pt: "Esta é a nossa própria medição, não uma referência cruzada de Dost; calculada por similaridade de embedding, e não passou por nenhuma revisão humana.",
      })) + "</p>"
      + '<button type="button" class="futuhat-anlamsal-box__gosterBtn">' + esc(t({ tr: "Göster", en: "Show", pt: "Mostrar" })) + "</button>"
      + "</div>";
    mount.innerHTML = html;
    var box = mount.querySelector(".futuhat-anlamsal-box");
    var btn = box.querySelector(".futuhat-anlamsal-box__gosterBtn");
    btn.addEventListener("click", function () {
      btn.disabled = true;
      btn.textContent = t({ tr: "Yükleniyor…", en: "Loading…", pt: "Carregando…" });
      window.DostAnlamsalYakin.bul(f.id, I18n.getLang(), 5).then(function (sonuclar) {
        btn.remove();
        if (!sonuclar.length) {
          var bos = document.createElement("p");
          bos.className = "futuhat-anlamsal-box__not";
          bos.textContent = t({ tr: "Bu fass için yakın bir pasaj bulunamadı.", en: "No close passage found for this bezel.", pt: "Nenhuma passagem próxima encontrada para este engaste." });
          box.appendChild(bos);
          return;
        }
        sonuclar.forEach(function (s) {
          var item = document.createElement("a");
          item.className = "futuhat-anlamsal-box__item";
          // pasaj-vektorleri-*.json'daki route kök-göreli ("/futuhat/...") --
          // canlıda (base="/") sorun çıkarmıyordu ama önizlemede (base=
          // "/dost-onizleme/") kökten çözüldüğü için 404 veriyordu (2026-08-04
          // kullanıcı bildirimi, futuhat.js'teki ikizinde bulundu).
          item.href = s.route.replace(/^\//, "");
          item.innerHTML = '<span class="futuhat-anlamsal-box__title">' + esc(s.baslik) + "</span>"
            + '<span class="futuhat-anlamsal-box__sebep">' + esc(s.ozet) + "</span>";
          box.appendChild(item);
        });
      }).catch(function () {
        btn.textContent = t({ tr: "Şu an kullanılamıyor", en: "Unavailable right now", pt: "Indisponível no momento" });
      });
    });
  }

  // otomatik: görünüm kaydı kendiliğinden açıyor (bkz. adreste).
  function activate(id, otomatik) {
    load().then(function () {
      if (!data) return;
      // Yavaş ağ bekçisi: veri gelene kadar kullanıcı başka görünüme
      // geçmiş olabilir; geç gelen .then render+setHash ile URL'yi ve
      // başlığı artık bakılmayan görünüme yazıyordu (futuhat.js'teki
      // bekçiyle aynı aile). Aynı bekçi aşağıdaki onReady aboneliğinde de
      // var: o abonelik başka görünümlerin verisi hazır olunca da düşüyor.
      if (!window.DostGraphUtils.isViewActive(wrap)) return;
      var f = fassById(id) || (!id ? fassById(loadLastFass()) : null) || fassById(data.activeFassId) || data.fasses[0];
      if (!f) return;
      if (!otomatik) adreste = true;
      isDefaultLanding = !id && !loadLastFass();
      activeId = f.id;
      saveLastFass(f.id);
      // Sarmal yeniden kuruluyor: odak haritadaysa (klavyeyle seçim) eski
      // düğümle birlikte <body>'ye düşüyordu -- yeni sahnenin odaktaki
      // düğümüne geri veriliyor (2026-10-07 taraması).
      var odakHaritada = !!(mapEl && document.activeElement && mapEl.contains(document.activeElement));
      renderMap();
      if (odakHaritada) {
        var yeniOdak = mapEl.querySelector(".helix-scene__node.is-focus");
        if (yeniOdak) { try { yeniOdak.focus({ preventScroll: true }); } catch (e) { /* eski tarayıcı */ } }
      }
      renderList();
      renderArticle(f);
      if (adreste && window.__dostNav) window.__dostNav.setHash("fusus", f.id);
      if (!crossLinkSubscribed && window.__dostCrossLink && window.__dostCrossLink.onReady) {
        crossLinkSubscribed = true;
        window.__dostCrossLink.onReady(function () {
          if (data && activeId && window.DostGraphUtils.isViewActive(wrap)) renderArticle(fassById(activeId));
        });
      }
    });
  }

  window.__fususApp = {
    activate: function (id) {
      if (id) activate(id, false);
      else activate(activeId || null, !adreste);
    },
    onLangChange: function () {
      if (!data || !activeId) return;
      renderList();
      if (mapScene) mapScene.setLang();
      if (seritScene) seritScene.setLang();
      renderArticle(fassById(activeId));
    },
  };
})();
