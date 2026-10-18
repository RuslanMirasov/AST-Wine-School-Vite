// Трейлинг-дебаунс: fn выполнится один раз, через delay мс после ПОСЛЕДНЕГО вызова.
// Нужен для событий-паразитов (resize, orientationchange), которые стреляют на каждый
// кадр при живом ресайзе/повороте — без дебаунса пересчёт геометрии/классов срабатывал
// бы сотни раз вместо одного, форсируя лишние reflow/recalculation.
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Троттлинг: fn выполняется не чаще раза в delay мс — сразу при первом вызове и ещё раз в конце серии,
// чтобы последнее состояние (например, конечная позиция прокрутки) не потерялось
export const throttle = (fn, delay) => {
  let timer = null;
  let lastArgs = null;

  return (...args) => {
    if (timer) {
      lastArgs = args;
      return;
    }

    fn(...args);
    timer = setTimeout(function release() {
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
        timer = setTimeout(release, delay);
      } else {
        timer = null;
      }
    }, delay);
  };
};
