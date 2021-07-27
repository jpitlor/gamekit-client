import * as SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";
import { safeDispatch, sleep } from "./utils";

interface Profile {
  id: string;
  avatar: string;
  name: string;
}

interface ServerOptions<T> {
  profile: Profile;
  store: { dispatch: (action: object) => void };
  onGamesList: (games: string[]) => object;
  onClientError: (error: string) => object;
  onServerError: (error: string) => object;
  onSuccess: (message: string) => object;
  onGameUpdate: (game: T) => object;
}

interface Event {
  route: string;
  data: object;
}

interface JoinGameOptions<T> {
  gameCode: string;
  profile: Profile;
  store: { dispatch: (action: object) => void };
  onGameUpdate: (game: T) => object;
}

let client: Client;

export function connectToServer<T>(options: ServerOptions<T>) {
  const {
    profile,
    store,
    onGamesList,
    onServerError,
    onClientError,
    onSuccess,
    onGameUpdate,
  } = options;

  if (client) {
    throw new Error("There is already an active connection to the server");
  }

  if (!onGameUpdate) {
    throw new Error("onGameUpdate is undefined, but it is required");
  }

  if (!onGamesList) {
    throw new Error("onGamesList is undefined, but it is required");
  }

  client = new Client({
    webSocketFactory: () => new SockJS(`${location.origin}/websocket-server`),
    connectHeaders: { uuid: uuidv4() },
    onConnect: () => {
      client.subscribe("/topic/rejoin-game", async ({ body }) => {
        await joinGame({ gameCode: body, onGameUpdate, store, profile });
      });

      client.subscribe("/topic/games", ({ body }) => {
        safeDispatch(store, onGamesList, JSON.parse(body) as string[]);
      });

      client.subscribe(`/user/topic/errors/client`, ({ body }) => {
        safeDispatch(store, onClientError, body);
      });

      client.subscribe(`/user/topic/errors/server`, ({ body }) => {
        safeDispatch(store, onServerError, body);
      });

      client.subscribe(`/user/topic/successes`, ({ body }) => {
        safeDispatch(store, onSuccess, body);
      });
    },
  });

  client.activate();
}

export async function joinGame<T>(options: JoinGameOptions<T>) {
  const { profile, gameCode, store, onGameUpdate } = options;

  if (!client) {
    throw new Error("There is no active connection to the server");
  }

  client.publish({
    destination: `/app/games/${gameCode}/join`,
    body: JSON.stringify(profile),
  });

  // A race condition happens where if we dont wait 1ms, the subscription may happen first
  // giving an error that the game doesn't exist
  await sleep(1);

  client.subscribe(`/topic/games/${gameCode}`, ({ body }) => {
    const response = JSON.parse(body) as T;
    store.dispatch(onGameUpdate(response));
  });
}

export function sendEvent(event: Event) {
  const { route, data } = event;

  if (!client) {
    throw new Error("There is no active connection to the server");
  }

  client.publish({ destination: `/app${route}`, body: JSON.stringify(data) });
}

export function updateProfile(profile: Profile) {
  client.publish({
    destination: `/app/games/${code}/update`,
    body: JSON.stringify(settings),
  });
}
