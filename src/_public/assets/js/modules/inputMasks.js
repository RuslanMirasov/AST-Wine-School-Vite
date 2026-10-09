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

    // Селект лежит внутри <label>: клик по label браузер передаёт родному <select>, и на iOS
    // вместе со списком Choices открывается системный барабан выбора
    select.closest('label')?.addEventListener('click', event => event.preventDefault());
  });
};

export function initPhoneInputs(mask = '+7 000 000-00-00') {
  const inputs = document.querySelectorAll('[type="tel"]');

  if (!inputs.length) return;

  inputs.forEach(input => {
    if (input.dataset.maskInitialized === 'true') return;

    IMask(input, {
      mask,
    });

    input.dataset.maskInitialized = 'true';
  });
}

export function initDecimalInputs() {
  const inputs = document.querySelectorAll('[inputmode="decimal"]');

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
