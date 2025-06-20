import { compact, sortBy, uniq } from "lodash";
import { useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";
import { cachedConversations } from "../services/conversationCache";
import { clientCounts, type UnreadEntry } from "../slack/clientCounts";
import { loadConversationHistory } from "../slack/conversationHistory";
import { isUserConversation } from "../slack/conversationInfo";
import { conversationMark } from "../slack/conversationMark";
import { loadIdentityCached } from "../slack/identity";
import { loadCachedUsers } from "../slack/users";
import { getCachedUsersPrefs } from "../slack/usersPrefs";
import type { Credentials } from "../types/Credentials";
import type { SlackEntry } from "../types/SlackEntry";
import { userConversationToSlackEntry } from "../utils/userConversationToSlackEntry";
import { useConfig } from "./useConfig";
import { useTeams } from "./useTeams";

export type SlackEntryWithUnread = SlackEntry & UnreadEntry;

async function toSlackEntry(
	unreadEntries: UnreadEntry[],
	credentials: Credentials,
	teamId: string,
): Promise<SlackEntryWithUnread[]> {
	const conversations = await cachedConversations(
		unreadEntries.map((im) => im.id),
		credentials,
		teamId,
	);
	const identity = await loadIdentityCached(credentials, teamId);
	const userIds = uniq(
		Object.values(conversations)
			.filter(isUserConversation)
			.flatMap((conversation) => conversation.users),
	);
	const userCache = await loadCachedUsers(credentials, teamId, userIds);

	return unreadEntries.map((unreadEntry): SlackEntryWithUnread => {
		const conversation = conversations[unreadEntry.id];

		if (isUserConversation(conversation)) {
			const users = compact(conversation.users.map((id) => userCache[id]));
			return {
				...unreadEntry,
				...userConversationToSlackEntry({
					id: unreadEntry.id,
					users: users,
					identity,
					teamId,
				}),
			};
		}
		return {
			...unreadEntry,
			name: conversation.name,
			teamId,
			type: "channel",
		};
	});
}

async function loadData(
	credentials: Credentials,
	teamId: string,
): Promise<SlackEntryWithUnread[]> {
	const [counts, usersPrefs] = await Promise.all([
		clientCounts(credentials),
		getCachedUsersPrefs(credentials, teamId),
	]);
	const unreadEntries = [...counts.ims, ...counts.mpims, ...counts.channels]
		.filter((it) => it.hasUnread)
		.filter((it) => !usersPrefs.mutedChannels.includes(it.id));
	const slackEntries = await toSlackEntry(unreadEntries, credentials, teamId);
	return sortBy(slackEntries, (entry) => [
		entry.mentions,
		entry.latest,
	]).reverse();
}

export function useClientCounts() {
	const [loading, setLoading] = useState(false);
	const { teams, loading: teamLoading } = useTeams();

	const {
		config: { cookie },
	} = useConfig();
	const [data, setData] = useState<SlackEntryWithUnread[]>([]);

	const markRead = async (conversation: SlackEntryWithUnread) => {
		const token = teams.find((team) => conversation.teamId === team.id)?.token;
		if (!token) {
			return;
		}

		setLoading(true);
		try {
			const credentials = { cookie, token };
			const messages = await loadConversationHistory(credentials, conversation);
			const message = messages[0];
			if (!message) {
				return;
			}

			await conversationMark(credentials, conversation.id, message.ts);
			await update();
		} finally {
			setLoading(false);
		}
	};

	const update = async () => {
		try {
			setLoading(true);
			const teamData = await Promise.all(
				teams.map((team) => {
					return loadData({ cookie, token: team.token }, team.id);
				}),
			);
			setData(teamData.flat());
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => void update(), [teams]);
	useInterval(() => void update(), 20000);

	return { loading: loading || teamLoading, data, markRead };
}
