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

export const getGroupFields = (field, form) => {
  if (field.type !== 'radio' || !field.name) return [field];

  return Array.from(form.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`));
};

export const resolveAnchor = (field, form) => {
  const group = getGroupFields(field, form);
  if (group.length <= 1) return field;

  return findCommonAncestor(group);
};
