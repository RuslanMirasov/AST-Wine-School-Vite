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
