// Галереи картинок на SimpleLightbox: крестик, стрелки, свайпы, клавиатура. Подписи отключены.
// Разметка: блок с data-gallery, внутри картинки с data-source (адрес большой версии). Картинки без data-source
// в галерею не попадают (видео-слайды, декор). Обработчик один — на document, набор картинок собирается
// в момент клика, поэтому картинки, подгруженные позже (Битрикс: AJAX, «Показать ещё»), работают без переинициализации.
// Библиотека (скрипт и стили) загружается с CDN при первом открытии — на страницах без галерей её нет
const PLUGIN_VERSION = '2.14.3';
const PLUGIN_URL = `https://cdn.jsdelivr.net/npm/simplelightbox@${PLUGIN_VERSION}/dist/simple-lightbox.min.js`;
const STYLES_URL = `https://cdn.jsdelivr.net/npm/simplelightbox@${PLUGIN_VERSION}/dist/simple-lightbox.min.css`;

const GALLERY_SELECTOR = '[data-gallery]';
const SOURCE_ATTRIBUTE = 'data-source';
const ITEM_SELECTOR = `[${SOURCE_ATTRIBUTE}]`;

// Иконки из нашего спрайта: стрелки — как у слайдеров, крестик — как у попапов. Путь считается от самого модуля:
// сайт может лежать в подпапке. Стили — в scss/components/_gallery-lightbox.scss
const SPRITE_URL = new URL('../../img/sprite.svg', import.meta.url).href;
const icon = id => `<svg aria-hidden="true"><use href="${SPRITE_URL}#${id}"></use></svg>`;

const LIGHTBOX_OPTIONS = {
  sourceAttr: SOURCE_ATTRIBUTE,
  // Класс обёртки — по нему наши стили перекрывают стандартные стили библиотеки
  className: 'gallery-lightbox',
  closeText: icon('close'),
  navText: [icon('arrow-accordeon'), icon('arrow-accordeon')],
  // Фон затемнения задаётся цветом с прозрачностью в стилях, сам слой непрозрачный
  overlayOpacity: 1,
  captions: false,
  // Адреса картинок из Битрикса могут быть без расширения — тип файла не проверяем
  fileExt: false,
  // Без изменения адреса страницы (#pid=…) при открытии
  history: false,
  // Повторы не выкидываем: иначе картинка-повтор не попадает в набор и по клику на неё галерея не открывается
  uniqueImages: false,
};

// Картинка не заходит под стрелки и верхнюю строку (счётчик, крестик): с каждой стороны оставляем отступ от края
// + размер кнопки + зазор. Отступ и размер кнопки — CSS-переменные из _gallery-lightbox.scss, чтобы держать их в одном месте
const CONTROLS_GAP = 8;
// Стандартные доли экрана у библиотеки — больше картинка не становится и на широких экранах
const MAX_WIDTH_RATIO = 0.8;
const MAX_HEIGHT_RATIO = 0.9;
const MIN_RATIO = 0.3;

const getSizeRatios = () => {
  const styles = getComputedStyle(document.documentElement);
  const read = (name, fallback) => {
    const value = parseFloat(styles.getPropertyValue(name));
    return Number.isNaN(value) ? fallback : value;
  };

  const button = read('--gallery-lightbox-button', 32);
  // По бокам — стрелки (свой отступ от края и зазор), сверху и снизу — строка со счётчиком и крестиком
  const reserveX = (read('--gallery-lightbox-arrow-edge', 16) + button + read('--gallery-lightbox-arrow-gap', CONTROLS_GAP)) * 2;
  const reserveY = (read('--gallery-lightbox-edge', 16) + button + CONTROLS_GAP) * 2;
  const ratio = (size, reserve, max) => Math.min(max, Math.max(MIN_RATIO, (size - reserve) / size));

  return {
    widthRatio: ratio(window.innerWidth, reserveX, MAX_WIDTH_RATIO),
    heightRatio: ratio(window.innerHeight, reserveY, MAX_HEIGHT_RATIO),
  };
};

let pluginPromise = null;
let isOpening = false;
// Единственный экземпляр галереи на странице. Перед созданием нового старый всегда уничтожается —
// две галереи одновременно открыться не могут, даже если прошлая по какой-то причине не открылась и не закрылась
let activeLightbox = null;

const destroyActiveLightbox = () => {
  activeLightbox?.destroy();
  activeLightbox = null;
};

const loadPlugin = () => {
  if (pluginPromise) return pluginPromise;

  pluginPromise = new Promise((resolve, reject) => {
    if (window.SimpleLightbox) {
      resolve(window.SimpleLightbox);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLES_URL;
    document.head.append(link);

    const script = document.createElement('script');
    script.src = PLUGIN_URL;
    script.onload = () => resolve(window.SimpleLightbox);
    script.onerror = () => {
      pluginPromise = null;
      reject(new Error('Не удалось загрузить SimpleLightbox'));
    };
    document.head.append(script);
  });

  return pluginPromise;
};

// Картинка, по которой кликнули. У картинок в reset стоит pointer-events: none, тогда клик приходит
// в обёртку (слайд) — ищем вверх ближайший блок, в котором ровно одна картинка галереи
const findClickedItem = (target, gallery) => {
  const direct = target.closest(ITEM_SELECTOR);
  if (direct && gallery.contains(direct)) return direct;

  for (let element = target; element && element !== gallery; element = element.parentElement) {
    const items = element.querySelectorAll(ITEM_SELECTOR);
    if (items.length === 1) return items[0];
    if (items.length > 1) return null;
  }

  return null;
};

const openGallery = async (gallery, item) => {
  if (isOpening) return;
  isOpening = true;

  try {
    const SimpleLightbox = await loadPlugin();
    const items = Array.from(gallery.querySelectorAll(ITEM_SELECTOR));

    destroyActiveLightbox();
    const lightbox = new SimpleLightbox(items, { ...LIGHTBOX_OPTIONS, ...getSizeRatios() });
    activeLightbox = lightbox;

    // Экземпляр живёт только пока галерея открыта: при следующем клике набор картинок может быть другим.
    // Сама библиотека вешает клики на картинки — без destroy следующий клик открыл бы две галереи
    lightbox.on('closed.simplelightbox', () =>
      setTimeout(() => {
        if (activeLightbox === lightbox) destroyActiveLightbox();
      })
    );
    lightbox.open(item);
  } catch (error) {
    console.error(error);
  } finally {
    isOpening = false;
  }
};

export const initGalleries = () => {
  // При повороте экрана или ресайзе доли пересчитываются до того, как библиотека заново подгонит картинку:
  // этот обработчик повешен раньше её собственного
  window.addEventListener('resize', () => {
    if (activeLightbox?.options) Object.assign(activeLightbox.options, getSizeRatios());
  });

  document.addEventListener('click', event => {
    const gallery = event.target.closest(GALLERY_SELECTOR);
    // Пока галерея открыта, клики по странице новую не открывают
    if (!gallery || activeLightbox?.isOpen) return;

    const item = findClickedItem(event.target, gallery);
    if (!item) return;

    event.preventDefault();
    openGallery(gallery, item);
  });
};
