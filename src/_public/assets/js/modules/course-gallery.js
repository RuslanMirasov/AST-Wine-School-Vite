export const initCourseGallery = () => {
  const gallery = document.querySelector('.interface-slider');
  if (!gallery || !window.VenoBox) return;

  // Swiper отменяет клик после перетаскивания, но VenoBox всё равно обрабатывает его на кнопке.
  gallery.addEventListener(
    'click',
    event => {
      if (event.defaultPrevented) event.stopPropagation();
    },
    true
  );

  let opener;
  new window.VenoBox({
    selector: '.interface-slider .interface-preview',
    numeration: true,
    infinigall: true,
    fitView: true,
    maxWidth: '960px',
    titleattr: 'aria-label',
    focusItem: false,
    onPreOpen(item) {
      opener = item;
    },
    onPostOpen() {
      const overlay = document.querySelector('.vbox-overlay');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Интерфейс курса');
      overlay.querySelector('.vbox-close').setAttribute('aria-label', 'Закрыть галерею');
      overlay.querySelector('.vbox-prev').setAttribute('aria-label', 'Предыдущий слайд');
      overlay.querySelector('.vbox-next').setAttribute('aria-label', 'Следующий слайд');
    },
    onPreClose() {
      opener.focus({ preventScroll: true });
    },
    onContentLoaded() {
      const video = document.querySelector('.vbox-overlay .vbox-content video');
      if (video) video.playsInline = true;
    },
  });
};
