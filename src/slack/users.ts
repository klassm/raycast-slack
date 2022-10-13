import { compact, keyBy, pickBy } from "lodash";
import fetch from "node-fetch";
import replaceSpecialCharacters from "replace-special-characters";
import { Credentials } from "../types/Credentials";
import { getCachedData, updateCache } from "../utils/cache";

export interface User {
  id: string;
  name: string;
  keywords: string[];
  email?: string;
}

interface UserResponse {
  ok: boolean;
  user: {
    id: string;
    profile: {
      real_name: string;
      real_name_normalized: string;
      email: string;
    };
  };
}

export interface Users {
  [userId: string]: User;
}

function isUserResponse(response: unknown): response is UserResponse {
  const casted = response as UserResponse;
  return casted.ok && casted?.user.id !== undefined && casted.user?.profile?.real_name_normalized !== undefined;
}

async function loadUser({ cookie, token }: Credentials, userId: string | undefined): Promise<User> {
  const queryString = userId === undefined ? "" : `?user=${userId}`;
  const url = `https://slack.com/api/users.info${queryString}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
  });

  const json = await response.json();
  if (!isUserResponse(json)) {
    console.log("Got a weird user response from Slack", json, response.status);
    throw new Error(`Got a weird user response from Slack: ${response.status} ${response.statusText}`);
  }
  return {
    id: json.user.id,
    name: json.user.profile.real_name,
    keywords: replaceSpecialCharacters(json.user.profile.real_name_normalized).toLowerCase().split(/[ -/]/),
    email: json.user.profile.email,
  };
}

export async function loadUsers(credentials: Credentials, userIds: string[]): Promise<User[]> {
  return Promise.all(userIds.map(async (userId) => loadUser(credentials, userId)));
}

export async function loadCachedUsers(credentials: Credentials, teamId: string, userIds: string[]): Promise<Users> {
  const cacheKey = `slack-users-${teamId}`;
  const cached = await getCachedData<Users>(cacheKey, async () => ({}), {
    expirationMillis: 1000 * 60 * 60 * 24 * 10,
  });

  const foundUsers = pickBy(cached, (value) => userIds.includes(value.id));

  const missingUsers = compact(userIds.filter((id) => cached[id] === undefined));
  if (missingUsers.length === 0) {
    return foundUsers;
  }

  const newlyLoadedUsers = await loadUsers(credentials, missingUsers);
  const indexedUsers = keyBy(newlyLoadedUsers, (user) => user.id);

  updateCache(cacheKey, { ...cached, ...indexedUsers });

  return { ...foundUsers, ...indexedUsers };
}
