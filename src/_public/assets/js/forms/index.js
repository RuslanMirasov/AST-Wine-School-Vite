import { validateField } from './validateField.js';
import { validateForm } from './validateForm.js';
import { getGroupFields, resolveAnchor } from './resolveAnchor.js';
import { getRenderer } from './factory.js';
import { initCodeInputs } from './inputCode.js';
import { initCountInputs } from './inputCount.js';
import { initFileInputs } from './inputFile.js';
import { initCartInvoiceButton } from './cart-invoice-button.js';

const FORM_SELECTOR = '[data-form]';
const FIELD_SELECTOR = 'input, select, textarea';

// Поле может лежать вне тега формы и быть привязано к ней атрибутом form
const getOwnerForm = field => field.closest(FORM_SELECTOR) || (field.form?.matches(FORM_SELECTOR) ? field.form : null);

const onFieldFocus = e => {
  if (!e.target.matches(FIELD_SELECTOR)) return;

  const form = getOwnerForm(e.target);
  if (!form) return;

  const renderer = getRenderer(form);
  renderer.markValid(e.target);
  renderer.clear(resolveAnchor(e.target, form));
};

const onFieldChange = e => {
  const field = e.target;
  if (field.type !== 'checkbox' && field.type !== 'radio') return;

  const form = getOwnerForm(field);
  if (!form) return;

  const renderer = getRenderer(form);
  const groupFields = getGroupFields(field, form);
  const anchor = resolveAnchor(field, form);

  let firstInvalidMessage = null;

  groupFields.forEach(groupField => {
    const result = validateField(groupField);

    if (result.valid) {
      renderer.markValid(groupField);
    } else {
      renderer.markInvalid(groupField);
      firstInvalidMessage = firstInvalidMessage || result.message;
    }
  });

  if (firstInvalidMessage) {
    renderer.show(anchor, firstInvalidMessage);
  } else {
    renderer.clear(anchor);
  }
};

const onSubmit = e => {
  const form = e.target;
  if (!form.matches(FORM_SELECTOR)) return;

  const isValid = validateForm(form, getRenderer(form));

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
  document.addEventListener('focusin', onFieldFocus);
  document.addEventListener('change', onFieldChange);
  document.addEventListener('submit', onSubmit, true);
};
