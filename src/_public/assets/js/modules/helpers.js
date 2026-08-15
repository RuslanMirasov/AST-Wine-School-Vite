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

    if (link.nextElementSibling && link.nextElementSibling.tagName === 'UL') {
      const spriteUrl = new URL('../../img/sprite.svg', import.meta.url).href;
      link.insertAdjacentHTML('beforeend', `<svg width="10" height="6"><use href="${spriteUrl}#arrow"></use></svg>`);
    }
  });
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
