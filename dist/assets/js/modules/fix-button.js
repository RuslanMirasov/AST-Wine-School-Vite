import { throttle } from './helpers.js';

const BUTTON_SELECTOR = '[data-fix-button]';
const ANCHOR_SELECTOR = '[data-fix-button-anchor]';
const STOP_SELECTOR = '[data-fix-button-stop]';
const ACTIVE_CLASS = 'active';
const MOBILE_QUERY = '(max-width: 767px)';
const THROTTLE_DELAY = 100;

const HEADER_SELECTOR = '#header';

const isOnScreen = element => {
  const rect = element.getBoundingClientRect();

  if (!rect.width && !rect.height) return false;

  return rect.bottom > 0 && rect.top < window.innerHeight;
};

const getHeaderBottom = () => {
  const header = document.querySelector(HEADER_SELECTOR);
  if (!header) return 0;

  const rect = header.getBoundingClientRect();
  return rect.height ? Math.max(0, rect.bottom) : 0;
};

const isFullyVisible = (element, topLimit, bottomLimit) => {
  const rect = element.getBoundingClientRect();

  if (!rect.width && !rect.height) return false;

  return rect.top >= topLimit && rect.bottom <= bottomLimit;
};

export const initFixButton = () => {
  const fixButton = document.querySelector(BUTTON_SELECTOR);
  const anchors = Array.from(document.querySelectorAll(ANCHOR_SELECTOR));
  const stops = Array.from(document.querySelectorAll(STOP_SELECTOR));

  if (!fixButton || !anchors.length) return;

  const mobileQuery = window.matchMedia(MOBILE_QUERY);

  const update = () => {
    const topLimit = getHeaderBottom();
    const bottomLimit = window.innerHeight - (fixButton.classList.contains(ACTIVE_CLASS) ? fixButton.offsetHeight : 0);
    const anchorVisible = anchors.some(anchor => isFullyVisible(anchor, topLimit, bottomLimit));
    const shouldShow = mobileQuery.matches && !anchorVisible && !stops.some(isOnScreen);

    if (fixButton.classList.contains(ACTIVE_CLASS) !== shouldShow) fixButton.classList.toggle(ACTIVE_CLASS, shouldShow);
  };

  const onScroll = throttle(update, THROTTLE_DELAY);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  mobileQuery.addEventListener('change', update);

  update();
};
