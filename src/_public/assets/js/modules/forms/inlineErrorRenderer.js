import { ErrorRenderer, SHOW_ERRORS } from './errorRenderer.js';
import { expand, collapse } from './animateHeight.js';

const ERROR_CLASS = 'inputError';
const errorElements = new WeakMap();
let errorIdCounter = 0;

const isFormControl = anchor => anchor.matches('input, select, textarea');

// Для fieldset-анкора (радио-группа) описание вешаем на все поля группы —
// aria-describedby должен быть на самом фокусируемом контроле, не на fieldset.
const getDescribedFields = anchor => (isFormControl(anchor) ? [anchor] : Array.from(anchor.querySelectorAll('input, select, textarea')));

const getErrorElement = anchor => {
  const existing = errorElements.get(anchor);
  if (existing) return existing;

  const errorEl = document.createElement('span');
  errorEl.className = ERROR_CLASS;
  errorEl.id = `inline-error-${++errorIdCounter}`;
  errorEl.setAttribute('role', 'alert');

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
    getDescribedFields(anchor).forEach(field => field.setAttribute('aria-describedby', errorEl.id));
  }

  clear(anchor) {
    const errorEl = errorElements.get(anchor);
    if (errorEl) collapse(errorEl);
    getDescribedFields(anchor).forEach(field => field.removeAttribute('aria-describedby'));
  }
}
