const thoughts = [
  'Selbst dein innerer Schweinehund darf heute mal Gassi gehen.',
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
];
const wheels = document.querySelector('.wheels');
const output = document.querySelector('#thought');
let remaining = [];
let previous;
document.querySelector('#pull').addEventListener('click', () => {
  if (!remaining.length) remaining = [...thoughts];
  const choices = remaining.filter(thought => thought !== previous);
  previous = choices[Math.floor(Math.random() * choices.length)];
  remaining.splice(remaining.indexOf(previous), 1);
  output.textContent = previous;
  wheels.classList.remove('spin');
  void wheels.offsetWidth;
  wheels.classList.add('spin');
});
