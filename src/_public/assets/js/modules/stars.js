const starsMarkup = spriteUrl => `
  <div class="stars-back">
    <svg width="96" height="16"><use href="${spriteUrl}#stars"></use></svg>
  </div>
  <div class="stars-front">
    <svg width="96" height="16"><use href="${spriteUrl}#stars"></use></svg>
  </div>
`;

const renderStar = (review, spriteUrl) => {
  const rating = Math.min(5, Math.max(0, parseFloat(review.dataset.rating) || 0));
  const percent = Math.round((rating / 5) * 100);

  review.innerHTML = starsMarkup(spriteUrl);
  review.querySelector('.stars-front').style.width = `${percent}%`;
  review.dataset.starsRendered = 'true';
};

export const initStars = () => {
  const spriteUrl = new URL('../../img/sprite.svg', import.meta.url).href;
  const selector = '[data-rating]:not([data-stars-rendered])';

  const renderWithin = root => {
    root.querySelectorAll(selector).forEach(review => renderStar(review, spriteUrl));
  };

  renderWithin(document);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.matches(selector)) renderStar(node, spriteUrl);
        renderWithin(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
};
