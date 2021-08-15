export interface Profile {
  id: string;
  avatar: string;
  name: string;
}

export type Dispatch = (action: object) => void;
export type Action<T> = (parameter: T) => object;
