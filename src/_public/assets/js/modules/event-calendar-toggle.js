export const initEventCalendarToggle = () => {
  const button = document.querySelector('.calendar-slider__toggle');
  if (!button) return;

  const calendar = document.getElementById(button.getAttribute('aria-controls'));
  if (!calendar) return;

  const slider = button.parentElement;
  const sliderDays = button.nextElementSibling;
  const monthNavigation = calendar.querySelector('.events-calendar__nav');

  button.addEventListener('click', () => {
    const expanded = calendar.hidden;
    const restoreFocus = document.activeElement === button;
    const nextPosition = expanded ? monthNavigation : sliderDays;
    nextPosition.before(button);

    slider.hidden = expanded;
    calendar.hidden = !expanded;
    button.setAttribute('aria-expanded', String(expanded));

    if (restoreFocus) button.focus({ preventScroll: true });
  });
};
