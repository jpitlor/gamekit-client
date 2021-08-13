import { createAvatar } from "@dicebear/avatars";
import * as sprites from "@dicebear/avatars-human-sprites";
import { colors, animals, uniqueNamesGenerator } from "unique-names-generator";

export function asImage(avatar: string): string {
  return createAvatar(sprites, {
    seed: avatar,
    width: 150,
    height: 150,
    margin: 15,
    dataUri: true,
  });
}

export function getRandomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    length: 2,
    separator: " ",
    style: "capital",
  });
}
