(function(){"use strict";const S=window.DostI18n;let b=null,L=null;const t=S.pick3;function T(){return b?Promise.resolve(b):L||(L=window.DostGraphUtils.fetchJson("data/ibn-arabi/futuhat-cizimleri.json").then(e=>(b=e,e)).catch(e=>(console.error("Dost'un eli \u015Fekilleri y\xFCklenemedi / Failed to load Dost's own figures",e),L=null,null)),L)}const N={"bulut-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 320 340" role="img" aria-label="${t(e.outer)}">
        <circle class="term-diagram-node--dashed" cx="160" cy="175" r="150"/>
        <text class="term-diagram-label--small" x="160" y="20" text-anchor="middle">${t(e.outer)}</text>
        <polygon class="term-diagram-node" points="160,58 132,112 188,112"/>
        <text class="term-diagram-label--small" x="160" y="98" text-anchor="middle">${t(e.intellect)}</text>
        <rect class="term-diagram-node" x="105" y="122" width="110" height="52" rx="4"/>
        <text class="term-diagram-label--small" x="160" y="138" text-anchor="middle">${t(e.soul)}</text>
        <circle class="term-diagram-node--faint term-diagram-node--sm" cx="130" cy="160" r="13"/>
        <text class="term-diagram-note" x="130" y="164" text-anchor="middle">${t(e.faculty1)}</text>
        <circle class="term-diagram-node--faint term-diagram-node--sm" cx="190" cy="160" r="13"/>
        <text class="term-diagram-note" x="190" y="164" text-anchor="middle">${t(e.faculty2)}</text>
        <rect class="term-diagram-node" x="115" y="192" width="90" height="90"/>
        <line class="term-diagram-tether" x1="115" y1="192" x2="205" y2="282"/>
        <line class="term-diagram-tether" x1="205" y1="192" x2="115" y2="282"/>
        <text class="term-diagram-note" x="160" y="204" text-anchor="middle">${t(e.heat)}</text>
        <text class="term-diagram-note" x="160" y="278" text-anchor="middle">${t(e.cold)}</text>
        <text class="term-diagram-note" x="122" y="242" text-anchor="middle">${t(e.wet)}</text>
        <text class="term-diagram-note" x="198" y="242" text-anchor="middle">${t(e.dry)}</text>
        <text class="term-diagram-label" x="160" y="235" text-anchor="middle">${t(e.nature)}</text>
        <circle class="term-diagram-node--accent" cx="160" cy="292" r="26"/>
        <text class="term-diagram-label--small" x="160" y="297" text-anchor="middle">${t(e.core)}</text>
      </svg>
    `,"ars-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 300 300" role="img" aria-label="${t(e.throne)}">
        <circle class="term-diagram-node--dashed" cx="150" cy="150" r="135"/>
        <text class="term-diagram-label--small" x="150" y="24" text-anchor="middle">${t(e.outer)}</text>
        <circle class="term-diagram-node" cx="150" cy="150" r="95"/>
        <text class="term-diagram-label" x="150" y="63" text-anchor="middle">${t(e.pillar1)}</text>
        <text class="term-diagram-label" x="150" y="253" text-anchor="middle">${t(e.pillar3)}</text>
        <text class="term-diagram-label" x="47" y="154" text-anchor="middle">${t(e.pillar4)}</text>
        <text class="term-diagram-label" x="253" y="154" text-anchor="middle">${t(e.pillar2)}</text>
        <circle class="term-diagram-node--sm" cx="130" cy="235" r="5"/>
        <circle class="term-diagram-node--sm" cx="170" cy="235" r="5"/>
        <circle class="term-diagram-node--accent" cx="150" cy="150" r="42"/>
        <text class="term-diagram-label--small" x="150" y="155" text-anchor="middle">${t(e.core)}</text>
        <text class="term-diagram-note" x="150" y="218" text-anchor="middle">${t(e.feet)}</text>
      </svg>
    `,"cadir-sureti":e=>{const a=[25,45,65,85,105,125,145],r=160,c=230,n=a.map(m=>`<path class="term-diagram-arrow" d="M${r-m},${c} A${m},${m} 0 0,1 ${r+m},${c}" fill="none"/>`).join(""),i=[e.kingdom1,e.kingdom2,e.kingdom3,e.kingdom4],o=[70,130,190,250],s=i.map((m,l)=>`
        <circle class="term-diagram-node--faint" cx="${o[l]}" cy="278" r="23"/>
        <text class="term-diagram-note" x="${o[l]}" y="282" text-anchor="middle">${t(m)}</text>
      `).join("");return`
        <svg class="cizim-card__svg" viewBox="0 0 320 320" role="img" aria-label="${t(e.pillar)}">
          ${n}
          <text class="term-diagram-note" x="160" y="200" text-anchor="middle">${t(e.domes[0])}</text>
          <text class="term-diagram-note" x="160" y="80" text-anchor="middle">${t(e.domes[6])}</text>
          <line class="term-diagram-arrow" x1="160" y1="228" x2="160" y2="20" marker-end="url(#cizimArrowEnd)"/>
          <text class="term-diagram-label--small" x="196" y="128" text-anchor="middle">${t(e.pillar)}</text>
          ${s}
        </svg>
      `},"esma-hazretleri-sureti":e=>{const a=[[47.8,134.5],[75.4,179.2],[118.5,209.4],[170,220],[221.5,209.4],[264.6,179.2],[292.2,134.5]],r=e.names.map((c,n)=>`
        <line class="term-diagram-tether" x1="170" y1="90" x2="${a[n][0]}" y2="${a[n][1]}"/>
      `).join("")+e.names.map((c,n)=>`
        <circle class="term-diagram-node${n===0?" term-diagram-node--accent":""}" cx="${a[n][0]}" cy="${a[n][1]}" r="21"/>
        <text class="term-diagram-note" x="${a[n][0]}" y="${a[n][1]+4}" text-anchor="middle">${t(c)}</text>
      `).join("");return`
        <svg class="cizim-card__svg" viewBox="0 0 340 260" role="img" aria-label="${t(e.center)}">
          <line class="term-diagram-tether" x1="110" y1="45" x2="170" y2="90"/>
          <line class="term-diagram-tether" x1="230" y1="45" x2="170" y2="90"/>
          <circle class="term-diagram-node--dashed term-diagram-node--sm" cx="110" cy="45" r="20"/>
          <text class="term-diagram-note" x="110" y="49" text-anchor="middle">${t(e.parent1)}</text>
          <circle class="term-diagram-node--dashed term-diagram-node--sm" cx="230" cy="45" r="20"/>
          <text class="term-diagram-note" x="230" y="49" text-anchor="middle">${t(e.parent2)}</text>
          ${r}
          <circle class="term-diagram-node--accent" cx="170" cy="90" r="30"/>
          <text class="term-diagram-label--small" x="170" y="95" text-anchor="middle">${t(e.center)}</text>
        </svg>
      `},"iki-yol-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 320 170" role="img" aria-label="${t(e.straight)}">
        <circle class="term-diagram-node--sm" cx="30" cy="85" r="8"/>
        <text class="term-diagram-note" x="30" y="115" text-anchor="middle">${t(e.start)}</text>
        <circle class="term-diagram-node--accent term-diagram-node--sm" cx="290" cy="85" r="8"/>
        <text class="term-diagram-note" x="290" y="115" text-anchor="middle">${t(e.end)}</text>
        <line class="term-diagram-arrow term-diagram-arrow--oneway" x1="40" y1="85" x2="278" y2="85" marker-end="url(#cizimArrowEnd)"/>
        <text class="term-diagram-label--small" x="160" y="65" text-anchor="middle">${t(e.straight)}</text>
        <path class="term-diagram-arrow term-diagram-arrow--dashed" d="M40,85 Q90,35 160,85 Q230,135 278,85" fill="none"/>
        <text class="term-diagram-label--small" x="160" y="150" text-anchor="middle">${t(e.crooked)}</text>
      </svg>
    `,"nokta-muhit-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 320 320" role="img" aria-label="${t(e.point)}">
        <circle class="term-diagram-node--dashed" cx="160" cy="170" r="140"/>
        <text class="term-diagram-note" x="245" y="90" text-anchor="middle">${t(e.circumference)}</text>
        <line class="term-diagram-tether" x1="160" y1="30" x2="60" y2="220"/>
        <line class="term-diagram-tether" x1="160" y1="30" x2="90" y2="260"/>
        <line class="term-diagram-tether" x1="160" y1="30" x2="160" y2="290"/>
        <line class="term-diagram-tether" x1="160" y1="30" x2="230" y2="260"/>
        <line class="term-diagram-tether" x1="160" y1="30" x2="260" y2="220"/>
        <circle class="term-diagram-node--accent term-diagram-node--sm" cx="160" cy="30" r="9"/>
        <text class="term-diagram-label--small" x="160" y="18" text-anchor="middle">${t(e.point)}</text>
        <text class="term-diagram-note" x="160" y="235" text-anchor="middle">${t(e.gap)}</text>
      </svg>
    `,"insan-i-kamil-yakinsama":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 320 200" role="img" aria-label="${t(e.center)}">
        <line class="term-diagram-arrow" x1="55" y1="50" x2="222" y2="95" marker-end="url(#cizimArrowEnd)"/>
        <line class="term-diagram-arrow" x1="55" y1="100" x2="218" y2="100" marker-end="url(#cizimArrowEnd)"/>
        <line class="term-diagram-arrow" x1="55" y1="150" x2="222" y2="105" marker-end="url(#cizimArrowEnd)"/>
        <circle class="term-diagram-node--sm" cx="40" cy="50" r="14"/>
        <text class="term-diagram-note" x="40" y="30" text-anchor="middle">${t(e.source1)}</text>
        <circle class="term-diagram-node--sm" cx="40" cy="100" r="14"/>
        <text class="term-diagram-note" x="40" y="80" text-anchor="middle">${t(e.source2)}</text>
        <circle class="term-diagram-node--sm" cx="40" cy="150" r="14"/>
        <text class="term-diagram-note" x="40" y="130" text-anchor="middle">${t(e.source3)}</text>
        <path class="term-diagram-mirror" d="M245,65 A50,50 0 0,1 245,135" fill="none"/>
        <text class="term-diagram-note" x="272" y="104" text-anchor="middle">${t(e.shadow)}</text>
        <circle class="term-diagram-node--accent" cx="240" cy="100" r="28"/>
        <text class="term-diagram-label--small" x="240" y="105" text-anchor="middle">${t(e.center)}</text>
      </svg>
    `,"uc-mertebe-cicegi":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 340 340" role="img" aria-label="${t(e.center)}">
        <circle class="term-diagram-node--faint" cx="170" cy="55" r="58"/>
        <circle class="term-diagram-node--faint" cx="55" cy="170" r="58"/>
        <circle class="term-diagram-node--faint" cx="285" cy="170" r="58"/>
        <circle class="term-diagram-node--faint" cx="170" cy="285" r="58"/>
        <text class="term-diagram-note" x="170" y="28" text-anchor="middle">${t(e.fire)}</text>
        <text class="term-diagram-note" x="28" y="170" text-anchor="middle">${t(e.air)}</text>
        <text class="term-diagram-note" x="312" y="170" text-anchor="middle">${t(e.earth)}</text>
        <text class="term-diagram-note" x="170" y="317" text-anchor="middle">${t(e.water)}</text>
        <text class="term-diagram-note" x="103" y="103" text-anchor="middle">${t(e.soul)}</text>
        <text class="term-diagram-note" x="237" y="103" text-anchor="middle">${t(e.intellect)}</text>
        <text class="term-diagram-note" x="237" y="242" text-anchor="middle">${t(e.nature)}</text>
        <text class="term-diagram-note" x="103" y="242" text-anchor="middle">${t(e.particles)}</text>
        <circle class="term-diagram-node" cx="170" cy="115" r="30"/>
        <circle class="term-diagram-node" cx="115" cy="170" r="30"/>
        <circle class="term-diagram-node" cx="225" cy="170" r="30"/>
        <circle class="term-diagram-node" cx="170" cy="225" r="30"/>
        <text class="term-diagram-label--small" x="170" y="120" text-anchor="middle">${t(e.life)}</text>
        <text class="term-diagram-label--small" x="119" y="174" text-anchor="middle">${t(e.power)}</text>
        <text class="term-diagram-label--small" x="221" y="174" text-anchor="middle">${t(e.knowledge)}</text>
        <text class="term-diagram-label--small" x="170" y="230" text-anchor="middle">${t(e.will)}</text>
        <circle class="term-diagram-node--accent" cx="170" cy="170" r="32"/>
        <text class="term-diagram-label--small" x="170" y="175" text-anchor="middle">${t(e.center)}</text>
      </svg>
    `,"dort-makam-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 260 260" role="img" aria-label="${t(e.q1)}">
        <circle class="term-diagram-node--dashed" cx="130" cy="130" r="108"/>
        <line class="term-diagram-axis" x1="130" y1="24" x2="130" y2="236"/>
        <line class="term-diagram-axis" x1="24" y1="130" x2="236" y2="130"/>
        <text class="term-diagram-label--small" x="130" y="75" text-anchor="middle">${t(e.q1)}</text>
        <text class="term-diagram-label--small" x="185" y="135" text-anchor="middle">${t(e.q2)}</text>
        <text class="term-diagram-label--small" x="130" y="195" text-anchor="middle">${t(e.q3)}</text>
        <text class="term-diagram-label--small" x="75" y="135" text-anchor="middle">${t(e.q4)}</text>
      </svg>
    `,"arz-i-hasr-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 300 390" role="img" aria-label="${t(e.throne)}">
        <polygon class="term-diagram-node--accent" points="150,20 190,55 150,90 110,55"/>
        <text class="term-diagram-label--small" x="150" y="60" text-anchor="middle">${t(e.throne)}</text>
        <line class="term-diagram-tether" x1="150" y1="90" x2="150" y2="112"/>
        <circle class="term-diagram-node" cx="150" cy="135" r="23"/>
        <text class="term-diagram-note" x="150" y="139" text-anchor="middle">${t(e.spirit)}</text>
        <circle class="term-diagram-node--faint" cx="75" cy="200" r="30"/>
        <text class="term-diagram-note" x="75" y="204" text-anchor="middle">${t(e.bookRight)}</text>
        <circle class="term-diagram-node--faint" cx="225" cy="200" r="30"/>
        <text class="term-diagram-note" x="225" y="204" text-anchor="middle">${t(e.bookLeft)}</text>
        <circle class="term-diagram-node--dashed term-diagram-node--sm" cx="150" cy="255" r="16"/>
        <text class="term-diagram-note" x="150" y="285" text-anchor="middle">${t(e.death)}</text>
        <line class="term-diagram-arrow" x1="150" y1="255" x2="212" y2="308" marker-end="url(#cizimArrowEnd)"/>
        <text class="term-diagram-note" x="195" y="298" text-anchor="middle">${t(e.sirat)}</text>
        <path class="term-diagram-node--faint" d="M175,340 A45,45 0 0,1 265,340 Z"/>
        <text class="term-diagram-note" x="220" y="335" text-anchor="middle">${t(e.hell)}</text>
        <circle class="term-diagram-node--accent" cx="80" cy="330" r="48"/>
        <text class="term-diagram-label--small" x="80" y="334" text-anchor="middle">${t(e.paradiseMeadow)}</text>
      </svg>
    `,"kesib-ur-ruya-sureti":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 300 300" role="img" aria-label="${t(e.center)}">
        <line class="term-diagram-tether" x1="150" y1="150" x2="150" y2="80"/>
        <line class="term-diagram-tether" x1="150" y1="150" x2="75" y2="150"/>
        <line class="term-diagram-tether" x1="150" y1="150" x2="225" y2="150"/>
        <line class="term-diagram-tether" x1="150" y1="150" x2="150" y2="220"/>
        <circle class="term-diagram-node--dashed" cx="150" cy="65" r="28"/>
        <text class="term-diagram-note" x="150" y="69" text-anchor="middle">${t(e.prophets)}</text>
        <circle class="term-diagram-node--dashed" cx="55" cy="150" r="28"/>
        <text class="term-diagram-note" x="55" y="154" text-anchor="middle">${t(e.saints)}</text>
        <circle class="term-diagram-node--dashed" cx="245" cy="150" r="28"/>
        <text class="term-diagram-note" x="245" y="154" text-anchor="middle">${t(e.messengers)}</text>
        <circle class="term-diagram-node--dashed" cx="150" cy="235" r="28"/>
        <text class="term-diagram-note" x="150" y="239" text-anchor="middle">${t(e.believers)}</text>
        <circle class="term-diagram-node--accent" cx="150" cy="150" r="40"/>
        <text class="term-diagram-label--small" x="150" y="155" text-anchor="middle">${t(e.center)}</text>
      </svg>
    `,"suretud-dirah":e=>`
      <svg class="cizim-card__svg" viewBox="0 0 200 200" role="img" aria-label="${t(e.label)}">
        <path class="term-diagram-node--accent" d="M55,30 L145,30 L145,140 A45,45 0 0 1 55,140 Z"/>
        <text class="term-diagram-label--small" x="100" y="90" text-anchor="middle">${t(e.label)}</text>
      </svg>
    `},te=`
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <defs>
        <marker id="cizimArrowEnd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" class="term-diagram-arrowhead"/>
        </marker>
      </defs>
    </svg>
  `;function ae(e){return e&&typeof e=="object"?t(e):e||""}function q(e){const a=S&&S.getLang?S.getLang():"tr";if(!e||a==="tr")return e||"";const r=a==="pt"?"T\u0130EM/Museu Evkaf":"T\u0130EM/Evkaf Museum";return e.replace(/^Fütûhât,/,"Futuhat,").replace(/böl\. /g,"sec. ").replace(/TİEM\/Evkaf Müzesi/g,r).replace(/vr\. /g,"fol. ")}function re(){return!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)}function ie(e){const a=e&&e.querySelector("svg.cizim-card__svg");if(!a||!a.animate)return;a.getAnimations({subtree:!0}).forEach(s=>s.cancel());const r=[...a.querySelectorAll("path,line,circle,rect,ellipse,polyline,polygon")].filter(s=>!s.closest("defs,marker,clipPath")),c=[...a.querySelectorAll("text,tspan")].filter(s=>s.tagName==="text"),n=Math.min(110,5200/Math.max(1,r.length)),i=520;r.forEach((s,m)=>{let l=0;try{l=s.getTotalLength()}catch{l=0}const d={fillOpacity:0,strokeOpacity:0},h={fillOpacity:1,strokeOpacity:1};l>0&&(d.strokeDasharray=l,d.strokeDashoffset=l,h.strokeDasharray=l,h.strokeDashoffset=0,d.strokeOpacity=1),s.animate([d,h],{duration:i,delay:m*n,fill:"backwards",easing:"ease-out"})});const o=r.length*n+i;c.forEach(s=>s.animate([{opacity:0},{opacity:1}],{duration:500,delay:o,fill:"backwards"}))}function G(){document.getElementById("cizimArrowEnd")||document.body.insertAdjacentHTML("beforeend",te)}function se(e){if(!b)return;const a=b.diagrams.find(n=>n.id===e);if(!a)return;const r=N[a.diagram.type],c=r?r(a.diagram):"";G(),window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),svgHtml:c,ref:ae(a.source_ref),name:t(a.name)})}const u="http://www.w3.org/2000/svg",$=[{id:"ama",shortLabel:{tr:"Bulut",en:"The Cloud",pt:"A Nuvem"},label:{tr:"Bulut (Am\xE2)",en:"The Cloud (al-\u02BFam\u0101\u02BE)",pt:"A Nuvem (al-\u02BFam\u0101\u02BE)"},gloss:{tr:`Dizinin ba\u015Flang\u0131c\u0131: varl\u0131\u011F\u0131n ilk mertebeleri, "merhametli bir buhar" olan Bulut'ta a\xE7\u0131l\u0131yor. "D\xFCnyan\u0131n s\xFBreti b\xFCt\xFCn\xFCyle k\xFCresel bir dairedir" \u2014 \u015Eeyh'in kendi s\xF6z\xFC.`,en:`The start of the sequence: the first levels of being unfold within the Cloud, "a merciful vapor." "The form of the world in its entirety is a spherical circle" \u2014 in the Shaykh's own words.`,pt:'O in\xEDcio da sequ\xEAncia: os primeiros n\xEDveis do ser desdobram-se na Nuvem, "um vapor misericordioso." "A forma do mundo na sua totalidade \xE9 um c\xEDrculo esf\xE9rico" \u2014 nas palavras do pr\xF3prio Xeique.'},cite:"F\xFCt\xFBh\xE2t, 9.316 (Tyser 2023, b\xF6l. 4.1; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 90a)"},{id:"ars-kursi",shortLabel:{tr:"Ar\u015F \u2013 K\xFCrs\xEE",en:"Throne \u2013 Footstool",pt:"Trono \u2013 Escabelo"},label:{tr:"Ar\u015F-\u0131 \u0130stiv\xE2, K\xFCrs\xEE, \u0130ki Ayak, Su, Hava, Karanl\u0131k",en:"The Throne of Sitting, Footstool, Two Feet, Water, Air, Darkness",pt:"O Trono de Assento, Escabelo, Dois P\xE9s, \xC1gua, Ar, Escurid\xE3o"},gloss:{tr:`Bir \xF6nceki haritan\u0131n en i\xE7 dairesine iniliyor. Ar\u015F d\xF6rt unsura (ate\u015F, hava, su, toprak) dayan\u0131yor. Metindeki "iki ayak"tan biri cennette, biri cehennemde, ikisi de K\xFCrs\xEE'nin \xFCst\xFCnde.`,en:`Descends into the innermost circle of the previous map. The Throne rests on four elements (fire, air, water, earth). Of the text's "two feet", one is set in Paradise, the other in Hell, both resting on the Footstool.`,pt:'Desce para o c\xEDrculo mais interior do mapa anterior. O Trono assenta em quatro elementos (fogo, ar, \xE1gua, terra). Dos "dois p\xE9s" do texto, um est\xE1 no Para\xEDso, o outro no Inferno, ambos sobre o Escabelo.'},cite:"Tyser 2023, b\xF6l. 4.2; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 90b"},{id:"atlas",shortLabel:{tr:"Atlas Fele\u011Fi",en:"Sphere of Atlas",pt:"Esfera de Atlas"},label:{tr:"Atlas Fele\u011Fi, Cennetler, Sabit Y\u0131ld\u0131zlar K\xFCresi, T\xFBb\xE2 A\u011Fac\u0131",en:"The Sphere of Atlas, the Gardens, the Root of the Starry Sphere, the Tree of \u1E6C\u016Bb\u0101",pt:"A Esfera de Atlas, os Jardins, a Raiz da Esfera Estelar, a \xC1rvore de \u1E6C\u016Bb\u0101"},gloss:{tr:"\u0130ni\u015F s\xFCr\xFCyor. Atlas fele\u011Fi ile sabit y\u0131ld\u0131zlar k\xFCresi aras\u0131nda sekiz cennet kona\u011F\u0131 s\u0131ralan\u0131yor \u2014 her biri, \u015Eeriat'a t\xE2bi bir organa (g\xF6z, kulak, dil, el, mide, \xFCreme organ\u0131, ayak, kalp) kar\u015F\u0131l\u0131k geliyor.",en:"The descent continues. Between the sphere of Atlas and the sphere of the fixed stars, eight paradisal abodes are arrayed \u2014 each corresponding to a bodily member subject to the Law (eye, ear, tongue, hand, stomach, reproductive organ, leg, heart).",pt:"A descida continua. Entre a esfera de Atlas e a esfera das estrelas fixas, alinham-se oito moradas paradis\xEDacas \u2014 cada uma correspondendo a um membro do corpo sujeito \xE0 Lei (olho, ouvido, l\xEDngua, m\xE3o, est\xF4mago, \xF3rg\xE3o reprodutor, perna, cora\xE7\xE3o)."},cite:"Tyser 2023, b\xF6l. 4.3; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 91a"},{id:"sabit-yildizlar-insan",shortLabel:{tr:"Sabit Y\u0131ld\u0131zlar",en:"Fixed Stars",pt:"Estrelas Fixas"},label:{tr:"Sabit Y\u0131ld\u0131zlar K\xFCresi, G\xF6kkubbeler, Yer, D\xF6rt Mertebe ve \u0130nsan",en:"The Sphere of the Fixed Stars, the Domes of the Heavens, the Earth, the Four Realms, and Man",pt:"A Esfera das Estrelas Fixas, as C\xFApulas dos C\xE9us, a Terra, os Quatro Reinos e o Homem"},gloss:{tr:`Bir \xE7ad\u0131r bi\xE7iminde: d\xFCnyan\u0131n \xFCst\xFCnde yedi g\xF6k, yedi gezegen. B\xFCt\xFCn k\xFCreleri dikey bir "direk" kesiyor \u2014 Kur'an'daki g\xF6r\xFCnmez dire\u011Fe (13:2) i\u015Faret eden bu \xE7izgi, \u0130bn Arab\xEE'ye g\xF6re \u0130ns\xE2n-\u0131 K\xE2mil'dir; g\xF6kleri yery\xFCz\xFCne d\xFC\u015Fmekten O tutuyor.`,en:`In the shape of a tent: seven heavens above the earth, seven planets. A vertical "pillar" crosses all the spheres \u2014 this line, pointing to the invisible pillar of the Qur'an (13:2), is, for Ibn al-\u02BFArab\u012B, the Perfect Man; through him God holds the heavens from falling upon the earth.`,pt:'Em forma de tenda: sete c\xE9us acima da terra, sete planetas. Um "pilar" vertical atravessa todas as esferas \u2014 esta linha, apontando para o pilar invis\xEDvel do Alcor\xE3o (13:2), \xE9, para Ibn al-\u02BFArab\u012B, o Homem Perfeito; \xE9 atrav\xE9s dele que Deus impede os c\xE9us de ca\xEDrem sobre a terra.'},cite:"F\xFCt\xFBh\xE2t, 9.313 (Tyser 2023, b\xF6l. 4.4; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 91b)"},{id:"arz-i-hasr",shortLabel:{tr:"Ha\u015Fir Yeri",en:"Gathering",pt:"Reuni\xE3o"},label:{tr:"Ha\u015Fir Yeri, Ayr\u0131m ve H\xFCk\xFCm Ar\u015F\u0131, Melek Saflar\u0131",en:"The Land of Gathering, the Throne of Separation and Judgement, the Rows of Angels",pt:"A Terra da Reuni\xE3o, o Trono de Separa\xE7\xE3o e Julgamento, as Fileiras de Anjos"},gloss:{tr:"K\u0131ldan ince, k\u0131l\u0131\xE7tan keskin s\u0131r\xE2t k\xF6pr\xFCs\xFC cehennemin \xFCst\xFCnde gerili. \xD6l\xFCm\xFCn kesili\u015Fini simgeleyen bir daire, cenneti cehennemden ay\u0131ran a'r\xE2f \xE7izgisiyle kesi\u015Fiyor. Yedi melek saf\u0131 ve sekiz s\xFCtun \xFCzerindeki H\xFCk\xFCm Ar\u015F\u0131, sahneyi yukar\u0131dan ku\u015Fat\u0131yor.",en:'The bridge of the path (\u1E63ir\u0101\u1E6D), thinner than a hair and sharper than a sword, stretches over hell. A circle symbolizing the slaughter of death intersects the line of the "heights" (al-a\u02BFr\u0101f) separating paradise from hell. Seven rows of angels and the Throne of Judgement, resting on eight pillars, frame the scene from above.',pt:'A ponte do caminho (\u1E63ir\u0101\u1E6D), mais fina que um cabelo e mais afiada que uma espada, estende-se sobre o inferno. Um c\xEDrculo simbolizando o abate da morte intersecta a linha das "alturas" (al-a\u02BFr\u0101f) que separa o para\xEDso do inferno. Sete fileiras de anjos e o Trono do Julgamento, apoiado em oito pilares, emolduram a cena vista do alto.'},cite:"Tyser 2023, b\xF6l. 4.5; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 92a"},{id:"cehennem-kapilari",shortLabel:{tr:"Cehennem Kap\u0131lar\u0131",en:"Gates of Hell",pt:"Port\xF5es do Inferno"},label:{tr:"Cehennemin Kap\u0131lar\u0131, Konaklar\u0131 ve \u0130nen Dereceleri",en:"The Gates of Hell, Its Abodes, and Its Descending Levels",pt:"Os Port\xF5es do Inferno, as suas Moradas e N\xEDveis Descendentes"},gloss:{tr:`Cehennemin yedi kap\u0131s\u0131, insan\u0131n \u015Eeriat'a t\xE2bi yedi organ\u0131na kar\u015F\u0131l\u0131k geliyor. \u015Eeman\u0131n tam merkezinde, kalbi \xF6rten bir kap\u0131 duruyor \u2014 insan\u0131n i\xE7indeki "gayb"\u0131n yeri. "\u0130nsan\u0131n d\xFCnyadaki b\xE2t\u0131n\u0131, ahirette z\xE2hir olur."`,en:`Hell's seven gates correspond to the seven bodily members subject to the Law. At the very center of the diagram stands a door veiling the heart \u2014 the place of the unseen within man. "What is interior in man in this world becomes exterior in the hereafter."`,pt:'Os sete port\xF5es do inferno correspondem aos sete membros do corpo sujeitos \xE0 Lei. No centro exato do diagrama ergue-se uma porta que vela o cora\xE7\xE3o \u2014 o lugar do invis\xEDvel dentro do homem. "O que \xE9 interior no homem neste mundo torna-se exterior no al\xE9m."'},cite:"F\xFCt\xFBh\xE2t, 9.356 (Tyser 2023, b\xF6l. 4.6; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 92b)"},{id:"esma-hazretleri",shortLabel:{tr:"\u0130lah\xEE \u0130simler",en:"Divine Names",pt:"Nomes Divinos"},label:{tr:"\u0130lah\xEE \u0130simler Huzuru, Alt D\xFCnya, Ahiret, Berzah",en:"The Presence of the Divine Names, the Lowest World, the Hereafter, the Intermediary World",pt:"A Presen\xE7a dos Nomes Divinos, o Mundo Inferior, o Al\xE9m, o Mundo Interm\xE9dio"},gloss:{tr:'\u0130lah\xEE isimlerin de kendi aralar\u0131nda bir d\xFCzeni var: "\xF6nc\xFCler" ve "hizmetk\xE2rlar." Varl\u0131\u011F\u0131n sebebi olan yedi ana isim \u2014 Hayy, Al\xEEm, M\xFCr\xEEd, K\xE2dir, K\xE2il, Cevv\xE2d, Muksit \u2014 bu d\xFCnya, ahiret ve ikisi aras\u0131ndaki berzah\u0131n kesi\u015Fti\u011Fi yerde beliriyor.',en:'The divine names, too, have their own order: "chiefs" and "servants." Seven principal names \u2014 the Living, the Knower, the One who wills, the One who is able, the One who speaks, the Most-Generous, the Equitable \u2014 appear at the point where this world, the hereafter, and the barzakh between them meet.',pt:'Tamb\xE9m os nomes divinos t\xEAm a sua pr\xF3pria ordem: "chefes" e "servos." Sete nomes principais \u2014 o Vivo, o Sabedor, Aquele que quer, Aquele que pode, Aquele que fala, o Generos\xEDssimo, o Equ\xE2nime \u2014 aparecem no ponto onde este mundo, o al\xE9m, e o barzakh entre eles se encontram.'},cite:"Tyser 2023, b\xF6l. 4.7; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 93a"},{id:"ruyet",shortLabel:{tr:"R\xFC'yet Tepesi",en:"Dune of Vision",pt:"Duna da Vis\xE3o"},label:{tr:"R\xFC'yet Kum Tepesi \u2014 Allah'\u0131n y\xFCz\xFCn\xFCn a\xE7\u0131ld\u0131\u011F\u0131 an",en:"The Dune of Vision \u2014 the moment God's face is unveiled",pt:"A Duna da Vis\xE3o \u2014 o momento em que o rosto de Deus se revela"},gloss:{tr:`Cennette, halk\u0131n Allah'\u0131n y\xFCz\xFCn\xFC g\xF6rd\xFC\u011F\xFC belirli bir an ve yer \u2014 "beyaz misktendir."`,en:`A specific moment and place in paradise where the people see God's face \u2014 "made of white musk."`,pt:'Um momento e lugar espec\xEDficos no para\xEDso onde o povo v\xEA o rosto de Deus \u2014 "feito de alm\xEDscar branco."'},cite:"Tyser 2023, b\xF6l. 4.8; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 93b"},{id:"kozmos",shortLabel:{tr:"Kozmosun Tamam\u0131",en:"The Whole Cosmos",pt:"Todo o Cosmos"},label:{tr:"Kozmosun tamam\u0131 \u2014 sekiz haritan\u0131n sentezi",en:"The entirety of the cosmos \u2014 a synthesis of eight maps",pt:"A totalidade do cosmos \u2014 uma s\xEDntese de oito mapas"},gloss:{tr:`\u015Eeklinin merkezi, R\xFC'yet Kum Tepesi'yle ayn\u0131 bi\xE7imi ta\u015F\u0131yor \u2014 ahiret, d\xFCnyan\u0131n tam merkezinde duruyor. \u0130bn Arab\xEE'nin kendi ifadesiyle: "d\xFCnya, Bulut ile Allah'\u0131n bak\u0131\u015F\u0131 aras\u0131nda beliriyor."`,en:`The shape of its center matches that of the Dune of Vision \u2014 the hereafter sits at the very core of the world. In Ibn al-\u02BFArab\u012B's own words: "the world appears between the Cloud and the glance of God."`,pt:'A forma do seu centro corresponde \xE0 da Duna da Vis\xE3o \u2014 o al\xE9m situa-se no pr\xF3prio n\xFAcleo do mundo. Nas palavras do pr\xF3prio Ibn al-\u02BFArab\u012B: "o mundo aparece entre a Nuvem e o olhar de Deus."'},cite:"F\xFCt\xFBh\xE2t, 9.461 (Tyser 2023, b\xF6l. 4.9; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 93b-94a)"}];function R(e){const a=document.createElementNS(u,"circle");a.setAttribute("cx",0),a.setAttribute("cy",0),a.setAttribute("r",90),a.setAttribute("fill","none"),a.setAttribute("stroke","var(--text-primary)"),a.setAttribute("stroke-width",1.4),a.setAttribute("opacity",.6),e.appendChild(a)}function F(e,a){const r=document.createElementNS(u,"g");r.setAttribute("stroke","var(--text-primary)"),r.setAttribute("stroke-width",1.6),r.setAttribute("fill","none"),r.setAttribute("stroke-linecap","round");const c=(i,o,s,m)=>{const l=document.createElementNS(u,"line");l.setAttribute("x1",i),l.setAttribute("y1",o),l.setAttribute("x2",s),l.setAttribute("y2",m),r.appendChild(l)},n=(i,o,s,m)=>{const l=document.createElementNS(u,"circle");l.setAttribute("cx",i),l.setAttribute("cy",o),l.setAttribute("r",s),m&&l.setAttribute("fill","var(--text-primary)"),r.appendChild(l)};switch(a){case 0:c(-110,0,110,0);break;case 1:c(0,-110,0,110);break;case 2:c(-78,-78,78,78);break;case 3:c(-78,78,78,-78);break;case 4:for(let i=0;i<8;i++){const o=i/8*Math.PI*2;n(Math.cos(o)*90,Math.sin(o)*90,4,!0)}break;case 5:for(let i=0;i<6;i++){const o=i/6*Math.PI*2+Math.PI/6;n(Math.cos(o)*55,Math.sin(o)*55,3,!0)}break;case 6:{const i=[];for(let s=0;s<3;s++){const m=s/3*Math.PI*2-Math.PI/2;i.push([Math.cos(m)*88,Math.sin(m)*88])}const o=document.createElementNS(u,"polygon");o.setAttribute("points",i.map(s=>s.join(",")).join(" ")),o.setAttribute("fill","none"),r.appendChild(o);break}case 7:{const o=document.createElementNS(u,"polygon");o.setAttribute("points","0,-88 88,0 0,88 -88,0"),r.appendChild(o);break}case 8:{n(0,0,4,!0),[0,90,180,270].forEach(i=>{const o=i*Math.PI/180;c(Math.cos(o)*22,Math.sin(o)*22,Math.cos(o)*40,Math.sin(o)*40)});break}}e.appendChild(r)}const P=[300,800,1300,300,800,1300,300,800,1300],Y=[250,250,250,500,500,500,750,750,750],O=.65,ne=2,g=[800,500],j=232,oe=[8,0,1,7,4,2,6,5,3],z=document.documentElement.hasAttribute("data-seyr")&&!document.documentElement.classList.contains("dost-uygulama");let f=0;const W=300,le=.55,ce=.9;function U(e){if(!z)return{x:P[e],y:Y[e],olcek:O};if(e===f)return{x:g[0],y:g[1],olcek:ce};const a=e<f?e:e-1,r=-Math.PI/2+a/($.length-1)*Math.PI*2;return{x:g[0]+W*Math.cos(r),y:g[1]+W*Math.sin(r),olcek:le}}const J=e=>-Math.PI/2+oe[e]/$.length*Math.PI*2,de=e=>e*e*(3-2*e);let p=0,y=null,M=null;function X(e){const a=$[e],r=document.createElementNS(u,"g");R(r),F(r,e);const c=`<svg viewBox="-150 -150 300 300" class="cizim-card__svg" role="img" aria-label="${t(a.label)}">${r.innerHTML}</svg>`;window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),svgHtml:c,ref:e+1+" / "+$.length+" \u2014 "+q(a.cite),name:t(a.label),caption:t(a.gloss)})}function B(){return document.querySelector(".cizim-birlesik__svg")}function me(){const e=B();if(!e||!y)return;const a=e.getBoundingClientRect(),r=Math.max(240,a.width||680),c=Math.max(180,a.height||425),n=r/c,i=r<520,o=i?9:10.5,s=i?12.5:14.5,m=y.map(h=>{const x=h.etiket.style.fontSize;h.etiket.style.fontSize="100px";let k=0;try{k=h.etiket.getComputedTextLength()}catch{k=0}return h.etiket.style.fontSize=x,k||60*(h.etiket.textContent||"").length});let l=Math.max(z?860:1320,800*n);for(let h=0;h<100;h++){const x=o*l/r;if(!y.some((v,A)=>Math.abs(U(A).x-g[0])+m[A]*x/200+16>l/2))break;l+=20}let d=560;for(let h=0;h<200;h++){const x=s*d/r,k=d/n;let v=!0;for(let A=0;A<y.length&&v;A++){const _=J(A),D=m[A]*x/100,C=j+.5*D*Math.abs(Math.cos(_))+.6*x*Math.abs(Math.sin(_)),E=Math.abs(C*Math.cos(_))+D/2+16,H=Math.abs(C*Math.sin(_))+x+12;(E>d/2||H>k/2)&&(v=!1)}if(v)break;d+=20}M={uzakW:l,yakinW:Math.min(d,l),oran:n,cw:r,pxUzak:o,pxYakin:s,genislikler:m}}function I(e){if(!y)return;M||me();const a=M,r=de(e/100),c=B(),n=a?a.uzakW*Math.pow(a.yakinW/a.uzakW,r):1600,i=a?n/a.oran:1e3;c&&c.setAttribute("viewBox",`${(g[0]-n/2).toFixed(1)} ${(g[1]-i/2).toFixed(1)} ${n.toFixed(1)} ${i.toFixed(1)}`);const o=a?a.pxUzak+(a.pxYakin-a.pxUzak)*r:12,s=a?o*n/a.cw:20,m=$.length;for(let d=0;d<m;d++){const h=U(d),x=h.x,k=h.y,v=h.olcek,A=x+(g[0]-x)*r,_=k+(g[1]-k)*r,D=v+(ne-v)*r,C=1-r*.3,E=y[d];E.g.setAttribute("transform",`translate(${A.toFixed(1)} ${_.toFixed(1)}) scale(${D.toFixed(3)})`),E.g.setAttribute("opacity",C.toFixed(3));const H=a?a.genislikler[d]*s/100:0,V=x,Q=k-112*v-s*.45,K=J(d),ee=j+.5*H*Math.abs(Math.cos(K))+.6*s*Math.abs(Math.sin(K)),be=g[0]+ee*Math.cos(K),pe=g[1]+ee*Math.sin(K)+s*.35;E.etiket.setAttribute("x",(V+(be-V)*r).toFixed(1)),E.etiket.setAttribute("y",(Q+(pe-Q)*r).toFixed(1)),E.etiket.style.fontSize=s.toFixed(1)+"px",E.etiket.style.opacity=(.5+.5*Math.abs(2*r-1)).toFixed(3)}const l=document.getElementById("birlesikSlider");l&&Number(l.value)!==Math.round(e)&&(l.value=String(Math.round(e))),l&&l.setAttribute("aria-valuetext",e<=0?t({tr:"Ayr\u0131k: dokuz harita",en:"Apart: nine maps",pt:"Separados: nove mapas"}):e>=100?t({tr:"Birle\u015Fik: tek kompozisyon",en:"Together: one composition",pt:"Reunidos: uma composi\xE7\xE3o"}):t({tr:"Yakla\u015F\u0131l\u0131yor: %",en:"Approaching: %",pt:"A aproximar: %"}).replace("%","%"+Math.round(e)))}function he(e){f=e,M=null,I(p),Z()}function Z(){if(!z||!y)return;y.forEach((r,c)=>r.g.classList.toggle("birlesik-map--secili",c===f));const e=document.getElementById("birlesikSeciliKunye");if(!e)return;const a=$[f];e.innerHTML=`<h3 class="cizim-birlesik__secili-ad">${f+1} \xB7 ${t(a.label)}</h3>
      <p class="cizim-birlesik__secili-kaynak">${q(a.cite)}</p>
      <p class="cizim-birlesik__secili-metin">${t(a.gloss)}</p>
      <button type="button" class="cizim-birlesik__btn" id="birlesikBuyutBtn">${t({tr:"B\xFCy\xFCt",en:"Enlarge",pt:"Ampliar"})}</button>`,document.getElementById("birlesikBuyutBtn").addEventListener("click",()=>X(f))}function w(e){p=Math.max(0,Math.min(100,e)),I(p)}function xe(e){e.addEventListener("wheel",i=>{if(!(i.ctrlKey||i.metaKey))return;i.preventDefault();const o=i.deltaMode===1?16:i.deltaMode===2?400:1;w(p-i.deltaY*o*.22)},{passive:!1});let a=null;const r=i=>Math.hypot(i[0].clientX-i[1].clientX,i[0].clientY-i[1].clientY);e.addEventListener("touchstart",i=>{i.touches.length===2&&(a={d0:r(i.touches)||1,v0:p})},{passive:!0}),e.addEventListener("touchmove",i=>{!a||i.touches.length!==2||(i.preventDefault(),w(a.v0+Math.log(r(i.touches)/a.d0)/Math.log(2.5)*100))},{passive:!1});const c=i=>{(!i.touches||i.touches.length<2)&&(a=null)};e.addEventListener("touchend",c),e.addEventListener("touchcancel",c);let n=null;e.addEventListener("gesturestart",i=>{i.preventDefault(),n=p}),e.addEventListener("gesturechange",i=>{n!=null&&(i.preventDefault(),w(n+Math.log(i.scale||1)/Math.log(2.5)*100))}),e.addEventListener("gestureend",()=>{n=null})}function ue(){const e=document.getElementById("birlesikMapsG"),a=document.getElementById("birlesikEtiketG");if(!e||!a)return;e.innerHTML="",a.innerHTML="",y=[],M=null;const r=t({tr:"B\xFCy\xFCt: ",en:"Enlarge: ",pt:"Ampliar: "});$.forEach((i,o)=>{const s=document.createElementNS(u,"g"),m=document.createElementNS(u,"circle");m.setAttribute("cx",0),m.setAttribute("cy",0),m.setAttribute("r",112),m.setAttribute("class","birlesik-map__hit"),m.setAttribute("pointer-events","fill"),s.appendChild(m),R(s),F(s,o),s.setAttribute("class","birlesik-map"),s.setAttribute("tabindex","0"),s.setAttribute("role","button"),s.setAttribute("aria-label",r+t(i.label));const l=()=>{z&&o!==f?he(o):X(o)};s.addEventListener("click",l),s.addEventListener("keydown",x=>{(x.key==="Enter"||x.key===" ")&&(x.preventDefault(),l())}),e.appendChild(s);const d=document.createElementNS(u,"text");d.setAttribute("class","birlesik-map__label"),d.setAttribute("text-anchor","middle"),d.setAttribute("aria-hidden","true");const h=document.createElementNS(u,"tspan");h.setAttribute("class","birlesik-map__no"),h.textContent=String(o+1)+" ",d.appendChild(h),d.appendChild(document.createTextNode(t(i.shortLabel))),d.addEventListener("click",l),d.addEventListener("mouseenter",()=>s.classList.add("birlesik-map--deginiliyor")),d.addEventListener("mouseleave",()=>s.classList.remove("birlesik-map--deginiliyor")),s.addEventListener("mouseenter",()=>d.classList.add("birlesik-map__label--deginiliyor")),s.addEventListener("mouseleave",()=>d.classList.remove("birlesik-map__label--deginiliyor")),s.addEventListener("focus",()=>d.classList.add("birlesik-map__label--deginiliyor")),s.addEventListener("blur",()=>d.classList.remove("birlesik-map__label--deginiliyor")),a.appendChild(d),y.push({g:s,etiket:d})}),I(p),Z(),document.getElementById("birlesikSlider").addEventListener("input",i=>w(+i.target.value)),document.getElementById("birlesikMergeBtn").addEventListener("click",()=>w(100)),document.getElementById("birlesikResetBtn").addEventListener("click",()=>w(0));const n=B();n&&xe(n)}function ge(){const e=b&&b.dokuzHarita||{};return`<p class="sema-cizim-aciklama">${t(e.description)}</p>
      <div class="cizim-birlesik">
        <svg class="cizim-birlesik__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;aspect-ratio:${z?"1/1":"16/10"}"
             aria-label="${t({tr:"Dokuz harita: ayr\u0131 \xE7izimler ve merkezde birle\u015Fen tek bir kompozisyon",en:"Nine maps: separate drawings and a single composition merging at the center",pt:"Nove mapas: desenhos separados e uma \xFAnica composi\xE7\xE3o a fundir-se no centro"})}">
          <g id="birlesikMapsG"></g>
          <g id="birlesikEtiketG"></g>
        </svg>
        ${z?'<div class="cizim-birlesik__secili" id="birlesikSeciliKunye" aria-live="polite"></div>':""}
        <p class="cizim-birlesik__ipucu">${t({tr:"Yakla\u015Fmak i\xE7in: Ctrl (\u2318) + tekerlek, iki parmak ya da s\xFCrg\xFC.",en:"To come closer: Ctrl (\u2318) + scroll, two fingers, or the slider.",pt:"Para se aproximar: Ctrl (\u2318) + roda, dois dedos ou o controle deslizante."})}</p>
        <div class="cizim-birlesik__controls">
          <div class="cizim-birlesik__quick">
            <button type="button" class="cizim-birlesik__btn" id="birlesikMergeBtn">${t({tr:"Tek Haritada Birle\u015Ftir",en:"Merge into One Map",pt:"Fundir num S\xF3 Mapa"})}</button>
            <button type="button" class="cizim-birlesik__btn cizim-birlesik__btn--ghost" id="birlesikResetBtn">${t({tr:"Ba\u015Fa D\xF6n",en:"Return to Start",pt:"Voltar ao In\xEDcio"})}</button>
          </div>
          <div class="cizim-birlesik__slider-row">
            <span>${t({tr:"Ayr\u0131k",en:"Apart",pt:"Separados"})}</span>
            <input type="range" id="birlesikSlider" min="0" max="100" value="${Math.round(p)}" aria-label="${t({tr:"Ayr\u0131k / Birle\u015Fik",en:"Apart / Together",pt:"Separados / Reunidos"})}">
            <span>${t({tr:"Birle\u015Fik",en:"Together",pt:"Reunidos"})}</span>
          </div>
        </div>
      </div>`}function ye(){const e=document.createElementNS(u,"g");$.forEach((r,c)=>{const n=document.createElementNS(u,"g");n.setAttribute("transform",`translate(${P[c]} ${Y[c]}) scale(${O})`),R(n),F(n,c),e.appendChild(n)});const a=b&&b.dokuzHarita&&b.dokuzHarita.name||{tr:"Dokuz harita",en:"Nine maps",pt:"Nove mapas"};return`<svg class="cizim-card__svg" viewBox="150 100 1300 800" role="img" aria-label="${t(a)}">${e.innerHTML}</svg>`}window.addEventListener("resize",window.DostGraphUtils.debounceResize(()=>{const e=B();!e||!e.isConnected||!y||(M=null,I(p))})),window.DostSemalarCizim={veri:T,hareketAzalt:re,cizenEl:ie,cizimSvg(e){return T().then(a=>{if(!a)return"";if(e==="dokuz-harita")return ye();const r=a.diagrams.find(n=>n.id===e),c=r&&N[r.diagram.type];return c&&G(),c?c(r.diagram):""})},buyut(e){return T().then(()=>se(e))},ciz(e,a){return e!=="dokuz-harita"?Promise.reject(new Error("bilinmeyen \xE7izim: "+e)):T().then(r=>{if(!r)throw new Error("veri yok");a.isConnected&&(p=0,f=0,a.innerHTML=ge(),ue())})}}})();
