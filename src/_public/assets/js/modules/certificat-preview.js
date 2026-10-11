const SOURCE_SELECTOR = '[data-cert-preview-source]';
const TRIGGER_SELECTOR = '[data-cert-preview]';
const TEMPLATE_OPTION_SELECTOR = '[data-template-number]';
const TEMPLATE_CURRENT_SELECTOR = '[data-template-current]';

// Размеры листа из макета и отступ от краёв окна сверху и снизу
const PREVIEW_WIDTH = 720;
const PREVIEW_HEIGHT = 1032;
const PREVIEW_GAP = 24;

// Просмотр открывается лайтбоксом поверх попапов: свой слой, попап под ним не закрывается
const openPreview = (source, templateNumber) => {
  // В лайтбокс уходит копия: переданный элемент библиотека разбирает и при закрытии удаляет.
  // Данные в копии актуальны — исходный блок заполняет скрипт заказа
  const copy = source.cloneNode(true);

  // Кнопка внутри плитки выбора показывает шаблон этой плитки, а не выбранный
  if (templateNumber) {
    copy.querySelectorAll(TEMPLATE_CURRENT_SELECTOR).forEach(element => {
      element.dataset.templateCurrent = templateNumber;
    });
  }

  // Временно: без явной ширины блок с container-type внутри лайтбокса схлопывается в ноль.
  // Третье значение — ширина, при которой лист помещается по высоте окна с отступами по 24px
  Array.from(copy.children).forEach(child => {
    child.style.width = `min(${PREVIEW_WIDTH}px, 90vw, calc((100dvh - ${PREVIEW_GAP * 2}px) * ${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}))`;
  });

  const closeOnEscape = event => {
    if (event.key === 'Escape') instance.close();
  };

  const instance = basicLightbox.create(copy, {
    onShow: () => document.addEventListener('keydown', closeOnEscape),
    onClose: () => document.removeEventListener('keydown', closeOnEscape),
  });

  instance.show();
};

export const initCertificatePreview = () => {
  const source = document.querySelector(SOURCE_SELECTOR);

  if (!source) return;

  document.addEventListener('click', event => {
    const trigger = event.target.closest(TRIGGER_SELECTOR);
    if (!trigger) return;

    if (typeof basicLightbox === 'undefined') {
      console.warn('[certificat-preview] basicLightbox не подключён на странице');
      return;
    }

    openPreview(source, trigger.closest(TEMPLATE_OPTION_SELECTOR)?.dataset.templateNumber);
  });
};
