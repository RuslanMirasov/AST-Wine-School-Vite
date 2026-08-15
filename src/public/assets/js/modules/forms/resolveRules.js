import { customRules, typeFallbackRules, inputmodeFallbackRules } from './validationRules.js';

// Приоритет: data-rule > type > inputmode. Нативный pattern сюда не входит —
// он проверяется браузером раньше, на уровне validateField.
export const resolveCustomRule = input => {
  const ruleName = input.dataset.rule || typeFallbackRules[input.type] || inputmodeFallbackRules[input.inputMode];

  if (!ruleName) return null;

  return customRules[ruleName] || null;
};
