const PLUGIN_VERSION = '3.6.0';
const PLUGIN_URL = `https://cdn.jsdelivr.net/npm/air-datepicker@${PLUGIN_VERSION}/air-datepicker.js`;
const STYLES_URL = `https://cdn.jsdelivr.net/npm/air-datepicker@${PLUGIN_VERSION}/air-datepicker.css`;

const FIELD_SELECTOR = 'input[type="date"]';
const DISPLAY_FORMAT = 'dd.MM.yyyy';
// Формат, в котором дата уходит с формой, — тот же, что отправляет родное поле type="date"
const VALUE_FORMAT = 'yyyy-MM-dd';
// Мобильный режим (окно по центру экрана) — по типу устройства, а не по ширине: планшет с экраном 1280px
// тоже сенсорный. Сенсорное устройство без мыши — нет наведения и «грубый» указатель (палец)
const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
// Отступ между полем и календарём
const OFFSET = 4;
// Минимальная ширина календаря: у узкого поля он шире поля, чтобы дни не сплющивало
const MIN_WIDTH = 320;

let pluginPromise = null;
// Поле → его календарь. По полю находим календарь при фокусе; сам селектор после инициализации не подходит:
// поле становится type="text"
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

// Календарь шириной с поле, под ним; если снизу не помещается, а сверху места больше — над полем.
// Вызывается библиотекой при каждом открытии и смене вида (дни/месяцы/годы), а нами — при ресайзе и повороте.
// На сенсорных устройствах не используется: там календарь открывается окном по центру экрана
const positionCalendar = ({ $datepicker, $target }) => {
  const rect = $target.getBoundingClientRect();

  const width = Math.max(rect.width, MIN_WIDTH);

  // Сначала ширина: от неё зависит высота календаря
  $datepicker.style.setProperty('--adp-width', `${width}px`);

  const height = $datepicker.offsetHeight;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUp = spaceBelow < height + OFFSET && spaceAbove > spaceBelow;
  const top = openUp ? rect.top - height - OFFSET : rect.bottom + OFFSET;

  // Календарь шире поля не должен вылезать за правый край экрана — тогда сдвигаем его влево
  const left = Math.max(OFFSET, Math.min(rect.left, document.documentElement.clientWidth - width - OFFSET));

  $datepicker.style.left = `${left + window.scrollX}px`;
  $datepicker.style.top = `${top + window.scrollY}px`;
};

// Библиотека вызывает функцию расстановки и в мобильном режиме, где календарь position: fixed, — и он уезжает
// за экран. Поэтому на сенсорных устройствах оставляем её стандартную расстановку
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
  // Дата выбирается только в календаре. readonly не подходит: такие поля браузер не проверяет на required
  field.addEventListener('beforeinput', event => event.preventDefault());

  const picker = new AirDatepicker(field, {
    dateFormat: DISPLAY_FORMAT,
    altField: valueField,
    altFieldDateFormat: VALUE_FORMAT,
    selectedDates: initialDate ? [initialDate] : [],
    autoClose: true,
    // «Июль 2026» вместо «Июль, 2026»; дни соседних месяцев не показываем — на их месте пустые ячейки
    navTitles: { days: 'MMMM yyyy' },
    showOtherMonths: false,
    buttons: ['clear'],
    ...getModeOptions(isTouchDevice()),
    // Библиотека меняет значение без событий — сообщаем о нём остальным скриптам (валидация, сохранение)
    onSelect: () => {
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    },
  });

  pickers.set(field, picker);
};

// Режим проверяется при каждом открытии: календарь открывается по фокусу на поле, а этот обработчик
// на документе в фазе перехвата срабатывает раньше обработчика библиотеки на самом поле.
// Так неважно, что было до открытия: ресайз, поворот, эмуляция устройства в DevTools, отстёгнутая клавиатура
const onFieldFocus = event => {
  const picker = pickers.get(event.target);
  if (!picker) return;

  const isTouch = isTouchDevice();
  if (picker.opts.isMobile === isTouch) return;

  picker.update(getModeOptions(isTouch));
  // Класс своей расстановки библиотека ставит только при создании и при смене режима не снимает.
  // Оставшийся на мобилке, он отключает центрирование окна (translate -50%), и календарь съезжает вправо вниз
  picker.$datepicker.classList.toggle('-custom-position-', !isTouch);
};

// Ресайз и поворот экрана: открытый календарь на десктопе переставляем под поле с его новой шириной.
// В мобильном режиме окно по центру держит сама библиотека
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

    // Именно focus, а не focusin: браузеры шлют focusin уже после focus, когда библиотека календарь открыла.
    // focus не всплывает, но на документе в фазе перехвата его видно
    document.addEventListener('focus', onFieldFocus, true);
    window.addEventListener('resize', onResize);
  } catch (error) {
    console.error(error);
  }
};
