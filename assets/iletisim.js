(function(){"use strict";var s="bW9jLmxpYW1nQG5hbWFyYWsudGFydW1pY2Fo";function d(){try{return atob(s).split("").reverse().join("")}catch{return""}}function u(t){var a=/Android\s+([0-9.]+)/.exec(navigator.userAgent||"");return"dil: "+t+" \xB7 site"+(a?" \xB7 Android "+a[1]:"")}function f(t){var a=d();if(a){var l=t.getAttribute("data-dil")||"tr",e=t.getAttribute("data-konu")||"Dost Arab\xEE",n="";if(/[?&]hata=1/.test(location.search)){e=t.getAttribute("data-konu-hata")||e;try{var r=new URL(document.referrer);r.origin===location.origin&&(n=`
sayfa: `+r.pathname+r.hash)}catch{}try{var i=new URLSearchParams(location.search),o=i.get("s")||"",c=(i.get("a")||"").replace(/\s+/g," ").slice(0,90);/^\/[a-z0-9\-_\/.]*(#p-[a-z0-9-]+)?$/i.test(o)&&(n=`
sayfa: `+o+(c?`
paragraf: \u201C`+c+"\u2026\u201D":""))}catch{}}location.href="mailto:"+a+"?subject="+encodeURIComponent(e)+"&body="+encodeURIComponent(`


--
`+u(l)+n)}}document.addEventListener("click",function(t){var a=t.target.closest&&t.target.closest("[data-iletisim]");a&&(t.preventDefault(),f(a))})})();
