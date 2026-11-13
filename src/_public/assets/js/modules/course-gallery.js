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

  const slideObserver = new ResizeObserver(([{ target }]) => {
    target.closest('.course-gallery-overlay').style.setProperty('--course-gallery-slide-width', `${target.offsetWidth}px`);
  });

  let opener;
  new window.VenoBox({
    selector: '.interface-slider .interface-preview',
    numeration: true,
    infinigall: true,
    fitView: true,
    maxWidth: '960px',
    overlayColor: 'rgba(39, 53, 81, 0.9)',
    customClass: 'course-gallery-overlay',
    toolsBackground: 'var(--blue)',
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
      slideObserver.disconnect();
      opener.focus({ preventScroll: true });
    },
    onContentLoaded() {
      const media = document.querySelector('.course-gallery-overlay .vbox-content:last-child :is(img, video, iframe)');
      if (!media) return;

      if (media instanceof HTMLVideoElement) media.playsInline = true;

      slideObserver.disconnect();
      slideObserver.observe(media);
    },
  });
};
