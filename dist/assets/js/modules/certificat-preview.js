const SOURCE_SELECTOR = '[data-cert-preview-source]';
const TRIGGER_SELECTOR = '[data-cert-preview]';
const TEMPLATE_OPTION_SELECTOR = '[data-template-number]';
const TEMPLATE_CURRENT_SELECTOR = '[data-template-current]';
const EDIT_SELECTOR = '[data-cert-edit]';
const EDIT_STEP_POPUP = 'cert-order-step-2';
const CLOSE_SELECTOR = '[data-cert-preview-close]';
const PREVIEW_WIDTH = 720;
const PREVIEW_HEIGHT = 1032;
const PREVIEW_GAP = 24;

const openPreview = (source, templateNumber) => {
  const copy = source.cloneNode(true);

  if (templateNumber) {
    copy.querySelectorAll(TEMPLATE_CURRENT_SELECTOR).forEach(element => {
      element.dataset.templateCurrent = templateNumber;
    });
  }

  Array.from(copy.children).forEach(child => {
    child.style.width = `min(${PREVIEW_WIDTH}px, 90vw, calc((100dvh - ${PREVIEW_GAP * 2}px) * ${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}))`;
  });

  const closeOnEscape = event => {
    if (event.key === 'Escape') instance.close();
  };

  copy.querySelectorAll(EDIT_SELECTOR).forEach(button => {
    button.addEventListener('click', () => {
      instance.close();
      window.toCertStep?.(EDIT_STEP_POPUP);
    });
  });

  copy.querySelectorAll(CLOSE_SELECTOR).forEach(button => {
    button.addEventListener('click', () => instance.close());
  });

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
