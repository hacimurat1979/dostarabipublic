(function () {
  "use strict";

  const I18n = window.DostI18n;
  const svg = d3.select("#esma-graph");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");

  function tt(dict) {
    return I18n.pick3(dict);
  }

  let esmaData = null;
  let built = false;
  let nodeSel, linkSel;

  function fetchData() {
    if (esmaData) return Promise.resolve(esmaData);
    return fetch("data/ibn-arabi/esma.json")
      .then((r) => r.json())
      .then((data) => {
        esmaData = data;
        return data;
      })
      .catch((err) => {
        console.error("Esmâ verisi yüklenemedi / Failed to load Esma data", err);
      });
  }

  function radiusFor(d) {
    const depth = d.depth;
    if (depth === 0) return 20;
    if (depth === 1) return 17;
    return Math.max(9, 14 - depth);
  }

  const LAYER_COLOR = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#2a78d6", "#1c5cab", "#0d366b"];
  const LAYER_COLOR_DARK = ["#184f95", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#86b6ef", "#cde2fb"];

  function isDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function getVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function colorFor(d) {
    const pole = d.data.pole;
    if (pole === "celal") return getVar("--series-celal");
    if (pole === "cemal") return getVar("--series-cemal");
    const ramp = isDark() ? LAYER_COLOR_DARK : LAYER_COLOR;
    return ramp[Math.min(d.depth, ramp.length - 1)];
  }

  function labelFor(d) {
    return I18n.pick3(d.data.name);
  }

  function buildGraph(data) {
    const width = svg.node().clientWidth || 800;
    const height = svg.node().clientHeight || 600;

    svg.selectAll("*").remove();

    const root = d3.stratify()
      .id((d) => d.id)
      .parentId((d) => d.parent)(data.nodes);

    const dx = 92;
    const dy = 74;
    const treeLayout = d3.tree().nodeSize([dx, dy]);
    treeLayout(root);

    let xMin = Infinity, xMax = -Infinity;
    root.each((d) => {
      xMin = Math.min(xMin, d.x);
      xMax = Math.max(xMax, d.x);
    });
    const treeWidth = xMax - xMin || 1;
    const canvasWidth = Math.max(width, treeWidth + 120);
    const offsetX = canvasWidth / 2 - (xMin + treeWidth / 2);
    const offsetY = 46;

    const g = svg.append("g").attr("class", "esma-canvas");

    linkSel = g.append("g")
      .attr("class", "esma-links")
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("class", "esma-link")
      .attr("d", d3.linkVertical()
        .x((d) => d.x + offsetX)
        .y((d) => d.y + offsetY));

    const nodeGroup = g.append("g").attr("class", "esma-nodes");

    nodeSel = nodeGroup.selectAll("g.esma-node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node esma-node")
      .attr("transform", (d) => `translate(${d.x + offsetX},${d.y + offsetY})`)
      .on("click", (event, d) => showDetail(d))
      .on("mouseenter", (event, d) => highlight(d))
      .on("mouseleave", () => highlight(null));

    nodeSel.append("circle")
      .attr("r", (d) => radiusFor(d))
      .attr("fill", (d) => colorFor(d));

    nodeSel.append("text")
      .attr("class", "node-label")
      .attr("dy", (d) => radiusFor(d) + 13)
      .attr("text-anchor", "middle")
      .text((d) => labelFor(d));

    // size the viewBox to the actual content so the SVG scales the whole
    // tree to fit within the container instead of clipping wide branches
    const treeHeight = d3.max(root.descendants(), (d) => d.y) + offsetY + 40;
    svg.attr("viewBox", `0 0 ${canvasWidth} ${Math.max(height, treeHeight)}`)
      .attr("preserveAspectRatio", "xMidYMin meet");

    built = true;
  }

  function highlight(d) {
    if (!d) {
      nodeSel.style("opacity", 1);
      linkSel.classed("esma-link--highlight", false);
      return;
    }
    const ids = new Set(d.ancestors().map((a) => a.id));
    const descendantIds = new Set(d.descendants().map((a) => a.id));
    nodeSel.style("opacity", (n) => (ids.has(n.id) || descendantIds.has(n.id) ? 1 : 0.35));
    linkSel.classed("esma-link--highlight", (l) => l.target.id === d.id);
  }

  function insightsHtml(insights) {
    if (!insights || !insights.length) return "";
    return insights.map((ins, i) => `
      <details class="insight" ${i === 0 ? "open" : ""}>
        <summary>${tt({ tr: `Fütûhât, Cilt ${ins.volume}`, en: `Futuhat, Volume ${ins.volume}`, pt: `Futuhat, Volume ${ins.volume}` })}</summary>
        <p>${I18n.pick3(ins.text)}</p>
      </details>
    `).join("");
  }

  function showDetail(d) {
    const n = d.data;
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Esmâü'l-Hüsnâ", en: "The Beautiful Names", pt: "Os Belos Nomes" })}</p>
      <h2 class="detail-title">${I18n.pick3(n.name)}</h2>
      <div class="detail-block detail-block--ibnarabi">
        <h3>${I18n.pick3(n.short)}</h3>
        <p>${I18n.pick3(n.summary)}</p>
        ${insightsHtml(n.insights)}
        <cite>${(n.sources || []).join(" · ")}</cite>
      </div>
    `;
    detailPanel.hidden = false;
  }

  function showDefaultPanel() {
    if (!esmaData) return;
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Zât'tan Aşağıya", en: "Down from the Essence", pt: "Descendo da Essência" })}</p>
      <h2 class="detail-title">${tt({ tr: "Esmâü'l-Hüsnâ", en: "The Beautiful Names", pt: "Os Belos Nomes" })}</h2>
      <p class="detail-resonance">${I18n.pick3(esmaData.intro)}</p>
    `;
    detailPanel.hidden = false;
  }

  function render() {
    if (!built || !esmaData) return;
    nodeSel.select("text.node-label").text((d) => labelFor(d));
  }

  window.__esmaApp = {
    activate() {
      fetchData().then((data) => {
        if (!data) return;
        if (!built) buildGraph(data);
        showDefaultPanel();
      });
    },
    onLangChange() {
      render();
    },
  };
})();
