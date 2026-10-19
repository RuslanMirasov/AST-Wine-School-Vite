export const nativeMessages = {
  valueMissing: {
    default: 'Поле обязательно к заполнению',
    checkbox: 'Ваше согласие обязательно',
    radio: 'Выберите вариант',
    file: 'Прикрепите файл',
  },
  tooShort: input => `Минимальное кол-во символов: ${input.minLength}`,
  tooLong: input => `Максимальное кол-во символов: ${input.maxLength}`,
  rangeUnderflow: input => `Минимальное значение: ${input.min}`,
  rangeOverflow: input => `Максимальное значение: ${input.max}`,
  stepMismatch: 'Некорректное значение',
  patternMismatch: 'Неверный формат поля',
};

const CERT_MESSAGE_MAX_LENGTH = 300;
const BYTES_IN_MEGABYTE = 1024 * 1024;
// Форматы для data-rule="images-only". Список задан здесь, а не в разметке, чтобы его нельзя было расширить правкой атрибута
const IMAGE_FORMATS = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

// accept="…" у поля файла: список расширений (.pdf) и типов (image/png, image/*) через запятую
const getAcceptList = input =>
  input.accept
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

const isFileAccepted = (file, acceptList) => {
  if (!acceptList.length) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return acceptList.some(item => {
    if (item.startsWith('.')) return name.endsWith(item);
    if (item.endsWith('/*')) return type.startsWith(item.slice(0, -1));
    return type === item;
  });
};

// Ограничения поля файла: размер — data-max-size="10" (в МБ), формат — список acceptList
// (по умолчанию из атрибута accept). Возвращает текст ошибки или null; свой текст задаётся
// через data-size-error-text и data-format-error-text
const getFileError = (input, acceptList = getAcceptList(input)) => {
  const file = input.files?.[0];
  if (!file) return null;

  const maxSize = Number(input.dataset.maxSize);
  if (maxSize && file.size > maxSize * BYTES_IN_MEGABYTE) {
    return input.dataset.sizeErrorText || `Размер файла не должен превышать ${maxSize} МБ`;
  }

  if (!isFileAccepted(file, acceptList)) {
    return input.dataset.formatErrorText || `Допустимые форматы: ${acceptList.join(', ')}`;
  }

  return null;
};

// Правило для поля файла. Без списка форматы берутся из accept, со списком — только из него
const createFileRule = acceptList => ({
  test: (value, input) => !getFileError(input, acceptList),
  message: (value, input) => getFileError(input, acceptList),
});

export const customRules = {
  email: {
    test: value => /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value.trim()),
    message: 'Пожалуйста, укажите корректный email',
  },
  tel: {
    // Маска видна всегда, поэтому необязательное поле без единой цифры после +7 считается пустым
    test: (value, input) => /^\+7 \d{3} \d{3} \d{2} \d{2}$/.test(value.trim()) || (!input?.required && !/\d/.test(value.trim().slice(2))),
    message: 'Пожалуйста, укажите корректный номер телефона',
  },
  decimal: {
    test: value => /^\d+(?:[.,]\d{1,2})?$/.test(value.trim()),
    message: 'Введите сумму, например 100.00',
  },
  name: {
    test: value => /^[\p{L}-]+$/u.test(value.trim()),
    message: 'Разрешены только буквы и дефис',
  },
  'name-cyrillic': {
    test: value => /^[\p{Script=Cyrillic}-]+$/u.test(value.trim()),
    message: 'Разрешены только буквы кириллицы и дефис',
  },
  'fullname-cyrillic': {
    test: value => /^[\p{Script=Cyrillic}-]+(?: +[\p{Script=Cyrillic}-]+)*$/u.test(value.trim()),
    message: 'Разрешены только буквы кириллицы, дефис и пробел',
  },
  'cert-message': {
    test: value => value.length <= CERT_MESSAGE_MAX_LENGTH,
    message: value => `Сократите количество символов сообщения на ${value.length - CERT_MESSAGE_MAX_LENGTH}`,
  },
  file: createFileRule(),
  'images-only': createFileRule(IMAGE_FORMATS),
  inn: {
    test: value => /^(?:\d{10}|\d{12})$/.test(value.trim()),
    message: 'Пожалуйста, укажите корректный ИНН: 10 цифр для организации или 12 для ИП',
  },
  kpp: {
    test: value => /^\d{9}$/.test(value.trim()),
    message: 'Пожалуйста, укажите корректный КПП: 9 цифр',
  },
  code: {
    test: (value, input) => new RegExp(`^\\d{${input.dataset.code}}$`).test(value.trim()),
    message: 'Неверный код',
  },
};

export const typeFallbackRules = {
  email: 'email',
  tel: 'tel',
  file: 'file',
};

export const inputmodeFallbackRules = {
  decimal: 'decimal',
};
