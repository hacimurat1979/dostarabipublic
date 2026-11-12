(function(){"use strict";var i="bW9jLmxpYW1nQG5hbWFyYWsudGFydW1pY2Fo";function o(){try{return atob(i).split("").reverse().join("")}catch{return""}}function c(t){var e=/Android\s+([0-9.]+)/.exec(navigator.userAgent||"");return"dil: "+t+" \xB7 site"+(e?" \xB7 Android "+e[1]:"")}function d(t){var e=o();if(e){var s=t.getAttribute("data-dil")||"tr",n=t.getAttribute("data-konu")||"Dost Arab\xEE",r="";if(/[?&]hata=1/.test(location.search)){n=t.getAttribute("data-konu-hata")||n;try{var a=new URL(document.referrer);a.origin===location.origin&&(r=`
sayfa: `+a.pathname+a.hash)}catch{}}location.href="mailto:"+e+"?subject="+encodeURIComponent(n)+"&body="+encodeURIComponent(`


--
`+c(s)+r)}}document.addEventListener("click",function(t){var e=t.target.closest&&t.target.closest("[data-iletisim]");e&&(t.preventDefault(),d(e))})})();
