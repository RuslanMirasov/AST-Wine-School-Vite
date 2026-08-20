const COOKIE_CONFIRM_STORAGE_KEY = 'cookie-confirmed';

export const initCookieConfirmation = () => {
  const cookiePopupEl = document.querySelector('[data-cookie-popup]');
  const cookieConfirmButton = document.querySelector('[data-cookie-confirm]');

  if (!cookiePopupEl || !cookieConfirmButton) return;

  if (localStorage.getItem(COOKIE_CONFIRM_STORAGE_KEY) === 'true') {
    cookiePopupEl.remove();
    return;
  }

  cookiePopupEl.classList.add('active');

  cookieConfirmButton.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CONFIRM_STORAGE_KEY, 'true');
    cookiePopupEl.classList.remove('active');

    setTimeout(() => {
      cookiePopupEl.remove();
    }, 1000);
  });
};
