import { getNamedSwiper, goToSlide } from './goToSlide.js';
import { debounce } from './helpers.js';

const SLIDER_KEY = 'hero-text-swiper';
// Сдвиг пальцем/мышью, после которого жест считается перетаскиванием, а не кликом.
const DRAG_START_THRESHOLD = 5;
// Сдвиг, после которого при отпускании листаем на шаг; меньше — возвращаемся на место.
const DRAG_SWIPE_THRESHOLD = 30;
// Сопротивление при перетаскивании за крайние позиции, как у Swiper.
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

  // Ширина кнопок анимируется (transition: width), поэтому реальные кнопки в момент
  // переключения имеют промежуточную ширину. Итоговые размеры меряем на скрытых клонах.
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

  // Все кнопки, кроме активной, неактивные — поэтому и позиция, и шаг считаются по их ширине.
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

  // Насколько лента шире контейнера — дальше этого сдвигать нельзя, иначе справа останется пустое место.
  const getOverflow = ({ contentRight, containerWidth }) => Math.max(0, contentRight - containerWidth);

  // Сдвиг ведём по сетке шагов (shift), а на экран выводим не дальше overflow (visibleShift).
  // Так последняя позиция прижимается к правому краю, а при движении назад лента
  // возвращается на сетку и шаги снова ровные.
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

  // Во время перетаскивания позицию ведёт палец/мышь — сдвиг применится при отпускании.
  const applyShift = () => {
    if (!drag.isDragging) setTranslate(getVisibleShift());
  };

  const updateDraggable = () => {
    paginationEl.classList.toggle('is-draggable', overflow > 0);
  };

  // 1) Если активная кнопка вылезает за край data-hero-pagination, сдвигаем ленту
  //    столько шагов, сколько нужно, чтобы она стала видна целиком.
  // 2) Иначе, если по направлению переключения за краем осталась хоть одна кнопка
  //    (целиком или частично) — сдвигаем на один шаг в эту сторону.
  // Шаг — ширина неактивной кнопки + gap; последний сдвиг вправо — ровно до края (см. getVisibleShift).
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

    // Сетку не уводим дальше первого шага, который уже покрывает overflow.
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

  // Слайдер пересоздаётся (версия для слабовидящих, смена брейкпоинта) — вешаем обработчик
  // на каждый новый инстанс один раз.
  const bindSwiper = () => {
    const swiper = getNamedSwiper(SLIDER_KEY);
    if (!swiper || swiper.destroyed || boundSwipers.has(swiper)) return swiper;

    swiper.on('slideChange', () => setActive(swiper.realIndex + 1));
    setActive(swiper.realIndex + 1);
    boundSwipers.add(swiper);

    return swiper;
  };

  bindSwiper();

  // Drag: тянем ленту за пальцем/мышью без transition, при отпускании
  // переключаем слайдер на один слайд вперёд/назад (или возвращаемся) уже с transition.
  const onPointerDown = event => {
    if (drag.pointerId !== null) return;

    // Новый жест — прошлый «гасить клик» больше не актуален (например, после pointercancel клика не было).
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

      // Захват ставим только когда жест уже стал перетаскиванием — иначе обычный клик
      // по кнопке ушёл бы на scrollWrapper, а не на саму кнопку.
      drag.isDragging = true;
      drag.suppressClick = true;
      scrollWrapper.setPointerCapture(event.pointerId);
      scrollWrapper.style.transition = 'none';
      paginationEl.classList.add('is-dragging');
      // Меряем один раз на жест, а не на каждый pointermove — measure() создаёт клоны.
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

    // Возвращаем ленту на текущий сдвиг — если ниже переключится слайд,
    // setActive → updateShift сам сдвинет её на шаг в нужную сторону.
    applyShift();

    if (isCancelled || Math.abs(drag.dx) < DRAG_SWIPE_THRESHOLD) return;

    // Тянем влево — следующий слайд, вправо — предыдущий. Без зацикливания: на краях просто возврат.
    const targetIndex = activeIndex + (drag.dx < 0 ? 1 : -1);
    if (targetIndex < 0 || targetIndex >= buttons.length) return;
    if (!bindSwiper()) return;

    goToSlide(buttons[targetIndex].dataset.paginationTarget, { key: SLIDER_KEY });
  };

  scrollWrapper.addEventListener('pointerdown', onPointerDown);
  scrollWrapper.addEventListener('pointermove', onPointerMove);
  scrollWrapper.addEventListener('pointerup', onPointerUp);
  scrollWrapper.addEventListener('pointercancel', onPointerUp);

  // Мышь ушла с ленты, не успев начать перетаскивание (захвата ещё нет, pointerup сюда
  // уже не придёт) — сбрасываем, иначе следующий pointerdown будет проигнорирован.
  scrollWrapper.addEventListener('pointerleave', event => {
    if (event.pointerId === drag.pointerId && !drag.isDragging) drag.pointerId = null;
  });

  // Браузерный drag картинок и ссылок перебивает pointer-события.
  scrollWrapper.addEventListener('dragstart', event => event.preventDefault());

  // После перетаскивания браузер всё равно шлёт click — гасим его, чтобы не переключить слайд.
  paginationEl.addEventListener(
    'click',
    event => {
      if (!drag.suppressClick) return;
      drag.suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  paginationEl.addEventListener('click', event => {
    const button = event.target.closest('[data-pagination-target]');
    if (!button || !paginationEl.contains(button)) return;

    if (!bindSwiper()) return;

    goToSlide(button.dataset.paginationTarget, { key: SLIDER_KEY });
  });

  // На другом брейкпоинте другие ширины кнопок — пересчитываем сдвиг с нуля.
  window.addEventListener(
    'resize',
    debounce(() => {
      shift = 0;
      updateShift();
    }, 300),
  );
};
