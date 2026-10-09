/* Dost Arabî — paylaşılan sarmal (helix) sahne motoru.
 *
 * Neden ayrı bir dosya: Hâller Haritası'ndaki üç boyutlu sarmal
 * (assets/hal.js içindeki `helixPoint`/`project` çifti) CLAUDE.md'de
 * "iki boyutlu bir halka ile üç boyutlu bir sarmal arasında seçim varken
 * sarmalı tercih et" ilkesinin referans uygulaması olarak anılıyor. Füsûs
 * bölümündeki bölüm-içi çizimler de aynı dili konuşsun istendi; aynı
 * matematiği ikinci kez yazmak yerine buraya çıkarıldı.
 *
 * hal.js BİLEREK dokunulmadan bırakıldı: orada sarmal, kendi zoom/pan'i,
 * kirişleri ve dönüş oku olan tam bir görünüm; burada ise bir metnin içine
 * gömülen, kendi başına duran küçük bir sahne. İkisinin ihtiyaçları farklı,
 * ortak olan yalnız nokta üretimi ile projeksiyon.
 *
 * Kullanım:
 *   const sahne = DostHelix.mount(kapsayiciEl, spec);
 *   sahne.setLang();   // dil değişince
 *   sahne.destroy();   // görünümden çıkarken
 *
 * spec = {
 *   id:      "fs1-mertebe",                     // svg içi id önekleri için
 *   nodes:   [{ id, label:{tr,en,pt}, note:{tr,en,pt}, accent?:true }, ...],
 *   turns:   1.35,        // sarmalın kaç tur döneceği (varsayılan 1.25)
 *   closing: false,       // son düğümden ilkine dönüş izi çizilsin mi
 *   caption: {tr,en,pt},  // (opsiyonel) sahnenin altına yazılacak not
 *   spinSpeed: 1,         // (opsiyonel) dönüş hızı çarpanı, varsayılan 1
 *   labelMode: "all",     // "all" | "sparse" (yalnız vurgulu+odak) | "none"
 * }
 */
