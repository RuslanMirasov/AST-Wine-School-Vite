import { validateField } from './validateField.js';
import { getRenderer } from './factory.js';
import { validateAndRender } from './fieldValidation.js';

const WRAPPER_SELECTOR = '[data-file-field]';
const INPUT_SELECTOR = 'input[type="file"]';
const NAME_SELECTOR = '[data-file-name]';
const CLEAR_SELECTOR = '[data-file-clear]';
const FORM_SELECTOR = '[data-form]';
const HAS_FILE_CLASS = 'has-file';

const getRendererFor = input => {
  const form = input.closest(FORM_SELECTOR) || (input.form?.matches(FORM_SELECTOR) ? input.form : null);

  return form ? getRenderer(form) : null;
};

const updateView = (wrapper, input) => {
  const file = input.files?.[0];
  const nameElement = wrapper.querySelector(NAME_SELECTOR);

  wrapper.classList.toggle(HAS_FILE_CLASS, Boolean(file));
  if (nameElement) nameElement.textContent = file ? file.name : '';
};

const clearError = input => {
  const renderer = getRendererFor(input);

  renderer?.markValid(input);
  renderer?.clear(input);
};

const onFileChange = (wrapper, input) => {
  const { valid, message } = validateField(input);

  if (valid) {
    clearError(input);
  } else if (!input.files?.length) {
    // Файл убрали — обычная проверка поля: у обязательного появится «прикрепите файл»
    validateAndRender(input);
  } else {
    const renderer = getRendererFor(input);

    renderer?.markInvalid(input);
    renderer?.show(input, message);
    input.value = '';
  }

  updateView(wrapper, input);
};

const initFileField = wrapper => {
  const input = wrapper.querySelector(INPUT_SELECTOR);
  if (!input) return;

  updateView(wrapper, input);

  input.addEventListener('change', () => onFileChange(wrapper, input));

  wrapper.querySelector(CLEAR_SELECTOR)?.addEventListener('click', event => {
    event.preventDefault();

    input.value = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

export const initFileInputs = () => {
  document.querySelectorAll(WRAPPER_SELECTOR).forEach(initFileField);
};
