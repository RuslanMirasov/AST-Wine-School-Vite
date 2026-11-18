export const initEventCalendarToggle = () => {
  const button = document.querySelector('.calendar-slider__toggle');
  if (!button) return;

  const calendar = document.getElementById(button.getAttribute('aria-controls'));
  if (!calendar) return;

  button.addEventListener('click', () => {
    const expanded = calendar.hidden;
    calendar.hidden = !expanded;
    button.setAttribute('aria-expanded', String(expanded));
  });
};
