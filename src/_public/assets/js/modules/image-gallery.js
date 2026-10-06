export const initGalleries = () => {
  const galleriesList = document.querySelectorAll('[data-gallery]');

  if (!galleriesList.length) return;

  const onGalleryClick = e => {
    if (e.target.nodeName !== 'IMG') return;

    const originalImageUrl = e.target.dataset.source;
    if (!originalImageUrl) return;

    e.preventDefault();

    const description = e.target.alt;
    const instance = basicLightbox.create(`<img src="${originalImageUrl}" alt="${description}" class="gallery-image-original" />`);
    instance.show();
  };

  galleriesList.forEach(galleryEl => {
    galleryEl.addEventListener('click', onGalleryClick);
  });
};
