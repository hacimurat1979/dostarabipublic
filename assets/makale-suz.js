// Fizik makaleleri: deney · kuram · yorum süzgeci (2026-11-02, B4). Etiketler bizim sınıflamamız: makalenin ağırlıklı doğası.
(function () {
  var bar = document.getElementById("mk-suz"); if (!bar) return;
  bar.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-tur]"); if (!b) return;
    var t = b.dataset.tur;
    [].forEach.call(bar.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    [].forEach.call(document.querySelectorAll("article.makale"), function (a) { a.hidden = !!t && (a.dataset.tur || "").split(" ").indexOf(t) < 0; });
  });
})();
