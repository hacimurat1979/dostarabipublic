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
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
    catch (e) {
      ok = false;
      uyari(ui({
        tr: "Kayıt tarayıcıya yazılamadı (depolama dolu ya da kapalı). Son değişiklik KAYDEDİLMEDİ — önce “Claude'a gönder” ile bekleyenleri dışarı al.",
        en: "Could not save to the browser (storage full or blocked). The last change was NOT saved — export the pending items first.",
        pt: "Não foi possível guardar no navegador (armazenamento cheio ou bloqueado). A última alteração NÃO foi guardada — exporte primeiro os pendentes.",
      }));
    }
    updateBadge();
    paketiTazele();
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
    c.querySelectorAll(".durus-rozet-grup, bdi.honorific, .dost-revise-arac").forEach((n) => n.remove());
    c.querySelectorAll("a.cross-link, span.glossary-hint, mark.durus-vurgu-es, font, span[style]").forEach(unwrap);
    c.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
    c.querySelectorAll("[contenteditable]").forEach((n) => n.removeAttribute("contenteditable"));
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
    setQueue(q);
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
          pt: "A imagem não pôde ser guardada (IndexedDB). A nota foi guardada sem ela.",
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
      (supportsCapture ? '<button type="button" data-action="capture">📷 ' + escapeHtml(ui({ tr: "Ekran Görüntüsü Al", en: "Take Screenshot", pt: "Capturar Ecrã" })) + "</button>" : "") +
      '<button type="button" data-action="pick">🖼️ ' + escapeHtml(ui({ tr: "Galeriden Seç", en: "Choose from Gallery", pt: "Escolher da Galeria" })) + "</button>" +
      '<button type="button" data-action="remove-image" class="dost-shot-modal__remove" hidden>' + escapeHtml(ui({ tr: "Görüntüyü kaldır", en: "Remove image", pt: "Remover imagem" })) + "</button>" +
      "</div>" +
      '<img class="dost-shot-modal__preview" alt="" hidden ' +
      'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">' +
      '<label class="dost-shot-modal__label" for="dost-shot-note">' + escapeHtml(ui({ tr: "Bu sayfada ne değişmeli?", en: "What should change on this page?", pt: "O que deve mudar nesta página?" })) + "</label>" +
      '<textarea id="dost-shot-note" class="dost-shot-modal__note" rows="3"></textarea>' +
      '<div class="dost-shot-modal__actions">' +
      '<button type="button" data-action="cancel">' + escapeHtml(ui({ tr: "Vazgeç", en: "Cancel", pt: "Cancelar" })) + "</button>" +
      '<button type="button" data-action="save" class="dost-shot-modal__save">' + escapeHtml(ui({ tr: "Kaydet", en: "Save", pt: "Guardar" })) + "</button>" +
      "</div></div>";
    document.body.appendChild(modal);

    let currentImage = null;
    const preview = modal.querySelector(".dost-shot-modal__preview");
    const removeBtn = modal.querySelector('[data-action="remove-image"]');
    const textarea = modal.querySelector("textarea");
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
    if (!orj) return;
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
    const q = getQueue().map((e) => {
      const c = Object.assign({}, e);
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
  function exportQueue() {
    gorselleriTopla().then((g) => indir(JSON.stringify(paketKur(g), null, 2), dosyaAdi()));
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
      pt: "Este navegador não partilha ficheiros; o JSON foi descarregado.",
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
  }

  function updateBadge() {
    if (!panel) return;
    const badge = panel.querySelector(".dost-edit-panel__count");
    if (badge) badge.textContent = String(getQueue().length);
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
  function entryTitle(e, i) {
    const where = (e.url || "").replace(/^.*\/(?=[^/]*$)/, "") || "/";
    if (e.type === "visual-note") return `${i + 1}. 🖌️ ${escapeHtml(ui({ tr: "görsel not", en: "visual note", pt: "nota visual" }))} · ${escapeHtml(where)}`;
    return `${i + 1}. ✎ ${escapeHtml(e.heading || where)}`;
  }
  function adresSatiri(e) {
    if (e.type === "visual-note") return "";
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
      if (e.type === "visual-note") e.note = value;
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
        ${adresSatiri(e)}
        ${e.type !== "visual-note" && e.before != null ? `<p class="dost-notes__fark">${kelimeFarki(e.before_metin || e.before, e.after_metin || e.after)}</p>` : ""}
        ${e.gorsel || e.image ? `<img class="dost-notes__thumb" alt="" data-gorsel="${escapeHtml(e.gorsel || "")}" ${e.image ? `src="${escapeHtml(e.image)}"` : ""}>` : ""}
        <textarea class="dost-notes__text" data-text="${escapeHtml(e.id || "")}" rows="3">${escapeHtml(e.type === "visual-note" ? e.note : e.after)}</textarea>
      </div>`).join("");
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
      '<p class="dost-shot-modal__label">' + escapeHtml(ui({ tr: "Kayıtlı notlar — düzenleyebilir ya da silebilirsin", en: "Saved notes — edit or delete", pt: "Notas guardadas — editar ou apagar" })) + "</p>" +
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

  // --- panel ---------------------------------------------------------------
  function buildPanel() {
    panel = document.createElement("div");
    panel.className = "dost-edit-panel";
    const b = (action, d) => `<button type="button" data-action="${action}">${escapeHtml(ui(d))}</button>`;
    panel.innerHTML =
      '<button type="button" class="dost-edit-panel__toggle" aria-expanded="false" aria-label="' +
      escapeHtml(ui({ tr: "Düzenleme paneli", en: "Edit panel", pt: "Painel de edição" })) + '">' +
      '<span class="dost-edit-panel__icon">✎</span>' +
      '<span class="dost-edit-panel__count">' + getQueue().length + "</span>" +
      "</button>" +
      '<div class="dost-edit-panel__menu" hidden>' +
      '<p class="dost-edit-panel__hint">' + escapeHtml(ui({
        tr: "Düzenleme modu açık — düz yazı metinlere dokunup değiştirebilir ya da bu sayfa için bir görsel not bırakabilirsin.",
        en: "Edit mode is on — tap prose to change it, or leave a visual note for this page.",
        pt: "Modo de edição ativo — toque no texto para alterá-lo, ou deixe uma nota visual para esta página.",
      })) + "</p>" +
      b("visual-note", { tr: "🖌️ Bu Sayfa İçin Görsel Not", en: "🖌️ Visual Note for This Page", pt: "🖌️ Nota Visual para Esta Página" }) +
      b("notes", { tr: "📋 Kayıtlı Notlar", en: "📋 Saved Notes", pt: "📋 Notas Guardadas" }) +
      b("send", { tr: "📤 Claude'a gönder", en: "📤 Send to Claude", pt: "📤 Enviar ao Claude" }) +
      b("copy", { tr: "Kopyala (görüntüsüz)", en: "Copy (no images)", pt: "Copiar (sem imagens)" }) +
      b("export", { tr: "Dışa Aktar (indir)", en: "Export (download)", pt: "Exportar (descarregar)" }) +
      b("clear", { tr: "Temizle", en: "Clear", pt: "Limpar" }) +
      b("minimize", { tr: "Küçült ↑", en: "Minimise ↑", pt: "Minimizar ↑" }) +
      b("exit", { tr: "Düzenleme Modunu Kapat", en: "Close Edit Mode", pt: "Fechar Modo de Edição" }) +
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
    panel.querySelector('[data-action="send"]').addEventListener("click", claudeaGonder);
    panel.querySelector('[data-action="copy"]').addEventListener("click", kopyala);
    panel.querySelector('[data-action="export"]').addEventListener("click", exportQueue);
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
    kipYayinla();
  }

  function disableEditMode() {
    if (!editModeOn) return;
    editModeOn = false;
    if (document.activeElement && document.activeElement.isContentEditable) document.activeElement.blur();
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
  };
})();
