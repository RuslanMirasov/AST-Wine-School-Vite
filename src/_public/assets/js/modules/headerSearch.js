import { debounce } from './helpers.js';

const SEARCH_WIDE_MIN_WIDTH = 1600;
const SEARCH_WIDE_RANGE_MIN_WIDTH = 550;
const SEARCH_WIDE_RANGE_MAX_WIDTH = 1151;

const isSearchWide = () => {
  const width = window.innerWidth;
  return width >= SEARCH_WIDE_MIN_WIDTH || (width >= SEARCH_WIDE_RANGE_MIN_WIDTH && width <= SEARCH_WIDE_RANGE_MAX_WIDTH);
};

export const initSearchToggle = () => {
  const wrapper = document.querySelector('[data-search]');
  const toggles = document.querySelectorAll('[data-search-toggle]');

  if (!wrapper || !toggles.length) return;

  const input = wrapper.querySelector('.input');
  const wrapperFocusables = Array.from(wrapper.querySelectorAll('input, button'));

  const isInsideSearch = el => wrapper.contains(el) || Array.from(toggles).some(toggle => toggle.contains(el));

  const syncState = () => {
    const isOpen = isSearchWide() || wrapper.classList.contains('active');

    wrapperFocusables.forEach(el => {
      if (isOpen) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });

    toggles.forEach(toggle => toggle.setAttribute('aria-expanded', String(isOpen)));
  };

  const openSearch = ({ focusInput = false } = {}) => {
    wrapper.classList.add('active');
    syncState();
    if (focusInput) input?.focus();
  };

  const closeSearch = () => {
    wrapper.classList.remove('active');
    syncState();
  };

  toggles.forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.preventDefault();

      if (isSearchWide()) return;

      if (wrapper.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch({ focusInput: true });
      }
    });
  });

  document.addEventListener('focusin', event => {
    if (isSearchWide() || !wrapper.classList.contains('active')) return;
    if (event.target === document.body) return;
    if (!isInsideSearch(event.target)) closeSearch();
  });

  document.addEventListener('click', event => {
    if (isSearchWide() || !wrapper.classList.contains('active')) return;
    if (!isInsideSearch(event.target)) closeSearch();
  });

  wrapper.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || isSearchWide()) return;
    closeSearch();
    Array.from(toggles)
      .find(toggle => toggle.offsetParent !== null)
      ?.focus();
  });

  window.addEventListener('resize', debounce(syncState, 300));

  syncState();
};
