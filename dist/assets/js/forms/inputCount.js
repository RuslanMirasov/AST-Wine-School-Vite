const STEP_SELECTOR = '[data-input-minus], [data-input-plus]';

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

const setInputValue = (input, value) => {
  nativeInputValueSetter.call(input, String(value));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getBounds = input => ({
  min: input.min !== '' ? Number(input.min) : 1,
  max: input.max !== '' ? Number(input.max) : Infinity,
  step: input.step !== '' && input.step !== 'any' ? Number(input.step) : 1,
});

const onStepClick = e => {
  const button = e.target.closest(STEP_SELECTOR);
  if (!button) return;

  const input = button.closest('label')?.querySelector('input[type="number"]');
  if (!input) return;

  const { min, max, step } = getBounds(input);
  const current = Number(input.value) || min;
  const next = button.hasAttribute('data-input-minus') ? current - step : current + step;

  setInputValue(input, clamp(next, min, max));
};

const onCountInput = e => {
  const input = e.target;
  if (!input.matches('.input--count') || input.value === '') return;

  const { min, max } = getBounds(input);
  const value = Math.round(Number(input.value));
  if (!Number.isFinite(value)) return;

  const clamped = clamp(value, min, max);
  if (clamped !== value) setInputValue(input, clamped);
};

const onCountBlur = e => {
  const input = e.target;
  if (!input.matches('.input--count') || input.value !== '') return;

  setInputValue(input, getBounds(input).min);
};

export const initCountInputs = () => {
  document.addEventListener('click', onStepClick);
  document.addEventListener('input', onCountInput);
  document.addEventListener('focusout', onCountBlur);
};
