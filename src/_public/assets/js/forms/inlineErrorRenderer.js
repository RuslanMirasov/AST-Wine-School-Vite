import { ErrorRenderer, SHOW_ERRORS } from './errorRenderer.js';
import { expand, collapse } from './animateHeight.js';

const ERROR_CLASS = 'inputError';
const errorElements = new WeakMap();
let errorIdCounter = 0;

const isFormControl = anchor => anchor.matches('input, select, textarea');
const getDescribedFields = anchor => (isFormControl(anchor) ? [anchor] : Array.from(anchor.querySelectorAll('input, select, textarea')));

const findExistingErrorElement = anchor => {
  if (isFormControl(anchor)) {
    const label = anchor.closest('label');
    if (!label) return null;

    // Если в label несколько полей (например агрегирующее hidden-поле кода + боксы
    // под него) — единственный .inputError внутри мог принадлежать соседнему полю,
    // однозначно определить владельца нельзя. Пропускаем переиспользование, чтобы
    // clear() на "чужом" поле не хватал и не схлопывал чужую ошибку (гонка анимаций).
    if (label.querySelectorAll('input, select, textarea').length > 1) return null;

    return label.querySelector(`:scope > .${ERROR_CLASS}`) ?? null;
  }
  const sibling = anchor.nextElementSibling;
  return sibling?.classList.contains(ERROR_CLASS) ? sibling : null;
};

const resolveErrorElement = anchor => {
  const existing = errorElements.get(anchor) ?? findExistingErrorElement(anchor);
  if (!existing) return null;

  if (!existing.id) existing.id = `inline-error-${++errorIdCounter}`;
  existing.setAttribute('role', 'alert');
  errorElements.set(anchor, existing);
  return existing;
};

const createErrorElement = anchor => {
  const errorEl = document.createElement('span');
  errorEl.className = ERROR_CLASS;
  errorEl.id = `inline-error-${++errorIdCounter}`;
  errorEl.setAttribute('role', 'alert');

  if (isFormControl(anchor)) {
    const label = anchor.closest('label');
    if (!label) return null;
    label.appendChild(errorEl);
  } else {
    anchor.insertAdjacentElement('afterend', errorEl);
  }

  errorElements.set(anchor, errorEl);
  return errorEl;
};

const getErrorElement = anchor => resolveErrorElement(anchor) ?? createErrorElement(anchor);

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
    const errorEl = resolveErrorElement(anchor);
    if (errorEl) collapse(errorEl);
    getDescribedFields(anchor).forEach(field => field.removeAttribute('aria-describedby'));
  }
}
