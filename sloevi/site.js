const projectSwitch = document.querySelector("[data-project-switch]");
const tabs = [...projectSwitch.querySelectorAll("button")];
const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
const arrowOffset = { ArrowLeft: -1, ArrowRight: 1 };
let activeIndex = -1;

function showProject(index, updateURL = false) {
  if (index === activeIndex) return;

  const hasPrevious = activeIndex >= 0;
  if (hasPrevious) panels[index].dataset.sweep = index < activeIndex ? "backward" : "forward";

  tabs.forEach((tab, tabIndex) => {
    const active = tabIndex === index;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[tabIndex].hidden = !active;
    panels[tabIndex].classList.toggle("panel-enter", active && hasPrevious);
  });
  activeIndex = index;

  if (updateURL && location.protocol !== "file:") {
    const url = new URL(location.href);
    url.searchParams.set("project", panels[index].id);
    history.replaceState(null, "", url);
  }
}

projectSwitch.setAttribute("role", "tablist");
projectSwitch.setAttribute("aria-labelledby", "project-label");
tabs.forEach((tab, index) => {
  tab.setAttribute("role", "tab");
  panels[index].setAttribute("role", "tabpanel");
  panels[index].setAttribute("aria-labelledby", tab.id);
  panels[index].tabIndex = 0;
  tab.addEventListener("click", () => showProject(index, true));
  tab.addEventListener("keydown", event => {
    const offset = arrowOffset[event.key];
    let nextIndex;

    if (offset) {
      nextIndex = (index + offset + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    showProject(nextIndex, true);
    tabs[nextIndex].focus({ preventScroll: true });
  });
});

const requestedProject = new URL(location.href).searchParams.get("project");
showProject(Math.max(0, panels.findIndex(panel => panel.id === requestedProject)));
projectSwitch.hidden = false;
