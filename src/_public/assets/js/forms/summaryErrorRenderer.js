import { ErrorRenderer, SHOW_ERRORS } from './errorRenderer.js';
import { expand, collapse } from './animateHeight.js';

const ERROR_CLASS = 'inputError';
const LABEL_TEXT_SELECTOR = '.label-text, legend';

const isFormControl = anchor => anchor.matches('input, select, textarea');

const resolveFieldTitle = anchor => {
  const scope = isFormControl(anchor) ? anchor.closest('label') : anchor;
  const labelText = scope?.querySelector(LABEL_TEXT_SELECTOR);
  if (labelText) return labelText.textContent.trim();

  const field = isFormControl(anchor) ? anchor : anchor.querySelector('input, select, textarea');
  return field?.placeholder || field?.name || '';
};

// Все свои тексты поля: data-error-text и точечные data-*-error-text
const resolveCustomErrorTexts = anchor => {
  const field = isFormControl(anchor) ? anchor : anchor.querySelector('input, select, textarea');
  if (!field) return [];

  return Object.entries(field.dataset)
    .filter(([key]) => key === 'errorText' || key.endsWith('ErrorText'))
    .map(([, text]) => text);
};

export class SummaryErrorRenderer extends ErrorRenderer {
  constructor(container) {
    super();
    this.container = container;
    this.container.setAttribute('role', 'alert');
  }

  show() {}

  clear() {}

  renderSummary(errors) {
    if (!SHOW_ERRORS) return;

    this.container.innerHTML = errors
      .map(({ anchor, message }) => {
        if (resolveCustomErrorTexts(anchor).includes(message)) {
          return `<span class="${ERROR_CLASS}" style="height:auto">${message}</span>`;
        }

        const title = resolveFieldTitle(anchor);
        const prefix = title ? `«${title}»: ` : '';
        return `<span class="${ERROR_CLASS}" style="height:auto">${prefix}${message}</span>`;
      })
      .join('');

    expand(this.container);
  }

  clearSummary() {
    collapse(this.container);
  }
}
