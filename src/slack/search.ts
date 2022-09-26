import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";
import { SlackEntry } from "../types/SlackEntry";

interface ChannelResponseEntry {
  id: string;
  context_team_id: string;
  is_archived: boolean;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  name: string;
  name_normalized: string;
}

interface UserResponseEntry {
  id: string;
  team_id: string;
  deleted: boolean;
  profile: {
    title?: string;
    email?: string;
    image_original: string;
    real_name: string;
  };
}

interface SearchResponse<T> {
  ok: boolean;
  results: T[];
}

function isChannelResponseEntry(value: unknown): value is ChannelResponseEntry {
  const entry = value as ChannelResponseEntry;
  return entry.id !== undefined && entry.name !== undefined && entry.context_team_id !== undefined;
}

function isUserResponseEntry(value: unknown): value is UserResponseEntry {
  const entry = value as UserResponseEntry;
  return entry.id !== undefined && entry.profile.real_name !== undefined && entry.team_id !== undefined;
}

function isSearchResponse<T>(value: unknown, entryVerifier: (entry: unknown) => boolean): value is SearchResponse<T> {
  const response = value as SearchResponse<T>;
  return response.ok !== undefined && Array.isArray(response.results) && response.results.every(entryVerifier);
}

async function searchChannels({ cookie, token }: Credentials, query: string): Promise<SlackEntry[]> {
  const response = await fetch("https://edgeapi.slack.com/cache/T0ATUH6S1/channels/search", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      query,
      fuzz: 1,
      count: 30,
    }),
  });
  const result = await response.json();
  if (!isSearchResponse<ChannelResponseEntry>(result, isChannelResponseEntry)) {
    console.log("Weird response from Slack", result);
    throw new Error("Got a weird response from Slack");
  }

  return result.results
    .filter((result) => !result.is_archived)
    .map(
      (result) =>
        ({
          name: result.name,
          id: result.id,
          teamId: result.context_team_id,
          type: "channel",
        } as const)
    );
}

async function searchUsers({ cookie, token }: Credentials, query: string): Promise<SlackEntry[]> {
  const response = await fetch("https://edgeapi.slack.com/cache/T0ATUH6S1/users/search", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      query,
      fuzz: 1,
      include_profile_only_users: true,
      search_email: true,
      count: 30,
    }),
  });
  const result = await response.json();
  if (!isSearchResponse<UserResponseEntry>(result, isUserResponseEntry)) {
    console.log("Weird response from Slack", result);
    throw new Error("Got a weird response from Slack");
  }

  return result.results
    .filter((result) => !result.deleted)
    .map(
      (result) =>
        ({
          name: result.profile.real_name,
          id: result.id,
          teamId: result.team_id,
          icon: result.profile.image_original,
          email: result.profile.email,
          title: result.profile.title,
          type: "user",
        } as const)
    );
}

export async function search(credentials: Credentials, query: string): Promise<SlackEntry[]> {
  const results = await Promise.all([searchUsers(credentials, query), searchChannels(credentials, query)]);
  return results.flat();
}
