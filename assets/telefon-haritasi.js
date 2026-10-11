/* Telefonda harita (2026-10-10, TASLAK) -- GU.telefonHaritasi ve
 * kardeşleri. graph-utils.js'ten SONRA, görünüm modüllerinden ÖNCE yüklenir
 * (index.html). Boyut bütçesi yüzünden graph-utils.js'ten ayrı dosya;
 * ortak motordaki iki kanca (telefonMu, tek parmak / sürükleme kuralı)
 * orada kaldı. Masaüstünde (html.dost-uygulama yokken) hiçbir şey yapmaz.
 */
(function () {
  "use strict";
  const GU = window.DostGraphUtils;
  if (!GU || GU._telefonHaritasiHazir) return;
  GU._telefonHaritasiHazir = true;
  // ---------------------------------------------------------------------
  // Telefonda harita (2026-10-10, TASLAK -- karşılaştırma sayfası:
  // scratchpad/mobil-grafik/karsilastirma.html; sözleşme: ETKILESIM_DILI.md
  // "Telefonda harita"). Yalnız telefon kabuğu açıkken (html.dost-uygulama,
  // assets/uygulama-kabugu.js) çalışır; masaüstünde hiçbir şey değişmez.
  //
  // Ölçüm (2026-10-10, Pixel 7 + 360 px, dikey/yatay): "Haritayı aç"tan
  // sonra grafikler masaüstü ölçeğinde açılıyordu -- Ontoloji'de düğüm
  // 8 px, yazı 4,4 px; Eser Ağı'nda 28 eserin 5'i ekranda, yazı 5,4 px;
  // yatayda sahnenin altı alt gezinmenin arkasında (yükseklik en az 480 px
  // kuralı); düğüme dokununca panel bütün haritayı örtüyordu ve listeye
  // geri dönüş yoktu. Bu katman görünüme şunları verir:
  //  - Kip hapı (Grafik | Liste [| Tam ekran]): aynı yerde, iki kipte de.
  //    Seçim görünüm başına hatırlanır (seçilen kip korunur).
  //  - Tam boy tuval: üst çubuk ile alt gezinme arasındaki alanın tamamı.
  //  - Odak alanı: düğme satırı, hap ve (açıksa) yarım panel dışındaki
  //    alan; sığdırma ve seçileni ortalama buna göre yapılır.
  //  - Yakın dokunuş: boşluğa düşen dokunuş, 30 px içindeki en yakın
  //    düğümü seçer (görünür nokta küçük kalsa da hedef parmak boyunda).
  //  - Seçilen düğüm yarım panelin üstündeki alanda ortalanır.
  //  - İsteğe bağlı: ekranda sabit boylu yazılar + çakışanı gizleyen
  //    seyreltme (yaklaştıkça daha çok ad görünür).
  // ---------------------------------------------------------------------
  const MG_METIN = {
    grafik: { tr: "Grafik", en: "Graph", pt: "Gráfico" },
    liste: { tr: "Liste", en: "List", pt: "Lista" },
    tam: { tr: "Tam ekran", en: "Full screen", pt: "Ecrã inteiro" },
    grup: { tr: "Görünüm kipi", en: "View mode", pt: "Modo de vista" },
  };
  const MG_SIMGE = {
    grafik: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="4.5" r="2.1" fill="currentColor"/><circle cx="18.5" cy="15.8" r="1.7" fill="currentColor"/><circle cx="6" cy="15.8" r="1.7" fill="currentColor"/>',
    liste: '<circle cx="5.5" cy="7" r="1.7" fill="currentColor"/><circle cx="5.5" cy="12" r="1.7" fill="currentColor"/><circle cx="5.5" cy="17" r="1.7" fill="currentColor"/><line x1="10" y1="7" x2="19.5" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="10" y1="12" x2="19.5" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="10" y1="17" x2="19.5" y2="17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    tam: '<rect x="2.5" y="6.5" width="19" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  };
  const MG_UST = 64;        // görünümün yuvarlak düğme satırı (top:12 + 44 + pay)
  const MG_ALT = 68;        // kip hapı (48) + pay
  const MG_YAKIN = 30;      // yakın dokunuş yarıçapı (px)
  const MG_YARIM_DIKEY = 0.5;  // yarım panelin tepesi: görünür yüksekliğin yarısı
  const MG_YARIM_YATAY = 0.5;  // yatayda yarım panel sağ yarıda
  const _mgHTML = document.documentElement;
  const _telefonlar = GU._telefonlar;
  const telefonMu = GU.telefonMu;
  const registerStepBack = GU.registerStepBack;
  const wakeViews = GU.wakeViews;
  const isViewActive = GU.isViewActive;
  function _mgYatay() { return window.innerWidth > window.innerHeight; }
  function _mgT(o) { return window.DostI18n && window.DostI18n.pick3 ? window.DostI18n.pick3(o) : o.tr; }
  // Kip tercihi bütün haritalar için tek (2026-10-11, kullanıcı kararı):
  // bir görünümde Liste seçen, ötekilerde de listeyle karşılaşır.
  const MG_KIP_ANAHTAR = "dost-mobil-kip";
  function _mgKipOku() { try { return localStorage.getItem(MG_KIP_ANAHTAR); } catch (e) { return null; } }
  function _mgKipYaz(k) { try { localStorage.setItem(MG_KIP_ANAHTAR, k); } catch (e) { /* özel pencere */ } }
  function _mgAktif() {
    for (const api of _telefonlar) if (!api.o.wrapEl.hidden && api.o.wrapEl.isConnected) return api;
    return null;
  }
  function _mgPanelAcik() { const p = document.getElementById("detail-panel"); return !!(p && !p.hidden); }

  // Haritanın görünür, dokunulabilir alanı (ekran koordinatı). panelAcik:
  // true = yarım panel açık sayılır (panel henüz yerleşmeden hesaplamak
  // için), false = sayılmaz, verilmezse panelin o anki durumu.
  function telefonOdakAlani(wrapEl, panelAcik) {
    const r = wrapEl.getBoundingClientRect();
    const hdr = document.querySelector(".app-header");
    const hb = hdr && hdr.getClientRects().length ? hdr.getBoundingClientRect().bottom : 0;
    const altEl = document.querySelector(".uyg-alt");
    const at = altEl && !altEl.hidden && altEl.getClientRects().length ? altEl.getBoundingClientRect().top : window.innerHeight;
    // Yatayda yükseklik kıt: hap sağ kenarda dikey durur, düğme satırı
    // yalnız sol üst köşeyi tutar (sahne ortalı, ancak yarı payı yeter).
    const yatay = _mgYatay();
    let ust = Math.max(r.top, hb) + (yatay ? MG_UST * 0.6 : MG_UST);
    let alt = Math.min(r.bottom, at) - (yatay ? 12 : MG_ALT);
    let sol = Math.max(0, r.left) + 10, sag = Math.min(window.innerWidth, r.right) - (yatay ? 66 : 10);
    // Görünümün kendi alt denetimi (ör. Seyahat Atlası'nın yıl çubuğu):
    // sahne onun üstünde biter.
    const kayit = _telefonlar.find((x) => x.o.wrapEl === wrapEl);
    const engel = kayit && kayit.o.altEngel ? wrapEl.querySelector(kayit.o.altEngel) : null;
    if (engel && engel.getClientRects().length) {
      const er = engel.getBoundingClientRect();
      if (er.top > (r.top + r.bottom) / 2) alt = Math.min(alt, er.top - 8);
    }
    if (panelAcik == null) panelAcik = _mgPanelAcik() && _mgHTML.classList.contains("uyg-panel-yarim");
    if (panelAcik) {
      if (_mgYatay()) sag = Math.min(sag, window.innerWidth * (1 - MG_YARIM_YATAY) - 10);
      else alt = Math.min(alt + MG_ALT - 12, hb + (at - hb) * MG_YARIM_DIKEY - 12);
    }
    if (alt - ust < 80) { ust = Math.max(r.top, hb) + 8; }
    return { x: sol, y: ust, w: Math.max(40, sag - sol), h: Math.max(40, alt - ust), cx: (sol + sag) / 2, cy: (ust + alt) / 2 };
  }

  // bbox ({x0,y0,x1,y1}, sahne birimi; 1 birim = 1 CSS px varsayılır) odak
  // alanına sığar. Döner: d3.zoomIdentity (svgEl'e göre).
  function telefonSigdir(wrapEl, svgEl, bbox, kMin, kMax, pay, panelAcik) {
    const a = telefonOdakAlani(wrapEl, !!panelAcik);
    const sr = svgEl.getBoundingClientRect();
    pay = pay == null ? 8 : pay;
    const bw = Math.max(1, bbox.x1 - bbox.x0), bh = Math.max(1, bbox.y1 - bbox.y0);
    const k = Math.max(kMin, Math.min(kMax, (a.w - 2 * pay) / bw, (a.h - 2 * pay) / bh));
    const cx = a.cx - sr.left, cy = a.cy - sr.top;
    return d3.zoomIdentity.translate(cx - k * (bbox.x0 + bw / 2), cy - k * (bbox.y0 + bh / 2)).scale(k);
  }

  // Odak + bağlam (Kur'ân Dokusu, Sırlar gibi yoğun görünümler): seçilen
  // düğüm ve komşuları (sahne koordinatında bbox) yarım panelin üstündeki
  // alana sığar; kamera en az kMin'e yaklaşır ki komşulara parmakla
  // dokunulabilsin. d3-zoom kullanan görünümler için.
  // merkez (ops., {x,y} sahne): komşuluk kMin'de alana sığmıyorsa kamera
  // komşuluğun değil seçilenin üstüne ortalanır (seçilen ekrandan çıkmasın).
  function telefonOdakla(wrapEl, svg, zoom, bbox, kMin, kMax, merkez, pay) {
    const svgEl = svg.node();
    const az = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pay = pay == null ? 18 : pay;
    let t = telefonSigdir(wrapEl, svgEl, bbox, kMin, kMax, pay, true);
    if (merkez) {
      const a = telefonOdakAlani(wrapEl, true);
      const bw = (bbox.x1 - bbox.x0) * t.k, bh = (bbox.y1 - bbox.y0) * t.k;
      if (bw > a.w - 2 * pay || bh > a.h - 2 * pay) {
        const sr = svgEl.getBoundingClientRect();
        t = d3.zoomIdentity.translate(a.cx - sr.left - t.k * merkez.x, a.cy - sr.top - t.k * merkez.y).scale(t.k);
      }
    }
    (az ? svg : svg.transition().duration(480)).call(zoom.transform, t);
  }

  // Ortak kip hapı (body'de tek öğe; etkin görünüme göre görünür).
  let _mgHap = null;
  function _mgHapKur() {
    if (_mgHap) return _mgHap;
    _mgHap = document.createElement("div");
    _mgHap.className = "mg-kip";
    _mgHap.setAttribute("role", "group");
    _mgHap.hidden = true;
    const dugme = (kip) => `<button type="button" class="mg-kip__dugme" data-mg-kip="${kip}"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${MG_SIMGE[kip]}</svg><span class="mg-kip__ad"></span></button>`;
    _mgHap.innerHTML = dugme("grafik") + dugme("liste") +
      `<button type="button" class="mg-kip__dugme mg-kip__dugme--tam" data-mg-tam="1" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${MG_SIMGE.tam}</svg></button>`;
    document.body.appendChild(_mgHap);
    _mgHap.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      const api = _mgAktif();
      if (!b || !api) return;
      if (b.dataset.mgTam) { _mgTamEkran(!_mgHTML.classList.contains("mg-tam")); return; }
      api.kipSec(b.dataset.mgKip === "liste" ? "liste" : "harita", true);
    });
    _mgHapYaz();
    new MutationObserver(_mgHapYaz).observe(_mgHTML, { attributes: true, attributeFilter: ["lang", "class"] });
    document.querySelectorAll("main > section").forEach((s) => new MutationObserver(_mgHapYaz).observe(s, { attributes: true, attributeFilter: ["hidden"] }));
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement && _mgHTML.classList.contains("mg-tam")) _mgTamEkran(false);
    });
    return _mgHap;
  }
  function _mgHapYaz() {
    if (!_mgHap) return;
    const api = _mgAktif();
    const goster = !!(api && telefonMu());
    _mgHap.hidden = !goster;
    if (!goster) return;
    _mgHap.setAttribute("aria-label", _mgT(MG_METIN.grup));
    _mgHap.querySelectorAll("[data-mg-kip]").forEach((b) => {
      const k = b.dataset.mgKip === "liste" ? "liste" : "harita";
      b.querySelector(".mg-kip__ad").textContent = _mgT(MG_METIN[b.dataset.mgKip]);
      b.setAttribute("aria-label", _mgT(MG_METIN[b.dataset.mgKip]));
      b.setAttribute("aria-pressed", String(api.kip === k));
      b.classList.toggle("is-aktif", api.kip === k);
    });
    const tam = _mgHap.querySelector("[data-mg-tam]");
    const tamAcik = _mgHTML.classList.contains("mg-tam");
    tam.hidden = api.kip !== "harita";
    tam.setAttribute("aria-label", _mgT(MG_METIN.tam));
    tam.title = _mgT(MG_METIN.tam);
    tam.setAttribute("aria-pressed", String(tamAcik));
    tam.classList.toggle("is-aktif", tamAcik);
  }

  // Tam ekran: üst çubuk ve alt gezinme çekilir, tuval bütün ekranı alır;
  // destekleyen tarayıcıda gerçek tam ekran + yatay kilit. Esc (ve
  // Android'in geri tuşu) tarayıcının kendi tam ekranından çıkar; tarayıcı
  // tam ekranı yoksa Esc zincirindeki son adım bu kipten çıkar.
  let _mgTamEsc = false;
  function _mgTamEkran(ac) {
    _mgHTML.classList.toggle("mg-tam", ac);
    if (ac) {
      if (!_mgTamEsc) {
        _mgTamEsc = true;
        registerStepBack(null, () => {
          if (!_mgHTML.classList.contains("mg-tam") || _mgPanelAcik()) return false;
          _mgTamEkran(false);
          return true;
        });
      }
      const d = document.documentElement;
      if (d.requestFullscreen && !document.fullscreenElement) {
        d.requestFullscreen({ navigationUI: "hide" }).then(() => {
          try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {}); } catch (e) { /* yok */ }
        }).catch(() => {});
      }
    } else {
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* yok */ }
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
    _mgHapYaz();
    wakeViews();
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  // Yakın dokunuş + seçileni ortalama (görünüm başına bir kez).
  function _mgDokunusKur(api) {
    const o = api.o, wrapEl = o.wrapEl;
    let bas = null, bekleyen = null, bekleyenZaman = 0;
    const isaretOf = (el) => (o.isaret && el.querySelector(o.isaret)) || el.querySelector("circle") || el;
    const merkezOf = (el) => { const r = isaretOf(el).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; };
    wrapEl.addEventListener("pointerdown", (e) => {
      if (!telefonMu() || e.pointerType !== "touch") { bas = null; return; }
      if (!e.isPrimary) { if (bas) bas.cok = true; return; }
      bas = { x: e.clientX, y: e.clientY, t: e.timeStamp, cok: false };
    }, true);
    wrapEl.addEventListener("pointerup", (e) => {
      if (!bas || !e.isPrimary || bas.cok || api.kip !== "harita") { if (e.isPrimary) bas = null; return; }
      const uzak = Math.hypot(e.clientX - bas.x, e.clientY - bas.y), sure = e.timeStamp - bas.t;
      bas = null;
      if (uzak > 10 || sure > 650) return;
      const hedef = e.target;
      if (!hedef || !hedef.closest || !hedef.closest("svg")) return;
      if (hedef.closest(o.dugumSecici)) return;              // düğümün kendisi: kendi tıklaması
      if (hedef.closest('svg [role="button"], svg [tabindex], a, button')) return; // kenar vb.
      let en = null, enD = MG_YAKIN;
      wrapEl.querySelectorAll(o.dugumSecici).forEach((el) => {
        if (!el.getClientRects().length) return;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.2) return;
        // Uzaklık işaretin kenarına (daire de kart da): içindeyse 0.
        const r = isaretOf(el).getBoundingClientRect();
        const ex = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const ey = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const d = Math.hypot(ex, ey);
        if (d < enD) { enD = d; en = el; }
      });
      if (!en) return;
      bekleyen = en; bekleyenZaman = performance.now();
      // Tarayıcının kendi click'i birazdan boşluğa düşecek: onu yutup
      // düğüme yönlendiriyoruz (yoksa "boşluğa dokundu = seçimi bırak"
      // çalışırdı). Click hiç gelmezse (d3-zoom yuttuysa) kısa süre sonra.
      setTimeout(() => { if (bekleyen === en) { bekleyen = null; tikla(en); } }, 380);
    }, true);
    wrapEl.addEventListener("pointercancel", () => { bas = null; }, true);
    function tikla(el) {
      const m = merkezOf(el);
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: m.x, clientY: m.y }));
    }
    wrapEl.addEventListener("click", (e) => {
      if (bekleyen && e.isTrusted && performance.now() - bekleyenZaman < 600) {
        const el = bekleyen; bekleyen = null;
        e.stopPropagation(); e.preventDefault();
        tikla(el);
        return;
      }
      const dugum = e.target && e.target.closest && e.target.closest(o.dugumSecici);
      if (!dugum || !telefonMu() || api.kip !== "harita" || o.merkezle === false) return;
      // Seçilen düğüm, panel yerleştikten sonra yarım panelin üstündeki
      // alanın ortasına gelir. Görünüm kendi kamerasını kendisi taşıyorsa
      // (o.merkezle bir fonksiyonsa) iş ona bırakılır.
      setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!_mgPanelAcik() || !dugum.isConnected) return;
        const a = telefonOdakAlani(wrapEl, true);
        if (typeof o.merkezle === "function") { o.merkezle(dugum, a); return; }
        if (!o.kaydir) return;
        const m = merkezOf(dugum);
        const dx = a.cx - m.x, dy = a.cy - m.y;
        if (Math.hypot(dx, dy) > 6) o.kaydir(dx, dy);
      })), 40);
    }, true);
  }

  // Ekranda sabit boylu yazılar + çakışanı gizleyen seyreltme.
  // o.etiket: { secici, px (vars. 12), oncelik(el) -> sayı (büyük kazanır) }
  function _mgEtiketKur(api) {
    const e = api.o.etiket, wrapEl = api.o.wrapEl;
    if (!e) return;
    let raf = null;
    function calis() {
      raf = null;
      const etkin = telefonMu() && api.kip === "harita" && !wrapEl.hidden;
      const els = Array.from(wrapEl.querySelectorAll(e.secici));
      if (!etkin) {
        els.forEach((el) => { if (el.dataset.mgEtiket) { el.style.fontSize = ""; el.style.translate = ""; el.classList.remove("mg-etiket-gizli"); delete el.dataset.mgEtiket; } });
        return;
      }
      const px = e.px || 12;
      const olcek = new Map();
      els.forEach((el) => {
        const m = el.parentNode && el.parentNode.getScreenCTM ? el.parentNode.getScreenCTM() : null;
        const s = Math.max(0.05, m ? Math.hypot(m.a, m.b) : 1);
        olcek.set(el, s);
        el.dataset.mgEtiket = "1";
        el.style.fontSize = (px / s).toFixed(2) + "px";
        el.style.translate = "";
      });
      const a = telefonOdakAlani(wrapEl);
      const sirali = els.map((el) => {
        const g = api.o.isaret && el.parentNode ? el.parentNode.querySelector(api.o.isaret) : null;
        return { el, p: e.oncelik ? e.oncelik(el) : 0, r: el.getBoundingClientRect(), c: g ? g.getBoundingClientRect() : null };
      }).filter((x) => x.r.width > 0).sort((x, y) => y.p - x.p);
      // Düğümlerin görünen daireleri de engel: ad bir düğümün üstüne düşmez.
      const konan = [];
      sirali.forEach((x) => { if (x.c && x.c.width > 4) konan.push({ left: x.c.left + 2, right: x.c.right - 2, top: x.c.top + 2, bottom: x.c.bottom - 2, dugum: true }); });
      const PAY = 3;
      const carparMi = (r) => konan.some((k) => { const p = k.dugum ? 0 : PAY; return r.left - p < k.right && r.right + p > k.left && r.top - p < k.bottom && r.bottom + p > k.top; });
      const ekranda = (r) => r.left >= 2 && r.right <= window.innerWidth - 2;
      // Her ad için dört yer denenir: kendi yeri (görünümün seçtiği, dışa
      // bakan taraf), karşı taraf, sağ, sol. Hiçbiri boş değilse gizlenir;
      // yaklaşınca yer açılır, ad döner.
      sirali.forEach((x) => {
        const r = x.r, w = r.width, h = r.height;
        const disarida = r.right < a.x - 40 || r.left > a.x + a.w + 40 || r.bottom < a.y - 60 || r.top > a.y + a.h + 60;
        if (disarida) { x.el.classList.remove("mg-etiket-gizli"); return; }
        const adaylar = [[0, 0]];
        if (x.c) {
          const cx = x.c.left + x.c.width / 2, cy = x.c.top + x.c.height / 2;
          const rx = r.left + w / 2, ry = r.top + h / 2;
          const ustte = ry < cy;
          adaylar.push(ustte ? [cx - rx, x.c.bottom + 3 + h / 2 - ry] : [cx - rx, x.c.top - 3 - h / 2 - ry]);
          adaylar.push([x.c.right + 5 + w / 2 - rx, cy - ry]);
          adaylar.push([x.c.left - 5 - w / 2 - rx, cy - ry]);
        }
        let secilen = null;
        for (const [dx, dy] of adaylar) {
          const q = { left: r.left + dx, right: r.right + dx, top: r.top + dy, bottom: r.bottom + dy };
          if (!carparMi(q) && (ekranda(q) || (dx === 0 && dy === 0 && !ekranda(r) && adaylar.length === 1))) { secilen = [dx, dy, q]; break; }
        }
        x.el.classList.toggle("mg-etiket-gizli", !secilen);
        if (!secilen) return;
        if (secilen[0] || secilen[1]) {
          const s = olcek.get(x.el);
          x.el.style.translate = (secilen[0] / s).toFixed(2) + "px " + (secilen[1] / s).toFixed(2) + "px";
        }
        konan.push(secilen[2]);
      });
    }
    function iste() { if (raf == null) raf = requestAnimationFrame(calis); }
    api.etiketYenile = iste;
    ["wheel", "touchmove", "touchend", "pointerup"].forEach((t) => wrapEl.addEventListener(t, iste, { passive: true }));
    window.addEventListener("resize", iste);
    // Sahne kendi döngüsüyle yavaşça kıpırdıyorsa (salınım) yazılar da.
    setInterval(() => { if (telefonMu() && api.kip === "harita" && isViewActive(wrapEl)) iste(); }, 450);
    iste();
  }

  // Önceki / sonraki kayıt (2026-10-11, grafik gezinme denetimi O5): sıralı
  // görünümlerde (Menziller, Hâller, Eser Ağı, Seyahat Atlası, Eleştiri
  // Arkeolojisi) panelin başında iki komşu dairesi -- numara/yıl dairenin
  // içinde, ad yanında. Dokunmak komşu kaydı açar (adreste yeni bir adım;
  // geri tuşu döner). Görünüm sırasını opts.komsular() verir:
  // [{ id, no, ad }], açılış __dostNav.goTo(view, id).
  const MG_KOMSU = {
    onceki: { tr: "Önceki", en: "Previous", pt: "Anterior" },
    sonraki: { tr: "Sonraki", en: "Next", pt: "Seguinte" },
    grup: { tr: "Komşu kayıtlar", en: "Neighbouring records", pt: "Registos vizinhos" },
  };
  let _mgKomsuGozcu = null;
  function _mgKomsuKur() {
    const icerik = document.getElementById("detail-content");
    if (_mgKomsuGozcu || !icerik) return;
    const yaz = () => {
      const api = _mgAktif();
      const eski = icerik.querySelector(":scope > .mg-komsu");
      const parca = location.pathname.split("/").filter((x) => x && !/^(en|pt)$/.test(x));
      const liste = api && telefonMu() && api.o.komsular && parca.length > 1 && parca[0] === api.o.gorunum ? api.o.komsular() : null;
      const i = liste ? liste.findIndex((x) => String(x.id) === decodeURIComponent(parca[1])) : -1;
      if (i < 0 || !icerik.querySelector(".detail-title")) { if (eski) eski.remove(); return; }
      const anahtar = api.o.gorunum + "/" + liste[i].id + "/" + document.documentElement.lang;
      if (eski && eski.dataset.anahtar === anahtar) return;
      const d = (x, yon) => x ? `<button type="button" class="mg-komsu__dugme mg-komsu__dugme--${yon}" data-mg-komsu="${GU.escapeHtml(String(x.id))}" aria-label="${GU.escapeHtml(_mgT(MG_KOMSU[yon]) + ": " + x.ad)}"><span class="mg-komsu__no" aria-hidden="true">${GU.escapeHtml(String(x.no))}</span><span class="mg-komsu__ad">${GU.escapeHtml(x.ad)}</span></button>` : `<span class="mg-komsu__bos"></span>`;
      const nav = document.createElement("nav");
      nav.className = "mg-komsu";
      nav.dataset.anahtar = anahtar;
      nav.setAttribute("aria-label", _mgT(MG_KOMSU.grup));
      nav.innerHTML = d(liste[i - 1], "onceki") + d(liste[i + 1], "sonraki");
      nav.addEventListener("click", (e) => {
        const b = e.target.closest("[data-mg-komsu]");
        if (b && window.__dostNav) window.__dostNav.goTo(api.o.gorunum, b.dataset.mgKomsu);
      });
      if (eski) eski.remove();
      icerik.insertBefore(nav, icerik.firstChild);
    };
    _mgKomsuGozcu = new MutationObserver(() => requestAnimationFrame(yaz));
    _mgKomsuGozcu.observe(icerik, { childList: true });
    window.addEventListener("popstate", () => requestAnimationFrame(yaz));
    yaz();
  }

  // opts: { wrapEl, liste (createMobileListFallback dönüşü), dugumSecici,
  //   isaret (düğümün görünen işareti, ops.), kaydir(dx, dy) (kamerayı
  //   ekran pikseliyle taşı), merkezle (false | fn(el, alan): görünüm kendi
  //   taşır), etiket (ops., bkz. _mgEtiketKur), kipDegisti(kip) (ops.) }
  function telefonHaritasi(opts) {
    const wrapEl = opts.wrapEl;
    if (!wrapEl) return null;
    const api = { o: opts, kip: _mgKipOku() === "liste" ? "liste" : "harita" };
    function uygula(yeni) {
      const tel = telefonMu();
      const once = wrapEl.className;
      wrapEl.classList.toggle("mg-telefon", tel);
      if (tel) {
        wrapEl.classList.toggle("grafik-acik", api.kip === "harita");
        wrapEl.classList.toggle("mg-liste", api.kip === "liste");
        if (api.kip === "liste" && opts.liste && opts.liste.yukle) opts.liste.yukle();
      } else {
        wrapEl.classList.remove("mg-liste");
        if (_mgHTML.classList.contains("mg-tam")) _mgTamEkran(false);
      }
      _mgHapYaz();
      if (yeni || once !== wrapEl.className) {
        wakeViews();
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event("resize"));
          if (api.etiketYenile) api.etiketYenile();
        });
      }
    }
    api.uygula = uygula;
    api.kipSec = function (kip, kullanici) {
      if (kip === api.kip) return;
      api.kip = kip;
      if (kullanici) {
        _mgKipYaz(kip);
        // Ortak tercih: gizli görünümler de aynı kipe geçer (görününce
        // doğru kipte açılsınlar).
        _telefonlar.forEach((a) => { if (a !== api && a.kip !== kip) { a.kip = kip; a.uygula(false); } });
      }
      if (kip === "liste" && _mgHTML.classList.contains("mg-tam")) _mgTamEkran(false);
      if (kip === "liste" && _mgPanelAcik()) { const c = document.getElementById("detail-close"); if (c) c.click(); }
      uygula(true);
      if (opts.kipDegisti) opts.kipDegisti(kip);
      window.scrollTo(0, 0);
    };
    _telefonlar.push(api);
    _mgHapKur();
    if (opts.komsular) _mgKomsuKur();
    _mgDokunusKur(api);
    _mgEtiketKur(api);
    new MutationObserver(() => uygula(false)).observe(_mgHTML, { attributes: true, attributeFilter: ["class"] });
    uygula(false);
    return api;
  }

  Object.assign(GU, { telefonHaritasi, telefonOdakAlani, telefonSigdir, telefonOdakla });
  const bekleyen = (GU._telefonBekleyen || []).splice(0);
  bekleyen.forEach((o) => telefonHaritasi(o));
  // Görünüm bu katmandan önce inip çizildiyse sığdırması masaüstüne göre
  // yapıldı (katmanın işlevleri yoktu): görünür olan bir kez yeniden çizilir.
  if (telefonMu() && bekleyen.some((o) => o.wrapEl && !o.wrapEl.hidden && o.wrapEl.isConnected)) {
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }
})();