(function () {
  "use strict";

  var I18n = window.DostI18n;
  var FOCAL = 900;           // perspektif odak uzaklığı (hal.js ile aynı his)
  var PITCH = 0.62;          // sahneye bakış açısı (X ekseni)
  var SPIN_PER_MS = 0.00006; // ~29 saniyede tam tur -- "sakin dönüş"
  var scenes = [];           // tek bir rAF döngüsü bütün sahneleri sürüyor
  var rafId = null;
  var uid = 0;               // sahneye özel marker id'leri için sayaç

  function pick(o) {
    if (!o) return "";
    if (I18n && I18n.pick3) return I18n.pick3(o);
    return o.tr || o.en || o.pt || "";
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Ortak kaçış (2026-10-09): graph-utils.js escapeHtml ile birebir aynı
  // davranıştaki yerel kopyanın yerine (& < > " ; null -> "").
  function esc(s) { return window.DostGraphUtils.escapeHtml(s); }

  // --- sarmalın parametrik tanımı --------------------------------------------
  // t tam sayı olduğunda o sıradaki düğümün yeri; kesirli değerler yolu
  // pürüzsüz çizmeyi ve kapanış izini (t > n-1) sağlıyor. hal.js'teki
  // helixPoint ile aynı fikir: yarıçap yavaşça açılırken yükseklik birikiyor,
  // böylece daire kapanırken aynı noktaya değil bir üstüne geliyor.
  function helixPoint(sc, t) {
    var n = Math.max(1, sc.nodes.length);
    var span = Math.max(1, n - 1);
    var a = -Math.PI / 2 + (t / span) * Math.PI * 2 * sc.turns;
    var r = sc.baseR * (0.78 + 0.26 * (t / span));
    var hStep = sc.riseH / span;
    return { x: r * Math.cos(a), y: -hStep * t + sc.riseH / 2, z: r * Math.sin(a) };
  }

  function project(sc, p) {
    var cyw = Math.cos(sc.yaw), syw = Math.sin(sc.yaw);
    var x1 = p.x * cyw + p.z * syw;
    var z1 = -p.x * syw + p.z * cyw;
    var cpt = Math.cos(PITCH), spt = Math.sin(PITCH);
    var y2 = p.y * cpt - z1 * spt;
    var z2 = p.y * spt + z1 * cpt;
    var zc = Math.max(z2, -FOCAL * 0.85);
    var d = FOCAL / (FOCAL + zc);
    return { x: sc.cx + x1 * d, y: sc.cy + y2 * d, depth: d, z: z2 };
  }

  function projectT(sc, t) { return project(sc, helixPoint(sc, t)); }

  // i'nci düğümü bakana en yakın konuma (önde, yatayda ortada) getiren yaw:
  // project()'te z1 = r·sin(a − yaw); en küçük değeri a − yaw = −π/2'de.
  function yawFor(sc, i) {
    var span = Math.max(1, sc.nodes.length - 1);
    var a = -Math.PI / 2 + (i / span) * Math.PI * 2 * sc.turns;
    return a + Math.PI / 2;
  }

  function pathBetween(sc, t0, t1, steps) {
    var d = "";
    for (var s = 0; s <= steps; s++) {
      var p = projectT(sc, t0 + (t1 - t0) * (s / steps));
      d += (s === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1);
    }
    return d;
  }

  // --- çizim -----------------------------------------------------------------
  function layout(sc) {
    var w = sc.svg.clientWidth || sc.el.clientWidth || 520;
    // Yükseklik oranı sabit: sarmalın yükselişi yatay salınımı aşmalı, yoksa
    // son düğüm bir öncekinin altına düşüp sarmal bir halkaya benziyor.
    var h = Math.max(260, Math.min(sc.maxH, w * sc.hRatio));
    sc.w = w; sc.h = h;
    sc.cx = w / 2; sc.cy = h / 2;
    sc.baseR = Math.max(74, Math.min(w, h * 0.72) / 2 - 46);
    sc.riseH = Math.max(sc.baseR * 1.85, h - sc.baseR * 1.15);
    sc.svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    sc.svg.setAttribute("height", h);
  }

  // Etiket genişliği yedek fontla ölçülürse dar kalır; web fontları
  // yüklenince ölçümler bir kez tazelenir (graph-utils deconflictor'ındaki
  // aynı ders).
  var fontSurumu = 0;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fontSurumu++; });
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(name) { return document.createElementNS(SVGNS, name); }

  // DOM'u BİR KEZ kurar. Her karede yeniden yazmak (innerHTML) düğümleri
  // sürekli koparıp yeniden bağlıyordu; sonucu iki gerçek kusurdu:
  // klavye odağı her karede kayboluyor (yani sarmalda ok tuşlarıyla
  // gezinmek imkânsız) ve tıklama hedefi elin altından çekiliyordu
  // (2026-07-29, Playwright "element was detached from the DOM" ile
  // yakalandı). Artık öğeler yerinde duruyor, her karede yalnız
  // nitelikleri güncelleniyor.
  function build(sc) {
    sc.svg.textContent = "";
    // GORSEL-01 (uzman paneli denetimi 2026-08-17): yolun ucundaki üçgen ok
    // (marker-end) görsel gramerin "soyut ok kullanma" yasağını çiğniyordu.
    // Yön artık ışık-yolu gradyanıyla okunuyor: yol başlangıçta soluk,
    // ilerledikçe belirginleşiyor (hal.js'in kendi segmentlerinin
    // 0.32+0.5*prog opaklık rampasıyla aynı mantık). Uçlar her karede
    // draw() içinde projeksiyondan tazelenir (sahne dönerken sabit
    // koordinat olmaz). stop-color style= içinde: yalnız öyle yazılınca
    // CSS değişkeni (--helix-yol) çözülüyor (bkz. terimler.js isikCizgisi).
    var defs = svgEl("defs");
    sc.gradId = "helix-isik-" + (++uid);
    var grad = svgEl("linearGradient");
    grad.setAttribute("id", sc.gradId);
    grad.setAttribute("gradientUnits", "userSpaceOnUse");
    [["0%", "0.22"], ["65%", "0.55"], ["100%", "0.95"]].forEach(function (s) {
      var st = svgEl("stop");
      st.setAttribute("offset", s[0]);
      st.setAttribute("style", "stop-color:var(--helix-yol, #b9b3a4);stop-opacity:" + s[1]);
      grad.appendChild(st);
    });
    defs.appendChild(grad); sc.svg.appendChild(defs);
    sc.gradEl = grad;

    // "Buradasın" ışığı (2026-10-09, görsel taraması madde 5): okunan birim
    // (spec.current) arkasında yumuşak bir ışık hâlesiyle belirir -- ışık =
    // zuhûr. Keskin bir halka değil, merkezden sönen bir radyal gradyan
    // (GORSEL_DIL: iç içe çember yok).
    if (sc.hasCurrent) {
      sc.haleId = "helix-hale-" + uid;
      var hale = svgEl("radialGradient");
      hale.setAttribute("id", sc.haleId);
      [["0%", "0.62"], ["45%", "0.24"], ["100%", "0"]].forEach(function (s) {
        var st = svgEl("stop");
        st.setAttribute("offset", s[0]);
        st.setAttribute("style", "stop-color:var(--helix-gold, #e8b33a);stop-opacity:" + s[1]);
        hale.appendChild(st);
      });
      defs.appendChild(hale);
    }

    sc.pathEl = svgEl("path");
    sc.pathEl.setAttribute("class", "helix-scene__path");
    sc.pathEl.style.stroke = "url(#" + sc.gradId + ")";
    sc.svg.appendChild(sc.pathEl);
    if (sc.hasCurrent) {
      sc.haleEl = svgEl("circle");
      sc.haleEl.setAttribute("class", "helix-scene__hale");
      sc.haleEl.setAttribute("fill", "url(#" + sc.haleId + ")");
      sc.haleEl.setAttribute("aria-hidden", "true");
      sc.svg.appendChild(sc.haleEl);
    }
    if (sc.closing) {
      sc.ghostEl = svgEl("path");
      sc.ghostEl.setAttribute("class", "helix-scene__path helix-scene__path--ghost");
      sc.svg.appendChild(sc.ghostEl);
    }
    sc.gs = sc.nodes.map(function (node, i) {
      var g = svgEl("g");
      g.setAttribute("data-i", i);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "listitem");
      var ttl = svgEl("title");
      var c = svgEl("circle");
      var tx = svgEl("text");
      g.appendChild(ttl); g.appendChild(c); g.appendChild(tx);
      sc.svg.appendChild(g);
      return { g: g, title: ttl, circle: c, text: tx };
    });
    sc.order = "";
  }

  function draw(sc) {
    var span = Math.max(1, sc.nodes.length - 1);
    sc.pathEl.setAttribute("d", pathBetween(sc, 0, span, 120));
    // Işık-yolu gradyanının uçları: yolun başı (soluk) → sonu (belirgin).
    var gBas = projectT(sc, 0), gSon = projectT(sc, span);
    sc.gradEl.setAttribute("x1", gBas.x); sc.gradEl.setAttribute("y1", gBas.y);
    sc.gradEl.setAttribute("x2", gSon.x); sc.gradEl.setAttribute("y2", gSon.y);
    if (sc.ghostEl) {
      // Kısa tutuluyor (çeyrek tur): amaç bir tur daha çizmek değil,
      // "burada bitmiyor" demek. Uzun olduğunda sahnenin üstünü kaplayıp
      // asıl yolu okunmaz hâle getiriyordu (2026-07-29).
      sc.ghostEl.setAttribute("d",
        pathBetween(sc, span, span + span * 0.22 / Math.max(0.5, sc.turns), 30));
    }

    var pts = sc.nodes.map(function (node, i) {
      return { node: node, i: i, p: projectT(sc, i) };
    });

    // Okunan birimden uzaklık (sarmal üzerindeki sıra farkı) puslanma
    // olarak: yakındakiler net, uzaktakiler sönük -- uzaklık = kesret.
    // kappa düğüm sayısıyla ölçeklenir ki 27 fasta da 101 hadiste de
    // ışığın çevresinde birkaç komşu okunur kalsın.
    var cur = sc.hasCurrent ? sc.current : null;
    var kappa = Math.max(2.5, sc.nodes.length / 10);

    pts.forEach(function (it) {
      var p = it.p, node = it.node, el = sc.gs[it.i];
      var r = (it.i === cur ? 9.5 : (node.accent ? 8.5 : 6.4)) * p.depth;
      el.g.setAttribute("class", "helix-scene__node"
        + (node.accent ? " helix-scene__node--accent" : "")
        + (it.i === cur ? " is-current" : "")
        + (sc.focus === it.i ? " is-focus" : ""));
      if (cur != null) {
        var uz = Math.abs(it.i - cur);
        el.g.style.opacity = it.i === cur ? "1" : (0.16 + 0.84 * Math.exp(-uz / kappa)).toFixed(3);
        if (it.i === cur) el.g.setAttribute("aria-current", "true");
        else el.g.removeAttribute("aria-current");
        if (it.i === cur && sc.haleEl) {
          sc.haleEl.setAttribute("cx", p.x.toFixed(1));
          sc.haleEl.setAttribute("cy", p.y.toFixed(1));
          sc.haleEl.setAttribute("r", (30 * p.depth).toFixed(1));
        }
      }
      // labelMode "sparse": yalnız vurgulu ve odaktaki düğümün adı yazılır.
      // Kalabalık sahnelerde (yirmi yedi fasslı harita) hepsini yazmak
      // üst üste binen okunmaz bir yığın üretiyordu (2026-07-29).
      // labelMode "none": hiç etiket yazılmaz (101 düğümlü Mişkât sarmalı
      // gibi çok kalabalık sahnelerde "sparse" bile odak kaydıkça sürekli
      // metin belirip kaybolan bir gürültü üretiyordu, 2026-08-14). Erişilebilir
      // ad (title/aria-label) her durumda ayrıca yazılıyor, aşağıda.
      var goster = sc.labelMode === "none" ? false
        : sc.labelMode !== "sparse" ? true
        : (node.accent || sc.focus === it.i);
      // Sıra numarası: üç boyutlu perspektifte hangi düğümün önce geldiği
      // gözle anlaşılmıyordu (2026-07-29). Veriye dokunmadan, yalnız
      // gösterimde ekleniyor; etiket zaten numarayla başlıyorsa tekrarlanmaz.
      var ham = pick(node.label);
      var label = !goster ? ""
        : (sc.numbered && !/^\d/.test(ham) ? (it.i + 1) + " · " + ham : ham);
      if (el.__label !== label) {
        el.__label = label;
        el.__baseLen = null;   // genişlik yeniden ölçülecek (aşağıda)
        el.title.textContent = pick(node.label);
        el.text.textContent = label;
        el.g.setAttribute("aria-label", pick(node.label));
      }
      el.circle.setAttribute("cx", p.x.toFixed(1));
      el.circle.setAttribute("cy", p.y.toFixed(1));
      el.circle.setAttribute("r", r.toFixed(1));
      // Etiket, düğümün merkezden dışa bakan tarafına yazılır; yatayda
      // merkeze yakın olanlar ortalanır ki iki yandaki etiketler çakışmasın.
      var dx = p.x - sc.cx;
      var anchor = Math.abs(dx) < sc.baseR * 0.28 ? "middle" : (dx > 0 ? "start" : "end");
      var off = (anchor === "middle" ? 0 : (dx > 0 ? 1 : -1)) * (r + 7);
      el.text.setAttribute("x", (p.x + off).toFixed(1));
      el.text.setAttribute("y", (anchor === "middle" ? p.y - r - 8 : p.y + 4).toFixed(1));
      el.text.setAttribute("text-anchor", anchor);
      el.text.setAttribute("style", "font-size:" + (11.5 * p.depth).toFixed(1)
        + "px;opacity:" + (0.45 + 0.55 * p.depth).toFixed(2));
      it.anchor = anchor; it.lx = p.x + off; it.ly = anchor === "middle" ? p.y - r - 8 : p.y + 4; it.r = r;
    });

    // Etiket yerleşimi (2026-10-08 taraması): (1) kenara yakın etiketler
    // sahnenin dışına taşıyordu (mobilde "23. Lokmân" x=-25'ten başlıyordu)
    // -- sahne sınırına kenetlenir; (2) yirmi yedi fassın hepsi okunduğu
    // için "sparse" kip artık her adı yazıyor ve adlar birbirinin ve öndeki
    // düğümlerin üstüne biniyordu -- önce odaktaki, sonra öndeki (derin
    // olmayan) etiket yerleşir; çakışan arkadaki etiket o karede gizlenir.
    // Genişlik etiket değişince bir kez ölçülür (derinlikle orantılı).
    var yerlesen = [];
    var cemberler = pts.map(function (it) { return { x: it.p.x, y: it.p.y, r: it.r, z: it.p.depth, i: it.i }; });
    pts.slice().sort(function (a, b) {
      if (a.i === sc.focus) return -1;
      if (b.i === sc.focus) return 1;
      return b.p.depth - a.p.depth;
    }).forEach(function (it) {
      var el = sc.gs[it.i];
      if (!el.__label) { el.text.removeAttribute("visibility"); return; }
      if (el.__baseLen == null || el.__lenSurum !== fontSurumu) {
        el.__lenSurum = fontSurumu;
        try { el.__baseLen = el.text.getComputedTextLength() / Math.max(0.2, it.p.depth); } catch (e) { el.__baseLen = 0; }
      }
      var len = el.__baseLen * it.p.depth, fs = 11.5 * it.p.depth;
      var x0 = it.anchor === "start" ? it.lx : it.anchor === "end" ? it.lx - len : it.lx - len / 2;
      var kay = 0, pay = 4;
      if (x0 < pay) kay = pay - x0;
      else if (x0 + len > sc.w - pay) kay = (sc.w - pay) - (x0 + len);
      if (kay) { x0 += kay; el.text.setAttribute("x", (it.lx + kay).toFixed(1)); }
      var kutu = { x0: x0 - 3, x1: x0 + len + 3, y0: it.ly - fs * 1.0, y1: it.ly + fs * 0.4 };
      var carp = it.i !== sc.focus && (yerlesen.some(function (k) {
        return kutu.x0 < k.x1 && kutu.x1 > k.x0 && kutu.y0 < k.y1 && kutu.y1 > k.y0;
      }) || cemberler.some(function (c) {
        if (c.i === it.i || c.z <= it.p.depth) return false;   // yalnız öndeki düğümler engel
        var nx = Math.max(kutu.x0, Math.min(c.x, kutu.x1)), ny = Math.max(kutu.y0, Math.min(c.y, kutu.y1));
        return (nx - c.x) * (nx - c.x) + (ny - c.y) * (ny - c.y) < c.r * c.r;
      }));
      if (carp) el.text.setAttribute("visibility", "hidden");
      else { el.text.removeAttribute("visibility"); yerlesen.push(kutu); }
    });

    // Derinlik sıralaması (arkadakiler önce çizilsin) DOM sırasını
    // değiştirmeyi gerektiriyor, o da öğeyi kısa süre koparıyor. Bu yüzden
    // yalnız sıra GERÇEKTEN değiştiğinde ve kullanıcı sahneyle
    // uğraşmıyorken yapılıyor -- yani saniyede altmış kez değil, turda
    // birkaç kez.
    if (sc.hover) return;
    var sorted = pts.slice().sort(function (a, b) { return b.p.z - a.p.z; });
    var key = sorted.map(function (it) { return it.i; }).join(",");
    if (key === sc.order) return;
    sc.order = key;
    sorted.forEach(function (it) { sc.svg.appendChild(sc.gs[it.i].g); });
  }

  function renderNote(sc) {
    var node = sc.nodes[sc.focus];
    if (!node) { sc.note.innerHTML = ""; return; }
    var sira = pick({ tr: "Sırada", en: "Step", pt: "Passo" });
    sc.note.innerHTML =
      '<p class="helix-scene__note-label"><span class="helix-scene__note-no">'
      + (sc.focus + 1) + "/" + sc.nodes.length + "</span> "
      + esc(pick(node.label)) + "</p>"
      + (window.DostGraphUtils.has3(node.note) ? '<p class="helix-scene__note-body">' + pick(node.note) + "</p>" : "");
    // Gövdesi olmayan not (ayıklamada boşalan) yalnız başlık satırı kadar
    // yer kaplasın -- 5.2rem'lik boş kutu kalıyordu (2026-10-08 taraması).
    sc.note.classList.toggle("helix-scene__note--yalin", !window.DostGraphUtils.has3(node.note));
    sc.note.setAttribute("aria-label", sira);
  }

  function tick(ts) {
    rafId = null;
    var live = false;
    scenes.forEach(function (sc) {
      if (!sc.el.isConnected) return;
      // setCurrent'in dönüşü: sarmal, okunan birimi öne getirene kadar döner.
      if (sc.anim) {
        var k = sc.visible ? Math.min(1, (ts - sc.anim.t0) / sc.anim.dur) : 1;
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        sc.yaw = sc.anim.from + (sc.anim.to - sc.anim.from) * e;
        draw(sc);
        if (k >= 1) sc.anim = null;
        else live = true;
        sc.last = ts;
        return;
      }
      if (sc.spin && sc.visible && !sc.hover) {
        var dt = sc.last ? Math.min(64, ts - sc.last) : 16;
        sc.yaw += dt * SPIN_PER_MS * sc.spinSpeed * Math.PI * 2;
        draw(sc);
      }
      sc.last = ts;
      if (sc.spin) live = true;
    });
    scenes = scenes.filter(function (sc) { return sc.el.isConnected; });
    if (live && scenes.length) rafId = requestAnimationFrame(tick);
  }

  function ensureLoop() {
    if (rafId == null && scenes.length) rafId = requestAnimationFrame(tick);
  }

  function mount(el, spec) {
    if (!el || !spec || !spec.nodes || !spec.nodes.length) return null;
    var sc = {
      el: el,
      nodes: spec.nodes,
      turns: spec.turns || 1.25,
      closing: !!spec.closing,
      caption: spec.caption || null,
      yaw: -0.55,
      focus: spec.initialFocus != null ? spec.initialFocus : 0,
      hover: false,
      visible: true,
      last: 0,
      spin: !reducedMotion(),
      spinSpeed: spec.spinSpeed != null ? spec.spinSpeed : 1,
      onActivate: spec.onActivate || null,
      labelMode: spec.labelMode || "all",
      hRatio: spec.hRatio || 0.78,
      maxH: spec.maxH || 430,
      numbered: spec.numbered !== false,
      // "Buradasın" (spec.current: okunan birimin sırası). Verilince sahne
      // kendiliğinden dönmez: okunan birim önde durur, başka birim
      // seçilince (setCurrent) sarmal dönerek onu öne getirir.
      hasCurrent: spec.current != null,
      current: spec.current != null ? spec.current : null,
      anim: null,
    };
    if (sc.hasCurrent) {
      sc.focus = sc.current;
      sc.spin = false;
      sc.yaw = yawFor(sc, sc.current);
    }

    el.classList.add("helix-scene");
    el.innerHTML =
      '<svg class="helix-scene__svg" role="list" aria-label="'
      + esc(pick(spec.title) || (I18n && I18n.getLang() === "tr" ? "Sarmal şema" : "Spiral diagram"))
      + '"></svg>'
      + (spec.onActivate ? "" : '<div class="helix-scene__note" role="status" aria-live="polite"></div>');
    sc.svg = el.querySelector(".helix-scene__svg");
    sc.note = el.querySelector(".helix-scene__note");

    layout(sc);
    build(sc);
    draw(sc);
    if (!sc.onActivate) renderNote(sc);

    // Dönüş, üzerine gelindiğinde/odaklanıldığında durur: okurken sahnenin
    // altından kayması rahatsız ediciydi.
    // Dokunmatikte "üzerine gelme" diye bir şey yok: parmak inince
    // döndürmeyi hemen durduruyoruz, yoksa nişan alınan düğüm parmak
    // inerken altından kayıyor.
    el.addEventListener("pointerdown", function () { sc.hover = true; });
    el.addEventListener("pointerenter", function () { sc.hover = true; });
    el.addEventListener("pointerleave", function () { sc.hover = false; ensureLoop(); });
    el.addEventListener("focusin", function () { sc.hover = true; });
    el.addEventListener("focusout", function () { sc.hover = false; ensureLoop(); });

    // İki kullanım var: metin içindeki şemalarda tıklama düğümün notunu
    // açar; Füsûs açılışındaki fasıl sarmalında ise o fasla gider. İkincisi
    // için `onActivate` veriliyor ve o zaman not paneli hiç kullanılmıyor.
    function selectFrom(target) {
      var g = target.closest && target.closest(".helix-scene__node");
      if (!g) return;
      sc.focus = +g.dataset.i;
      draw(sc);
      if (sc.onActivate) sc.onActivate(sc.nodes[sc.focus], sc.focus);
      else renderNote(sc);
    }
    // Dönen bir sahnede tam olarak küçük bir dairenin üstüne basmak zor --
    // özellikle dokunmatikte. Bu yüzden seçim, basılan noktaya EN YAKIN
    // düğümü alıyor (cömert bir yarıçap içinde); böylece nişan biraz
    // kaysa da doğru düğüm açılıyor. Basar basmaz dönüş de duruyor.
    function nearest(e) {
      var r = sc.svg.getBoundingClientRect();
      if (!r.width || !r.height) return -1;
      var vb = sc.svg.viewBox.baseVal;
      var x = (e.clientX - r.left) / r.width * (vb.width || r.width);
      var y = (e.clientY - r.top) / r.height * (vb.height || r.height);
      var best = -1, bestD = Infinity;
      sc.nodes.forEach(function (_, i) {
        var p = projectT(sc, i);
        var d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
        if (d < bestD) { bestD = d; best = i; }
      });
      // 34 birimlik hoşgörü: düğüm yarıçapının yaklaşık dört katı.
      return bestD <= 34 * 34 ? best : -1;
    }

    sc.svg.addEventListener("click", function (e) {
      // Önce doğrudan isabet (daire ya da ETİKET), sonra en yakın düğüm.
      // Sıra önemli: etiket kendi düğümünün merkezinden uzakta olabiliyor,
      // "en yakın"ı önce sorarsak yanlış düğümü açardık.
      var hit = e.target.closest && e.target.closest(".helix-scene__node");
      var i = hit ? +hit.dataset.i : nearest(e);
      if (i < 0) { selectFrom(e.target); return; }
      sc.focus = i;
      draw(sc);
      // Odağı seçilen düğüme taşı: tıklamayla başlayıp ok tuşlarıyla devam
      // etmek mümkün olsun. preventScroll, sayfanın zıplamasını engelliyor.
      try { sc.gs[i].g.focus({ preventScroll: true }); } catch (err) { /* eski tarayıcı */ }
      if (sc.onActivate) sc.onActivate(sc.nodes[i], i);
      else renderNote(sc);
    });
    sc.svg.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectFrom(e.target); return; }
      var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
        : (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0);
      if (!d) return;
      e.preventDefault();
      sc.focus = (sc.focus + d + sc.nodes.length) % sc.nodes.length;
      draw(sc);
      if (!sc.onActivate) renderNote(sc);
      var g = sc.svg.querySelector('.helix-scene__node[data-i="' + sc.focus + '"]');
      if (g) g.focus();
    });

    // Görünmüyorken dönmesin (pil/işlemci); ayrıca genişlik değişince yeniden
    // yerleştir -- svg genişliği 0 iken kurulan sahne bozuk çıkıyordu.
    if (window.IntersectionObserver) {
      sc.io = new IntersectionObserver(function (entries) {
        sc.visible = entries.some(function (en) { return en.isIntersecting; });
        if (sc.visible) ensureLoop();
      }, { threshold: 0.05 });
      sc.io.observe(el);
    }
    if (window.ResizeObserver) {
      sc.ro = new ResizeObserver(function () { layout(sc); draw(sc); });
      sc.ro.observe(el);
    }

    scenes.push(sc);
    ensureLoop();

    return {
      setLang: function () {
        // Etiket metni yalnız değişince yazılıyor; dil değişiminde
        // önbelleği temizlemezsek eski dilde kalırdı.
        sc.gs.forEach(function (el) { el.__label = null; });
        draw(sc); if (!sc.onActivate) renderNote(sc);
      },
      relayout: function () { layout(sc); draw(sc); },
      // Okunan birim değişti: ışık ona geçer, sarmal en kısa yönden dönüp
      // onu öne getirir (derinlik = yaklaşma). Hareket kısıtlaması açıksa
      // dönüş anlıktır -- atlanır, taklit edilmez (ETKILESIM_DILI, kapılar).
      setCurrent: function (i) {
        if (!sc.hasCurrent || i == null || i < 0 || i >= sc.nodes.length) return;
        sc.current = i;
        sc.focus = i;
        var hedef = yawFor(sc, i);
        var fark = hedef - sc.yaw;
        fark = Math.atan2(Math.sin(fark), Math.cos(fark));
        if (reducedMotion() || !sc.visible || Math.abs(fark) < 0.001) {
          sc.anim = null;
          sc.yaw = sc.yaw + fark;
          draw(sc);
          return;
        }
        sc.anim = { from: sc.yaw, to: sc.yaw + fark, t0: performance.now(), dur: 520 + 380 * Math.abs(fark) / Math.PI };
        draw(sc);
        ensureLoop();
      },
      destroy: function () {
        if (sc.io) sc.io.disconnect();
        if (sc.ro) sc.ro.disconnect();
        scenes = scenes.filter(function (x) { return x !== sc; });
        el.innerHTML = "";
      },
    };
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) ensureLoop();
  });

  // --- Şerit kipi (2026-10-09, görsel taraması madde 14) ----------------------
  // Mobilde açılış sarmalı okumayı ilk ekranın altına itiyordu (Mişkât'ta
  // hadis metni 1566 px'te başlıyordu). Aynı sarmal burada yatay bir eksen
  // etrafında, 56 px'lik yapışkan bir şeride iniyor: okunan birim ortada ve
  // önde, ışıkla; komşuları sarmal üzerinde arkaya dolanıp uzaklıkla
  // sönüyor. Başka birim seçilince şerit kayarken sarmal döner ve o birim
  // öne gelir. Görünüm yandan bakılan bir sarmal: y = A·sin θ, derinlik =
  // cos θ (θ = 0 önde). Perspektif kutusu yok; derinlik yalnız boyut ve
  // matlıkla (atmosferik) okunur.
  //
  // spec = { nodes:[{id,label,disabled?}], current, onActivate(node,i),
  //          title:{tr,en,pt}, perTurn (vars. 9), gap (vars. 15) }
  function mountStrip(el, spec) {
    if (!el || !spec || !spec.nodes || !spec.nodes.length) return null;
    var st = {
      nodes: spec.nodes,
      current: spec.current || 0,
      preview: spec.current || 0,
      pos: spec.current || 0,
      perTurn: spec.perTurn || 9,
      gap: spec.gap || 15,
      anim: null, raf: null, w: 0, h: 56,
    };
    el.classList.add("helix-serit");
    el.innerHTML = '<svg class="helix-serit__svg" tabindex="0" role="group"></svg>'
      + '<span class="helix-serit__sayac" aria-hidden="true"></span>'
      + '<span class="helix-serit__canli" role="status" aria-live="polite"></span>';
    var svg = el.querySelector("svg");
    var sayac = el.querySelector(".helix-serit__sayac");
    var canli = el.querySelector(".helix-serit__canli");
    var id = "helix-serit-" + (++uid);
    svg.innerHTML = '<defs>'
      + '<linearGradient id="' + id + '-kenar" gradientUnits="objectBoundingBox" x1="0" x2="1" y1="0" y2="0">'
      + '<stop offset="0" style="stop-color:var(--helix-yol, #b9b3a4);stop-opacity:0"/>'
      + '<stop offset="0.18" style="stop-color:var(--helix-yol, #b9b3a4);stop-opacity:0.9"/>'
      + '<stop offset="0.82" style="stop-color:var(--helix-yol, #b9b3a4);stop-opacity:0.9"/>'
      + '<stop offset="1" style="stop-color:var(--helix-yol, #b9b3a4);stop-opacity:0"/></linearGradient>'
      + '<radialGradient id="' + id + '-hale">'
      + '<stop offset="0%" style="stop-color:var(--helix-gold, #e8b33a);stop-opacity:0.7"/>'
      + '<stop offset="45%" style="stop-color:var(--helix-gold, #e8b33a);stop-opacity:0.25"/>'
      + '<stop offset="100%" style="stop-color:var(--helix-gold, #e8b33a);stop-opacity:0"/></radialGradient>'
      + '</defs>'
      + '<path class="helix-serit__yol helix-serit__yol--arka" stroke="url(#' + id + '-kenar)"/>'
      + '<circle class="helix-serit__hale" fill="url(#' + id + '-hale)" r="22"/>'
      + '<g class="helix-serit__dugumler"></g>'
      + '<path class="helix-serit__yol helix-serit__yol--on" stroke="url(#' + id + '-kenar)"/>'
      + '<g class="helix-serit__on-dugumler"></g>';
    var yolArka = svg.querySelector(".helix-serit__yol--arka");
    var yolOn = svg.querySelector(".helix-serit__yol--on");
    var hale = svg.querySelector(".helix-serit__hale");
    var arkaG = svg.querySelector(".helix-serit__dugumler");
    var onG = svg.querySelector(".helix-serit__on-dugumler");
    var circles = st.nodes.map(function (n, i) {
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("class", "helix-serit__dugum" + (n.disabled ? " is-planned" : ""));
      c.setAttribute("data-i", i);
      return c;
    });

    function etiket(i) { return pick(st.nodes[i] && st.nodes[i].label); }
    function aria() {
      svg.setAttribute("aria-label", pick(spec.title) + " — "
        + pick({ tr: "buradasın", en: "you are here", pt: "você está aqui" }) + ": "
        + etiket(st.current) + " (" + (st.current + 1) + "/" + st.nodes.length + ")");
    }

    function draw() {
      var w = el.clientWidth;
      if (!w) return;
      if (w !== st.w) { st.w = w; svg.setAttribute("viewBox", "0 0 " + w + " " + st.h); }
      var cx = w / 2, cy = st.h / 2, A = 13, gap = st.gap, P = st.perTurn;
      var yari = cx / gap + 1.5;
      // İplik: önde kalan yarısı düğümlerin önünden, arkadaki yarısı
      // arkasından geçer -- sarmalın dolanışı böyle okunur. İplik ekranda
      // yerinde durur; kayan düğümlerdir: birim ortaya gelirken sarmal
      // boyunca dolanıp öne çıkar.
      var on = "", arka = "", oncekiOn = null;
      for (var s = -yari; s <= yari + 1e-6; s += 0.125) {
        var th = s * 2 * Math.PI / P;
        var x = cx + s * gap, y = cy + A * Math.sin(th);
        var onde = Math.cos(th) >= 0;
        var seg = x.toFixed(1) + "," + y.toFixed(1);
        if (onde) { on += (oncekiOn === true ? "L" : "M") + seg; }
        else { arka += (oncekiOn === false ? "L" : "M") + seg; }
        oncekiOn = onde;
      }
      yolOn.setAttribute("d", on);
      yolArka.setAttribute("d", arka);
      var bas = Math.max(0, Math.floor(st.pos - yari)), son = Math.min(st.nodes.length - 1, Math.ceil(st.pos + yari));
      circles.forEach(function (c, i) {
        if (i < bas || i > son) { if (c.parentNode) c.parentNode.removeChild(c); return; }
        var s = i - st.pos;
        var th = s * 2 * Math.PI / P;
        var d = (1 + Math.cos(th)) / 2;
        var x = cx + s * gap, y = cy + A * Math.sin(th);
        var uz = Math.abs(i - st.current);
        // Klavyeyle dolaşırken bakılan düğüm (önizleme) büyür ve vurgu
        // rengini alır -- çevresine halka çizilmez (iç içe çember yasağı).
        var bakilan = i === st.preview && st.preview !== st.current && document.activeElement === svg;
        var r = i === st.current ? 6.2 : (bakilan ? 5.2 : 2 + 2.6 * d);
        var kenar = Math.max(0, 1 - Math.max(0, Math.abs(s) * gap - (cx - 40)) / 40);
        var o = i === st.current || bakilan ? 1 : (0.28 + 0.72 * d) * (0.25 + 0.75 * Math.exp(-uz / 6)) * kenar;
        c.setAttribute("cx", x.toFixed(1));
        c.setAttribute("cy", y.toFixed(1));
        c.setAttribute("r", r.toFixed(2));
        c.style.opacity = o.toFixed(3);
        c.classList.toggle("is-current", i === st.current);
        c.classList.toggle("is-preview", bakilan);
        var hedefG = Math.cos(th) >= 0 || bakilan ? onG : arkaG;
        if (c.parentNode !== hedefG) hedefG.appendChild(c);
        if (i === st.current) { hale.setAttribute("cx", x.toFixed(1)); hale.setAttribute("cy", y.toFixed(1)); }
      });
      sayac.textContent = (st.preview + 1) + " / " + st.nodes.length;
    }

    function animTo(hedef) {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = null;
      if (reducedMotion() || !el.clientWidth || Math.abs(hedef - st.pos) < 0.001) {
        st.pos = hedef; draw(); return;
      }
      var from = st.pos, t0 = performance.now();
      var dur = Math.min(900, 380 + 40 * Math.sqrt(Math.abs(hedef - from)) * 10);
      function adim(ts) {
        var k = Math.min(1, (ts - t0) / dur);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        st.pos = from + (hedef - from) * e;
        draw();
        st.raf = k < 1 ? requestAnimationFrame(adim) : null;
      }
      st.raf = requestAnimationFrame(adim);
    }

    // Seçim: şeride dokunulan yere en yakın düğüm (yatay mesafe öncelikli).
    svg.addEventListener("click", function (e) {
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      var x = e.clientX - r.left;
      var i = Math.round(st.pos + (x - r.width / 2) / st.gap);
      i = Math.max(0, Math.min(st.nodes.length - 1, i));
      if (st.nodes[i].disabled) return;
      if (spec.onActivate) spec.onActivate(st.nodes[i], i);
    });
    // Klavye: ←/→ sarmal üzerinde dolaşır (şerit döner, değinmek), Enter
    // açar (seçmek). Odak şeritten çıkınca bakış okunan birime döner.
    svg.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!st.nodes[st.preview].disabled && spec.onActivate) spec.onActivate(st.nodes[st.preview], st.preview);
        return;
      }
      var d = e.key === "ArrowRight" ? 1 : (e.key === "ArrowLeft" ? -1 : 0);
      if (!d) return;
      e.preventDefault();
      st.preview = Math.max(0, Math.min(st.nodes.length - 1, st.preview + d));
      canli.textContent = etiket(st.preview);
      animTo(st.preview);
    });
    svg.addEventListener("blur", function () {
      if (st.preview !== st.current) { st.preview = st.current; animTo(st.current); }
      else draw();
    });
    svg.addEventListener("focus", draw);

    var ro = window.ResizeObserver ? new ResizeObserver(function () { draw(); }) : null;
    if (ro) ro.observe(el);
    aria();
    draw();

    return {
      setCurrent: function (i) {
        if (i == null || i < 0 || i >= st.nodes.length) return;
        st.current = i; st.preview = i;
        aria();
        animTo(i);
      },
      setLang: function () { aria(); draw(); },
      destroy: function () {
        if (ro) ro.disconnect();
        if (st.raf) cancelAnimationFrame(st.raf);
        el.innerHTML = "";
      },
    };
  }

  window.DostHelix = { mount: mount, mountStrip: mountStrip };
})();

