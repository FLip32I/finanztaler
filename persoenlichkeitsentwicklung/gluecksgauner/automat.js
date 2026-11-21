document.querySelectorAll(".machine").forEach(machine => {
  const { startspruch, sprueche: thoughts } = gluecksgaunerTexte[machine.dataset.kind];
  const output = machine.querySelector('.thought');
  output.textContent = "„" + startspruch + "“";
  let remaining = [];
  let previous;
  let drawing = false;

  function draw() {
    if (drawing || !thoughts.length) return;
    drawing = true;
    if (!remaining.length) remaining = [...thoughts];
    const choices = remaining.length > 1 ? remaining.filter(thought => thought !== previous) : remaining;
    previous = choices[Math.floor(Math.random() * choices.length)];
    remaining.splice(remaining.indexOf(previous), 1);
    machine.classList.add('spinning');
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 720;
    window.setTimeout(() => {
      output.textContent = '„' + previous + '“';
      machine.classList.remove('spinning');
      drawing = false;
    }, duration);
  }

  machine.querySelectorAll('button').forEach(button => button.addEventListener('click', draw));
});
