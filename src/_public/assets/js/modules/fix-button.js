import { throttle } from './helpers.js';

// Фиксированная кнопка на мобилке: показывается, когда ни одной кнопки-якоря [data-fix-button-anchor]
// не видно на экране, и прячется, как только хотя бы одна появилась.
// Прячется и в зоне [data-fix-button-stop] (футер): иначе перекроет информацию в конце страницы.
// <div data-fix-button> — фиксированная кнопка, видна с классом active
const BUTTON_SELECTOR = '[data-fix-button]';
const ANCHOR_SELECTOR = '[data-fix-button-anchor]';
const STOP_SELECTOR = '[data-fix-button-stop]';
const ACTIVE_CLASS = 'active';
const MOBILE_QUERY = '(max-width: 767px)';
const THROTTLE_DELAY = 100;

// Скрытый элемент (display: none) даёт нулевой прямоугольник — его не считаем видимым
const isOnScreen = element => {
  const rect = element.getBoundingClientRect();

  if (!rect.width && !rect.height) return false;

  return rect.bottom > 0 && rect.top < window.innerHeight;
};

export const initFixButton = () => {
  const fixButton = document.querySelector(BUTTON_SELECTOR);
  const anchors = Array.from(document.querySelectorAll(ANCHOR_SELECTOR));
  const stops = Array.from(document.querySelectorAll(STOP_SELECTOR));

  if (!fixButton || !anchors.length) return;

  const mobileQuery = window.matchMedia(MOBILE_QUERY);

  const update = () => {
    // Вне мобилки фиксированная кнопка не нужна
    const shouldShow = mobileQuery.matches && !anchors.some(isOnScreen) && !stops.some(isOnScreen);

    if (fixButton.classList.contains(ACTIVE_CLASS) !== shouldShow) fixButton.classList.toggle(ACTIVE_CLASS, shouldShow);
  };

  const onScroll = throttle(update, THROTTLE_DELAY);

  window.addEventListener('scroll', onScroll, { passive: true });
  // Ресайз и поворот экрана меняют, что попадает на экран
  window.addEventListener('resize', onScroll);
  mobileQuery.addEventListener('change', update);

  update();
};
