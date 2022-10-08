import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";
import { getCachedData } from "../utils/cache";

export interface UsersPrefs {
  mutedChannels: string[];
}

interface UsersPrefsResponse {
  ok: boolean;
  prefs: {
    muted_channels: string;
  };
}

function isUsersPrefsResponse(value: unknown): value is UsersPrefsResponse {
  const response = value as UsersPrefsResponse;
  return response.ok !== undefined && response.prefs !== undefined;
}

export async function userPrefs({ cookie, token }: Credentials): Promise<UsersPrefs> {
  const response = await fetch("https://slack.com/api/users.prefs.get", {
    method: "GET",
    headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
  });

  const result = await response.json();
  if (!isUsersPrefsResponse(result)) {
    console.log("Weird team users prefs response from Slack", result, response.status);
    throw new Error(`Got a weird team users prefs response from Slack: ${response.status} ${response.statusText}`);
  }

  return {
    mutedChannels: result.prefs.muted_channels.split(","),
  };
}

export async function getCachedUsersPrefs(credentials: Credentials, teamId: string) {
  const cacheKey = `slack-users-prefs-${teamId}`;
  return getCachedData<UsersPrefs>(cacheKey, async () => userPrefs(credentials), {
    expirationMillis: 1000 * 60 * 60 * 24,
  });
}