/* Kısım sarmalı (2026-10-09) -- Fütûhât'ın bütün kısımları tek bir dikey
 * sarmalda: her cilt bir tur, kısımlar o turun üstünde sırayla.
 *
 * Neden: "Neredeyim" haritası üç eşmerkezli halkaydı (sifr/cilt/kısım) --
 * görsel gramerin "iç içe çember çizme" yasağı, ve dilimleri okunmuyordu.
 * CLAUDE.md'nin "halka ile sarmal arasında seçim varken sarmal" ilkesi ve
 * hal.js'in helixPoint/project deseni burada kısımlara uygulanıyor.
 *
 * Görsel gramer (GORSEL_DIL.md): o anki kısım IŞIKLA belirir (zuhûr);
 * henüz okunmamış kısımlar BULANIK (bilgisizlik: okumadık); arkada kalan
 * noktalar atmosferik puslanır (sahte 3B yok). Sifr sınırları, sarmalın
 * kendi üstünde ince kuşaklar -- metinde açıkça anılan aralıklar; sifri
 * belirsiz kısımlar kuşaksız kalır (tahminle doldurulmaz).
 *
 * Etkileşim (ETKILESIM_DILI.md): sürüklemek sarmalı döndürür (değeri değil
 * bakışı değiştirir); bir noktaya değinmek (hover / ok tuşları) adını
 * gösterir; seçmek (tıklama / Enter) o kısmı açar. Yalın tekerlek hiçbir
 * şey yapmaz (sayfa kaydırması kullanıcınındır). Kısım listesi veriden
 * okunur -- sabit sayı yok (atlasa yeni kısım eklendikçe sarmal uzar).
 *
 *   var s = DostHelix.kisimSarmali(el, {
 *     ciltler: [{cilt, k0, k1}],          // cildin tam kısım aralığı
 *     parca: function (k) { return {id, baslik:{tr,en,pt}} | null },
 *     sifir: [{sifr, k0, k1}],            // (ops.) kesin sifr aralıkları
 *     aktifId: "c1k3",                    // (ops.) ışıkla belirecek kısım
 *     parlaklik: {"c1k3": 1.2, ...},      // (ops.) kavram kipi: yoğunluk
 *     onSec: function (id) {},            // seçilince
 *     kucuk: false,                       // kavram sayfasındaki küçük kopya
 *     baslik: {tr,en,pt},                 // erişilebilir ad
 *   });
 *   s.setAktif(id); s.setLang(); s.destroy();
 */
