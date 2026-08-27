import { reinitAutoplaySliders } from './sliders.js';

const A11Y_STORAGE_KEY = 'a11y-enabled';

export const initA11yToggle = () => {
  const toggle = document.querySelector('[data-a11y-toggle]');
  const body = document.querySelector('.body');

  if (!toggle || !body) return;

  const applyState = enabled => {
    body.classList.toggle('a11y', enabled);
    toggle.classList.toggle('active', enabled);
    toggle.setAttribute('aria-pressed', enabled);
    toggle.setAttribute('aria-label', enabled ? 'Обычная версия сайта' : 'Версия для слабовидящих');
    reinitAutoplaySliders();
  };

  applyState(localStorage.getItem(A11Y_STORAGE_KEY) === 'true');

  toggle.addEventListener('click', event => {
    event.preventDefault();
    const enabled = !body.classList.contains('a11y');

    localStorage.setItem(A11Y_STORAGE_KEY, enabled);
    applyState(enabled);
  });
};
