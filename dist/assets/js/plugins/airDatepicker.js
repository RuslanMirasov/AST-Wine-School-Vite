const PLUGIN_VERSION = '3.6.0';
const PLUGIN_URL = `https://cdn.jsdelivr.net/npm/air-datepicker@${PLUGIN_VERSION}/air-datepicker.js`;
const STYLES_URL = `https://cdn.jsdelivr.net/npm/air-datepicker@${PLUGIN_VERSION}/air-datepicker.css`;
const FIELD_SELECTOR = 'input[type="date"]';
const DISPLAY_FORMAT = 'dd.MM.yyyy';
const VALUE_FORMAT = 'yyyy-MM-dd';
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
const OFFSET = 4;
const MIN_WIDTH = 320;

let pluginPromise = null;

const hideHandlers = new WeakMap();
const pickers = new Map();

const loadPlugin = () => {
  if (pluginPromise) return pluginPromise;

  pluginPromise = new Promise((resolve, reject) => {
    if (window.AirDatepicker) {
      resolve(window.AirDatepicker);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLES_URL;
    document.head.append(link);

    const script = document.createElement('script');
    script.src = PLUGIN_URL;
    script.onload = () => resolve(window.AirDatepicker);
    script.onerror = () => reject(new Error('Не удалось загрузить Air Datepicker'));
    document.head.append(script);
  });

  return pluginPromise;
};

const parseDate = value => {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const createValueField = field => {
  const valueField = document.createElement('input');

  valueField.type = 'hidden';
  valueField.name = field.name;
  valueField.value = field.value;
  if (field.hasAttribute('form')) valueField.setAttribute('form', field.getAttribute('form'));

  field.removeAttribute('name');
  field.after(valueField);

  return valueField;
};

const hasTransition = $element =>
  getComputedStyle($element)
    .transitionDuration.split(',')
    .some(duration => parseFloat(duration) > 0);

const createHideCalendar = ($datepicker, done) => () => {
  $datepicker.removeEventListener('transitionend', hideHandlers.get($datepicker));

  if (!hasTransition($datepicker)) {
    done();
    return;
  }

  const onTransitionEnd = event => {
    if (event.target !== $datepicker || event.propertyName !== 'opacity') return;

    $datepicker.removeEventListener('transitionend', onTransitionEnd);
    // Календарь успели открыть снова, пока он исчезал, — он на месте, убирать нельзя
    if (!$datepicker.classList.contains('-active-')) done();
  };

  hideHandlers.set($datepicker, onTransitionEnd);
  $datepicker.addEventListener('transitionend', onTransitionEnd);
};

const positionCalendar = ({ $datepicker, $target, done }) => {
  const rect = $target.getBoundingClientRect();

  const width = Math.max(rect.width, MIN_WIDTH);

  // Сначала ширина: от неё зависит высота календаря
  $datepicker.style.setProperty('--adp-width', `${width}px`);

  const height = $datepicker.offsetHeight;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUp = spaceBelow < height + OFFSET && spaceAbove > spaceBelow;
  const top = openUp ? rect.top - height - OFFSET : rect.bottom + OFFSET;
  const left = Math.max(OFFSET, Math.min(rect.left, document.documentElement.clientWidth - width - OFFSET));

  $datepicker.style.left = `${left + window.scrollX}px`;
  $datepicker.style.top = `${top + window.scrollY}px`;
  $datepicker.classList.toggle('-open-up-', openUp);

  return createHideCalendar($datepicker, done);
};

const getModeOptions = isTouch => ({
  isMobile: isTouch,
  position: isTouch ? 'bottom left' : positionCalendar,
});

const isTouchDevice = () => window.matchMedia(TOUCH_QUERY).matches;

const initField = (field, AirDatepicker) => {
  const initialDate = parseDate(field.value);
  const valueField = createValueField(field);

  field.type = 'text';
  field.value = '';
  field.autocomplete = 'off';
  field.addEventListener('beforeinput', event => event.preventDefault());

  const picker = new AirDatepicker(field, {
    dateFormat: DISPLAY_FORMAT,
    altField: valueField,
    altFieldDateFormat: VALUE_FORMAT,
    selectedDates: initialDate ? [initialDate] : [],
    autoClose: true,
    navTitles: { days: 'MMMM yyyy' },
    showOtherMonths: false,
    buttons: ['clear'],
    ...getModeOptions(isTouchDevice()),
    onSelect: () => {
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    },
  });

  pickers.set(field, picker);
};

const onFieldFocus = event => {
  const picker = pickers.get(event.target);
  if (!picker) return;

  const isTouch = isTouchDevice();
  if (picker.opts.isMobile === isTouch) return;

  picker.update(getModeOptions(isTouch));
  picker.$datepicker.classList.toggle('-custom-position-', !isTouch);
};

const onResize = () => {
  pickers.forEach(picker => {
    if (picker.visible && !picker.opts.isMobile) picker.setPosition();
  });
};

export const initDatepickers = async () => {
  const fields = Array.from(document.querySelectorAll(FIELD_SELECTOR));

  if (!fields.length) return;

  try {
    const AirDatepicker = await loadPlugin();
    fields.forEach(field => initField(field, AirDatepicker));
    document.addEventListener('focus', onFieldFocus, true);
    window.addEventListener('resize', onResize);
  } catch (error) {
    console.error(error);
  }
};
