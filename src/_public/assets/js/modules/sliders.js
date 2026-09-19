import { registerNamedSwiper } from './goToSlide.js';
import { debounce } from './helpers.js';

const sliders = document.querySelectorAll('[data-slider]');
const instances = new WeakMap();
const linkedSliders = new WeakSet();
const clickLinkedSliders = new WeakSet();

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

const destroySlider = sliderWrapper => {
  const instance = instances.get(sliderWrapper);
  if (!instance) return;

  instance.destroy(true, true);
  instances.delete(sliderWrapper);
  linkedSliders.delete(sliderWrapper);
  clickLinkedSliders.delete(sliderWrapper);
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
    spaceBetween = '0,0,0,0',
    slidesPerView = '1,1,1,1',
    slidesPerGroup = '1,1,1,1',
    loop = 'false',
    centered = false,
    centeredSlidesBounds = true,
    initialSlide = '0,0,0,0',
    direction = 'horizontal',
    allowTouchMove = 'true',
    autoHeight = 'false,false,false,false',
    slideToClickedSlide = 'false',
  } = sliderWrapper.dataset;

  const arrowPrev = getOwnElement(sliderWrapper, '[data-arrow-prev]');
  const arrowNext = getOwnElement(sliderWrapper, '[data-arrow-next]');
  const pagination = getOwnElement(sliderWrapper, '[data-pagination]');

  const options = {
    allowTouchMove: toBool(allowTouchMove),
    slideToClickedSlide: toBool(slideToClickedSlide),
    effect,
    speed,
    loop: toBool(loop),
    centeredSlides: toBool(centered),
    centeredSlidesBounds: toBool(centeredSlidesBounds),
    direction,
    breakpoints: {
      0: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[3])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[3])),
        spaceBetween: Number(spaceBetween.split(',')[3]),
        initialSlide: Number(initialSlide.split(',')[3]),
        autoHeight: toBool(autoHeight.split(',')[3]),
      },
      768: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[2])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[2])),
        spaceBetween: Number(spaceBetween.split(',')[2]),
        initialSlide: Number(initialSlide.split(',')[2]),
        autoHeight: toBool(autoHeight.split(',')[2]),
      },
      1280: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[1])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[1])),
        spaceBetween: Number(spaceBetween.split(',')[1]),
        initialSlide: Number(initialSlide.split(',')[1]),
        autoHeight: toBool(autoHeight.split(',')[1]),
      },
      1920: {
        slidesPerView: toSwiperValue(adjustForA11y(slidesPerView.split(',')[0])),
        slidesPerGroup: Number(adjustForA11y(slidesPerGroup.split(',')[0])),
        spaceBetween: Number(spaceBetween.split(',')[0]),
        initialSlide: Number(initialSlide.split(',')[0]),
        autoHeight: toBool(autoHeight.split(',')[0]),
      },
    },
  };

  if (arrowPrev && arrowNext) {
    options.navigation = {
      prevEl: arrowPrev,
      nextEl: arrowNext,
    };
  }

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

const setManualActiveSlide = (swiper, index) => {
  if (swiper.destroyed) return;
  swiper.slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
};

const linkControlledSliders = () => {
  sliders.forEach(sliderWrapper => {
    if (linkedSliders.has(sliderWrapper)) return;

    const controlsKeys = sliderWrapper.dataset.controls
      ?.split(',')
      .map(key => key.trim())
      .filter(Boolean);
    if (!controlsKeys?.length) return;

    const master = instances.get(sliderWrapper);
    if (!master) return;

    const followers = controlsKeys.map(key => window.swipers?.[key]).filter(Boolean);
    if (!followers.length) return;

    const needsManualActive = follower => follower.el.closest('.custom-pagination') !== null;

    followers.forEach(follower => {
      if (needsManualActive(follower)) setManualActiveSlide(follower, master.realIndex);
    });

    master.on('slideChange', () => {
      if (master.destroyed) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (master.destroyed) return;

          followers.forEach(follower => {
            if (follower.destroyed) return;
            if (needsManualActive(follower)) setManualActiveSlide(follower, master.realIndex);
            follower.params.loop ? follower.slideToLoop(master.realIndex) : follower.slideTo(master.realIndex);
          });
        });
      });
    });

    linkedSliders.add(sliderWrapper);
  });
};

const linkClickTargets = () => {
  sliders.forEach(sliderWrapper => {
    if (clickLinkedSliders.has(sliderWrapper)) return;

    const targetKey = sliderWrapper.dataset.clickTarget?.trim();
    if (!targetKey) return;

    const source = instances.get(sliderWrapper);
    const target = window.swipers?.[targetKey];
    if (!source || !target) return;

    source.on('click', () => {
      if (source.clickedIndex == null) return;
      target.params.loop ? target.slideToLoop(source.clickedIndex) : target.slideTo(source.clickedIndex);
    });

    clickLinkedSliders.add(sliderWrapper);
  });
};

export const updateSlidersAutoHeight = () => {
  sliders.forEach(sliderWrapper => {
    const instance = instances.get(sliderWrapper);
    if (!instance || instance.destroyed || !instance.params.autoHeight) return;

    instance.updateAutoHeight();
  });
};

export const reinitSlidersForA11y = () => {
  sliders.forEach(sliderWrapper => {
    if (!instances.has(sliderWrapper)) return;
    destroySlider(sliderWrapper);
    initSlider(sliderWrapper);
  });
  linkControlledSliders();
  linkClickTargets();
};

const handleResize = debounce(() => {
  sliders.forEach(updateSlider);
  linkControlledSliders();
  linkClickTargets();

  sliders.forEach(sliderWrapper => {
    const instance = instances.get(sliderWrapper);
    if (instance && !instance.destroyed) instance.update();
  });
}, 300);

export const initSliders = () => {
  if (sliders.length > 0) {
    sliders.forEach(updateSlider);
    linkControlledSliders();
    linkClickTargets();
    window.addEventListener('resize', handleResize);
  }
};
