import { validateField } from './validateField.js';
import { getGroupFields, resolveAnchor } from './resolveAnchor.js';
import { getRenderer } from './factory.js';

const FORM_SELECTOR = '[data-form]';

export const getOwnerForm = field => field.closest(FORM_SELECTOR) || (field.form?.matches(FORM_SELECTOR) ? field.form : null);

const touchedFields = new WeakSet();
const caughtFields = new WeakSet();

export const markTouched = field => touchedFields.add(field);
export const isTouched = field => touchedFields.has(field);
export const markCaught = field => caughtFields.add(field);

export const isCaught = field => {
  const form = getOwnerForm(field);
  if (!form) return false;

  return getGroupFields(field, form).some(groupField => caughtFields.has(groupField));
};

export const validateAndRender = field => {
  const form = getOwnerForm(field);
  if (!form) return true;

  const renderer = getRenderer(form);
  const anchor = resolveAnchor(field, form);
  let firstInvalidMessage = null;

  getGroupFields(field, form).forEach(groupField => {
    const result = validateField(groupField);

    if (result.valid) {
      renderer.markValid(groupField);
    } else {
      renderer.markInvalid(groupField);
      markCaught(groupField);
      firstInvalidMessage = firstInvalidMessage || result.message;
    }
  });

  if (firstInvalidMessage) {
    renderer.show(anchor, firstInvalidMessage);
  } else {
    renderer.clear(anchor);
  }

  return !firstInvalidMessage;
};
