import { compact, uniq } from "lodash";
import { useEffect, useState } from "react";
import { extractUserIdsInText, messageContentToMarkdown } from "../services/messageContentToMarkdown";
import { loadConversationHistory, Message } from "../slack/conversationHistory";
import { loadEmojisCached } from "../slack/emojis";
import { loadCachedUsers, User } from "../slack/users";
import { Credentials } from "../types/Credentials";
import { TeamInfo } from "../types/TeamInfo";
import { SlackEntryWithUnread } from "./useClientCounts";
import { useConfig } from "./useConfig";

const blockedSubtypes = ["channel_leave", "channel_join"];
export type MessageWithUser = Omit<Message, "user"> & { user?: User };

async function loadMessages(
  credentials: Credentials,
  teamId: string,
  conversation: SlackEntryWithUnread
): Promise<MessageWithUser[]> {
  const [messages, emojis] = await Promise.all([
    loadConversationHistory(credentials, conversation),
    loadEmojisCached(credentials, teamId),
  ]);
  const relevantMessages = messages.filter(
    (message) =>
      message.type === "message" && (message.subtype === undefined || !blockedSubtypes.includes(message.subtype))
  );

  const messageUserIds = messages.flatMap((message) => extractUserIdsInText(message.text));
  const userIds = compact(uniq(relevantMessages.map((message) => message.user)));

  const users = await loadCachedUsers(credentials, conversation.teamId, [...userIds, ...messageUserIds]);
  return relevantMessages.map((message) => ({
    ...message,
    text: messageContentToMarkdown(message.text, emojis, users),
    user: message.user ? users[message.user] : undefined,
  }));
}

export function useConversationHistory(team: TeamInfo, conversation: SlackEntryWithUnread) {
  const [loading, setLoading] = useState(false);
  const {
    config: { cookie },
  } = useConfig();
  const [data, setData] = useState<MessageWithUser[]>([]);

  useEffect(() => {
    setLoading(true);
    loadMessages(
      {
        token: team.token,
        cookie,
      },
      team.id,
      conversation
    )
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { loading, data };
}
