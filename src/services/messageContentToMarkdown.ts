import type { Emojis } from "../slack/emojis";
import type { Users } from "../slack/users";

const emojiRegexp = /:([-\w_+]+):/g;
const emojiSuffixRegexp = /(:[-\w_+]+:):[-\w_+]+:/g;
const userIdRegexp = /<@([^>]+)>/g;
const channelsRegexp = /<#([^|]+)\|([^>]+)>/g;

export function messageContentToMarkdown(
	message: string,
	emojis: Emojis,
	users: Users,
	teamId: string,
): string {
	const linksReplaced = message.replaceAll(
		/<(http[^|]+)\|([^>]+)>/g,
		"[$2]($1)",
	);
	const emojisReplaced = replaceEmojis(linksReplaced, emojis);
	const usersReplaced = replaceUsers(emojisReplaced, users, teamId);
	const listReplaces = usersReplaced.replaceAll(/[•◦]/g, "*");
	return replaceChannels(teamId, listReplaces);
}

export function replaceEmojis(text: string, emojis: Emojis): string {
	const cleanedUp = cleanupEmojiText(text);
	return cleanedUp.replaceAll(
		emojiRegexp,
		(_arg, id) => `<img src="${emojis[id]}" alt="${id}" height="17"/>`,
	);
}

export function replaceUsers(
	text: string,
	users: Users,
	teamId: string,
): string {
	return text.replaceAll(userIdRegexp, (_arg, id) => {
		const url = `slack://channel?team=${teamId}&id=${id}`;
		return `[@${users[id].name}](${url})`;
	});
}

export function replaceChannels(teamId: string, text: string): string {
	return text.replaceAll(channelsRegexp, (_arg, id, name) => {
		const url = `slack://channel?team=${teamId}&id=${id}`;
		return `[#${name}](${url})`;
	});
}

function cleanupEmojiText(text: string) {
	return text.replaceAll(emojiSuffixRegexp, "$1");
}

export function extractUserIdsInText(text: string): string[] {
	const foundUserIds = [];

	const matches = text.matchAll(userIdRegexp);
	for (const match of matches) {
		foundUserIds.push(match[1]);
	}

	return foundUserIds;
}
