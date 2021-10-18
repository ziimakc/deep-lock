// types from https://github.com/krzkaczor/ts-essentials

type Primitive = string | number | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnknown<T> = IsAny<T> extends true
  ? false
  : unknown extends T
  ? true
  : false;

type DeepReadonly<T> = T extends Builtin
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends WeakMap<infer K, infer V>
  ? WeakMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer U>
  ? ReadonlySet<DeepReadonly<U>>
  : T extends ReadonlySet<infer U>
  ? ReadonlySet<DeepReadonly<U>>
  : T extends WeakSet<infer U>
  ? WeakSet<DeepReadonly<U>>
  : T extends Promise<infer U>
  ? Promise<DeepReadonly<U>>
  : T extends {}
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : IsUnknown<T> extends true
  ? unknown
  : Readonly<T>;

/**
 * Recursively apply provided options operations on object
 * and all of the object properties that are either object or function.
 *
 * By default freezes object.
 *
 * @param {Object} obj - The object to which will be applied `freeze`, `seal` or `preventExtensions`
 * @param {Object=} options default `{ action: 'freeze' }`
 * @param {string=} options.action
 * ```
 * | action            | Add | Modify | Delete | Reconfigure |
 * | ----------------- | --- | ------ | ------ | ----------- |
 * | preventExtensions |  -  |   +    |   +    |      +      |
 * | seal              |  -  |   +    |   -    |      -      |
 * | freeze            |  -  |   -    |   -    |      -      |
 * ```
 *
 * @returns {Object} Initial object with applied options action
 */
export default function deepLock<T extends Record<string, any>>(
  obj: T
): DeepReadonly<T>;
export default function deepLock<
  T extends Record<string, any>,
  Action extends "freeze" | "seal" | "preventExtensions"
>(
  obj: T,
  options: { action?: Action }
): "freeze" extends Action ? DeepReadonly<T> : T;
