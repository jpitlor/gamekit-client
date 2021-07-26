type uuid = string;

interface Profile {
  id: uuid;
  avatar: uuid;
  name: string;
}

interface ServerOptions {
  profile: Profile;
  onGamesList: (games: string[]) => void;
  onClientError: (error: string) => void;
  onServerError: (error: string) => void;
  onSuccess: (message: string) => void;
}

interface Event {
  type: string;
  data: object;
}

export function connectToServer(options: ServerOptions) {}

export function sendEvent(event: Event) {}

export function updateProfile(profile: Profile) {}
