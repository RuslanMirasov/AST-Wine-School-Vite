const SEARCH_WIDE_MIN_WIDTH = 1600;
const SEARCH_WIDE_RANGE_MIN_WIDTH = 550;
const SEARCH_WIDE_RANGE_MAX_WIDTH = 1023;

const isSearchWide = () => {
  const width = window.innerWidth;
  return width >= SEARCH_WIDE_MIN_WIDTH || (width >= SEARCH_WIDE_RANGE_MIN_WIDTH && width <= SEARCH_WIDE_RANGE_MAX_WIDTH);
};

export const initSearchToggle = () => {
  const wrapper = document.querySelector('[data-search]');
  const toggles = document.querySelectorAll('[data-search-toggle]');

  if (!wrapper || !toggles.length) return;

  const form = wrapper.querySelector('form');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.preventDefault();

      if (toggle.hasAttribute('data-search-reset')) form?.reset();

      if (isSearchWide()) {
        if (toggle.hasAttribute('data-search-submit')) form?.requestSubmit();
        return;
      }

      wrapper.classList.toggle('active');
    });
  });
};
