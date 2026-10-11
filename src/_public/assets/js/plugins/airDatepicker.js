const PLUGIN_VERSION = '3.6.0';
const PLUGIN_URL = `https://cdn.jsdelivr.net/npm/air-datepicker@${PLUGIN_VERSION}/air-datepicker.js`;
const STYLES_URL = `https://cdn.jsdelivr.net/npm/air-datepicker@${PLUGIN_VERSION}/air-datepicker.css`;

const FIELD_SELECTOR = 'input[type="date"]';
const DISPLAY_FORMAT = 'dd.MM.yyyy';
// Формат, в котором дата уходит с формой, — тот же, что отправляет родное поле type="date"
const VALUE_FORMAT = 'yyyy-MM-dd';
const MOBILE_MAX_WIDTH = 767;

let pluginPromise = null;

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

const initField = (field, AirDatepicker) => {
  const initialDate = parseDate(field.value);
  const valueField = createValueField(field);

  field.type = 'text';
  field.value = '';
  field.autocomplete = 'off';
  // Дата выбирается только в календаре. readonly не подходит: такие поля браузер не проверяет на required
  field.addEventListener('beforeinput', event => event.preventDefault());

  new AirDatepicker(field, {
    dateFormat: DISPLAY_FORMAT,
    altField: valueField,
    altFieldDateFormat: VALUE_FORMAT,
    selectedDates: initialDate ? [initialDate] : [],
    autoClose: true,
    buttons: ['clear'],
    isMobile: window.innerWidth <= MOBILE_MAX_WIDTH,
    // Библиотека меняет значение без событий — сообщаем о нём остальным скриптам (валидация, сохранение)
    onSelect: () => {
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    },
  });

};

export const initDatepickers = async () => {
  const fields = Array.from(document.querySelectorAll(FIELD_SELECTOR));

  if (!fields.length) return;

  try {
    const AirDatepicker = await loadPlugin();

    fields.forEach(field => initField(field, AirDatepicker));
  } catch (error) {
    console.error(error);
  }
};
