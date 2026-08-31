import { popup } from './modules/popup.js';
import { initForms } from './modules/forms/index.js';
import { initDecimalInputs, initPhoneInputs, initSelectFields } from './modules/inputMasks.js';
import { initNavigationMenu, initMegaMenu } from './modules/navigation.js';
import { initA11yToggle } from './modules/a11yToggle.js';
import { initSearchToggle } from './modules/headerSearch.js';
import { hidePreloader } from './modules/preloader.js';
import { initAgeConfirmation } from './modules/ageConfirmation.js';
import { initSliders } from './modules/sliders.js';
import { initStars } from './modules/stars.js';
import { initAccordeons } from './modules/accordeon.js';
import { initCookieConfirmation } from './modules/cookie-confirm.js';
import { initGalleries } from './modules/image-gallery.js';

popup.init();
window.popup = popup;

document.addEventListener('DOMContentLoaded', () => {
  hidePreloader();
  initA11yToggle();
  initSliders();
  initNavigationMenu();
  initMegaMenu();
  initSearchToggle();
  initForms();
  initPhoneInputs('+7 000 000 00 00');
  initSelectFields();
  initDecimalInputs();
  initStars();
  initAccordeons();
  initAgeConfirmation();
  initCookieConfirmation();
  initGalleries();
});