(function () {
  "use strict";

  var I18n = window.DostI18n;
  var SVGNS = "http://www.w3.org/2000/svg";
  var TILT = 0.2;            // yukarıdan bakış: uzak taraf biraz yukarıda
  var ORNEK = 48;            // tur başına yol örneği
  var uid = 0;

  function pick(o) { return !o ? "" : (I18n && I18n.pick3 ? I18n.pick3(o) : (o.tr || o.en || o.pt || "")); }
  function svgEl(name, attrs) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function roman(n) {
    var r = "", v = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    v.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } });
    return r;
  }
  function stripTags(s) { return String(s || "").replace(/<[^>]*>/g, ""); }

  function kisimSarmali(el, o) {
    if (!el || !o || !o.ciltler || !o.ciltler.length) return null;
    var id = "ks" + (++uid);
    var kucuk = !!o.kucuk;
    var kavramKipi = !!o.parlaklik;

    // --- yuvalar: her cildin her kısmı, okunmuş ya da okunmamış ----------
    var ciltler = o.ciltler.slice().sort(function (a, b) { return a.k0 - b.k0; });
    var yuvalar = [];
    ciltler.forEach(function (c, ci) {
      var n = Math.max(1, c.k1 - c.k0 + 1);
      for (var j = 0; j < n; j++) {
        var k = c.k0 + j;
        var p = o.parca ? o.parca(k) : null;
        yuvalar.push({ i: yuvalar.length, ci: ci, cilt: c.cilt, k: k, n: n, t: ci + (j + 0.5) / n, parca: p });
      }
    });
    var enCok = 0;
    if (kavramKipi) {
      yuvalar.forEach(function (y) {
        var v = y.parca ? o.parlaklik[y.parca.id] : null;
        y.deger = v == null ? 0 : v;
        if (y.deger > enCok) enCok = y.deger;
      });
    }
    function secilebilir(y) { return !!y.parca && (!kavramKipi || y.deger > 0); }
    var secenekler = yuvalar.filter(secilebilir);
    function yuvaById(pid) {
      for (var i = 0; i < yuvalar.length; i++) if (yuvalar[i].parca && yuvalar[i].parca.id === pid) return yuvalar[i];
      return null;
    }
    // Sifr kuşakları: kısım numarası aralığı -> sarmal üzerindeki t aralığı.
    var kusaklar = (o.sifir || []).map(function (s) {
      var ilk = null, son = null;
      yuvalar.forEach(function (y) { if (y.k >= s.k0 && y.k <= s.k1) { if (!ilk) ilk = y; son = y; } });
      if (!ilk) return null;
      return { sifr: s.sifr, k0: s.k0, k1: s.k1, t0: ilk.t - 0.5 / ilk.n, t1: son.t + 0.5 / son.n, adet: son.i - ilk.i + 1 };
    }).filter(Boolean);
    function sifrOf(k) {
      for (var i = 0; i < kusaklar.length; i++) if (k >= kusaklar[i].k0 && k <= kusaklar[i].k1) return kusaklar[i].sifr;
      return null;
    }

    var st = {
      yaw: 0, hedefYaw: null, aktif: o.aktifId ? yuvaById(o.aktifId) : null,
      deg: null, surukle: null, raf: null,
    };

    // --- DOM -----------------------------------------------------------
    el.classList.add("kisim-sarmali");
    if (kucuk) el.classList.add("kisim-sarmali--kucuk");
    if (kavramKipi) el.classList.add("kisim-sarmali--kavram");
    el.textContent = "";
    var svg = svgEl("svg", { "class": "kisim-sarmali__svg", tabindex: "0", role: "listbox" });
    var ad = document.createElement("p");
    ad.className = "kisim-sarmali__ad";
    ad.setAttribute("aria-live", "polite");
    el.appendChild(svg);
    el.appendChild(ad);

    var defs = svgEl("defs");
    var blur = svgEl("filter", { id: id + "-bulanik", x: "-200%", y: "-200%", width: "500%", height: "500%" });
    blur.appendChild(svgEl("feGaussianBlur", { stdDeviation: kucuk ? "0.9" : "1.3" }));
    defs.appendChild(blur);
    var isik = svgEl("radialGradient", { id: id + "-isik" });
    [["0%", "0.9"], ["45%", "0.35"], ["100%", "0"]].forEach(function (s) {
      isik.appendChild(svgEl("stop", { offset: s[0], style: "stop-color:var(--helix-gold, #ffc233);stop-opacity:" + s[1] }));
    });
    defs.appendChild(isik);
    svg.appendChild(defs);

    var gKusak = svgEl("g", { "class": "kisim-sarmali__kusaklar", "aria-hidden": "true" });
    var kusakEls = kusaklar.map(function (ku) {
      var p = svgEl("path", { "class": "kisim-sarmali__kusak" + (ku.sifr % 2 ? "" : " kisim-sarmali__kusak--cift") });
      gKusak.appendChild(p);
      var tx = null;
      if (!kucuk && ku.adet >= 3) {
        tx = svgEl("text", { "class": "kisim-sarmali__kusak-ad", "text-anchor": "end" });
        tx.textContent = roman(ku.sifr);
        gKusak.appendChild(tx);
      }
      return { p: p, tx: tx, ku: ku };
    });
    svg.appendChild(gKusak);
    var yolArka = svgEl("path", { "class": "kisim-sarmali__yol kisim-sarmali__yol--arka", "aria-hidden": "true" });
    var yolBulanik = svgEl("path", { "class": "kisim-sarmali__yol kisim-sarmali__yol--bulanik", filter: "url(#" + id + "-bulanik)", "aria-hidden": "true" });
    var yolOn = svgEl("path", { "class": "kisim-sarmali__yol kisim-sarmali__yol--on", "aria-hidden": "true" });
    svg.appendChild(yolArka); svg.appendChild(yolBulanik); svg.appendChild(yolOn);
    var gNokta = svgEl("g", { "class": "kisim-sarmali__noktalar" });
    svg.appendChild(gNokta);
    yuvalar.forEach(function (y) {
      var g = svgEl("g");
      var cls = "kisim-sarmali__nokta";
      if (!y.parca) cls += " kisim-sarmali__nokta--okunmadi";
      else if (kavramKipi && !y.deger) cls += " kisim-sarmali__nokta--yok";
      g.setAttribute("class", cls);
      if (secilebilir(y)) {
        g.setAttribute("role", "option");
        g.setAttribute("id", id + "-k" + y.k);
      } else {
        g.setAttribute("aria-hidden", "true");
      }
      var halo = null;
      if (kavramKipi && y.deger > 0) {
        halo = svgEl("circle", { "class": "kisim-sarmali__hale", fill: "url(#" + id + "-isik)" });
        g.appendChild(halo);
      }
      var c = svgEl("circle");
      if (!y.parca) c.setAttribute("filter", "url(#" + id + "-bulanik)");
      g.appendChild(c);
      gNokta.appendChild(g);
      y.g = g; y.c = c; y.halo = halo;
    });
    // O anki kısmın ışığı ve değinilen noktanın işareti: noktaların üstünde
    // ayrı katmanlar (her karede ilgili yuvanın yerine taşınır).
    var aktifIsik = svgEl("circle", { "class": "kisim-sarmali__isik", fill: "url(#" + id + "-isik)", "aria-hidden": "true" });
    var aktifCekirdek = svgEl("circle", { "class": "kisim-sarmali__cekirdek", "aria-hidden": "true" });
    var degIsaret = svgEl("circle", { "class": "kisim-sarmali__deg", "aria-hidden": "true" });
    svg.appendChild(aktifIsik); svg.appendChild(aktifCekirdek); svg.appendChild(degIsaret);

    // --- geometri ------------------------------------------------------
    var G = {};
    function layout() {
      var w = el.clientWidth || 190;
      var genis = w > 260;                     // mobilde kenar çubuğu tam genişlik
      var R = kucuk ? Math.max(48, Math.min(84, w / 2 - 12))
        : Math.max(44, Math.min(genis ? 104 : 66, w / 2 - 30));
      var turH = kucuk ? 13 : (genis ? 20 : 17);
      var ust = 10 + R * TILT;
      var h = Math.round(ust + ciltler.length * turH + R * TILT + 12);
      G = { w: w, h: h, R: R, turH: turH, ust: ust, cx: w / 2, foc: R * 5 };
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.setAttribute("width", w);
      svg.setAttribute("height", h);
    }
    function nokta(t) {
      var a = Math.PI * 2 * t + st.yaw;
      var x3 = G.R * Math.cos(a), z3 = G.R * Math.sin(a);   // z3 > 0: uzak
      var d = G.foc / (G.foc + z3);
      return {
        x: G.cx + x3 * d,
        y: G.ust + t * G.turH - z3 * TILT,
        d: d,
        f: (1 - z3 / G.R) / 2,   // 0 en uzak, 1 en yakın
      };
    }
    var ciltIlk = ciltler.map(function (_, ci) {
      for (var i = 0; i < yuvalar.length; i++) if (yuvalar[i].ci === ci) return i;
      return 0;
    });
    function yuvaOf(t) {
      var ci = Math.min(ciltler.length - 1, Math.max(0, Math.floor(t)));
      var ilkI = ciltIlk[ci], n = yuvalar[ilkI].n;
      return yuvalar[ilkI + Math.min(n - 1, Math.max(0, Math.floor((t - ci) * n)))];
    }

    function ciz() {
      st.raf = null;
      // Yol üç kovada: önde (okunmuş), arkada (okunmuş), bulanık (okunmamış).
      var kova = { on: "", arka: "", bulanik: "" }, son = { on: -9, arka: -9, bulanik: -9 };
      var N = ciltler.length * ORNEK, onceki = nokta(0);
      for (var s = 1; s <= N; s++) {
        var p = nokta(s / ORNEK);
        var y = yuvaOf((s - 0.5) / ORNEK);
        var k = !y.parca ? "bulanik" : (p.f + onceki.f) / 2 < 0.5 ? "arka" : "on";
        if (son[k] !== s - 1) kova[k] += "M" + onceki.x.toFixed(1) + "," + onceki.y.toFixed(1);
        kova[k] += "L" + p.x.toFixed(1) + "," + p.y.toFixed(1);
        son[k] = s; onceki = p;
      }
      yolOn.setAttribute("d", kova.on);
      yolArka.setAttribute("d", kova.arka);
      yolBulanik.setAttribute("d", kova.bulanik);

      var sonEtiketY = -Infinity;
      kusakEls.forEach(function (e) {
        var d = "", adim = Math.max(2, Math.ceil((e.ku.t1 - e.ku.t0) * ORNEK));
        for (var s2 = 0; s2 <= adim; s2++) {
          var q = nokta(e.ku.t0 + (e.ku.t1 - e.ku.t0) * s2 / adim);
          d += (s2 ? "L" : "M") + q.x.toFixed(1) + "," + q.y.toFixed(1);
        }
        e.p.setAttribute("d", d);
        if (e.tx) {
          // Sifr numarası sol payda, kuşağın ortasının hizasında; bir
          // öncekine fazla yakınsa yazılmaz (kalabalık değil, işaret).
          var ty = G.ust + ((e.ku.t0 + e.ku.t1) / 2) * G.turH + 3;
          e.tx.setAttribute("x", (G.cx - G.R - 8).toFixed(1));
          e.tx.setAttribute("y", ty.toFixed(1));
          if (ty - sonEtiketY < 13) e.tx.setAttribute("visibility", "hidden");
          else { e.tx.removeAttribute("visibility"); sonEtiketY = ty; }
        }
      });

      var tabanR = kucuk ? 1.9 : 2.3;
      yuvalar.forEach(function (y) {
        var p = nokta(y.t);
        y.p = p;
        var r = tabanR;
        if (kavramKipi) {
          if (y.deger > 0) {
            var guc = Math.sqrt(y.deger / (enCok || 1));
            r = 1.8 + guc * (kucuk ? 2.6 : 3.2);
            y.halo.setAttribute("cx", p.x.toFixed(1));
            y.halo.setAttribute("cy", p.y.toFixed(1));
            y.halo.setAttribute("r", (r * 2.1 * p.d).toFixed(1));
            y.halo.setAttribute("opacity", (0.12 + 0.5 * guc).toFixed(2));
          } else {
            r = 1.2;
          }
        }
        y.c.setAttribute("cx", p.x.toFixed(1));
        y.c.setAttribute("cy", p.y.toFixed(1));
        y.c.setAttribute("r", (r * p.d).toFixed(2));
        // Atmosferik puslanma: uzak nokta daha az çözünür.
        y.g.setAttribute("opacity", (0.38 + 0.62 * p.f).toFixed(2));
      });

      if (st.aktif && !kavramKipi) {
        var a = st.aktif.p;
        aktifIsik.setAttribute("cx", a.x.toFixed(1)); aktifIsik.setAttribute("cy", a.y.toFixed(1));
        aktifIsik.setAttribute("r", ((kucuk ? 9 : 13) * a.d).toFixed(1));
        aktifIsik.setAttribute("opacity", (0.55 + 0.45 * a.f).toFixed(2));
        aktifCekirdek.setAttribute("cx", a.x.toFixed(1)); aktifCekirdek.setAttribute("cy", a.y.toFixed(1));
        aktifCekirdek.setAttribute("r", (4.2 * a.d).toFixed(1));
        aktifIsik.removeAttribute("visibility"); aktifCekirdek.removeAttribute("visibility");
      } else {
        aktifIsik.setAttribute("visibility", "hidden"); aktifCekirdek.setAttribute("visibility", "hidden");
      }
      if (st.deg) {
        var dp = st.deg.p;
        degIsaret.setAttribute("cx", dp.x.toFixed(1)); degIsaret.setAttribute("cy", dp.y.toFixed(1));
        degIsaret.setAttribute("r", (5.4 * dp.d).toFixed(1));
        degIsaret.removeAttribute("visibility");
      } else {
        degIsaret.setAttribute("visibility", "hidden");
      }
    }
    function istek() { if (!st.raf) st.raf = requestAnimationFrame(ciz); }

    // --- ad satırı -----------------------------------------------------
    function yuvaAdi(y, kisa) {
      var cilt = pick({ tr: "Cilt ", en: "Volume ", pt: "Volume " }) + roman(y.cilt);
      var kis = pick({ tr: "Kısım ", en: "Part ", pt: "Parte " }) + roman(y.k);
      var bas = y.parca ? stripTags(pick(y.parca.baslik))
        : pick({ tr: "henüz okunmadı", en: "not yet read", pt: "ainda não lido" });
      var sf = sifrOf(y.k);
      var ust = cilt + " · " + kis + (sf ? " · Sifr " + roman(sf) : "");
      if (kisa) return ust + (bas ? " — " + bas : "");
      return { ust: ust, bas: bas };
    }
    function adYaz() {
      var y = st.deg || st.aktif;
      ad.textContent = "";
      ad.classList.toggle("kisim-sarmali__ad--bos", !y);
      if (!y) {
        if (kavramKipi) {
          ad.textContent = pick({ tr: "Bir noktaya değin: kısmın adı burada görünür.", en: "Point at a dot: the part's name appears here.", pt: "Aponte para um ponto: o nome da parte aparece aqui." });
        }
        return;
      }
      var a = yuvaAdi(y);
      var u = document.createElement("span"); u.className = "kisim-sarmali__ad-ust"; u.textContent = a.ust;
      var b = document.createElement("span"); b.className = "kisim-sarmali__ad-bas"; b.textContent = a.bas;
      ad.appendChild(u);
      if (a.bas) ad.appendChild(b);
      if (kavramKipi && y.deger > 0) {
        var v = document.createElement("span"); v.className = "kisim-sarmali__ad-deger";
        v.textContent = String(y.deger).replace(".", pick({ tr: ",", en: ".", pt: "," })) + "‰";
        ad.appendChild(v);
      }
    }
    function ariaYaz() {
      svg.setAttribute("aria-label", pick(o.baslik) || pick({ tr: "Kısım sarmalı", en: "Spiral of parts", pt: "Espiral das partes" }));
      secenekler.forEach(function (y) {
        y.g.setAttribute("aria-label", yuvaAdi(y, true) + (kavramKipi ? " · " + y.deger + "‰" : ""));
        y.g.setAttribute("aria-selected", st.aktif === y ? "true" : "false");
      });
      if (st.deg && st.deg.g.id) svg.setAttribute("aria-activedescendant", st.deg.g.id);
      else svg.removeAttribute("aria-activedescendant");
    }
    function setDeg(y) {
      if (st.deg === y) return;
      st.deg = y;
      if (y && y.g.id) svg.setAttribute("aria-activedescendant", y.g.id);
      else svg.removeAttribute("aria-activedescendant");
      adYaz(); istek();
    }

    // --- dönüş ---------------------------------------------------------
    // Bir yuvayı öne (izleyiciye en yakın noktaya) getiren yaw.
    function oneYaw(y) { return -Math.PI / 2 - Math.PI * 2 * y.t; }
    function dondur(hedef, aninda) {
      // En kısa yoldan: hedefi mevcut yaw'a en yakın 2π katına çek.
      var tur = Math.PI * 2;
      hedef = hedef + tur * Math.round((st.yaw - hedef) / tur);
      if (aninda || reducedMotion()) { st.yaw = hedef; st.hedefYaw = null; istek(); return; }
      st.hedefYaw = hedef;
      var bas = st.yaw, t0 = null;
      function adim(ts) {
        if (st.hedefYaw !== hedef) return;           // başka bir dönüş başladı
        if (t0 == null) t0 = ts;
        var u = Math.min(1, (ts - t0) / 420);
        st.yaw = bas + (hedef - bas) * (1 - Math.pow(1 - u, 3));
        ciz();
        if (u < 1) requestAnimationFrame(adim); else st.hedefYaw = null;
      }
      requestAnimationFrame(adim);
    }

    // --- işaretçi: sürükle = döndür, değin = ad, seç = aç ----------------
    function enYakin(e, sadeceSecilebilir) {
      var r = svg.getBoundingClientRect();
      if (!r.width) return null;
      var qx = (e.clientX - r.left) * (G.w / r.width), qy = (e.clientY - r.top) * (G.h / r.height);
      var best = null, bestD = Infinity;
      yuvalar.forEach(function (y) {
        if (!y.p || (sadeceSecilebilir && !secilebilir(y))) return;
        var dx = y.p.x - qx, dy = y.p.y - qy;
        // Öndeki nokta, aynı uzaklıktaki arkadakinden önce gelsin.
        var dd = dx * dx + dy * dy - y.p.f * 6;
        if (dd < bestD) { bestD = dd; best = y; }
      });
      return bestD <= 12 * 12 ? best : null;
    }
    svg.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      st.surukle = { x: e.clientX, yaw: st.yaw, oynadi: false, id: e.pointerId };
      st.hedefYaw = null;
    });
    svg.addEventListener("pointermove", function (e) {
      var s = st.surukle;
      if (s && s.id === e.pointerId) {
        var dx = e.clientX - s.x;
        if (!s.oynadi && Math.abs(dx) > 4) {
          s.oynadi = true;
          try { svg.setPointerCapture(e.pointerId); } catch (err) { /* eski tarayıcı */ }
          el.classList.add("kisim-sarmali--donuyor");
        }
        if (s.oynadi) {
          st.yaw = s.yaw + dx * (Math.PI * 2 / Math.max(160, G.R * 4));
          istek();
          return;
        }
      }
      if (e.pointerType === "touch") return;
      setDeg(enYakin(e, false));
    });
    function birak() {
      var s = st.surukle;
      st.surukle = null;
      el.classList.remove("kisim-sarmali--donuyor");
      return s;
    }
    svg.addEventListener("pointerup", function (e) {
      var s = birak();
      if (!s || s.oynadi) return;
      var y = enYakin(e, true);
      if (y) sec(y);
    });
    svg.addEventListener("pointercancel", birak);
    svg.addEventListener("pointerleave", function () {
      if (st.surukle && st.surukle.oynadi) return;
      if (document.activeElement !== svg) setDeg(null);
    });

    // --- klavye --------------------------------------------------------
    function sec(y) {
      if (secilebilir(y) && o.onSec) o.onSec(y.parca.id);
    }
    function komsu(y, yon) {
      var i = secenekler.indexOf(y);
      if (i >= 0) return secenekler[Math.max(0, Math.min(secenekler.length - 1, i + yon))];
      var adaylar = secenekler.filter(function (s) { return yon > 0 ? s.i > (y ? y.i : -1) : s.i < (y ? y.i : Infinity); });
      return adaylar.length ? adaylar[yon > 0 ? 0 : adaylar.length - 1] : null;
    }
    function ciltKomsu(y, yon) {
      for (var ci = (y ? y.ci : 0) + yon; ci >= 0 && ci < ciltler.length; ci += yon) {
        for (var i = 0; i < secenekler.length; i++) if (secenekler[i].ci === ci) return secenekler[i];
      }
      return y;
    }
    // Klavyeyle gelen odak o anki kısımdan başlar (fareyle değinilmiş bir
    // nokta kalmışsa bile); işaretçiyle gelen odak değinileni korur.
    svg.addEventListener("focus", function () {
      if (st.surukle) return;
      setDeg(st.aktif && secilebilir(st.aktif) ? st.aktif : (secenekler[0] || null));
      if (st.deg) dondur(oneYaw(st.deg));
    });
    svg.addEventListener("blur", function () { setDeg(null); });
    svg.addEventListener("keydown", function (e) {
      var y = st.deg || st.aktif, yeni = null;
      switch (e.key) {
        case "ArrowRight": case "ArrowDown": yeni = komsu(y, 1); break;
        case "ArrowLeft": case "ArrowUp": yeni = komsu(y, -1); break;
        case "PageDown": yeni = ciltKomsu(y, 1); break;
        case "PageUp": yeni = ciltKomsu(y, -1); break;
        case "Home": yeni = secenekler[0]; break;
        case "End": yeni = secenekler[secenekler.length - 1]; break;
        case "Enter": case " ": case "Spacebar":
          if (st.deg) { e.preventDefault(); sec(st.deg); }
          return;
        default: return;
      }
      e.preventDefault();
      if (yeni) { setDeg(yeni); dondur(oneYaw(yeni)); }
    });

    // --- yaşam döngüsü -------------------------------------------------
    layout();
    if (st.aktif) st.yaw = oneYaw(st.aktif);
    else if (secenekler.length) {
      // Kavram kipi: en parlak kısım öne.
      st.yaw = oneYaw(secenekler.reduce(function (a, b) { return (b.deger || 0) > (a.deger || 0) ? b : a; }));
    }
    ciz();
    adYaz();
    ariaYaz();
    var ro = null;
    if (window.ResizeObserver) {
      var sonW = G.w;
      ro = new ResizeObserver(function () {
        var w = el.clientWidth;
        if (!w || Math.abs(w - sonW) < 1) return;
        sonW = w; layout(); istek();
      });
      ro.observe(el);
    }

    return {
      setAktif: function (pid) {
        st.aktif = yuvaById(pid);
        if (st.aktif) dondur(oneYaw(st.aktif));
        adYaz(); ariaYaz(); istek();
      },
      setLang: function () { adYaz(); ariaYaz(); },
      relayout: function () { layout(); istek(); },
      destroy: function () {
        if (ro) ro.disconnect();
        if (st.raf) cancelAnimationFrame(st.raf);
        st.hedefYaw = null;
        el.textContent = "";
      },
    };
  }

  if (window.DostHelix) window.DostHelix.kisimSarmali = kisimSarmali;
  else window.DostHelix = { kisimSarmali: kisimSarmali };
})();
