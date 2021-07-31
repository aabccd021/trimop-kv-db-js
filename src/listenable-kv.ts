import { Unsubscribe, isDefined } from 'trimop';

export type InitKV = () => string;
export type ClearKV = () => void;
export type DeleteRecordKV = (key: string) => void;
export type GetRecordKV<T = unknown> = (key: string) => T | undefined;
export type SetRecordKV<T = unknown> = (key: string, value: T) => void;

export type Listen<T> = (value: T | undefined) => void;

export type Listenable<T> = {
  readonly state: T;
  readonly listens: readonly Listen<T>[];
};

export function initLKV(initKV: InitKV): string {
  return initKV();
}

export function clearLKV(clearKV: ClearKV): void {
  clearKV();
}

export function getRecordLKV<T>(
  getRecordKV: GetRecordKV<Listenable<T>>,
  key: string
): T | undefined {
  return getRecordKV(key)?.state;
}

export function setRecordLKV<T>(
  getRecordKV: GetRecordKV<Listenable<T>>,
  setRecordKV: SetRecordKV<Listenable<T>>,
  key: string,
  newState: T
): void {
  const cachedListenable = getRecordKV(key);
  cachedListenable?.listens.forEach((listener) => listener(newState));
  setRecordKV(key, {
    listens: cachedListenable?.listens ?? [],
    state: newState,
  });
}

export function deleteRecordLKV(deleteKV: DeleteRecordKV, key: string): void {
  deleteKV(key);
}

export function setLKV<T>(
  getRecordKV: GetRecordKV<Listenable<T>>,
  setRecordKV: SetRecordKV<Listenable<T>>,
  key: string,
  newState: T
): void {
  const cachedListenable = getRecordKV(key);
  cachedListenable?.listens.forEach((listener) => listener(newState));
  setRecordKV(key, {
    listens: cachedListenable?.listens ?? [],
    state: newState,
  });
}

/**
 * Subscribe to a state
 * @param key of the state
 * @param newListen which will be called every time the state changes
 * @returns unsubscribe function if the state exists, otherwise returns undefined
 */
export function subscribeLKV<T>(
  getRecordKV: GetRecordKV<Listenable<T>>,
  setRecordKV: SetRecordKV<Listenable<T>>,
  key: string,
  newListen: Listen<T>
): Unsubscribe | undefined {
  const cachedListenable = getRecordKV(key);
  newListen(cachedListenable?.state);
  if (!isDefined(cachedListenable)) {
    return undefined;
  }
  setRecordKV(key, {
    ...cachedListenable,
    listens: [...cachedListenable.listens, newListen],
  });
  return () => {
    const cachedListenable = getRecordKV(key);
    if (isDefined(cachedListenable)) {
      // Remove unused listen
      setRecordKV(key, {
        ...cachedListenable,
        listens: cachedListenable.listens.filter((el) => el !== newListen),
      });
    }
  };
}
