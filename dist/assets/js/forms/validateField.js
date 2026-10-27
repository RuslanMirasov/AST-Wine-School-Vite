import { nativeMessages } from './validationRules.js';
import { resolveCustomRule } from './resolveRules.js';

const NATIVE_VALIDITY_CHECKS = ['valueMissing', 'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'patternMismatch'];

const OWN_ERROR_TEXT_KEYS = {
  valueMissing: 'requiredErrorText',
  tooShort: 'minlengthErrorText',
  tooLong: 'maxlengthErrorText',
  rangeUnderflow: 'minErrorText',
  rangeOverflow: 'maxErrorText',
  stepMismatch: 'stepErrorText',
  patternMismatch: 'patternErrorText',
};

const resolveNativeMessage = (input, failedCheck) => {
  if (failedCheck === 'valueMissing') {
    return nativeMessages.valueMissing[input.type] || nativeMessages.valueMissing.default;
  }

  if (failedCheck === 'patternMismatch') {
    return input.title || nativeMessages.patternMismatch;
  }

  const message = nativeMessages[failedCheck];
  return typeof message === 'function' ? message(input) : message;
};

export const validateField = input => {
  if (!input.willValidate) return { valid: true };

  const { validity } = input;
  const failedCheck = NATIVE_VALIDITY_CHECKS.find(key => validity[key]);
  const rule = resolveCustomRule(input);

  if (failedCheck) {
    const ownText = input.dataset[OWN_ERROR_TEXT_KEYS[failedCheck]];
    if (ownText) return { valid: false, message: ownText };

    const message = !rule && input.dataset.errorText ? input.dataset.errorText : resolveNativeMessage(input, failedCheck);
    return { valid: false, message };
  }

  const value = input.value ?? '';

  if (rule && value.trim() !== '' && !rule.test(value, input)) {
    // message у правила — строка или функция от значения и поля (когда текст зависит от того, что введено)
    const ruleMessage = typeof rule.message === 'function' ? rule.message(value, input) : rule.message;

    return { valid: false, message: input.dataset.ruleErrorText || input.dataset.errorText || ruleMessage };
  }

  return { valid: true };
};
