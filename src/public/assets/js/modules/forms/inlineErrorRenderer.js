import { ErrorRenderer, SHOW_ERRORS } from './errorRenderer.js';
import { expand, collapse } from './animateHeight.js';

const ERROR_CLASS = 'inputError';
const errorElements = new WeakMap();

const isFormControl = anchor => anchor.matches('input, select, textarea');

const getErrorElement = anchor => {
  const existing = errorElements.get(anchor);
  if (existing) return existing;

  const errorEl = document.createElement('span');
  errorEl.className = ERROR_CLASS;

  if (isFormControl(anchor)) {
    const label = anchor.closest('label');
    if (!label) return null;
    label.appendChild(errorEl);
  } else {
    // anchor — общий предок группы (например fieldset): ошибка ставится
    // сразу после его закрывающего тега, а не внутрь.
    anchor.insertAdjacentElement('afterend', errorEl);
  }

  errorElements.set(anchor, errorEl);
  return errorEl;
};

export class InlineErrorRenderer extends ErrorRenderer {
  show(anchor, message) {
    if (!SHOW_ERRORS) return;

    const errorEl = getErrorElement(anchor);
    if (!errorEl || !message) return;

    errorEl.textContent = message;
    expand(errorEl);
  }

  clear(anchor) {
    const errorEl = errorElements.get(anchor);
    if (errorEl) collapse(errorEl);
  }
}
