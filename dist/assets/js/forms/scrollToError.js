const getScrollTarget = anchor => anchor.closest('label') || anchor;
const isRendered = element => element.getClientRects().length > 0;

const getTopOffset = () => {
  const header = document.querySelector('.header');
  return header && getComputedStyle(header).position === 'fixed' ? header.getBoundingClientRect().bottom : 0;
};

const isInViewport = element => {
  const { top, bottom } = element.getBoundingClientRect();
  return top >= getTopOffset() && bottom <= window.innerHeight;
};

export const scrollToFirstError = errors => {
  const target = errors.map(({ anchor }) => getScrollTarget(anchor)).find(isRendered);

  if (!target || isInViewport(target)) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
};
