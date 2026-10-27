import { validateForm } from './validateForm.js';
import { getRenderer } from './factory.js';
import { getOwnerForm, isCaught, isTouched, markCaught, markTouched, validateAndRender } from './fieldValidation.js';
import { initCodeInputs } from './inputCode.js';
import { initCountInputs } from './inputCount.js';
import { initFileInputs } from './inputFile.js';
import { initCartInvoiceButton } from './cart-invoice-button.js';

const FORM_SELECTOR = '[data-form]';
const FIELD_SELECTOR = 'input, select, textarea';

const isOwnField = field => field.matches(FIELD_SELECTOR) && field.type !== 'file' && getOwnerForm(field);

const onFieldInput = e => {
  const field = e.target;
  if (!isOwnField(field)) return;

  markTouched(field);
  if (isCaught(field)) validateAndRender(field);
};

const onFieldChange = e => {
  const field = e.target;
  if (!isOwnField(field)) return;

  markTouched(field);
  validateAndRender(field);
};

const onFieldBlur = e => {
  const field = e.target;
  if (isOwnField(field) && isTouched(field)) validateAndRender(field);
};

const onSubmit = e => {
  const form = e.target;
  if (!form.matches(FORM_SELECTOR)) return;

  const isValid = validateForm(form, getRenderer(form));

  // Поля, попавшиеся на ошибке при отправке, дальше проверяются на каждый ввод
  Array.from(form.elements)
    .filter(field => field.classList.contains('invalid'))
    .forEach(markCaught);

  if (!isValid) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
};

export const initForms = () => {
  initCodeInputs();
  initCountInputs();
  initFileInputs();
  initCartInvoiceButton();
  document.addEventListener('input', onFieldInput);
  document.addEventListener('change', onFieldChange);
  document.addEventListener('focusout', onFieldBlur);
  document.addEventListener('submit', onSubmit, true);
};
