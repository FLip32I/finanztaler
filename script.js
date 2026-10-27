/* =========================
   FINANZTALER JAVASCRIPT
========================= */


/* MOBILE NAVIGATION */

const menuToggle = document.querySelector(".menu-toggle");

const navigation = document.querySelector("#main-navigation");


/* MENÜ ÖFFNEN / SCHLIESSEN */

menuToggle.addEventListener("click", () => {

  const isOpen =
    menuToggle.getAttribute("aria-expanded") === "true";

  menuToggle.setAttribute(
    "aria-expanded",
    String(!isOpen)
  );

  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Menü öffnen" : "Menü schließen"
  );

  navigation.classList.toggle("open", !isOpen);

});


/* MENÜ NACH KLICK SCHLIESSEN */

const navLinks = navigation.querySelectorAll("a");

navLinks.forEach(link => {

  link.addEventListener("click", () => {

    navigation.classList.remove("open");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Menü öffnen"
    );

  });

});


/* ESC-TASTE SCHLIESST MENÜ */

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {

    navigation.classList.remove("open");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Menü öffnen"
    );

  }

});


/* AUTOMATISCHE JAHRESZAHL */

document.querySelector("#year").textContent =
  new Date().getFullYear();
