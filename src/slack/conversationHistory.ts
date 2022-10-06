import fetch from "node-fetch";
import { Credentials } from "../types/Credentials";

export interface Message {
  user?: string;
  username?: string;
  text: string;
  ts: string;
  files?: {
    thumb_tiny: string;
  }[];
  attachments?: {
    fallback: string
  }[]
}

interface ConversationInfoResponse {
  ok: boolean;
  messages: Message[]
}

function isConversationHistoryResponse(response: unknown): response is ConversationInfoResponse {
  const casted = response as ConversationInfoResponse;
  return casted.ok && Array.isArray(casted.messages);
}

export async function loadConversationHistory({
                                         cookie,
                                         token
                                       }: Credentials, conversation: string, latest: string): Promise<Message[]> {
  const url = `https://slack.com/api/conversations.history?channel=${ conversation }&oldest=${ latest }&limit=5&inclusive=true`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Cookie: cookie, Authorization: `Bearer ${ token }` },
  });

  const json = await response.json();
  if (!isConversationHistoryResponse(json)) {
    console.log("Got a weird conversation history response from Slack", json, response.status);
    throw new Error(`Got a weird conversation history response from Slack: ${ response.status } ${ response.statusText }`);
  }
  return json.messages;
}
