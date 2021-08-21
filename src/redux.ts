import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import * as api from "./api";
import { Game, Settings, State } from "./types";
import { namespaced } from "./utils";

interface ThunkApi {
  state: State;
}

const connectToServer = createAsyncThunk<void, void, ThunkApi>(
  "connectToServer",
  (_, { getState, dispatch }) => {
    const { settings } = getState();
    api.connectToServer({
      profile: settings,
      dispatch,
      onGamesList: actions.handleGamesListMessage,
      onGameUpdate: actions.handleGameUpdate,
      onClientError: actions.handleRequestException,
      onServerError: actions.handleServerException,
      onSuccess: actions.handleSuccess,
    });
  }
);

const saveSettings = createAsyncThunk<
  Partial<Settings>,
  Partial<Settings>,
  ThunkApi
>("saveSettings", (settings, { getState }) => {
  const {
    currentGame: { code },
    settings: oldSettings,
  } = getState();

  api.updateProfile(code, { ...oldSettings, ...settings });
  Object.entries(settings).forEach(([k, v]) => {
    localStorage.setItem(k, namespaced`${v.toString()}`);
  });

  return settings;
});

const createGame = createAsyncThunk<void, string>(
  "createGame",
  async (code) => {
    await api.createGame(code);
  }
);

const joinGame = createAsyncThunk<void, string, ThunkApi>(
  "joinGame",
  async (gameCode, { getState, dispatch }) => {
    const { settings } = getState();
    await api.joinGame({
      gameCode,
      dispatch,
      profile: settings,
      onGameUpdate: actions.handleGameUpdate,
    });
  }
);

const rejoinGame = createAsyncThunk<void, string, ThunkApi>(
  "rejoinGame",
  async (gameCode, { dispatch, getState }) => {
    if (!gameCode) return;

    const { settings } = getState();
    await api.joinGame({
      gameCode,
      dispatch,
      profile: settings,
      onGameUpdate: actions.handleGameUpdate,
    });
  }
);

const becomeAdmin = createAsyncThunk<void, void, ThunkApi>(
  "becomeAdmin",
  (_, { getState }) => {
    const { currentGame } = getState();
    api.becomeAdmin(currentGame.code);
  }
);

const { actions: syncActions, reducer } = createSlice({
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
      active: false,
      admin: "",
    },
    openGames: [],
  } as State,
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
    handleGameUpdate: (state, action: PayloadAction<Game>) => {
      state.currentGame = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(saveSettings.fulfilled, (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    });
  },
});

export const actions = {
  ...syncActions,
  connectToServer,
  saveSettings,
  createGame,
  joinGame,
  rejoinGame,
  becomeAdmin,
};
export { reducer };
