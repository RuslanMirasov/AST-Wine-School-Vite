const NUMBER_INPUT_SELECTOR = 'input[type="number"], input[data-digits]';
const PRICE_INPUT_SELECTOR = '[data-input-price]';
const PRICE_SUFFIX = ' ₽';
const PRICE_DECIMALS = 2;

export const initSelectFields = () => {
  const allSelectEl = document.querySelectorAll('[data-select]');

  if (allSelectEl.length === 0) return;

  allSelectEl.forEach(select => {
    new Choices(select, {
      searchEnabled: false,
      shouldSort: false,
      allowHTML: true,
      itemSelectText: '',
    });

    select.closest('label')?.addEventListener('click', event => event.preventDefault());
  });
};

export function initPhoneInputs(mask = '+{7} 000 000 00 00') {
  const inputs = document.querySelectorAll('[type="tel"]');

  if (!inputs.length) return;

  const placeholder = mask.replace(/[{}]/g, '').replace(/0/g, '_');

  inputs.forEach(input => {
    if (input.dataset.maskInitialized === 'true') return;

    if (!input.placeholder) input.placeholder = placeholder;

    IMask(input, {
      mask,
      lazy: true,
    });

    input.dataset.maskInitialized = 'true';
  });
}

export function initDecimalInputs() {
  const inputs = document.querySelectorAll('[inputmode="decimal"]:not([data-input-price])');

  if (!inputs.length) return;

  inputs.forEach(input => {
    if (input.dataset.decimalMaskInitialized === 'true') return;

    IMask(input, {
      mask: Number,
      scale: 2,
      signed: false,
      thousandsSeparator: '',
      padFractionalZeros: false,
      normalizeZeros: true,
      radix: '.',
      mapToRadix: [','],
      min: 0,
    });

    input.dataset.decimalMaskInitialized = 'true';
  });
}

const getNumberDisallowedPattern = input => {
  const step = input.step;
  const allowDecimal = step === 'any' || (step !== '' && !Number.isInteger(Number(step)));
  const allowNegative = input.min !== '' && Number(input.min) < 0;

  return new RegExp(`[^0-9${allowDecimal ? '.,' : ''}${allowNegative ? '\-' : ''}]`, 'g');
};

const getNumberInput = target => (target instanceof HTMLInputElement && target.matches(NUMBER_INPUT_SELECTOR) ? target : null);

export function initNumberInputs() {
  document.addEventListener('beforeinput', event => {
    const input = getNumberInput(event.target);
    if (!input || typeof event.data !== 'string') return;

    if (getNumberDisallowedPattern(input).test(event.data)) event.preventDefault();
  });

  const insertCleaned = (event, text) => {
    const input = getNumberInput(event.target);
    if (!input || typeof text !== 'string') return;

    const cleaned = text.trim().replace(getNumberDisallowedPattern(input), '');
    if (cleaned === text) return;

    event.preventDefault();
    if (!cleaned) return;

    if (input.type === 'number') {
      input.value = cleaned;
    } else {
      const { selectionStart: start, selectionEnd: end, value, maxLength } = input;
      const room = maxLength > 0 ? maxLength - (value.length - (end - start)) : cleaned.length;
      input.setRangeText(cleaned.slice(0, Math.max(0, room)), start, end, 'end');
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  document.addEventListener('paste', event => insertCleaned(event, event.clipboardData?.getData('text')));
  document.addEventListener('drop', event => insertCleaned(event, event.dataTransfer?.getData('text')));
}

const isPriceInput = target => target instanceof HTMLInputElement && target.matches(PRICE_INPUT_SELECTOR);
const isPriceSignificant = char => /[\d.]/.test(char);

export const parsePrice = value => {
  const chars = String(value ?? '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
  const dotIndex = chars.indexOf('.');
  if (dotIndex === -1) return chars.replace(/^0+(?=\d)/, '');

  const integer = chars.slice(0, dotIndex).replace(/^0+(?=\d)/, '') || '0';
  const fraction = chars
    .slice(dotIndex + 1)
    .replace(/\./g, '')
    .slice(0, PRICE_DECIMALS);

  return `${integer}.${fraction}`;
};

export const formatPrice = value => {
  const raw = parsePrice(value);
  if (!raw) return '';

  const [integer, fraction] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${grouped}${fraction === undefined ? '' : `.${fraction}`}${PRICE_SUFFIX}`;
};

const getPricePosition = (value, count) => {
  const limit = value ? value.length - PRICE_SUFFIX.length : 0;
  if (count <= 0) return 0;

  let seen = 0;
  for (let i = 0; i < limit; i++) {
    if (isPriceSignificant(value[i]) && ++seen === count) return i + 1;
  }

  return limit;
};

const countPriceSignificant = (value, end) => Array.from(value.slice(0, end)).filter(isPriceSignificant).length;

const applyPrice = (input, raw, caretCount) => {
  input.value = formatPrice(raw);
  if (document.activeElement !== input) return;

  const position = getPricePosition(input.value, caretCount);
  input.setSelectionRange(position, position);
};

const clampPriceCaret = input => {
  const limit = input.value ? input.value.length - PRICE_SUFFIX.length : 0;
  if (input.selectionStart === input.selectionEnd && input.selectionStart > limit) input.setSelectionRange(limit, limit);
};

export function initPriceInputs() {
  document.querySelectorAll(PRICE_INPUT_SELECTOR).forEach(input => {
    input.value = formatPrice(input.value);
  });

  document.addEventListener('beforeinput', event => {
    const input = event.target;
    if (!isPriceInput(input)) return;

    const { value, selectionStart: start, selectionEnd: end } = input;
    const isCollapsed = start === end;

    if (event.inputType === 'insertText' && typeof event.data === 'string') {
      const data = event.data.replace(/,/g, '.');
      const rest = value.slice(0, start) + value.slice(end);
      const restRaw = parsePrice(rest);
      const caretCount = countPriceSignificant(value, start);
      const dotPosition = restRaw.indexOf('.');

      const isInvalid =
        /[^\d.]/.test(data) ||
        (data.includes('.') && (dotPosition !== -1 || (data.match(/\./g) || []).length > 1)) ||
        (dotPosition !== -1 && caretCount > dotPosition && restRaw.length - dotPosition - 1 + data.length > PRICE_DECIMALS);

      if (isInvalid) event.preventDefault();
      return;
    }

    if (isCollapsed && (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward')) {
      event.preventDefault();

      const raw = parsePrice(value);
      const caretCount = countPriceSignificant(value, start);
      const removeIndex = event.inputType === 'deleteContentBackward' ? caretCount - 1 : caretCount;
      if (removeIndex < 0 || removeIndex >= raw.length) return;

      const nextRaw = raw.slice(0, removeIndex) + raw.slice(removeIndex + 1);
      applyPrice(input, nextRaw, event.inputType === 'deleteContentBackward' ? caretCount - 1 : caretCount);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  document.addEventListener('input', event => {
    const input = event.target;
    if (!isPriceInput(input)) return;

    const formatted = formatPrice(input.value);
    if (formatted === input.value) return;

    applyPrice(input, input.value, countPriceSignificant(input.value, input.selectionStart ?? input.value.length));
  });

  ['click', 'keyup', 'focus'].forEach(type => {
    document.addEventListener(type, event => isPriceInput(event.target) && clampPriceCaret(event.target), true);
  });

  document.addEventListener(
    'formdata',
    event => {
      event.target.querySelectorAll(PRICE_INPUT_SELECTOR).forEach(input => {
        if (input.name && !input.disabled) event.formData.set(input.name, parsePrice(input.value));
      });
    },
    true
  );
}
