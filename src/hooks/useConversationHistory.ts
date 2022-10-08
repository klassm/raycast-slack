import { compact, uniq } from "lodash";
import { useEffect, useState } from "react";
import { loadConversationHistory, Message } from "../slack/conversationHistory";
import { loadCachedUsers, User } from "../slack/users";
import { Credentials } from "../types/Credentials";
import { TeamInfo } from "../types/TeamInfo";
import { SlackEntryWithUnread } from "./useClientCounts";
import { useConfig } from "./useConfig";

export type MessageWithUser = Omit<Message, "user"> & { user?: User };

async function loadMessages(credentials: Credentials, conversation: SlackEntryWithUnread): Promise<MessageWithUser[]> {
  const messages = await loadConversationHistory(credentials, conversation);
  const relevantMessages = messages.filter((message) => message.type === "message" && message.subtype === undefined);
  const userIds = compact(uniq(relevantMessages.map((message) => message.user)));
  const userCache = await loadCachedUsers(credentials, conversation.teamId, userIds);
  return relevantMessages.map((message) => ({ ...message, user: message.user ? userCache[message.user] : undefined }));
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
      conversation
    )
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { loading, data };
}
