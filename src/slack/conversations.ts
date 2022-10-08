import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";

interface ConversationResponse {
  ok: boolean;
  channels: ConversationChannel[];
  response_metadata: {
    next_cursor?: string;
  };
}

export interface ConversationChannel {
  context_team_id: string;
  id: string;
  members: string[];
}

function isConversationResponse(response: unknown): response is ConversationResponse {
  const casted = response as ConversationResponse;
  return casted.ok && Array.isArray(casted.channels);
}

async function loadPaged({ cookie, token }: Credentials, cursor?: string): Promise<ConversationChannel[]> {
  const response = await fetch(
    `https://slack.com/api/conversations.list?exclude_archived=true&limit=1000&types=mpim&cursor=${cursor ?? ""}`,
    {
      method: "GET",
      headers: { Cookie: cookie, Authorization: `Bearer ${token}` },
    }
  );

  const json = await response.json();
  if (!isConversationResponse(json)) {
    console.log("Got a weird conversation response from Slack", json, response.status);
    throw new Error(`Got a weird conversation response from Slack: ${response.status} ${response.statusText}`);
  }

  const nextCursor = json.response_metadata.next_cursor;
  const pageData = nextCursor ? await loadPaged({ cookie, token }, nextCursor) : [];
  return [...json.channels, ...pageData];
}

export async function loadConversations(credentials: Credentials): Promise<ConversationChannel[]> {
  return loadPaged(credentials);
}
