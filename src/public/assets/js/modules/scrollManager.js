export const initScrollManager = () => {
  const scroller = document.querySelector('.body');
  if (!scroller) return;

  const scrollStateKey = 'miratorgScrollKey';
  const storagePrefix = 'miratorg:scroll:';
  let saveRafId = 0;
  let scrollRafId = 0;
  let skipNextHashChange = false;
  let currentHash = window.location.hash;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const getNavigationType = () => {
    const navigation = performance.getEntriesByType?.('navigation')?.[0];
    if (navigation?.type) return navigation.type;

    if (performance.navigation?.type === 1) return 'reload';
    if (performance.navigation?.type === 2) return 'back_forward';

    return 'navigate';
  };

  const createScrollKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const getHistoryState = () => {
    return history.state && typeof history.state === 'object' ? history.state : {};
  };

  const writeHistoryScrollKey = (key, method = 'replace') => {
    const state = {
      ...getHistoryState(),
      [scrollStateKey]: key,
    };

    history[`${method}State`](state, '', window.location.href);
  };

  const ensureScrollKey = () => {
    const state = getHistoryState();

    if (state[scrollStateKey]) {
      return state[scrollStateKey];
    }

    const key = createScrollKey();
    writeHistoryScrollKey(key);
    return key;
  };

  let scrollKey = ensureScrollKey();

  const getHashTarget = hash => {
    const id = decodeURIComponent(String(hash || '').replace(/^#/, ''));
    if (!id) return null;

    return document.getElementById(id);
  };

  const getTargetTop = target => {
    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetStyles = getComputedStyle(target);
    const scrollMarginTop = parseFloat(targetStyles.scrollMarginTop) || 0;

    return targetRect.top - scrollerRect.top + scroller.scrollTop - scrollMarginTop;
  };

  const scrollToTarget = target => {
    if (scrollRafId) cancelAnimationFrame(scrollRafId);

    const getClampedTargetTop = () => {
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      return Math.min(Math.max(0, getTargetTop(target)), maxTop);
    };

    const animate = () => {
      const startTop = scroller.scrollTop;
      const duration = 600;
      const startTime = performance.now();

      const easeInOut = progress => {
        return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      };

      const tick = currentTime => {
        const targetTop = getClampedTargetTop();
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = easeInOut(progress);

        scroller.scrollTop = startTop + (targetTop - startTop) * easedProgress;

        if (progress < 1) {
          scrollRafId = requestAnimationFrame(tick);
          return;
        }

        scroller.scrollTop = targetTop;
        scrollRafId = 0;
      };

      scrollRafId = requestAnimationFrame(tick);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(animate);
    });
  };

  const scrollToHash = hash => {
    const target = getHashTarget(hash);
    if (!target) return false;

    scrollToTarget(target);
    return true;
  };

  const getStorageKey = (key = scrollKey) => `${storagePrefix}${key}`;

  const getSavedTop = (key = scrollKey) => {
    const saved = sessionStorage.getItem(getStorageKey(key));
    if (saved === null) return null;

    const top = Number(saved);
    return Number.isFinite(top) && top >= 0 ? top : null;
  };

  const saveScrollTop = () => {
    saveRafId = 0;
    sessionStorage.setItem(getStorageKey(), String(scroller.scrollTop));
  };

  const requestSaveScrollTop = () => {
    if (!saveRafId) saveRafId = requestAnimationFrame(saveScrollTop);
  };

  const setScrollTop = top => {
    let attempts = 0;
    const maxAttempts = 12;

    const trySet = () => {
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const nextTop = Math.min(Math.max(0, top), maxTop);

      scroller.scrollTop = nextTop;

      attempts += 1;
      if (scroller.scrollTop < nextTop && attempts < maxAttempts) {
        requestAnimationFrame(trySet);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(trySet);
    });
  };

  const restoreNativeLikeScroll = () => {
    const navigationType = getNavigationType();
    const savedTop = getSavedTop();

    if ((navigationType === 'reload' || navigationType === 'back_forward') && savedTop !== null) {
      setScrollTop(savedTop);
      return;
    }

    if (window.location.hash && scrollToHash(window.location.hash)) return;

    setScrollTop(0);
  };

  scroller.addEventListener('scroll', requestSaveScrollTop, { passive: true });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const url = new URL(href, window.location.href);
    const isSamePage = url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search;
    const hash = url.hash;

    if (!hash || hash === '#') return;
    if (!isSamePage) return;

    if (!scrollToHash(hash)) return;

    event.preventDefault();
    saveScrollTop();

    if (hash === window.location.hash) return;

    scrollKey = createScrollKey();
    history.pushState(
      {
        ...getHistoryState(),
        [scrollStateKey]: scrollKey,
      },
      '',
      hash
    );
    currentHash = hash;
  });

  window.addEventListener('popstate', event => {
    saveScrollTop();
    skipNextHashChange = currentHash !== window.location.hash;
    currentHash = window.location.hash;

    scrollKey = event.state?.[scrollStateKey] || ensureScrollKey();

    const savedTop = getSavedTop();
    if (savedTop !== null) {
      setScrollTop(savedTop);
      return;
    }

    if (window.location.hash && scrollToHash(window.location.hash)) return;

    setScrollTop(0);
  });

  window.addEventListener('hashchange', () => {
    if (skipNextHashChange) {
      skipNextHashChange = false;
      return;
    }

    currentHash = window.location.hash;
    scrollToHash(window.location.hash);
  });
  window.addEventListener('pagehide', saveScrollTop);
  restoreNativeLikeScroll();
};
