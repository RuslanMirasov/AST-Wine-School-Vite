import { getNamedSwiper, goToSlide } from './goToSlide.js';
import { debounce } from './helpers.js';

const SLIDER_KEY = 'hero-text-swiper';
const DRAG_START_THRESHOLD = 5;
const DRAG_SWIPE_THRESHOLD = 30;
const DRAG_EDGE_RESISTANCE = 0.3;

export const initHeroPagination = () => {
  const paginationEl = document.querySelector('[data-hero-pagination]');

  if (!paginationEl) return;

  const scrollWrapper = paginationEl.querySelector('[data-pagination-scroll]');
  const buttons = Array.from(paginationEl.querySelectorAll('[data-pagination-target]'));
  const boundSwipers = new WeakSet();

  if (!scrollWrapper || !buttons.length) return;

  let shift = 0;
  let activeIndex = buttons.findIndex(button => button.classList.contains('active'));

  const measure = () => {
    const createClone = isActive => {
      const clone = buttons[0].cloneNode(true);
      clone.classList.toggle('active', isActive);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('data-pagination-target');
      Object.assign(clone.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        transition: 'none',
      });
      scrollWrapper.append(clone);
      return clone;
    };

    const inactiveClone = createClone(false);
    const activeClone = createClone(true);

    const sizes = {
      inactiveWidth: inactiveClone.offsetWidth,
      activeWidth: activeClone.offsetWidth,
      gap: parseFloat(getComputedStyle(scrollWrapper).columnGap) || 0,
      containerWidth: paginationEl.clientWidth,
    };

    inactiveClone.remove();
    activeClone.remove();

    return sizes;
  };

  const getGeometry = () => {
    const { inactiveWidth, activeWidth, gap, containerWidth } = measure();
    const step = inactiveWidth + gap;

    return {
      step,
      activeWidth,
      containerWidth,
      contentRight: (buttons.length - 1) * step + activeWidth,
    };
  };

  const getOverflow = ({ contentRight, containerWidth }) => Math.max(0, contentRight - containerWidth);

  let overflow = 0;
  const getVisibleShift = () => Math.min(shift, overflow);

  const drag = {
    pointerId: null,
    startX: 0,
    dx: 0,
    startShift: 0,
    isDragging: false,
    suppressClick: false,
  };

  const setTranslate = value => {
    scrollWrapper.style.transform = `translate3d(${-value}px, 0, 0)`;
  };

  const applyShift = () => {
    if (!drag.isDragging) setTranslate(getVisibleShift());
  };

  const updateDraggable = () => {
    paginationEl.classList.toggle('is-draggable', overflow > 0);
  };

  const updateShift = (direction = 0) => {
    if (activeIndex < 0) return;

    const geometry = getGeometry();
    const { step, activeWidth, containerWidth, contentRight } = geometry;
    if (!step || !containerWidth) return;

    overflow = getOverflow(geometry);
    updateDraggable();

    const activeLeft = activeIndex * step;
    const activeRight = activeLeft + activeWidth;
    const visibleShift = getVisibleShift();

    if (activeLeft < visibleShift) {
      shift -= Math.ceil((shift - activeLeft) / step) * step;
    } else if (activeRight > visibleShift + containerWidth) {
      shift += Math.ceil((activeRight - shift - containerWidth) / step) * step;
    } else if (direction > 0 && contentRight > visibleShift + containerWidth) {
      shift += step;
    } else if (direction < 0 && visibleShift > 0) {
      shift -= step;
    }

    shift = Math.min(Math.max(0, shift), Math.ceil(overflow / step) * step);
    applyShift();
  };

  const setActive = number => {
    const index = buttons.findIndex(button => button.dataset.paginationTarget === String(number));
    if (index < 0) return;

    const direction = activeIndex < 0 ? 0 : Math.sign(index - activeIndex);

    buttons.forEach((button, i) => button.classList.toggle('active', i === index));
    activeIndex = index;
    updateShift(direction);
  };

  const bindSwiper = () => {
    const swiper = getNamedSwiper(SLIDER_KEY);
    if (!swiper || swiper.destroyed || boundSwipers.has(swiper)) return swiper;

    swiper.on('slideChange', () => setActive(swiper.realIndex + 1));
    setActive(swiper.realIndex + 1);
    boundSwipers.add(swiper);

    return swiper;
  };

  bindSwiper();

  const onPointerDown = event => {
    if (drag.pointerId !== null) return;

    drag.suppressClick = false;

    if (!paginationEl.classList.contains('is-draggable')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.dx = 0;
    drag.isDragging = false;
  };

  const onPointerMove = event => {
    if (event.pointerId !== drag.pointerId) return;

    drag.dx = event.clientX - drag.startX;

    if (!drag.isDragging) {
      if (Math.abs(drag.dx) < DRAG_START_THRESHOLD) return;

      drag.isDragging = true;
      drag.suppressClick = true;
      scrollWrapper.setPointerCapture(event.pointerId);
      scrollWrapper.style.transition = 'none';
      paginationEl.classList.add('is-dragging');
      overflow = getOverflow(getGeometry());
      drag.startShift = getVisibleShift();
    }

    const maxShift = overflow;
    let value = drag.startShift - drag.dx;

    if (value < 0) value *= DRAG_EDGE_RESISTANCE;
    if (value > maxShift) value = maxShift + (value - maxShift) * DRAG_EDGE_RESISTANCE;

    setTranslate(value);
  };

  const onPointerUp = event => {
    if (event.pointerId !== drag.pointerId) return;

    const wasDragging = drag.isDragging;
    const isCancelled = event.type === 'pointercancel';

    drag.pointerId = null;
    drag.isDragging = false;

    if (!wasDragging) return;

    if (scrollWrapper.hasPointerCapture(event.pointerId)) scrollWrapper.releasePointerCapture(event.pointerId);
    scrollWrapper.style.transition = '';
    paginationEl.classList.remove('is-dragging');
    applyShift();

    if (isCancelled || Math.abs(drag.dx) < DRAG_SWIPE_THRESHOLD) return;

    const targetIndex = activeIndex + (drag.dx < 0 ? 1 : -1);
    if (targetIndex < 0 || targetIndex >= buttons.length) return;
    if (!bindSwiper()) return;

    goToSlide(buttons[targetIndex].dataset.paginationTarget, { key: SLIDER_KEY });
  };

  scrollWrapper.addEventListener('pointerdown', onPointerDown);

  scrollWrapper.addEventListener('pointermove', onPointerMove);

  scrollWrapper.addEventListener('pointerup', onPointerUp);

  scrollWrapper.addEventListener('pointercancel', onPointerUp);

  scrollWrapper.addEventListener('pointerleave', event => {
    if (event.pointerId === drag.pointerId && !drag.isDragging) drag.pointerId = null;
  });

  scrollWrapper.addEventListener('dragstart', event => event.preventDefault());

  paginationEl.addEventListener(
    'click',
    event => {
      if (!drag.suppressClick) return;
      drag.suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  paginationEl.addEventListener('click', event => {
    const button = event.target.closest('[data-pagination-target]');
    if (!button || !paginationEl.contains(button)) return;

    if (!bindSwiper()) return;

    goToSlide(button.dataset.paginationTarget, { key: SLIDER_KEY });
  });

  window.addEventListener(
    'resize',
    debounce(() => {
      shift = 0;
      updateShift();
    }, 300)
  );
};
