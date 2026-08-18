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

  // The shortest internal menu URL is the site root, including deployments
  // in a hosting subfolder. It must only match exactly; section URLs may
  // also match their nested pages.
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
};

export const initNavigationMenu = () => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.navigation ');
  const menuLinks = document.querySelectorAll('.menu-link');

  const toggleMenu = () => {
    burger.classList.toggle('open');
    menu.classList.toggle('open');
  };

  if (burger) burger.addEventListener('click', toggleMenu);
  menuLinks.forEach(link => {
    link.addEventListener('click', toggleMenu);

    const menuItem = link.parentElement;
    const hasNestedContent =
      menuItem?.tagName === 'LI' && Array.from(menuItem.children).some(element => element !== link);

    if (hasNestedContent && !link.querySelector(':scope > svg')) {
      const spriteUrl = new URL('../../img/sprite.svg', import.meta.url).href;
      link.insertAdjacentHTML('beforeend', `<svg width="10" height="6"><use href="${spriteUrl}#arrow"></use></svg>`);
    }
  });

  setActiveMenuLinks(menuLinks);
};

export const hidePreloader = () => {
  const preloader = document.querySelector('[data-preloader]');
  const body = document.querySelector('.body');

  if (!preloader || !body) return;

  setTimeout(() => {
    preloader.classList.add('hidden');
  }, 100);

  setTimeout(() => {
    body.classList.add('loaded');
  }, 200);
};
