const scene = document.getElementById("scene");
const dial = document.getElementById("level");
const brightnessValue = document.getElementById("brightness-value");
const sceneState = document.getElementById("scene-state");
const lightNote = document.getElementById("light-note");
const presets = [...document.querySelectorAll(".preset")];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const precisionPointer = matchMedia("(hover: hover) and (pointer: fine)");

const modes = {
  warm: { caption: "Тёплый · 2700 К", note: "Тёплый свет для спокойного вечера." },
  neutral: { caption: "Нейтральный · 4200 К", note: "Нейтральный свет, если хочется лучше видеть детали." },
};

function updateLight() {
  const level = Number(dial.value);
  const mode = modes[scene.dataset.mode];
  scene.style.setProperty("--level", level / 100);
  dial.style.setProperty("--progress", level + "%");
  dial.setAttribute("aria-valuetext", level + "%");
  brightnessValue.value = level + "%";
  sceneState.textContent = level === 0 ? "Свет выключен" : mode.caption;
  lightNote.textContent = level === 0 ? "Свет выключен. Видна форма лампы." : mode.note;
}

for (const preset of presets) {
  preset.disabled = false;
  preset.addEventListener("click", () => {
    const next = preset.dataset.mode;
    if (scene.dataset.mode === next) return;
    scene.dataset.mode = next;
    for (const button of presets) button.setAttribute("aria-pressed", String(button === preset));
    updateLight();
  });
}
dial.disabled = false;
dial.addEventListener("input", updateLight);
updateLight();

scene.addEventListener("pointermove", (event) => {
  if (reduced.matches || !precisionPointer.matches || event.pointerType !== "mouse") return;
  const x = (event.offsetX / scene.clientWidth - .5) * 2;
  const y = (event.offsetY / scene.clientHeight - .5) * 2;
  scene.style.setProperty("--rx", (-y * 3.2) + "deg");
  scene.style.setProperty("--ry", (x * 4.5) + "deg");
}, { passive: true });

scene.addEventListener("pointerleave", () => {
  scene.style.removeProperty("--rx");
  scene.style.removeProperty("--ry");
});

if ("IntersectionObserver" in window && !reduced.matches) {
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("show");
      reveal.unobserve(entry.target);
    }
  }, { threshold: .16 });
  document.querySelectorAll("[data-reveal]").forEach(element => reveal.observe(element));
  document.documentElement.classList.add("motion-ready");
}
