const showErrors = true;

const validationRegEx = [
  {
    type: 'email',
    regex: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
    error: 'введите правильный email адрес',
  },
  {
    type: 'tel',
    regex: /^\+7 \d{3} \d{3} \d{2} \d{2}$/,
    error: 'введите правильный телефон',
  },
  {
    type: 'checkbox',
    error: 'поле обязательно к заполнению',
  },
  {
    type: 'radio',
    error: 'Выберите вариант!',
  },
  {
    inputmode: 'decimal',
    regex: /^\d+(?:[.,]\d{1,2})?$/,
    error: 'Введите сумму, например 100.00',
  },
];

const validateInput = input => {
  if (!input.required) return;

  const validationError = error => {
    addErrorHTML(error, input);
    return false;
  };

  const { name, value, checked, type, files } = input;

  if ((type === 'checkbox' || type === 'radio') && !checked) {
    return validationError(validationRegEx.find(rule => rule.type === type).error);
  }

  if (!value || value === '') {
    return validationError('Это обязательное поле!');
  }

  const typeValidation = validationRegEx.find(v => v.type === type);

  if (typeValidation) {
    const regex = new RegExp(typeValidation.regex);

    if (!regex.test(value.trim())) {
      return validationError(typeValidation.error);
    }
  }

  const nameValidation = validationRegEx.find(v => v.name === name);

  if (nameValidation) {
    const regex = new RegExp(nameValidation.regex);

    if (!regex.test(value.trim())) {
      return validationError(nameValidation.error);
    }
  }

  const inputmodeValidation = validationRegEx.find(v => v.inputmode === input.inputMode);

  if (inputmodeValidation) {
    const regex = new RegExp(inputmodeValidation.regex);

    if (!regex.test(value.trim())) {
      return validationError(inputmodeValidation.error);
    }
  }

  removeErrorHTML(input);
  return true;
};

const validateForm = form => {
  if (!form) return;
  let errorsCount = 0;

  const inputs = form.querySelectorAll('[required]');
  if (inputs.length === 0) return true;

  inputs.forEach(input => {
    const isInputValid = validateInput(input);
    errorsCount = isInputValid ? errorsCount : errorsCount + 1;
  });

  return errorsCount <= 0;
};

const addErrorHTML = (error, input) => {
  if (!input) return;

  const label = input.closest('label');
  const existingError = label?.querySelector('.inputError');

  if (error) {
    input.classList.add('invalid');

    if (existingError) {
      existingError.innerHtml = error;
      return;
    }

    if (showErrors) {
      label.insertAdjacentHTML('beforeend', `<span class="inputError"><span>${error}</span></span>`);
      const newError = label.querySelector('.inputError');
      newError.style.height = newError.scrollHeight + 'px';
    }
    return;
  }

  if (existingError) existingError.remove();
  input.classList.remove('invalid');
};

const removeErrorHTML = input => {
  if (!input) return;

  const label = input.closest('label');
  const error = label?.querySelector('.inputError');
  input.classList.remove('invalid');
  if (error) {
    error.style.height = '0px';
    error.remove();
  }
};

const onRequiredInputFocus = e => {
  const input = e.target;
  removeErrorHTML(input);
};

export const initForms = () => {
  document.addEventListener('focusin', e => {
    if (e.target.matches('[required]')) {
      onRequiredInputFocus(e);
    }
  });

  document.addEventListener('change', e => {
    if (e.target.type === 'checkbox') {
      validateInput(e.target);
    }
  });

  // SUBMIT MIDDLEWARE
  document.addEventListener(
    'submit',
    function (event) {
      const form = event.target;
      if (form.tagName.toLowerCase() !== 'form') return;

      const isValid = validateForm(form);
      if (!isValid) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
};
