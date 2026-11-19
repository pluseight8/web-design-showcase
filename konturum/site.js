const modeControl = document.querySelector("[data-modes]");
const modeButtons = [...modeControl.querySelectorAll("button")];
const panels = modeButtons.map(button => document.getElementById(button.getAttribute("aria-controls")));
const graphs = new Map();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const keyOffsets = { ArrowLeft: -1, ArrowRight: 1 };
let modeIndex = -1;

function port(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.abs(dx) / from.w, Math.abs(dy) / from.h);
  return { x: from.x + dx / distance, y: from.y + dy / distance };
}

function drawGraph(graph) {
  const { canvas, nodes, edges, current } = graphs.get(graph);
  const width = graph.clientWidth;
  const height = graph.clientHeight;
  if (!width || !height) return;

  const pixelRatio = Math.min(devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * pixelRatio);
  const pixelHeight = Math.round(height * pixelRatio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bounds = canvas.getBoundingClientRect();
  const points = new Map();
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    points.set(node.dataset.key, {
      x: rect.left - bounds.left + rect.width / 2,
      y: rect.top - bounds.top + rect.height / 2,
      w: rect.width / 2 + 5,
      h: rect.height / 2 + 5,
    });
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Paint bright branches last so the selected path remains legible at a junction.
  const paint = (selected) => {
    for (const [source, target] of edges) {
      if ((source === current || target === current) !== selected) continue;
      const from = points.get(source);
      const to = points.get(target);
      const start = port(from, to);
      const end = port(to, from);
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.strokeStyle = selected ? "#ff876e" : "#9e6771";
      ctx.lineWidth = selected ? 1.9 : 1.3;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(end.x - 6 * Math.cos(angle - .47), end.y - 6 * Math.sin(angle - .47));
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - 6 * Math.cos(angle + .47), end.y - 6 * Math.sin(angle + .47));
      ctx.stroke();
    }
  };
  paint(false);
  paint(true);
}

function selectNode(graph, node) {
  const info = graphs.get(graph);
  if (info.current === node.dataset.key) return;

  info.current = node.dataset.key;
  for (const entry of info.nodes) {
    entry.firstElementChild.setAttribute("aria-pressed", String(entry === node));
  }
  info.name.textContent = node.firstElementChild.textContent;
  info.note.textContent = node.dataset.note;

  if (!reducedMotion.matches && typeof info.inspection.animate === "function") {
    info.reading?.cancel();
    info.reading = info.inspection.animate(
      [{ opacity: .56, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 245, easing: "cubic-bezier(.2,.72,.25,1)" },
    );
  }
  drawGraph(graph);
}

function selectMode(index) {
  if (modeIndex === index) return;
  modeButtons.forEach((button, position) => {
    const selected = index === position;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    panels[position].hidden = !selected;
    panels[position].classList.toggle("mode-reveal", selected && modeIndex >= 0);
  });
  modeIndex = index;
  drawGraph(panels[index].querySelector(".graph"));
}

const resize = new ResizeObserver(entries => {
  for (const { target } of entries) drawGraph(target);
});

modeControl.setAttribute("role", "tablist");
modeButtons.forEach((button, index) => {
  const panel = panels[index];
  const graph = panel.querySelector(".graph");
  const inspection = panel.querySelector("[data-inspection]");
  const nodes = [...graph.querySelectorAll("[data-key]")];
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  graph.prepend(canvas);
  graphs.set(graph, {
    canvas,
    nodes,
    inspection,
    name: inspection.querySelector("[data-name]"),
    note: inspection.querySelector("[data-note-copy]"),
    edges: graph.dataset.edges.split(" ").map(edge => edge.split(":")),
    current: nodes[0].dataset.key,
  });
  resize.observe(graph);

  nodes.forEach((node, position) => {
    const control = document.createElement("button");
    control.type = "button";
    control.className = "node";
    control.textContent = node.firstElementChild.textContent;
    control.setAttribute("aria-pressed", String(position === 0));
    control.addEventListener("click", () => selectNode(graph, node));
    node.replaceChildren(control);
  });

  button.setAttribute("role", "tab");
  panel.setAttribute("role", "tabpanel");
  panel.setAttribute("aria-labelledby", button.id);
  panel.tabIndex = 0;
  button.addEventListener("click", () => selectMode(index));
  button.addEventListener("keydown", event => {
    const offset = keyOffsets[event.key];
    let next;
    if (offset) next = (index + offset + modeButtons.length) % modeButtons.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = modeButtons.length - 1;
    else return;

    event.preventDefault();
    selectMode(next);
    modeButtons[next].focus({ preventScroll: true });
  });
});
selectMode(0);
modeControl.hidden = false;
modeControl.closest(".desk").classList.add("is-interactive");
document.querySelector("[data-live-help]").hidden = false;
document.fonts.ready.then(() => drawGraph(panels[modeIndex].querySelector(".graph")));

reducedMotion.addEventListener("change", event => {
  if (event.matches) for (const graph of graphs.values()) graph.reading?.cancel();
});

const optic = document.querySelector("[data-optic]");
const hover = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
let lensBounds;
function resetLens() {
  lensBounds = undefined;
  optic.style.removeProperty("--rx");
  optic.style.removeProperty("--ry");
}
optic.addEventListener("pointerenter", () => {
  if (hover.matches) lensBounds = optic.getBoundingClientRect();
});
optic.addEventListener("pointermove", event => {
  if (!lensBounds || event.pointerType === "touch") return;
  const x = (event.clientX - lensBounds.left) / lensBounds.width - .5;
  const y = (event.clientY - lensBounds.top) / lensBounds.height - .5;
  optic.style.setProperty("--rx", `${(-y * 13).toFixed(2)}deg`);
  optic.style.setProperty("--ry", `${(x * 17).toFixed(2)}deg`);
});
optic.addEventListener("pointerleave", resetLens);
hover.addEventListener("change", resetLens);
