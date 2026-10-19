const BUTTON_CLASS = 'text fs-12 under magenta';
const EXPAND_TEXT = 'Читать полностью';
const COLLAPSE_TEXT = 'Свернуть';
const EXPANDED_CLASS = 'is-expanded';

export const initReadMore = () => {
  const elements = document.querySelectorAll('[data-read-more]');

  if (!elements.length) return;

  const buttons = new WeakMap();

  // Кнопка не пропадает: «Читать полностью» раскрывает текст, «Свернуть» возвращает его к исходному числу строк.
  // Раскрывается только тот блок, на котором нажали
  const toggle = el => {
    const isExpanded = el.classList.toggle(EXPANDED_CLASS);
    const button = buttons.get(el);

    if (button) {
      button.textContent = isExpanded ? COLLAPSE_TEXT : EXPAND_TEXT;
      button.setAttribute('aria-expanded', String(isExpanded));
    }
  };

  const createButton = el => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.textContent = EXPAND_TEXT;
    button.setAttribute('aria-expanded', 'false');
    button.dataset.readMoreBtn = '';
    button.addEventListener('click', () => toggle(el));
    return button;
  };

  const updateButton = el => {
    // У раскрытого текста обрезки нет — кнопку «Свернуть» не трогаем
    if (el.classList.contains(EXPANDED_CLASS)) return;

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

  const observer = new ResizeObserver(entries => {
    entries.forEach(({ target }) => updateButton(target));
  });

  elements.forEach(el => {
    const lines = parseInt(el.dataset.readMore, 10);

    if (!lines || lines < 1) return;

    el.style.setProperty('--read-more-lines', lines);
    observer.observe(el);
  });
};
