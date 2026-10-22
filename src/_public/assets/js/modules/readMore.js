const BUTTON_CLASS = 'text fs-12 under magenta';
const EXPAND_TEXT = 'Читать полностью';
const COLLAPSE_TEXT = 'Свернуть';
const EXPANDED_CLASS = 'is-expanded';

export const initReadMore = () => {
  initReadMoreGroups();

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

// Несколько абзацев с общим лимитом строк: <… data-read-more-group="10"> на карточке (например, год в истории школы).
// Заголовок не считается — считаются только абзацы <p> карточки. Абзац, на котором лимит превышается, обрезается
// с многоточием (класс read-more-clamp + --read-more-lines), сразу после него — кнопка, абзацы ниже скрыты.
// Кнопка и поведение те же, что у data-read-more: «Читать полностью» / «Свернуть», раскрывается только своя карточка
const GROUP_SELECTOR = '[data-read-more-group]';
const CLAMP_CLASS = 'read-more-clamp';

const getParagraphs = group => Array.from(group.querySelectorAll(':scope > p'));

const countLines = paragraph => {
  const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
  return lineHeight ? Math.round(paragraph.getBoundingClientRect().height / lineHeight) : 1;
};

const resetParagraphs = paragraphs => {
  paragraphs.forEach(paragraph => {
    paragraph.classList.remove(CLAMP_CLASS);
    paragraph.style.removeProperty('--read-more-lines');
    paragraph.style.display = '';
  });
};

// Какой абзац обрезать и до скольких строк. null — всё помещается в лимит
const findCut = (paragraphs, limit) => {
  const lines = paragraphs.map(countLines);
  let used = 0;

  for (let index = 0; index < paragraphs.length; index++) {
    if (used + lines[index] > limit) {
      const rest = limit - used;
      if (rest > 0) return { index, lines: rest };

      // Лимит закончился ровно на предыдущем абзаце: многоточие ставим в нём, отдав одну строку
      if (index > 0 && lines[index - 1] > 1) return { index: index - 1, lines: lines[index - 1] - 1 };
      return { index, lines: 1 };
    }
    used += lines[index];
  }

  return null;
};

const initReadMoreGroups = () => {
  const groups = document.querySelectorAll(GROUP_SELECTOR);

  if (!groups.length) return;

  const buttons = new WeakMap();
  const widths = new WeakMap();

  const setButtonState = (button, isExpanded) => {
    button.textContent = isExpanded ? COLLAPSE_TEXT : EXPAND_TEXT;
    button.setAttribute('aria-expanded', String(isExpanded));
  };

  const update = group => {
    const limit = parseInt(group.dataset.readMoreGroup, 10);
    const paragraphs = getParagraphs(group);
    if (!limit || limit < 1 || !paragraphs.length) return;

    // Раскрытая карточка показывает всё, кнопка «Свернуть» остаётся на месте
    if (group.classList.contains(EXPANDED_CLASS)) {
      resetParagraphs(paragraphs);
      return;
    }

    // Строки считаются по полному тексту: сначала всё показываем и снимаем обрезку
    resetParagraphs(paragraphs);
    const cut = findCut(paragraphs, limit);
    let button = buttons.get(group);

    if (!cut) {
      button?.remove();
      buttons.delete(group);
      return;
    }

    const target = paragraphs[cut.index];
    target.style.setProperty('--read-more-lines', cut.lines);
    target.classList.add(CLAMP_CLASS);
    paragraphs.slice(cut.index + 1).forEach(paragraph => {
      paragraph.style.display = 'none';
    });

    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = BUTTON_CLASS;
      button.dataset.readMoreBtn = '';
      button.addEventListener('click', () => {
        const isExpanded = group.classList.toggle(EXPANDED_CLASS);
        setButtonState(button, isExpanded);
        // Раскрыли — кнопка уходит под последний абзац, свернули — возвращается под обрезанный
        if (isExpanded) getParagraphs(group).at(-1).after(button);
        update(group);
      });
      buttons.set(group, button);
      setButtonState(button, false);
    }

    target.after(button);
  };

  // Пересчёт только при смене ширины: высоту карточки меняем мы сами, иначе наблюдатель зациклится
  const observer = new ResizeObserver(entries => {
    entries.forEach(({ target, contentRect }) => {
      if (widths.get(target) === contentRect.width) return;
      widths.set(target, contentRect.width);
      update(target);
    });
  });

  groups.forEach(group => observer.observe(group));

  // Веб-шрифт может догрузиться после первого подсчёта и поменять переносы
  document.fonts?.ready.then(() => groups.forEach(update));
};
