const API_URL = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
const MARKERS_URL = new URL('../../json/markers.json', import.meta.url).href;
const PIN_IMAGE = new URL('../../img/pin.webp', import.meta.url).href;
const PIN_SIZE = [36, 50];
const PIN_OFFSET = [-18, -50];

const ALL_GROUP = 'all';
const DEFAULT_CENTER = [37.617635, 55.755814];
const DEFAULT_ZOOM = 10;
const POINT_ZOOM = 16;
const BOUNDS_MARGIN = 60;
const MAP_ANIMATION_DURATION = 500;
const BUTTONS_SELECTOR = '[data-map-group], [data-map-point]';

let mapElement = null;
let toggleButton = null;
let map = null;
let collection = null;
let points = [];
let mapPromise = null;
let currentFilter = { group: ALL_GROUP };

const escapeHtml = value => {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
};

const isOpen = () => mapElement.classList.contains('active');

const waitForHeightTransition = element =>
  new Promise(resolve => {
    const handler = event => {
      if (event.target !== element || event.propertyName !== 'height') return;
      element.removeEventListener('transitionend', handler);
      clearTimeout(timer);
      resolve();
    };
    element.addEventListener('transitionend', handler);
    const timer = setTimeout(() => {
      element.removeEventListener('transitionend', handler);
      resolve();
    }, MAP_ANIMATION_DURATION + 50);
  });

const loadApi = () =>
  new Promise((resolve, reject) => {
    if (window.ymaps) {
      window.ymaps.ready(() => resolve(window.ymaps));
      return;
    }

    const apiKey = mapElement.dataset.mapKey;
    const script = document.createElement('script');
    script.src = apiKey ? `${API_URL}&apikey=${encodeURIComponent(apiKey)}` : API_URL;
    script.async = true;
    script.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    script.onerror = () => reject(new Error('Не удалось загрузить API Яндекс Карт'));
    document.head.append(script);
  });

const loadPoints = async () => {
  const response = await fetch(mapElement.dataset.mapSrc || MARKERS_URL);

  if (!response.ok) throw new Error(`Не удалось загрузить метки: ${response.status}`);

  const data = await response.json();

  return (data.points || []).filter(point => Array.isArray(point.coordinates) && point.coordinates.length === 2);
};

const createMap = async () => {
  const [ymaps, loadedPoints] = await Promise.all([loadApi(), loadPoints()]);

  const toApiOrder = ([longitude, latitude]) => (ymaps.meta.coordinatesOrder === 'longlat' ? [longitude, latitude] : [latitude, longitude]);

  points = loadedPoints.map(point => ({ ...point, coordinates: toApiOrder(point.coordinates) }));
  mapElement.textContent = '';

  map = new ymaps.Map(
    mapElement,
    { center: points[0]?.coordinates || toApiOrder(DEFAULT_CENTER), zoom: DEFAULT_ZOOM, controls: [] },
    { suppressMapOpenBlock: true }
  );

  collection = new ymaps.GeoObjectCollection();
  map.geoObjects.add(collection);
};

const ensureMap = () => {
  if (!mapPromise) {
    mapPromise = createMap().catch(error => {
      mapPromise = null;
      throw error;
    });
  }

  return mapPromise;
};

const getVisiblePoints = () => {
  if (currentFilter.point !== undefined) return points.filter(point => String(point.id) === currentFilter.point);
  if (currentFilter.group === ALL_GROUP) return points;

  return points.filter(point => point.category === currentFilter.group);
};

const createPlacemark = point => {
  const link = point.url ? `<a href="${escapeHtml(point.url)}" target="_blank" rel="noopener noreferrer">Открыть в Яндекс Картах</a>` : '';

  return new window.ymaps.Placemark(
    point.coordinates,
    {
      hintContent: escapeHtml(point.title),
      balloonContentHeader: escapeHtml(point.title),
      balloonContentBody: escapeHtml(point.description),
      balloonContentFooter: link,
    },
    {
      iconLayout: 'default#image',
      iconImageHref: PIN_IMAGE,
      iconImageSize: PIN_SIZE,
      iconImageOffset: PIN_OFFSET,
    }
  );
};

const renderPoints = () => {
  if (!map || !isOpen()) return;

  const visiblePoints = getVisiblePoints();
  const placemarks = visiblePoints.map(createPlacemark);

  map.balloon.close();
  collection.removeAll();
  placemarks.forEach(placemark => collection.add(placemark));
  map.container.fitToViewport();

  if (placemarks.length === 0) return;

  if (placemarks.length === 1) {
    map.setCenter(visiblePoints[0].coordinates, POINT_ZOOM);
    if (currentFilter.point !== undefined) placemarks[0].balloon.open();
    return;
  }

  map.setBounds(collection.getBounds(), { checkZoomRange: true, zoomMargin: BOUNDS_MARGIN });
};

const setOpenState = open => {
  if (isOpen() === open) return Promise.resolve();

  mapElement.classList.toggle('active', open);

  if (toggleButton) {
    const label = toggleButton.querySelector('span') || toggleButton;
    const nextText = toggleButton.dataset.toggleText;

    toggleButton.dataset.toggleText = label.textContent;
    label.textContent = nextText;
    toggleButton.setAttribute('aria-expanded', String(open));
  }

  return waitForHeightTransition(mapElement);
};

const setActiveButton = () => {
  document.querySelectorAll(BUTTONS_SELECTOR).forEach(button => {
    const isActive =
      currentFilter.point !== undefined ? button.dataset.mapPoint === currentFilter.point : button.dataset.mapGroup === currentFilter.group;

    button.classList.toggle('active', isActive);
  });
};

export const openMap = async () => {
  if (!mapElement) return;

  try {
    await setOpenState(true);
    await ensureMap();
    renderPoints();
  } catch (error) {
    console.error(error);
  }
};

export const closeMap = () => {
  if (!mapElement) return;

  setOpenState(false);
};

export const showMapGroup = (group = ALL_GROUP) => {
  if (!mapElement) return;

  currentFilter = { group: String(group) };
  setActiveButton();

  return openMap();
};

export const showMapPoint = id => {
  if (!mapElement || id === undefined || id === null) return;

  currentFilter = { point: String(id) };
  setActiveButton();

  return openMap();
};

export const initYandexMap = () => {
  mapElement = document.querySelector('[data-map]');

  if (!mapElement) return;

  const wrapper = mapElement.parentElement;

  toggleButton = wrapper.querySelector('[data-map-toggle]');
  toggleButton?.setAttribute('aria-expanded', String(isOpen()));
  toggleButton?.addEventListener('click', () => (isOpen() ? closeMap() : openMap()));

  document.addEventListener('click', event => {
    const button = event.target.closest(BUTTONS_SELECTOR);
    if (!button) return;

    event.preventDefault();

    if (button.dataset.mapPoint !== undefined) {
      showMapPoint(button.dataset.mapPoint);
    } else {
      showMapGroup(button.dataset.mapGroup);
    }

    if (!wrapper.contains(button)) wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  if (isOpen()) openMap();
};

if (typeof window !== 'undefined') {
  window.showMapGroup = showMapGroup;
  window.showMapPoint = showMapPoint;
}
