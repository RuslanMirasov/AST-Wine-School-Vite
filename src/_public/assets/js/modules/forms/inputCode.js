import { getRenderer } from './factory.js';
import { resolveAnchor } from './resolveAnchor.js';

const FORM_SELECTOR = '[data-form]';

const createBox = (index, total) => {
  const box = document.createElement('input');
  box.type = 'number';
  box.className = 'input';
  box.min = '0';
  box.autocomplete = 'one-time-code';
  box.setAttribute('aria-label', `Цифра ${index + 1} из ${total}`);
  return box;
};

const clearInvalidState = (hidden, form) => {
  const renderer = getRenderer(form);
  renderer.markValid(hidden);
  renderer.clear(resolveAnchor(hidden, form));
};

const initCodeField = hidden => {
  const form = hidden.closest(FORM_SELECTOR);
  const total = Number(hidden.dataset.code);
  if (!form || !Number.isInteger(total) || total <= 0) return;

  const boxes = Array.from({ length: total }, (_, index) => createBox(index, total));

  let anchor = hidden;
  boxes.forEach(box => {
    anchor.after(box);
    anchor = box;
  });

  boxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(-1);

      const firstEmpty = boxes.find(field => !field.value);
      if (firstEmpty) firstEmpty.focus();

      hidden.value = boxes.map(field => field.value).join('');
    });

    box.addEventListener('keydown', e => {
      if (e.key !== 'Backspace' || box.value) return;
      boxes[index - 1]?.focus();
    });

    box.addEventListener('focus', () => clearInvalidState(hidden, form));
  });
};

export const initCodeInputs = () => {
  document.querySelectorAll('[data-code]').forEach(initCodeField);
};
