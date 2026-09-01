const tokens = new WeakMap();

const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const startOperation = el => {
  const token = {};
  tokens.set(el, token);
  return token;
};

const isCurrent = (el, token) => tokens.get(el) === token;

const onHeightTransitionEnd = (el, token, onFinished) => {
  el.addEventListener('transitionend', function onEnd(event) {
    if (event.target !== el || event.propertyName !== 'height') return;
    el.removeEventListener('transitionend', onEnd);
    if (isCurrent(el, token)) onFinished();
  });
};

export const expand = async el => {
  if (getComputedStyle(el).display !== 'none') return;

  const token = startOperation(el);

  el.style.display = 'block';
  el.style.height = '0px';
  void el.offsetHeight;

  await nextFrame();
  if (!isCurrent(el, token)) return;

  el.style.height = `${el.scrollHeight}px`;
  onHeightTransitionEnd(el, token, () => {
    el.style.height = 'auto';
  });
};

export const collapse = async el => {
  if (el.classList.contains('active')) {
    // .active форсирует display/height через !important (для ошибок, отрисованных
    // руками/сервером в разметке в уже открытом виде) — сначала фиксируем текущую
    // высоту инлайн-стилем, чтобы не было скачка, и только потом снимаем класс,
    // иначе обычная анимация схлопывания ниже будет полностью перебита !important.
    const height = el.scrollHeight;
    el.classList.remove('active');
    el.style.display = 'block';
    el.style.height = `${height}px`;
    void el.offsetHeight;
  }

  if (getComputedStyle(el).display === 'none') return;

  const token = startOperation(el);

  el.style.height = `${el.scrollHeight}px`;
  void el.offsetHeight;

  await nextFrame();
  if (!isCurrent(el, token)) return;

  el.style.height = '0px';
  onHeightTransitionEnd(el, token, () => {
    el.style.display = 'none';
  });
};
