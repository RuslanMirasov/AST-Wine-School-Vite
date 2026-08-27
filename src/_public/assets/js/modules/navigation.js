import { lockScroll, unlockScroll, FOCUSABLE_SELECTOR } from './popup.js';

const MENU_ANIMATION_DURATION = 500;
const MOBILE_MENU_QUERY = '(max-width: 1023px)';

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

const getMenuRootPath = menuLinks => {
  const paths = menuLinks.map(getLinkPath).filter(Boolean);
  if (!paths.length) return null;

  return paths.reduce((shortestPath, path) => {
    const shortestDepth = shortestPath.split('/').filter(Boolean).length;
    const pathDepth = path.split('/').filter(Boolean).length;

    return pathDepth < shortestDepth ? path : shortestPath;
  });
};

const isLinkActive = (link, currentPath, menuRootPath) => {
  const linkPath = getLinkPath(link);
  if (!linkPath) return false;

  if (linkPath === menuRootPath) return currentPath === linkPath;
  return currentPath === linkPath || currentPath.startsWith(linkPath + '/');
};

const setActiveMenuLinks = menuLinks => {
  const currentPath = normalizePath(window.location.pathname);
  const links = Array.from(menuLinks).filter(link => link instanceof HTMLAnchorElement);
  const menuRootPath = getMenuRootPath(links);

  links.forEach(link => {
    link.classList.toggle('active', isLinkActive(link, currentPath, menuRootPath));
  });

  document.querySelectorAll('[data-megamenu-button]').forEach(button => {
    const megaMenu = button.nextElementSibling;
    if (!megaMenu?.hasAttribute('data-megamenu')) return;

    const megaMenuLinks = Array.from(megaMenu.querySelectorAll('a[href]'));
    const hasActiveLink = megaMenuLinks.some(link => isLinkActive(link, currentPath, menuRootPath));
    button.classList.toggle('active', hasActiveLink);
  });
};

export const initNavigationMenu = () => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.navigation ');
  const menuLinks = document.querySelectorAll('.menu-link');
  const menuLinksA = document.querySelectorAll('a.menu-link');

  const isMobileMenu = () => window.matchMedia(MOBILE_MENU_QUERY).matches;

  const openMobileMenu = async () => {
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('popup-is-opened');
    lockScroll();

    menu.style.display = 'flex';
    void menu.offsetHeight; // форсируем reflow, иначе transition не подхватит смену display:none → flex
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

  window.addEventListener('resize', () => {
    if (isMobileMenu()) return;

    if (menu.classList.contains('open')) {
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('popup-is-opened');
      unlockScroll();
      menu.classList.remove('open');
    }
    menu.style.display = '';
  });

  menuLinks.forEach(link => {
    const menuItem = link.parentElement;
    const hasNestedContent = menuItem?.tagName === 'LI' && Array.from(menuItem.children).some(element => element !== link);

    if (hasNestedContent && !link.querySelector(':scope > svg')) {
      const spriteUrl = new URL('../../img/sprite.svg', import.meta.url).href;
      link.insertAdjacentHTML('beforeend', `<svg width="10" height="6"><use href="${spriteUrl}#arrow"></use></svg>`);
    }
  });

  setActiveMenuLinks(menuLinks);
};

export const initMegaMenu = () => {
  const items = Array.from(document.querySelectorAll('[data-megamenu-button]'))
    .map(button => ({ button, menu: button.nextElementSibling, wrapper: button.closest('li') }))
    .filter(({ menu }) => menu?.hasAttribute('data-megamenu'));

  if (!items.length) return;

  const closeMenu = async ({ button, menu }) => {
    menu.style.height = '0px';
    button.classList.remove('open');
    menu.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');

    await waitForTransition(menu, 'height');
    // display:none только после анимации и только если меню не открыли заново за это время —
    // убирает закрытую панель из Tab-порядка (Tab больше не проваливается внутрь).
    if (!menu.classList.contains('open')) menu.style.display = 'none';
  };

  const openMenu = ({ button, menu }) => {
    menu.style.display = 'block'; // CSS сам теперь display:none, сброс инлайна '' вернёт тот же none
    void menu.offsetHeight; // форс reflow перед стартом transition
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

    // Открытие теперь только явное (клик/Enter/Space на кнопке — нативно, т.к. это <button>).
    // Авто-открытие по фокусу больше не нужно: пока меню закрыто — оно display:none,
    // Tab физически не может попасть на скрытые ссылки, не нужно ничего "спасать".

    item.wrapper.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !item.menu.classList.contains('open')) return;
      closeMenu(item);
      item.button.focus();
    });
  });

  document.addEventListener('click', event => {
    items.forEach(item => {
      const isOutside = !item.menu.contains(event.target) && !item.button.contains(event.target);
      if (item.menu.classList.contains('open') && isOutside) closeMenu(item);
    });
  });

  // Фокус (любой — Tab, клик, программно) вне мега-меню закрывает все; фокус внутри
  // одного из них закрывает остальные, не трогая тот, где сейчас фокус.
  document.addEventListener('focusin', event => {
    // Клик по нефокусируемому месту роняет фокус на body — это не «уход», а служебный
    // фолбэк браузера; настоящий Tab-переход на body никогда не приземляется.
    if (event.target === document.body) return;
    const containingItem = items.find(item => item.wrapper.contains(event.target));
    items.filter(item => item !== containingItem).forEach(closeMenu);
  });
};
