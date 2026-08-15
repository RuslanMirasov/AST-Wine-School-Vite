// Мастер-флаг: при false поля всё равно помечаются .invalid (см. markInvalid),
// но текст ошибки (inline-подпись/summary-блок) нигде не рендерится.
export const SHOW_ERRORS = true;

// Контракт для стратегий вывода ошибок. InlineErrorRenderer и SummaryErrorRenderer
// реализуют один и тот же интерфейс и взаимозаменяемы для validateForm/index.js.
export class ErrorRenderer {
  /** @param {HTMLElement} anchor — поле или общий предок группы (напр. fieldset) @param {string} message */
  show() {
    throw new Error('ErrorRenderer.show() не реализован');
  }

  /** @param {HTMLElement} anchor */
  clear() {
    throw new Error('ErrorRenderer.clear() не реализован');
  }

  /** @param {{anchor: HTMLElement, message: string}[]} errors */
  renderSummary() {}

  clearSummary() {}

  markInvalid(field) {
    field.classList.add('invalid');
    // Choices.js прячет нативный select и рисует свою обёртку — .invalid нужно
    // продублировать на неё, иначе состояние ошибки визуально не видно.
    field.closest('.choices')?.classList.add('invalid');
  }

  markValid(field) {
    field.classList.remove('invalid');
    field.closest('.choices')?.classList.remove('invalid');
  }
}
