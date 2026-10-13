// Оформление заказа в корзине (/cart/checkout/), вкладка «Юридическое лицо».
// Кнопка «Получить счёт на оплату» [data-invoice-button] неактивна, пока не заполнены реквизиты —
// поля с [data-invoice-field]. Достаточно любого значения: правильность проверит валидация при отправке
const BUTTON_SELECTOR = '[data-invoice-button]';
const FIELD_SELECTOR = '[data-invoice-field]';

// Отключённое поле (в закрытой вкладке) заполненным не считается
const isFilled = field => !field.disabled && field.value.trim() !== '';

export const initCartInvoiceButton = () => {
  const button = document.querySelector(BUTTON_SELECTOR);
  const fields = Array.from(document.querySelectorAll(FIELD_SELECTOR));

  if (!button || !fields.length) return;

  const updateButton = () => {
    button.disabled = !fields.every(isFilled);
  };

  fields.forEach(field => {
    field.addEventListener('input', updateButton);
    field.addEventListener('change', updateButton);
  });

  // Поля включаются и отключаются без событий ввода (переключение вкладок) — следим за самим атрибутом
  const observer = new MutationObserver(updateButton);

  fields.forEach(field => {
    observer.observe(field, { attributes: true, attributeFilter: ['disabled'] });
  });

  updateButton();
};
