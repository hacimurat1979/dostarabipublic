(function () {
  "use strict";

  // Gizli düzenleme modu (@revise). Elle yazılmış düz yazıyı
  // contenteditable yapar; hiçbir şeyi doğrudan siteye yazmaz -- her
  // değişiklik yalnızca bu tarayıcıda tutulur, "Claude'a gönder" / "Dışa
  // aktar" ile bir JSON dosyası olarak verilir ve özel repoda
  // scripts/duzenleme-uygula.py ile veri dosyasına işlenir. Bu yüzden
  // kombinasyon "gizli" olsa da güvenlik açığı değildir -- kimse siteyi
  // doğrudan değiştiremez.
  //
  // Açmanın üç yolu (2026-10-09): klavyede "@revise" yazmak; adrese
  // "#revise" eklemek; ya da üst çubuktaki ☰ / başlık düğmesine uzun basmak
  // (telefon ve klavyesiz iPad için -- önceden kip yalnız klavyeyle
  // açılabiliyordu).
  //
  // KAYIT BİÇİMİ (e2): her düzenleme adreslidir ve biçimi korur.
  //   dosya / kayit / alan / lang -- düzenlenen öğenin data-dost-* adresi
  //     (görünümler kendi detay/okuma çizicilerinde koyuyor).
  //   before / after -- temizlenmiş klonun innerHTML'i: duruş rozetleri,
  //     mühürler (bdi.honorific), çapraz bağlantılar (a.cross-link) ve
  //     sözlük ipuçları gibi SONRADAN EKLENEN öğeler atılır, yani geriye
  //     kaynak metnin kendi biçimi (<em>, <strong>, <span data-ayet>) kalır.
  //   before_metin / after_metin -- aynı şeyin düz metni (okumak için).
  //   kaynak_metin / diger_diller -- adres çözülebildiyse veri dosyasından
  //     okunan aynı alanın bu dildeki ham metni ve öteki iki dil: "üç dil
  //     birlikte" kuralı kaydın içinde taşınsın, Claude yeniden kurmasın.
  // Önceki biçimde before/after düz textContent'ti: <em> ve bağlantılar
  // kayboluyor, duruş rozeti ("🔸") metne sızıyordu, değişmemiş paragraflar
  // kuyruğa düşüyordu (2026-10-09 değerlendirmesi, hata 1-3).
  const CODE = "@revise";
  const QUEUE_KEY = "dost-edit-queue";
  const MODE_KEY = "dost-edit-mode-on";
  const BICIM = "e2";
  let buffer = "";
  let editModeOn = false;
  let panel = null;
  let observer = null;
  const originals = new WeakMap();
  const gecmis = [], ileriYigin = [];   // kuyruk geri al/yinele (fikir V5)
  let geriAliniyor = false;

  const I18n = () => window.DostI18n;
  function ui(d) {
    const l = (I18n() && I18n().getLang && I18n().getLang()) || "tr";
    return d[l] || d.tr;
  }

  const PROSE_SELECTOR = [
    "#detail-content p:not(.detail-eyebrow):not(.detail-metadata__category):not(.detail-metadata__meaning)",
    "#detail-content li",
    "#detail-content blockquote",
    "#futuhat-article p:not(.futuhat-hero__eyebrow):not(.futuhat-stats__heading)",
    "#futuhat-article blockquote",
    // Füsûs ve Mişkât okuma görünümleri (2026-10-09): önceden seçicide
    // yoktu, iki kitapta hiçbir metin düzenlenemiyordu.
    "#fusus-article .fusus-article__summary",
    "#fusus-article .fusus-section p",
    "#miskat-article .fusus-article__summary",
    "#miskat-article > p",
    ".hakkinda-content__subtitle",
    ".hakkinda-content__section p",
    ".hakkinda-poem",
    // Daphne bölümü (compare.html, 2026-10-09): okuma görünümündeki özet,
    // eksen gerekçeleri ve sorular da düzenlenebilir.
    ".daphne-okuma__ozet",
    ".daphne-okuma__govde .daphne-profile-card__note",
    ".daphne-bag__neden",
    ".daphne-soru__metin",
    // Gönül Defteri sayfaları (2026-10-28, scripts/gonul-uret.py): her öğe data-dost-alan taşır.
    ".gonul-duzenle",
  ].join(", ");

  const escapeHtml = window.DostGraphUtils
    ? window.DostGraphUtils.escapeHtml
    : (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function yeniId() {
    return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // --- görünür uyarı ----------------------------------------------------
  // setQueue eskiden hatayı yutuyordu: kota dolunca 4., 5., 6. notlar hiç
  // kaydedilmedi, sayaç 3'te kaldı ve kimse bir şey görmedi (hata 4).
  // Artık her kayıt hatası ekranda kalıcı bir uyarı bırakıyor.
  let uyariEl = null;
  function uyari(metin, tur) {
    if (!uyariEl || !uyariEl.isConnected) {
      uyariEl = document.createElement("div");
      uyariEl.className = "dost-revise-uyari";
      uyariEl.setAttribute("role", "alert");
      document.body.appendChild(uyariEl);
    }
    const satir = document.createElement("p");
    satir.className = "dost-revise-uyari__satir dost-revise-uyari__satir--" + (tur || "hata");
    satir.innerHTML = '<span></span><button type="button" aria-label="' +
      escapeHtml(ui({ tr: "Kapat", en: "Close", pt: "Fechar" })) + '">×</button>';
    satir.firstChild.textContent = metin;
    satir.lastChild.addEventListener("click", () => satir.remove());
    uyariEl.appendChild(satir);
    // Bilgi notları kendiliğinden söner; hata kalıcıdır, elle kapatılır.
    if (tur === "bilgi") setTimeout(() => satir.remove(), 3200);
  }

  // --- görüntü deposu: IndexedDB ----------------------------------------
  // Ekran görüntüleri base64 olarak localStorage'daydı; üç notla ~4,3 MB
  // kota doluyordu. Görüntüler artık IndexedDB'de (kotası yüzlerce MB),
  // kuyruk kaydı yalnız görüntünün kimliğini (`gorsel`) taşıyor.
  const IDB_AD = "dost-revise";
  const IDB_DEPO = "gorseller";
  let idbSoz = null;
  function idb() {
    if (idbSoz) return idbSoz;
    idbSoz = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error("IndexedDB yok")); return; }
      const istek = indexedDB.open(IDB_AD, 1);
      istek.onupgradeneeded = () => istek.result.createObjectStore(IDB_DEPO);
      istek.onsuccess = () => resolve(istek.result);
      istek.onerror = () => reject(istek.error);
    });
    idbSoz.catch(() => { idbSoz = null; });
    return idbSoz;
  }
  function idbIs(kip, fn) {
    return idb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_DEPO, kip);
      const st = tx.objectStore(IDB_DEPO);
      const r = fn(st);
      tx.oncomplete = () => resolve(r && r.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("IndexedDB işlemi iptal"));
    }));
  }
  const gorselYaz = (id, veri) => idbIs("readwrite", (st) => st.put(veri, id));
  const gorselOku = (id) => idbIs("readonly", (st) => st.get(id));
  const gorselSil = (id) => idbIs("readwrite", (st) => st.delete(id));

  // --- kuyruk -------------------------------------------------------------
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function setQueue(q) {
    let ok = true;
    const yeniJson = JSON.stringify(q);
    try {
      if (!geriAliniyor) {
        const onceki = localStorage.getItem(QUEUE_KEY) || "[]";
        if (onceki !== yeniJson) { gecmis.push(onceki); if (gecmis.length > 40) gecmis.shift(); ileriYigin.length = 0; }
      }
      localStorage.setItem(QUEUE_KEY, yeniJson);
    }
    catch (e) {
      ok = false;
      uyari(ui({
        tr: "Kayıt tarayıcıya yazılamadı (depolama dolu ya da kapalı). Son değişiklik KAYDEDİLMEDİ — önce “Claude'a gönder” ile bekleyenleri dışarı al.",
        en: "Could not save to the browser (storage full or blocked). The last change was NOT saved — export the pending items first.",
        pt: "Não foi possível salvar no navegador (armazenamento cheio ou bloqueado). A última alteração NÃO foi salva — exporte primeiro os pendentes.",
      }));
    }
    updateBadge();
    paketiTazele();
    esIste();
    return ok;
  }

  // Eski kayıtlarda görüntü satır içinde (data URL) duruyordu; kip
  // açılınca IndexedDB'ye taşınır ve localStorage boşalır.
  function eskiGorselleriTasi() {
    const q = getQueue();
    const tasinacak = q.filter((e) => typeof e.image === "string" && e.image.indexOf("data:") === 0);
    if (!tasinacak.length) return;
    Promise.all(tasinacak.map((e) => {
      const id = e.gorsel || yeniId();
      return gorselYaz(id, e.image).then(() => { e.gorsel = id; e.image = null; });
    })).then(() => setQueue(q)).catch(() => {
      uyari(ui({
        tr: "Eski görüntüler IndexedDB'ye taşınamadı; localStorage'da kalıyorlar.",
        en: "Older screenshots could not be moved to IndexedDB; they stay in localStorage.",
        pt: "As imagens antigas não puderam ser movidas para o IndexedDB; ficam no localStorage.",
      }), "uyari");
    });
  }

  // --- temiz klon: araç öğeleri ve sonradan eklenen süsler atılır --------
  function unwrap(n) {
    const p = n.parentNode;
    if (!p) return;
    while (n.firstChild) p.insertBefore(n.firstChild, n);
    p.removeChild(n);
  }
  function temizKlon(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll(".durus-rozet-grup, bdi.honorific, .dost-revise-arac, .par-ara").forEach((n) => n.remove()); // .par-ara: paragraf kuralı işareti (graph-utils), veride yok
    c.querySelectorAll("a.cross-link, span.glossary-hint, mark.durus-vurgu-es, font, span[style]").forEach(unwrap);
    c.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
    c.querySelectorAll("[contenteditable]").forEach((n) => n.removeAttribute("contenteditable"));
    // "Üç ses" işareti (graph-utils dostSozIsaretle) çizimde eklenir, veride
    // yok: kayda <em> çıplak hâliyle girsin.
    c.querySelectorAll("em.dost-soz").forEach((n) => {
      n.classList.remove("dost-soz");
      if (!n.classList.length) n.removeAttribute("class");
      n.removeAttribute("tabindex");
      n.removeAttribute("aria-describedby");
    });
    // contenteditable'ın bıraktığı sondaki <br>
    let son = c.lastChild;
    while (son && son.nodeType === 3 && !son.nodeValue.trim()) son = son.previousSibling;
    if (son && son.nodeName === "BR") son.remove();
    c.normalize();
    return c;
  }
  function htmlAl(el) {
    return temizKlon(el).innerHTML.replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
  }
  function metinAl(el) {
    return temizKlon(el).textContent.replace(/\s+/g, " ").trim();
  }

  // --- adres ----------------------------------------------------------------
  function adresBul(el) {
    const a = {};
    const kap = el.closest("[data-dost-kaynak]");
    if (kap) {
      a.dosya = kap.dataset.dostDosya || "";
      a.kayit = kap.dataset.dostKaynak;
      if (kap.dataset.dostVeri) a.veri = kap.dataset.dostVeri;
    }
    const alanEl = el.closest("[data-dost-alan]");
    if (alanEl && (!kap || kap === alanEl || kap.contains(alanEl))) a.alan = alanEl.dataset.dostAlan;
    return a;
  }

  // Veri dosyasında kaydı ve alanı bulmak (scripts/duzenleme-uygula.py'nin
  // aynı çözücüsü): kayit bir id, bir url ya da "kaynak→hedef" kenar adı.
  function kayitBul(kok, kayit) {
    let bulunan = null;
    const kenar = kayit.indexOf("→") > 0 ? kayit.split("→") : null;
    (function yuru(o) {
      if (bulunan || !o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach(yuru); return; }
      if (o.id === kayit || o.url === kayit) { bulunan = o; return; }
      if (kenar && ((o.source === kenar[0] && o.target === kenar[1]) || (o.from === kenar[0] && o.to === kenar[1]))) {
        bulunan = o; return;
      }
      Object.keys(o).forEach((k) => yuru(o[k]));
    })(kok);
    return bulunan;
  }
  function alanCoz(kayit, alan) {
    const parcalar = [];
    alan.replace(/([^.[\]]+)|\[(\d+)\]/g, (_, ad, sira) => { parcalar.push(ad !== undefined ? ad : Number(sira)); return ""; });
    let o = kayit, ust = null, son = null;
    for (const p of parcalar) {
      if (o == null) return null;
      ust = o; son = p; o = o[p];
    }
    if (o && typeof o === "object" && ("tr" in o || "en" in o || "pt" in o)) return o;
    if (o === undefined && ust && typeof son === "string" && (son + "_tr") in ust) {
      return { tr: ust[son + "_tr"], en: ust[son + "_en"], pt: ust[son + "_pt"] };
    }
    if (typeof o === "string") return { tr: o };
    return null;
  }
  function ucluOku(adres) {
    const yol = adres.veri || adres.dosya;
    if (!yol || !adres.kayit || !adres.alan || !window.DostGraphUtils) return Promise.resolve(null);
    return window.DostGraphUtils.fetchJson(yol).then((d) => {
      const k = kayitBul(d, adres.kayit);
      return k ? alanCoz(k, adres.alan) : null;
    }).catch(() => null);
  }
  function duzle(s) {
    return String(s || "").replace(/&nbsp;| /g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  }
  function ucDilEkle(entry) {
    return ucluOku(entry).then((uclu) => {
      if (!uclu) return false;
      const lang = entry.lang;
      entry.kaynak_metin = uclu[lang] != null ? uclu[lang] : null;
      entry.diger_diller = {};
      ["tr", "en", "pt"].forEach((l) => { if (l !== lang && uclu[l] != null) entry.diger_diller[l] = uclu[l]; });
      entry.adres_dogrulandi = duzle(entry.kaynak_metin) === duzle(entry.before);
      return true;
    });
  }
  function kaydiGuncelle(id, fn) {
    const q = getQueue();
    const e = q.find((x) => x.id === id);
    if (!e) return;
    fn(e);
    // Ayrıntı güncellemeleri (üç dil verisi, tür, eşlik) geri al yığınına girmez; yığın kaydın eklenip çıkarılmasını izler.
    geriAliniyor = true;
    try { setQueue(q); } finally { geriAliniyor = false; }
  }

  // --- görsel not -----------------------------------------------------------
  const SCREENSHOT_MIME = "image/jpeg";
  const SCREENSHOT_MAX_WIDTH = 1600;
  const supportsCapture = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  let fileInputEl = null;

  function drawToCanvas(source, srcWidth, srcHeight) {
    const scale = Math.min(1, SCREENSHOT_MAX_WIDTH / (srcWidth || SCREENSHOT_MAX_WIDTH));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(srcWidth * scale));
    canvas.height = Math.max(1, Math.round(srcHeight * scale));
    canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(SCREENSHOT_MIME, 0.85);
  }
  function ensureFileInput() {
    if (fileInputEl) return fileInputEl;
    fileInputEl = document.createElement("input");
    fileInputEl.type = "file";
    fileInputEl.accept = "image/*";
    fileInputEl.style.display = "none";
    document.body.appendChild(fileInputEl);
    return fileInputEl;
  }
  function pickImageFileToDataUrl() {
    return new Promise((resolve) => {
      const input = ensureFileInput();
      input.onchange = async () => {
        const file = input.files && input.files[0];
        input.value = "";
        if (!file) { resolve(null); return; }
        try {
          const bitmap = await createImageBitmap(file);
          resolve(drawToCanvas(bitmap, bitmap.width, bitmap.height));
        } catch (e) { resolve(null); }
      };
      input.click();
    });
  }
  async function captureScreenshotToDataUrl(opts) {
    if (!supportsCapture) return null;
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { preferCurrentTab: true }, preferCurrentTab: true });
    } catch (e) { return null; }
    try {
      if (opts && opts.onStreamReady) opts.onStreamReady();
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return drawToCanvas(video, video.videoWidth, video.videoHeight);
    } finally {
      stream.getTracks().forEach((t) => t.stop());
    }
  }

  // Görüntü önce IndexedDB'ye yazılır; yazılamazsa not yine kaydedilir ama
  // kullanıcı görüntünün kaybolduğunu ekranda görür.
  async function recordVisualNote(note, dataUrl) {
    const entry = {
      id: yeniId(), type: "visual-note", url: location.pathname,
      lang: (I18n() && I18n().getLang()) || "tr",
      note: note, gorsel: null, timestamp: new Date().toISOString(),
    };
    if (dataUrl) {
      try { await gorselYaz(entry.id, dataUrl); entry.gorsel = entry.id; }
      catch (e) {
        uyari(ui({
          tr: "Görüntü kaydedilemedi (IndexedDB). Not görüntüsüz kaydedildi.",
          en: "The screenshot could not be stored (IndexedDB). The note was saved without it.",
          pt: "A imagem não pôde ser salva (IndexedDB). A nota foi salva sem ela.",
        }));
      }
    }
    const q = getQueue();
    q.push(entry);
    if (!setQueue(q) && entry.gorsel) gorselSil(entry.gorsel).catch(() => {});
  }

  // --- katmanlar: Esc bir adım geri --------------------------------------
  // Notlar modalı açıkken Esc modalla birlikte altındaki detay panelini de
  // kapatıyordu (hata 10): modalın kendi dinleyicisi kapatıyor, olay
  // pencereye kadar kabarıp GU'nun "detay panelini kapat" adımını da
  // tetikliyordu. Artık @revise'ın bütün katmanları (menü, modallar, duruş
  // kutusu/paneli, tahkik paneli) tek bir yığında; Esc yalnız en üsttekini
  // kapatır ve olayın daha fazla yürümesini durdurur. Pencerede YAKALAMA
  // evresinde dinliyoruz ki GU'nun kabarma evresindeki dinleyicisinden önce
  // gelelim.
  const katmanlar = [];
  function katmanAc(kapat) {
    katmanlar.push(kapat);
    return function () {
      const i = katmanlar.indexOf(kapat);
      if (i >= 0) katmanlar.splice(i, 1);
    };
  }
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !katmanlar.length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    katmanlar[katmanlar.length - 1]();
  }, true);
  window.DostReviseKatman = { ac: katmanAc };

  function getFocusables(container) {
    return Array.prototype.slice
      .call(container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      .filter((el) => !el.hidden && el.offsetParent !== null);
  }
  function trapTabKey(e, container) {
    if (e.key !== "Tab") return;
    const focusables = getFocusables(container);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function buildVisualNoteModal(triggerEl) {
    const modal = document.createElement("div");
    modal.className = "dost-shot-modal";
    modal.innerHTML =
      '<div class="dost-shot-modal__backdrop"></div>' +
      '<div class="dost-shot-modal__card" role="dialog" aria-modal="true">' +
      '<div class="dost-shot-modal__attach">' +
      (supportsCapture ? '<button type="button" data-action="capture">📷 ' + escapeHtml(ui({ tr: "Ekran Görüntüsü Al", en: "Take Screenshot", pt: "Capturar Tela" })) + "</button>" : "") +
      '<button type="button" data-action="pick">🖼️ ' + escapeHtml(ui({ tr: "Galeriden Seç", en: "Choose from Gallery", pt: "Escolher da Galeria" })) + "</button>" +
      '<button type="button" data-action="remove-image" class="dost-shot-modal__remove" hidden>' + escapeHtml(ui({ tr: "Görüntüyü kaldır", en: "Remove image", pt: "Remover imagem" })) + "</button>" +
      "</div>" +
      '<img class="dost-shot-modal__preview" alt="" hidden ' +
      'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
      '<label class="dost-shot-modal__label" for="dost-shot-note">' + escapeHtml(ui({ tr: "Bu sayfada ne değişmeli?", en: "What should change on this page?", pt: "O que deve mudar nesta página?" })) + "</label>" +
      '<textarea id="dost-shot-note" class="dost-shot-modal__note" rows="3"></textarea>' +
      '<div class="dost-shot-modal__actions">' +
      '<button type="button" data-action="cancel">' + escapeHtml(ui({ tr: "Vazgeç", en: "Cancel", pt: "Cancelar" })) + "</button>" +
      '<button type="button" data-action="save" class="dost-shot-modal__save">' + escapeHtml(ui({ tr: "Kaydet", en: "Save", pt: "Salvar" })) + "</button>" +
      "</div></div>";
    document.body.appendChild(modal);

    let currentImage = null;
    const preview = modal.querySelector(".dost-shot-modal__preview");
    const removeBtn = modal.querySelector('[data-action="remove-image"]');
    const textarea = modal.querySelector("textarea");
    textarea.focus();
    diktePanel(textarea);

    function setImage(dataUrl) {
      currentImage = dataUrl;
      preview.src = dataUrl || "";
      preview.hidden = !dataUrl;
      removeBtn.hidden = !dataUrl;
    }
    let birak = null;
    function close() {
      if (birak) birak();
      modal.remove();
      if (triggerEl && triggerEl.isConnected) triggerEl.focus();
    }
    birak = katmanAc(close);

    modal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    modal.querySelector('[data-action="cancel"]').addEventListener("click", close);
    removeBtn.addEventListener("click", () => setImage(null));
    const captureBtn = modal.querySelector('[data-action="capture"]');
    if (captureBtn) {
      captureBtn.addEventListener("click", async () => {
        const dataUrl = await captureScreenshotToDataUrl({ onStreamReady: () => { modal.style.visibility = "hidden"; } });
        modal.style.visibility = "";
        if (dataUrl) setImage(dataUrl);
      });
    }
    modal.querySelector('[data-action="pick"]').addEventListener("click", async () => {
      const dataUrl = await pickImageFileToDataUrl();
      if (dataUrl) setImage(dataUrl);
    });
    modal.querySelector('[data-action="save"]').addEventListener("click", async () => {
      const note = textarea.value.trim();
      if (!note && !currentImage) { textarea.focus(); return; }
      await recordVisualNote(note, currentImage);
      close();
    });
    modal.addEventListener("keydown", (e) => trapTabKey(e, modal));
  }

  // --- kendi notum (2026-10-29, kullanıcı isteği) ----------------------------------------
  // İki hedef: (1) Kenar notu -- Daphne yazısının kenarında YALNIZ sahibinin göreceği not
  // (canlıda şifreli); hangi yazıya ekleneceği seçilir, açık okuma paneli varsa o yazı hazır
  // gelir. (2) Gönül Defteri taslağı -- herkese açık olacak yazının ham notu; bu sayfaya
  // (ve varsa seçilen Daphne yazısına) bağlanır. İkisi de dışa giden pakette `note` metni
  // ve (varsa) `image` taşır; Claude redakte edip işler, onayınla yayına çıkar.
  function daphneYazilari() {
    try {
      const o = window.__dostDaphneOkuma;
      return o && o.yazilar ? { liste: o.yazilar(), acik: o.acik ? o.acik() : "" } : null;
    } catch (e) { return null; }
  }
  async function kendiNotKaydet(tur, o) {
    const entry = {
      id: yeniId(), type: tur, url: location.pathname,
      lang: "tr", note: o.metin, gorsel: null, timestamp: new Date().toISOString(),
    };
    if (tur === "makale-taslagi") {
      entry.bolum = o.bolum; entry.bolum_ad = o.bolumAd;
      if (o.makaleBaslik) entry.makale_baslik = o.makaleBaslik;
    } else if (tur === "kenar-notu") {
      entry.yazi = o.yazi; entry.yazi_baslik = o.yaziBaslik;
      if (o.paragraf) entry.paragraf = o.paragraf;
    } else {
      entry.sayfa_baslik = document.title;
      if (o.yazi) { entry.yazi = o.yazi; entry.yazi_baslik = o.yaziBaslik; }
      if (o.kaynak) { entry.dosya = o.kaynak.dosya; entry.kayit = o.kaynak.kayit; entry.kaynak_baslik = o.kaynak.baslik; }
    }
    if (o.image) {
      try { await gorselYaz(entry.id, o.image); entry.gorsel = entry.id; }
      catch (e) {
        uyari(ui({
          tr: "Görüntü kaydedilemedi (IndexedDB). Not görüntüsüz kaydedildi.",
          en: "The image could not be stored (IndexedDB). The note was saved without it.",
          pt: "A imagem não pôde ser salva (IndexedDB). A nota foi salva sem ela.",
        }));
      }
    }
    const q = getQueue();
    q.push(entry);
    if (!setQueue(q) && entry.gorsel) gorselSil(entry.gorsel).catch(() => {});
  }
  // Yan Yana sayfalarında (2026-11-02, kullanıcı isteği) "makale taslağı": kullanıcı kendi makalesini
  // yazar, hangi bölümle ilgili olduğunu seçer; ham hâli redaksiyon için Claude'a gider, yayına çıkmaz.
  function yanYanaBolumleri() {
    try {
      const el = document.getElementById("yy-bolumler");
      const l = el ? JSON.parse(el.textContent) : null;
      return Array.isArray(l) && l.length ? l : null;
    } catch (e) { return null; }
  }
  function buildKendiNotModal(triggerEl, onayar) {
    onayar = onayar || {};
    const yyb = onayar.tur ? null : yanYanaBolumleri();
    if (yyb) return buildMakaleModal(triggerEl, yyb);
    const dy = (onayar.tur === "gonul-taslagi" || onayar.tur === "sirli-notu") ? null : daphneYazilari();
    const modal = document.createElement("div");
    modal.className = "dost-shot-modal";
    const secenekler = dy ? dy.liste.map((a) =>
      `<option value="${escapeHtml(a.url)}"${a.url === dy.acik ? " selected" : ""}>${escapeHtml((a.date || "") + " · " + a.title)}</option>`).join("") : "";
    modal.innerHTML =
      '<div class="dost-shot-modal__backdrop"></div>' +
      '<div class="dost-shot-modal__card" role="dialog" aria-modal="true">' +
      '<fieldset class="dost-kendi__tur"><legend class="dost-shot-modal__label">' + escapeHtml(ui({ tr: "Bu not nereye?", en: "Where does this note go?", pt: "Para onde vai esta nota?" })) + "</legend>" +
      (dy ? '<label><input type="radio" name="dost-kendi-tur" value="kenar-notu" checked> ' + escapeHtml(ui({ tr: "Kenar notu — yalnız ben görürüm", en: "Margin note — only I see it", pt: "Nota à margem — só eu vejo" })) + "</label>" : "") +
      (onayar.tur === "sirli-notu"
        ? '<label><input type="radio" name="dost-kendi-tur" value="sirli-notu" checked> ' + escapeHtml(ui({ tr: "Sırlı anlatım notu — yalnız Claude'a gider, yayına girmez", en: "Passage note — goes only to Claude, never published", pt: "Nota da passagem — vai só ao Claude, não é publicada" })) + "</label>"
        : '<label><input type="radio" name="dost-kendi-tur" value="gonul-taslagi"' + (dy ? "" : " checked") + "> " + escapeHtml(ui({ tr: "Gönül Defteri taslağı — herkese açık olacak", en: "Heart Notebook draft — will be public", pt: "Rascunho do Caderno do Coração — será público" })) + "</label>") +
      "</fieldset>" +
      (dy ? '<div class="dost-kendi__yazi"><label class="dost-shot-modal__label" for="dost-kendi-yazi">' + escapeHtml(ui({ tr: "Hangi Daphne yazısı?", en: "Which Daphne piece?", pt: "Qual texto da Daphne?" })) + "</label>" +
        '<select id="dost-kendi-yazi" class="dost-kendi__sec">' + (dy.acik ? "" : '<option value="">—</option>') + secenekler + "</select>" +
        '<label class="dost-shot-modal__label" for="dost-kendi-par">' + escapeHtml(ui({ tr: "Paragraf no (isteğe bağlı)", en: "Paragraph no. (optional)", pt: "N.º do parágrafo (opcional)" })) + "</label>" +
        '<input id="dost-kendi-par" class="dost-kendi__par" type="number" min="1" inputmode="numeric"></div>' : "") +
      '<div class="dost-shot-modal__attach">' +
      '<button type="button" data-action="pick">🖼️ ' + escapeHtml(ui({ tr: "Resim ekle", en: "Add image", pt: "Adicionar imagem" })) + "</button>" +
      '<button type="button" data-action="remove-image" class="dost-shot-modal__remove" hidden>' + escapeHtml(ui({ tr: "Görüntüyü kaldır", en: "Remove image", pt: "Remover imagem" })) + "</button>" +
      "</div>" +
      '<img class="dost-shot-modal__preview" alt="" hidden src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
      '<label class="dost-shot-modal__label" for="dost-kendi-metin">' + escapeHtml(ui({ tr: "Notun (kendi sesinle; redaksiyonu Claude yapar, onayınla yayına çıkar)", en: "Your note (in your own voice; Claude edits, nothing goes live without your approval)", pt: "Sua nota (na sua voz; o Claude revisa, nada é publicado sem a sua aprovação)" })) + "</label>" +
      '<textarea id="dost-kendi-metin" class="dost-shot-modal__note" rows="6"></textarea>' +
      '<div class="dost-shot-modal__actions">' +
      '<button type="button" data-action="cancel">' + escapeHtml(ui({ tr: "Vazgeç", en: "Cancel", pt: "Cancelar" })) + "</button>" +
      '<button type="button" data-action="save" class="dost-shot-modal__save">' + escapeHtml(ui({ tr: "Kaydet", en: "Save", pt: "Salvar" })) + "</button>" +
      "</div></div>";
    if (onayar.kaynak) {
      // Kayda bağlı doğan not: başlığı göster (hangi kısım için yazıldığı görünsün)
      const l = modal.querySelector(".dost-kendi__tur legend");
      if (l) l.insertAdjacentHTML("afterend", '<p class="dost-kendi__kaynak">' + escapeHtml(onayar.kaynak.baslik) + "</p>");
    }
    document.body.appendChild(modal);
    let currentImage = null;
    const preview = modal.querySelector(".dost-shot-modal__preview");
    const removeBtn = modal.querySelector('[data-action="remove-image"]');
    const textarea = modal.querySelector("textarea");
    diktePanel(textarea);
    const yaziSec = modal.querySelector("#dost-kendi-yazi");
    const yaziKutu = modal.querySelector(".dost-kendi__yazi");
    const turler = modal.querySelectorAll('input[name="dost-kendi-tur"]');
    const tur = () => (modal.querySelector('input[name="dost-kendi-tur"]:checked') || {}).value;
    function turDegisti() {
      if (!yaziKutu) return;
      // Gönül taslağında yazı seçimi isteğe bağlı bir atıftır; paragraf yalnız kenar notunda.
      modal.querySelector(".dost-kendi__par").parentNode.querySelectorAll('label[for="dost-kendi-par"], #dost-kendi-par')
        .forEach((x) => { x.hidden = tur() !== "kenar-notu"; });
    }
    turler.forEach((r) => r.addEventListener("change", turDegisti));
    turDegisti();
    textarea.focus();
    function setImage(dataUrl) {
      currentImage = dataUrl;
      preview.src = dataUrl || "";
      preview.hidden = !dataUrl;
      removeBtn.hidden = !dataUrl;
    }
    let birak = null;
    function close() {
      if (birak) birak();
      modal.remove();
      if (triggerEl && triggerEl.isConnected) triggerEl.focus();
    }
    birak = katmanAc(close);
    modal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    modal.querySelector('[data-action="cancel"]').addEventListener("click", close);
    removeBtn.addEventListener("click", () => setImage(null));
    modal.querySelector('[data-action="pick"]').addEventListener("click", async () => {
      const dataUrl = await pickImageFileToDataUrl();
      if (dataUrl) setImage(dataUrl);
    });
    modal.querySelector('[data-action="save"]').addEventListener("click", async () => {
      const metin = textarea.value.trim();
      if (!metin && !currentImage) { textarea.focus(); return; }
      const t = tur();
      if (t === "kenar-notu" && (!yaziSec || !yaziSec.value)) { if (yaziSec) yaziSec.focus(); return; }
      const secili = yaziSec && yaziSec.value ? dy.liste.find((a) => a.url === yaziSec.value) : null;
      const par = parseInt((modal.querySelector("#dost-kendi-par") || {}).value, 10);
      await kendiNotKaydet(t, {
        kaynak: onayar.kaynak || null,
        metin: metin, image: currentImage,
        yazi: secili ? secili.url : "", yaziBaslik: secili ? secili.title : "",
        paragraf: t === "kenar-notu" && par > 0 ? par : 0,
      });
      close();
    });
    modal.addEventListener("keydown", (e) => trapTabKey(e, modal));
  }

  function buildMakaleModal(triggerEl, bolumler) {
    const modal = document.createElement("div");
    modal.className = "dost-shot-modal";
    const mevcut = location.pathname.replace(/\/?$/, "/");
    const secenekler = bolumler.map((b) =>
      `<option value="${escapeHtml(b.yol)}"${b.yol === mevcut ? " selected" : ""}>${escapeHtml(b.ad)}</option>`).join("");
    modal.innerHTML =
      '<div class="dost-shot-modal__backdrop"></div>' +
      '<div class="dost-shot-modal__card" role="dialog" aria-modal="true">' +
      '<p class="dost-kendi__kaynak">' + escapeHtml("Makale taslağı — Yan Yana") + "</p>" +
      '<label class="dost-shot-modal__label" for="dost-mk-bolum">' + escapeHtml("Hangi bölümle ilgili?") + "</label>" +
      '<select id="dost-mk-bolum" class="dost-kendi__sec">' + secenekler + "</select>" +
      '<label class="dost-shot-modal__label" for="dost-mk-baslik">' + escapeHtml("Makale başlığı (isteğe bağlı)") + "</label>" +
      '<input id="dost-mk-baslik" class="dost-kendi__par" type="text" style="width:100%">' +
      '<div class="dost-shot-modal__attach"><button type="button" data-action="pick">🖼️ ' + escapeHtml("Resim ekle") + "</button>" +
      '<button type="button" data-action="remove-image" class="dost-shot-modal__remove" hidden>' + escapeHtml("Görüntüyü kaldır") + "</button></div>" +
      '<img class="dost-shot-modal__preview" alt="" hidden src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
      '<label class="dost-shot-modal__label" for="dost-mk-metin">' + escapeHtml("Makalen (kendi sesinle; redaksiyonu Claude yapar, onayın olmadan yayına çıkmaz)") + "</label>" +
      '<textarea id="dost-mk-metin" class="dost-shot-modal__note" rows="12"></textarea>' +
      '<div class="dost-shot-modal__actions"><button type="button" data-action="cancel">' + escapeHtml("Vazgeç") + "</button>" +
      '<button type="button" data-action="save" class="dost-shot-modal__save">' + escapeHtml("Kaydet") + "</button></div></div>";
    document.body.appendChild(modal);
    let img = null;
    const preview = modal.querySelector(".dost-shot-modal__preview");
    const removeBtn = modal.querySelector('[data-action="remove-image"]');
    const ta = modal.querySelector("textarea");
    diktePanel(ta);
    ta.focus();
    const setImage = (d) => { img = d; preview.src = d || ""; preview.hidden = !d; removeBtn.hidden = !d; };
    let birak = null;
    const close = () => { if (birak) birak(); modal.remove(); if (triggerEl && triggerEl.isConnected) triggerEl.focus(); };
    birak = katmanAc(close);
    modal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    modal.querySelector('[data-action="cancel"]').addEventListener("click", close);
    removeBtn.addEventListener("click", () => setImage(null));
    modal.querySelector('[data-action="pick"]').addEventListener("click", async () => {
      const d = await pickImageFileToDataUrl(); if (d) setImage(d);
    });
    modal.querySelector('[data-action="save"]').addEventListener("click", async () => {
      const metin = ta.value.trim();
      if (!metin && !img) { ta.focus(); return; }
      const sec = modal.querySelector("#dost-mk-bolum");
      const b = bolumler.find((x) => x.yol === sec.value) || {};
      await kendiNotKaydet("makale-taslagi", {
        metin: metin, image: img, bolum: b.yol || "", bolumAd: b.ad || "",
        makaleBaslik: modal.querySelector("#dost-mk-baslik").value.trim(),
      });
      close();
    });
    modal.addEventListener("keydown", (e) => trapTabKey(e, modal));
  }

  // --- metin düzenlemesi --------------------------------------------------
  function nearestHeading(el) {
    let node = el.previousElementSibling;
    while (node) {
      if (/^H[1-4]$/.test(node.tagName)) return node.textContent.trim();
      node = node.previousElementSibling;
    }
    let parent = el.parentElement;
    while (parent) {
      const h = parent.querySelector("h1, h2, h3");
      if (h) return h.textContent.trim();
      parent = parent.parentElement;
    }
    return "";
  }

  function recordEdit(el) {
    const orj = originals.get(el);
    if (!orj || el.dataset.dostOnizleme) return;
    const after = htmlAl(el);
    const q = getQueue();
    const mevcutId = el.dataset.dostEditId;
    const mevcut = mevcutId ? q.find((x) => x.id === mevcutId) : null;
    if (after === orj.html) {
      // Hiç değişmemiş (ya da eski hâline döndürülmüş) paragraf kuyruğa
      // düşmez; düşmüşse çıkar.
      if (mevcut) {
        q.splice(q.indexOf(mevcut), 1);
        delete el.dataset.dostEditId;
        setQueue(q);
      }
      return;
    }
    const adres = adresBul(el);
    const entry = Object.assign({
      id: mevcut ? mevcut.id : yeniId(),
      type: "metin",
      bicim: "html",
      url: location.pathname,
      lang: (I18n() && I18n().getLang()) || "tr",
      heading: nearestHeading(el),
      before: orj.html,
      after: after,
      before_metin: orj.metin,
      after_metin: metinAl(el),
      timestamp: new Date().toISOString(),
    }, adres);
    if (mevcut) {
      entry.diger_diller = mevcut.diger_diller;
      entry.kaynak_metin = mevcut.kaynak_metin;
      entry.adres_dogrulandi = mevcut.adres_dogrulandi;
      q[q.indexOf(mevcut)] = entry;
    } else {
      q.push(entry);
    }
    if (!setQueue(q)) return;
    el.dataset.dostEditId = entry.id;
    if (!mevcut && entry.alan) {
      ucDilEkle(entry).then((ok) => {
        if (!ok) return;
        kaydiGuncelle(entry.id, (e) => {
          e.kaynak_metin = entry.kaynak_metin;
          e.diger_diller = entry.diger_diller;
          e.adres_dogrulandi = entry.adres_dogrulandi;
        });
      });
    }
  }

  function makeEditable(el) {
    if (el.dataset.dostEditable) return;
    el.dataset.dostEditable = "1";
    el.setAttribute("contenteditable", "true");
    el.spellcheck = false;
    originals.set(el, { html: htmlAl(el), metin: metinAl(el) });
    el.addEventListener("blur", () => recordEdit(el));
    // Enter yeni bir <div> açar ve alanın yapısını bozar: paragraf
    // düzenlemesi tek alanlık bir iştir.
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    // Yapıştırma düz metin olarak girer -- dışarıdan stil/etiket taşınmasın.
    el.addEventListener("paste", (e) => {
      const metin = e.clipboardData && e.clipboardData.getData("text/plain");
      if (metin == null) return;
      e.preventDefault();
      document.execCommand("insertText", false, metin.replace(/\s*\n\s*/g, " "));
    });
  }

  function scanAndMakeEditable() {
    document.querySelectorAll(PROSE_SELECTOR).forEach(makeEditable);
    gonuleYazDugmeleri();
    isaretleKuyruk();
  }

  // "Gönül'e yaz" (2026-10-29, kullanıcı onaylı öneri): @revise açıkken, kaynağı bilinen her okuma
  // kartının (data-dost-dosya + data-dost-kaynak) başlığının yanında mürekkep halkalı küçük düğme.
  // Not o kayda bağlı doğar (dosya + kayıt + sayfa); yazar listeden seçmez. Yalnız kip açıkken vardır.
  function gonuleYazDugmeleri() {
    document.querySelectorAll("article[data-dost-dosya][data-dost-kaynak]").forEach((kart) => {
      if (kart.querySelector(".dost-gonul-yaz")) return;
      if (/\/gonul\//.test(location.pathname)) return;      // Gönül sayfalarının kendisinde anlamsız
      const baslik = kart.querySelector("h1, h2, h3, h4");
      if (!baslik) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "dost-gonul-yaz";
      const makale = /^research\/kuantum\/makaleler\//.test(kart.dataset.dostDosya || "");   // Yan Yana "Fizik makaleleri" (2026-11-02)
      const sirli = makale || /^research\/kuantum\/sirli\//.test(kart.dataset.dostDosya || "");   // Yan Yana "Sırlı anlatımlar" dizini (2026-11-02)
      const et = makale ? ui({ tr: "Bu makaleye not bırak", en: "Leave a note on this paper", pt: "Deixar uma nota neste artigo" }) : sirli ? ui({ tr: "Bu sırlı anlatıma not bırak", en: "Leave a note on this passage", pt: "Deixar uma nota nesta passagem" }) : ui({ tr: "Gönül'e yaz", en: "Write to the notebook", pt: "Escrever no caderno" });
      b.innerHTML = '<span class="dost-gonul-yaz__muhur" aria-hidden="true"></span>' + escapeHtml(et);
      b.setAttribute("aria-label", et + ": " + (baslik.textContent || "").trim());
      b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        buildKendiNotModal(b, {
          tur: sirli ? "sirli-notu" : "gonul-taslagi",
          kaynak: { dosya: kart.dataset.dostDosya, kayit: kart.dataset.dostKaynak, baslik: (baslik.textContent || "").trim() },
        });
      });
      baslik.insertAdjacentElement("afterend", b);
    });
  }

  // Bulgudan kuyruğa (durus-kontrol.js / tahkik-tarama.js): "düzeltme
  // öner" düğmesi bir veri alanının tam metnini ve önerilen yeni metni
  // adresiyle birlikte buraya bırakır.
  function kuyrugaEkle(oneri) {
    const entry = Object.assign({
      id: yeniId(), type: "metin", bicim: "html", url: location.pathname,
      lang: "tr", timestamp: new Date().toISOString(),
    }, oneri);
    if (entry.before != null && entry.kaynak_metin == null) entry.kaynak_metin = entry.before;
    entry.adres_dogrulandi = entry.kaynak_metin != null && duzle(entry.kaynak_metin) === duzle(entry.before);
    const q = getQueue();
    q.push(entry);
    if (!setQueue(q)) return false;
    if (entry.alan && !entry.diger_diller) {
      ucluOku(entry).then((uclu) => {
        if (!uclu) return;
        kaydiGuncelle(entry.id, (e) => {
          e.diger_diller = {};
          ["tr", "en", "pt"].forEach((l) => { if (l !== e.lang && uclu[l] != null) e.diger_diller[l] = uclu[l]; });
        });
      });
    }
    uyari(ui({ tr: "Kuyruğa eklendi.", en: "Added to the queue.", pt: "Adicionado à fila." }), "bilgi");
    return true;
  }

  // --- dışa aktarım paketi --------------------------------------------------
  function susturulanlar() {
    const out = [];
    [["durus", "dost-durus-susturulan"], ["tahkik", "dost-tahkik-susturulan"]].forEach(([tarama, anahtar]) => {
      let d = {};
      try { d = JSON.parse(localStorage.getItem(anahtar) || "{}"); } catch (e) {}
      Object.keys(d).forEach((k) => {
        const v = d[k];
        const kayit = { tarama: tarama, anahtar: k };
        if (v && typeof v === "object") Object.assign(kayit, v);
        else if (typeof v === "string") kayit.zaman = v;
        out.push(kayit);
      });
    });
    return out;
  }
  function paketKur(gorseller) {
    const q = getQueue().map((e, i) => ({ e: e, i: i })).sort((a, b) => (turSirasi(a.e) - turSirasi(b.e)) || (a.i - b.i)).map((x) => x.e).map((e) => {
      const c = Object.assign({}, e);
      if (!c.tur && turTahmini(e)) c.tur = turTahmini(e);
      if (gorseller && e.gorsel && gorseller[e.gorsel]) c.image = gorseller[e.gorsel];
      return c;
    });
    return {
      tur: "dost-duzenlemeler",
      bicim: BICIM,
      tarih: new Date().toISOString(),
      kaynak: location.origin,
      not: "scripts/duzenleme-uygula.py --check <bu dosya> ile sınanır, --apply ile veriye işlenir.",
      duzenlemeler: q,
      susturulan: susturulanlar(),
    };
  }
  function gorselleriTopla() {
    const ids = getQueue().map((e) => e.gorsel).filter(Boolean);
    const out = {};
    return Promise.all(ids.map((id) => gorselOku(id).then((v) => { if (v) out[id] = v; }).catch(() => {})))
      .then(() => out);
  }
  function dosyaAdi() {
    return "dost-duzenlemeler-" + new Date().toISOString().slice(0, 10) + ".json";
  }
  function indir(metin, ad) {
    const blob = new Blob([metin], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Paylaşım menüsü (iOS/Android) navigator.share'in kullanıcı
  // dokunuşunun İÇİNDE çağrılmasını istiyor; araya IndexedDB okuması
  // girerse dokunuş "tüketilir" ve paylaşım reddedilir. Bu yüzden paket
  // önceden, kuyruk her değiştiğinde hazırlanıyor.
  let hazirPaket = null;
  let paketZaman = null;
  function paketiTazele() {
    if (!panel) return;
    clearTimeout(paketZaman);
    paketZaman = setTimeout(() => {
      gorselleriTopla().then((g) => {
        const metin = JSON.stringify(paketKur(g), null, 2);
        hazirPaket = { metin: metin, ad: dosyaAdi() };
      });
    }, 120);
  }
  // Paylaşım sayfası dosya paylaşabiliyor mu (telefon). Yoksa "gönder" JSON'u indirir.
  function paylasimDesteklenir() {
    try {
      const f = new File(["{}"], "x.json", { type: "application/json" });
      return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [f] }));
    } catch (e) { return false; }
  }
  function claudeaGonder() {
    const p = hazirPaket || { metin: JSON.stringify(paketKur(null), null, 2), ad: dosyaAdi() };
    let file = null;
    try { file = new File([p.metin], p.ad, { type: "application/json" }); } catch (e) {}
    if (file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: p.ad }).catch((e) => {
        if (e && e.name === "AbortError") return;
        indir(p.metin, p.ad);
      });
      return;
    }
    indir(p.metin, p.ad);
    uyari(ui({
      tr: "Bu tarayıcı dosya paylaşamıyor; JSON indirildi.",
      en: "This browser cannot share files; the JSON was downloaded.",
      pt: "Este navegador não compartilhamento arquivos; o JSON foi baixado.",
    }), "bilgi");
  }
  function kopyala() {
    const metin = JSON.stringify(paketKur(null), null, 2);
    const bitti = () => uyari(ui({
      tr: "Panoya kopyalandı (görüntüler hariç).", en: "Copied to clipboard (without images).", pt: "Copiado (sem imagens).",
    }), "bilgi");
    const yedek = () => {
      const ta = document.createElement("textarea");
      ta.value = metin;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      if (ok) bitti();
      else uyari(ui({ tr: "Kopyalanamadı.", en: "Could not copy.", pt: "Não foi possível copiar." }));
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(bitti, yedek);
    else yedek();
  }

  function clearQueue() {
    if (!confirm(ui({ tr: "Bekleyen tüm düzenlemeler silinsin mi?", en: "Clear all pending edits?", pt: "Apagar todas as edições pendentes?" }))) return;
    const ids = getQueue().map((e) => e.gorsel).filter(Boolean);
    try { localStorage.removeItem(QUEUE_KEY); } catch (e) {}
    ids.forEach((id) => gorselSil(id).catch(() => {}));
    document.querySelectorAll("[data-dost-edit-id]").forEach((el) => delete el.dataset.dostEditId);
    updateBadge();
    paketiTazele();
    esIste();
  }

  function updateBadge() {
    if (!panel) return;
    const badge = panel.querySelector(".dost-edit-panel__count");
    if (badge) badge.textContent = String(getQueue().length);
    if (typeof sayfaSayisiYaz === "function") sayfaSayisiYaz();
  }

  // --- kelime düzeyi fark (review.js'te de aynı küçük algoritma var) -----
  function kelimeFarki(a, b) {
    const A = String(a || "").split(/(\s+)/), B = String(b || "").split(/(\s+)/);
    if (A.length * B.length > 250000) return escapeHtml(b);
    const n = A.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = "";
    while (i < n && j < m) {
      if (A[i] === B[j]) { out += escapeHtml(A[i]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out += "<del>" + escapeHtml(A[i]) + "</del>"; i++; }
      else { out += "<ins>" + escapeHtml(B[j]) + "</ins>"; j++; }
    }
    while (i < n) out += "<del>" + escapeHtml(A[i++]) + "</del>";
    while (j < m) out += "<ins>" + escapeHtml(B[j++]) + "</ins>";
    return out;
  }

  // --- biriken notların listesi --------------------------------------------
  // Metin düzenlemesi dışındaki, serbest metinli kayıtlar: görsel not, kenar notu (yalnız
  // sahibine), Gönül Defteri taslağı. Üçü de `note` alanında metin taşır.
  function notMu(e) { return e.type === "visual-note" || e.type === "kenar-notu" || e.type === "gonul-taslagi" || e.type === "sirli-notu" || e.type === "makale-taslagi" || e.type === "soru" || e.type === "toplu-oneri"; }
  function entryTitle(e, i) {
    const where = (e.url || "").replace(/^.*\/(?=[^/]*$)/, "") || "/";
    if (e.type === "kenar-notu") return `${i + 1}. ✍️ ${escapeHtml(ui({ tr: "kenar notu", en: "margin note", pt: "nota à margem" }))} · ${escapeHtml(e.yazi_baslik || e.yazi || "")}`;
    if (e.type === "makale-taslagi") return `${i + 1}. ✍️ Makale taslağı · ${escapeHtml(e.bolum_ad || e.bolum || "")}`;
    if (e.type === "sirli-notu") return `${i + 1}. ✍️ Sırlı anlatım notu${e.kaynak_baslik ? " · " + escapeHtml(e.kaynak_baslik) : ""}`;
    if (e.type === "gonul-taslagi") return `${i + 1}. ✍️ ${escapeHtml(ui({ tr: "Gönül Defteri taslağı", en: "Heart Notebook draft", pt: "Rascunho do Caderno do Coração" }))}${e.kaynak_baslik ? " · " + escapeHtml(e.kaynak_baslik) : ""}`;
    if (e.type === "soru") return `${i + 1}. ❓ ${escapeHtml(ui({ tr: "Claude'a soru", en: "Question for Claude", pt: "Pergunta ao Claude" }))} · ${escapeHtml(e.heading || where)}`;
    if (e.type === "toplu-oneri") return `${i + 1}. 🔎 ${escapeHtml(ui({ tr: "Bütün sitede değiştir", en: "Replace across the site", pt: "Substituir em todo o site" }))} · “${escapeHtml(e.bul || "")}” → “${escapeHtml(e.yerine || "")}”`;
    if (e.type === "visual-note") return `${i + 1}. 🖌️ ${escapeHtml(ui({ tr: "görsel not", en: "visual note", pt: "nota visual" }))} · ${escapeHtml(where)}`;
    return `${i + 1}. ✎ ${escapeHtml(e.heading || where)}`;
  }
  function adresSatiri(e) {
    if (notMu(e)) return "";
    const parcalar = [e.dosya, e.kayit, e.alan, e.lang].filter(Boolean);
    const durum = !e.alan
      ? ui({ tr: "adres yok — elle bulunacak", en: "no address — to be located by hand", pt: "sem endereço — localizar à mão" })
      : (e.adres_dogrulandi === false
        ? ui({ tr: "kaynak metin farklı — kontrol et", en: "source text differs — check", pt: "texto-fonte difere — verificar" })
        : "");
    return `<p class="dost-notes__adres"><code>${escapeHtml(parcalar.join(" · "))}</code>${durum ? ` <span class="dost-notes__adres-uyari">${escapeHtml(durum)}</span>` : ""}</p>`;
  }
  function deleteEntry(id) {
    const q = getQueue();
    const e = q.find((x) => x.id === id);
    if (!e) return;
    if (!confirm(ui({ tr: "Bu not silinsin mi?", en: "Delete this note?", pt: "Apagar esta nota?" }))) return;
    q.splice(q.indexOf(e), 1);
    setQueue(q);
    if (e.gorsel) gorselSil(e.gorsel).catch(() => {});
    document.querySelectorAll(`[data-dost-edit-id="${id}"]`).forEach((el) => delete el.dataset.dostEditId);
    renderNoteList();
  }
  function saveEntryText(id, value) {
    kaydiGuncelle(id, (e) => {
      if (notMu(e)) e.note = value;
      else { e.after = value; e.after_metin = value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
      e.editedAt = new Date().toISOString();
    });
  }

  let listModal = null;
  function renderNoteList() {
    if (!listModal) return;
    const body = listModal.querySelector(".dost-notes__body");
    const q = getQueue();
    if (!q.length) {
      body.innerHTML = '<p class="dost-notes__empty">' + escapeHtml(ui({ tr: "Henüz kayıtlı not yok.", en: "No saved notes yet.", pt: "Ainda não há notas." })) + "</p>";
      return;
    }
    body.innerHTML = q.map((e, i) => `
      <div class="dost-notes__item" data-id="${escapeHtml(e.id || "")}">
        <div class="dost-notes__head">
          <span class="dost-notes__title">${entryTitle(e, i)}</span>
          <button type="button" class="dost-notes__del" data-del="${escapeHtml(e.id || "")}">${escapeHtml(ui({ tr: "Sil", en: "Delete", pt: "Apagar" }))}</button>
        </div>
        ${adresSatiri(e)}${turSecici(e)}${cakismaUyari(e, q)}
        ${!notMu(e) && e.before != null ? `<p class="dost-notes__fark">${kelimeFarki(e.before_metin || e.before, e.after_metin || e.after)}</p>` : ""}
        ${e.gorsel || e.image ? `<img class="dost-notes__thumb" alt="" data-gorsel="${escapeHtml(e.gorsel || "")}" ${e.image ? `src="${escapeHtml(e.image)}"` : ""}>` : ""}
        <textarea class="dost-notes__text" data-text="${escapeHtml(e.id || "")}" rows="3">${escapeHtml(notMu(e) ? e.note : e.after)}</textarea>
        ${eslikHtml(e)}
      </div>`).join("");
    body.querySelectorAll("[data-tur]").forEach((sel) => sel.addEventListener("change", () => { kaydiGuncelle(sel.dataset.tur, (e) => { e.tur = sel.value; }); }));
    body.querySelectorAll("[data-eslik]").forEach((ta) => ta.addEventListener("input", () => {
      const [id, l] = ta.dataset.eslik.split("|");
      kaydiGuncelle(id, (e) => {
        e.eslik = e.eslik || {};
        if (norm0(ta.value) === norm0((e.diger_diller || {})[l])) delete e.eslik[l]; else e.eslik[l] = ta.value;
        if (!Object.keys(e.eslik).length) delete e.eslik;
      });
    }));
    body.querySelectorAll("img[data-gorsel]").forEach((img) => {
      const id = img.dataset.gorsel;
      if (!id) return;
      gorselOku(id).then((v) => { if (v) img.src = v; }).catch(() => {});
    });
    body.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteEntry(b.dataset.del)));
    body.querySelectorAll("[data-text]").forEach((t) => t.addEventListener("input", () => saveEntryText(t.dataset.text, t.value)));
  }

  function openNoteList(triggerEl) {
    // Eski kayıtların kimliği yoksa bir kez verilir (silme/düzeltme kimlikle).
    const q = getQueue();
    if (q.some((e) => !e.id)) { q.forEach((e) => { if (!e.id) e.id = yeniId(); }); setQueue(q); }
    listModal = document.createElement("div");
    listModal.className = "dost-shot-modal dost-notes";
    listModal.innerHTML =
      '<div class="dost-shot-modal__backdrop"></div>' +
      '<div class="dost-shot-modal__card dost-notes__card" role="dialog" aria-modal="true">' +
      '<p class="dost-shot-modal__label">' + escapeHtml(ui({ tr: "Kayıtlı notlar — düzenleyebilir ya da silebilirsin", en: "Saved notes — edit or delete", pt: "Notas salvas — editar ou apagar" })) + "</p>" +
      '<div class="dost-notes__body"></div>' +
      '<div class="dost-shot-modal__actions">' +
      '<button type="button" data-action="close" class="dost-shot-modal__save">' + escapeHtml(ui({ tr: "Kapat", en: "Close", pt: "Fechar" })) + "</button>" +
      "</div></div>";
    document.body.appendChild(listModal);
    renderNoteList();
    let birak = null;
    const close = () => {
      if (birak) birak();
      if (listModal) listModal.remove();
      listModal = null;
      if (triggerEl && typeof triggerEl.focus === "function") triggerEl.focus();
    };
    birak = katmanAc(close);
    listModal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    listModal.querySelector('[data-action="close"]').addEventListener("click", close);
    listModal.addEventListener("keydown", (e) => trapTabKey(e, listModal));
    const card = listModal.querySelector(".dost-notes__card");
    const focusables = getFocusables(card);
    if (focusables.length) focusables[0].focus();
    else card.focus();
  }

  // =====================================================================================================
  // Ek araçlar (2026-10-30, kullanıcı onaylı fikir listesi V1–V3, V5–V9, V11, V12, V15–V17, V20).
  // Hepsi aynı kuyruğu kullanır; yeni bir veri modeli yok. Uygulayan taraf (scripts/duzenleme-uygula.py) yeni alanları
  // (`tur`, `eslik`, `grup`) okur ve yoksa yok sayar.
  // =====================================================================================================
  const TURLER = [
    ["yazim", { tr: "Yazım", en: "Spelling", pt: "Ortografia" }],
    ["olgu", { tr: "Olgu", en: "Fact", pt: "Fato" }],
    ["ceviri", { tr: "Çeviri", en: "Translation", pt: "Tradução" }],
    ["bicim", { tr: "Biçim", en: "Format", pt: "Formato" }],
    ["durus", { tr: "Duruş", en: "Stance", pt: "Postura" }],
    ["diger", { tr: "Diğer", en: "Other", pt: "Outro" }],
  ];
  function turTahmini(e) {
    if (e.tur) return e.tur;
    if (e.kaynak_arac === "durus" || e.kaynak_arac === "tahkik") return "durus";
    if (e.grup) return "yazim";
    return "";
  }
  function turSirasi(e) { const i = TURLER.findIndex((t) => t[0] === turTahmini(e)); return i < 0 ? TURLER.length : i; }

  // V5: kuyruk düzeyinde geri al / yinele (yalnız bellekte; sayfa yenilenince başlar).
  function kuyrukDomEsitle() {
    const q = getQueue();
    document.querySelectorAll("[data-dost-edit-id]").forEach((el) => {
      const e = q.find((x) => x.id === el.dataset.dostEditId);
      const orj = originals.get(el);
      el.dataset.dostOnizleme = "1";
      if (!e) { if (orj) el.innerHTML = orj.html; delete el.dataset.dostEditId; }
      else if (e.after != null && htmlAl(el) !== e.after) el.innerHTML = e.after;
      delete el.dataset.dostOnizleme;
    });
    isaretleKuyruk();
    updateBadge();
    paketiTazele();
    renderNoteList();
  }
  function kuyrukGeriAl() {
    if (!gecmis.length) { uyari(ui({ tr: "Geri alınacak bir şey yok.", en: "Nothing to undo.", pt: "Nada para desfazer." }), "bilgi"); return; }
    ileriYigin.push(localStorage.getItem(QUEUE_KEY) || "[]");
    geriAliniyor = true;
    try { localStorage.setItem(QUEUE_KEY, gecmis.pop()); } catch (e) {}
    geriAliniyor = false;
    kuyrukDomEsitle();
  }
  function kuyrukYinele() {
    if (!ileriYigin.length) { uyari(ui({ tr: "Yinelenecek bir şey yok.", en: "Nothing to redo.", pt: "Nada para refazer." }), "bilgi"); return; }
    gecmis.push(localStorage.getItem(QUEUE_KEY) || "[]");
    geriAliniyor = true;
    try { localStorage.setItem(QUEUE_KEY, ileriYigin.pop()); } catch (e) {}
    geriAliniyor = false;
    kuyrukDomEsitle();
  }

  // V11: kuyruktaki düzeltmenin sayfadaki öğesi sol kenarda işaretlenir (yeniden açılışta da). Yalnız görsel işaret:
  // data-dost-edit-id'ye dokunmaz (o, bir paragrafın "kuyruktaki kaydı"dır; yeniden açılışta eski metni gösteren öğeye
  // verilirse değişmeden bırakınca kaydı silerdi).
  function kuyrukElementi(e) {
    if (!e || !e.kayit || !e.alan) return null;
    try {
      const kap = document.querySelector('[data-dost-kaynak="' + CSS.escape(e.kayit) + '"]' + (e.dosya ? '[data-dost-dosya="' + CSS.escape(e.dosya) + '"]' : ""));
      if (!kap) return null;
      const sel = '[data-dost-alan="' + CSS.escape(e.alan) + '"]';
      return kap.matches(sel) ? kap : kap.querySelector(sel);
    } catch (x) { return null; }
  }
  function isaretleKuyruk() {
    document.querySelectorAll("[data-dost-kuyrukta]").forEach((el) => el.removeAttribute("data-dost-kuyrukta"));
    const dil = (I18n() && I18n().getLang && I18n().getLang()) || "tr";
    getQueue().forEach((e) => {
      if (e.type && e.type !== "metin") return;
      if (e.lang && e.lang !== dil) return;
      const el = e.alan ? kuyrukElementi(e) : (e.id ? document.querySelector('[data-dost-edit-id="' + CSS.escape(e.id) + '"]') : null);
      if (el) el.setAttribute("data-dost-kuyrukta", "1");
    });
    sayfaSayisiYaz();
  }
  function sayfaSayisiYaz() {
    if (!panel) return;
    const n = getQueue().filter((e) => e.url === location.pathname).length;
    const el = panel.querySelector(".dost-edit-panel__sayfa");
    if (el) el.textContent = n ? ui({ tr: "Bu sayfada " + n + " düzeltme/not var.", en: n + " edit(s)/note(s) on this page.", pt: n + " edição(ões)/nota(s) nesta página." }) : "";
  }

  // V1: önizleme: kuyruktaki düzeltmeleri bu sayfada geçici uygular; "önce" anahtarı eski metni gösterir.
  let onizlemeKip = 0;   // 0 kapalı, 1 sonra (uygulanmış), 2 önce
  const onizlemeSakli = new Map();
  function onizlemeUygula() {
    const dil = (I18n() && I18n().getLang && I18n().getLang()) || "tr";
    if (onizlemeKip === 0) {
      onizlemeSakli.forEach((html, el) => { if (el.isConnected) { el.dataset.dostOnizleme = "1"; el.innerHTML = html; delete el.dataset.dostOnizleme; el.classList.remove("dost-onizleme"); } });
      onizlemeSakli.clear();
      return;
    }
    getQueue().forEach((e) => {
      if (e.type && e.type !== "metin") return;
      if (e.lang && e.lang !== dil) return;
      const el = e.alan ? kuyrukElementi(e) : document.querySelector('[data-dost-edit-id="' + CSS.escape(e.id) + '"]');
      if (!el || e.after == null) return;
      if (!onizlemeSakli.has(el)) onizlemeSakli.set(el, el.innerHTML);
      el.dataset.dostOnizleme = "1";
      el.innerHTML = onizlemeKip === 1 ? e.after : (e.before != null ? e.before : onizlemeSakli.get(el));
      delete el.dataset.dostOnizleme;
      el.classList.add("dost-onizleme");
    });
  }
  function onizlemeDegistir(btn) {
    onizlemeKip = (onizlemeKip + 1) % 3;
    onizlemeUygula();
    if (btn) btn.textContent = onizlemeEtiketi();
    if (onizlemeKip && !onizlemeSakli.size) uyari(ui({ tr: "Bu sayfada önizlenecek düzeltme yok.", en: "No edits to preview on this page.", pt: "Nenhuma edição para visualizar nesta página." }), "bilgi");
  }
  function onizlemeEtiketi() {
    return onizlemeKip === 0 ? ui({ tr: "👁 Önizleme: kapalı", en: "👁 Preview: off", pt: "👁 Prévia: desligada" })
      : onizlemeKip === 1 ? ui({ tr: "👁 Önizleme: SONRA (uygulanmış)", en: "👁 Preview: AFTER (applied)", pt: "👁 Prévia: DEPOIS (aplicado)" })
      : ui({ tr: "👁 Önizleme: ÖNCE (eski metin)", en: "👁 Preview: BEFORE (old text)", pt: "👁 Prévia: ANTES (texto antigo)" });
  }

  // V2: bul ve değiştir (bu sayfadaki düzenlenebilir metinlerde); her öğe sıradan bir düzeltme kaydı olur, hepsi aynı `grup`ta.
  function metinDugumleri(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.parentElement && !n.parentElement.closest(".dost-edit-onizleme-atla") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const l = []; let n; while ((n = w.nextNode())) l.push(n); return l;
  }
  function regexKur(bul, buyuk) { return new RegExp(bul.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), buyuk ? "g" : "gi"); }
  function bulDegistirAc(triggerEl) {
    const modal = document.createElement("div");
    modal.className = "dost-shot-modal dost-bd";
    modal.innerHTML =
      '<div class="dost-shot-modal__backdrop"></div><div class="dost-shot-modal__card dost-notes__card" role="dialog" aria-modal="true">' +
      '<p class="dost-shot-modal__label">' + escapeHtml(ui({ tr: "Bul ve değiştir — bu sayfadaki metinlerde", en: "Find and replace — in the text on this page", pt: "Localizar e substituir — nos textos desta página" })) + "</p>" +
      '<input class="dost-bd__bul" type="text" placeholder="' + escapeHtml(ui({ tr: "Bul", en: "Find", pt: "Localizar" })) + '" aria-label="' + escapeHtml(ui({ tr: "Bul", en: "Find", pt: "Localizar" })) + '">' +
      '<input class="dost-bd__yerine" type="text" placeholder="' + escapeHtml(ui({ tr: "Yerine", en: "Replace with", pt: "Substituir por" })) + '" aria-label="' + escapeHtml(ui({ tr: "Yerine", en: "Replace with", pt: "Substituir por" })) + '">' +
      '<label class="dost-bd__sec"><input type="checkbox" class="dost-bd__buyuk"> ' + escapeHtml(ui({ tr: "Büyük/küçük harfe duyarlı", en: "Match case", pt: "Diferenciar maiúsculas" })) + "</label>" +
      '<label class="dost-bd__sec"><input type="checkbox" class="dost-bd__site"> ' + escapeHtml(ui({ tr: "Bütün sitede de aranması için Claude'a not ekle", en: "Also add a note for Claude to search the whole site", pt: "Adicionar nota para o Claude procurar em todo o site" })) + "</label>" +
      '<div class="dost-bd__sonuc dost-notes__body" aria-live="polite"></div>' +
      '<div class="dost-shot-modal__actions"><button type="button" data-action="cancel">' + escapeHtml(ui({ tr: "Kapat", en: "Close", pt: "Fechar" })) + '</button>' +
      '<button type="button" data-action="bul">' + escapeHtml(ui({ tr: "Bul", en: "Find", pt: "Localizar" })) + '</button>' +
      '<button type="button" data-action="uygula" class="dost-shot-modal__save" disabled>' + escapeHtml(ui({ tr: "Seçilenleri değiştir", en: "Replace selected", pt: "Substituir selecionados" })) + "</button></div></div>";
    document.body.appendChild(modal);
    modal.querySelector(".dost-bd__bul").focus();
    let birak = null;
    const close = () => { if (birak) birak(); modal.remove(); if (triggerEl && triggerEl.isConnected) triggerEl.focus(); };
    birak = katmanAc(close);
    modal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    modal.querySelector('[data-action="cancel"]').addEventListener("click", close);
    modal.addEventListener("keydown", (e) => trapTabKey(e, modal));
    const sonuc = modal.querySelector(".dost-bd__sonuc"), uygulaBtn = modal.querySelector('[data-action="uygula"]');
    let bulunan = [];
    function bul() {
      const b = modal.querySelector(".dost-bd__bul").value;
      bulunan = [];
      sonuc.innerHTML = "";
      uygulaBtn.disabled = true;
      if (!b) return;
      const re = regexKur(b, modal.querySelector(".dost-bd__buyuk").checked);
      document.querySelectorAll("[data-dost-editable]").forEach((el) => {
        if (el.closest(".dost-edit-panel, .dost-bd")) return;
        const duz = metinAl(el);
        const say = (duz.match(re) || []).length;
        if (say) bulunan.push({ el: el, say: say, duz: duz });
      });
      if (!bulunan.length) { sonuc.textContent = ui({ tr: "Bu sayfada eşleşme yok.", en: "No matches on this page.", pt: "Nenhuma correspondência nesta página." }); return; }
      sonuc.innerHTML = bulunan.map((x, i) => {
        const m = x.duz.search(re), bas = Math.max(0, m - 40);
        const parca = (bas ? "…" : "") + x.duz.slice(bas, m) + "\u0001" + x.duz.slice(m, m + b.length) + "\u0002" + x.duz.slice(m + b.length, m + b.length + 50) + "…";
        return '<label class="dost-bd__satir"><input type="checkbox" data-i="' + i + '" checked> <span>' +
          escapeHtml(parca).replace("\u0001", "<mark>").replace("\u0002", "</mark>") + ' <small>(' + x.say + ")</small></span></label>";
      }).join("");
      uygulaBtn.disabled = false;
    }
    modal.querySelector('[data-action="bul"]').addEventListener("click", bul);
    modal.querySelector(".dost-bd__bul").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); bul(); } });
    uygulaBtn.addEventListener("click", () => {
      const b = modal.querySelector(".dost-bd__bul").value, y = modal.querySelector(".dost-bd__yerine").value;
      const re = regexKur(b, modal.querySelector(".dost-bd__buyuk").checked);
      const grup = "bd-" + yeniId();
      let n = 0;
      sonuc.querySelectorAll("input[data-i]:checked").forEach((c) => {
        const x = bulunan[Number(c.dataset.i)];
        if (!x || !x.el.isConnected) return;
        metinDugumleri(x.el).forEach((tn) => { if (re.test(tn.nodeValue)) { re.lastIndex = 0; tn.nodeValue = tn.nodeValue.replace(re, () => y); } re.lastIndex = 0; });
        recordEdit(x.el);
        const id = x.el.dataset.dostEditId;
        if (id) { kaydiGuncelle(id, (e) => { e.grup = grup; e.tur = e.tur || "yazim"; e.bul_degistir = { bul: b, yerine: y }; }); n++; }
      });
      if (modal.querySelector(".dost-bd__site").checked) {
        const q = getQueue();
        q.push({ id: yeniId(), type: "toplu-oneri", url: location.pathname, lang: (I18n() && I18n().getLang && I18n().getLang()) || "tr", timestamp: new Date().toISOString(), grup: grup, bul: b, yerine: y, note: "Bütün sitede “" + b + "” → “" + y + "” (sayfa dışı eşleşmeler Claude tarafından taranır; her biri tek tek denetlenir)." });
        setQueue(q);
      }
      isaretleKuyruk();
      uyari(ui({ tr: n + " öğe değiştirildi; kuyruğa eklendi.", en: n + " item(s) replaced; added to the queue.", pt: n + " item(ns) substituído(s); adicionado(s) à fila." }), "bilgi");
      close();
    });
  }


  // V3 / V6 / V7: not listesindeki yardımcılar
  function norm0(x) { return String(x == null ? "" : x).replace(/\s+/g, " ").trim(); }
  function turSecici(e) {
    if (notMu(e) || e.type === "toplu-oneri") return "";
    const cur = turTahmini(e);
    return '<p class="dost-notes__tur-satir"><label>' + escapeHtml(ui({ tr: "Tür", en: "Kind", pt: "Tipo" })) + ' <select class="dost-notes__tur" data-tur="' + escapeHtml(e.id || "") + '"><option value="">—</option>' +
      TURLER.map((t) => '<option value="' + t[0] + '"' + (cur === t[0] ? " selected" : "") + ">" + escapeHtml(ui(t[1])) + "</option>").join("") + "</select></label></p>";
  }
  function cakismaUyari(e, q) {
    if (notMu(e) || !e.alan) return "";
    const ayni = q.filter((x) => x.id !== e.id && !notMu(x) && x.dosya === e.dosya && x.kayit === e.kayit && x.alan === e.alan && x.lang === e.lang);
    if (!ayni.length) return "";
    return '<p class="dost-notes__adres-uyari">' + escapeHtml(ui({ tr: "Bu alanın aynı dilde " + ayni.length + " başka düzeltmesi daha var — hangisi geçerli?", en: "This field has " + ayni.length + " other edit(s) in the same language — which one applies?", pt: "Este campo tem mais " + ayni.length + " edição(ões) no mesmo idioma — qual vale?" })) + "</p>";
  }
  function eslikHtml(e) {
    if (notMu(e) || !e.alan || !e.diger_diller) return "";
    const digerler = Object.keys(e.diger_diller).filter((l) => l !== e.lang);
    if (!digerler.length) return "";
    const dolu = digerler.filter((l) => e.eslik && e.eslik[l] != null);
    const durum = dolu.length === digerler.length
      ? ui({ tr: "Üç dil birlikte yazılacak.", en: "All three languages will be written together.", pt: "Os três idiomas serão escritos juntos." })
      : ui({ tr: "Öteki dil(ler) değişmedi; uygulayıcı üçlüyü tamamlar (“Üç dil birlikte”).", en: "The other language(s) are unchanged; the applier completes the trio (“three languages together”).", pt: "O(s) outro(s) idioma(s) não mudou(aram); quem aplica completa o trio (“três idiomas juntos”)." });
    return '<details class="dost-notes__eslik"' + (dolu.length ? " open" : "") + "><summary>" + escapeHtml(ui({ tr: "Öteki dillerde eşlik", en: "Companion in other languages", pt: "Equivalente nos outros idiomas" })) + " · " + digerler.map((l) => l.toUpperCase()).join(" ") + "</summary>" +
      digerler.map((l) => '<label class="dost-notes__eslik-satir">' + l.toUpperCase() + '<textarea rows="2" data-eslik="' + escapeHtml((e.id || "") + "|" + l) + '">' + escapeHtml(e.eslik && e.eslik[l] != null ? e.eslik[l] : (e.diger_diller[l] || "")) + "</textarea></label>").join("") +
      '<p class="dost-notes__eslik-durum">' + escapeHtml(durum) + "</p></details>";
  }

  // V14: seçili metni <strong> / <em> yap (kaynağın biçimiyle aynı etiketler); panel düğmeleri telefonda da çalışır.
  function bicimUygula(etiket) {
    const sel = window.getSelection && window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) { uyari(ui({ tr: "Önce düzenlenen bir metinde bir parça seç.", en: "First select a piece of text inside an editable paragraph.", pt: "Primeiro selecione um trecho em um parágrafo editável." }), "bilgi"); return; }
    const n = sel.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode);
    const el = n && n.closest && n.closest("[data-dost-editable]");
    if (!el) { uyari(ui({ tr: "Seçim düzenlenebilir bir paragrafın içinde değil.", en: "The selection is not inside an editable paragraph.", pt: "A seleção não está em um parágrafo editável." }), "bilgi"); return; }
    const metin = sel.toString();
    if (!metin.trim()) return;
    document.execCommand("insertHTML", false, "<" + etiket + ">" + escapeHtml(metin) + "</" + etiket + ">");
    recordEdit(el);
    isaretleKuyruk();
  }

  // V12: okunur özet (Markdown) — kendin okuyup onaylamak için.
  function markdownOzet() {
    const q = getQueue().slice().sort((a, b) => turSirasi(a) - turSirasi(b));
    const tur = (e) => (TURLER.find((t) => t[0] === turTahmini(e)) || [null, { tr: "—" }])[1].tr;
    let s = "# @revise kuyruğu — " + new Date().toISOString().slice(0, 10) + "\n";
    q.forEach((e, i) => {
      s += "\n## " + (i + 1) + ". " + (e.type === "toplu-oneri" ? "Toplu öneri" : e.type === "soru" ? "Soru" : notMu(e) ? "Not" : tur(e)) + " · " + (e.heading || e.url || "") + "\n";
      s += "- sayfa: " + location.origin + (e.url || "") + (e.lang && e.lang !== "tr" ? " (" + e.lang + ")" : "") + "\n";
      if (e.dosya) s += "- adres: `" + [e.dosya, e.kayit, e.alan].filter(Boolean).join(" · ") + "`\n";
      if (notMu(e) || e.type === "soru" || e.type === "toplu-oneri") s += "\n> " + String(e.note || "").replace(/\n/g, "\n> ") + "\n";
      else if (e.before != null) s += "\n~~" + (e.before_metin || e.before) + "~~\n\n" + (e.after_metin || e.after) + "\n";
      if (e.eslik) Object.keys(e.eslik).forEach((l) => { s += "\n**" + l.toUpperCase() + " eşlik:** " + e.eslik[l] + "\n"; });
    });
    return s;
  }
  function metniKopyala(metin, bitti) {
    const yedek = () => {
      const ta = document.createElement("textarea"); ta.value = metin; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) {} ta.remove();
      if (ok) bitti(); else uyari(ui({ tr: "Kopyalanamadı.", en: "Could not copy.", pt: "Não foi possível copiar." }));
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(bitti, yedek); else yedek();
  }

  // V20: kuyruğu GitHub'da önceden doldurulmuş bir issue olarak aç (kullanıcı "Submit"e kendisi basar).
  function issueAc() {
    let govde = markdownOzet();
    if (govde.length > 5500) govde = govde.slice(0, 5500) + "\n\n… (kısaltıldı; tam paket için “Claude'a gönder”)";
    const u = "https://github.com/hacimurat1979/Dost/issues/new?labels=" + encodeURIComponent("duzeltme") + "&title=" + encodeURIComponent("@revise düzeltmeleri " + new Date().toISOString().slice(0, 10)) + "&body=" + encodeURIComponent(govde);
    const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  }

  // V15: Claude'a soru (düzeltme değil, tahkik sorusu): ayrı tür; uygulayıcı research/sorular-gelen/ altına yazar.
  function soruAc(triggerEl) {
    const sel = window.getSelection && window.getSelection();
    let adres = {}, secili = "";
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      secili = sel.toString().replace(/\s+/g, " ").trim().slice(0, 300);
      const n = sel.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode);
      if (n && n.closest) adres = adresBul(n);
    }
    const modal = document.createElement("div");
    modal.className = "dost-shot-modal";
    modal.innerHTML = '<div class="dost-shot-modal__backdrop"></div><div class="dost-shot-modal__card" role="dialog" aria-modal="true">' +
      '<label class="dost-shot-modal__label" for="dost-soru-metin">' + escapeHtml(ui({ tr: "Claude'a soru (bu paragraf kaynakla uyuşuyor mu, bu terim nerede geçiyor…)", en: "Question for Claude (does this paragraph match the source, where does this term occur…)", pt: "Pergunta ao Claude (este parágrafo confere com a fonte, onde este termo ocorre…)" })) + "</label>" +
      (secili ? '<blockquote class="okuma-arac__alinti">' + escapeHtml(secili) + "</blockquote>" : "") +
      '<textarea id="dost-soru-metin" class="dost-shot-modal__note" rows="3"></textarea>' +
      '<div class="dost-shot-modal__actions"><button type="button" data-action="cancel">' + escapeHtml(ui({ tr: "Vazgeç", en: "Cancel", pt: "Cancelar" })) + '</button>' +
      '<button type="button" data-action="save" class="dost-shot-modal__save">' + escapeHtml(ui({ tr: "Kaydet", en: "Save", pt: "Salvar" })) + "</button></div></div>";
    document.body.appendChild(modal);
    const ta = modal.querySelector("textarea"); ta.focus(); diktePanel(ta);
    let birak = null;
    const close = () => { if (birak) birak(); modal.remove(); if (triggerEl && triggerEl.isConnected) triggerEl.focus(); };
    birak = katmanAc(close);
    modal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    modal.querySelector('[data-action="cancel"]').addEventListener("click", close);
    modal.addEventListener("keydown", (e) => trapTabKey(e, modal));
    modal.querySelector('[data-action="save"]').addEventListener("click", () => {
      const m = ta.value.trim();
      if (!m) { ta.focus(); return; }
      const q = getQueue();
      q.push(Object.assign({ id: yeniId(), type: "soru", url: location.pathname, lang: (I18n() && I18n().getLang && I18n().getLang()) || "tr", timestamp: new Date().toISOString(), note: m, secili_metin: secili, heading: secili ? "" : document.title }, adres));
      if (setQueue(q)) uyari(ui({ tr: "Soru kuyruğa eklendi.", en: "Question added to the queue.", pt: "Pergunta adicionada à fila." }), "bilgi");
      close();
    });
  }

  // V9: dikte (cihazın konuşma tanıması varsa): metin kutusunun yanında 🎤.
  function diktePanel(ta) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !ta || ta.dataset.dikte) return;
    ta.dataset.dikte = "1";
    const b = document.createElement("button");
    b.type = "button"; b.className = "dost-dikte";
    const ad = ui({ tr: "Sesle yaz", en: "Dictate", pt: "Ditar" });
    b.textContent = "🎤"; b.title = ad; b.setAttribute("aria-label", ad); b.setAttribute("aria-pressed", "false");
    ta.insertAdjacentElement("afterend", b);
    let rec = null;
    b.addEventListener("click", () => {
      if (rec) { try { rec.stop(); } catch (e) {} return; }
      rec = new SR();
      rec.lang = ({ tr: "tr-TR", en: "en-US", pt: "pt-BR" })[(I18n() && I18n().getLang && I18n().getLang()) || "tr"] || "tr-TR";
      rec.interimResults = false; rec.continuous = true;
      rec.onresult = (ev) => {
        let m = ""; for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) m += ev.results[i][0].transcript;
        if (m) { ta.value = (ta.value ? ta.value.replace(/\s*$/, " ") : "") + m.trim(); ta.dispatchEvent(new Event("input", { bubbles: true })); }
      };
      rec.onend = () => { rec = null; b.setAttribute("aria-pressed", "false"); };
      rec.onerror = () => { rec = null; b.setAttribute("aria-pressed", "false"); };
      try { rec.start(); b.setAttribute("aria-pressed", "true"); } catch (e) { rec = null; }
    });
  }

  // base64url yardımcıları (eşitleme şifrelemesi kullanır).
  function b64uYaz(bayt) { let s = ""; for (let i = 0; i < bayt.length; i++) s += String.fromCharCode(bayt[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function b64uOku(str) { let s = str.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  // Cihazlar arası eşitleme (2026-10-31, kullanıcı kararı: "hangi cihazdan girersem gireyim aynı notlara
  // ulaşabilmeliyim"; kuyruk kodu kaldırıldı; aynı gün GitHub anahtarı yöntemi bırakıldı: "bu anahtar girme
  // işlemini her cihazda yapmak istemiyorum" → Cloudflare Worker). Kuyruğun görüntüsüz kayıtları AES-GCM ile
  // şifrelenip kullanıcının kendi Worker'ına (workers/revise-esitle/, Cloudflare KV) yazılır. Şifre ve kayıt
  // adresi tek bir "üst sır"dan türer: Daphne kapısının cihazda sakladığı anahtar (aynı parola → her cihazda aynı
  // 256 bit) ya da bu cihazda bir kez yazılan Daphne parolası. Worker şifreli metni görür, anahtar tarafında
  // GitHub anahtarı yoktur. Birleştirme kayıt kimliğine göre, son değişiklik kazanır; silinenler 90 gün "mezar
  // taşı" olarak taşınır. Görüntülü kayıtlar (resimli görsel not dahil) eşitlenmez (görüntü bu cihazda kalır); yalnız metinli görsel not eşitlenir.
  const ES_UCNOKTA = "https://wispy-credit-852c.hacimurat-karaman.workers.dev";   // Worker adresi (sınama için localStorage "dost-esitle-uc" üstüne yazar)
  const ES_UST = "dost-esitle-ust", ES_SON = "dost-esitle-son", ES_DAPHNE = "dost-daphne-anahtar";
  const ES_ESKI = ["dost-esitle-anahtar", "dost-esitle-parola", "dost-esitle-gist"];
  const ES_MEZAR = 90 * 864e5;
  let esMesgul = false, esTekrar = false, esZamanlayici = 0, esAralik = 0, esDurum = { tur: "kapali", metin: "" }, esDurumDinleyici = null;
  let esTurevOnbellek = null;
  function esUc() { try { return (localStorage.getItem("dost-esitle-uc") || ES_UCNOKTA).replace(/\/+$/, ""); } catch (e) { return ES_UCNOKTA; } }
  // Üst sır (standart base64): önce bu cihazda yazılmış olan, yoksa Daphne kapısının sakladığı anahtar.
  function esUstSir() {
    try { return localStorage.getItem(ES_UST) || sessionStorage.getItem(ES_DAPHNE) || localStorage.getItem(ES_DAPHNE) || ""; }
    catch (e) { return ""; }
  }
  const esAcik = () => !!(esUc() && esUstSir());
  const esStdOku = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const esStdYaz = (u) => { let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
  const esKayitMi = (e) => !!(e && typeof e === "object" && e.id && !e.gorsel && !e.image);   // görüntülü kayıt (resimli görsel not dahil) bu cihazda kalır
  function esSonOku() { try { return JSON.parse(localStorage.getItem(ES_SON) || "{}") || {}; } catch (e) { return {}; } }
  function esDurumYaz(tur, metin) { esDurum = { tur: tur, metin: metin || "" }; if (esDurumDinleyici) esDurumDinleyici(); }
  const esKanon = (m) => JSON.stringify(Object.keys(m).sort().map((k) => [k, m[k].ts, m[k].e == null ? null : JSON.stringify(m[k].e)]));

  // Saf birleştirme (testte doğrudan denenir): uzak = {id:{ts,e|null}}, yerel = kuyruk dizisi, son = {id:{ts,j|null}}.
  function esBirlestir(uzak, yerelListe, son, simdi) {
    const yerel = {}, y = {};
    yerelListe.filter(esKayitMi).forEach((e) => { yerel[e.id] = e; });
    Object.keys(yerel).forEach((id) => {
      const j = JSON.stringify(yerel[id]), s = son[id], u = uzak[id];
      let ts = simdi;
      if (s && s.j === j) ts = s.ts;
      else if (!s && u && u.e && JSON.stringify(u.e) === j) ts = u.ts;
      y[id] = { ts: ts, e: yerel[id] };
    });
    Object.keys(son).forEach((id) => {
      if (y[id]) return;
      y[id] = son[id].j === null ? { ts: son[id].ts, e: null } : { ts: simdi, e: null };
    });
    const birlesik = {};
    new Set(Object.keys(uzak).concat(Object.keys(y))).forEach((id) => {
      const u = uzak[id], l = y[id];
      const k = !u ? l : !l ? u : (l.ts >= u.ts ? l : u);
      if (k.e === null && simdi - k.ts > ES_MEZAR) return;
      birlesik[id] = { ts: k.ts, e: k.e === undefined ? null : k.e };
    });
    return birlesik;
  }

  // Üst sırdan iki türev: kayıt adresi (HMAC "id") ve şifre (HMAC "sifre" → AES-GCM). Aynı üst sır → her cihazda aynı.
  function esTurev(ust) {
    if (esTurevOnbellek && esTurevOnbellek.ust === ust) return esTurevOnbellek.s;
    const imza = (hmac, ad) => crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(ad));
    const s = crypto.subtle.importKey("raw", esStdOku(ust), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]).then((h) => Promise.all([imza(h, "dost-revise-id"), imza(h, "dost-revise-sifre")]))
      .then((p) => crypto.subtle.importKey("raw", p[1], { name: "AES-GCM" }, false, ["encrypt", "decrypt"]).then((key) => ({ id: b64uYaz(new Uint8Array(p[0])), key: key })));
    esTurevOnbellek = { ust: ust, s: s };
    return s;
  }
  function esSifrele(tv, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, tv.key, new TextEncoder().encode(JSON.stringify(obj)))
      .then((ct) => JSON.stringify({ v: 2, iv: b64uYaz(iv), ct: b64uYaz(new Uint8Array(ct)) }));
  }
  function esCoz(tv, metin) {
    let d; try { d = JSON.parse(metin); } catch (e) { return Promise.reject(new Error("biçim")); }
    if (!d || d.v !== 2 || !d.iv || !d.ct) return Promise.reject(new Error("biçim"));
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64uOku(d.iv) }, tv.key, b64uOku(d.ct))
      .then((b) => (JSON.parse(new TextDecoder().decode(b)) || {}).items || {}, () => { throw new Error("parola"); });
  }
  function esIstek(tv, yontem, govde) {
    const secenek = { method: yontem, cache: "no-store" };
    if (govde != null) { secenek.body = govde; secenek.headers = { "Content-Type": "application/json" }; }
    return fetch(esUc() + "/n/" + tv.id, secenek).then((r) => {
      if (r.status === 404 && yontem === "GET") return null;
      if (r.status === 403) throw new Error("yetki");
      if (!r.ok) throw new Error("http");
      return yontem === "GET" ? r.text() : "";
    }, () => { throw new Error("ağ"); });
  }
  // Birleşik sonucu bu cihazın kuyruğuna yazar (geri alma geçmişine girmez), imleri tazeler.
  function esYerelUygula(birlesik) {
    const q = getQueue(), digerleri = q.filter((e) => !esKayitMi(e)), yerelMap = {};
    q.filter(esKayitMi).forEach((e) => { yerelMap[e.id] = e; });
    const sirali = q.filter(esKayitMi).filter((e) => birlesik[e.id] && birlesik[e.id].e).map((e) => birlesik[e.id].e);
    const mevcut = new Set(sirali.map((e) => e.id));
    Object.keys(birlesik).filter((id) => birlesik[id].e && !mevcut.has(id)).sort((a, b) => birlesik[a].ts - birlesik[b].ts).forEach((id) => sirali.push(birlesik[id].e));
    const yeni = digerleri.concat(sirali);
    if (JSON.stringify(yeni) === JSON.stringify(q)) return;
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(yeni)); } catch (e) { return; }
    Object.keys(yerelMap).forEach((id) => { if (!(birlesik[id] && birlesik[id].e)) document.querySelectorAll("[data-dost-edit-id]").forEach((el) => { if (el.dataset.dostEditId === id) delete el.dataset.dostEditId; }); });
    updateBadge(); paketiTazele(); isaretleKuyruk();
  }
  function esHataMetni(h) {
    const k = h && h.message;
    if (k === "parola") return ui({ tr: "Bu cihazdaki parola, öteki cihazlarda kullandığınla eşleşmiyor.", en: "This device's passphrase does not match the one on your other devices.", pt: "A senha deste dispositivo não confere com a dos seus outros dispositivos." });
    if (k === "ağ") return ui({ tr: "Ağa ulaşılamadı; bağlantı gelince yeniden denenir.", en: "Could not reach the network; will retry when back online.", pt: "Sem conexão; tentaremos de novo quando voltar." });
    if (k === "yetki") return ui({ tr: "Eşitleme sunucusu isteği reddetti.", en: "The sync server refused the request.", pt: "O servidor de sincronização recusou a solicitação." });
    return ui({ tr: "Eşitlenemedi.", en: "Could not sync.", pt: "Não foi possível sincronizar." });
  }
  function esEsitle() {
    if (!esAcik()) { esDurumYaz("kapali"); return Promise.resolve(); }
    if (esMesgul) { esTekrar = true; return Promise.resolve(); }
    if (!window.crypto || !crypto.subtle) { esDurumYaz("hata", ui({ tr: "Bu tarayıcı şifrelemeyi desteklemiyor (güvenli bağlantı gerekir).", en: "This browser lacks encryption support (needs a secure connection).", pt: "Este navegador não tem suporte a criptografia (requer conexão segura)." })); return Promise.resolve(); }
    esMesgul = true; esDurumYaz("bekle");
    return esTurev(esUstSir()).then((tv) => esIstek(tv, "GET").then((metin) => (metin ? esCoz(tv, metin) : Promise.resolve({})).then((uzak) => {
      const birlesik = esBirlestir(uzak, getQueue(), esSonOku(), Date.now());
      esYerelUygula(birlesik);
      const yaz = metin === null || esKanon(birlesik) !== esKanon(uzak);
      return (yaz ? esSifrele(tv, { items: birlesik }).then((govde) => esIstek(tv, "PUT", govde)) : Promise.resolve()).then(() => {
        const son = {}; Object.keys(birlesik).forEach((k) => { son[k] = { ts: birlesik[k].ts, j: birlesik[k].e ? JSON.stringify(birlesik[k].e) : null }; });
        try { localStorage.setItem(ES_SON, JSON.stringify(son)); } catch (e) {}
        esDurumYaz("tamam", new Date().toLocaleTimeString() + " · " + Object.keys(birlesik).filter((k) => birlesik[k].e).length + " " + ui({ tr: "kayıt", en: "items", pt: "itens" }));
      });
    }))).catch((h) => esDurumYaz("hata", esHataMetni(h))).then(() => { esMesgul = false; if (esTekrar) { esTekrar = false; esIste(); } });
  }
  // Değişiklikten sonra kısa bir gecikmeyle eşitle (peş peşe yazımlar tek istek olur).
  function esIste() {
    if (!esAcik()) return;
    clearTimeout(esZamanlayici);
    esZamanlayici = setTimeout(esEsitle, 2500);
  }
  function esBaslat() {
    ES_ESKI.forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });   // GitHub anahtarı yönteminden kalanlar
    if (!esAcik()) return;
    esEsitle();
    clearInterval(esAralik);
    esAralik = setInterval(() => { if (editModeOn && document.visibilityState === "visible") esEsitle(); }, 60000);
  }
  function esDurdur() { clearInterval(esAralik); clearTimeout(esZamanlayici); }
  document.addEventListener("visibilitychange", () => { if (editModeOn && document.visibilityState === "visible") esEsitle(); });

  // Daphne parolasından üst sır: kapının kendi türetmesiyle aynı (manifest tuzu + tur), doğrulama bloğuyla sınanır.
  // Manifest yoksa (özel repo/geliştirme) sabit tuzla türetilir.
  function esParoladanUst(parola) {
    const enc = new TextEncoder();
    const turet = (tuz, tur) => crypto.subtle.importKey("raw", enc.encode(parola), "PBKDF2", false, ["deriveBits"])
      .then((t) => crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: tuz, iterations: tur }, t, 256)).then((b) => new Uint8Array(b));
    return fetch((window.__dostRouteBase || "") + "/data/gizli/manifest.json", { cache: "no-cache" }).then((r) => r.ok ? r.json() : null, () => null).then((m) => {
      if (!m) return turet(enc.encode("dost-revise-esitle-v1"), 200000);
      return turet(esStdOku(m.tuz), m.tur).then((raw) => {
        const ham = esStdOku(m.dogrula);
        return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"])
          .then((k) => crypto.subtle.decrypt({ name: "AES-GCM", iv: ham.slice(0, 12), additionalData: enc.encode("dogrula") }, k, ham.slice(12)))
          .then((d) => { if (new TextDecoder().decode(d) !== "dost-daphne-v1") throw new Error("parola"); return raw; }, () => { throw new Error("parola"); });
      });
    });
  }

  function esitleAc(triggerEl) {
    const modal = document.createElement("div");
    modal.className = "dost-shot-modal";
    const hazir = !!esUstSir();
    modal.innerHTML = '<div class="dost-shot-modal__backdrop"></div><div class="dost-shot-modal__card" role="dialog" aria-modal="true">' +
      '<p class="dost-shot-modal__label">' + escapeHtml(ui({ tr: "Cihazlar arası eşitleme", en: "Sync between devices", pt: "Sincronização entre dispositivos" })) + "</p>" +
      '<p class="dost-bd__bilgi">' + escapeHtml(ui({
        tr: "Notların parolanla şifrelenip kendi eşitleme sunucuna yazılır; aynı parolayı kullanan her cihazda aynı notlar görünür. Daphne'yi bu cihazda açtıysan ek bir şey gerekmez. Görüntülü kayıtlar bu cihazda kalır, eşitlenmez.",
        en: "Your notes are encrypted with your passphrase and stored on your own sync server; every device using the same passphrase shows the same notes. If Daphne is unlocked on this device, nothing more is needed. Items with images stay on this device and are not synced.",
        pt: "Suas notas são criptografadas com sua senha e salvas no seu próprio servidor de sincronização; todo dispositivo com a mesma senha mostra as mesmas notas. Se o Daphne estiver desbloqueado neste dispositivo, não é preciso mais nada. Itens com imagens ficam neste dispositivo e não são sincronizados.",
      })) + "</p>" +
      (hazir ? "" : '<label class="dost-bd__bilgi">' + escapeHtml(ui({ tr: "Daphne parolası (bu cihazda bir kez)", en: "Daphne passphrase (once on this device)", pt: "Senha do Daphne (uma vez neste dispositivo)" })) + '<input type="password" class="dost-shot-modal__note" data-alan="parola" autocomplete="off" spellcheck="false"></label>') +
      '<p class="dost-bd__durum" role="status"></p>' +
      '<div class="dost-shot-modal__actions"><button type="button" data-action="cancel">' + escapeHtml(ui({ tr: "Kapat", en: "Close", pt: "Fechar" })) + "</button>" +
      '<button type="button" data-action="kaldir">' + escapeHtml(ui({ tr: "Bağlantıyı kaldır", en: "Disconnect", pt: "Desconectar" })) + "</button>" +
      '<button type="button" data-action="kaydet" class="dost-shot-modal__save">' + escapeHtml(ui({ tr: "Eşitle", en: "Sync", pt: "Sincronizar" })) + "</button></div></div>";
    document.body.appendChild(modal);
    const parola = modal.querySelector('[data-alan="parola"]'), durum = modal.querySelector(".dost-bd__durum");
    const yaz = () => {
      const ad = { kapali: esUc() ? ui({ tr: "Bu cihazda eşitleme kapalı.", en: "Sync is off on this device.", pt: "Sincronização desativada neste dispositivo." }) : ui({ tr: "Eşitleme sunucusu henüz kurulmadı.", en: "The sync server is not set up yet.", pt: "O servidor de sincronização ainda não foi configurado." }), bekle: ui({ tr: "Eşitleniyor…", en: "Syncing…", pt: "Sincronizando…" }) };
      durum.textContent = esDurum.tur === "tamam" ? ui({ tr: "Eşitlendi (", en: "Synced (", pt: "Sincronizado (" }) + esDurum.metin + ")" : esDurum.tur === "hata" ? esDurum.metin : ad[esDurum.tur];
    };
    esDurumDinleyici = yaz; yaz();
    let birak = null;
    const close = () => { esDurumDinleyici = null; if (birak) birak(); modal.remove(); if (triggerEl && triggerEl.isConnected) triggerEl.focus(); };
    birak = katmanAc(close);
    modal.querySelector(".dost-shot-modal__backdrop").addEventListener("click", close);
    modal.querySelector('[data-action="cancel"]').addEventListener("click", close);
    modal.addEventListener("keydown", (e) => trapTabKey(e, modal));
    modal.querySelector('[data-action="kaydet"]').addEventListener("click", () => {
      if (!esUc()) { yaz(); return; }
      if (esUstSir()) { esBaslat(); return; }
      const p = parola ? parola.value : "";
      if (!p) { durum.textContent = ui({ tr: "Parolayı yaz.", en: "Enter the passphrase.", pt: "Informe a senha." }); return; }
      durum.textContent = ui({ tr: "Parola doğrulanıyor…", en: "Checking the passphrase…", pt: "Verificando a senha…" });
      esParoladanUst(p).then((raw) => {
        try { localStorage.setItem(ES_UST, esStdYaz(raw)); } catch (e) { throw new Error("depo"); }
        esBaslat();
      }).catch((h) => { durum.textContent = h && h.message === "depo" ? ui({ tr: "Bu tarayıcıda depolama kapalı.", en: "Storage is blocked in this browser.", pt: "O armazenamento está bloqueado neste navegador." }) : esHataMetni(h); });
    });
    modal.querySelector('[data-action="kaldir"]').addEventListener("click", () => {
      [ES_UST, ES_SON].forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });
      esDurdur(); esDurumYaz("kapali"); if (parola) parola.value = "";
    });
  }
  window.__dostEsitle = { birlestir: esBirlestir, esitle: esEsitle };

  // V16: "uygulandı" bildirimi: scripts/duzenleme-uygula.py --apply, uygulanan kayıtların kimliklerini data/duzeltme-uygulandi.json'a yazar.
  function uygulandiKontrol() {
    const q0 = getQueue();
    if (!q0.length) return;
    fetch(new URL("data/duzeltme-uygulandi.json", document.baseURI).href, { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d || !Array.isArray(d.idler)) return;
      const var_ = new Set(d.idler);
      const q = getQueue(), kalan = q.filter((e) => !var_.has(e.id));
      const n = q.length - kalan.length;
      if (!n) return;
      q.filter((e) => var_.has(e.id)).forEach((e) => { if (e.gorsel) gorselSil(e.gorsel).catch(() => {}); });
      try { localStorage.setItem(QUEUE_KEY, JSON.stringify(kalan)); } catch (e) { return; }
      document.querySelectorAll("[data-dost-edit-id]").forEach((el) => { if (var_.has(el.dataset.dostEditId)) delete el.dataset.dostEditId; });
      updateBadge(); paketiTazele(); isaretleKuyruk(); esIste();
      uyari(ui({ tr: n + " düzeltmen/notun uygulandı; kuyruktan çıkarıldı.", en: n + " of your edits/notes were applied; removed from the queue.", pt: n + " das suas edições/notas foram aplicadas; removidas da fila." }), "bilgi");
    }).catch(() => {});
  }
  // V8: ağ geri gelince kuyruk hazır uyarısı.
  window.addEventListener("online", () => {
    if (!editModeOn) return;
    const n = getQueue().length;
    if (n) uyari(ui({ tr: "Bağlantı geri geldi; " + n + " kayıt gönderilmeye hazır.", en: "Back online; " + n + " item(s) ready to send.", pt: "De volta online; " + n + " item(ns) pronto(s) para enviar." }), "bilgi");
  });

  // --- panel ---------------------------------------------------------------
  // "Nasıl kullanılır?" (2026-10-31): açılır, dört adımda akış. Menü açıldığında kapalı gelir.
  function nasilKullanilir() {
    const adim = (d) => "<li>" + escapeHtml(ui(d)) + "</li>";
    return '<details class="dost-edit-panel__nasil"><summary>' + escapeHtml(ui({ tr: "❔ Nasıl kullanılır?", en: "❔ How does this work?", pt: "❔ Como usar?" })) + "</summary><ol>" +
      adim({ tr: "Düzeltmek istediğin düz yazıya dokun ve metni değiştir. Her değişiklik bu cihazdaki bir kuyruğa yazılır; sitede hiçbir şey kendiliğinden değişmez. ✎ üzerindeki sayı bekleyen kayıt adedidir.", en: "Tap the prose you want to fix and change the text. Each change is written to a queue on this device; nothing on the site changes by itself. The number on ✎ is how many items are waiting.", pt: "Toque no texto que quer corrigir e altere-o. Cada mudança vai para uma fila neste dispositivo; nada muda sozinho no site. O número em ✎ é a quantidade de itens aguardando." }) +
      adim({ tr: "Resim ya da fikir eklemek istersen Görsel Not, Kendi Notum ya da Claude'a soru kullan; bunlar da aynı kuyruğa girer.", en: "To add an image or an idea, use Visual Note, My Own Note or Ask Claude; they go into the same queue.", pt: "Para adicionar uma imagem ou ideia, use Nota Visual, A Minha Nota ou Perguntar ao Claude; entram na mesma fila." }) +
      adim({ tr: "Bitirince “Claude'a gönder” (bilgisayarda: JSON indir) ile kuyruğu yolla. Claude düzeltmeleri uygular ve sana bildirir.", en: "When you are done, send the queue with “Send to Claude” (on a computer: download the JSON). Claude applies the edits and tells you.", pt: "Ao terminar, envie a fila com “Enviar ao Claude” (no computador: baixar o JSON). O Claude aplica as edições e avisa você." }) +
      adim({ tr: "Gönderdikten sonra Temizle ile kuyruğu boşalt. Notların başka cihazda da görünsün istersen Cihazlar arası eşitleme'yi aç.", en: "After sending, empty the queue with Clear. To see your notes on other devices too, turn on Sync between devices.", pt: "Depois de enviar, esvazie a fila com Limpar. Para ver suas notas em outros dispositivos, ative a Sincronização entre dispositivos." }) +
      "</ol></details>";
  }
  function buildPanel() {
    panel = document.createElement("div");
    panel.className = "dost-edit-panel";
    // Açıklamalı düğme (2026-10-31, kullanıcı isteği: "seçenekleri nasıl kullanacağımı bilmiyorum"): etiketin altında tek cümlelik ne yaptığı.
    const b = (action, d, acik) => `<button type="button" data-action="${action}"${acik ? ` title="${escapeHtml(ui(acik))}"` : ""}>${escapeHtml(ui(d))}${acik ? `<small class="dost-edit-panel__aciklama">${escapeHtml(ui(acik))}</small>` : ""}</button>`;
    panel.innerHTML =
      '<button type="button" class="dost-edit-panel__toggle" aria-expanded="false" aria-label="' +
      escapeHtml(ui({ tr: "Düzenleme paneli", en: "Edit panel", pt: "Painel de edição" })) + '">' +
      '<span class="dost-edit-panel__icon">✎</span>' +
      '<span class="dost-edit-panel__count">' + getQueue().length + "</span>" +
      "</button>" +
      '<div class="dost-edit-panel__menu" hidden>' +
      '<button type="button" class="dost-edit-panel__kompakt" data-action="kompakt" aria-pressed="false"></button>' +
      '<p class="dost-edit-panel__hint">' + escapeHtml(ui({
        tr: "Düzenleme modu açık — düz yazı metinlere dokunup değiştirebilir, bu sayfa için görsel not ya da kendi notunu bırakabilirsin.",
        en: "Edit mode is on — tap prose to change it, or leave a visual note or your own note.",
        pt: "Modo de edição ativo — toque no texto para alterá-lo, ou deixe uma nota visual ou a sua própria nota.",
      })) + "</p>" +
      '<p class="dost-edit-panel__hint dost-edit-panel__sayfa" role="status"></p>' +
      nasilKullanilir() +
      b("visual-note", { tr: "🖌️ Bu Sayfa İçin Görsel Not", en: "🖌️ Visual Note for This Page", pt: "🖌️ Nota Visual para Esta Página" }, { tr: "Ekran görüntüsü ya da resim ekleyip yazılı not bırakırsın; bir şeyin nasıl görünmesi gerektiğini göstermek için.", en: "Attach a screenshot or image and write a note, to show how something should look.", pt: "Anexe uma captura ou imagem e escreva uma nota, para mostrar como algo deve ficar." }) +
      b("own-note", { tr: "✍️ Kendi Notum", en: "✍️ My Own Note", pt: "✍️ A Minha Nota" }, { tr: "Kendi düşünceni yazarsın: bir Daphne yazısına kenar notu, Gönül Defteri için ham not ya da (Yan Yana'da) makale taslağı. Doğrudan yayına çıkmaz; birlikte gözden geçirilir.", en: "Write your own thoughts: a margin note on a Daphne piece or a raw note for the Heart Notebook. It does not go live directly; we review it together.", pt: "Escreva as suas ideias: uma nota à margem de um texto da Daphne ou uma nota bruta para o Caderno do Coração. Não é publicada diretamente; revisamos juntos." }) +
      b("notes", { tr: "📋 Kayıtlı Notlar", en: "📋 Saved Notes", pt: "📋 Notas Guardadas" }, { tr: "Şimdiye kadar bu cihazda kuyruğa aldığın düzeltme ve notları listeler; tek tek düzeltir ya da silersin.", en: "Lists the edits and notes you have queued on this device; edit or delete them one by one.", pt: "Lista as edições e notas que você colocou na fila neste dispositivo; edite ou apague uma a uma." }) +
      b("bulde", { tr: "🔎 Bul ve değiştir", en: "🔎 Find and replace", pt: "🔎 Localizar e substituir" }, { tr: "Bu sayfadaki metinlerde bir sözcüğü bulup yerine başkasını yazar; her değişiklik ayrı bir düzeltme olarak kuyruğa girer.", en: "Finds a word in this page's text and replaces it; each change is queued as a separate edit.", pt: "Localiza uma palavra nos textos desta página e a substitui; cada mudança entra na fila como uma edição separada." }) +
      '<div class="dost-edit-panel__cift">' + b("bold", { tr: "B Kalın", en: "B Bold", pt: "B Negrito" }) + b("italic", { tr: "I İtalik", en: "I Italic", pt: "I Itálico" }) + "</div>" +
      '<p class="dost-edit-panel__hint dost-edit-panel__ipucu">' + escapeHtml(ui({ tr: "Kalın ve İtalik: metni seç, sonra bu düğmeye bas; seçili kısım biçimlenir ve düzeltme olarak kaydedilir.", en: "Bold and Italic: select the text, then tap the button; the selection is formatted and saved as an edit.", pt: "Negrito e Itálico: selecione o texto e toque no botão; a seleção é formatada e salva como edição." })) + "</p>" +
      '<button type="button" data-action="preview" title="' + escapeHtml(ui({ tr: "Düzeltmelerin sayfada nasıl görüneceğini dener: kapalı, SONRA (uygulanmış) ve ÖNCE (eski metin) arasında dönersin.", en: "Tries out how the edits will look on the page: cycle between off, AFTER (applied) and BEFORE (old text).", pt: "Mostra como as edições ficarão na página: alterna entre desligada, DEPOIS (aplicado) e ANTES (texto antigo)." })) + '">' + escapeHtml(onizlemeEtiketi()) + '<small class="dost-edit-panel__aciklama">' + escapeHtml(ui({ tr: "Her dokunuşta değişir: kapalı → SONRA (uygulanmış) → ÖNCE (eski metin).", en: "Changes with each tap: off → AFTER (applied) → BEFORE (old text).", pt: "Muda a cada toque: desligada → DEPOIS (aplicado) → ANTES (texto antigo)." })) + "</small></button>" +
      b("ask", { tr: "❓ Claude'a soru", en: "❓ Ask Claude", pt: "❓ Perguntar ao Claude" }, { tr: "Seçtiğin metin hakkında soru yazarsın (kaynakla uyuşuyor mu, bu terim nerede geçiyor…). Soru kuyruğa girer, cevap sonra gelir.", en: "Write a question about the selected text (does it match the source, where does this term occur…). It is queued; the answer comes later.", pt: "Escreva uma pergunta sobre o texto selecionado (confere com a fonte, onde este termo aparece…). Entra na fila; a resposta vem depois." }) +
      '<div class="dost-edit-panel__cift">' + b("undo", { tr: "↶ Geri al", en: "↶ Undo", pt: "↶ Desfazer" }) + b("redo", { tr: "↷ Yinele", en: "↷ Redo", pt: "↷ Refazer" }) + "</div>" +
      '<p class="dost-edit-panel__hint dost-edit-panel__ipucu">' + escapeHtml(ui({ tr: "Geri al ve Yinele: kuyruktaki son düzeltmeyi geri alır ya da yeniden uygular.", en: "Undo and Redo: take back or reapply the last queued edit.", pt: "Desfazer e Refazer: desfaz ou reaplica a última edição da fila." })) + "</p>" +
      // Gönder + indir tek düğme (2026-10-29: ikisi aynı işi yapıyordu). Telefonda paylaşım
      // sayfası, bilgisayarda JSON dosyası iner; etiket neyin olacağını söyler. Pano
      // yalnız görüntüsüz, hızlı yapıştırma içindir -- ayrı bir iş.
      b("send", paylasimDesteklenir()
        ? { tr: "📤 Claude'a gönder", en: "📤 Send to Claude", pt: "📤 Enviar ao Claude" }
        : { tr: "⬇ JSON dosyası olarak indir", en: "⬇ Download as JSON file", pt: "⬇ Baixar como arquivo JSON" },
        paylasimDesteklenir()
          ? { tr: "Kuyruktaki her şeyi (resimler dahil) paylaşım sayfasıyla Claude'a yollar. Düzeltmeleri uygulatmanın asıl yolu budur.", en: "Sends everything in the queue (images included) to Claude via the share sheet. This is the main way to get edits applied.", pt: "Envia tudo da fila (imagens incluídas) ao Claude pela folha de compartilhamento. É o caminho principal para aplicar as edições." }
          : { tr: "Kuyruktaki her şeyi tek bir JSON dosyası olarak indirir; dosyayı Claude'a verirsin. Düzeltmeleri uygulatmanın asıl yolu budur.", en: "Downloads everything in the queue as one JSON file that you hand to Claude. This is the main way to get edits applied.", pt: "Baixa tudo da fila como um arquivo JSON que você entrega ao Claude. É o caminho principal para aplicar as edições." }) +
      b("copy", { tr: "📋 Panoya kopyala (görüntüsüz)", en: "📋 Copy to clipboard (no images)", pt: "📋 Copiar (sem imagens)" }, { tr: "Kuyruğu yalnız metin olarak panoya alır (resimler girmez); sohbete hızlıca yapıştırmak için.", en: "Copies the queue as text only (no images), for quickly pasting into a chat.", pt: "Copia a fila só como texto (sem imagens), para colar rápido numa conversa." }) +
      b("md", { tr: "📝 Okunur özet (Markdown)", en: "📝 Readable summary (Markdown)", pt: "📝 Resumo legível (Markdown)" }, { tr: "Kuyruğu insan okuyabilsin diye düzenli bir listeye çevirip panoya kopyalar; göndermeden önce kendin gözden geçirmek için.", en: "Turns the queue into a tidy readable list and copies it, so you can review it yourself before sending.", pt: "Transforma a fila numa lista legível e a copia, para você revisar antes de enviar." }) +
      b("esitle", { tr: "☁ Cihazlar arası eşitleme", en: "☁ Sync between devices", pt: "☁ Sincronização entre dispositivos" }, { tr: "Notların şifreli olarak kendi eşitleme sunucuna yazılır; her cihazda aynı notlar görünür.", en: "Your notes are saved encrypted to your own sync server; every device shows the same notes.", pt: "Suas notas são salvas criptografadas no seu próprio servidor de sincronização; todos os dispositivos mostram as mesmas notas." }) +
      b("issue", { tr: "↗ GitHub'da issue aç", en: "↗ Open a GitHub issue", pt: "↗ Abrir issue no GitHub" }, { tr: "Kuyruğun özetiyle GitHub'da hazır bir issue sayfası açar; çoğu zaman “Claude'a gönder” yeterlidir.", en: "Opens a ready-made GitHub issue page with the queue summary; “Send to Claude” is usually enough.", pt: "Abre uma página de issue do GitHub já preenchida com o resumo da fila; “Enviar ao Claude” costuma bastar." }) +
      b("clear", { tr: "Temizle", en: "Clear", pt: "Limpar" }, { tr: "Bekleyen bütün düzeltme ve notları siler (önce sorar). Gönderilmemiş bir şey varsa önce gönder.", en: "Deletes all pending edits and notes (asks first). Send anything unsent before clearing.", pt: "Apaga todas as edições e notas pendentes (pergunta antes). Envie o que ainda não foi enviado antes de limpar." }) +
      b("minimize", { tr: "Küçült ↑", en: "Minimise ↑", pt: "Minimizar ↑" }, { tr: "Menüyü kapatır; düzenleme modu açık kalır, yalnız ✎ düğmesi görünür.", en: "Closes the menu; edit mode stays on, only the ✎ button remains.", pt: "Fecha o menu; o modo de edição continua ativo, só o botão ✎ permanece." }) +
      b("exit", { tr: "Düzenleme Modunu Kapat", en: "Close Edit Mode", pt: "Fechar Modo de Edição" }, { tr: "Düzenlemeyi bitirir ve sayfayı normal okuma görünümüne döndürür. Kuyruktakiler silinmez.", en: "Ends editing and returns the page to normal reading. Queued items are kept.", pt: "Encerra a edição e volta a página à leitura normal. Os itens da fila são mantidos." }) +
      "</div>";
    document.body.appendChild(panel);
    const toggle = panel.querySelector(".dost-edit-panel__toggle");
    const menu = panel.querySelector(".dost-edit-panel__menu");
    let menuBirak = null;
    function menuAyarla(acik) {
      menu.hidden = !acik;
      toggle.setAttribute("aria-expanded", acik ? "true" : "false");
      if (acik && !menuBirak) { menuBirak = katmanAc(() => menuAyarla(false)); paketiTazele(); }
      if (!acik && menuBirak) { menuBirak(); menuBirak = null; }
    }
    // Sürükle-ya-da-dokun: pointer olaylarıyla (fare, dokunma, kalem).
    // Önceden yalnız mousedown/mousemove dinleniyordu; telefonda panel hiç
    // taşınamıyordu.
    let sx = 0, sy = 0, pl = 0, pb = 0, suruklendi = false, aktif = null;
    toggle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      aktif = e.pointerId;
      sx = e.clientX; sy = e.clientY; suruklendi = false;
      const r = panel.getBoundingClientRect();
      pl = r.left; pb = window.innerHeight - r.bottom;
      try { toggle.setPointerCapture(e.pointerId); } catch (err) {}
    });
    toggle.addEventListener("pointermove", (e) => {
      if (aktif !== e.pointerId) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!suruklendi && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (!suruklendi) { suruklendi = true; panel.style.right = "auto"; panel.style.top = "auto"; }
      const r = panel.getBoundingClientRect();
      panel.style.left = Math.max(0, Math.min(window.innerWidth - r.width, pl + dx)) + "px";
      panel.style.bottom = Math.max(0, Math.min(window.innerHeight - r.height, pb - dy)) + "px";
    });
    const birakIsaret = (e) => {
      if (aktif !== e.pointerId) return;
      aktif = null;
      if (e.type === "pointerup" && !suruklendi) menuAyarla(menu.hidden);
    };
    toggle.addEventListener("pointerup", birakIsaret);
    toggle.addEventListener("pointercancel", birakIsaret);
    // Klavye (Enter/Boşluk) "click" üretir ama pointerdown üretmez:
    // detail === 0 klavye kaynaklı tıklamayı ayırt ediyor.
    toggle.addEventListener("click", (e) => { if (e.detail === 0) menuAyarla(menu.hidden); });
    panel.querySelector('[data-action="visual-note"]').addEventListener("click", () => { menuAyarla(false); buildVisualNoteModal(toggle); });
    panel.querySelector('[data-action="notes"]').addEventListener("click", () => { menuAyarla(false); openNoteList(toggle); });
    // Kompakt görünüm (2026-11-02, kullanıcı notu: "açılan kısım ekrana sığmıyor"): açıklamalar ve ipuçları gizlenir; seçim cihazda kalır.
    (function () {
      const menu = panel.querySelector(".dost-edit-panel__menu");
      const dugme = panel.querySelector('[data-action="kompakt"]');
      let k = false;
      try { k = localStorage.getItem("dost-revise-kompakt") === "1"; } catch (e) { /* depolama yok */ }
      const yaz = () => {
        menu.classList.toggle("dost-edit-panel__menu--kompakt", k);
        dugme.setAttribute("aria-pressed", k ? "true" : "false");
        dugme.textContent = k ? ui({ tr: "☰ Açıklamaları göster", en: "☰ Show descriptions", pt: "☰ Mostrar descrições" }) : ui({ tr: "☰ Açıklamaları gizle (kompakt)", en: "☰ Hide descriptions (compact)", pt: "☰ Ocultar descrições (compacto)" });
      };
      yaz();
      dugme.addEventListener("click", () => { k = !k; try { localStorage.setItem("dost-revise-kompakt", k ? "1" : "0"); } catch (e) { /* depolama yok */ } yaz(); });
    })();
    panel.querySelector('[data-action="own-note"]').addEventListener("click", () => { menuAyarla(false); buildKendiNotModal(toggle); });
    panel.querySelector('[data-action="bulde"]').addEventListener("click", () => { menuAyarla(false); bulDegistirAc(toggle); });
    panel.querySelector('[data-action="preview"]').addEventListener("click", (ev) => onizlemeDegistir(ev.currentTarget));
    panel.querySelector('[data-action="ask"]').addEventListener("click", () => { menuAyarla(false); soruAc(toggle); });
    ["bold", "italic"].forEach((k) => {
      const dugme = panel.querySelector('[data-action="' + k + '"]');
      dugme.addEventListener("pointerdown", (ev) => ev.preventDefault());   // seçim düğmeye basınca silinmesin
      dugme.addEventListener("click", () => bicimUygula(k === "bold" ? "strong" : "em"));
    });
    panel.querySelector('[data-action="undo"]').addEventListener("click", kuyrukGeriAl);
    panel.querySelector('[data-action="redo"]').addEventListener("click", kuyrukYinele);
    panel.querySelector('[data-action="md"]').addEventListener("click", () => metniKopyala(markdownOzet(), () => uyari(ui({ tr: "Okunur özet panoya kopyalandı.", en: "Readable summary copied.", pt: "Resumo legível copiado." }), "bilgi")));
    panel.querySelector('[data-action="esitle"]').addEventListener("click", () => { menuAyarla(false); esitleAc(toggle); });
    panel.querySelector('[data-action="issue"]').addEventListener("click", issueAc);
    panel.querySelector('[data-action="send"]').addEventListener("click", claudeaGonder);
    panel.querySelector('[data-action="copy"]').addEventListener("click", kopyala);
    panel.querySelector('[data-action="clear"]').addEventListener("click", clearQueue);
    panel.querySelector('[data-action="minimize"]').addEventListener("click", () => menuAyarla(false));
    panel.querySelector('[data-action="exit"]').addEventListener("click", () => { menuAyarla(false); disableEditMode(); });
    paketiTazele();
  }

  let scanDebounce = null;
  function debouncedScan() {
    clearTimeout(scanDebounce);
    scanDebounce = setTimeout(scanAndMakeEditable, 150);
  }

  function kipYayinla() {
    try { localStorage.setItem(MODE_KEY, editModeOn ? "1" : "0"); } catch (e) {}
    document.dispatchEvent(new CustomEvent("dost-revise-kip", { detail: { acik: editModeOn } }));
  }

  // Açıp kapamak artık sayfayı YENİLEMİYOR (hata 6). Yenilemenin tek
  // sebebi `analogy` alanlarının görünürlük bayrağıydı; o alan 2026-10-05
  // ayıklamasında kaldırıldı, bayrak da (dost-analogy-visible,
  // window.DostAnalogy) onunla birlikte gitti. Kip açık kaldığı sürece
  // sayfadan sayfaya taşınması için MODE_KEY duruyor.
  function enableEditMode() {
    if (editModeOn) return;
    editModeOn = true;
    document.body.classList.add("dost-edit-mode");
    scanAndMakeEditable();
    observer = new MutationObserver(debouncedScan);
    observer.observe(document.body, { childList: true, subtree: true });
    buildPanel();
    eskiGorselleriTasi();
    isaretleKuyruk();
    uygulandiKontrol();
    esBaslat();
    kipYayinla();
  }

  function disableEditMode() {
    if (!editModeOn) return;
    editModeOn = false;
    esDurdur();
    if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();
    if (onizlemeKip) { onizlemeKip = 0; onizlemeUygula(); }
    document.querySelectorAll("[data-dost-kuyrukta]").forEach((el) => el.removeAttribute("data-dost-kuyrukta"));
    document.body.classList.remove("dost-edit-mode");
    document.querySelectorAll("[data-dost-editable]").forEach((el) => {
      el.removeAttribute("contenteditable");
      delete el.dataset.dostEditable;
    });
    if (observer) { observer.disconnect(); observer = null; }
    if (panel) { panel.remove(); panel = null; }
    kipYayinla();
  }
  function kipDegistir() { if (editModeOn) disableEditMode(); else enableEditMode(); }

  function hazir(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  // Kip açık bırakılmışsa sonraki sayfada da açık gelsin.
  try {
    if (localStorage.getItem(MODE_KEY) === "1") hazir(enableEditMode);
  } catch (e) {}

  // --- giriş yolları ------------------------------------------------------
  // view-loader.js (index.html) bu betiği @revise ilk yazıldığında ya da
  // #revise / uzun basmayla tembel indiriyor ve gizli kelimeyi KENDİSİ
  // yakalıyor; açma/kapama bu kapıdan (2026-10-09). compare.html'de
  // yükleyici yok -- orada aşağıdaki kendi dinleyicimiz çalışır.
  window.__dostEditMode = { toggle: kipDegistir, isOn: () => editModeOn };

  // 1) Klavye: "@revise".
  if (!window.__dostKipYukleyici) window.addEventListener("keydown", (e) => {
    if (e.key.length !== 1) return;
    // AltGr (Ctrl+Alt) Türkçe klavyede "@" üretiyor; bu bileşimi
    // engellemiyoruz. Tek başına Ctrl/Alt ya da Meta ise kısayoldur.
    if (e.metaKey) return;
    if ((e.ctrlKey || e.altKey) && !(e.ctrlKey && e.altKey)) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-CODE.length);
    if (buffer === CODE) { buffer = ""; kipDegistir(); }
  });

  // 2) Adres: "#revise". Yönlendirici (ontology.js) bir sonraki gezinmede
  // adresi yeniden yazdığı için hash'i ilk yüklemenin URL'sinden de
  // okuyoruz; kip açıldıktan sonra hash adresten temizlenir.
  function hashAc() {
    let h = location.hash;
    if (!/^#revise$/i.test(h)) {
      try {
        const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
        if (nav && /#revise$/i.test(nav.name) && !hashAc.kullanildi) h = "#revise";
      } catch (e) {}
    }
    if (!/^#revise$/i.test(h)) return;
    hashAc.kullanildi = true;
    enableEditMode();
    if (/^#revise$/i.test(location.hash)) {
      try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) {}
    }
  }
  hazir(hashAc);
  window.addEventListener("hashchange", hashAc);

  // 3) Uzun basma: üst çubuktaki ☰ düğmesi (ana uygulama) ya da başlık
  // (compare.html). 700 ms basılı tutmak kipi açar/kapatır; parmak
  // kayarsa iptal olur, ardından gelen "click" yutulur ki çekmece açılmasın.
  const UZUN_SECICI = "#nav-toggle, .app-header__title";
  const UZUN_MS = 700;
  let uzunZaman = null, uzunHedef = null, uzunX = 0, uzunY = 0, tikYut = false;
  document.addEventListener("pointerdown", (e) => {
    const h = e.target.closest && e.target.closest(UZUN_SECICI);
    if (!h || e.button !== 0) return;
    uzunHedef = h; uzunX = e.clientX; uzunY = e.clientY;
    clearTimeout(uzunZaman);
    uzunZaman = setTimeout(() => {
      uzunZaman = null;
      tikYut = true;
      setTimeout(() => { tikYut = false; }, 900);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) {} }
      kipDegistir();
      uyari(editModeOn
        ? ui({ tr: "@revise açık", en: "@revise on", pt: "@revise ativo" })
        : ui({ tr: "@revise kapalı", en: "@revise off", pt: "@revise desativado" }), "bilgi");
    }, UZUN_MS);
  }, true);
  const uzunIptal = () => { clearTimeout(uzunZaman); uzunZaman = null; uzunHedef = null; };
  document.addEventListener("pointermove", (e) => {
    if (!uzunZaman) return;
    if (Math.abs(e.clientX - uzunX) > 10 || Math.abs(e.clientY - uzunY) > 10) uzunIptal();
  }, true);
  document.addEventListener("pointerup", uzunIptal, true);
  document.addEventListener("pointercancel", uzunIptal, true);
  document.addEventListener("click", (e) => {
    if (!tikYut) return;
    if (e.target.closest && e.target.closest(UZUN_SECICI)) {
      tikYut = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest && e.target.closest(UZUN_SECICI)) e.preventDefault();
  });

  // Öteki @revise araçları için (durus-kontrol.js, tahkik-tarama.js) ve testler.
  window.__dostRevise = {
    acik: () => editModeOn,
    ac: enableEditMode,
    kapat: disableEditMode,
    kuyrugaEkle: kuyrugaEkle,
    kuyruk: getQueue,
    paket: () => gorselleriTopla().then((g) => paketKur(g)),
    temizHtml: htmlAl,
    adres: adresBul,
    uyari: uyari,
    geriAl: kuyrukGeriAl,
    yinele: kuyrukYinele,
    markdown: markdownOzet,
    onizleme: () => { onizlemeKip = (onizlemeKip + 1) % 3; onizlemeUygula(); return onizlemeKip; },
  };
})();
