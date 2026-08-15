import { validateField } from './validateField.js';
import { resolveAnchor } from './resolveAnchor.js';

const FIELD_SELECTOR = 'input, select, textarea';

export const validateForm = (form, renderer) => {
  if (!form) return true;

  const fields = Array.from(form.querySelectorAll(FIELD_SELECTOR));
  const fieldResults = fields.map(field => ({
    field,
    anchor: resolveAnchor(field, form),
    ...validateField(field),
  }));

  fieldResults.forEach(({ field, valid }) => {
    if (valid) {
      renderer.markValid(field);
    } else {
      renderer.markInvalid(field);
    }
  });

  // Схлопываем результаты в один на anchor — радио-группа даёт несколько записей
  // с одним и тем же anchor, но ошибка должна быть выведена по нему только раз.
  const anchors = new Map();

  fieldResults.forEach(({ anchor, valid, message }) => {
    const existing = anchors.get(anchor);
    if (!existing || (!valid && existing.valid)) {
      anchors.set(anchor, { anchor, valid, message });
    }
  });

  const errors = [];

  anchors.forEach(({ anchor, valid, message }) => {
    if (valid) {
      renderer.clear(anchor);
      return;
    }

    renderer.show(anchor, message);
    errors.push({ anchor, message });
  });

  if (errors.length > 0) {
    renderer.renderSummary(errors);
  } else {
    renderer.clearSummary();
  }

  return errors.length === 0;
};
