import fetch from "node-fetch";
import type { Credentials } from "../types/Credentials";

export interface UnreadEntry {
	id: string;
	lastRead: string;
	updated: string;
	latest: string;
	mentions: number;
	hasUnread: boolean;
}

export interface ClientCount {
	channels: UnreadEntry[];
	mpims: UnreadEntry[];
	ims: UnreadEntry[];
}

interface UnreadResponseEntry {
	id: string;
	last_read: string;
	latest: string;
	updated: string;
	mention_count: number;
	has_unreads: boolean;
}

interface ClientCountResponse {
	ok: boolean;
	threads: {
		has_unreads: boolean;
		metion_count: number;
	};
	channels: UnreadResponseEntry[];
	mpims: UnreadResponseEntry[];
	ims: UnreadResponseEntry[];
}

function isClientCountsResponse(
	response: unknown,
): response is ClientCountResponse {
	const casted = response as ClientCountResponse;
	return (
		casted.ok &&
		casted.threads &&
		Array.isArray(casted.channels) &&
		Array.isArray(casted.mpims) &&
		Array.isArray(casted.ims)
	);
}

function mapEntry(entry: UnreadResponseEntry): UnreadEntry {
	return {
		hasUnread: entry.has_unreads,
		lastRead: entry.last_read,
		latest: entry.latest,
		updated: entry.updated,
		mentions: entry.mention_count,
		id: entry.id,
	};
}

export async function clientCounts({
	cookie,
	token,
}: Credentials): Promise<ClientCount> {
	const url = "https://slack.com/api/client.counts";
	const response = await fetch(url, {
		method: "GET",
		headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
	});

	const json = await response.json();
	if (!isClientCountsResponse(json)) {
		console.log(
			"Got a weird client counts response from Slack",
			json,
			response.status,
		);
		throw new Error(
			`Got a weird client counts response from Slack: ${response.status} ${response.statusText}`,
		);
	}

	return {
		ims: json.ims.map(mapEntry),
		mpims: json.mpims.map(mapEntry),
		channels: json.channels.map(mapEntry),
	};
}
