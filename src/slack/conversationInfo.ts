import { compact } from "lodash";
import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";

interface BaseConversation {
  id: string;
  teamId: string;
}
interface UserConversation extends BaseConversation {
  users: string[];
}
interface ChannelConversation extends BaseConversation {
  name: string;
}
export type Conversation = UserConversation | ChannelConversation;

export function isUserConversation(conversation: Conversation): conversation is UserConversation {
  const casted = conversation as UserConversation;
  return casted.users !== undefined && casted.users.length > 0;
}

interface ConversationInfoResponse {
  ok: boolean;
  channel: {
    id: string;
    members?: string[];
    user?: string;
    name?: string;
    context_team_id: string;
  };
}

function isConversationInfoResponse(response: unknown): response is ConversationInfoResponse {
  const casted = response as ConversationInfoResponse;
  return casted.ok && casted.channel !== undefined;
}

async function loadConversation({ cookie, token }: Credentials, channel: string): Promise<Conversation> {
  const url = `https://slack.com/api/conversations.info?channel=${channel}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
  });

  const json = await response.json();
  if (!isConversationInfoResponse(json)) {
    console.log("Got a weird conversation info response from Slack", json, response.status);
    throw new Error(`Got a weird user response from Slack: ${response.status} ${response.statusText}`);
  }
  return {
    id: json.channel.id,
    users: json.channel.members ?? compact([json.channel.user]),
    name: json.channel.name,
    teamId: json.channel.context_team_id,
  } as Conversation;
}

export async function loadConversationInfos(
  credentials: Credentials,
  conversationIds: string[]
): Promise<Conversation[]> {
  return Promise.all(conversationIds.map(async (userId) => loadConversation(credentials, userId)));
}
