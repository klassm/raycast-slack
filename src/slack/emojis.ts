import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";
import { getCachedData } from "../utils/cache";
import defaultEmojisJson from "./defaultEmojiList.json";

interface EmojiResponse {
  ok: boolean;
  emoji: Emojis;
}

export interface Emojis {
  [key: string]: string;
}

function defaultEmojis(): Emojis {
  return Object.fromEntries(
    defaultEmojisJson.map((entry) => [
      entry.short_name,
      `https://a.slack-edge.com/production-standard-emoji-assets/14.0/apple-medium/${entry.image}`,
    ])
  );
}

function isEmojiResponse(response: unknown): response is EmojiResponse {
  const casted = response as EmojiResponse;
  return casted.ok && casted.emoji && typeof casted.emoji === "object";
}

export async function loadEmojis({ cookie, token }: Credentials): Promise<Emojis> {
  const url = `https://slack.com/api/emoji.list`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
  });

  const json = await response.json();
  if (!isEmojiResponse(json)) {
    console.log("Got a weird emoji response from Slack", json, response.status);
    throw new Error(`Got a weird emoji response from Slack: ${response.status} ${response.statusText}`);
  }
  const emojis = defaultEmojis();
  return { ...json.emoji, ...emojis };
}

export async function loadEmojisCached(credentials: Credentials, teamId: string): Promise<Emojis> {
  return getCachedData<Emojis>(`slack-emojis-list-${teamId}`, async () => loadEmojis(credentials), {
    expirationMillis: 1000 * 60 * 60 * 24,
  });
}
