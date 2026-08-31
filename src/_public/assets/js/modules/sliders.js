import { registerNamedSwiper } from './goToSlide.js';

const sliders = document.querySelectorAll('[data-slider]');
const instances = new WeakMap();
const customPaginationCleanups = new WeakMap();

const toBool = s => String(s).toLowerCase() === 'true';
const toSwiperValue = value => {
  const normalizedValue = String(value).trim();
  return normalizedValue === 'auto' ? 'auto' : Number(normalizedValue);
};

const isA11yEnabled = () => document.querySelector('.body')?.classList.contains('a11y') ?? false;

// В версии для слабовидящих (ГОСТ §8) каждый слайдер показывает на 1 слайд меньше — auto и 1 не трогаем.
const adjustForA11y = rawValue => {
  if (!isA11yEnabled()) return rawValue;

  const trimmed = String(rawValue).trim();
  if (trimmed === 'auto') return rawValue;

  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 1) return rawValue;

  return String(num - 1);
};

const getOwnElement = (sliderWrapper, selector) => {
  return Array.from(sliderWrapper.querySelectorAll(selector)).find(el => el.closest('[data-slider]') === sliderWrapper);
};

const getBreakpointIndex = () => {
  if (window.innerWidth >= 1280) return 0;
  if (window.innerWidth >= 768) return 1;
  return 2;
};

const canInitOnCurrentBreakpoint = sliderWrapper => {
  const rawBrakepoints = sliderWrapper.dataset.brakepoints || '1,1,1';
  const brakepoints = rawBrakepoints.split(',').map(value => value.trim());

  return brakepoints[getBreakpointIndex()] !== '0';
};

const getSliderKey = sliderWrapper => {
  const rawKey = sliderWrapper.getAttribute('data-slider');
  const key = rawKey && rawKey.trim();

  return key || null;
};

const unregisterNamedSwiper = key => {
  if (!key || !window.swipers) return;
  delete window.swipers[key];
};

const updateAutoHeightParents = sliderWrapper => {
  const parent = sliderWrapper.parentElement?.closest('[data-slider]');
  if (!parent) return;
  const instance = instances.get(parent);
  instance.updateAutoHeight(0);
};

