export const SHOW_ERRORS = true;

export class ErrorRenderer {
  show() {
    throw new Error('ErrorRenderer.show() не реализован');
  }

  clear() {
    throw new Error('ErrorRenderer.clear() не реализован');
  }

  renderSummary() {}

  clearSummary() {}

  markInvalid(field) {
    field.classList.add('invalid');
    field.closest('.choices')?.classList.add('invalid');
  }

  markValid(field) {
    field.classList.remove('invalid');
    field.closest('.choices')?.classList.remove('invalid');
  }
}
