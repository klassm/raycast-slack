import fetch from "node-fetch";
import type { Credentials } from "../types/Credentials";

interface ConversationMarkResponse {
	ok: boolean;
}

function isConversationMarkResponse(
	response: unknown,
): response is ConversationMarkResponse {
	const casted = response as ConversationMarkResponse;
	return casted.ok;
}

export async function conversationMark(
	{ cookie, token }: Credentials,
	id: string,
	timestamp: string,
): Promise<void> {
	const url = `https://slack.com/api/conversations.mark?channel=${id}&ts=${timestamp}`;
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Cookie: cookie,
			Authorization: `Bearer ${token}`,
			"Content-Type": "multipart/form-data",
		},
	});

	const json = await response.json();
	if (!isConversationMarkResponse(json)) {
		console.log(
			"Got a weird conversation mark response from Slack",
			json,
			response.status,
		);
		throw new Error(
			`Got a weird conversation mark response from Slack: ${response.status} ${response.statusText}`,
		);
	}
}
