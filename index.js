"use strict";

function deepLock(obj, options) {
  var action = "freeze";

  if (options && options.action) {
    switch (options.action) {
      case "freeze":
      case "seal":
      case "preventExtensions":
        action = options.action;
        break;
      default:
        throw new Error(`Options action can't be ${options.action}`);
    }
  }

  return lock(obj, action);
}

function lock(obj, action, locked = new Set()) {
  if (locked.has(obj)) return obj; // Prevent circular reference

  Object[action](obj);
  locked.add(obj);

  // In strict mode obj.caller and obj.arguments are non-deletable properties which throw when set or retrieved
  if (obj === Function.prototype) return obj;

  const keys = Object.getOwnPropertyNames(obj);
  // Not supported in IE
  if (Object.getOwnPropertySymbols) {
    keys.push(...Object.getOwnPropertySymbols(obj));
  }

  keys.forEach((prop) => {
    if (
      Object.hasOwnProperty.call(obj, prop) &&
      obj[prop] !== null &&
      (typeof obj[prop] === "object" || typeof obj[prop] === "function") &&
      !ArrayBuffer.isView(obj[prop])
    ) {
      lock(obj[prop], action, locked);
    }
  });

  return obj;
}

module.exports = deepLock;
module.exports.default = deepLock;
