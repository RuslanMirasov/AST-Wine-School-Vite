const BUTTON_CLASS = 'text fs-12 under magenta';
const BUTTON_TEXT = 'Читать полностью';

export const initReadMore = () => {
  const elements = document.querySelectorAll('[data-read-more]');

  if (!elements.length) return;

  const observer = new ResizeObserver(entries => {
    entries.forEach(({ target }) => updateButton(target));
  });

  const buttons = new WeakMap();

  const expand = el => {
    observer.unobserve(el);
    buttons.get(el)?.remove();
    buttons.delete(el);
    el.classList.add('is-expanded');
  };

  const createButton = el => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.textContent = BUTTON_TEXT;
    button.dataset.readMoreBtn = '';
    button.addEventListener('click', () => expand(el));
    return button;
  };

  const updateButton = el => {
    const isClamped = el.scrollHeight > el.clientHeight + 1;
    const button = buttons.get(el);

    if (isClamped && !button) {
      const newButton = createButton(el);
      buttons.set(el, newButton);
      el.after(newButton);
    } else if (!isClamped && button) {
      button.remove();
      buttons.delete(el);
    }
  };

  elements.forEach(el => {
    const lines = parseInt(el.dataset.readMore, 10);

    if (!lines || lines < 1) return;

    el.style.setProperty('--read-more-lines', lines);
    observer.observe(el);
  });
};
