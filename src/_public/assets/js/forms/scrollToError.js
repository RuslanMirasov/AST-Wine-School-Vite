const HEADER_SELECTOR = '.header';

// Поле может быть скрыто визуально (файл, календарь, код из SMS) — прокручиваем к его видимой обёртке
const getScrollTarget = anchor => anchor.closest('label') || anchor;

const isRendered = element => element.getClientRects().length > 0;

// Верх экрана закрыт фиксированной шапкой: поле под ней считается невидимым
const getTopOffset = () => {
  const header = document.querySelector(HEADER_SELECTOR);

  return header && getComputedStyle(header).position === 'fixed' ? header.getBoundingClientRect().bottom : 0;
};

const isInViewport = element => {
  const { top, bottom } = element.getBoundingClientRect();

  return top >= getTopOffset() && bottom <= window.innerHeight;
};

// Прокручивает к первому полю с ошибкой, но только если его сейчас не видно на экране.
// errors идут в порядке полей в разметке, поэтому первый отрисованный элемент — верхний на странице
export const scrollToFirstError = errors => {
  const target = errors.map(({ anchor }) => getScrollTarget(anchor)).find(isRendered);

  if (!target || isInViewport(target)) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // block: 'center' — поле встаёт по центру экрана и не прячется под шапку
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
};
