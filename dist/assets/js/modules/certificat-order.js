import { validateForm } from '../forms/validateForm.js';
import { getRenderer } from '../forms/factory.js';
import { getNamedSwiper } from './goToSlide.js';
import { formatPrice, parsePrice } from './inputMasks.js';

const STORAGE_KEY = 'certificate-order';
const TEMPLATES_SLIDER_KEY = 'certificate-templates';
const FORM_SELECTOR = '[data-cert-order]';
const GROUP_SELECTOR = '[data-cert-group]';
const SCENARIO_SELECTOR = '[data-cert-scenario]';
const FORMAT_SELECTOR = '[data-cert-format]';
const PURPOSE_SELECTOR = '[data-cert-purpose]';
const PURPOSE_SET_SELECTOR = '[data-cert-purpose-set]';
const POPUP_SELECTOR = '[role="dialog"]';
const RECIPIENT_SELECTOR = '[data-cert-recipient]';
const RECIPIENT_BLOCK_SELECTOR = '[data-cert-recipient-block]';
const FIELD_SELECTOR = 'input, select, textarea';
const ORDER_FIELD_SELECTOR = '[data-cert-field]';
const NOMINAL_SELECTOR = '[data-cert-field="nominal"]';
const PRICE_FIELD_SELECTOR = '[data-input-price]';
const NOMINAL_LABEL_SELECTOR = '[data-cert-nominal-label]';
const NOMINAL_VARIANT_SELECTOR = '[data-cert-nominal-variant]';
const TEMPLATE_SELECTOR = '[data-cert-field="template"]';
const NOMINAL_VARIANT_OTHER = 'other';
const LOGO_TOGGLE_SELECTOR = '[data-cert-logo-toggle]';
const LOGO_INPUT_SELECTOR = '[data-cert-logo]';
const LOGO_WRAPPER_SELECTOR = '[data-file-field]';
const SERVER_FIELDS = ['code'];
const NOMINAL_OUTPUT_SELECTOR = '[data-nominal-final]';
const MESSAGE_OUTPUT_SELECTOR = '[data-message-final]';
const TEMPLATE_OUTPUT_SELECTOR = '[data-template-final]';
const TEMPLATE_THUMB_OUTPUT_SELECTOR = '[data-template-thumb-final]';
const TEMPLATE_CURRENT_SELECTOR = '[data-template-current]';
const TEMPLATE_OPTION_SELECTOR = '[data-template-number]';
const TEMPLATE_OPTION_CHECKED_CLASS = 'checked';
const TEMPLATE_IMAGES_URL = new URL('../../img/certificates/', import.meta.url).href;

let form = null;
let groups = [];
let nominalInput = null;
let nominalLabel = null;
let templateInput = null;
let templatesSwiper = null;
let logoToggle = null;
let logoInput = null;

const readStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const writeStorage = data => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // значения просто не сохранятся
  }
};

const getGroup = name => groups.find(group => group.dataset.certGroup === name);
const findInGroups = selector => groups.map(group => group.querySelector(selector)).find(Boolean) || null;
const findAllInGroups = selector => groups.flatMap(group => Array.from(group.querySelectorAll(selector)));
const getFieldKey = field => field.dataset.certField;
const getOrderFields = () => findAllInGroups(ORDER_FIELD_SELECTOR);
const getNominalVariantRadios = () => findAllInGroups(NOMINAL_VARIANT_SELECTOR);
const getCheckedNominalVariant = () => getNominalVariantRadios().find(radio => radio.checked);

const collectOrder = () => {
  const data = {};

  getOrderFields().forEach(field => {
    const key = getFieldKey(field);

    if (field.type === 'radio' || field.type === 'checkbox') {
      if (field.checked) data[key] = field.value;
      return;
    }

    data[key] = field.matches(PRICE_FIELD_SELECTOR) ? parsePrice(field.value) : field.value;
  });

  return data;
};

const setVisible = (element, isVisible) => {
  element.style.display = isVisible ? '' : 'none';
};

const setOutputText = (selector, text) => {
  document.querySelectorAll(selector).forEach(output => {
    output.textContent = text;
  });
};

