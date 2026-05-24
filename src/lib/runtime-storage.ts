type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear" | "key"> & {
  readonly length: number;
};

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
};

const installRuntimeStorage = (): StorageLike => {
  try {
    if (typeof globalThis.localStorage !== "undefined") {
      return globalThis.localStorage as StorageLike;
    }
  } catch {
    // Fall through to the memory-backed shim.
  }

  const memoryStorage = createMemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    enumerable: false,
    value: memoryStorage,
    writable: true,
  });
  return memoryStorage;
};

export const runtimeStorage = installRuntimeStorage();

export function getRuntimeStorage(): StorageLike {
  return installRuntimeStorage();
}
