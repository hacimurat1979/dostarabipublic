window.__neredenBaslamaliApp=(function(){"use strict";const c=window.DostI18n,p=window.DostGraphUtils,l=document.getElementById("nereden-baslamali-content"),t=c.pick3;let i=null,s=null;function n(a){return String(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const u={ontoloji:{tr:"Ontoloji",en:"Ontology",pt:"Ontologia"},terimler:{tr:"Terimler",en:"Terms",pt:"Termos"},bilmiyoruz:{tr:"Bilmiyoruz",en:"We Don't Know",pt:"N\xE3o Sabemos"},"acik-sorular":{tr:"A\xE7\u0131k Sorular",en:"Open Questions",pt:"Perguntas Abertas"},"elestiri-arkeolojisi":{tr:"Ele\u015Ftiri Arkeolojisi",en:"Archaeology of Criticism",pt:"Arqueologia da Cr\xEDtica"},futuhat:{tr:"F\xFCt\xFBh\xE2t-\u0131 Mekkiyye",en:"The Meccan Openings",pt:"As Aberturas de Meca"},fusus:{tr:"F\xFCs\xFBsu'l-Hikem",en:"Fusus al-Hikam",pt:"Fusus al-Hikam"},miskat:{tr:"Mi\u015Fk\xE2t\xFC'l-Env\xE2r",en:"Mishkat al-Anwar",pt:"Mishkat al-Anwar"},kavram:{tr:"Kavram Sayfas\u0131",en:"Concept Page",pt:"P\xE1gina do Conceito"},hakkinda:{tr:"Hakk\u0131nda",en:"About",pt:"Sobre"}};function w(){return i?Promise.resolve(i):s||(window.DostViewStatus&&window.DostViewStatus.showLoading("nereden-baslamali-panel"),s=p.fetchJson("data/nereden-baslamali.json").then(a=>(i=a,window.DostViewStatus&&window.DostViewStatus.hide("nereden-baslamali-panel"),i)).catch(a=>(console.error("nereden-baslamali verisi y\xFCklenemedi / failed to load",a),s=null,window.DostViewStatus&&window.DostViewStatus.showError("nereden-baslamali-panel",()=>window.__neredenBaslamaliApp.activate()),null)),s)}function k(a,e){const o=u[a.view]?t(u[a.view]):a.view,r=a.hedef?t(a.hedef):"";return`<li class="nb-durak">
      <span class="nb-durak__no" aria-hidden="true">${e}</span>
      <div class="nb-durak__govde">
        <p class="nb-durak__ne">${n(t(a.ne))}</p>
        <p class="nb-durak__bak">${n(t(a.bak))}</p>
        <button type="button" class="nb-durak__git" data-view="${n(a.view)}"${a.id?` data-id="${n(a.id)}"`:""}>
          <span class="nb-durak__git-yer">${n(o)}${r?` <span class="nb-durak__git-sayfa">\xB7 ${n(r)}</span>`:""}</span>
          <span class="nb-durak__git-ok" aria-hidden="true">\u2192</span>
        </button>
      </div>
    </li>`}function _(a){const e=(a.duraklar||[]).length,o=t({tr:e+" durak",en:e+(e===1?" stop":" stops"),pt:e+(e===1?" parada":" paradas")});return`<section class="nb-yol">
      <h2 class="nb-yol__baslik">${n(t(a.baslik))}</h2>
      <p class="nb-yol__olcu">${n(o)}</p>
      <p class="nb-yol__kim">${n(t(a.kim))}</p>
      <ol class="nb-durak-liste">${(a.duraklar||[]).map((r,b)=>k(r,b+1)).join("")}</ol>
    </section>`}function d(){!l||!i||(l.innerHTML=`
      <p class="nb-not">${n(t(i.not))}</p>
      <div class="nb-yollar">${(i.yollar||[]).map(_).join("")}</div>
    `,l.querySelectorAll(".nb-durak__git").forEach(a=>{a.addEventListener("click",()=>{const e=a.dataset.view,o=a.dataset.id;window.__dostNav&&window.__dostNav.goTo?window.__dostNav.goTo(e,o):window.location.href=(window.__dostRouteBase||"")+"/"+e+(o?"/"+o:"")})}))}function m(){w().then(a=>{a&&d()})}return{activate:m,onLangChange:function(){i&&d()}}})();
