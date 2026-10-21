// Подсветка ссылки на текущую страницу во всех меню сайта: шапка (с мега-меню), меню «Сведения»
// (.info-menu), меню личного кабинета (.profile-menu-link). Ссылке ставится класс active,
// кнопке-стрелке мега-меню — тоже active, если внутри него есть ссылка на текущую страницу.
// На Битриксе модуль отключается (убрать вызов в scripts.js): активный пункт отдаёт компонент меню
const LINKS_SELECTOR = '.menu-link, .info-menu a, .profile-menu-link';
const MEGAMENU_BUTTON_SELECTOR = '[data-megamenu-button]';
const ACTIVE_CLASS = 'active';

const normalizePath = path => path.replace(/\/$/, '') || '/';

const getLinkPath = link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || link.origin !== window.location.origin) return null;

  return normalizePath(link.pathname);
};

// Главная ('/') подсвечивается только на самой себе: '/' + '/' = '//', с него не начинается ни один путь.
// Ссылки с [data-exact] подсвечиваются только при точном совпадении пути (корень раздела, напр. /profile).
const isLinkActive = (link, currentPath) => {
  const linkPath = getLinkPath(link);
  if (!linkPath) return false;
  if (link.hasAttribute('data-exact')) return currentPath === linkPath;

  return currentPath === linkPath || currentPath.startsWith(linkPath + '/');
};

export const initActiveLinks = () => {
  const currentPath = normalizePath(window.location.pathname);
  const links = Array.from(document.querySelectorAll(LINKS_SELECTOR)).filter(link => link instanceof HTMLAnchorElement);

  links.forEach(link => {
    link.classList.toggle(ACTIVE_CLASS, isLinkActive(link, currentPath));
  });

  document.querySelectorAll(MEGAMENU_BUTTON_SELECTOR).forEach(button => {
    const megaMenu = button.closest('.have-submenu')?.querySelector('[data-megamenu]');
    if (!megaMenu) return;

    const megaMenuLinks = Array.from(megaMenu.querySelectorAll('a[href]'));
    button.classList.toggle(ACTIVE_CLASS, megaMenuLinks.some(link => isLinkActive(link, currentPath)));
  });
};
