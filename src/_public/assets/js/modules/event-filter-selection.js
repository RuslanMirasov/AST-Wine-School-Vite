// Выбранные фильтры в календаре мероприятий (/events/).
// Кнопка [data-filter-button="имя"] показывает, что выбрано в группе чекбоксов [data-filter-group="имя"]:
// подписи выбранных значений через запятую или своё название, если ничего не выбрано.
// Выбор берётся из параметров адресной строки при загрузке и сбрасывается кнопкой type="reset".
// Кнопка [data-filter-toggle-button] получает класс active, пока выбран хотя бы один фильтр
const BUTTON_SELECTOR = '[data-filter-button]';
const BUTTON_TEXT_SELECTOR = '[data-filter-text]';
const GROUP_ATTRIBUTE = 'data-filter-group';
const INDICATOR_SELECTOR = '[data-filter-toggle-button]';
const CHECKBOX_SELECTOR = 'input[type="checkbox"]';
const LABEL_TEXT_SELECTOR = '.label-text';
const ACTIVE_CLASS = 'active';
// Класс кнопки фильтра, в группе которой выбрано хотя бы одно значение
const CHECKED_CLASS = 'checked';
// Кнопка сброса с этим атрибутом не только снимает фильтры, но и сразу отправляет форму.
// Обычная кнопка type="reset" только сбрасывает — рядом с ней есть своя «Применить»
const RESET_APPLY_SELECTOR = '[data-filter-reset-apply]';

// Одна группа чекбоксов стоит на странице дважды: в попапе и в мобильной панели
const getCheckboxes = name => Array.from(document.querySelectorAll(`[${GROUP_ATTRIBUTE}="${CSS.escape(name)}"] ${CHECKBOX_SELECTOR}`));

const getLabel = checkbox => checkbox.closest('label')?.querySelector(LABEL_TEXT_SELECTOR)?.textContent.trim() || checkbox.value;

// Подписи отмеченных значений без повторов — из-за двух копий каждое значение встречается дважды
const getSelectedLabels = name => {
  const labels = new Map();

  getCheckboxes(name).forEach(checkbox => {
    if (checkbox.checked) labels.set(checkbox.value, getLabel(checkbox));
  });

  return Array.from(labels.values());
};

export const initEventFilterSelection = () => {
  const buttons = Array.from(document.querySelectorAll(BUTTON_SELECTOR));

  if (!buttons.length) return;

  const indicators = Array.from(document.querySelectorAll(INDICATOR_SELECTOR));
  const getTextElement = button => button.querySelector(BUTTON_TEXT_SELECTOR) || button;
  // Название фильтра по умолчанию — текст, который стоит в разметке
  const defaultTexts = new Map(buttons.map(button => [button, getTextElement(button).textContent.trim()]));

  const render = () => {
    let hasSelected = false;

    buttons.forEach(button => {
      const labels = getSelectedLabels(button.dataset.filterButton);

      getTextElement(button).textContent = labels.length ? labels.join(', ') : defaultTexts.get(button);
      button.classList.toggle(CHECKED_CLASS, labels.length > 0);
      hasSelected = hasSelected || labels.length > 0;
    });

    indicators.forEach(indicator => indicator.classList.toggle(ACTIVE_CLASS, hasSelected));
  };

  // Применённый выбор хранит адресная строка: галочки всех групп выставляются по её параметрам.
  // Имя параметра — это name чекбокса из разметки
  const restoreFromUrl = () => {
    const params = new URLSearchParams(window.location.search);

    buttons.forEach(button => {
      getCheckboxes(button.dataset.filterButton).forEach(checkbox => {
        checkbox.checked = params.getAll(checkbox.name).includes(checkbox.value);
      });
    });

    render();
  };

  restoreFromUrl();

  // Откат несохранённых изменений: при каждом открытии попапа фильтра или мобильной панели все группы
  // возвращаются к применённому состоянию — как бы их ни закрыли в прошлый раз (Отмена, крестик, Escape, фон)
  document.addEventListener('click', event => {
    if (event.target.closest(`${BUTTON_SELECTOR}, ${INDICATOR_SELECTOR}`)) restoreFromUrl();
  });

  document.addEventListener('change', event => {
    const group = event.target.closest?.(`[${GROUP_ATTRIBUTE}]`);
    if (!group || !event.target.matches(CHECKBOX_SELECTOR)) return;

    // Вторая копия чекбокса повторяет состояние первой, иначе в форму ушли бы оба варианта
    getCheckboxes(group.getAttribute(GROUP_ATTRIBUTE)).forEach(checkbox => {
      if (checkbox !== event.target && checkbox.value === event.target.value) checkbox.checked = event.target.checked;
    });
  });

  // Обе копии чекбокса привязаны к одной форме и отмечены одинаково — без этого каждое значение
  // ушло бы в запрос дважды
  const filterForms = new Set(buttons.flatMap(button => getCheckboxes(button.dataset.filterButton).map(checkbox => checkbox.form)).filter(Boolean));

  filterForms.forEach(form => {
    form.addEventListener('formdata', event => {
      const entries = Array.from(event.formData.entries());
      const seen = new Set();

      entries.forEach(([name]) => event.formData.delete(name));
      entries.forEach(([name, value]) => {
        const key = `${name}\u0000${value}`;
        if (typeof value === 'string' && seen.has(key)) return;

        seen.add(key);
        event.formData.append(name, value);
      });
    });
  });

  document.addEventListener('click', event => {
    const form = event.target.closest(RESET_APPLY_SELECTOR)?.form;
    if (!form) return;

    // Сам сброс браузер выполнит сразу после клика — форму отправляем следом, уже пустую
    setTimeout(() => form.requestSubmit());
  });

  // reset снимает галочки уже после события — названия возвращаем на следующем шаге
  document.addEventListener('reset', event => {
    const form = event.target;
    const isFilterForm = buttons.some(button => getCheckboxes(button.dataset.filterButton).some(checkbox => checkbox.form === form));

    if (!isFilterForm) return;

    setTimeout(() => {
      buttons.forEach(button => {
        getCheckboxes(button.dataset.filterButton).forEach(checkbox => {
          checkbox.checked = false;
        });
      });

      render();
    });
  });
};
