import { camelCase, snakeCase } from 'change-case';
import dateFormat from 'dateformat';

const snakeArray = arr =>
  arr.map(item => {
    if (typeof item === 'object') {
      if (Array.isArray(item)) {
        return snakeArray(item);
      }

      return snakeKeys(item);
    }

    return item;
  });

const snakeKeys = (obj = {}) => {
  const newObj = {};

  for (const key of Object.keys(obj)) {
    const newKey = snakeCase(key);
    let newValue = obj[key];

    if (obj[key] !== null && obj[key] !== undefined) {
      if (typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          newValue = snakeArray(obj[key]);
        } else if (obj[key] instanceof Date) {
          newValue = dateFormat(obj[key], 'isoUtcDateTime');
        } else {
          newValue = snakeKeys(obj[key]);
        }
      }

      newObj[newKey] = newValue;
    } else if (obj[key] === null) {
      newObj[newKey] = null;
    }
  }

  return newObj;
};

const camelArray = arr =>
  arr.map(item => {
    if (typeof item === 'object') {
      if (Array.isArray(item)) {
        return camelArray(item);
      }

      return camelKeys(item);
    }

    return item;
  });

const camelKeys = (obj = {}) => {
  const newObj = {};

  for (const key of Object.keys(obj)) {
    const newKey = camelCase(key);
    let newValue = obj[key];

    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          newValue = camelArray(obj[key]);
        } else if (obj[key] instanceof Date) {
          newValue = dateFormat(obj[key], 'isoUtcDateTime');
        } else {
          newValue = camelKeys(obj[key]);
        }
      }
      newObj[newKey] = newValue;
    }
  }

  return newObj;
};

export { camelKeys, snakeKeys };
