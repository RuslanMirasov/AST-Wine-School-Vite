export const initCertificateBalance = () => {
  const form = document.querySelector('.cert-balance-form');
  if (!form) return;

  const input = form.elements.namedItem('certificate-code');
  const result = form.querySelector('.cert-balance-result');
  const success = form.querySelector('[data-demo-certificate-code]');
  const error = form.querySelector('[data-certificate-not-found]');

  input.addEventListener('input', () => result.replaceChildren());

  form.addEventListener('submit', event => {
    event.preventDefault();
    const template = input.value.trim() === success.dataset.demoCertificateCode ? success : error;
    result.replaceChildren(template.content.cloneNode(true));
  });
};
