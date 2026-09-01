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

const resolveCustomErrorText = anchor => {
  const field = isFormControl(anchor) ? anchor : anchor.querySelector('input, select, textarea');
  return field?.dataset.errorText || null;
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
        const customText = resolveCustomErrorText(anchor);
        if (customText && customText === message) {
          return `<span class="${ERROR_CLASS}" style="height:auto">${customText}</span>`;
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
