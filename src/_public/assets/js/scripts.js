import { popup } from './modules/popup.js';
import { initScrollManager } from './modules/scrollManager.js';
import { initForms } from './modules/forms/index.js';
import { initDecimalInputs, initPhoneInputs, initSelectFields } from './modules/inputMasks.js';
import { initNavigationMenu, initMegaMenu, initA11yToggle, hidePreloader } from './modules/helpers.js';
import { initSliders } from './modules/sliders.js';
import { initStars } from './modules/stars.js';

popup.init();
window.popup = popup;

document.addEventListener('DOMContentLoaded', () => {
  hidePreloader();
  initScrollManager();
  initNavigationMenu();
  initMegaMenu();
  initA11yToggle();
  initSliders();
  initForms();
  initPhoneInputs('+7 000 000 00 00');
  initSelectFields();
  initDecimalInputs();
  initStars();
});
