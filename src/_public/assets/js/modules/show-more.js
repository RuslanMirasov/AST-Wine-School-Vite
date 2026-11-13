const CONTAINER_SELECTOR = '[data-show-more]';
const BUTTON_SELECTOR = '[data-show-more-btn]';
const EXPANDED_CLASS = 'is-expanded';
const MOBILE_QUERY = '(max-width: 767px)';

const initMobileBatches = (holder, button, list, step) => {
  const mobile = window.matchMedia(MOBILE_QUERY);
  const items = Array.from(list.children);
  let visibleCount = step;

  const update = () => {
    items.forEach((item, index) => {
      item.hidden = mobile.matches && index >= visibleCount;
    });
    holder.hidden = mobile.matches && visibleCount >= items.length;
  };

  button.addEventListener('click', () => {
    if (!mobile.matches || visibleCount >= items.length) return;

    const firstNewItem = items[visibleCount];
    visibleCount += step;
    update();
    firstNewItem.querySelector('.title-link')?.focus();
  });

  mobile.addEventListener('change', update);
  update();
};

export const initShowMore = () => {
  document.querySelectorAll(CONTAINER_SELECTOR).forEach(container => {
    container.querySelectorAll(BUTTON_SELECTOR).forEach(holder => {
      const button = holder.matches('button') ? holder : holder.querySelector('button');
      if (!button) return;

      const step = Number(button.dataset.showMoreStep);
      if (step > 0) {
        const list = document.getElementById(button.getAttribute('aria-controls'));
        if (list) initMobileBatches(holder, button, list, step);
        return;
      }

      button.addEventListener('click', () => {
        container.classList.add(EXPANDED_CLASS);
      });
    });
  });
};
