/**
 * Convert name to internal supported format.
 * This function should keep since we still thinking if need support like `a.b.c` format.
 * 'a' => ['a']
 * 123 => [123]
 * ['a', 123] => ['a', 123]
 */
export function getNamePath(path) {
  if (path === undefined || path === null) {
    return [];
  }

  return Array.isArray(path) ? path : [path];
}

export function getValue(entity, paths) {
  let current = entity;

  for (let i = 0; i < paths.length; i += 1) {
    if (current === null || current === undefined) {
      return undefined;
    }

    current = current[paths[i]];
  }

  return current;
}

/**
 * sss
 * @param entity
 * @param paths
 * @param value
 */
export function setValue(
  entity,
  paths,
  value,
) {
  if (paths.length === 0) {
    return value;
  }

  const [path, ...restPath] = paths;

  let clone;
  if (!entity && typeof path === 'number') {
    clone = [];
  } else if (Array.isArray(entity)) {
    clone = [...entity];
  } else {
    clone = { ...entity };
  }

  clone[path] = setValue(clone[path], restPath, value);

  return clone;
}

export function defaultGetValueFromEvent(valuePropName, ...args) {
  const event = args[0];
  if (event && event.target && valuePropName in event.target) {
    return (event.target)[valuePropName];
  }
  return event;
}


/**
 * Copy values into store and return a new values object
 * ({ a: 1, b: { c: 2 } }, { a: 4, b: { d: 5 } }) => { a: 4, b: { c: 2, d: 5 } }
 */
function internalSetValues(store, values) {
  const newStore = (Array.isArray(store) ? [...store] : { ...store });

  if (!values) {
    return newStore;
  }

  Object.keys(values).forEach(key => {
    const prevValue = newStore[key];
    const value = values[key];

    // If both are object (but target is not array), we use recursion to set deep value
    const recursive = isObject(prevValue) && isObject(value);
    newStore[key] = recursive ? internalSetValues(prevValue, value || {}) : value;
  });

  return newStore;
}

export function setValues(store, ...restValues) {
  return restValues.reduce(
    (current, newStore) => internalSetValues(current, newStore),
    store,
  );
}
function isObject(obj) {
  return typeof obj === 'object' && obj !== null && Object.getPrototypeOf(obj) === Object.prototype;
}