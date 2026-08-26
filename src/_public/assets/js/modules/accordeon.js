const accordeons = document.querySelectorAll('[data-accordeon]');

const MOBIL_MAX_WIDTH = 767;
const TABLET_MAX_WIDTH = 1279;

const getOwnElement = (accordeon, selector) => {
  return Array.from(accordeon.querySelectorAll(selector)).find(el => el.closest('[data-accordeon]') === accordeon);
};

const canInitAccordeon = accordeon => {
  const mode = accordeon.dataset.init;

  if (mode === 'mobil') return window.innerWidth <= MOBIL_MAX_WIDTH;
  if (mode === 'tablet') return window.innerWidth <= TABLET_MAX_WIDTH;

  return true;
};

const isOpen = accordeon => accordeon.classList.contains('open');

const ACCORDEON_ANIMATION_DURATION = 500;

const waitForHeightTransition = element =>
  new Promise(resolve => {
    const handler = event => {
      if (event.propertyName !== 'height') return;
      element.removeEventListener('transitionend', handler);
      clearTimeout(timer);
      resolve();
    };
    element.addEventListener('transitionend', handler, { once: true });
    const timer = setTimeout(() => {
      element.removeEventListener('transitionend', handler);
      resolve();
    }, ACCORDEON_ANIMATION_DURATION + 50);
  });

const setAccordeonState = async (accordeon, open) => {
  const head = getOwnElement(accordeon, '[data-accordeon-head]');
  const body = getOwnElement(accordeon, '[data-accordeon-body]');
  const toggleButton = getOwnElement(accordeon, '[data-accordeon-head] button');
  if (!body) return;

  accordeon.classList.toggle('open', open);
  head?.classList.toggle('open', open);
  toggleButton?.setAttribute('aria-expanded', String(open));

  if (open) {
    body.style.display = ''; // снять display:none, иначе scrollHeight ниже вернёт 0
    void body.offsetHeight; // форс reflow перед стартом transition
    body.style.height = `${body.scrollHeight}px`;
    await waitForHeightTransition(body);
    // высота могла поменяться внутри (select, доп. контент) — фиксируем auto,
    // чтобы не резало содержимое, выросшее уже после открытия
    if (isOpen(accordeon)) {
      body.style.overflow = 'visible';
      body.style.height = 'auto';
    }
  } else {
    // если сейчас height:auto — сначала зафиксировать текущую высоту в px и форснуть
    // reflow, иначе анимация схлопывания не подхватится (transition не работает от auto)
    body.style.overflow = '';
    body.style.height = `${body.scrollHeight}px`;
    void body.offsetHeight;
    body.style.height = '0px';
    await waitForHeightTransition(body);
    // display:none только после анимации — раньше нечего было бы схлопывать.
    // Убирает закрытые пункты из Tab-порядка.
    if (!isOpen(accordeon)) body.style.display = 'none';
  }
};

const updateAccordeon = accordeon => {
  const body = getOwnElement(accordeon, '[data-accordeon-body]');
  const toggleButton = getOwnElement(accordeon, '[data-accordeon-head] button');
  if (!body) return;

  toggleButton?.setAttribute('aria-expanded', String(isOpen(accordeon)));

  if (!canInitAccordeon(accordeon)) {
    body.style.height = '';
    body.style.overflow = '';
    body.style.display = '';
    return;
  }

  if (isOpen(accordeon)) {
    body.style.display = '';
    body.style.overflow = 'visible';
    body.style.height = 'auto';
  } else {
    body.style.display = 'none';
    body.style.overflow = '';
    body.style.height = '0px';
  }
};

const toggleAccordeon = accordeon => {
  const open = !isOpen(accordeon);
  const group = accordeon.dataset.accordeonGroup;

  if (open && group) {
    accordeons.forEach(other => {
      if (other !== accordeon && other.dataset.accordeonGroup === group && isOpen(other)) {
        setAccordeonState(other, false);
      }
    });
  }

  setAccordeonState(accordeon, open);
};

export const initAccordeons = () => {
  if (!accordeons.length) return;

  accordeons.forEach(updateAccordeon);

  document.addEventListener('click', event => {
    const head = event.target.closest('[data-accordeon-head]');
    if (!head) return;

    const accordeon = head.closest('[data-accordeon]');
    if (!accordeon || !canInitAccordeon(accordeon)) return;

    toggleAccordeon(accordeon);
  });

  window.addEventListener('resize', () => {
    accordeons.forEach(updateAccordeon);
  });
};
