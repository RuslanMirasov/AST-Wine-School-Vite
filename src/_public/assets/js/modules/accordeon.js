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

const setAccordeonState = (accordeon, open) => {
  const head = getOwnElement(accordeon, '[data-accordeon-head]');
  const body = getOwnElement(accordeon, '[data-accordeon-body]');
  if (!body) return;

  accordeon.classList.toggle('open', open);
  head?.classList.toggle('open', open);
  body.style.height = open ? `${body.scrollHeight}px` : '0px';
};

const updateAccordeon = accordeon => {
  const body = getOwnElement(accordeon, '[data-accordeon-body]');
  if (!body) return;

  if (!canInitAccordeon(accordeon)) {
    body.style.height = '';
    return;
  }

  body.style.height = isOpen(accordeon) ? `${body.scrollHeight}px` : '0px';
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
