const sequence = document.querySelector(".scene-stack");
const scenes = [...sequence.querySelectorAll(".scene")];
const controls = document.querySelector(".scene-controls");
const selectors = [...controls.querySelectorAll("[data-select]")];
const nextControl = controls.querySelector(".next-scene");
const status = document.querySelector("#scene-status");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let active = 0;
let animations = [];

function clearTransition() {
  for (const animation of animations) animation.cancel();
  animations = [];
  scenes.forEach((scene) => scene.removeAttribute("data-leaving"));
}

function applySelection() {
  scenes.forEach((scene, index) => {
    const selected = index === active;
    scene.toggleAttribute("data-active", selected);
    scene.setAttribute("aria-hidden", String(!selected));
    selectors[index].setAttribute("aria-pressed", String(selected));
  });
}

function switchScene(index) {
  if (index === active) return;
  const previous = scenes[active];
  const entering = scenes[index];
  const direction = index > active ? 1 : -1;
  clearTransition();
  active = index;
  applySelection();
  status.textContent = `Зал ${index + 1} из ${scenes.length}. ${entering.querySelector("h3").textContent}.`;

  if (reducedMotion.matches || typeof entering.animate !== "function") return;
  previous.setAttribute("data-leaving", "");
  const fadeOut = previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: "ease-out", fill: "backwards" });
  fadeOut.onfinish = () => previous.removeAttribute("data-leaving");
  const fadeIn = entering.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 480, easing: "cubic-bezier(.19,.66,.24,1)", fill: "backwards" });
  const imageMove = entering.querySelector("img").animate([
    { transform: `translateX(${direction * 3.3}%) scale(1.08)` },
    { transform: "none" },
  ], { duration: 630, easing: "cubic-bezier(.18,.72,.26,1)", fill: "backwards" });
  const captionMove = entering.querySelector(".scene-info").animate([
    { opacity: 0.25, transform: "translateY(.65rem)" },
    { opacity: 1, transform: "none" },
  ], { duration: 410, delay: 70, easing: "ease-out", fill: "backwards" });
  animations = [fadeOut, fadeIn, imageMove, captionMove];
}

controls.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  switchScene(button === nextControl ? (active + 1) % scenes.length : Number(button.dataset.select));
});

controls.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (active + direction + scenes.length) % scenes.length;
  switchScene(nextIndex);
  selectors[nextIndex].focus();
});

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) clearTransition();
});

applySelection();
sequence.setAttribute("data-enhanced", "");
controls.hidden = false;

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}
