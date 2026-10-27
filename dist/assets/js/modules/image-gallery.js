const PLUGIN_VERSION = '2.14.3';
const PLUGIN_URL = `https://cdn.jsdelivr.net/npm/simplelightbox@${PLUGIN_VERSION}/dist/simple-lightbox.min.js`;
const STYLES_URL = `https://cdn.jsdelivr.net/npm/simplelightbox@${PLUGIN_VERSION}/dist/simple-lightbox.min.css`;
const GALLERY_SELECTOR = '[data-gallery]';
const SOURCE_ATTRIBUTE = 'data-source';
const ITEM_SELECTOR = `[${SOURCE_ATTRIBUTE}]`;

const SPRITE_URL = new URL('../../img/sprite.svg', import.meta.url).href;
const icon = id => `<svg aria-hidden="true"><use href="${SPRITE_URL}#${id}"></use></svg>`;

const LIGHTBOX_OPTIONS = {
  sourceAttr: SOURCE_ATTRIBUTE,
  className: 'gallery-lightbox',
  closeText: icon('close'),
  navText: [icon('arrow-accordeon'), icon('arrow-accordeon')],
  overlayOpacity: 1,
  captions: false,
  fileExt: false,
  history: false,
  uniqueImages: false,
};

const CONTROLS_GAP = 8;
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
  window.addEventListener('resize', () => {
    if (activeLightbox?.options) Object.assign(activeLightbox.options, getSizeRatios());
  });

  document.addEventListener('click', event => {
    const gallery = event.target.closest(GALLERY_SELECTOR);

    if (!gallery || activeLightbox?.isOpen) return;

    const item = findClickedItem(event.target, gallery);
    if (!item) return;

    event.preventDefault();
    openGallery(gallery, item);
  });
};
