import * as SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";
import { namespaced, safeDispatch, sleep } from "./utils";
import { Dispatch, Settings } from "./types";

let client: Client;

function getOrSetId(): string {
  let key = namespaced`id`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(key, id);
  }

  return id;
}

interface ServerOptions<T> {
  profile: Settings;
  dispatch: Dispatch;
  onGamesList: (games: string[]) => object;
  onClientError?: (error: string) => object;
  onServerError?: (error: string) => object;
  onSuccess?: (message: string) => object;
  onGameUpdate: (game: T) => object;
}
export function connectToServer<T>(options: ServerOptions<T>): string {
  const {
    profile,
    dispatch,
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

  if (!onGameUpdate) {
    throw new Error("onGameUpdate is undefined, but it is required");
  }

  const uuid = profile.id || getOrSetId();
  client = new Client({
    webSocketFactory: () => new SockJS(`${location.origin}/websocket-server`),
    connectHeaders: { uuid },
    onConnect: () => {
      client.subscribe("/topic/rejoin-game", async ({ body }) => {
        await joinGame({ gameCode: body, onGameUpdate, dispatch, profile });
      });

      client.subscribe("/topic/games", ({ body }) => {
        safeDispatch(dispatch, onGamesList, JSON.parse(body) as string[]);
      });

      client.subscribe(`/user/topic/errors/client`, ({ body }) => {
        safeDispatch(dispatch, onClientError, body);
      });

      client.subscribe(`/user/topic/errors/server`, ({ body }) => {
        safeDispatch(dispatch, onServerError, body);
      });

      client.subscribe(`/user/topic/successes`, ({ body }) => {
        safeDispatch(dispatch, onSuccess, body);
      });
    },
  });

  client.activate();
  return uuid;
}

export function createGame(gameCode: string) {
  client.publish({ destination: `/app/games/${gameCode}/create` });
}

interface JoinGameOptions<T> {
  gameCode: string;
  profile: Settings;
  dispatch: Dispatch;
  onGameUpdate: (game: T) => object;
}
export async function joinGame<T>(options: JoinGameOptions<T>) {
  const { profile, gameCode, dispatch, onGameUpdate } = options;

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
    safeDispatch(dispatch, onGameUpdate, response);
  });
}

interface Event {
  route: string;
  data?: any;
}
export function sendEvent(event: Event) {
  const { route, data } = event;

  if (!client) {
    throw new Error("There is no active connection to the server");
  }

  if (!route.startsWith("/")) {
    throw new Error("The route must contain a leading `/`");
  }

  client.publish({ destination: `/app${route}`, body: JSON.stringify(data) });
}

export function updateProfile<S extends Settings>(
  gameCode: string,
  profile: S
) {
  if (!client) {
    // This is normal - this method gets called when creating a profile as well, before we connect to the server
    return;
  }

  client.publish({
    destination: `/app/games/${gameCode}/update`,
    body: JSON.stringify(profile),
  });
}

export function becomeAdmin(gameCode: string) {
  client.publish({ destination: `/app/games/${gameCode}/become-admin` });
}
