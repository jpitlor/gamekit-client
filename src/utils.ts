import { Action, Dispatch } from "./types";

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeDispatch<T>(
  dispatch?: Dispatch,
  action?: Action<T>,
  parameter?: T
) {
  if (!dispatch || !action || !parameter) {
    return;
  }

  dispatch(action(parameter));
}
