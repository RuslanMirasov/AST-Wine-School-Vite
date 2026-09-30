export const initStickySidebar = () => {
  const sidebars = document.querySelectorAll('[data-sticky-sidebar]');

  if (!sidebars.length) return;

  const resolvePx = (el, variable) => {
    const prev = el.style.top;
    el.style.top = `var(${variable})`;
    const value = parseFloat(getComputedStyle(el).top) || 0;
    el.style.top = prev;
    return value;
  };

  const states = [...sidebars].map(el => ({
    el,
    parent: el.parentElement,
    gapTop: 0,
    gapBottom: 0,
    visualTop: 0,
    parentTop: 0,
  }));

  const measure = state => {
    state.gapTop = resolvePx(state.el, '--sticky-top');
    state.gapBottom = resolvePx(state.el, '--sticky-bottom');
    state.visualTop = state.el.getBoundingClientRect().top;
    state.parentTop = state.parent.getBoundingClientRect().top;
  };

  const update = state => {
    const { el, parent, gapTop, gapBottom } = state;
    const parentTop = parent.getBoundingClientRect().top;
    const delta = state.parentTop - parentTop;
    state.parentTop = parentTop;

    const minTop = window.innerHeight - el.offsetHeight - gapBottom;

    if (minTop >= gapTop) {
      el.style.top = `${gapTop}px`;
    } else {
      const nextTop = Math.min(gapTop, Math.max(minTop, state.visualTop - delta));
      el.style.top = `${nextTop}px`;
    }

    state.visualTop = el.getBoundingClientRect().top;
  };

  const refresh = () =>
    states.forEach(state => {
      measure(state);
      update(state);
    });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      states.forEach(update);
      ticking = false;
    });
  };

  refresh();

  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', refresh);

  const observer = new ResizeObserver(() => states.forEach(update));
  states.forEach(({ el }) => observer.observe(el));
};
