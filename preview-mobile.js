const tabs = [...document.querySelectorAll(".screen-tab")];
const views = [...document.querySelectorAll(".app-view")];
const panel = document.querySelector("#phone-screen");

for (const tab of tabs) {
  tab.addEventListener("click", () => {
    for (const item of tabs) {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    }

    for (const view of views) {
      view.hidden = view.dataset.view !== tab.dataset.screen;
    }

    panel.setAttribute("aria-labelledby", tab.id);
  });
}

for (const tab of tabs) {
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (tabs.indexOf(tab) + direction + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  });
}
