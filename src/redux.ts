import {
  AsyncThunk,
  createAsyncThunk,
  createSlice,
  PayloadAction,
  Reducer,
} from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import * as api from "./api";
import { Game, Player, Settings, State, ThunkApi } from "./types";
import { namespaced } from "./utils";

interface CreateGameSlice<
  S extends Settings = Settings,
  P extends Player<S> = Player<S>,
  G extends Game<P> = Game<P>
> {
  actions: {
    handleRequestException: (message: string) => void;
    handleServerException: (message: string) => void;
    handleSuccess: (message: string) => void;
    handleGamesListMessage: (message: string[]) => void;
    handleGameUpdate: (message: G) => void;
    connectToServer: AsyncThunk<void, void, ThunkApi<G>>;
    saveSettings: AsyncThunk<Partial<S>, Partial<S>, ThunkApi<G>>;
    createGame: AsyncThunk<void, string, ThunkApi<G>>;
    joinGame: AsyncThunk<void, string, ThunkApi<G>>;
    rejoinGame: AsyncThunk<void, string, ThunkApi<G>>;
    becomeAdmin: AsyncThunk<void, void, ThunkApi<G>>;
  };
  createThunk: <I = void, O = void>(
    typePrefix: string,
    payloadCreator: (payload: {
      state: State<G>;
      dispatch: any;
      parameter: I;
    }) => O
  ) => AsyncThunk<O, I, ThunkApi<G>>;
  reducer: Reducer<State<G>>;
}
export function createGamekitSlice<
  S extends Settings = Settings,
  P extends Player<S> = Player<S>,
  G extends Game<P> = Game<P>
>(): CreateGameSlice<S, P, G> {
  function createThunk<P = void, R = void>(
    typePrefix: string,
    payloadCreator: (payload: {
      state: State<G>;
      dispatch: any;
      parameter: P;
    }) => R
  ): AsyncThunk<R, P, ThunkApi<G>> {
    return createAsyncThunk<R, P, ThunkApi<G>>(
      typePrefix,
      (parameter, { getState, dispatch }) =>
        payloadCreator({ parameter, dispatch, state: getState() })
    );
  }

  const connectToServer = createThunk(
    "connectToServer",
    ({ state: { settings }, dispatch }) => {
      const id = api.connectToServer({
        profile: settings,
        dispatch,
        onGamesList: actions.handleGamesListMessage,
        onGameUpdate: actions.handleGameUpdate,
        onClientError: actions.handleRequestException,
        onServerError: actions.handleServerException,
        onSuccess: actions.handleSuccess,
      });

      dispatch(saveSettings({ id } as Partial<S>));
    }
  );

  const saveSettings = createThunk<Partial<S>, Partial<S>>(
    "saveSettings",
    ({
      parameter: settings,
      state: { settings: oldSettings, currentGame },
    }) => {
      api.updateProfile(currentGame.code, { ...oldSettings, ...settings });
      Object.entries(settings).forEach(([k, v]) => {
        localStorage.setItem(k, namespaced`${v.toString()}`);
      });

      return settings;
    }
  );

  const createGame = createThunk<string>(
    "createGame",
    async ({ parameter: code }) => {
      await api.createGame(code);
    }
  );

  const joinGame = createThunk<string>(
    "joinGame",
    async ({ parameter: gameCode, state: { settings }, dispatch }) => {
      await api.joinGame({
        gameCode,
        dispatch,
        profile: settings,
        onGameUpdate: actions.handleGameUpdate,
      });
    }
  );

  const rejoinGame = createThunk<string>(
    "rejoinGame",
    async ({ parameter: gameCode, state: { settings }, dispatch }) => {
      if (!gameCode) return;

      await api.joinGame({
        gameCode,
        dispatch,
        profile: settings,
        onGameUpdate: actions.handleGameUpdate,
      });
    }
  );

  const becomeAdmin = createThunk(
    "becomeAdmin",
    ({ state: { currentGame } }) => {
      api.becomeAdmin(currentGame.code);
    }
  );

  const { actions, reducer } = createSlice({
    name: "gamekit",
    initialState: {
      message: {
        id: "",
        title: "",
        description: "",
        status: "info",
      },
      settings: {
        id: localStorage.getItem(namespaced`id`),
        avatar: localStorage.getItem(namespaced`avatar`),
        name: localStorage.getItem(namespaced`name`),
        connected: false,
      },
      currentGame: {
        code: "",
        isActive: false,
        adminId: "",
        players: [] as P[],
      } as G,
      openGames: [],
    } as State<G>,
    reducers: {
      handleRequestException: (state, action: PayloadAction<string>) => {
        state.message = {
          id: uuidv4(),
          title: "Bad Request",
          description: action.payload,
          status: "error",
        };
      },
      handleServerException: (state, action: PayloadAction<string>) => {
        state.message = {
          id: uuidv4(),
          title: "Server Error",
          description: action.payload,
          status: "error",
        };
      },
      handleSuccess: (state, action: PayloadAction<string>) => {
        state.message = {
          id: uuidv4(),
          title: action.payload,
          description: "",
          status: "success",
        };
      },
      handleGamesListMessage: (state, action: PayloadAction<string[]>) => {
        state.openGames = [...action.payload];
      },
      handleGameUpdate: (state, action: PayloadAction<G>) => {
        // @ts-ignore I promise this is legal, immer doesn't play well with generics
        state.currentGame = action.payload;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(saveSettings.fulfilled, (state, action) => {
          state.settings = {
            ...state.settings,
            ...action.payload,
          };
        })
        .addCase(connectToServer.rejected, (state, action) => {
          console.error(action.error)
        })
        .addCase(saveSettings.rejected, (state, action) => {
          console.error(action.error)
        })
        .addCase(createGame.rejected, (state, action) => {
          console.error(action.error)
        })
        .addCase(joinGame.rejected, (state, action) => {
          console.error(action.error)
        })
        .addCase(rejoinGame.rejected, (state, action) => {
          console.error(action.error)
        })
        .addCase(becomeAdmin.rejected, (state, action) => {
          console.error(action.error)
        });
    },
  });

  return {
    actions: {
      ...actions,
      connectToServer,
      saveSettings,
      createGame,
      joinGame,
      rejoinGame,
      becomeAdmin,
    },
    createThunk,
    reducer,
  };
}
