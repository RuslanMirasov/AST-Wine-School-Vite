import { reinitSlidersForA11y } from './sliders.js';
import { updateSearchState } from './headerSearch.js';

const STORAGE_KEY = 'a11y-settings';

const DEFAULTS = {
  enabled: false,
  fontSize: 'normal',
  theme: 'color',
  images: 'shown',
  spacing: 'normal',
};

// name у радиокнопок в a11y-panel.html
const RADIO_NAMES = {
  fontSize: 'a11y-font-size',
  theme: 'a11y-theme',
  images: 'a11y-images',
  spacing: 'a11y-spacing',
};

// Дефолтное значение каждой категории — без класса; класс есть только у отклонений от нормы.
const CLASS_MAP = {
  fontSize: { big: 'a11y-font-big', large: 'a11y-font-large' },
  theme: { light: 'a11y-theme-light', dark: 'a11y-theme-dark' },
  images: { grayscale: 'a11y-images-grayscale', hidden: 'a11y-images-hidden' },
  spacing: { wide: 'a11y-spacing-wide', wider: 'a11y-spacing-wider' },
};

const ALL_MODIFIER_CLASSES = Object.values(CLASS_MAP).flatMap(valueMap => Object.values(valueMap));

const loadSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === 'object' ? { ...DEFAULTS, ...saved } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
};

const saveSettings = settings => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const initA11yToggle = () => {
  const toggles = document.querySelectorAll('[data-a11y-toggle]');
  const panel = document.querySelector('[data-a11y-panel]');
  const body = document.querySelector('.body');

  if (!toggles.length || !body) return;

  const settings = loadSettings();

  const applyClasses = () => {
    body.classList.toggle('a11y', settings.enabled);
    body.classList.remove(...ALL_MODIFIER_CLASSES);

    Object.entries(CLASS_MAP).forEach(([key, valueMap]) => {
      const className = valueMap[settings[key]];
      if (className) body.classList.add(className);
    });
  };

  const applyToggleButtons = () => {
    toggles.forEach(toggle => {
      toggle.classList.toggle('active', settings.enabled);
      toggle.setAttribute('aria-pressed', settings.enabled);

      // Есть только у кнопки в шапке — у иконка-only кнопки в панели такого span нет,
      // её aria-label «Перейти в обычный режим» и так корректен в любом состоянии.
      const label = toggle.querySelector('[data-a11y-toggle-text]');
      if (label) label.textContent = settings.enabled ? 'Обычная версия сайта' : 'Версия для слабовидящих';
    });
  };

  const syncRadios = () => {
    if (!panel) return;

    Object.entries(RADIO_NAMES).forEach(([key, name]) => {
      const input = panel.querySelector(`input[name="${name}"][value="${settings[key]}"]`);
      if (input) input.checked = true;
    });
  };

  applyClasses();
  applyToggleButtons();
  syncRadios();

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      settings.enabled = !settings.enabled;
      saveSettings(settings);
      applyClasses();
      applyToggleButtons();
      reinitSlidersForA11y();
      updateSearchState();
    });
  });

  panel?.addEventListener('change', event => {
    const input = event.target;
    if (input.type !== 'radio') return;

    const key = Object.keys(RADIO_NAMES).find(name => RADIO_NAMES[name] === input.name);
    if (!key) return;

    settings[key] = input.value;
    saveSettings(settings);
    applyClasses();
  });
};
