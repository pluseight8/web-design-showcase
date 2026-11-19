const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

const lessonFormats = {
  mobility: {
    name: "Мобильность", minutes: 45,
    description: "Упражнения для плеч, грудного отдела и тазобедренных суставов."
  },
  strength: {
    name: "Сила", minutes: 50,
    description: "Базовые силовые движения с собственным весом и инвентарём."
  },
  stretch: {
    name: "Растяжка", minutes: 45,
    description: "Плавная работа с гибкостью в спокойном темпе."
  }
};

const week = [
  [["08:00", "mobility"], ["12:30", "stretch"], ["19:15", "strength"]],
  [["09:00", "stretch"], ["18:30", "mobility"]],
  [["08:30", "strength"], ["13:00", "mobility"], ["19:00", "stretch"]],
  [["09:30", "mobility"], ["19:15", "strength"]],
  [["08:00", "strength"], ["12:30", "stretch"], ["18:30", "mobility"]],
  [["10:00", "mobility"], ["11:15", "strength"], ["12:30", "stretch"]],
  [["10:30", "stretch"], ["12:00", "mobility"]]
].map((lessons, day) => lessons.map(([time, format], index) => ({
  id: `${day}-${index}`, day, time, format
})));

const planner = document.querySelector(".planner");
const sessions = document.getElementById("sessions");
const template = document.getElementById("session-template");
const scheduleDay = document.getElementById("schedule-day");
const emptyMessage = document.getElementById("empty-message");
const selectionMessage = document.getElementById("selection-message");
const selection = document.querySelector(".selection");
const clearChoice = document.getElementById("clear-choice");
const dayOptions = [...planner.querySelectorAll("input[name=day]")];
const formatOptions = [...planner.querySelectorAll("input[name=format]")];

let selectedLesson = null;

function updateChoices() {
  for (const button of sessions.querySelectorAll(".choose")) {
    const isSelected = button.dataset.lesson === selectedLesson?.id;
    button.setAttribute("aria-pressed", String(isSelected));
    button.textContent = isSelected ? "Выбрано" : "Выбрать";
  }
}

function updateSelection() {
  updateChoices();
  selection.toggleAttribute("data-selected", Boolean(selectedLesson));
  clearChoice.hidden = !selectedLesson;
  if (!selectedLesson) {
    selectionMessage.textContent = "Выберите занятие в расписании. Здесь появятся формат, день и время.";
    return;
  }

  const format = lessonFormats[selectedLesson.format];
  const result = document.createElement("span");
  result.className = "selection-result";
  const title = document.createElement("strong");
  title.textContent = format.name;
  result.append(title, ` ${days[selectedLesson.day]} · ${selectedLesson.time} · ${format.minutes} мин`);
  selectionMessage.replaceChildren(result);
}

function renderSchedule(animate = false) {
  const day = dayOptions.findIndex(input => input.checked);
  const format = formatOptions.find(input => input.checked).value;
  const lessons = week[day].filter(lesson => format === "all" || lesson.format === format);
  const count = lessons.length === 1 ? "1 занятие" : `${lessons.length} занятия`;
  scheduleDay.textContent = `${days[day]} · ${lessons.length ? count : "нет занятий"}`;
  emptyMessage.hidden = Boolean(lessons.length);

  const rows = lessons.map(lesson => {
    const lessonFormat = lessonFormats[lesson.format];
    const row = template.content.firstElementChild.cloneNode(true);
    const time = row.querySelector("time");
    time.dateTime = lesson.time;
    time.textContent = lesson.time;
    row.querySelector("small").textContent = `${lessonFormat.minutes} мин`;
    row.querySelector("h3").textContent = lessonFormat.name;
    row.querySelector("p").textContent = lessonFormat.description;

    const button = row.querySelector("button");
    button.dataset.lesson = lesson.id;
    button.setAttribute("aria-label", `Выбрать занятие «${lessonFormat.name}» в ${lesson.time}`);
    button.addEventListener("click", () => {
      selectedLesson = selectedLesson?.id === lesson.id ? null : lesson;
      updateSelection();
    });
    return row;
  });
  sessions.classList.toggle("has-motion", animate);
  sessions.replaceChildren(...rows);
  updateChoices();
}

planner.addEventListener("change", () => renderSchedule(true));
clearChoice.addEventListener("click", () => {
  const previousButton = [...sessions.querySelectorAll(".choose")]
    .find(button => button.dataset.lesson === selectedLesson?.id);
  selectedLesson = null;
  updateSelection();
  (previousButton || dayOptions.find(input => input.checked)).focus();
});

for (const shortcut of document.querySelectorAll("[data-shortcut]")) {
  shortcut.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const format = shortcut.dataset.shortcut;
    const currentDay = dayOptions.findIndex(input => input.checked);
    if (!week[currentDay].some(lesson => lesson.format === format)) {
      const firstDay = week.findIndex(lessons => lessons.some(lesson => lesson.format === format));
      dayOptions[firstDay].checked = true;
    }
    formatOptions.find(input => input.value === format).checked = true;
    renderSchedule(true);
  });
}

renderSchedule();
planner.hidden = false;

if ("IntersectionObserver" in window) {
  const viewObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio < .24) continue;
      entry.target.classList.add("is-in-view");
      viewObserver.unobserve(entry.target);
    }
  }, { threshold: .24 });

  for (const target of document.querySelectorAll("[data-in-view]")) viewObserver.observe(target);
}
