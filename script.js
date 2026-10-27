
const menuToggle = document.getElementById("menu-toggle");
const navigation = document.getElementById("navigation");

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Menü schließen" : "Menü öffnen"
    );

    menuToggle.textContent = isOpen ? "✕" : "☰";
  });
}

const yearElement = document.getElementById("current-year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
