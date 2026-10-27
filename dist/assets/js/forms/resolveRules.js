import { customRules, typeFallbackRules, inputmodeFallbackRules } from './validationRules.js';

export const resolveCustomRule = input => {
  const ruleName = input.dataset.rule || typeFallbackRules[input.type] || inputmodeFallbackRules[input.inputMode];

  if (!ruleName) return null;

  return customRules[ruleName] || null;
};
