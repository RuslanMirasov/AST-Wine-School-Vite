const REGISTRY = (window.swipers ||= Object.create(null));

export function getNamedSwiper(key) {
  return REGISTRY[String(key || '').trim()] || null;
}

export function registerNamedSwiper(key, instance) {
  const name = String(key || '').trim();
  if (!name) return;
  REGISTRY[name] = instance;
}

function resolveIndex(swiper, target, base = 1) {
  const s = String(target).trim();
  const num = Number(s);
  if (s !== '' && Number.isFinite(num)) {
    return base === 1 ? num - 1 : num;
  }
  return Array.from(swiper.slides).findIndex(el => el.dataset.step === s);
}

export function goToSlide(target, { key, base = 1 } = {}) {
  const keys = Object.keys(REGISTRY);
  const swiper = key ? REGISTRY[key] : keys.length === 1 ? REGISTRY[keys[0]] : null;

  if (!swiper) {
    console.warn('[goToSlide] no swiper found. Pass { key } or name your data-slider.');
    return;
  }

  const idx = resolveIndex(swiper, target, base);
  if (idx < 0 || idx >= swiper.slides.length) {
    console.warn('[goToSlide] target not found:', target);
    return;
  }
  swiper.slideTo(idx);
}

export const initTabsSliderNavigation = name => {
  const buttons = document.querySelectorAll('#prizes [data-prizes-nav]');
  const swiper = window.swipers?.[name];

  if (!swiper || !buttons.length) return;

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.prizesNav);

      swiper.slideTo(index);

      buttons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
    });
  });
};

window.goToSlide = goToSlide;
window.registerNamedSwiper = registerNamedSwiper;
