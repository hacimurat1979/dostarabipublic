(function () {
  "use strict";

  const I18n = window.DostI18n;
  const svg = d3.select("#hal-graph");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");

  function tt(dict) {
    return I18n.pick3(dict);
  }

  function linkify(text, view, id) {
    return window.__dostCrossLink ? window.__dostCrossLink.linkify(text, view, id) : text;
  }

  let halData = null;
  let halDataPromise = null;
  let built = false;
  let root = null;
  let zoomLayer, linkGroup, nodeGroup;
  let zoomBehavior;
  let nodeById = new Map();
  let currentDetailNode = null;

  function fetchData() {
    if (halDataPromise) return halDataPromise;
    halDataPromise = fetch("data/ibn-arabi/hal.json")
      .then((r) => r.json())
      .then((data) => {
        halData = data;
        return data;
      })
      .catch((err) => {
        console.error("Hâller verisi yüklenemedi / Failed to load States data", err);
        halDataPromise = null;
      });
    return halDataPromise;
  }

  function radiusFor(d) {
    const depth = d.depth;
    if (depth === 0) return 30;
    return Math.max(16, 26 - depth * 3);
  }

  const STAGE_COLOR = {
    nefs: "--series-hal-nefs",
    cemfark: "--series-hal-cemfark",
    fenabeka: "--series-hal-fenabeka",
    hayret: "--series-hal-hayret",
  };

  function getVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function colorFor(d) {
    const stage = d.data.stage;
    return getVar(STAGE_COLOR[stage] || "--series-hal-nefs");
  }

  function labelFor(d) {
    return I18n.pick3(d.data.name);
  }

  function collapseAll(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapseAll);
      d.children = null;
    }
  }

  function buildGraph(data) {
    svg.selectAll("*").remove();

    root = d3.stratify()
      .id((d) => d.id)
      .parentId((d) => d.parent)(data.nodes);

    nodeById = new Map();
    root.each((d) => nodeById.set(d.id, d));

    collapseAll(root);
    root.x0 = 0;
    root.y0 = 0;

    zoomLayer = svg.append("g").attr("class", "hal-canvas");
    linkGroup = zoomLayer.append("g").attr("class", "hal-links");
    nodeGroup = zoomLayer.append("g").attr("class", "hal-nodes");

    const width = svg.node().clientWidth || 800;
    const height = svg.node().clientHeight || 600;
    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    zoomBehavior = d3.zoom()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => zoomLayer.attr("transform", event.transform));
    svg.call(zoomBehavior).on("dblclick.zoom", null);

    update(root, false);
    built = true;
  }

  const dx = 140;
  const dy = 110;
  const treeLayout = d3.tree().nodeSize([dx, dy]);

  function zoomToFit(animate) {
    const nodes = root.descendants();
    const width = svg.node().clientWidth || 800;
    const height = svg.node().clientHeight || 600;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    nodes.forEach((d) => {
      x0 = Math.min(x0, d.x);
      x1 = Math.max(x1, d.x);
      y0 = Math.min(y0, d.y);
      y1 = Math.max(y1, d.y);
    });
    x0 -= 70; x1 += 70; y0 -= 50; y1 += 60;
    const treeW = Math.max(1, x1 - x0);
    const treeH = Math.max(1, y1 - y0);
    const topMargin = 70;
    const [minScale, maxScale] = zoomBehavior.scaleExtent();
    const scale = Math.min(maxScale, 1.3, width / treeW, (height - topMargin) / treeH);
    const clampedScale = Math.max(minScale, scale);
    const tx = width / 2 - clampedScale * (x0 + treeW / 2);
    const ty = topMargin - clampedScale * y0;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(clampedScale);
    const sel = animate ? svg.transition().duration(400) : svg;
    sel.call(zoomBehavior.transform, transform);
  }

  function update(source, animate) {
    treeLayout(root);
    const nodes = root.descendants();
    const links = root.links();

    const linkGen = d3.linkVertical().x((d) => d.x).y((d) => d.y);

    const link = linkGroup.selectAll("path.hal-link").data(links, (d) => d.target.id);
    link.exit()
      .transition().duration(300)
      .attr("d", () => linkGen({ source: { x: source.x, y: source.y }, target: { x: source.x, y: source.y } }))
      .remove();
    link.enter().append("path")
      .attr("class", "hal-link")
      .attr("d", () => linkGen({ source: { x: source.x0, y: source.y0 }, target: { x: source.x0, y: source.y0 } }))
      .merge(link)
      .transition().duration(300)
      .attr("d", linkGen);

    const node = nodeGroup.selectAll("g.hal-node").data(nodes, (d) => d.id);

    const nodeEnter = node.enter().append("g")
      .attr("class", "node hal-node")
      .attr("transform", `translate(${source.x0},${source.y0})`)
      .style("opacity", 0)
      .on("click", (event, d) => {
        event.stopPropagation();
        toggle(d);
      })
      .on("mouseenter", (event, d) => highlight(d))
      .on("mouseleave", () => highlight(null));

    nodeEnter.append("circle")
      .attr("r", (d) => radiusFor(d))
      .attr("fill", (d) => colorFor(d));

    nodeEnter.append("text")
      .attr("class", "node-label")
      .attr("dy", (d) => radiusFor(d) + 13)
      .attr("text-anchor", "middle")
      .text((d) => labelFor(d));

    nodeEnter.append("text")
      .attr("class", "hal-expand-badge")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .text((d) => (d._children ? "+" : ""));

    node.merge(nodeEnter)
      .transition().duration(300)
      .style("opacity", 1)
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    node.merge(nodeEnter).select("text.hal-expand-badge")
      .text((d) => (d._children ? "+" : ""));

    node.exit()
      .transition().duration(300)
      .style("opacity", 0)
      .attr("transform", `translate(${source.x},${source.y})`)
      .remove();

    nodes.forEach((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    zoomToFit(animate !== false);
  }

  function toggle(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else if (d._children) {
      d.children = d._children;
      d._children = null;
    }
    update(d, true);
    showDetail(d);
    window.__dostNav && window.__dostNav.setHash("hal", d.id);
  }

  function highlight(d) {
    const nodeSel = nodeGroup.selectAll("g.hal-node");
    const linkSel = linkGroup.selectAll("path.hal-link");
    if (!d) {
      nodeSel.style("opacity", 1);
      linkSel.classed("hal-link--highlight", false);
      return;
    }
    const ids = new Set(d.ancestors().map((a) => a.id));
    const descendantIds = new Set(d.descendants().map((a) => a.id));
    nodeSel.style("opacity", (n) => (ids.has(n.id) || descendantIds.has(n.id) ? 1 : 0.35));
    linkSel.classed("hal-link--highlight", (l) => l.target.id === d.id);
  }

  function insightsHtml(insights, excludeId) {
    if (!insights || !insights.length) return "";
    return `<div class="insight-group">${insights.map((ins, i) => `
      <details class="insight" ${i === 0 ? "open" : ""}>
        <summary>${I18n.pick3(ins.label)}</summary>
        <p>${linkify(I18n.pick3(ins.text), "hal", excludeId)}</p>
        <cite>${ins.cite}</cite>
      </details>
    `).join("")}</div>`;
  }

  function relatedStepsHtml(d) {
    const rows = [];
    if (d.parent) rows.push({ other: d.parent, arrow: "↑" });
    const kids = d.children || d._children || [];
    kids.forEach((c) => rows.push({ other: c, arrow: "↓" }));
    if (!rows.length) return "";
    const items = rows.map(({ other, arrow }) => `
      <div class="detail-block detail-block--edge">
        <h3>${arrow} ${I18n.pick3(other.data.name)}</h3>
      </div>
    `).join("");
    return `<p class="detail-eyebrow" style="margin-top:18px;">${tt({ tr: "Yolun Devamı", en: "Along the Path", pt: "Ao Longo do Caminho" })}</p>${items}`;
  }

  function showDetail(d) {
    currentDetailNode = d;
    const n = d.data;
    const hint = d._children
      ? `<p class="detail-resonance">${tt({ tr: "Devamı için düğüme tekrar tıklayın.", en: "Click the node again to reveal what follows.", pt: "Clique no nó novamente para revelar o que se segue." })}</p>`
      : "";
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Hâller Haritası", en: "Map of States", pt: "Mapa dos Estados" })}</p>
      <h2 class="detail-title">${I18n.pick3(n.name)}</h2>
      <div class="detail-block detail-block--ibnarabi">
        <h3>${I18n.pick3(n.short)}</h3>
        <p>${linkify(I18n.pick3(n.summary), "hal", d.id)}</p>
      </div>
      ${insightsHtml(n.insights, d.id)}
      ${hint}
      ${relatedStepsHtml(d)}
    `;
    detailPanel.hidden = false;
  }

  function render() {
    if (!built || !halData) return;
    nodeGroup.selectAll("g.hal-node text.node-label").text((d) => labelFor(d));
    if (currentDetailNode) showDetail(currentDetailNode);
  }

  function revealPathTo(id) {
    const target = nodeById.get(id);
    if (!target) return;
    let n = target.parent;
    while (n) {
      if (n._children) {
        n.children = n._children;
        n._children = null;
      }
      n = n.parent;
    }
    update(root, false);
    showDetail(target);
  }

  window.__halApp = {
    activate() {
      fetchData().then((data) => {
        if (!data) return;
        if (!built) buildGraph(data);
      });
    },
    goToNode(id) {
      fetchData().then((data) => {
        if (!data) return;
        if (!built) buildGraph(data);
        revealPathTo(id);
      });
    },
    onLangChange() {
      render();
    },
  };
})();
