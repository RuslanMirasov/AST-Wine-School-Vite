import { lockScroll, unlockScroll } from './popup.js';

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

  const toggleMenu = () => {
    burger.classList.toggle('open');
    const isOpen = menu.classList.toggle('open');
    document.body.classList.toggle('popup-is-opened', isOpen);

    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
  };

  if (burger) burger.addEventListener('click', toggleMenu);

  menuLinksA.forEach(link => {
    link.addEventListener('click', toggleMenu);
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
    .map(button => ({ button, menu: button.nextElementSibling }))
    .filter(({ menu }) => menu?.hasAttribute('data-megamenu'));

  if (!items.length) return;

  const closeMenu = ({ button, menu }) => {
    menu.style.height = '0px';
    button.classList.remove('open');
    menu.classList.remove('open');
  };

  const openMenu = ({ button, menu }) => {
    menu.style.height = `${menu.scrollHeight}px`;
    button.classList.add('open');
    menu.classList.add('open');
  };

  items.forEach(item => {
    item.button.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = item.menu.classList.contains('open');

      items.forEach(closeMenu);
      if (!isOpen) openMenu(item);
    });
  });

  document.addEventListener('click', event => {
    items.forEach(item => {
      const isOutside = !item.menu.contains(event.target) && !item.button.contains(event.target);
      if (item.menu.classList.contains('open') && isOutside) closeMenu(item);
    });
  });
};
