export const escapeQuotes = value => {
  if (!value) {
    return value;
  }

  return value.replace(new RegExp("'", 'g'), '%27').replace(new RegExp('"', 'g'), '');
};

export const replaceQuotes = value => {
  if (!value) {
    return value;
  }

  return value.replace(new RegExp('%27', 'g'), "'");
};

export const replacePipesInList = value => {
  if (!value) {
    return value;
  }

  return value.replace(new RegExp('\\|', 'g'), ',\n');
};
