const BUTTON_SELECTOR = '[data-filter-button]';
const BUTTON_TEXT_SELECTOR = '[data-filter-text]';
const GROUP_ATTRIBUTE = 'data-filter-group';
const INDICATOR_SELECTOR = '[data-filter-toggle-button]';
const CHECKBOX_SELECTOR = 'input[type="checkbox"]';
const LABEL_TEXT_SELECTOR = '.label-text';
const ACTIVE_CLASS = 'active';
const CHECKED_CLASS = 'checked';
const RESET_APPLY_SELECTOR = '[data-filter-reset-apply]';

const getCheckboxes = name => Array.from(document.querySelectorAll(`[${GROUP_ATTRIBUTE}="${CSS.escape(name)}"] ${CHECKBOX_SELECTOR}`));
const getLabel = checkbox => checkbox.closest('label')?.querySelector(LABEL_TEXT_SELECTOR)?.textContent.trim() || checkbox.value;

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

  document.addEventListener('click', event => {
    if (event.target.closest(`${BUTTON_SELECTOR}, ${INDICATOR_SELECTOR}`)) restoreFromUrl();
  });

  document.addEventListener('change', event => {
    const group = event.target.closest?.(`[${GROUP_ATTRIBUTE}]`);
    if (!group || !event.target.matches(CHECKBOX_SELECTOR)) return;

    getCheckboxes(group.getAttribute(GROUP_ATTRIBUTE)).forEach(checkbox => {
      if (checkbox !== event.target && checkbox.value === event.target.value) checkbox.checked = event.target.checked;
    });
  });

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
    setTimeout(() => form.requestSubmit());
  });

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
