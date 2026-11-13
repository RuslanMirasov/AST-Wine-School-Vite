const BACKDROP_SELECTOR = '[data-filters-backdrop]';
const TOGGLE_SELECTOR = '[data-filter-toggle-button]';
const CLOSE_SELECTOR = '[data-filters-close]';
const OPEN_CLASS = 'active';

export const initEventFilters = () => {
  const backdrop = document.querySelector(BACKDROP_SELECTOR);

  if (!backdrop) return;

  const toggleButtons = Array.from(document.querySelectorAll(TOGGLE_SELECTOR));
  const closeButton = backdrop.querySelector('button.popup-close');
  const applyButton = backdrop.querySelector('button[type="submit"]');
  const isA11yEnabled = () => document.body.classList.contains('a11y');
  let opener = null;

  const isOpen = () => backdrop.classList.contains(OPEN_CLASS);

  const setOpen = open => {
    backdrop.classList.toggle(OPEN_CLASS, open);
    toggleButtons.forEach(button => button.setAttribute('aria-expanded', String(open)));
  };

  const open = button => {
    opener = button;
    setOpen(true);
    if (isA11yEnabled()) closeButton?.focus();
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
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key !== 'Tab' || !isOpen() || !isA11yEnabled() || !closeButton || !applyButton) return;

    if (event.shiftKey && document.activeElement === closeButton) {
      event.preventDefault();
      applyButton.focus();
    } else if (!event.shiftKey && document.activeElement === applyButton) {
      event.preventDefault();
      closeButton.focus();
    }
  });
};
