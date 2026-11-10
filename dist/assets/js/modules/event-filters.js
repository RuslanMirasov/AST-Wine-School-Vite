const BACKDROP_SELECTOR = '[data-filters-backdrop]';
const TOGGLE_SELECTOR = '[data-filter-toggle-button]';
const CLOSE_SELECTOR = '[data-filters-close]';
const OPEN_CLASS = 'active';

export const initEventFilters = () => {
  const backdrop = document.querySelector(BACKDROP_SELECTOR);

  if (!backdrop) return;

  const toggleButtons = Array.from(document.querySelectorAll(TOGGLE_SELECTOR));
  let opener = null;

  const isOpen = () => backdrop.classList.contains(OPEN_CLASS);

  const setOpen = open => {
    backdrop.classList.toggle(OPEN_CLASS, open);
    toggleButtons.forEach(button => button.setAttribute('aria-expanded', String(open)));
  };

  const open = button => {
    opener = button;
    setOpen(true);
  };

  const close = () => {
    if (!isOpen()) return;

    setOpen(false);
    opener?.focus();
    opener = null;
  };

  setOpen(isOpen());

  document.addEventListener('click', event => {
    const toggleButton = event.target.closest(TOGGLE_SELECTOR);

    if (toggleButton) {
      if (isOpen()) close();
      else open(toggleButton);
      return;
    }

    const closer = event.target.closest(CLOSE_SELECTOR);
    if (!closer) return;

    if (closer === backdrop && event.target !== backdrop) return;

    close();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
};
