const sayings = {
  mut: [
  'Dein Plan B darf ruhig besser werden als Plan A.',
  'Welchen kleinen Schritt würdest du heute auch mit etwas Lampenfieber wagen?',
  'Du darfst unterwegs herausfinden, wohin du willst.',
  'Denk an etwas, das dir heute leichtfällt. Auch das war einmal neu.',
  'Ein guter Anfang darf unscheinbar aussehen.',
  'Du kannst jemanden um Hilfe bitten und trotzdem deinen eigenen Weg gehen.',
  'Eine Pause gibt dir Zeit, wieder zu hören, was dir wichtig ist.',
  'Vielleicht bist du heute der Mensch, dessen Zuspruch jemand braucht.',
  'Auch ein zweiter Versuch ist ein Anfang.',
  'Für heute darf ein kleiner Fortschritt reichen.',
  'Was hat dir zuletzt gutgetan? Davon darf es mehr geben.',
  'Manchmal beginnt Mut mit einer ehrlichen Frage.',
  'Du darfst deine Meinung ändern, wenn du etwas dazulernst.'
],
  witz: [
    "Selbst dein innerer Schweinehund darf heute mal Gassi gehen.",
    "Ich bin heute spontan. Steht so im Kalender.",
    "Mein Kopf hat 27 Tabs offen. Einer spielt Musik.",
    "Mein Plan hat einen Plan. Die beiden reden gerade nicht miteinander.",
    "Ich wollte über meinen Schatten springen. Jetzt macht er auch Sport.",
    "Meine To-do-Liste und ich führen eine Fernbeziehung.",
    "Ich bin früh dran. Für morgen.",
    "Heute bin ich flexibel. Sogar meine Ausreden machen Yoga."
]
};

document.querySelectorAll(".machine").forEach(machine => {
  const thoughts = sayings[machine.dataset.kind];
  const output = machine.querySelector('.thought');
  let remaining = [];
  let previous;
  let drawing = false;

  function draw() {
    if (drawing) return;
    drawing = true;
    if (!remaining.length) remaining = [...thoughts];
    const choices = remaining.filter(thought => thought !== previous);
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
