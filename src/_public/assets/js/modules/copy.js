const COPY_MESSAGE_DURATION = 2000;
const COPY_MESSAGE_HIDE_DURATION = 400;

// Ближайший [data-copy]: поднимаемся от кнопки вверх и ищем его внутри каждого родителя.
const findCopySource = button => {
  let parent = button.parentElement;

  while (parent) {
    const source = parent.querySelector('[data-copy]');
    if (source) return source;
    parent = parent.parentElement;
  }

  return null;
};

// navigator.clipboard доступен только в secure context (https / localhost), иначе — execCommand.
const copyText = async text => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const isCopied = document.execCommand('copy');
  textarea.remove();

  if (!isCopied) throw new Error('Copy failed');
};

export const initCopyToBuffer = () => {
  const copyButtons = document.querySelectorAll('[data-copy-to-buffer]');

  if (!copyButtons.length) return;

  const messageMarkup = `<div class="copy-message" role="status">✓ Cкопировано в буфер обмена</div>`;
  let messagesList = null;

  const hideMessage = message => {
    message.addEventListener('animationend', () => message.remove(), { once: true });
    message.classList.add('hide');
    // Страховка на случай, если animationend не сработает (например, анимации отключены).
    setTimeout(() => message.remove(), COPY_MESSAGE_HIDE_DURATION + 100);
  };

  // Каждый клик добавляет свою плашку в низ стопки; каждая живёт по собственному таймеру.
  const showMessage = () => {
    if (!messagesList) {
      messagesList = document.createElement('div');
      messagesList.className = 'copy-messages';
      document.body.append(messagesList);
    }

    messagesList.insertAdjacentHTML('beforeend', messageMarkup);
    const message = messagesList.lastElementChild;
    message.style.setProperty('--copy-message-height', `${message.offsetHeight}px`);

    setTimeout(() => hideMessage(message), COPY_MESSAGE_DURATION);
  };

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const text = findCopySource(button)?.textContent.trim();
      if (!text) return;

      try {
        await copyText(text);
        showMessage();
      } catch (error) {
        console.error(error);
      }
    });
  });
};
