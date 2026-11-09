export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

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
