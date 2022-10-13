import { pickBy } from "lodash";
import { Emojis } from "../slack/emojis";

const emojiRegexp = /:([\w_+]+):/g;

export function messageContentToMarkdown(message: string, emojis: Emojis): string {
  const linksReplaced = message.replaceAll(/<(http[^|]+)\|([^>]+)>/g, "[$2]($1)");
  return replaceEmojis(linksReplaced, emojis);
}

export function replaceEmojis(text: string, emojis: Emojis): string {
  const emojiKeys = extractEmojiInText(text);
  const relevantEmojis = pickBy(emojis, (_value, key) => emojiKeys.includes(key));
  return Object.entries(relevantEmojis).reduce(
    (cur, [key, value]) => cur.replaceAll(`:${key}:`, `<img src="${value}" alt="${key}" height="15"/>`),
    text
  );
}

function extractEmojiInText(text: string) {
  const foundEmojis = [];

  const matches = text.matchAll(emojiRegexp);
  for (const match of matches) {
    foundEmojis.push(match[1]);
  }

  return foundEmojis;
}
