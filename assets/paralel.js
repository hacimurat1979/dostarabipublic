/* Paralel okuma masası (2026-11-02, B1+B2+B6). Solda fizik makalesi, sağda Dost'tan bir sırlı anlatım kısmı ya da biçim sayfası; çifti
 * ve notu yalnız sen kurarsın, site eşleştirme önermez. Çiftler cihazda durur (dost-paralel-ciftler). İstenirse çift ve notu @revise
 * kuyruğuna (paralel-cift) girer; "çürütmeye çalış" işaretliyse Claude karşı örnek ve özgüllük sınaması yapar. */
(function () {
  "use strict";
  var KEY = "dost-paralel-ciftler", Q = "dost-edit-queue";
  var DIL = (document.documentElement.lang || "tr").slice(0, 2);
  var S = {
    tr: { sol: "Fizik tarafı", sag: "Dost tarafı", fizik: "Fizik", dost: "Dost", not: "Bu çift için notun (yalnız senin; site eşleştirme önermez)", ph: "Neyi yan yana gördün, nerede ayrılıyorlar?", kaydet: "Çifti cihaza kaydet", gonder: "Kaydet ve Claude'a gönderilecekler arasına koy", curut: "Çürütmeye çalış", cift: "Okuma çiftlerim", yok: "Henüz kayıtlı çiftin yok.", ac: "Bu çifti aç", sil: "Sil", gonderildi: " · Claude'a gönderildi", nonot: "(not yok)", halka: "Konulara göre kaç çift kurdun", bicim: "Biçim sayfaları (Yan Yana)", okt: "Çift cihaza kaydedildi.", ok2: "Çift kaydedildi ve @revise kuyruğuna girdi.", ok3: "Çift kaydedildi ve çürütme isteğiyle @revise kuyruğuna girdi (Claude'a gönder ile iletirsin).", kuyruk: "Kuyruğa yazılamadı.", yazamadi: "Çift cihaza yazılamadı (depolama kapalı ya da dolu).", yuklenemedi: "Paralel okuma masası yüklenemedi; sayfayı yenile.", konuda: " konuda çift var, ", konuda2: " konuda henüz yok.", cfsol: "Fizik tarafı", cfsag: "Dost tarafı", tarih: "tr" },
    en: { sol: "Physics side", sag: "Dost side", fizik: "Physics", dost: "Dost", not: "Your note for this pair (yours alone; the site proposes no matching)", ph: "What did you see side by side, and where do they part?", kaydet: "Save the pair on this device", gonder: "Save and put among the things to send to Claude", curut: "Try to refute", cift: "My reading pairs", yok: "You have no saved pairs yet.", ac: "Open this pair", sil: "Delete", gonderildi: " · sent to Claude", nonot: "(no note)", halka: "How many pairs you made per topic", bicim: "Form pages (Side by Side)", okt: "Pair saved on this device.", ok2: "Pair saved and put in the @revise queue.", ok3: "Pair saved and put in the @revise queue with a refutation request (you send it with “Send to Claude”).", kuyruk: "Could not write to the queue.", yazamadi: "Could not write the pair to this device (storage off or full).", yuklenemedi: "The parallel reading table could not load; reload the page.", konuda: " topics have pairs, ", konuda2: " topics have none yet.", cfsol: "Physics side", cfsag: "Dost side", tarih: "en" },
    pt: { sol: "Lado da física", sag: "Lado de Dost", fizik: "Física", dost: "Dost", not: "Sua nota para este par (só sua; o site não propõe correspondência)", ph: "O que você viu lado a lado, e onde se separam?", kaydet: "Salvar o par neste dispositivo", gonder: "Salvar e pôr entre o que será enviado ao Claude", curut: "Tentar refutar", cift: "Meus pares de leitura", yok: "Você ainda não tem pares salvos.", ac: "Abrir este par", sil: "Excluir", gonderildi: " · enviado ao Claude", nonot: "(sem nota)", halka: "Quantos pares você fez por tópico", bicim: "Páginas de forma (Lado a Lado)", okt: "Par salvo neste dispositivo.", ok2: "Par salvo e colocado na fila @revise.", ok3: "Par salvo e colocado na fila @revise com pedido de refutação (você envia com “Enviar ao Claude”).", kuyruk: "Não foi possível gravar na fila.", yazamadi: "Não foi possível gravar o par neste dispositivo (armazenamento desligado ou cheio).", yuklenemedi: "A mesa de leitura paralela não carregou; recarregue a página.", konuda: " tópicos têm pares, ", konuda2: " tópicos ainda não têm.", cfsol: "Lado da física", cfsag: "Lado de Dost", tarih: "pt-BR" }
  };
  var T = S[DIL] || S.tr;
  var kok = document.getElementById("paralel");
  if (!kok) return;
  var veri = null, sol = null, sag = null;
  var el = function (t, a, c) { var e = document.createElement(t); if (a) for (var k in a) { if (k === "text") e.textContent = a[k]; else e.setAttribute(k, a[k]); } (c || []).forEach(function (x) { e.appendChild(x); }); return e; };
  function oku() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
  function yaz(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { durum(T.yazamadi); } }
  var durumEl;
  function durum(m) { if (durumEl) { durumEl.textContent = m; } }

  function secenekSol() {
    var s = el("select", { id: "pl-sol", "aria-label": T.sol });
    veri.fizik.forEach(function (k) {
      var g = el("optgroup", { label: k.no + ". " + k.baslik });
      k.makaleler.forEach(function (m) { var o = el("option", { value: m.id, text: m.etiket }); o.dataset.url = m.url; o.dataset.hash = m.hash; o.dataset.no = k.no; g.appendChild(o); });
      s.appendChild(g);
    });
    return s;
  }
  function secenekSag() {
    var s = el("select", { id: "pl-sag", "aria-label": T.sag });
    veri.dost.forEach(function (g) {
      var og = el("optgroup", { label: g.ad });
      g.kisimlar.forEach(function (k) { var o = el("option", { value: k.k, text: k.k + " — " + k.baslik + " (" + k.n + ")" }); o.dataset.url = k.url; o.dataset.hash = k.hash; og.appendChild(o); });
      s.appendChild(og);
    });
    var bg = el("optgroup", { label: T.bicim });
    veri.bicim.forEach(function (b) { var o = el("option", { value: "b-" + b.ad, text: b.ad + " — " + b.baslik }); o.dataset.url = b.url; bg.appendChild(o); });
    s.appendChild(bg);
    return s;
  }
  function yukle(fr, sel) {
    var o = sel.options[sel.selectedIndex]; if (!o) return null;
    fr.src = o.dataset.url + (o.dataset.url.indexOf("?") < 0 ? "?ic=1" : "&ic=1") + (o.dataset.hash ? "#" + o.dataset.hash : "");
    return { id: o.value, ad: o.textContent };
  }
  function halkalar() {
    var l = oku(), nos = {};
    l.forEach(function (c) { if (c.no) nos[c.no] = (nos[c.no] || 0) + 1; });
    var kap = document.getElementById("pl-halka"); kap.innerHTML = "";
    veri.fizik.forEach(function (k) {
      var e = el("span", { class: "pl-h" + (nos[k.no] ? " dolu" : ""), title: k.no + ". " + k.baslik + (nos[k.no] ? " — " + nos[k.no] : ""), text: nos[k.no] ? String(nos[k.no]) : "" });
      kap.appendChild(e);
    });
    document.getElementById("pl-halka-ozet").textContent = Object.keys(nos).length + T.konuda + (veri.fizik.length - Object.keys(nos).length) + T.konuda2;
  }
  function liste() {
    var l = oku(), kap = document.getElementById("pl-liste"); kap.innerHTML = "";
    if (!l.length) { kap.appendChild(el("p", { class: "mini", text: T.yok })); }
    l.slice().reverse().forEach(function (c) {
      var kart = el("div", { class: "pl-cift" }, [
        el("p", { class: "pl-baslik", text: c.sol_ad + "  ↔  " + c.sag_ad }),
        el("p", { class: "pl-not", text: c.note || T.nonot }),
        el("p", { class: "mini", text: new Date(c.timestamp).toLocaleString(T.tarih) + (c.gonderildi ? T.gonderildi : "") })
      ]);
      var ac = el("button", { type: "button", text: T.ac });
      ac.addEventListener("click", function () { document.getElementById("pl-sol").value = c.sol; document.getElementById("pl-sag").value = c.sag; degis(); document.getElementById("pl-not").value = c.note || ""; });
      var sil = el("button", { type: "button", text: T.sil });
      sil.addEventListener("click", function () { yaz(oku().filter(function (x) { return x.id !== c.id; })); liste(); halkalar(); });
      kart.appendChild(el("p", {}, [ac, sil]));
      kap.appendChild(kart);
    });
  }
  function degis() { sol = yukle(document.getElementById("pl-fr-sol"), document.getElementById("pl-sol")); sag = yukle(document.getElementById("pl-fr-sag"), document.getElementById("pl-sag")); }
  function cift(gonder, curut) {
    var notu = document.getElementById("pl-not").value.trim();
    if (!sol || !sag) return;
    var o = document.getElementById("pl-sol").options[document.getElementById("pl-sol").selectedIndex];
    var c = { id: "pl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), sol: sol.id, sol_ad: sol.ad, sag: sag.id, sag_ad: sag.ad, no: o.dataset.no || "", note: notu, timestamp: new Date().toISOString() };
    if (gonder) {
      try {
        var q = JSON.parse(localStorage.getItem(Q) || "[]");
        q.push({ id: c.id, type: "paralel-cift", url: location.pathname, lang: "tr", sol: c.sol, sol_ad: c.sol_ad, sag: c.sag, sag_ad: c.sag_ad, note: notu, curut: !!curut, timestamp: c.timestamp });
        localStorage.setItem(Q, JSON.stringify(q)); c.gonderildi = true;
      } catch (e) { durum(T.kuyruk); return; }
    }
    var l = oku(); l.push(c); yaz(l); liste(); halkalar();
    durum(gonder ? (curut ? T.ok3 : T.ok2) : T.okt);
  }
  function kur() {
    kok.innerHTML = "";
    var sec = el("div", { class: "pl-sec" });
    var sl = el("label", { class: "pl-kol" }, [el("span", { text: T.sol }), secenekSol()]);
    var sg = el("label", { class: "pl-kol" }, [el("span", { text: T.sag }), secenekSag()]);
    sec.appendChild(sl); sec.appendChild(sg);
    var sek = el("div", { class: "pl-sekme", role: "tablist" }, [el("button", { type: "button", "data-t": "sol", "aria-pressed": "true", text: T.fizik }), el("button", { type: "button", "data-t": "sag", "aria-pressed": "false", text: T.dost })]);
    var masa = el("div", { class: "pl-masa", "data-aktif": "sol" }, [
      el("iframe", { id: "pl-fr-sol", title: T.cfsol, loading: "lazy" }),
      el("iframe", { id: "pl-fr-sag", title: T.cfsag, loading: "lazy" })
    ]);
    sek.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; masa.dataset.aktif = b.dataset.t; [].forEach.call(sek.children, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); });
    var notu = el("label", { class: "pl-notlu" }, [el("span", { text: T.not }), el("textarea", { id: "pl-not", rows: "4", placeholder: T.ph })]);
    var kaydet = el("button", { type: "button", text: T.kaydet });
    var gonder = el("button", { type: "button", text: T.gonder });
    var curut = el("button", { type: "button", text: T.curut });
    kaydet.addEventListener("click", function () { cift(false, false); });
    gonder.addEventListener("click", function () { cift(true, false); });
    curut.addEventListener("click", function () { cift(true, true); });
    durumEl = el("p", { class: "mini", role: "status" });
    var eylem = el("div", { class: "pl-eylem" }, [kaydet, gonder, curut]);
    var bolum1 = el("section", {}, [el("h2", { text: T.cift }), el("p", { id: "pl-halka-ozet", class: "mini" }), el("div", { id: "pl-halka", class: "pl-halka", "aria-label": T.halka }), el("div", { id: "pl-liste" })]);
    kok.appendChild(sek); kok.appendChild(sec); kok.appendChild(masa); kok.appendChild(notu); kok.appendChild(eylem); kok.appendChild(durumEl); kok.appendChild(bolum1);
    document.getElementById("pl-sol").addEventListener("change", degis);
    document.getElementById("pl-sag").addEventListener("change", degis);
    var ds = document.getElementById("pl-sag"); // varsayılan: ilk kısım
    degis(); liste(); halkalar();
  }
  fetch(kok.dataset.veri || "/yan-yana/paralel/veri.json").then(function (r) { return r.json(); }).then(function (v) { veri = v; kur(); }).catch(function () { kok.textContent = T.yuklenemedi; });
})();
