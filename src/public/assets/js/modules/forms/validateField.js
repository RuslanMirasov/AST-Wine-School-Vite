import { nativeMessages } from './validationRules.js';
import { resolveCustomRule } from './resolveRules.js';

// typeMismatch (слабая встроенная проверка email и т.п.) сюда намеренно не входит —
// такие поля дополнительно проверяются нашим более строгим кастомным правилом ниже.
const NATIVE_VALIDITY_CHECKS = ['valueMissing', 'tooShort', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'patternMismatch'];

const resolveNativeMessage = (input, failedCheck) => {
  if (failedCheck === 'valueMissing') {
    return nativeMessages.valueMissing[input.type] || nativeMessages.valueMissing.default;
  }

  if (failedCheck === 'patternMismatch') {
    // title — нативный атрибут-описание именно для pattern, а не data-error-text:
    // data-error-text относится только к нашим правилам (data-rule/type), не к нативным.
    return input.title || nativeMessages.patternMismatch;
  }

  const message = nativeMessages[failedCheck];
  return typeof message === 'function' ? message(input) : message;
};

export const validateField = input => {
  if (!input.willValidate) return { valid: true };

  const { validity } = input;
  const failedCheck = NATIVE_VALIDITY_CHECKS.find(key => validity[key]);

  if (failedCheck) {
    return { valid: false, message: resolveNativeMessage(input, failedCheck) };
  }

  const rule = resolveCustomRule(input);
  const value = input.value ?? '';

  if (rule && value.trim() !== '' && !rule.test(value, input)) {
    return { valid: false, message: input.dataset.errorText || rule.message };
  }

  return { valid: true };
};
