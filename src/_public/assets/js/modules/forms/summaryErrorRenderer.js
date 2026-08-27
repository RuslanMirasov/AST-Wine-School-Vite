import { ErrorRenderer, SHOW_ERRORS } from './errorRenderer.js';
import { expand, collapse } from './animateHeight.js';

const ERROR_CLASS = 'inputError';
const LABEL_TEXT_SELECTOR = '.label-text, legend';

const isFormControl = anchor => anchor.matches('input, select, textarea');

// data-error-title (на anchor — напр. fieldset радио-группы, — либо на самом
// поле). Если указан, это ПОЛНЫЙ текст строки в summary целиком (а не только
// префикс) — так нагляднее: раз текст задан руками, он и выводится как есть,
// без скрытой склейки с message. Нужен, когда видимый текст лейбла слишком
// длинный для summary (чекбоксы согласия) или когда ««title»: message» вообще
// не подходит по формулировке.
const resolveCustomErrorTitle = anchor => {
  if (anchor.dataset.errorTitle) return anchor.dataset.errorTitle;

  const field = isFormControl(anchor) ? anchor : anchor.querySelector('input, select, textarea');
  return field?.dataset.errorTitle || null;
};

// Человекочитаемый заголовок поля для префикса «title»: message —
// используется только когда data-error-title не задан. Видимый текст
// лейбла/legend в приоритете, name/placeholder — запасной вариант.
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
    this.container.setAttribute('role', 'alert');
  }

  // Маркировка .invalid уже делается в validateForm напрямую по каждому полю —
  // этому рендереру per-anchor show/clear не нужны, оставляем как no-op.
  show() {}

  clear() {}

  renderSummary(errors) {
    if (!SHOW_ERRORS) return;

    this.container.innerHTML = errors
      .map(({ anchor, message }) => {
        const customTitle = resolveCustomErrorTitle(anchor);
        if (customTitle) return `<span class="${ERROR_CLASS}" style="height:auto">${customTitle}</span>`;

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
