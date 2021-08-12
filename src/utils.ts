import { Action, Store } from "./types";

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
