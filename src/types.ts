export interface Profile {
  id: string;
  avatar: string;
  name: string;
}

export type Store = { dispatch: (action: object) => void };
export type Action<T> = (parameter: T) => object;
