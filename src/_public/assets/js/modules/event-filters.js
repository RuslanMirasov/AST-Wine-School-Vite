// Мобильная панель фильтров в календаре мероприятий (/events/).
// Открывается и закрывается кнопкой [data-filter-toggle-button]; закрывается также кликом по затемнению,
// любым элементом с [data-filters-close] и клавишей Escape. Прокрутка страницы при этом не блокируется
const BACKDROP_SELECTOR = '[data-filters-backdrop]';
const TOGGLE_SELECTOR = '[data-filter-toggle-button]';
const CLOSE_SELECTOR = '[data-filters-close]';
const OPEN_CLASS = 'active';

export const initEventFilters = () => {
  const backdrop = document.querySelector(BACKDROP_SELECTOR);

  if (!backdrop) return;

  const toggleButtons = Array.from(document.querySelectorAll(TOGGLE_SELECTOR));
  // Кнопка, которой открыли панель: после закрытия фокус возвращается на неё
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

    // Затемнение само помечено как закрывающее, но клик внутри панели до него всплывает —
    // закрываем, только если нажали именно на затемнение
    if (closer === backdrop && event.target !== backdrop) return;

    close();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
};
