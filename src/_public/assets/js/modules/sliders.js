import { registerNamedSwiper } from './goToSlide.js';

const sliders = document.querySelectorAll('[data-slider]');
const instances = new WeakMap();

const toBool = s => String(s).toLowerCase() === 'true';
const toSwiperValue = value => {
  const normalizedValue = String(value).trim();
  return normalizedValue === 'auto' ? 'auto' : Number(normalizedValue);
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

const destroySlider = sliderWrapper => {
  const instance = instances.get(sliderWrapper);
  if (!instance) return;

  instance.destroy(true, true);
  instances.delete(sliderWrapper);
  unregisterNamedSwiper(getSliderKey(sliderWrapper));
};

const initSlider = sliderWrapper => {
  if (instances.has(sliderWrapper)) return;

  const swiper = getOwnElement(sliderWrapper, '.swiper');
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
        slidesPerView: toSwiperValue(slidesPerView.split(',')[2]),
        slidesPerGroup: Number(slidesPerGroup.split(',')[2]),
        spaceBetween: Number(spaceBetween.split(',')[2]),
        initialSlide: Number(initialSlide.split(',')[2]),
      },
      768: {
        slidesPerView: toSwiperValue(slidesPerView.split(',')[1]),
        slidesPerGroup: Number(slidesPerGroup.split(',')[1]),
        spaceBetween: Number(spaceBetween.split(',')[1]),
        initialSlide: Number(initialSlide.split(',')[1]),
      },
      1280: {
        slidesPerView: toSwiperValue(slidesPerView.split(',')[0]),
        slidesPerGroup: Number(slidesPerGroup.split(',')[0]),
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

  if (autoplay) {
    options.autoplay = {
      delay: autoplay,
      disableOnInteraction: false,
    };
  }

  if (pagination) {
    options.pagination = {
      el: pagination,
      clickable: true,
      dynamicBullets: true,
    };
  }

  const instance = new Swiper(swiper, options);
  instances.set(sliderWrapper, instance);
  instance.on('slideChange', () => updateAutoHeightParents(sliderWrapper));

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

export const initSliders = () => {
  if (sliders.length > 0) {
    sliders.forEach(updateSlider);
    window.addEventListener('resize', () => sliders.forEach(updateSlider));
  }
};
