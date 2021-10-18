import deepLock from "./index.js";

// Credits for some test https://github.com/snovakovic/js-flock

describe("deepLock", () => {
  const regExpNotExt = /Cannot add property .* object is not extensible/;

  let obj: any;
  let refToA: any;
  let refToB: any;
  let prot: any;

  beforeEach(() => {
    obj = {
      p1: {
        p2: { p3: { num: 1 } },
      },
    };

    refToA = { p1: "a" };
    refToB = { p2: "b" };

    refToB.refToObjA = refToA;
    refToA.refToObjB = refToB;

    const ob1 = { proto: { p: { is: "obj1" } } };
    const ob2 = Object.create(ob1);
    ob2.p = { is: "ob2.p" };
    prot = Object.create(ob2);
    prot.child = { is: "prot.child" };
    prot.fn = () => {};
  });

  describe("freeze", () => {
    test("Should handle missing options", () => {
      const obj = {};
      deepLock(obj);
      expect(Object.isFrozen(obj)).toBeTruthy();

      const obj2 = {};
      deepLock(obj2, {});
      expect(Object.isFrozen(obj2)).toBeTruthy();
    });

    test("Should throw for invalid action", () => {
      expect(() => deepLock(obj, { action: "a" as any })).toThrow(
        /Options action can't be/
      );
    });

    test("Should freeze and not throw on any types", () => {
      const obj = {
        num: 1,
        bigNum: BigInt(1),
        sym: Symbol("desc"),
        subObj: { sub: 1 },
        fn: function () {},
        buff: new ArrayBuffer(16),
        bool: true,
        nullable: null,
        undf: undefined,
        arr: [1, 2, 3, 4],
        arrObj: [{ x: 1 }],
        inf: Infinity,
        nan: NaN,
        dob: new Date(),
        set: new Set([{ p1: { p2: 1 } }]),
      } as any;

      obj.fn.p1 = { p2: 2 };
      obj.set.p1 = { p2: 2 };

      deepLock(obj);
      expect(Object.isFrozen(obj)).toBeTruthy();
      expect(Object.isFrozen(obj.num)).toBeTruthy();
      expect(Object.isFrozen(obj.subObj.sub)).toBeTruthy();
      expect(Object.isFrozen(obj.fn.p1.p2)).toBeTruthy();
      expect(Object.isFrozen(obj.arrObj[0].x)).toBeTruthy();
      expect(Object.isFrozen(obj.set.p1.p2)).toBeTruthy();

      expect(() => {
        obj.x = 1;
      }).toThrow(regExpNotExt);
    });

    test("Should freeze object without prototype", () => {
      const obj = Object.create(null);
      obj.x = 1;
      obj.obj2 = Object.create(null);
      expect(Object.isFrozen(obj)).toBeFalsy();

      deepLock(obj);
      expect(Object.isFrozen(obj)).toBeTruthy();
      expect(Object.isFrozen(obj.x)).toBeTruthy();
      expect(Object.isFrozen(obj.obj2)).toBeTruthy();

      expect(() => {
        obj.y = 1;
      }).toThrow(regExpNotExt);
    });

    it("Should deep freeze nested objects", () => {
      deepLock(obj);
      expect(Object.isFrozen(obj.p1.p2)).toBeTruthy();
      expect(Object.isFrozen(obj.p1.p2.p3)).toBeTruthy();
      expect(Object.isFrozen(obj.p1.p2.p3.fn)).toBeTruthy();
    });

    it("Should freeze circular reference once", () => {
      deepLock(refToA);
      expect(Object.isFrozen(refToA.p1)).toBeTruthy();
      expect(Object.isFrozen(refToA.refToObjB)).toBeTruthy();
      expect(Object.isFrozen(refToA.refToObjB.p2)).toBeTruthy();
    });

    it("Should not freeze prototype chain", () => {
      deepLock(prot);
      expect(Object.isFrozen(prot)).toBeTruthy();
      expect(Object.isFrozen(prot.child)).toBeTruthy();
      expect(Object.isFrozen(prot.fn)).toBeTruthy();
      expect(Object.isFrozen(prot.p)).toBeFalsy();
      expect(Object.isFrozen(prot.proto.p)).toBeFalsy();
    });

    it("Should handle restricted properties", () => {
      const fn = function () {};
      const fnProt = Object.getPrototypeOf(fn);
      deepLock(fnProt);
      expect(Object.isFrozen(fnProt)).toBeTruthy();
    });

    it("Should deep freeze non enumerable properties", () => {
      Object.defineProperty(obj, "nonEnumerable", {
        enumerable: false,
        value: {},
      });

      deepLock(obj);
      expect(Object.isFrozen(obj.nonEnumerable)).toBeTruthy();
    });

    it("Should freeze object with Symbol property", () => {
      const sim = Symbol("test");
      obj[sim] = {
        key: { test: 1 },
      };

      deepLock(obj);
      expect(Object.isFrozen(obj[sim].key)).toBeTruthy();
    });

    it("Should not break for TypedArray properties", () => {
      obj.typedArray = new Uint32Array(4);
      obj.buffer = Buffer.from("TEST");

      deepLock(obj);
      expect(Object.isFrozen(obj)).toBeTruthy();
    });

    it("Should deep freeze children of already frozen object", () => {
      Object.freeze(obj.p1);

      deepLock(obj);
      expect(Object.isFrozen(obj.p1.p2)).toBeTruthy();
      expect(Object.isFrozen(obj.p1.p2.p3)).toBeTruthy();
    });

    it("Should not freeze object prototype", () => {
      deepLock(prot);
      expect(Object.isFrozen(prot)).toBeTruthy();
      expect(Object.isFrozen(Object.getPrototypeOf(prot))).toBeFalsy();
    });
  });

  describe("seal", () => {
    it("Should deep seal nested objects", () => {
      deepLock(obj, { action: "seal" });
      expect(Object.isSealed(obj.p1.p2)).toBeTruthy();
      expect(Object.isSealed(obj.p1.p2.p3)).toBeTruthy();
      expect(Object.isSealed(obj.p1.p2.p3.fn)).toBeTruthy();
    });

    it("Should handle circular reference", () => {
      deepLock(refToA);
      expect(Object.isSealed(refToA.p1)).toBeTruthy();
      expect(Object.isSealed(refToA.refToObjB)).toBeTruthy();
      expect(Object.isSealed(refToA.refToObjB.p2)).toBeTruthy();
    });
  });

  describe("preventExtensions", () => {
    it("Should deep prevent extension", () => {
      deepLock(obj, { action: "preventExtensions" });
      expect(Object.isExtensible(obj)).toBeFalsy();
      expect(Object.isExtensible(obj.p1.p2)).toBeFalsy();
      expect(Object.isExtensible(obj.p1.p2.p3)).toBeFalsy();
    });
  });
});

// Types check
const obj = { p1: 1, p2: { p3: 1 } };
const x = deepLock(obj); // expect DeepReadOnly<T>
const x2 = deepLock(obj, {}); //  expect DeepReadOnly<T>
const x3 = deepLock(obj, { action: "freeze" }); //  expect DeepReadOnly<T>
const x4 = deepLock(obj, { action: "seal" }); // expect T
const x5 = deepLock(obj, { action: "preventExtensions" }); // expect T
