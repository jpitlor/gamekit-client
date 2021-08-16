export interface Settings {
  id: string;
  avatar: string;
  name: string;
  connected: boolean;
}

export type Dispatch = (action: object) => void;
export type Action<T> = (parameter: T) => object;

export interface Game {
  code: string;
  active: boolean;
  admin: string;
  // players: Player[];
}

export interface State {
  openGames: string[];
  currentGame: Game;
  settings: Settings;
  message: {
    id: string;
    title: string;
    description: string;
    status: "info" | "warning" | "success" | "error";
  };
}
