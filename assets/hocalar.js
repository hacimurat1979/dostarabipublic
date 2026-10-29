window.__hocalarApp=(function(){"use strict";const T=window.DostI18n,k=window.DostGraphUtils,j=document.getElementById("hocalar-wrap"),$=document.getElementById("hocalar-list"),_=document.getElementById("hocalar-diger"),h=document.getElementById("detail-panel"),z=document.getElementById("detail-content");if(!j||!$)return{activate(){},onLangChange(){},goToNode(){}};const e=T.pick3;let d=null,c=[],u=null;function E(a){const t=a.baglam?`<p class="hoca-alinti__baglam">${e(a.baglam)}</p>`:"";return`<blockquote class="hoca-alinti">
      <p class="hoca-alinti__metin">${e(a.metin)}</p>
      ${t}
      <cite class="hoca-alinti__kaynak">${a.kaynak.eser}, s. ${a.kaynak.sayfa}</cite>
    </blockquote>`}function B(a){return a.map(t=>{const i=t.yil?", "+t.yil:"",n=t.not?` <span class="bilmiyoruz-madde__kaynak-not">\u2014 ${t.not}</span>`:"";return`<li class="bilmiyoruz-madde__kaynak">${t.yazar}, <em>${t.eser}</em>${i}${n}</li>`}).join("")}function p(a){window.__dostNav&&window.__dostNav.setHash("hocalar",String(a.id)),u=a.id,z.innerHTML=`
      <p class="detail-eyebrow">${e(a.konum)}
        <span class="hoca-sira-rozet">${a.sira}</span></p>
      <h2 class="detail-title">${e(a.ad)}</h2>
      <p class="hoca-kimlik">${e(a.kimlik)}</p>
      <div class="detail-block detail-block--soru"><p>${e(a.ozet)}</p></div>
      <p class="hoca-sozler-baslik">${e({tr:"Kendi a\u011Fz\u0131ndan",en:"In his own words",pt:"Nas suas pr\xF3prias palavras"})}</p>
      <div class="hoca-sozler">${a.alintilar.map(E).join("")}</div>
      <details class="eser-agi-kaynak-detay hoca-kaynak-detay">
        <summary>${e({tr:"Kaynaklar",en:"Sources",pt:"Fontes"})}</summary>
        <ul class="bilmiyoruz-madde__kaynaklar">${B(a.kaynaklar)}</ul>
      </details>`,h.hidden=!1}function H(){const a=`<div class="hocalar-giris">
        <h2 class="hocalar-giris__baslik">${e({tr:"Hocalar",en:"Teachers",pt:"Professores"})}</h2>
        <p class="hocalar-giris__not">${e(d.not)}</p>
      </div>`;$.innerHTML=a+c.map(t=>`<button class="hoca-satir" type="button" data-id="${t.id}">
        <span class="hoca-satir__sira">${t.sira}</span>
        <span class="hoca-satir__govde">
          <span class="hoca-satir__ad">${e(t.ad)}</span>
          <span class="hoca-satir__konum">${e(t.konum)}</span>
        </span>
      </button>`).join(""),$.querySelectorAll(".hoca-satir").forEach(t=>{t.addEventListener("click",()=>{const i=c.find(n=>n.id===t.dataset.id);i&&p(i)})})}function I(a){if(!a||!a.kisiler||!a.kisiler.length)return"";const t=c.slice(0,2).concat(a.kisiler),i=t.length,n=160,l=148,o=112,r=t.map((s,y)=>{const v=i===1?.5:y/(i-1),m=Math.PI*(.08+v*.84),x=n+o*Math.cos(m),F=l-o*Math.sin(m);return{ad:e(s.ad),id:s.id,x,y:F,tiklanabilir:y<2}}),b=r.map(s=>`<line class="hoca-vuslat__cizgi" x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${n}" y2="${l}" />`).join(""),w=r.map((s,y)=>{const v=s.ad.length>15?s.ad.slice(0,14)+"\u2026":s.ad,m=y%2===0?10:24,x=s.y<l-10?s.y-m:s.y+18,F=s.tiklanabilir?` data-id="${s.id}" tabindex="0" role="button" aria-label="${s.ad}"`:"",D=s.tiklanabilir?"":`<title>${s.ad}</title>`;return`<g class="hoca-vuslat__nokta${s.tiklanabilir?" hoca-vuslat__nokta--tiklanabilir":""}"${F}>
        ${D}<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="5"></circle>
        <text x="${s.x.toFixed(1)}" y="${x.toFixed(1)}" text-anchor="middle">${v}</text>
      </g>`}).join("");return`<svg class="hoca-vuslat" viewBox="0 0 320 190" aria-label="${e({tr:"Alt\u0131s\u0131 da F\xFCt\xFBh\xE2t-\u0131 Mekkiyye'nin ayn\u0131 b\xF6l\xFCm\xFCnde (s. 335) bir arada an\u0131l\u0131yor",en:"All six are named together in the same chapter of the Futuhat al-Makkiyya (p. 335)",pt:"Todos os seis s\xE3o nomeados juntos no mesmo cap\xEDtulo das Futuhat al-Makkiyya (p. 335)"})}">
      ${b}
      <circle class="hoca-vuslat__merkez" cx="${n}" cy="${l}" r="7"></circle>
      <text class="hoca-vuslat__merkez-etiket" x="${n}" y="${l+24}" text-anchor="middle">${e({tr:"F\xFCt\xFBh\xE2t, s. 335",en:"Futuhat, p. 335",pt:"Futuhat, p. 335"})}</text>
      ${w}
    </svg>`}function S(){_&&_.querySelectorAll(".hoca-vuslat__nokta--tiklanabilir").forEach(a=>{const t=()=>{const i=c.find(n=>n.id===a.dataset.id);i&&p(i)};a.addEventListener("click",t),a.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),t())})})}function N(){if(!_)return;let a="";const t=d.digerVeraEhli;if(t){const l=t.kisiler.map(o=>`<li class="hocalar-diger__satir"><strong>${e(o.ad)}</strong> \u2014 ${e(o.konum)}</li>`).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"F\xFCt\xFBh\xE2t'ta da ad\u0131 ge\xE7en di\u011Ferleri",en:"Others also named in the Futuhat",pt:"Outros tamb\xE9m nomeados nas Futuhat"})}</p>
        <p class="hocalar-diger__not">${e(t.not)}</p>
        ${I(t)}
        <ul class="hocalar-diger__liste">${l}</ul>
        ${E(t.paylasilanNot)}`}const i=d.digerBolumlerdeAnilanlar;if(i&&i.length){const l=i.map(o=>`<div class="hocalar-diger__satir">
           <strong>${e(o.ad)}</strong>
           <p class="hoca-alinti__baglam">${e(o.not)}</p>
           <cite class="hoca-alinti__kaynak">${o.kaynak.eser}, s. ${o.kaynak.sayfa}</cite>
         </div>`).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"F\xFCt\xFBh\xE2t'\u0131n ba\u015Fka b\xF6l\xFCmlerinde ge\xE7en izler",en:"Traces in other chapters of the Futuhat",pt:"Vest\xEDgios noutros cap\xEDtulos das Futuhat"})}</p>
        <div class="hocalar-diger__liste">${l}</div>`}const n=d.hirkaSilsilesi;if(n&&n.kisiler&&n.kisiler.length){const l={"hirka-veren":{tr:"h\u0131rka veren",en:"gave the robe",pt:"deu o manto"},"hirka-alan":{tr:"h\u0131rka alan",en:"received the robe",pt:"recebeu o manto"}},o=n.kisiler.map(r=>{const b=l[r.rol]||l["hirka-veren"],w=(r.yil_hicri?"h."+r.yil_hicri+", ":"")+e(r.yer);return`<div class="hocalar-diger__satir">
          <strong>${e(r.ad)}</strong>
          <span class="hocalar-diger__rozet hocalar-diger__rozet--${r.rol}">${e(b)}</span>
          <span class="hocalar-diger__meta"> \u2014 ${w}</span>
          <p class="hoca-alinti__baglam">${e(r.not)}</p>
          <cite class="hoca-alinti__kaynak">${r.kaynak.eser}, ${r.kaynak.sayfa}</cite>
        </div>`}).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"H\u0131rka silsilesi (Neseb\xFC'l-H\u0131rka'dan)",en:"Chain of the robe (from Neseb\xFC'l-H\u0131rka)",pt:"Cadeia do manto (do Neseb\xFC'l-H\u0131rka)"})}</p>
        <p class="hocalar-diger__not">${e(n.not)}</p>
        <div class="hocalar-diger__liste">${o}</div>`}_.innerHTML=a,S()}function g(){u=null,z.innerHTML=`
      <p class="detail-eyebrow">${e({tr:"Hocalar",en:"Teachers",pt:"Mestres"})}</p>
      <h2 class="detail-title">${e({tr:"Listenin sonundaki iki isim",en:"The last two names on the list",pt:"Os dois \xFAltimos nomes da lista"})}</h2>
      <div class="detail-block detail-block--soru"><p>${e(d.not)}</p></div>`,h.hidden=!1}let f=!1;function L(){if(f)return Promise.resolve();const a=window.__dostRouteBase||"",t=(a?a+"/":"")+"data/ibn-arabi/hocalar.json";return k.fetchJson(t).then(i=>{d=i,c=i.hocalar||[],f=!0,H(),N()})}let M=!1;function A(){M||(M=!0,k.setupDetailPanelFocus&&k.setupDetailPanelFocus(),k.registerStepBack("hocalar-wrap",()=>u?(g(),h.hidden=!0,window.__dostNav&&window.__dostNav.setHash("hocalar"),!0):!1))}return{activate(){A(),L().catch(()=>{window.DostViewStatus&&window.DostViewStatus.showError("hocalar-wrap",()=>window.__hocalarApp.activate())})},onLangChange(){if(f)if(H(),N(),u){const a=c.find(t=>t.id===u);a?p(a):h.hidden||g()}else h.hidden||g()},goToNode(a){this.activate(),L().then(()=>{const t=c.find(i=>i.id===a);t?p(t):a&&window.__dostNav&&window.__dostNav.setHash("hocalar")})}}})();
