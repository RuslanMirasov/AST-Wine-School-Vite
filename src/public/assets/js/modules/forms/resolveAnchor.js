const findCommonAncestor = elements => {
  const chains = elements.map(el => {
    const chain = [];
    let node = el.parentElement;
    while (node) {
      chain.unshift(node);
      node = node.parentElement;
    }
    return chain;
  });

  let commonAncestor = elements[0].parentElement;
  const minLength = Math.min(...chains.map(chain => chain.length));

  for (let i = 0; i < minLength; i++) {
    if (!chains.every(chain => chain[i] === chains[0][i])) break;
    commonAncestor = chains[0][i];
  }

  return commonAncestor;
};

// Радио-группа (несколько input[type=radio] с одинаковым name) — логически одно поле:
// required-невалидность у браузера общая на всю группу, значит и ошибка должна быть одна.
export const getGroupFields = (field, form) => {
  if (field.type !== 'radio' || !field.name) return [field];

  return Array.from(form.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`));
};

// Anchor — место, куда крепится ошибка: само поле для обычных контролов,
// либо ближайший общий предок всей радио-группы (обычно fieldset).
export const resolveAnchor = (field, form) => {
  const group = getGroupFields(field, form);
  if (group.length <= 1) return field;

  return findCommonAncestor(group);
};
