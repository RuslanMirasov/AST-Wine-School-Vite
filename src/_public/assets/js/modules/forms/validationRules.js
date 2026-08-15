export const nativeMessages = {
  valueMissing: {
    default: 'Это обязательное поле!',
    checkbox: 'Поле обязательно к заполнению',
    radio: 'Выберите вариант!',
  },
  tooShort: input => `Минимум ${input.minLength} символов`,
  tooLong: input => `Максимум ${input.maxLength} символов`,
  rangeUnderflow: input => `Минимальное значение — ${input.min}`,
  rangeOverflow: input => `Максимальное значение — ${input.max}`,
  stepMismatch: 'Некорректное значение',
  patternMismatch: 'Неверный формат поля',
};

export const customRules = {
  email: {
    test: value => /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value.trim()),
    message: 'Введите правильный email адрес',
  },
  tel: {
    test: value => /^\+7 \d{3} \d{3} \d{2} \d{2}$/.test(value.trim()),
    message: 'Введите правильный телефон',
  },
  decimal: {
    test: value => /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()),
    message: 'Введите сумму, например 100.00',
  },
};

// Резолвится, если поле не имеет data-rule: подбирает именованное правило по type/inputmode.
export const typeFallbackRules = {
  email: 'email',
  tel: 'tel',
};

export const inputmodeFallbackRules = {
  decimal: 'decimal',
};
