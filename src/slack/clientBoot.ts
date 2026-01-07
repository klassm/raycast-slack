import fetch from "node-fetch";
import type { Credentials } from "../types/Credentials";
import { getCachedData } from "../utils/cache";

export interface UsersPrefs {
	mutedChannels: string[];
}

interface UserBootResponse {
	ok: boolean;
	prefs: {
		all_notifications_prefs: string;
	};
}

function isUsersPrefsResponse(value: unknown): value is UserBootResponse {
	const response = value as UserBootResponse;
	return response.ok !== undefined && response.prefs !== undefined;
}

export async function userPrefs({
	cookie,
	token,
}: Credentials): Promise<UsersPrefs> {
	const response = await fetch("https://slack.com/api/client.userBoot", {
		method: "GET",
		headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
	});

	const result = await response.json();
	if (!isUsersPrefsResponse(result)) {
		console.log(
			"Weird team users prefs response from Slack",
			result,
			response.status,
		);
		throw new Error(
			`Got a weird team users prefs response from Slack: ${response.status} ${response.statusText}`,
		);
	}

	const notificationPrefs = JSON.parse(result.prefs.all_notifications_prefs);
	return {
		mutedChannels: Object.entries(notificationPrefs.channels)
			.filter((entry): entry is [string, { muted?: boolean }] => {
				const [, config] = entry;
				return (
					typeof config === "object" &&
					config !== null &&
					"muted" in config &&
					config.muted === true
				);
			})
			.map(([channel]) => channel),
	};
}

export async function getCachedUsersPrefs(
	credentials: Credentials,
	teamId: string,
) {
	const cacheKey = `slack-users-prefs-${teamId}`;
	return getCachedData<UsersPrefs>(
		cacheKey,
		async () => userPrefs(credentials),
		{
			expirationMillis: 1000 * 60 * 60 * 24,
		},
	);
}
