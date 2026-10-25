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
const CERTIFICAT_LOGO_FORMATS = ['.png', '.svg', '.webp', '.pdf'];
const CERTIFICAT_LOGO_FORMAT_MESSAGE = 'Загрузите логотип в формате PNG, SVG, WEBP или PDF';

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

const getFileError = (input, acceptList = getAcceptList(input), formatMessage) => {
  const file = input.files?.[0];
  if (!file) return null;

  const maxSize = Number(input.dataset.maxSize);
  if (maxSize && file.size > maxSize * BYTES_IN_MEGABYTE) {
    return input.dataset.sizeErrorText || `Размер файла не должен превышать ${maxSize} МБ`;
  }

  if (!isFileAccepted(file, acceptList)) {
    return input.dataset.formatErrorText || formatMessage || `Допустимые форматы: ${acceptList.join(', ')}`;
  }

  return null;
};

const createFileRule = (acceptList, formatMessage) => ({
  test: (value, input) => !getFileError(input, acceptList, formatMessage),
  message: (value, input) => getFileError(input, acceptList, formatMessage),
});

const decodePunycodeLabel = label => {
  if (!/^xn--/i.test(label)) return label;

  const input = label.slice(4).toLowerCase();
  const base = 36;
  const delimiter = input.lastIndexOf('-');
  const output = delimiter > 0 ? Array.from(input.slice(0, delimiter)) : [];
  let n = 128;
  let bias = 72;
  let i = 0;

  const adapt = (delta, numPoints, firstTime) => {
    let d = firstTime ? Math.floor(delta / 700) : delta >> 1;
    d += Math.floor(d / numPoints);
    let k = 0;
    while (d > 455) {
      d = Math.floor(d / 35);
      k += base;
    }
    return k + Math.floor((36 * d) / (d + 38));
  };

  for (let pos = delimiter > 0 ? delimiter + 1 : 0; pos < input.length; ) {
    const oldI = i;
    let w = 1;
    for (let k = base; ; k += base) {
      if (pos >= input.length) return null;
      const code = input.charCodeAt(pos++);
      const digit = code - 48 < 10 ? code - 22 : code - 97 < 26 ? code - 97 : base;
      if (digit >= base) return null;
      i += digit * w;
      const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    bias = adapt(i - oldI, output.length + 1, oldI === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i++, 0, String.fromCodePoint(n));
  }

  return output.join('');
};

const decodeEmailDomain = email => {
  const at = email.lastIndexOf('@');
  if (at < 0) return email;

  const domain = email
    .slice(at + 1)
    .split('.')
    .map(label => decodePunycodeLabel(label) ?? label)
    .join('.');

  return `${email.slice(0, at + 1)}${domain}`;
};

export const customRules = {
  email: {
    test: value => /^[\p{L}\p{N}._%+-]+@(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}{2,}$/iu.test(decodeEmailDomain(value.trim())),
    message: 'Пожалуйста, укажите корректный email',
  },
  tel: {
    test: (value, input) => /^\+7 \d{3} \d{3} \d{2} \d{2}$/.test(value.trim()) || (!input?.required && !/\d/.test(value.trim().slice(2))),
    message: 'Пожалуйста, укажите корректный номер телефона',
  },
  price: {
    test: value => /^\d+(?:\.\d{1,2})?$/.test(value.replace(/[\s₽]/g, '')),
    message: 'Пожалуйста, укажите сумму, например 15 000 ₽',
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
  'certificat-logo': createFileRule(CERTIFICAT_LOGO_FORMATS, CERTIFICAT_LOGO_FORMAT_MESSAGE),
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
