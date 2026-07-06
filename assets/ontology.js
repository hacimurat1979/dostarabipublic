(function () {
  "use strict";

  const I18n = window.DostI18n;

  const svg = d3.select("#graph");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");
  const detailClose = document.getElementById("detail-close");

  function tt(dict) {
    return I18n.pick3(dict);
  }

  I18n.applyStatic();
  I18n.renderLangSwitcher(document.getElementById("lang-switch"), () => render());

  detailClose.addEventListener("click", () => {
    detailPanel.hidden = true;
  });

  const TARGET = {
    "dhat": { x: 0.5, y: 0.09 },
    "sifat-asma": { x: 0.5, y: 0.21 },
    "ayan-sabite": { x: 0.5, y: 0.33 },
    "tecelli": { x: 0.5, y: 0.45 },
    "alem-ervah": { x: 0.20, y: 0.60 },
    "alem-misal": { x: 0.5, y: 0.60 },
    "alem-ecsam": { x: 0.80, y: 0.60 },
    "insan-i-kamil": { x: 0.5, y: 0.75 },
    "kalp": { x: 0.5, y: 0.90 },
  };

  fetch("data/ibn-arabi/ontology.json")
    .then((r) => r.json())
    .then((data) => buildGraph(data))
    .catch((err) => console.error("Ontoloji verisi yüklenemedi / Failed to load ontology data", err));

  let simulation, nodeSel, pathSel, labelSel, nodeById;

  function buildGraph(data) {
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;

    const defs = svg.append("defs");
    ["descent", "return", "paradox"].forEach((kind) => {
      defs.append("marker")
        .attr("id", "arrow-" + kind)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 9)
        .attr("refY", 0)
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("class", "arrowhead arrowhead--" + kind);
    });

    const nodes = data.nodes.map((n) => Object.assign({}, n));
    nodeById = new Map(nodes.map((n) => [n.id, n]));

    const links = data.edges.map((e) => Object.assign({}, e));

    nodes.forEach((n) => {
      const t = TARGET[n.id] || { x: 0.5, y: 0.5 };
      n.tx = t.x * width;
      n.ty = t.y * height;
      n.x = n.tx;
      n.y = n.ty;
    });

    simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(120).strength(0.15))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("x", d3.forceX((d) => d.tx).strength(0.85))
      .force("y", d3.forceY((d) => d.ty).strength(0.85))
      .force("collide", d3.forceCollide().radius((d) => radiusFor(d) + 44));

    const linkGroup = svg.append("g").attr("class", "links");

    pathSel = linkGroup
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("class", (d) => "link link--" + d.kind)
      .attr("marker-end", (d) => "url(#arrow-" + (d.kind === "gather" ? "descent" : d.kind) + ")")
      .attr("fill", "none")
      .on("mouseenter", (event, d) => highlightEdge(d))
      .on("mouseleave", () => highlight(null));

    const nodeGroup = svg.append("g").attr("class", "nodes");

    nodeSel = nodeGroup
      .selectAll("g.node")
      .data(nodes)
      .join("g")
      .attr("class", "node ontology-node")
      .call(drag(simulation))
      .on("click", (event, d) => onNodeClick(d))
      .on("mouseenter", (event, d) => highlight(d))
      .on("mouseleave", () => highlight(null));

    nodeSel
      .append("circle")
      .attr("r", (d) => radiusFor(d))
      .attr("fill", (d) => colorFor(d));

    labelSel = nodeSel
      .append("text")
      .attr("class", "node-label")
      .attr("dy", (d) => radiusFor(d) + 14)
      .attr("text-anchor", "middle")
      .text((d) => labelFor(d));

    simulation.on("tick", () => {
      pathSel.attr("d", (d) => edgePath(d));
      nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    window.__ontologyApp = { nodes, links, nodeById };
  }

  function edgePath(d) {
    const s = d.source, t = d.target;
    if (d.kind === "descent" || d.kind === "gather") {
      return `M${s.x},${s.y}L${t.x},${t.y}`;
    }
    // curved bow for "return" (bow right) and "paradox" (bow left)
    const dx = t.x - s.x, dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / dist, ny = dx / dist;
    const bow = d.kind === "return" ? 90 : -70;
    const mx = (s.x + t.x) / 2 + nx * bow;
    const my = (s.y + t.y) / 2 + ny * bow;
    return `M${s.x},${s.y}Q${mx},${my} ${t.x},${t.y}`;
  }

  function render() {
    if (!labelSel) return;
    labelSel.text((d) => labelFor(d));
    if (currentDetailNode) showNodeDetail(currentDetailNode);
    else if (currentDetailEdge) showEdgeDetail(currentDetailEdge);
  }

  function radiusFor(d) {
    if (d.id === "dhat") return 22;
    if (d.id === "insan-i-kamil") return 18;
    if (d.id === "kalp") return 16;
    return 13;
  }

  const LAYER_COLOR = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#2a78d6", "#1c5cab", "#0d366b"];
  const LAYER_COLOR_DARK = ["#184f95", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#86b6ef", "#cde2fb"];

  function isDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function colorFor(d) {
    if (d.id === "insan-i-kamil") return getVar("--series-daphne");
    if (d.id === "kalp") return getVar("--series-theme");
    const ramp = isDark() ? LAYER_COLOR_DARK : LAYER_COLOR;
    return ramp[Math.min(d.layer, ramp.length - 1)];
  }

  function getVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function labelFor(d) {
    return I18n.pick3(d.name);
  }

  function highlight(d) {
    if (!d) {
      pathSel.classed("link--highlight", false);
      nodeSel.style("opacity", 1);
      return;
    }
    const connected = new Set([d.id]);
    pathSel.each((l) => {
      if (l.source.id === d.id) connected.add(l.target.id);
      if (l.target.id === d.id) connected.add(l.source.id);
    });
    pathSel.classed("link--highlight", (l) => l.source.id === d.id || l.target.id === d.id);
    nodeSel.style("opacity", (n) => (connected.has(n.id) ? 1 : 0.3));
  }

  function highlightEdge(d) {
    pathSel.classed("link--highlight", (l) => l === d);
    nodeSel.style("opacity", (n) => (n.id === d.source.id || n.id === d.target.id ? 1 : 0.3));
  }

  let currentDetailNode = null;
  let currentDetailEdge = null;

  function onNodeClick(d) {
    currentDetailNode = d;
    currentDetailEdge = null;
    showNodeDetail(d);
  }

  function showNodeDetail(d) {
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Varlık Mertebesi", en: "Level of Being", pt: "Nível do Ser" })}</p>
      <h2 class="detail-title">${I18n.pick3(d.name)}</h2>
      <div class="detail-block detail-block--ibnarabi">
        <h3>${I18n.pick3(d.short)}</h3>
        <p>${I18n.pick3(d.definition)}</p>
        <cite>${(d.sources || []).join(" · ")}</cite>
      </div>
      ${relatedEdgesHtml(d)}
    `;
    detailPanel.hidden = false;
  }

  function relatedEdgesHtml(d) {
    const outgoing = window.__ontologyApp.links.filter((l) => l.source.id === d.id);
    const incoming = window.__ontologyApp.links.filter((l) => l.target.id === d.id);
    const rows = [...outgoing.map((l) => ({ l, dir: "out" })), ...incoming.map((l) => ({ l, dir: "in" }))];
    if (!rows.length) return "";
    const items = rows.map(({ l, dir }) => {
      const other = dir === "out" ? l.target : l.source;
      const arrow = dir === "out" ? "→" : "←";
      return `<div class="detail-block detail-block--edge">
        <h3>${arrow} ${I18n.pick3(other.name)} — <em>${I18n.pick3(l.relation)}</em></h3>
        <p>${I18n.pick3(l.nature)}</p>
      </div>`;
    }).join("");
    return `<p class="detail-eyebrow" style="margin-top:18px;">${tt({ tr: "İlişkiler", en: "Relations", pt: "Relações" })}</p>${items}`;
  }

  function showEdgeDetail(l) {
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${I18n.pick3(l.relation)}</p>
      <h2 class="detail-title">${I18n.pick3(l.source.name)} → ${I18n.pick3(l.target.name)}</h2>
      <div class="detail-block detail-block--ibnarabi">
        <p>${I18n.pick3(l.nature)}</p>
      </div>
    `;
    detailPanel.hidden = false;
  }

  function drag(sim) {
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.2).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  }
})();