const initCustomPagination = (sliderWrapper, instance) => {
  const pagination = getOwnElement(sliderWrapper, '.custom-pagination');
  if (!pagination) return;

  // data-index/active — на <li>, кликабельная кнопка — вложенный <button class="custom-pagination-item">
  const items = Array.from(pagination.querySelectorAll(':scope > li'));
  if (!items.length) return;

  const updateActiveItem = () => {
    items.forEach(item => {
      const isActive = Number(item.dataset.index) === instance.realIndex;
      item.classList.toggle('active', isActive);
      item.querySelector('.custom-pagination-item')?.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const activateItem = item => {
    const index = Number(item.dataset.index);
    if (!Number.isInteger(index) || index < 0) return;

    if (instance.params.loop) {
      instance.slideToLoop(index);
    } else {
      instance.slideTo(index);
    }
  };

  const handleClick = event => {
    const item = event.target.closest('.custom-pagination-item')?.closest('li');
    if (item && pagination.contains(item)) activateItem(item);
  };

  // role/tabindex/keydown больше не нужны — это настоящая <button>, клавиатура работает нативно
  pagination.addEventListener('click', handleClick);
  instance.on('realIndexChange', updateActiveItem);
  updateActiveItem();

  customPaginationCleanups.set(sliderWrapper, () => {
    pagination.removeEventListener('click', handleClick);
    instance.off('realIndexChange', updateActiveItem);
  });
};

const destroySlider = sliderWrapper => {
  const instance = instances.get(sliderWrapper);
  if (!instance) return;

  customPaginationCleanups.get(sliderWrapper)?.();
  customPaginationCleanups.delete(sliderWrapper);
  instance.destroy(true, true);
  instances.delete(sliderWrapper);
  unregisterNamedSwiper(getSliderKey(sliderWrapper));
};

const initSlider = sliderWrapper => {
  if (instances.has(sliderWrapper)) return;

  const swiper = sliderWrapper.classList.contains('swiper') ? sliderWrapper : getOwnElement(sliderWrapper, '.swiper');
  if (!swiper) return;

  const {
    autoplay = '',
    effect = 'slide',
    speed = '600',
    spaceBetween = '0,0,0',
    slidesPerView = '1,1,1',
    slidesPerGroup = '1,1,1',
    loop = false,
    centered = false,
    centeredSlidesBounds = true,
    initialSlide = '0,0,0',
    direction = 'horizontal',
    allowTouchMove = 'true',
    autoHeight = 'false',
  } = sliderWrapper.dataset;

  const arrowPrev = getOwnElement(sliderWrapper, '[data-arrow-prev]');
  const arrowNext = getOwnElement(sliderWrapper, '[data-arrow-next]');
  const pagination = getOwnElement(sliderWrapper, '[data-pagination]');

  const options = {
    allowTouchMove: toBool(allowTouchMove),
    autoHeight: toBool(autoHeight),
    effect,
    speed,
    loop,
    centeredSlides: toBool(centered),
    centeredSlidesBounds: toBool(centeredSlidesBounds),
    direction,
    breakpoints: {
      0: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[2])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[2])),
        spaceBetween: Number(spaceBetween.split(',')[2]),
        initialSlide: Number(initialSlide.split(',')[2]),
      },
      768: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[1])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[1])),
        spaceBetween: Number(spaceBetween.split(',')[1]),
        initialSlide: Number(initialSlide.split(',')[1]),
      },
      1280: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[0])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[0])),
        spaceBetween: Number(spaceBetween.split(',')[0]),
        initialSlide: Number(initialSlide.split(',')[0]),
      },
    },
  };

  if (arrowPrev && arrowNext) {
    options.navigation = {
      prevEl: arrowPrev,
      nextEl: arrowNext,
    };
  }

  // Автопрокрутка отключена в режиме для слабовидящих (ГОСТ §8) — reinitSlidersForA11y
  // пересоздаёт слайдер при переключении режима, чтобы подхватить актуальное состояние.
  if (autoplay && !isA11yEnabled()) {
    options.autoplay = {
      delay: autoplay,
      disableOnInteraction: false,
    };
  }

  if (pagination) {
    const paginationType = sliderWrapper.dataset.paginationType || 'bullets';

    options.pagination = {
      el: pagination,
      type: paginationType,
      clickable: true,
      dynamicBullets: paginationType === 'bullets',
    };
  }

  const instance = new Swiper(swiper, options);
  instances.set(sliderWrapper, instance);
  instance.on('slideChange', () => {
    updateAutoHeightParents(sliderWrapper);
  });
  initCustomPagination(sliderWrapper, instance);

  const key = getSliderKey(sliderWrapper);
  if (key) {
    registerNamedSwiper(key, instance);
  }
};

const updateSlider = sliderWrapper => {
  if (canInitOnCurrentBreakpoint(sliderWrapper)) {
    initSlider(sliderWrapper);
  } else {
    destroySlider(sliderWrapper);
  }
};

const linkControlledSliders = () => {
  sliders.forEach(sliderWrapper => {
    const controlsKey = sliderWrapper.dataset.controls;
    if (!controlsKey) return;

    const master = instances.get(sliderWrapper);
    const slave = window.swipers?.[controlsKey];
    if (!master || !slave) return;

    master.controller.control = slave;
  });
};

// Пересоздаёт все уже инициализированные слайдеры — нужно и для autoplay, и для
// slidesPerView/slidesPerGroup, которые тоже зависят от isA11yEnabled().
export const reinitSlidersForA11y = () => {
  sliders.forEach(sliderWrapper => {
    if (!instances.has(sliderWrapper)) return;
    destroySlider(sliderWrapper);
    initSlider(sliderWrapper);
  });
  linkControlledSliders();
};

export const initSliders = () => {
  if (sliders.length > 0) {
    sliders.forEach(updateSlider);
    linkControlledSliders();
    window.addEventListener('resize', () => {
      sliders.forEach(updateSlider);
      linkControlledSliders();
    });
  }
};
