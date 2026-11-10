const AGE_CONFIRM_STORAGE_KEY = 'age-confirmed';

export const initAgeConfirmation = () => {
  const button = document.querySelector('[data-age-confirm]');

  if (localStorage.getItem(AGE_CONFIRM_STORAGE_KEY) !== 'true') {
    window.popup?.open('age-confirm');
  }

  button?.addEventListener('click', () => {
    localStorage.setItem(AGE_CONFIRM_STORAGE_KEY, 'true');
    window.popup?.close();
  });
};
