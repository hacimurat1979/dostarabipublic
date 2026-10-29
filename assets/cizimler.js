(function(){"use strict";const L=window.DostI18n,S=document.getElementById("cizimler-wrap"),z=document.getElementById("cizimler-list");if(!S||!z)return;let u=null,M=null;const t=L.pick3;function P(e,a){return window.__dostCrossLink?window.__dostCrossLink.linkify(e,"cizimler",a):e}function ie(){return u?Promise.resolve(u):M||(window.DostViewStatus&&window.DostViewStatus.showLoading("cizimler-wrap"),M=window.DostGraphUtils.fetchJson("data/ibn-arabi/futuhat-cizimleri.json").then(e=>(u=e,window.DostViewStatus&&window.DostViewStatus.hide("cizimler-wrap"),e)).catch(e=>(console.error("F\xFCt\xFBh\xE2t \xE7izimleri y\xFCklenemedi / Failed to load Futuhat diagrams",e),M=null,window.DostViewStatus&&window.DostViewStatus.showError("cizimler-wrap",()=>window.__cizimlerApp.activate()),null)),M)}const Y={"bulut-sureti":e=>`
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
    `,"cadir-sureti":e=>{const a=[25,45,65,85,105,125,145],i=160,c=230,n=a.map(d=>`<path class="term-diagram-arrow" d="M${i-d},${c} A${d},${d} 0 0,1 ${i+d},${c}" fill="none"/>`).join(""),r=[e.kingdom1,e.kingdom2,e.kingdom3,e.kingdom4],s=[70,130,190,250],l=r.map((d,o)=>`
        <circle class="term-diagram-node--faint" cx="${s[o]}" cy="278" r="23"/>
        <text class="term-diagram-note" x="${s[o]}" y="282" text-anchor="middle">${t(d)}</text>
      `).join("");return`
        <svg class="cizim-card__svg" viewBox="0 0 320 320" role="img" aria-label="${t(e.pillar)}">
          ${n}
          <text class="term-diagram-note" x="160" y="200" text-anchor="middle">${t(e.domes[0])}</text>
          <text class="term-diagram-note" x="160" y="80" text-anchor="middle">${t(e.domes[6])}</text>
          <line class="term-diagram-arrow" x1="160" y1="228" x2="160" y2="20" marker-end="url(#cizimArrowEnd)"/>
          <text class="term-diagram-label--small" x="196" y="128" text-anchor="middle">${t(e.pillar)}</text>
          ${l}
        </svg>
      `},"esma-hazretleri-sureti":e=>{const a=[[47.8,134.5],[75.4,179.2],[118.5,209.4],[170,220],[221.5,209.4],[264.6,179.2],[292.2,134.5]],i=e.names.map((c,n)=>`
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
          ${i}
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
    `},se=`
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <defs>
        <marker id="cizimArrowEnd" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" class="term-diagram-arrowhead"/>
        </marker>
      </defs>
    </svg>
  `;function F(e){return e&&typeof e=="object"?t(e):e||""}function ne(e){const a=L&&L.getLang?L.getLang():"tr";if(!e||a==="tr")return e||"";const i=a==="pt"?"T\u0130EM/Museu Evkaf":"T\u0130EM/Evkaf Museum";return e.replace(/^Fütûhât,/,"Futuhat,").replace(/böl\. /g,"sec. ").replace(/TİEM\/Evkaf Müzesi/g,i).replace(/vr\. /g,"fol. ")}function oe(e,a){const i=Y[e.diagram.type],c=i?i(e.diagram):"";return`
      <article class="cizim-card${a?ee(e,a)?" cizim-card--kisimda":" cizim-card--perdeli":""}" data-cizim-kart="${e.id}">
        <p class="cizim-card__ref">${F(e.source_ref)}</p>
        <h2 class="cizim-card__name">${t(e.name)}</h2>
        <div class="cizim-card__svg-wrap" data-cizim-id="${e.id}" role="button" tabindex="0"
             aria-label="${t({tr:"B\xFCy\xFCt",en:"Enlarge",pt:"Ampliar"})}: ${String(t(e.name)).replace(/<[^>]*>/g,"").replace(/"/g,"&quot;")}">${c}</div>
        <p class="cizim-card__desc">${P(t(e.description),e.id)}</p>
      </article>
    `}function j(e){if(!u)return;const a=u.diagrams.find(n=>n.id===e);if(!a)return;const i=Y[a.diagram.type],c=i?i(a.diagram):"";window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),svgHtml:c,ref:F(a.source_ref),name:t(a.name)})}const x="http://www.w3.org/2000/svg",_=[{id:"ama",shortLabel:{tr:"Bulut",en:"The Cloud",pt:"A Nuvem"},label:{tr:"Bulut (Am\xE2)",en:"The Cloud (al-\u02BFam\u0101\u02BE)",pt:"A Nuvem (al-\u02BFam\u0101\u02BE)"},gloss:{tr:`Dizinin ba\u015Flang\u0131c\u0131: varl\u0131\u011F\u0131n ilk mertebeleri, "merhametli bir buhar" olan Bulut'ta a\xE7\u0131l\u0131yor. "D\xFCnyan\u0131n s\xFBreti b\xFCt\xFCn\xFCyle k\xFCresel bir dairedir" \u2014 \u015Eeyh'in kendi s\xF6z\xFC.`,en:`The start of the sequence: the first levels of being unfold within the Cloud, "a merciful vapor." "The form of the world in its entirety is a spherical circle" \u2014 in the Shaykh's own words.`,pt:'O in\xEDcio da sequ\xEAncia: os primeiros n\xEDveis do ser desdobram-se na Nuvem, "um vapor misericordioso." "A forma do mundo na sua totalidade \xE9 um c\xEDrculo esf\xE9rico" \u2014 nas palavras do pr\xF3prio Xeique.'},cite:"F\xFCt\xFBh\xE2t, 9.316 (Tyser 2023, b\xF6l. 4.1; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 90a)"},{id:"ars-kursi",shortLabel:{tr:"Ar\u015F \u2013 K\xFCrs\xEE",en:"Throne \u2013 Footstool",pt:"Trono \u2013 Escabelo"},label:{tr:"Ar\u015F-\u0131 \u0130stiv\xE2, K\xFCrs\xEE, \u0130ki Ayak, Su, Hava, Karanl\u0131k",en:"The Throne of Sitting, Footstool, Two Feet, Water, Air, Darkness",pt:"O Trono de Assento, Escabelo, Dois P\xE9s, \xC1gua, Ar, Escurid\xE3o"},gloss:{tr:`Bir \xF6nceki haritan\u0131n en i\xE7 dairesine iniliyor. Ar\u015F d\xF6rt unsura (ate\u015F, hava, su, toprak) dayan\u0131yor. Metindeki "iki ayak"tan biri cennette, biri cehennemde, ikisi de K\xFCrs\xEE'nin \xFCst\xFCnde.`,en:`Descends into the innermost circle of the previous map. The Throne rests on four elements (fire, air, water, earth). Of the text's "two feet", one is set in Paradise, the other in Hell, both resting on the Footstool.`,pt:'Desce para o c\xEDrculo mais interior do mapa anterior. O Trono assenta em quatro elementos (fogo, ar, \xE1gua, terra). Dos "dois p\xE9s" do texto, um est\xE1 no Para\xEDso, o outro no Inferno, ambos sobre o Escabelo.'},cite:"Tyser 2023, b\xF6l. 4.2; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 90b"},{id:"atlas",shortLabel:{tr:"Atlas Fele\u011Fi",en:"Sphere of Atlas",pt:"Esfera de Atlas"},label:{tr:"Atlas Fele\u011Fi, Cennetler, Sabit Y\u0131ld\u0131zlar K\xFCresi, T\xFBb\xE2 A\u011Fac\u0131",en:"The Sphere of Atlas, the Gardens, the Root of the Starry Sphere, the Tree of \u1E6C\u016Bb\u0101",pt:"A Esfera de Atlas, os Jardins, a Raiz da Esfera Estelar, a \xC1rvore de \u1E6C\u016Bb\u0101"},gloss:{tr:"\u0130ni\u015F s\xFCr\xFCyor. Atlas fele\u011Fi ile sabit y\u0131ld\u0131zlar k\xFCresi aras\u0131nda sekiz cennet kona\u011F\u0131 s\u0131ralan\u0131yor \u2014 her biri, \u015Eeriat'a t\xE2bi bir organa (g\xF6z, kulak, dil, el, mide, \xFCreme organ\u0131, ayak, kalp) kar\u015F\u0131l\u0131k geliyor.",en:"The descent continues. Between the sphere of Atlas and the sphere of the fixed stars, eight paradisal abodes are arrayed \u2014 each corresponding to a bodily member subject to the Law (eye, ear, tongue, hand, stomach, reproductive organ, leg, heart).",pt:"A descida continua. Entre a esfera de Atlas e a esfera das estrelas fixas, alinham-se oito moradas paradis\xEDacas \u2014 cada uma correspondendo a um membro do corpo sujeito \xE0 Lei (olho, ouvido, l\xEDngua, m\xE3o, est\xF4mago, \xF3rg\xE3o reprodutor, perna, cora\xE7\xE3o)."},cite:"Tyser 2023, b\xF6l. 4.3; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 91a"},{id:"sabit-yildizlar-insan",shortLabel:{tr:"Sabit Y\u0131ld\u0131zlar",en:"Fixed Stars",pt:"Estrelas Fixas"},label:{tr:"Sabit Y\u0131ld\u0131zlar K\xFCresi, G\xF6kkubbeler, Yer, D\xF6rt Mertebe ve \u0130nsan",en:"The Sphere of the Fixed Stars, the Domes of the Heavens, the Earth, the Four Realms, and Man",pt:"A Esfera das Estrelas Fixas, as C\xFApulas dos C\xE9us, a Terra, os Quatro Reinos e o Homem"},gloss:{tr:`Bir \xE7ad\u0131r bi\xE7iminde: d\xFCnyan\u0131n \xFCst\xFCnde yedi g\xF6k, yedi gezegen. B\xFCt\xFCn k\xFCreleri dikey bir "direk" kesiyor \u2014 Kur'an'daki g\xF6r\xFCnmez dire\u011Fe (13:2) i\u015Faret eden bu \xE7izgi, \u0130bn Arab\xEE'ye g\xF6re \u0130ns\xE2n-\u0131 K\xE2mil'dir; g\xF6kleri yery\xFCz\xFCne d\xFC\u015Fmekten O tutuyor.`,en:`In the shape of a tent: seven heavens above the earth, seven planets. A vertical "pillar" crosses all the spheres \u2014 this line, pointing to the invisible pillar of the Qur'an (13:2), is, for Ibn al-\u02BFArab\u012B, the Perfect Man; through him God holds the heavens from falling upon the earth.`,pt:'Em forma de tenda: sete c\xE9us acima da terra, sete planetas. Um "pilar" vertical atravessa todas as esferas \u2014 esta linha, apontando para o pilar invis\xEDvel do Alcor\xE3o (13:2), \xE9, para Ibn al-\u02BFArab\u012B, o Homem Perfeito; \xE9 atrav\xE9s dele que Deus impede os c\xE9us de ca\xEDrem sobre a terra.'},cite:"F\xFCt\xFBh\xE2t, 9.313 (Tyser 2023, b\xF6l. 4.4; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 91b)"},{id:"arz-i-hasr",shortLabel:{tr:"Ha\u015Fir Yeri",en:"Gathering",pt:"Reuni\xE3o"},label:{tr:"Ha\u015Fir Yeri, Ayr\u0131m ve H\xFCk\xFCm Ar\u015F\u0131, Melek Saflar\u0131",en:"The Land of Gathering, the Throne of Separation and Judgement, the Rows of Angels",pt:"A Terra da Reuni\xE3o, o Trono de Separa\xE7\xE3o e Julgamento, as Fileiras de Anjos"},gloss:{tr:"K\u0131ldan ince, k\u0131l\u0131\xE7tan keskin s\u0131r\xE2t k\xF6pr\xFCs\xFC cehennemin \xFCst\xFCnde gerili. \xD6l\xFCm\xFCn kesili\u015Fini simgeleyen bir daire, cenneti cehennemden ay\u0131ran a'r\xE2f \xE7izgisiyle kesi\u015Fiyor. Yedi melek saf\u0131 ve sekiz s\xFCtun \xFCzerindeki H\xFCk\xFCm Ar\u015F\u0131, sahneyi yukar\u0131dan ku\u015Fat\u0131yor.",en:'The bridge of the path (\u1E63ir\u0101\u1E6D), thinner than a hair and sharper than a sword, stretches over hell. A circle symbolizing the slaughter of death intersects the line of the "heights" (al-a\u02BFr\u0101f) separating paradise from hell. Seven rows of angels and the Throne of Judgement, resting on eight pillars, frame the scene from above.',pt:'A ponte do caminho (\u1E63ir\u0101\u1E6D), mais fina que um cabelo e mais afiada que uma espada, estende-se sobre o inferno. Um c\xEDrculo simbolizando o abate da morte intersecta a linha das "alturas" (al-a\u02BFr\u0101f) que separa o para\xEDso do inferno. Sete fileiras de anjos e o Trono do Julgamento, apoiado em oito pilares, emolduram a cena vista do alto.'},cite:"Tyser 2023, b\xF6l. 4.5; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 92a"},{id:"cehennem-kapilari",shortLabel:{tr:"Cehennem Kap\u0131lar\u0131",en:"Gates of Hell",pt:"Port\xF5es do Inferno"},label:{tr:"Cehennemin Kap\u0131lar\u0131, Konaklar\u0131 ve \u0130nen Dereceleri",en:"The Gates of Hell, Its Abodes, and Its Descending Levels",pt:"Os Port\xF5es do Inferno, as suas Moradas e N\xEDveis Descendentes"},gloss:{tr:`Cehennemin yedi kap\u0131s\u0131, insan\u0131n \u015Eeriat'a t\xE2bi yedi organ\u0131na kar\u015F\u0131l\u0131k geliyor. \u015Eeman\u0131n tam merkezinde, kalbi \xF6rten bir kap\u0131 duruyor \u2014 insan\u0131n i\xE7indeki "gayb"\u0131n yeri. "\u0130nsan\u0131n d\xFCnyadaki b\xE2t\u0131n\u0131, ahirette z\xE2hir olur."`,en:`Hell's seven gates correspond to the seven bodily members subject to the Law. At the very center of the diagram stands a door veiling the heart \u2014 the place of the unseen within man. "What is interior in man in this world becomes exterior in the hereafter."`,pt:'Os sete port\xF5es do inferno correspondem aos sete membros do corpo sujeitos \xE0 Lei. No centro exato do diagrama ergue-se uma porta que vela o cora\xE7\xE3o \u2014 o lugar do invis\xEDvel dentro do homem. "O que \xE9 interior no homem neste mundo torna-se exterior no al\xE9m."'},cite:"F\xFCt\xFBh\xE2t, 9.356 (Tyser 2023, b\xF6l. 4.6; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 92b)"},{id:"esma-hazretleri",shortLabel:{tr:"\u0130lah\xEE \u0130simler",en:"Divine Names",pt:"Nomes Divinos"},label:{tr:"\u0130lah\xEE \u0130simler Huzuru, Alt D\xFCnya, Ahiret, Berzah",en:"The Presence of the Divine Names, the Lowest World, the Hereafter, the Intermediary World",pt:"A Presen\xE7a dos Nomes Divinos, o Mundo Inferior, o Al\xE9m, o Mundo Interm\xE9dio"},gloss:{tr:'\u0130lah\xEE isimlerin de kendi aralar\u0131nda bir d\xFCzeni var: "\xF6nc\xFCler" ve "hizmetk\xE2rlar." Varl\u0131\u011F\u0131n sebebi olan yedi ana isim \u2014 Hayy, Al\xEEm, M\xFCr\xEEd, K\xE2dir, K\xE2il, Cevv\xE2d, Muksit \u2014 bu d\xFCnya, ahiret ve ikisi aras\u0131ndaki berzah\u0131n kesi\u015Fti\u011Fi yerde beliriyor.',en:'The divine names, too, have their own order: "chiefs" and "servants." Seven principal names \u2014 the Living, the Knower, the One who wills, the One who is able, the One who speaks, the Most-Generous, the Equitable \u2014 appear at the point where this world, the hereafter, and the barzakh between them meet.',pt:'Tamb\xE9m os nomes divinos t\xEAm a sua pr\xF3pria ordem: "chefes" e "servos." Sete nomes principais \u2014 o Vivo, o Sabedor, Aquele que quer, Aquele que pode, Aquele que fala, o Generos\xEDssimo, o Equ\xE2nime \u2014 aparecem no ponto onde este mundo, o al\xE9m, e o barzakh entre eles se encontram.'},cite:"Tyser 2023, b\xF6l. 4.7; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 93a"},{id:"ruyet",shortLabel:{tr:"R\xFC'yet Tepesi",en:"Dune of Vision",pt:"Duna da Vis\xE3o"},label:{tr:"R\xFC'yet Kum Tepesi \u2014 Allah'\u0131n y\xFCz\xFCn\xFCn a\xE7\u0131ld\u0131\u011F\u0131 an",en:"The Dune of Vision \u2014 the moment God's face is unveiled",pt:"A Duna da Vis\xE3o \u2014 o momento em que o rosto de Deus se revela"},gloss:{tr:`Cennette, halk\u0131n Allah'\u0131n y\xFCz\xFCn\xFC g\xF6rd\xFC\u011F\xFC belirli bir an ve yer \u2014 "beyaz misktendir."`,en:`A specific moment and place in paradise where the people see God's face \u2014 "made of white musk."`,pt:'Um momento e lugar espec\xEDficos no para\xEDso onde o povo v\xEA o rosto de Deus \u2014 "feito de alm\xEDscar branco."'},cite:"Tyser 2023, b\xF6l. 4.8; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 93b"},{id:"kozmos",shortLabel:{tr:"Kozmosun Tamam\u0131",en:"The Whole Cosmos",pt:"Todo o Cosmos"},label:{tr:"Kozmosun tamam\u0131 \u2014 sekiz haritan\u0131n sentezi",en:"The entirety of the cosmos \u2014 a synthesis of eight maps",pt:"A totalidade do cosmos \u2014 uma s\xEDntese de oito mapas"},gloss:{tr:`\u015Eeklinin merkezi, R\xFC'yet Kum Tepesi'yle ayn\u0131 bi\xE7imi ta\u015F\u0131yor \u2014 ahiret, d\xFCnyan\u0131n tam merkezinde duruyor. \u0130bn Arab\xEE'nin kendi ifadesiyle: "d\xFCnya, Bulut ile Allah'\u0131n bak\u0131\u015F\u0131 aras\u0131nda beliriyor."`,en:`The shape of its center matches that of the Dune of Vision \u2014 the hereafter sits at the very core of the world. In Ibn al-\u02BFArab\u012B's own words: "the world appears between the Cloud and the glance of God."`,pt:'A forma do seu centro corresponde \xE0 da Duna da Vis\xE3o \u2014 o al\xE9m situa-se no pr\xF3prio n\xFAcleo do mundo. Nas palavras do pr\xF3prio Ibn al-\u02BFArab\u012B: "o mundo aparece entre a Nuvem e o olhar de Deus."'},cite:"F\xFCt\xFBh\xE2t, 9.461 (Tyser 2023, b\xF6l. 4.9; T\u0130EM/Evkaf M\xFCzesi 1870, vr. 93b-94a)"}];function V(e){const a=document.createElementNS(x,"circle");a.setAttribute("cx",0),a.setAttribute("cy",0),a.setAttribute("r",90),a.setAttribute("fill","none"),a.setAttribute("stroke","var(--text-primary)"),a.setAttribute("stroke-width",1.4),a.setAttribute("opacity",.6),e.appendChild(a)}function U(e,a){const i=document.createElementNS(x,"g");i.setAttribute("stroke","var(--text-primary)"),i.setAttribute("stroke-width",1.6),i.setAttribute("fill","none"),i.setAttribute("stroke-linecap","round");const c=(r,s,l,d)=>{const o=document.createElementNS(x,"line");o.setAttribute("x1",r),o.setAttribute("y1",s),o.setAttribute("x2",l),o.setAttribute("y2",d),i.appendChild(o)},n=(r,s,l,d)=>{const o=document.createElementNS(x,"circle");o.setAttribute("cx",r),o.setAttribute("cy",s),o.setAttribute("r",l),d&&o.setAttribute("fill","var(--text-primary)"),i.appendChild(o)};switch(a){case 0:c(-110,0,110,0);break;case 1:c(0,-110,0,110);break;case 2:c(-78,-78,78,78);break;case 3:c(-78,78,78,-78);break;case 4:for(let r=0;r<8;r++){const s=r/8*Math.PI*2;n(Math.cos(s)*90,Math.sin(s)*90,4,!0)}break;case 5:for(let r=0;r<6;r++){const s=r/6*Math.PI*2+Math.PI/6;n(Math.cos(s)*55,Math.sin(s)*55,3,!0)}break;case 6:{const r=[];for(let l=0;l<3;l++){const d=l/3*Math.PI*2-Math.PI/2;r.push([Math.cos(d)*88,Math.sin(d)*88])}const s=document.createElementNS(x,"polygon");s.setAttribute("points",r.map(l=>l.join(",")).join(" ")),s.setAttribute("fill","none"),i.appendChild(s);break}case 7:{const s=document.createElementNS(x,"polygon");s.setAttribute("points","0,-88 88,0 0,88 -88,0"),i.appendChild(s);break}case 8:{n(0,0,4,!0),[0,90,180,270].forEach(r=>{const s=r*Math.PI/180;c(Math.cos(s)*22,Math.sin(s)*22,Math.cos(s)*40,Math.sin(s)*40)});break}}e.appendChild(i)}const O=[300,800,1300,300,800,1300,300,800,1300],le=[250,250,250,500,500,500,750,750,750],K=.65,ce=2,v=[800,500],W=232,de=[8,0,1,7,4,2,6,5,3],X=e=>-Math.PI/2+de[e]/_.length*Math.PI*2,me=e=>e*e*(3-2*e);let k=0,p=null,E=null;function H(e){const a=_[e],i=document.createElementNS(x,"g");V(i),U(i,e);const c=`<svg viewBox="-150 -150 300 300" class="cizim-card__svg" role="img" aria-label="${t(a.label)}">${i.innerHTML}</svg>`;window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),svgHtml:c,ref:e+1+" / "+_.length+" \u2014 "+ne(a.cite),name:t(a.label),caption:t(a.gloss)})}function R(){return document.querySelector(".cizim-birlesik__svg")}function he(){const e=R();if(!e||!p)return;const a=e.getBoundingClientRect(),i=Math.max(240,a.width||680),c=Math.max(180,a.height||425),n=i/c,r=i<520,s=r?9:10.5,l=r?12.5:14.5,d=p.map(m=>{const g=m.etiket.style.fontSize;m.etiket.style.fontSize="100px";let f=0;try{f=m.etiket.getComputedTextLength()}catch{f=0}return m.etiket.style.fontSize=g,f||60*(m.etiket.textContent||"").length});let o=Math.max(1320,800*n);for(let m=0;m<100;m++){const g=s*o/i;if(!p.some((w,y)=>Math.abs(O[y]-v[0])+d[y]*g/200+16>o/2))break;o+=20}let h=560;for(let m=0;m<200;m++){const g=l*h/i,f=h/n;let w=!0;for(let y=0;y<p.length&&w;y++){const A=X(y),b=d[y]*g/100,I=W+.5*b*Math.abs(Math.cos(A))+.6*g*Math.abs(Math.sin(A)),B=Math.abs(I*Math.cos(A))+b/2+16,D=Math.abs(I*Math.sin(A))+g+12;(B>h/2||D>f/2)&&(w=!1)}if(w)break;h+=20}E={uzakW:o,yakinW:Math.min(h,o),oran:n,cw:i,pxUzak:s,pxYakin:l,genislikler:d}}function q(e){if(!p)return;E||he();const a=E,i=me(e/100),c=R(),n=a?a.uzakW*Math.pow(a.yakinW/a.uzakW,i):1600,r=a?n/a.oran:1e3;c&&c.setAttribute("viewBox",`${(v[0]-n/2).toFixed(1)} ${(v[1]-r/2).toFixed(1)} ${n.toFixed(1)} ${r.toFixed(1)}`);const s=a?a.pxUzak+(a.pxYakin-a.pxUzak)*i:12,l=a?s*n/a.cw:20,d=_.length;for(let h=0;h<d;h++){const m=O[h],g=le[h],f=m+(v[0]-m)*i,w=g+(v[1]-g)*i,y=K+(ce-K)*i,A=1-i*.3,b=p[h];b.g.setAttribute("transform",`translate(${f.toFixed(1)} ${w.toFixed(1)}) scale(${y.toFixed(3)})`),b.g.setAttribute("opacity",A.toFixed(3));const I=a?a.genislikler[h]*l/100:0,B=m,D=g-112*K-l*.45,C=X(h),re=W+.5*I*Math.abs(Math.cos(C))+.6*l*Math.abs(Math.sin(C)),ye=v[0]+re*Math.cos(C),be=v[1]+re*Math.sin(C)+l*.35;b.etiket.setAttribute("x",(B+(ye-B)*i).toFixed(1)),b.etiket.setAttribute("y",(D+(be-D)*i).toFixed(1)),b.etiket.style.fontSize=l.toFixed(1)+"px",b.etiket.style.opacity=(.5+.5*Math.abs(2*i-1)).toFixed(3)}const o=document.getElementById("birlesikSlider");o&&Number(o.value)!==Math.round(e)&&(o.value=String(Math.round(e))),o&&o.setAttribute("aria-valuetext",e<=0?t({tr:"Ayr\u0131k: dokuz harita",en:"Apart: nine maps",pt:"Separados: nove mapas"}):e>=100?t({tr:"Birle\u015Fik: tek kompozisyon",en:"Together: one composition",pt:"Reunidos: uma composi\xE7\xE3o"}):t({tr:"Yakla\u015F\u0131l\u0131yor: %",en:"Approaching: %",pt:"A aproximar: %"}).replace("%","%"+Math.round(e)))}function $(e){k=Math.max(0,Math.min(100,e)),q(k)}function ue(e){e.addEventListener("wheel",r=>{if(!(r.ctrlKey||r.metaKey))return;r.preventDefault();const s=r.deltaMode===1?16:r.deltaMode===2?400:1;$(k-r.deltaY*s*.22)},{passive:!1});let a=null;const i=r=>Math.hypot(r[0].clientX-r[1].clientX,r[0].clientY-r[1].clientY);e.addEventListener("touchstart",r=>{r.touches.length===2&&(a={d0:i(r.touches)||1,v0:k})},{passive:!0}),e.addEventListener("touchmove",r=>{!a||r.touches.length!==2||(r.preventDefault(),$(a.v0+Math.log(i(r.touches)/a.d0)/Math.log(2.5)*100))},{passive:!1});const c=r=>{(!r.touches||r.touches.length<2)&&(a=null)};e.addEventListener("touchend",c),e.addEventListener("touchcancel",c);let n=null;e.addEventListener("gesturestart",r=>{r.preventDefault(),n=k}),e.addEventListener("gesturechange",r=>{n!=null&&(r.preventDefault(),$(n+Math.log(r.scale||1)/Math.log(2.5)*100))}),e.addEventListener("gestureend",()=>{n=null})}function xe(){const e=document.getElementById("birlesikMapsG"),a=document.getElementById("birlesikEtiketG");if(!e||!a)return;e.innerHTML="",a.innerHTML="",p=[],E=null;const i=t({tr:"B\xFCy\xFCt: ",en:"Enlarge: ",pt:"Ampliar: "});_.forEach((r,s)=>{const l=document.createElementNS(x,"g"),d=document.createElementNS(x,"circle");d.setAttribute("cx",0),d.setAttribute("cy",0),d.setAttribute("r",112),d.setAttribute("class","birlesik-map__hit"),d.setAttribute("pointer-events","fill"),l.appendChild(d),V(l),U(l,s),l.setAttribute("class","birlesik-map"),l.setAttribute("tabindex","0"),l.setAttribute("role","button"),l.setAttribute("aria-label",i+t(r.label)),l.addEventListener("click",()=>H(s)),l.addEventListener("keydown",m=>{(m.key==="Enter"||m.key===" ")&&(m.preventDefault(),H(s))}),e.appendChild(l);const o=document.createElementNS(x,"text");o.setAttribute("class","birlesik-map__label"),o.setAttribute("text-anchor","middle"),o.setAttribute("aria-hidden","true");const h=document.createElementNS(x,"tspan");h.setAttribute("class","birlesik-map__no"),h.textContent=String(s+1)+" ",o.appendChild(h),o.appendChild(document.createTextNode(t(r.shortLabel))),o.addEventListener("click",()=>H(s)),o.addEventListener("mouseenter",()=>l.classList.add("birlesik-map--deginiliyor")),o.addEventListener("mouseleave",()=>l.classList.remove("birlesik-map--deginiliyor")),l.addEventListener("mouseenter",()=>o.classList.add("birlesik-map__label--deginiliyor")),l.addEventListener("mouseleave",()=>o.classList.remove("birlesik-map__label--deginiliyor")),l.addEventListener("focus",()=>o.classList.add("birlesik-map__label--deginiliyor")),l.addEventListener("blur",()=>o.classList.remove("birlesik-map__label--deginiliyor")),a.appendChild(o),p.push({g:l,etiket:o})}),q(k),document.getElementById("birlesikSlider").addEventListener("input",r=>$(+r.target.value)),document.getElementById("birlesikMergeBtn").addEventListener("click",()=>$(100)),document.getElementById("birlesikResetBtn").addEventListener("click",()=>$(0));const n=R();n&&ue(n)}function ge(e){return`<article class="cizim-card cizim-card--birlesik${e===!0?" cizim-card--kisimda":e===!1?" cizim-card--perdeli":""}" data-cizim-kart="dokuz-harita">
      <p class="cizim-card__ref">${t({tr:"F\xFCt\xFBh\xE2t, 9.316\u20139.461 \u2014 371. Bab",en:"Futuhat, 9.316\u20139.461 \u2014 Chapter 371",pt:"Futuhat, 9.316\u20139.461 \u2014 Cap\xEDtulo 371"})}</p>
      <h2 class="cizim-card__name">${t({tr:"371. Bab: Dokuz Harita",en:"Chapter 371: Nine Maps",pt:"Cap\xEDtulo 371: Nove Mapas"})}</h2>
      <p class="cizim-card__desc">${t({tr:`\u0130bn Arab\xEE'nin, F\xFCt\xFBh\xE2t'\u0131n ikinci telifine kendi eliyle \xE7izdi\u011Fi dokuz harita \u2014 kendi ifadesiyle "tek bir kompozisyon" olarak g\xF6r\xFClmesini istedi\u011Fi bir dizi. Uzaktan dokuz \xE7izim; yakla\u015Ft\u0131k\xE7a tek bir kompozisyon. Her haritaya ayr\u0131 ayr\u0131 t\u0131klay\u0131p b\xFCy\xFCtebilirsin.`,en:"Nine maps Ibn al-\u02BFArab\u012B drew with his own hand into the second recension of the Futuhat \u2014 meant, in his own words, to be seen as a single composition. From afar, nine drawings; as you come closer, one composition. Click any map on its own to enlarge it.",pt:"Nove mapas que Ibn al-\u02BFArab\u012B desenhou com a pr\xF3pria m\xE3o na segunda recens\xE3o das Futuhat \u2014 pensados, nas suas palavras, para serem vistos como uma \xFAnica composi\xE7\xE3o. De longe, nove desenhos; ao aproximar-se, uma s\xF3 composi\xE7\xE3o. Clique em qualquer mapa para o ampliar."})}</p>
      <div class="cizim-birlesik">
        <svg class="cizim-birlesik__svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid meet"
             aria-label="${t({tr:"Dokuz harita: ayr\u0131 \xE7izimler ve merkezde birle\u015Fen tek bir kompozisyon",en:"Nine maps: separate drawings and a single composition merging at the center",pt:"Nove mapas: desenhos separados e uma \xFAnica composi\xE7\xE3o a fundir-se no centro"})}">
          <g id="birlesikMapsG"></g>
          <g id="birlesikEtiketG"></g>
        </svg>
        <p class="cizim-birlesik__ipucu">${t({tr:"Yakla\u015Fmak i\xE7in: Ctrl (\u2318) + tekerlek, iki parmak ya da s\xFCrg\xFC.",en:"To come closer: Ctrl (\u2318) + scroll, two fingers, or the slider.",pt:"Para se aproximar: Ctrl (\u2318) + roda, dois dedos ou o controle deslizante."})}</p>
        <div class="cizim-birlesik__controls">
          <div class="cizim-birlesik__quick">
            <button type="button" class="cizim-birlesik__btn" id="birlesikMergeBtn">${t({tr:"Tek Haritada Birle\u015Ftir",en:"Merge into One Map",pt:"Fundir num S\xF3 Mapa"})}</button>
            <button type="button" class="cizim-birlesik__btn cizim-birlesik__btn--ghost" id="birlesikResetBtn">${t({tr:"Ba\u015Fa D\xF6n",en:"Return to Start",pt:"Voltar ao In\xEDcio"})}</button>
          </div>
          <div class="cizim-birlesik__slider-row">
            <span>${t({tr:"Ayr\u0131k",en:"Apart",pt:"Separados"})}</span>
            <input type="range" id="birlesikSlider" min="0" max="100" value="${Math.round(k)}" aria-label="${t({tr:"Ayr\u0131k / Birle\u015Fik",en:"Apart / Together",pt:"Separados / Reunidos"})}">
            <span>${t({tr:"Birle\u015Fik",en:"Together",pt:"Reunidos"})}</span>
          </div>
        </div>
      </div>
    </article>`}const J=/^c(\d+)k(\d+)$/;function Z(){try{const e=new URLSearchParams(location.search).get("kisim");return e&&J.test(e)?e:null}catch{return null}}function Q(e){const a=[[1e3,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];let i="",c=e;for(const[n,r]of a)for(;c>=n;)i+=r,c-=n;return i}function N(e){const a=J.exec(e);if(!a)return e;const i=Q(+a[1]),c=Q(+a[2]);return t({tr:`Cilt ${i}, K\u0131s\u0131m ${c}`,en:`Volume ${i}, Part ${c}`,pt:`Volume ${i}, Parte ${c}`})}function ee(e,a){return!!a&&Array.isArray(e.kisimlar)&&e.kisimlar.includes(a)}function te(e){return!!e&&!!u&&!!u.dokuzHarita&&Array.isArray(u.dokuzHarita.kisimlar)&&u.dokuzHarita.kisimlar.includes(e)}function pe(e){if(!e)return"";const a=u.diagrams.filter(n=>ee(n,e)).length+(te(e)?1:0),i=window.__dostNav?window.__dostNav.href("futuhat",e):"/futuhat/"+e+"/",c=window.__dostNav?window.__dostNav.href("cizimler"):"/cizimler/";return`<div class="cizim-suzgec" role="status">
      <p class="cizim-suzgec__metin">${t({tr:`F\xFCt\xFBh\xE2t \xB7 ${N(e)} \u2014 bu k\u0131sma ba\u011Fl\u0131 ${a} \xE7izim \u0131\u015F\u0131kta; \xF6tekiler perdeli.`,en:`Futuhat \xB7 ${N(e)} \u2014 the ${a} diagram${a===1?"":"s"} tied to this part stay in the light; the others are veiled.`,pt:`Futuhat \xB7 ${N(e)} \u2014 ${a===1?"o diagrama ligado":`os ${a} diagramas ligados`} a esta parte ${a===1?"fica":"ficam"} na luz; os outros ficam velados.`})}</p>
      <div class="cizim-suzgec__baglar">
        <a class="cizim-suzgec__bag" href="${i}" data-view="futuhat" data-id="${e}">${t({tr:"K\u0131sma d\xF6n",en:"Back to the part",pt:"Voltar \xE0 parte"})}</a>
        <a class="cizim-suzgec__bag cizim-suzgec__bag--kaldir" href="${c}" data-suzgec-kaldir="1">${t({tr:"T\xFCm \xE7izimler",en:"All diagrams",pt:"Todos os diagramas"})}</a>
      </div>
    </div>`}let T=null;function ae(e){const a=location.pathname;try{e?history.pushState(null,"",a):history.replaceState(null,"",a)}catch{}G()}function G(){if(!u)return;const e=Z(),a=e!==T;T=e;const i=u.diagrams.map(r=>oe(r,e)).join(""),c=(u.sources||[]).map(r=>`<li>${F(r)}</li>`).join("");z.classList.toggle("cizimler-list--suzgecli",!!e),z.innerHTML=`
      ${se}
      ${pe(e)}
      <p class="cizimler-intro">${P(t(u.intro),null)}</p>
      ${ge(e?te(e):null)}
      ${i}
      <ul class="cizimler-sources">${c}</ul>
    `,xe(),z.querySelectorAll(".cizim-card__svg-wrap").forEach(r=>{r.addEventListener("click",()=>j(r.dataset.cizimId)),r.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),j(r.dataset.cizimId))})});const n=z.querySelector("[data-suzgec-kaldir]");if(n&&n.addEventListener("click",r=>{r.button!==0||r.metaKey||r.ctrlKey||r.shiftKey||r.altKey||(r.preventDefault(),ae(!0))}),e&&a&&!S.hidden){const r=z.querySelector(".cizim-card--kisimda");r&&requestAnimationFrame(()=>{const s=window.matchMedia("(prefers-reduced-motion: reduce)").matches;r.scrollIntoView({block:"start",behavior:s?"auto":"smooth"})})}S.hidden||window.DostLightbox.close()}window.DostGraphUtils&&window.DostGraphUtils.registerStepBack&&window.DostGraphUtils.registerStepBack("cizimler-wrap",()=>!T||!Z()?!1:(ae(!1),!0)),window.addEventListener("resize",window.DostGraphUtils.debounceResize(()=>{S.hidden||!p||(E=null,q(k))})),window.__cizimlerApp={activate(){ie().then(()=>{T=null,G()})},onLangChange(){G()}}})();
