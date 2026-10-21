// Поиск в шапке: иконка [data-search-toggle] ставит класс search-open на .header и .header-dropdown,
// крестик .search-close и Escape в форме его снимают. Где и как форма показывается, решает CSS
const SEARCH_OPEN_CLASS = 'search-open';

export const initHeaderSearch = () => {
  const header = document.querySelector('.header');
  const dropdown = document.querySelector('.header-dropdown');
  const toggles = Array.from(document.querySelectorAll('[data-search-toggle]'));
  const form = dropdown?.querySelector('form');

  if (!header || !dropdown || !form || !toggles.length) return;

  const input = form.querySelector('input');
  const isOpen = () => header.classList.contains(SEARCH_OPEN_CLASS);

  const setOpenState = open => {
    header.classList.toggle(SEARCH_OPEN_CLASS, open);
    dropdown.classList.toggle(SEARCH_OPEN_CLASS, open);
    toggles.forEach(toggle => toggle.setAttribute('aria-expanded', String(open)));
  };

  const openSearch = () => {
    setOpenState(true);
    input?.focus();
  };

  const closeSearch = () => {
    if (!isOpen()) return;
    setOpenState(false);
    toggles.find(toggle => toggle.offsetParent !== null)?.focus();
  };

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => (isOpen() ? closeSearch() : openSearch()));
  });

  form.querySelectorAll('.search-close').forEach(button => {
    button.addEventListener('click', closeSearch);
  });

  form.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeSearch();
  });
};
