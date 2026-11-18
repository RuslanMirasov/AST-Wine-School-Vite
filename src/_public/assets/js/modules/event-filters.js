export const initEventFilters = () => {
  const backdrop = document.querySelector('[data-filters-backdrop]');
  if (!backdrop) return;

  const toggle = document.querySelector('[data-filter-toggle-button]');
  const closeButton = backdrop.querySelector('button[data-filters-close]');
  const resetButton = backdrop.querySelector('button[type="reset"]');
  const mobileViewport = window.matchMedia('(max-width: 1151px)');
  let openButton = null;

  const setMobileOpen = open => {
    backdrop.classList.toggle('active', open);
    backdrop.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) closeButton.focus();
    else if (mobileViewport.matches) toggle.focus();
  };

  const setDropdown = button => {
    if (openButton) {
      openButton.setAttribute('aria-expanded', 'false');
      document.getElementById(openButton.getAttribute('aria-controls')).hidden = true;
    }

    openButton = button;
    if (button) {
      button.setAttribute('aria-expanded', 'true');
      document.getElementById(button.getAttribute('aria-controls')).hidden = false;
    }
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-filter-button]');
    if (button) setDropdown(button === openButton ? null : button);
    else if (openButton && !openButton.parentElement.contains(event.target)) setDropdown(null);

    if (toggle.contains(event.target)) setMobileOpen(backdrop.inert);
    else if (event.target === backdrop || closeButton.contains(event.target)) setMobileOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (openButton) {
        const button = openButton;
        setDropdown(null);
        button.focus();
      } else if (!backdrop.inert) {
        setMobileOpen(false);
      }
      return;
    }

    if (event.key !== 'Tab' || backdrop.inert) return;
    if (event.shiftKey && document.activeElement === closeButton) {
      event.preventDefault();
      resetButton.focus();
    } else if (!event.shiftKey && document.activeElement === resetButton) {
      event.preventDefault();
      closeButton.focus();
    }
  });

  mobileViewport.addEventListener('change', () => {
    setDropdown(null);
    if (!backdrop.inert) setMobileOpen(false);
  });
};
