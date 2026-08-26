export const lockScroll = () => {
  const body = document.querySelector('.body');
  const header = document.querySelector('.header');
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  if (body) {
    body.classList.add('locked');
    body.style.width = `calc(100% - ${scrollbarWidth}px)`;
  }

  if (header) {
    header.style.width = `calc(100% - ${scrollbarWidth}px)`;
  }
};

export const unlockScroll = () => {
  const body = document.querySelector('.body');
  const header = document.querySelector('.header');

  if (body) {
    body.classList.remove('locked');
    body.style.width = '100%';
  }

  if (header) {
    header.style.width = '100%';
  }
};

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const popup = {
  _backdrop: null,
  _popup: null,
  _opener: null,
  _scrollY: 0,
  _isOpening: false,
  _isAnimating: false,
  _animation: 500,

  init() {
    this._backdrop = document.querySelector('[data-backdrop]');
    this._popup = this._backdrop?.querySelector('[data-popup]');

    if (!this._backdrop || !this._popup) {
      console.warn('Контейнеры для попапа не найдены');
      return;
    }

    this._bindCloseEvents();
  },

  async open(id) {
    if (this._isOpening || this._isAnimating) return;
    this._isOpening = true;

    const newContent = this._popup.querySelector(`#${id}`);
    if (!newContent) {
      console.warn(`Попап с id="${id}" не найден`);
      this._isOpening = false;
      return;
    }

    const isVisible = this._popup.classList.contains('visible');
    const currentContent = this._getActiveContent();

    if (isVisible && currentContent !== newContent) {
      await this._switchContent(newContent);
    } else if (!isVisible) {
      this._opener = document.activeElement;
      this._scrollY = window.scrollY;
      await this._showContent(newContent);
    }

    this._isOpening = false;
  },

  async close() {
    if (this._isOpening || this._isAnimating) return;
    this._isOpening = true;

    this._popup.classList.remove('visible');
    this._backdrop.classList.remove('active');
    document.body.classList.remove('popup-is-opened');

    await this._waitForTransition(this._backdrop);

    this._scrollBackdropToTop();
    this._unlockScroll();
    this._hideAllContent();

    this._opener?.focus();
    this._opener = null;

    this._isOpening = false;
  },

  async _switchContent(newContent) {
    this._popup.classList.remove('visible');
    await this._delay(this._animation);

    this._hideAllContent();
    newContent.style.display = 'flex';
    this._focusFirst(newContent);
    this._scrollBackdropToTop();

    this._popup.classList.add('visible');
    await this._delay(this._animation);
  },

  async _delay(ms) {
    this._isAnimating = true;
    return new Promise(resolve => {
      setTimeout(() => {
        this._isAnimating = false;
        resolve();
      }, ms);
    });
  },

  _bindCloseEvents() {
    document.addEventListener('click', e => {
      if (this._isOpening || this._isAnimating) return;

      const openBtn = e.target.closest('[data-popup-open]');
      if (openBtn) {
        e.preventDefault();
        this.open(openBtn.dataset.popupOpen, openBtn.dataset.recipeId);
        return;
      }

      const isCloseTarget = e.target === this._backdrop || e.target.hasAttribute('data-popup-close');
      if (isCloseTarget && !this._isLocked()) {
        this.close();
      }
    });

    document.addEventListener('keydown', e => {
      if ((this._isOpening || this._isAnimating) && e.key === 'Escape') {
        return;
      }
      if (e.key === 'Escape' && !this._isLocked()) {
        this.close();
        return;
      }

      if (e.key === 'Tab' && this._popup.classList.contains('visible')) {
        this._trapFocus(e);
      }
    });
  },

  _trapFocus(e) {
    const content = this._getActiveContent();
    const focusable = content ? this._getFocusable(content) : [];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },

  _getActiveContent() {
    return this._popup.querySelector('.popup-content[style*="display: flex"]');
  },

  _getFocusable(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => el.offsetParent !== null);
  },

  _focusFirst(container) {
    this._getFocusable(container)[0]?.focus();
  },

  _isLocked() {
    return this._getActiveContent()?.hasAttribute('data-popup-lock') ?? false;
  },

  async _showContent(newContent) {
    this._hideAllContent();
    newContent.style.display = 'flex';

    const popupHeight = newContent.offsetHeight;
    const shouldLockScroll = popupHeight <= window.innerHeight - 100;

    this._lockScroll(shouldLockScroll);

    this._backdrop.classList.add('active');
    this._popup.classList.add('visible');
    document.body.classList.add('popup-is-opened');

    await this._waitForTransition(this._backdrop);

    this._focusFirst(newContent);
  },

  _hideAllContent() {
    this._popup.querySelectorAll('.popup-content').forEach(el => {
      el.style.display = 'none';
    });
  },

  _scrollBackdropToTop() {
    const el = this._backdrop;
    if (!el) return;

    el.scrollTop = 0;
    el.scrollLeft = 0;

    if (typeof el.scrollTo === 'function') {
      try {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        el.scrollTo(0, 0);
      }
    }

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        el.scrollTop = 0;
      })
    );
  },

  async _waitForTransition(element, propertyName = 'opacity') {
    this._isAnimating = true;

    return new Promise(resolve => {
      const handler = e => {
        if (e.propertyName === propertyName) {
          element.removeEventListener('transitionend', handler);
          clearTimeout(timer);
          this._isAnimating = false;
          resolve();
        }
      };

      element.addEventListener('transitionend', handler, { once: true });

      const timer = setTimeout(() => {
        element.removeEventListener('transitionend', handler);
        this._isAnimating = false;
        resolve();
      }, this._animation + 50);
    });
  },

  _lockScroll() {
    lockScroll();
  },

  _unlockScroll() {
    unlockScroll();
  },
};
