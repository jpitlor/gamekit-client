import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useAvatar(): [string, () => void] {
  const [avatar, setAvatar] = useState(uuidv4());

  function randomizeAvatar() {
    setAvatar(uuidv4());
  }

  return [avatar, randomizeAvatar];
}