const setOutputImage = (selector, url) => {
  document.querySelectorAll(selector).forEach(output => {
    output.setAttribute(output.matches('a') ? 'href' : 'src', url);
  });
};

const fillOrderOutputs = data => {
  setOutputText(NOMINAL_OUTPUT_SELECTOR, (Number(data.nominal) || 0).toLocaleString('ru-RU'));
  setOutputText(MESSAGE_OUTPUT_SELECTOR, data.message ?? '');

  if (!data.template) return;

  document.querySelectorAll(TEMPLATE_OPTION_SELECTOR).forEach(option => {
    option.classList.toggle(TEMPLATE_OPTION_CHECKED_CLASS, option.dataset.templateNumber === String(data.template));
  });

  document.querySelectorAll(TEMPLATE_CURRENT_SELECTOR).forEach(output => {
    output.dataset.templateCurrent = data.template;
  });

  setOutputImage(TEMPLATE_OUTPUT_SELECTOR, `${TEMPLATE_IMAGES_URL}template-${data.template}.webp`);
  setOutputImage(TEMPLATE_THUMB_OUTPUT_SELECTOR, `${TEMPLATE_IMAGES_URL}template-${data.template}-thumb.webp`);
};

const updateOrder = () => {
  const data = collectOrder();

  writeStorage(data);
  fillOrderOutputs(data);
};

const mirrorField = source => {
  const key = getFieldKey(source);
  if (!key || source.type === 'radio' || source.type === 'checkbox') return;

  getOrderFields().forEach(field => {
    if (field !== source && getFieldKey(field) === key) field.value = source.value;
  });
};

const restoreOrder = () => {
  const data = readStorage();

  getOrderFields().forEach(field => {
    const key = getFieldKey(field);
    if (!(key in data) || SERVER_FIELDS.includes(key)) return;

    if (field.type === 'radio' || field.type === 'checkbox') {
      field.checked = field.value === data[key];
      return;
    }

    field.value = field.matches(PRICE_FIELD_SELECTOR) ? formatPrice(data[key]) : data[key];
  });
};

const checkNominalVariant = () => {
  if (!nominalInput) return;

  const radios = getNominalVariantRadios();
  const isOther = radio => radio.dataset.certNominalVariant === NOMINAL_VARIANT_OTHER;
  const variant = radios.find(radio => !isOther(radio) && radio.value === parsePrice(nominalInput.value)) || radios.find(isOther);

  if (variant) variant.checked = true;
};

const syncNominal = ({ clearOnOther = false } = {}) => {
  if (!nominalInput) return;

  const variant = getCheckedNominalVariant();
  const isOther = variant?.dataset.certNominalVariant === NOMINAL_VARIANT_OTHER;

  nominalLabel?.classList.toggle('hidden', !isOther);

  if (isOther) {
    if (clearOnOther) {
      nominalInput.value = '';
      nominalInput.focus();
    }
    return;
  }

  if (variant) nominalInput.value = formatPrice(variant.value);
};

const getScenario = () => {
  if (findInGroups(`${PURPOSE_SELECTOR}:checked`)?.dataset.certPurpose === 'company') return 'company';
  if (findInGroups(`${FORMAT_SELECTOR}:checked`)?.dataset.certFormat === 'printed') return 'printed';

  return 'electronic';
};

const getScenarioGroups = () => groups.filter(group => group.matches(SCENARIO_SELECTOR));

const syncScenario = () => {
  const scenario = getScenario();

  getScenarioGroups().forEach(group => {
    group.disabled = group.dataset.certScenario !== scenario;
  });
};

const resolvePopupId = popupId => {
  const isScenarioPopup = getScenarioGroups().some(group => group.closest(POPUP_SELECTOR)?.id === popupId);
  if (!isScenarioPopup) return popupId;

  return (
    getScenarioGroups()
      .find(group => !group.disabled)
      ?.closest(POPUP_SELECTOR)?.id || popupId
  );
};

