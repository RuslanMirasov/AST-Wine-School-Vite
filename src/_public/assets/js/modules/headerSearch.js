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
  const searchButton = document.querySelector('[data-search-submit]');

  if (!wrapper || !toggles.length) return;

  const form = wrapper.querySelector('form');
  const input = wrapper.querySelector('.input');
  const wrapperFocusables = Array.from(wrapper.querySelectorAll('input, button'));

  const isInsideSearch = el => wrapper.contains(el) || (searchButton?.contains(el) ?? false);

  // Пока поле схлопнуто (height:0/overflow:hidden), убираем input и крестик из Tab —
  // иначе клавиатура проваливается в невидимые элементы раньше кнопки-триггера.
  const syncState = () => {
    const isOpen = isSearchWide() || wrapper.classList.contains('active');

    wrapperFocusables.forEach(el => {
      if (isOpen) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });

    searchButton?.setAttribute('aria-expanded', String(isOpen));
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

      if (toggle.hasAttribute('data-search-reset')) form?.reset();

      if (isSearchWide()) {
        if (toggle.hasAttribute('data-search-submit')) form?.requestSubmit();
        return;
      }

      if (wrapper.classList.contains('active')) {
        closeSearch();
      } else {
        openSearch({ focusInput: true });
      }
    });
  });

  // Фокус (Tab, клик, программно) вне поля и кнопки-триггера — закрыть. Свайп/драг
  // ничего не фокусирует, поэтому это правило их не задевает (в отличие от старого
  // focusout + relatedTarget, который на touch давал relatedTarget=null и закрывал зря).
  document.addEventListener('focusin', event => {
    if (isSearchWide() || !wrapper.classList.contains('active')) return;
    // Клик по нефокусируемому месту роняет фокус на body — это не «уход», а служебный
    // фолбэк браузера; настоящий Tab-переход на body никогда не приземляется.
    if (event.target === document.body) return;
    if (!isInsideSearch(event.target)) closeSearch();
  });

  // Клик по некликабельному месту вне поля тоже должен закрывать — focusin для этого
  // не сработает, если клик ничего не фокусирует.
  document.addEventListener('click', event => {
    if (isSearchWide() || !wrapper.classList.contains('active')) return;
    if (!isInsideSearch(event.target)) closeSearch();
  });

  wrapper.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || isSearchWide()) return;
    closeSearch();
    searchButton?.focus();
  });

  window.addEventListener('resize', syncState);

  syncState();
};
