export interface Settings {
  id: string;
  avatar: string;
  name: string;
  connected: boolean;
}

export type Dispatch = (action: object) => void;
export type Action<T> = (parameter: T) => object;

export interface Player<S extends object = {}> {
  id: string;
  settings: Settings & S;
  startOfTimeOffline?: Date;
}

export interface Game<P extends Player = Player> {
  code: string;
  isActive: boolean;
  adminId: string;
  players: P[];
}

export interface State<T extends Game = Game> {
  openGames: string[];
  currentGame: T;
  settings: Settings;
  message: {
    id: string;
    title: string;
    description: string;
    status: "info" | "warning" | "success" | "error";
  };
}
