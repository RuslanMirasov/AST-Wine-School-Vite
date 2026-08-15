import { ErrorRenderer, SHOW_ERRORS } from './errorRenderer.js';
import { expand, collapse } from './animateHeight.js';

const ERROR_CLASS = 'inputError';
const LABEL_TEXT_SELECTOR = '.label-text, legend';

const isFormControl = anchor => anchor.matches('input, select, textarea');

// Человекочитаемый заголовок поля для префикса в summary: видимый текст лейбла/legend
// в приоритете, name/placeholder — запасной вариант, если подписи в разметке нет.
const resolveFieldTitle = anchor => {
  const scope = isFormControl(anchor) ? anchor.closest('label') : anchor;
  const labelText = scope?.querySelector(LABEL_TEXT_SELECTOR);
  if (labelText) return labelText.textContent.trim();

  const field = isFormControl(anchor) ? anchor : anchor.querySelector('input, select, textarea');
  return field?.placeholder || field?.name || '';
};

export class SummaryErrorRenderer extends ErrorRenderer {
  constructor(container) {
    super();
    this.container = container;
  }

  // Маркировка .invalid уже делается в validateForm напрямую по каждому полю —
  // этому рендереру per-anchor show/clear не нужны, оставляем как no-op.
  show() {}

  clear() {}

  renderSummary(errors) {
    if (!SHOW_ERRORS) return;

    this.container.innerHTML = errors
      .map(({ anchor, message }) => {
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
