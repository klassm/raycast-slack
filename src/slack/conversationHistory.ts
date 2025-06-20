import fetch from "node-fetch";
import type { SlackEntryWithUnread } from "../hooks/useClientCounts";
import type { Credentials } from "../types/Credentials";

export interface Message {
	user?: string;
	username?: string;
	text: string;
	ts: string;
	subtype?: "channel_leave" | "channel_join" | "bot_message";
	type: string;
	files?: {
		thumb_360: string;
		title: string;
	}[];
	attachments?: {
		fallback: string;
	}[];
}

interface ConversationInfoResponse {
	ok: boolean;
	messages: Message[];
}

function isConversationHistoryResponse(
	response: unknown,
): response is ConversationInfoResponse {
	const casted = response as ConversationInfoResponse;
	return casted.ok && Array.isArray(casted.messages);
}

export async function loadConversationHistory(
	{ cookie, token }: Credentials,
	{ id, lastRead }: SlackEntryWithUnread,
): Promise<Message[]> {
	const conversationQueryParams: Record<string, string> =
		lastRead === "0000000000.000000"
			? {}
			: {
					oldest: `${lastRead}`,
					inclusive: "false",
				};
	const queryParams = {
		...conversationQueryParams,
		limit: "20",
		channel: id,
	} as const;
	const urlSearchParams = new URLSearchParams(queryParams);

	const url = `https://slack.com/api/conversations.history?${urlSearchParams.toString()}`;
	const response = await fetch(url, {
		method: "GET",
		headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
	});

	const json = await response.json();
	if (!isConversationHistoryResponse(json)) {
		console.log(
			"Got a weird conversation history response from Slack",
			json,
			response.status,
		);
		throw new Error(
			`Got a weird conversation history response from Slack: ${response.status} ${response.statusText}`,
		);
	}
	return json.messages;
}
