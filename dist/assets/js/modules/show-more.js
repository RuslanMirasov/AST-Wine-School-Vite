const CONTAINER_SELECTOR = '[data-show-more]';
const BUTTON_SELECTOR = '[data-show-more-btn]';
const EXPANDED_CLASS = 'is-expanded';

export const initShowMore = () => {
  document.querySelectorAll(CONTAINER_SELECTOR).forEach(container => {
    container.querySelectorAll(BUTTON_SELECTOR).forEach(holder => {
      const button = holder.matches('button') ? holder : holder.querySelector('button');
      if (!button) return;

      button.addEventListener('click', () => {
        container.classList.add(EXPANDED_CLASS);
      });
    });
  });
};
