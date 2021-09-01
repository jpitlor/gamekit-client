import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Use this hook when you want to let the user pick a new random avatar.
 * It is a light wrapper around `useState` that is included to abstract away
 * the need to install `uuid` in the consuming application.
 *
 * @return {string, () => void} [UUID, function to refresh the UUID]
 */
export function useAvatar(): [string, () => void] {
  const [avatar, setAvatar] = useState(uuidv4());

  function randomizeAvatar() {
    setAvatar(uuidv4());
  }

  return [avatar, randomizeAvatar];
}
