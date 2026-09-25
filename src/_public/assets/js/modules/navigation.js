import { lockScroll, unlockScroll, FOCUSABLE_SELECTOR } from './popup.js';
import { debounce } from './helpers.js';

const MENU_ANIMATION_DURATION = 500;

const waitForTransition = (element, propertyName) =>
  new Promise(resolve => {
    const handler = event => {
      if (event.propertyName !== propertyName) return;
      element.removeEventListener('transitionend', handler);
      clearTimeout(timer);
      resolve();
    };

    element.addEventListener('transitionend', handler, { once: true });
    const timer = setTimeout(() => {
      element.removeEventListener('transitionend', handler);
      resolve();
    }, MENU_ANIMATION_DURATION + 50);
  });

const getFocusable = container => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => el.offsetParent !== null);

const normalizePath = path => path.replace(/\/$/, '') || '/';

const getLinkPath = link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || link.origin !== window.location.origin) return null;

  return normalizePath(link.pathname);
};

// Главная ('/') подсвечивается только на самой себе: '/' + '/' = '//', с него не начинается ни один путь.
const isLinkActive = (link, currentPath) => {
  const linkPath = getLinkPath(link);
  if (!linkPath) return false;

  return currentPath === linkPath || currentPath.startsWith(linkPath + '/');
};

const setActiveMenuLinks = menuLinks => {
  const currentPath = normalizePath(window.location.pathname);
  const links = Array.from(menuLinks).filter(link => link instanceof HTMLAnchorElement);

  links.forEach(link => {
    link.classList.toggle('active', isLinkActive(link, currentPath));
  });

  document.querySelectorAll('[data-megamenu-button]').forEach(button => {
    const megaMenu = button.closest('.have-submenu')?.querySelector('[data-megamenu]');
    if (!megaMenu) return;

    const megaMenuLinks = Array.from(megaMenu.querySelectorAll('a[href]'));
    const hasActiveLink = megaMenuLinks.some(link => isLinkActive(link, currentPath));
    button.classList.toggle('active', hasActiveLink);
  });
};

export const initNavigationMenu = () => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.navigation ');
  const menuLinks = document.querySelectorAll('.menu-link');
  const menuLinksA = document.querySelectorAll('a.menu-link');

  const isMobileMenu = () => {
    return window.matchMedia(`(max-width: 1279px)`).matches;
  };

  const openMobileMenu = async () => {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('popup-is-opened');
    lockScroll();

    menu.style.display = 'flex';
    void menu.offsetHeight;
    menu.classList.add('open');

    await waitForTransition(menu, 'transform');
    if (menu.classList.contains('open')) getFocusable(menu)[0]?.focus();
  };

  const closeMobileMenu = async () => {
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('popup-is-opened');
    unlockScroll();

    menu.classList.remove('open');
    await waitForTransition(menu, 'transform');
    if (!menu.classList.contains('open')) {
      menu.style.display = 'none';
      burger.focus();
    }
  };

  const toggleMenu = () => {
    if (!isMobileMenu()) return;
    if (menu.classList.contains('open')) closeMobileMenu();
    else openMobileMenu();
  };

  if (burger) burger.addEventListener('click', toggleMenu);

  menuLinksA.forEach(link => {
    link.addEventListener('click', () => {
      if (isMobileMenu() && menu.classList.contains('open')) closeMobileMenu();
    });
  });

  document.addEventListener('keydown', event => {
    if (!isMobileMenu() || !menu.classList.contains('open')) return;

    if (event.key === 'Escape') {
      closeMobileMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusable(menu);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener(
    'resize',
    debounce(() => {
      if (isMobileMenu()) return;

      if (menu.classList.contains('open')) {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('popup-is-opened');
        unlockScroll();
        menu.classList.remove('open');
      }
      menu.style.display = '';
    }, 300)
  );

  setActiveMenuLinks(menuLinks);
};

export const initMegaMenu = () => {
  const items = Array.from(document.querySelectorAll('[data-megamenu-button]'))
    .map(button => {
      const wrapper = button.closest('.have-submenu');
      return { button, menu: wrapper?.querySelector('[data-megamenu]'), wrapper };
    })
    .filter(({ menu }) => menu);

  if (!items.length) return;

  const closeMenu = async ({ button, menu }) => {
    menu.style.height = '0px';
    button.classList.remove('open');
    menu.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');

    await waitForTransition(menu, 'height');
    if (!menu.classList.contains('open')) menu.style.display = 'none';
  };

  const openMenu = ({ button, menu }) => {
    menu.style.display = 'flex';
    void menu.offsetHeight;
    menu.style.height = `${menu.scrollHeight}px`;
    button.classList.add('open');
    menu.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
  };

  items.forEach(item => {
    item.button.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = item.menu.classList.contains('open');

      items.forEach(closeMenu);
      if (!isOpen) openMenu(item);
    });

    item.wrapper.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !item.menu.classList.contains('open')) return;
      closeMenu(item);
      item.button.focus();
    });
  });

  // click срабатывает и когда кнопку зажали внутри меню, а отпустили снаружи (target — общий предок),
  // поэтому снаружи должны быть оба конца: и pointerdown, и click. У клавиатурного click pointerdown нет.
  let pointerDownTarget = null;
  document.addEventListener('pointerdown', event => {
    pointerDownTarget = event.target;
  });

  document.addEventListener('click', event => {
    const startTarget = pointerDownTarget ?? event.target;
    pointerDownTarget = null;

    items.forEach(item => {
      const isInside = target => item.menu.contains(target) || item.button.contains(target);
      const isOutside = !isInside(startTarget) && !isInside(event.target);
      if (item.menu.classList.contains('open') && isOutside) closeMenu(item);
    });
  });

  document.addEventListener('focusin', event => {
    if (event.target === document.body) return;
    const containingItem = items.find(item => item.wrapper.contains(event.target));
    items.filter(item => item !== containingItem).forEach(closeMenu);
  });
};
