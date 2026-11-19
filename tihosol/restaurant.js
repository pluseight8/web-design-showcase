const filters = document.querySelector(".menu-filter");
const menuSections = document.querySelectorAll("[data-menu]");
const menuStatus = document.querySelector("#menu-status");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let menuAnimations = [];

function stopMenuAnimations() {
  menuAnimations.forEach((animation) => animation.cancel());
  menuAnimations = [];
}

function presentMenuLines(section) {
  if (reducedMotion.matches || typeof section.animate !== "function") return;
  section.querySelectorAll("dl > div").forEach((line, index) => {
    const animation = line.animate([
      { opacity: 0.25, transform: "translate(1rem, .18rem)" },
      { opacity: 1, transform: "translate(0, 0)" },
    ], { duration: 365, delay: index * 50, easing: "cubic-bezier(.2,.7,.24,1)", fill: "backwards" });
    menuAnimations.push(animation);
  });
}

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) stopMenuAnimations();
});

filters.addEventListener("click", (event) => {
  const selected = event.target.closest("button[data-category]");
  if (!selected || selected.getAttribute("aria-pressed") === "true") return;

  const category = selected.dataset.category;
  for (const button of filters.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button === selected));
  }
  stopMenuAnimations();
  for (const section of menuSections) {
    section.hidden = category !== "all" && section.dataset.menu !== category;
    if (!section.hidden) presentMenuLines(section);
  }
  menuStatus.textContent = category === "all" ? "Показано всё меню." : `Показан раздел «${selected.textContent}».`;
});
filters.hidden = false;

const table = document.querySelector(".table-form");
const dateField = table.elements.namedItem("day");
const timeField = table.elements.namedItem("time");
const partyField = table.elements.namedItem("party");
const receipt = document.querySelector(".receipt");
const result = document.querySelector("#table-result");
const shortDate = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "short" });
const fullDate = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const today = new Date();
const openingDays = [];

for (let offset = 0; openingDays.length < 7; offset += 1) {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12);
  if (day.getDay() === 1 || (offset === 0 && today.getHours() >= 21)) continue;
  dateField.add(new Option(shortDate.format(day), String(openingDays.length)));
  openingDays.push(day);
}

function updateTimes() {
  const day = openingDays[Number(dateField.value)];
  const isToday = day.toDateString() === today.toDateString();
  for (const slot of timeField.options) {
    slot.disabled = isToday && Number(slot.value.slice(0, 2)) <= today.getHours();
  }
  if (timeField.selectedOptions[0]?.disabled) {
    timeField.value = [...timeField.options].find((slot) => !slot.disabled).value;
  }
}

table.addEventListener("change", updateTimes);
table.addEventListener("submit", (event) => {
  event.preventDefault();
  const day = openingDays[Number(dateField.value)];
  const guests = partyField.selectedOptions[0].textContent;
  const area = Number(partyField.value) <= 2 ? "столик у окна" : "стол у банкетки";
  result.textContent = `${area.charAt(0).toUpperCase()}${area.slice(1)}, ${fullDate.format(day)} в ${timeField.value}, ${guests}.`;
  if (typeof receipt.showModal === "function") receipt.showModal();
  else receipt.setAttribute("open", "");
  result.focus();
});
receipt.querySelector(".receipt-close").addEventListener("click", () => {
  if (typeof receipt.close === "function") receipt.close();
  else receipt.removeAttribute("open");
  table.querySelector("button[type=submit]").focus();
});
updateTimes();
table.hidden = false;

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}
