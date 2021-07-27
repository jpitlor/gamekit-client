export type Store = { dispatch: (action: object) => void };
export type Action<T> = (parameter: T) => object;

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeDispatch<T>(
  store?: Store,
  action?: Action<T>,
  parameter?: T
) {
  if (!store || !action || !parameter) {
    return;
  }

  store.dispatch(action(parameter));
}
