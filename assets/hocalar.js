window.__hocalarApp=(function(){"use strict";const P=window.DostI18n,u=window.DostGraphUtils,q=document.getElementById("hocalar-wrap"),b=document.getElementById("hocalar-list"),F=document.getElementById("hocalar-diger"),x=document.getElementById("detail-panel"),L=document.getElementById("detail-content");if(!q||!b)return{activate(){},onLangChange(){},goToNode(){}};const e=P.pick3,V=document.documentElement.hasAttribute("data-seyr")&&!document.documentElement.classList.contains("dost-uygulama"),H={baslik:{tr:"Elli be\u015F hoca",en:"Fifty-five teachers",pt:"Cinquenta e cinco mestres"},aciklama:{tr:"Dolu halka: portresi olan hoca. Bo\u015F halka: portre kayd\u0131 yok.",en:"Filled ring: a teacher with a portrait. Empty ring: no portrait record.",pt:"Anel cheio: mestre com retrato. Anel vazio: sem registro de retrato."},merkezAlt:{tr:"55 hoca \xB7 2 portre",en:"55 teachers \xB7 2 portraits",pt:"55 mestres \xB7 2 retratos"}};let m=null,k=[],v=null;function I(a){const t=a.baglam?`<p class="hoca-alinti__baglam">${e(a.baglam)}</p>`:"";return`<blockquote class="hoca-alinti">
      <p class="hoca-alinti__metin">${e(a.metin)}</p>
      ${t}
      <cite class="hoca-alinti__kaynak">${w(a.kaynak.eser)}, ${e({tr:"s.",en:"p.",pt:"p."})} ${M(a.kaynak.sayfa)}</cite>
    </blockquote>`}function w(a){return String(a).replace(/çev\./,e({tr:"\xE7ev.",en:"transl.",pt:"trad."}))}function M(a){return w(String(a).replace(/^giriş, ~s\. (\d+)$/,(t,i)=>e({tr:t,en:"introduction, c. p. "+i,pt:"introdu\xE7\xE3o, c. p. "+i})))}function C(a){return a.map(t=>{const i=t.yil?", "+t.yil:"",n=t.not?e({tr:t.not,en:t.not_en||t.not,pt:t.not_pt||t.not}):"",o=n?` <span class="bilmiyoruz-madde__kaynak-not">\u2014 ${n}</span>`:"";return`<li class="bilmiyoruz-madde__kaynak">${w(t.yazar)}, <em>${t.eser}</em>${i}${o}</li>`}).join("")}function E(a){window.__dostNav&&window.__dostNav.setHash("hocalar",String(a.id)),v=a.id,L.innerHTML=`
      <p class="detail-eyebrow">${e(a.konum)}
        <span class="hoca-sira-rozet">${a.sira}</span></p>
      <h2 class="detail-title">${e(a.ad)}</h2>
      <p class="hoca-kimlik">${e(a.kimlik)}</p>
      <div class="detail-block detail-block--soru"><p>${e(a.ozet)}</p></div>
      <p class="hoca-sozler-baslik">${e({tr:"Kendi a\u011Fz\u0131ndan",en:"In his own words",pt:"Nas suas pr\xF3prias palavras"})}</p>
      <div class="hoca-sozler">${a.alintilar.map(I).join("")}</div>
      <details class="eser-agi-kaynak-detay hoca-kaynak-detay">
        <summary>${e({tr:"Kaynaklar",en:"Sources",pt:"Fontes"})}</summary>
        <ul class="bilmiyoruz-madde__kaynaklar">${C(a.kaynaklar)}</ul>
      </details>`,x.hidden=!1}function T(){const a=`<div class="hocalar-giris">
        <h2 class="hocalar-giris__baslik">${e({tr:"Hocalar",en:"Teachers",pt:"Mestres"})}</h2>
        <p class="hocalar-giris__not">${e(m.not)}</p>
      </div>`;b.innerHTML=a+k.map(t=>`<button class="hoca-satir" type="button" data-id="${t.id}">
        <span class="hoca-satir__sira">${t.sira}</span>
        <span class="hoca-satir__govde">
          <span class="hoca-satir__ad">${e(t.ad)}</span>
          <span class="hoca-satir__konum">${e(t.konum)}</span>
        </span>
      </button>`).join(""),b.querySelectorAll(".hoca-satir").forEach(t=>{t.addEventListener("click",()=>{const i=k.find(n=>n.id===t.dataset.id);i&&E(i)})}),V&&R()}function R(){const a=new Map;k.forEach(l=>{const s=/^(\d+)\s*\/\s*(\d+)$/.exec(String(l.sira));s&&a.set(+s[1],l)});const t=55,i=640,n=i/2,o=i/2,c=235;let d="";for(let l=1;l<=t;l++){const s=-Math.PI/2+(l-1)/t*Math.PI*2,h=n+c*Math.cos(s),p=o+c*Math.sin(s),g=a.get(l);if(g){const A=Math.cos(s)>=0,z=22+26*(l%2),y=n+(c+z)*Math.cos(s),_=o+(c+z)*Math.sin(s)-8*(l%2);d+=`<g class="seyr-hoca seyr-hoca--dolu" tabindex="0" role="button" data-id="${g.id}" aria-label="${u.escapeHtml(g.sira+": "+e(g.ad))}"><circle cx="${h.toFixed(1)}" cy="${p.toFixed(1)}" r="13"/><text x="${y.toFixed(1)}" y="${(_+4).toFixed(1)}" text-anchor="${A?"start":"end"}">${u.escapeHtml(e(g.ad))}</text></g>`}else d+=`<circle class="seyr-hoca seyr-hoca--bos" cx="${h.toFixed(1)}" cy="${p.toFixed(1)}" r="6.5"><title>${l}/${t}: ${u.escapeHtml(e({tr:"portre kayd\u0131 yok",en:"no portrait record",pt:"sem registro de retrato"}))}</title></circle>`}const f=m&&m.digerVeraEhli&&m.digerVeraEhli.kisiler||[];f.forEach((l,s)=>{const h=-Math.PI/2+(s+.5)/Math.max(1,f.length)*1.1+.55,p=c+52;d+=`<circle class="seyr-hoca seyr-hoca--diger" cx="${(n+p*Math.cos(h)).toFixed(1)}" cy="${(o+p*Math.sin(h)).toFixed(1)}" r="4"><title>${u.escapeHtml(e(l.ad))}</title></circle>`});const $=document.createElement("div");$.className="seyr-hoca-halka",$.innerHTML=`<svg viewBox="-60 -10 ${i+120} ${i+20}" role="group" aria-label="${u.escapeHtml(e(H.baslik))}"><circle class="seyr-hoca__yay" cx="${n}" cy="${o}" r="${c}"/>${d}<text class="seyr-hoca__merkez" x="${n}" y="${o-2}" text-anchor="middle">R\xFBhu'l-kuds</text><text class="seyr-hoca__merkez-alt" x="${n}" y="${o+22}" text-anchor="middle">${u.escapeHtml(e(H.merkezAlt))}</text></svg><p class="seyr-hoca-halka__not">${u.escapeHtml(e(H.aciklama))}</p>`;const r=b.querySelector(".hocalar-giris");r?r.insertAdjacentElement("afterend",$):b.prepend($),$.querySelectorAll(".seyr-hoca--dolu").forEach(l=>{const s=()=>{const h=k.find(p=>p.id===l.dataset.id);h&&E(h)};l.addEventListener("click",s),l.addEventListener("keydown",h=>{(h.key==="Enter"||h.key===" ")&&(h.preventDefault(),s())})})}function Y(a){if(!a||!a.kisiler||!a.kisiler.length)return"";const t=k.slice(0,2).concat(a.kisiler),i=t.length,n=160,o=148,c=112,d=t.map((r,l)=>{const s=i===1?.5:l/(i-1),h=Math.PI*(.08+s*.84),p=n+c*Math.cos(h),g=o-c*Math.sin(h);return{ad:e(r.ad),id:r.id,x:p,y:g,tiklanabilir:l<2}}),f=d.map(r=>`<line class="hoca-vuslat__cizgi" x1="${r.x.toFixed(1)}" y1="${r.y.toFixed(1)}" x2="${n}" y2="${o}" />`).join(""),$=d.map((r,l)=>{const s=[""];r.ad.split(/\s+/).forEach(y=>{const _=s[s.length-1];_?(_+" "+y).length<=16||s.length>=2?s[s.length-1]=_+" "+y:s.push(y):s[s.length-1]=y});const h=s.map((y,_)=>{const K=y.length>24?y.slice(0,23)+"\u2026":y;return`<tspan x="@X@" dy="${_===0?0:11}">${K}</tspan>`}).join(" "),p=l%2===0?10:24,g=r.y<o-10?r.y-p:r.y+18,A=r.tiklanabilir?` data-id="${r.id}" tabindex="0" role="button" aria-label="${r.ad}"`:"",z=r.tiklanabilir?"":`<title>${r.ad}</title>`;return`<g class="hoca-vuslat__nokta${r.tiklanabilir?" hoca-vuslat__nokta--tiklanabilir":""}"${A}>
        ${z}<circle cx="${r.x.toFixed(1)}" cy="${r.y.toFixed(1)}" r="5"></circle>
        <text x="${r.x.toFixed(1)}" y="${(g-(s.length>1&&r.y<o-10?11:0)).toFixed(1)}" text-anchor="middle">${h.replace(/@X@/g,r.x.toFixed(1))}</text>
      </g>`}).join("");return`<svg class="hoca-vuslat" viewBox="0 -12 320 202" aria-label="${e({tr:"Alt\u0131s\u0131 da F\xFCt\xFBh\xE2t-\u0131 Mekkiyye'nin ayn\u0131 b\xF6l\xFCm\xFCnde (s. 335) bir arada an\u0131l\u0131yor",en:"All six are named together in the same chapter of the al-Futuhat al-Makkiyya (p. 335)",pt:"Todos os seis s\xE3o nomeados juntos no mesmo cap\xEDtulo do al-Futuhat al-Makkiyya (p. 335)"})}">
      ${f}
      <circle class="hoca-vuslat__merkez" cx="${n}" cy="${o}" r="7"></circle>
      <text class="hoca-vuslat__merkez-etiket" x="${n}" y="${o+24}" text-anchor="middle">${e({tr:"F\xFCt\xFBh\xE2t, s. 335",en:"Futuhat, p. 335",pt:"Futuhat, p. 335"})}</text>
      ${$}
    </svg>`}function O(){F&&F.querySelectorAll(".hoca-vuslat__nokta--tiklanabilir").forEach(a=>{const t=()=>{const i=k.find(n=>n.id===a.dataset.id);i&&E(i)};a.addEventListener("click",t),a.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),t())})})}function j(){if(!F)return;let a="";const t=m.digerVeraEhli;if(t){const o=t.kisiler.map(c=>`<li class="hocalar-diger__satir"><strong>${e(c.ad)}</strong> \u2014 ${e(c.konum)}</li>`).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"F\xFCt\xFBh\xE2t'ta da ad\u0131 ge\xE7en di\u011Ferleri",en:"Others also named in the Futuhat",pt:"Outros tamb\xE9m nomeados nas Futuhat"})}</p>
        <p class="hocalar-diger__not">${e(t.not)}</p>
        ${Y(t)}
        <ul class="hocalar-diger__liste">${o}</ul>
        ${I(t.paylasilanNot)}`}const i=m.digerBolumlerdeAnilanlar;if(i&&i.length){const o=i.map(c=>`<div class="hocalar-diger__satir">
           <strong>${e(c.ad)}</strong>
           <p class="hoca-alinti__baglam">${e(c.not)}</p>
           <cite class="hoca-alinti__kaynak">${w(c.kaynak.eser)}, ${e({tr:"s.",en:"p.",pt:"p."})} ${M(c.kaynak.sayfa)}</cite>
         </div>`).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"F\xFCt\xFBh\xE2t'\u0131n ba\u015Fka b\xF6l\xFCmlerinde ge\xE7en izler",en:"Traces in other chapters of the Futuhat",pt:"Vest\xEDgios em outros cap\xEDtulos das Futuhat"})}</p>
        <div class="hocalar-diger__liste">${o}</div>`}const n=m.hirkaSilsilesi;if(n&&n.kisiler&&n.kisiler.length){const o={"hirka-veren":{tr:"h\u0131rka veren",en:"gave the robe",pt:"deu o manto"},"hirka-alan":{tr:"h\u0131rka alan",en:"received the robe",pt:"recebeu o manto"}},c=n.kisiler.map(d=>{const f=o[d.rol]||o["hirka-veren"],$=(d.yil_hicri?"h."+d.yil_hicri+", ":"")+e(d.yer);return`<div class="hocalar-diger__satir">
          <strong>${e(d.ad)}</strong>
          <span class="hocalar-diger__rozet hocalar-diger__rozet--${d.rol}">${e(f)}</span>
          <span class="hocalar-diger__meta"> \u2014 ${$}</span>
          <p class="hoca-alinti__baglam">${e(d.not)}</p>
          <cite class="hoca-alinti__kaynak">${w(d.kaynak.eser)}, ${M(d.kaynak.sayfa)}</cite>
        </div>`}).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"H\u0131rka silsilesi (Neseb\xFC'l-H\u0131rka'dan)",en:"Chain of the robe (from Neseb\xFC'l-H\u0131rka)",pt:"Cadeia do manto (do Neseb\xFC'l-H\u0131rka)"})}</p>
        <p class="hocalar-diger__not">${e(n.not)}</p>
        <div class="hocalar-diger__liste">${c}</div>`}F.innerHTML=a,O()}function S(){v=null,L.innerHTML=`
      <p class="detail-eyebrow">${e({tr:"Hocalar",en:"Teachers",pt:"Mestres"})}</p>
      <h2 class="detail-title">${e({tr:"Listenin sonundaki iki isim",en:"The last two names on the list",pt:"Os dois \xFAltimos nomes da lista"})}</h2>
      <div class="detail-block detail-block--soru"><p>${e(m.not)}</p></div>`,x.hidden=!1}let N=!1;function B(){if(N)return Promise.resolve();const a=window.__dostRouteBase||"",t=(a?a+"/":"")+"data/ibn-arabi/hocalar.json";return u.fetchJson(t).then(i=>{m=i,k=i.hocalar||[],N=!0,T(),j()})}let D=!1;function G(){D||(D=!0,u.setupDetailPanelFocus&&u.setupDetailPanelFocus(),u.registerStepBack("hocalar-wrap",()=>v?(S(),x.hidden=!0,window.__dostNav&&window.__dostNav.setHash("hocalar"),!0):!1))}return{activate(){G(),B().catch(()=>{window.DostViewStatus&&window.DostViewStatus.showError("hocalar-wrap",()=>window.__hocalarApp.activate())})},onLangChange(){if(N)if(T(),j(),v){const a=k.find(t=>t.id===v);a?E(a):x.hidden||S()}else x.hidden||S()},goToNode(a){this.activate(),B().then(()=>{const t=k.find(i=>i.id===a);t?E(t):a&&window.__dostNav&&window.__dostNav.setHash("hocalar")})}}})();
