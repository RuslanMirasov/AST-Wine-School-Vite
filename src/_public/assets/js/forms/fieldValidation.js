import { validateField } from './validateField.js';
import { getGroupFields, resolveAnchor } from './resolveAnchor.js';
import { getRenderer } from './factory.js';

const FORM_SELECTOR = '[data-form]';

// Поле может лежать вне тега формы и быть привязано к ней атрибутом form
export const getOwnerForm = field => field.closest(FORM_SELECTOR) || (field.form?.matches(FORM_SELECTOR) ? field.form : null);

// Поля, в которые начали вводить: такое поле проверяется при уходе с него, даже если значение вернули к исходному
const touchedFields = new WeakSet();
// Поля, которые хоть раз попались на ошибке: дальше проверяются на каждый ввод, в том числе на пустоту
const caughtFields = new WeakSet();

export const markTouched = field => touchedFields.add(field);
export const isTouched = field => touchedFields.has(field);

export const markCaught = field => caughtFields.add(field);
export const isCaught = field => {
  const form = getOwnerForm(field);
  if (!form) return false;

  return getGroupFields(field, form).some(groupField => caughtFields.has(groupField));
};

// Проверка одного поля (радиокнопки — всей группой) с выводом или снятием ошибки
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
