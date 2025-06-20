import fetch from "node-fetch";
import type { Credentials } from "../types/Credentials";
import { getCachedData } from "../utils/cache";

export interface Identity {
	name: string;
	nameNormalized: string;
}

interface IdentityResponse {
	ok: boolean;
	profile: {
		real_name: string;
		real_name_normalized: string;
	};
}

function isIdentityResponse(response: unknown): response is IdentityResponse {
	const casted = response as IdentityResponse;
	return casted.ok && casted.profile?.real_name_normalized !== undefined;
}

async function loadIdentity({ cookie, token }: Credentials): Promise<Identity> {
	const url = "https://slack.com/api/users.profile.get";
	const response = await fetch(url, {
		method: "GET",
		headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
	});

	const json = await response.json();
	if (!isIdentityResponse(json)) {
		console.log(
			"Got a weird identity response from Slack",
			json,
			response.status,
		);
		throw new Error(
			`Got a weird identity response from Slack: ${response.status} ${response.statusText}`,
		);
	}
	return {
		name: json.profile.real_name,
		nameNormalized: json.profile.real_name_normalized,
	};
}

export async function loadIdentityCached(
	credentials: Credentials,
	teamId: string,
): Promise<Identity> {
	return getCachedData<Identity>(
		`slack-identity-${teamId}`,
		async () => loadIdentity(credentials),
		{
			expirationMillis: 1000 * 60 * 60 * 24 * 10,
		},
	);
}
