export const initEventFilterSelection = () => {
  const form = document.getElementById('event-filter-form');
  if (!form) return;

  const buttons = Array.from(form.querySelectorAll('[data-filter-button]'));
  const indicator = document.querySelector('[data-filter-toggle-button]');
  const labels = new Map(buttons.map(button => [button, button.querySelector('[data-filter-text]').textContent.trim()]));
  const checkboxes = Array.from(form.elements).filter(input => input.type === 'checkbox');
  const filterNames = [...new Set(checkboxes.map(input => input.name))];
  const results = document.querySelector('[data-filter-results]');
  const cards = Array.from(results?.querySelectorAll('[data-event-type]') ?? []);
  const emptyState = document.querySelector('[data-filter-empty]');
  const sliderDays = new Map(
    Array.from(document.querySelectorAll('.calendar-slider-day[data-events]'), day => [day.querySelector('time').dateTime, day])
  );
  const days = Array.from(document.querySelectorAll('.calendar-day[data-events]'), day => ({
    count: day.dataset.events,
    element: day,
    sliderDay: sliderDays.get(day.querySelector('time').dateTime),
    events: Array.from(day.querySelectorAll('.calendar-day__events > li:not(.calendar-day__more)')),
    more: day.querySelector('.calendar-day__more'),
    link: day.querySelector('a'),
  }));
  const sliderCounts = new Map(Array.from(sliderDays.values(), day => [day, day.dataset.events]));
  const calendarLinks = Array.from(document.querySelectorAll('.events-calendar a, .calendar-slider-day a'), link => ({
    link,
    url: new URL(link.href),
  }));

  const render = params => {
    const selected = new Map();
    checkboxes.forEach(input => {
      input.checked = params.getAll(input.name).includes(input.value);
      if (!input.checked) return;

      const group = input.name.slice(0, -2);
      if (!selected.has(group)) selected.set(group, new Set());
      selected.get(group).add(input.value);
    });
    const activeFilters = Array.from(selected);
    const matches = item => activeFilters.every(([group, values]) => values.has(item.getAttribute('data-' + group)));

    buttons.forEach(button => {
      const options = document.getElementById(button.getAttribute('aria-controls'));
      const values = Array.from(options.querySelectorAll('input:checked'), input => input.nextElementSibling.textContent.trim());
      button.querySelector('[data-filter-text]').textContent = values.length ? values.join(', ') : labels.get(button);
      button.classList.toggle('checked', values.length > 0);
    });

    indicator.classList.toggle('active', selected.size > 0);

    calendarLinks.forEach(({ link, url }) => {
      const target = new URL(url);
      selected.forEach((values, group) => values.forEach(value => target.searchParams.append(`${group}[]`, value)));
      link.href = target.href;
    });

    days.forEach(({ count, element, sliderDay, events, more, link }) => {
      events.forEach(item => {
        item.hidden = !matches(item);
      });
      if (more) more.hidden = selected.size > 0;

      const visibleCount = selected.size ? events.filter(item => !item.hidden).length : count;
      element.dataset.events = visibleCount;
      element.classList.toggle('has-events', visibleCount > 0);
      if (!visibleCount) link.removeAttribute('href');

      if (sliderDay) {
        sliderDay.dataset.events = selected.size ? visibleCount : sliderCounts.get(sliderDay);
        sliderDay.classList.toggle('has-events', visibleCount > 0);
        sliderDay.querySelector('a').toggleAttribute('href', visibleCount > 0);
      }
    });

    cards.forEach(card => {
      card.hidden = !matches(card);
    });
    if (results) {
      results.hidden = cards.every(card => card.hidden);
      emptyState.hidden = !results.hidden;
    }
  };

  const apply = checked => {
    const url = new URL(window.location.href);
    filterNames.forEach(name => url.searchParams.delete(name));
    checked.forEach(input => {
      if (!url.searchParams.has(input.name, input.value)) url.searchParams.append(input.name, input.value);
    });
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    render(url.searchParams);
  };

  document.addEventListener('change', event => {
    const changed = event.target;
    if (changed.form !== form || changed.type !== 'checkbox') return;

    checkboxes.forEach(input => {
      if (input.name === changed.name && input.value === changed.value) input.checked = changed.checked;
    });
    apply(checkboxes.filter(input => input.checked));
  });

  form.addEventListener('reset', event => {
    event.preventDefault();
    apply([]);
  });

  const restore = () => render(new URLSearchParams(window.location.search));
  window.addEventListener('popstate', restore);
  restore();
};
