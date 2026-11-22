"use strict";
document.querySelectorAll('.machine').forEach(machine => {
  const data = gluecksgaunerTexte[machine.dataset.kind];
  if (!data) return;
  const {startspruch, sprueche: thoughts} = data;
  const output = machine.querySelector('.thought');
  const text = document.createElement('span');
  text.className = 'quote-text';
  output.replaceChildren(text);
  const buttons = [...machine.querySelectorAll('button')];
  let remaining = [], previous = startspruch, drawing = false;
  function fit() {
    const style = getComputedStyle(output);
    const availableHeight = output.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const availableWidth = output.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (availableHeight <= 0 || availableWidth <= 0) return;
    // Reset on every resize so the font grows again on wider screens.
    let low = 1, high = Math.min(23, Math.max(14, machine.clientWidth * .035));
    for (let i = 0; i < 12; i++) {
      const middle = (low + high) / 2;
      text.style.fontSize = middle + 'px';
      if (text.getBoundingClientRect().height <= availableHeight - 1 && text.scrollWidth <= availableWidth) low = middle;
      else high = middle;
    }
    text.style.fontSize = (Math.floor(low * 100) / 100) + 'px';
  }
  function show(value) {text.textContent = '„' + value + '“';fit();}
  show(startspruch);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(machine);
  else window.addEventListener('resize', fit);
  if (document.fonts) document.fonts.ready.then(fit);
  function draw() {
    if (drawing || !thoughts.length) return;
    drawing = true;
    buttons.forEach(button => button.disabled = true);
    if (!remaining.length) remaining = [...thoughts];
    let choices = remaining.filter(thought => thought !== previous);
    if (!choices.length) choices = remaining;
    previous = choices[Math.floor(Math.random() * choices.length)];
    remaining.splice(remaining.indexOf(previous), 1);
    machine.classList.add('spinning');
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 720;
    setTimeout(() => {
      show(previous);
      machine.classList.remove('spinning');
      drawing = false;
      buttons.forEach(button => button.disabled = false);
    }, duration);
  }
  buttons.forEach(button => button.addEventListener('click', draw));
});
