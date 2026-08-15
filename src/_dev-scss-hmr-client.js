// Dev-only: hot-swaps the compiled styles.min.css link on scss changes,
// without a full page reload. Never referenced by the production build.
if (import.meta.hot) {
  import.meta.hot.on('scss-update', () => {
    document.querySelectorAll('link[href^="/assets/css/styles.min.css"]').forEach(link => {
      const next = link.cloneNode();
      next.href = '/assets/css/styles.min.css?t=' + Date.now();
      next.onload = () => link.remove();
      link.parentNode.insertBefore(next, link.nextSibling);
    });
  });
}