const syncRecipient = () => {
  const recipient = findInGroups(`${RECIPIENT_SELECTOR}:checked`)?.dataset.certRecipient;

  findAllInGroups(RECIPIENT_BLOCK_SELECTOR).forEach(block => {
    const isActive = block.dataset.certRecipientBlock === recipient;

    block.hidden = !isActive;
    block.querySelectorAll(FIELD_SELECTOR).forEach(field => {
      field.disabled = !isActive;
    });
  });
};

const syncLogoToggle = () => {
  if (!logoToggle || !logoInput) return;

  const wrapper = logoInput.closest(LOGO_WRAPPER_SELECTOR) || logoInput.parentElement;

  setVisible(wrapper, logoToggle.checked);
  logoInput.disabled = !logoToggle.checked;
};

const onTemplateSlideChange = () => {
  templateInput.value = String(templatesSwiper.realIndex + 1);
  updateOrder();
};

const setTemplate = number => {
  if (!templateInput) return;

  templateInput.value = String(number);

  if (templatesSwiper && !templatesSwiper.destroyed) templatesSwiper.slideTo(Number(number) - 1);

  updateOrder();
};

const bindTemplatesSlider = () => {
  if (!templateInput) return;

  const swiper = getNamedSwiper(TEMPLATES_SLIDER_KEY);
  if (!swiper || swiper.destroyed || swiper === templatesSwiper) return;

  templatesSwiper = swiper;
  templatesSwiper.on('slideChange', onTemplateSlideChange);

  const lastIndex = templatesSwiper.slides.length - 1;
  const index = Math.min(Math.max((Number(templateInput.value) || 1) - 1, 0), lastIndex);

  templatesSwiper.slideTo(index, 0);
};

export const toCertStep = (popupId, groupName) => {
  if (!form) return;

  const group = groupName ? getGroup(groupName) : null;
  if (group && !validateForm(group, getRenderer(form))) return;

  updateOrder();
  window.popup.open(resolvePopupId(popupId));
};

export const initCertificateOrder = () => {
  form = document.querySelector(FORM_SELECTOR);

  if (!form) return;

  groups = Array.from(document.querySelectorAll(GROUP_SELECTOR));
  nominalInput = findInGroups(NOMINAL_SELECTOR);
  nominalLabel = findInGroups(NOMINAL_LABEL_SELECTOR);
  templateInput = findInGroups(TEMPLATE_SELECTOR);
  logoToggle = findInGroups(LOGO_TOGGLE_SELECTOR);
  logoInput = findInGroups(LOGO_INPUT_SELECTOR);

  restoreOrder();
  checkNominalVariant();
  syncNominal();
  syncScenario();
  syncRecipient();
  syncLogoToggle();
  bindTemplatesSlider();
  updateOrder();
  document.addEventListener('sliders:updated', bindTemplatesSlider);

  document.addEventListener('click', event => {
    const option = event.target.closest(TEMPLATE_OPTION_SELECTOR);
    if (!option || event.target.closest('button')) return;

    setTemplate(option.dataset.templateNumber);
  });

  groups.forEach(group => {
    group.addEventListener('change', event => {
      if (event.target.matches(NOMINAL_VARIANT_SELECTOR)) syncNominal({ clearOnOther: true });
      if (event.target.matches(RECIPIENT_SELECTOR)) syncRecipient();
      if (event.target.matches(`${FORMAT_SELECTOR}, ${PURPOSE_SELECTOR}`)) syncScenario();
      if (event.target.matches(LOGO_TOGGLE_SELECTOR)) syncLogoToggle();
      updateOrder();
    });

    group.addEventListener('input', event => {
      mirrorField(event.target);
      updateOrder();
    });
  });

  document.addEventListener('click', event => {
    const link = event.target.closest(PURPOSE_SET_SELECTOR);
    if (!link) return;

    const radio = findAllInGroups(PURPOSE_SELECTOR).find(field => field.dataset.certPurpose === link.dataset.certPurposeSet);
    if (!radio || radio.checked) return;

    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  });

  form.addEventListener('formdata', event => {
    const helperNames = new Set([...getNominalVariantRadios(), logoToggle].map(field => field?.name).filter(Boolean));

    helperNames.forEach(name => event.formData.delete(name));
  });
};

if (typeof window !== 'undefined') {
  window.toCertStep = toCertStep;
}
